/**
 * ISAMS Asset Relocation Wizard Modal
 * Step-by-step physical relocation engine
 */

import React, { useState } from 'react';
import { X, MoveRight, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Asset, LocationNode } from '../../types/isams';

interface RelocationWizardModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  locations: LocationNode[];
  onConfirmRelocate: (assetId: string, newLocationId: string, reason: string) => void;
}

export const RelocationWizardModal: React.FC<RelocationWizardModalProps> = ({
  asset,
  isOpen,
  onClose,
  locations,
  onConfirmRelocate,
}) => {
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestinationId || !reason.trim()) return;

    onConfirmRelocate(asset.id, selectedDestinationId, reason.trim());
    setSelectedDestinationId('');
    setReason('');
    onClose();
  };

  const sampleReasons = [
    'Transferred to long-term fireproof vault archive.',
    'Relocated for annual biomedical calibration and safety test.',
    'Moved to legal compliance storage box per board signoff.',
    'Transferred following department office reorganization.'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 text-amber-400">
            <MoveRight className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Relocate Physical Asset</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Target Asset Summary */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[10px] font-mono font-bold text-blue-400">{asset.asset_number}</div>
            <div className="text-xs font-bold text-white">{asset.title}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono pt-1">
              <MapPin className="w-3 h-3 text-slate-400" /> Current: {asset.location_path_formatted}
            </div>
          </div>

          {/* New Destination Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Destination Spatial Location <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            >
              <option value="">-- Select Target Location --</option>
              {locations.map(l => (
                <option key={l.id} value={l.id} disabled={l.id === asset.location_id}>
                  [{l.type}] {l.code} - {l.name} {l.id === asset.location_id ? '(Current Location)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Relocation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason & Authorization Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State why this item is being moved and who authorized the relocation..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="space-y-1 mt-2">
              <span className="text-[10px] text-slate-400 block">Preset reasons:</span>
              <div className="flex flex-wrap gap-1">
                {sampleReasons.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(r)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Reason #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
            >
              <MoveRight className="w-4 h-4" /> Confirm Physical Relocation
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
