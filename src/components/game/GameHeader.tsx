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

  // アウトラインアイコン定義（SVG）
  const menuItems = [
    { label: 'ミッション', icon: 'mission', onClick: () => { onOpenMissions(); setMenuOpen(false); }, badge: missionBadge },
    { label: '実績', icon: 'trophy', onClick: () => { onOpenAchievements(); setMenuOpen(false); }, badge: 0 },
    { label: '図鑑', icon: 'book', onClick: () => { router.push('/game/encyclopedia'); setMenuOpen(false); }, badge: 0 },
    { label: 'バトル&協力', icon: 'battle', onClick: () => { router.push('/game/battle'); setMenuOpen(false); }, badge: 0 },
    { label: '家系図', icon: 'tree', onClick: () => { router.push('/game/family-tree'); setMenuOpen(false); }, badge: 0 },
    { label: 'ログアウト', icon: 'logout', onClick: () => { handleLogout(); setMenuOpen(false); }, badge: 0 },
  ];

  return (
    <header className="relative z-40">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {/* 左: 時計 */}
        <div className="glass rounded-full px-4 py-1.5 shadow-sm">
          <span className="text-warm-700 text-sm font-medium tabular-nums tracking-relaxed">{timeString}</span>
        </div>

        {/* 中央: 世代・日数 */}
        {character && (
          <div className="flex items-center gap-1.5">
            <span className="glass rounded-full text-warm-600 text-xs font-medium px-3 py-1 tracking-relaxed shadow-sm">
              {character.generation}代目
            </span>
            <span className="glass rounded-full text-warm-600 text-xs font-medium px-3 py-1 tracking-relaxed shadow-sm">
              {character.age_days}日目
            </span>
          </div>
        )}

        {/* 右: メニューボタン */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative glass rounded-full w-10 h-10 flex items-center justify-center text-warm-600 hover:bg-white/70 transition active:scale-95 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-dusty-400 rounded-full text-[9px] text-white font-medium flex items-center justify-center shadow-sm">
              {missionBadge}
            </span>
          )}
        </button>
      </div>

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
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-4 top-full mt-1 z-50 w-52 glass-warm rounded-2xl shadow-lg overflow-hidden"
            >
              {menuItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-warm-100/60 active:bg-warm-200/50 transition text-sm tracking-relaxed ${
                    i < menuItems.length - 1 ? 'border-b border-warm-200/40' : ''
                  } ${item.label === 'ログアウト' ? 'text-warm-400' : 'text-warm-700'}`}
                >
                  <span className="w-7 flex justify-center">
                    <MenuIcon type={item.icon} />
                  </span>
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-dusty-400 text-white text-[9px] font-medium w-5 h-5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

/** 細いラインのアウトラインアイコン */
function MenuIcon({ type }: { type: string }) {
  const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case 'mission':
      return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="14" y2="12" /><line x1="8" y1="16" x2="12" y2="16" /></svg>;
    case 'trophy':
      return <svg {...props}><path d="M6 9a6 6 0 0 0 12 0V3H6v6z" /><path d="M12 15v3" /><path d="M8 21h8" /><path d="M6 3H3v3a3 3 0 0 0 3 3" /><path d="M18 3h3v3a3 3 0 0 1-3 3" /></svg>;
    case 'book':
      return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    case 'battle':
      return <svg {...props}><path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" /></svg>;
    case 'tree':
      return <svg {...props}><path d="M12 22V8" /><path d="M5 12H2a10 10 0 0 0 20 0h-3" /><circle cx="12" cy="5" r="3" /></svg>;
    case 'logout':
      return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    default:
      return null;
  }
}
