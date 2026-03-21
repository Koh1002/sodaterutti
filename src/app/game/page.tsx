'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { GameHeader } from '@/components/game/GameHeader';
import { CharacterDisplay } from '@/components/game/CharacterDisplay';
import { ActionButtons } from '@/components/game/ActionButtons';
import { MessageToast } from '@/components/game/MessageToast';
import { NewEggScreen } from '@/components/game/NewEggScreen';
import { WalkScreen } from '@/components/game/WalkScreen';
import { DailyMissionPanel } from '@/components/game/DailyMissionPanel';
import { AchievementPanel } from '@/components/game/AchievementPanel';
import { EvolutionScreen } from '@/components/game/EvolutionScreen';
import { MarriageScreen } from '@/components/game/MarriageScreen';
import { GraveScreen } from '@/components/game/GraveScreen';
import { getBackgroundPlaceholder } from '@/lib/character-images';
import { walkAction } from '@/lib/game-logic';
import { checkStatNotifications } from '@/lib/stat-notifications';

export default function GamePage() {
  const {
    character, species, isLoading,
    loadCharacter, recalculateStatus, setMessage,
    evolutionInfo, completeEvolution,
    marriageCandidates, showMarriage, isMarriageEligible,
    loadMarriageCandidates, marry, dismissMarriage,
    deathInfo, restartAfterDeath,
    needsNaming, nameCharacter,
  } = useGameStore();

  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [showWalk, setShowWalk] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  // 1分ごとにステータス再計算
  useEffect(() => {
    if (!character) return;
    const interval = setInterval(() => {
      recalculateStatus();
      setCurrentHour(new Date().getHours());
      const current = useGameStore.getState().character;
      if (current) {
        checkStatNotifications({
          hunger: current.hunger,
          cleanliness: current.cleanliness,
          happiness: current.happiness,
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [character, recalculateStatus]);

  // 死亡画面
  if (deathInfo) {
    return (
      <GraveScreen
        characterName={deathInfo.characterName}
        species={deathInfo.species}
        ageDays={deathInfo.ageDays}
        generation={deathInfo.generation}
        cause={deathInfo.cause}
        onRestart={restartAfterDeath}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-bounce">🥚</div>
          <p className="text-gray-500 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return <NewEggScreen />;
  }

  // 結婚・死亡後の新キャラクター名付け画面
  if (needsNaming) {
    return <NamingScreen onName={nameCharacter} />;
  }

  const bgGradient = getBackgroundPlaceholder(currentHour);

  const handleWalk = () => {
    const result = walkAction(character);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    setShowWalk(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: bgGradient }}
    >
      {/* ヘッダー（ミニマル・半透明） */}
      <GameHeader
        onOpenMissions={() => setShowMissions(true)}
        onOpenAchievements={() => setShowAchievements(true)}
      />
      <MessageToast />

      {/* メインコンテンツ - キャラ表示が画面の大部分を占める */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4 pb-36">
        {/* キャラクター表示エリア */}
        <div className="flex-1 flex items-center justify-center w-full">
          <CharacterDisplay character={character} species={species} />
        </div>

        {/* 結婚適齢期の通知 */}
        {isMarriageEligible && (
          <div className="w-full mt-2">
            <button
              onClick={() => loadMarriageCandidates()}
              className="w-full py-3 bg-white/80 backdrop-blur-md text-pink-500 font-bold rounded-2xl shadow-sm hover:bg-white/90 transition flex items-center justify-center gap-2 text-sm border border-pink-200/50"
            >
              <span>💒</span>
              <span>結婚できるよ！</span>
              <span>💕</span>
            </button>
          </div>
        )}

        {/* 体重・しつけ（コンパクト表示） */}
        <div className="flex gap-3 mt-3">
          <span className="bg-white/30 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            体重 {character.weight}g
          </span>
          <span className="bg-white/30 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            しつけ {character.discipline}
          </span>
        </div>
      </main>

      {/* ボトムドック（固定位置・ActionButtons内で描画） */}
      <ActionButtons onWalk={handleWalk} />

      {/* おさんぽ画面 */}
      <AnimatePresence>
        {showWalk && <WalkScreen onClose={() => setShowWalk(false)} />}
      </AnimatePresence>

      {/* デイリーミッション */}
      <DailyMissionPanel isOpen={showMissions} onClose={() => setShowMissions(false)} />

      {/* 実績パネル */}
      <AchievementPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} />

      {/* 進化演出 */}
      <AnimatePresence>
        {evolutionInfo && (
          <EvolutionScreen
            fromSpecies={evolutionInfo.fromSpecies}
            toSpecies={evolutionInfo.toSpecies}
            characterName={character.name || species?.name || '???'}
            onComplete={completeEvolution}
          />
        )}
      </AnimatePresence>

      {/* 結婚画面 */}
      <AnimatePresence>
        {showMarriage && species && (
          <MarriageScreen
            characterName={character.name || species.name}
            characterSpecies={species}
            candidates={marriageCandidates}
            onSelect={marry}
            onClose={dismissMarriage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NamingScreen({ onName }: { onName: (name: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onName(name || '');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-8xl"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold text-purple-600">
          あたらしい子が生まれた！
        </h2>
        <p className="text-gray-500">
          名前をつけてあげましょう
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="名前を入力（省略可）"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-center"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition shadow-lg disabled:opacity-50"
        >
          {name ? `「${name}」に決定！` : 'スキップして始める'}
        </button>
      </motion.div>
    </div>
  );
}
