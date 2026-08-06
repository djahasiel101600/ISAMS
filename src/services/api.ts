/**
 * ISAMS - API Client Service
 * Interacts with backend Django REST Framework APIs
 */

import QRCode from 'qrcode';
import {
  Organization,
  User,
  AssetCategory,
  LocationNode,
  Asset,
  AssetLocationHistory,
  AuditLog,
  DashboardMetrics,
  PaginatedResult,
  FilterOptions
} from '../types/isams';

export interface BackendConfig {
  baseUrl: string;
  isDjango: boolean;
  authToken?: string;
}

function normalizeApiUrl(url: string): string {
  let normalized = url.trim().replace(/\/+$/, '');
  if (!normalized.endsWith('/api/v1')) {
    normalized = normalized.replace(/\/+$/, '');
    normalized = `${normalized}/api/v1`;
  }
  return normalized;
}

export function getApiBaseUrl(): string {
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('isams_custom_api_url') : null;
  if (customUrl) return normalizeApiUrl(customUrl);

  const envUrl = (import.meta as any).env?.VITE_DJANGO_BACKEND_URL;
  if (envUrl) return normalizeApiUrl(envUrl);

  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  return 'http://localhost:8001/api/v1'; // Fallback backend URL
}

export function isDjangoBackend(): boolean {
  if (typeof localStorage !== 'undefined') {
    const flag = localStorage.getItem('isams_use_django');
    if (flag !== null) return flag === 'true';
  }
  return true; // Default to Django
}

