'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t, formatCurrency, toBanglaNumeral, formatDate } = useLanguage();
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
      <div className="min-h-screen bg-[#041a19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0da594]"></div>
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
      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#052322] min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{t('dash.title', 'Financial Dashboard')}</h1>
              <p className="text-sm text-slate-300 mt-1">
                {t('dash.subtitle', 'Overview of your wealth, cashflow, and spending analytics.')}
              </p>
            </div>
            
            <button
              onClick={() => setShowNotifications(true)}
              className="px-4 py-2.5 rounded-xl bg-[#072e2c] border border-teal-900/60 text-sm font-medium hover:bg-[#0a3f3c] hover:text-white transition-all flex items-center gap-2 relative shadow-md"
            >
              <span className="text-slate-200 font-semibold">{t('dash.notifications', 'Notifications')}</span>
              {notifications?.filter((n: any) => !n.is_read).length > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>
          </div>

          {/* Metric grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Income */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-teal-950/30"
            >
              <div>
                <p className="text-xs font-bold text-[#0da594] uppercase tracking-wider">{t('dash.totalIncome', 'Total Income')}</p>
                <h3 className="text-2xl font-black mt-2 text-white">{formatCurrency(summary.income)}</h3>
              </div>
              <div className="p-3 bg-[#0da594]/20 rounded-xl text-[#0da594] border border-[#0da594]/30">
                <TrendingUp className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-teal-950/30"
            >
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">{t('dash.totalExpense', 'Total Expenses')}</p>
                <h3 className="text-2xl font-black mt-2 text-white">{formatCurrency(summary.expense)}</h3>
              </div>
              <div className="p-3 bg-rose-500/15 rounded-xl text-rose-400 border border-rose-500/30">
                <TrendingDown className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Net Balance */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-teal-950/30"
            >
              <div>
                <p className="text-xs font-bold text-teal-300 uppercase tracking-wider">{t('dash.netBalance', 'Net Balance')}</p>
                <h3 className="text-2xl font-black mt-2 text-white">{formatCurrency(summary.balance)}</h3>
              </div>
              <div className="p-3 bg-teal-500/15 rounded-xl text-teal-300 border border-teal-500/30">
                <Wallet className="h-6 w-6" />
              </div>
            </motion.div>

            {/* Savings Rate */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-teal-950/30"
            >
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('dash.savingsRate', 'Savings Rate')}</p>
                <h3 className="text-2xl font-black mt-2 text-white">{toBanglaNumeral(summary.savings_rate)}%</h3>
              </div>
              <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400 border border-emerald-500/30">
                <PiggyBank className="h-6 w-6" />
              </div>
            </motion.div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cash flow Area Chart */}
            <div className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl lg:col-span-2 space-y-4 shadow-lg shadow-teal-950/30">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">{t('dash.cashflowTrend', 'Cash Flow Trajectory')}</h3>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0da594]"></span>
                    <span className="text-slate-300">{t('trans.typeIncome', 'Income')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]"></span>
                    <span className="text-slate-300">{t('trans.typeExpense', 'Expense')}</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full">
                {cashFlow.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0da594" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#0da594" stopOpacity={0.02}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#052322" opacity={0.8} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#041a19', borderColor: '#0da594', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        formatter={(val: any) => [formatCurrency(Number(val)), '']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="income" 
                        name={t('trans.typeIncome', 'Income')} 
                        stroke="#0da594" 
                        strokeWidth={3} 
                        dot={{ r: 3.5, fill: '#0da594', stroke: '#fff', strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: '#0da594', stroke: '#fff', strokeWidth: 2 }}
                        fillOpacity={1} 
                        fill="url(#colorIncome)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expense" 
                        name={t('trans.typeExpense', 'Expense')} 
                        stroke="#f43f5e" 
                        strokeWidth={3} 
                        dot={{ r: 3.5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                        fillOpacity={1} 
                        fill="url(#colorExpense)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">No transaction trend records found.</div>
                )}
              </div>
            </div>

            {/* Categorized spending distribution */}
            <div className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl space-y-4 shadow-lg shadow-teal-950/30">
              <h3 className="text-base font-extrabold text-white">{t('dash.expensesByCategory', 'Expense Distribution')}</h3>
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
                          <Cell key={`cell-${index}`} fill={entry.color || '#0da594'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#041a19', borderColor: '#0da594', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">No categorical expense records found.</div>
                )}
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {categories.map((cat: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budgets & Savings goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Budgets Progress */}
            <div className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl space-y-4 shadow-lg shadow-teal-950/30">
              <h3 className="text-base font-extrabold text-white">{t('dash.budgetHealth', 'Budget Limits Monitor')}</h3>
              <div className="space-y-4">
                {budgets.length > 0 ? (
                  budgets.map((b: any) => (
                    <div key={b.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{b.category}</span>
                        <span className="text-slate-400">
                          {formatCurrency(b.spent)} / <span className="text-white">{formatCurrency(b.limit)}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#052322] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.percentage >= 100
                              ? 'bg-rose-500'
                              : b.percentage >= 80
                              ? 'bg-amber-500'
                              : 'bg-[#0da594]'
                          }`}
                          style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 text-center py-6 font-medium">{t('budgets.noBudgets', 'No active budgets found.')}</div>
                )}
              </div>
            </div>

            {/* Savings Goals */}
            <div className="bg-[#072e2c] border border-teal-900/60 p-6 rounded-2xl space-y-4 shadow-lg shadow-teal-950/30">
              <h3 className="text-base font-extrabold text-white">{t('goals.title', 'Savings Targets Progress')}</h3>
              <div className="space-y-4">
                {goals.length > 0 ? (
                  goals.map((g: any) => (
                    <div key={g.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{g.name}</span>
                        <span className="text-slate-400">
                          {formatCurrency(g.current)} / <span className="text-white">{formatCurrency(g.target)}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#052322] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0da594] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(g.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 text-center py-6 font-medium">{t('goals.noGoals', 'No active savings goals found.')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notifications Drawer Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="w-full max-w-md bg-[#041a19] border-l border-teal-900/80 h-screen flex flex-col p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-teal-900/50 pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-white">Alerts Center</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 rounded-lg hover:bg-[#072e2c] text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-slate-400 font-medium">System updates & Warnings</span>
              {notifications?.filter((n: any) => !n.is_read).length > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs font-bold text-[#0da594] hover:underline"
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
                        ? 'bg-[#052322]/40 border-teal-950 text-slate-400'
                        : 'bg-[#072e2c] border-teal-900/60 text-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#0da594] mt-1 shrink-0 animate-pulse"></span>}
                    </div>
                    <p className="text-xs mt-2 leading-relaxed text-slate-300">{n.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-3">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-[#0da594]" />
                  <span className="text-xs font-medium">No alerts notifications found.</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
