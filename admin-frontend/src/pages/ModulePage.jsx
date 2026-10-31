import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Plus, Filter, RefreshCw, FileText, Info } from 'lucide-react';
import api from '../services/api';

export const ModulePage = ({
  title,
  endpoint,
  description,
  columns = [],
  actionLabel,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (endpoint) {
        const res = await api.get(endpoint);
        // Look for array in response data object or directly
        const list = Array.isArray(res?.data)
          ? res.data
          : res?.data?.[Object.keys(res?.data || {})[0]] || [];
        setData(Array.isArray(list) ? list : []);
        setIsLiveConnected(true);
      }
    } catch {
      // Backend not yet running or table empty
      setData([]);
      setIsLiveConnected(false);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    let ignore = false;

    const runFetch = async () => {
      setLoading(true);
      try {
        if (endpoint) {
          const res = await api.get(endpoint);
          if (!ignore) {
            const list = Array.isArray(res?.data)
              ? res.data
              : res?.data?.[Object.keys(res?.data || {})[0]] || [];
            setData(Array.isArray(list) ? list : []);
            setIsLiveConnected(true);
          }
        }
      } catch {
        if (!ignore) {
          setData([]);
          setIsLiveConnected(false);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    runFetch();
    return () => {
      ignore = true;
    };
  }, [endpoint]);

  // Client-side filtering when data is present
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = col.accessor ? item[col.accessor] : '';
        return String(val || '').toLowerCase().includes(lower);
      })
    );
  }, [data, searchTerm, columns]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {description || `Manage ${title.toLowerCase()} records.`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition shadow-xs"
            title="Refresh"
            aria-label="Refresh records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition">
            <Plus className="h-4 w-4" />
            <span>{actionLabel || `New ${title.slice(0, -1) || title}`}</span>
          </button>
        </div>
      </div>

      {/* Module Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {isLiveConnected ? 'Connected to API' : 'Awaiting Backend Seed'}
            </span>
            <button className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Content Table / Empty State */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              Loading {title.toLowerCase()}...
            </div>
          ) : filteredData.length === 0 ? (
            /* Clearly labelled placeholder / empty state */
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3.5 border border-slate-200">
                <FileText className="h-6 w-6" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                Placeholder / Empty State
              </span>
              <h3 className="text-sm font-semibold text-slate-800">
                No {title.toLowerCase()} records found
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Database endpoint <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono text-[11px]">{endpoint}</code> currently has no records or backend is initializing.
              </p>
              <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-800 flex items-center justify-center space-x-2">
                <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Ready for backend integration with Express REST API.</span>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-6 py-3.5">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/75 transition">
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-6 py-3.5 text-slate-800">
                        {col.render ? col.render(row) : row[col.accessor] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
