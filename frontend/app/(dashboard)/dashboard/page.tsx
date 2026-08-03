'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch dashboard summary
  const { data: dashboardData, isLoading: dashLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary/');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications/');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Mutation to mark all notifications read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-read/');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  // Check URL query parameters for notifications drawer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('notifications') === 'true') {
        setShowNotifications(true);
      }
    }
  }, []);

  if (authLoading || dashLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const summary = dashboardData?.summary || { income: 0, expense: 0, balance: 0, savings_rate: 0 };
  const categories = dashboardData?.categories || [];
  const cashFlow = dashboardData?.cash_flow || [];
  const budgets = dashboardData?.budgets || [];
  const goals = dashboardData?.goals || [];

  return (
    <>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
              <p className="text-sm text-slate-400 mt-1">
                Here is a summary of your financial status.
              </p>
            </div>
            
            <button
              onClick={() => setShowNotifications(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-medium hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 relative"
            >
              <span>Alerts Center</span>
              {notifications?.filter((n: any) => !n.is_read).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>
          </div>

          {/* Metric grids */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Income */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-panel p-6 rounded-2xl glow-emerald flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</p>
                <h3 className="text-2xl font-bold mt-2 text-white">৳{summary.income.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="glass-panel p-6 rounded-2xl flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-2xl font-bold mt-2 text-white">৳{summary.expense.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <TrendingDown className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Net Balance */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="glass-panel p-6 rounded-2xl flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Balance</p>
                <h3 className="text-2xl font-bold mt-2 text-white">৳{summary.balance.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Wallet className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Savings Rate */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="glass-panel p-6 rounded-2xl flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Savings Rate</p>
                <h3 className="text-2xl font-bold mt-2 text-white">{summary.savings_rate}%</h3>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <PiggyBank className="h-6 w-6" />
              </div>
            </motion.div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cash flow Area Chart */}
            <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
              <h3 className="text-base font-semibold text-white">Cash Flow Trajectory</h3>
              <div className="h-80 w-full">
                {cashFlow.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No transaction trend records found.</div>
                )}
              </div>
            </div>

            {/* Categorized spending distribution */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-semibold text-white">Expense Distribution</h3>
              <div className="h-64 w-full relative">
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categories.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No categorical expense records found.</div>
                )}
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {categories.map((cat: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-white">৳{cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budgets & Savings goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Budgets Progress */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-semibold text-white">Budget Limits Monitor</h3>
              <div className="space-y-4">
                {budgets.length > 0 ? (
                  budgets.map((b: any) => (
                    <div key={b.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{b.category}</span>
                        <span className="text-slate-400">
                          ৳{b.spent.toLocaleString()} / <span className="text-white">৳{b.limit.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.percentage >= 100
                              ? 'bg-rose-500'
                              : b.percentage >= 80
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-6">No active budgets found. Visit the budgets page to configure limits.</div>
                )}
              </div>
            </div>

            {/* Savings Goals */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-base font-semibold text-white">Savings Targets Progress</h3>
              <div className="space-y-4">
                {goals.length > 0 ? (
                  goals.map((g: any) => (
                    <div key={g.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{g.name}</span>
                        <span className="text-slate-400">
                          ৳{g.current.toLocaleString()} / <span className="text-white">৳{g.target.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(g.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-6">No active savings goals found. Configure a target on the Savings Goals page.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-screen flex flex-col p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">Alerts Center</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-slate-400 font-medium">System updates & Warnings</span>
              {notifications?.filter((n: any) => !n.is_read).length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {notifications && notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all ${
                      n.is_read
                        ? 'bg-slate-950/20 border-slate-850 text-slate-400'
                        : 'bg-slate-850 border-indigo-500/20 text-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                      {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-pulse"></span>}
                    </div>
                    <p className="text-xs mt-2 leading-relaxed text-slate-300">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block mt-3">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-slate-600" />
                  <span className="text-xs">No alerts notifications found.</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
