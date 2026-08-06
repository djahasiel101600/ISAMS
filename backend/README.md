# ISAMS Backend (Django REST Framework)

Implements every endpoint consumed by the provided `api.ts` client, under `/api/v1/*`.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_demo      # optional: creates org-1 with sample data
python manage.py createsuperuser  # optional: for /admin/
python manage.py runserver
```

The API is served at `http://localhost:8000/api/v1/`.

## Response envelope

Matches `fetchJson<T>` in `api.ts`:

- Success: `{ "status": "ok", "data": <T> }` — the client unwraps `res.data`.
- Error: `{ "status": "error", "message": "..." }` with a non-2xx HTTP status.
- **Exception**: `GET /assets` returns a `PaginatedResult<Asset>` directly at the
  top level (`{ items, total, page, limit, total_pages }`), since `api.ts`'s
  `getAssets()` uses the raw `fetchJson` result rather than unwrapping `.data`.

## Endpoint map

| api.ts method | HTTP | Path |
|---|---|---|
| getOrganizations / createOrganization | GET / POST | `/organizations` |
| getUsers | GET | `/users?org_id=` |
| getCategories / createCategory | GET / POST | `/categories?org_id=` |
| getLocations / createLocation | GET / POST | `/locations?org_id=` |
| getLocationById | GET | `/locations/{id}` |
| getAssets | GET | `/assets?org_id=&search=&category_id=&status=&location_id=&page=&limit=&sort_by=&sort_dir=` |
| getAssetById | GET | `/assets/{id}` |
| getAssetByQrCode | GET | `/assets/qr/{qrCode}` |
| createAsset | POST | `/assets` |
| moveAsset | POST | `/assets/{id}/move` |
| checkOutAsset | POST | `/assets/{id}/check-out` |
| checkInAsset | POST | `/assets/{id}/check-in` |
| renderQrCode | GET | `/qr/render?text=` |
| getMovementHistory | GET | `/movement-history?org_id=` |
| getAuditLogs | GET | `/audit-logs?org_id=` |
| getDashboardMetrics | GET | `/dashboard/metrics?org_id=` |
| getRoomScans / createRoomScan | GET / POST | `/room-scans?org_id=` |
| getRoomScanById | GET | `/room-scans/{id}` |
| addAnchorToRoomScan | POST | `/room-scans/{id}/anchors` |
| deleteAnchorFromRoomScan | DELETE | `/room-scans/{id}/anchors/{anchorId}` |
| pairMobileSession | POST | `/room-scans/pair-session` |
| aiAnalyzeFrame | POST | `/room-scans/ai-analyze-frame` |
| getDbStatus | GET | `/db-integration/status?org_id=` |
| testDbConnection | POST | `/db-integration/test` |
| saveDbConfig | POST | `/db-integration/config?org_id=` |

## Notes on design decisions

- **IDs**: models use short prefixed string primary keys (e.g. `asset-3f9a1b2c9d`)
  rather than raw UUIDs/ints, generated server-side on save. This matches the
  string `id` fields implied throughout `api.ts`.
- **Locations & categories** are per-organization (`organization_id` FK)
  since every list/create call in `api.ts` is scoped by `org_id`.
- **LocationNode** uses `django-mptt` for efficient tree storage; `breadcrumbs`
  on `GET /locations/{id}` walks ancestors from root to the node's parent.
- **QR codes**: every `Asset` gets a unique `qr_code` generated on creation.
  `GET /qr/render?text=` renders *any* text (not just asset QR codes) to a
  base64 PNG data URL via the `qrcode` library, matching `renderQrCode`.
- **Audit logging**: asset create/move/check-out/check-in actions write an
  `AuditLog` row automatically.
- **AI analyze frame**: if `OPENAI_API_KEY` is unset, returns a stub response
  (`{ "stub": true, ... }`) instead of failing, so the AR frontend flow is
  testable without a live key.
- **DB integration**: `/db-integration/test` and `/config` attempt a real
  connection using `psycopg2` (Postgres) or `MySQLdb` (MySQL) when installed;
  otherwise it reports the missing driver rather than silently succeeding.
- **CORS** is wide open (`CORS_ALLOW_ALL_ORIGINS = True`) for local frontend
  development — tighten this for production.
- **Database**: SQLite by default; a commented Postgres block is in
  `settings.py` for production use.

## Admin

Django admin is enabled at `/admin/` for all models — useful for quickly
inspecting or editing data while building out the frontend.
