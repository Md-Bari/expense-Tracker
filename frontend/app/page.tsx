'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
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
  Menu,
  X,
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
  const { t, language, formatCurrency, toBanglaNumeral } = useLanguage();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number | null>(null);
  const [isTypingDemo, setIsTypingDemo] = useState(false);
  const [demoChatHistory, setDemoChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; visual?: React.ReactNode }>>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-play hero slider: change one by one automatically every 5 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile navigation menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

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
      prompt: language === 'bn' ? "এই সপ্তাহে আমার খরচের অনুপাত দেখাও" : "Show my spending ratio this week",
      reply: language === 'bn' 
        ? "আপনার হিসাব অনুযায়ী এই সপ্তাহে মোট খরচ ৳৫,৪২০। খাদ্য ও ডাইনিং ৪২% (৳২,২৭৬), যাতায়াত ১৮% (৳৯৭৫), এবং বিনোদন ৪০% (৳২,১৬৯)। আপনি আপনার সাপ্তাহিক বাজেটের চেয়ে ৳৫৮০ কম খরচ করেছেন!"
        : "Based on your records, you spent ৳5,420 this week. Food & Dining is 42% at ৳2,276, Transport is 18% at ৳975, and Entertainment is 40% at ৳2,169. You're ৳580 under your weekly budget!",
      visual: (
        <div className="mt-2.5 p-3.5 bg-white border border-teal-100 rounded-xl space-y-2 max-w-xs shadow-sm">
          <div className="text-[10px] font-bold text-[#0da594]">{language === 'bn' ? 'সাপ্তাহিক খরচের বিবরণ' : 'Weekly Spent Distribution'}</div>
          <div className="space-y-2 text-[10px]">
            {[
              { label: language === 'bn' ? 'খাদ্য ও ডাইনিং' : 'Food & Dining', pct: 42, val: formatCurrency(2276), color: 'bg-emerald-500' },
              { label: language === 'bn' ? 'যাতায়াত' : 'Transport', pct: 18, val: formatCurrency(975), color: 'bg-teal-500' },
              { label: language === 'bn' ? 'বিনোদন' : 'Entertainment', pct: 40, val: formatCurrency(2169), color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-slate-500 mb-0.5">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-700">{toBanglaNumeral(item.pct)}% ({item.val})</span>
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
      prompt: language === 'bn' ? "আমার রসিদ স্ক্যান করো" : "Scan my Starbucks receipt",
      reply: language === 'bn' 
        ? "ওসিআর স্ক্যান সম্পন্ন হয়েছে! আপনার রসিদ থেকে ২টি আইটেম বের করে ফরমটি পূরণ করা হয়েছে:"
        : "OCR Scan complete! I extracted 2 items from your receipt and pre-filled the transaction form:",
      visual: (
        <div className="mt-2.5 p-3 bg-white border border-teal-100 rounded-xl text-[10px] space-y-1.5 max-w-xs shadow-sm">
          <div className="flex justify-between font-bold text-[#0da594] border-b border-slate-100 pb-1 mb-1">
            <span>Starbucks Coffee</span><span>2026-08-02</span>
          </div>
          <div className="flex justify-between text-slate-500"><span>1x Caramel Macchiato</span><span className="font-semibold text-slate-700">{formatCurrency(420)}</span></div>
          <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-1 mb-1"><span>1x Chocolate Croissant</span><span className="font-semibold text-slate-700">{formatCurrency(180)}</span></div>
          <div className="flex justify-between font-bold text-slate-800 pt-0.5"><span>{language === 'bn' ? 'মোট' : 'Total'}</span><span className="text-[#0da594]">{formatCurrency(600)}</span></div>
        </div>
      )
    },
    {
      prompt: language === 'bn' ? "আমি কি আগামী মাসে নতুন ট্যাবলেট কিনতে পারব?" : "Can I afford a new tablet next month?",
      reply: language === 'bn'
        ? "চমৎকার প্রশ্ন! প্রতি মাসে আপনার উদ্বৃত্ত ৳১৫,০০০ (আয় ৳৪৫,০০০ মাইনাস খরচ ৳৩০,০০০)। একটি ৳২৫,০০০ ট্যাবলেটের জন্য ১.৬ মাসের সঞ্চয় প্রয়োজন। আপনার ৳৫০,০০০ সঞ্চয় লক্ষ্য ঠিক রেখে আগামী দুই মাসে ৳৫,০০০ করে বরাদ্দ করার পরামর্শ দেব।"
        : "Great question! With a monthly surplus of ৳15,000 (income ৳45,000 minus expenses ৳30,000), a ৳25,000 tablet would take 1.6 months of savings. I'd suggest allocating ৳5,000 over two months to stay on track with your ৳50,000 savings goal.",
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
          { id: 1, name: language === 'bn' ? "মাসিক প্রিমিয়াম" : "Monthly Premium", price: "150.00", currency: "BDT", duration_months: 1, description: language === 'bn' ? "সব এআই ফিচার, ওসিআর স্ক্যানিং এবং পিডিএফ রিপোর্টে সম্পূর্ণ অ্যাক্সেস।" : "Full access to all AI features, OCR scanning, and PDF reports, billed monthly." },
          { id: 2, name: language === 'bn' ? "বার্ষিক প্রিমিয়াম" : "Annual Premium", price: "1500.00", currency: "BDT", duration_months: 12, description: language === 'bn' ? "১৬% ছাড়! পুরো এক বছরের জন্য সম্পূর্ণ এআই প্যাকেজ।" : "Save 16%! Full access to the complete AI wealth package for an entire year." }
        ]);
      } finally {
        setPlansLoading(false);
      }
    }
    loadPlans();
  }, [language]);

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
      subtitle: t('landing.slide1_sub', 'WELCOME! START MANAGING YOUR WEALTH TODAY'),
      title: t('landing.slide1_title', 'Big Opportunity For Your Business Growth'),
      desc: t('landing.slide1_desc', 'Take control of your budgets, analyze structural costing, and make smarter decisions with our AI-powered wealth and analytics platform.')
    },
    {
      image: '/hero_girl_thinking.png',
      subtitle: t('landing.slide2_sub', 'INTELLIGENT FINANCIAL COGNITION'),
      title: t('landing.slide2_title', 'Analytical Thinking For Smart Savings'),
      desc: t('landing.slide2_desc', 'Speak naturally to Aura AI to get real-time expense category classification, sandboxed insights, and customized targets.')
    },
    {
      image: '/landing_hero_mock.png',
      subtitle: t('landing.slide3_sub', 'SECURE & SECURED SANDBOX'),
      title: t('landing.slide3_title', 'Advanced Tracking, Simplified Reporting'),
      desc: t('landing.slide3_desc', 'Isolated SQL environment, receipt extraction via OCR, and clean formatted PDF summaries ready to print.')
    }
  ];

  const features = [
    { 
      icon: <Mic className="h-5 w-5" />, 
      title: language === 'bn' ? 'ক্লিয়ার ভয়েস অ্যাসিস্ট্যান্ট' : 'Clear Voice Assistant', 
      desc: language === 'bn' ? 'ঔরা এআই-এর সাথে সরাসরি কথা বলুন। উচ্চ মানের প্রাকৃতিক কণ্ঠস্বর ও নির্ভুল বাংলা স্পিচ রিকগনিশন।' : 'Talk directly with Aura. Natural speech recognition with high-quality voice synthesis.', 
      color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', border: 'border-teal-100' 
    },
    { 
      icon: <ScanLine className="h-5 w-5" />, 
      title: language === 'bn' ? 'ওসিআর রসিদ স্ক্যানার' : 'OCR Receipt Scanner', 
      desc: language === 'bn' ? 'রসিদের ছবি আপলোড করুন। মুহূর্তেই রসিদ থেকে কেনাকাটার আইটেম, মোট দাম ও বিবরণ স্বয়ংক্রিয়ভাবে এক্সট্র্যাক্ট হবে।' : 'Upload receipt images. Aura instantly extracts items, totals, and descriptions automatically.', 
      color: 'from-teal-400 to-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' 
    },
    { 
      icon: <ShieldCheck className="h-5 w-5" />, 
      title: language === 'bn' ? 'নিরাপদ অ্যাকাউন্ট স্যান্ডবক্স' : 'Safe SQL Sandbox', 
      desc: language === 'bn' ? 'সম্পূর্ণ নিরাপদ প্রযুক্তি। আপনার সমস্ত তথ্য এনক্রিপ্টেড এবং সুরক্ষিত ডেটাবেসে সংরক্ষিত থাকে।' : 'Security first. All queries run in a read-only sandboxed environment limited to your profile.', 
      color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', border: 'border-emerald-100' 
    },
    { 
      icon: <FileText className="h-5 w-5" />, 
      title: language === 'bn' ? 'বিস্তারিত পিডিএফ রিপোর্ট' : 'Detailed PDF Reports', 
      desc: language === 'bn' ? 'মাসিক খরচের সামারি, ক্যাটাগরি চার্ট এবং বাজেটের বিবরণ দিয়ে প্রিন্টযোগ্য সুন্দর পিডিএফ রিপোর্ট তৈরি করুন।' : 'Export monthly summaries, category charts, and budget reviews to clean print-ready PDFs.', 
      color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100' 
    },
  ];

  const testimonials = [
    {
      quote: language === 'bn' 
        ? "ঔরা এআই ব্যবহারের পর আমাদের খরচের সঠিক হিসেব ও সঞ্চয়ের সেরা উপায় খুঁজে পেয়েছি। এতে কাজের গতি অনেক বৃদ্ধি পেয়েছে এবং বাজেটিং অনেক সহজ হয়েছে।" 
        : "The business consultation team helped us identify hidden opportunities we'd been overlooking for years. Their insights streamlined our workflow and raised our client satisfaction by 45%.",
      name: "রবার্ট ক্রোল",
      role: language === 'bn' ? "পরিচালক, নেক্সোরা কনসাল্টিং" : "Director, Nexora Consulting",
      avatar: "/user_avatar_1.png"
    },
    {
      quote: language === 'bn' 
        ? "এআই পরামর্শক ও ভয়েস অ্যাসিস্ট্যান্টের সাহায্য নেওয়া আমাদের জন্য সেরা সিদ্ধান্ত ছিল। এখন প্রতিটি খরচের সিদ্ধান্ত তথ্যের ভিত্তিতে নেওয়া সহজ হয়।" 
        : "Working with their consultants has been a game changer. We now make decisions backed by data and strategy, not guesswork. Our revenue curve has gone up remarkably.",
      name: "জন কার্চার",
      role: language === 'bn' ? "পরিচালক, স্ট্রাইভন গ্রুপ" : "Director, Strivon Group",
      avatar: "/user_avatar_2.png"
    },
    {
      quote: language === 'bn' 
        ? "সহজে এক্সেল শীট আপলোড ও পিডিএফ রিপোর্ট তৈরির ফিচার চমৎকার! আমাদের ব্যবসার খরচ নিয়ন্ত্রণ এবং ভবিষ্যত পরিকল্পনার জন্য এটি অত্যন্ত কার্যকর।" 
        : "Their tailored growth plan gave our startup the clarity and direction we needed. From restructuring operations to building stronger funnels, everything runs with purpose.",
      name: "হ্যারল্ড জনসন",
      role: language === 'bn' ? "পরিচালক, ভেনচুরিয়া পার্টনার্স" : "Director, Venturea Partners",
      avatar: "/user_avatar_3.png"
    }
  ];

  const blogs = [
    {
      image: '/blog_data_decisions.png',
      date: language === 'bn' ? '১৯ অক্টোবর, ২০২৫' : '19 Oct, 2025',
      author: language === 'bn' ? 'জন ডো' : 'John Doe',
      title: language === 'bn' ? 'কীভাবে ডেটা-চালিত সিদ্ধান্ত ব্যবসার উন্নতি ত্বরান্বিত করে' : 'How Data Driven Decisions Transform Business Growth'
    },
    {
      image: '/blog_leadership.png',
      date: language === 'bn' ? '১৯ অক্টোবর, ২০২৫' : '19 Oct, 2025',
      author: language === 'bn' ? 'জন ডো' : 'John Doe',
      title: language === 'bn' ? 'উচ্চ পারফর্মিং টিম গঠনের ৭টি কার্যকর অভ্যাস' : '7 Leadership Habits That Inspire High Performing Teams'
    },
    {
      image: '/blog_scalable_model.png',
      date: language === 'bn' ? '১৯ অক্টোবর, ২০২৫' : '19 Oct, 2025',
      author: language === 'bn' ? 'জন ডো' : 'John Doe',
      title: language === 'bn' ? 'একটি দীর্ঘমেয়াদী সফল বিজনেস মডেল তৈরির নির্দেশিকা' : 'The Ultimate Guide to Building a Scalable Business Model'
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
              <span className="font-bold text-white">{t('landing.welcomeBack', 'Welcome back! 👋')}</span>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/login')} className="hover:text-[#0da594] transition-colors cursor-pointer">{t('landing.login', 'Log In')}</button>
                <span className="text-white/30">|</span>
                <button onClick={() => router.push('/register')} className="font-bold text-white hover:text-[#0da594] transition-colors cursor-pointer">{t('landing.register', 'Sign Up Free →')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-[#052322] border-b border-teal-950/50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl bg-[#072e2c] text-slate-300 hover:text-white border border-teal-900/50 active:scale-95 transition-all cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5 text-[#0da594]" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <svg className="w-8 h-8 text-[#0da594]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="14" width="4" height="6" rx="1" fill="currentColor" />
                <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
                <rect x="17" y="3" width="4" height="17" rx="1" fill="currentColor" />
              </svg>
              <span className="font-extrabold text-2xl tracking-tight text-white">Aura AI</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold text-white/90">
            <a href="#" className="hover:text-[#0da594] transition-colors">{t('landing.navHome', 'Home')}</a>
            <a href="#about" className="hover:text-[#0da594] transition-colors">{t('landing.navAbout', 'About Us')}</a>
            <a href="#demo" className="hover:text-[#0da594] transition-colors">{t('landing.navServices', 'Services')}</a>
            <a href="#video" className="hover:text-[#0da594] transition-colors">{t('landing.navPages', 'Pages')}</a>
            <a href="#blog" className="hover:text-[#0da594] transition-colors">{t('landing.navBlog', 'Blog')}</a>
            <a href="#pricing" className="hover:text-[#0da594] transition-colors">{t('landing.navContact', 'Contact')}</a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#0da594]" />
            ) : isAuthenticated ? (
              <button onClick={() => router.push('/dashboard')} className="hidden sm:inline-flex px-6 py-3 text-xs font-extrabold bg-[#0da594] text-white rounded-md hover:bg-[#087f73] transition-all cursor-pointer">
                {t('landing.goToDashboard', 'Go to Dashboard')}
              </button>
            ) : (
              <button onClick={() => router.push('/register')} className="hidden sm:inline-flex px-6 py-3 text-xs font-extrabold bg-[#0da594] text-white rounded-md hover:bg-[#087f73] transition-all cursor-pointer">
                {t('landing.getStarted', 'Get Started Free')}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Slide-Out Drawer Navigation */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="fixed top-[113px] left-0 right-0 z-50 bg-[#041a19] border-b border-teal-950/80 p-6 flex flex-col gap-4 shadow-2xl lg:hidden max-h-[calc(100vh-120px)] overflow-y-auto">
              <nav className="flex flex-col gap-3 font-semibold text-slate-200 text-sm border-b border-teal-950/60 pb-4">
                <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0da594] py-1.5 transition-colors">{t('landing.navHome', 'Home')}</a>
                <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0da594] py-1.5 transition-colors">{t('landing.navAbout', 'About Us')}</a>
                <a href="#demo" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0da594] py-1.5 transition-colors">{t('landing.navServices', 'Services')}</a>
                <a href="#video" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0da594] py-1.5 transition-colors">{t('landing.navPages', 'Pages')}</a>
                <a href="#blog" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0da594] py-1.5 transition-colors">{t('landing.navBlog', 'Blog')}</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0da594] py-1.5 transition-colors">{t('landing.navContact', 'Contact')}</a>
              </nav>
              <div className="flex flex-col gap-3 pt-2">
                {isAuthenticated ? (
                  <button onClick={() => { setIsMobileMenuOpen(false); router.push('/dashboard'); }} className="w-full py-3 text-center text-xs font-extrabold bg-[#0da594] text-white rounded-lg hover:bg-[#087f73] transition-all cursor-pointer">
                    {t('landing.goToDashboard', 'Go to Dashboard')}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setIsMobileMenuOpen(false); router.push('/login'); }} className="w-full py-3 text-center text-xs font-bold bg-[#072e2c] border border-teal-900/60 text-white rounded-lg hover:bg-[#0a3f3c] transition-all cursor-pointer">
                      {t('landing.login', 'Log In')}
                    </button>
                    <button onClick={() => { setIsMobileMenuOpen(false); router.push('/register'); }} className="w-full py-3 text-center text-xs font-extrabold bg-[#0da594] text-white rounded-lg hover:bg-[#087f73] transition-all cursor-pointer">
                      {t('landing.getStarted', 'Get Started Free')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
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
                {t('landing.getConsultancy', 'Get Consultancy')}
              </button>
              <a
                href="#about"
                className="px-8 py-4 font-extrabold text-xs bg-[#2f3e46]/60 border border-slate-600/50 text-white hover:bg-[#2f3e46]/90 hover:border-slate-500 transition-all text-center uppercase tracking-wider rounded-md"
              >
                {t('landing.contactUs', 'Contact Us')}
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

        {/* Slide Indicators on Right (Hidden on mobile, visible on desktop) */}
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all border cursor-pointer ${
                activeSlide === idx
                  ? 'bg-[#0da594] border-[#0da594] text-white scale-110 shadow-lg'
                  : 'bg-white border-slate-200 text-[#052322] hover:bg-slate-100'
              }`}
            >
              {toBanglaNumeral(`0${idx + 1}`)}
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
              {t('landing.aboutSub', 'ABOUT AMAZING COMPANY')}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322] leading-tight">
              {t('landing.aboutTitle', "We're Trusted Professional Consultancy Company")}
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
              {t('landing.aboutDesc', 'The business consultancy company stands as a stalwart beacon of guidance and innovation, offering a multifaceted array of services tailored to propel enterprises toward their zenith.')}
            </p>
            
            {/* Checklists */}
            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3 text-slate-700 text-xs md:text-sm font-semibold">
                <span className="h-5 w-5 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-[#0da594] stroke-[3]" />
                </span>
                <span>{t('landing.aboutCheck1', 'Remain flexible and adaptive to swiftly respond to changing market dynamics and client needs.')}</span>
              </li>
              <li className="flex items-start gap-3 text-slate-700 text-xs md:text-sm font-semibold">
                <span className="h-5 w-5 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-[#0da594] stroke-[3]" />
                </span>
                <span>{t('landing.aboutCheck2', 'Empower clients through knowledge transfer, skill-building, and fostering a culture of self-sufficiency.')}</span>
              </li>
            </ul>

            {/* Contact details & button */}
            <div className="flex flex-wrap items-center gap-8 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-[#0da594]">
                  <Phone className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('landing.callAnytime', 'Call Anytime')}</div>
                  <div className="text-base font-extrabold text-[#052322]">+525-3756-1523</div>
                </div>
              </div>

              <button
                onClick={() => router.push('/register')}
                className="px-6 py-4 font-extrabold text-xs bg-[#0da594] text-white hover:bg-[#087f73] transition-all rounded-md cursor-pointer uppercase tracking-wider"
              >
                {t('landing.makeAppointment', 'Make An Appointment')}
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
                <span>{t('landing.demoBadge', 'Live Interaction Preview')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322]">{t('landing.demoTitle', 'Try Aura in Action')}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t('landing.demoSub', 'Click a sample prompt to see how Aura interprets questions, analyzes expense data, and responds with structured financial insights.')}
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
                      <span className="text-xs font-semibold text-slate-500">{t('landing.demoSelectPrompt', 'Select a sample prompt to start')}</span>
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
                    <div className="flex items-center gap-2 text-[#0da594]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0da594]" />
                      <span className="text-xs">{t('landing.demoAnalyzing', 'Aura is analyzing...')}</span>
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
              {t('landing.videoBadge', 'WATCH COMPANY VIDEO')}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322] max-w-xl mx-auto leading-tight">
              {t('landing.videoTitle', 'This is your all-in-one financial and wealth platform')}
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
                {t('landing.watchVideo', 'Watch Video')}
              </div>
            </div>

            {/* Play Button Box */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={() => alert(t('landing.watchVideo', 'Watch Our Video'))}
                className="flex items-center gap-3.5 px-6 py-3.5 bg-[#0da594] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-teal-500/30 hover:scale-105 transition-all cursor-pointer z-10"
              >
                <span>{t('landing.watchVideo', 'Watch Our Video')}</span>
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
              {t('landing.testimonialsBadge', 'TESTIMONIALS')}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {t('landing.testimonialsTitle', 'What Our Users Said About Aura')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((tItem, i) => (
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
                    "{tItem.quote}"
                  </p>
                </div>

                {/* Profile info */}
                <div className="flex items-center gap-4 pt-6 mt-6 border-t border-teal-900/50">
                  <img
                    src={tItem.avatar}
                    alt={tItem.name}
                    className="h-10 w-10 rounded-full object-cover border border-[#0da594]/30"
                  />
                  <div>
                    <div className="text-xs font-black tracking-wide text-white">{tItem.name}</div>
                    <div className="text-[10px] text-[#0da594] font-bold mt-0.5">{tItem.role}</div>
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
              <span>{t('landing.pricingBadge', 'Pricing & Subscriptions')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold">{t('landing.pricingTitle', 'Choose Your Plan')}</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
              {t('landing.pricingSub', 'Upgrade to unlock continuous real-time voice consultations and cloud OCR processing.')}
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
                        ⭐ {t('landing.bestValue', 'Best Value')}
                      </div>
                    )}
                    
                    <div className="space-y-5">
                      <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-white">{formatCurrency(plan.price)}</span>
                        <span className="text-xs text-white/50 font-semibold">/ {isYearly ? t('landing.year', 'year') : t('landing.month', 'month')}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{plan.description}</p>
                      
                      <div className="h-px bg-white/10 my-4"></div>
                      
                      <ul className="space-y-3 text-xs text-white/70">
                        {[
                          language === 'bn' ? 'সংভাষণমূলক এআই ভয়েস সহকারী' : 'Conversational Voice Assistant',
                          language === 'bn' ? 'ওসিআর রসিদ অটো স্ক্যানিং' : 'OCR Receipt Scanning',
                          language === 'bn' ? 'সম্পূর্ণ সুরক্ষিত নিরাপদ অ্যাকাউন্ট' : 'Safe SQL Account Isolation',
                          language === 'bn' ? 'আনলিমিটেড বাজেট ও সঞ্চয় লক্ষ্য' : 'Unlimited Budgets & Goals',
                          language === 'bn' ? 'স্বয়ংক্রিয় ব্যাকগ্রাউন্ড পিডিএফ রিপোর্ট' : 'Celery Background PDF Reports'
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
                      {isYearly ? t('landing.getBestValue', 'Get Best Value') : t('landing.subscribeNow', 'Subscribe Now')}
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
              {t('landing.blogBadge', 'RECENT POSTS')}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#052322]">
              {t('landing.blogTitle', 'Latest News & Updates')}
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
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#0da594]" />{language === 'bn' ? `লেখক: ${b.author}` : `By ${b.author}`}</span>
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
                    {t('landing.readMore', 'Read More')} <span className="text-xs font-sans">&gt;&gt;</span>
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
              <span className="font-extrabold text-xl tracking-tight text-white">{language === 'bn' ? 'ঔরা এআই' : 'Aura AI'}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[12px]">
              {t('landing.footerDesc', 'AI-powered wealth management and financial intelligence consulting. Insights, budgets, and automated reporting.')}
            </p>
            <div className="space-y-2 text-slate-400 text-[12px] pt-2">
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#0da594] shrink-0" /><span>{language === 'bn' ? '১৩তম স্ট্রিট, ৪৭ পশ্চিম ১৩তম স্ট্রিট, নিউ ইয়র্ক, ইউএসএ' : '13th Street, 47 W 13th St, New York, USA'}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#0da594] shrink-0" /><span>+1 (646) 364-8790</span></div>
            </div>
          </div>

          {/* Useful Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-white tracking-wide uppercase">{t('landing.usefulLinks', 'Useful Links')}</h4>
            <ul className="space-y-2.5 text-slate-400 text-[12px]">
              {[
                [t('landing.navHome', 'Home'), '#'], 
                [t('landing.navAbout', 'About Us'), '#about'], 
                [t('landing.navServices', 'Services'), '#demo'], 
                [t('landing.navContact', 'Pricing Plans'), '#pricing']
              ].map(([name, href]) => (
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
            <h4 className="font-bold text-[13px] text-white tracking-wide uppercase">{t('landing.resources', 'Resources')}</h4>
            <ul className="space-y-2.5 text-slate-400 text-[12px]">
              {[
                [t('nav.dashboard', 'Dashboard'), '/dashboard'], 
                [language === 'bn' ? 'প্রাইভেসি পলিসি' : 'Privacy Policy', '#'], 
                [language === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions', '#'], 
                [language === 'bn' ? 'কুকি পলিসি' : 'Cookie Policy', '#']
              ].map(([name, href]) => (
                <li key={name}>
                  <a href={href} className="hover:text-[#0da594] transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 rounded-full bg-[#0da594]"></span>{name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Stay Updated / Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-[13px] text-white tracking-wide uppercase">{t('landing.stayUpdated', 'Stay Updated')}</h4>
            <p className="text-slate-400 leading-relaxed text-[12px]">{t('landing.footerDesc', 'Get real-time insights and newsletter updates.')}</p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0da594] transition-all"
              />
              <button type="submit" className="w-full py-3 rounded-md font-bold text-xs uppercase tracking-wider bg-[#0da594] text-white hover:bg-[#087f73] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer">
                <Mail className="h-3.5 w-3.5" />{t('landing.subscribe', 'Subscribe')}
              </button>
              {newsletterStatus === 'success' && <p className="text-[10px] text-emerald-400 font-semibold">✓ {t('landing.subscribed', 'You\'re subscribed!')}</p>}
              {newsletterStatus === 'error' && <p className="text-[10px] text-rose-400 font-semibold">Please enter a valid email.</p>}
            </form>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-teal-950/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[11px]">© 2026 Aura AI. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>{t('landing.builtFor', 'Built for smart cost tracking & wealth decisions')}</span>
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
