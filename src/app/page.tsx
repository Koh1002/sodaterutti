import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 via-dusty-50 to-sage-50 flex flex-col">
      {/* メインビジュアル */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* タイトルロゴ */}
        <div className="mb-10">
          <div className="text-5xl mb-5 animate-bounce opacity-50">🥚</div>
          <h1 className="text-3xl font-medium text-warm-700 tracking-airy">
            そだてるっち
          </h1>
          <p className="text-warm-400 mt-2 text-sm tracking-relaxed">
            キャラクター育成ゲーム
          </p>
        </div>

        {/* キャラクタープレビュー */}
        <div className="flex gap-4 mb-10 text-3xl opacity-50">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🐣</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🐥</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🐤</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🐔</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>✧</span>
        </div>

        {/* 説明 */}
        <div className="max-w-md space-y-3 mb-10">
          <FeatureCard
            title="毎日お世話"
            description="ごはんをあげたり、遊んだり、お掃除したり。毎日のお世話でキャラクターが成長"
          />
          <FeatureCard
            title="進化で変身"
            description="育て方によって進化先が変わる。22種類以上のキャラクターを発見しよう"
          />
          <FeatureCard
            title="結婚・世代交代"
            description="大人になったら結婚して次の世代へ。家系図をつないでいこう"
          />
        </div>

        {/* CTA */}
        <div className="space-y-3 w-full max-w-xs">
          <Link
            href="/auth/register"
            className="block w-full py-3.5 bg-dusty-400 hover:bg-dusty-500 text-white font-medium rounded-xl transition shadow-sm text-center text-sm tracking-relaxed"
          >
            はじめる
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 glass hover:bg-white/70 text-warm-600 font-medium rounded-xl transition text-center text-sm tracking-relaxed"
          >
            ログイン
          </Link>
        </div>
      </main>

      {/* フッター */}
      <footer className="text-center py-4 text-[10px] text-warm-300 tracking-relaxed">
        <p>そだてるっち &copy; 2026</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3 text-left shadow-sm">
      <div className="w-1.5 h-1.5 rounded-full bg-dusty-300 mt-1.5 shrink-0" />
      <div>
        <h3 className="font-medium text-warm-600 text-sm tracking-relaxed">{title}</h3>
        <p className="text-xs text-warm-400 mt-0.5 tracking-relaxed leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
