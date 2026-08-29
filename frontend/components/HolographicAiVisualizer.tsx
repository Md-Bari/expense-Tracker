'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HolographicAiVisualizerProps {
  status?: 'idle' | 'listening' | 'thinking' | 'speaking';
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function HolographicAiVisualizer({
  status = 'idle',
  onClick,
  className = '',
  size = 'lg',
}: HolographicAiVisualizerProps) {
  const isLive = status === 'speaking' || status === 'listening';

  // Left Pink Waveform Bar Heights (matching reference image curve)
  const leftWaveHeights = [14, 26, 44, 68, 86, 72, 50, 32, 18, 10];
  // Right Cyan Waveform Bar Heights (matching reference image curve)
  const rightWaveHeights = [10, 18, 32, 50, 72, 86, 68, 44, 26, 14];

  const scaleMultiplier = size === 'sm' ? 0.65 : size === 'md' ? 0.85 : 1;

  return (
    <div
      onClick={onClick}
      className={`relative select-none w-full max-w-2xl mx-auto rounded-[32px] border-2 border-[#147a70]/80 bg-[#062422]/95 shadow-[0_0_50px_rgba(20,122,112,0.35)] backdrop-blur-2xl p-4 sm:p-6 flex items-center justify-between overflow-hidden ${className}`}
      style={{
        boxShadow: 'inset 0 0 30px rgba(6,182,212,0.08), 0 10px 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* ─── Top-Center Green Notch / Accent (Exact Match to User Image) ─── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-4 bg-[#22c55e] rounded-b-sm shadow-[0_0_10px_#22c55e] z-30" />

      {/* ─── Ambient Inner Glow ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />

      {/* ─── LEFT: PINK / MAGENTA SOUNDWAVE FREQUENCIES ───────────────── */}
      <div className="flex items-center gap-1 sm:gap-1.5 h-28 z-10 pl-2 sm:pl-4">
        {leftWaveHeights.map((h, i) => {
          const scaledH = h * scaleMultiplier;
          return (
            <motion.span
              key={`left-bar-${i}`}
              animate={{
                height: isLive
                  ? [scaledH * 0.65, scaledH * 1.3, scaledH * 0.75, scaledH * 1.15, scaledH * 0.65]
                  : [scaledH, scaledH * 0.9, scaledH],
                opacity: isLive ? [0.85, 1, 0.85] : 0.75,
              }}
              transition={{
                repeat: Infinity,
                duration: isLive ? 0.7 + (i % 3) * 0.15 : 2.5,
                delay: i * 0.07,
                ease: 'easeInOut',
              }}
              className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-[#f43f5e] via-[#f472b6] to-[#fb7185] shadow-[0_0_10px_rgba(244,114,182,0.85)]"
              style={{ minHeight: '6px' }}
            />
          );
        })}
      </div>

      {/* ─── CENTER: HOLOGRAPHIC PROJECTOR + ATOM ORB + 3D PLAY PRISM ─── */}
      <div className="relative flex flex-col items-center justify-end h-56 sm:h-64 w-52 sm:w-64 shrink-0 mx-auto z-10">
        {/* 1. Holographic Light Cone Beam */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 sm:w-48 h-36 sm:h-44 pointer-events-none z-0 overflow-hidden">
          <div
            className="w-full h-full bg-gradient-to-t from-cyan-400/40 via-teal-400/15 to-transparent opacity-85"
            style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
          />

          {/* Upward Floating Holographic Dust Sparkles */}
          {[1, 2, 3, 4, 5, 6, 7].map((p) => (
            <motion.div
              key={p}
              animate={{
                y: [0, -110],
                x: [0, p % 2 === 0 ? 6 : -6],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.4],
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + p * 0.3,
                delay: p * 0.25,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full bg-cyan-100 shadow-[0_0_6px_#67e8f9]"
              style={{
                bottom: '8%',
                left: `${15 + p * 11}%`,
                width: `${p % 2 === 0 ? 3 : 2}px`,
                height: `${p % 2 === 0 ? 3 : 2}px`,
              }}
            />
          ))}
        </div>

        {/* 2. Floating Atomic Sphere */}
        <motion.div
          animate={{
            y: status === 'speaking' ? [-4, 5, -4] : [-2, 3, -2],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'easeInOut',
          }}
          className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44 mb-5 sm:mb-6 z-10"
        >
          {/* Outer Translucent Holographic Glass Containment Sphere */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/40 bg-radial from-cyan-400/15 via-teal-500/5 to-transparent shadow-[0_0_30px_rgba(34,211,238,0.35)] backdrop-blur-[1px]" />

          {/* Star Sparkles floating in the sphere */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            className="absolute inset-2 pointer-events-none"
          >
            <div className="absolute top-3 left-6 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff]" />
            <div className="absolute top-7 right-5 w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#22d3ee]" />
            <div className="absolute bottom-6 left-7 w-1 h-1 rounded-full bg-pink-200 shadow-[0_0_6px_#f472b6]" />
            <div className="absolute bottom-8 right-8 w-1.5 h-1.5 rounded-full bg-teal-200 shadow-[0_0_8px_#2dd4bf]" />
            <div className="absolute top-1/2 left-3 w-1 h-1 rounded-full bg-cyan-100 shadow-[0_0_4px_#fff]" />
          </motion.div>

          {/* ─── 3D ATOMIC RING 1: PINK / MAGENTA (Tilted 55° X, -25° Y) ─── */}
          <motion.div
            animate={{
              rotateZ: [0, 360],
            }}
            transition={{
              rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 3 : 7.5, ease: 'linear' },
            }}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(55deg) rotateY(-25deg)',
            }}
            className="absolute inset-1 rounded-full border-[3px] border-pink-400 border-t-fuchsia-300 border-b-pink-500 shadow-[0_0_18px_rgba(244,114,182,0.9)] pointer-events-none"
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-pink-200 shadow-[0_0_12px_#f472b6]" />
          </motion.div>

          {/* ─── 3D ATOMIC RING 2: CYAN / TEAL (Tilted -55° X, 30° Y) ─── */}
          <motion.div
            animate={{
              rotateZ: [360, 0],
            }}
            transition={{
              rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 2.8 : 7, ease: 'linear' },
            }}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(-55deg) rotateY(30deg)',
            }}
            className="absolute inset-1 rounded-full border-[3px] border-cyan-400 border-t-cyan-200 border-b-teal-500 shadow-[0_0_18px_rgba(34,211,238,0.9)] pointer-events-none"
          >
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-200 shadow-[0_0_12px_#22d3ee]" />
          </motion.div>

          {/* ─── 3D ATOMIC RING 3: GOLD / AMBER (Tilted 70° X) ─── */}
          <motion.div
            animate={{
              rotateZ: [0, 360],
            }}
            transition={{
              rotateZ: { repeat: Infinity, duration: 10, ease: 'linear' },
            }}
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(70deg)',
            }}
            className="absolute inset-4 rounded-full border border-amber-300/60 border-t-amber-100 shadow-[0_0_10px_rgba(252,211,77,0.5)] pointer-events-none"
          />

          {/* ─── CENTER FLOATING 3D PRISMATIC PLAY TRIANGLE (Exact Image Match) ─── */}
          <motion.div
            animate={{
              rotateY: [0, 360],
              scale: status === 'speaking' ? [1, 1.15, 1] : [1, 1.05, 1],
            }}
            transition={{
              rotateY: { repeat: Infinity, duration: status === 'thinking' ? 3 : 8, ease: 'linear' },
              scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            }}
            className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center z-20 drop-shadow-[0_0_20px_rgba(34,211,238,0.95)]"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="prismGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a5f3fc" />
                  <stop offset="45%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="prismHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.2" />
                </linearGradient>
                <filter id="prismGlow">
                  <feGaussianBlur stdDeviation="3.5" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 3D Isometric Extrusion Shadow/Bottom Face */}
              <polygon
                points="30,22 84,52 30,82"
                fill="#0f766e"
                opacity="0.8"
                transform="translate(4, 5)"
              />

              {/* Main Glowing 3D Triangular Play Prism Face */}
              <polygon
                points="28,20 82,50 28,80"
                fill="url(#prismGradient)"
                stroke="#cffafe"
                strokeWidth="2.5"
                strokeLinejoin="round"
                filter="url(#prismGlow)"
              />

              {/* Internal Glass Specular Facet */}
              <polygon
                points="30,24 76,50 30,50"
                fill="url(#prismHighlight)"
                opacity="0.8"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* 3. Cybernetic Holographic Pedestal Base */}
        <div className="relative w-44 sm:w-52 h-9 sm:h-10 flex items-center justify-center z-10">
          <div className="absolute inset-0 bg-cyan-400/40 blur-md rounded-full" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 border border-teal-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center justify-center">
            <div className="absolute inset-0.5 rounded-full border border-cyan-400/40 border-dashed" />
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 10px rgba(34,211,238,0.7)',
                  '0 0 22px rgba(34,211,238,1)',
                  '0 0 10px rgba(34,211,238,0.7)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-3/5 h-3/5 rounded-full bg-gradient-to-tr from-cyan-300 via-teal-300 to-cyan-100 border border-white/80 shadow-[0_0_15px_#22d3ee]"
            />
            <div className="absolute left-3 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
          </div>
        </div>
      </div>

      {/* ─── RIGHT: CYAN / TEAL SOUNDWAVE FREQUENCIES ─────────────────── */}
      <div className="flex items-center gap-1 sm:gap-1.5 h-28 z-10 pr-2 sm:pl-4">
        {rightWaveHeights.map((h, i) => {
          const scaledH = h * scaleMultiplier;
          return (
            <motion.span
              key={`right-bar-${i}`}
              animate={{
                height: isLive
                  ? [scaledH * 0.65, scaledH * 1.3, scaledH * 0.75, scaledH * 1.15, scaledH * 0.65]
                  : [scaledH, scaledH * 0.9, scaledH],
                opacity: isLive ? [0.85, 1, 0.85] : 0.75,
              }}
              transition={{
                repeat: Infinity,
                duration: isLive ? 0.75 + (i % 3) * 0.15 : 2.5,
                delay: i * 0.07,
                ease: 'easeInOut',
              }}
              className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-[#0d9488] via-[#14b8a6] to-[#2dd4bf] shadow-[0_0_10px_rgba(45,212,191,0.85)]"
              style={{ minHeight: '6px' }}
            />
          );
        })}
      </div>
    </div>
  );
}
