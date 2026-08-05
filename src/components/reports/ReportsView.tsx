/**
 * ISAMS Reports & Spatial Analytics View
 */

import React from 'react';
import { BarChart3, Download, Building, Boxes, PieChart, FileCheck } from 'lucide-react';
import { DashboardMetrics } from '../../types/isams';

interface ReportsViewProps {
  metrics: DashboardMetrics | null;
  onExportCsv: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ metrics, onExportCsv }) => {
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
    recent_activities: []
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" /> Spatial Analytics & Reports
          </div>
          <h2 className="text-xl font-bold text-white">Facility Inventory & Storage Intelligence</h2>
          <p className="text-xs text-slate-300 mt-1">
            Generate executive compliance summaries, occupancy reports, and complete inventory exports.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export Complete CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <PieChart className="w-4 h-4 text-emerald-400" /> Category Inventory Volume
          </h3>

          <div className="space-y-3">
            {(safeMetrics.top_categories || []).map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{cat.category_name}</span>
                  <span className="font-bold text-white">{cat.count} items</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${Math.min(100, (cat.count / (safeMetrics.total_assets || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spatial Capacity Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-indigo-400" /> Spatial Facility Utilization
          </h3>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span>Total Facilities & Buildings</span>
              <span className="font-bold text-white">{safeMetrics.total_buildings} Facilities</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span>Vault Rooms & Storage Areas</span>
              <span className="font-bold text-white">{safeMetrics.total_rooms} Rooms</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span>Rolling Cabinets, Safes & Containers</span>
              <span className="font-bold text-white">{safeMetrics.total_storage_units} Units</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span>Overall Facility Storage Density</span>
              <span className="font-bold text-emerald-400">{safeMetrics.avg_occupancy_rate}% Capacity Used</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
