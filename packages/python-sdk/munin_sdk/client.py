from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from .errors import MuninSdkError, MuninTransportError


@dataclass
class MuninClient:
    base_url: str
    api_key: str | None = None
    timeout_s: float = 15.0

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def capabilities(self) -> dict[str, Any]:
        url = f"{self.base_url.rstrip('/')}/api/mcp/capabilities"
        try:
            response = httpx.get(url, headers=self._headers(), timeout=self.timeout_s)
        except Exception as exc:  # noqa: BLE001
            raise MuninTransportError(str(exc)) from exc

        body = response.json()
        if not response.is_success or not body.get("ok"):
            error = body.get("error", {})
            raise MuninSdkError(
                error.get("code", "INTERNAL_ERROR"),
                error.get("message", "Failed to fetch capabilities"),
                error.get("details", {}),
            )
        return body.get("data", {})

    def invoke(self, project_id: str, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url.rstrip('/')}/api/mcp/action"
        body = {
            "action": action,
            "project": project_id,
            "payload": payload,
            "client": {"name": "munin-sdk-py", "version": "0.1.0"},
        }

        try:
            response = httpx.post(
                url,
                headers=self._headers(),
                json=body,
                timeout=self.timeout_s,
            )
        except Exception as exc:  # noqa: BLE001
            raise MuninTransportError(str(exc)) from exc

        data = response.json()
        if not response.is_success or not data.get("ok"):
            error = data.get("error", {})
            raise MuninSdkError(
                error.get("code", "INTERNAL_ERROR"),
                error.get("message", f"Action '{action}' failed"),
                error.get("details", {}),
            )
        return data
