'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/game-store';

export function GameHeader() {
  const { character } = useGameStore();
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

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-2">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>🕐 {timeString}</span>
          {character && (
            <>
              <span className="text-purple-500 font-medium">
                {character.generation}代目
              </span>
              <span>{character.age_days}日目</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/game/encyclopedia')}
            className="text-xs px-2 py-1 rounded-lg hover:bg-purple-50 text-gray-500 transition"
          >
            📖 図鑑
          </button>
          <button
            onClick={() => router.push('/game/family-tree')}
            className="text-xs px-2 py-1 rounded-lg hover:bg-purple-50 text-gray-500 transition"
          >
            🌳 家系図
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-2 py-1 rounded-lg hover:bg-red-50 text-gray-400 transition"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
