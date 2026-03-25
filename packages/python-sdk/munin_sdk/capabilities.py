from typing import Any


def supports_action(capabilities: dict[str, Any], action: str) -> bool:
    actions = capabilities.get("actions", {})
    core = actions.get("core", [])
    optional = actions.get("optional", [])
    return action in core or action in optional
