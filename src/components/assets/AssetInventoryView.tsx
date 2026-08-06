/**
 * ISAMS Asset Inventory View Component
 * Enterprise asset data table with search, faceted filtering, pagination, & quick actions
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  QrCode, 
  MoveRight, 
  Eye, 
  BookOpenCheck, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  SlidersHorizontal
} from 'lucide-react';
import { Asset, AssetCategory, LocationNode, AssetStatus, PaginatedResult } from '../../types/isams';

interface AssetInventoryViewProps {
  paginatedAssets: PaginatedResult<Asset>;
  categories: AssetCategory[];
  locations: LocationNode[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (catId: string) => void;
  selectedStatus: AssetStatus | 'all';
  onStatusChange: (status: AssetStatus | 'all') => void;
  selectedLocationId: string;
  onLocationChange: (locId: string) => void;
  page: number;
  onPageChange: (p: number) => void;
  onSelectAsset: (asset: Asset) => void;
  onOpenRelocateAsset: (asset: Asset) => void;
  onOpenCheckOutAsset: (asset: Asset) => void;
  onCheckInAsset: (asset: Asset) => void;
  onOpenRegisterAsset: () => void;
  onPrintQrLabel: (asset: Asset) => void;
  onExportCsv: () => void;
}

export const AssetInventoryView: React.FC<AssetInventoryViewProps> = ({
  paginatedAssets,
  categories,
  locations,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedLocationId,
  onLocationChange,
  page,
  onPageChange,
  onSelectAsset,
  onOpenRelocateAsset,
  onOpenCheckOutAsset,
  onCheckInAsset,
  onOpenRegisterAsset,
  onPrintQrLabel,
  onExportCsv,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const statuses: { id: AssetStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Statuses' },
    { id: 'available', label: 'Available' },
    { id: 'checked_out', label: 'Checked Out' },
    { id: 'in_transit', label: 'In Transit' },
    { id: 'missing', label: 'Missing' },
  ];

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by AST-#, title, keywords, barcode..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggles & Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {(selectedCategoryId !== 'all' || selectedStatus !== 'all' || selectedLocationId !== 'all' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onCategoryChange('all');
                  onStatusChange('all');
                  onLocationChange('all');
                  onPageChange(1);
                }}
                className="px-2.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${showFilters ? 'bg-blue-600/20 text-blue-300 border-blue-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
            </button>

            <button
              onClick={onOpenRegisterAsset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Register Asset
            </button>
          </div>

        </div>

        {/* Collapsible Filter Bar */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Asset Category</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Custody Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value as any)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Spatial Location Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Spatial Location</label>
              <select
                value={selectedLocationId}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="all">All Locations</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.code} - {l.name} ({l.type})</option>
                ))}
              </select>
            </div>

          </div>
        )}
      </div>

      {/* Asset Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset Code / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Spatial Storage Location</th>
                <th className="py-3 px-4">Custody Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedAssets.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No physical assets found matching the query and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedAssets.data.map((asset) => (
                  <tr 
                    key={asset.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Title & Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {asset.photos && asset.photos.length > 0 ? (
                          <img
                            src={asset.photos[0]}
                            alt={asset.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-blue-400">{asset.asset_number}</div>
                          <div 
                            onClick={() => onSelectAsset(asset)}
                            className="font-bold text-white group-hover:text-blue-300 cursor-pointer truncate max-w-xs"
                          >
                            {asset.title}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200">
                        {asset.category_name}
                      </span>
                    </td>

                    {/* Location Path */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-[11px] font-mono text-slate-300 truncate" title={asset.location_path_formatted}>
                        {asset.location_path_formatted || 'Unassigned Location'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize
                        ${asset.status === 'available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : ''}
                        ${asset.status === 'checked_out' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : ''}
                        ${asset.status === 'in_transit' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : ''}
                      `}>
                        {asset.status === 'available' && <CheckCircle2 className="w-3 h-3" />}
                        {asset.status === 'checked_out' && <Clock className="w-3 h-3" />}
                        {asset.status.replace('_', ' ')}
                      </span>
                      {asset.checked_out_to && (
                        <div className="text-[10px] text-amber-400 mt-0.5 truncate max-w-[140px]">
                          Borrower: {asset.checked_out_to}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Details */}
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="View Asset Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Relocate */}
                        <button
                          onClick={() => onOpenRelocateAsset(asset)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Relocate Asset"
                        >
                          <MoveRight className="w-4 h-4" />
                        </button>

                        {/* Check out / check in */}
                        {asset.status === 'checked_out' ? (
                          <button
                            onClick={() => onCheckInAsset(asset)}
                            className="px-2 py-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                            title="Return Asset"
                          >
                            Return
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCheckOutAsset(asset)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Check Out Asset"
                          >
                            <BookOpenCheck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Print QR */}
                        <button
                          onClick={() => onPrintQrLabel(asset)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Print QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{paginatedAssets.data.length}</span> of{' '}
            <span className="font-bold text-white">{paginatedAssets.total}</span> assets
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-200">
              Page {page} of {paginatedAssets.total_pages || 1}
            </span>
            <button
              disabled={page >= paginatedAssets.total_pages}
              onClick={() => onPageChange(page + 1)}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
