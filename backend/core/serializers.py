import uuid

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
    RoomAnchor,
)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'code', 'address', 'contact_email', 'contact_phone', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', queryset=Organization.objects.all())

    class Meta:
        model = User
        fields = ['id', 'organization_id', 'name', 'email', 'role', 'permissions', 'department', 'avatar_url', 'created_at', 'updated_at']

    def create(self, validated_data):
        if 'permissions' not in validated_data or not validated_data['permissions']:
            validated_data['permissions'] = self._default_permissions(validated_data.get('role', 'Viewer'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'permissions' not in validated_data or not validated_data['permissions']:
            validated_data['permissions'] = self._default_permissions(validated_data.get('role', instance.role))
        return super().update(instance, validated_data)

    def _default_permissions(self, role):
        if role == 'Administrator':
            return {
                'can_manage_organization': True,
                'can_manage_locations': True,
                'can_register_assets': True,
                'can_edit_assets': True,
                'can_move_assets': True,
                'can_check_out_in': True,
                'can_archive_delete': True,
                'can_view_audit_logs': True,
                'can_export_reports': True,
                'can_manage_users': True,
                'can_configure_db': True,
                'can_ar_scan': True,
            }
        if role == 'Viewer':
            return {
                'can_manage_organization': False,
                'can_manage_locations': False,
                'can_register_assets': False,
                'can_edit_assets': False,
                'can_move_assets': False,
                'can_check_out_in': False,
                'can_archive_delete': False,
                'can_view_audit_logs': True,
                'can_export_reports': True,
                'can_manage_users': False,
                'can_configure_db': False,
                'can_ar_scan': False,
            }
        return {
            'can_manage_organization': False,
            'can_manage_locations': True,
            'can_register_assets': True,
            'can_edit_assets': True,
            'can_move_assets': True,
            'can_check_out_in': True,
            'can_archive_delete': False,
            'can_view_audit_logs': False,
            'can_export_reports': True,
            'can_manage_users': False,
            'can_configure_db': False,
            'can_ar_scan': True,
        }


class AssetCategorySerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', queryset=Organization.objects.all())
    parent_category_id = serializers.PrimaryKeyRelatedField(
        source='parent_category', queryset=AssetCategory.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = AssetCategory
        fields = ['id', 'organization_id', 'name', 'code', 'icon_name', 'color', 'description', 'parent_category_id', 'created_at', 'updated_at']


class LocationNodeBreadcrumbSerializer(serializers.ModelSerializer):
    parent_id = serializers.SerializerMethodField()

    class Meta:
        model = LocationNode
        fields = ['id', 'name', 'type', 'code', 'parent_id']

    def get_parent_id(self, obj):
        return str(obj.parent.id) if obj.parent else None


class LocationNodeSerializer(serializers.ModelSerializer):
    organization = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all(), write_only=True, required=False)
    organization_id = serializers.SerializerMethodField()
    parent = serializers.PrimaryKeyRelatedField(queryset=LocationNode.objects.all(), allow_null=True, required=False, write_only=True)
    parent_id = serializers.SerializerMethodField()
    qr_code = serializers.CharField(required=False, allow_blank=True)
    breadcrumbs = serializers.SerializerMethodField()

    class Meta:
        model = LocationNode
        fields = [
            'id', 'organization', 'organization_id', 'parent', 'parent_id', 'type', 'code', 'name', 'description', 'photo_url', 'capacity',
            'current_occupancy', 'qr_code', 'is_deleted', 'created_at', 'updated_at', 'breadcrumbs',
        ]

    def get_organization_id(self, obj):
        return str(obj.organization.id) if obj.organization else None

    def get_parent_id(self, obj):
        return str(obj.parent.id) if obj.parent else None

    def get_breadcrumbs(self, obj):
        path = []
        parent = obj.parent
        while parent is not None:
            path.insert(0, parent)
            parent = parent.parent
        return LocationNodeBreadcrumbSerializer(path, many=True).data

    def create(self, validated_data):
        if not validated_data.get('qr_code'):
            validated_data['qr_code'] = f'LOC-{uuid.uuid4().hex[:10].upper()}'
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'qr_code' in validated_data and not validated_data['qr_code']:
            validated_data.pop('qr_code')
        return super().update(instance, validated_data)


class AssetSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', queryset=Organization.objects.all(), required=False)
    organization = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all(), write_only=True, required=False)
    category_id = serializers.PrimaryKeyRelatedField(source='category', queryset=AssetCategory.objects.all(), allow_null=True, required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=AssetCategory.objects.all(), write_only=True, allow_null=True, required=False)
    location_id = serializers.PrimaryKeyRelatedField(source='current_location', queryset=LocationNode.objects.all(), allow_null=True, required=False)
    current_location = serializers.PrimaryKeyRelatedField(queryset=LocationNode.objects.all(), write_only=True, allow_null=True, required=False)
    asset_number = serializers.CharField(required=False, allow_blank=True)
    qr_code = serializers.CharField(required=False, allow_blank=True)
    category_name = serializers.SerializerMethodField()
    location_path_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = [
            'id', 'organization_id', 'organization', 'category_id', 'category', 'location_id', 'current_location',
            'category_name', 'location_path_formatted', 'asset_number', 'title', 'description', 'keywords', 'barcode', 'qr_code', 'status',
            'checked_out_to', 'checked_out_by_user_id', 'checked_out_at', 'due_date', 'notes',
            'photos', 'documents', 'created_by', 'updated_by', 'created_at', 'updated_at', 'is_deleted',
        ]

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''

    def get_location_path_formatted(self, obj):
        return obj.current_location.get_path() if obj.current_location else ''

    def create(self, validated_data):
        if not validated_data.get('asset_number'):
            validated_data['asset_number'] = f'AST-{uuid.uuid4().hex[:10].upper()}'
        if not validated_data.get('qr_code'):
            validated_data['qr_code'] = f'AST-{uuid.uuid4().hex[:10].upper()}'
        return super().create(validated_data)


class AssetLocationHistorySerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', queryset=Organization.objects.all())
    asset_id = serializers.PrimaryKeyRelatedField(source='asset', queryset=Asset.objects.all())
    from_location_id = serializers.SerializerMethodField()
    to_location_id = serializers.SerializerMethodField()

    class Meta:
        model = AssetLocationHistory
        fields = [
            'id', 'organization_id', 'asset_id', 'asset_number', 'asset_title', 'from_location_id',
            'from_location_path', 'to_location_id', 'to_location_path', 'moved_by_user_id',
            'moved_by_user_name', 'reason', 'created_at', 'updated_at',
        ]

    def get_from_location_id(self, obj):
        return str(obj.from_location.id) if obj.from_location else None

    def get_to_location_id(self, obj):
        return str(obj.to_location.id) if obj.to_location else None


class AuditLogSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', queryset=Organization.objects.all())

    class Meta:
        model = AuditLog
        fields = [
            'id', 'organization_id', 'user_id', 'user_name', 'user_role', 'action',
            'entity_type', 'entity_id', 'details', 'ip_address', 'created_at',
        ]


class RoomAnchorSerializer(serializers.ModelSerializer):
    location_id = serializers.CharField(allow_blank=True, required=False)
    associated_asset_id = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    color = serializers.CharField(allow_blank=True, required=False)
    created_by = serializers.CharField(allow_blank=True, required=False)
    notes = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = RoomAnchor
        fields = [
            'id', 'location_id', 'x', 'y', 'z_depth', 'title', 'area_type', 'documents',
            'associated_asset_id', 'color', 'created_by', 'notes', 'created_at', 'updated_at',
        ]


class RoomScanSerializer(serializers.ModelSerializer):
    organization_id = serializers.PrimaryKeyRelatedField(source='organization', queryset=Organization.objects.all())
    location_id = serializers.PrimaryKeyRelatedField(source='location', queryset=LocationNode.objects.all(), allow_null=True, required=False)
    anchors = RoomAnchorSerializer(many=True, read_only=True)

    class Meta:
        model = RoomScan
        fields = [
            'id', 'organization_id', 'room_name', 'location_path', 'location_id', 'background_image',
            'paired_device_connected', 'paired_device_name', 'created_at', 'updated_at', 'anchors',
        ]


class DashboardMetricsSerializer(serializers.Serializer):
    total_assets = serializers.IntegerField()
    available_assets = serializers.IntegerField()
    checked_out_assets = serializers.IntegerField()
    in_transit_assets = serializers.IntegerField()
    missing_assets = serializers.IntegerField()
    total_buildings = serializers.IntegerField()
    total_rooms = serializers.IntegerField()
    total_storage_units = serializers.IntegerField()
    avg_occupancy_rate = serializers.FloatField()
    recent_moves = AssetLocationHistorySerializer(many=True)
    recent_activities = AuditLogSerializer(many=True)
    top_categories = serializers.ListField(child=serializers.DictField())
