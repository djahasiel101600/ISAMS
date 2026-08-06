/**
 * ISAMS - API Client Service
 * Interacts with backend Express endpoints /api/v1/*
 */

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

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || 'API Request Failed');
  }
  return data;
}

export const api = {
  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const res = await fetchJson<{ data: Organization[] }>(`${BASE_URL}/organizations`);
    return res.data;
  },

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const res = await fetchJson<{ data: Organization }>(`${BASE_URL}/organizations`, {
      method: 'POST',
      body: JSON.stringify(org)
    });
    return res.data;
  },

  // Users
  async getUsers(orgId: string = 'org-1'): Promise<User[]> {
    const res = await fetchJson<{ data: User[] }>(`${BASE_URL}/users?org_id=${orgId}`);
    return res.data;
  },

  // Categories
  async getCategories(orgId: string = 'org-1'): Promise<AssetCategory[]> {
    const res = await fetchJson<{ data: AssetCategory[] }>(`${BASE_URL}/categories?org_id=${orgId}`);
    return res.data;
  },

  async createCategory(cat: Partial<AssetCategory>): Promise<AssetCategory> {
    const res = await fetchJson<{ data: AssetCategory }>(`${BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(cat)
    });
    return res.data;
  },

  // Locations
  async getLocations(orgId: string = 'org-1'): Promise<LocationNode[]> {
    const res = await fetchJson<{ data: LocationNode[] }>(`${BASE_URL}/locations?org_id=${orgId}`);
    return res.data;
  },

  async getLocationById(id: string): Promise<LocationNode & { breadcrumbs: LocationNode[] }> {
    const res = await fetchJson<{ data: LocationNode & { breadcrumbs: LocationNode[] } }>(`${BASE_URL}/locations/${id}`);
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
    const res = await fetchJson<{ data: LocationNode }>(`${BASE_URL}/locations`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  // Assets
  async getAssets(orgId: string = 'org-1', options: FilterOptions = {}): Promise<PaginatedResult<Asset>> {
    const params = new URLSearchParams();
    params.set('org_id', orgId);
    if (options.search) params.set('search', options.search);
    if (options.category_id) params.set('category_id', options.category_id);
    if (options.status) params.set('status', options.status);
    if (options.location_id) params.set('location_id', options.location_id);
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.sort_by) params.set('sort_by', options.sort_by);
    if (options.sort_dir) params.set('sort_dir', options.sort_dir);

    return await fetchJson<PaginatedResult<Asset>>(`${BASE_URL}/assets?${params.toString()}`);
  },

  async getAssetById(id: string): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`${BASE_URL}/assets/${id}`);
    return res.data;
  },

  async getAssetByQrCode(qrCode: string): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`${BASE_URL}/assets/qr/${encodeURIComponent(qrCode)}`);
    return res.data;
  },

  async createAsset(data: {
    title: string;
    organization_id?: string;
    category_id: string;
    location_id: string;
    description?: string;
    keywords?: string;
    photos?: string[];
    user_id?: string;
    user_name?: string;
  }): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`${BASE_URL}/assets`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async moveAsset(
    assetId: string,
    newLocationId: string,
    reason: string,
    user_id?: string,
    user_name?: string
  ): Promise<{ asset: Asset; history: AssetLocationHistory }> {
    const res = await fetchJson<{ data: { asset: Asset; history: AssetLocationHistory } }>(
      `${BASE_URL}/assets/${assetId}/move`,
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
    const res = await fetchJson<{ data: Asset }>(`${BASE_URL}/assets/${assetId}/check-out`, {
      method: 'POST',
      body: JSON.stringify({ borrower_name: borrowerName, due_date: dueDate, notes, user_id, user_name })
    });
    return res.data;
  },

  async checkInAsset(assetId: string, user_id?: string, user_name?: string): Promise<Asset> {
    const res = await fetchJson<{ data: Asset }>(`${BASE_URL}/assets/${assetId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ user_id, user_name })
    });
    return res.data;
  },

  // QR Code Rendering Data URL
  async renderQrCode(text: string): Promise<string> {
    const res = await fetchJson<{ data: { data_url: string } }>(`${BASE_URL}/qr/render?text=${encodeURIComponent(text)}`);
    return res.data.data_url;
  },

  // History & Audit Logs
  async getMovementHistory(orgId: string = 'org-1'): Promise<AssetLocationHistory[]> {
    const res = await fetchJson<{ data: AssetLocationHistory[] }>(`${BASE_URL}/movement-history?org_id=${orgId}`);
    return res.data;
  },

  async getAuditLogs(orgId: string = 'org-1'): Promise<AuditLog[]> {
    const res = await fetchJson<{ data: AuditLog[] }>(`${BASE_URL}/audit-logs?org_id=${orgId}`);
    return res.data;
  },

  // Dashboard Metrics
  async getDashboardMetrics(orgId: string = 'org-1'): Promise<DashboardMetrics> {
    const res = await fetchJson<{ data: DashboardMetrics }>(`${BASE_URL}/dashboard/metrics?org_id=${orgId}`);
    return res.data;
  },

  // AR Room Scans & Spatial Annotations
  async getRoomScans(orgId: string = 'org-1'): Promise<any[]> {
    const res = await fetchJson<{ data: any[] }>(`${BASE_URL}/room-scans?org_id=${orgId}`);
    return res.data;
  },

  async getRoomScanById(id: string): Promise<any> {
    const res = await fetchJson<{ data: any }>(`${BASE_URL}/room-scans/${id}`);
    return res.data;
  },

  async createRoomScan(data: {
    organization_id?: string;
    room_name: string;
    location_path?: string;
    location_id?: string;
    background_image?: string;
    paired_device_name?: string;
  }): Promise<any> {
    const res = await fetchJson<{ data: any }>(`${BASE_URL}/room-scans`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async addAnchorToRoomScan(scanId: string, data: any): Promise<any> {
    const res = await fetchJson<{ data: any }>(`${BASE_URL}/room-scans/${scanId}/anchors`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async deleteAnchorFromRoomScan(scanId: string, anchorId: string): Promise<void> {
    await fetchJson(`${BASE_URL}/room-scans/${scanId}/anchors/${anchorId}`, {
      method: 'DELETE'
    });
  },

  async pairMobileSession(): Promise<{ pair_code: string; pair_url: string }> {
    const res = await fetchJson<{ data: { pair_code: string; pair_url: string } }>(`${BASE_URL}/room-scans/pair-session`, {
      method: 'POST'
    });
    return res.data;
  },

  async aiAnalyzeFrame(imageBase64?: string): Promise<any> {
    const res = await fetchJson<{ data: any }>(`${BASE_URL}/room-scans/ai-analyze-frame`, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    return res.data;
  },

  // Database Integration & Diagnostics
  async getDbStatus(): Promise<any> {
    const res = await fetchJson<{ data: any }>(`${BASE_URL}/db-integration/status`);
    return res.data;
  },

  async testDbConnection(config: any): Promise<{ success: boolean; message: string }> {
    const res = await fetchJson<{ data: { success: boolean; message: string } }>(`${BASE_URL}/db-integration/test`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return res.data;
  },

  async saveDbConfig(config: any): Promise<any> {
    const res = await fetchJson<{ data: any }>(`${BASE_URL}/db-integration/config`, {
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
    const res = await fetchJson<{ data: { organization: Organization; user: User } }>(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  async loginUser(emailOrId: string): Promise<{ organization: Organization; user: User }> {
    const res = await fetchJson<{ data: { organization: Organization; user: User } }>(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ emailOrId })
    });
    return res.data;
  },

  async resetSystem(): Promise<void> {
    await fetchJson(`${BASE_URL}/system/reset`, {
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
    const res = await fetchJson<{ data: { organization: Organization; user: User } }>(`${BASE_URL}/system/bootstrap`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }
};
