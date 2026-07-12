#!/usr/bin/env python3
import json
import sys
import traceback
from pathlib import Path

from markitdown._markitdown import MarkItDown


def log(msg: str) -> None:
    print(json.dumps({"jsonrpc": "2.0", "method": "log", "params": {"message": msg}}), file=sys.stderr, flush=True)


def send(data: dict) -> None:
    print(json.dumps(data), flush=True)


def handle_request(req: dict) -> dict | None:
    method = req.get("method")
    req_id = req.get("id")
    params = req.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "markitdown", "version": "0.0.2"},
            },
        }

    if method == "notifications/initialized":
        return None

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [
                    {
                        "name": "convert_to_markdown",
                        "description": "Convert a file (PDF, DOCX, PPTX, XLSX, HTML, CSV, JSON, XML, EPUB, images, audio) to Markdown using Microsoft MarkItDown.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "file_path": {
                                    "type": "string",
                                    "description": "Absolute path to the file to convert",
                                }
                            },
                            "required": ["file_path"],
                        },
                    }
                ]
            },
        }

    if method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        if tool_name == "convert_to_markdown":
            file_path = tool_args.get("file_path", "")
            p = Path(file_path)
            if not p.exists():
                result_text = f"Error: file not found: {file_path}"
            elif not p.is_file():
                result_text = f"Error: not a file: {file_path}"
            else:
                try:
                    md = MarkItDown()
                    result = md.convert(str(p))
                    result_text = result.text_content
                except Exception as e:
                    result_text = f"Error converting file: {e}"

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": result_text}]
                },
            }

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}]
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    return {"jsonrpc": "2.0", "id": req_id, "result": {}}


def main() -> None:
    md = MarkItDown()
    for line in sys.stdin:
        try:
            req = json.loads(line.strip())
        except json.JSONDecodeError:
            continue
        resp = handle_request(req)
        if resp is not None:
            send(resp)


if __name__ == "__main__":
    main()
