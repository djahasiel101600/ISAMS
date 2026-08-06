from datetime import timedelta

from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Organization,
    User,
    AssetCategory,
    LocationNode,
    Asset,
    AssetLocationHistory,
    AuditLog,
    RoomScan,
    RoomScanAnchor,
    PairingSession,
    DbIntegrationConfig,
)
from .serializers import (
    OrganizationSerializer,
    UserSerializer,
    AssetCategorySerializer,
    LocationNodeSerializer,
    LocationDetailSerializer,
    AssetSerializer,
    AssetCreateSerializer,
    AssetLocationHistorySerializer,
    AuditLogSerializer,
    RoomScanSerializer,
    RoomScanAnchorSerializer,
    DbIntegrationConfigSerializer,
)
from .utils import ok, qr_data_url, get_org_id


def log_action(org_id, action, entity_type, entity_id, user_id="", user_name="", details=None):
    AuditLog.objects.create(
        organization_id=org_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id or "",
        user_name=user_name or "",
        details=details or {},
    )


# ---------------------------------------------------------------- Organizations
class OrganizationListView(APIView):
    def get(self, request):
        qs = Organization.objects.all().order_by("name")
        return ok(OrganizationSerializer(qs, many=True).data)

    def post(self, request):
        serializer = OrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = serializer.save()
        return ok(OrganizationSerializer(org).data, status=201)


# ---------------------------------------------------------------- Users
class UserListView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        qs = User.objects.filter(organization_id=org_id).order_by("name")
        return ok(UserSerializer(qs, many=True).data)


# ---------------------------------------------------------------- Categories
class CategoryListView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        qs = AssetCategory.objects.filter(organization_id=org_id).order_by("name")
        return ok(AssetCategorySerializer(qs, many=True).data)

    def post(self, request):
        data = dict(request.data)
        data.setdefault("organization", get_org_id(request))
        serializer = AssetCategorySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        cat = serializer.save()
        return ok(AssetCategorySerializer(cat).data, status=201)


# ---------------------------------------------------------------- Locations
class LocationListView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        qs = LocationNode.objects.filter(organization_id=org_id).order_by("tree_id", "lft")
        return ok(LocationNodeSerializer(qs, many=True).data)

    def post(self, request):
        data = dict(request.data)
        data.setdefault("organization", get_org_id(request))
        serializer = LocationNodeSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        loc = serializer.save()
        return ok(LocationNodeSerializer(loc).data, status=201)


class LocationDetailView(APIView):
    def get(self, request, pk):
        loc = get_object_or_404(LocationNode, pk=pk)
        return ok(LocationDetailSerializer(loc).data)


# ---------------------------------------------------------------- Assets
class AssetListView(APIView):
    """
    GET returns a PaginatedResult<Asset> directly (no {data: ...} envelope),
    matching api.ts's getAssets(), which reads the fetchJson result as-is.
    """

    def get(self, request):
        org_id = get_org_id(request)
        qs = Asset.objects.filter(organization_id=org_id)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(keywords__icontains=search)
                | Q(qr_code__icontains=search)
            )

        category_id = request.query_params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)

        status_param = request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        location_id = request.query_params.get("location_id")
        if location_id:
            qs = qs.filter(location_id=location_id)

        sort_by = request.query_params.get("sort_by") or "created_at"
        sort_dir = request.query_params.get("sort_dir") or "desc"
        allowed_sort_fields = {"title", "created_at", "updated_at", "status"}
        if sort_by not in allowed_sort_fields:
            sort_by = "created_at"
        ordering = sort_by if sort_dir == "asc" else f"-{sort_by}"
        qs = qs.order_by(ordering)

        page = int(request.query_params.get("page") or 1)
        limit = int(request.query_params.get("limit") or 25)
        page = max(page, 1)
        limit = max(min(limit, 200), 1)

        total = qs.count()
        start = (page - 1) * limit
        items = qs[start:start + limit]

        total_pages = (total + limit - 1) // limit if total else 0

        return Response({
            "items": AssetSerializer(items, many=True).data,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        })

    def post(self, request):
        data = dict(request.data)
        data.setdefault("organization", get_org_id(request))
        serializer = AssetCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        asset = serializer.save()
        log_action(
            asset.organization_id, "create", "asset", asset.id,
            asset.created_by_user_id, asset.created_by_user_name,
            {"title": asset.title},
        )
        return ok(AssetSerializer(asset).data, status=201)


