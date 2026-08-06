import uuid

from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


def gen_id(prefix):
    """Generate a short prefixed id, e.g. org-9f2c1a."""
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


class Organization(models.Model):
    id = models.CharField(primary_key=True, max_length=40, editable=False)
    name = models.CharField(max_length=255)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("org")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class User(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("staff", "Staff"),
        ("viewer", "Viewer"),
    ]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    organization = models.ForeignKey(Organization, related_name="users", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="staff")
    avatar_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("user")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class AssetCategory(models.Model):
    id = models.CharField(primary_key=True, max_length=40, editable=False)
    organization = models.ForeignKey(Organization, related_name="categories", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "asset categories"
        unique_together = ("organization", "code")

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("cat")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class LocationNode(MPTTModel):
    TYPE_CHOICES = [
        ("site", "Site"),
        ("building", "Building"),
        ("floor", "Floor"),
        ("room", "Room"),
        ("zone", "Zone"),
        ("shelf", "Shelf"),
        ("bin", "Bin"),
    ]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    organization = models.ForeignKey(Organization, related_name="locations", on_delete=models.CASCADE)
    parent = TreeForeignKey(
        "self", null=True, blank=True, related_name="children", on_delete=models.CASCADE
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="room")
    code = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    photo_url = models.URLField(blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class MPTTMeta:
        order_insertion_by = ["name"]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("loc")
        super().save(*args, **kwargs)

    def breadcrumbs(self):
        """Ancestors from root down to (excluding) self."""
        return list(self.get_ancestors(include_self=False))

    def __str__(self):
        return self.name


class Asset(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("checked_out", "Checked Out"),
        ("in_maintenance", "In Maintenance"),
        ("retired", "Retired"),
        ("lost", "Lost"),
    ]

    id = models.CharField(primary_key=True, max_length=40, editable=False)
    organization = models.ForeignKey(Organization, related_name="assets", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    category = models.ForeignKey(AssetCategory, related_name="assets", on_delete=models.PROTECT)
    location = models.ForeignKey(LocationNode, related_name="assets", on_delete=models.PROTECT)
    description = models.TextField(blank=True)
    keywords = models.CharField(max_length=500, blank=True)
    photos = models.JSONField(default=list, blank=True)
    qr_code = models.CharField(max_length=64, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")

    # Checkout tracking
    borrower_name = models.CharField(max_length=255, blank=True)
    due_date = models.DateField(null=True, blank=True)
    checkout_notes = models.TextField(blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)

    created_by_user_id = models.CharField(max_length=40, blank=True)
    created_by_user_name = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("asset")
        if not self.qr_code:
            self.qr_code = f"ISAMS-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class AssetLocationHistory(models.Model):
    id = models.CharField(primary_key=True, max_length=40, editable=False)
    asset = models.ForeignKey(Asset, related_name="location_history", on_delete=models.CASCADE)
    from_location = models.ForeignKey(
        LocationNode, related_name="+", null=True, blank=True, on_delete=models.SET_NULL
    )
    to_location = models.ForeignKey(LocationNode, related_name="+", on_delete=models.CASCADE)
    reason = models.CharField(max_length=500, blank=True)
    moved_by_user_id = models.CharField(max_length=40, blank=True)
    moved_by_user_name = models.CharField(max_length=255, blank=True)
    moved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "asset location histories"
        ordering = ["-moved_at"]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("hist")
        super().save(*args, **kwargs)


class AuditLog(models.Model):
    id = models.CharField(primary_key=True, max_length=40, editable=False)
    organization = models.ForeignKey(Organization, related_name="audit_logs", on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=40)
    user_id = models.CharField(max_length=40, blank=True)
    user_name = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("audit")
        super().save(*args, **kwargs)


class RoomScan(models.Model):
    id = models.CharField(primary_key=True, max_length=40, editable=False)
    organization = models.ForeignKey(Organization, related_name="room_scans", on_delete=models.CASCADE)
    room_name = models.CharField(max_length=255)
    location_path = models.CharField(max_length=500, blank=True)
    location = models.ForeignKey(
        LocationNode, related_name="room_scans", null=True, blank=True, on_delete=models.SET_NULL
    )
    background_image = models.TextField(blank=True)  # data URL or media path
    paired_device_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("scan")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.room_name


class RoomScanAnchor(models.Model):
    id = models.CharField(primary_key=True, max_length=40, editable=False)
    room_scan = models.ForeignKey(RoomScan, related_name="anchors", on_delete=models.CASCADE)
    asset = models.ForeignKey(
        Asset, related_name="room_scan_anchors", null=True, blank=True, on_delete=models.SET_NULL
    )
    label = models.CharField(max_length=255, blank=True)
    x = models.FloatField(default=0)
    y = models.FloatField(default=0)
    z = models.FloatField(default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = gen_id("anchor")
        super().save(*args, **kwargs)


class PairingSession(models.Model):
    """Short-lived pairing code used to link a mobile scanning session."""

    pair_code = models.CharField(primary_key=True, max_length=12, editable=False)
    organization = models.ForeignKey(
        Organization, related_name="pairing_sessions", null=True, blank=True, on_delete=models.CASCADE
    )
    is_claimed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.pair_code:
            self.pair_code = uuid.uuid4().hex[:6].upper()
        super().save(*args, **kwargs)


class DbIntegrationConfig(models.Model):
    """Stores external DB connection settings for the sync/integration feature."""

    organization = models.OneToOneField(
        Organization, related_name="db_integration", primary_key=True, on_delete=models.CASCADE
    )
    engine = models.CharField(max_length=50, blank=True)
    host = models.CharField(max_length=255, blank=True)
    port = models.CharField(max_length=10, blank=True)
    database = models.CharField(max_length=255, blank=True)
    username = models.CharField(max_length=255, blank=True)
    password = models.CharField(max_length=255, blank=True)
    extra = models.JSONField(default=dict, blank=True)

    is_connected = models.BooleanField(default=False)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    last_test_message = models.CharField(max_length=500, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
