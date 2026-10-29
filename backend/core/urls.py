from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organizations', views.OrganizationViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'categories', views.AssetCategoryViewSet)
router.register(r'locations', views.LocationNodeViewSet)
router.register(r'assets', views.AssetViewSet)
router.register(r'room-scans', views.RoomScanViewSet, basename='roomscan')
router.register(r'system', views.SystemViewSet, basename='system')
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')
router.register(r'auth', views.AuthViewSet, basename='auth')

urlpatterns = [
    path('health', views.health_check, name='health'),
    path('', include(router.urls)),
    path('qr/render', views.QRView.as_view(), name='qr-render'),
    path('db-integration/status', views.DBIntegrationStatusView.as_view(), name='db-status'),
    path('db-integration/config', views.DBIntegrationConfigView.as_view(), name='db-config'),
    path('db-integration/test', views.DBIntegrationTestView.as_view(), name='db-test'),
    path('reports/export-csv', views.CSVExportView.as_view(), name='export-csv'),
    path('audit-logs', views.AuditLogListView.as_view(), name='audit-logs'),
    path('movement-history', views.MovementHistoryView.as_view(), name='movement-history'),
    path('documents/upload', views.DocumentUploadView.as_view(), name='document-upload'),
]
