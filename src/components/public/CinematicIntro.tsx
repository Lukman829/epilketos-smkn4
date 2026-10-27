'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CinematicIntro() {
  const [visible, setVisible] = useState<boolean>(false);

  const handleDismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('epilketos_intro_seen', 'true');
      } catch {}
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hasSeen = sessionStorage.getItem('epilketos_intro_seen');
      if (!hasSeen) {
        setVisible(true);
        const timer = setTimeout(() => {
          handleDismiss();
        }, 2000); // 2 seconds gentle intro
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cinematic-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC] overflow-hidden"
        >
          {/* Soft silver geometric ring in background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="w-[500px] h-[500px] border border-slate-200 rounded-full"
            />
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.0, opacity: 1 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
              className="absolute w-[360px] h-[360px] border border-slate-300 rounded-full"
            />
          </div>

          <div className="relative text-center px-6 max-w-lg z-10">
            {/* School Emblem / Symbol - Clean Silver & Deep Navy */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md mb-6 flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-mono font-black text-lg tracking-wider">
                <span className="text-blue-400">4</span>SK
              </div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-xs uppercase tracking-[0.25em] font-mono text-slate-500 font-semibold mb-2"
            >
              SMKN 4 KOTA SERANG
            </motion.p>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2"
            >
              E-PILKETOS
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-xs sm:text-sm text-slate-600 font-medium tracking-wide"
            >
              Pemilihan Ketua &amp; Wakil Ketua OSIS
            </motion.p>

            {/* Skip Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-8"
            >
              <button
                onClick={handleDismiss}
                className="text-xs font-mono tracking-wider uppercase text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full border border-slate-300 hover:border-slate-400 bg-white transition-colors shadow-sm"
              >
                Lewati Intro ➔
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}