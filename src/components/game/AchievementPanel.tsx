'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';

interface AchievementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Achievement = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition_type: string;
  condition_value: number;
  created_at: string;
};

type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};

export function AchievementPanel({ isOpen, onClose }: AchievementPanelProps) {
  const { allAchievements, userAchievements } = useGameStore();

  const categories = [
    { key: 'care', label: 'お世話' },
    { key: 'game', label: 'ミニゲーム' },
    { key: 'walk', label: 'おさんぽ' },
    { key: 'growth', label: '成長' },
    { key: 'mission', label: 'ミッション' },
    { key: 'collection', label: 'コレクション' },
  ];

  const isUnlocked = (achievementId: string) =>
    (userAchievements as UserAchievement[]).some(ua => ua.achievement_id === achievementId);

  const unlockedCount = (allAchievements as Achievement[]).filter(a => isUnlocked(a.id)).length;
  const totalCount = (allAchievements as Achievement[]).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/15 backdrop-blur-[2px] flex items-end justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="glass rounded-t-4xl w-full max-w-lg p-5 pb-8 max-h-[80vh] overflow-y-auto shadow-soft-md"
          >
            <div className="flex justify-center pt-0 pb-2">
              <div className="w-9 h-[3px] bg-base-300/50 rounded-full" />
            </div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-text-primary tracking-airy">
                実績 <span className="font-num text-text-tertiary text-[10px]">({unlockedCount}/{totalCount})</span>
              </h3>
              <button onClick={onClose} className="text-text-tertiary text-lg hover:text-text-secondary transition press-effect">
                &times;
              </button>
            </div>

            {/* 進捗バー */}
            <div className="bg-base-200/40 rounded-full h-[4px] overflow-hidden mb-5">
              <div
                className="h-full bg-muted-blue/50 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-5">
              {categories.map(cat => {
                const catAchievements = (allAchievements as Achievement[]).filter(a => a.category === cat.key);
                if (catAchievements.length === 0) return null;

                return (
                  <div key={cat.key}>
                    <h4 className="text-[11px] font-medium text-text-secondary mb-2 tracking-airy">{cat.label}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {catAchievements.map(achievement => {
                        const unlocked = isUnlocked(achievement.id);
                        return (
                          <div
                            key={achievement.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                              unlocked
                                ? 'bg-muted-blue/8 border-muted-blue/15'
                                : 'bg-base-100/30 border-white/15 opacity-50'
                            }`}
                          >
                            <span className={`text-xl ${unlocked ? '' : 'grayscale opacity-60'}`}>
                              {achievement.icon}
                            </span>
                            <div className="flex-1">
                              <p className={`text-xs font-medium tracking-relaxed ${
                                unlocked ? 'text-text-primary' : 'text-text-tertiary'
                              }`}>
                                {achievement.name}
                              </p>
                              <p className="text-[10px] text-text-tertiary tracking-relaxed">
                                {unlocked ? achievement.description : '???'}
                              </p>
                            </div>
                            {unlocked && (
                              <span className="text-muted-sage text-sm">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
