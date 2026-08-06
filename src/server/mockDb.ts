/**
 * ISAMS - In-Memory Database & Enterprise Seed Data
 * Provides persistent state management, initial enterprise records, and helper functions
 */

import {
  Organization,
  LocationNode,
  AssetCategory,
  Asset,
  AssetStatus,
  AssetDocument,
  AssetLocationHistory,
  AuditLog,
  User,
  PermissionSet,
  FULL_ADMIN_PERMISSIONS,
  STAFF_PERMISSIONS,
  VIEWER_PERMISSIONS,
  DashboardMetrics,
  PaginatedResult,
  FilterOptions,
  RoleName,
  RoomScanSession,
  ArSpatialAnchor
} from '../types/isams.js';

class MockDatabase {
  public organizations: Organization[] = [];
  public users: User[] = [];
  public categories: AssetCategory[] = [];
  public locations: LocationNode[] = [];
  public assets: Asset[] = [];
  public locationHistory: AssetLocationHistory[] = [];
  public auditLogs: AuditLog[] = [];
  public roomScans: RoomScanSession[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Zero-State by Default: All collections start clean and empty
    this.organizations = [];
    this.users = [];
    this.categories = [];
    this.locations = [];
    this.assets = [];
    this.locationHistory = [];
    this.auditLogs = [];
    this.roomScans = [];
  }

  public clearAllData() {
    this.organizations = [];
    this.users = [];
    this.categories = [];
    this.locations = [];
    this.assets = [];
    this.locationHistory = [];
    this.auditLogs = [];
    this.roomScans = [];
  }

  // --- QUERY & MUTATION API METHODS ---

  public getOrganizations(): Organization[] {
    return this.organizations;
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.organizations.find(o => o.id === id);
  }

