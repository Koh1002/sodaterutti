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
import { LoadingScreen } from '@/components/game/LoadingScreen';
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
    return <LoadingScreen isLoading={true} />;
  }

  if (!character) {
    return <NewEggScreen />;
  }

  if (needsNaming) {
    return <NamingScreen onName={nameCharacter} />;
  }

  const bgGradient = getBackgroundPlaceholder(currentHour);
  const isNight = currentHour >= 20 || currentHour < 6;

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
      data-night={isNight}
    >
      <GameHeader
        onOpenMissions={() => setShowMissions(true)}
        onOpenAchievements={() => setShowAchievements(true)}
      />
      <MessageToast />

      <main className="flex-1 flex flex-col items-center max-w-lg mx-auto w-full px-4 pt-1 pb-60">
        <div className="flex-1 flex items-center justify-center w-full">
          <CharacterDisplay character={character} species={species} />
        </div>

        {/* 体重・しつけ（グラスモーフィズム） */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <span className="glass rounded-full text-text-secondary text-[11px] font-medium px-4 py-1.5 shadow-soft tracking-relaxed">
            体重 <span className="font-num">{character.weight}g</span>
          </span>
          <span className="glass rounded-full text-text-secondary text-[11px] font-medium px-4 py-1.5 shadow-soft tracking-relaxed">
            しつけ <span className="font-num">{character.discipline}/100</span>
          </span>
        </div>

        {isMarriageEligible && (
          <div className="w-full mt-4">
            <button
              onClick={() => loadMarriageCandidates()}
              className="w-full py-3 glass rounded-2xl text-muted-rose font-medium shadow-soft hover:bg-white/50 active:scale-[0.98] transition flex items-center justify-center gap-2 text-xs tracking-airy press-effect"
            >
              <span className="opacity-50">♡</span>
              <span>結婚できるよ</span>
              <span className="opacity-50">♡</span>
            </button>
          </div>
        )}
      </main>

      <ActionButtons onWalk={handleWalk} />

      <AnimatePresence>
        {showWalk && <WalkScreen onClose={() => setShowWalk(false)} />}
      </AnimatePresence>

      <DailyMissionPanel isOpen={showMissions} onClose={() => setShowMissions(false)} />
      <AchievementPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} />

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
    <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1] }}
        className="text-center space-y-6 w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-4xl opacity-40"
        >
          ✧
        </motion.div>
        <h2 className="text-lg font-light text-text-primary tracking-airy">
          あたらしい子が生まれた
        </h2>
        <p className="text-text-tertiary text-xs tracking-relaxed">
          名前をつけてあげましょう
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="名前を入力（省略可）"
          className="w-full px-4 py-3 border border-base-200 rounded-2xl focus:ring-2 focus:ring-muted-blue/30 focus:border-muted-blue/40 outline-none text-center bg-white/40 backdrop-blur-sm text-text-primary placeholder:text-text-tertiary tracking-relaxed text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-muted-blue/80 text-white font-medium rounded-2xl hover:bg-muted-blue transition shadow-soft disabled:opacity-50 tracking-relaxed text-sm press-effect"
        >
          {name ? `「${name}」に決定` : 'スキップして始める'}
        </button>
      </motion.div>
    </div>
  );
}
