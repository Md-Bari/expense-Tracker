'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles, Cpu, Play } from 'lucide-react';

interface ThreeDVoiceOrbProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  onClick?: () => void;
  showPedestal?: boolean;
}

export default function ThreeDVoiceOrb({
  status,
  size = 'lg',
  className = '',
  onClick,
  showPedestal = true,
}: ThreeDVoiceOrbProps) {
  // Size metrics mapping
  const sizeConfig = {
    xs: { container: 'w-20 h-24', sphere: 'w-14 h-14', core: 'w-7 h-7', pedestal: 'w-16 h-4', beam: 'h-16', icon: 'h-3.5 w-3.5' },
    sm: { container: 'w-28 h-32', sphere: 'w-20 h-20', core: 'w-9 h-9', pedestal: 'w-22 h-5', beam: 'h-20', icon: 'h-4.5 w-4.5' },
    md: { container: 'w-40 h-48', sphere: 'w-28 h-28', core: 'w-12 h-12', pedestal: 'w-32 h-7', beam: 'h-32', icon: 'h-6 w-6' },
    lg: { container: 'w-56 h-64 sm:w-64 sm:h-72', sphere: 'w-40 h-40 sm:w-44 sm:h-44', core: 'w-16 h-16 sm:w-18 sm:h-18', pedestal: 'w-44 sm:w-52 h-9 sm:h-10', beam: 'h-44 sm:h-48', icon: 'h-8 w-8' },
    xl: { container: 'w-72 h-80 sm:w-80 sm:h-96', sphere: 'w-52 h-52 sm:w-60 sm:h-60', core: 'w-20 h-20 sm:w-24 sm:h-24', pedestal: 'w-56 sm:w-64 h-11 sm:h-12', beam: 'h-56 sm:h-64', icon: 'h-10 w-10' },
    hero: { container: 'w-88 h-96 sm:w-96 sm:h-[420px]', sphere: 'w-64 h-64 sm:w-72 sm:h-72', core: 'w-24 h-24 sm:w-28 sm:h-28', pedestal: 'w-68 sm:w-80 h-12 sm:h-14', beam: 'h-68 sm:h-80', icon: 'h-12 w-12' },
  };

  const cfg = sizeConfig[size] || sizeConfig.lg;

  // Status colors & gradients
  const getCoreGradient = () => {
    switch (status) {
      case 'listening':
        return 'from-cyan-300 via-teal-400 to-blue-500';
      case 'thinking':
        return 'from-fuchsia-400 via-purple-500 to-indigo-600';
      case 'speaking':
        return 'from-cyan-300 via-emerald-400 to-teal-500';
      default:
        return 'from-cyan-300 via-teal-400 to-blue-600';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end select-none ${cfg.container} ${className}`}
    >
      {/* ─── 1. HOLOGRAPHIC LIGHT CONE PROJECTION BEAM ─────────────────── */}
      {showPedestal && (
        <div
          className={`absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-4/5 ${cfg.beam} pointer-events-none z-0 overflow-hidden`}
        >
          {/* Conical Light Beam Gradient */}
          <div
            className="w-full h-full bg-gradient-to-t from-cyan-400/40 via-teal-400/15 to-transparent [clip-path:polygon(20%_0%,80%_0%,100%_100%,0%_100%)] opacity-80"
          />

          {/* Upward Floating Stardust Holographic Particles */}
          {[1, 2, 3, 4, 5, 6].map((p) => (
            <motion.div
              key={p}
              animate={{
                y: [0, -120],
                x: [0, (p % 2 === 0 ? 8 : -8)],
                opacity: [0, 0.9, 0],
                scale: [0.6, 1.2, 0.4],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2 + p * 0.4,
                delay: p * 0.35,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full bg-cyan-200 shadow-[0_0_8px_#22d3ee]"
              style={{
                bottom: '10%',
                left: `${20 + p * 10}%`,
                width: `${p % 2 === 0 ? 3 : 2}px`,
                height: `${p % 2 === 0 ? 3 : 2}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* ─── 2. FLOATING HOLOGRAPHIC ATOMIC SPHERE & 3D ORBITAL RINGS ───── */}
      <motion.div
        animate={{
          y: status === 'speaking' ? [-4, 6, -4] : [-3, 3, -3],
        }}
        transition={{
          repeat: Infinity,
          duration: status === 'speaking' ? 2 : 3.5,
          ease: 'easeInOut',
        }}
        className={`relative flex items-center justify-center ${cfg.sphere} mb-4 sm:mb-6 z-10 [perspective:1000px]`}
      >
        {/* Ambient Backlight Glow / Aura Mist */}
        <motion.div
          animate={{
            scale: status === 'speaking' ? [1, 1.25, 1] : [1, 1.12, 1],
            opacity: status === 'speaking' ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/40 via-fuchsia-500/30 to-teal-400/40 blur-2xl pointer-events-none"
        />

        {/* Outer Translucent Holographic Glass Containment Sphere */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/40 bg-radial from-cyan-400/10 via-transparent to-transparent shadow-[0_0_25px_rgba(34,211,238,0.35)] backdrop-blur-[1px]" />

        {/* Star Sparkles floating in the orb */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute inset-2 pointer-events-none"
        >
          <div className="absolute top-2 left-6 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          <div className="absolute top-8 right-4 w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_8px_#22d3ee]" />
          <div className="absolute bottom-5 left-8 w-1 h-1 rounded-full bg-pink-200 shadow-[0_0_6px_#f472b6]" />
          <div className="absolute bottom-8 right-8 w-1.5 h-1.5 rounded-full bg-teal-200 shadow-[0_0_8px_#2dd4bf]" />
        </motion.div>

        {/* ─── 3D ATOMIC ORBITAL RING 1: PINK / MAGENTA (Tilted 55° X, -25° Y) ─── */}
        <motion.div
          animate={{
            rotateZ: [0, 360],
            scale: status === 'speaking' ? [1, 1.08, 1] : [1, 1.03, 1],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 3 : 7, ease: 'linear' },
            scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(55deg) rotateY(-25deg)',
          }}
          className="absolute inset-1 rounded-full border-[2.5px] border-pink-400/80 border-t-fuchsia-300 border-b-pink-500 shadow-[0_0_16px_rgba(244,114,182,0.85)] pointer-events-none"
        >
          {/* Glowing Photon Bead on Pink Ring */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-pink-300 shadow-[0_0_12px_#f472b6]" />
        </motion.div>

        {/* ─── 3D ATOMIC ORBITAL RING 2: CYAN / TEAL (Tilted -55° X, 30° Y) ─── */}
        <motion.div
          animate={{
            rotateZ: [360, 0],
            scale: status === 'speaking' ? [1, 1.1, 1] : [1, 1.04, 1],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 2.8 : 6.5, ease: 'linear' },
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(-55deg) rotateY(30deg)',
          }}
          className="absolute inset-1 rounded-full border-[2.5px] border-cyan-400/85 border-t-cyan-200 border-b-teal-500 shadow-[0_0_16px_rgba(34,211,238,0.85)] pointer-events-none"
        >
          {/* Glowing Photon Bead on Cyan Ring */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
        </motion.div>

        {/* ─── 3D ATOMIC ORBITAL RING 3: GOLD / AMBER (Tilted 70° X) ─── */}
        <motion.div
          animate={{
            rotateZ: [0, 360],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: 9, ease: 'linear' },
          }}
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(70deg)',
          }}
          className="absolute inset-4 rounded-full border border-amber-300/40 border-t-amber-200/90 shadow-[0_0_10px_rgba(252,211,77,0.4)] pointer-events-none"
        />

        {/* ─── CENTER FLOATING 3D PRISMATIC DELTA / TRIANGLE CRYSTAL CORE ─── */}
        <motion.div
          animate={{
            rotateY: [0, 360],
            scale: status === 'speaking' ? [1, 1.18, 0.95, 1.15, 1] : status === 'listening' ? [1, 1.08, 1] : [1, 1.05, 1],
          }}
          transition={{
            rotateY: { repeat: Infinity, duration: status === 'thinking' ? 3 : 8, ease: 'linear' },
            scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`relative ${cfg.core} flex items-center justify-center z-20 cursor-pointer`}
        >
          {/* 3D Cyan Triangular Prism Play-Glyph (Matching Image) */}
          <div className="relative w-full h-full flex items-center justify-center filter drop-shadow-[0_0_18px_rgba(34,211,238,0.9)]">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full transform transition-transform"
            >
              <defs>
                <linearGradient id="triGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="triTopFace" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.3" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 3D Isometric Extrusion Shadow/Bottom Face */}
              <polygon
                points="30,22 82,52 30,82"
                fill="#0e7490"
                opacity="0.7"
                transform="translate(4, 6)"
              />

              {/* Main Glowing 3D Triangular Prism Face */}
              <polygon
                points="28,20 80,50 28,80"
                fill="url(#triGradient)"
                stroke="#a5f3fc"
                strokeWidth="2.5"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Internal Glass Highlight Facet */}
              <polygon
                points="30,24 74,50 30,50"
                fill="url(#triTopFace)"
                opacity="0.75"
              />
            </svg>

            {/* Micro Audio Equalizer Pulse in Center when Speaking */}
            {status === 'speaking' && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                {[1, 2, 3].map((b) => (
                  <motion.div
                    key={b}
                    animate={{ height: [3, 12, 3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.4,
                      delay: b * 0.1,
                      ease: 'easeInOut',
                    }}
                    className="w-0.5 rounded-full bg-white shadow-[0_0_6px_#fff]"
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ─── 3. ILLUMINATED CYBERNETIC HOLOGRAPHIC PEDESTAL BASE ────────── */}
      {showPedestal && (
        <div className={`relative ${cfg.pedestal} flex items-center justify-center z-10`}>
          {/* Base Ambient Underglow */}
          <div className="absolute inset-0 bg-cyan-400/40 blur-lg rounded-full" />

          {/* Outer Metallic Beveled Platform Base Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 border border-teal-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center">
            {/* Outer Cyan Cyber LED Track */}
            <div className="absolute inset-0.5 rounded-full border border-cyan-400/40 border-dashed" />

            {/* Glowing Emitter Disk Center */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 10px rgba(34,211,238,0.7)',
                  '0 0 22px rgba(34,211,238,1)',
                  '0 0 10px rgba(34,211,238,0.7)',
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="w-3/5 h-3/5 rounded-full bg-gradient-to-tr from-cyan-300 via-teal-300 to-cyan-100 border border-white/80 shadow-[0_0_15px_#22d3ee]"
            />

            {/* Perimeter Micro LED Sparkle Nodes */}
            <div className="absolute left-3 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
            <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff]" />
          </div>
        </div>
      )}
    </div>
  );
}
