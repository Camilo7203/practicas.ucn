import json
import logging
from datetime import datetime, timezone


_RESERVED_ATTRS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        extra_data = {
            key: value
            for key, value in record.__dict__.items()
            if key not in _RESERVED_ATTRS and not key.startswith("_")
        }
        if extra_data:
            payload["extra"] = extra_data

        return json.dumps(payload, ensure_ascii=False, default=str)


def get_request_log_context(request) -> dict:
    user_id = None
    organization_id = None
    if hasattr(request, "user") and getattr(request.user, "is_authenticated", False):
        user_id = str(getattr(request.user, "id", None) or "") or None
        organization = getattr(request.user, "organization", None)
        organization_id = str(getattr(organization, "id", None) or "") or None

    return {
        "request_id": request.headers.get("X-Request-ID") if hasattr(request, "headers") else None,
        "method": getattr(request, "method", None),
        "path": getattr(request, "path", None),
        "user_id": user_id,
        "organization_id": organization_id,
    }