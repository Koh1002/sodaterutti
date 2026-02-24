'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const activeMissions = dailyMissions.filter(m => !m.is_completed).length;
  const completedMissions = dailyMissions.filter(m => m.is_completed).length;

  const menuItems = [
    {
      label: 'ミッション',
      icon: '📋',
      onClick: onOpenMissions,
      badge: completedMissions > 0 ? completedMissions : activeMissions > 0 ? activeMissions : null,
      badgeColor: completedMissions > 0 ? 'bg-green-400' : 'bg-yellow-400',
    },
    {
      label: '実績',
      icon: '🏆',
      onClick: onOpenAchievements,
      badge: null,
      badgeColor: '',
    },
    {
      label: '図鑑',
      icon: '📖',
      onClick: () => router.push('/game/encyclopedia'),
      badge: null,
      badgeColor: '',
    },
    {
      label: '家系図',
      icon: '🌳',
      onClick: () => router.push('/game/family-tree'),
      badge: null,
      badgeColor: '',
    },
    {
      label: 'ログアウト',
      icon: '↩️',
      onClick: handleLogout,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <header className="bg-gradient-to-r from-purple-500/90 to-pink-400/90 backdrop-blur-md shadow-lg">
      <div className="max-w-lg mx-auto px-4">
        {/* 1段目: 時計・世代・日数 */}
        <div className="flex items-center justify-center gap-4 py-2.5 border-b border-white/20">
          <span className="text-white font-bold text-lg tracking-wide">
            {timeString}
          </span>
          {character && (
            <>
              <span className="bg-white/25 text-white text-sm font-bold px-3 py-0.5 rounded-full">
                {character.generation}代目
              </span>
              <span className="text-white/90 text-sm font-bold">
                {character.age_days}日目
              </span>
            </>
          )}
        </div>

        {/* 2段目: メニューボタン（ラベル付き） */}
        <div className="flex items-center justify-around py-1.5">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-white/15 active:bg-white/25 transition"
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="text-[10px] text-white/90 font-medium leading-tight">{item.label}</span>
              {item.badge && (
                <span className={`absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] ${item.badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
