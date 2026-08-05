/**
 * ISAMS Header Bar Component
 * Organization Switcher, Active Persona/Role Switcher, Command Search, QR Scanner Trigger
 */

import React from 'react';
import { 
  Building2, 
  Search, 
  QrCode, 
  ShieldCheck, 
  Plus, 
  Bell, 
  Layers
} from 'lucide-react';
import { Organization, User, RoleName } from '../../types/isams';

interface HeaderProps {
  organizations: Organization[];
  currentOrg: Organization;
  onSelectOrg: (org: Organization) => void;
  currentUser: User;
  onRoleChange: (role: RoleName) => void;
  onOpenQrScanner: () => void;
  onOpenRegisterAsset: () => void;
  onOpenRelocate: () => void;
  globalSearchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  organizations,
  currentOrg,
  onSelectOrg,
  currentUser,
  onRoleChange,
  onOpenQrScanner,
  onOpenRegisterAsset,
  onOpenRelocate,
  globalSearchQuery,
  onSearchChange,
}) => {
  const availableRoles: RoleName[] = [
    'Administrator',
    'Records Officer',
    'Inventory Manager',
    'Department Head',
    'Staff',
    'Viewer'
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">ISAMS</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  v1.0 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Indoor Spatial Asset Management System</p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search assets, AST-codes, barcodes, keywords, locations..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Actions & Persona Selector */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Quick Action: QR Scan */}
            <button
              onClick={onOpenQrScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Scan Asset or Location QR Code"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Scan QR</span>
            </button>

            {/* Quick Action: Add Asset */}
            <button
              onClick={onOpenRegisterAsset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Register Asset</span>
            </button>

            {/* Organization Selector */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={currentOrg.id}
                onChange={(e) => {
                  const selected = organizations.find(o => o.id === e.target.value);
                  if (selected) onSelectOrg(selected);
                }}
                className="bg-transparent text-slate-200 font-medium border-none focus:outline-none text-xs cursor-pointer"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id} className="bg-slate-900 text-slate-200">
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Persona / Role Switcher for Testing */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{currentUser.name}</span>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  <select
                    value={currentUser.role}
                    onChange={(e) => onRoleChange(e.target.value as RoleName)}
                    className="bg-slate-800/80 text-blue-300 font-medium rounded px-1 py-0.5 text-[10px] border border-slate-700 focus:outline-none cursor-pointer"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role} className="bg-slate-900 text-slate-200">
                        Role: {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
