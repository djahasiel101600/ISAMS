import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isams_backend.settings')
import django
django.setup()
from core.models import LocationNode

for loc in LocationNode.objects.all():
    print(loc.id, loc.name, loc.type, loc.parent_id, loc.organization_id)
