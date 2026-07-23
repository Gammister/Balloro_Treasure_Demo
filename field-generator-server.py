#!/usr/bin/env python3
"""Serve Balloro Treasure and persist field-generator configurations locally."""

from __future__ import annotations

import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
STORE_PATH = ROOT / "math" / "field-generator-store.json"
API_PATH = "/api/field-generator-store"
MAX_STORE_BYTES = 2 * 1024 * 1024


def empty_store() -> dict:
    return {
        "version": 2,
        "nextId": 1,
        "selectedLine": 5,
        "layouts": {},
        "configurations": [],
    }


def configuration_signature(snapshot: dict) -> str:
    return json.dumps(snapshot.get("layouts", {}), sort_keys=True, separators=(",", ":"))


def merge_stores(existing: dict, incoming: dict) -> dict:
    merged = dict(incoming)
    configurations = [dict(item) for item in existing.get("configurations", []) if isinstance(item, dict)]
    used_ids = {
        item.get("id") for item in configurations
        if isinstance(item.get("id"), int) and item["id"] > 0
    }
    next_id = max(
        [1, existing.get("nextId", 1), incoming.get("nextId", 1), *(used_ids or {0})]
    )

    for snapshot in incoming.get("configurations", []):
        if not isinstance(snapshot, dict):
            continue
        snapshot_id = snapshot.get("id")
        if not isinstance(snapshot_id, int) or snapshot_id < 1:
            continue
        same_id = next((item for item in configurations if item.get("id") == snapshot_id), None)
        if same_id is None:
            configurations.append(dict(snapshot))
            used_ids.add(snapshot_id)
            continue
        if configuration_signature(same_id) == configuration_signature(snapshot):
            continue
        while next_id in used_ids:
            next_id += 1
        reassigned = dict(snapshot)
        reassigned["id"] = next_id
        configurations.append(reassigned)
        used_ids.add(next_id)
        next_id += 1

    configurations.sort(key=lambda item: item.get("id", 0))
    highest_id = max((item.get("id", 0) for item in configurations), default=0)
    merged["version"] = 2
    merged["configurations"] = configurations
    merged["nextId"] = max(next_id, highest_id + 1)
    return merged


class BalloroRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        if urlparse(self.path).path != API_PATH:
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if urlparse(self.path).path != API_PATH:
            super().do_GET()
            return
        try:
            payload = json.loads(STORE_PATH.read_text(encoding="utf-8")) if STORE_PATH.exists() else empty_store()
            self.send_json(payload)
        except (OSError, json.JSONDecodeError):
            self.send_json({"error": "Configuration store is unavailable"}, 500)

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path != API_PATH:
            self.send_json({"error": "Unknown endpoint"}, 404)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json({"error": "Invalid content length"}, 400)
            return
        if content_length <= 0 or content_length > MAX_STORE_BYTES:
            self.send_json({"error": "Invalid store size"}, 413)
            return
        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json({"error": "Invalid JSON"}, 400)
            return
        if not isinstance(payload, dict) or not isinstance(payload.get("configurations"), list):
            self.send_json({"error": "Invalid configuration store"}, 400)
            return

        STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = STORE_PATH.with_suffix(".json.tmp")
        try:
            existing = json.loads(STORE_PATH.read_text(encoding="utf-8")) if STORE_PATH.exists() else empty_store()
            payload = merge_stores(existing, payload)
            temporary_path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            os.replace(temporary_path, STORE_PATH)
        except OSError:
            self.send_json({"error": "Unable to save configuration store"}, 500)
            return
        self.send_json({"saved": True, "configurationCount": len(payload["configurations"])})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8768)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), BalloroRequestHandler)
    print(f"Balloro Treasure: http://127.0.0.1:{args.port}/index.html", flush=True)
    print(f"Field generator: http://127.0.0.1:{args.port}/field-generator.html", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
