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
} from '@/lib/game-logic';
import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];
type Species = Database['public']['Tables']['species']['Row'];

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

interface GameState {
  // データ
  character: Character | null;
  species: Species | null;
  allSpecies: Species[];
  isLoading: boolean;
  error: string | null;
  message: string | null;

  // アクション
  loadCharacter: () => Promise<void>;
  createNewEgg: (name?: string) => Promise<void>;
  recalculateStatus: () => Promise<void>;
  feed: (foodType: 'onigiri' | 'bread' | 'cake') => Promise<void>;
  giveSnack: () => Promise<void>;
  play: (gameScore: number) => Promise<void>;
  clean: () => Promise<void>;
  cure: () => Promise<void>;
  discipline: () => Promise<void>;
  toggleSleep: () => Promise<void>;
  nameCharacter: (name: string) => Promise<void>;
  clearMessage: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  character: null,
  species: null,
  allSpecies: [],
  isLoading: true,
  error: null,
  message: null,

  loadCharacter: async () => {
    set({ isLoading: true, error: null });
    const supabase = createClient();

    try {
      // 種族マスタ読み込み
      const { data: rawSpecies } = await supabase
        .from('species')
        .select('*');
      const speciesData = (rawSpecies || []) as Species[];
      set({ allSpecies: speciesData });

      // 現在のユーザー
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'ログインしてください' });
        return;
      }

      // 現在育成中のキャラクターを取得
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

        // 時間経過を反映
        get().recalculateStatus();
      } else {
        set({ character: null, species: null, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  createNewEgg: async (name) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ランダムで性別を決定
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const babySpeciesId = gender === 'male'
      ? '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000002';

    // 世代カウント（過去の最大世代 + 1）
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
      set({ character: updated, message: result.message });
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
    }
  },

  play: async (gameScore) => {
    const { character } = get();
    if (!character) return;

    const result = playAction(character, gameScore);
    if (!result.success) {
      set({ message: result.message });
      return;
    }

    const updated = await updateCharacter(character.id, result.updates!);
    if (updated) {
      set({ character: updated, message: result.message });
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
      set({ character: updated, message: result.message });
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
      set({ character: updated, message: result.message });
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

  nameCharacter: async (name: string) => {
    const { character } = get();
    if (!character) return;

    const updated = await updateCharacter(character.id, { name });

    if (updated) {
      set({ character: updated, message: `「${name}」と名付けました！` });
    }
  },

  clearMessage: () => set({ message: null }),
}));
