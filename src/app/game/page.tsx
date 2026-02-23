'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/game-store';
import { GameHeader } from '@/components/game/GameHeader';
import { CharacterDisplay } from '@/components/game/CharacterDisplay';
import { StatusBar } from '@/components/game/StatusBar';
import { ActionButtons } from '@/components/game/ActionButtons';
import { MessageToast } from '@/components/game/MessageToast';
import { NewEggScreen } from '@/components/game/NewEggScreen';
import { getBackgroundPlaceholder } from '@/lib/character-images';

export default function GamePage() {
  const { character, species, isLoading, loadCharacter, recalculateStatus } = useGameStore();
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  // 1分ごとにステータス再計算
  useEffect(() => {
    if (!character) return;
    const interval = setInterval(() => {
      recalculateStatus();
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, [character, recalculateStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">🥚</div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // キャラクターが居ない場合は新しいたまごスクリーン
  if (!character) {
    return <NewEggScreen />;
  }

  const bgGradient = getBackgroundPlaceholder(currentHour);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: bgGradient }}
    >
      <GameHeader />
      <MessageToast />

      <main className="flex-1 flex flex-col items-center justify-between max-w-lg mx-auto w-full p-4 pb-6">
        {/* キャラクター表示エリア */}
        <div className="flex-1 flex items-center justify-center w-full">
          <CharacterDisplay character={character} species={species} />
        </div>

        {/* ステータスバー */}
        <div className="w-full space-y-2 mb-4 bg-white/60 backdrop-blur-sm rounded-xl p-4">
          <StatusBar
            label="おなか"
            value={character.hunger}
            color="bg-orange-400"
            icon="🍔"
          />
          <StatusBar
            label="きもち"
            value={character.happiness}
            color="bg-pink-400"
            icon="💕"
          />
          <StatusBar
            label="たいりょく"
            value={character.stamina}
            color="bg-green-400"
            icon="💪"
          />
          <StatusBar
            label="きれいさ"
            value={character.cleanliness}
            color="bg-blue-400"
            icon="✨"
          />
          <div className="flex justify-between text-xs text-gray-500 pt-1">
            <span>体重: {character.weight}g</span>
            <span>しつけ: {character.discipline}/100</span>
            {character.is_sick && <span className="text-red-500 font-bold">🤒 病気中</span>}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="w-full">
          <ActionButtons />
        </div>
      </main>
    </div>
  );
}
