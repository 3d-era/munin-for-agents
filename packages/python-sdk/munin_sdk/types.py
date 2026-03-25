from typing import Any, TypedDict


class MuninError(TypedDict, total=False):
    code: str
    message: str
    details: dict[str, Any]


class MuninResponse(TypedDict, total=False):
    ok: bool
    data: Any
    error: MuninError
    requestId: str
