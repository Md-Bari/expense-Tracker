'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, X, Send, Bot, Mic } from 'lucide-react';

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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi there! I am Aura, your virtual wealth manager. Ask me questions about your budgets, recent transactions, or pick one of these sample queries:",
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
        rec.continuous = true;  // Keep active continuously to listen for barge-in / stop cues
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          updateVoiceStatus('listening');
        };

        rec.onresult = async (event: any) => {
          // Only process results when actively listening (mic is off during speaking/thinking)
          if (currentStatusRef.current !== 'listening') return;
          
          const lastIndex = event.results.length - 1;
          const text = event.results[lastIndex][0].transcript.trim();
          if (!text) return;

          const textLower = text.toLowerCase();

          // Catch "stop" commands
          const stopWords = ['stop', 'stop talking', 'be quiet', 'shut up', 'pause'];
          if (stopWords.some(word => textLower === word || textLower.startsWith(word + ' '))) {
            interruptSpeaking();
            return;
          }

          // User spoke — process as new query
          updateVoiceStatus('thinking');
          // Stop mic while processing so it doesn't pick up anything else
          try { recognitionRef.current?.stop(); } catch (e) {}

            const newUserMsg: Message = { role: 'user', content: `[Voice] ${text}` };
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

              // speak() will stop mic before playing and restart it after
              speak(reply);
            } catch (error) {
              updateVoiceStatus('idle');
              setIsVoiceActive(false);
            }
          };


        rec.onerror = (e: any) => {
          // Only auto-restart on recoverable errors while actively listening
          if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
            setTimeout(() => {
              if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
                try { rec.start(); } catch (err) {}
              }
            }, 300);
          }
        };

        rec.onend = () => {
          // Only restart if we're actively in listening state (not thinking/speaking)
          if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
            setTimeout(() => {
              if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
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

      // STOP microphone before playing to prevent self-echo
      try { recognitionRef.current?.stop(); } catch (e) {}

      const restartMicAfterSpeaking = () => {
        audioRef.current = null;
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
          // Small delay so mic doesn't catch the last audio fade
          setTimeout(() => {
            if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
              try { recognitionRef.current?.start(); } catch (e) {}
            }
          }, 400);
        } else {
          updateVoiceStatus('idle');
        }
      };

      audio.onended = () => {
        restartMicAfterSpeaking();
      };

      audio.onerror = () => {
        restartMicAfterSpeaking();
      };

      audio.play().catch((err) => {
        console.error("Audio playback error:", err);
        restartMicAfterSpeaking();
      });
    } catch (error: any) {
      console.warn("TTS generation error, falling back to Web Speech API:", error?.message || error);
      // Also stop mic for Web Speech API fallback
      try { recognitionRef.current?.stop(); } catch (e) {}

      const restartMicAfterFallback = () => {
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
          setTimeout(() => {
            if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
              try { recognitionRef.current?.start(); } catch (e) {}
            }
          }, 400);
        } else {
          updateVoiceStatus('idle');
        }
      };

      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Pick the best available natural-sounding female English voice
        const pickFemaleVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          const preferred = [
            (v: SpeechSynthesisVoice) => v.name === 'Google UK English Female',
            (v: SpeechSynthesisVoice) => v.name === 'Google US English Female',
            (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
            (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'),
            (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
          ];
          for (const fn of preferred) {
            const match = voices.find(fn);
            if (match) return match;
          }
          return null;
        };

        const setVoiceAndSpeak = () => {
          const voice = pickFemaleVoice();
          if (voice) utterance.voice = voice;
          utterance.rate = 0.92;
          utterance.pitch = 1.05;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        };

        utterance.onend = () => restartMicAfterFallback();
        utterance.onerror = () => restartMicAfterFallback();

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
        restartMicAfterFallback();
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
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

                {/* Animated pulsing elements */}
                <div className="relative flex items-center justify-center h-32 w-32 pointer-events-none">
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
                        className="absolute h-20 w-20 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/20"
                      >
                        <Mic className="h-8 w-8 animate-pulse" />
                      </motion.div>
                    </>
                  )}

                  {voiceStatus === 'thinking' && (
                    <div className="h-14 w-14 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin" />
                  )}

                  {voiceStatus === 'speaking' && (
                    <div className="flex items-center gap-1.5 h-12">
                      {[1, 2, 3, 4, 5].map((b) => (
                        <motion.div
                          key={b}
                          animate={{ height: [12, 40, 12] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: b * 0.1,
                          }}
                          className="w-1.5 bg-indigo-500 rounded-full"
                        />
                      ))}
                    </div>
                  )}
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
                  <h3 className="text-xs font-bold text-white leading-none">Aura Advisor</h3>
                  <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Ready to assist</span>
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
                  placeholder="Ask a query..."
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

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/40 relative cursor-pointer border border-indigo-400/20"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            <Sparkles className="h-3 w-3 text-indigo-200 absolute top-3.5 right-3.5 animate-pulse" />
          </>
        )}
      </motion.button>
    </div>
  );
}
