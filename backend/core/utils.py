import base64
import io

import qrcode
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def ok(data, status=200):
    """Wrap payload in the {status, data} envelope api.ts expects."""
    return Response({"status": "ok", "data": data}, status=status)


def api_exception_handler(exc, context):
    """
    Ensures every error response matches api.ts's expectations:
    { status: 'error', message: '...' }
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        response = Response(
            {"status": "error", "message": str(exc) or "Internal server error"},
            status=500,
        )
        return response

    message = None
    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = str(response.data["detail"])
        else:
            # Field validation errors -> flatten into a readable message
            parts = []
            for field, errs in response.data.items():
                if isinstance(errs, list):
                    parts.append(f"{field}: {'; '.join(str(e) for e in errs)}")
                else:
                    parts.append(f"{field}: {errs}")
            message = " | ".join(parts)
    elif isinstance(response.data, list):
        message = "; ".join(str(e) for e in response.data)
    else:
        message = str(response.data)

    response.data = {"status": "error", "message": message or "Request failed"}
    return response


def qr_data_url(text: str) -> str:
    """Render a QR code for `text` and return it as a base64 PNG data URL."""
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def get_org_id(request, default="org-1"):
    return request.query_params.get("org_id") or request.data.get("organization_id") or default
