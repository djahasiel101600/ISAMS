from django.contrib import admin

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

admin.site.register(Organization)
admin.site.register(User)
admin.site.register(AssetCategory)
admin.site.register(LocationNode)
admin.site.register(Asset)
admin.site.register(AssetLocationHistory)
admin.site.register(AuditLog)
admin.site.register(RoomScan)
admin.site.register(RoomScanAnchor)
admin.site.register(PairingSession)
admin.site.register(DbIntegrationConfig)
