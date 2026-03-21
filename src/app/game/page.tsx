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
      <div className="min-h-screen bg-gradient-to-b from-cream-100 to-warm-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-3xl animate-bounce opacity-60">🥚</div>
          <p className="text-warm-400 font-medium text-sm tracking-relaxed">読み込み中...</p>
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
      {/* ヘッダー */}
      <GameHeader
        onOpenMissions={() => setShowMissions(true)}
        onOpenAchievements={() => setShowAchievements(true)}
      />
      <MessageToast />

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center max-w-lg mx-auto w-full px-4 pt-1 pb-56">
        {/* キャラクター表示エリア */}
        <div className="flex-1 flex items-center justify-center w-full">
          <CharacterDisplay character={character} species={species} />
        </div>

        {/* 体重・しつけ（グラスモーフィズムバッジ） */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <span className="glass rounded-full text-warm-600 text-xs font-medium px-4 py-1.5 shadow-sm tracking-relaxed">
            体重 {character.weight}g
          </span>
          <span className="glass rounded-full text-warm-600 text-xs font-medium px-4 py-1.5 shadow-sm tracking-relaxed">
            しつけ {character.discipline}/100
          </span>
        </div>

        {/* 結婚適齢期の通知 */}
        {isMarriageEligible && (
          <div className="w-full mt-4">
            <button
              onClick={() => loadMarriageCandidates()}
              className="w-full py-3.5 glass rounded-2xl text-dusty-500 font-medium shadow-sm hover:bg-white/70 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm tracking-relaxed border border-dusty-200/30"
            >
              <span className="opacity-60">♡</span>
              <span>結婚できるよ</span>
              <span className="opacity-60">♡</span>
            </button>
          </div>
        )}
      </main>

      {/* ボトムドック */}
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
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-dusty-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-6xl opacity-70"
        >
          ✧
        </motion.div>
        <h2 className="text-xl font-medium text-warm-700 tracking-relaxed">
          あたらしい子が生まれた
        </h2>
        <p className="text-warm-400 text-sm tracking-relaxed">
          名前をつけてあげましょう
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="名前を入力（省略可）"
          className="w-full px-4 py-3 border border-warm-200 rounded-xl focus:ring-2 focus:ring-dusty-300 focus:border-transparent outline-none text-center bg-white/60 backdrop-blur-sm text-warm-700 placeholder:text-warm-300 tracking-relaxed"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-dusty-400 text-white font-medium rounded-xl hover:bg-dusty-500 transition shadow-sm disabled:opacity-50 tracking-relaxed"
        >
          {name ? `「${name}」に決定` : 'スキップして始める'}
        </button>
      </motion.div>
    </div>
  );
}
