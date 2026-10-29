/**
 * ISAMS Asset Detail View Modal
 * Comprehensive single asset inspection: Spatial Path, Media Gallery, Files, QR Code, Movement Timeline
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MoveRight, 
  Download, 
  User, 
  Calendar, 
  Tag, 
  Image as ImageIcon,
  History
} from 'lucide-react';
import { Asset } from '../../types/isams';
import { api } from '../../services/api';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  onOpenRelocate: (asset: Asset) => void;
  onOpenCheckOut: (asset: Asset) => void;
  onCheckIn: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onOpenRelocate,
  onOpenCheckOut,
  onCheckIn,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (asset) {
      api.renderQrCode(asset.qr_code).then(setQrDataUrl).catch(console.error);
    }
  }, [asset]);

  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
              {asset.asset_number}
            </span>
            <h3 className="text-base font-bold text-white truncate max-w-md">{asset.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Spatial Location Path Banner */}
          <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-800/40 rounded-xl p-4 space-y-1.5">
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Exact Spatial Storage Location
            </div>
            <div className="text-sm font-mono font-bold text-white leading-relaxed">
              {asset.location_path_formatted || 'Unassigned Location'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Photos & QR Code */}
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden min-h-[160px] flex items-center justify-center">
                {asset.photos && asset.photos.length > 0 ? (
                  <img
                    src={asset.photos[0]}
                    alt={asset.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <ImageIcon className="w-10 h-10 mx-auto mb-1" />
                    <span className="text-xs">No visual photo available</span>
                  </div>
                )}
              </div>

              {/* QR Code Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center space-y-2">
                <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Spatial QR Label</div>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Asset QR" className="w-32 h-32 mx-auto rounded-lg bg-white p-1" />
                )}
                <div className="text-[11px] font-mono text-blue-400 font-bold">{asset.qr_code}</div>
              </div>
            </div>

            {/* Asset Metadata & Status */}
            <div className="md:col-span-2 space-y-4">
              
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Description</h4>
                <p className="text-xs text-slate-200 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 leading-relaxed">
                  {asset.description || 'No detailed description recorded.'}
                </p>
              </div>

              {/* Category & Custody Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="font-bold text-white mt-0.5 block">{asset.category_name}</span>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block capitalize">
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Custody Info if Borrowed */}
              {asset.status === 'checked_out' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Clock className="w-4 h-4" /> Active Custody Borrow Record
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div><span className="text-slate-400">Borrower:</span> <strong className="text-white">{asset.checked_out_to}</strong></div>
                    <div><span className="text-slate-400">Due Date:</span> <span className="font-mono text-amber-300">{asset.due_date}</span></div>
                    {asset.notes && <div><span className="text-slate-400">Notes:</span> <em>"{asset.notes}"</em></div>}
                  </div>
                </div>
              )}

              {/* Keywords Tag List */}
              {asset.keywords && asset.keywords.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Indexed Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {asset.keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] rounded-md font-mono">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital Attachments */}
              {asset.documents && asset.documents.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Attached Digital Records ({asset.documents.length})
                  </span>
                  <div className="space-y-1">
                    {asset.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-slate-200">{doc.title}</span>
                          <span className="text-[10px] text-slate-400">({doc.file_size})</span>
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Registered: {new Date(asset.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenRelocate(asset);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              <MoveRight className="w-4 h-4 text-amber-400" /> Relocate
            </button>

            {asset.status === 'checked_out' ? (
              <button
                onClick={() => {
                  onCheckIn(asset);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Return Asset
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckOut(asset);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Check Out
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
