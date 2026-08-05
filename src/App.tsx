/**
 * ISAMS - Indoor Spatial Asset Management System
 * Primary Application Shell & State Controller
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

import { api } from './services/api';
import { 
  Organization, 
  User, 
  RoleName, 
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
  const [checkOutAssetTarget, setCheckOutAssetTarget] = useState<Asset | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerLocationId, setRegisterLocationId] = useState<string | null>(null);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [addLocationParentId, setAddLocationParentId] = useState<string | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

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
        setCurrentUser(orgUsers[0] || null);

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

  // 3. User Role Persona Switcher
  const handleRoleChange = (role: RoleName) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  // 4. Asset Registration Handler
  const handleRegisterAssetSubmit = async (data: any) => {
    if (!currentOrg || !currentUser) return;
    try {
      await api.createAsset({
        ...data,
        organization_id: currentOrg.id,
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

  if (!currentOrg || !currentUser || !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
            ISAMS
          </div>
          <p className="text-xs text-slate-400">Loading Indoor Spatial Asset System...</p>
        </div>
      </div>
    );
  }

  const checkedOutCount = allAssets.filter(a => a.status === 'checked_out').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-blue-500/30 selection:text-white">
      
      {/* Top Header */}
      <Header
        organizations={organizations}
        currentOrg={currentOrg}
        onSelectOrg={(org) => {
          setCurrentOrg(org);
          setPage(1);
        }}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenRegisterAsset={() => {
          setRegisterLocationId(null);
          setIsRegisterModalOpen(true);
        }}
        onOpenRelocate={() => {
          if (allAssets.length > 0) setRelocateAsset(allAssets[0]);
        }}
        globalSearchQuery={globalSearchQuery}
        onSearchChange={(q) => {
          setGlobalSearchQuery(q);
          setPage(1);
          if (activeTab !== 'inventory') setActiveTab('inventory');
        }}
      />

      {/* Primary Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        checkedOutCount={checkedOutCount}
        totalAssetsCount={allAssets.length}
      />

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            onNavigateTab={setActiveTab}
            onOpenRegisterAsset={() => {
              setRegisterLocationId(null);
              setIsRegisterModalOpen(true);
            }}
            onOpenRelocate={() => {
              if (allAssets.length > 0) setRelocateAsset(allAssets[0]);
            }}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
          />
        )}

        {activeTab === 'spatial' && (
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
          />
        )}

        {activeTab === 'ar_scanner' && (
          <ArRoomScannerView
            assets={allAssets}
            locations={locations}
            currentUser={currentUser}
            onSelectAsset={setSelectedAsset}
          />
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
              setSelectedAsset(asset);
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
          <CheckInOutView
            assets={allAssets}
            onCheckInAsset={handleCheckInAsset}
            onOpenCheckOutAsset={(asset) => setSelectedAsset(asset)}
            onSelectAsset={setSelectedAsset}
          />
        )}

        {activeTab === 'relocation' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
            <h2 className="text-lg font-bold text-white">Asset Relocation Engine</h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto">
              Select any registered asset from the inventory or spatial explorer to initiate physical relocation with audit logging.
            </p>
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl"
            >
              Select Asset from Inventory
            </button>
          </div>
        )}

        {activeTab === 'qr_studio' && (
          <QrStudioView
            assets={allAssets}
            locations={locations}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView logs={auditLogs} />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            metrics={metrics}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'db_integration' && (
          <DatabaseIntegrationView />
        )}

      </main>

      {/* Global Modals */}

      {/* Asset Detail View Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onOpenRelocate={(asset) => setRelocateAsset(asset)}
        onOpenCheckOut={(asset) => {
          const borrower = prompt('Enter borrower name or department:');
          const dueDate = prompt('Enter expected due date (YYYY-MM-DD):', '2026-08-20');
          if (borrower && dueDate && currentUser) {
            api.checkOutAsset(asset.id, borrower, dueDate, 'Borrowing via UI', currentUser.id, currentUser.name)
              .then(() => refreshAssets())
              .catch(err => alert(err.message));
          }
        }}
        onCheckIn={handleCheckInAsset}
      />

      {/* Register Asset Modal */}
      <RegisterAssetModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
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

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        ISAMS - Indoor Spatial Asset Management System &copy; 2026. Enterprise Physical Asset & Spatial Mapping Platform.
      </footer>

    </div>
  );
}
