/**
 * ISAMS Asset Registration Modal
 * Form for adding new physical items into exact spatial locations
 */

import React, { useState } from 'react';
import { X, Plus, MapPin, Tag, Image as ImageIcon, FileText } from 'lucide-react';
import { AssetCategory, LocationNode } from '../../types/isams';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AssetCategory[];
  locations: LocationNode[];
  initialLocationId?: string | null;
  onSubmit: (data: {
    title: string;
    category_id: string;
    location_id: string;
    description: string;
    keywords: string;
    photos: string[];
  }) => void;
}

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  categories,
  locations,
  initialLocationId,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [locationId, setLocationId] = useState(initialLocationId || locations[0]?.id || '');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !locationId) return;

    onSubmit({
      title: title.trim(),
      category_id: categoryId,
      location_id: locationId,
      description: description.trim(),
      keywords: keywords.trim(),
      photos: photoUrl.trim() ? [photoUrl.trim()] : []
    });

    // Reset
    setTitle('');
    setDescription('');
    setKeywords('');
    setPhotoUrl('');
    onClose();
  };

  const samplePhotoPresets = [
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Register New Physical Asset</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Asset Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Hospital Lease Contract (2025-2030)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Spatial Storage Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Spatial Storage Location <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    [{l.type}] {l.code} - {l.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Details & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail physical properties, contents, or special handling rules..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Indexed Keywords (Comma separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="deed, contract, expansion, confidential, 2026"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Photo URL & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Visual Reference Image URL
            </label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>Quick photo presets:</span>
              {samplePhotoPresets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhotoUrl(p)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 cursor-pointer"
                >
                  Sample #{i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Register Asset & Generate QR
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
