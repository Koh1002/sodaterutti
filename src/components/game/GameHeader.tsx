'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/game-store';

interface GameHeaderProps {
  onOpenMissions: () => void;
  onOpenAchievements: () => void;
}

export function GameHeader({ onOpenMissions, onOpenAchievements }: GameHeaderProps) {
  const { character, dailyMissions } = useGameStore();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const timeString = currentTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const completedMissions = dailyMissions.filter(m => m.is_completed).length;
  const activeMissions = dailyMissions.filter(m => !m.is_completed).length;
  const missionBadge = completedMissions > 0 ? completedMissions : activeMissions > 0 ? activeMissions : 0;

  const menuItems = [
    { label: 'ミッション', icon: '📋', onClick: () => { onOpenMissions(); setMenuOpen(false); }, badge: missionBadge },
    { label: '実績', icon: '🏆', onClick: () => { onOpenAchievements(); setMenuOpen(false); }, badge: 0 },
    { label: '図鑑', icon: '📖', onClick: () => { router.push('/game/encyclopedia'); setMenuOpen(false); }, badge: 0 },
    { label: 'バトル&協力', icon: '⚔️', onClick: () => { router.push('/game/battle'); setMenuOpen(false); }, badge: 0 },
    { label: '家系図', icon: '🌳', onClick: () => { router.push('/game/family-tree'); setMenuOpen(false); }, badge: 0 },
    { label: 'ログアウト', icon: '↩️', onClick: () => { handleLogout(); setMenuOpen(false); }, badge: 0 },
  ];

  return (
    <>
      <header className="relative z-30">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* 左: 時計 */}
          <div className="bg-black/15 backdrop-blur-md rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
            <span className="text-white/90 text-sm font-bold tabular-nums">{timeString}</span>
          </div>

          {/* 中央: 世代・日数 */}
          {character && (
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {character.generation}代目
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {character.age_days}日目
              </span>
            </div>
          )}

          {/* 右: メニューボタン */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative bg-black/15 backdrop-blur-md rounded-full w-9 h-9 flex items-center justify-center text-white/90 hover:bg-black/25 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
            {missionBadge > 0 && !menuOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {missionBadge}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ドロップダウンメニュー */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-4 top-14 z-50 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden"
            >
              {menuItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100/80 transition text-sm ${
                    i < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                  } ${item.label === 'ログアウト' ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  <span className="text-base w-6 text-center">{item.icon}</span>
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
