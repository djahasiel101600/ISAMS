from django.core.management.base import BaseCommand

from core.models import Organization, User, AssetCategory, LocationNode, Asset


class Command(BaseCommand):
    help = "Seeds a demo organization (org-1) with users, categories, locations, and assets."

    def handle(self, *args, **options):
        org, _ = Organization.objects.update_or_create(
            id="org-1", defaults={"name": "Demo Organization"}
        )

        admin_user, _ = User.objects.get_or_create(
            organization=org, email="admin@example.com",
            defaults={"id": "user-admin", "name": "Alex Admin", "role": "admin"},
        )

        electronics, _ = AssetCategory.objects.get_or_create(
            organization=org, code="ELEC", defaults={"name": "Electronics", "id": "cat-elec"}
        )
        furniture, _ = AssetCategory.objects.get_or_create(
            organization=org, code="FURN", defaults={"name": "Furniture", "id": "cat-furn"}
        )

        hq, _ = LocationNode.objects.get_or_create(
            organization=org, code="HQ", defaults={"id": "loc-hq", "name": "Headquarters", "type": "site"}
        )
        floor1, _ = LocationNode.objects.get_or_create(
            organization=org, code="HQ-F1", parent=hq,
            defaults={"id": "loc-hq-f1", "name": "Floor 1", "type": "floor"},
        )
        room101, _ = LocationNode.objects.get_or_create(
            organization=org, code="HQ-F1-101", parent=floor1,
            defaults={"id": "loc-room-101", "name": "Room 101", "type": "room"},
        )

        if not Asset.objects.filter(organization=org).exists():
            Asset.objects.create(
                id="asset-demo-1",
                organization=org,
                title="Dell XPS 15 Laptop",
                category=electronics,
                location=room101,
                description="Development laptop",
                keywords="laptop, dell, xps",
                created_by_user_id=admin_user.id,
                created_by_user_name=admin_user.name,
            )
            Asset.objects.create(
                id="asset-demo-2",
                organization=org,
                title="Standing Desk",
                category=furniture,
                location=room101,
                description="Adjustable height desk",
                keywords="desk, furniture",
                created_by_user_id=admin_user.id,
                created_by_user_name=admin_user.name,
            )

        self.stdout.write(self.style.SUCCESS("Seeded demo data for org-1."))
