'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  showText?: boolean;
}

export default function LanguageToggle({ className = '', showText = true }: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:text-white hover:bg-indigo-900/50 hover:border-indigo-400 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 text-xs font-semibold ${className}`}
      title={t('lang.switch')}
      aria-label="Toggle Language"
    >
      <Languages className="h-3.5 w-3.5 text-indigo-400 shrink-0 animate-pulse" />
      {showText && (
        <span className="tracking-wide">
          {language === 'en' ? (
            <span>
              EN <span className="text-indigo-400 font-bold ml-0.5">| বাংলা</span>
            </span>
          ) : (
            <span>
              বাংলা <span className="text-indigo-400 font-bold ml-0.5">| EN</span>
            </span>
          )}
        </span>
      )}
    </button>
  );
}
