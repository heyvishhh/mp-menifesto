'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PromiseRecord } from '@/types';
import { StatusBadge, ImportanceBadge } from '@/components/dashboard/StatusBadge';
import { 
  ArrowUpDown, 
  ExternalLink, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

interface PromiseTableProps {
  promises: PromiseRecord[];
  onSelectPromise?: (id: number) => void;
}

type SortField = 'id' | 'title' | 'category' | 'status' | 'politicalImportance';
type SortOrder = 'asc' | 'desc';

export function PromiseTable({ promises }: PromiseTableProps) {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    title: true,
    category: true,
    departments: true,
    status: true,
    importance: true,
    workStarted: true,
    notes: false,
    links: true,
    actions: true,
  });

  const [showColMenu, setShowColMenu] = useState(false);

  // Sorting
  const sortedPromises = useMemo(() => {
    return [...promises].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'hi');
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [promises, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedPromises.length / pageSize));
  const paginatedPromises = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPromises.slice(start, start + pageSize);
  }, [sortedPromises, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPromises.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPromises.map(p => p.id)));
    }
  };

  const toggleSelectRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">
            कुल प्रदर्शित: <b>{promises.length}</b> वादे
          </span>
          {selectedIds.size > 0 && (
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-medium">
              {selectedIds.size} चयनित (Selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Column Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>कॉलम दृश्यता (Columns)</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-20 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 px-1 uppercase tracking-wider">
                  कॉलम टॉगल करें
                </div>
                {Object.entries(visibleColumns).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-slate-700 px-1 py-0.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value={10}>10 प्रति पृष्ठ</option>
            <option value={25}>25 प्रति पृष्ठ</option>
            <option value={50}>50 प्रति पृष्ठ</option>
            <option value={100}>100 प्रति पृष्ठ</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200/80 text-slate-700 font-semibold select-none">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedPromises.length > 0 && selectedIds.size === paginatedPromises.length}
                  onChange={toggleSelectAll}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </th>

              {visibleColumns.id && (
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 w-16 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>क्र.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.title && (
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-3 min-w-[240px] cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>घोषणा / वादा</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.category && (
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-3 min-w-[150px] cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>श्रेणी / क्षेत्र</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.departments && (
                <th className="py-3 px-3 min-w-[180px]">
                  संबंधित विभाग
                </th>
              )}

              {visibleColumns.status && (
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 min-w-[130px] cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>वर्तमान स्थिति</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.importance && (
                <th
                  onClick={() => handleSort('politicalImportance')}
                  className="py-3 px-3 min-w-[100px] cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>प्राथमिकता</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              )}

              {visibleColumns.workStarted && (
                <th className="py-3 px-3 w-24 text-center">
                  प्रारंभ स्थिति
                </th>
              )}

              {visibleColumns.notes && (
                <th className="py-3 px-3 min-w-[220px]">
                  टिप्पणी (Notes)
                </th>
              )}

              {visibleColumns.links && (
                <th className="py-3 px-3 w-20 text-center">
                  पुष्टि लिंक
                </th>
              )}

              {visibleColumns.actions && (
                <th className="py-3 px-3 w-20 text-center">
                  कार्य
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedPromises.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-sm">कोई वादा फ़िल्टर से मेल नहीं खाता</p>
                    <p className="text-xs text-slate-400">फ़िल्टर साफ़ करें या खोज क्वेरी बदलें।</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedPromises.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(p.id)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                    </td>

                    {visibleColumns.id && (
                      <td className="py-3 px-3 font-semibold text-slate-600 text-center">
                        #{p.id}
                      </td>
                    )}

                    {visibleColumns.title && (
                      <td className="py-3 px-3">
                        <Link
                          href={`/promises/${p.id}`}
                          className="font-semibold text-slate-900 hover:text-teal-700 transition-colors line-clamp-2"
                        >
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {p.description}
                        </p>
                      </td>
                    )}

                    {visibleColumns.category && (
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>
                    )}

                    {visibleColumns.departments && (
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {p.departments.map((dept, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-normal truncate max-w-full"
                              title={dept}
                            >
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}

                    {visibleColumns.status && (
                      <td className="py-3 px-3">
                        <StatusBadge status={p.status} />
                      </td>
                    )}

                    {visibleColumns.importance && (
                      <td className="py-3 px-3">
                        <ImportanceBadge importance={p.politicalImportance} />
                      </td>
                    )}

                    {visibleColumns.workStarted && (
                      <td className="py-3 px-3 text-center">
                        {p.workStarted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>हाँ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <XCircle className="w-3.5 h-3.5 text-slate-300" />
                            <span>नहीं</span>
                          </span>
                        )}
                      </td>
                    )}

                    {visibleColumns.notes && (
                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[220px]">
                        <p className="line-clamp-2">{p.notes || '-'}</p>
                      </td>
                    )}

                    {visibleColumns.links && (
                      <td className="py-3 px-3 text-center">
                        {p.referenceLinks.length > 0 ? (
                          <a
                            href={p.referenceLinks[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 text-teal-700 hover:text-teal-800"
                            title="संदर्भ लिंक खोलें"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )}

                    {visibleColumns.actions && (
                      <td className="py-3 px-3 text-center">
                        <Link
                          href={`/promises/${p.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors"
                          title="पूर्ण विवरण देखें"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-slate-600">
        <div>
          पृष्ठ <b>{currentPage}</b> / <b>{totalPages}</b> (कुल {promises.length} रिकॉर्ड्स)
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="प्रथम पृष्ठ"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="पिछला पृष्ठ"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-medium">
            {currentPage}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="अगला पृष्ठ"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="अंतिम पृष्ठ"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
