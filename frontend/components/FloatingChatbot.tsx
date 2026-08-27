'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, X, Send, Bot, Mic } from 'lucide-react';
import ThreeDVoiceOrb from '@/components/ThreeDVoiceOrb';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SAMPLE_PROMPTS = [
  "What did I spend this week?",
  "Compare this month vs last month",
  "What is my forecasted spending next month?",
  "Generate a PDF report for this month"
];

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

  // 2. Remove markdown bold/italic/code/header markers
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
  clean = clean.replace(/\*([^*]+)\*/g, '$1');      // italic
  clean = clean.replace(/`([^`]+)`/g, '$1');        // inline code
  clean = clean.replace(/#{1,6}\s*/g, '');          // headers
  clean = clean.replace(/_{1,2}([^_]+)_{1,2}/g, '$1'); // underscores

  // 3. Remove markdown table separators and pipes
  clean = clean.replace(/\|/g, ' ');
  clean = clean.replace(/[\=\-]{3,}/g, ' ');

  // 4. Convert currency symbols to words
  clean = clean.replace(/৳\s*(\d[\d,\.]*)/g, (_, num) => numberToSpeech(num) + ' taka');
  clean = clean.replace(/\$\s*(\d[\d,\.]*)/g, (_, num) => numberToSpeech(num) + ' dollars');
  clean = clean.replace(/€\s*(\d[\d,\.]*)/g, (_, num) => numberToSpeech(num) + ' euros');
  clean = clean.replace(/£\s*(\d[\d,\.]*)/g, (_, num) => numberToSpeech(num) + ' pounds');

  // 5. Handle list bullets — convert bullets to natural sentence breaks with a pause
  clean = clean.split('\n').map(line => {
    let trimmed = line.trim();
    // numbered list item: "1. something" -> "something"
    trimmed = trimmed.replace(/^\d+\.\s+/, '');
    // bullet list item: "- something" or "* something" -> "something"
    trimmed = trimmed.replace(/^[\-\*\+]\s+/, '');
    return trimmed;
  }).filter(line => line.length > 0).join('. ');

  // 6. Clean up trailing ".0" in numbers (e.g. "100.0" -> "100")
  clean = clean.replace(/(\d+)\.0\b/g, '$1');

  // 7. Convert standalone percentages
  clean = clean.replace(/(\d+(?:\.\d+)?)%/g, (_, num) => numberToSpeech(num) + ' percent');

  // 8. Convert remaining numbers to words (integers and decimals)
  clean = clean.replace(/\b(\d{1,3}(?:,\d{3})*)(\.\d+)?\b/g, (match, intPart, decPart) => {
    const spoken = convertNumberToWords(intPart);
    if (decPart) {
      // e.g. ".50" -> "point fifty" or decimal digits individually
      const decDigits = decPart.replace('.', '');
      const decNum = parseInt(decDigits, 10);
      if (!isNaN(decNum) && decNum > 0) {
        return `${spoken} point ${convertNumberToWords(decDigits)}`;
      }
      return spoken;
    }
    return spoken;
  });

  // 9. Remove slashes between words
  clean = clean.replace(/(\w+)\/(\w+)/g, '$1 or $2');
  clean = clean.replace(/\s*\/\s*/g, ' or ');

  // 10. Remove "undefined" or "null" leaks
  clean = clean.replace(/\bundefined\b/gi, '');
  clean = clean.replace(/\bnull\b/gi, '');

  // 11. Replace em-dashes and en-dashes with a natural pause
  clean = clean.replace(/[\u2013\u2014]/g, ', ');

  // 12. Replace colons in the middle of a sentence with a comma (sounds more natural)
  clean = clean.replace(/:\s*/g, ', ');

  // 13. General cleanup — multiple spaces/periods
  clean = clean.replace(/\.{2,}/g, '.');
  clean = clean.replace(/,+/g, ',');
  clean = clean.replace(/\s+/g, ' ');
  clean = clean.replace(/,\s*\./g, '.');

  return clean.trim();
}

function numberToSpeech(numStr: string): string {
  const cleaned = numStr.replace(/,/g, '');
  const parts = cleaned.split('.');
  const intWords = convertNumberToWords(parts[0]);
  if (parts[1]) {
    const decNum = parseInt(parts[1], 10);
    if (!isNaN(decNum) && decNum > 0) {
      return `${intWords} point ${convertNumberToWords(parts[1])}`;
    }
  }
  return intWords;
}


// Word-by-word reveal component with simple markdown parsing for natural typing look
function NaturalMessageRenderer({ text, isNew }: { text: string; isNew: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    const words = text.split(' ');
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    if (words.length <= 1) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    const interval = setInterval(() => {
      setDisplayedText((prev) => (prev ? `${prev} ${words[index]}` : words[index]));
      index++;
      if (index >= words.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [text, isNew]);

  // Clean Markdown helper
  const parseMarkdown = (line: string) => {
    let parsed = line;
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    parsed = parsed.replace(/`(.*?)`/g, '<code class="bg-slate-900 px-1 rounded text-pink-400 font-mono">$1</code>');
    return parsed;
  };

  const lines = displayedText.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const listContent = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <li
              key={i}
              className="list-disc ml-4 text-[11px] leading-relaxed text-slate-350"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(listContent) }}
            />
          );
        }
        return (
          <p
            key={i}
            className="text-[11px] leading-relaxed text-slate-300 min-h-[14px]"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(line) }}
          />
        );
      })}
    </div>
  );
}

export default function FloatingChatbot() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const SAMPLE_PROMPTS = [
    t('chat.suggestion1', "How can I increase my savings rate this month?"),
    t('chat.suggestion2', "Summarize my highest spending category."),
    t('chat.suggestion3', "Give me a budget reduction strategy."),
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: language === 'bn' 
        ? "হ্যালো! আমি ঔরা, আপনার ব্যক্তিগত ভার্চুয়াল ওয়েল্থ ম্যানেজার। আপনার বাজেট, সাম্প্রতিক লেনদেন বা সঞ্চয় সম্পর্কিত যে কোনো প্রশ্ন জিজ্ঞাসা করতে পারেন।"
        : "Hi there! I am Aura, your virtual wealth manager. Ask me questions about your budgets, recent transactions, or pick one of these sample queries:",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Interaction state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mutable references to avoid stale closure state
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSelectPrompt = async (promptText: string) => {
    if (loading) return;

    const newUserMsg: Message = { role: 'user', content: promptText };
    const updatedMessages = [...messages, newUserMsg];
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
        { role: 'assistant', content: response.data.reply },
      ]);

      const targetPage = response.data.target_page || response.data.data?.target_page;
      if (targetPage) {
        setTimeout(() => {
          router.push(targetPage);
        }, 1200);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I encountered an error preparing my response. Please check back shortly." },
      ]);
    } finally {
      setLoading(false);
    }
  };

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

          // Stop commands
          const stopWords = ['stop', 'stop talking', 'be quiet', 'shut up', 'pause'];
          if (stopWords.some(word => textLower === word || textLower.startsWith(word + ' '))) {
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
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

            const formAction = response.data.form_action || response.data.data?.form_action;
            const targetPage = response.data.target_page || response.data.data?.target_page;

            if (formAction && typeof window !== 'undefined') {
              sessionStorage.setItem('pending_ai_form_action', JSON.stringify(formAction));
              window.dispatchEvent(new CustomEvent('ai_form_action', { detail: formAction }));
            }

            if (targetPage && typeof window !== 'undefined' && window.location.pathname !== targetPage) {
              setTimeout(() => {
                router.push(targetPage);
              }, 400);
            }

            speak(reply);
          } catch (error) {
            updateVoiceStatus('idle');
            setIsVoiceActive(false);
          }
        };

        rec.onerror = (e: any) => {
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

    // Stop playing audio and IMMEDIATELY abort mic session to prevent buffering speaker audio
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    updateVoiceStatus('speaking');

    const finishSpeakingAndRestartMic = () => {
      audioRef.current = null;
      // Wait 750ms for acoustic room tail to fade completely before turning mic back on
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
      }, 750);
    };

    try {
      const response = await api.post('/ai/tts/', { text: cleanText }, { responseType: 'blob' });
      const blob = response.data;
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = finishSpeakingAndRestartMic;
      audio.onerror = finishSpeakingAndRestartMic;

      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
        finishSpeakingAndRestartMic();
      });
    } catch (error: any) {
      console.warn("TTS generation error, falling back to Web Speech API:", error?.message || error);
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
          utterance.rate = 0.95;
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
        console.warn("Web Speech API fallback failed:", e?.message || e);
        finishSpeakingAndRestartMic();
      }
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
      updateVoiceStatus('listening');
      setTimeout(() => {
        if (isVoiceActiveRef.current && !isSpeakingRef.current) {
          try { recognitionRef.current?.start(); } catch (e) {}
        }
      }, 300);
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

  const handleClosePanel = () => {
    interruptSpeaking();
    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch (e) {}
    setIsVoiceActive(false);
    setIsOpen(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    
    const newUserMsg: Message = { role: 'user', content: userMsg };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      
      const response = await api.post('/ai/chat/', {
        message: userMsg,
        history: history,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.reply },
      ]);

      const formAction = response.data.form_action || response.data.data?.form_action;
      const targetPage = response.data.target_page || response.data.data?.target_page;

      if (formAction && typeof window !== 'undefined') {
        sessionStorage.setItem('pending_ai_form_action', JSON.stringify(formAction));
        window.dispatchEvent(new CustomEvent('ai_form_action', { detail: formAction }));
      }

      if (targetPage && typeof window !== 'undefined' && window.location.pathname !== targetPage) {
        setTimeout(() => {
          router.push(targetPage);
        }, 400);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I encountered an error preparing my response. Please check back shortly." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-80 sm:w-96 h-[480px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl glow-indigo mb-4 relative"
          >
            {/* Voice Mode Fullscreen Overlay */}
            {isVoiceActive && (
              <div 
                onClick={voiceStatus === 'speaking' ? interruptSpeaking : undefined}
                className={`absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-30 space-y-6 text-center ${
                  voiceStatus === 'speaking' ? 'cursor-pointer hover:bg-slate-950/90 transition-all' : ''
                }`}
              >
                 <div className="space-y-1 pointer-events-none">
                  <h3 className="text-sm font-bold text-white tracking-wider uppercase">Voice Assistant</h3>
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">{voiceStatus}</p>
                </div>

                {/* Futuristic 3D Circular Moving Voice Orb */}
                <div className="my-2 pointer-events-none">
                  <ThreeDVoiceOrb status={voiceStatus} size="sm" />
                </div>

                <div className="text-[11px] text-slate-400 max-w-xs leading-relaxed px-4 pointer-events-none">
                  {voiceStatus === 'listening' && "Continuous mode. Speak a command or question..."}
                  {voiceStatus === 'thinking' && "Structuring RAG context..."}
                  {voiceStatus === 'speaking' && (
                    <div className="space-y-1">
                      <p>Speaking...</p>
                      <p className="text-[9px] text-indigo-400 font-bold animate-pulse">Say "stop" or start asking a new query</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVoice();
                  }}
                  className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 rounded-xl text-[10px] font-bold text-rose-400 transition-all cursor-pointer shadow-md"
                >
                  Close Session
                </button>
              </div>
            )}

            {/* Header */}
            <header className="px-4 py-3 bg-slate-950 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-none">{t('chat.title', 'Aura Advisor')}</h3>
                  <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{t('chat.thinking') ? t('chat.thinking').replace('...', '') : 'Ready to assist'}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={handleClosePanel}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </header>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/40">
              {messages.map((msg, index) => {
                const isBot = msg.role === 'assistant';
                return (
                  <div key={index} className={`flex gap-3.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {isBot && (
                      <div className="h-7 w-7 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className="max-w-[75%]">
                      <div
                        className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                          isBot
                            ? 'bg-slate-950/70 border border-slate-850 text-slate-200'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        <NaturalMessageRenderer
                          text={msg.content}
                          isNew={isBot && index === messages.length - 1}
                        />
                      </div>

                      {/* Suggestions list chips */}
                      {isBot && index === 0 && messages.length === 1 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 max-w-xs">
                          {SAMPLE_PROMPTS.map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => handleSelectPrompt(prompt)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-indigo-500/50 hover:bg-slate-900/80 text-[10px] font-semibold text-slate-450 hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3.5 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-slate-950/70 border border-slate-850 p-3 rounded-2xl flex items-center gap-1 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce delay-100"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce delay-200"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <footer className="p-3 bg-slate-950 border-t border-slate-850 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoice}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-indigo-400 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Voice Mode"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('chat.placeholder', 'Ask Aura about your expenses, budgets, or savings tips...')}
                  disabled={loading}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2 pl-4 pr-10 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
                />
                
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-30"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom-Middle Voice Assistant Animation Bar */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.85 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-[calc(50%+8rem)] z-50 flex items-center gap-4 px-6 py-3.5 bg-[#052322]/95 border border-[#0da594]/50 backdrop-blur-xl rounded-full shadow-[0_10px_40px_rgba(13,165,148,0.4)] text-white"
          >
            {/* 3D Voice Orb */}
            <div 
              className="shrink-0 cursor-pointer" 
              onClick={voiceStatus === 'speaking' ? interruptSpeaking : undefined}
              title={voiceStatus === 'speaking' ? "Tap to stop speaking" : "Voice Orb"}
            >
              <ThreeDVoiceOrb status={voiceStatus} size="sm" />
            </div>

            {/* Status & Speech Info */}
            <div className="flex flex-col min-w-[150px] max-w-[260px]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0da594] animate-pulse"></span>
                <span className="text-xs font-black tracking-wider uppercase text-white">Aura Voice</span>
                <span className="text-[10px] text-[#0da594] font-bold uppercase tracking-widest bg-[#0da594]/20 px-2 py-0.5 rounded-full border border-[#0da594]/30">
                  {voiceStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                {voiceStatus === 'listening' && (language === 'bn' ? "কথা শুনছি... বলুন" : "Continuous listening... Speak your query")}
                {voiceStatus === 'thinking' && (language === 'bn' ? "প্রসেসিং হচ্ছে..." : "Aura is analyzing...")}
                {voiceStatus === 'speaking' && (language === 'bn' ? "কথা বলছি... (থামাতে ট্যাপ করুন)" : "Speaking... (Tap orb to pause)")}
                {voiceStatus === 'idle' && (language === 'bn' ? "প্রস্তুত" : "Ready")}
              </p>
            </div>

            {/* Micro Waveform Visualizer */}
            <div className="flex items-center gap-1 h-6 px-1">
              <span className={`w-1 rounded-full bg-[#0da594] transition-all duration-300 ${voiceStatus === 'speaking' || voiceStatus === 'listening' ? 'h-5 animate-pulse' : 'h-2'}`}></span>
              <span className={`w-1 rounded-full bg-[#0da594] transition-all duration-300 ${voiceStatus === 'speaking' || voiceStatus === 'listening' ? 'h-3 animate-pulse delay-75' : 'h-1.5'}`}></span>
              <span className={`w-1 rounded-full bg-[#0da594] transition-all duration-300 ${voiceStatus === 'speaking' || voiceStatus === 'listening' ? 'h-6 animate-pulse delay-150' : 'h-3'}`}></span>
              <span className={`w-1 rounded-full bg-[#0da594] transition-all duration-300 ${voiceStatus === 'speaking' || voiceStatus === 'listening' ? 'h-4 animate-pulse delay-100' : 'h-2'}`}></span>
            </div>

            {/* End Session Button */}
            <button
              onClick={toggleVoice}
              className="p-2 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 hover:text-white transition-all cursor-pointer shrink-0 ml-1"
              title="Close Voice Session"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-[#0da594] to-[#087f73] text-white rounded-full flex items-center justify-center shadow-xl shadow-teal-500/30 hover:shadow-teal-500/40 relative cursor-pointer border border-teal-400/20"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            <Sparkles className="h-3 w-3 text-teal-200 absolute top-3.5 right-3.5 animate-pulse" />
          </>
        )}
      </motion.button>
    </div>
  );
}
