import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile fields state
  const [profileData, setProfileData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [passwordError, setPasswordError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/profile');
      if (res.data?.customer) {
        const c = res.data.customer;
        setProfileData({
          name: c.name || '',
          companyName: c.companyName || '',
          email: c.email || user?.email || '',
          phone: c.phone || '',
          taxId: c.taxId || '',
          address: c.address || '',
          city: c.city || '',
          state: c.state || '',
          postalCode: c.postalCode || '',
          country: c.country || '',
        });
      }
    } catch (err) {
      console.warn('Could not load specific customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/customers/profile', profileData);
      if (res.success) {
        toast.success('Profile contact details updated successfully!');
        if (refreshUser) refreshUser();
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.message || 'Error occurred while saving profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Password policy validation: > 8 chars, uppercase, lowercase, special character
  const isLengthValid = passwordData.newPassword.length > 8;
  const hasUppercase = /[A-Z]/.test(passwordData.newPassword);
  const hasLowercase = /[a-z]/.test(passwordData.newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword);
  const isPasswordValid = isLengthValid && hasUppercase && hasLowercase && hasSpecial;
  const passwordsMatch =
    passwordData.newPassword && passwordData.newPassword === passwordData.confirmNewPassword;

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!isPasswordValid) {
      setPasswordError(
        'New password must be more than 8 characters and contain at least one uppercase letter, one lowercase letter, and one special character.'
      );
      return;
    }

    if (!passwordsMatch) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.post('/customers/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.success) {
        toast.success('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
      } else {
        setPasswordError(res.message || 'Password update failed.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error occurred while changing password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Customer Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Update your organization profile, billing address, and manage security credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-2xl border border-indigo-500/30">
            {profileData.name?.[0] || user?.firstName?.[0] || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {profileData.name || `${user?.firstName} ${user?.lastName}`}
            </h2>
            <p className="text-xs text-slate-400">{profileData.email}</p>
            <div className="mt-1 flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Customer Account
              </span>
              <span className="text-[11px] text-slate-500">Port 5175</span>
            </div>
          </div>
        </div>

        <div className="text-right self-start sm:self-auto">
          <span className="text-xs text-slate-400 block">Organization</span>
          <span className="text-sm font-semibold text-white">
            {profileData.companyName || 'Individual Account'}
          </span>
        </div>
      </div>

      {/* Two Column Grid: Contact Details & Password Change */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information Form (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center space-x-2">
            <User className="h-4 w-4 text-indigo-400" />
            <span>Permitted Profile & Billing Details</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Contact / Representative Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Company / Entity Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={profileData.companyName}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="Acme Global Corporation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Registered Email (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg text-slate-400 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Tax / VAT ID (Optional)
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={profileData.taxId}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. US123456789"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="San Francisco"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={profileData.address}
                onChange={handleProfileChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                placeholder="100 Market St, Floor 12"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  State / Prov
                </label>
                <input
                  type="text"
                  name="state"
                  value={profileData.state}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="CA"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={profileData.postalCode}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="94105"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={profileData.country}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="USA"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{savingProfile ? 'Saving...' : 'Update Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Password Management Form (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center space-x-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Change Password</span>
            </h3>

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  name="currentPassword"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  name="newPassword"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 tracking-wider">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  name="confirmNewPassword"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••••••"
                />
              </div>

              {/* Password Policy Guidelines */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] space-y-1 text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Policy Criteria:</span>
                <div className={`flex items-center space-x-1.5 ${isLengthValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>More than 8 chars</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Special character</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {savingPassword ? 'Updating...' : 'Update Account Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
