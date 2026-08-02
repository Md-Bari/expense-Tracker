'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { Plus, Trash2, X, Target, PiggyBank, Award } from 'lucide-react';

export default function SavingsGoalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');

  // Redirect guest
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch savings goals
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/savings/');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // Goal mutations
  const createGoalMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/savings/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.patch(`/savings/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setIsFundOpen(false);
      setFundAmount('');
      setSelectedGoal(null);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/savings/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate({
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount),
      target_date: targetDate,
      status: 'active',
    });
  };

  const handleAddFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !fundAmount) return;
    const newAmount = parseFloat(selectedGoal.current_amount) + parseFloat(fundAmount);
    const isCompleted = newAmount >= parseFloat(selectedGoal.target_amount);
    
    updateGoalMutation.mutate({
      id: selectedGoal.id,
      payload: {
        current_amount: newAmount,
        status: isCompleted ? 'completed' : 'active',
      },
    });
  };

  const openAddFunds = (goal: any) => {
    setSelectedGoal(goal);
    setIsFundOpen(true);
  };

  if (authLoading || goalsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Savings Goals</h1>
              <p className="text-sm text-slate-400 mt-1">
                Configure future targets and accumulate funds towards them.
              </p>
            </div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Goal</span>
            </button>
          </div>

          {/* Goal cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals && goals.length > 0 ? (
              goals.map((g: any) => {
                const current = parseFloat(g.current_amount);
                const target = parseFloat(g.target_amount);
                const pct = g.percentage;
                const isCompleted = g.status === 'completed' || current >= target;

                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-6 rounded-2xl relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {isCompleted ? <Award className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white leading-tight">{g.name}</h3>
                            <span className="text-[9px] text-slate-500">Target Date: {g.target_date}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => deleteGoalMutation.mutate(g.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-450 hover:bg-slate-800 transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Progress Metrics */}
                      <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-2xl font-black text-white">৳{current.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">of ৳{target.toLocaleString()}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{pct}% Saved</span>
                          <span>{isCompleted ? 'Target Reached!' : `৳${(target - current).toLocaleString()} Left`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Deposit button */}
                    {!isCompleted && (
                      <button
                        onClick={() => openAddFunds(g)}
                        className="w-full mt-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold hover:text-white transition-all flex items-center justify-center gap-1.5 border border-slate-800"
                      >
                        <PiggyBank className="h-4 w-4 text-indigo-400" />
                        <span>Add Savings</span>
                      </button>
                    )}
                    {isCompleted && (
                      <div className="w-full mt-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-xs font-bold">
                        Goal Completed! 🎉
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-3 glass-panel p-12 text-center text-slate-500 rounded-2xl">
                No active savings goals found. Click Create Goal to build a target.
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
                <Target className="h-5 w-5 text-indigo-400" />
                <span>Create Savings Goal</span>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Downpayment for apartment"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Starting Funds (৳)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Completion Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={createGoalMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {createGoalMutation.isPending ? 'Creating...' : 'Create Savings Goal'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Funds Modal */}
      {isFundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-indigo-400" />
                <span>Add Savings Funds</span>
              </h3>
              <button
                onClick={() => setIsFundOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddFundsSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Add money to your savings goal: <span className="text-white font-semibold">{selectedGoal?.name}</span>.
              </p>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deposit Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={updateGoalMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {updateGoalMutation.isPending ? 'Depositing...' : 'Confirm Deposit'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
