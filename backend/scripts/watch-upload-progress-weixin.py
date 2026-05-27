#!/usr/bin/env python3
"""Watch the XSRead bulk uploader and notify Hermes Weixin after each batch."""

from __future__ import annotations

import json
import os
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path("/mnt/e/momo-ruanjiansheji/AI-XsRead")
LOG = REPO / ".qa-test-output/upload-all-remaining-novels.log"
ERR = REPO / ".qa-test-output/upload-all-remaining-novels.err.log"
STATE = REPO / ".qa-test-output/upload-all-remaining-novels.state.json"
PID_FILE = REPO / ".qa-test-output/upload-all-remaining-novels.pid"

WATCH_DIR = Path("/home/hermes/.hermes/upload-watch")
WATCH_STATE = WATCH_DIR / "xsread_upload_watch_state.json"
WATCH_PID = WATCH_DIR / "xsread_upload_watch.pid"
HERMES = "/home/hermes/apps/hermes-2/venv/bin/hermes"
TARGET = "weixin:o9cq80x4KnfF7O3BKqenA-x_2Xks@im.wechat"
WINDOWS_POWERSHELL = "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"

IDLE_SECONDS = 20 * 60
INTERVAL_SECONDS = 60
EVENT_RE = re.compile(r"\{\s*\n(?:.|\n)*?\n\}", re.M)
PROGRESS_EVENTS = {"batch_success", "batch_failed", "finish"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_events() -> list[dict]:
    if not LOG.exists():
        return []

    text = LOG.read_text(encoding="utf-8", errors="ignore")
    events: list[dict] = []
    for match in EVENT_RE.finditer(text):
        try:
            obj = json.loads(match.group(0))
        except Exception:
            continue
        if obj.get("event"):
            obj["_offset"] = match.end()
            events.append(obj)
    return events


def tail(path: Path, lines: int = 24) -> str:
    try:
        return "\n".join(path.read_text(encoding="utf-8", errors="ignore").splitlines()[-lines:])
    except Exception as exc:
        return f"读取失败: {exc}"


def pid_alive() -> tuple[bool, int | None]:
    try:
        pid = int(PID_FILE.read_text(encoding="ascii").strip())
    except Exception:
        return False, None

    # The uploader is started by Windows PowerShell, so the PID belongs to the
    # Windows process table. Check it through powershell.exe when running in WSL.
    try:
        result = subprocess.run(
            [
                WINDOWS_POWERSHELL if Path(WINDOWS_POWERSHELL).exists() else "powershell.exe",
                "-NoProfile",
                "-Command",
                f"if (Get-Process -Id {pid} -ErrorAction SilentlyContinue) {{ exit 0 }} else {{ exit 1 }}",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=10,
            check=False,
        )
        return result.returncode == 0, pid
    except Exception:
        pass

    try:
        os.kill(pid, 0)
        return True, pid
    except Exception:
        return False, pid


def send(message: str) -> None:
    try:
        subprocess.run(
            [HERMES, "send", "--to", TARGET, "--subject", "[MOMO小说上传进度]", message],
            cwd="/home/hermes/apps/hermes-2",
            text=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=8,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return


def fmt_titles(titles) -> str:
    return "\n".join(f"- {title}" for title in (titles or [])) or "- 未记录标题"


def state_summary():
    state = load_json(STATE, {})
    local_missing = state.get("localMissingCount", state.get("missingCount", "?"))
    production_missing = state.get("productionMissingCount", "?")
    current_target = state.get("currentTarget", "?")
    return state, current_target, local_missing, production_missing


def handle_once() -> bool:
    watch = load_json(
        WATCH_STATE,
        {
            "last_offset": 0,
            "last_progress_ts": None,
            "last_idle_notice_ts": None,
            "sent_terminal": False,
        },
    )
    events = read_events()
    last_offset = int(watch.get("last_offset") or 0)
    new_events = [event for event in events if int(event.get("_offset") or 0) > last_offset]

    if events:
        watch["last_offset"] = max(int(event.get("_offset") or 0) for event in events)

    for event in new_events:
        name = event.get("event")
        if name not in PROGRESS_EVENTS:
            continue

        watch["last_progress_ts"] = utc_now().isoformat()
        watch["last_idle_notice_ts"] = None
        _, current_target, local_missing, production_missing = state_summary()

        if name == "batch_success":
            target = event.get("target", current_target)
            titles = event.get("titles") or []
            send(
                f"完成一批上传：{target}\n"
                f"本批 {len(titles)} 本：\n{fmt_titles(titles)}\n\n"
                f"当前剩余：本地 {local_missing}，线上 {production_missing}。"
            )
        elif name == "batch_failed":
            send(
                f"上传批次失败：{event.get('target', current_target)}\n"
                f"退出码：{event.get('code')}\n"
                f"失败批次：\n{fmt_titles(event.get('titles') or [])}\n\n"
                f"错误日志尾部：\n{tail(ERR, 20)}"
            )
            watch["sent_terminal"] = True
            save_json(WATCH_STATE, watch)
            return False
        elif name == "finish":
            send(
                f"上传任务结束：{event.get('status')}\n"
                f"本地剩余：{event.get('localMissingCount')}\n"
                f"线上剩余：{event.get('productionMissingCount')}\n"
                f"完成时间：{event.get('finishedAt')}"
            )
            watch["sent_terminal"] = True
            save_json(WATCH_STATE, watch)
            return False

    alive, pid = pid_alive()
    state, current_target, local_missing, production_missing = state_summary()
    status = state.get("status")

    if status in {"complete", "failed", "partial"} and not watch.get("sent_terminal"):
        send(
            f"上传任务状态变为 {status}\n"
            f"本地剩余：{state.get('localMissingCount', local_missing)}\n"
            f"线上剩余：{state.get('productionMissingCount', production_missing)}\n"
            f"错误摘要：\n{tail(ERR, 16)}"
        )
        watch["sent_terminal"] = True
        save_json(WATCH_STATE, watch)
        return False

    if not alive and status != "running" and not watch.get("sent_terminal"):
        send(
            f"上传后台进程已退出，PID={pid}\n"
            f"当前状态：{status}\n"
            f"本地剩余：{local_missing}\n线上剩余：{production_missing}\n\n"
            f"最近日志：\n{tail(LOG, 18)}\n\n错误日志：\n{tail(ERR, 12)}"
        )
        watch["sent_terminal"] = True
        save_json(WATCH_STATE, watch)
        return False

    if not watch.get("last_progress_ts"):
        progress_events = [event for event in events if event.get("event") in PROGRESS_EVENTS]
        watch["last_progress_ts"] = utc_now().isoformat() if progress_events else utc_now().isoformat()

    try:
        last_dt = datetime.fromisoformat(watch["last_progress_ts"])
    except Exception:
        last_dt = utc_now()

    idle_seconds = (utc_now() - last_dt).total_seconds()
    if idle_seconds >= IDLE_SECONDS and not watch.get("last_idle_notice_ts"):
        send(
            "20 分钟没有新的上传批次进展。\n"
            f"当前目标：{current_target}\n"
            f"本地剩余：{local_missing}\n线上剩余：{production_missing}\n"
            f"后台进程：{'运行中' if alive else '已退出'} PID={pid}\n\n"
            f"最近日志：\n{tail(LOG, 24)}\n\n错误日志：\n{tail(ERR, 16)}"
        )
        watch["last_idle_notice_ts"] = utc_now().isoformat()

    save_json(WATCH_STATE, watch)
    return True


def main() -> None:
    WATCH_DIR.mkdir(parents=True, exist_ok=True)
    WATCH_PID.write_text(f"{os.getpid()}\n", encoding="ascii")
    if WATCH_STATE.exists():
        initial_watch = load_json(
            WATCH_STATE,
            {
                "last_offset": 0,
                "last_progress_ts": utc_now().isoformat(),
                "last_idle_notice_ts": None,
                "sent_terminal": False,
            },
        )
    else:
        events = read_events()
        progress_events = [event for event in events if event.get("event") in PROGRESS_EVENTS]
        last_event = progress_events[-1] if progress_events else None
        initial_watch = {
            "last_offset": max((int(event.get("_offset") or 0) for event in events), default=0),
            "last_progress_ts": last_event.get("ts") if last_event else utc_now().isoformat(),
            "last_idle_notice_ts": None,
            "sent_terminal": False,
        }
    initial_watch["watch_started_at"] = utc_now().isoformat()
    initial_watch["pid"] = os.getpid()
    save_json(WATCH_STATE, initial_watch)
    send("上传进度监控已启动。完成一批会提醒；20 分钟无进展会提醒；完成或失败会发最终通知并停止。")
    while True:
        if not handle_once():
            break
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
