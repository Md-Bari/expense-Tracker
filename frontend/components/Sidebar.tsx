'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import LanguageToggle from '@/components/LanguageToggle';
import { api } from '@/services/api';
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileSpreadsheet,
  PieChart,
  Target,
  FileText,
  Bot,
  LogOut,
  Bell,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const response = await api.get('/notifications/');
        const unread = response.data.filter((n: any) => !n.is_read).length;
        setUnreadNotifications(unread);
      } catch (error) {
        // Silently ignore notification count errors in navigation
      }
    };

    if (user) {
      fetchNotificationsCount();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotificationsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { key: 'nav.dashboard', defaultName: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'nav.transactions', defaultName: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { key: 'nav.sheets', defaultName: 'Expense Sheets', href: '/sheets', icon: FileSpreadsheet },
    { key: 'nav.budgets', defaultName: 'Budgets', href: '/budgets', icon: PieChart },
    { key: 'nav.goals', defaultName: 'Savings Goals', href: '/goals', icon: Target },
    { key: 'nav.reports', defaultName: 'PDF Reports', href: '/reports', icon: FileText },
    { key: 'nav.chat', defaultName: 'AI Advisor', href: '/chat', icon: Bot },
  ];

  if (user?.is_staff || user?.is_superuser) {
    navItems.push({ key: 'nav.admin', defaultName: 'Admin Console', href: '/admin', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#052322]/95 backdrop-blur-md border-b border-teal-950/60 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-[#072e2c] text-slate-300 hover:text-white border border-teal-900/50 active:scale-95 transition-all cursor-pointer"
            aria-label={isMobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="h-5 w-5 text-[#0da594]" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" title="Go to Landing Page">
            <img
              src="/fincore_logo.png"
              alt="FinCore AI Logo"
              className="h-8 w-8 rounded-xl object-cover border border-teal-500/40 shadow-md shadow-teal-500/20"
            />
            <span className="text-base font-bold text-white tracking-tight">{language === 'bn' ? 'ফিনকোর এআই' : 'FinCore AI'}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link href="/dashboard?notifications=true" className="relative p-2 hover:text-white hover:bg-[#072e2c] rounded-xl text-slate-400">
            <Bell className="h-4.5 w-4.5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#041a19] border-r border-teal-950/60 flex flex-col h-screen text-slate-300 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand logo & Close button */}
        <div className="p-6 border-b border-teal-950/60 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity group" title="Go to Landing Page">
            <img
              src="/fincore_logo.png"
              alt="FinCore AI Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-teal-500/25 border border-teal-500/40 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight group-hover:text-[#0da594] transition-colors">{language === 'bn' ? 'ফিনকোর এআই' : 'FinCore AI'}</h1>
              <p className="text-xs text-[#0da594] font-medium">Smart Wealth Manager</p>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-[#072e2c] text-slate-400 hover:text-white transition-colors"
            aria-label="Close Navigation Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-250 ${
                  isActive
                    ? 'bg-[#0da594]/15 text-[#0da594] border-l-2 border-[#0da594] font-bold'
                    : 'hover:bg-[#072e2c] hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-[#0da594]' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{t(item.key, item.defaultName)}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-teal-950/60 bg-[#031413] space-y-3">
          {/* Language Toggle & Notifications Bar */}
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0da594] animate-pulse"></span>
              <span className="text-slate-400 font-medium">{t('currency.label')}: {user?.currency || 'BDT'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard?notifications=true" className="relative p-1 hover:text-white hover:bg-[#072e2c] rounded-lg" title={t('dash.notifications')}>
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* User Card with Language & Dark Mode Toggles */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#052322] border border-teal-900/40">
            <div className="h-9 w-9 rounded-full bg-[#0da594]/20 flex items-center justify-center text-[#0da594] font-bold border border-[#0da594]/30 shrink-0 text-xs">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.username || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <LanguageToggle showText={false} />
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-[#072e2c] hover:text-white text-slate-400 transition-colors cursor-pointer"
                title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#0da594]" />}
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                title={t('nav.logout')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
