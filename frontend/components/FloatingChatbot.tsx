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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
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
          if (currentStatusRef.current !== 'listening' && currentStatusRef.current !== 'speaking') return;
          
          const lastIndex = event.results.length - 1;
          const text = event.results[lastIndex][0].transcript.trim();
          if (!text) return;

          const textLower = text.toLowerCase();

          // 1. Catch "stop" commands synchronously
          const stopWords = ['stop', 'stop talking', 'be quiet', 'shut up', 'pause'];
          if (stopWords.some(word => textLower === word || textLower.startsWith(word))) {
            window.speechSynthesis.cancel();
            updateVoiceStatus('listening');
            return;
          }

          // 2. Filter out AI self-echo (ignoring when AI records itself speaking)
          if (currentStatusRef.current === 'speaking') {
            const aiText = currentReplyRef.current.toLowerCase();
            if (aiText.includes(textLower) || textLower.includes(aiText) || textLower.length < 4) {
              return;
            }
          }

          // 3. User spoke a new prompt
          if (currentStatusRef.current === 'speaking' || currentStatusRef.current === 'listening') {
            window.speechSynthesis.cancel(); // Interrupt speech
            updateVoiceStatus('thinking');

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

              // Speak response
              speak(reply);
            } catch (error) {
              updateVoiceStatus('idle');
              setIsVoiceActive(false);
            }
          }
        };

        rec.onerror = (e: any) => {
          if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
            setTimeout(() => {
              if (isVoiceActiveRef.current && currentStatusRef.current === 'listening') {
                try { rec.start(); } catch (err) {}
              }
            }, 300);
          }
        };

        rec.onend = () => {
          // Restart loop if voice active with safety timeout
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

  const speak = (text: string) => {
    if (typeof window === 'undefined') return;

    // Cache the spoken text to filter out self-recordings
    currentReplyRef.current = text;

    const cleanText = text.replace(/\|/g, ' ')
                         .replace(/[\=\-\_\*]{3,}/g, ' ')
                         .replace(/[\*\`\#\_]/g, '')
                         .trim();
    
    if (!cleanText) {
      if (isVoiceActiveRef.current) {
        updateVoiceStatus('listening');
      } else {
        updateVoiceStatus('idle');
      }
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    // 80ms delay to prevent Chrome SpeechSynthesis lockup bugs
    setTimeout(() => {
      if (!isVoiceActiveRef.current && currentStatusRef.current !== 'thinking') return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Choose female voice
      const voices = window.speechSynthesis.getVoices();
      const clearVoice = voices.find(v => {
        const name = v.name.toLowerCase();
        return (
          name.includes('google us english') || 
          name.includes('zira') || 
          name.includes('samantha') || 
          name.includes('google uk english female') ||
          (name.includes('female') && v.lang.startsWith('en-'))
        );
      });
      utterance.lang = 'en-US';

      if (clearVoice) {
        utterance.voice = clearVoice;
      }

      utterance.onstart = () => {
        updateVoiceStatus('speaking');
      };

      utterance.onend = () => {
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
        } else {
          updateVoiceStatus('idle');
        }
      };

      utterance.onerror = () => {
        if (isVoiceActiveRef.current) {
          updateVoiceStatus('listening');
        } else {
          updateVoiceStatus('idle');
        }
      };

      utteranceRef.current = utterance;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    }, 80);
  };

  const interruptSpeaking = () => {
    window.speechSynthesis.cancel();
    if (isVoiceActiveRef.current) {
      updateVoiceStatus('listening');
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition API is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isVoiceActive) {
      window.speechSynthesis.cancel();
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      updateVoiceStatus('idle');
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
    window.speechSynthesis.cancel();
    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch (e) {}
    setIsVoiceActive(false);
    updateVoiceStatus('idle');
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
