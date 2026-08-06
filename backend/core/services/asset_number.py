import uuid
from datetime import datetime


def generate_asset_number(org_id: str) -> str:
    """Generate a human-friendly asset number.

    Format: AST-YYYY-XXXX where XXXX is derived from UUID.
    """
    ts = datetime.utcnow().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"AST-{ts}-{suffix}"


def reserve_asset_number(org_id: str) -> str:
    """Reserve an asset number atomically.

    Placeholder: real implementation should use DB transaction/row lock.
    """
    return generate_asset_number(org_id)
