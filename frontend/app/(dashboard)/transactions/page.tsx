'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  X,
  FileSpreadsheet,
  Scan,
  AlertCircle,
  FileImage,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, formatCurrency, toBanglaNumeral, formatDate } = useLanguage();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Mobile expandable details row state
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const toggleExpand = (id: number) => {
    setExpandedTxId((prev) => (prev === id ? null : id));
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, categoryFilter, startDate, endDate]);

  // Dialog & Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState('monthly');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // OCR processing state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');

  // Category creation helper state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Verify auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/transactions/categories/');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch transactions
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', page, search, typeFilter, categoryFilter, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const res = await api.get(`/transactions/?${params.toString()}`);
      return res.data;
    },
    enabled: isAuthenticated,
  });

  // Category creation mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; type: string; color: string; icon: string }) => {
      const res = await api.post('/transactions/categories/', payload);
      return res.data;
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategory(newCat.id.toString());
      setIsAddingCategory(false);
      setNewCatName('');
    },
  });

  // Transaction mutations (create/update/delete)
  const saveTxMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      if (editingId) {
        return await api.put(`/transactions/${editingId}/`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        return await api.post('/transactions/', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      handleClose();
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/transactions/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  const handleOpen = (tx?: any) => {
    if (tx) {
      setEditingId(tx.id);
      setAmount(tx.amount.toString());
      setType(tx.type);
      setCategory(tx.category?.toString() || '');
      setDate(tx.date);
      setDescription(tx.description || '');
      setIsRecurring(tx.is_recurring);
      setRecurrencePeriod(tx.recurrence_period || 'monthly');
    } else {
      setEditingId(null);
      setAmount('');
      setType('expense');
      setCategory(categories && categories.length > 0 ? categories[0].id.toString() : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setIsRecurring(false);
      setRecurrencePeriod('monthly');
    }
    setReceiptFile(null);
    setOcrError('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  const handleAddCategorySubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createCategoryMutation.mutate({
      name: newCatName,
      type: type,
      color: newCatColor,
      icon: 'category'
    });
  };

  // OCR Upload Handler
  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setOcrLoading(true);
    setOcrError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/receipts/scan/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const parsed = response.data.data;
      
      // Auto populate fields
      if (parsed.amount) setAmount(parsed.amount.toString());
      if (parsed.description) setDescription(parsed.merchant + ' - ' + parsed.description);
      else if (parsed.merchant) setDescription(parsed.merchant);
      if (parsed.date) setDate(parsed.date);
      
      // Find matching category
      if (parsed.category && categories) {
        const matched = categories.find(
          (c: any) => c.name.toLowerCase() === parsed.category.toLowerCase()
        );
        if (matched) {
          setCategory(matched.id.toString());
        }
      }
    } catch (err: any) {
      setOcrError('Failed to parse text from receipt. Please input values manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('type', type);
    if (category) formData.append('category', category);
    formData.append('date', date);
    formData.append('description', description);
    formData.append('is_recurring', isRecurring ? 'true' : 'false');
    if (isRecurring) {
      formData.append('recurrence_period', recurrencePeriod);
    }
    if (receiptFile) {
      formData.append('receipt_image', receiptFile);
    }

    saveTxMutation.mutate(formData);
  };

  if (authLoading || txLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{t('trans.title', 'Transactions')}</h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                {t('trans.subtitle', 'Maintain and record your daily revenues and expenditures.')}
              </p>
            </div>
            
            <button
              onClick={() => handleOpen()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t('trans.addBtn', 'Record Transaction')}</span>
            </button>
          </div>

          {/* Filtering panels */}
          <div className="glass-panel p-4 md:p-5 rounded-2xl border border-slate-800 grid grid-cols-2 md:flex md:flex-wrap gap-3 md:gap-4 items-end">
            <div className="col-span-2 md:flex-1 md:min-w-[200px] space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{t('trans.colDescription', 'Search')}</label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('trans.searchPlaceholder', 'search description...')}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{t('trans.colType', 'Type')}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-white"
              >
                <option value="">{t('trans.allTypes', 'All')}</option>
                <option value="income">{t('trans.typeIncome', 'Income')}</option>
                <option value="expense">{t('trans.typeExpense', 'Expense')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{t('trans.colCategory', 'Category')}</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-white"
              >
                <option value="">{t('trans.allCategories', 'All Categories')}</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>
          </div>

          {/* Transactions List */}
          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block glass-panel rounded-2xl border border-slate-800 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs min-w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-850 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3.5 px-6">{t('trans.colDate', 'Date')}</th>
                    <th className="py-3.5 px-6">{t('trans.colCategory', 'Category')}</th>
                    <th className="py-3.5 px-6">{t('trans.colDescription', 'Description')}</th>
                    <th className="py-3.5 px-6">{t('trans.colType', 'Type')}</th>
                    <th className="py-3.5 px-6">{t('trans.colAmount', 'Amount')}</th>
                    <th className="py-3.5 px-6 text-center">{t('trans.colActions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {transactions?.results && transactions.results.length > 0 ? (
                    transactions.results.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-900/25 transition-colors">
                        <td className="py-3.5 px-6 font-medium text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: tx.category_detail?.color || '#94a3b8' }}
                            ></span>
                            <span className="font-semibold text-slate-200 text-xs">
                              {tx.category_detail?.name || 'General'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 italic text-slate-400 truncate max-w-[200px]">
                          {tx.description || '-'}
                          {tx.is_recurring && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] text-indigo-400 capitalize">
                              {tx.recurrence_period}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              tx.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {tx.type === 'income' ? t('trans.typeIncome', 'Income') : t('trans.typeExpense', 'Expense')}
                          </span>
                        </td>
                        <td className={`py-3.5 px-6 font-bold text-xs whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3.5 px-6 text-center space-x-2">
                          <button
                            onClick={() => handleOpen(tx)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTxMutation.mutate(tx.id)}
                            className="p-1 rounded hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                        {t('trans.noFound', 'No transactions recorded.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (visible ONLY on mobile md:hidden) */}
          <div className="block md:hidden space-y-3 w-full">
            {transactions?.results && transactions.results.length > 0 ? (
              transactions.results.map((tx: any) => {
                const isExpanded = expandedTxId === tx.id;
                return (
                  <div
                    key={tx.id}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 transition-all"
                  >
                    {/* Top Row: Category dot & Name, Type badge, Amount & Arrow */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tx.category_detail?.color || '#94a3b8' }}
                        ></span>
                        <span className="font-bold text-white text-sm">
                          {tx.category_detail?.name || 'General'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {tx.type === 'income' ? t('trans.typeIncome', 'Income') : t('trans.typeExpense', 'Expense')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <button
                          onClick={() => toggleExpand(tx.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50 active:scale-95 transition-all"
                          aria-label="Toggle Details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-indigo-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Sub Row: Date */}
                    <div className="text-xs text-slate-400 font-medium">
                      Date: {tx.date}
                    </div>

                    {/* Collapsible Details Panel when Arrow is clicked */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-850 space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-start justify-between">
                          <span className="text-slate-400 font-medium shrink-0">Description:</span>
                          <span className="text-slate-200 italic text-right ml-4">
                            {tx.description || 'No description provided'}
                          </span>
                        </div>

                        {tx.is_recurring && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Recurring:</span>
                            <span className="text-indigo-400 font-semibold capitalize">
                              {tx.recurrence_period}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/60">
                          <button
                            onClick={() => handleOpen(tx)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-600/30 transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => deleteTxMutation.mutate(tx.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-950/60 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 font-medium glass-panel rounded-2xl border border-slate-800">
                No transactions recorded. Click Record Transaction to begin.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {transactions?.results && transactions.count > 10 && (
            <div className="glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-xs gap-3">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-200">
                  {(page - 1) * 10 + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(page * 10, transactions.count)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-200">{transactions.count}</span>{' '}
                entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    page === 1
                      ? 'border-slate-850 text-slate-600 bg-slate-950/20 cursor-not-allowed'
                      : 'border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 bg-slate-900/40 cursor-pointer'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.ceil(transactions.count / 10) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 bg-slate-900/40'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(transactions.count / 10), p + 1))}
                  disabled={page >= Math.ceil(transactions.count / 10)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    page >= Math.ceil(transactions.count / 10)
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
      </main>

      {/* Upload/Creation Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-screen flex flex-col p-6 shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Transaction' : 'Record Transaction'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* AI Receipt Scanning Box */}
            {!editingId && (
              <div className="mb-6 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 relative">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <Scan className="h-4 w-4 text-indigo-400" />
                  <span>AI Receipt Scanning Auto-fill</span>
                </h4>
                
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-2 transition-all">
                    <FileImage className="h-4 w-4" />
                    <span>Upload receipt image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOcrFileChange}
                      className="hidden"
                    />
                  </label>
                  
                  {ocrLoading && (
                    <div className="text-slate-400 text-xs flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Reading receipt details...</span>
                    </div>
                  )}
                  
                  {receiptFile && !ocrLoading && (
                    <span className="text-xs text-emerald-400 truncate max-w-[150px]">
                      {receiptFile.name}
                    </span>
                  )}
                </div>
                {ocrError && (
                  <p className="text-[10px] text-rose-400 mt-2 font-medium">{ocrError}</p>
                )}
              </div>
            )}

            {/* Standard Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      type === 'expense'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Amount (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <div className="space-y-1">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                    >
                      {categories?.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      + Create Custom Category
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Add Category field */}
              {isAddingCategory && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                  <h5 className="text-[10px] uppercase font-semibold text-white">New Category Details</h5>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="category name..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                    />
                    <button
                      onClick={handleAddCategorySubmit}
                      className="px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingCategory(false)}
                      className="p-1 text-slate-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="what was this transaction for?"
                  rows={3}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Is this a recurring transaction?</label>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 text-indigo-600 bg-slate-950 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                </div>

                {isRecurring && (
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-semibold text-slate-400">Recurrence Frequency</label>
                    <select
                      value={recurrencePeriod}
                      onChange={(e) => setRecurrencePeriod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saveTxMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saveTxMutation.isPending ? 'Saving...' : 'Confirm and Save'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
