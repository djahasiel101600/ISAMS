/**
 * ISAMS Dashboard View Component
 */

import React from 'react';
import { 
  Boxes, 
  CheckCircle2, 
  Clock, 
  MoveRight, 
  AlertTriangle, 
  Building, 
  Home, 
  Archive, 
  Plus, 
  QrCode, 
  ArrowUpRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { DashboardMetrics, AssetLocationHistory, AuditLog } from '../../types/isams';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  onNavigateTab: (tab: any) => void;
  onOpenRegisterAsset: () => void;
  onOpenRelocate: () => void;
  onOpenQrScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onNavigateTab,
  onOpenRegisterAsset,
  onOpenRelocate,
  onOpenQrScanner,
}) => {
  const safeMetrics: DashboardMetrics = metrics || {
    total_assets: 0,
    available_assets: 0,
    checked_out_assets: 0,
    in_transit_assets: 0,
    total_buildings: 0,
    total_rooms: 0,
    total_storage_units: 0,
    avg_occupancy_rate: 0,
    top_categories: [],
    recent_moves: [],
    recent_activities: [],
    missing_assets: 0
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" /> Operational Overview
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Indoor Spatial Asset System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time spatial mapping, custody control, and audit trail for physical files, biomedical equipment, and corporate archives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenRegisterAsset}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register Asset
            </button>
            <button
              onClick={onOpenRelocate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              <MoveRight className="w-4 h-4 text-amber-400" /> Relocate Asset
            </button>
            <button
              onClick={onOpenQrScanner}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-xl transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" /> Scan QR
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Registered Assets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{safeMetrics.total_assets}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
            <span className="text-emerald-400 font-medium">100% indexed</span> across facility locations
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Available in Storage</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{safeMetrics.available_assets}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
            <span>Ready for retrieval</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Checked Out / Custody</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{safeMetrics.checked_out_assets}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 mt-2 font-medium">
            <button onClick={() => onNavigateTab('borrowing')} className="hover:underline flex items-center gap-1">
              View borrowing register <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In-Transit / Relocating</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <MoveRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400">{safeMetrics.in_transit_assets}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
            <span>Relocation pending verification</span>
          </div>
        </div>

      </div>

      {/* Facility Spatial Gauges & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spatial Capacity Gauges */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-400" /> Spatial Storage Capacity
            </h3>
            <button 
              onClick={() => onNavigateTab('spatial')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Explore Map <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" /> Buildings Registered
              </span>
              <span className="font-bold text-white">{safeMetrics.total_buildings} Facilities</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-cyan-400" /> Rooms & Storage Vaults
              </span>
              <span className="font-bold text-white">{safeMetrics.total_rooms} Rooms</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-amber-400" /> Rolling Cabinets & Safes
              </span>
              <span className="font-bold text-white">{safeMetrics.total_storage_units} Units</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Average Facility Occupancy</span>
                <span className="font-bold text-emerald-400">{safeMetrics.avg_occupancy_rate}% Capacity Used</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${safeMetrics.avg_occupancy_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" /> Asset Distribution by Category
            </h3>
            <button 
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Full Inventory <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(safeMetrics.top_categories || []).map((cat, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  <span className="text-xs font-semibold text-slate-200">{cat.category_name}</span>
                </div>
                <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {cat.count} items
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Movements & Audit Log Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Asset Relocations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MoveRight className="w-4 h-4 text-amber-400" /> Recent Asset Movement Log
            </h3>
            <button 
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              View History
            </button>
          </div>

          <div className="space-y-3">
            {(safeMetrics.recent_moves || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent asset relocations recorded.</p>
            ) : (
              safeMetrics.recent_moves.map((move: AssetLocationHistory) => (
                <div key={move.id} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{move.asset_number}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(move.moved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium truncate">{move.asset_title}</p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <span className="truncate max-w-[140px] text-slate-400">{move.from_location_path}</span>
                    <MoveRight className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[140px] text-emerald-300">{move.to_location_path}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                    <span>Moved by: {move.moved_by_user_name}</span>
                    <span className="italic truncate max-w-[180px]">"{move.reason}"</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Activity Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" /> Compliance Audit Trail
            </h3>
            <button 
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Full Ledger
            </button>
          </div>

          <div className="space-y-3">
            {(safeMetrics.recent_activities || []).slice(0, 5).map((log: AuditLog) => (
              <div key={log.id} className="flex items-start gap-3 text-xs border-b border-slate-800/60 pb-2.5 last:border-none">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{log.user_name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
