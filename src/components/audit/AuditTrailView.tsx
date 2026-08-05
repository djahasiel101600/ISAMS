/**
 * ISAMS Immutable Compliance Audit Trail
 */

import React, { useState } from 'react';
import { History, ShieldCheck, Search, Filter, Download, User, FileText } from 'lucide-react';
import { AuditLog } from '../../types/isams';

interface AuditTrailViewProps {
  logs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filtered = logs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Compliance Audit Trail
          </div>
          <h2 className="text-xl font-bold text-white">Immutable System Action Ledger</h2>
          <p className="text-xs text-slate-300 mt-1">
            Tamper-evident log of all asset registrations, spatial movements, custody transfers, and QR print events.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-right">
          <span className="text-xs font-bold text-indigo-300 block">{logs.length} Recorded Events</span>
          <span className="text-[10px] text-slate-400">100% Audit Ready</span>
        </div>
      </div>

      {/* Table & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action, details..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none font-medium"
            >
              <option value="all">All Action Types</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="moved">Relocated</option>
              <option value="checked_out">Checked Out</option>
              <option value="checked_in">Checked In</option>
              <option value="printed">Printed QR</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User / Persona</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{log.user_name}</div>
                      <div className="text-[10px] text-blue-400 font-mono">{log.user_role}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-200">
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {log.details}
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 text-right whitespace-nowrap">
                      {log.ip_address}
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
