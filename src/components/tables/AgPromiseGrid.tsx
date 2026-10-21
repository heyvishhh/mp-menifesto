'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { PromiseRecord, PromiseStatus, PoliticalImportance } from '@/types';
import { StatusBadge, ImportanceBadge } from '@/components/dashboard/StatusBadge';
import { STATUS_CONFIG, IMPORTANCE_CONFIG } from '@/lib/analytics/metrics';
import { AddPromiseModal } from './AddPromiseModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  CheckCircle2, 
} from 'lucide-react';
import Link from 'next/link';

interface AgPromiseGridProps {
  promises: PromiseRecord[];
  onUpdatePromise: (id: number, updates: Partial<PromiseRecord>) => Promise<void>;
  onAddPromise: (data: Omit<PromiseRecord, 'id' | 'updatedAt'>) => Promise<void>;
  onDeletePromise: (id: number) => Promise<void>;
  availableDepartments: string[];
  availableCategories: string[];
}

export function AgPromiseGrid({
  promises,
  onUpdatePromise,
  onAddPromise,
  onDeletePromise,
  availableDepartments,
  availableCategories,
}: AgPromiseGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromiseRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show Toast helper
  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Handle cell edits from AG Grid
  const handleCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const data = event.data as PromiseRecord;
    const field = event.colDef.field as keyof PromiseRecord;
    const newValue = event.newValue;
    const oldValue = event.oldValue;

    if (newValue === oldValue) return;

    try {
      const updates: Partial<PromiseRecord> = { [field]: newValue };

      // Synchronize raw label if status or importance changed
      if (field === 'status') {
        const sKey = newValue as PromiseStatus;
        updates.statusRaw = STATUS_CONFIG[sKey]?.labelHi || sKey;
        updates.workStarted = sKey !== 'NOT_STARTED';
      } else if (field === 'politicalImportance') {
        const pKey = newValue as PoliticalImportance;
        updates.politicalImportanceRaw = IMPORTANCE_CONFIG[pKey]?.labelHi || pKey;
      }

      await onUpdatePromise(data.id, updates);
      showToast(`वादा #${data.id} सफलतापूर्वक अद्यतित किया गया (${String(field)})`);
    } catch (err: unknown) {
      console.error('Cell update failed', err);
      // Revert in grid
      event.node.setDataValue(field, oldValue);
      alert('संशोधन सहेजने में विफलता: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [onUpdatePromise]);

  // Execute confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDeletePromise(deleteTarget.id);
      showToast(`वादा #${deleteTarget.id} सफलतापूर्वक हटा दिया गया`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      alert('हटाने में विफलता: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 48,
        pinned: 'left',
        resizable: false,
      },
      {
        field: 'id',
        headerName: 'क्रमांक',
        width: 80,
        pinned: 'left',
        cellClass: 'font-bold text-center text-slate-700',
        sortable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        field: 'title',
        headerName: 'घोषणा / वादा शीर्षक (डबल-क्लिक से संपादन)',
        width: 260,
        editable: true,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellClass: 'font-semibold text-slate-900',
        tooltipField: 'description',
      },
      {
        field: 'category',
        headerName: 'श्रेणी / क्षेत्र',
        width: 170,
        editable: true,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: availableCategories,
        },
      },
      {
        field: 'status',
        headerName: 'वर्तमान स्थिति',
        width: 150,
        editable: true,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['COMPLETED', 'IN_PROGRESS', 'INITIAL_STAGE', 'NOT_STARTED'],
        },
        cellRenderer: (params: ICellRendererParams<PromiseRecord>) => {
          if (!params.value) return null;
          return <StatusBadge status={params.value as PromiseStatus} />;
        },
      },
      {
        field: 'politicalImportance',
        headerName: 'प्राथमिकता',
        width: 110,
        editable: true,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['HIGH', 'MEDIUM', 'LIMITED'],
        },
        cellRenderer: (params: ICellRendererParams<PromiseRecord>) => {
          if (!params.value) return null;
          return <ImportanceBadge importance={params.value as PoliticalImportance} />;
        },
      },
      {
        field: 'departments',
        headerName: 'संबद्ध विभाग',
        width: 220,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<PromiseRecord>) => {
          const depts = (params.value as string[]) || [];
          return (
            <div className="flex flex-wrap gap-1 items-center h-full">
              {depts.map((d, i) => (
                <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-full">
                  {d}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        field: 'description',
        headerName: 'संक्षिप्त विवरण',
        width: 260,
        editable: true,
        tooltipField: 'description',
      },
      {
        field: 'notes',
        headerName: 'प्रशासनिक टिप्पणी (Notes)',
        width: 240,
        editable: true,
        tooltipField: 'notes',
      },
      {
        field: 'delayReason',
        headerName: 'लंबित कारण',
        width: 200,
        editable: true,
      },
      {
        headerName: 'कार्य',
        width: 100,
        pinned: 'right',
        cellRenderer: (params: ICellRendererParams<PromiseRecord>) => {
          const rowData = params.data as PromiseRecord;
          return (
            <div className="flex items-center gap-1.5 h-full">
              <Link
                href={`/promises/${rowData.id}`}
                className="p-1 rounded text-teal-700 hover:bg-teal-50"
                title="पूर्ण विवरण देखें"
              >
                <Eye className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(rowData)}
                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                title="वादा हटाएं"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ];
  }, [availableCategories]);

  // Export current AG Grid view
  const handleExportGrid = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Toast Notification */}
      {saveToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
          <span className="text-[10px] opacity-80">डैशबोर्ड मीट्रिक्स स्वतः पुनर्गणित हुए</span>
        </div>
      )}

      {/* Grid Toolbar */}
      <div className="p-3.5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>नवीन वादा जोड़ें (Add Promise)</span>
          </button>

          <button
            onClick={handleExportGrid}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            <span>एक्सेल निर्यात (.xlsx)</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-medium">
              {selectedIds.length} चयनित
            </span>
          )}
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="तालिका में त्वरित खोज..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-lg hidden lg:block">
            डबल-क्लिक: <b>सेल संपादन</b> | स्वतः सहेजें
          </div>
        </div>
      </div>

      {/* Main AG Grid Container */}
      <div className="ag-theme-quartz w-full h-[580px]">
        <AgGridReact
          ref={gridRef}
          rowData={promises}
          columnDefs={columnDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
          }}
          pagination={true}
          paginationPageSize={25}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          rowSelection="multiple"
          onSelectionChanged={() => {
            const nodes = gridRef.current?.api.getSelectedNodes() || [];
            setSelectedIds(nodes.map(n => n.data.id));
          }}
          onCellValueChanged={handleCellValueChanged}
          quickFilterText={quickFilterText}
          animateRows={true}
          rowHeight={40}
          headerHeight={42}
        />
      </div>

      {/* Persistence Note Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>
          💡 <strong>इनलाइन संपादन सक्रिय:</strong> स्थिति, प्राथमिकता, श्रेणी, शीर्षक या टिप्पणी पर डबल-क्लिक करके सीधे संपादन करें।
        </span>
        <span className="text-amber-700 font-medium hidden sm:inline">
          चरण 2 डेवलपमेंट रिपॉजिटरी में संपादन तत्काल डैशबोर्ड में अपडेट होते हैं
        </span>
      </div>

      {/* Modals */}
      <AddPromiseModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={onAddPromise}
        availableDepartments={availableDepartments}
        availableCategories={availableCategories}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        promise={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
