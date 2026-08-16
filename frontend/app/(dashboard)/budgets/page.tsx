'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

import { motion } from 'framer-motion';
import { Plus, Trash2, X, Wallet, AlertTriangle, CheckCircle, RefreshCw, Eye, Receipt, Calendar } from 'lucide-react';

export default function BudgetsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, formatCurrency, toBanglaNumeral, formatDate } = useLanguage();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'exceeded'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBudgetDetails, setSelectedBudgetDetails] = useState<any>(null);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );

  // Redirect if guest
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/transactions/categories/?type=expense');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.get('/budgets/');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // Budget mutations
  const createBudgetMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/budgets/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsOpen(false);
      setAmount('');
      setCategory('');
    },
  });

  const completeBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/budgets/${id}/complete/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  const reactivateBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/budgets/${id}/reactivate/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/budgets/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBudgetMutation.mutate({
      amount: parseFloat(amount),
      category: category ? parseInt(category) : null,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const filteredBudgets = (budgets || []).filter((b: any) => {
    const status = b.computed_status || b.status || 'active';
    if (filter === 'all') return true;
    if (filter === 'active') return status === 'active';
    if (filter === 'completed') return status === 'completed';
    if (filter === 'exceeded') return status === 'exceeded';
    return true;
  });

  if (authLoading || budgetsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{t('budgets.title', 'Budgets')}</h1>
              <p className="text-sm text-slate-400 mt-1">
                {t('budgets.subtitle', 'Set category-wise spending limits and monitor consumption.')}
              </p>
            </div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t('budgets.addBtn', 'Create New Budget')}</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'all', label: 'All Budgets' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'exceeded', label: 'Exceeded' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Budget list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map((b: any) => {
                const spent = parseFloat(b.spent || 0);
                const limit = parseFloat(b.amount || 0);
                const pct = b.percentage || 0;
                const status = b.computed_status || b.status || 'active';
                const isCompleted = status === 'completed';
                const isExceeded = status === 'exceeded';
                
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-6 rounded-2xl relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Budget Header & Status Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">
                              {b.category_detail?.name || 'Total Budget'}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isExceeded
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3 inline" />
                            {b.start_date} to {b.end_date}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedBudgetDetails(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="View Transaction Spending Breakdown"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteBudgetMutation.mutate(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete Budget"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info and progress */}
                      <div className="mb-6">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-2xl font-black text-white">৳{spent.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">of ৳{limit.toLocaleString()} limit</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-slate-850 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isExceeded
                                ? 'bg-rose-500'
                                : pct >= 80
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                          <span>{pct}% Used ({b.transaction_count || 0} expenses)</span>
                          <span>
                            {spent > limit
                              ? `৳${(spent - limit).toLocaleString()} Over`
                              : `৳${(limit - spent).toLocaleString()} Remaining`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Completion Action & Status Banner */}
                    <div className="mt-2 pt-3 border-t border-slate-850 space-y-3">
                      {isCompleted ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>Budget period completed successfully!</span>
                          </div>
                          <button
                            onClick={() => reactivateBudgetMutation.mutate(b.id)}
                            disabled={reactivateBudgetMutation.isPending}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition-all"
                            title="Re-open budget"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Reactivate</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          {isExceeded ? (
                            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-medium">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>Limit exceeded!</span>
                            </div>
                          ) : pct >= 80 ? (
                            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-medium">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>80%+ limit reached</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Within limit</span>
                            </div>
                          )}

                          <button
                            onClick={() => completeBudgetMutation.mutate(b.id)}
                            disabled={completeBudgetMutation.isPending}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Complete Budget</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-3 glass-panel p-12 text-center text-slate-500 rounded-2xl">
                No budgets found for filter "{filter}". Click "Create Budget" to set up a new budget.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Creation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-indigo-400" />
                <span>Create Limit Budget</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Expense Category (Spending Type)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Total Budget (All Expense Categories)</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Limit Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createBudgetMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {createBudgetMutation.isPending ? 'Creating...' : 'Create Limit Budget'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Transaction Spending Breakdown Modal */}
      {selectedBudgetDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-indigo-400" />
                  <span>Budget Spending Breakdown</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedBudgetDetails.category_detail?.name || 'All Expense Categories'} ({selectedBudgetDetails.start_date} to {selectedBudgetDetails.end_date})
                </p>
              </div>
              <button
                onClick={() => setSelectedBudgetDetails(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 flex justify-between items-center">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Expense Spent</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  ৳{parseFloat(selectedBudgetDetails.spent || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Budget Limit</p>
                <p className="text-xl font-bold text-indigo-400 mt-0.5">
                  ৳{parseFloat(selectedBudgetDetails.amount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Contributing Expense Transactions ({selectedBudgetDetails.recent_transactions?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedBudgetDetails.recent_transactions && selectedBudgetDetails.recent_transactions.length > 0 ? (
                  selectedBudgetDetails.recent_transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850/60"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{tx.description}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {tx.date} • {tx.category_name}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-rose-400">
                        -৳{parseFloat(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No expense transactions found in this budget date range.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedBudgetDetails(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
            >
              Close Breakdown
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
