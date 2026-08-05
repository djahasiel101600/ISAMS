/**
 * ISAMS Add Spatial Location Node Modal
 */

import React, { useState } from 'react';
import { X, Plus, MapPin } from 'lucide-react';
import { LocationNode, LocationType } from '../../types/isams';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  locations: LocationNode[];
  onSubmit: (data: {
    parent_id: string | null;
    type: LocationType;
    code: string;
    name: string;
    description: string;
    capacity: number;
    photo_url: string;
  }) => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  parentId,
  locations,
  onSubmit,
}) => {
  const [type, setType] = useState<LocationType>('storage_unit');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const parentLoc = locations.find(l => l.id === parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onSubmit({
      parent_id: parentId,
      type,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      capacity: Number(capacity) || 100,
      photo_url: photoUrl.trim()
    });

    // Reset
    setCode('');
    setName('');
    setDescription('');
    setPhotoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Add Spatial Location Node</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {parentLoc && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Parent Location</span>
              <span className="font-bold text-white">{parentLoc.name} ({parentLoc.code})</span>
            </div>
          )}

          {/* Location Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Spatial Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LocationType)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
            >
              <option value="building">Building / Facility</option>
              <option value="floor">Floor / Wing</option>
              <option value="room">Room / Vault Area</option>
              <option value="storage_unit">Storage Unit (Cabinet, Safe, Rack)</option>
              <option value="compartment">Compartment (Shelf, Drawer, Section)</option>
              <option value="container">Container (Box, Folder, Bin)</option>
            </select>
          </div>

          {/* Name & Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rolling Cabinet C"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Spatial Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CAB-C"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white uppercase placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key locks, physical specs, climate control..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Storage Capacity
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
            />
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Add Location
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
