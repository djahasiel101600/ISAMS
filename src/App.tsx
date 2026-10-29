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
import { ArMobilePairView } from './components/ar/ArMobilePairView.tsx';
import { DatabaseIntegrationView } from './components/db/DatabaseIntegrationView';
import { QrScannerModal } from './components/common/QrScannerModal';
import { AddLocationModal } from './components/spatial/AddLocationModal';
import { PermissionMatrixModal } from './components/common/PermissionMatrixModal';
import { CheckOutModal } from './components/borrowing/CheckOutModal';
import { InitialSystemSetupModal } from './components/common/InitialSystemSetupModal';
import { AuthModal } from './components/auth/AuthModal';
import { DjangoIntegrationModal } from './components/django/DjangoIntegrationModal';
import { ShieldAlert, Key, Sparkles } from 'lucide-react';

import { api } from './services/api';
import { 
  Organization, 
  User, 
  PermissionSet,
  FULL_ADMIN_PERMISSIONS,
  AssetCategory, 
  LocationNode, 
  Asset, 
  AssetDocument,
  DashboardMetrics, 
  PaginatedResult,
  AssetStatus
} from './types/isams';

export default function App() {
  // Navigation & Active View State
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [locationsLoading, setLocationsLoading] = useState(false);


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
  const [isSystemSetupOpen, setIsSystemSetupOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDjangoModalOpen, setIsDjangoModalOpen] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  if (currentPath === '/ar') {
    return <ArMobilePairView />;
  }

  // System Setup / Onboarding Handler
  const handleInitializeSystem = async (data: {
    orgName: string;
    orgCode: string;
    adminName: string;
    adminEmail: string;
    template: 'empty' | 'event_kit' | 'corporate_kit';
  }) => {
    const res = await api.bootstrapSystem(data);
    setIsSystemSetupOpen(false);
    await loadInitialData(res.user || null);
    if (res.organization) setCurrentOrg(res.organization);
    if (res.user) setCurrentUser(res.user);
  };

  const handleAuthSuccess = async (user: User, org: Organization) => {
    setCurrentOrg(org);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    await loadInitialData(user);
  };

  const handleResetSystem = async () => {
    try {
      await api.resetSystem();
      setCurrentUser(null);
      setCurrentOrg(null);
      setUsers([]);
      setOrganizations([]);
      setCategories([]);
      setLocations([]);
      setAllAssets([]);
      setPaginatedAssets({ data: [], total: 0, page: 1, limit: 20, total_pages: 1 });
      setMetrics(null);
      setAuditLogs([]);
      setIsAuthModalOpen(true);
    } catch (err) {
      console.error('Failed to reset system data:', err);
    }
  };

  // 1. Initial Data Fetching
  const loadInitialData = useCallback(async (preservedUser: User | null = null) => {
    setIsAppReady(false);
    try {
      const orgs = await api.getOrganizations();
      setOrganizations(orgs);
      const userOrg = preservedUser ? orgs.find((org) => org.id === preservedUser.organization_id) : null;
      const defaultOrg = userOrg || orgs[0] || null;
      setCurrentOrg(defaultOrg);

      if (defaultOrg) {
        const orgUsers = await api.getUsers(defaultOrg.id);
        setUsers(orgUsers);
        setCurrentUser(preservedUser || (orgUsers[0] ? {
          ...orgUsers[0],
          permissions: orgUsers[0].permissions || FULL_ADMIN_PERMISSIONS
        } : null));

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
      } else {
        setUsers([]);
        setCurrentUser(null);
        setCategories([]);
        setLocations([]);
        setMetrics(null);
        setAuditLogs([]);
        setAllAssets([]);
      }
    } catch (err) {
      console.error('[ISAMS] Error loading initial data:', err);
    } finally {
      setIsAppReady(true);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Fetch Assets when Filters or Search Change
  const refreshAssets = useCallback(async (pageOverride?: number) => {
    if (!currentOrg) return;
    try {
      const effectivePage = pageOverride ?? page;
      const result = await api.getAssets(currentOrg.id, {
        search: globalSearchQuery,
        category_id: selectedCategoryId,
        status: selectedStatus,
        location_id: selectedLocationId === 'all' ? undefined : selectedLocationId,
        page: effectivePage,
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

  useEffect(() => {
    // When switching to spatial tab, refresh locations
    if (activeTab === 'spatial' && currentOrg) {
      console.log('Spatial tab activated, refreshing locations...');
      refreshLocations();
    }
  }, [activeTab, currentOrg]);

  // Add this function if you don't have it
  const refreshLocations = useCallback(async () => {
    if (!currentOrg) return;
    try {
      console.log('Refreshing locations for organization:', currentOrg.id);
      const locs = await api.getLocations(currentOrg.id);
      console.log('Locations loaded:', locs.length);
      setLocations(locs);
    } catch (err) {
      console.error('Failed to refresh locations:', err);
    }
  }, [currentOrg]);


  // 3. Permission Management Handler
  const handleUpdatePermissions = async (newPermissions: PermissionSet) => {
    if (!currentUser) return;
    try {
      const updatedUser = await api.updateUser(currentUser.id, { permissions: newPermissions });
      setCurrentUser(updatedUser);
      setUsers((prevUsers) => prevUsers.map((user) => user.id === updatedUser.id ? updatedUser : user));
    } catch (err: any) {
      console.error('Failed to persist permission updates:', err);
      alert(`Unable to save permission changes: ${err.message || err}`);
    }
  };

  // 4. Asset Registration Handler (Supports user-supplied Category & Organization)
  const handleRegisterAssetSubmit = async (data: {
    title: string;
    organization_id: string;
    category_id: string;
    location_id?: string;
    description: string;
    keywords: string;
    photos: string[];
    documents?: AssetDocument[];
    newOrganization?: { name: string; code: string; contact_email?: string };
    newCategory?: { name: string; code: string; description?: string };
  }) => {
    if (!currentUser) return;
    try {
      let targetOrgId = currentOrg?.id || 'org-1';

      // If user supplied a new organization, create it first (or reuse existing org with same code)
      if (data.newOrganization) {
        const newOrg = data.newOrganization;
        const existingOrg = organizations.find(org => org.code.toLowerCase() === newOrg.code.toLowerCase());
        if (existingOrg) {
          targetOrgId = existingOrg.id;
          setCurrentOrg(existingOrg);
        } else {
          try {
            const createdOrg = await api.createOrganization({
              name: newOrg.name,
              code: newOrg.code,
              contact_email: newOrg.contact_email || ''
            });
            targetOrgId = createdOrg.id;
            const updatedOrgs = await api.getOrganizations();
            setOrganizations(updatedOrgs);
            setCurrentOrg(createdOrg);
          } catch (err: any) {
            const refreshedOrgs = await api.getOrganizations();
            setOrganizations(refreshedOrgs);
            const duplicateOrg = refreshedOrgs.find(org => org.code.toLowerCase() === newOrg.code.toLowerCase());
            if (duplicateOrg) {
              targetOrgId = duplicateOrg.id;
              setCurrentOrg(duplicateOrg);
            } else {
              throw err;
            }
          }
        }
      } else if (data.organization_id && data.organization_id !== 'pending_new_org') {
        targetOrgId = data.organization_id;
      }

      // If user supplied a new category, create it first (or reuse existing category with same code)
      let targetCatId = data.category_id;
      if (data.newCategory) {
        const newCategory = data.newCategory;
        const existingCat = categories.find(
          cat => cat.organization_id === targetOrgId && cat.code.toLowerCase() === newCategory.code.toLowerCase()
        );
        if (existingCat) {
          targetCatId = existingCat.id;
        } else {
          try {
            const createdCat = await api.createCategory({
              organization_id: targetOrgId,
              name: newCategory.name,
              code: newCategory.code,
              description: newCategory.description || '',
              icon_name: 'FileText',
              color: 'bg-blue-500'
            });
            targetCatId = createdCat.id;
            const updatedCats = await api.getCategories(targetOrgId);
            setCategories(updatedCats);
          } catch (err: any) {
            const refreshedCats = await api.getCategories(targetOrgId);
            setCategories(refreshedCats);
            const duplicateCat = refreshedCats.find(
              cat => cat.organization_id === targetOrgId && cat.code.toLowerCase() === newCategory.code.toLowerCase()
            );
            if (duplicateCat) {
              targetCatId = duplicateCat.id;
            } else {
              throw err;
            }
          }
        }
      }

      // Register Asset
      const keywordArray = data.keywords
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);

      await api.createAsset({
        title: data.title,
        category: targetCatId,
        current_location: data.location_id,
        description: data.description,
        keywords: keywordArray,
        photos: data.photos,
        documents: data.documents,
        organization: targetOrgId,
        user_id: currentUser.id,
        user_name: currentUser.name
      });
      setGlobalSearchQuery('');
      setSelectedCategoryId('all');
      setSelectedStatus('all');
      setSelectedLocationId('all');
      setPage(1);
      await refreshAssets(1);
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
      // Map the type to a valid choice if needed
      let locationType = data.type;
      
      // If 'storage_unit' is not in your model choices, map it to something valid
      const validTypes = ['building', 'floor', 'department', 'room', 'cabinet', 'shelf', 'drawer', 'box', 'vault', 'equipment', 'area'];
      if (locationType === 'storage_unit' && !validTypes.includes(locationType)) {
        locationType = 'cabinet'; // Map storage_unit to cabinet
        console.warn(`Mapping "storage_unit" to "cabinet"`);
      }
      
      const locationData = {
        organization_id: currentOrg.id,
        parent_id: data.parent_id || null,
        type: locationType,  // Use the mapped type
        code: data.code,
        name: data.name,
        description: data.description || '',
        photo_url: data.photo_url || '',
        capacity: data.capacity || 100
      };
      
      console.log('Sending to API:', locationData);
      
      const result = await api.createLocation(locationData);
      console.log('Location created:', result);
      
      const updatedLocs = await api.getLocations(currentOrg.id);
      setLocations(updatedLocs);
      setIsAddLocationModalOpen(false);
    } catch (err: any) {
      console.error('Failed to add location:', err);
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
  const isSystemZeroState = isAppReady && organizations.length === 0 && users.length === 0;

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-cyan-400 mx-auto" />
          <div className="text-sm text-slate-300">Loading ISAMS, checking application state...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          onSuccess={handleAuthSuccess}
          existingUsers={users}
          organizations={organizations}
          isSystemZeroState={isSystemZeroState}
        />
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
        onOpenSystemSetup={() => setIsSystemSetupOpen(true)}
        onOpenDjangoModal={() => setIsDjangoModalOpen(true)}
        onOpenAuth={(mode) => {
          setIsAuthModalOpen(true);
        }}
        onResetSystem={handleResetSystem}
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
            onOpenRegisterAsset={() => {
              setRegisterLocationId(null);
              setIsRegisterModalOpen(true);
            }}
            onOpenRelocate={() => {
              if (allAssets.length > 0) setRelocateAsset(allAssets[0]);
            }}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'spatial' && (
          currentUser.permissions?.can_manage_locations ? (
            <SpatialExplorer
              locations={locations}
              assets={allAssets}
              onSelectAsset={setSelectedAsset}
              onOpenRegisterAssetAtLocation={(locId) => {
                setRegisterLocationId(locId);
                setIsRegisterModalOpen(true);
              }}
              onOpenAddLocation={(parentId) => {
                setAddLocationParentId(parentId);
                setIsAddLocationModalOpen(true);
              }}
              onOpenQrScanner={() => setIsQrScannerOpen(true)}
              onRefresh={refreshLocations}
              isLoading={locationsLoading} // Add this
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
        currentOrgId={currentOrg?.id || ''}
        categories={categories}
        locations={locations}
        initialLocationId={registerLocationId}
        uploadedBy={currentUser?.name || 'System'}
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

      {/* System Setup Onboarding & Preset Modal */}
      <InitialSystemSetupModal
        isOpen={isSystemSetupOpen}
        onInitializeSystem={async (data) => {
          await handleInitializeSystem(data);
          setIsSystemSetupOpen(false);
        }}
        onClose={() => setIsSystemSetupOpen(false)}
      />

      {/* User Login & Registration Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        existingUsers={users}
        organizations={organizations}
        isSystemZeroState={isSystemZeroState}
      />

      {/* Django REST Integration Hub Modal */}
      <DjangoIntegrationModal
        isOpen={isDjangoModalOpen}
        onClose={() => setIsDjangoModalOpen(false)}
        onConfigSaved={() => loadInitialData()}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        ISAMS - Indoor Spatial Asset Management System &copy; 2026. Enterprise Physical Asset & Spatial Mapping Platform.
      </footer>

    </div>
  );
}