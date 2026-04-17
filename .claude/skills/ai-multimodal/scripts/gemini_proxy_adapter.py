"""
gemini_proxy_adapter.py
Adapter that redirects generate/image calls to the local Gemini Web Proxy
instead of using GEMINI_API_KEY directly.

Used by: gemini_batch_process.py when GEMINI_PROXY_URL is set.

Usage:
  export GEMINI_PROXY_URL=http://localhost:7860
  python gemini_batch_process.py --task generate --prompt "..." --output out.png
"""
import os
import sys
import requests
import json
from pathlib import Path


PROXY_URL = os.environ.get("GEMINI_PROXY_URL", "http://localhost:7860")


def is_proxy_available() -> bool:
    """Check if the local proxy server is running."""
    try:
        resp = requests.get(f"{PROXY_URL}/health", timeout=3)
        data = resp.json()
        return data.get("status") == "ok"
    except Exception:
        return False


def check_proxy_auth() -> dict:
    """Check if proxy session is authenticated."""
    try:
        resp = requests.get(f"{PROXY_URL}/auth/check", timeout=10)
        return resp.json()
    except Exception as e:
        return {"authenticated": False, "error": str(e)}


def generate_image_via_proxy(prompt: str, output_path: str, aspect_ratio: str = "16:9") -> dict:
    """
    Generate image via local Gemini web proxy.
    Returns: {"success": bool, "imagePath": str, "error": str}
    """
    try:
        resp = requests.post(
            f"{PROXY_URL}/v1/generate/image",
            json={
                "prompt": prompt,
                "aspectRatio": aspect_ratio,
                "outputPath": str(Path(output_path).resolve()),
            },
            timeout=120,
        )
        return resp.json()
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": (
                "Cannot connect to Gemini proxy at " + PROXY_URL + "\n"
                "Start it with: node ~/.claude/skills/gemini-proxy/cli.js start\n"
                "Or login first: node ~/.claude/skills/gemini-proxy/cli.js login"
            ),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def generate_text_via_proxy(prompt: str) -> dict:
    """
    Generate text via local Gemini web proxy.
    Returns: {"success": bool, "text": str, "error": str}
    """
    try:
        resp = requests.post(
            f"{PROXY_URL}/v1/generate/text",
            json={"prompt": prompt},
            timeout=60,
        )
        data = resp.json()
        # Normalize to {success, text}
        if "candidates" in data:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"success": True, "text": text}
        return data
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": f"Cannot connect to proxy at {PROXY_URL}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def print_status():
    """Print proxy status for diagnostics."""
    print(f"\n🔌 Gemini Web Proxy Status")
    print(f"   URL: {PROXY_URL}")

    if is_proxy_available():
        print("   Server: ✅ Running")
        auth = check_proxy_auth()
        if auth.get("authenticated"):
            print("   Auth:   ✅ Logged in to Gemini Ultra")
        else:
            print(f"   Auth:   ❌ Not logged in — {auth.get('reason', '')}")
            print(f"\n   To login: node ~/.claude/skills/gemini-proxy/cli.js login")
    else:
        print("   Server: ❌ Not running")
        print(f"\n   To start: node ~/.claude/skills/gemini-proxy/cli.js start")
    print()


if __name__ == "__main__":
    print_status()
