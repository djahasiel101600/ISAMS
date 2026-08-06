/**
 * ISAMS Spatial Explorer Component
 * "Google Maps for Indoor Office Storage"
 * Visual hierarchy browser (Building -> Floor -> Room -> Storage Unit -> Compartment -> Container)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building, 
  Layers, 
  DoorClosed, 
  Archive, 
  Inbox, 
  Box, 
  ChevronRight, 
  Plus, 
  QrCode, 
  MapPin, 
  Boxes, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  PlusCircle,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { LocationNode, LocationType, Asset } from '../../types/isams';

interface SpatialExplorerProps {
  locations: LocationNode[];
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onOpenRegisterAssetAtLocation: (locationId: string) => void;
  onOpenAddLocation: (parentId: string | null) => void;
  onOpenQrScanner: () => void;
  onRefresh?: () => void; // Add this prop
  isLoading?: boolean; // Add loading state
}

export const SpatialExplorer: React.FC<SpatialExplorerProps> = ({
  locations,
  assets,
  onSelectAsset,
  onOpenRegisterAssetAtLocation,
  onOpenAddLocation,
  onOpenQrScanner,
  onRefresh,
  isLoading = false
}) => {
  // Active selected location node ID (Null means top-level Buildings list)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    console.log('SpatialExplorer mounted, loading locations...');
    if (onRefresh) {
      onRefresh();
    }
    // Reset selection when component mounts
    setSelectedLocationId(null);
  }, []); // Empty dependency array means this runs once on mount

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsRefreshing(false);
  };

  // Get active location node object
  const currentLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return locations.find(l => l.id === selectedLocationId) || null;
  }, [locations, selectedLocationId]);

  // Compute Breadcrumb trail from root building down to active node
  const breadcrumbs = useMemo(() => {
    const trail: LocationNode[] = [];
    let currId = selectedLocationId;

    while (currId) {
      const node = locations.find(l => l.id === currId);
      if (!node) break;
      trail.unshift(node);
      currId = node.parent_id;
    }
    return trail;
  }, [locations, selectedLocationId]);

  // Child locations of current node (or top-level buildings if selectedLocationId === null)
  const childLocations = useMemo(() => {
    return locations.filter(l => l.parent_id === selectedLocationId);
  }, [locations, selectedLocationId]);

  // Assets stored directly at this location or inside child containers
  const locationAssets = useMemo(() => {
    if (!selectedLocationId) return [];
    
    // Get all descendant location IDs to include items in child containers/drawers
    const descendantIds = new Set<string>([selectedLocationId]);
    const stack = [selectedLocationId];

    while (stack.length > 0) {
      const parentId = stack.pop()!;
      const children = locations.filter(l => l.parent_id === parentId);
      for (const child of children) {
        descendantIds.add(child.id);
        stack.push(child.id);
      }
    }

    return assets.filter(a => descendantIds.has(a.location_id));
  }, [locations, assets, selectedLocationId]);

  // Icon mapping per location type
  const getLocationTypeIcon = (type: LocationType) => {
    switch (type) {
      case 'building': return <Building className="w-5 h-5 text-indigo-400" />;
      case 'floor': return <Layers className="w-5 h-5 text-blue-400" />;
      case 'room': return <DoorClosed className="w-5 h-5 text-emerald-400" />;
      case 'storage_unit': return <Archive className="w-5 h-5 text-amber-400" />;
      case 'compartment': return <Inbox className="w-5 h-5 text-cyan-400" />;
      case 'container': return <Box className="w-5 h-5 text-rose-400" />;
      default: return <MapPin className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadgeColor = (type: LocationType) => {
    switch (type) {
      case 'building': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'floor': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'room': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'storage_unit': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'compartment': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'container': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  // Show loading state
  if (isLoading || isRefreshing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 text-sm">Loading locations...</p>
      </div>
    );
  }

  // Show empty state when no locations
  if (!locations || locations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Building className="w-12 h-12 text-indigo-400/60 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Locations Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Start by creating your first location. You can add buildings, floors, rooms, 
            or any other spatial container to organize your assets.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => onOpenAddLocation(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Location
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Interactive Breadcrumbs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-400" /> Spatial Navigation Trail
            </div>

            {/* Breadcrumb Bar */}
            <div className="flex items-center flex-wrap gap-1 text-xs">
              <button
                onClick={() => setSelectedLocationId(null)}
                className={`font-semibold transition-colors ${selectedLocationId === null ? 'text-white' : 'text-slate-400 hover:text-blue-300'}`}
              >
                All Organizations & Buildings
              </button>

              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <button
                    onClick={() => setSelectedLocationId(crumb.id)}
                    className={`font-medium transition-colors ${selectedLocationId === crumb.id ? 'text-blue-400 font-bold underline underline-offset-4' : 'text-slate-300 hover:text-white'}`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition-colors"
              title="Refresh locations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAddLocation(selectedLocationId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" /> Add Spatial Node
            </button>

            {currentLocation && (
              <button
                onClick={() => onOpenRegisterAssetAtLocation(currentLocation.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Register Asset Here
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Current Location Header Card (If selected) */}
      {currentLocation && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3">
            
            {/* Photo / Visual Context */}
            <div className="relative h-48 md:h-full bg-slate-800 min-h-[160px]">
              {currentLocation.photo_url ? (
                <img
                  src={currentLocation.photo_url}
                  alt={currentLocation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-xs">No visual photo available</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border uppercase tracking-wider ${getTypeBadgeColor(currentLocation.type)}`}>
                  {currentLocation.type.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Info Body */}
            <div className="p-6 md:col-span-2 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-400 font-semibold">{currentLocation.code}</div>
                  <h2 className="text-xl font-bold text-white mt-0.5">{currentLocation.name}</h2>
                  <p className="text-xs text-slate-300 mt-1">{currentLocation.description || 'No description provided.'}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-xs font-mono">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" /> {currentLocation.qr_code}
                  </span>
                </div>
              </div>

              {/* Occupancy / Capacity Gauge */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Space Occupancy & Capacity</span>
                  <span className="text-slate-200 font-bold">
                    {locationAssets.length} assets / Max {currentLocation.capacity || 100} capacity
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((locationAssets.length / (currentLocation.capacity || 100)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Grid of Child Spatial Nodes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            {selectedLocationId === null ? 'Buildings in Organization' : 'Sub-Locations & Cabinets'} ({childLocations.length})
          </h3>
          <span className="text-xs text-slate-400">Click any card to navigate deeper into space</span>
        </div>

        {childLocations.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Building className="w-10 h-10 text-indigo-400/60 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {selectedLocationId === null ? 'No Buildings or Facilities Created Yet' : 'No Sub-Locations inside this Spatial Container'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {selectedLocationId === null
                  ? 'Start indoor spatial mapping by creating your first primary building, exhibition pavilion, or archive site.'
                  : 'Add child rooms, floors, rolling cabinets, or storage boxes to organize assets within this area.'}
              </p>
            </div>
            <button
              onClick={() => onOpenAddLocation(selectedLocationId)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {selectedLocationId === null ? 'Add First Facility / Building' : 'Add Child Location / Storage Unit'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {childLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className="group bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 group-hover:border-blue-500/30 transition-colors">
                      {getLocationTypeIcon(loc.type)}
                    </div>
                    <div>
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${getTypeBadgeColor(loc.type)}`}>
                        {loc.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors mt-1">
                        {loc.name}
                      </h4>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{loc.description || 'Spatial container.'}</p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Code: {loc.code}</span>
                  <span className="text-slate-300 font-sans font-medium">
                    QR: {loc.qr_code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assets Stored in Current Location View */}
      {selectedLocationId && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" /> Physical Assets at This Location ({locationAssets.length})
            </h3>
            <button
              onClick={() => onOpenRegisterAssetAtLocation(selectedLocationId)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Register Asset Here
            </button>
          </div>

          {locationAssets.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
              No physical assets currently stored in this location.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locationAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-start gap-3 transition-all cursor-pointer hover:bg-slate-800/40"
                >
                  {asset.photos && asset.photos.length > 0 ? (
                    <img
                      src={asset.photos[0]}
                      alt={asset.title}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-blue-400">{asset.asset_number}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize
                        ${asset.status === 'available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : ''}
                        ${asset.status === 'checked_out' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : ''}
                        ${asset.status === 'in_transit' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : ''}
                      `}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white truncate">{asset.title}</h5>
                    <p className="text-[11px] text-slate-400 truncate">{asset.category_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};