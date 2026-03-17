'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { GameHeader } from '@/components/game/GameHeader';
import { CharacterDisplay } from '@/components/game/CharacterDisplay';
import { StatusBar } from '@/components/game/StatusBar';
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
      <GameHeader
        onOpenMissions={() => setShowMissions(true)}
        onOpenAchievements={() => setShowAchievements(true)}
      />
      <MessageToast />

      <main className="flex-1 flex flex-col items-center justify-between max-w-lg mx-auto w-full px-4 pt-2 pb-6">
        {/* キャラクター表示エリア */}
        <div className="flex-1 flex items-center justify-center w-full">
          <CharacterDisplay character={character} species={species} />
        </div>

        {/* 結婚適齢期の通知 */}
        {isMarriageEligible && (
          <div className="w-full mb-3">
            <button
              onClick={() => loadMarriageCandidates()}
              className="w-full py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold rounded-2xl shadow-lg hover:from-pink-500 hover:to-rose-500 transition flex items-center justify-center gap-2 text-base"
            >
              <span>💒</span>
              <span>結婚できるよ！</span>
              <span>💕</span>
            </button>
          </div>
        )}

        {/* ステータスバー */}
        <div className="w-full space-y-2.5 mb-4 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
          <StatusBar label="お腹" value={character.hunger} color="bg-orange-400" icon="🍔" />
          <StatusBar label="気持ち" value={character.happiness} color="bg-pink-400" icon="💕" />
          <StatusBar label="体力" value={character.stamina} color="bg-green-400" icon="💪" />
          <StatusBar label="清潔" value={character.cleanliness} color="bg-blue-400" icon="✨" />
          <div className="flex justify-between text-sm text-gray-500 pt-1 font-medium">
            <span>体重: {character.weight}g</span>
            <span>しつけ: {character.discipline}/100</span>
            {character.is_sick && <span className="text-red-500 font-bold">🤒 病気中</span>}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="w-full">
          <ActionButtons onWalk={handleWalk} />
        </div>
      </main>

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
