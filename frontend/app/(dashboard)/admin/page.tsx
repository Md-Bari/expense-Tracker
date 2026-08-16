'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';

import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Loader2, 
  Search, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  Check, 
  AlertCircle,
  TrendingUp,
  Mail,
  UserCheck
} from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  monthly_budget_limit: string | number | null;
  date_joined: string;
  currency: string;
}

interface Plan {
  id: number;
  name: string;
  price: string | number;
  currency: string;
  duration_months: number;
  description: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, formatCurrency, toBanglaNumeral } = useLanguage();

  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<'users' | 'create-admin' | 'plans'>('users');

  // Users Tab States
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersCount, setUsersCount] = useState(0);
  const [usersStats, setUsersStats] = useState({
    total_registered: 0,
    staff_count: 0,
    avg_budget: 0
  });

  // Reset page when active tab changes
  useEffect(() => {
    setUsersPage(1);
  }, [activeTab]);

  // Create Admin Form States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [adminFormStatus, setAdminFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Plans Tab States
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  
  // Create / Edit Plan Modal States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planCurrency, setPlanCurrency] = useState('BDT');
  const [planDuration, setPlanDuration] = useState('1');
  const [planDescription, setPlanDescription] = useState('');
  const [planModalLoading, setPlanModalLoading] = useState(false);
  const [planModalError, setPlanModalError] = useState<string | null>(null);

  // Check role access permissions
  const isAdmin = user && (user.is_staff || user.is_superuser);

  // Redirect unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load user list
  const loadUsers = async (page = 1, search = '') => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const response = await api.get(`/subscriptions/admin/users/?page=${page}&search=${search}`);
      setUsersList(response.data.results);
      setUsersCount(response.data.count);
      if (response.data.stats) {
        setUsersStats(response.data.stats);
      }
    } catch (err) {
      console.error("Failed to load users list", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Load plans list
  const loadPlans = async () => {
    if (!isAdmin) return;
    setPlansLoading(true);
    try {
      const response = await api.get('/subscriptions/plans/');
      setPlansList(response.data);
    } catch (err) {
      console.error("Failed to load plans list", err);
    } finally {
      setPlansLoading(false);
    }
  };

  // Trigger loads based on active tab
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') {
        loadUsers(usersPage, searchQuery);
      } else if (activeTab === 'plans') {
        loadPlans();
      }
    }
  }, [activeTab, usersPage, isAdmin]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsersPage(1);
    loadUsers(1, searchQuery);
  };

  // Handle Create Admin Submit
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormStatus(null);

    if (!adminUsername.trim() || !adminPassword) {
      setAdminFormStatus({ type: 'error', message: 'Username and password are required.' });
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      setAdminFormStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setAdminFormLoading(true);
    try {
      await api.post('/subscriptions/admin/create-admin/', {
        username: adminUsername,
        email: adminEmail,
        password: adminPassword
      });
      setAdminFormStatus({ type: 'success', message: 'Administrator account registered successfully.' });
      setAdminUsername('');
      setAdminEmail('');
      setAdminPassword('');
      setAdminConfirmPassword('');
    } catch (err: any) {
      console.error("Admin registration error", err);
      const errMsg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to create admin.';
      setAdminFormStatus({ type: 'error', message: errMsg });
    } finally {
      setAdminFormLoading(false);
    }
  };

  // Open Plan Modal (Create or Edit mode)
  const openPlanModal = (plan: Plan | null = null) => {
    setPlanModalError(null);
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name);
      setPlanPrice(plan.price.toString());
      setPlanCurrency(plan.currency);
      setPlanDuration(plan.duration_months.toString());
      setPlanDescription(plan.description || '');
    } else {
      setEditingPlan(null);
      setPlanName('');
      setPlanPrice('');
      setPlanCurrency('BDT');
      setPlanDuration('1');
      setPlanDescription('');
    }
    setIsPlanModalOpen(true);
  };

  // Handle Create/Update Plan Submit
  const handlePlanSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanModalError(null);

    if (!planName.trim() || !planPrice.trim()) {
      setPlanModalError('Name and Price are required fields.');
      return;
    }

    setPlanModalLoading(true);
    try {
      const planData = {
        name: planName,
        price: parseFloat(planPrice),
        currency: planCurrency,
        duration_months: parseInt(planDuration),
        description: planDescription
      };

      if (editingPlan) {
        // Update Action
        await api.put(`/subscriptions/plans/${editingPlan.id}/`, planData);
      } else {
        // Create Action
        await api.post('/subscriptions/plans/', planData);
      }

      setIsPlanModalOpen(false);
      loadPlans();
    } catch (err: any) {
      console.error("Failed to save plan", err);
      const errMsg = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to save plan.';
      setPlanModalError(errMsg);
    } finally {
      setPlanModalLoading(false);
    }
  };

  // Handle Delete Plan
  const handleDeletePlan = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this subscription plan? Users on the landing page will no longer see it.")) return;
    try {
      await api.delete(`/subscriptions/plans/${id}/`);
      loadPlans();
    } catch (err) {
      console.error("Failed to delete plan", err);
      alert("Failed to delete plan. Please try again.");
    }
  };

  // Render Loader during authentication phase
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Render Access Denied for standard users
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 border border-slate-900 bg-slate-900/30 rounded-3xl text-center space-y-6">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Access Denied</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The dashboard is restricted to system administrators and staff accounts. If you believe this is an error, please contact support.
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Back to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard layout
  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-8 z-10">
        
        {/* Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-950 border border-indigo-900 text-indigo-400 text-[10px] font-bold tracking-wider uppercase">
              System Console
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{t('admin.title', 'Super Admin Dashboard')}</h1>
          </div>
          
          {/* Tab Buttons bar */}
          <div className="flex bg-slate-950 p-1.5 border border-slate-850 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('create-admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create-admin' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'plans' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Manage Plans</span>
            </button>
          </div>
        </div>

        {/* Tab Panel: Users Directory */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Quick statistics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 border border-slate-900 bg-slate-900/20 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Registered</div>
                  <div className="text-xl font-bold text-white">{usersStats.total_registered} Users</div>
                </div>
              </div>

              <div className="p-4 border border-slate-900 bg-slate-900/20 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Staff / Admins</div>
                  <div className="text-xl font-bold text-white">{usersStats.staff_count} staff</div>
                </div>
              </div>

              <div className="p-4 border border-slate-900 bg-slate-900/20 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Average Budget</div>
                  <div className="text-xl font-bold text-white">
                    ৳{Math.round(usersStats.avg_budget).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* User Directory Table Control */}
            <div className="border border-slate-900 rounded-2xl bg-slate-900/20 overflow-hidden">
              <div className="p-4 border-b border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-sm font-bold text-white">System User Directory</h3>
                
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    placeholder="Search username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-xs text-white"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                </form>
              </div>

              {/* Data Table */}
              {usersLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : usersList.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                  No users matching search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 font-semibold">
                        <th className="p-4">Username</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Budget Limit</th>
                        <th className="p-4 text-right">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {usersList.map((usr) => {
                        const isUserAdmin = usr.is_superuser || usr.is_staff;
                        return (
                          <tr key={usr.id} className="hover:bg-slate-900/30 text-slate-300">
                            <td className="p-4 font-bold text-white">{usr.username}</td>
                            <td className="p-4">{usr.email || '-'}</td>
                            <td className="p-4">
                              {isUserAdmin ? (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-900/60 text-indigo-400 text-[10px] font-bold uppercase">
                                  {usr.is_superuser ? 'Superuser' : 'Staff'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-slate-450 text-[10px] font-semibold uppercase">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {usr.monthly_budget_limit 
                                ? `${usr.currency || 'BDT'} ${parseFloat(usr.monthly_budget_limit as string).toLocaleString()}` 
                                : '-'
                              }
                            </td>
                            <td className="p-4 text-right text-slate-500 text-[11px]">
                              {new Date(usr.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {usersList.length > 0 && usersCount > 10 && (
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900/20 border-t border-slate-900 text-slate-400 text-xs">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-slate-200">
                      {(usersPage - 1) * 10 + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-slate-200">
                      {Math.min(usersPage * 10, usersCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-200">{usersCount}</span>{' '}
                    entries
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        usersPage === 1
                          ? 'border-slate-850 text-slate-600 bg-slate-950/20 cursor-not-allowed'
                          : 'border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-slate-900/40 cursor-pointer'
                      }`}
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.ceil(usersCount / 10) }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          type="button"
                          key={pageNum}
                          onClick={() => setUsersPage(pageNum)}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            usersPage === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-900/40'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setUsersPage((p) => Math.min(Math.ceil(usersCount / 10), p + 1))}
                      disabled={usersPage >= Math.ceil(usersCount / 10)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        usersPage >= Math.ceil(usersCount / 10)
                          ? 'border-slate-850 text-slate-600 bg-slate-950/20 cursor-not-allowed'
                          : 'border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-slate-900/40 cursor-pointer'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab Panel: Create New Admin */}
        {activeTab === 'create-admin' && (
          <div className="max-w-xl mx-auto border border-slate-900 bg-slate-900/20 rounded-3xl p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Create New Administrator</h2>
              <p className="text-xs text-slate-550 leading-relaxed">
                Add staff members. Registered staff accounts will have access to the Super Admin Dashboard and system statistics.
              </p>
            </div>

            {adminFormStatus && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                adminFormStatus.type === 'success' 
                  ? 'bg-emerald-950/20 border-emerald-900 text-emerald-350' 
                  : 'bg-rose-950/20 border-rose-900 text-rose-350'
              }`}>
                {adminFormStatus.type === 'success' ? (
                  <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                )}
                <span>{adminFormStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter staff username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="staff@aura.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-xs text-white"
                  />
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminFormLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {adminFormLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Register Staff Member</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab Panel: Subscription Plans CRUD */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white">System Subscription Offers</h3>
                <p className="text-[11px] text-slate-500">Edit, create, or delete active plans listed on your landing page pricing table.</p>
              </div>

              <button
                onClick={() => openPlanModal(null)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer transition-all hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Plan</span>
              </button>
            </div>

            {/* Plans List Table */}
            {plansLoading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : plansList.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl space-y-2">
                <span>No plans found. Create the first offer plan!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plansList.map((plan) => (
                  <div key={plan.id} className="p-6 border border-slate-900 bg-slate-900/20 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-white text-sm">{plan.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openPlanModal(plan)}
                            className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/30 text-rose-450 hover:bg-rose-950/50 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-2xl font-black text-white">৳{parseInt(plan.price as string).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          / {plan.duration_months} Month(s)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">{plan.description || 'No description provided.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create/Edit Modal Dialog */}
            {isPlanModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="max-w-md w-full p-6 border border-slate-850 bg-slate-900 rounded-2xl space-y-5 shadow-2xl relative">
                  
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">
                      {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                    </h3>
                    <p className="text-[10px] text-slate-500">Provide details of the plan. Changes affect the landing page immediately.</p>
                  </div>

                  {planModalError && (
                    <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900 text-rose-350 text-xs">
                      {planModalError}
                    </div>
                  )}

                  <form onSubmit={handlePlanSave} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Plan Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Monthly Standard"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Price *</label>
                        <input
                          type="number"
                          required
                          placeholder="150"
                          value={planPrice}
                          onChange={(e) => setPlanPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-white text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duration (Months) *</label>
                        <select
                          value={planDuration}
                          onChange={(e) => setPlanDuration(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-slate-300 text-xs"
                        >
                          <option value="1">1 Month</option>
                          <option value="3">3 Months</option>
                          <option value="6">6 Months</option>
                          <option value="12">12 Months (1 Year)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Brief summary of the plan benefits..."
                        value={planDescription}
                        onChange={(e) => setPlanDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 focus:border-indigo-600 focus:outline-none text-white text-xs resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsPlanModalOpen(false)}
                        className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl text-slate-300 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={planModalLoading}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        {planModalLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                        <span>Save Plan</span>
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}

          </div>
        )}

      </main>
  );
}
