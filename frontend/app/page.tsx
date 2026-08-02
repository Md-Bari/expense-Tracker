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
  User, 
  Loader2,
  Lock,
  Wallet
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Simulated Chat Demo State
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number | null>(null);
  const [isTypingDemo, setIsTypingDemo] = useState(false);
  const [demoChatHistory, setDemoChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string; visual?: React.ReactNode }>>([]);

  const DEMO_PROMPTS = [
    {
      prompt: "Show my spending ratio this week",
      reply: "Based on your transaction records, your total spending this week is ৳5,420. Here is your spending ratio by category: Food & Dining makes up 42% (৳2,276), Transport accounts for 18% (৳975), and Entertainment takes up 40% (৳2,169). You are currently ৳580 under your weekly budget limit.",
      visual: (
        <div className="mt-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 max-w-xs">
          <div className="text-[10px] font-semibold text-indigo-400">Weekly Spent Distribution</div>
          <div className="space-y-1.5 text-[10px]">
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Food & Dining</span>
                <span className="font-semibold text-white">42% (৳2,276)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Transport</span>
                <span className="font-semibold text-white">18% (৳975)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-400 mb-0.5">
                <span>Entertainment</span>
                <span className="font-semibold text-white">40% (৳2,169)</span>
              </div>
              <div className="h-1.5 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      prompt: "Scan my Starbucks receipt",
      reply: "OCR Scan completed successfully! I analyzed the text on your receipt image and extracted 2 items. I have pre-filled the transaction form for you:",
      visual: (
        <div className="mt-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] space-y-1.5 max-w-xs">
          <div className="flex justify-between font-semibold text-indigo-400 border-b border-slate-850 pb-1 mb-1">
            <span>Starbucks Coffee</span>
            <span>2026-08-02</span>
          </div>
          <div className="flex justify-between text-slate-350">
            <span>1x Caramel Macchiato</span>
            <span className="text-white font-medium">৳420.00</span>
          </div>
          <div className="flex justify-between text-slate-350 border-b border-slate-850 pb-1 mb-1">
            <span>1x Chocolate Croissant</span>
            <span className="text-white font-medium">৳180.00</span>
          </div>
          <div className="flex justify-between font-bold text-white pt-0.5">
            <span>Total Amount</span>
            <span className="text-indigo-400">৳600.00</span>
          </div>
        </div>
      )
    },
    {
      prompt: "Can I afford a new tablet next month?",
      reply: "Let's analyze your savings. Based on your current monthly surplus (average income of ৳45,000 and expenses of ৳30,000), you surplus ৳15,000 per month. If you purchase the tablet for ৳25,000, you will consume 1.6 months of savings. Since you have a current savings goal of ৳50,000 by January, I recommend allocating ৳5,000 from this month and next month's surplus to acquire it safely without delaying your goal.",
      visual: null
    }
  ];

  // Fetch plans
  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await api.get('/subscriptions/plans/');
        setPlans(response.data);
      } catch (err) {
        console.error("Failed to load plans from backend. Using fallbacks.", err);
        // Standard Fallbacks
        setPlans([
          {
            id: 1,
            name: "Monthly Premium",
            price: "150.00",
            currency: "BDT",
            duration_months: 1,
            description: "Full access to all AI features, OCR scanning, and PDF reports, billed monthly."
          },
          {
            id: 2,
            name: "Annual Premium",
            price: "1500.00",
            currency: "BDT",
            duration_months: 12,
            description: "Save 16%! Full access to the complete AI wealth package for an entire year."
          }
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

    // Set User message
    const userMsg = { role: 'user' as const, content: DEMO_PROMPTS[index].prompt };
    setDemoChatHistory([userMsg]);

    setTimeout(() => {
      // Set AI typing reply
      const aiReply = { 
        role: 'assistant' as const, 
        content: DEMO_PROMPTS[index].reply,
        visual: DEMO_PROMPTS[index].visual
      };
      setDemoChatHistory((prev) => [...prev, aiReply]);
      setIsTypingDemo(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none z-0"></div>
      
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/70 border-b border-slate-900/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Aura</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing Offers</a>
          </nav>

          <div className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : isAuthenticated ? (
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => router.push('/login')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button 
                  onClick={() => router.push('/register')}
                  className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-900/60 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase mx-auto lg:mx-0">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Wealth Assistant Active</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
            Take Control of Your Wealth with <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Aura</span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
            Aura is a personal financial companion. Manage budgets, track goals, automatically scan bills via OCR, and converse naturally in English with clear speech outputs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={() => router.push('/register')}
              className="px-6 py-3 font-bold text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a 
              href="#demo"
              className="px-6 py-3 font-bold text-xs bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Try Interactive Demo
            </a>
          </div>

          {/* Key Value Badges */}
          <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-900/80 max-w-md mx-auto lg:mx-0">
            <div>
              <div className="text-lg font-bold text-white">৳0</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Free Start</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">100%</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Safe SQL</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">Instant</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">OCR Parsing</div>
            </div>
          </div>
        </div>

        {/* Hero Graphics */}
        <div className="lg:col-span-6 relative">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-2xl z-0 transform translate-x-4 translate-y-4"></div>
          <div className="relative border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur shadow-2xl z-10">
            <img 
              src="/landing_hero_mock.png" 
              alt="Aura Wealth Analytics Dashboard View" 
              className="w-full object-cover aspect-[4/3] opacity-95 hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 z-10">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Designed for Financial Clarity</h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            Packed with advanced tooling, Aura simplifies complex financial statistics into simple conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Feature 1 */}
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 rounded-2xl space-y-4 transition-all hover:bg-slate-900/50 hover:-translate-y-1">
            <div className="h-10 w-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Clear Voice Assistant</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Talk directly with Aura. Processes speech recognition and synthesizes clear, high-quality audio streams.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 rounded-2xl space-y-4 transition-all hover:bg-slate-900/50 hover:-translate-y-1">
            <div className="h-10 w-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <ScanLine className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">OCR Smart Receipt Scanner</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Upload images of your receipts. Aura instantly scans and populates the items, totals, and descriptions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 rounded-2xl space-y-4 transition-all hover:bg-slate-900/50 hover:-translate-y-1">
            <div className="h-10 w-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Safe SQL Sandbox</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Security by design. Aura operates inside a read-only sandboxed database connection limited to your profile.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 rounded-2xl space-y-4 transition-all hover:bg-slate-900/50 hover:-translate-y-1">
            <div className="h-10 w-10 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Detailed PDF Reports</h3>
            <p className="text-xs text-slate-450 leading-relaxed">
              Export monthly financial reports, category distribution charts, and budget reviews cleanly to print-ready PDFs.
            </p>
          </div>

        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Try Aura in Action</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Select one of the sample prompt chips below to see how Aura interprets queries and responds with natural summaries, structured cards, and visual charts.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              {DEMO_PROMPTS.map((promptData, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDemoClick(idx)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    selectedDemoIndex === idx 
                      ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md' 
                      : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <span>"{promptData.prompt}"</span>
                  <ArrowRight className="h-4 w-4 text-indigo-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-slate-850 rounded-2xl bg-slate-900/40 backdrop-blur p-4 h-[350px] flex flex-col justify-between shadow-xl">
              
              {/* Demo Terminal Header */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">Aura Interactive Terminal Demo</span>
                </div>
                <div className="h-5 px-2 rounded bg-slate-950 border border-slate-850 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Guest Preview</span>
                </div>
              </div>

              {/* Chat Demo Body */}
              <div className="flex-1 overflow-y-auto space-y-4 px-1 text-[11px]">
                {demoChatHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Bot className="h-8 w-8 text-slate-700 animate-pulse" />
                    <span>Select a sample query prompt on the left to start.</span>
                  </div>
                ) : (
                  demoChatHistory.map((msg, i) => {
                    const isBot = msg.role === 'assistant';
                    return (
                      <div key={i} className={`flex items-start gap-2.5 ${isBot ? '' : 'justify-end'}`}>
                        {isBot && (
                          <div className="h-6 w-6 rounded bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shadow shrink-0">
                            A
                          </div>
                        )}
                        <div className="max-w-[80%]">
                          <div className={`p-3 rounded-xl leading-relaxed ${
                            isBot 
                              ? 'bg-slate-950/60 border border-slate-850 text-slate-350' 
                              : 'bg-indigo-600 text-white font-medium shadow-md'
                          }`}>
                            {msg.content}
                          </div>
                          {isBot && msg.visual && (
                            <div className="mt-1">{msg.visual}</div>
                          )}
                        </div>
                        {!isBot && (
                          <div className="h-6 w-6 rounded bg-slate-850 border border-slate-750 flex items-center justify-center text-slate-300 text-[10px] font-bold shrink-0 uppercase">
                            U
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {isTypingDemo && (
                  <div className="flex items-center gap-2 text-slate-500 italic">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Aura is analyzing...</span>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 z-10">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-900/40 text-violet-400 text-[10px] font-semibold tracking-wide uppercase">
            <Wallet className="h-3.5 w-3.5" />
            <span>Pricing & Subscriptions</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Choose Your Plan</h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            Start free or upgrade to support continuous development and cloud OCR receipt processing.
          </p>
        </div>

        {plansLoading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isYearly = plan.duration_months === 12;
              return (
                <div 
                  key={plan.id} 
                  className={`relative p-8 rounded-3xl border flex flex-col justify-between transition-all ${
                    isYearly 
                      ? 'bg-gradient-to-b from-indigo-950/20 to-slate-900/20 border-indigo-500 shadow-xl shadow-indigo-500/5' 
                      : 'bg-slate-900/20 border-slate-850'
                  }`}
                >
                  {isYearly && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Best Value
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">৳{parseInt(plan.price as string).toLocaleString()}</span>
                      <span className="text-xs text-slate-500 font-semibold">
                        / {isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-450 leading-relaxed min-h-[36px]">{plan.description}</p>
                    
                    <div className="h-px bg-slate-900 my-6"></div>

                    <ul className="space-y-3 text-xs text-slate-350">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Conversational Voice Assistant</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>OCR Receipt Scanning</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Safe SQL Account Isolation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Unlimited Budgets & Goals</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Celery-Worker Background PDF Reports</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => router.push('/register')}
                    className={`mt-8 w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isYearly 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800'
                    }`}
                  >
                    Subscribe Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/40 py-10 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <div className="flex justify-center gap-6 text-slate-500 font-semibold mb-2">
            <a href="#features" className="hover:text-slate-400 transition-colors">Features</a>
            <a href="#demo" className="hover:text-slate-400 transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-slate-400 transition-colors">Pricing</a>
          </div>
          <div>© {new Date().getFullYear()} Aura Wealth Management. All rights reserved. Built with Next.js & Django.</div>
        </div>
      </footer>

    </div>
  );
}
