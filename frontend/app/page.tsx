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
  Play,
  Calendar,
  User,
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
  const [activeSlide, setActiveSlide] = useState(0);

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
        <div className="mt-2.5 p-3.5 bg-white border border-teal-100 rounded-xl space-y-2 max-w-xs shadow-sm">
          <div className="text-[10px] font-bold text-[#0da594]">Weekly Spent Distribution</div>
          <div className="space-y-2 text-[10px]">
            {[
              { label: 'Food & Dining', pct: 42, val: '৳2,276', color: 'bg-emerald-500' },
              { label: 'Transport', pct: 18, val: '৳975', color: 'bg-teal-500' },
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
        <div className="mt-2.5 p-3 bg-white border border-teal-100 rounded-xl text-[10px] space-y-1.5 max-w-xs shadow-sm">
          <div className="flex justify-between font-bold text-[#0da594] border-b border-slate-100 pb-1 mb-1">
            <span>Starbucks Coffee</span><span>2026-08-02</span>
          </div>
          <div className="flex justify-between text-slate-500"><span>1x Caramel Macchiato</span><span className="font-semibold text-slate-700">৳420.00</span></div>
          <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-1 mb-1"><span>1x Chocolate Croissant</span><span className="font-semibold text-slate-700">৳180.00</span></div>
          <div className="flex justify-between font-bold text-slate-800 pt-0.5"><span>Total</span><span className="text-[#0da594]">৳600.00</span></div>
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

  const HERO_SLIDES = [
    {
      image: '/saving_stress_analytics.png',
      subtitle: 'WELCOME! START MANAGING YOUR WEALTH TODAY',
      title: 'Big Opportunity For Your Business Growth',
      desc: 'Take control of your budgets, analyze structural costing, and make smarter decisions with our AI-powered wealth and analytics platform.'
    },
    {
      image: '/hero_girl_thinking.png',
      subtitle: 'INTELLIGENT FINANCIAL COGNITION',
      title: 'Analytical Thinking For Smart Savings',
      desc: 'Speak naturally to Aura AI to get real-time expense category classification, sandboxed insights, and customized targets.'
    },
    {
      image: '/landing_hero_mock.png',
      subtitle: 'SECURE & SECURED SANDBOX',
      title: 'Advanced Tracking, Simplified Reporting',
      desc: 'Isolated SQL environment, receipt extraction via OCR, and clean formatted PDF summaries ready to print.'
    }
  ];

  const features = [
    { icon: <Mic className="h-5 w-5" />, title: 'Clear Voice Assistant', desc: 'Talk directly with Aura. Natural speech recognition with high-quality female voice synthesis.', color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { icon: <ScanLine className="h-5 w-5" />, title: 'OCR Receipt Scanner', desc: 'Upload receipt images. Aura instantly extracts items, totals, and descriptions automatically.', color: 'from-teal-400 to-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { icon: <ShieldCheck className="h-5 w-5" />, title: 'Safe SQL Sandbox', desc: 'Security first. All queries run in a read-only sandboxed environment limited to your profile.', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { icon: <FileText className="h-5 w-5" />, title: 'Detailed PDF Reports', desc: 'Export monthly summaries, category charts, and budget reviews to clean print-ready PDFs.', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  const testimonials = [
    {
      quote: "The business consultation team helped us identify hidden opportunities we'd been overlooking for years. Their insights streamlined our workflow and raised our client satisfaction by 45%. It feels like we finally unlocked our company's full potential.",
      name: "ROBERT KROL",
      role: "Director, Nexora Consulting",
      avatar: "/user_avatar_1.png"
    },
    {
      quote: "Working with their consultants has been a game changer. We now make decisions backed by data and strategy, not guesswork. Our revenue curve has gone up remarkably within just two quarters — true professionals who deliver results.",
      name: "JON KIRCHER",
      role: "Director, Strivon Group",
      avatar: "/user_avatar_2.png"
    },
    {
      quote: "Their tailored growth plan gave our startup the clarity and direction we needed. From restructuring operations to building stronger marketing funnels, everything now runs with purpose. The impact on our overall performance is simply outstanding.",
      name: "HAROLD JOHNSON",
      role: "Director, Venturea Partners",
      avatar: "/user_avatar_3.png"
    }
  ];

  const blogs = [
    {
      image: '/blog_data_decisions.png',
      date: '19 Oct, 2025',
      author: 'John Doe',
      title: 'How Data Driven Decisions Transform Business Growth'
    },
    {
      image: '/blog_leadership.png',
      date: '19 Oct, 2025',
      author: 'John Doe',
      title: '7 Leadership Habits That Inspire High Performing Teams'
    },
    {
      image: '/blog_scalable_model.png',
      date: '19 Oct, 2025',
      author: 'John Doe',
      title: 'The Ultimate Guide to Building a Scalable Business Model'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-x-hidden">

      {/* Top Info Bar */}
      <div className="w-full bg-[#041a19] py-2.5 text-[11px] text-white/90 font-medium z-50 relative border-b border-teal-950/20">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-[#0da594] transition-colors">
              <Phone className="h-3.5 w-3.5 text-[#0da594]" /><span>+1 (646) 364-8790</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#0da594] transition-colors">
              <Mail className="h-3.5 w-3.5 text-[#0da594]" /><span>support@aura-wealth.com</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0da594]" />
            ) : isAuthenticated ? (
              <span className="font-bold text-white">Welcome back! 👋</span>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/login')} className="hover:text-[#0da594] transition-colors cursor-pointer">Log In</button>
                <span className="text-white/30">|</span>
                <button onClick={() => router.push('/register')} className="font-bold text-white hover:text-[#0da594] transition-colors cursor-pointer">Sign Up Free →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-[#052322] border-b border-teal-950/50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <svg className="w-8 h-8 text-[#0da594]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" />
              <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
              <rect x="17" y="3" width="4" height="17" rx="1" fill="currentColor" />
            </svg>
            <span className="font-extrabold text-2xl tracking-tight text-white">Consultine</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold text-white/90">
            <a href="#" className="hover:text-[#0da594] transition-colors">Home</a>
            <a href="#about" className="hover:text-[#0da594] transition-colors">About Us</a>
            <a href="#demo" className="hover:text-[#0da594] transition-colors">Services</a>
            <a href="#video" className="hover:text-[#0da594] transition-colors">Pages</a>
            <a href="#blog" className="hover:text-[#0da594] transition-colors">Blog</a>
            <a href="#pricing" className="hover:text-[#0da594] transition-colors">Contact</a>
          </nav>

          <div>
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#0da594]" />
            ) : isAuthenticated ? (
              <button onClick={() => router.push('/dashboard')} className="px-6 py-3 text-xs font-extrabold bg-[#0da594] text-white rounded-md hover:bg-[#087f73] transition-all cursor-pointer">
                Go to Dashboard
              </button>
            ) : (
              <button onClick={() => router.push('/register')} className="px-6 py-3 text-xs font-extrabold bg-[#0da594] text-white rounded-md hover:bg-[#087f73] transition-all cursor-pointer">
                Make An Appointment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION WITH INTERACTIVE SLIDER ──────────────── */}
      <section className="relative w-full bg-[#052322] min-h-[600px] lg:min-h-[660px] flex items-center overflow-hidden">
        {/* Slide contents */}
        <div className="max-w-7xl mx-auto px-6 py-16 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
          <div className="lg:col-span-6 space-y-6 text-left relative z-20">
            <div className="text-[#0da594] text-xs font-black tracking-[0.2em] uppercase transition-all duration-500">
              {HERO_SLIDES[activeSlide].subtitle}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight transition-all duration-500">
              {HERO_SLIDES[activeSlide].title}
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl transition-all duration-500">
              {HERO_SLIDES[activeSlide].desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => router.push('/register')}
                className="px-8 py-4 font-extrabold text-xs bg-[#0da594] text-white hover:bg-[#087f73] transition-all cursor-pointer uppercase tracking-wider rounded-md"
              >
                Get Consultancy
              </button>
              <a
                href="#about"
                className="px-8 py-4 font-extrabold text-xs bg-[#2f3e46]/60 border border-slate-600/50 text-white hover:bg-[#2f3e46]/90 hover:border-slate-500 transition-all text-center uppercase tracking-wider rounded-md"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Slide Image Background on Right */}
        <div className="absolute top-0 right-0 w-full lg:w-[52%] h-full z-0 select-none pointer-events-none">
          <img
            src={HERO_SLIDES[activeSlide].image}
            alt="Hero Visual"
            className="w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-60 lg:opacity-100"
          />
          {/* Subtle overlay gradient to merge the image with the left color scheme */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#052322] via-[#052322]/85 lg:via-[#052322]/45 to-transparent"></div>
        </div>

        {/* Slide Indicators on Right */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all border ${
                activeSlide === idx
                  ? 'bg-[#0da594] border-[#0da594] text-white scale-110 shadow-lg'
                  : 'bg-white border-slate-200 text-[#052322] hover:bg-slate-100'
              }`}
            >
              0{idx + 1}
            </button>
          ))}
        </div>
      </section>

      {/* ─── ABOUT COMPANY SECTION ─────────────────────────────────── */}
      <section id="about" className="bg-white py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Overlapping images */}
          <div className="lg:col-span-6 relative w-full h-[380px] sm:h-[480px]">
            {/* Background pattern blob */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-teal-100/50 rounded-full blur-xl z-0"></div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-emerald-50 rounded-full blur-xl z-0"></div>
            
            {/* Top calculator spreadsheets image */}
            <div className="absolute top-0 left-0 w-[68%] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-slate-100 z-10 bg-slate-100">
              <img
                src="/calculator_spreadsheets.png"
                alt="Calculating analytics"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Bottom overlapping consultant image */}
            <div className="absolute bottom-0 right-4 w-[58%] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-white z-20 bg-slate-100">
              <img
                src="/consultant_clipboard.png"
                alt="Our Consultant"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right: Text Information */}
          <div className="lg:col-span-6 space-y-6">
            <div className="text-[#0da594] text-xs font-black tracking-widest uppercase">
              ABOUT AMAZING COMPANY
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322] leading-tight">
              We're Trusted Professional Consultancy Company
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              The business consultancy company stands as a stalwart beacon of guidance and innovation, offering a multifaceted array of services tailored to propel enterprises toward their zenith. At its core, this entity operates as a bastion of strategic insight, employing a cadre of seasoned professionals.
            </p>
            
            {/* Checklists */}
            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3 text-slate-700 text-xs md:text-sm font-semibold">
                <span className="h-5 w-5 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-[#0da594] stroke-[3]" />
                </span>
                <span>Remain flexible and adaptive to swiftly respond to changing market dynamics and client needs.</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 text-xs md:text-sm font-semibold">
                <span className="h-5 w-5 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-[#0da594] stroke-[3]" />
                </span>
                <span>Empower clients through knowledge transfer, skill-building, and fostering a culture of self-sufficiency.</span>
              </li>
            </ul>

            {/* Contact details & button */}
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-[#0da594]">
                  <Phone className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Call Anytime</div>
                  <div className="text-base font-extrabold text-[#052322]">+525-3756-1523</div>
                </div>
              </div>

              <button
                onClick={() => router.push('/register')}
                className="px-6 py-4 font-extrabold text-xs bg-[#0da594] text-white hover:bg-[#087f73] transition-all rounded-md cursor-pointer uppercase tracking-wider"
              >
                Make An Appointment
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ─── INTERACTIVE DEMO & SERVICES SECTION ───────────────────── */}
      <section id="demo" className="bg-[#f0f6f6] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-[#0da594] text-[11px] font-extrabold uppercase tracking-wide">
                <Bot className="h-3.5 w-3.5" />
                <span>Live Interaction Preview</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322]">Try Aura in Action</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Click a sample prompt to see how Aura interprets questions, analyzes expense data, and responds with structured financial insights.
              </p>
              
              <div className="flex flex-col gap-3 pt-2">
                {DEMO_PROMPTS.map((promptData, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDemoClick(idx)}
                    className={`p-4 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      selectedDemoIndex === idx
                        ? 'bg-[#0da594] border-transparent text-white shadow-lg'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-[#0da594]/40 hover:bg-teal-50/30 shadow-sm'
                    }`}
                  >
                    <span>"{promptData.prompt}"</span>
                    <ArrowRight className={`h-4 w-4 shrink-0 ml-2 ${selectedDemoIndex === idx ? 'text-white' : 'text-[#0da594]'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Simulated Chat Box */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 h-[400px] flex flex-col shadow-xl shadow-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-400"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">Aura Interactive Demo</span>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[9px] font-bold text-[#0da594] uppercase tracking-wider">Guest Preview</div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 text-[11px] pr-1">
                  {demoChatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <div className="h-14 w-14 rounded-2xl bg-[#0da594] flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Bot className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">Select a sample prompt to start</span>
                    </div>
                  ) : (
                    demoChatHistory.map((msg, i) => {
                      const isBot = msg.role === 'assistant';
                      return (
                        <div key={i} className={`flex items-start gap-2.5 ${isBot ? '' : 'justify-end'}`}>
                          {isBot && (
                            <div className="h-7 w-7 rounded-xl bg-[#0da594] flex items-center justify-center text-white text-[10px] font-bold shadow-md shrink-0">A</div>
                          )}
                          <div className="max-w-[80%]">
                            <div className={`p-3.5 rounded-2xl leading-relaxed ${isBot ? 'bg-slate-50 border border-slate-100 text-slate-600' : 'bg-[#052322] text-white font-medium shadow-md'}`}>
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
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0da594]" />
                      <span className="text-xs">Aura is analyzing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── VIDEO PRESENTATION SECTION ────────────────────────────── */}
      <section id="video" className="bg-white py-24 text-center">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="space-y-3">
            <div className="text-[#0da594] text-xs font-black tracking-widest uppercase">
              WATCH COMPANY VIDEO
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322] max-w-xl mx-auto leading-tight">
              This is your all-in-one financial and wealth platform
            </h2>
          </div>
          
          {/* Main Video Presentation Card */}
          <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 group aspect-[16/9] bg-slate-100">
            <img
              src="/relaxed_man_office.png"
              alt="Professional Video Cover"
              className="w-full h-full object-cover"
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300"></div>
            
            {/* Text Stroke background overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <div 
                className="text-[60px] sm:text-[90px] md:text-[130px] font-black text-transparent opacity-10 tracking-widest select-none"
                style={{ WebkitTextStroke: '2px white' }}
              >
                Watch Video
              </div>
            </div>

            {/* Play Button Box */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => alert("Simulated Video Playback")}
                className="flex items-center gap-3.5 px-6 py-3.5 bg-[#0da594] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-teal-500/30 hover:scale-105 transition-all cursor-pointer z-10"
              >
                <span>Watch Our Video</span>
                <span className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-[#0da594]">
                  <Play className="h-3.5 w-3.5 fill-[#0da594] ml-0.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─────────────────────────────────── */}
      <section className="bg-[#052322] py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <div className="text-[#0da594] text-xs font-black tracking-widest uppercase">
              TESTIMONIALS
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              What Our Users Said About Aura
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="relative bg-[#072e2c] border border-teal-950/80 rounded-3xl p-8 flex flex-col justify-between hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group shadow-md">
                
                {/* Decorative quote icon */}
                <div className="text-[#0da594]/10 absolute right-6 top-6 text-6xl font-serif pointer-events-none select-none">
                  “
                </div>

                <div className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                {/* Profile info */}
                <div className="flex items-center gap-4 pt-6 mt-6 border-t border-teal-900/50">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover border border-[#0da594]/30"
                  />
                  <div>
                    <div className="text-xs font-black tracking-wide text-white">{t.name}</div>
                    <div className="text-[10px] text-[#0da594] font-bold mt-0.5">{t.role}</div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING PLANS SECTION ────────────────────────────────── */}
      <section id="pricing" className="bg-slate-900 py-24 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#0da594]/5 blur-[90px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-[90px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#0da594] text-[11px] font-black uppercase tracking-wide">
              <Wallet className="h-3.5 w-3.5" />
              <span>Pricing & Subscriptions</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Choose Your Plan</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
              Upgrade to unlock continuous real-time voice consultations and cloud OCR processing.
            </p>
          </div>

          {plansLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0da594]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {plans.map((plan) => {
                const isYearly = plan.duration_months === 12;
                return (
                  <div 
                    key={plan.id} 
                    className={`relative p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                      isYearly 
                        ? 'bg-gradient-to-br from-[#072e2c] to-[#052322] border-[#0da594]/40 shadow-2xl shadow-teal-500/5' 
                        : 'bg-white/5 border-white/10 backdrop-blur hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {isYearly && (
                      <div className="absolute -top-3 right-6 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-black text-[9px] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        ⭐ Best Value
                      </div>
                    )}
                    
                    <div className="space-y-5">
                      <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-white">৳{parseInt(plan.price as string).toLocaleString()}</span>
                        <span className="text-xs text-white/50 font-semibold">/ {isYearly ? 'year' : 'month'}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{plan.description}</p>
                      
                      <div className="h-px bg-white/10 my-4"></div>
                      
                      <ul className="space-y-3 text-xs text-white/70">
                        {[
                          'Conversational Voice Assistant',
                          'OCR Receipt Scanning',
                          'Safe SQL Account Isolation',
                          'Unlimited Budgets & Goals',
                          'Celery Background PDF Reports'
                        ].map((feat) => (
                          <li key={feat} className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 text-[#0da594]" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <button 
                      onClick={() => router.push('/register')} 
                      className={`mt-8 w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        isYearly 
                          ? 'bg-[#0da594] text-white hover:bg-[#087f73] shadow-lg shadow-teal-500/20' 
                          : 'bg-white text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isYearly ? 'Get Best Value' : 'Subscribe Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── BLOG POSTS SECTION ───────────────────────────────────── */}
      <section id="blog" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3">
            <div className="text-[#0da594] text-xs font-black tracking-widest uppercase">
              RECENT POSTS
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322]">
              Latest News & Updates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((b, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="p-6 space-y-3">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#0da594]" />{b.date}</span>
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#0da594]" />By {b.author}</span>
                    </div>
                    
                    <h3 className="text-sm md:text-base font-extrabold text-[#052322] hover:text-[#0da594] transition-colors leading-snug cursor-pointer">
                      {b.title}
                    </h3>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <a 
                    href="#blog" 
                    className="text-[#0da594] hover:text-[#052322] font-black text-[10px] uppercase tracking-wider flex items-center gap-1"
                  >
                    Read More <span className="text-xs font-sans">&gt;&gt;</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER SECTION ────────────────────────────────────────── */}
      <footer className="w-full bg-[#041a19] text-white pt-16 pb-8 text-xs relative z-10 border-t border-teal-950/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Logo & Contact details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <svg className="w-7 h-7 text-[#0da594]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" />
                <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
                <rect x="17" y="3" width="4" height="17" rx="1" fill="currentColor" />
              </svg>
              <span className="font-extrabold text-xl tracking-tight text-white">Consultine</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[12px]">
              AI-powered wealth management and financial intelligence consulting. Insights, budgets, and automated reporting.
            </p>
            <div className="space-y-2 text-slate-400 text-[12px] pt-2">
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#0da594] shrink-0" /><span>13th Street, 47 W 13th St, New York, USA</span></div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#0da594] shrink-0" /><span>+1 (646) 364-8790</span></div>
            </div>
          </div>

          {/* Useful Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-white tracking-wide uppercase">Useful Links</h4>
            <ul className="space-y-2.5 text-slate-400 text-[12px]">
              {[['Home', '#'], ['About Us', '#about'], ['Demo & Preview', '#demo'], ['Pricing Plans', '#pricing']].map(([name, href]) => (
                <li key={name}>
                  <a href={href} className="hover:text-[#0da594] transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 rounded-full bg-slate-600 group-hover:bg-[#0da594] transition-colors"></span>{name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-white tracking-wide uppercase">Resources</h4>
            <ul className="space-y-2.5 text-slate-400 text-[12px]">
              {[['Dashboard', '/dashboard'], ['Privacy Policy', '#'], ['Terms & Conditions', '#'], ['Cookie Policy', '#']].map(([name, href]) => (
                <li key={name}>
                  <a href={href} className="hover:text-[#0da594] transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 rounded-full bg-slate-600 group-hover:bg-[#0da594] transition-colors"></span>{name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Updated / Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-white tracking-wide uppercase">Stay Updated</h4>
            <p className="text-slate-400 leading-relaxed text-[12px]">Get real-time insights and newsletter updates.</p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0da594] transition-all"
              />
              <button type="submit" className="w-full py-3 rounded-md font-bold text-xs uppercase tracking-wider bg-[#0da594] text-white hover:bg-[#087f73] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer">
                <Mail className="h-3.5 w-3.5" />Subscribe
              </button>
              {newsletterStatus === 'success' && <p className="text-[10px] text-emerald-400 font-semibold">✓ You're subscribed!</p>}
              {newsletterStatus === 'error' && <p className="text-[10px] text-rose-400 font-semibold">Please enter a valid email.</p>}
            </form>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-teal-950/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px]">© 2026 Consultine / Aura. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Built for smart cost tracking & wealth decisions</span>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 z-40 h-11 w-11 rounded-full bg-[#0da594] text-white flex items-center justify-center shadow-lg hover:-translate-y-1 hover:bg-[#087f73] transition-all cursor-pointer"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
