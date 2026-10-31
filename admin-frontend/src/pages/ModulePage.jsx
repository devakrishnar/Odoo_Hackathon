import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, RefreshCw, FileText } from 'lucide-react';
import api from '../services/api';

export const ModulePage = ({ title, endpoint, description, columns = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (endpoint) {
        const res = await api.get(endpoint);
        const list = res.data?.[Object.keys(res.data)[0]] || [];
        setData(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.warn(`Could not load ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500">{description || `Manage ${title.toLowerCase()} records.`}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-sm transition">
            <Plus className="h-4 w-4" />
            <span>New {title.slice(0, -1) || title}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 self-start sm:self-auto">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              Loading records...
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No {title.toLowerCase()} found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No active records returned from database endpoint <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{endpoint}</code>.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="px-6 py-3">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/75 transition">
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-6 py-3.5 text-slate-700">
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
