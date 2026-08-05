/**
 * ISAMS Custody & Borrowing Register
 * Check-In / Check-Out ledger for borrowed physical files, binders, & equipment
 */

import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Calendar, 
  X,
  FileText
} from 'lucide-react';
import { Asset } from '../../types/isams';

interface CheckInOutViewProps {
  assets: Asset[];
  onCheckInAsset: (asset: Asset) => void;
  onOpenCheckOutAsset: (asset: Asset) => void;
  onSelectAsset: (asset: Asset) => void;
}

export const CheckInOutView: React.FC<CheckInOutViewProps> = ({
  assets,
  onCheckInAsset,
  onOpenCheckOutAsset,
  onSelectAsset,
}) => {
  const [search, setSearch] = useState('');

  const checkedOutAssets = assets.filter(a => a.status === 'checked_out');

  const filtered = checkedOutAssets.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.asset_number.toLowerCase().includes(search.toLowerCase()) ||
    (a.checked_out_to && a.checked_out_to.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpenCheck className="w-4 h-4" /> Custody Borrowing Register
          </div>
          <h2 className="text-xl font-bold text-white">Active Asset Custody & Borrowing Ledger</h2>
          <p className="text-xs text-slate-300 mt-1">
            Track out-of-storage physical files, clinical trial logs, and borrowed biomedical devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-right">
            <span className="text-xs font-bold text-amber-400 block">{checkedOutAssets.length} Assets Borrowed</span>
            <span className="text-[10px] text-slate-400">Active Custody Contracts</span>
          </div>
        </div>
      </div>

      {/* Table & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by borrower, asset code, title..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset Code / Item</th>
                <th className="py-3 px-4">Custodial Borrower</th>
                <th className="py-3 px-4">Checked Out Date</th>
                <th className="py-3 px-4">Expected Due Date</th>
                <th className="py-3 px-4">Home Location</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active assets are currently checked out. All items in storage.
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-blue-400">{asset.asset_number}</div>
                      <div 
                        onClick={() => onSelectAsset(asset)}
                        className="font-bold text-white hover:text-blue-300 cursor-pointer truncate max-w-xs"
                      >
                        {asset.title}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{asset.checked_out_to || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{asset.notes}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {asset.checked_out_at ? new Date(asset.checked_out_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {asset.due_date || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-slate-400 truncate font-mono">
                      {asset.location_path_formatted}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onCheckInAsset(asset)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Return Asset
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
