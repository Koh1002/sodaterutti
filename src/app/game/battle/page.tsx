'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/game-store';
import { BattleScreen } from '@/components/game/BattleScreen';
import {
  calculateStrength, createBattler, createCpuBattler,
  type Battler,
} from '@/lib/battle-logic';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import type { Database } from '@/types/database';

type Species = Database['public']['Tables']['species']['Row'];

export default function BattlePage() {
  const router = useRouter();
  const { character, species, setMessage } = useGameStore();
  const [mode, setMode] = useState<'menu' | 'difficulty' | 'friend-menu' | 'battle'>('menu');
  const [playerBattler, setPlayerBattler] = useState<Battler | null>(null);
  const [opponentBattler, setOpponentBattler] = useState<Battler | null>(null);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);

  // フレンド対戦用
  const [friendCode, setFriendCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [friendSearchResult, setFriendSearchResult] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('species').select('*');
      if (data) setAllSpecies(data as Species[]);

      // 自分のフレンドコード = user_id の先頭8文字
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMyCode(user.id.slice(0, 8).toUpperCase());
    };
    load();
  }, []);

  if (!character || !species) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-500">キャラクターがいません</p>
      </div>
    );
  }

  const baseWeight = species.base_weight;
  const strength = calculateStrength({
    discipline: character.discipline,
    care_miss_count: character.care_miss_count,
    weight: character.weight,
    base_weight: baseWeight,
    mini_game_total_score: character.mini_game_total_score,
    mini_game_play_count: character.mini_game_play_count,
  });

  const startCpuBattle = (difficulty: 'easy' | 'normal' | 'hard') => {
    const player = createBattler(
      character.name || species.name,
      species.name,
      species.image_key,
      strength,
      character.hunger,
      character.happiness,
    );
    const cpu = createCpuBattler(difficulty);
    setPlayerBattler(player);
    setOpponentBattler(cpu);
    setMode('battle');
  };

  const searchFriend = async () => {
    if (friendCode.length < 4) return;
    const supabase = createClient();
    // フレンドコードでプロフィールを検索
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('id', `${friendCode.toLowerCase()}%`)
      .limit(1);

    if (data && data.length > 0) {
      const friendId = data[0].id;
      // フレンドのキャラクターを取得
      const { data: friendChar } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', friendId)
        .eq('is_alive', true)
        .limit(1);

      if (friendChar && friendChar.length > 0) {
        const fc = friendChar[0] as Database['public']['Tables']['characters']['Row'];
        const friendSpecies = allSpecies.find(s => s.id === fc.species_id);
        if (friendSpecies) {
          const friendStrength = calculateStrength({
            discipline: fc.discipline,
            care_miss_count: fc.care_miss_count,
            weight: fc.weight,
            base_weight: friendSpecies.base_weight,
            mini_game_total_score: fc.mini_game_total_score,
            mini_game_play_count: fc.mini_game_play_count,
          });

          const player = createBattler(
            character.name || species.name,
            species.name, species.image_key,
            strength, character.hunger, character.happiness,
          );
          const opp = createBattler(
            fc.name || friendSpecies.name,
            friendSpecies.name, friendSpecies.image_key,
            friendStrength, fc.hunger, fc.happiness,
          );
          setPlayerBattler(player);
          setOpponentBattler(opp);
          setFriendSearchResult(null);
          setMode('battle');
          return;
        }
      }
      setFriendSearchResult('フレンドのキャラクターが見つかりません');
    } else {
      setFriendSearchResult('コードが見つかりません');
    }
  };

  const handleBattleEnd = async (won: boolean) => {
    if (won) {
      // 報酬: なつき度+15, お腹+20
      const supabase = createClient();
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      await supabase
        .from('characters')
        .update({
          happiness: clamp(character.happiness + 15, 0, 100),
          hunger: clamp(character.hunger + 20, 0, 100),
        })
        .eq('id', character.id);
      setMessage('勝利ボーナス！ 気持ち+15 お腹+20');
    }
    setMode('menu');
    router.push('/game');
  };

  // バトル中
  if (mode === 'battle' && playerBattler && opponentBattler) {
    return (
      <AnimatePresence>
        <BattleScreen
          player={playerBattler}
          opponent={opponentBattler}
          onEnd={handleBattleEnd}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      <header className="bg-gradient-to-r from-red-500/90 to-orange-400/90 backdrop-blur-md shadow-lg px-4 py-3 flex items-center">
        <button
          onClick={() => mode === 'menu' ? router.push('/game') : setMode('menu')}
          className="text-white hover:text-white/80 mr-3 font-bold"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold text-white">⚔️ バトル</h1>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* 自分のステータス */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14">
              <BattlerImageSmall imageKey={species.image_key} name={species.name} />
            </div>
            <div>
              <p className="font-bold text-gray-800">{character.name || species.name}</p>
              <p className="text-sm text-gray-500">{species.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-red-500">{strength}</p>
              <p className="text-xs text-gray-400">強さ</p>
            </div>
          </div>
        </div>

        {mode === 'menu' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('difficulty')}
              className="w-full py-4 bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-2"
            >
              🤖 CPU対戦
            </button>
            <button
              onClick={() => setMode('friend-menu')}
              className="w-full py-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-2"
            >
              👥 フレンド対戦
            </button>
          </div>
        )}

        {mode === 'difficulty' && (
          <div className="space-y-3">
            <p className="text-center text-gray-600 font-bold mb-2">難易度を選択</p>
            {([
              { key: 'easy' as const, label: 'かんたん', desc: '初心者向け', color: 'from-green-400 to-emerald-400', emoji: '🌱' },
              { key: 'normal' as const, label: 'ふつう', desc: 'バランス良い戦い', color: 'from-yellow-400 to-amber-400', emoji: '⚔️' },
              { key: 'hard' as const, label: 'むずかしい', desc: '強敵に挑戦', color: 'from-red-400 to-rose-500', emoji: '🔥' },
            ]).map((d) => (
              <button
                key={d.key}
                onClick={() => startCpuBattle(d.key)}
                className={`w-full py-4 bg-gradient-to-r ${d.color} text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-3`}
              >
                <span className="text-xl">{d.emoji}</span>
                <div className="text-left">
                  <span className="block">{d.label}</span>
                  <span className="block text-xs text-white/80 font-normal">{d.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {mode === 'friend-menu' && (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 font-bold mb-2">あなたのフレンドコード</p>
              <p className="text-2xl font-bold text-blue-600 tracking-wider text-center py-2 bg-blue-50 rounded-xl">
                {myCode}
              </p>
              <p className="text-xs text-gray-400 mt-1 text-center">
                このコードを友達に教えよう！
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 font-bold mb-2">フレンドコードで対戦</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                  placeholder="コードを入力"
                  maxLength={8}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-center font-bold tracking-wider uppercase"
                />
                <button
                  onClick={searchFriend}
                  className="px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition"
                >
                  対戦
                </button>
              </div>
              {friendSearchResult && (
                <p className="text-sm text-red-500 mt-2 text-center">{friendSearchResult}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function BattlerImageSmall({ imageKey, name }: { imageKey: string; name: string }) {
  const [error, setError] = useState(false);
  const src = error ? getPlaceholderSvg(imageKey, 56) : getCharacterImagePath(imageKey);
  return (
    <Image
      src={src} alt={name} width={56} height={56}
      className="object-contain" onError={() => setError(true)}
    />
  );
}
