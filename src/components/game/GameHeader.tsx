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

  return (
    <header className="bg-gradient-to-r from-purple-500/90 to-pink-400/90 backdrop-blur-md shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-base tracking-wide">
            {timeString}
          </span>
          {character && (
            <>
              <span className="bg-white/25 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                {character.generation}代目
              </span>
              <span className="text-white/90 text-sm font-medium">
                {character.age_days}日目
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenMissions}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 active:bg-white/30 transition text-lg"
          >
            📋
            {completedMissions > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-green-400 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {completedMissions}
              </span>
            )}
            {activeMissions > 0 && completedMissions === 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-yellow-400 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {activeMissions}
              </span>
            )}
          </button>
          <button
            onClick={onOpenAchievements}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 active:bg-white/30 transition text-lg"
          >
            🏆
          </button>
          <button
            onClick={() => router.push('/game/encyclopedia')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 active:bg-white/30 transition text-lg"
          >
            📖
          </button>
          <button
            onClick={() => router.push('/game/family-tree')}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 active:bg-white/30 transition text-lg"
          >
            🌳
          </button>
          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 active:bg-white/30 transition text-lg"
          >
            ↩️
          </button>
        </div>
      </div>
    </header>
  );
}