class AssetDetailView(APIView):
    def get(self, request, pk):
        asset = get_object_or_404(Asset, pk=pk)
        return ok(AssetSerializer(asset).data)


class AssetByQrView(APIView):
    def get(self, request, qr_code):
        asset = get_object_or_404(Asset, qr_code=qr_code)
        return ok(AssetSerializer(asset).data)


class AssetMoveView(APIView):
    def post(self, request, pk):
        asset = get_object_or_404(Asset, pk=pk)
        new_location_id = request.data.get("new_location_id")
        reason = request.data.get("reason", "")
        user_id = request.data.get("user_id", "")
        user_name = request.data.get("user_name", "")

        if not new_location_id:
            return Response(
                {"status": "error", "message": "new_location_id is required"}, status=400
            )
        new_location = get_object_or_404(LocationNode, pk=new_location_id)

        old_location = asset.location
        asset.location = new_location
        asset.save(update_fields=["location", "updated_at"])

        history = AssetLocationHistory.objects.create(
            asset=asset,
            from_location=old_location,
            to_location=new_location,
            reason=reason,
            moved_by_user_id=user_id,
            moved_by_user_name=user_name,
        )

        log_action(
            asset.organization_id, "move", "asset", asset.id, user_id, user_name,
            {
                "from": old_location.id if old_location else None,
                "to": new_location.id,
                "reason": reason,
            },
        )

        return ok({
            "asset": AssetSerializer(asset).data,
            "history": AssetLocationHistorySerializer(history).data,
        })


class AssetCheckOutView(APIView):
    def post(self, request, pk):
        asset = get_object_or_404(Asset, pk=pk)
        borrower_name = request.data.get("borrower_name")
        due_date = request.data.get("due_date")
        notes = request.data.get("notes", "")
        user_id = request.data.get("user_id", "")
        user_name = request.data.get("user_name", "")

        if not borrower_name:
            return Response({"status": "error", "message": "borrower_name is required"}, status=400)

        asset.status = "checked_out"
        asset.borrower_name = borrower_name
        asset.due_date = due_date
        asset.checkout_notes = notes
        asset.checked_out_at = timezone.now()
        asset.save(update_fields=[
            "status", "borrower_name", "due_date", "checkout_notes", "checked_out_at", "updated_at",
        ])

        log_action(
            asset.organization_id, "check_out", "asset", asset.id, user_id, user_name,
            {"borrower_name": borrower_name, "due_date": due_date},
        )

        return ok(AssetSerializer(asset).data)


class AssetCheckInView(APIView):
    def post(self, request, pk):
        asset = get_object_or_404(Asset, pk=pk)
        user_id = request.data.get("user_id", "")
        user_name = request.data.get("user_name", "")

        prior_borrower = asset.borrower_name
        asset.status = "available"
        asset.borrower_name = ""
        asset.due_date = None
        asset.checkout_notes = ""
        asset.checked_out_at = None
        asset.save(update_fields=[
            "status", "borrower_name", "due_date", "checkout_notes", "checked_out_at", "updated_at",
        ])

        log_action(
            asset.organization_id, "check_in", "asset", asset.id, user_id, user_name,
            {"previous_borrower": prior_borrower},
        )

        return ok(AssetSerializer(asset).data)


