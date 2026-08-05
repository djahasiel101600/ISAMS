/**
 * ISAMS Instant QR Scanner & Code Lookup Modal
 */

import React, { useState } from 'react';
import { QrCode, X, Search, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Asset } from '../../types/isams';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetFound: (asset: Asset) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onAssetFound }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleScanLookup = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) return;
    setLoading(true);
    setError('');

    try {
      const asset = await api.getAssetByQrCode(codeToSearch.trim());
      onAssetFound(asset);
      setCode('');
      onClose();
    } catch (err: any) {
      setError(`No registered asset found matching QR code "${codeToSearch}". Please check code.`);
    } finally {
      setLoading(false);
    }
  };

  const sampleCodes = [
    'ISAMS-AST-2026-0001',
    'ISAMS-AST-2026-0002',
    'ISAMS-AST-2026-0003',
    'ISAMS-AST-2026-0004'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 text-emerald-400">
            <QrCode className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Instant QR Code Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Simulated Scanner Reticle */}
          <div className="relative h-48 bg-slate-950 border-2 border-dashed border-emerald-500/40 rounded-xl flex flex-col items-center justify-center text-center p-4 overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
            <Camera className="w-10 h-10 text-emerald-400 mb-2 relative z-10" />
            <p className="text-xs text-slate-300 font-medium relative z-10">
              Align camera over physical asset QR label or enter code below
            </p>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 relative z-10">
              [ Camera Sensor Active ]
            </span>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Scan or Enter QR Code Identifier
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanLookup(code)}
                placeholder="e.g. ISAMS-AST-2026-0001"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                disabled={loading || !code.trim()}
                onClick={() => handleScanLookup(code)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Scan'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Test Codes */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block">Quick test codes:</span>
            <div className="flex flex-wrap gap-1">
              {sampleCodes.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCode(sample);
                    handleScanLookup(sample);
                  }}
                  className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 px-2 py-0.5 rounded cursor-pointer"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
