'use client';

import React, { useState } from 'react';
import {
  Palette,
  X,
  Check,
  RotateCcw,
  Globe,
  Sliders,
  Sparkles,
  Layout,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';
import { THEME_PRESETS } from '@/lib/theme/presets';
import { HeaderStyleOption, BorderRadiusOption } from '@/lib/theme/types';

export function ThemeCustomizerModal() {
  const {
    previewTheme,
    applyPreset,
    updatePrimaryColor,
    updateSidebarColor,
    updateAccentColor,
    updateHeaderStyle,
    updateBorderRadius,
    updateDashboardBg,
    saveGlobalTheme,
    resetToDefault,
    isCustomizerOpen,
    closeCustomizer,
    isSaving,
    saveStatus,
    errorMessage,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'layout'>('presets');

  if (!isCustomizerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeCustomizer}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white"
              style={{ backgroundColor: previewTheme.primary }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  डैशबोर्ड थीम व रंग अनुकूलन (Theme Customizer)
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Globe className="w-3 h-3" />
                  वैश्विक स्तर (Global)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                यहाँ चुना गया रंग व स्टाइल Vercel पर डिप्लॉय होने के बाद सभी यूज़र्स के लिए लागू होगा।
              </p>
            </div>
          </div>
          <button
            onClick={closeCustomizer}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('presets')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-[var(--brand-teal-600)] text-[var(--brand-teal-700)]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>चुनिंदा प्रीसेट्स (Presets)</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'custom'
                ? 'border-[var(--brand-teal-600)] text-[var(--brand-teal-700)]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>कस्टम रंग एवं पैलेट (Custom Palette)</span>
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'layout'
                ? 'border-[var(--brand-teal-600)] text-[var(--brand-teal-700)]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>लेआउट व स्टाइल (Layout & Style)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div>
              <div className="text-xs text-slate-500 mb-3 font-medium">
                विशेष रूप से डिज़ाइन की गई आधिकारिक थीम चुनें:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = previewTheme.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`relative flex flex-col p-3 rounded-xl text-left border-2 transition-all ${
                        isSelected
                          ? 'border-[var(--brand-teal-600)] bg-slate-50 shadow-md ring-2 ring-[var(--brand-teal-500)]/30'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: preset.primary }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {/* Swatches */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span
                          className="w-5 h-5 rounded-full shadow-xs border border-white"
                          style={{ backgroundColor: preset.primary }}
                          title="Primary Brand"
                        />
                        <span
                          className="w-5 h-5 rounded-full shadow-xs border border-white"
                          style={{ backgroundColor: preset.sidebarBg }}
                          title="Sidebar"
                        />
                        <span
                          className="w-5 h-5 rounded-full shadow-xs border border-white"
                          style={{ backgroundColor: preset.accent }}
                          title="Accent"
                        />
                      </div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate mb-1">
                        {preset.nameEn}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM COLOR PICKER */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Primary Brand Color */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      प्राथमिक रंग (Primary Brand)
                    </label>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: previewTheme.primary }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    बटन, हाइलाइट्स, मुख्य कार्ड्स और ब्रांडिंग का रंग।
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={previewTheme.primary}
                      onChange={(e) => updatePrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={previewTheme.primary}
                      onChange={(e) => updatePrimaryColor(e.target.value)}
                      placeholder="#0d9488"
                      className="flex-1 px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-500)]"
                    />
                  </div>
                </div>

                {/* 2. Sidebar Color */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      साइडबार का रंग (Sidebar Background)
                    </label>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: previewTheme.sidebarBg }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    बाएं हाथ के नेविगेशन साइडबार का पृष्ठभूमि रंग।
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={previewTheme.sidebarBg}
                      onChange={(e) => updateSidebarColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={previewTheme.sidebarBg}
                      onChange={(e) => updateSidebarColor(e.target.value)}
                      placeholder="#042f2e"
                      className="flex-1 px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-500)]"
                    />
                  </div>
                </div>

                {/* 3. Accent Color */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      सहायक रंग (Accent Color)
                    </label>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: previewTheme.accent }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ग्राफ, ट्रेंड, संकेत व द्वितीयक बटनों का रंग।
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={previewTheme.accent}
                      onChange={(e) => updateAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={previewTheme.accent}
                      onChange={(e) => updateAccentColor(e.target.value)}
                      placeholder="#10b981"
                      className="flex-1 px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-teal-500)]"
                    />
                  </div>
                </div>
              </div>

              {/* Shade Scale Preview */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>स्वचालित जनरेटेड शेड पैलेट (Generated 11-step Shades)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    50 से 950 तक की संगति
                  </span>
                </div>
                <div className="grid grid-cols-11 gap-1 h-10 rounded-lg overflow-hidden border border-slate-200">
                  {Object.entries(previewTheme.shades).map(([shade, hex]) => (
                    <div
                      key={shade}
                      className="h-full flex flex-col items-center justify-center text-[9px] font-mono select-none"
                      style={{
                        backgroundColor: hex,
                        color: parseInt(shade, 10) > 400 ? '#ffffff' : '#0f172a',
                      }}
                      title={`${shade}: ${hex}`}
                    >
                      <span>{shade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT & STYLE */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              {/* Header Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  हेडर शैली (Header Style)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'glass',
                      title: 'ग्लास फ्रॉस्टेड (Frosted Glass)',
                      desc: 'आधुनिक अर्ध-पारदर्शी ब्लर इफ़ेक्ट',
                    },
                    {
                      id: 'white',
                      title: 'शुद्ध श्वेत (Clean White)',
                      desc: 'क्लासिक न्यूनतम व साफ किनारा',
                    },
                    {
                      id: 'tinted',
                      title: 'हल्का टिंट (Brand Tinted)',
                      desc: 'थीम के प्राथमिक रंग की सूक्ष्म आभा',
                    },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => updateHeaderStyle(h.id as HeaderStyleOption)}
                      className={`p-3 text-left rounded-xl border-2 transition-all ${
                        previewTheme.headerStyle === h.id
                          ? 'border-[var(--brand-teal-600)] bg-slate-50 ring-2 ring-[var(--brand-teal-500)]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{h.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{h.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  बॉर्डर गोलाई (Border Curvature)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'sm', label: 'कॉम्पैक्ट (6px)', preview: 'rounded-md' },
                    { id: 'md', label: 'संतुलित (12px)', preview: 'rounded-xl' },
                    { id: 'lg', label: 'मॉडर्न (16px)', preview: 'rounded-2xl' },
                    { id: 'xl', label: 'कर्व्ड (20px)', preview: 'rounded-3xl' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => updateBorderRadius(r.id as BorderRadiusOption)}
                      className={`p-3 text-center rounded-xl border-2 transition-all ${
                        previewTheme.borderRadius === r.id
                          ? 'border-[var(--brand-teal-600)] bg-slate-50 ring-2 ring-[var(--brand-teal-500)]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-12 h-6 mx-auto mb-2 bg-[var(--brand-teal-600)] ${r.preview}`}
                      />
                      <div className="text-xs font-semibold text-slate-800">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard Background */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  डैशबोर्ड पृष्ठभूमि टोन (Background Tone)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: '#f8fafc', name: 'स्लेट न्यूट्रल (Slate)', preview: '#f8fafc' },
                    { id: '#ffffff', name: 'क्रिसेंट व्हाइट (Pure White)', preview: '#ffffff' },
                    { id: '#fafaf9', name: 'वार्म स्टोन (Warm Stone)', preview: '#fafaf9' },
                    { id: '#0f172a', name: 'डार्क स्लेट (Dark Slate)', preview: '#0f172a' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => updateDashboardBg(bg.id)}
                      className={`p-3 flex items-center gap-2 rounded-xl border-2 transition-all ${
                        previewTheme.dashboardBg === bg.id
                          ? 'border-[var(--brand-teal-600)] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-slate-300"
                        style={{ backgroundColor: bg.preview }}
                      />
                      <span className="text-xs font-medium text-slate-800">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LIVE MINI PREVIEW COMPONENT */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                लाइव डैशबोर्ड प्रीव्यू (Live Component Preview)
              </span>
              <span className="text-[11px] text-slate-400">
                (स्क्रीन पर तुरंत बदलाव देखें)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-100/70">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Mini Sidebar */}
                <div
                  className="sm:w-44 p-3 rounded-lg text-white shadow-sm flex flex-col justify-between"
                  style={{ backgroundColor: previewTheme.sidebarBg }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: previewTheme.primary }}
                      >
                        म.प्र.
                      </div>
                      <span className="text-xs font-bold truncate">संकल्प पत्र</span>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-[11px] font-semibold text-white shadow-xs flex items-center justify-between"
                      style={{ backgroundColor: previewTheme.sidebarActive }}
                    >
                      <span>डैशबोर्ड</span>
                      <span className="text-[9px] bg-black/20 px-1 rounded">414</span>
                    </div>
                    <div className="px-2 py-1 rounded text-[11px] text-white/70 hover:text-white">
                      विश्लेषण
                    </div>
                  </div>
                  <div className="text-[9px] text-white/50 pt-2 border-t border-white/10">
                    वर्जन 1.0
                  </div>
                </div>

                {/* Mini Content Area */}
                <div className="flex-1 space-y-3">
                  {/* Mini Header */}
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-xs font-bold text-slate-800">
                      कार्यकारी अवलोकन (Overview)
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[11px] font-semibold rounded text-white shadow-xs"
                      style={{ backgroundColor: previewTheme.primary }}
                    >
                      कार्रवाई
                    </button>
                  </div>

                  {/* Mini Cards Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500">कुल वादे</div>
                      <div className="text-base font-bold text-slate-900">414</div>
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          backgroundColor: previewTheme.shades[50],
                          color: previewTheme.shades[800],
                          border: `1px solid ${previewTheme.shades[200]}`,
                        }}
                      >
                        पूर्ण: 47 (11.4%)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500">प्रगति दर</div>
                      <div className="text-base font-bold text-slate-900">77.3%</div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: '77%',
                            backgroundColor: previewTheme.accent,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Banners */}
          {saveStatus === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">सफलतापूर्वक सहेजा गया!</span> यह थीम Vercel पर डिप्लॉय होने के बाद सभी यूज़र्स के लिए स्थायी रूप से सक्रिय हो चुकी है।
              </div>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <span className="font-bold">सहेजने में त्रुटि:</span>{' '}
                {errorMessage || 'कृपया इंटरनेट व डेटाबेस कनेक्शन जाँचें।'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={resetToDefault}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>डिफ़ॉल्ट रीसेट</span>
            </button>
            <button
              type="button"
              onClick={closeCustomizer}
              disabled={isSaving}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              रद्द करें
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={saveGlobalTheme}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all transform active:scale-95 disabled:opacity-70 cursor-pointer"
              style={{
                backgroundColor: previewTheme.primary,
                boxShadow: `0 4px 14px 0 ${previewTheme.primary}40`,
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>वैश्विक रूप से सहेजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>🌐 Vercel व सभी यूज़र्स के लिए वैश्विक सहेजें (Save Globally)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
