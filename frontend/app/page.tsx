'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  Sparkles,
  ArrowRight,
  Mic,
  ScanLine,
  ShieldCheck,
  FileText,
  Check,
  Bot,
  Loader2,
  Wallet,
  MapPin,
  Phone,
  ArrowUp,
  Mail,
  TrendingUp,
  Zap,
  Star,
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  price: string | number;
  currency: string;
  duration_months: number;
  description: string;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number | null>(null);
  const [isTypingDemo, setIsTypingDemo] = useState(false);
  const [demoChatHistory, setDemoChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; visual?: React.ReactNode }>>([]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus('error');
      return;
    }
    setNewsletterStatus('success');
    setNewsletterEmail('');
    setTimeout(() => setNewsletterStatus('idle'), 3000);
  };

  const DEMO_PROMPTS = [
    {
      prompt: "Show my spending ratio this week",
      reply: "Based on your records, you spent ৳5,420 this week. Food & Dining is 42% at ৳2,276, Transport is 18% at ৳975, and Entertainment is 40% at ৳2,169. You're ৳580 under your weekly budget!",
      visual: (
        <div className="mt-2.5 p-3.5 bg-white border border-violet-100 rounded-xl space-y-2 max-w-xs shadow-sm">
          <div className="text-[10px] font-bold text-violet-600">Weekly Spent Distribution</div>
          <div className="space-y-2 text-[10px]">
            {[
              { label: 'Food & Dining', pct: 42, val: '৳2,276', color: 'bg-violet-500' },
              { label: 'Transport', pct: 18, val: '৳975', color: 'bg-emerald-500' },
              { label: 'Entertainment', pct: 40, val: '৳2,169', color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-slate-500 mb-0.5">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-700">{item.pct}% ({item.val})</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      prompt: "Scan my Starbucks receipt",
      reply: "OCR Scan complete! I extracted 2 items from your receipt and pre-filled the transaction form:",
      visual: (
        <div className="mt-2.5 p-3 bg-white border border-violet-100 rounded-xl text-[10px] space-y-1.5 max-w-xs shadow-sm">
          <div className="flex justify-between font-bold text-violet-600 border-b border-slate-100 pb-1 mb-1">
            <span>Starbucks Coffee</span><span>2026-08-02</span>
          </div>
          <div className="flex justify-between text-slate-500"><span>1x Caramel Macchiato</span><span className="font-semibold text-slate-700">৳420.00</span></div>
          <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-1 mb-1"><span>1x Chocolate Croissant</span><span className="font-semibold text-slate-700">৳180.00</span></div>
          <div className="flex justify-between font-bold text-slate-800 pt-0.5"><span>Total</span><span className="text-violet-600">৳600.00</span></div>
        </div>
      )
    },
    {
      prompt: "Can I afford a new tablet next month?",
      reply: "Great question! With a monthly surplus of ৳15,000 (income ৳45,000 minus expenses ৳30,000), a ৳25,000 tablet would take 1.6 months of savings. I'd suggest allocating ৳5,000 over two months to stay on track with your ৳50,000 savings goal.",
      visual: null
    }
  ];

  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await api.get('/subscriptions/plans/');
        setPlans(response.data);
      } catch {
        setPlans([
          { id: 1, name: "Monthly Premium", price: "150.00", currency: "BDT", duration_months: 1, description: "Full access to all AI features, OCR scanning, and PDF reports, billed monthly." },
          { id: 2, name: "Annual Premium", price: "1500.00", currency: "BDT", duration_months: 12, description: "Save 16%! Full access to the complete AI wealth package for an entire year." }
        ]);
      } finally {
        setPlansLoading(false);
      }
    }
    loadPlans();
  }, []);

  const handleDemoClick = (index: number) => {
    if (isTypingDemo) return;
    setSelectedDemoIndex(index);
    setIsTypingDemo(true);
    setDemoChatHistory([{ role: 'user', content: DEMO_PROMPTS[index].prompt }]);
    setTimeout(() => {
      setDemoChatHistory((prev) => [...prev, { role: 'assistant', content: DEMO_PROMPTS[index].reply, visual: DEMO_PROMPTS[index].visual }]);
      setIsTypingDemo(false);
    }, 1200);
  };

  const features = [
    { icon: <Mic className="h-5 w-5" />, title: 'Clear Voice Assistant', desc: 'Talk directly with Aura. Natural speech recognition with high-quality female voice synthesis.', color: 'from-violet-500 to-indigo-500', bg: 'bg-violet-50', border: 'border-violet-100' },
    { icon: <ScanLine className="h-5 w-5" />, title: 'OCR Receipt Scanner', desc: 'Upload receipt images. Aura instantly extracts items, totals, and descriptions automatically.', color: 'from-sky-500 to-cyan-500', bg: 'bg-sky-50', border: 'border-sky-100' },
    { icon: <ShieldCheck className="h-5 w-5" />, title: 'Safe SQL Sandbox', desc: 'Security first. All queries run in a read-only sandboxed environment limited to your profile.', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { icon: <FileText className="h-5 w-5" />, title: 'Detailed PDF Reports', desc: 'Export monthly summaries, category charts, and budget reviews to clean print-ready PDFs.', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  const testimonials = [
    { quote: "Aura completely transformed how I handle consulting income. The voice assistant is instant, and OCR scanning eliminates manual logging!", name: "Sarah Rahman", role: "Management Consultant", rating: 5, avatar: "/user_avatar_1.png" },
    { quote: "The safe SQL sandbox architecture gives me total peace of mind. As an engineer, knowing my data is isolated and read-only is essential.", name: "Tanvir Ahmed", role: "Full Stack Developer", rating: 5, avatar: "/user_avatar_2.png" },
    { quote: "Tracking savings for my retail shop was chaotic before Aura. Now I have clean visual trends of my monthly surplus in seconds.", name: "Faisal Karim", role: "Retail Shop Owner", rating: 5, avatar: "/user_avatar_3.png" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 text-slate-800 flex flex-col font-sans overflow-x-hidden">

      {/* Ambient background blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-violet-200/35 blur-[120px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="fixed top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/25 blur-[100px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '12s' }}></div>
      <div className="fixed bottom-[-5%] left-[30%] w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[100px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '10s' }}></div>

      {/* Top Info Bar */}
      <div className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-[10px] text-white/90 font-medium z-50 relative">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="h-3 w-3" /><span>+1 (646) 364-8790</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="h-3 w-3" /><span>support@aura-wealth.com</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isAuthenticated ? (
              <span className="font-bold text-white">Welcome back! 👋</span>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/login')} className="hover:text-white transition-colors cursor-pointer">Log In</button>
                <span className="text-white/30">|</span>
                <button onClick={() => router.push('/register')} className="font-bold text-white hover:text-yellow-200 transition-colors cursor-pointer">Sign Up Free →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/80 shadow-sm shadow-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Aura</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-500">
            {[['Home', '#'], ['Features', '#features'], ['Demo', '#demo'], ['Pricing', '#pricing']].map(([label, href]) => (
              <a key={label} href={href} className="hover:text-violet-600 transition-colors relative group">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            ) : isAuthenticated ? (
              <button onClick={() => router.push('/dashboard')} className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all cursor-pointer">
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => router.push('/login')} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-violet-600 transition-colors cursor-pointer">
                  Sign In
                </button>
                <button onClick={() => router.push('/register')} className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all cursor-pointer">
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10">

        {/* Left: copy */}
        <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200 text-violet-700 text-[11px] font-bold tracking-wide uppercase mx-auto lg:mx-0 shadow-sm">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <span>AI-Powered Wealth Assistant</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
            <span className="text-slate-900">Take Control of</span>{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Your Wealth
            </span>
            <br />
            <span className="text-slate-900">with </span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Aura AI</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6 Q50 2 100 4 Q150 6 198 2" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="ug" x1="0" y1="0" x2="200" y2="0">
                    <stop offset="0%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#4f46e5"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
            Manage budgets, track goals, scan bills via OCR, and converse naturally with your AI financial advisor — all in one beautifully designed platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => router.push('/register')}
              className="group px-7 py-3.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 hover:shadow-violet-500/50 hover:-translate-y-1 transition-all cursor-pointer"
            >
              <span>Start for Free</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#demo"
              className="px-7 py-3.5 font-bold text-sm bg-white text-slate-700 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 hover:border-violet-300 hover:text-violet-600 hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <Bot className="h-4 w-4" />
              Try Live Demo
            </a>
          </div>

          {/* Stats row */}
          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
            {[
              { val: '৳0', label: 'Free to Start' },
              { val: '100%', label: 'Data Secure' },
              { val: 'Instant', label: 'OCR Parsing' },
            ].map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <div className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{stat.val}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: elegant photo */}
        <div className="lg:col-span-6 relative">
          {/* Ambient glow */}
          <div className="absolute -inset-6 bg-gradient-to-tr from-violet-200/50 via-amber-100/30 to-indigo-100/20 rounded-[3rem] blur-3xl z-0"></div>

          {/* Photo frame */}
          <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-400/20 ring-1 ring-white/60">
            <img
              src="/hero_girl_thinking.png"
              alt="Professional woman thoughtfully planning her finances"
              className="w-full object-cover aspect-[4/3] hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
            {/* Soft bottom gradient for card legibility */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 via-black/15 to-transparent pointer-events-none"></div>

            {/* Floating info cards over the photo */}
            <div className="absolute bottom-5 left-4 right-4 flex items-end justify-between gap-3 pointer-events-none">
              {/* Net savings card */}
              <div className="bg-white/92 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/70">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Net Savings</div>
                <div className="text-base font-extrabold text-emerald-600">+৳87,034</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[9px] text-emerald-500 font-semibold">36.7% savings rate</span>
                </div>
              </div>

              {/* Aura AI card */}
              <div className="bg-white/92 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/70">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Advisor</div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="h-6 w-6 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">Aura</span>
                </div>
                <div className="text-[9px] text-violet-500 font-semibold">Active • Listening</div>
              </div>
            </div>
          </div>

          {/* Top-right pill badge */}
          <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-3.5 py-2 rounded-2xl shadow-lg shadow-violet-500/30 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 z-10">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-[11px] font-bold uppercase tracking-wide">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Designed for Financial Clarity</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
            Packed with advanced AI tooling, Aura turns complex financial data into simple conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className={`p-6 ${f.bg} border ${f.border} rounded-2xl space-y-4 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group cursor-default`}>
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── INTERACTIVE DEMO ─────────────────────────────── */}
      <section id="demo" className="bg-gradient-to-br from-violet-50 via-indigo-50/40 to-sky-50/30 py-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wide">
                <Bot className="h-3.5 w-3.5" />
                <span>Live Interaction Preview</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Try Aura in Action</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Click a sample prompt to see how Aura interprets questions, analyzes your data, and responds with structured insights.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                {DEMO_PROMPTS.map((promptData, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDemoClick(idx)}
                    className={`p-4 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedDemoIndex === idx
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-lg shadow-violet-500/25'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 shadow-sm'
                    }`}
                  >
                    <span>"{promptData.prompt}"</span>
                    <ArrowRight className={`h-4 w-4 shrink-0 ml-2 ${selectedDemoIndex === idx ? 'text-white' : 'text-violet-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 h-[380px] flex flex-col shadow-xl shadow-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">Aura Interactive Demo</span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-violet-100 border border-violet-200 text-[9px] font-bold text-violet-600 uppercase tracking-wider">Guest Preview</div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 text-[11px] pr-1">
                  {demoChatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <Bot className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-500">Select a sample prompt to start</span>
                    </div>
                  ) : (
                    demoChatHistory.map((msg, i) => {
                      const isBot = msg.role === 'assistant';
                      return (
                        <div key={i} className={`flex items-start gap-2.5 ${isBot ? '' : 'justify-end'}`}>
                          {isBot && (
                            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shrink-0">A</div>
                          )}
                          <div className="max-w-[80%]">
                            <div className={`p-3 rounded-2xl leading-relaxed ${isBot ? 'bg-slate-50 border border-slate-100 text-slate-600' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-md'}`}>
                              {msg.content}
                            </div>
                            {isBot && msg.visual && <div className="mt-1">{msg.visual}</div>}
                          </div>
                          {!isBot && (
                            <div className="h-7 w-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">U</div>
                          )}
                        </div>
                      );
                    })
                  )}
                  {isTypingDemo && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                      <span className="text-xs">Aura is analyzing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 z-10">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wide">
            <Star className="h-3.5 w-3.5" />
            <span>Customer Stories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Loved by Wealth Builders</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
            Professionals, freelancers, and business owners use Aura to manage cash flows and reach their savings goals.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="relative p-7 rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-100/80 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed italic mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border-2 border-violet-100" />
                <div>
                  <div className="text-sm font-bold text-slate-800">{t.name}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 py-24 z-10 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-violet-300 text-[11px] font-bold uppercase tracking-wide">
              <Wallet className="h-3.5 w-3.5" />
              <span>Pricing & Subscriptions</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Choose Your Plan</h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">Start free or upgrade to unlock continuous AI features and cloud OCR processing.</p>
          </div>
          {plansLoading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {plans.map((plan) => {
                const isYearly = plan.duration_months === 12;
                return (
                  <div key={plan.id} className={`relative p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isYearly ? 'bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-500/50 shadow-2xl shadow-violet-500/25' : 'bg-white/8 border-white/15 backdrop-blur hover:bg-white/12 hover:border-white/25'}`}>
                    {isYearly && (
                      <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md">⭐ Best Value</div>
                    )}
                    <div className="space-y-5">
                      <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-white">৳{parseInt(plan.price as string).toLocaleString()}</span>
                        <span className="text-sm text-white/50 font-semibold">/ {isYearly ? 'year' : 'month'}</span>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">{plan.description}</p>
                      <div className="h-px bg-white/10 my-4"></div>
                      <ul className="space-y-3 text-sm text-white/70">
                        {['Conversational Voice Assistant', 'OCR Receipt Scanning', 'Safe SQL Account Isolation', 'Unlimited Budgets & Goals', 'Celery Background PDF Reports'].map((feat) => (
                          <li key={feat} className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${isYearly ? 'bg-white/20' : 'bg-violet-500/20'}`}>
                              <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => router.push('/register')} className={`mt-8 w-full py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer hover:-translate-y-0.5 ${isYearly ? 'bg-white text-violet-700 hover:bg-violet-50 shadow-lg' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20'}`}>
                      {isYearly ? 'Get Best Value' : 'Subscribe Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="w-full bg-white border-t border-slate-100 pt-16 pb-8 text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Aura</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[12px]">AI-powered wealth and expense management. Insights, budgets, and intelligent goals — all in one place.</p>
            <div className="space-y-2 text-slate-400 text-[12px]">
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0" /><span>13th Street, 47 W 13th St, New York, USA</span></div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-violet-400 shrink-0" /><span>+1 (646) 364-8790</span></div>
            </div>
            <div className="flex gap-2.5 pt-1">
              {['F', 'X', 'In', 'Ig'].map((s) => (
                <a key={s} href="#" className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all">{s}</a>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-slate-800 tracking-wide">Useful Links</h4>
            <ul className="space-y-2.5 text-slate-400">
              {[['Home', '#'], ['Features', '#features'], ['Demo & Chat', '#demo'], ['Pricing Plans', '#pricing']].map(([name, href]) => (
                <li key={name}><a href={href} className="hover:text-violet-600 transition-colors flex items-center gap-2 group"><span className="h-1 w-1 rounded-full bg-slate-200 group-hover:bg-violet-400 transition-colors"></span>{name}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-slate-800 tracking-wide">Resources</h4>
            <ul className="space-y-2.5 text-slate-400">
              {[['Dashboard', '/dashboard'], ['Privacy Policy', '#'], ['Terms & Conditions', '#'], ['Cookie Policy', '#']].map(([name, href]) => (
                <li key={name}><a href={href} className="hover:text-violet-600 transition-colors flex items-center gap-2 group"><span className="h-1 w-1 rounded-full bg-slate-200 group-hover:bg-violet-400 transition-colors"></span>{name}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-slate-800 tracking-wide">Stay Updated</h4>
            <p className="text-slate-400 leading-relaxed text-[12px]">Get real-time updates and financial tips straight to your inbox.</p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white transition-all"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 cursor-pointer">
                <Mail className="h-3.5 w-3.5" />Subscribe
              </button>
              {newsletterStatus === 'success' && <p className="text-[10px] text-emerald-600 font-semibold">✓ You're subscribed!</p>}
              {newsletterStatus === 'error' && <p className="text-[10px] text-rose-500 font-semibold">Please enter a valid email.</p>}
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-[11px]">© 2026 Aura AI. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Built with</span><span className="text-rose-400">♥</span><span>for smart financial management</span>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-40 h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
