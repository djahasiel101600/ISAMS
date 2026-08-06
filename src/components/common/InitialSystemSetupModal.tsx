/**
 * ISAMS Initial System Setup & Onboarding Wizard
 * Prepares system for events/first-time deployment from zero-state
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ArrowRight,
  Boxes,
  MapPin,
  X
} from 'lucide-react';

interface InitialSystemSetupModalProps {
  isOpen: boolean;
  onInitializeSystem: (data: {
    orgName: string;
    orgCode: string;
    adminName: string;
    adminEmail: string;
    template: 'empty' | 'event_kit' | 'corporate_kit';
  }) => Promise<void>;
  onClose: () => void;
}

export const InitialSystemSetupModal: React.FC<InitialSystemSetupModalProps> = ({
  isOpen,
  onInitializeSystem,
  onClose
}) => {
  const [orgName, setOrgName] = useState('Enterprise Event Center');
  const [orgCode, setOrgCode] = useState('EEC-2026');
  const [adminName, setAdminName] = useState('System Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@eventcenter.org');
  const [template, setTemplate] = useState<'empty' | 'event_kit' | 'corporate_kit'>('event_kit');
  const [isInitializing, setIsInitializing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgCode.trim() || !adminName.trim()) return;

    setIsInitializing(true);
    try {
      await onInitializeSystem({
        orgName: orgName.trim(),
        orgCode: orgCode.trim(),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        template
      });
    } catch (err: any) {
      alert(`Initialization failed: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Close Control */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close system setup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Banner */}
        <div className="p-8 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-950 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg ring-1 ring-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                Cold Start Initial Setup
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                ISAMS System Onboarding
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Configure your initial organization structure, primary administrator account, and spatial asset hierarchy for live event deployment.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Organization Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" /> 1. Organization & Site Profile
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Organization / Event Facility Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Grand Expo & Convention Center"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Org Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  placeholder="e.g. EXPO-01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Primary Administrator */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" /> 2. Primary Administrator Account
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Administrator Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@eventcenter.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Initial Preset Kit */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> 3. Select Initial Infrastructure Preset
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div
                onClick={() => setTemplate('event_kit')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  template === 'event_kit'
                    ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">RECOMMENDED</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Event & Exhibition Kit</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                    Pre-configures Main Pavilion, AV Room, Stage Storage + Audio, Video, Kiosk categories & 5 sample equipment items.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTemplate('corporate_kit')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  template === 'corporate_kit'
                    ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Corporate Facility</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                    HQ Building, Floor 1, Vault Room + Laptops, Legal Binders, Furniture categories & sample office assets.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTemplate('empty')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  template === 'empty'
                    ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                      <Boxes className="w-4 h-4" />
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Clean Zero-State Canvas</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                    Completely empty database (0 assets, 0 locations, 0 categories). Perfect for manual data entry.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              System will configure full admin permissions for this account.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
              >
                Skip Setup
              </button>
              <button
                type="submit"
                disabled={isInitializing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isInitializing ? 'Bootstrapping System...' : 'Initialize Enterprise System'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
