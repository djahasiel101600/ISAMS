/**
 * ISAMS Asset Registration Modal
 * Form for adding new physical items into exact spatial locations.
 * Allows supplying custom Category and Organization directly if needed/necessary.
 */

import React, { useState } from 'react';
import { X, Plus, MapPin, Tag, Image as ImageIcon, FileText, Building2, PlusCircle, Check } from 'lucide-react';
import { AssetCategory, LocationNode, Organization } from '../../types/isams';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  currentOrgId: string;
  categories: AssetCategory[];
  locations: LocationNode[];
  initialLocationId?: string | null;
  onSubmit: (data: {
    title: string;
    organization_id: string;
    category_id: string;
    location_id: string;
    description: string;
    keywords: string;
    photos: string[];
    // Optional new organization details supplied by user
    newOrganization?: {
      name: string;
      code: string;
      contact_email?: string;
    };
    // Optional new category details supplied by user
    newCategory?: {
      name: string;
      code: string;
      description?: string;
      color?: string;
    };
  }) => void;
}

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  organizations,
  currentOrgId,
  categories,
  locations,
  initialLocationId,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  
  // Organization state
  const [selectedOrgId, setSelectedOrgId] = useState<string>(currentOrgId || organizations[0]?.id || 'CREATE_NEW');
  const [isSupplyingNewOrg, setIsSupplyingNewOrg] = useState<boolean>(organizations.length === 0);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCode, setNewOrgCode] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');

  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'CREATE_NEW');
  const [isSupplyingNewCategory, setIsSupplyingNewCategory] = useState<boolean>(categories.length === 0);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Location & Details
  const initialLoc = initialLocationId || locations[0]?.id || 'auto_create_default';
  const [locationIdState, setLocationId] = useState(initialLoc);
  const locationId = locationIdState || initialLoc;
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handleOrgSelectChange = (val: string) => {
    if (val === 'CREATE_NEW') {
      setIsSupplyingNewOrg(true);
      setSelectedOrgId('CREATE_NEW');
    } else {
      setIsSupplyingNewOrg(false);
      setSelectedOrgId(val);
    }
  };

  const handleCategorySelectChange = (val: string) => {
    if (val === 'CREATE_NEW') {
      setIsSupplyingNewCategory(true);
      setSelectedCategoryId('CREATE_NEW');
    } else {
      setIsSupplyingNewCategory(false);
      setSelectedCategoryId(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationId) return;

    if (isSupplyingNewOrg && !newOrgName.trim()) return;
    if (isSupplyingNewCategory && !newCategoryName.trim()) return;

    onSubmit({
      title: title.trim(),
      organization_id: isSupplyingNewOrg ? 'pending_new_org' : selectedOrgId,
      category_id: isSupplyingNewCategory ? 'pending_new_cat' : selectedCategoryId,
      location_id: locationId,
      description: description.trim(),
      keywords: keywords.trim(),
      photos: photoUrl.trim() ? [photoUrl.trim()] : [],
      newOrganization: isSupplyingNewOrg ? {
        name: newOrgName.trim(),
        code: newOrgCode.trim() || newOrgName.trim().slice(0, 4).toUpperCase(),
        contact_email: newOrgEmail.trim()
      } : undefined,
      newCategory: isSupplyingNewCategory ? {
        name: newCategoryName.trim(),
        code: newCategoryCode.trim() || newCategoryName.trim().slice(0, 4).toUpperCase(),
        description: newCategoryDesc.trim()
      } : undefined
    });

    // Reset Form
    setTitle('');
    setNewOrgName('');
    setNewOrgCode('');
    setNewOrgEmail('');
    setNewCategoryName('');
    setNewCategoryCode('');
    setNewCategoryDesc('');
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
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Register New Physical Asset</h3>
              <p className="text-[11px] text-slate-400">Supply asset specs, spatial location, category, & organization details</p>
            </div>
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

          {/* Organization & Category Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/80">
            
            {/* Organization (Select or Supply New) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Organization <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleOrgSelectChange(isSupplyingNewOrg ? (organizations[0]?.id || '') : 'CREATE_NEW')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
                >
                  {isSupplyingNewOrg ? 'Choose Existing Org' : '+ Supply New Org'}
                </button>
              </div>

              {!isSupplyingNewOrg ? (
                <select
                  required
                  value={selectedOrgId}
                  onChange={(e) => handleOrgSelectChange(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                  ))}
                  <option value="CREATE_NEW">+ Supply / Enter New Organization...</option>
                </select>
              ) : (
                <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-indigo-500/30">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">Supplying New Organization</span>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Organization Name *"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newOrgCode}
                      onChange={(e) => setNewOrgCode(e.target.value)}
                      placeholder="Code (e.g. MHA)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-400 focus:outline-none"
                    />
                    <input
                      type="email"
                      value={newOrgEmail}
                      onChange={(e) => setNewOrgEmail(e.target.value)}
                      placeholder="Contact Email"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category (Select Type Input Field or Supply New) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  Category <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCategorySelectChange(isSupplyingNewCategory ? (categories[0]?.id || '') : 'CREATE_NEW')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
                >
                  {isSupplyingNewCategory ? 'Choose Existing Category' : '+ Supply New Category'}
                </button>
              </div>

              {!isSupplyingNewCategory ? (
                <select
                  required
                  value={selectedCategoryId}
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                  <option value="CREATE_NEW">+ Supply / Enter New Category...</option>
                </select>
              ) : (
                <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-blue-500/30">
                  <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">Supplying New Asset Category</span>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category Name (e.g. Legal Binders) *"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCategoryCode}
                      onChange={(e) => setNewCategoryCode(e.target.value)}
                      placeholder="Category Code (e.g. LEG)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      placeholder="Brief Description"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Spatial Storage Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Spatial Storage Location <span className="text-rose-400">*</span>
            </label>
            {locations.length > 0 ? (
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono cursor-pointer"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    [{l.type}] {l.code} - {l.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <span className="text-xs text-amber-400">No spatial locations created yet.</span>
                <span className="text-[11px] text-slate-400">Main Staging Node will be auto-generated upon registration.</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Details & Description
            </label>
            <textarea
              rows={2}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Register Asset & Generate QR
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
