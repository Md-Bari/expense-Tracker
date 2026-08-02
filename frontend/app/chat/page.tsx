'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { Send, Bot, User, RefreshCw, BarChart3, PieChart as PieIcon, LineChart, Mic } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  data?: any;
}

function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let clean = text;

  // 1. Remove markdown links: [label](url) -> label
  clean = clean.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // 2. Remove markdown formatting markers (*, _, `, #)
  clean = clean.replace(/[\*\`\#\_]/g, '');

  // 3. Clean up list bullets/numbers at the start of lines
  clean = clean.split('\n')
    .map(line => {
      let trimmed = line.trim();
      trimmed = trimmed.replace(/^[\-\*\+]\s+/, '');
      trimmed = trimmed.replace(/^\d+\.\s+/, '');
      return trimmed;
    })
    .filter(line => line.length > 0)
    .join('. '); // Join lines with a period to enforce natural pauses between sentences/lists

  // 4. Replace currency symbols with spoken words
  clean = clean.replace(/৳/g, ' Taka ');
  clean = clean.replace(/\$/g, ' dollars ');
  clean = clean.replace(/€/g, ' euros ');
  clean = clean.replace(/£/g, ' pounds ');

  // 5. Replace slashes between words with " or " to avoid TTS reading "slash"
  clean = clean.replace(/(\w+)\/(\w+)/g, '$1 or $2');
  clean = clean.replace(/\s*\/\s*/g, ' or ');

  // 6. Clean up trailing ".0" in numbers (e.g. "100.0" -> "100")
  clean = clean.replace(/(\d+)\.0\b/g, '$1');

  // 7. Remove literal "undefined" or "null" leaked from code
  clean = clean.replace(/\bundefined\b/gi, '');
  clean = clean.replace(/\bnull\b/gi, '');

  // 8. Remove table separators, pipes, equals
  clean = clean.replace(/\|/g, ' ');
  clean = clean.replace(/[\=\-]{3,}/g, ' ');

  // 9. General cleanup of multiple spaces/periods
  clean = clean.replace(/\.{2,}/g, '.');
  clean = clean.replace(/\s+/g, ' ');

  return clean.trim();
}

function MessageContent({ text }: { text: string }) {
  const parseMarkdown = (line: string) => {
    let parsed = line;
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1 rounded text-pink-400 font-mono">$1</code>');
    return parsed;
  };

  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const listContent = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <li
              key={i}
              className="list-disc ml-4 text-xs leading-relaxed text-slate-300"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(listContent) }}
            />
          );
        }
        return (
          <p
            key={i}
            className="text-xs leading-relaxed text-slate-200 min-h-[16px]"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(line) }}
          />
        );
      })}
    </div>
  );
}

const SAMPLE_PROMPTS = [
  "What did I spend this week?",
  "Compare this month vs last month",
  "What is my forecasted spending next month?",
  "Generate a PDF report for this month"
];

export default function AIChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am Aura, your personal AI financial advisor. Ask me anything about your finances or choose one of the sample queries below to get started:",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Assistant states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesRef = useRef<Message[]>(messages);
  const isVoiceActiveRef = useRef<boolean>(isVoiceActive);
  const currentStatusRef = useRef<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const currentReplyRef = useRef<string>('');

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  const updateVoiceStatus = (status: 'idle' | 'listening' | 'thinking' | 'speaking') => {
    setVoiceStatus(status);
    currentStatusRef.current = status;
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
        audioRef.current = null;
      }
    };
  }, []);

  // Configure Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          updateVoiceStatus('listening');
        };

        rec.onresult = async (event: any) => {
          if (currentStatusRef.current !== 'listening' && currentStatusRef.current !== 'speaking') return;

          const lastIndex = event.results.length - 1;
          const text = event.results[lastIndex][0].transcript.trim();
          if (!text) return;

          const textLower = text.toLowerCase();

          // Stop commands
          const stopWords = ['stop', 'stop talking', 'be quiet', 'shut up', 'pause'];
          if (stopWords.some(word => textLower === word || textLower.startsWith(word))) {
            interruptSpeaking();
            return;
          }

          // Echo cancellation
          if (currentStatusRef.current === 'speaking') {
            const aiText = currentReplyRef.current.toLowerCase();
            if (aiText.includes(textLower) || textLower.includes(aiText) || textLower.length < 4) {
              return;
            }
          }

          // Strip any leading AI self-echo that got recorded at the beginning of the transcription
          let cleanQuery = text;
          const lastAiReply = currentReplyRef.current;
          if (lastAiReply) {
            const normalizedText = text.toLowerCase();
            const normalizedAi = lastAiReply.toLowerCase().replace(/[\*\`\#\_]/g, '').replace(/[\r\n]+/g, ' ').trim();
            
            if (normalizedText.startsWith(normalizedAi)) {
              cleanQuery = text.substring(lastAiReply.length).trim();
            } else {
              const words = normalizedAi.split(/\s+/).filter(w => w.length > 2);
              if (words.length > 3) {
                const searchStr = words.slice(0, 4).join(' ');
                const idx = normalizedText.indexOf(searchStr);
                if (idx >= 0 && idx < 30) {
                  const lastWord = words[words.length - 1];
                  const endIdx = normalizedText.indexOf(lastWord, idx);
                  if (endIdx >= 0) {
                    cleanQuery = text.substring(endIdx + lastWord.length).trim();
                  } else {
                    cleanQuery = text.substring(idx + searchStr.length).trim();
                  }
                }
              }
            }
          }

          cleanQuery = cleanQuery.replace(/^[^a-zA-Z0-9]+/, '').trim();
          if (!cleanQuery) {
            updateVoiceStatus('listening');
            return;
          }

          interruptSpeaking();
          updateVoiceStatus('thinking');

          const newUserMsg: Message = { role: 'user', content: `[Voice] ${cleanQuery}` };
          const updatedMessages = [...messagesRef.current, newUserMsg];
          setMessages(updatedMessages);

          try {
            const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
            const response = await api.post('/ai/chat/', {
              message: cleanQuery,
              history: history,
            });

            const reply = response.data.reply;
            setMessages((prev) => [
              ...prev,
              { 
                role: 'assistant', 
                content: reply, 
                intent: response.data.intent, 
                data: response.data.data 
              },
            ]);

            speak(reply);
          } catch (error) {
            updateVoiceStatus('idle');
            setIsVoiceActive(false);
          }
        };

        rec.onerror = () => {
          if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
            setTimeout(() => {
              if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
                try { rec.start(); } catch (err) {}
              }
            }, 300);
          }
        };

        rec.onend = () => {
          if (isVoiceActiveRef.current) {
            setTimeout(() => {
              if (isVoiceActiveRef.current) {
                try {
                  rec.start();
                } catch (e) {}
              }
            }, 300);
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const speak = async (text: string) => {
    if (typeof window === 'undefined') return;

    // Cache the spoken text to filter out self-recordings
    currentReplyRef.current = text;

    const cleanText = cleanTextForSpeech(text);
    
    if (!cleanText) {
      if (isVoiceActiveRef.current) {
        updateVoiceStatus('listening');
      } else {
        updateVoiceStatus('idle');
      }
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
      audioRef.current = null;
    }

    updateVoiceStatus('speaking');

    try {
      const response = await api.post('/ai/tts/', { text: cleanText }, { responseType: 'blob' });
      const blob = response.data;
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
        } else {
          updateVoiceStatus('idle');
        }
      };

      audio.onerror = () => {
        audioRef.current = null;
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
        } else {
          updateVoiceStatus('idle');
        }
      };

      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
        } else {
          updateVoiceStatus('idle');
        }
      });
    } catch (error) {
      console.error("TTS generation error:", error);
      if (isVoiceActiveRef.current) {
        updateVoiceStatus('listening');
      } else {
        updateVoiceStatus('idle');
      }
    }
  };

  const interruptSpeaking = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
      audioRef.current = null;
    }
    if (isVoiceActiveRef.current) {
      updateVoiceStatus('listening');
    } else {
      updateVoiceStatus('idle');
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition API is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isVoiceActive) {
      interruptSpeaking();
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsVoiceActive(false);
    } else {
      setIsVoiceActive(true);
      updateVoiceStatus('listening');
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsVoiceActive(false);
        updateVoiceStatus('idle');
      }
    }
  };

  // Redirect if guest
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPrompt = async (promptText: string) => {
    if (loading) return;

    const userMsg: Message = { role: 'user', content: promptText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.post('/ai/chat/', {
        message: promptText,
        history: history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.reply,
          intent: response.data.intent,
          data: response.data.data
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I encountered an error preparing my response. Please check back shortly." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Build conversation history format for backend
    const history = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await api.post('/ai/chat/', {
        message: userMessage,
        history: history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.reply,
          intent: response.data.intent,
          data: response.data.data,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting to my service right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render inline charts if tool data is present
  const renderInlineData = (msg: Message) => {
    if (!msg.data || typeof msg.data !== 'object') return null;

    const data = msg.data;
    
    // 1. Check if category aggregation data is present (Bar/Pie chart)
    if (Array.isArray(data) && data.length > 0 && data[0].category !== undefined && data[0].total !== undefined) {
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      return (
        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 max-w-sm md:max-w-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <PieIcon className="h-4 w-4" />
            <span>Category Spending Breakdown</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={3} dataKey="total" nameKey="category">
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {data.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
                  <span className="text-slate-400 truncate max-w-[80px]">{item.category}</span>
                </div>
                <span className="font-bold text-white">৳{item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2. Check if monthly trend aggregation data is present (Line/Area chart)
    if (Array.isArray(data) && data.length > 0 && data[0].month !== undefined && data[0].total !== undefined) {
      return (
        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 max-w-sm md:max-w-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <LineChart className="h-4 w-4" />
            <span>Monthly Cash Trend</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="total" name="Spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    // 3. Check if standard transactions list is returned
    if (Array.isArray(data) && data.length > 0 && data[0].amount !== undefined && data[0].date !== undefined) {
      return (
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto max-w-sm md:max-w-md">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-2">
            <BarChart3 className="h-4 w-4" />
            <span>Matching Transactions</span>
          </div>
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                <th className="pb-1.5 font-semibold">Date</th>
                <th className="pb-1.5 font-semibold">Category</th>
                <th className="pb-1.5 font-semibold">Description</th>
                <th className="pb-1.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {data.slice(0, 5).map((tx: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-1 text-slate-400">{tx.date}</td>
                  <td className="py-1">{tx.category}</td>
                  <td className="py-1 italic truncate max-w-[80px]">{tx.description}</td>
                  <td className={`py-1 text-right font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    ৳{tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 4. Check if month over month comparison object
    if (data.analytics_type === 'mom_comparison') {
      const comp = data.data;
      const isUp = comp.percentage_change > 0;
      return (
        <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 max-w-xs text-xs">
          <h4 className="font-bold text-white border-b border-slate-850 pb-1.5 mb-2">MoM Performance Summary</h4>
          <div className="flex justify-between">
            <span className="text-slate-400">This Month:</span>
            <span className="font-semibold text-white">৳{comp.this_month_spent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last Month:</span>
            <span className="font-semibold text-white">৳{comp.last_month_spent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-850">
            <span className="text-slate-400">Deviation:</span>
            <span className={`font-bold ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isUp ? '+' : ''}{comp.percentage_change}%
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="ml-64 flex-1 h-screen flex flex-col bg-slate-950 relative overflow-hidden">
        {/* Voice Mode Fullscreen Overlay */}
        {isVoiceActive && (
          <div 
            onClick={voiceStatus === 'speaking' ? interruptSpeaking : undefined}
            className={`absolute inset-0 bg-slate-950/98 flex flex-col items-center justify-center p-8 z-30 space-y-6 text-center ${
              voiceStatus === 'speaking' ? 'cursor-pointer hover:bg-slate-950/95 transition-all' : ''
            }`}
          >
            <div className="space-y-1 pointer-events-none">
              <h2 className="text-lg font-bold text-white tracking-wider uppercase">Voice Assistant</h2>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">{voiceStatus}</p>
            </div>

            {/* Animated pulsing elements */}
            <div className="relative flex items-center justify-center h-44 w-44 pointer-events-none">
              {voiceStatus === 'listening' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full bg-indigo-500/15 border border-indigo-500/25"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute h-28 w-28 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20"
                  >
                    <Mic className="h-10 w-10 animate-pulse" />
                  </motion.div>
                </>
              )}

              {voiceStatus === 'thinking' && (
                <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              )}

              {voiceStatus === 'speaking' && (
                <div className="flex items-center gap-2 h-14">
                  {[1, 2, 3, 4, 5, 6, 7].map((b) => (
                    <motion.div
                      key={b}
                      animate={{ height: [16, 56, 16] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: b * 0.08,
                      }}
                      className="w-2 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 max-w-sm leading-relaxed px-6 pointer-events-none">
              {voiceStatus === 'listening' && "Continuous mode. Speak a command or query..."}
              {voiceStatus === 'thinking' && "Structuring RAG context..."}
              {voiceStatus === 'speaking' && (
                <div className="space-y-1">
                  <p>Aura is speaking the answer...</p>
                  <p className="text-[10px] text-indigo-400 font-bold animate-pulse">Say "stop" or start speaking to interrupt</p>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVoice();
              }}
              className="px-6 py-3 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 rounded-2xl text-xs font-bold text-rose-400 transition-all cursor-pointer shadow-lg"
            >
              Close Session
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="p-6 border-b border-slate-900 flex items-center gap-3 bg-slate-900/10">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Financial AI Assistant</h1>
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online | Powered by Groq & LangGraph</span>
            </p>
          </div>
        </header>

        {/* Message bubble stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const isBot = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex gap-4 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="h-8 w-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="max-w-[80%]">
                    {/* Speech bubble */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isBot
                          ? 'bg-slate-900/60 border border-slate-850 text-slate-200'
                          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                      }`}
                    >
                      <MessageContent text={msg.content} />
                    </div>

                    {/* Suggestions list chips */}
                    {isBot && index === 0 && messages.length === 1 && (
                      <div className="mt-4 flex flex-wrap gap-2.5 max-w-lg">
                        {SAMPLE_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handleSelectPrompt(prompt)}
                            className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 text-[11px] font-semibold text-slate-350 hover:text-white transition-all duration-205 cursor-pointer shadow-md hover:-translate-y-0.5"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Dynamic inline interactive data visualization */}
                    {isBot && renderInlineData(msg)}
                  </div>

                  {!isBot && (
                    <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 font-bold border border-slate-700">
                      {user?.username?.substring(0, 1).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce delay-100"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input box form */}
        <footer className="p-6 border-t border-slate-900 bg-slate-900/10">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-3">
            {/* Voice Mode Button */}
            <button
              type="button"
              onClick={toggleVoice}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 hover:bg-slate-900 hover:text-white text-indigo-400 transition-all cursor-pointer shrink-0 shadow-sm"
              title="Voice Mode"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aura a financial query..."
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-850 rounded-2xl py-3.5 pl-5 pr-14 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-[0.95]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}