# ---------------------------------------------------------------- QR rendering
class QrRenderView(APIView):
    def get(self, request):
        text = request.query_params.get("text", "")
        if not text:
            return Response({"status": "error", "message": "text is required"}, status=400)
        return ok({"data_url": qr_data_url(text)})


# ---------------------------------------------------------------- History & audit
class MovementHistoryView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        qs = AssetLocationHistory.objects.filter(asset__organization_id=org_id).select_related(
            "asset", "from_location", "to_location"
        )
        return ok(AssetLocationHistorySerializer(qs, many=True).data)


class AuditLogListView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        qs = AuditLog.objects.filter(organization_id=org_id)
        return ok(AuditLogSerializer(qs, many=True).data)


# ---------------------------------------------------------------- Dashboard
class DashboardMetricsView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        assets = Asset.objects.filter(organization_id=org_id)

        total_assets = assets.count()
        by_status = dict(assets.values_list("status").annotate(count=Count("id")).order_by())
        by_category = list(
            assets.values("category_id", "category__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        overdue = assets.filter(
            status="checked_out", due_date__lt=timezone.now().date()
        ).count()

        recent_cutoff = timezone.now() - timedelta(days=7)
        recent_movements = AssetLocationHistory.objects.filter(
            asset__organization_id=org_id, moved_at__gte=recent_cutoff
        ).count()

        total_locations = LocationNode.objects.filter(organization_id=org_id).count()
        total_categories = AssetCategory.objects.filter(organization_id=org_id).count()
        total_users = User.objects.filter(organization_id=org_id).count()

        return ok({
            "total_assets": total_assets,
            "total_locations": total_locations,
            "total_categories": total_categories,
            "total_users": total_users,
            "assets_by_status": {
                "available": by_status.get("available", 0),
                "checked_out": by_status.get("checked_out", 0),
                "in_maintenance": by_status.get("in_maintenance", 0),
                "retired": by_status.get("retired", 0),
                "lost": by_status.get("lost", 0),
            },
            "assets_by_category": [
                {
                    "category_id": row["category_id"],
                    "category_name": row["category__name"],
                    "count": row["count"],
                }
                for row in by_category
            ],
            "overdue_checkouts": overdue,
            "recent_movements_7d": recent_movements,
        })


# ---------------------------------------------------------------- Room scans / AR
class RoomScanListView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        qs = RoomScan.objects.filter(organization_id=org_id).order_by("-created_at")
        return ok(RoomScanSerializer(qs, many=True).data)

    def post(self, request):
        data = dict(request.data)
        data.setdefault("organization", get_org_id(request))
        serializer = RoomScanSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        scan = serializer.save()
        return ok(RoomScanSerializer(scan).data, status=201)


class RoomScanDetailView(APIView):
    def get(self, request, pk):
        scan = get_object_or_404(RoomScan, pk=pk)
        return ok(RoomScanSerializer(scan).data)


class RoomScanAnchorListView(APIView):
    def post(self, request, pk):
        scan = get_object_or_404(RoomScan, pk=pk)
        data = dict(request.data)
        data["room_scan"] = scan.id
        serializer = RoomScanAnchorSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        anchor = serializer.save(room_scan=scan)
        return ok(RoomScanAnchorSerializer(anchor).data, status=201)


class RoomScanAnchorDetailView(APIView):
    def delete(self, request, pk, anchor_id):
        anchor = get_object_or_404(RoomScanAnchor, pk=anchor_id, room_scan_id=pk)
        anchor.delete()
        return Response(status=204)


class PairMobileSessionView(APIView):
    def post(self, request):
        org_id = request.data.get("organization_id")
        session = PairingSession.objects.create(
            organization_id=org_id,
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        pair_url = f"{request.scheme}://{request.get_host()}/pair/{session.pair_code}"
        return ok({"pair_code": session.pair_code, "pair_url": pair_url})


class AiAnalyzeFrameView(APIView):
    """
    Analyzes a captured AR frame. Uses OpenAI's vision API when
    OPENAI_API_KEY is configured, otherwise returns a clearly-marked stub
    so the frontend can still be developed against a predictable shape.
    """

    def post(self, request):
        from django.conf import settings as dj_settings

        image_base64 = request.data.get("image_base64")

        if not dj_settings.OPENAI_API_KEY:
            return ok({
                "stub": True,
                "message": "OPENAI_API_KEY is not configured on the server.",
                "detected_objects": [],
                "suggested_labels": [],
            })

        if not image_base64:
            return Response({"status": "error", "message": "image_base64 is required"}, status=400)

        try:
            from openai import OpenAI

            client = OpenAI(api_key=dj_settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Identify distinct physical objects visible in this frame that "
                                "could be tracked as inventory assets. Respond with a short "
                                "comma-separated list of object names only."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                        },
                    ],
                }],
                max_tokens=200,
            )
            text = response.choices[0].message.content or ""
            labels = [s.strip() for s in text.split(",") if s.strip()]
            return ok({"stub": False, "detected_objects": labels, "suggested_labels": labels})
        except Exception as exc:  # noqa: BLE001
            return Response({"status": "error", "message": f"AI analysis failed: {exc}"}, status=502)


