/**
 * ISAMS Check-Out Custody Modal
 * Dedicated form dialog replacing browser native prompts with dependency validation
 */

import React, { useState, useEffect } from 'react';
import { X, BookOpenCheck, Calendar, User, Building, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Asset, User as UserType } from '../../types/isams';

interface CheckOutModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  users?: UserType[];
  onConfirmCheckOut: (assetId: string, borrowerName: string, dueDate: string, notes: string) => Promise<void>;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  asset,
  isOpen,
  onClose,
  users = [],
  onConfirmCheckOut,
}) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [department, setDepartment] = useState('IT Operations');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Default due date to +14 days from today
  useEffect(() => {
    if (isOpen) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setDueDate(defaultDate.toISOString().split('T')[0]);
      setBorrowerName('');
      setNotes('');
      setAgreedToTerms(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Input dependency validations
    if (!borrowerName.trim()) {
      setErrorMsg('Please specify the borrower name or select a registered user.');
      return;
    }

    if (!dueDate) {
      setErrorMsg('Please select an expected return due date.');
      return;
    }

    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrorMsg('The expected return due date cannot be in the past.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('Please acknowledge the spatial custody compliance terms before check-out.');
      return;
    }

    try {
      setIsSubmitting(true);
      const combinedNotes = `Department: ${department}. ${notes ? `Notes: ${notes}` : ''}`;
      await onConfirmCheckOut(asset.id, borrowerName.trim(), dueDate, combinedNotes);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to complete check-out.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Asset Custody Check-Out</h3>
              <p className="text-xs text-slate-400">Assign physical responsibility and return due date</p>
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
          
          {/* Asset Context Summary Card */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            {asset.photos && asset.photos.length > 0 ? (
              <img
                src={asset.photos[0]}
                alt={asset.title}
                className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                {asset.asset_number.slice(0, 3)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {asset.asset_number}
                </span>
                <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{asset.category_name}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{asset.title}</h4>
            </div>
          </div>

          {/* Validation Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Input: Borrower Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" /> Borrower / Assigned Custodian <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="e.g. Dr. Aris Thorne or Sarah Jenkins"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            />
            {/* Quick Suggestions from system users */}
            {users.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500">Quick Select:</span>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setBorrowerName(u.name);
                      if (u.department) setDepartment(u.department);
                    }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Grid: Department & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" /> Department / Team
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 cursor-pointer"
              >
                <option value="IT Operations">IT Operations</option>
                <option value="Facilities Management">Facilities Management</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Executive Administration">Executive Administration</option>
                <option value="Security & Compliance">Security & Compliance</option>
              </select>
            </div>

            {/* Expected Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Expected Due Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 cursor-pointer"
                required
              />
            </div>

          </div>

          {/* Input: Purpose Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Borrowing Purpose & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Field inspection of Building B HVAC unit..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            />
          </div>

          {/* Term Compliance Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 leading-tight">
              I verify that custodian has accepted physical responsibility for this asset under spatial inventory guidelines.
            </span>
          </label>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Processing Check-Out...' : 'Confirm Check-Out'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
