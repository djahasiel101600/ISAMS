/**
 * ISAMS - Indoor Spatial Asset Management System
 * Primary Application Shell & Permission-Based Access Controller
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { NavigationTabs, TabId } from './components/common/NavigationTabs';
import { DashboardView } from './components/dashboard/DashboardView';
import { SpatialExplorer } from './components/spatial/SpatialExplorer';
import { AssetInventoryView } from './components/assets/AssetInventoryView';
import { AssetDetailModal } from './components/assets/AssetDetailModal';
import { RegisterAssetModal } from './components/assets/RegisterAssetModal';
import { RelocationWizardModal } from './components/movement/RelocationWizardModal';
import { CheckInOutView } from './components/borrowing/CheckInOutView';
import { QrStudioView } from './components/qr/QrStudioView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { ReportsView } from './components/reports/ReportsView';
import { ArRoomScannerView } from './components/ar/ArRoomScannerView';
import { DatabaseIntegrationView } from './components/db/DatabaseIntegrationView';
import { QrScannerModal } from './components/common/QrScannerModal';
import { AddLocationModal } from './components/spatial/AddLocationModal';
import { PermissionMatrixModal } from './components/common/PermissionMatrixModal';
import { CheckOutModal } from './components/borrowing/CheckOutModal';
import { ShieldAlert, Key } from 'lucide-react';

import { api } from './services/api';
import { 
  Organization, 
  User, 
  PermissionSet,
  FULL_ADMIN_PERMISSIONS,
  AssetCategory, 
  LocationNode, 
  Asset, 
  DashboardMetrics, 
  PaginatedResult,
  AssetStatus
} from './types/isams';

export default function App() {
  // Navigation & Active View State
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Enterprise Data State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [paginatedAssets, setPaginatedAssets] = useState<PaginatedResult<Asset>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1
  });
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Filter & Search Controls
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | 'all'>('all');
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [page, setPage] = useState(1);

  // Modals & Triggers
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [relocateAsset, setRelocateAsset] = useState<Asset | null>(null);
  const [checkOutAsset, setCheckOutAsset] = useState<Asset | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerLocationId, setRegisterLocationId] = useState<string | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [addLocationParentId, setAddLocationParentId] = useState<string | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);

  // 1. Initial Data Fetching
  const loadInitialData = useCallback(async () => {
    try {
      const orgs = await api.getOrganizations();
      setOrganizations(orgs);
      const defaultOrg = orgs[0] || null;
      setCurrentOrg(defaultOrg);

      if (defaultOrg) {
        const orgUsers = await api.getUsers(defaultOrg.id);
        setUsers(orgUsers);
        
        // Ensure default user has permission set initialized
        const activeUser = orgUsers[0] ? {
          ...orgUsers[0],
          permissions: orgUsers[0].permissions || FULL_ADMIN_PERMISSIONS
        } : null;
        setCurrentUser(activeUser);

        const cats = await api.getCategories(defaultOrg.id);
        setCategories(cats);

        const locs = await api.getLocations(defaultOrg.id);
        setLocations(locs);

        const dashMetrics = await api.getDashboardMetrics(defaultOrg.id);
        setMetrics(dashMetrics);

        const logs = await api.getAuditLogs(defaultOrg.id);
        setAuditLogs(logs);

        // Fetch all assets for local views
        const assetsResult = await api.getAssets(defaultOrg.id, { limit: 1000 });
        setAllAssets(assetsResult.data);
      }
    } catch (err) {
      console.error('[ISAMS] Error loading initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Fetch Assets when Filters or Search Change
  const refreshAssets = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const result = await api.getAssets(currentOrg.id, {
        search: globalSearchQuery,
        category_id: selectedCategoryId,
        status: selectedStatus,
        location_id: selectedLocationId === 'all' ? undefined : selectedLocationId,
        page,
        limit: 20
      });
      setPaginatedAssets(result);

      // Refresh all assets & metrics
      const allResult = await api.getAssets(currentOrg.id, { limit: 1000 });
      setAllAssets(allResult.data);

      const updatedMetrics = await api.getDashboardMetrics(currentOrg.id);
      setMetrics(updatedMetrics);

      const logs = await api.getAuditLogs(currentOrg.id);
      setAuditLogs(logs);
    } catch (err) {
      console.error('[ISAMS] Error refreshing assets:', err);
    }
  }, [currentOrg, globalSearchQuery, selectedCategoryId, selectedStatus, selectedLocationId, page]);

  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  // 3. Permission Management Handler
  const handleUpdatePermissions = (newPermissions: PermissionSet) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        permissions: newPermissions
      });
    }
  };

  // 4. Asset Registration Handler (Supports user-supplied Category & Organization)
  const handleRegisterAssetSubmit = async (data: {
    title: string;
    organization_id: string;
    category_id: string;
    location_id: string;
    description: string;
    keywords: string;
    photos: string[];
    newOrganization?: { name: string; code: string; contact_email?: string };
    newCategory?: { name: string; code: string; description?: string };
  }) => {
    if (!currentUser) return;
    try {
      let targetOrgId = currentOrg?.id || 'org-1';

      // If user supplied a new organization, create it first
      if (data.newOrganization) {
        const createdOrg = await api.createOrganization({
          name: data.newOrganization.name,
          code: data.newOrganization.code,
          contact_email: data.newOrganization.contact_email || ''
        });
        targetOrgId = createdOrg.id;
        const updatedOrgs = await api.getOrganizations();
        setOrganizations(updatedOrgs);
        setCurrentOrg(createdOrg);
      } else if (data.organization_id && data.organization_id !== 'pending_new_org') {
        targetOrgId = data.organization_id;
      }

      // If user supplied a new category, create it first
      let targetCatId = data.category_id;
      if (data.newCategory) {
        const createdCat = await api.createCategory({
          organization_id: targetOrgId,
          name: data.newCategory.name,
          code: data.newCategory.code,
          description: data.newCategory.description || '',
          icon_name: 'FileText',
          color: 'bg-blue-500'
        });
        targetCatId = createdCat.id;
        const updatedCats = await api.getCategories(targetOrgId);
        setCategories(updatedCats);
      }

      // Register Asset
      await api.createAsset({
        title: data.title,
        category_id: targetCatId,
        location_id: data.location_id,
        description: data.description,
        keywords: data.keywords,
        photos: data.photos,
        organization_id: targetOrgId,
        user_id: currentUser.id,
        user_name: currentUser.name
      });
      await refreshAssets();
    } catch (err: any) {
      alert(`Failed to register asset: ${err.message}`);
    }
  };

  // 5. Asset Movement Relocation Handler
  const handleConfirmRelocate = async (assetId: string, newLocationId: string, reason: string) => {
    if (!currentUser) return;
    try {
      await api.moveAsset(
        assetId,
        newLocationId,
        reason,
        currentUser.id,
        currentUser.name
      );
      await refreshAssets();
      setRelocateAsset(null);
    } catch (err: any) {
      alert(`Relocation failed: ${err.message}`);
    }
  };

  // 6. Check-Out / Check-In Handlers
  const handleConfirmCheckOut = async (assetId: string, borrowerName: string, dueDate: string, notes: string) => {
    if (!currentUser) return;
    await api.checkOutAsset(
      assetId,
      borrowerName,
      dueDate,
      notes,
      currentUser.id,
      currentUser.name
    );
    await refreshAssets();
    if (selectedAsset && selectedAsset.id === assetId) {
      setSelectedAsset(await api.getAssetById(assetId));
    }
  };

  const handleCheckInAsset = async (asset: Asset) => {
    if (!currentUser) return;
    try {
      await api.checkInAsset(asset.id, currentUser.id, currentUser.name);
      await refreshAssets();
      if (selectedAsset && selectedAsset.id === asset.id) {
        setSelectedAsset(await api.getAssetById(asset.id));
      }
    } catch (err: any) {
      alert(`Check-in failed: ${err.message}`);
    }
  };

  // 7. Add Spatial Location Node Handler
  const handleAddLocationSubmit = async (data: any) => {
    if (!currentOrg) return;
    try {
      await api.createLocation({
        ...data,
        organization_id: currentOrg.id
      });
      const updatedLocs = await api.getLocations(currentOrg.id);
      setLocations(updatedLocs);
    } catch (err: any) {
      alert(`Failed to add location: ${err.message}`);
    }
  };

  // 8. CSV Export
  const handleExportCsv = () => {
    window.open('/api/v1/reports/export-csv?org_id=' + (currentOrg?.id || 'org-1'), '_blank');
  };

  // Permission Guard Helper
  const renderPermissionDeniedGuard = (permissionTitle: string, permissionKey: keyof PermissionSet) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4">
      <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">Permission Restricted</h3>
        <p className="text-xs text-slate-400 mt-1">
          Your active user policy currently lacks the <span className="text-rose-300 font-semibold">{permissionTitle}</span> permission (<code className="font-mono text-[11px]">{permissionKey}</code>).
        </p>
      </div>
      <button
        onClick={() => setIsPermissionMatrixOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
      >
        <Key className="w-4 h-4" /> Open Permission Matrix & Enable Access
      </button>
    </div>
  );

  const checkedOutCount = allAssets.filter(a => a.status === 'checked_out').length;

  if (!currentUser || !currentOrg) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing ISAMS Spatial Infrastructure...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header with Permission Matrix Trigger */}
      <Header
        organizations={organizations}
        currentOrg={currentOrg}
        onSelectOrg={(org) => {
          setCurrentOrg(org);
          setPage(1);
        }}
        currentUser={currentUser}
        onOpenPermissionMatrix={() => setIsPermissionMatrixOpen(true)}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenRegisterAsset={() => {
          setRegisterLocationId(null);
          setIsRegisterModalOpen(true);
        }}
        onOpenRelocate={() => {
          if (allAssets.length > 0) setRelocateAsset(allAssets[0]);
        }}
        globalSearchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
      />

      {/* Navigation Tab Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        checkedOutCount={checkedOutCount}
        totalAssetsCount={allAssets.length}
        userPermissions={currentUser.permissions}
      />

      {/* Primary Workspace Content Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            allAssets={allAssets}
            onSelectAsset={setSelectedAsset}
            onOpenRegisterAsset={() => {
              setRegisterLocationId(null);
              setIsRegisterModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'spatial' && (
          currentUser.permissions?.can_manage_locations ? (
            <SpatialExplorer
              locations={locations}
              assets={allAssets}
              onSelectAsset={setSelectedAsset}
              onOpenRegisterAtLocation={(locId) => {
                setRegisterLocationId(locId);
                setIsRegisterModalOpen(true);
              }}
              onOpenAddLocation={(parentId) => {
                setAddLocationParentId(parentId);
                setIsAddLocationModalOpen(true);
              }}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
            />
          ) : renderPermissionDeniedGuard('Manage Spatial Locations', 'can_manage_locations')
        )}

        {activeTab === 'ar_scanner' && (
          currentUser.permissions?.can_ar_scan ? (
            <ArRoomScannerView
              assets={allAssets}
              locations={locations}
              currentUser={currentUser}
              onSelectAsset={setSelectedAsset}
            />
          ) : renderPermissionDeniedGuard('AR Spatial Scanning', 'can_ar_scan')
        )}

        {activeTab === 'inventory' && (
          <AssetInventoryView
            paginatedAssets={paginatedAssets}
            categories={categories}
            locations={locations}
            searchQuery={globalSearchQuery}
            onSearchChange={(q) => {
              setGlobalSearchQuery(q);
              setPage(1);
            }}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={(catId) => {
              setSelectedCategoryId(catId);
              setPage(1);
            }}
            selectedStatus={selectedStatus}
            onStatusChange={(status) => {
              setSelectedStatus(status);
              setPage(1);
            }}
            selectedLocationId={selectedLocationId}
            onLocationChange={(locId) => {
              setSelectedLocationId(locId);
              setPage(1);
            }}
            page={page}
            onPageChange={setPage}
            onSelectAsset={setSelectedAsset}
            onOpenRelocateAsset={setRelocateAsset}
            onOpenCheckOutAsset={(asset) => {
              setCheckOutAsset(asset);
            }}
            onCheckInAsset={handleCheckInAsset}
            onOpenRegisterAsset={() => {
              setRegisterLocationId(null);
              setIsRegisterModalOpen(true);
            }}
            onPrintQrLabel={(asset) => {
              setActiveTab('qr_studio');
            }}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'borrowing' && (
          currentUser.permissions?.can_check_out_in ? (
            <CheckInOutView
              assets={allAssets}
              onCheckInAsset={handleCheckInAsset}
              onOpenCheckOutAsset={(asset) => setCheckOutAsset(asset)}
              onSelectAsset={setSelectedAsset}
            />
          ) : renderPermissionDeniedGuard('Check-In / Check-Out Custody', 'can_check_out_in')
        )}

        {activeTab === 'relocation' && (
          currentUser.permissions?.can_move_assets ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
              <h2 className="text-lg font-bold text-white">Asset Relocation Engine</h2>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                Select any registered asset from the inventory or spatial explorer to initiate physical relocation with audit logging.
              </p>
              <button
                onClick={() => setActiveTab('inventory')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl cursor-pointer"
              >
                Select Asset from Inventory
              </button>
            </div>
          ) : renderPermissionDeniedGuard('Spatial Asset Relocation', 'can_move_assets')
        )}

        {activeTab === 'qr_studio' && (
          <QrStudioView
            assets={allAssets}
            locations={locations}
          />
        )}

        {activeTab === 'audit' && (
          currentUser.permissions?.can_view_audit_logs ? (
            <AuditTrailView logs={auditLogs} />
          ) : renderPermissionDeniedGuard('System Compliance Audit Logs', 'can_view_audit_logs')
        )}

        {activeTab === 'reports' && (
          currentUser.permissions?.can_export_reports ? (
            <ReportsView
              metrics={metrics}
              onExportCsv={handleExportCsv}
            />
          ) : renderPermissionDeniedGuard('Export Reports & Analytics', 'can_export_reports')
        )}

        {activeTab === 'db_integration' && (
          currentUser.permissions?.can_configure_db ? (
            <DatabaseIntegrationView />
          ) : renderPermissionDeniedGuard('PostgreSQL Database Integration', 'can_configure_db')
        )}

      </main>

      {/* Global Modals */}

      {/* Asset Detail View Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onOpenRelocate={(asset) => setRelocateAsset(asset)}
        onOpenCheckOut={(asset) => setCheckOutAsset(asset)}
        onCheckIn={handleCheckInAsset}
      />

      {/* Check-Out Custody Modal */}
      <CheckOutModal
        asset={checkOutAsset}
        isOpen={!!checkOutAsset}
        onClose={() => setCheckOutAsset(null)}
        users={users}
        onConfirmCheckOut={handleConfirmCheckOut}
      />

      {/* Register Asset Modal (Supports custom supplied Category and Organization) */}
      <RegisterAssetModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        organizations={organizations}
        currentOrgId={currentOrg.id}
        categories={categories}
        locations={locations}
        initialLocationId={registerLocationId}
        onSubmit={handleRegisterAssetSubmit}
      />

      {/* Relocation Wizard Modal */}
      <RelocationWizardModal
        asset={relocateAsset}
        isOpen={!!relocateAsset}
        onClose={() => setRelocateAsset(null)}
        locations={locations}
        onConfirmRelocate={handleConfirmRelocate}
      />

      {/* Add Spatial Location Node Modal */}
      <AddLocationModal
        isOpen={isAddLocationModalOpen}
        onClose={() => setIsAddLocationModalOpen(false)}
        parentId={addLocationParentId}
        locations={locations}
        onSubmit={handleAddLocationSubmit}
      />

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onAssetFound={(asset) => setSelectedAsset(asset)}
      />

      {/* Permission Matrix Modal */}
      <PermissionMatrixModal
        isOpen={isPermissionMatrixOpen}
        onClose={() => setIsPermissionMatrixOpen(false)}
        currentUser={currentUser}
        onUpdatePermissions={handleUpdatePermissions}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        ISAMS - Indoor Spatial Asset Management System &copy; 2026. Enterprise Physical Asset & Spatial Mapping Platform.
      </footer>

    </div>
  );
}
