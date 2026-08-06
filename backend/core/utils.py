import uuid
from typing import Any, Dict, Optional


def ensure_uuid_or_none(val: Any) -> Optional[str]:
    """Return string UUID if valid, otherwise None."""
    if not val:
        return None
    if isinstance(val, uuid.UUID):
        return str(val)
    try:
        # Accept either UUID strings or other strings
        u = uuid.UUID(str(val))
        return str(u)
    except Exception:
        return None


def sanitize_request_data(data: Any) -> Dict[str, Any]:
    """Normalize and sanitize incoming request payloads.

    - Converts QueryDict-like to plain dict
    - Removes placeholder tokens (like 'auto_create_default')
    - Normalizes location/organization keys to expected names
    """
    # Copy into a plain dict
    try:
        incoming = dict(data.copy()) if hasattr(data, 'copy') else dict(data)
    except Exception:
        incoming = dict(data) if isinstance(data, dict) else {}

    # Remove placeholder location tokens that are used on the frontend
    for k in list(incoming.keys()):
        v = incoming.get(k)
        if isinstance(v, str) and v.startswith('auto_create'):
            incoming.pop(k, None)

    # Normalize known aliases
    if 'current_location' in incoming and 'location_id' not in incoming:
        incoming['location_id'] = incoming.get('current_location')
    if 'organization' in incoming and 'organization_id' not in incoming:
        incoming['organization_id'] = incoming.get('organization')
    if 'category' in incoming and 'category_id' not in incoming:
        incoming['category_id'] = incoming.get('category')

    # Validate UUID-like fields and convert empty strings to None
    for fk in ('organization_id', 'location_id', 'category_id', 'parent_id'):
        if fk in incoming:
            val = incoming.get(fk)
            if val is None or val == '':
                incoming.pop(fk, None)
            else:
                # if invalid UUID, keep the raw value (validators will handle) but we attempted
                uu = ensure_uuid_or_none(val)
                if uu is None and isinstance(val, str) and val.startswith('pending_'):
                    # leave pending placeholders for client-side flows
                    pass
                elif uu is not None:
                    incoming[fk] = uu
                else:
                    # Not a valid UUID: remove so DRF doesn't choke
                    incoming.pop(fk, None)

    return incoming
