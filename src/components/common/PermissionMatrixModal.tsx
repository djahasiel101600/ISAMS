/**
 * ISAMS Permission-Based Access Control Matrix
 * Granular permission management for users replacing role-based enforcement
 */

import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Key, Sliders, UserCheck, Zap } from 'lucide-react';
import { User, PermissionSet, FULL_ADMIN_PERMISSIONS, STAFF_PERMISSIONS, VIEWER_PERMISSIONS } from '../../types/isams';

interface PermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdatePermissions: (newPermissions: PermissionSet) => void;
}

export const PermissionMatrixModal: React.FC<PermissionMatrixModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdatePermissions,
}) => {
  if (!isOpen) return null;

  const permissionLabels: { key: keyof PermissionSet; title: string; description: string }[] = [
    {
      key: 'can_register_assets',
      title: 'Register & Supply Assets',
      description: 'Ability to register physical items and supply new categories or organization entities'
    },
    {
      key: 'can_manage_locations',
      title: 'Manage Spatial Locations',
      description: 'Create, edit, and reorganize buildings, floors, rooms, and storage units'
    },
    {
      key: 'can_move_assets',
      title: 'Spatial Asset Relocation',
      description: 'Execute relocation wizards to move assets across spatial nodes'
    },
    {
      key: 'can_check_out_in',
      title: 'Custody & Check-Out/In',
      description: 'Perform asset borrowing, assign due dates, and execute return handshakes'
    },
    {
      key: 'can_edit_assets',
      title: 'Edit Asset Details',
      description: 'Update metadata, photos, documents, and keywords for registered assets'
    },
    {
      key: 'can_archive_delete',
      title: 'Archive & Delete Assets',
      description: 'Permanently remove or archive physical asset records from inventory'
    },
    {
      key: 'can_view_audit_logs',
      title: 'System Compliance Audit Logs',
      description: 'Access the immutable system ledger and view security event trails'
    },
    {
      key: 'can_export_reports',
      title: 'Export Reports & CSV',
      description: 'Generate spatial utilization metrics and export inventory data sheets'
    },
    {
      key: 'can_manage_organization',
      title: 'Manage Organization Profile',
      description: 'Configure corporate profiles, site addresses, and top-level settings'
    },
    {
      key: 'can_configure_db',
      title: 'PostgreSQL DB Integration',
      description: 'Access database diagnostics, connection parameters, and schema tools'
    },
    {
      key: 'can_ar_scan',
      title: 'AR Spatial Room Scanning',
      description: 'Launch AR room scanner sessions and anchor document annotations'
    },
    {
      key: 'can_manage_users',
      title: 'Manage User Permissions',
      description: 'Grant or restrict permission policies for system operators'
    }
  ];

  const handleToggle = (key: keyof PermissionSet) => {
    onUpdatePermissions({
      ...currentUser.permissions,
      [key]: !currentUser.permissions[key]
    });
  };

  const applyPreset = (preset: PermissionSet) => {
    onUpdatePermissions(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Permission-Based Authorization Policy</h3>
              <p className="text-[11px] text-slate-400">Granular feature permissions for user: <span className="text-slate-200 font-semibold">{currentUser.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Preset Quick Buttons */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Quick Permission Presets:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset(FULL_ADMIN_PERMISSIONS)}
                className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Full Access (All Permissions)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(STAFF_PERMISSIONS)}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Operational Staff
              </button>
              <button
                type="button"
                onClick={() => applyPreset(VIEWER_PERMISSIONS)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Read-Only Auditor
              </button>
            </div>
          </div>

          {/* Granular Permission Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {permissionLabels.map(({ key, title, description }) => {
              const isEnabled = !!currentUser.permissions?.[key];
              return (
                <div
                  key={key}
                  onClick={() => handleToggle(key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isEnabled 
                      ? 'bg-blue-950/30 border-blue-500/40 shadow-sm shadow-blue-500/5' 
                      : 'bg-slate-950/30 border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`mt-0.5 p-1 rounded-md shrink-0 ${isEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                    {isEnabled ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isEnabled ? 'text-white' : 'text-slate-400'}`}>{title}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {isEnabled ? 'ENABLED' : 'DENIED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">{description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Changes take effect immediately across all application views and navigation tabs.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all cursor-pointer"
            >
              Done & Save
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