export function getAuthToken(): string {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('isams_auth_token') || '';
  }
  return '';
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const isDjango = isDjangoBackend();
  const token = getAuthToken();

  // Build URL - ensure we don't double-add /api/v1
  let url = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

  if (url.startsWith('/api/v1') || url.startsWith('http://') || url.startsWith('https://')) {
    // Use the provided absolute API path as-is.
  } else {
    url = `${baseUrl}${url}`;
  }

  // Django DRF trailing slash convention - only add if no query params
  if (isDjango && !url.endsWith('/') && !url.includes('?') && !url.includes('#')) {
    url = `${url}/`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: isDjango ? `Token ${token}` : `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    headers,
    ...options
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      if (!response.ok) {
        throw new Error(`API Request Failed with status ${response.status}: ${text}`);
      }
      data = text;
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.detail || text || `API Request Failed with status ${response.status}`;
    throw new Error(message);
  }

  if (data === null) {
    return { status: 'success', data: null } as any;
  }

  if (data.status === 'error') {
    throw new Error(data.message || data.detail || 'API Request Failed');
  }

  // Handle Django DRF response structure
  if (data.status === 'success' && data.data !== undefined) {
    return data;
  }

  // If it's a DRF direct data array/object wrapper
  if (data.results !== undefined) {
    return {
      status: 'success',
      data: data.results,
      total: data.count || 0,
      page: 1,
      limit: data.results?.length || 0,
      total_pages: Math.ceil((data.count || 0) / (data.results?.length || 1))
    } as any;
  }

  return { status: 'success', data: data } as any;
}

export const api = {
  setBackendConfig(config: { baseUrl: string; isDjango: boolean; authToken?: string }): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isams_custom_api_url', config.baseUrl);
      localStorage.setItem('isams_use_django', String(config.isDjango));
      if (config.authToken !== undefined) {
        localStorage.setItem('isams_auth_token', config.authToken);
      }
    }
  },

  async testDjangoConnection(baseUrl: string, token?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove trailing slashes and any /api/v1 from the base URL
      let cleanUrl = baseUrl.replace(/\/$/, '');
      // If the URL ends with /api/v1, use it as is, otherwise add it
      if (!cleanUrl.includes('/api/v1')) {
        cleanUrl = `${cleanUrl}/api/v1`;
      }
      
      // The ping endpoint should be /organizations/ relative to the API root
      const pingEndpoint = `${cleanUrl}/organizations/`;
      console.log('Testing connection to:', pingEndpoint);
      
      const response = await fetch(pingEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Successfully connected to Django REST API at ${cleanUrl}` 
        };
      }
      return { 
        success: false, 
        message: `Server responded with status HTTP ${response.status}: ${response.statusText}` 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: err.message || 'Network error attempting to reach Django server' 
      };
    }
  },

  // Health Check
  async healthCheck(): Promise<any> {
    const res = await fetchJson<{ data: any }>('/health');
    return res.data;
  },

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const res = await fetchJson<{ data: Organization[] }>('/organizations');
    return res.data || [];
  },

  async getOrganizationById(id: string): Promise<Organization> {
    const res = await fetchJson<{ data: Organization }>(`/organizations/${id}`);
    return res.data;
  },

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const res = await fetchJson<{ data: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(org)
    });
    return res.data;
  },

  async updateOrganization(id: string, org: Partial<Organization>): Promise<Organization> {
    const res = await fetchJson<{ data: Organization }>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(org)
    });
    return res.data;
  },

  async deleteOrganization(id: string): Promise<void> {
    await fetchJson(`/organizations/${id}`, {
      method: 'DELETE'
    });
  },

  // Users
  async getUsers(orgId?: string): Promise<User[]> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: User[] }>(`/users${params}`);
    return res.data || [];
  },

  async getUserById(id: string): Promise<User> {
    const res = await fetchJson<{ data: User }>(`/users/${id}`);
    return res.data;
  },

  async createUser(user: Partial<User>): Promise<User> {
    const res = await fetchJson<{ data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    return res.data;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const res = await fetchJson<{ data: User }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(user)
    });
    return res.data;
  },

  // Categories
  async getCategories(orgId?: string): Promise<AssetCategory[]> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: AssetCategory[] }>(`/categories${params}`);
    return res.data || [];
  },

  async getCategoryById(id: string): Promise<AssetCategory> {
    const res = await fetchJson<{ data: AssetCategory }>(`/categories/${id}`);
    return res.data;
  },

  async createCategory(cat: Partial<AssetCategory>): Promise<AssetCategory> {
    const res = await fetchJson<{ data: AssetCategory }>('/categories', {
      method: 'POST',
      body: JSON.stringify(cat)
    });
    return res.data;
  },

  async updateCategory(id: string, cat: Partial<AssetCategory>): Promise<AssetCategory> {
    const res = await fetchJson<{ data: AssetCategory }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cat)
    });
    return res.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await fetchJson(`/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Locations
  async getLocations(orgId?: string): Promise<LocationNode[]> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: LocationNode[] }>(`/locations${params}`);
    return res.data || [];
  },

  async getLocationById(id: string): Promise<LocationNode & { breadcrumbs: LocationNode[] }> {
    const res = await fetchJson<{ data: LocationNode & { breadcrumbs: LocationNode[] } }>(`/locations/${id}`);
    return res.data;
  },

  async getLocationBreadcrumbs(id: string): Promise<LocationNode[]> {
    const res = await fetchJson<{ data: LocationNode[] }>(`/locations/${id}/breadcrumbs`);
    return res.data;
  },

  async getLocationTree(orgId?: string): Promise<any> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: any }>(`/locations/tree${params}`);
    return res.data;
  },

  async createLocation(data: {
    organization_id?: string;
    parent_id?: string | null;
    type: string;
    code: string;
    name: string;
    description?: string;
    photo_url?: string;
    capacity?: number;
  }): Promise<LocationNode> {
    // Transform field names and ensure correct data types
    const djangoData: any = {
      organization: data.organization_id,  // Send the ID as string
      type: data.type,  // Make sure this matches the model choices
      code: data.code,
      name: data.name,
      description: data.description || '',
      photo_url: data.photo_url || '',
      capacity: data.capacity || 100
    };
    
    // Handle parent - send null as null, not 'null' string
    if (data.parent_id === null || data.parent_id === undefined) {
      djangoData.parent = null;
    } else if (data.parent_id) {
      djangoData.parent = data.parent_id;
    }
    
    // Remove undefined values
    Object.keys(djangoData).forEach(key => {
      if (djangoData[key] === undefined) {
        delete djangoData[key];
      }
    });

    console.log('Sending location data:', djangoData);

    const res = await fetchJson<{ data: LocationNode }>('/locations', {
      method: 'POST',
      body: JSON.stringify(djangoData)
    });
    return res.data;
  },

  async updateLocation(id: string, data: Partial<LocationNode>): Promise<LocationNode> {
    const res = await fetchJson<{ data: LocationNode }>(`/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async deleteLocation(id: string): Promise<void> {
    await fetchJson(`/locations/${id}`, {
      method: 'DELETE'
    });
  },

  // Assets
  async getAssets(orgId?: string, options: FilterOptions = {}): Promise<PaginatedResult<Asset>> {
    const params = new URLSearchParams();
    if (orgId) params.set('organization', orgId);
    if (options.search) params.set('search', options.search);
    if (options.category_id && options.category_id !== 'all') params.set('category', options.category_id);
    if (options.status && options.status !== 'all') params.set('status', options.status);
    if (options.location_id) params.set('current_location', options.location_id);
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('page_size', String(options.limit));
    if (options.sort_by) params.set('ordering', options.sort_dir === 'desc' ? `-${options.sort_by}` : options.sort_by);

    const res = await fetchJson<PaginatedResult<Asset>>(`/assets?${params.toString()}`);
    return res;
  },

  async getAssetById(id: string): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`/assets/${id}`);
    return res.data;
  },

  async getAssetByQrCode(qrCode: string): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`/assets/qr/${encodeURIComponent(qrCode)}`);
    return res.data;
  },

  async createAsset(data: {
    title: string;
    organization_id?: string;
    organization?: string;
    category_id?: string;
    category?: string;
    location_id?: string;
    current_location?: string;
    description?: string;
    keywords?: string[];
    photos?: string[];
    user_id?: string;
    user_name?: string;
  }): Promise<Asset> {
    const payload: any = {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      photos: data.photos,
      user_id: data.user_id,
      user_name: data.user_name,
    };

    if (data.organization_id) {
      payload.organization_id = data.organization_id;
    } else if (data.organization) {
      payload.organization_id = data.organization;
    }

    if (data.category_id) {
      payload.category_id = data.category_id;
    } else if (data.category) {
      payload.category_id = data.category;
    }

    if (data.location_id) {
      payload.location_id = data.location_id;
    } else if (data.current_location) {
      payload.location_id = data.current_location;
    }

    const res = await fetchJson<{ data: Asset }>('/assets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data;
  },

  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async deleteAsset(id: string): Promise<void> {
    await fetchJson(`/assets/${id}`, {
      method: 'DELETE'
    });
  },

  async moveAsset(
    assetId: string,
    newLocationId: string,
    reason: string,
    user_id?: string,
    user_name?: string
  ): Promise<{ asset: Asset; history: AssetLocationHistory }> {
    const res = await fetchJson<{ data: { asset: Asset; history: AssetLocationHistory } }>(
      `/assets/${assetId}/move`,
      {
        method: 'POST',
        body: JSON.stringify({ new_location_id: newLocationId, reason, user_id, user_name })
      }
    );
    return res.data;
  },

  async checkOutAsset(
    assetId: string,
    borrowerName: string,
    dueDate: string,
    notes?: string,
    user_id?: string,
    user_name?: string
  ): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`/assets/${assetId}/check_out`, {
      method: 'POST',
      body: JSON.stringify({ borrower_name: borrowerName, due_date: dueDate, notes, user_id, user_name })
    });
    return res.data;
  },

  async checkInAsset(assetId: string, user_id?: string, user_name?: string): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`/assets/${assetId}/check_in`, {
      method: 'POST',
      body: JSON.stringify({ user_id, user_name })
    });
    return res.data;
  },

  // QR Code Rendering Data URL
  async renderQrCode(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        margin: 1,
        width: 300,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    } catch (err: any) {
      console.error('QR generation failed:', err);
      const res = await fetchJson<{ data: { data_url: string } }>(`/qr/render?text=${encodeURIComponent(text)}`);
      return res.data.data_url;
    }
  },

  async getAuditLogs(orgId?: string): Promise<AuditLog[]> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: AuditLog[] }>(`/audit-logs${params}`);
    return res.data;
  },

  async getMovementHistory(orgId?: string): Promise<AssetLocationHistory[]> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: AssetLocationHistory[] }>(`/movement-history${params}`);
    return res.data;
  },

  // Dashboard Metrics
  async getDashboardMetrics(orgId?: string): Promise<DashboardMetrics> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: DashboardMetrics }>(`/dashboard/metrics${params}`);
    return res.data;
  },

  // AR Room Scans & Spatial Annotations
  async getRoomScans(orgId?: string): Promise<any[]> {
    const params = orgId ? `?organization=${orgId}` : '';
    const res = await fetchJson<{ data: any[] }>(`/room-scans${params}`);
    return res.data;
  },

  async getRoomScanById(id: string): Promise<any> {
    const res = await fetchJson<{ data: any }>(`/room-scans/${id}`);
    return res.data;
  },

  async createRoomScan(data: {
    organization?: string;
    room_name: string;
    location_path?: string;
    location?: string;
    background_image?: string;
    paired_device_name?: string;
  }): Promise<any> {
    const res = await fetchJson<{ data: any }>('/room-scans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async updateRoomScan(id: string, data: {
    room_name?: string;
    location_path?: string;
    location_id?: string;
    background_image?: string;
    paired_device_connected?: boolean;
    paired_device_name?: string;
  }): Promise<any> {
    const res = await fetchJson<{ data: any }>(`/room-scans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async addAnchorToRoomScan(scanId: string, data: any): Promise<any> {
    const res = await fetchJson<{ data: any }>(`/room-scans/${scanId}/anchors`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async deleteAnchorFromRoomScan(scanId: string, anchorId: string): Promise<void> {
    await fetchJson(`/room-scans/${scanId}/anchors/${anchorId}`, {
      method: 'DELETE'
    });
  },

  async pairMobileSession(): Promise<{ pair_code: string; pair_url: string }> {
    const res = await fetchJson<{ data: { pair_code: string; pair_url: string } }>('/room-scans/pair_session', {
      method: 'POST'
    });
    return res.data;
  },

  async getPairSessionStatus(pairCode: string): Promise<{ connected: boolean; device_name: string }> {
    const res = await fetchJson<{ data: { connected: boolean; device_name: string } }>(`/room-scans/pair_session/status?pair_code=${encodeURIComponent(pairCode)}`);
    return res.data;
  },

  async confirmPairSession(pairCode: string, deviceName?: string): Promise<{ connected: boolean; device_name: string }> {
    const res = await fetchJson<{ data: { connected: boolean; device_name: string } }>(`/room-scans/pair_session/confirm`, {
      method: 'POST',
      body: JSON.stringify({ pair_code: pairCode, device_name: deviceName })
    });
    return res.data;
  },

  async aiAnalyzeFrame(imageBase64?: string): Promise<any> {
    const res = await fetchJson<{ data: any }>('/room-scans/ai_analyze_frame', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    return res.data;
  },

  // Database Integration & Diagnostics
  async getDbStatus(): Promise<any> {
    const res = await fetchJson<{ data: any }>('/db-integration/status');
    return res.data;
  },

  async testDbConnection(config: any): Promise<{ success: boolean; message: string }> {
    const res = await fetchJson<{ data: { success: boolean; message: string } }>('/db-integration/test', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return res.data;
  },

  async saveDbConfig(config: any): Promise<any> {
    const res = await fetchJson<{ data: any }>('/db-integration/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return res.data;
  },

  // Authentication & User Accounts
  async registerUser(data: {
    name: string;
    email: string;
    role?: string;
    department?: string;
    organization_id?: string;
    orgName?: string;
    orgCode?: string;
    avatar_url?: string;
  }): Promise<{ organization: Organization; user: User }> {
    const res = await fetchJson<{ data: { organization: Organization; user: User } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async loginUser(emailOrId: string): Promise<{ organization: Organization; user: User }> {
    const res = await fetchJson<{ data: { organization: Organization; user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrId })
    });
    return res.data;
  },

  async resetSystem(): Promise<void> {
    await fetchJson('/system/reset', {
      method: 'POST'
    });
  },

  // System Onboarding & Initialization
  async bootstrapSystem(data: {
    orgName: string;
    orgCode: string;
    adminName: string;
    adminEmail?: string;
    template?: 'empty' | 'event_kit' | 'corporate_kit';
  }): Promise<{ organization: Organization; user: User }> {
    const res = await fetchJson<{ data: { organization: Organization; user: User } }>('/system/bootstrap', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  // CSV Report Export
  async exportCsv(orgId?: string): Promise<Blob> {
    const params = orgId ? `?org_id=${orgId}` : '';
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/reports/export-csv${params}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/csv',
        ...(getAuthToken() ? { Authorization: `Token ${getAuthToken()}` } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }
    
    return response.blob();
  }
};