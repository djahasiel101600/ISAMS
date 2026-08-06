from rest_framework import serializers

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
    DbIntegrationConfig,
)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "settings", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "organization", "name", "email", "role", "avatar_url", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = [
            "id", "organization", "name", "code", "description",
            "icon", "color", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LocationNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationNode
        fields = [
            "id", "organization", "parent", "type", "code", "name",
            "description", "photo_url", "capacity", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LocationBreadcrumbSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationNode
        fields = ["id", "type", "code", "name"]


class LocationDetailSerializer(LocationNodeSerializer):
    breadcrumbs = serializers.SerializerMethodField()

    class Meta(LocationNodeSerializer.Meta):
        fields = LocationNodeSerializer.Meta.fields + ["breadcrumbs"]

    def get_breadcrumbs(self, obj):
        return LocationBreadcrumbSerializer(obj.breadcrumbs(), many=True).data


class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id", "organization", "title", "category", "category_name",
            "location", "location_name", "description", "keywords", "photos",
            "qr_code", "status", "borrower_name", "due_date", "checkout_notes",
            "checked_out_at", "created_by_user_id", "created_by_user_name",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "qr_code", "status", "borrower_name", "due_date",
            "checkout_notes", "checked_out_at", "created_at", "updated_at",
        ]


class AssetCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(required=False, allow_blank=True, write_only=True)
    user_name = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Asset
        fields = [
            "title", "organization", "category", "location", "description",
            "keywords", "photos", "user_id", "user_name",
        ]
        extra_kwargs = {"organization": {"required": False}}

    def create(self, validated_data):
        user_id = validated_data.pop("user_id", "")
        user_name = validated_data.pop("user_name", "")
        validated_data["created_by_user_id"] = user_id
        validated_data["created_by_user_name"] = user_name
        return Asset.objects.create(**validated_data)


class AssetLocationHistorySerializer(serializers.ModelSerializer):
    asset_title = serializers.CharField(source="asset.title", read_only=True)
    from_location_name = serializers.CharField(source="from_location.name", read_only=True, default=None)
    to_location_name = serializers.CharField(source="to_location.name", read_only=True)

    class Meta:
        model = AssetLocationHistory
        fields = [
            "id", "asset", "asset_title", "from_location", "from_location_name",
            "to_location", "to_location_name", "reason",
            "moved_by_user_id", "moved_by_user_name", "moved_at",
        ]
        read_only_fields = fields


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "organization", "action", "entity_type", "entity_id",
            "user_id", "user_name", "details", "created_at",
        ]
        read_only_fields = fields


class RoomScanAnchorSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomScanAnchor
        fields = ["id", "room_scan", "asset", "label", "x", "y", "z", "metadata", "created_at"]
        read_only_fields = ["id", "room_scan", "created_at"]


class RoomScanSerializer(serializers.ModelSerializer):
    anchors = RoomScanAnchorSerializer(many=True, read_only=True)

    class Meta:
        model = RoomScan
        fields = [
            "id", "organization", "room_name", "location_path", "location",
            "background_image", "paired_device_name", "anchors",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DbIntegrationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DbIntegrationConfig
        fields = [
            "engine", "host", "port", "database", "username", "password",
            "extra", "is_connected", "last_tested_at", "last_test_message", "updated_at",
        ]
        read_only_fields = ["is_connected", "last_tested_at", "last_test_message", "updated_at"]
        extra_kwargs = {"password": {"write_only": True}}
