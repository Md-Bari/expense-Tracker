'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, formatDate } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Redirect guest
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch reports list (poll every 4 seconds to catch background Celery completion)
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get('/reports/');
      return res.data;
    },
    enabled: isAuthenticated,
    refetchInterval: (query) => {
      // Check if any report is pending, if so continue polling
      const hasPending = query.state.data?.some((r: any) => r.status === 'pending');
      return hasPending ? 4000 : false;
    },
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (payload: { start_date: string; end_date: string }) => {
      const res = await api.post('/reports/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsOpen(false);
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await api.delete(`/reports/${reportId}/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate({
      start_date: startDate,
      end_date: endDate,
    });
  };

  const getMediaUrl = (filePath: string) => {
    if (!filePath) return '#';
    // If it's a relative media URL, append domain
    if (filePath.startsWith('http')) return filePath;
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  };

  if (authLoading || reportsLoading) {
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
              <h1 className="text-3xl font-bold tracking-tight text-white">{t('reports.title', 'Financial Reports')}</h1>
              <p className="text-sm text-slate-400 mt-1">
                {t('reports.subtitle', 'Generate and download detailed PDF statements and breakdown reports.')}
              </p>
            </div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t('reports.generateBtn', 'Compile Report')}</span>
            </button>
          </div>

          {/* Reports Table list */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-850 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-4 px-6">Date Created</th>
                  <th className="py-4 px-6">Statement Range</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {reports && reports.length > 0 ? (
                  reports.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-900/25 transition-colors">
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        {r.start_date} to {r.end_date}
                      </td>
                      <td className="py-4 px-6 capitalize">
                        {r.status === 'pending' && (
                          <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Processing...</span>
                          </span>
                        )}
                        {r.status === 'completed' && (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>Ready</span>
                          </span>
                        )}
                        {r.status === 'failed' && (
                          <span className="text-rose-450 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 flex items-center justify-center gap-2">
                        {r.status === 'completed' ? (
                          <a
                            href={getMediaUrl(r.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-750 transition-all font-semibold border border-slate-705"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </a>
                        ) : (
                          <span className="text-slate-650 font-medium">-</span>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this compiled PDF report?")) {
                              deleteReportMutation.mutate(r.id);
                            }
                          }}
                          disabled={deleteReportMutation.isPending}
                          className="p-2 rounded-lg bg-slate-800 border border-slate-750 hover:border-rose-500/50 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer disabled:opacity-55"
                          title="Delete Report"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                      No reports generated yet. Click Compile Report to generate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Creation Modal dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <span>Compile PDF Report</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose the dates for your statement period. Aura will gather your cash flow, categories, and active budgets to render a custom document.
              </p>
              
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
                disabled={createReportMutation.isPending}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {createReportMutation.isPending ? 'Requesting...' : 'Request PDF Compilation'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
