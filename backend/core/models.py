import uuid
from django.db import models


def default_uuid():
    return str(uuid.uuid4())


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


ROLE_CHOICES = [
    ('Administrator', 'Administrator'),
    ('Records Officer', 'Records Officer'),
    ('Inventory Manager', 'Inventory Manager'),
    ('Department Head', 'Department Head'),
    ('Staff', 'Staff'),
    ('Viewer', 'Viewer'),
]

LOCATION_TYPES = [
    ('building', 'building'),
    ('floor', 'floor'),
    ('room', 'room'),
    ('storage_unit', 'storage_unit'),
    ('compartment', 'compartment'),
    ('container', 'container'),
]

ASSET_STATUSES = [
    ('available', 'available'),
    ('checked_out', 'checked_out'),
    ('in_transit', 'in_transit'),
    ('maintenance', 'maintenance'),
    ('missing', 'missing'),
    ('archived', 'archived'),
]

AUDIT_ACTIONS = [
    ('created', 'created'),
    ('updated', 'updated'),
    ('moved', 'moved'),
    ('deleted', 'deleted'),
    ('checked_out', 'checked_out'),
    ('checked_in', 'checked_in'),
    ('viewed', 'viewed'),
    ('printed', 'printed'),
    ('qr_scanned', 'qr_scanned'),
    ('exported', 'exported'),
    ('login', 'login'),
]

ENTITY_TYPES = [
    ('asset', 'asset'),
    ('location', 'location'),
    ('organization', 'organization'),
    ('user', 'user'),
    ('category', 'category'),
    ('report', 'report'),
]

AREA_TYPES = [
    ('shelf', 'shelf'),
    ('drawer', 'drawer'),
    ('box', 'box'),
    ('cabinet', 'cabinet'),
    ('desk', 'desk'),
    ('vault', 'vault'),
    ('equipment', 'equipment'),
]


class Organization(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, unique=True)
    address = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return self.name


class User(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users')
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='Viewer')
    permissions = models.JSONField(default=dict, blank=True)
    department = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True)

    def __str__(self):
        return self.name


class AssetCategory(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64)
    icon_name = models.CharField(max_length=64, blank=True)
    color = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    parent_category = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children'
    )

    class Meta:
        unique_together = ('organization', 'code')

    def __str__(self):
        return self.name


class LocationNode(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='locations')
    parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children'
    )
    type = models.CharField(max_length=32, choices=LOCATION_TYPES)
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    photo_url = models.URLField(blank=True)
    capacity = models.PositiveIntegerField(default=100)
    current_occupancy = models.PositiveIntegerField(default=0)
    qr_code = models.CharField(max_length=128, unique=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('organization', 'code')

    def __str__(self):
        return self.name

    def get_path(self):
        parts = [self.name]
        node = self.parent
        while node is not None:
            parts.insert(0, node.name)
            node = node.parent
        return ' > '.join(parts)


class Asset(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='assets')
    category = models.ForeignKey(AssetCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    current_location = models.ForeignKey(LocationNode, on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    asset_number = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    keywords = models.JSONField(default=list, blank=True)
    barcode = models.CharField(max_length=128, blank=True)
    qr_code = models.CharField(max_length=128, unique=True)
    status = models.CharField(max_length=32, choices=ASSET_STATUSES, default='available')
    checked_out_to = models.CharField(max_length=255, blank=True)
    checked_out_by_user_id = models.CharField(max_length=128, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)
    documents = models.JSONField(default=list, blank=True)
    created_by = models.CharField(max_length=255, blank=True)
    updated_by = models.CharField(max_length=255, blank=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.asset_number


class AssetLocationHistory(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='movement_history')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='location_history')
    asset_number = models.CharField(max_length=64)
    asset_title = models.CharField(max_length=255)
    from_location = models.ForeignKey(
        LocationNode, null=True, blank=True, on_delete=models.SET_NULL, related_name='+'
    )
    from_location_path = models.CharField(max_length=1024, blank=True)
    to_location = models.ForeignKey(LocationNode, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    to_location_path = models.CharField(max_length=1024, blank=True)
    moved_by_user_id = models.CharField(max_length=128, blank=True)
    moved_by_user_name = models.CharField(max_length=255, blank=True)
    reason = models.TextField(blank=True)

    def __str__(self):
        return f'Move {self.asset_number} at {self.created_at}'


class AuditLog(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='audit_logs')
    user_id = models.CharField(max_length=128, blank=True)
    user_name = models.CharField(max_length=255, blank=True)
    user_role = models.CharField(max_length=64, blank=True)
    action = models.CharField(max_length=32, choices=AUDIT_ACTIONS)
    entity_type = models.CharField(max_length=32, choices=ENTITY_TYPES)
    entity_id = models.CharField(max_length=128, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f'{self.action} by {self.user_name}'


class RoomScan(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='room_scans')
    room_name = models.CharField(max_length=255)
    location_path = models.CharField(max_length=1024, blank=True)
    location = models.ForeignKey(LocationNode, null=True, blank=True, on_delete=models.SET_NULL, related_name='room_scans')
    background_image = models.TextField(blank=True)
    panorama_images = models.JSONField(default=list, blank=True)
    paired_device_connected = models.BooleanField(default=False)
    paired_device_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.room_name


class RoomAnchor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_scan = models.ForeignKey(RoomScan, on_delete=models.CASCADE, related_name='anchors')
    location_id = models.CharField(max_length=128, blank=True)
    x = models.IntegerField()
    y = models.IntegerField()
    z_depth = models.FloatField(null=True, blank=True)
    title = models.CharField(max_length=255)
    area_type = models.CharField(max_length=32, choices=AREA_TYPES)
    documents = models.JSONField(default=list, blank=True)
    associated_asset_id = models.CharField(max_length=128, blank=True, null=True)
    color = models.CharField(max_length=64, blank=True)
    created_by = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
