'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import {
  calculateTimeElapsed,
  feedAction,
  snackAction,
  playAction,
  cleanAction,
  cureAction,
  disciplineAction,
  sleepAction,
  walkAction,
} from '@/lib/game-logic';
import { generateDailyMissions, getMatchingMissionTypes } from '@/lib/daily-missions';
import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];
type Species = Database['public']['Tables']['species']['Row'];
type DailyMission = Database['public']['Tables']['daily_missions']['Row'];
type Achievement = Database['public']['Tables']['achievements']['Row'];
type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

/** Supabase update + select の結果を Character にキャストするヘルパー */
async function updateCharacter(
  characterId: string,
  updates: Record<string, unknown>
): Promise<Character | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('characters')
    .update(updates)
    .eq('id', characterId)
    .select()
    .single();
  return data ? (data as unknown as Character) : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface GameState {
  // データ
  character: Character | null;
  species: Species | null;
  allSpecies: Species[];
  isLoading: boolean;
  error: string | null;
  message: string | null;
  dailyMissions: DailyMission[];
  allAchievements: Achievement[];
  userAchievements: UserAchievement[];

  // 統計（実績チェック用、セッション内カウント）
  sessionStats: {
    feedCount: number;
    cleanCount: number;
    cureCount: number;
    gamePlayCount: number;
    gameWinCount: number;
    jankenPerfect: boolean;
    memoryFastClear: boolean;
    rareWalkEvent: boolean;
  };

  // アクション
  loadCharacter: () => Promise<void>;
  createNewEgg: (name?: string) => Promise<void>;
  recalculateStatus: () => Promise<void>;
  feed: (foodType: 'onigiri' | 'bread' | 'cake') => Promise<void>;
  giveSnack: () => Promise<void>;
  playMiniGame: (gameType: string, score: number, extra?: { fastClear?: boolean }) => Promise<void>;
  clean: () => Promise<void>;
  cure: () => Promise<void>;
  discipline: () => Promise<void>;
  toggleSleep: () => Promise<void>;
  walk: (effects: Record<string, number>, rareEvent: boolean) => Promise<void>;
  nameCharacter: (name: string) => Promise<void>;
  setMessage: (msg: string) => void;
  clearMessage: () => void;
  loadDailyMissions: () => Promise<void>;
  progressMission: (actionType: string) => Promise<void>;
  claimMissionReward: (missionId: string) => Promise<void>;
  loadAchievements: () => Promise<void>;
  checkAchievements: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  character: null,
  species: null,
  allSpecies: [],
  isLoading: true,
  error: null,
  message: null,
  dailyMissions: [],
  allAchievements: [],
  userAchievements: [],
  sessionStats: {
    feedCount: 0, cleanCount: 0, cureCount: 0,
    gamePlayCount: 0, gameWinCount: 0,
    jankenPerfect: false, memoryFastClear: false, rareWalkEvent: false,
  },

  loadCharacter: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();

    try {
      const { data: rawSpecies } = await supabase.from('species').select('*');
      const speciesData = (rawSpecies || []) as Species[];
      set({ allSpecies: speciesData });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'ログインしてください' });
        return;
      }

      const { data: rawChars } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_alive', true)
        .limit(1);
      const charList = (rawChars || []) as Character[];
      const characters = charList.length > 0 ? charList[0] : null;

      if (characters) {
        const species = speciesData.find(s => s.id === characters.species_id) || null;
        set({ character: characters, species, isLoading: false });
        get().recalculateStatus();
      } else {
        set({ character: null, species: null, isLoading: false });
      }

      // 並行してミッション・実績をロード
      get().loadDailyMissions();
      get().loadAchievements();
      // ログインミッション進捗
      get().progressMission('login');
    } catch {
      set({ isLoading: false });
    }
  },

  createNewEgg: async (name) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const babySpeciesId = gender === 'male'
      ? '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000002';

    const { data: history } = await supabase
      .from('character_history')
      .select('*')
      .eq('user_id', user.id)
      .order('generation', { ascending: false })
      .limit(1);

    const histList = (history || []) as Array<{ generation: number }>;
    const generation = histList.length > 0 ? histList[0].generation + 1 : 1;

    const { data: rawNew, error } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        name: name || '',
        species_id: babySpeciesId,
        gender: gender as 'male' | 'female',
        generation,
        gene: {
          bodyColor: gender === 'male' ? 'blue' : 'pink',
          eyeType: 'round',
          personality: 'neutral',
        },
      })
      .select()
      .single();

    if (error || !rawNew) {
      set({ error: `キャラクター作成に失敗しました: ${error?.message}` });
      return;
    }

    const newChar = rawNew as unknown as Character;
    const species = get().allSpecies.find(s => s.id === newChar.species_id) || null;
    set({ character: newChar, species, message: 'たまごが生まれた！' });
  },

  recalculateStatus: async () => {
    const { character } = get();
    if (!character) return;

    const result = calculateTimeElapsed(character);
    const updated = await updateCharacter(character.id, result.updates);

    if (updated) {
      set({ character: updated });
    }

    if (result.gotSick) {
      set({ message: `${character.name || 'キャラクター'}が病気になっちゃった...` });
    } else if (result.poopGenerated) {
      set({ message: 'うんちが出たよ！掃除してあげて！' });
    } else if (result.careMissOccurred) {
      set({ message: 'お世話が足りていないみたい...' });
    }
  },

  feed: async (foodType) => {
    const { character } = get();
    if (!character) return;

    const result = feedAction(character, foodType);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set(state => ({
        character: updated,
        message: result.message,
        sessionStats: { ...state.sessionStats, feedCount: state.sessionStats.feedCount + 1 },
      }));
      get().progressMission('feed');
      get().checkAchievements();
    }
  },

  giveSnack: async () => {
    const { character } = get();
    if (!character) return;

    const result = snackAction(character);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set({ character: updated, message: result.message });
      get().progressMission('snack');
    }
  },

  playMiniGame: async (gameType, gameScore, extra) => {
    const { character } = get();
    if (!character) return;

    const result = playAction(character, gameScore);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    // ミニゲーム個別クールダウンを更新
    const cooldowns = { ...((character.mini_game_cooldowns || {}) as Record<string, string>) };
    cooldowns[gameType] = new Date().toISOString();

    const updates = { ...result.updates!, mini_game_cooldowns: cooldowns };
    const updated = await updateCharacter(character.id, updates);

    if (updated) {
      const isWin = gameScore >= 2;
      set(state => ({
        character: updated,
        message: result.message,
        sessionStats: {
          ...state.sessionStats,
          gamePlayCount: state.sessionStats.gamePlayCount + 1,
          gameWinCount: state.sessionStats.gameWinCount + (isWin ? 1 : 0),
          jankenPerfect: state.sessionStats.jankenPerfect || (gameType === 'janken' && gameScore >= 3),
          memoryFastClear: state.sessionStats.memoryFastClear || (gameType === 'memory' && !!extra?.fastClear),
        },
      }));
      get().progressMission('game_play');
      if (isWin) get().progressMission('game_win');
      get().checkAchievements();
    }
  },

  clean: async () => {
    const { character } = get();
    if (!character) return;

    const result = cleanAction(character);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set(state => ({
        character: updated,
        message: result.message,
        sessionStats: { ...state.sessionStats, cleanCount: state.sessionStats.cleanCount + 1 },
      }));
      get().progressMission('clean');
      get().checkAchievements();
    }
  },

  cure: async () => {
    const { character } = get();
    if (!character) return;

    const result = cureAction(character);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set(state => ({
        character: updated,
        message: result.message,
        sessionStats: { ...state.sessionStats, cureCount: state.sessionStats.cureCount + 1 },
      }));
      get().checkAchievements();
    }
  },

  discipline: async () => {
    const { character } = get();
    if (!character) return;

    const result = disciplineAction(character);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set({ character: updated, message: result.message });
      get().progressMission('discipline');
    }
  },

  toggleSleep: async () => {
    const { character } = get();
    if (!character) return;

    const result = sleepAction(character);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set({ character: updated, message: result.message });
    }
  },

  walk: async (effects, rareEvent) => {
    const { character } = get();
    if (!character) return;

    const result = walkAction(character);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    // 散歩効果をパラメータに反映
    const walkUpdates: Record<string, unknown> = { ...result.updates };
    if (effects.happiness) walkUpdates.happiness = clamp(character.happiness + effects.happiness, 0, 100);
    if (effects.hunger) walkUpdates.hunger = clamp(character.hunger + effects.hunger, 0, 100);
    if (effects.stamina) walkUpdates.stamina = clamp(character.stamina + effects.stamina, 0, 100);
    if (effects.weight) walkUpdates.weight = clamp(character.weight + effects.weight, 1, 99);
    if (effects.cleanliness) walkUpdates.cleanliness = clamp(character.cleanliness + effects.cleanliness, 0, 100);

    const updated = await updateCharacter(character.id, walkUpdates);
    if (updated) {
      set(state => ({
        character: updated,
        sessionStats: { ...state.sessionStats, rareWalkEvent: state.sessionStats.rareWalkEvent || rareEvent },
      }));
      get().progressMission('walk');
      get().checkAchievements();
    }
  },

  nameCharacter: async (name: string) => {
    const { character } = get();
    if (!character) return;

    const updated = await updateCharacter(character.id, { name });
    if (updated) {
      set({ character: updated, message: `「${name}」と名付けました！` });
    }
  },

  setMessage: (msg) => set({ message: msg }),
  clearMessage: () => set({ message: null }),

  // ===== デイリーミッション =====

  loadDailyMissions: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);

    const { data: rawMissions } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', user.id)
      .eq('mission_date', today);

    const missions = (rawMissions || []) as DailyMission[];

    if (missions.length === 0) {
      const templates = generateDailyMissions();
      const inserts = templates.map(t => ({
        user_id: user.id,
        mission_type: t.type,
        mission_label: t.label,
        target_count: t.targetCount,
        reward_type: t.rewardType,
        reward_amount: t.rewardAmount,
        mission_date: today,
      }));

      const { data: rawInserted } = await supabase
        .from('daily_missions')
        .insert(inserts)
        .select();

      set({ dailyMissions: (rawInserted || []) as DailyMission[] });
    } else {
      set({ dailyMissions: missions });
    }
  },

  progressMission: async (actionType: string) => {
    const { dailyMissions } = get();
    const matchTypes = getMatchingMissionTypes(actionType);
    const supabase = createClient();

    let updated = false;
    for (const mission of dailyMissions) {
      if (mission.is_completed) continue;
      if (!matchTypes.includes(mission.mission_type)) continue;

      const newCount = Math.min(mission.current_count + 1, mission.target_count);
      const isCompleted = newCount >= mission.target_count;

      await supabase
        .from('daily_missions')
        .update({ current_count: newCount, is_completed: isCompleted })
        .eq('id', mission.id);

      updated = true;
    }

    if (updated) {
      get().loadDailyMissions();
    }
  },

  claimMissionReward: async (missionId: string) => {
    const { character, dailyMissions } = get();
    if (!character) return;

    const mission = dailyMissions.find(m => m.id === missionId);
    if (!mission || !mission.is_completed) return;

    // 報酬を適用
    const rewardKey = mission.reward_type as keyof Character;
    const currentVal = character[rewardKey];
    if (typeof currentVal !== 'number') return;

    const newVal = clamp(currentVal + mission.reward_amount, 0, 100);
    const updated = await updateCharacter(character.id, { [rewardKey]: newVal });

    if (updated) {
      set({ character: updated, message: `ミッション報酬をゲット！` });
    }

    // ミッションをDBから削除
    const supabase = createClient();
    await supabase.from('daily_missions').delete().eq('id', missionId);
    set({ dailyMissions: dailyMissions.filter(m => m.id !== missionId) });

    get().checkAchievements();
  },

  // ===== 実績 =====

  loadAchievements: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from('achievements').select('*'),
      supabase.from('user_achievements').select('*').eq('user_id', user.id),
    ]);

    set({
      allAchievements: (achievementsRes.data || []) as Achievement[],
      userAchievements: (userAchievementsRes.data || []) as UserAchievement[],
    });
  },

  checkAchievements: async () => {
    const { character, allAchievements, userAchievements, sessionStats } = get();
    if (!character || allAchievements.length === 0) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const newUnlocks: string[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.condition_type) {
        case 'feed_count':
          shouldUnlock = sessionStats.feedCount >= achievement.condition_value;
          break;
        case 'clean_count':
          shouldUnlock = sessionStats.cleanCount >= achievement.condition_value;
          break;
        case 'cure_count':
          shouldUnlock = sessionStats.cureCount >= achievement.condition_value;
          break;
        case 'game_play_count':
          shouldUnlock = character.mini_game_play_count >= achievement.condition_value;
          break;
        case 'janken_perfect':
          shouldUnlock = sessionStats.jankenPerfect;
          break;
        case 'memory_fast_clear':
          shouldUnlock = sessionStats.memoryFastClear;
          break;
        case 'walk_count':
          shouldUnlock = (character.walk_count || 0) >= achievement.condition_value;
          break;
        case 'rare_event':
          shouldUnlock = sessionStats.rareWalkEvent;
          break;
        case 'reach_adult':
          shouldUnlock = character.stage === 'adult';
          break;
        case 'generation':
          shouldUnlock = character.generation >= achievement.condition_value;
          break;
      }

      if (shouldUnlock) {
        newUnlocks.push(achievement.id);
      }
    }

    if (newUnlocks.length > 0) {
      const inserts = newUnlocks.map(achievementId => ({
        user_id: user.id,
        achievement_id: achievementId,
      }));

      await supabase.from('user_achievements').insert(inserts);

      const unlockedAchievement = allAchievements.find(a => a.id === newUnlocks[0]);
      if (unlockedAchievement) {
        set({ message: `実績解除！ ${unlockedAchievement.icon} ${unlockedAchievement.name}` });
      }

      get().loadAchievements();
    }
  },
}));
