import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  Layers,
  FileText,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Detail Modal / Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    phone: '',
    taxId: '',
    address: '',
    city: '',
    country: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
      };
      const res = await api.get('/customers', { params });
      const data = res?.data?.customers || res?.customers || [];
      setCustomers(Array.isArray(data) ? data : []);
      if (res?.data?.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load customer profiles from server.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch full details for a single customer
  const openCustomerDetail = async (id) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setDetailCustomer(res?.data?.customer || null);
    } catch (err) {
      toast.error('Failed to retrieve full customer details.');
      setSelectedCustomerId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and valid email are required.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/customers', formData);
      if (res?.success) {
        toast.success(`Customer ${formData.name} created successfully!`);
        setIsCreateOpen(false);
        setFormData({
          name: '',
          email: '',
          companyName: '',
          phone: '',
          taxId: '',
          address: '',
          city: '',
          country: '',
          notes: '',
        });
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to create customer');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Database
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Directory of all subscriber accounts, business entities, active plans, and billing histories.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Customer</span>
          </button>
        </div>
      </div>

      {/* Backend Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Backend Notice: </span>
            {error}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3" />
              <span>Loading customer records...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Customers Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'No records match your search or filter filters.'
                  : 'No customers onboarded yet. Click "Onboard Customer" above to create one.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Customer / Company</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Subscriptions</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const initial = (c.name?.[0] || 'C').toUpperCase();
                  const subCount = c.subscriptions?.length || 0;
                  const activeSubCount = c.subscriptions?.filter((s) => s.status === 'ACTIVE').length || 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{c.name}</span>
                            {c.companyName ? (
                              <span className="text-xs text-slate-500 flex items-center mt-0.5">
                                <Building className="h-3 w-3 mr-1 text-slate-400" />
                                {c.companyName}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Individual Subscriber</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center text-slate-700">
                            <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                            {c.email}
                          </div>
                          {c.phone && (
                            <div className="flex items-center text-slate-500">
                              <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                              {c.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Layers className="h-3 w-3 mr-1 text-blue-600" />
                          {activeSubCount} Active / {subCount} Total
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openCustomerDetail(c.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {detailCustomer?.name?.[0] || 'C'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{detailCustomer?.name || 'Customer Profile'}</h2>
                  <p className="text-xs text-slate-500">ID: {detailCustomer?.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-400">Loading customer profile...</div>
              ) : !detailCustomer ? (
                <div className="py-12 text-center text-rose-500">Profile data unavailable</div>
              ) : (
                <>
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Active Subs</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {detailCustomer.summary?.activeSubscriptions || 0}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Invoices</span>
                      <span className="text-xl font-bold text-slate-900 mt-1 block">
                        {detailCustomer.summary?.totalInvoices || 0}
                      </span>
                    </div>
                    <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                      <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Total Paid</span>
                      <span className="text-xl font-bold text-emerald-800 mt-1 block">
                        ${(detailCustomer.summary?.totalPaid || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-semibold text-amber-700 uppercase block">Outstanding</span>
                      <span className="text-xl font-bold text-amber-800 mt-1 block">
                        ${(detailCustomer.summary?.totalOutstanding || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Email Address:</span>
                      <span className="font-semibold text-slate-800">{detailCustomer.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone:</span>
                      <span className="font-semibold text-slate-800">{detailCustomer.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Company:</span>
                      <span className="font-semibold text-slate-800">{detailCustomer.companyName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tax / VAT ID:</span>
                      <span className="font-semibold text-slate-800">{detailCustomer.taxId || '—'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 block">Billing Address:</span>
                      <span className="font-semibold text-slate-800">
                        {[detailCustomer.address, detailCustomer.city, detailCustomer.state, detailCustomer.country]
                          .filter(Boolean)
                          .join(', ') || 'No address on file'}
                      </span>
                    </div>
                  </div>

                  {/* Subscriptions section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-2.5">
                      Associated Subscriptions ({detailCustomer.subscriptions?.length || 0})
                    </h3>
                    {detailCustomer.subscriptions?.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg">No subscription records.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                        {detailCustomer.subscriptions.map((sub) => (
                          <div key={sub.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {sub.subscriptionNumber || sub.id.slice(0, 8)}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {sub.items?.map((it) => it.plan?.name).join(', ') || 'Subscription Plan'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  sub.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {sub.status}
                              </span>
                              <span className="text-slate-900 font-semibold block mt-0.5">
                                ${Number(sub.totalAmount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Invoices section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-500 mb-2.5">
                      Invoices & Payment Records ({detailCustomer.invoices?.length || 0})
                    </h3>
                    {detailCustomer.invoices?.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg">No invoices generated yet.</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                        {detailCustomer.invoices.map((inv) => (
                          <div key={inv.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <span className="font-semibold text-slate-900">{inv.invoiceNumber}</span>
                              <span className="text-[11px] text-slate-400 block">
                                Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  inv.status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {inv.status}
                              </span>
                              <span className="text-slate-900 font-semibold block mt-0.5">
                                ${Number(inv.totalAmount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboard Customer Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">Onboard New Customer</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Company Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Tax / VAT ID</label>
                  <input
                    type="text"
                    placeholder="TAX-89472"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 mb-1 block">Country</label>
                  <input
                    type="text"
                    placeholder="United States"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Billing Street Address</label>
                <input
                  type="text"
                  placeholder="100 Market St, Suite 400"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

