'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

import { motion } from 'framer-motion';
import { Plus, Trash2, X, Wallet, AlertTriangle, Check } from 'lucide-react';

export default function BudgetsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Budgets</h1>
              <p className="text-sm text-slate-400 mt-1">
                Establish thresholds to limit your category-specific spending.
              </p>
            </div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Budget</span>
            </button>
          </div>

          {/* Budget list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {budgets && budgets.length > 0 ? (
              budgets.map((b: any) => {
                const spent = parseFloat(b.spent);
                const limit = parseFloat(b.amount);
                const pct = b.percentage;
                
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-6 rounded-2xl relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Budget Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-base font-bold text-white">
                            {b.category_detail?.name || 'Total Budget'}
                          </h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {b.start_date} to {b.end_date}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => deleteBudgetMutation.mutate(b.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Budget"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      {/* Info and alerts */}
                      <div className="mb-6">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-2xl font-black text-white">৳{spent.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">of ৳{limit.toLocaleString()} limit</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 w-full bg-slate-850 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 100
                                ? 'bg-rose-500'
                                : pct >= 80
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                          <span>{pct}% Used</span>
                          <span>৳{(limit - spent).toLocaleString()} Remaining</span>
                        </div>
                      </div>
                    </div>

                    {/* Alert Message Banner */}
                    <div className="mt-2 pt-3 border-t border-slate-850">
                      {pct >= 100 ? (
                        <div className="flex items-center gap-2 text-rose-400 text-[11px] font-medium">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Overbudget limit by ৳{(spent - limit).toLocaleString()}!</span>
                        </div>
                      ) : pct >= 80 ? (
                        <div className="flex items-center gap-2 text-amber-400 text-[11px] font-medium">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Close to reaching limit (80%+ consumed).</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Budget consumption is well within limit.</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-3 glass-panel p-12 text-center text-slate-500 rounded-2xl">
                No active budgets configured. Click Create Budget to set up a spending threshold.
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Total Budget (All Categories)</option>
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
    </>
  );
}
