/**
 * ISAMS QR Studio & Label Printing Workspace
 * Custom label dimension layout, batch preview, and high-res print stylesheet
 */

import React, { useState, useEffect } from 'react';
import { QrCode, Printer, Download, Layers, Tag, Check, Copy } from 'lucide-react';
import { Asset, LocationNode } from '../../types/isams';
import { api } from '../../services/api';

interface QrStudioViewProps {
  assets: Asset[];
  locations: LocationNode[];
}

export const QrStudioView: React.FC<QrStudioViewProps> = ({ assets, locations }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [labelSize, setLabelSize] = useState<'2x1' | '3x2' | 'avery'>('2x1');
  const [copied, setCopied] = useState(false);

  const activeAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  useEffect(() => {
    if (activeAsset) {
      api.renderQrCode(activeAsset.qr_code).then(setQrDataUrl).catch(console.error);
    }
  }, [activeAsset]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    if (activeAsset) {
      navigator.clipboard.writeText(activeAsset.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" /> Physical Label Printing Studio
          </div>
          <h2 className="text-xl font-bold text-white">QR Code & Barcode Label Generator</h2>
          <p className="text-xs text-slate-300 mt-1">
            Generate physical adhesive QR code labels for boxes, cabinets, shelves, and asset binders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print High-Res Labels
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Label Configuration
          </h3>

          {/* Select Asset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Target Asset
            </label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.asset_number} - {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Label Dimensions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Label Physical Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLabelSize('2x1')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${labelSize === '2x1' ? 'bg-blue-600/20 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                2" × 1" Small
              </button>
              <button
                onClick={() => setLabelSize('3x2')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${labelSize === '3x2' ? 'bg-blue-600/20 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                3" × 2" Medium
              </button>
              <button
                onClick={() => setLabelSize('avery')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${labelSize === 'avery' ? 'bg-blue-600/20 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                Avery 5160 Sheet
              </button>
            </div>
          </div>

          {/* Code String Display */}
          {activeAsset && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>QR Raw Payload</span>
                <button onClick={handleCopyCode} className="text-blue-400 hover:underline text-[10px] flex items-center gap-1 cursor-pointer">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Payload'}
                </button>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-blue-300 break-all">
                {activeAsset.qr_code}
              </div>
            </div>
          )}

        </div>

        {/* Live Print Preview Canvas */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-blue-400" /> Print Layout Preview
          </div>

          {activeAsset && qrDataUrl ? (
            <div className="print-area bg-white text-slate-900 p-6 rounded-xl shadow-2xl border border-slate-300 w-full max-w-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">ISAMS SPATIAL LABEL</span>
                  <span className="text-xs font-mono font-extrabold text-slate-900">{activeAsset.asset_number}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {activeAsset.category_name}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 border border-slate-200 p-1 rounded" />
                <div className="space-y-1 text-left min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">{activeAsset.title}</h4>
                  <div className="text-[10px] font-mono text-slate-600 line-clamp-2 pt-1 border-t border-slate-100">
                    Location: {activeAsset.location_path_formatted}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono pt-1">
                    Barcode: {activeAsset.barcode}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Select an asset to generate preview.</p>
          )}

        </div>

      </div>

    </div>
  );
};
