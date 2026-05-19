"""
MOMO小说（AI-XsRead）一键部署脚本。

适用站点：xs.momofx.cn（腾讯云 OpenCloudOS + 宝塔面板 + Node.js 18+ + PM2）

服务器实际目录结构（基于现场确认）：

    /www/wwwroot/xs.momofx.cn/
    ├── ai-xsread-vue3/dist/      ← Nginx root 指向此处（前端构建产物）
    ├── backend/                   ← 用户后端源代码（PM2: xsread-backend, 端口 8005）
    ├── admin-frontend/            ← 管理前端
    ├── admin-backend/             ← 管理后端（PM2: xsread-admin-backend, 端口 8001）
    ├── ecosystem.config.js        ← PM2 多进程配置文件（本脚本通过它 start/reload）
    └── logs/                      ← PM2 日志目录

Nginx 通过反向代理把 /api 转发到 127.0.0.1:8005。

能力：
1. 前端（ai-xsread-vue3）：npm run build → rsync 增量上传到 ai-xsread-vue3/dist
2. 后端（backend）：rsync 增量上传到 backend/，远端 npm ci，再用 ecosystem.config.js
   通过 PM2 进行 reload（无则 start），最后 curl /api/health 做健康检查
3. 支持 --frontend / --backend / --all / --watch / --dry-run
4. 默认仅允许部署到 /www/wwwroot/ 下

注意：
- 服务器上的 .env 不会被同步覆盖（在排除列表中）
- node_modules、tests、日志、缓存等都不会同步
- 第一次 PM2 start 需要 ecosystem.config.js 已经在站点根目录（服务器已存在）
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

# ============================================================
# 路径与默认值
# ============================================================
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent                     # backend/
ROOT_DIR = BACKEND_DIR.parent                       # 项目根目录
FRONTEND_DIR = ROOT_DIR / "ai-xsread-vue3"          # 用户前端
ADMIN_FRONTEND_DIR = ROOT_DIR / "admin-frontend"    # 管理前端
ADMIN_BACKEND_DIR = ROOT_DIR / "admin-backend"      # 管理后端

DEFAULT_LOCAL_DIST_PATH = FRONTEND_DIR / "dist"
DEFAULT_LOCAL_API_PATH = BACKEND_DIR
DEFAULT_LOCAL_ADMIN_DIST_PATH = ADMIN_FRONTEND_DIR / "dist"
DEFAULT_LOCAL_ADMIN_API_PATH = ADMIN_BACKEND_DIR

# 服务器与站点信息（默认按 xs.momofx.cn 实际部署结构配置，可通过命令行/环境变量覆盖）
# 服务器实际目录结构（已通过 SSH 现场确认）：
#   /www/wwwroot/xs.momofx.cn/                    站点根目录
#   ├── ai-xsread-vue3/dist/                      用户前端构建产物（Nginx root 指向这里）
#   ├── backend/                                  用户后端代码（PM2: xsread-backend，端口 8005）
#   ├── admin-frontend/                           管理前端构建产物
#   ├── admin-backend/                            管理后端代码（PM2: xsread-admin-backend，端口 8001）
#   ├── ecosystem.config.js                       PM2 多进程配置，本脚本依赖它来 start/reload
#   ├── nginx.conf                                Nginx 配置参考（实际配置在宝塔面板/conf.d）
#   └── logs/                                     PM2 日志目录
DEFAULT_SERVER_HOST = "xs.momofx.cn"
DEFAULT_SERVER_PORT = 22
DEFAULT_SERVER_USER = "root"
DEFAULT_SERVER_ROOT = "/www/wwwroot/xs.momofx.cn"
DEFAULT_SSH_KEY = str(Path.home() / ".ssh" / "id_rsa")

# 站点子目录（与服务器现场一致）
DEFAULT_SERVER_FRONTEND_PATH = f"{DEFAULT_SERVER_ROOT}/ai-xsread-vue3/dist"
DEFAULT_SERVER_API_PATH = f"{DEFAULT_SERVER_ROOT}/backend"
DEFAULT_SERVER_PM2_CONFIG = f"{DEFAULT_SERVER_ROOT}/ecosystem.config.js"
DEFAULT_SERVER_ADMIN_FRONTEND_PATH = f"{DEFAULT_SERVER_ROOT}/admin-frontend/dist"
DEFAULT_SERVER_ADMIN_API_PATH = f"{DEFAULT_SERVER_ROOT}/admin-backend"

# 健康检查相关
DEFAULT_FRONTEND_HEALTHCHECK_HOST = "xs.momofx.cn"
DEFAULT_BACKEND_PORT = 8005
DEFAULT_BACKEND_HEALTHCHECK_URL = f"http://127.0.0.1:{DEFAULT_BACKEND_PORT}/api/health"
DEFAULT_ADMIN_BACKEND_PORT = 8001
DEFAULT_ADMIN_BACKEND_HEALTHCHECK_URL = f"http://127.0.0.1:{DEFAULT_ADMIN_BACKEND_PORT}/api/health"

# PM2 进程名（与服务器 ecosystem.config.js 中保持一致）
DEFAULT_BACKEND_PM2_NAME = "xsread-backend"
DEFAULT_ADMIN_BACKEND_PM2_NAME = "xsread-admin-backend"

# 监听 dist 变化的轮询周期
CHECK_INTERVAL = 5
DEPLOY_CACHE_FILE = str(SCRIPT_DIR / ".deploy-cache.json")

# ============================================================
# 日志
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(SCRIPT_DIR / "deploy.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("deploy")


# ============================================================
# 部署清单 / 缓存
# ============================================================
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
    return {"changed": changed, "unchanged": unchanged, "removed": removed}


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
        "当前上传方式：rsync 增量上传。"
        if upload_mode == "incremental"
        else "当前上传方式：全量覆盖部署。"
    )
    lines = [
        f"{target_name}部署摘要：",
        mode_line,
        f"本次检测到新增/变更 {len(changed_files)} 个文件，保持不变 {len(unchanged_files)} 个文件，本地已删除 {len(removed_files)} 个文件。",
        f"已上传文件：{_format_file_list(changed_files)}",
        f"保持不变文件：{_format_file_list(unchanged_files)}",
        f"本地已删除文件：{_format_file_list(removed_files)}",
    ]
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
    summary = _build_deploy_summary(
        manifest_summary,
        _parse_rsync_itemize_output(rsync_output) if rsync_output else None,
    )
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


# ============================================================
# 命令执行 / rsync 工具
# ============================================================
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
    """Windows 路径转换成 cwRsync 可识别的 /cygdrive/<drive>/... 格式。"""
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
    """优先使用 cwRsync 自带的 ssh，避免与 Windows OpenSSH 不兼容。"""
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
    """
    构造 rsync 增量上传命令。

    关键参数说明（确保真增量、内容一致就不上传）：
    - --checksum   按文件内容 MD5 比对（不依赖 mtime）。这样即便 npm run build 重新生成
                   了所有文件、mtime 全变了，只要文件内容没变也会被跳过。
    - --itemize-changes  逐文件输出动作，便于本脚本解析“真正上传 / 跳过”。
    - --no-times   不去同步源文件的 mtime（搭配 --checksum 才能保持长期稳定）。
    """
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
        "--checksum",       # 真增量：按内容 hash 决定是否传输
        "--itemize-changes",
        "--no-owner",
        "--no-group",
        "--no-perms",
        "--no-times",       # mtime 不再作为判断条件，避免 npm run build 全量重传
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


# ============================================================
# 远端命令构造
# ============================================================
def build_backend_restart_command(cfg: dict) -> str:
    """
    远端重启后端命令（PM2 + ecosystem.config.js 方式）：

    1. 进入 backend 目录，执行 npm ci 安装生产依赖
    2. 切到站点根目录，使用 ecosystem.config.js 启动/重载 PM2 进程
       - 已有进程：reload（保留 PM2 ID，平滑重启）
       - 没有进程：通过 ecosystem 配置 start --only <name>
    3. pm2 save，让 PM2 在服务器重启后能自启
    4. 调用 /api/health 做健康检查
    """
    pm2_name = cfg.get("backend_pm2_name") or DEFAULT_BACKEND_PM2_NAME
    healthcheck_url = cfg.get("backend_healthcheck_url") or DEFAULT_BACKEND_HEALTHCHECK_URL
    backend_api_path = cfg.get("server_api_path") or DEFAULT_SERVER_API_PATH
    pm2_config = cfg.get("server_pm2_config") or DEFAULT_SERVER_PM2_CONFIG
    pm2_bin = cfg.get("pm2_bin") or "pm2"
    npm_bin = cfg.get("npm_bin") or "npm"
    return (
        f"set -e; "
        f"cd {shlex.quote(backend_api_path)} && "
        f"{shlex.quote(npm_bin)} ci --omit=dev --no-audit --no-fund && "
        f"({shlex.quote(pm2_bin)} reload {shlex.quote(pm2_name)} --update-env "
        f"|| {shlex.quote(pm2_bin)} start {shlex.quote(pm2_config)} --only {shlex.quote(pm2_name)} --update-env) && "
        f"{shlex.quote(pm2_bin)} save && "
        f"sleep 2 && "
        f"curl -fsS --max-time 15 {shlex.quote(healthcheck_url)}"
    )


def build_frontend_healthcheck_command(cfg: dict) -> str:
    """
    前端健康检查：服务器实际配置 HTTP 80 会 301 跳转到 HTTPS，所以这里用 -L
    跟随跳转，并接受 200/301/302 三种状态。
    """
    host = cfg.get("frontend_healthcheck_host") or DEFAULT_FRONTEND_HEALTHCHECK_HOST
    return (
        "STATUS=$(curl -skL -o /dev/null -w '%{http_code}' http://127.0.0.1/ "
        f"-H {shlex.quote(f'Host: {host}')} --resolve {shlex.quote(f'{host}:443:127.0.0.1')}); "
        "echo \"前端首页 HTTP 状态：$STATUS\"; "
        'test "$STATUS" = "200" -o "$STATUS" = "301" -o "$STATUS" = "302"'
    )


def build_admin_backend_restart_command(cfg: dict) -> str:
    """
    远端重启管理后端命令（与用户后端流程一致，独立 PM2 进程名 / 端口 / 健康检查）。
    """
    pm2_name = cfg.get("admin_backend_pm2_name") or DEFAULT_ADMIN_BACKEND_PM2_NAME
    healthcheck_url = cfg.get("admin_backend_healthcheck_url") or DEFAULT_ADMIN_BACKEND_HEALTHCHECK_URL
    admin_api_path = cfg.get("server_admin_api_path") or DEFAULT_SERVER_ADMIN_API_PATH
    pm2_config = cfg.get("server_pm2_config") or DEFAULT_SERVER_PM2_CONFIG
    pm2_bin = cfg.get("pm2_bin") or "pm2"
    npm_bin = cfg.get("npm_bin") or "npm"
    return (
        f"set -e; "
        f"cd {shlex.quote(admin_api_path)} && "
        f"{shlex.quote(npm_bin)} ci --omit=dev --no-audit --no-fund && "
        f"({shlex.quote(pm2_bin)} reload {shlex.quote(pm2_name)} --update-env "
        f"|| {shlex.quote(pm2_bin)} start {shlex.quote(pm2_config)} --only {shlex.quote(pm2_name)} --update-env) && "
        f"{shlex.quote(pm2_bin)} save && "
        f"sleep 2 && "
        f"curl -fsS --max-time 15 {shlex.quote(healthcheck_url)}"
    )


# ============================================================
# 配置归一
# ============================================================
def _normalize(config: dict) -> dict:
    cfg = dict(config)
    root = cfg.get("server_root") or DEFAULT_SERVER_ROOT
    cfg["server_host"] = cfg.get("server_host") or DEFAULT_SERVER_HOST
    cfg["server_user"] = cfg.get("server_user") or DEFAULT_SERVER_USER
    cfg["server_port"] = int(cfg.get("server_port") or DEFAULT_SERVER_PORT)
    cfg["server_root"] = root
    # 服务器 Nginx root 指向 dist，所以前端要传到 ai-xsread-vue3/dist 子目录
    cfg["server_frontend_path"] = (
        cfg.get("server_frontend_path") or f"{root}/ai-xsread-vue3/dist"
    )
    # 后端代码目录是 backend，不是 api（与 ecosystem.config.js 中的 cwd 对应）
    cfg["server_api_path"] = cfg.get("server_api_path") or f"{root}/backend"
    cfg["server_pm2_config"] = (
        cfg.get("server_pm2_config") or f"{root}/ecosystem.config.js"
    )
    cfg["ssh_key_path"] = cfg.get("ssh_key_path") or DEFAULT_SSH_KEY
    cfg["local_dist_path"] = cfg.get("local_dist_path") or str(DEFAULT_LOCAL_DIST_PATH)
    cfg["local_api_path"] = cfg.get("local_api_path") or str(DEFAULT_LOCAL_API_PATH)
    cfg["strict_host_key_checking"] = cfg.get("strict_host_key_checking") or "accept-new"
    # 前端目标已经是 dist 专用目录，仍保留这些“安全清单”避免误删宝塔/Nginx 自动生成的文件
    cfg["frontend_preserve_files"] = tuple(
        cfg.get("frontend_preserve_files")
        or [".htaccess", ".user.ini", "404.html", ".well-known"]
    )
    cfg["frontend_healthcheck_host"] = (
        cfg.get("frontend_healthcheck_host") or DEFAULT_FRONTEND_HEALTHCHECK_HOST
    )
    cfg["install_frontend_deps"] = bool(cfg.get("install_frontend_deps", False))
    cfg["skip_frontend_build"] = bool(cfg.get("skip_frontend_build", False))
    cfg["dry_run"] = bool(cfg.get("dry_run", False))
    cfg["allow_unsafe_remote_path"] = bool(cfg.get("allow_unsafe_remote_path", False))
    cfg["backend_pm2_name"] = (
        cfg.get("backend_pm2_name") or DEFAULT_BACKEND_PM2_NAME
    )
    cfg["pm2_bin"] = cfg.get("pm2_bin") or "pm2"
    cfg["npm_bin"] = cfg.get("npm_bin") or "npm"
    cfg["backend_healthcheck_url"] = (
        cfg.get("backend_healthcheck_url") or DEFAULT_BACKEND_HEALTHCHECK_URL
    )
    cfg["backend_restart_cmd"] = (cfg.get("backend_restart_cmd") or "").strip() or build_backend_restart_command(cfg)

    # admin-frontend / admin-backend 相关默认值（与用户端独立）
    cfg["server_admin_frontend_path"] = (
        cfg.get("server_admin_frontend_path") or f"{root}/admin-frontend/dist"
    )
    cfg["server_admin_api_path"] = (
        cfg.get("server_admin_api_path") or f"{root}/admin-backend"
    )
    cfg["local_admin_dist_path"] = (
        cfg.get("local_admin_dist_path") or str(DEFAULT_LOCAL_ADMIN_DIST_PATH)
    )
    cfg["local_admin_api_path"] = (
        cfg.get("local_admin_api_path") or str(DEFAULT_LOCAL_ADMIN_API_PATH)
    )
    cfg["install_admin_frontend_deps"] = bool(cfg.get("install_admin_frontend_deps", False))
    cfg["skip_admin_frontend_build"] = bool(cfg.get("skip_admin_frontend_build", False))
    cfg["admin_backend_pm2_name"] = (
        cfg.get("admin_backend_pm2_name") or DEFAULT_ADMIN_BACKEND_PM2_NAME
    )
    cfg["admin_backend_healthcheck_url"] = (
        cfg.get("admin_backend_healthcheck_url") or DEFAULT_ADMIN_BACKEND_HEALTHCHECK_URL
    )
    cfg["admin_backend_restart_cmd"] = (
        (cfg.get("admin_backend_restart_cmd") or "").strip()
        or build_admin_backend_restart_command(cfg)
    )
    return cfg


# ============================================================
# SSH / SCP
# ============================================================
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


def _ssh_capture(cfg: dict, script: str) -> str:
    """SSH 执行命令并捕获 stdout（不打印），失败返回空串。本工具不参与 dry-run。"""
    if cfg.get("dry_run"):
        return ""
    resolved = _resolve_command(["ssh", *_ssh_options(cfg), f"{cfg['server_user']}@{cfg['server_host']}", script])
    try:
        result = subprocess.run(
            resolved,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("SSH 取数据失败: %s", exc)
        return ""
    if result.returncode != 0:
        logger.warning(
            "SSH 取数据返回非 0：%s\n%s",
            result.returncode,
            (result.stderr or "").strip(),
        )
    return result.stdout or ""


# ============================================================
# 远端迁移状态查询（migrations 表）
# ============================================================
_REMOTE_MIGRATIONS_QUERY_JS = r"""
(async () => {
  try {
    require('dotenv').config();
    const mysql = require('mysql2/promise');
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || process.env.DB_NAME
    });
    let rows = [];
    try {
      const [r] = await conn.query(
        'SELECT version, description, applied_at FROM migrations ORDER BY version'
      );
      rows = r;
    } catch (e) {
      if (e.code === 'ER_NO_SUCH_TABLE') rows = [];
      else throw e;
    }
    process.stdout.write('__MIG__' + JSON.stringify(rows) + '__END__');
    await conn.end();
  } catch (e) {
    process.stderr.write('ERR:' + (e && e.message ? e.message : String(e)));
    process.exit(1);
  }
})();
"""


def _remote_query_migrations(cfg: dict) -> list[dict]:
    """
    通过 SSH 在服务器上跑一段 node 脚本查 migrations 表。
    采用 base64 编码避免 SSH 多层引号转义问题。
    返回值形如 [{version, description, applied_at}, ...]。
    """
    import base64

    encoded = base64.b64encode(_REMOTE_MIGRATIONS_QUERY_JS.encode("utf-8")).decode("ascii")
    backend_path = cfg.get("server_api_path") or DEFAULT_SERVER_API_PATH
    # cd 到后端目录确保 require('dotenv') / require('mysql2/promise') 都能从 node_modules 找到
    script = (
        f"cd {shlex.quote(backend_path)} && "
        f"echo {shlex.quote(encoded)} | base64 -d | node -"
    )
    raw = _ssh_capture(cfg, script)
    if not raw:
        return []
    start = raw.find("__MIG__")
    end = raw.find("__END__")
    if start < 0 or end < 0 or end <= start:
        logger.warning("未能解析远端 migrations 输出（截断 200 字符）：%s", raw[:200])
        return []
    payload = raw[start + len("__MIG__"):end]
    try:
        rows = json.loads(payload)
        return rows if isinstance(rows, list) else []
    except json.JSONDecodeError:
        logger.warning("远端 migrations JSON 解析失败：%s", payload[:200])
        return []


def _format_migration_rows(rows: list[dict]) -> list[str]:
    return [
        f"  {row.get('version', '?'):<14} {row.get('description', '') or ''}".rstrip()
        for row in rows
    ]


def _log_migration_diff(before: list[dict], after: list[dict]) -> None:
    """打印本次部署后新应用的迁移与累计应用版本数。"""
    before_versions = {str(r.get("version")) for r in before}
    after_versions = {str(r.get("version")) for r in after}
    newly_applied = [r for r in after if str(r.get("version")) not in before_versions]

    if not after:
        logger.info("数据库迁移摘要：未读到 migrations 表（可能首次部署，正在初始化）。")
        return

    if newly_applied:
        logger.info(
            "\n数据库迁移摘要：本次新应用 %d 个迁移，累计 %d 个：\n%s",
            len(newly_applied),
            len(after_versions),
            "\n".join(_format_migration_rows(newly_applied)),
        )
    else:
        latest = after[-1] if after else {}
        logger.info(
            "数据库迁移摘要：无新增迁移，累计 %d 个，最新版本 %s（%s）。",
            len(after_versions),
            latest.get("version", "?"),
            latest.get("description", "") or "",
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


# ============================================================
# 前端构建 & 排除规则
# ============================================================
def _build_frontend(cfg: dict) -> None:
    if cfg["skip_frontend_build"]:
        logger.info("跳过前端构建")
        return
    if not FRONTEND_DIR.exists():
        raise RuntimeError(f"前端目录不存在: {FRONTEND_DIR}")
    if cfg["install_frontend_deps"] or not (FRONTEND_DIR / "node_modules").exists():
        _run(["npm", "install"], cwd=FRONTEND_DIR, dry_run=cfg["dry_run"])
    _run(["npm", "run", "build"], cwd=FRONTEND_DIR, dry_run=cfg["dry_run"])


def _build_admin_frontend(cfg: dict) -> None:
    """管理前端构建（admin-frontend），与用户前端独立 npm install / npm run build。"""
    if cfg.get("skip_admin_frontend_build"):
        logger.info("跳过管理前端构建")
        return
    if not ADMIN_FRONTEND_DIR.exists():
        raise RuntimeError(f"管理前端目录不存在: {ADMIN_FRONTEND_DIR}")
    if cfg.get("install_admin_frontend_deps") or not (ADMIN_FRONTEND_DIR / "node_modules").exists():
        _run(["npm", "install"], cwd=ADMIN_FRONTEND_DIR, dry_run=cfg["dry_run"])
    _run(["npm", "run", "build"], cwd=ADMIN_FRONTEND_DIR, dry_run=cfg["dry_run"])


def _frontend_excludes(cfg: dict) -> list[str]:
    return [str(item) for item in cfg["frontend_preserve_files"]]


def _frontend_chmod_mode() -> str:
    return "Du=rwx,Dgo=rx,Fu=rw,Fgo=r"


# ============================================================
# 后端排除规则
# ============================================================
def _skip_backend(rel: Path) -> bool:
    skip_dirs = {
        ".git",
        "node_modules",
        "coverage",
        "logs",
        "uploads",
        "tests",
        "tmp",
        ".vscode",
        ".idea",
        "__pycache__",
    }
    if any(part in skip_dirs for part in rel.parts):
        return True
    if rel.name in {
        ".env",
        ".env.local",
        ".env.production",
        ".deploy-cache.json",
        "deploy.log",
    }:
        return True
    if rel.suffix in {".log", ".pid", ".pyc", ".pyo", ".sqlite3", ".sqlite", ".tmp"}:
        return True
    if rel.name.endswith(".test.js") or rel.name.endswith(".spec.js"):
        return True
    return False


def _backend_excludes() -> list[str]:
    return [
        ".git",
        "node_modules",
        "coverage",
        "logs",
        "uploads",
        "tests",
        "tmp",
        ".vscode",
        ".idea",
        "__pycache__",
        ".env",
        ".env.local",
        ".env.production",
        "scripts/.deploy-cache.json",
        "scripts/deploy.log",
        "*.log",
        "*.pid",
        "*.pyc",
        "*.pyo",
        "*.sqlite3",
        "*.sqlite",
        "*.test.js",
        "*.spec.js",
    ]


# ============================================================
# 上传逻辑
# ============================================================
def upload_dist(config: dict) -> bool:
    cfg = _normalize(config)
    try:
        _safe_remote_path(cfg, cfg["server_frontend_path"])
        _build_frontend(cfg)
        dist_root = Path(cfg["local_dist_path"])
        if not dist_root.exists():
            raise RuntimeError(f"dist 目录不存在: {dist_root}")
        _ssh(cfg, f"mkdir -p {shlex.quote(cfg['server_frontend_path'])}")
        # 前端目标是独立的 ai-xsread-vue3/dist 目录，启用 --delete 清理旧的 hash 文件，
        # 但仍通过 excludes 保护 .htaccess / .user.ini / .well-known 等
        rsync_result = _run(
            _build_rsync_command(
                cfg=cfg,
                source=dist_root,
                destination=cfg["server_frontend_path"],
                excludes=_frontend_excludes(cfg),
                chmod_mode=_frontend_chmod_mode(),
                delete=True,
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
        logger.info("✅ 前端部署完成（站点：%s）", cfg["frontend_healthcheck_host"])
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

        # 部署前先抓一份远端 migrations 快照，部署后再抓一份做 diff
        migrations_before = _remote_query_migrations(cfg)

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

        # 应用启动期会自动执行 runPendingMigrations，所以这里再抓一次最新状态
        migrations_after = _remote_query_migrations(cfg)
        _log_migration_diff(migrations_before, migrations_after)

        logger.info("✅ 后端部署完成（PM2：%s）", cfg["backend_pm2_name"])
        return True
    except Exception as exc:
        logger.error("后端部署失败: %s", exc)
        return False


def upload_admin_dist(config: dict) -> bool:
    """部署管理前端（admin-frontend）到 admin-frontend/dist。"""
    cfg = _normalize(config)
    try:
        _safe_remote_path(cfg, cfg["server_admin_frontend_path"])
        _build_admin_frontend(cfg)
        dist_root = Path(cfg["local_admin_dist_path"])
        if not dist_root.exists():
            raise RuntimeError(f"管理前端 dist 不存在: {dist_root}")
        _ssh(cfg, f"mkdir -p {shlex.quote(cfg['server_admin_frontend_path'])}")
        rsync_result = _run(
            _build_rsync_command(
                cfg=cfg,
                source=dist_root,
                destination=cfg["server_admin_frontend_path"],
                excludes=_frontend_excludes(cfg),
                chmod_mode=_frontend_chmod_mode(),
                delete=True,
            ),
            dry_run=cfg["dry_run"],
        )
        _log_and_persist_deploy_summary(
            cache_key="admin_frontend_dist",
            target_name="管理前端",
            root=dist_root,
            dry_run=cfg["dry_run"],
            rsync_output="" if rsync_result is None else rsync_result.stdout,
        )
        logger.info(
            "✅ 管理前端部署完成（远端目录：%s，需要 Nginx/反代另行配置子域名或子路径）",
            cfg["server_admin_frontend_path"],
        )
        return True
    except Exception as exc:
        logger.error("管理前端部署失败: %s", exc)
        return False


def upload_admin_api(config: dict) -> bool:
    """部署管理后端（admin-backend），独立 PM2 进程。"""
    cfg = _normalize(config)
    try:
        _safe_remote_path(cfg, cfg["server_admin_api_path"])
        api_root = Path(cfg["local_admin_api_path"])
        if not api_root.exists():
            raise RuntimeError(f"管理后端目录不存在: {api_root}")
        _ssh(cfg, f"mkdir -p {shlex.quote(cfg['server_admin_api_path'])}")
        rsync_result = _run(
            _build_rsync_command(
                cfg=cfg,
                source=api_root,
                destination=cfg["server_admin_api_path"],
                excludes=_backend_excludes(),
            ),
            dry_run=cfg["dry_run"],
        )
        restart = cfg["admin_backend_restart_cmd"] or "echo '管理后端上传完成（未设置重启命令）'"
        _ssh(cfg, restart)
        _log_and_persist_deploy_summary(
            cache_key="admin_backend_api",
            target_name="管理后端",
            root=api_root,
            should_skip=_skip_backend,
            dry_run=cfg["dry_run"],
            rsync_output="" if rsync_result is None else rsync_result.stdout,
        )
        logger.info("✅ 管理后端部署完成（PM2：%s）", cfg["admin_backend_pm2_name"])
        return True
    except Exception as exc:
        logger.error("管理后端部署失败: %s", exc)
        return False


def watch_and_deploy(config: dict) -> bool:
    cfg = _normalize(config)
    dist = Path(cfg["local_dist_path"])
    if not dist.exists():
        logger.error("watch 失败，dist 不存在: %s", dist)
        return False
    logger.info("watch 模式启动，监控: %s", dist)
    last = hashlib.md5(
        "".join(sorted(str(p.stat().st_mtime_ns) for p in dist.rglob("*") if p.is_file())).encode()
    ).hexdigest()
    try:
        while True:
            time.sleep(CHECK_INTERVAL)
            now = hashlib.md5(
                "".join(sorted(str(p.stat().st_mtime_ns) for p in dist.rglob("*") if p.is_file())).encode()
            ).hexdigest()
            if now != last:
                logger.info("检测到 dist 变化，重新部署前端")
                if upload_dist(cfg):
                    last = now
    except KeyboardInterrupt:
        logger.info("watch 已停止")
        return True


def upload_images(config: dict) -> bool:
    """
    上传优化后的图片资源到服务器。

    流程：
    1. 先在本地运行 optimize-covers.js 压缩封面图片
    2. 通过 rsync 增量同步 uploads/images/ 和 uploads/thumbnails/ 到服务器
    """
    cfg = _normalize(config)
    try:
        server_uploads = f"{cfg['server_api_path']}/uploads"
        _safe_remote_path(cfg, server_uploads)

        # 本地 uploads 目录
        local_uploads = Path(cfg["local_api_path"]) / "uploads"
        if not local_uploads.exists():
            raise RuntimeError(f"本地 uploads 目录不存在: {local_uploads}")

        # Step 1: 运行本地图片优化脚本
        optimize_script = SCRIPT_DIR / "optimize-covers.js"
        if optimize_script.exists():
            logger.info("🖼️  运行封面图片优化脚本...")
            try:
                _run(["node", str(optimize_script)], cwd=BACKEND_DIR, dry_run=cfg["dry_run"])
            except RuntimeError as e:
                logger.warning("图片优化脚本执行出错（继续上传已有图片）: %s", e)
        else:
            logger.info("跳过图片优化（脚本不存在）")

        # Step 2: 确保远端目录存在
        _ssh(cfg, f"mkdir -p {shlex.quote(server_uploads)}/images/covers")
        _ssh(cfg, f"mkdir -p {shlex.quote(server_uploads)}/thumbnails/covers")

        # Step 3: rsync 上传图片（仅同步 images 和 thumbnails）
        images_dir = local_uploads / "images"
        thumbs_dir = local_uploads / "thumbnails"

        if images_dir.exists():
            logger.info("📤 上传图片目录...")
            rsync_result = _run(
                _build_rsync_command(
                    cfg=cfg,
                    source=images_dir,
                    destination=f"{server_uploads}/images",
                    excludes=[],
                    delete=False,  # 不删除服务器上已有的其他图片
                ),
                dry_run=cfg["dry_run"],
            )
            if rsync_result:
                parsed = _parse_rsync_itemize_output(rsync_result.stdout)
                uploaded_count = len(parsed.get("uploaded", []))
                logger.info("  图片上传: %d 个文件", uploaded_count)

        if thumbs_dir.exists():
            logger.info("📤 上传缩略图目录...")
            _run(
                _build_rsync_command(
                    cfg=cfg,
                    source=thumbs_dir,
                    destination=f"{server_uploads}/thumbnails",
                    excludes=[],
                    delete=False,
                ),
                dry_run=cfg["dry_run"],
            )

        # Step 4: 设置权限
        _ssh(cfg, f"chmod -R 755 {shlex.quote(server_uploads)}")

        logger.info("✅ 图片资源上传完成")
        return True
    except Exception as exc:
        logger.error("图片上传失败: %s", exc)
        return False


def sync_database_full(config: dict) -> bool:
    logger.error("当前脚本未实现数据库同步，请使用 mysql/mysqldump 手动迁移")
    return False


def sync_database_migrations(config: dict) -> bool:
    logger.error("当前脚本未实现数据库迁移，请使用 mysql 命令行执行 SQL")
    return False


# ============================================================
# CLI
# ============================================================
def build_config(args: argparse.Namespace) -> dict:
    server_root = args.server_root or _env("DEPLOY_SERVER_ROOT", default=DEFAULT_SERVER_ROOT)
    frontend_preserve = tuple(
        p.strip()
        for p in (
            args.frontend_preserve
            or ".htaccess,.user.ini,404.html,api,uploads,.well-known"
        ).split(",")
        if p.strip()
    )
    return {
        "server_host": args.server_host or _env("DEPLOY_SERVER_HOST", default=DEFAULT_SERVER_HOST),
        "server_user": args.server_user or _env("DEPLOY_SERVER_USER", default=DEFAULT_SERVER_USER),
        "server_port": int(args.server_port or _env("DEPLOY_SERVER_PORT", default=str(DEFAULT_SERVER_PORT))),
        "server_root": server_root,
        "server_frontend_path": args.server_frontend_path or _env("DEPLOY_SERVER_FRONTEND", default=f"{server_root}/ai-xsread-vue3/dist"),
        "server_api_path": args.server_api_path or _env("DEPLOY_SERVER_API", default=f"{server_root}/backend"),
        "server_pm2_config": args.server_pm2_config or _env("DEPLOY_SERVER_PM2_CONFIG", default=f"{server_root}/ecosystem.config.js"),
        "ssh_key_path": args.ssh_key or _env("DEPLOY_SSH_KEY", default=DEFAULT_SSH_KEY),
        "local_dist_path": args.local_dist_path or str(DEFAULT_LOCAL_DIST_PATH),
        "local_api_path": args.local_api_path or str(DEFAULT_LOCAL_API_PATH),
        "strict_host_key_checking": args.strict_host_key_checking,
        "frontend_preserve_files": frontend_preserve,
        "install_frontend_deps": args.install_frontend_deps,
        "skip_frontend_build": args.skip_frontend_build,
        "dry_run": args.dry_run,
        "allow_unsafe_remote_path": args.allow_unsafe_remote_path,
        "backend_pm2_name": args.backend_pm2_name
        or _env("DEPLOY_BACKEND_PM2_NAME", default=DEFAULT_BACKEND_PM2_NAME),
        "pm2_bin": args.pm2_bin or _env("DEPLOY_PM2_BIN", default="pm2"),
        "npm_bin": args.npm_bin or _env("DEPLOY_NPM_BIN", default="npm"),
        "backend_healthcheck_url": args.backend_healthcheck_url
        or _env("DEPLOY_BACKEND_HEALTHCHECK_URL", default=DEFAULT_BACKEND_HEALTHCHECK_URL),
        "backend_restart_cmd": args.backend_restart_cmd or _env("DEPLOY_BACKEND_RESTART_CMD", default=""),
        "frontend_healthcheck_host": args.frontend_healthcheck_host
        or _env("DEPLOY_FRONTEND_HEALTHCHECK_HOST", default=DEFAULT_FRONTEND_HEALTHCHECK_HOST),
    }


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="MOMO小说（AI-XsRead）一键部署脚本，目标站点：xs.momofx.cn",
    )
    parser.add_argument("--once", action="store_true", help="兼容参数：执行一次并退出")
    parser.add_argument("--watch", action="store_true", help="监控 dist 变化并自动部署前端")
    parser.add_argument("--frontend", action="store_true", help="只部署用户前端")
    parser.add_argument("--backend", action="store_true", help="只部署用户后端")
    parser.add_argument("--admin-frontend", dest="admin_frontend", action="store_true", help="只部署管理前端")
    parser.add_argument("--admin-backend", dest="admin_backend", action="store_true", help="只部署管理后端")
    parser.add_argument("--admin", action="store_true", help="部署管理前端 + 管理后端（等同于 --admin-frontend --admin-backend）")
    parser.add_argument("--images", action="store_true", help="优化并上传图片资源（封面/缩略图）")
    parser.add_argument("--all", action="store_true", help="部署用户前端+后端+图片（不含管理端）")
    parser.add_argument("--all-with-admin", dest="all_with_admin", action="store_true", help="部署用户端 + 管理端 + 图片（最完整）")
    parser.add_argument("--all-db", action="store_true", help="兼容参数：等同 --all")
    parser.add_argument("--db", action="store_true", help="兼容参数：当前不支持")
    parser.add_argument("--db-full", action="store_true", help="兼容参数：当前不支持")
    parser.add_argument("--db-force", action="store_true", help="兼容参数")
    # 服务器
    parser.add_argument("--server-host", dest="server_host", help=f"服务器 IP / 域名，默认 {DEFAULT_SERVER_HOST}")
    parser.add_argument("--server-user", dest="server_user", help=f"服务器用户，默认 {DEFAULT_SERVER_USER}")
    parser.add_argument("--server-port", dest="server_port", help=f"SSH 端口，默认 {DEFAULT_SERVER_PORT}")
    parser.add_argument("--server-root", dest="server_root", help=f"服务器站点根目录，默认 {DEFAULT_SERVER_ROOT}")
    parser.add_argument("--server-frontend-path", dest="server_frontend_path", help=f"服务器前端目录，默认 {DEFAULT_SERVER_FRONTEND_PATH}")
    parser.add_argument("--server-api-path", dest="server_api_path", help=f"服务器后端目录，默认 {DEFAULT_SERVER_API_PATH}")
    parser.add_argument("--server-pm2-config", dest="server_pm2_config", help=f"服务器 PM2 ecosystem 配置路径，默认 {DEFAULT_SERVER_PM2_CONFIG}")
    parser.add_argument("--ssh-key", dest="ssh_key", help="SSH 私钥路径")
    # 本地路径
    parser.add_argument("--local-dist-path", dest="local_dist_path", help="本地前端 dist 路径")
    parser.add_argument("--local-api-path", dest="local_api_path", help="本地后端路径")
    parser.add_argument(
        "--frontend-preserve",
        help="前端保留文件/目录，逗号分隔，默认 .htaccess,.user.ini,404.html,api,uploads,.well-known",
    )
    parser.add_argument("--strict-host-key-checking", choices=["yes", "no", "accept-new"], default="accept-new")
    parser.add_argument("--install-frontend-deps", action="store_true", help="部署前先 npm install")
    parser.add_argument("--skip-frontend-build", action="store_true", help="跳过 npm run build")
    # 后端
    parser.add_argument(
        "--backend-pm2-name",
        help=f"PM2 中的后端进程名，默认 {DEFAULT_BACKEND_PM2_NAME}",
    )
    parser.add_argument("--pm2-bin", help="远端 pm2 可执行路径，默认 pm2")
    parser.add_argument("--npm-bin", help="远端 npm 可执行路径，默认 npm")
    parser.add_argument(
        "--backend-healthcheck-url",
        help=f"后端健康检查地址，默认 {DEFAULT_BACKEND_HEALTHCHECK_URL}",
    )
    parser.add_argument(
        "--frontend-healthcheck-host",
        help=f"前端健康检查 Host 头，默认 {DEFAULT_FRONTEND_HEALTHCHECK_HOST}",
    )
    parser.add_argument("--backend-restart-cmd", help="自定义后端上传后执行的远程命令（覆盖默认 PM2 流程）")
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

    do_front = args.frontend or args.all or args.all_db or args.all_with_admin
    do_back = args.backend or args.all or args.all_db or args.all_with_admin
    do_images = args.images or args.all or args.all_db or args.all_with_admin
    do_admin_front = args.admin_frontend or args.admin or args.all_with_admin
    do_admin_back = args.admin_backend or args.admin or args.all_with_admin
    if not (do_front or do_back or do_images or do_admin_front or do_admin_back):
        do_front = True
        do_back = True

    logger.info(
        "目标站点：%s（站点根：%s，后端目录：%s）",
        config.get("server_host") or DEFAULT_SERVER_HOST,
        config.get("server_root") or DEFAULT_SERVER_ROOT,
        config.get("server_api_path") or f"{config.get('server_root') or DEFAULT_SERVER_ROOT}/backend",
    )

    ok = True
    if do_images:
        ok = upload_images(config) and ok
    if do_front:
        ok = upload_dist(config) and ok
    if do_back:
        ok = upload_api(config) and ok
    if do_admin_front:
        ok = upload_admin_dist(config) and ok
    if do_admin_back:
        ok = upload_admin_api(config) and ok
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
