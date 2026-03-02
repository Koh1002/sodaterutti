'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type CharacterHistory = Database['public']['Tables']['character_history']['Row'];
type Species = Database['public']['Tables']['species']['Row'];

interface HistoryWithSpecies extends CharacterHistory {
  speciesName: string;
}

export default function FamilyTreePage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryWithSpecies[]>([]);
  const [currentChar, setCurrentChar] = useState<{ name: string; speciesName: string; generation: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      const [speciesRes, historyRes] = await Promise.all([
        supabase.from('species').select('*'),
        supabase.from('character_history').select('*').order('generation', { ascending: true }),
      ]);

      const speciesList = (speciesRes.data || []) as Species[];
      const historyList = (historyRes.data || []) as CharacterHistory[];

      const speciesMap = new Map<string, string>();
      speciesList.forEach((s) => speciesMap.set(s.id, s.name));

      const historyWithNames: HistoryWithSpecies[] = historyList.map((h) => ({
        ...h,
        speciesName: speciesMap.get(h.species_id) || '不明',
      }));

      setHistory(historyWithNames);

      // 現在の育成中キャラクターを取得
      type CharRow = Database['public']['Tables']['characters']['Row'];
      const { data: rawCharRows } = await supabase
        .from('characters')
        .select('*')
        .eq('is_alive', true)
        .limit(1);
      const charRows = (rawCharRows || []) as CharRow[];

      if (charRows.length > 0) {
        const c = charRows[0];
        const speciesName = speciesMap.get(c.species_id) || '不明';
        setCurrentChar({
          name: c.name || speciesName,
          speciesName,
          generation: c.generation,
        });
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const departureLabel = (cause: string) => {
    switch (cause) {
      case 'marriage': return '💒 結婚して旅立ち';
      case 'death_age': return '🌟 寿命';
      case 'death_sick': return '💫 病気';
      case 'evolution': return '✨ 進化';
      default: return cause;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-4 py-3 flex items-center">
        <button
          onClick={() => router.push('/game')}
          className="text-green-600 hover:text-green-800 mr-3"
        >
          ← もどる
        </button>
        <h1 className="text-lg font-bold text-green-700">🌳 家系図</h1>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {history.length === 0 && !currentChar ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-4">🌱</p>
            <p>まだ家系図はありません</p>
            <p className="text-sm mt-1">最初のキャラクターを育てましょう！</p>
          </div>
        ) : (
          <div className="relative">
            {/* 縦線 */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-green-200" />

            {/* 過去のキャラクター */}
            {history.map((h) => (
              <div key={h.id} className="relative flex items-start gap-4 mb-6">
                <div className="relative z-10 w-12 h-12 bg-white border-2 border-green-300 rounded-full flex items-center justify-center text-lg shrink-0">
                  {h.gender === 'male' ? '👦' : '👧'}
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex-1 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-700">{h.name}</span>
                    <span className="text-xs text-gray-400">{h.generation}代目</span>
                  </div>
                  <p className="text-xs text-gray-500">{h.speciesName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {departureLabel(h.cause_of_departure)} ({h.age_at_departure}日目)
                  </p>
                </div>
              </div>
            ))}

            {/* 現在のキャラクター */}
            {currentChar && (
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 w-12 h-12 bg-purple-100 border-2 border-purple-400 rounded-full flex items-center justify-center text-lg shrink-0 animate-pulse">
                  🐣
                </div>
                <div className="bg-purple-50 rounded-xl p-3 shadow-sm flex-1 mt-1 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700">{currentChar.name}</span>
                    <span className="text-xs text-purple-400">{currentChar.generation}代目</span>
                  </div>
                  <p className="text-xs text-purple-500">{currentChar.speciesName}</p>
                  <p className="text-xs text-purple-400 mt-1">育成中！</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
