'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';

import { motion } from 'framer-motion';
import { Send, Bot, User, RefreshCw, BarChart3, PieChart as PieIcon, LineChart, Mic } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';
import ThreeDVoiceOrb from '@/components/ThreeDVoiceOrb';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  data?: any;
}

function convertNumberToWords(numStr: string): string {
  const num = parseInt(numStr.replace(/,/g, ''), 10);
  if (isNaN(num)) return numStr;
  if (num === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 
                 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion'];

  let words = '';
  let numVal = num;
  let scaleIdx = 0;

  while (numVal > 0) {
    const chunk = numVal % 1000;
    if (chunk > 0) {
      let chunkWords = '';
      const hundreds = Math.floor(chunk / 100);
      const remainder = chunk % 100;
      if (hundreds > 0) {
        chunkWords += ones[hundreds] + ' hundred ';
      }
      if (remainder > 0) {
        if (remainder < 20) {
          chunkWords += ones[remainder];
        } else {
          chunkWords += tens[Math.floor(remainder / 10)] + (remainder % 10 > 0 ? ' ' + ones[remainder % 10] : '');
        }
      }
      words = chunkWords.trim() + ' ' + scales[scaleIdx] + ' ' + words;
    }
    numVal = Math.floor(numVal / 1000);
    scaleIdx++;
  }
  return words.trim();
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
    .join('. ');

  // 4. Replace currency symbols with spoken words
  clean = clean.replace(/৳/g, ' Taka ');
  clean = clean.replace(/\$/g, ' dollars ');
  clean = clean.replace(/€/g, ' euros ');
  clean = clean.replace(/£/g, ' pounds ');

  // 5. Replace slashes between words with " or "
  clean = clean.replace(/(\w+)\/(\w+)/g, '$1 or $2');
  clean = clean.replace(/\s*\/\s*/g, ' or ');

  // 6. Clean up trailing ".0" in numbers (e.g. "100.0" -> "100")
  clean = clean.replace(/(\d+)\.0\b/g, '$1');

  // Convert numeric digits to words to make it sound natural
  clean = clean.replace(/\b(\d+(,\d{3})*)(\.\d+)?\b/g, (match, g1, g2, g3) => {
    const intPart = convertNumberToWords(g1);
    if (g3) {
      const decDigits = g3.replace('.', '').split('');
      const decPart = decDigits.map((digit: string) => {
        const d = parseInt(digit, 10);
        return isNaN(d) ? '' : convertNumberToWords(digit);
      }).join(' ');
      return `${intPart} point ${decPart}`;
    }
    return intPart;
  });

  // 7. Remove literal "undefined" or "null" leaked from code
  clean = clean.replace(/\bundefined\b/gi, '');
  clean = clean.replace(/\bnull\b/gi, '');

  // 8. Remove table separators, pipes, equals
  clean = clean.replace(/\|/g, ' ');
  clean = clean.replace(/[\=\-]{3,}/g, ' ');

  // 9. General cleanup of multiple spaces/periods/commas
  clean = clean.replace(/\.{2,}/g, '.');
  clean = clean.replace(/,+/g, ',');
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
  const isSpeakingRef = useRef<boolean>(false);
  const lastSpokenTextRef = useRef<string>('');

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

  // Complete Voice & Audio Teardown Cleanup on Page Exit / Navigation Unmount
  useEffect(() => {
    return () => {
      // 1. Immediately deactivate voice mode flags
      isVoiceActiveRef.current = false;
      isSpeakingRef.current = false;

      // 2. Stop and pause ElevenLabs audio playback
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = '';
        } catch (e) {}
        audioRef.current = null;
      }

      // 3. Cancel browser Web Speech Synthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }

      // 4. Abort and stop SpeechRecognition mic listener
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onstart = null;
          recognitionRef.current.abort();
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
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
          if (!isSpeakingRef.current) {
            updateVoiceStatus('listening');
          }
        };

        rec.onresult = async (event: any) => {
          // Immediately reject any recognition while assistant is speaking or not listening
          if (isSpeakingRef.current || currentStatusRef.current !== 'listening') return;

          const lastIndex = event.results.length - 1;
          const text = event.results[lastIndex][0].transcript.trim();
          if (!text) return;

          const textLower = text.toLowerCase();

          // Stop commands (allow even during edge cases)
          const stopWords = ['stop', 'stop talking', 'be quiet', 'shut up', 'pause'];
          if (stopWords.some(word => textLower === word || textLower.startsWith(word))) {
            interruptSpeaking();
            return;
          }

          // Self-echo filtering check: reject transcript if it matches what assistant just spoke
          if (lastSpokenTextRef.current && (
            lastSpokenTextRef.current.includes(textLower) ||
            (textLower.length > 10 && lastSpokenTextRef.current.slice(0, 40).includes(textLower.slice(0, 20)))
          )) {
            console.log("Self-echo speech ignored:", text);
            return;
          }

          // Immediately abort mic to dump audio buffer while processing query
          try { rec.abort(); } catch (e) {}

          updateVoiceStatus('thinking');

          const newUserMsg: Message = { role: 'user', content: text };
          const updatedMessages = [...messagesRef.current, newUserMsg];
          setMessages(updatedMessages);

          try {
            const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
            const response = await api.post('/ai/chat/', {
              message: text,
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
            updateVoiceStatus('listening');
            try { rec.start(); } catch (e) {}
          }
        };

        rec.onerror = () => {
          if (!isSpeakingRef.current && isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
            setTimeout(() => {
              if (!isSpeakingRef.current && isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
                try { rec.start(); } catch (err) {}
              }
            }, 400);
          }
        };

        rec.onend = () => {
          // Do NOT auto-restart mic while speaking or thinking
          if (isSpeakingRef.current || !isVoiceActiveRef.current || currentStatusRef.current !== 'listening') {
            return;
          }
          setTimeout(() => {
            if (!isSpeakingRef.current && isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
              try {
                rec.start();
              } catch (e) {}
            }
          }, 400);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const speak = async (text: string) => {
    if (typeof window === 'undefined') return;

    isSpeakingRef.current = true;
    currentReplyRef.current = text;

    const cleanText = cleanTextForSpeech(text);
    lastSpokenTextRef.current = cleanText.toLowerCase();
    
    if (!cleanText) {
      isSpeakingRef.current = false;
      if (isVoiceActiveRef.current) {
        updateVoiceStatus('listening');
      } else {
        updateVoiceStatus('idle');
      }
      return;
    }

    // Stop playing audio and IMMEDIATELY abort mic session to prevent audio feedback loop
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    updateVoiceStatus('speaking');

    const finishSpeakingAndRestartMic = () => {
      audioRef.current = null;
      setTimeout(() => {
        isSpeakingRef.current = false;
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        } else {
          updateVoiceStatus('idle');
        }
      }, 500);
    };

    // Instant zero-latency speech start using Web Speech API
    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      
      const pickHumanVoice = () => {
        const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
        const preferred = [
          (v: SpeechSynthesisVoice) => (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online')) && v.lang.startsWith('en'),
          (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Female') || v.name.includes('Google US English Female'),
          (v: SpeechSynthesisVoice) => v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Jenny') || v.name.includes('Aria'),
          (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female'),
          (v: SpeechSynthesisVoice) => true,
        ];
        for (const fn of preferred) {
          const match = voices.find(fn);
          if (match) return match;
        }
        return voices[0] || null;
      };

      const setVoiceAndSpeak = () => {
        const voice = pickHumanVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      };

      utterance.onend = finishSpeakingAndRestartMic;
      utterance.onerror = finishSpeakingAndRestartMic;

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          setVoiceAndSpeak();
        };
      } else {
        setVoiceAndSpeak();
      }
    } catch (e: any) {
      console.warn("Web Speech API instant playback failed:", e?.message || e);
      finishSpeakingAndRestartMic();
    }
  };

  const interruptSpeaking = () => {
    isSpeakingRef.current = false;
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    if (isVoiceActiveRef.current) {
      updateVoiceStatus('thinking');
      // Enforce 2 seconds delay before restarting microphone after interrupt
      setTimeout(() => {
        if (isVoiceActiveRef.current && !isSpeakingRef.current) {
          updateVoiceStatus('listening');
          try { recognitionRef.current?.start(); } catch (e) {}
        }
      }, 2000);
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
      <main className="flex-1 h-screen flex flex-col bg-slate-950 relative overflow-hidden">
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

        {/* Input box form / Voice Control Bar */}
        <footer className="p-6 border-t border-slate-900 bg-slate-900/10">
          <div className="max-w-4xl mx-auto">
            {isVoiceActive ? (
              <div 
                onClick={voiceStatus === 'speaking' ? interruptSpeaking : undefined}
                className={`bg-slate-950 border border-indigo-500/30 rounded-2xl p-3 flex items-center justify-between shadow-lg shadow-indigo-500/5 transition-all ${
                  voiceStatus === 'speaking' ? 'cursor-pointer hover:border-indigo-500/60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Embedded 3D Voice Orb */}
                  <div className="shrink-0">
                    <ThreeDVoiceOrb status={voiceStatus} size="sm" />
                  </div>

                  {/* Status & Live Prompt Description */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Voice Assistant • {voiceStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {voiceStatus === 'listening' && "Continuous listening mode... Speak your query"}
                      {voiceStatus === 'thinking' && "Processing financial context..."}
                      {voiceStatus === 'speaking' && "Aura is speaking... (click bar or say 'stop' to interrupt)"}
                    </p>
                  </div>
                </div>

                {/* Turn Off / Switch back to text box */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVoice();
                  }}
                  className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-400 transition-all cursor-pointer shrink-0"
                >
                  Turn Off Voice
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="relative flex items-center gap-3">
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
            )}
          </div>
        </footer>
      </main>
  );
}
