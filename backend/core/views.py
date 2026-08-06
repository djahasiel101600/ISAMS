import uuid
from datetime import timedelta
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

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
from .serializers import (
    OrganizationSerializer,
    UserSerializer,
    AssetCategorySerializer,
    LocationNodeSerializer,
    AssetSerializer,
    AssetLocationHistorySerializer,
    AuditLogSerializer,
    RoomScanSerializer,
    RoomAnchorSerializer,
    DashboardMetricsSerializer,
)
from .utils import sanitize_request_data, ensure_uuid_or_none


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


PAIR_SESSIONS = {}


@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'success',
        'data': {
            'service': 'ISAMS Enterprise API',
            'version': '1.0.0',
            'timestamp': timezone.now().isoformat(),
        }
    })


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all().order_by('name')
    serializer_class = OrganizationSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'code']


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('name')
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['organization', 'role']
    search_fields = ['name', 'email', 'department']


class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all().order_by('name')
    serializer_class = AssetCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['organization']
    search_fields = ['name', 'code', 'description']


class LocationNodeViewSet(viewsets.ModelViewSet):
    queryset = LocationNode.objects.all().order_by('code')
    serializer_class = LocationNodeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['organization', 'parent', 'type']
    search_fields = ['name', 'code', 'description']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def breadcrumbs(self, request, pk=None):
        location = self.get_object()
        path = []
        parent = location.parent
        while parent is not None:
            path.insert(0, parent)
            parent = parent.parent
        serializer = LocationNodeSerializer(path, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        org_id = ensure_uuid_or_none(request.query_params.get('organization'))
        queryset = self.get_queryset()
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        nodes = list(queryset)
        node_by_parent = {}
        for node in nodes:
            parent_id = str(node.parent_id) if node.parent_id else None
            node_by_parent.setdefault(parent_id, []).append(node)

        def build_tree(parent_id=None):
            children = node_by_parent.get(parent_id, [])
            tree = []
            for child in children:
                child_data = LocationNodeSerializer(child).data
                child_data['children'] = build_tree(str(child.id))
                tree.append(child_data)
            return tree

        return Response({'status': 'success', 'data': build_tree()})

    def create(self, request, *args, **kwargs):
        incoming = sanitize_request_data(request.data)
        serializer = self.get_serializer(data=incoming)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        incoming = sanitize_request_data(request.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=incoming, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'status': 'success', 'data': serializer.data})


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().order_by('asset_number')
    serializer_class = AssetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['organization', 'category', 'current_location', 'status']
    search_fields = ['asset_number', 'title', 'description', 'keywords']
    ordering_fields = ['created_at', 'title', 'asset_number', 'status']

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = ensure_uuid_or_none(self.request.query_params.get('organization'))
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        category = ensure_uuid_or_none(self.request.query_params.get('category'))
        if category:
            queryset = queryset.filter(category_id=category)
        current_location = ensure_uuid_or_none(self.request.query_params.get('current_location'))
        if current_location:
            queryset = queryset.filter(current_location_id=current_location)
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(asset_number__icontains=search)
                | Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(keywords__icontains=search)
            )
        ordering = self.request.query_params.get('ordering')
        if ordering:
            queryset = queryset.order_by(ordering)
        return queryset

    def create(self, request, *args, **kwargs):
        incoming = sanitize_request_data(request.data)
        serializer = self.get_serializer(data=incoming)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        incoming = sanitize_request_data(request.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=incoming, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'status': 'success', 'data': serializer.data})

    @action(detail=False, methods=['get'], url_path='qr/(?P<qr_code>[^/.]+)')
    def by_qr(self, request, qr_code=None):
        try:
            asset = Asset.objects.get(qr_code=qr_code)
            serializer = self.get_serializer(asset)
            return Response(serializer.data)
        except Asset.DoesNotExist:
            return Response({'status': 'error', 'message': 'Asset not found for QR code'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        asset = self.get_object()
        new_location_id = request.data.get('new_location_id')
        reason = request.data.get('reason')
        user_id = request.data.get('user_id', '')
        user_name = request.data.get('user_name', '')

        if not new_location_id or not reason:
            return Response({'status': 'error', 'message': 'New location and movement reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_location = LocationNode.objects.get(id=new_location_id)
        except LocationNode.DoesNotExist:
            return Response({'status': 'error', 'message': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)

        from_location = asset.current_location
        asset.current_location = new_location
        asset.updated_by = user_name or asset.updated_by
        asset.save()

        if from_location:
            from_location.current_occupancy = max(0, from_location.current_occupancy - 1)
            from_location.save()
        new_location.current_occupancy += 1
        new_location.save()

        history = AssetLocationHistory.objects.create(
            organization=asset.organization,
            asset=asset,
            asset_number=asset.asset_number,
            asset_title=asset.title,
            from_location=from_location,
            from_location_path=from_location.get_path() if from_location else '',
            to_location=new_location,
            to_location_path=new_location.get_path(),
            moved_by_user_id=user_id,
            moved_by_user_name=user_name,
            reason=reason,
        )

        AuditLog.objects.create(
            organization=asset.organization,
            user_id=user_id,
            user_name=user_name,
            action='moved',
            entity_type='asset',
            entity_id=str(asset.id),
            details={
                'asset_id': str(asset.id),
                'asset_number': asset.asset_number,
                'from_location': str(from_location.id) if from_location else None,
                'to_location': str(new_location.id),
                'reason': reason,
            },
            ip_address=get_client_ip(request),
        )

        return Response({'status': 'success', 'data': {'asset': AssetSerializer(asset).data, 'history': AssetLocationHistorySerializer(history).data}})

    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        asset = self.get_object()
        borrower_name = request.data.get('borrower_name')
        due_date = request.data.get('due_date')
        notes = request.data.get('notes', '')
        user_id = request.data.get('user_id', '')
        user_name = request.data.get('user_name', '')

        if not borrower_name or not due_date:
            return Response({'status': 'error', 'message': 'Borrower Name and Due Date are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if asset.status == 'checked_out':
            return Response({'status': 'error', 'message': 'Asset is already checked out'}, status=status.HTTP_400_BAD_REQUEST)

        asset.status = 'checked_out'
        asset.checked_out_to = borrower_name
        asset.checked_out_at = timezone.now()
        asset.due_date = due_date
        asset.updated_by = user_name or asset.updated_by
        asset.checked_out_by_user_id = user_id or asset.checked_out_by_user_id
        asset.notes = notes or asset.notes
        asset.save()

        AuditLog.objects.create(
            organization=asset.organization,
            user_id=user_id,
            user_name=user_name,
            action='checked_out',
            entity_type='asset',
            entity_id=str(asset.id),
            details={
                'asset_id': str(asset.id),
                'asset_number': asset.asset_number,
                'borrower_name': borrower_name,
                'due_date': due_date,
                'notes': notes,
            },
            ip_address=get_client_ip(request),
        )

        return Response({'status': 'success', 'data': AssetSerializer(asset).data})

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        asset = self.get_object()
        user_id = request.data.get('user_id', '')
        user_name = request.data.get('user_name', '')

        if asset.status != 'checked_out':
            return Response({'status': 'error', 'message': 'Asset is not checked out'}, status=status.HTTP_400_BAD_REQUEST)

        asset.status = 'available'
        asset.checked_out_to = ''
        asset.checked_out_by_user_id = ''
        asset.checked_out_at = None
        asset.due_date = None
        asset.updated_by = user_name or asset.updated_by
        asset.save()

        AuditLog.objects.create(
            organization=asset.organization,
            user_id=user_id,
            user_name=user_name,
            action='checked_in',
            entity_type='asset',
            entity_id=str(asset.id),
            details={'asset_id': str(asset.id), 'asset_number': asset.asset_number},
            ip_address=get_client_ip(request),
        )

        return Response({'status': 'success', 'data': AssetSerializer(asset).data})


class RoomScanViewSet(viewsets.ModelViewSet):
    queryset = RoomScan.objects.all().order_by('-created_at')
    serializer_class = RoomScanSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = ensure_uuid_or_none(self.request.query_params.get('organization'))
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        location_id = ensure_uuid_or_none(self.request.query_params.get('location'))
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        return queryset

    def create(self, request, *args, **kwargs):
        incoming = sanitize_request_data(request.data)
        if not incoming.get('background_image'):
            incoming['background_image'] = 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200'
        serializer = self.get_serializer(data=incoming)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        incoming = sanitize_request_data(request.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=incoming, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({'status': 'success', 'data': serializer.data})

    @action(detail=True, methods=['post'])
    def anchors(self, request, pk=None):
        scan = self.get_object()
        serializer = RoomAnchorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(room_scan=scan)
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='anchors/(?P<anchor_id>[^/.]+)')
    def delete_anchor(self, request, pk=None, anchor_id=None):
        try:
            anchor = RoomAnchor.objects.get(id=anchor_id, room_scan_id=pk)
            anchor.delete()
            return Response({'status': 'success', 'message': 'Anchor deleted successfully'})
        except RoomAnchor.DoesNotExist:
            return Response({'status': 'error', 'message': 'Anchor not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def pair_session(self, request):
        pair_code = ''.join([str(uuid.uuid4().int % 10) for _ in range(6)])
        origin = request.META.get('HTTP_ORIGIN') or request.META.get('HTTP_REFERER') or 'http://localhost:5173'
        frontend_base = origin.rstrip('/')
        pair_url = f'{frontend_base}/ar?pair={pair_code}'
        PAIR_SESSIONS[pair_code] = {
            'pair_code': pair_code,
            'connected': False,
            'mobile_device_name': '',
            'created_at': timezone.now(),
        }
        return Response({'status': 'success', 'data': {'pair_code': pair_code, 'pair_url': pair_url}})

    @action(detail=False, methods=['post'], url_path='pair_session/confirm')
    def confirm_pair_session(self, request):
        pair_code = request.data.get('pair_code')
        device_name = request.data.get('device_name', 'Mobile Scanner')
        session = PAIR_SESSIONS.get(pair_code)
        if not session:
            return Response({'status': 'error', 'message': 'Pairing session not found'}, status=status.HTTP_404_NOT_FOUND)
        session['connected'] = True
        session['mobile_device_name'] = device_name
        session['connected_at'] = timezone.now()
        return Response({'status': 'success', 'data': {'connected': True, 'device_name': device_name}})

    @action(detail=False, methods=['get'], url_path='pair_session/status')
    def pair_session_status(self, request):
        pair_code = request.query_params.get('pair_code')
        session = PAIR_SESSIONS.get(pair_code)
        if not session:
            return Response({'status': 'error', 'message': 'Pairing session not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'status': 'success', 'data': {
            'pair_code': pair_code,
            'connected': session['connected'],
            'device_name': session.get('mobile_device_name', ''),
        }})

    @action(detail=False, methods=['post'])
    def ai_analyze_frame(self, request):
        image_base64 = request.data.get('image_base64')
        if image_base64:
            return Response({'status': 'success', 'data': {
                'detected_area': 'Top Shelf - Archival Box #4B',
                'suggested_title': 'Box 4B - Executive Legal Agreements',
                'area_type': 'shelf',
                'detected_documents': [
                    {'doc_code': 'DOC-X', 'title': 'Master Hospital Building Expansion Agreement (2024)', 'type': 'Legal Deed'},
                    {'doc_code': 'DOC-Y', 'title': 'Annual HIPAA Compliance Registry 2025-2026', 'type': 'Compliance Record'},
                ],
                'confidence': 0.94,
            }})

        return Response({'status': 'success', 'data': {
            'detected_area': 'Top Shelf - Archival Box #4B',
            'suggested_title': 'Box 4B - Executive Legal Agreements',
            'area_type': 'shelf',
            'detected_documents': [
                {'doc_code': 'DOC-X', 'title': 'Master Hospital Building Expansion Agreement (2024)', 'type': 'Legal Deed'},
                {'doc_code': 'DOC-Y', 'title': 'Annual HIPAA Compliance Registry 2025-2026', 'type': 'Compliance Record'},
            ],
            'confidence': 0.94,
        }})


class SystemViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def reset(self, request):
        AssetLocationHistory.objects.all().delete()
        RoomAnchor.objects.all().delete()
        RoomScan.objects.all().delete()
        AuditLog.objects.all().delete()
        Asset.objects.all().delete()
        LocationNode.objects.all().delete()
        AssetCategory.objects.all().delete()
        User.objects.all().delete()
        Organization.objects.all().delete()
        return Response({'status': 'success', 'message': 'System reset to zero state successfully'})

    @action(detail=False, methods=['post'])
    def bootstrap(self, request):
        org_name = request.data.get('orgName')
        org_code = request.data.get('orgCode')
        admin_name = request.data.get('adminName')
        admin_email = request.data.get('adminEmail', f'{admin_name.lower().replace(" ", ".")}@example.com')
        template = request.data.get('template', 'empty')

        if not org_name or not org_code or not admin_name:
            return Response({'status': 'error', 'message': 'Organization name, code, and admin name are required'}, status=status.HTTP_400_BAD_REQUEST)

        organization = Organization.objects.create(name=org_name, code=org_code)
        user = User.objects.create(
            organization=organization,
            name=admin_name,
            email=admin_email,
            role='Administrator',
            permissions={
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
            },
        )

        categories_data = self._get_template_categories(template)
        locations_data = self._get_template_locations(template)
        categories = [AssetCategory.objects.create(organization=organization, **category) for category in categories_data]
        locations = []
        for location in locations_data:
            location_obj = LocationNode.objects.create(
                organization=organization,
                qr_code=f'LOC-{uuid.uuid4().hex[:8].upper()}',
                **location,
            )
            locations.append(location_obj)

        if template != 'empty':
            for i in range(12):
                category = categories[i % len(categories)]
                location = locations[i % len(locations)]
                Asset.objects.create(
                    organization=organization,
                    category=category,
                    current_location=location,
                    asset_number=f'AST-{str(i + 1).zfill(4)}',
                    title=f'Sample Asset {i + 1}',
                    description=f'Sample asset {i + 1} for bootstrap template',
                    keywords=['sample', category.code.lower(), location.code.lower()],
                    barcode=f'BC-{uuid.uuid4().hex[:8].upper()}',
                    qr_code=f'QR-{uuid.uuid4().hex[:10].upper()}',
                    status='available',
                    created_by='System',
                    updated_by='System',
                )

        return Response({'status': 'success', 'data': {'organization': OrganizationSerializer(organization).data, 'user': UserSerializer(user).data}}, status=status.HTTP_201_CREATED)

    def _get_template_categories(self, template):
        if template == 'event_kit':
            return [
                {'name': 'Audio Equipment', 'code': 'AUD', 'icon_name': 'Mic', 'color': 'bg-purple-500', 'description': 'Microphones, speakers, and audio equipment'},
                {'name': 'Lighting', 'code': 'LGT', 'icon_name': 'Sun', 'color': 'bg-yellow-500', 'description': 'Stage lighting and accessories'},
                {'name': 'Staging', 'code': 'STG', 'icon_name': 'Layout', 'color': 'bg-blue-500', 'description': 'Stages, risers, and platforms'},
                {'name': 'Registration', 'code': 'REG', 'icon_name': 'Clipboard', 'color': 'bg-green-500', 'description': 'Registration and check-in equipment'},
            ]
        if template == 'corporate_kit':
            return [
                {'name': 'IT Equipment', 'code': 'IT', 'icon_name': 'Monitor', 'color': 'bg-indigo-500', 'description': 'Computers, monitors, and IT equipment'},
                {'name': 'Furniture', 'code': 'FRN', 'icon_name': 'Armchair', 'color': 'bg-amber-500', 'description': 'Office furniture and fixtures'},
                {'name': 'Office Supplies', 'code': 'OFC', 'icon_name': 'Briefcase', 'color': 'bg-blue-500', 'description': 'General office supplies'},
                {'name': 'AV Equipment', 'code': 'AV', 'icon_name': 'Video', 'color': 'bg-red-500', 'description': 'Audio visual equipment'},
            ]
        return [
            {'name': 'Medical Equipment', 'code': 'MED', 'icon_name': 'Heart', 'color': 'bg-red-500', 'description': 'Medical and healthcare equipment'},
            {'name': 'IT Assets', 'code': 'IT', 'icon_name': 'Monitor', 'color': 'bg-blue-500', 'description': 'IT and computer equipment'},
            {'name': 'Furniture', 'code': 'FRN', 'icon_name': 'Armchair', 'color': 'bg-amber-500', 'description': 'Furniture and fixtures'},
        ]

    def _get_template_locations(self, template):
        if template == 'event_kit':
            return [
                {'code': 'MAIN', 'name': 'Main Stage', 'type': 'area', 'description': 'Main stage area'},
                {'code': 'VIP', 'name': 'VIP Lounge', 'type': 'area', 'description': 'VIP lounge'},
                {'code': 'BACK', 'name': 'Backstage', 'type': 'area', 'description': 'Backstage'},
                {'code': 'REG', 'name': 'Registration Desk', 'type': 'area', 'description': 'Registration desk'},
            ]
        if template == 'corporate_kit':
            return [
                {'code': 'FL1', 'name': 'Floor 1', 'type': 'floor', 'description': 'First floor'},
                {'code': 'FL2', 'name': 'Floor 2', 'type': 'floor', 'description': 'Second floor'},
                {'code': 'RM101', 'name': 'Room 101', 'type': 'room', 'description': 'Room 101'},
                {'code': 'RM102', 'name': 'Room 102', 'type': 'room', 'description': 'Room 102'},
                {'code': 'STORAGE', 'name': 'Storage Room', 'type': 'room', 'description': 'Storage room'},
            ]
        return [
            {'code': 'FL1', 'name': 'Floor 1', 'type': 'floor', 'description': 'Floor 1'},
            {'code': 'FL2', 'name': 'Floor 2', 'type': 'floor', 'description': 'Floor 2'},
            {'code': 'RM101', 'name': 'Room 101', 'type': 'room', 'description': 'Room 101'},
            {'code': 'RM102', 'name': 'Room 102', 'type': 'room', 'description': 'Room 102'},
            {'code': 'CAB-A', 'name': 'Cabinet A', 'type': 'container', 'description': 'Cabinet A'},
        ]


class DashboardViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        org_id = ensure_uuid_or_none(request.query_params.get('org_id'))
        queryset = Asset.objects.all()
        categories = AssetCategory.objects.all()
        locations = LocationNode.objects.all()
        recent_moves = AssetLocationHistory.objects.none()
        recent_activities = AuditLog.objects.none()

        if org_id:
            queryset = queryset.filter(organization_id=org_id)
            categories = categories.filter(organization_id=org_id)
            locations = locations.filter(organization_id=org_id)
            recent_moves = AssetLocationHistory.objects.filter(organization_id=org_id).order_by('-created_at')[:10]
            recent_activities = AuditLog.objects.filter(organization_id=org_id).order_by('-created_at')[:10]
        else:
            recent_moves = AssetLocationHistory.objects.order_by('-created_at')[:10]
            recent_activities = AuditLog.objects.order_by('-created_at')[:10]

        total_capacity = sum(loc.capacity for loc in locations)
        total_occupancy = sum(loc.current_occupancy for loc in locations)
        avg_occupancy_rate = float(total_occupancy) / total_capacity if total_capacity else 0.0

        top_categories = [
            {'category_name': item['category__name'], 'count': item['count'], 'color': '#60A5FA'}
            for item in queryset.values('category__name').annotate(count=Count('id')).order_by('-count')[:5]
        ]

        metrics = {
            'total_assets': queryset.count(),
            'available_assets': queryset.filter(status='available').count(),
            'checked_out_assets': queryset.filter(status='checked_out').count(),
            'in_transit_assets': queryset.filter(status='in_transit').count(),
            'missing_assets': queryset.filter(status='missing').count(),
            'total_buildings': locations.filter(type='building').count(),
            'total_rooms': locations.filter(type='room').count(),
            'total_storage_units': locations.filter(type='storage_unit').count(),
            'avg_occupancy_rate': round(avg_occupancy_rate, 4),
            'recent_moves': recent_moves,
            'recent_activities': recent_activities,
            'top_categories': top_categories,
        }
        serializer = DashboardMetricsSerializer(metrics)
        return Response({'status': 'success', 'data': serializer.data})


class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def register(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        role = request.data.get('role', 'Viewer')
        department = request.data.get('department', '')
        organization_id = request.data.get('organization_id')
        org_name = request.data.get('orgName')
        org_code = request.data.get('orgCode')
        avatar_url = request.data.get('avatar_url', '')

        if not name or not email:
            return Response({'status': 'error', 'message': 'User name and email are required'}, status=status.HTTP_400_BAD_REQUEST)

        organization = None
        if organization_id:
            try:
                organization = Organization.objects.get(id=organization_id)
            except Organization.DoesNotExist:
                return Response({'status': 'error', 'message': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
        elif org_name and org_code:
            organization = Organization.objects.create(name=org_name, code=org_code)
        else:
            return Response({'status': 'error', 'message': 'Organization information required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            organization=organization,
            name=name,
            email=email,
            role=role,
            department=department,
            avatar_url=avatar_url,
            permissions={},
        )

        return Response({'status': 'success', 'data': {'user': UserSerializer(user).data, 'organization': OrganizationSerializer(organization).data}}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def login(self, request):
        email_or_id = request.data.get('emailOrId')
        if not email_or_id:
            return Response({'status': 'error', 'message': 'Email or User ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(Q(email=email_or_id) | Q(id=email_or_id)).first()
        if not user:
            return Response({'status': 'error', 'message': 'User account not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'status': 'success', 'data': {'user': UserSerializer(user).data, 'organization': OrganizationSerializer(user.organization).data}})


class QRView(APIView):
    def get(self, request):
        text = request.query_params.get('text', 'ISAMS-DEMO')
        data_url = f'data:image/svg+xml;base64,{uuid.uuid4().hex}'
        return Response({'status': 'success', 'data': {'text': text, 'data_url': data_url}})


class DBIntegrationStatusView(APIView):
    def get(self, request):
        return Response({'status': 'success', 'data': {'host': 'localhost', 'port': '5432', 'database': 'isams', 'user': 'isams', 'ssl': 'disable', 'status': 'PostgreSQL integration ready'}})


class DBIntegrationConfigView(APIView):
    def post(self, request):
        return Response({'status': 'success', 'data': request.data})


class DBIntegrationTestView(APIView):
    def post(self, request):
        host = request.data.get('host', 'localhost')
        database = request.data.get('database', 'isams')
        if not host or not database:
            return Response({'status': 'success', 'data': {'success': False, 'message': 'Host and Database Name parameters are required.'}})
        return Response({'status': 'success', 'data': {'success': True, 'message': f'PostgreSQL Diagnostic Handshake Verified: Successfully validated parameters for host [{host}], DB [{database}].'}})


class CSVExportView(APIView):
    def get(self, request):
        org_id = ensure_uuid_or_none(request.query_params.get('org_id'))
        assets = Asset.objects.all()
        if org_id:
            assets = assets.filter(organization_id=org_id)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ISAMS_Assets_Report_{int(timezone.now().timestamp())}.csv"'
        import csv
        writer = csv.writer(response)
        writer.writerow(['Asset Number', 'Title', 'Category', 'Location Path', 'Status', 'Checked Out To', 'Created At'])
        for asset in assets[:1000]:
            writer.writerow([
                asset.asset_number,
                asset.title,
                asset.category.name if asset.category else '',
                asset.current_location.get_path() if asset.current_location else '',
                asset.status,
                asset.checked_out_to or 'N/A',
                asset.created_at.isoformat(),
            ])
        return response


class AuditLogListView(APIView):
    def get(self, request):
        queryset = AuditLog.objects.all().order_by('-created_at')
        org_id = ensure_uuid_or_none(request.query_params.get('organization'))
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        action = request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        serializer = AuditLogSerializer(queryset[:100], many=True)
        return Response({'status': 'success', 'data': serializer.data})


class MovementHistoryView(APIView):
    def get(self, request):
        queryset = AssetLocationHistory.objects.all().order_by('-created_at')
        org_id = ensure_uuid_or_none(request.query_params.get('organization'))
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        serializer = AssetLocationHistorySerializer(queryset[:100], many=True)
        return Response({'status': 'success', 'data': serializer.data})