# ---------------------------------------------------------------- DB integration
class DbIntegrationStatusView(APIView):
    def get(self, request):
        org_id = get_org_id(request)
        config = DbIntegrationConfig.objects.filter(organization_id=org_id).first()
        if not config:
            return ok({"configured": False, "is_connected": False})
        data = DbIntegrationConfigSerializer(config).data
        data["configured"] = True
        return ok(data)


class DbIntegrationTestView(APIView):
    def post(self, request):
        """
        Attempts a real connection when psycopg2/mysqlclient etc. are
        available for the requested engine; otherwise validates the shape
        of the config and reports what's missing.
        """
        engine = request.data.get("engine", "")
        host = request.data.get("host", "")
        database = request.data.get("database", "")

        missing = [f for f in ("engine", "host", "database") if not request.data.get(f)]
        if missing:
            return ok({"success": False, "message": f"Missing required fields: {', '.join(missing)}"})

        success, message = _test_db_connection(request.data)
        return ok({"success": success, "message": message})


def _test_db_connection(config):
    engine = (config.get("engine") or "").lower()
    host = config.get("host")
    port = config.get("port")
    database = config.get("database")
    username = config.get("username")
    password = config.get("password")

    try:
        if engine in ("postgres", "postgresql"):
            import psycopg2

            conn = psycopg2.connect(
                host=host, port=port or 5432, dbname=database,
                user=username, password=password, connect_timeout=5,
            )
            conn.close()
            return True, "Connected successfully"
        elif engine in ("mysql", "mariadb"):
            import MySQLdb

            conn = MySQLdb.connect(
                host=host, port=int(port or 3306), db=database,
                user=username, passwd=password, connect_timeout=5,
            )
            conn.close()
            return True, "Connected successfully"
        else:
            return False, f"Unsupported engine '{engine}'. Supported: postgres, mysql."
    except ModuleNotFoundError as exc:
        return False, f"Driver not installed on server for engine '{engine}': {exc}"
    except Exception as exc:  # noqa: BLE001
        return False, f"Connection failed: {exc}"


class DbIntegrationConfigView(APIView):
    def post(self, request):
        org_id = get_org_id(request)
        config, _ = DbIntegrationConfig.objects.get_or_create(organization_id=org_id)
        serializer = DbIntegrationConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        config = serializer.save()

        success, message = _test_db_connection(request.data)
        config.is_connected = success
        config.last_test_message = message
        config.last_tested_at = timezone.now()
        config.save(update_fields=["is_connected", "last_test_message", "last_tested_at"])

        data = DbIntegrationConfigSerializer(config).data
        data["configured"] = True
        return ok(data)
