/**
 * ISAMS Header Bar Component
 * Organization Switcher, Permission Matrix Trigger, Command Search, QR Scanner Trigger
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  QrCode, 
  ShieldCheck, 
  Plus, 
  Layers,
  Key,
  Sliders,
  UserPlus,
  LogIn,
  RotateCcw,
  LogOut,
  ChevronDown,
  Server
} from 'lucide-react';
import { Organization, User } from '../../types/isams';

interface HeaderProps {
  organizations: Organization[];
  currentOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  currentUser: User | null;
  onOpenPermissionMatrix: () => void;
  onOpenQrScanner: () => void;
  onOpenRegisterAsset: () => void;
  onOpenRelocate: () => void;
  onOpenSystemSetup?: () => void;
  onOpenDjangoModal?: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onResetSystem?: () => void;
  globalSearchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  organizations,
  currentOrg,
  onSelectOrg,
  currentUser,
  onOpenPermissionMatrix,
  onOpenQrScanner,
  onOpenRegisterAsset,
  onOpenRelocate,
  onOpenSystemSetup,
  onOpenDjangoModal,
  onOpenAuth,
  onResetSystem,
  globalSearchQuery,
  onSearchChange,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Calculate count of active permissions
  const activePermissionCount = currentUser?.permissions 
    ? Object.values(currentUser.permissions).filter(Boolean).length 
    : 0;

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

          {/* Actions & Permission Controls */}
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

            {/* Quick Action: Register Asset (Guarded by permission) */}
            {currentUser?.permissions?.can_register_assets && (
              <button
                onClick={onOpenRegisterAsset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Register Asset</span>
              </button>
            )}

            {/* Organization Selector */}
            {organizations.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={currentOrg?.id || ''}
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
            )}

            {onOpenDjangoModal && (
              <button
                onClick={onOpenDjangoModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                title="Configure Django REST Backend & Download Models/Views"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Django Backend</span>
              </button>
            )}

            {onOpenSystemSetup && (
              <button
                onClick={onOpenSystemSetup}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                title="Initialize Event / Seed Preset Data"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">System Setup</span>
              </button>
            )}

            {/* User Account / Auth Control */}
            <div className="relative flex items-center gap-2 pl-2 border-l border-slate-800">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer text-left"
                    title="User Account & Security Matrix"
                  >
                    {currentUser.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                    
                    <div className="hidden sm:flex flex-col text-left pr-1">
                      <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
                      <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                        <Key className="w-3 h-3 text-indigo-400" />
                        <span>{currentUser.role}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
                      <div className="px-3.5 py-2 border-b border-slate-800">
                        <p className="font-bold text-slate-200">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                          {currentUser.role} &bull; {currentUser.department || 'Operations'}
                        </span>
                      </div>

                      <button
                        onClick={() => { setShowUserMenu(false); onOpenPermissionMatrix(); }}
                        className="w-full text-left px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Key className="w-4 h-4 text-indigo-400" /> Permission Matrix
                      </button>

                      {onOpenDjangoModal && (
                        <button
                          onClick={() => { setShowUserMenu(false); onOpenDjangoModal(); }}
                          className="w-full text-left px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Server className="w-4 h-4 text-emerald-400" /> Django Integration Hub
                        </button>
                      )}

                      <button
                        onClick={() => { setShowUserMenu(false); onOpenAuth('register'); }}
                        className="w-full text-left px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-emerald-400" /> Register New Account
                      </button>

                      <button
                        onClick={() => { setShowUserMenu(false); onOpenAuth('login'); }}
                        className="w-full text-left px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-blue-400" /> Switch / Sign In Account
                      </button>

                      {onResetSystem && (
                        <div className="pt-1 mt-1 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              if (window.confirm('Wipe system database and reset to Zero State (0 orgs, 0 assets, 0 users)?')) {
                                onResetSystem();
                              }
                            }}
                            className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 text-rose-400" /> Reset System to 0 Data
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-400" /> Sign In
                  </button>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Register
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
