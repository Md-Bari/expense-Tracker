'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  FileText,
  Bot,
  LogOut,
  Bell,
  ScanLine,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Savings Goals', href: '/goals', icon: Target },
    { name: 'PDF Reports', href: '/reports', icon: FileText },
    { name: 'AI Advisor', href: '/chat', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 text-slate-300">
      {/* Brand logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
          A
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Aura AI</h1>
          <p className="text-xs text-indigo-400 font-medium">Smart Wealth Manager</p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-250 ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 font-semibold'
                  : 'hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        {/* Notifications and Scan Bar */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-medium">Currency: {user?.currency || 'BDT'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/dashboard?notifications=true" className="relative p-1 hover:text-white hover:bg-slate-800 rounded-lg">
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800/40">
          <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
            {user?.username?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-rose-950/30 hover:text-rose-400 text-slate-500 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
