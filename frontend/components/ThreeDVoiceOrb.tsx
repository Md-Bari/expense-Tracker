'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles, Cpu } from 'lucide-react';

interface ThreeDVoiceOrbProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  size?: 'sm' | 'md' | 'lg';
}

export default function ThreeDVoiceOrb({ status, size = 'lg' }: ThreeDVoiceOrbProps) {
  const isSm = size === 'sm';
  const containerSize = isSm ? 'w-40 h-40' : 'w-64 h-64 md:w-80 md:h-80';
  const coreSize = isSm ? 'w-20 h-20' : 'w-32 h-32 md:w-40 md:h-40';

  // Status colors & gradients
  const getGradient = () => {
    switch (status) {
      case 'listening':
        return 'from-cyan-500 via-indigo-600 to-blue-500';
      case 'thinking':
        return 'from-purple-600 via-pink-500 to-indigo-600';
      case 'speaking':
        return 'from-indigo-500 via-violet-500 to-emerald-400';
      default:
        return 'from-indigo-600 via-slate-600 to-purple-600';
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case 'listening':
        return 'shadow-[0_0_90px_rgba(6,182,212,0.6)]';
      case 'thinking':
        return 'shadow-[0_0_100px_rgba(236,72,153,0.7)]';
      case 'speaking':
        return 'shadow-[0_0_110px_rgba(16,185,129,0.7)]';
      default:
        return 'shadow-[0_0_60px_rgba(99,102,241,0.4)]';
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${containerSize} [perspective:1000px]`}>
      {/* Ambient Backlight Glow */}
      <motion.div
        animate={{
          scale: status === 'speaking' ? [1, 1.35, 1.05, 1.4, 1] : status === 'thinking' ? [1.1, 1.25, 1.1] : [1, 1.15, 1],
          opacity: status === 'speaking' ? [0.7, 0.95, 0.7] : [0.4, 0.7, 0.4],
        }}
        transition={{ repeat: Infinity, duration: status === 'speaking' ? 1.2 : 2.5, ease: 'easeInOut' }}
        className={`absolute inset-4 rounded-full bg-gradient-to-tr ${getGradient()} blur-3xl opacity-60 ${getGlowColor()}`}
      />

      {/* 3D Orbiting Outer Ring 1 (X-Axis Rotation) */}
      <motion.div
        animate={{
          rotateX: [65, 65],
          rotateZ: [0, 360],
          scale: status === 'speaking' ? [1, 1.12, 1] : [1, 1.05, 1],
        }}
        transition={{
          rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 3 : 8, ease: 'linear' },
          scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="absolute inset-0 rounded-full border border-cyan-400/30 border-t-cyan-400/90 border-r-indigo-500/80 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
      >
        {/* Orbital particles on Ring 1 */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
      </motion.div>

      {/* 3D Orbiting Outer Ring 2 (Y-Axis Rotation) */}
      <motion.div
        animate={{
          rotateY: [65, 65],
          rotateZ: [360, 0],
          scale: status === 'speaking' ? [1, 1.18, 1] : [1, 1.08, 1],
        }}
        transition={{
          rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 2.5 : 10, ease: 'linear' },
          scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="absolute inset-2 rounded-full border border-purple-500/30 border-b-pink-500/90 border-l-indigo-400/80 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
      >
        {/* Orbital particles on Ring 2 */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_12px_#f472b6]" />
      </motion.div>

      {/* 3D Orbiting Ring 3 (Diagonal 45deg tilt) */}
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
        className="absolute inset-6 rounded-full border border-dashed border-emerald-400/40 border-t-emerald-300/90 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
      />

      {/* Dynamic 3D Liquid Waves for Speaking State */}
      {status === 'speaking' && (
        <>
          {[1, 2, 3].map((wave) => (
            <motion.div
              key={wave}
              animate={{
                scale: [1, 1.6 + wave * 0.25],
                opacity: [0.8, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                delay: wave * 0.45,
                ease: 'easeOut',
              }}
              className="absolute inset-8 rounded-full border-2 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            />
          ))}
        </>
      )}

      {/* Core Glowing 3D Orb Sphere */}
      <motion.div
        animate={{
          scale: status === 'speaking' ? [1, 1.25, 0.95, 1.2, 1] : status === 'thinking' ? [1, 1.15, 1] : [1, 1.08, 1],
          rotateZ: [0, 360],
        }}
        transition={{
          scale: { repeat: Infinity, duration: status === 'speaking' ? 0.8 : 2, ease: 'easeInOut' },
          rotateZ: { repeat: Infinity, duration: status === 'thinking' ? 6 : 20, ease: 'linear' },
        }}
        className={`relative ${coreSize} rounded-full bg-gradient-to-br ${getGradient()} p-1 flex items-center justify-center ${getGlowColor()} border border-white/30 backdrop-blur-md`}
      >
        {/* Inner Liquid Texture Glass Layer */}
        <div className="w-full h-full rounded-full bg-slate-950/40 backdrop-blur-md flex items-center justify-center relative overflow-hidden border border-white/20">
          {/* Internal Shimmering Light Beams */}
          <motion.div
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent"
          />

          {/* Center Icon Indicator */}
          <div className="relative z-10 text-white flex flex-col items-center justify-center">
            {status === 'listening' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex flex-col items-center gap-1"
              >
                <Mic className="h-8 w-8 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              </motion.div>
            )}

            {status === 'thinking' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="flex flex-col items-center gap-1"
              >
                <Cpu className="h-8 w-8 text-pink-300 drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
              </motion.div>
            )}

            {status === 'speaking' && (
              <div className="flex items-center gap-1.5 h-8">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <motion.div
                    key={bar}
                    animate={{ height: [8, 28, 8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: bar * 0.08,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]"
                  />
                ))}
              </div>
            )}

            {status === 'idle' && (
              <Sparkles className="h-7 w-7 text-indigo-200 opacity-80 drop-shadow-[0_0_8px_rgba(199,210,254,0.7)]" />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
