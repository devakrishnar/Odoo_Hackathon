import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Mail,
  Lock,
  User,
  Shield,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Status toggle loading state (keyed by user id)
  const [togglingStatus, setTogglingStatus] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch staff list from backend GET /api/users
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      // Backend returns { success: true, data: { users: [...] } }
      const users = res?.data?.users || res?.users || [];
      setStaffList(Array.isArray(users) ? users : []);
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.message;
      if (!err?.response && (err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK')) {
        setError('Cannot connect to backend server. Please verify http://localhost:5000 is running.');
      } else {
        setError(serverMessage || 'Failed to load staff accounts from backend.');
      }
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initFetch = async () => {
      try {
        const res = await api.get('/users');
        const users = res?.data?.users || res?.users || [];
        if (!ignore) {
          setStaffList(Array.isArray(users) ? users : []);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          const serverMessage = err?.response?.data?.message || err?.message;
          if (!err?.response && (err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK')) {
            setError('Cannot connect to backend server. Please verify http://localhost:5000 is running.');
          } else {
            setError(serverMessage || 'Failed to load staff accounts from backend.');
          }
          setStaffList([]);
          setLoading(false);
        }
      }
    };

    initFetch();
    return () => {
      ignore = true;
    };
  }, []);

  // Password validation according to the exact problem statement:
  // - More than 8 characters (minimum 9)
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one special character
  const passwordRules = useMemo(() => {
    const pwd = formData.password || '';
    return {
      length: pwd.length > 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd),
    };
  }, [formData.password]);

  const isPasswordValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.lowercase &&
    passwordRules.special;

  // Validate form fields
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (!isPasswordValid) {
      errors.password =
        'Password must be more than 8 characters and include uppercase, lowercase, and special characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit new staff account to POST /api/users
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'STAFF', // Strictly fixed to STAFF (No admin account creation)
      };

      const res = await api.post('/users', payload);

      if (res?.success) {
        toast.success(`Staff account for ${payload.firstName} created successfully!`);
        setIsModalOpen(false);
        setFormData({ firstName: '', lastName: '', email: '', password: '' });
        fetchStaff();
      } else {
        setSubmitError(res?.message || 'Server rejected staff creation.');
      }
    } catch (err) {
      const msg =
        err?.message ||
        'Failed to create staff account. Please verify backend connection.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user status via PATCH /api/users/:id/status
  const handleToggleStatus = async (staff) => {
    const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingStatus((prev) => ({ ...prev, [staff.id]: true }));

    try {
      const res = await api.patch(`/users/${staff.id}/status`, { status: newStatus });

      if (res?.success) {
        toast.success(`${staff.firstName}'s account ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`);
        fetchStaff();
      } else {
        toast.error(res?.message || 'Failed to update status.');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to update user status.';
      toast.error(msg);
    } finally {
      setTogglingStatus((prev) => ({ ...prev, [staff.id]: false }));
    }
  };

  // Filter staff list by search query, role, and status
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase();
      const email = (staff.email || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch = !query || fullName.includes(query) || email.includes(query);
      const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || staff.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Admin Control
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage internal staff accounts, credentials, and day-to-day operational permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shadow-xs disabled:opacity-50"
            title="Refresh staff list"
            aria-label="Refresh staff list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormData({ firstName: '', lastName: '', email: '', password: '' });
              setFormErrors({});
              setSubmitError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Staff</span>
          </button>
        </div>
      </div>

      {/* Backend Integration / Offline Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start space-x-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Backend Connection Notice: </span>
            {error}
          </div>
        </div>
      )}

      {/* Main Staff Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search Box */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by staff name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Role & Status Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table / Content Area */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3" />
              <span>Loading staff directory from GET /api/users...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            /* Clearly labelled empty state */
            <div className="py-16 px-4 text-center max-w-md mx-auto">
              <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
                <Users className="h-6 w-6" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 mb-2">
                Staff Directory Empty
              </span>
              <h3 className="text-sm font-semibold text-slate-800">No staff accounts found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No staff members match the selected search or filter criteria.'
                  : "No staff records returned from the backend. Click 'Create Staff' above to onboard an operations team member."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Staff Member</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Joined Date</th>
                  <th className="px-6 py-3.5 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((staff) => {
                  const initial = (staff.firstName?.[0] || staff.email?.[0] || 'S').toUpperCase();
                  const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff User';
                  const isActive = staff.status === 'ACTIVE';
                  const isToggling = togglingStatus[staff.id] || false;

                  return (
                    <tr key={staff.id || staff.email} className="hover:bg-slate-50/75 transition">
                      {/* Name with Avatar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{fullName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {staff.id?.slice(0, 8) || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                        {staff.email}
                      </td>

                      {/* Role Pill */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            staff.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {staff.role}
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1 text-slate-500" />
                          )}
                          {staff.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Status Toggle Action Button */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {staff.role === 'ADMIN' ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 text-slate-400 bg-slate-50 inline-flex items-center space-x-1">
                            <span>Admin Account</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleStatus(staff)}
                            className={`px-2.5 py-1 text-xs font-medium rounded border inline-flex items-center space-x-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                              isActive
                                ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            {isToggling ? (
                              <>
                                <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Staff Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Staff Account</h2>
                  <p className="text-xs text-slate-500">Add an internal operations team member.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStaff} className="p-6 space-y-4" noValidate>
              {/* Backend Error / Integration Banner */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed font-medium">{submitError}</div>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Alex"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, firstName: e.target.value }));
                        if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: null }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none ${
                        formErrors.firstName
                          ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rivera"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, lastName: e.target.value }));
                      if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: null }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none ${
                      formErrors.lastName
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.lastName && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="staff@brightloop.io"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                    }}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none ${
                      formErrors.email
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password Field with Show/Hide Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Set temporary password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, password: e.target.value }));
                      if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: null }));
                    }}
                    className={`w-full pl-9 pr-10 py-2 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none ${
                      formErrors.password
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.password}</p>
                )}

                {/* Password Policy Checklist (Problem Statement Rules) */}
                <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-600 mb-1">Official Password Policy:</div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.length ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className="font-bold">{passwordRules.length ? '✓' : '•'}</span>
                    <span>More than 8 characters (minimum 9 characters)</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.uppercase ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className="font-bold">{passwordRules.uppercase ? '✓' : '•'}</span>
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.lowercase ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className="font-bold">{passwordRules.lowercase ? '✓' : '•'}</span>
                    <span>At least one lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.special ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <span className="font-bold">{passwordRules.special ? '✓' : '•'}</span>
                    <span>At least one special character (!@#$%^&*...)</span>
                  </div>
                </div>
              </div>

              {/* Role Scope - Explicitly Fixed to STAFF */}
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 flex items-start space-x-2.5">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <span className="font-semibold">Assigned Role: STAFF (Fixed).</span> In accordance with security specifications, admin accounts cannot be created via this operational form.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" />
                      <span>Creating Staff...</span>
                    </>
                  ) : (
                    <span>Create Staff Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
