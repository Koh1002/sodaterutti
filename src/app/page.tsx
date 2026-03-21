import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-50 via-base-100 to-base-200 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* タイトル */}
        <div className="mb-12">
          <div className="text-4xl mb-5 animate-bounce opacity-35">🥚</div>
          <h1 className="font-display text-2xl font-light text-text-primary tracking-wide">
            そだてるっち
          </h1>
          <p className="text-text-tertiary mt-2 text-xs tracking-airy">
            キャラクター育成ゲーム
          </p>
        </div>

        {/* キャラクタープレビュー */}
        <div className="flex gap-5 mb-12 text-2xl opacity-35">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🐣</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🐥</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🐤</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🐔</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>✧</span>
        </div>

        {/* 説明 */}
        <div className="max-w-md space-y-3 mb-12">
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
            className="block w-full py-3.5 bg-muted-blue/80 hover:bg-muted-blue text-white font-medium rounded-2xl transition shadow-soft text-center text-sm tracking-relaxed press-effect"
          >
            はじめる
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 glass hover:bg-white/50 text-text-secondary font-medium rounded-2xl transition text-center text-sm tracking-relaxed press-effect"
          >
            ログイン
          </Link>
        </div>
      </main>

      <footer className="text-center py-4 text-[9px] text-text-tertiary tracking-wide">
        <p className="font-num">そだてるっち © 2026</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3 text-left shadow-soft">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-blue/40 mt-1.5 shrink-0" />
      <div>
        <h3 className="font-medium text-text-primary text-xs tracking-relaxed">{title}</h3>
        <p className="text-[10px] text-text-tertiary mt-0.5 tracking-relaxed leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
