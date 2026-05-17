"""
AI_XS_Vocab 自包含部署脚本（不依赖其他项目）。

能力：
1. 前端：构建 + 上传 dist 到宝塔站点目录
2. 后端：打包 backend 代码 + 上传到 api 目录
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import shlex
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Callable

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

DEFAULT_LOCAL_DIST_PATH = FRONTEND_DIR / "dist"
DEFAULT_LOCAL_API_PATH = BACKEND_DIR
DEFAULT_SERVER_HOST = "175.178.27.89"
DEFAULT_SERVER_PORT = 22
DEFAULT_SERVER_ROOT = "/www/wwwroot/dc.momofx.cn"
DEFAULT_SSH_KEY = str(Path.home() / ".ssh" / "id_rsa")
DEFAULT_FRONTEND_HEALTHCHECK_HOST = "dc.momofx.cn"
DEFAULT_BACKEND_SUPERVISOR_PROGRAM = "ai_xs_backend"
DEFAULT_BACKEND_HEALTHCHECK_URL = "http://127.0.0.1:8000/api/health"
DEFAULT_DB_NAME = "ai_xs"
DEFAULT_DB_LOCAL_HOST = "127.0.0.1"
DEFAULT_DB_LOCAL_PORT = "3306"
DEFAULT_DB_REMOTE_HOST = "127.0.0.1"
DEFAULT_DB_REMOTE_PORT = "3306"
DEFAULT_DB_MIGRATIONS_PATH = BACKEND_DIR / "alembic" / "versions"
CHECK_INTERVAL = 5
DEPLOY_CACHE_FILE = str(SCRIPT_DIR / ".deploy-cache.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(SCRIPT_DIR / "deploy.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("deploy")


def _file_sha256(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _load_deploy_cache() -> dict:
    cache_file = Path(DEPLOY_CACHE_FILE)
    if not cache_file.exists():
        return {}
    try:
        return json.loads(cache_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        logger.warning("部署缓存读取失败，将按首次部署处理: %s", cache_file)
        return {}


def _save_deploy_cache(cache: dict) -> None:
    cache_file = Path(DEPLOY_CACHE_FILE)
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    cache_file.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def _build_manifest(root: Path, should_skip: Callable[[Path], bool] | None = None) -> dict[str, str]:
    manifest: dict[str, str] = {}
    if not root.exists():
        return manifest
    for file in sorted(root.rglob("*")):
        if not file.is_file():
            continue
        rel = file.relative_to(root)
        if should_skip and should_skip(rel):
            continue
        manifest[rel.as_posix()] = _file_sha256(file)
    return manifest


def _summarize_manifest_changes(previous: dict[str, str], current: dict[str, str]) -> dict[str, list[str]]:
    changed = sorted(path for path, file_hash in current.items() if previous.get(path) != file_hash)
    unchanged = sorted(path for path, file_hash in current.items() if previous.get(path) == file_hash)
    removed = sorted(path for path in previous if path not in current)
    return {
        "changed": changed,
        "unchanged": unchanged,
        "removed": removed,
    }


def _format_file_list(files: list[str]) -> str:
    return "无" if not files else ", ".join(files)


def _format_deploy_summary(
    target_name: str,
    upload_mode: str,
    changed_files: list[str],
    unchanged_files: list[str],
    removed_files: list[str],
) -> str:
    mode_line = (
        "当前上传方式：真正采用 rsync 增量上传。"
        if upload_mode == "incremental"
        else "当前上传方式：全量压缩包覆盖部署，不是真正按文件增量上传。"
    )
    lines = [
        f"{target_name}部署摘要：",
        mode_line,
        f"本次检测到新增/变更 {len(changed_files)} 个文件，保持不变 {len(unchanged_files)} 个文件，本地已删除 {len(removed_files)} 个文件。",
        f"已上传文件：{_format_file_list(changed_files)}",
        f"保持不变文件：{_format_file_list(unchanged_files)}",
        f"本地已删除文件：{_format_file_list(removed_files)}",
    ]
    if upload_mode != "incremental":
        lines.append("说明：这些“保持不变”的文件是按差异口径识别出的未变化文件，但当前脚本仍会通过整包上传后覆盖部署。")
    return "\n".join(lines)


def _parse_rsync_itemize_output(output: str) -> dict[str, list[str]]:
    uploaded: list[str] = []
    deleted: list[str] = []
    for raw_line in output.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("*deleting"):
            parts = line.split(None, 1)
            if len(parts) == 2 and parts[1]:
                deleted.append(parts[1].strip())
            continue
        if len(line) < 12:
            continue
        marker = line[0]
        path = line[12:].strip()
        if marker in {"<", ">"} and path and path != "./":
            uploaded.append(path.rstrip("/"))
    return {
        "uploaded": sorted(set(uploaded)),
        "deleted": sorted(set(deleted)),
    }


def _build_deploy_summary(
    manifest_summary: dict[str, list[str]],
    rsync_summary: dict[str, list[str]] | None = None,
) -> dict[str, list[str]]:
    if not rsync_summary:
        return manifest_summary
    uploaded = rsync_summary.get("uploaded", [])
    deleted = rsync_summary.get("deleted", [])
    unchanged = sorted(
        path
        for path in manifest_summary.get("unchanged", [])
        if path not in uploaded and path not in deleted
    )
    return {
        "changed": uploaded,
        "unchanged": unchanged,
        "removed": deleted,
    }


def _log_and_persist_deploy_summary(
    cache_key: str,
    target_name: str,
    root: Path,
    should_skip: Callable[[Path], bool] | None = None,
    dry_run: bool = False,
    rsync_output: str = "",
) -> None:
    current_manifest = _build_manifest(root, should_skip=should_skip)
    cache = _load_deploy_cache()
    previous_manifest = cache.get(cache_key, {})
    manifest_summary = _summarize_manifest_changes(previous_manifest, current_manifest)
    summary = _build_deploy_summary(manifest_summary, _parse_rsync_itemize_output(rsync_output) if rsync_output else None)
    logger.info(
        "\n%s",
        _format_deploy_summary(
            target_name=target_name,
            upload_mode="incremental",
            changed_files=summary["changed"],
            unchanged_files=summary["unchanged"],
            removed_files=summary["removed"],
        ),
    )
    if not dry_run:
        cache[cache_key] = current_manifest
        _save_deploy_cache(cache)


def _resolve_command(cmd: list[str]) -> list[str]:
    if not cmd:
        return cmd

    executable = cmd[0]
    resolved = shutil.which(executable)
    if resolved:
        return [resolved, *cmd[1:]]

    if os.name == "nt" and "." not in Path(executable).name:
        for suffix in (".cmd", ".bat", ".exe"):
            resolved = shutil.which(f"{executable}{suffix}")
            if resolved:
                return [resolved, *cmd[1:]]

    return cmd


def _run(cmd: list[str], cwd: Path | None = None, dry_run: bool = False) -> subprocess.CompletedProcess[str] | None:
    resolved_cmd = _resolve_command(cmd)
    cmd_str = " ".join(shlex.quote(p) for p in resolved_cmd)
    if dry_run:
        logger.info("[DRY RUN] %s", cmd_str)
        return None
    logger.info("$ %s", cmd_str)
    result = subprocess.run(
        resolved_cmd,
        cwd=str(cwd) if cwd else None,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.stdout:
        logger.info(result.stdout.rstrip())
    if result.stderr:
        logger.warning(result.stderr.rstrip())
    if result.returncode != 0:
        details = (result.stderr or result.stdout or "").strip()
        if details:
            raise RuntimeError(f"命令失败({result.returncode}): {cmd_str}\n{details}")
        raise RuntimeError(f"命令失败({result.returncode}): {cmd_str}")
    return result


def _to_rsync_local_path(path: Path) -> str:
    resolved = path.resolve()
    rsync_path = resolved.as_posix()
    drive = resolved.drive.rstrip(":")
    if drive:
        suffix = rsync_path[len(f"{drive}:") :]
        rsync_path = f"/cygdrive/{drive.lower()}{suffix}"
    return rsync_path if rsync_path.endswith("/") else f"{rsync_path}/"


def _to_rsync_ssh_path(path_str: str) -> str:
    path = Path(path_str)
    as_posix = path.as_posix()
    drive = path.drive.rstrip(":")
    if drive:
        suffix = as_posix[len(f"{drive}:") :]
        return f"/cygdrive/{drive.lower()}{suffix}"
    return as_posix


def _resolve_rsync_ssh_executable() -> str:
    cw_ssh = Path(r"C:\ProgramData\chocolatey\lib\rsync\tools\bin\ssh.exe")
    if cw_ssh.exists():
        return cw_ssh.as_posix()
    resolved = shutil.which("ssh")
    return Path(resolved).as_posix() if resolved else "ssh"


def _build_rsync_command(
    cfg: dict,
    source: Path,
    destination: str,
    excludes: list[str],
    chmod_mode: str = "",
    delete: bool = True,
) -> list[str]:
    ssh_executable = _resolve_rsync_ssh_executable()
    ssh_cmd = " ".join(
        shlex.quote(part)
        for part in [
            ssh_executable,
            "-F",
            "/dev/null",
            "-i",
            _to_rsync_ssh_path(cfg["ssh_key_path"]),
            "-o",
            f"StrictHostKeyChecking={cfg['strict_host_key_checking']}",
            "-p",
            str(cfg["server_port"]),
        ]
    )
    command = [
        "rsync",
        "--archive",
        "--compress",
        "--itemize-changes",
        "--no-owner",
        "--no-group",
        "--no-perms",
        "-e",
        ssh_cmd,
    ]
    if delete:
        command.append("--delete")
    if chmod_mode:
        command.append(f"--chmod={chmod_mode}")
    command.extend(f"--exclude={pattern}" for pattern in excludes)
    command.append(_to_rsync_local_path(source))
    command.append(f"{cfg['server_user']}@{cfg['server_host']}:{destination.rstrip('/')}/")
    return command


def _env(*names: str, default: str = "") -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return default


def build_backend_restart_command(cfg: dict) -> str:
    supervisor_program = cfg.get("backend_supervisor_program") or DEFAULT_BACKEND_SUPERVISOR_PROGRAM
    healthcheck_url = cfg.get("backend_healthcheck_url") or DEFAULT_BACKEND_HEALTHCHECK_URL
    backend_api_path = cfg.get("server_api_path") or f"{cfg.get('server_root') or DEFAULT_SERVER_ROOT}/api"
    return (
        f"cd {shlex.quote(backend_api_path)} && ./.venv/bin/python -m alembic upgrade head; "
        f"/www/server/panel/pyenv/bin/supervisorctl -c /etc/supervisor/supervisord.conf restart {shlex.quote(supervisor_program)}; "
        f"curl -fsS --max-time 15 {shlex.quote(healthcheck_url)}"
    )


def build_frontend_healthcheck_command(cfg: dict) -> str:
    host = cfg.get("frontend_healthcheck_host") or DEFAULT_FRONTEND_HEALTHCHECK_HOST
    return (
        "STATUS=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1/ "
        f"-H {shlex.quote(f'Host: {host}')}); "
        'test "$STATUS" = "200"'
    )


def _normalize(config: dict) -> dict:
    cfg = dict(config)
    root = cfg.get("server_root") or DEFAULT_SERVER_ROOT
    cfg["server_host"] = cfg.get("server_host") or DEFAULT_SERVER_HOST
    cfg["server_user"] = cfg.get("server_user") or "root"
    cfg["server_port"] = int(cfg.get("server_port") or DEFAULT_SERVER_PORT)
    cfg["server_root"] = root
    cfg["server_frontend_path"] = cfg.get("server_frontend_path") or root
    cfg["server_api_path"] = cfg.get("server_api_path") or f"{root}/api"
    cfg["ssh_key_path"] = cfg.get("ssh_key_path") or DEFAULT_SSH_KEY
    cfg["local_dist_path"] = cfg.get("local_dist_path") or str(DEFAULT_LOCAL_DIST_PATH)
    cfg["local_api_path"] = cfg.get("local_api_path") or str(DEFAULT_LOCAL_API_PATH)
    cfg["strict_host_key_checking"] = cfg.get("strict_host_key_checking") or "accept-new"
    cfg["frontend_preserve_files"] = tuple(
        cfg.get("frontend_preserve_files") or [".htaccess", ".user.ini", "404.html", "api"]
    )
    cfg["frontend_healthcheck_host"] = (
        cfg.get("frontend_healthcheck_host") or DEFAULT_FRONTEND_HEALTHCHECK_HOST
    )
    cfg["install_frontend_deps"] = bool(cfg.get("install_frontend_deps", False))
    cfg["skip_frontend_build"] = bool(cfg.get("skip_frontend_build", False))
    cfg["dry_run"] = bool(cfg.get("dry_run", False))
    cfg["allow_unsafe_remote_path"] = bool(cfg.get("allow_unsafe_remote_path", False))
    cfg["backend_supervisor_program"] = (
        cfg.get("backend_supervisor_program") or DEFAULT_BACKEND_SUPERVISOR_PROGRAM
    )
    cfg["backend_healthcheck_url"] = (
        cfg.get("backend_healthcheck_url") or DEFAULT_BACKEND_HEALTHCHECK_URL
    )
    cfg["backend_restart_cmd"] = (cfg.get("backend_restart_cmd") or "").strip() or build_backend_restart_command(cfg)
    return cfg


def _ssh_options(cfg: dict, scp: bool = False) -> list[str]:
    opts = []
    if cfg["ssh_key_path"]:
        opts += ["-i", cfg["ssh_key_path"]]
    opts += ["-o", f"StrictHostKeyChecking={cfg['strict_host_key_checking']}"]
    if cfg["strict_host_key_checking"] == "no":
        opts += ["-o", "UserKnownHostsFile=/dev/null"]
    opts += ["-P" if scp else "-p", str(cfg["server_port"])]
    return opts


def _ssh(cfg: dict, script: str) -> None:
    _run(
        ["ssh", *_ssh_options(cfg), f"{cfg['server_user']}@{cfg['server_host']}", script],
        dry_run=cfg["dry_run"],
    )


def _scp(cfg: dict, local_file: Path, remote_path: str) -> None:
    _run(
        ["scp", *_ssh_options(cfg, scp=True), str(local_file), f"{cfg['server_user']}@{cfg['server_host']}:{remote_path}"],
        dry_run=cfg["dry_run"],
    )


def _safe_remote_path(cfg: dict, remote_path: str) -> None:
    if remote_path in {"/", "/www", "/www/wwwroot"}:
        raise RuntimeError(f"远程路径过于危险: {remote_path}")
    if (not cfg["allow_unsafe_remote_path"]) and (not remote_path.startswith("/www/wwwroot/")):
        raise RuntimeError("默认只允许部署到 /www/wwwroot/ 下，若确认安全请加 --allow-unsafe-remote-path")


def _build_frontend(cfg: dict) -> None:
    if cfg["skip_frontend_build"]:
        logger.info("跳过前端构建")
        return
    if not FRONTEND_DIR.exists():
        raise RuntimeError(f"前端目录不存在: {FRONTEND_DIR}")
    if cfg["install_frontend_deps"] or not (FRONTEND_DIR / "node_modules").exists():
        _run(["npm", "install"], cwd=FRONTEND_DIR, dry_run=cfg["dry_run"])
    _run(["npm", "run", "build"], cwd=FRONTEND_DIR, dry_run=cfg["dry_run"])


def _frontend_excludes(cfg: dict) -> list[str]:
    return [str(item) for item in cfg["frontend_preserve_files"]]


def _frontend_chmod_mode() -> str:
    return "Du=rwx,Dgo=rx,Fu=rw,Fgo=r"


def _skip_backend(rel: Path) -> bool:
    skip_dirs = {
        ".git",
        ".venv",
        "__pycache__",
        ".pytest_cache",
        "node_modules",
        "uploads",
        "generated_exports",
        "reports",
        "test-artifacts",
        "tests",
    }
    if any(part in skip_dirs for part in rel.parts):
        return True
    if rel.name in {".env", ".env.local", ".deploy-cache.json", "tmp_run_no_rate_limit_server.py"}:
        return True
    if rel.suffix in {".pyc", ".pyo", ".log", ".pid", ".sqlite3", ".jsonl"}:
        return True
    return False


def _backend_excludes() -> list[str]:
    return [
        ".git",
        ".venv",
        "__pycache__",
        ".pytest_cache",
        "node_modules",
        "uploads",
        "generated_exports",
        "reports",
        "test-artifacts",
        "tests",
        ".env",
        ".env.local",
        "scripts/.deploy-cache.json",
        "tmp_run_no_rate_limit_server.py",
        "*.pyc",
        "*.pyo",
        "*.log",
        "*.pid",
        "*.sqlite3",
        "*.jsonl",
    ]


def upload_dist(config: dict) -> bool:
    cfg = _normalize(config)
    try:
        _safe_remote_path(cfg, cfg["server_frontend_path"])
        _build_frontend(cfg)
        dist_root = Path(cfg["local_dist_path"])
        if not dist_root.exists():
            raise RuntimeError(f"dist 目录不存在: {dist_root}")
        _ssh(cfg, f"mkdir -p {shlex.quote(cfg['server_frontend_path'])}")
        rsync_result = _run(
            _build_rsync_command(
                cfg=cfg,
                source=dist_root,
                destination=cfg["server_frontend_path"],
                excludes=_frontend_excludes(cfg),
                chmod_mode=_frontend_chmod_mode(),
                delete=False,
            ),
            dry_run=cfg["dry_run"],
        )
        _log_and_persist_deploy_summary(
            cache_key="frontend_dist",
            target_name="前端",
            root=dist_root,
            dry_run=cfg["dry_run"],
            rsync_output="" if rsync_result is None else rsync_result.stdout,
        )
        _ssh(cfg, build_frontend_healthcheck_command(cfg))
        logger.info("✅ 前端部署完成")
        return True
    except Exception as exc:
        logger.error("前端部署失败: %s", exc)
        return False


def upload_api(config: dict) -> bool:
    cfg = _normalize(config)
    try:
        _safe_remote_path(cfg, cfg["server_api_path"])
        api_root = Path(cfg["local_api_path"])
        if not api_root.exists():
            raise RuntimeError(f"后端目录不存在: {api_root}")
        _ssh(cfg, f"mkdir -p {shlex.quote(cfg['server_api_path'])}")
        rsync_result = _run(
            _build_rsync_command(
                cfg=cfg,
                source=api_root,
                destination=cfg["server_api_path"],
                excludes=_backend_excludes(),
            ),
            dry_run=cfg["dry_run"],
        )
        restart = cfg["backend_restart_cmd"] or "echo '后端上传完成（未设置重启命令）'"
        _ssh(cfg, restart)
        _log_and_persist_deploy_summary(
            cache_key="backend_api",
            target_name="后端",
            root=api_root,
            should_skip=_skip_backend,
            dry_run=cfg["dry_run"],
            rsync_output="" if rsync_result is None else rsync_result.stdout,
        )
        logger.info("✅ 后端部署完成")
        return True
    except Exception as exc:
        logger.error("后端部署失败: %s", exc)
        return False


def watch_and_deploy(config: dict) -> bool:
    cfg = _normalize(config)
    dist = Path(cfg["local_dist_path"])
    if not dist.exists():
        logger.error("watch 失败，dist 不存在: %s", dist)
        return False
    logger.info("watch 模式启动，监控: %s", dist)
    last = hashlib.md5("".join(sorted(str(p.stat().st_mtime_ns) for p in dist.rglob("*") if p.is_file())).encode()).hexdigest()
    try:
        while True:
            time.sleep(CHECK_INTERVAL)
            now = hashlib.md5("".join(sorted(str(p.stat().st_mtime_ns) for p in dist.rglob("*") if p.is_file())).encode()).hexdigest()
            if now != last:
                logger.info("检测到 dist 变化，重新部署前端")
                if upload_dist(cfg):
                    last = now
    except KeyboardInterrupt:
        logger.info("watch 已停止")
        return True


def sync_database_full(config: dict) -> bool:
    logger.error("当前脚本不含数据库同步能力，请使用 alembic 或专用数据库脚本")
    return False


def sync_database_migrations(config: dict) -> bool:
    logger.error("当前脚本不含数据库同步能力，请使用 alembic 或专用数据库脚本")
    return False


def build_config(args: argparse.Namespace) -> dict:
    server_root = args.server_root or _env("DEPLOY_SERVER_ROOT", default=DEFAULT_SERVER_ROOT)
    frontend_preserve = tuple(
        p.strip()
        for p in (args.frontend_preserve or ".htaccess,.user.ini,404.html,api").split(",")
        if p.strip()
    )
    return {
        "server_host": args.server_host or _env("DEPLOY_SERVER_HOST", default=DEFAULT_SERVER_HOST),
        "server_user": args.server_user or _env("DEPLOY_SERVER_USER", default="root"),
        "server_port": int(args.server_port or _env("DEPLOY_SERVER_PORT", default=str(DEFAULT_SERVER_PORT))),
        "server_root": server_root,
        "server_frontend_path": args.server_frontend_path or _env("DEPLOY_SERVER_FRONTEND", default=server_root),
        "server_api_path": args.server_api_path or _env("DEPLOY_SERVER_API", default=f"{server_root}/api"),
        "ssh_key_path": args.ssh_key or _env("DEPLOY_SSH_KEY", default=DEFAULT_SSH_KEY),
        "local_dist_path": args.local_dist_path or str(DEFAULT_LOCAL_DIST_PATH),
        "local_api_path": args.local_api_path or str(DEFAULT_LOCAL_API_PATH),
        "strict_host_key_checking": args.strict_host_key_checking,
        "frontend_preserve_files": frontend_preserve,
        "install_frontend_deps": args.install_frontend_deps,
        "skip_frontend_build": args.skip_frontend_build,
        "dry_run": args.dry_run,
        "allow_unsafe_remote_path": args.allow_unsafe_remote_path,
        "backend_supervisor_program": args.backend_supervisor_program
        or _env("DEPLOY_BACKEND_SUPERVISOR_PROGRAM", default=DEFAULT_BACKEND_SUPERVISOR_PROGRAM),
        "backend_healthcheck_url": args.backend_healthcheck_url
        or _env("DEPLOY_BACKEND_HEALTHCHECK_URL", default=DEFAULT_BACKEND_HEALTHCHECK_URL),
        "backend_restart_cmd": args.backend_restart_cmd or _env("DEPLOY_BACKEND_RESTART_CMD", default=""),
    }


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI_XS_Vocab 前后端部署脚本")
    parser.add_argument("--once", action="store_true", help="兼容参数：执行一次并退出")
    parser.add_argument("--watch", action="store_true", help="监控 dist 变化并自动部署前端")
    parser.add_argument("--frontend", action="store_true", help="只部署前端")
    parser.add_argument("--backend", action="store_true", help="只部署后端")
    parser.add_argument("--all", action="store_true", help="部署前后端")
    parser.add_argument("--all-db", action="store_true", help="兼容参数：等同 --all")
    parser.add_argument("--db", action="store_true", help="兼容参数：当前不支持")
    parser.add_argument("--db-full", action="store_true", help="兼容参数：当前不支持")
    parser.add_argument("--db-force", action="store_true", help="兼容参数")
    parser.add_argument("--server-host", dest="server_host", help="服务器 IP / 域名")
    parser.add_argument("--server-user", dest="server_user", help="服务器用户")
    parser.add_argument("--server-port", dest="server_port", help="SSH 端口，默认 22")
    parser.add_argument("--server-root", dest="server_root", help="服务器站点根目录")
    parser.add_argument("--server-frontend-path", dest="server_frontend_path", help="服务器前端目录")
    parser.add_argument("--server-api-path", dest="server_api_path", help="服务器后端目录")
    parser.add_argument("--ssh-key", dest="ssh_key", help="SSH 私钥路径")
    parser.add_argument("--local-dist-path", dest="local_dist_path", help="本地前端 dist 路径")
    parser.add_argument("--local-api-path", dest="local_api_path", help="本地后端路径")
    parser.add_argument("--frontend-preserve", help="前端保留文件/目录，逗号分隔，默认 .htaccess,.user.ini,404.html,api")
    parser.add_argument("--strict-host-key-checking", choices=["yes", "no", "accept-new"], default="accept-new")
    parser.add_argument("--install-frontend-deps", action="store_true", help="部署前先 npm install")
    parser.add_argument("--skip-frontend-build", action="store_true", help="跳过 npm run build")
    parser.add_argument("--backend-supervisor-program", help="Supervisor 中的后端进程名，默认 ai_xs_backend")
    parser.add_argument(
        "--backend-healthcheck-url",
        help="后端上传重启后的健康检查地址，默认 http://127.0.0.1:8000/api/health",
    )
    parser.add_argument("--backend-restart-cmd", help="后端上传后执行的远程命令")
    parser.add_argument("--dry-run", action="store_true", help="仅打印命令，不实际执行")
    parser.add_argument("--allow-unsafe-remote-path", action="store_true", help="允许部署到 /www/wwwroot/ 之外路径")
    return parser


def main() -> None:
    args = create_parser().parse_args()
    config = build_config(args)

    if args.watch:
        watch_and_deploy(config)
        return
    if args.db_full:
        sys.exit(0 if sync_database_full(config) else 1)
    if args.db:
        sys.exit(0 if sync_database_migrations(config) else 1)

    do_front = args.frontend or args.all or args.all_db
    do_back = args.backend or args.all or args.all_db
    if not (do_front or do_back):
        do_front = True
        do_back = True

    ok = True
    if do_front:
        ok = upload_dist(config) and ok
    if do_back:
        ok = upload_api(config) and ok
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
