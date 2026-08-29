'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles, Cpu } from 'lucide-react';

interface ThreeDVoiceOrbProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  onClick?: () => void;
}

export default function ThreeDVoiceOrb({
  status,
  size = 'lg',
  className = '',
  onClick,
}: ThreeDVoiceOrbProps) {
  // Size metrics mapping
  const sizeConfig = {
    xs: { container: 'w-20 h-24', sphere: 'w-14 h-14', core: 'w-7 h-7', icon: 'h-3.5 w-3.5', uplight: 'w-14 h-3', beam: 'h-16', eqHeight: [3, 10, 3], eqWidth: 'w-0.5' },
    sm: { container: 'w-28 h-32', sphere: 'w-20 h-20', core: 'w-9 h-9', icon: 'h-4.5 w-4.5', uplight: 'w-20 h-4', beam: 'h-22', eqHeight: [4, 14, 4], eqWidth: 'w-0.5' },
    md: { container: 'w-40 h-48', sphere: 'w-28 h-28', core: 'w-12 h-12', icon: 'h-6 w-6', uplight: 'w-28 h-5', beam: 'h-32', eqHeight: [5, 20, 5], eqWidth: 'w-1' },
    lg: { container: 'w-56 h-64 sm:w-64 sm:h-72', sphere: 'w-40 h-40 sm:w-44 sm:h-44', core: 'w-16 h-16 sm:w-18 sm:h-18', icon: 'h-8 w-8', uplight: 'w-40 sm:w-48 h-6', beam: 'h-44 sm:h-48', eqHeight: [6, 28, 6], eqWidth: 'w-1.5' },
    xl: { container: 'w-72 h-80 sm:w-80 sm:h-96', sphere: 'w-52 h-52 sm:w-60 sm:h-60', core: 'w-20 h-20 sm:w-24 sm:h-24', icon: 'h-10 w-10', uplight: 'w-52 sm:w-60 h-7', beam: 'h-56 sm:h-64', eqHeight: [8, 36, 8], eqWidth: 'w-2' },
    hero: { container: 'w-88 h-96 sm:w-96 sm:h-[420px]', sphere: 'w-64 h-64 sm:w-72 sm:h-72', core: 'w-24 h-24 sm:w-28 sm:h-28', icon: 'h-12 w-12', uplight: 'w-64 sm:w-72 h-8', beam: 'h-68 sm:h-80', eqHeight: [10, 48, 10], eqWidth: 'w-2.5' },
  };

  const cfg = sizeConfig[size] || sizeConfig.lg;

  // Status colors & gradients
  const getGradient = () => {
    switch (status) {
      case 'listening':
        return 'from-cyan-400 via-teal-500 to-blue-600';
      case 'thinking':
        return 'from-fuchsia-500 via-purple-600 to-indigo-600';
      case 'speaking':
        return 'from-emerald-400 via-teal-500 to-cyan-500';
      default:
        return 'from-teal-400 via-cyan-500 to-indigo-600';
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case 'listening':
        return 'shadow-[0_0_80px_rgba(6,182,212,0.7)]';
      case 'thinking':
        return 'shadow-[0_0_90px_rgba(217,70,239,0.75)]';
      case 'speaking':
        return 'shadow-[0_0_90px_rgba(16,185,129,0.8)]';
      default:
        return 'shadow-[0_0_60px_rgba(13,165,148,0.55)]';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'listening':
        return 'border-cyan-300/60';
      case 'thinking':
        return 'border-fuchsia-400/60';
      case 'speaking':
        return 'border-emerald-300/60';
      default:
        return 'border-teal-400/50';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end select-none ${cfg.container} ${className}`}
    >
      {/* ─── 1. UPWARD HOLOGRAPHIC LIGHT BEAM (ILLUMINATING FROM BOTTOM) ───── */}
      <div className={`absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-4/5 ${cfg.beam} pointer-events-none z-0 overflow-hidden`}>
        {/* Soft Conical Light Beam Gradient */}
        <motion.div
          animate={{
            opacity: status === 'speaking' ? [0.65, 0.95, 0.65] : status === 'listening' ? [0.55, 0.85, 0.55] : [0.45, 0.7, 0.45],
          }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="w-full h-full bg-gradient-to-t from-cyan-400/40 via-teal-400/15 to-transparent [clip-path:polygon(20%_0%,80%_0%,100%_100%,0%_100%)]"
        />

        {/* Upward Floating Luminous Particles ascending into the orb */}
        {[1, 2, 3, 4, 5].map((p) => (
          <motion.div
            key={p}
            animate={{
              y: [0, -90],
              x: [0, p % 2 === 0 ? 6 : -6],
              opacity: [0, 0.9, 0],
              scale: [0.5, 1.2, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + p * 0.35,
              delay: p * 0.3,
              ease: 'easeInOut',
            }}
            className="absolute rounded-full bg-cyan-200 shadow-[0_0_8px_#22d3ee]"
            style={{
              bottom: '10%',
              left: `${20 + p * 12}%`,
              width: `${p % 2 === 0 ? 3 : 2}px`,
              height: `${p % 2 === 0 ? 3 : 2}px`,
            }}
          />
        ))}
      </div>

      {/* ─── 2. FLOATING 3D GYROSCOPIC ORB & ATOMIC RINGS ─────────────── */}
      <motion.div
        animate={{
          y: status === 'speaking' ? [-4, 6, -4] : [-3, 3, -3],
        }}
        transition={{
          repeat: Infinity,
          duration: status === 'speaking' ? 2 : 3.5,
          ease: 'easeInOut',
        }}
        className={`relative flex items-center justify-center ${cfg.sphere} mb-3 sm:mb-4 z-10 [perspective:1200px]`}
      >
        {/* Deep Volumetric Ambient Glow */}
        <motion.div
          animate={{
            scale: status === 'speaking' ? [1, 1.35, 1.05, 1.4, 1] : status === 'thinking' ? [1.1, 1.25, 1.1] : [1, 1.15, 1],
            opacity: status === 'speaking' ? [0.65, 0.95, 0.65] : status === 'listening' ? [0.55, 0.85, 0.55] : [0.4, 0.65, 0.4],
          }}
          transition={{ repeat: Infinity, duration: status === 'speaking' ? 1.4 : 2.5, ease: 'easeInOut' }}
          className={`absolute inset-2 rounded-full bg-gradient-to-tr ${getGradient()} blur-2xl md:blur-3xl opacity-70 ${getGlowColor()}`}
        />

        {/* Concentric Acoustic Soundwave Ripples */}
        {(status === 'speaking' || status === 'listening') && (
          <>
            {[1, 2, 3].map((wave) => (
              <motion.div
                key={wave}
                animate={{
                  scale: [1, 1.55 + wave * 0.3],
                  opacity: [0.75, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: status === 'speaking' ? 1.8 : 2.4,
                  delay: wave * 0.45,
                  ease: 'easeOut',
                }}
                className={`absolute inset-2 rounded-full border border-dashed ${
                  status === 'speaking' ? 'border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                }`}
              />
            ))}
          </>
        )}

        {/* 3D Floating Gyroscopic Ring 1 (Pink/Fuchsia Gyroscope) */}
        <motion.div
          animate={{
            rotateX: [65, 65],
            rotateZ: [0, 360],
            scale: status === 'speaking' ? [1, 1.12, 1] : [1, 1.04, 1],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 3.5 : status === 'speaking' ? 5 : 8, ease: 'linear' },
            scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className="absolute inset-1.5 rounded-full border-2 border-pink-400/40 border-t-pink-300 border-r-fuchsia-400 shadow-[0_0_18px_rgba(244,114,182,0.6)]"
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-pink-300 shadow-[0_0_14px_#f472b6]" />
          <div className="absolute -bottom-1 left-1/4 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-fuchsia-200 shadow-[0_0_8px_#e879f9]" />
        </motion.div>

        {/* 3D Floating Gyroscopic Ring 2 (Cyan/Teal Gyroscope) */}
        <motion.div
          animate={{
            rotateY: [65, 65],
            rotateZ: [360, 0],
            scale: status === 'speaking' ? [1, 1.15, 1] : [1, 1.05, 1],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 3 : status === 'speaking' ? 5.5 : 9.5, ease: 'linear' },
            scale: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className="absolute inset-1.5 rounded-full border-2 border-cyan-400/40 border-b-cyan-300 border-l-teal-400 shadow-[0_0_18px_rgba(34,211,238,0.6)]"
        >
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_14px_#22d3ee]" />
          <div className="absolute top-1 right-1/4 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-200 shadow-[0_0_8px_#2dd4bf]" />
        </motion.div>

        {/* 3D Diagonal Orbit Track */}
        <motion.div
          animate={{
            rotateX: [45, 45],
            rotateY: [45, 45],
            rotateZ: [0, 360],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 4 : 12, ease: 'linear' },
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className="absolute inset-3 rounded-full border border-dashed border-cyan-300/30 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
        />

        {/* Central Holographic Quantum Core Sphere */}
        <motion.div
          animate={{
            scale: status === 'speaking' ? [1, 1.15, 0.96, 1.12, 1] : status === 'thinking' ? [1, 1.08, 1] : [1, 1.03, 1],
          }}
          transition={{
            scale: { repeat: Infinity, duration: status === 'speaking' ? 0.9 : 2.2, ease: 'easeInOut' },
          }}
          className={`relative ${cfg.core} rounded-full bg-gradient-to-br ${getGradient()} p-1 flex items-center justify-center ${getGlowColor()} border-2 ${getBorderColor()} backdrop-blur-2xl shadow-2xl transition-all duration-500`}
        >
          <div className="w-full h-full rounded-full bg-slate-950/50 backdrop-blur-md flex items-center justify-center relative overflow-hidden border border-white/40">
            <motion.div
              animate={{
                rotate: [0, 360],
                opacity: [0.35, 0.9, 0.35],
              }}
              transition={{ repeat: Infinity, duration: status === 'thinking' ? 2 : 4.5, ease: 'linear' }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/60 via-cyan-400/25 to-transparent"
            />

            {/* Central State Indicator */}
            <div className="relative z-10 text-white flex flex-col items-center justify-center">
              {status === 'listening' && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Mic className={`${cfg.icon} text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.95)]`} />
                </motion.div>
              )}

              {status === 'thinking' && (
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.15, 1] }}
                  transition={{ rotate: { repeat: Infinity, duration: 2.2, ease: 'linear' }, scale: { repeat: Infinity, duration: 1.1, ease: 'easeInOut' } }}
                  className="flex flex-col items-center gap-1"
                >
                  <Cpu className={`${cfg.icon} text-fuchsia-300 drop-shadow-[0_0_14px_rgba(244,114,182,1)]`} />
                </motion.div>
              )}

              {status === 'speaking' && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <motion.div
                      key={bar}
                      animate={{ height: cfg.eqHeight }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.45,
                        delay: bar * 0.08,
                        ease: 'easeInOut',
                      }}
                      className={`${cfg.eqWidth} rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]`}
                    />
                  ))}
                </div>
              )}

              {status === 'idle' && (
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                >
                  <Sparkles className={`${cfg.icon} text-teal-200 drop-shadow-[0_0_12px_rgba(45,212,191,0.9)]`} />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── 3. LUMINOUS GLOWING UPLIGHT BASE EMITTER (LIGHTING FROM BOTTOM) ───── */}
      <div className={`relative ${cfg.uplight} flex items-center justify-center z-10`}>
        {/* Soft Radial Underglow */}
        <div className="absolute inset-0 bg-cyan-400/40 blur-md rounded-full" />

        {/* Luminous Elliptical Light Platform Ring */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-r from-teal-500/20 via-cyan-400/50 to-teal-500/20 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.7)] flex items-center justify-center backdrop-blur-sm">
          {/* Inner Bright Cyan Emitter Core */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(34,211,238,0.8), inset 0 0 6px #fff',
                '0 0 24px rgba(34,211,238,1), inset 0 0 10px #fff',
                '0 0 10px rgba(34,211,238,0.8), inset 0 0 6px #fff',
              ],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-3/5 h-2/3 rounded-full bg-gradient-to-r from-cyan-300 via-white to-cyan-300"
          />

          {/* Micro Ambient Sparkle Nodes */}
          <div className="absolute left-2 w-1 h-1 rounded-full bg-cyan-200 shadow-[0_0_4px_#22d3ee]" />
          <div className="absolute right-2 w-1 h-1 rounded-full bg-cyan-200 shadow-[0_0_4px_#22d3ee]" />
        </div>
      </div>
    </div>
  );
}
