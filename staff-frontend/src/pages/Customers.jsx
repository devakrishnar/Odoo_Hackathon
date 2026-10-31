import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  Building,
  FileText,
  Repeat,
  Receipt,
  X,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';

export const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      const list = res.data?.customers || [];
      setCustomers(list);
    } catch (err) {
      console.warn('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerDetail = async (id) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomerDetail(res.data?.customer || null);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCustomerId(null);
    setCustomerDetail(null);
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500">
            Browse corporate and individual customer accounts and view their subscriptions & invoices.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCustomers}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> customers
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              Loading customer accounts...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Building className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No customers found</h3>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Customer / Company</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Active Subs</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const activeSubsCount = cust.subscriptions?.filter((s) => s.status === 'ACTIVE').length || 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{cust.name}</div>
                        {cust.companyName && (
                          <div className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Building className="h-3 w-3 mr-1 text-slate-400" />
                            {cust.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center text-slate-700">
                          <Mail className="h-3 w-3 mr-1 text-slate-400" />
                          {cust.email}
                        </div>
                        {cust.phone && (
                          <div className="flex items-center text-slate-500">
                            <Phone className="h-3 w-3 mr-1 text-slate-400" />
                            {cust.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            cust.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-slate-700">{activeSubsCount}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openCustomerDetail(cust.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View 360</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Customer 360 Slide-over Modal / Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h2 className="text-lg font-bold">Customer 360 Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Subscriptions, quotations, and billing history</p>
              </div>
              <button
                onClick={closeDetail}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading || !customerDetail ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                  <p className="text-sm text-slate-500">Loading customer profile...</p>
                </div>
              ) : (
                <>
                  {/* Profile Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{customerDetail.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{customerDetail.companyName || 'Individual'}</p>
                      <div className="mt-2 text-xs text-slate-600 space-y-1">
                        <div>
                          <strong>Email:</strong> {customerDetail.email}
                        </div>
                        {customerDetail.phone && (
                          <div>
                            <strong>Phone:</strong> {customerDetail.phone}
                          </div>
                        )}
                        {customerDetail.address && (
                          <div>
                            <strong>Address:</strong> {customerDetail.address}, {customerDetail.city}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="self-start sm:self-center">
                      <button
                        onClick={() => {
                          closeDetail();
                          navigate(`/quotations?customerId=${customerDetail.id}&create=true`);
                        }}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create Quotation</span>
                      </button>
                    </div>
                  </div>

                  {/* Subscriptions Section */}
                  <div>
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 mb-3">
                      <Repeat className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900">Subscriptions ({customerDetail.subscriptions?.length || 0})</h4>
                    </div>
                    {customerDetail.subscriptions && customerDetail.subscriptions.length > 0 ? (
                      <div className="space-y-2">
                        {customerDetail.subscriptions.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{sub.subscriptionNumber}</span>
                              <span className="ml-2 text-slate-500">
                                Total: ${Number(sub.totalAmount).toFixed(2)}
                              </span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Period End: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-3">No subscriptions found for this customer.</p>
                    )}
                  </div>

                  {/* Invoices Section */}
                  <div>
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 mb-3">
                      <Receipt className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900">Invoices ({customerDetail.invoices?.length || 0})</h4>
                    </div>
                    {customerDetail.invoices && customerDetail.invoices.length > 0 ? (
                      <div className="space-y-2">
                        {customerDetail.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                              <span className="ml-2 text-slate-500">Total: ${Number(inv.totalAmount).toFixed(2)}</span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Due: {new Date(inv.dueDate).toLocaleDateString()} • Balance: ${Number(inv.balanceAmount).toFixed(2)}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-3">No invoices generated yet.</p>
                    )}
                  </div>

                  {/* Quotations Section */}
                  <div>
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-200 mb-3">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <h4 className="text-sm font-bold text-slate-900">Quotations ({customerDetail.quotations?.length || 0})</h4>
                    </div>
                    {customerDetail.quotations && customerDetail.quotations.length > 0 ? (
                      <div className="space-y-2">
                        {customerDetail.quotations.map((qt) => (
                          <div
                            key={qt.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{qt.quotationNumber}</span>
                              <span className="ml-2 text-slate-500">Total: ${Number(qt.totalAmount).toFixed(2)}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {qt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-3">No quotations created yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
