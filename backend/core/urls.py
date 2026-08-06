from django.urls import path

from . import views

urlpatterns = [
    # Organizations
    path("organizations", views.OrganizationListView.as_view()),

    # Users
    path("users", views.UserListView.as_view()),

    # Categories
    path("categories", views.CategoryListView.as_view()),

    # Locations
    path("locations", views.LocationListView.as_view()),
    path("locations/<str:pk>", views.LocationDetailView.as_view()),

    # Assets
    path("assets", views.AssetListView.as_view()),
    path("assets/qr/<str:qr_code>", views.AssetByQrView.as_view()),
    path("assets/<str:pk>", views.AssetDetailView.as_view()),
    path("assets/<str:pk>/move", views.AssetMoveView.as_view()),
    path("assets/<str:pk>/check-out", views.AssetCheckOutView.as_view()),
    path("assets/<str:pk>/check-in", views.AssetCheckInView.as_view()),

    # QR rendering
    path("qr/render", views.QrRenderView.as_view()),

    # History & audit
    path("movement-history", views.MovementHistoryView.as_view()),
    path("audit-logs", views.AuditLogListView.as_view()),

    # Dashboard
    path("dashboard/metrics", views.DashboardMetricsView.as_view()),

    # Room scans / AR
    path("room-scans", views.RoomScanListView.as_view()),
    path("room-scans/pair-session", views.PairMobileSessionView.as_view()),
    path("room-scans/ai-analyze-frame", views.AiAnalyzeFrameView.as_view()),
    path("room-scans/<str:pk>", views.RoomScanDetailView.as_view()),
    path("room-scans/<str:pk>/anchors", views.RoomScanAnchorListView.as_view()),
    path("room-scans/<str:pk>/anchors/<str:anchor_id>", views.RoomScanAnchorDetailView.as_view()),

    # DB integration
    path("db-integration/status", views.DbIntegrationStatusView.as_view()),
    path("db-integration/test", views.DbIntegrationTestView.as_view()),
    path("db-integration/config", views.DbIntegrationConfigView.as_view()),
]