  public addOrganization(data: Partial<Organization>): Organization {
    const now = new Date().toISOString();
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name || 'New Organization',
      code: data.code || `ORG-${Math.floor(Math.random() * 1000)}`,
      address: data.address || '',
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      created_at: now,
      updated_at: now
    };
    this.organizations.push(newOrg);
    return newOrg;
  }

  public getUsers(orgId: string): User[] {
    return this.users.filter(u => u.organization_id === orgId);
  }

  public getAllUsers(): User[] {
    return this.users;
  }

  public loginUser(emailOrId: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId || u.name.toLowerCase() === emailOrId.toLowerCase());
  }

  public registerUser(params: {
    name: string;
    email: string;
    role?: RoleName;
    department?: string;
    organization_id?: string;
    orgName?: string;
    orgCode?: string;
    avatar_url?: string;
  }): { organization: Organization; user: User } {
    const now = new Date().toISOString();
    let org: Organization | undefined;

    if (params.organization_id) {
      org = this.organizations.find(o => o.id === params.organization_id);
    }

    if (!org) {
      const orgId = `org-${Date.now()}`;
      org = {
        id: orgId,
        name: params.orgName || (params.name ? `${params.name}'s Organization` : 'Primary Organization'),
        code: params.orgCode || `ORG-${Math.floor(100 + Math.random() * 900)}`,
        address: 'Main Facility Address',
        contact_email: params.email,
        contact_phone: '+1 (555) 000-0000',
        created_at: now,
        updated_at: now
      };
      this.organizations.push(org);
    }

    const isFirstUser = this.users.length === 0;
    const role: RoleName = params.role || (isFirstUser ? 'Administrator' : 'Staff');

    let permissions: PermissionSet = FULL_ADMIN_PERMISSIONS;
    if (role === 'Staff' && !isFirstUser) permissions = STAFF_PERMISSIONS;
    if (role === 'Viewer' && !isFirstUser) permissions = VIEWER_PERMISSIONS;

    const user: User = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organization_id: org.id,
      name: params.name,
      email: params.email,
      role: isFirstUser ? 'Administrator' : role,
      permissions: isFirstUser ? FULL_ADMIN_PERMISSIONS : permissions,
      department: params.department || 'Operations',
      avatar_url: params.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      created_at: now
    };

    this.users.push(user);

    // Audit log
    this.addAuditLog({
      organization_id: org.id,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'created',
      entity_type: 'user',
      entity_id: user.id,
      details: `Registered user account ${user.name} (${user.role}) for organization ${org.name}.`,
      ip_address: '127.0.0.1'
    });

    return { organization: org, user };
  }

  public getCategories(orgId: string): AssetCategory[] {
    return this.categories.filter(c => c.organization_id === orgId);
  }

  public addCategory(data: Partial<AssetCategory>): AssetCategory {
    const newCat: AssetCategory = {
      id: `cat-${Date.now()}`,
      organization_id: data.organization_id || 'org-1',
      name: data.name || 'General Category',
      code: data.code || `CAT-${Math.floor(Math.random() * 1000)}`,
      icon_name: data.icon_name || 'FileText',
      color: data.color || 'bg-blue-500',
      description: data.description || ''
    };
    this.categories.push(newCat);
    return newCat;
  }

  public getLocations(orgId: string): LocationNode[] {
    return this.locations.filter(l => l.organization_id === orgId && !l.is_deleted);
  }

  public getLocationById(id: string): LocationNode | undefined {
    return this.locations.find(l => l.id === id && !l.is_deleted);
  }

  public getLocationTree(orgId: string): LocationNode[] {
    // Return all locations for the organization formatted for tree traversal
    return this.getLocations(orgId);
  }

  public getLocationBreadcrumbs(locationId: string): LocationNode[] {
    const breadcrumbs: LocationNode[] = [];
    let currentId: string | null = locationId;

    while (currentId) {
      const node = this.locations.find(l => l.id === currentId && !l.is_deleted);
      if (!node) break;
      breadcrumbs.unshift(node);
      currentId = node.parent_id;
    }

    return breadcrumbs;
  }

  public formatLocationPath(locationId: string): string {
    const breadcrumbs = this.getLocationBreadcrumbs(locationId);
    return breadcrumbs.map(b => b.name).join(' > ');
  }

  public addLocation(data: Omit<LocationNode, 'id' | 'created_at' | 'updated_at' | 'qr_code'> & { qr_code?: string }): LocationNode {
    const now = new Date().toISOString();
    const newLoc: LocationNode = {
      ...data,
      id: `loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      qr_code: data.qr_code || `LOC-QR-${data.code || Date.now()}`,
      created_at: now,
      updated_at: now
    };
    this.locations.push(newLoc);
    return newLoc;
  }

  public updateLocation(id: string, data: Partial<LocationNode>): LocationNode {
    const idx = this.locations.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Location not found');
    this.locations[idx] = {
      ...this.locations[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    return this.locations[idx];
  }

  public getAssets(orgId: string, filterOptions: FilterOptions = {}): PaginatedResult<Asset> {
    let result = this.assets.filter(a => a.organization_id === orgId && !a.is_deleted);

    // 1. Text Search across Title, Asset #, Description, Keywords, Barcode
    if (filterOptions.search) {
      const q = filterOptions.search.toLowerCase().trim();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.asset_number.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.barcode.toLowerCase().includes(q) ||
        a.keywords.some(k => k.toLowerCase().includes(q)) ||
        (a.location_path_formatted && a.location_path_formatted.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (filterOptions.category_id && filterOptions.category_id !== 'all') {
      result = result.filter(a => a.category_id === filterOptions.category_id);
    }

    // 3. Status Filter
    if (filterOptions.status && filterOptions.status !== 'all') {
      result = result.filter(a => a.status === filterOptions.status);
    }

    // 4. Location Filter (matches exact location or child locations in hierarchy)
    if (filterOptions.location_id) {
      const targetLocId = filterOptions.location_id;
      // Get all descendant location IDs
      const childLocationIds = this.getDescendantLocationIds(targetLocId);
      childLocationIds.add(targetLocId);
      result = result.filter(a => childLocationIds.has(a.location_id));
    }

    // 5. Sorting
    const sortBy = filterOptions.sort_by || 'created_at';
    const sortDir = filterOptions.sort_dir || 'desc';
    result.sort((a, b) => {
      let valA = (a as any)[sortBy] || '';
      let valB = (b as any)[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // 6. Pagination
    const page = filterOptions.page || 1;
    const limit = filterOptions.limit || 10;
    const total = result.length;
    const total_pages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = result.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      total_pages
    };
  }

  private getDescendantLocationIds(parentId: string): Set<string> {
    const set = new Set<string>();
    const stack = [parentId];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      const children = this.locations.filter(l => l.parent_id === curr && !l.is_deleted);
      for (const child of children) {
        set.add(child.id);
        stack.push(child.id);
      }
    }
    return set;
  }

  public getAssetById(id: string): Asset | undefined {
    return this.assets.find(a => a.id === id && !a.is_deleted);
  }

  public getAssetByQrCode(qrCode: string): Asset | undefined {
    return this.assets.find(a => a.qr_code.trim() === qrCode.trim() && !a.is_deleted);
  }

  public addAsset(
    data: Partial<Asset> & {
      organization_id: string;
      category_id: string;
      location_id: string;
      title: string;
      user_id?: string;
      user_name?: string;
    },
    userId: string = 'usr-admin',
    userName: string = 'System Admin'
  ): Asset {
    const now = new Date().toISOString();
    const count = this.assets.length + 1;
    const assetNumber = data.asset_number || `AST-2026-${String(count).padStart(4, '0')}`;
    const qrCode = data.qr_code || `ISAMS-${assetNumber}`;
    const barcode = data.barcode || `BAR-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const locationPath = this.formatLocationPath(data.location_id);
    const effectiveUser = data.user_name || userName;

    const newAsset: Asset = {
      description: '',
      keywords: [],
      status: 'available',
      photos: [],
      documents: [],
      ...data,
      id: `ast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      asset_number: assetNumber,
      qr_code: qrCode,
      barcode: barcode,
      location_path_formatted: locationPath,
      created_by: data.created_by || effectiveUser,
      updated_by: data.updated_by || effectiveUser,
      created_at: now,
      updated_at: now
    };

    this.assets.push(newAsset);

    // Audit log
    this.addAuditLog({
      organization_id: data.organization_id,
      user_id: data.user_id || userId,
      user_name: effectiveUser,
      user_role: 'Records Officer',
      action: 'created',
      entity_type: 'asset',
      entity_id: newAsset.id,
      details: `Registered new asset ${assetNumber} (${newAsset.title}) at ${locationPath}.`,
      ip_address: '127.0.0.1'
    });

    return newAsset;
  }

  public updateAsset(id: string, data: Partial<Asset>, userId: string, userName: string): Asset {
    const idx = this.assets.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Asset not found');

    const oldAsset = this.assets[idx];
    let locationPath = oldAsset.location_path_formatted;

    if (data.location_id && data.location_id !== oldAsset.location_id) {
      locationPath = this.formatLocationPath(data.location_id);
    }

    const updatedAsset: Asset = {
      ...oldAsset,
      ...data,
      location_path_formatted: locationPath,
      updated_at: new Date().toISOString()
    };

    this.assets[idx] = updatedAsset;

    this.addAuditLog({
      organization_id: updatedAsset.organization_id,
      user_id: userId,
      user_name: userName,
      user_role: 'Inventory Manager',
      action: 'updated',
      entity_type: 'asset',
      entity_id: updatedAsset.id,
      details: `Updated details for asset ${updatedAsset.asset_number} (${updatedAsset.title}).`,
      ip_address: '127.0.0.1'
    });

    return updatedAsset;
  }

  public moveAsset(
    assetId: string,
    newLocationId: string,
    reason: string,
    userId: string,
    userName: string
  ): { asset: Asset; history: AssetLocationHistory } {
    const asset = this.getAssetById(assetId);
    if (!asset) throw new Error('Asset not found');

    const fromLocPath = asset.location_path_formatted || this.formatLocationPath(asset.location_id);
    const toLocPath = this.formatLocationPath(newLocationId);

    const now = new Date().toISOString();

    // 1. Update Asset Location
    asset.location_id = newLocationId;
    asset.location_path_formatted = toLocPath;
    asset.updated_at = now;
    asset.updated_by = userName;

    // 2. Create Movement History Entry
    const historyEntry: AssetLocationHistory = {
      id: `hist-${Date.now()}`,
      organization_id: asset.organization_id,
      asset_id: asset.id,
      asset_number: asset.asset_number,
      asset_title: asset.title,
      from_location_id: asset.location_id,
      from_location_path: fromLocPath,
      to_location_id: newLocationId,
      to_location_path: toLocPath,
      moved_by_user_id: userId,
      moved_by_user_name: userName,
      reason,
      moved_at: now
    };

    this.locationHistory.unshift(historyEntry);

    // 3. Audit Log
    this.addAuditLog({
      organization_id: asset.organization_id,
      user_id: userId,
      user_name: userName,
      user_role: 'Inventory Manager',
      action: 'moved',
      entity_type: 'asset',
      entity_id: asset.id,
      details: `Relocated ${asset.asset_number} from [${fromLocPath}] to [${toLocPath}]. Reason: ${reason}`,
      ip_address: '127.0.0.1'
    });

    return { asset, history: historyEntry };
  }

  public checkOutAsset(
    assetId: string,
    borrowerName: string,
    dueDate: string,
    notes: string,
    userId: string,
    userName: string
  ): Asset {
    const asset = this.getAssetById(assetId);
    if (!asset) throw new Error('Asset not found');

    const now = new Date().toISOString();
    asset.status = 'checked_out';
    asset.checked_out_to = borrowerName;
    asset.checked_out_by_user_id = userId;
    asset.checked_out_at = now;
    asset.due_date = dueDate;
    asset.notes = notes;
    asset.updated_at = now;

    this.addAuditLog({
      organization_id: asset.organization_id,
      user_id: userId,
      user_name: userName,
      user_role: 'Records Officer',
      action: 'checked_out',
      entity_type: 'asset',
      entity_id: asset.id,
      details: `Checked out asset ${asset.asset_number} to ${borrowerName} (Due: ${dueDate}).`,
      ip_address: '127.0.0.1'
    });

    return asset;
  }

  public checkInAsset(assetId: string, userId: string, userName: string): Asset {
    const asset = this.getAssetById(assetId);
    if (!asset) throw new Error('Asset not found');

    const now = new Date().toISOString();
    const previousBorrower = asset.checked_out_to;
    asset.status = 'available';
    asset.checked_out_to = null;
    asset.checked_out_by_user_id = null;
    asset.checked_out_at = null;
    asset.due_date = null;
    asset.notes = undefined;
    asset.updated_at = now;

    this.addAuditLog({
      organization_id: asset.organization_id,
      user_id: userId,
      user_name: userName,
      user_role: 'Records Officer',
      action: 'checked_in',
      entity_type: 'asset',
      entity_id: asset.id,
      details: `Checked in asset ${asset.asset_number} (Returned by ${previousBorrower || 'custodian'}).`,
      ip_address: '127.0.0.1'
    });

    return asset;
  }

  public getLocationHistory(orgId: string): AssetLocationHistory[] {
    return this.locationHistory.filter(h => h.organization_id === orgId);
  }

  public bootstrapSystem(params: {
    orgName: string;
    orgCode: string;
    adminName: string;
    adminEmail?: string;
    template: 'empty' | 'event_kit' | 'corporate_kit';
  }): { organization: Organization; user: User } {
    const now = new Date().toISOString();
    const orgId = `org-${Date.now()}`;
    const userId = `usr-${Date.now()}`;

    const organization: Organization = {
      id: orgId,
      name: params.orgName,
      code: params.orgCode,
      address: 'Event Site / Facility Address',
      contact_email: params.adminEmail || 'admin@event.org',
      contact_phone: '+1 (555) 000-0000',
      created_at: now,
      updated_at: now
    };

    const user: User = {
      id: userId,
      organization_id: orgId,
      name: params.adminName,
      email: params.adminEmail || 'admin@event.org',
      role: 'Administrator',
      permissions: {
        can_manage_organization: true,
        can_manage_locations: true,
        can_register_assets: true,
        can_edit_assets: true,
        can_move_assets: true,
        can_check_out_in: true,
        can_archive_delete: true,
        can_view_audit_logs: true,
        can_export_reports: true,
        can_manage_users: true,
        can_configure_db: true,
        can_ar_scan: true
      },
      department: 'Operations',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      created_at: now
    };

    this.organizations.push(organization);
    this.users.push(user);

    if (params.template === 'event_kit') {
      const bldg = this.addLocation({
        organization_id: orgId,
        parent_id: null,
        type: 'building',
        code: 'PAV-MAIN',
        name: 'Main Exhibition Pavilion',
        description: 'Primary hall for convention keynotes & vendor booths',
        photo_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600',
        capacity: 500
      });

      const avRoom = this.addLocation({
        organization_id: orgId,
        parent_id: bldg.id,
        type: 'room',
        code: 'RM-AV01',
        name: 'Audio-Visual Staging Room',
        description: 'Secure lockup for high-value cameras & soundboards',
        capacity: 50
      });

      const stageCabinet = this.addLocation({
        organization_id: orgId,
        parent_id: avRoom.id,
        type: 'storage_unit',
        code: 'CAB-STAGE',
        name: 'Stage Equipment Rolling Rack A',
        description: 'Flight case with wheels',
        capacity: 20
      });

      const catAV = this.addCategory({
        organization_id: orgId,
        name: 'Audio Visual Equipment',
        code: 'AV-EQUIP',
        color: 'bg-blue-500',
        description: 'Microphones, mixers, and projectors'
      });

      const catDisplay = this.addCategory({
        organization_id: orgId,
        name: 'Interactive Kiosks & Screens',
        code: 'DISP-KIOSK',
        color: 'bg-indigo-500',
        description: 'Touchscreen signages & tablets'
      });

      const catIT = this.addCategory({
        organization_id: orgId,
        name: 'Stage Computing & Laptops',
        code: 'IT-COMP',
        color: 'bg-emerald-500',
        description: 'Control laptops and routers'
      });

      this.addAsset({
        organization_id: orgId,
        category_id: catAV.id,
        location_id: stageCabinet.id,
        title: 'Shure Wireless Mic System (4-Pack)',
        description: 'Dual channel UHF wireless receiver kit with bodypacks',
        keywords: ['microphone', 'wireless', 'audio', 'shure', 'stage'],
        photos: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600'],
        user_id: userId,
        user_name: user.name
      });

      this.addAsset({
        organization_id: orgId,
        category_id: catDisplay.id,
        location_id: avRoom.id,
        title: '4K Touchscreen Presentation Kiosk #01',
        description: '55-inch interactive floor stand presentation screen',
        keywords: ['kiosk', 'display', '4k', 'touchscreen'],
        photos: ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600'],
        user_id: userId,
        user_name: user.name
      });

      this.addAsset({
        organization_id: orgId,
        category_id: catIT.id,
        location_id: stageCabinet.id,
        title: 'MacBook Pro M3 Stage Controller',
        description: 'Main slide deck and video playback laptop',
        keywords: ['apple', 'macbook', 'laptop', 'control'],
        photos: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
        user_id: userId,
        user_name: user.name
      });
    } else if (params.template === 'corporate_kit') {
      const bldg = this.addLocation({
        organization_id: orgId,
        parent_id: null,
        type: 'building',
        code: 'BLDG-HQ',
        name: 'Corporate Headquarters',
        description: 'Main enterprise office building',
        capacity: 200
      });

      const floor = this.addLocation({
        organization_id: orgId,
        parent_id: bldg.id,
        type: 'floor',
        code: 'FL-01',
        name: 'Floor 1 Executive Suites',
        capacity: 100
      });

      const vault = this.addLocation({
        organization_id: orgId,
        parent_id: floor.id,
        type: 'room',
        code: 'RM-V101',
        name: 'Archival Storage Vault 101',
        capacity: 30
      });

      const catLegal = this.addCategory({
        organization_id: orgId,
        name: 'Legal & Contract Binders',
        code: 'LEG-BIND',
        color: 'bg-purple-500',
        description: 'Original wet-signature agreements'
      });

      const catIT = this.addCategory({
        organization_id: orgId,
        name: 'IT Hardware & Workstations',
        code: 'IT-HW',
        color: 'bg-cyan-500',
        description: 'Laptops, servers, switches'
      });

      this.addAsset({
        organization_id: orgId,
        category_id: catLegal.id,
        location_id: vault.id,
        title: 'Master Facility Deed & Articles of Incorporation',
        description: 'Original legal documentation binder 2020-2030',
        keywords: ['deed', 'legal', 'binder', 'vault'],
        user_id: userId,
        user_name: user.name
      });
    }

    return { organization, user };
  }

  public getAuditLogs(orgId: string): AuditLog[] {
    return this.auditLogs.filter(a => a.organization_id === orgId);
  }

  public addAuditLog(data: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...data,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    return log;
  }

  public getDashboardMetrics(orgId: string): DashboardMetrics {
    const orgAssets = this.assets.filter(a => a.organization_id === orgId && !a.is_deleted);
    const orgLocs = this.locations.filter(l => l.organization_id === orgId && !l.is_deleted);

    const total_assets = orgAssets.length;
    const available_assets = orgAssets.filter(a => a.status === 'available').length;
    const checked_out_assets = orgAssets.filter(a => a.status === 'checked_out').length;
    const in_transit_assets = orgAssets.filter(a => a.status === 'in_transit').length;
    const missing_assets = orgAssets.filter(a => a.status === 'missing').length;

    const total_buildings = orgLocs.filter(l => l.type === 'building').length;
    const total_rooms = orgLocs.filter(l => l.type === 'room').length;
    const total_storage_units = orgLocs.filter(l => l.type === 'storage_unit').length;

    // Top categories distribution
    const categoryCounts: Record<string, { count: number; name: string; color: string }> = {};
    for (const cat of this.categories.filter(c => c.organization_id === orgId)) {
      categoryCounts[cat.id] = { count: 0, name: cat.name, color: cat.color };
    }
    for (const asset of orgAssets) {
      if (categoryCounts[asset.category_id]) {
        categoryCounts[asset.category_id].count++;
      }
    }
    const top_categories = Object.values(categoryCounts).map(item => ({
      category_name: item.name,
      count: item.count,
      color: item.color
    }));

    return {
      total_assets,
      available_assets,
      checked_out_assets,
      in_transit_assets,
      missing_assets,
      total_buildings,
      total_rooms,
      total_storage_units,
      avg_occupancy_rate: 68.4, // percentage
      recent_moves: this.getLocationHistory(orgId).slice(0, 5),
      recent_activities: this.getAuditLogs(orgId).slice(0, 8),
      top_categories
    };
  }

  // --- AR ROOM SCANS & SPATIAL ANCHORS ---

  public getRoomScans(orgId: string): RoomScanSession[] {
    return this.roomScans.filter(s => s.organization_id === orgId);
  }

  public getRoomScanById(id: string): RoomScanSession | undefined {
    return this.roomScans.find(s => s.id === id);
  }

  public createRoomScan(data: Omit<RoomScanSession, 'id' | 'created_at' | 'anchors'>): RoomScanSession {
    const now = new Date().toISOString();
    const newScan: RoomScanSession = {
      ...data,
      background_image: data.background_image || 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200',
      id: `scan-${Date.now()}`,
      created_at: now,
      anchors: []
    };
    this.roomScans.unshift(newScan);
    return newScan;
  }

  public addAnchorToRoomScan(
    scanId: string,
    anchorData: Omit<ArSpatialAnchor, 'id' | 'created_at'>,
    userId: string,
    userName: string
  ): ArSpatialAnchor {
    const scan = this.getRoomScanById(scanId);
    if (!scan) throw new Error('Room scan session not found');

    const now = new Date().toISOString();
    const newAnchor: ArSpatialAnchor = {
      ...anchorData,
      id: `anc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: now
    };

    scan.anchors.push(newAnchor);

    // Add audit log
    const docNames = newAnchor.documents.map(d => d.title).join(', ');
    this.addAuditLog({
      organization_id: scan.organization_id,
      user_id: userId,
      user_name: userName,
      user_role: 'Records Officer',
      action: 'created',
      entity_type: 'location',
      entity_id: scan.id,
      details: `Added AR Spatial Anchor "${newAnchor.title}" in ${scan.room_name}. Documents labeled: ${docNames || 'None'}`,
      ip_address: '127.0.0.1'
    });

    return newAnchor;
  }

  public deleteAnchorFromRoomScan(
    scanId: string,
    anchorId: string,
    userId: string,
    userName: string
  ): boolean {
    const scan = this.getRoomScanById(scanId);
    if (!scan) return false;

    const initialLength = scan.anchors.length;
    scan.anchors = scan.anchors.filter(a => a.id !== anchorId);
    return scan.anchors.length < initialLength;
  }
}

export const db = new MockDatabase();
