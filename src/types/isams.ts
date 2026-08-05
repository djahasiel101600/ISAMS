/**
 * ISAMS - Indoor Spatial Asset Management System
 * Core Domain Models & Interfaces
 */

export type RoleName = 
  | 'Administrator'
  | 'Records Officer'
  | 'Inventory Manager'
  | 'Department Head'
  | 'Staff'
  | 'Viewer';

export interface PermissionSet {
  can_manage_organization: boolean;
  can_manage_locations: boolean;
  can_register_assets: boolean;
  can_edit_assets: boolean;
  can_move_assets: boolean;
  can_check_out_in: boolean;
  can_archive_delete: boolean;
  can_view_audit_logs: boolean;
  can_export_reports: boolean;
  can_manage_users: boolean;
  can_configure_db: boolean;
  can_ar_scan: boolean;
}

export const FULL_ADMIN_PERMISSIONS: PermissionSet = {
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
  can_ar_scan: true,
};

export const STAFF_PERMISSIONS: PermissionSet = {
  can_manage_organization: false,
  can_manage_locations: true,
  can_register_assets: true,
  can_edit_assets: true,
  can_move_assets: true,
  can_check_out_in: true,
  can_archive_delete: false,
  can_view_audit_logs: false,
  can_export_reports: true,
  can_manage_users: false,
  can_configure_db: false,
  can_ar_scan: true,
};

export const VIEWER_PERMISSIONS: PermissionSet = {
  can_manage_organization: false,
  can_manage_locations: false,
  can_register_assets: false,
  can_edit_assets: false,
  can_move_assets: false,
  can_check_out_in: false,
  can_archive_delete: false,
  can_view_audit_logs: true,
  can_export_reports: true,
  can_manage_users: false,
  can_configure_db: false,
  can_ar_scan: false,
};

export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: RoleName;
  permissions: PermissionSet;
  department: string;
  avatar_url?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export type LocationType = 
  | 'building'
  | 'floor'
  | 'room'
  | 'storage_unit'
  | 'compartment'
  | 'container';

export interface LocationNode {
  id: string;
  organization_id: string;
  parent_id: string | null; // Null for top-level buildings
  type: LocationType;
  code: string;
  name: string;
  description?: string;
  photo_url?: string;
  capacity?: number; // Max items supported
  current_occupancy?: number; // Calculated dynamically
  qr_code: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

export type AssetStatus = 
  | 'available'
  | 'checked_out'
  | 'in_transit'
  | 'maintenance'
  | 'missing'
  | 'archived';

export interface AssetCategory {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  icon_name: string;
  color: string; // Tailwind color class e.g. 'bg-blue-500'
  description?: string;
  parent_category_id?: string | null;
}

export interface AssetDocument {
  id: string;
  title: string;
  file_name: string;
  file_size: string;
  file_type: string;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface Asset {
  id: string;
  organization_id: string;
  category_id: string;
  category_name?: string;
  location_id: string;
  location_path_formatted?: string; // e.g. "Building A > Floor 2 > Room 205 > Cabinet C > Shelf 3"
  asset_number: string; // e.g. "AST-2026-0042"
  title: string;
  description: string;
  keywords: string[];
  barcode: string;
  qr_code: string;
  status: AssetStatus;
  
  // Custody & Check-out tracking
  checked_out_to?: string | null;
  checked_out_by_user_id?: string | null;
  checked_out_at?: string | null;
  due_date?: string | null;
  notes?: string;

  // Media & Files
  photos: string[];
  documents: AssetDocument[];

  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
}

export interface AssetLocationHistory {
  id: string;
  organization_id: string;
  asset_id: string;
  asset_number: string;
  asset_title: string;
  from_location_id: string | null;
  from_location_path: string;
  to_location_id: string;
  to_location_path: string;
  moved_by_user_id: string;
  moved_by_user_name: string;
  reason: string;
  moved_at: string;
}

export type AuditActionType = 
  | 'created'
  | 'updated'
  | 'moved'
  | 'deleted'
  | 'checked_out'
  | 'checked_in'
  | 'viewed'
  | 'printed'
  | 'qr_scanned'
  | 'exported'
  | 'login';

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_name: string;
  user_role: RoleName;
  action: AuditActionType;
  entity_type: 'asset' | 'location' | 'organization' | 'user' | 'category' | 'report';
  entity_id: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface ArDocumentAnnotation {
  id: string;
  doc_code: string; // e.g. "DOC-X", "DOC-Y"
  title: string; // e.g. "IRB Clearance Certificate 2026"
  type: string; // e.g. "Legal Contract", "Patient File", "Audit Binder"
  file_size?: string;
  added_at: string;
}

export interface ArSpatialAnchor {
  id: string;
  room_scan_id: string;
  location_id?: string;
  x: number; // Viewport position percentage (0-100)
  y: number; // Viewport position percentage (0-100)
  z_depth?: number; // Simulated AR depth in meters (e.g. 1.2m)
  title: string; // Spot/Area label e.g., "Upper Shelf - Box 4B"
  area_type: 'shelf' | 'drawer' | 'box' | 'cabinet' | 'desk' | 'vault' | 'equipment';
  documents: ArDocumentAnnotation[]; // Document "X", "Y", etc. placed here
  associated_asset_id?: string | null;
  color: string; // Badge/Tag color e.g., "bg-blue-500"
  created_by: string;
  created_at: string;
  notes?: string;
}

export interface RoomScanSession {
  id: string;
  organization_id: string;
  room_name: string;
  location_path: string;
  location_id?: string;
  background_image: string;
  paired_device_connected?: boolean;
  paired_device_name?: string;
  created_at: string;
  anchors: ArSpatialAnchor[];
}

export interface SpatialBreadcrumb {
  id: string;
  name: string;
  type: LocationType;
}

export interface StorageUtilizationMetric {
  location_id: string;
  location_name: string;
  type: LocationType;
  capacity: number;
  occupancy: number;
  percentage: number;
}

export interface DashboardMetrics {
  total_assets: number;
  available_assets: number;
  checked_out_assets: number;
  in_transit_assets: number;
  missing_assets: number;
  total_buildings: number;
  total_rooms: number;
  total_storage_units: number;
  avg_occupancy_rate: number;
  recent_moves: AssetLocationHistory[];
  recent_activities: AuditLog[];
  top_categories: { category_name: string; count: number; color: string }[];
}

export interface FilterOptions {
  search?: string;
  category_id?: string;
  building_id?: string;
  status?: AssetStatus | 'all';
  location_id?: string;
  page?: number;
  limit?: number;
  sort_by?: 'title' | 'asset_number' | 'created_at' | 'updated_at';
  sort_dir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
