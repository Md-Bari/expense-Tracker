'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  X,
  Check,
  ArrowRightCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface SheetItem {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseSheet {
  id: number;
  title: string;
  description: string;
  items: SheetItem[];
  created_at: string;
  updated_at: string;
}

export default function ExpenseSheetsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, formatCurrency, toBanglaNumeral, formatDate } = useLanguage();

  // Sheet selection
  const [activeSheetId, setActiveSheetId] = useState<number | null>(null);
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);

  // Create sheet modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetDescription, setNewSheetDescription] = useState('');

  // Add/Edit item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCategory, setItemCategory] = useState('Food');
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch all sheets
  const { data: sheets = [], isLoading: sheetsLoading } = useQuery<ExpenseSheet[]>({
    queryKey: ['expense-sheets'],
    queryFn: async () => {
      const res = await api.get('/transactions/sheets/');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // Auto-select the first sheet
  useEffect(() => {
    if (sheets.length > 0 && activeSheetId === null) {
      setActiveSheetId(sheets[0].id);
    }
  }, [sheets, activeSheetId]);

  const activeSheet = sheets.find((s) => s.id === activeSheetId) || null;

  // Create sheet mutation
  const createSheetMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await api.post('/transactions/sheets/', { ...data, items: [] });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expense-sheets'] });
      setActiveSheetId(data.id);
      setShowCreateModal(false);
      setNewSheetTitle('');
      setNewSheetDescription('');
    },
  });

  // Update sheet mutation (for item changes)
  const updateSheetMutation = useMutation({
    mutationFn: async ({ id, items }: { id: number; items: SheetItem[] }) => {
      const res = await api.patch(`/transactions/sheets/${id}/`, { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-sheets'] });
    },
  });

  // Delete sheet mutation
  const deleteSheetMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/transactions/sheets/${id}/`);
    },
    onSuccess: () => {
      setActiveSheetId(null);
      queryClient.invalidateQueries({ queryKey: ['expense-sheets'] });
    },
  });

  // Commit to transactions mutation
  const commitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/transactions/sheets/${id}/commit_to_transactions/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Handlers
  const handleAddItem = () => {
    if (!activeSheet || !itemDescription || !itemAmount) return;
    const items = [...(activeSheet.items || [])];
    const nextId = items.length > 0 ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1;
    items.push({
      id: nextId,
      description: itemDescription,
      amount: parseFloat(itemAmount),
      category: itemCategory,
      date: itemDate,
    });
    updateSheetMutation.mutate({ id: activeSheet.id, items });
    resetItemForm();
  };

  const handleEditItem = () => {
    if (!activeSheet || editingItemId === null) return;
    const items = (activeSheet.items || []).map((item) =>
      item.id === editingItemId
        ? { ...item, description: itemDescription, amount: parseFloat(itemAmount), category: itemCategory, date: itemDate }
        : item
    );
    updateSheetMutation.mutate({ id: activeSheet.id, items });
    resetItemForm();
  };

  const handleDeleteItem = (itemId: number) => {
    if (!activeSheet) return;
    const items = (activeSheet.items || []).filter((i) => i.id !== itemId);
    updateSheetMutation.mutate({ id: activeSheet.id, items });
  };

  const openEditItem = (item: SheetItem) => {
    setEditingItemId(item.id);
    setItemDescription(item.description);
    setItemAmount(String(item.amount));
    setItemCategory(item.category);
    setItemDate(item.date);
    setShowItemModal(true);
  };

  const resetItemForm = () => {
    setShowItemModal(false);
    setEditingItemId(null);
    setItemDescription('');
    setItemAmount('');
    setItemCategory('Food');
    setItemDate(new Date().toISOString().split('T')[0]);
  };

  const totalAmount = (activeSheet?.items || []).reduce((s, i) => s + (i.amount || 0), 0);

  const categoryOptions = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Other'];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
            {t('sheets.title', 'Expense Sheets')}
          </h1>
          <p className="text-slate-400 mt-1">
            {t('sheets.subtitle', 'Upload and manage Excel/CSV expense sheets effortlessly.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sheet selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSheetDropdown(!showSheetDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 hover:border-indigo-500/50 transition-all min-w-[200px] justify-between"
            >
              <span className="truncate">{activeSheet?.title || 'Select Sheet'}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {showSheetDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {sheets.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSheetId(s.id); setShowSheetDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center justify-between ${
                      s.id === activeSheetId ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="text-xs text-slate-500">{(s.items || []).length} items</span>
                  </button>
                ))}
                {sheets.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500">No sheets yet</div>
                )}
              </div>
            )}
          </div>

          {/* Create new sheet button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Sheet
          </button>
        </div>
      </div>

      {/* Active Sheet Content */}
      {activeSheet ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Sheet summary bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div>
              <h2 className="text-xl font-semibold text-white">{activeSheet.title}</h2>
              {activeSheet.description && (
                <p className="text-sm text-slate-400 mt-1">{activeSheet.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {user?.currency === 'BDT' ? '৳' : '$'}{totalAmount.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowItemModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
              <button
                onClick={() => activeSheet.items?.length && commitMutation.mutate(activeSheet.id)}
                disabled={!activeSheet.items?.length || commitMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <ArrowRightCircle className="h-4 w-4" />
                {commitMutation.isPending ? 'Committing...' : 'Commit to Transactions'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this expense sheet permanently?')) {
                    deleteSheetMutation.mutate(activeSheet.id);
                  }
                }}
                className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Success message for commit */}
          {commitMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              All items have been committed as permanent transactions!
            </motion.div>
          )}

          {/* Items Table */}
          {(activeSheet.items || []).length > 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSheet.items.map((item, idx) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-200 font-medium">{item.description || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-rose-400">
                        {user?.currency === 'BDT' ? '৳' : '$'}{Number(item.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{item.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-2 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800/20">
                    <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-slate-400">Total</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-400">
                      {user?.currency === 'BDT' ? '৳' : '$'}{totalAmount.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
              <FileSpreadsheet className="h-16 w-16 text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No Items Yet</h3>
              <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
                Add items manually using the button above, or ask the AI Advisor:
              </p>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-indigo-300 italic">"Add taxi 250 taka to my expense sheet"</span>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        /* No sheet selected — empty state */
        <div className="flex flex-col items-center justify-center py-32 bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl">
          <FileSpreadsheet className="h-20 w-20 text-slate-700 mb-6" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Expense Sheets</h3>
          <p className="text-sm text-slate-500 mb-8 text-center max-w-md">
            Create an expense sheet to start planning and organizing your expenses before recording them as permanent transactions.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Your First Sheet
          </button>
        </div>
      )}

      {/* ── Create Sheet Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">New Expense Sheet</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="e.g. August Week 1 Expenses"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Description (optional)</label>
                  <textarea
                    value={newSheetDescription}
                    onChange={(e) => setNewSheetDescription(e.target.value)}
                    placeholder="Quick notes about this sheet..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
                <button
                  onClick={() => newSheetTitle.trim() && createSheetMutation.mutate({ title: newSheetTitle.trim(), description: newSheetDescription.trim() })}
                  disabled={!newSheetTitle.trim() || createSheetMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  {createSheetMutation.isPending ? 'Creating...' : 'Create Sheet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add/Edit Item Modal ── */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => resetItemForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingItemId !== null ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button onClick={resetItemForm} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Taxi to office"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Amount</label>
                    <input
                      type="number"
                      value={itemAmount}
                      onChange={(e) => setItemAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                    >
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={itemDate}
                    onChange={(e) => setItemDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  onClick={editingItemId !== null ? handleEditItem : handleAddItem}
                  disabled={!itemDescription.trim() || !itemAmount}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  {editingItemId !== null ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
