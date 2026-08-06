import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  Copy, 
  Check, 
  X, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Globe, 
  Key, 
  Settings, 
  Code2, 
  FileCode, 
  Database, 
  ExternalLink
} from 'lucide-react';
import { getApiBaseUrl, isDjangoBackend, getAuthToken, api } from '../../services/api';

interface DjangoIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const DjangoIntegrationModal: React.FC<DjangoIntegrationModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'models' | 'serializers' | 'views' | 'urls' | 'settings'>('config');
  const [useDjango, setUseDjango] = useState<boolean>(isDjangoBackend());
  const [djangoUrl, setDjangoUrl] = useState<string>(getApiBaseUrl());
  const [authToken, setAuthToken] = useState<string>(getAuthToken());

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await api.testDjangoConnection(djangoUrl, authToken);
    setTestResult(result);
    setTesting(false);
  };

  const handleSaveConfig = () => {
    api.setBackendConfig({
      baseUrl: useDjango ? djangoUrl : '/api/v1',
      isDjango: useDjango,
      authToken: authToken
    });
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const djangoModelsPy = `# models.py - Django Models for ISAMS Physical Asset Management
from django.db import models
import uuid

class Organization(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, unique=True)
    address = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class UserProfile(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users')
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=64, default='Staff')
    department = models.CharField(max_length=128, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    permissions = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

class AssetCategory(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='categories')
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=64, default='Box')
    color = models.CharField(max_length=32, default='#3b82f6')
    created_at = models.DateTimeField(auto_now_add=True)

class LocationNode(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='locations')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    type = models.CharField(max_length=32) # 'site' | 'building' | 'floor' | 'room' | 'storage_unit'
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    photo_url = models.URLField(blank=True, null=True)
    capacity = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

class Asset(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('in_use', 'In Use'),
        ('checked_out', 'Checked Out'),
        ('under_maintenance', 'Under Maintenance'),
        ('retired', 'Retired'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='assets')
    category = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    location = models.ForeignKey(LocationNode, on_delete=models.PROTECT, related_name='assets')
    asset_number = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    qr_code = models.CharField(max_length=128, unique=True)
    barcode = models.CharField(max_length=128, unique=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='available')
    keywords = models.JSONField(default=list, blank=True)
    photos = models.JSONField(default=list, blank=True)
    documents = models.JSONField(default=list, blank=True)
    created_by = models.CharField(max_length=128, default='System')
    updated_by = models.CharField(max_length=128, default='System')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AssetLocationHistory(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='location_history')
    from_location = models.ForeignKey(LocationNode, on_delete=models.SET_NULL, null=True, related_name='history_from')
    to_location = models.ForeignKey(LocationNode, on_delete=models.SET_NULL, null=True, related_name='history_to')
    moved_by_name = models.CharField(max_length=255)
    reason = models.TextField(blank=True, null=True)
    moved_at = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    id = models.CharField(max_length=64, primary_key=True, default=uuid.uuid4)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user_name = models.CharField(max_length=255)
    user_role = models.CharField(max_length=64)
    action = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64)
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
`;

  const djangoSerializersPy = `# serializers.py - Django REST Framework Serializers
from rest_framework import serializers
from .models import Organization, UserProfile, AssetCategory, LocationNode, Asset, AssetLocationHistory, AuditLog

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'

class LocationNodeSerializer(serializers.ModelSerializer):
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = LocationNode
        fields = '__all__'

    def get_children_count(self, obj):
        return obj.children.count()

class AssetSerializer(serializers.ModelSerializer):
    location_path_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = '__all__'

    def get_location_path_formatted(self, obj):
        curr = obj.location
        parts = []
        while curr:
            parts.unshift(curr.name)
            curr = curr.parent
        return ' > '.join(parts) if parts else obj.location.name

class AssetLocationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetLocationHistory
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
`;

  const djangoViewsPy = `# views.py - DRF API ViewSets
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Organization, UserProfile, AssetCategory, LocationNode, Asset, AssetLocationHistory, AuditLog
from .serializers import (
    OrganizationSerializer, UserProfileSerializer, AssetCategorySerializer,
    LocationNodeSerializer, AssetSerializer, AssetLocationHistorySerializer, AuditLogSerializer
)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        org_id = self.request.query_params.get('org_id')
        if org_id:
            return self.queryset.filter(organization_id=org_id)
        return self.queryset

class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all()
    serializer_class = AssetCategorySerializer

class LocationNodeViewSet(viewsets.ModelViewSet):
    queryset = LocationNode.objects.all()
    serializer_class = LocationNodeSerializer

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

    def get_queryset(self):
        qs = self.queryset
        org_id = self.request.query_params.get('org_id')
        search = self.request.query_params.get('search')
        if org_id:
            qs = qs.filter(organization_id=org_id)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(asset_number__icontains=search)
        return qs

    @action(detail=True, methods=['post'], url_path='move')
    def move_asset(self, request, pk=None):
        asset = self.get_object()
        new_location_id = request.data.get('new_location_id')
        reason = request.data.get('reason', 'Relocation')
        old_location = asset.location
        asset.location_id = new_location_id
        asset.save()
        history = AssetLocationHistory.objects.create(
            organization=asset.organization,
            asset=asset,
            from_location=old_location,
            to_location_id=new_location_id,
            moved_by_name=request.data.get('user_name', 'System Admin'),
            reason=reason
        )
        return Response({'status': 'success', 'data': {'asset': AssetSerializer(asset).data, 'history': AssetLocationHistorySerializer(history).data}})
`;

  const djangoUrlsPy = `# urls.py - Router Configuration
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, UserProfileViewSet, AssetCategoryViewSet,
    LocationNodeViewSet, AssetViewSet
)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'users', UserProfileViewSet)
router.register(r'categories', AssetCategoryViewSet)
router.register(r'locations', LocationNodeViewSet)
router.register(r'assets', AssetViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
`;

  const djangoSettingsPy = `# settings.py - Required Django CORS and DRF Config
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'isams_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Put near the top
    'django.middleware.common.CommonMiddleware',
    # ...
]

# Allow React AI Studio frontend requests
CORS_ALLOW_ALL_ORIGINS = True # Or configure specific domains
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny', # Adjust for token auth as required
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50
}
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900/60 via-slate-900 to-indigo-900/40 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Django Integration Hub
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  DRF REST API
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Django Backend Configuration & Export
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-1 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-t border-x cursor-pointer transition-all ${
              activeTab === 'config'
                ? 'bg-slate-900 text-emerald-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> API Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-t border-x cursor-pointer transition-all ${
              activeTab === 'models'
                ? 'bg-slate-900 text-blue-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> models.py
          </button>
          <button
            onClick={() => setActiveTab('serializers')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-t border-x cursor-pointer transition-all ${
              activeTab === 'serializers'
                ? 'bg-slate-900 text-indigo-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> serializers.py
          </button>
          <button
            onClick={() => setActiveTab('views')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-t border-x cursor-pointer transition-all ${
              activeTab === 'views'
                ? 'bg-slate-900 text-violet-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> views.py
          </button>
          <button
            onClick={() => setActiveTab('urls')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-t border-x cursor-pointer transition-all ${
              activeTab === 'urls'
                ? 'bg-slate-900 text-amber-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> urls.py
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center gap-2 border-t border-x cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-rose-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> settings.py
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Toggle Server Mode */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-200 block">
                  Select Active Backend API Architecture
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUseDjango(false)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      !useDjango
                        ? 'bg-blue-500/10 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Built-in Container API (Express)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Use the embedded Cloud Run Node server running on <code className="text-blue-300">/api/v1</code>.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseDjango(true)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      useDjango
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">External Django REST Framework API</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Connect directly to a Django instance (e.g. <code className="text-emerald-300">http://localhost:8000/api/v1</code>).
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Django API Details Input */}
              {useDjango && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" /> Django REST API Base URL
                    </label>
                    <input
                      type="text"
                      placeholder="http://localhost:8000/api/v1"
                      value={djangoUrl}
                      onChange={(e) => setDjangoUrl(e.target.value)}
                      className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      Standard Django REST Framework router endpoint root.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400" /> Django Token / Bearer Authentication Header (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 99442315697b4936d3e028d2109785c6b907284f"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      If provided, sent automatically as <code className="text-emerald-300">Authorization: Token &lt;key&gt;</code> in all API requests.
                    </p>
                  </div>

                  {/* Ping & Test Connection */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={testing}
                      onClick={handleTestConnection}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {testing ? <span className="animate-spin">🌀</span> : <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                      Test Django Connection
                    </button>

                    {testResult && (
                      <div className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      }`}>
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Save & Apply */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Backend Settings
                </button>
              </div>
            </div>
          )}

          {/* CODE TAB: MODELS */}
          {activeTab === 'models' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  Django ORM Models (<code className="text-blue-400">models.py</code>)
                </p>
                <button
                  onClick={() => copyToClipboard(djangoModelsPy, 'models')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'models' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'models' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {djangoModelsPy}
              </pre>
            </div>
          )}

          {/* CODE TAB: SERIALIZERS */}
          {activeTab === 'serializers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  Django REST Framework Serializers (<code className="text-indigo-400">serializers.py</code>)
                </p>
                <button
                  onClick={() => copyToClipboard(djangoSerializersPy, 'serializers')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'serializers' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'serializers' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {djangoSerializersPy}
              </pre>
            </div>
          )}

          {/* CODE TAB: VIEWS */}
          {activeTab === 'views' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  Django REST Framework ViewSets (<code className="text-violet-400">views.py</code>)
                </p>
                <button
                  onClick={() => copyToClipboard(djangoViewsPy, 'views')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'views' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'views' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {djangoViewsPy}
              </pre>
            </div>
          )}

          {/* CODE TAB: URLS */}
          {activeTab === 'urls' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  Django REST Router & URLs (<code className="text-amber-400">urls.py</code>)
                </p>
                <button
                  onClick={() => copyToClipboard(djangoUrlsPy, 'urls')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'urls' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'urls' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {djangoUrlsPy}
              </pre>
            </div>
          )}

          {/* CODE TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  Django CORS & REST Framework Config (<code className="text-rose-400">settings.py</code>)
                </p>
                <button
                  onClick={() => copyToClipboard(djangoSettingsPy, 'settings')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'settings' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === 'settings' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {djangoSettingsPy}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
