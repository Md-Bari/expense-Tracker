'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Shared Navigation Sidebar */}
      <Sidebar />
      
      {/* Wrapped viewport offset to avoid sidebar overlap on desktop */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
