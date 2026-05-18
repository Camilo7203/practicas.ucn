import os
from datetime import datetime, timezone

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from mongoengine.connection import get_connection


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _service_name() -> str:
    return os.getenv("SERVICE_NAME", "loophack-api")


def _mongo_check() -> tuple[bool, str]:
    try:
        connection = get_connection()
        connection.admin.command("ping")
        return True, "ok"
    except Exception as error:
        return False, str(error)


def _response_payload(status: str, checks: dict) -> dict:
    return {
        "status": status,
        "service": _service_name(),
        "timestamp": _utc_timestamp(),
        "checks": checks,
    }


@csrf_exempt
@require_http_methods(["GET"])
def health_live(request):
    checks = {
        "process": {
            "status": "ok",
        }
    }
    return JsonResponse(_response_payload("ok", checks), status=200)


@csrf_exempt
@require_http_methods(["GET"])
def health_ready(request):
    mongo_ok, mongo_detail = _mongo_check()
    checks = {
        "process": {
            "status": "ok",
        },
        "mongo": {
            "status": "ok" if mongo_ok else "error",
            "detail": mongo_detail,
        },
    }

    status = 200 if mongo_ok else 503
    overall_status = "ok" if mongo_ok else "error"
    return JsonResponse(_response_payload(overall_status, checks), status=status)


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    return health_ready(request)
