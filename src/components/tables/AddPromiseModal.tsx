'use client';

import React, { useState } from 'react';
import { PromiseRecord, PromiseStatus, PoliticalImportance } from '@/types';
import { STATUS_CONFIG, IMPORTANCE_CONFIG } from '@/lib/analytics/metrics';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddPromiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<PromiseRecord, 'id' | 'updatedAt'>) => Promise<void>;
  availableDepartments: string[];
  availableCategories: string[];
}

export function AddPromiseModal({
  isOpen,
  onClose,
  onAdd,
  availableDepartments,
  availableCategories,
}: AddPromiseModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(availableDepartments[0] || 'सामान्य प्रशासन विभाग');
  const [category, setCategory] = useState(availableCategories[0] || 'समृद्ध किसान');
  const [status, setStatus] = useState<PromiseStatus>('NOT_STARTED');
  const [politicalImportance, setPoliticalImportance] = useState<PoliticalImportance>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [referenceLink1, setReferenceLink1] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('घोषणा / वादा शीर्षक अनिवार्य है।');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        departments: [department],
        primaryDepartment: department,
        category,
        workStarted: status !== 'NOT_STARTED',
        status,
        statusRaw: STATUS_CONFIG[status].labelHi,
        politicalImportance,
        politicalImportanceRaw: IMPORTANCE_CONFIG[politicalImportance].labelHi,
        notes: notes.trim() || null,
        groundImpact: null,
        publicPerception: null,
        delayReason: null,
        keyAchievements: null,
        referenceLinks: referenceLink1.trim() ? [referenceLink1.trim()] : [],
        referenceLink1: referenceLink1.trim() || null,
        referenceLink2: null,
        newsImage: null,
        politicalIssue: null,
        officialConfirmationLink: null,
        updateNotes: null,
        sourceSheet: 'All Promises',
        sourceRow: 0,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'वादा जोड़ने में विफलता';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                नवीन संकल्प पत्र वादा जोड़ें (Add New Promise)
              </h3>
              <p className="text-[11px] text-slate-500">
                मध्य प्रदेश संकल्प पत्र 2023 के तहत नवीन प्रविष्टि दर्ज करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              घोषणा / वादा शीर्षक *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="उदा. मुख्यमंत्री किसान सम्मान निधि योजना..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              संक्षिप्त विवरण (Description)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="घोषणा के मुख्य प्रावधान, लक्ष्य एवं क्रियान्वयन रूपरेखा..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Department & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                संबंधित विभाग
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white truncate"
              >
                {availableDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                श्रेणी / क्षेत्र (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white truncate"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Political Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                वर्तमान स्थिति (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PromiseStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="NOT_STARTED">प्रारंभ नहीं (Not Started)</option>
                <option value="INITIAL_STAGE">प्रारंभिक चरण (Initial Stage)</option>
                <option value="IN_PROGRESS">प्रगति पर (In Progress)</option>
                <option value="COMPLETED">पूर्ण (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                राजनीतिक महत्व (Priority)
              </label>
              <select
                value={politicalImportance}
                onChange={(e) => setPoliticalImportance(e.target.value as PoliticalImportance)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="HIGH">उच्च (High)</option>
                <option value="MEDIUM">मध्यम (Medium)</option>
                <option value="LIMITED">सीमित (Limited)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              प्रशासनिक टिप्पणी (Notes / Cabinet decisions)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="कैबिनेट निर्णय, आदेश संख्या अथवा टिप्पणी..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Reference Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              संदर्भ लिंक (URL)
            </label>
            <input
              type="url"
              value={referenceLink1}
              onChange={(e) => setReferenceLink1(e.target.value)}
              placeholder="https://mp.gov.in/order/..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              रद्द करें
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'जोड़ा जा रहा है...' : 'वादा सहेजें (Save Promise)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
