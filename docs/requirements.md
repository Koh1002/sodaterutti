# そだてるっちWebアプリ 要件・仕様定義書

## 1. プロジェクト概要

### 1.1 目的
「そだてるっち」を模したキャラクター育成Webアプリケーションを開発する。ユーザーはかわいいキャラクターに毎日お世話をし、成長・進化を見守る。育成の仕方によって進化先が変化し、成人後は結婚・産卵・世代交代というサイクルを繰り返す。

### 1.2 コンセプト
- **手軽さ**: 1日数分のお世話で楽しめる
- **多様性**: 育成方法・親の組み合わせで進化先が変わる
- **継続性**: 世代交代により長期間遊び続けられる
- **愛着**: かわいいキャラクターへの愛着を育む

---

## 2. システム構成

### 2.1 技術スタック

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| フロントエンド | **Next.js 14 (App Router) + TypeScript** | Vercelとの親和性が最高。SSR/SSG対応でSEOにも有利。型安全性によるバグ防止 |
| UIライブラリ | **Tailwind CSS + Framer Motion** | 高速なスタイリング。Framer Motionでキャラクターのアニメーション表現 |
| バックエンド/DB | **Supabase (PostgreSQL + Auth + Realtime)** | 要件指定。認証・データ永続化・リアルタイム同期を一括提供 |
| デプロイ | **Vercel** | 要件指定。Next.jsの最適なホスティング先 |
| 状態管理 | **Zustand** | 軽量でシンプル。ゲーム状態の管理に最適 |
| 時間管理 | **サーバーサイド計算（Supabase Edge Functions）** | クライアント時刻改ざん防止。定期処理の実行 |

### 2.2 アーキテクチャ図

```
┌─────────────────────────────────────────────┐
│                  ユーザー                      │
│               (ブラウザ / スマホ)                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              Vercel                          │
│  ┌─────────────────────────────────────┐    │
│  │  Next.js 14 (App Router)            │    │
│  │  - トップページ (/, SSG)              │    │
│  │  - ログイン/登録 (/auth)             │    │
│  │  - ゲーム画面 (/game, CSR)           │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│              Supabase                        │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │   Auth   │ │ Database │ │Edge Function│  │
│  │(認証管理) │ │(PostgreSQL)│ │(定期処理)   │  │
│  └──────────┘ └──────────┘ └────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 3. 画面設計

### 3.1 画面一覧

| # | 画面名 | パス | 説明 |
|---|--------|------|------|
| 1 | トップページ | `/` | ゲーム紹介、ログイン/新規登録への導線 |
| 2 | ログイン画面 | `/auth/login` | メールアドレス+パスワードでログイン |
| 3 | 新規登録画面 | `/auth/register` | アカウント作成（ユーザー名・メール・パスワード） |
| 4 | ゲームメイン画面 | `/game` | キャラクター表示、お世話操作の中心画面 |
| 5 | ステータス画面 | `/game` (モーダル) | 空腹度・幸福度・年齢等のパラメータ表示 |
| 6 | 進化図鑑画面 | `/game/encyclopedia` | 過去に育てたキャラクター一覧 |
| 7 | 家系図画面 | `/game/family-tree` | 世代をまたいだ家系図の表示 |
| 8 | 結婚相手選択画面 | `/game` (モーダル) | 結婚適齢期に表示。相手候補の一覧 |

### 3.2 画面遷移図

```
[トップページ]
    │
    ├──→ [ログイン] ──→ [ゲームメイン]
    │                        │
    └──→ [新規登録] ──→ [ゲームメイン]
                             │
                    ┌────────┼────────┐
                    │        │        │
              [ステータス] [図鑑] [家系図]
              (モーダル)
                    │
              [結婚相手選択]
              (モーダル)
```

### 3.3 ゲームメイン画面レイアウト（案）

```
┌─────────────────────────────────┐
│  🕐 時刻   世代: 3代目   💰 100G │  ← ヘッダー
├─────────────────────────────────┤
│                                 │
│        「たまみ」(名前表示)       │
│      ┌───────────────┐          │
│      │               │          │
│      │  キャラクター   │          │  ← メイン表示エリア
│      │  表示エリア     │          │
│      │               │          │
│      └───────────────┘          │
│                                 │
│  ♥ 幸福度 ████░░░░ 50%         │  ← ステータスバー
│  🍔 空腹度 ██████░░ 75%         │
│                                 │
├─────────────────────────────────┤
│  [ごはん] [遊ぶ] [掃除] [治療]   │  ← アクションボタン
│  [ステータス] [図鑑] [家系図]     │
└─────────────────────────────────┘
```

---

## 4. ゲーム仕様

### 4.1 成長ステージ

キャラクターは以下の4段階で成長する。各ステージには現実時間での滞在期間がある。

| # | ステージ名 | 滞在期間 | 説明 |
|---|-----------|---------|------|
| 1 | ベビー期 | 約1日 | 卵から孵化直後。基本的なお世話のみ |
| 2 | キッズ期 | 約2日 | 少し成長。遊びアクションが解放 |
| 3 | ヤング期 | 約3日 | 反抗期。お世話の質が進化先に大きく影響 |
| 4 | アダルト期 | 約5日〜 | 最終形態。結婚・産卵が可能 |

**進化タイミング**: 各ステージの滞在期間終了時に、蓄積されたお世話データに基づいて次のステージのキャラクターが決定される。

**名前付け**: たまごが孵化してベビー期に入る際、ユーザーにキャラクターの名前入力を求める。名前は1〜30文字で自由に設定可能（例:「たまみ」「そらくん」等）。未入力の場合は種族名がデフォルト名として設定される。名前はゲーム画面上部に常時表示される。

### 4.2 パラメータ一覧

| パラメータ | 範囲 | 自然変化 | 説明 |
|-----------|------|---------|------|
| 空腹度 (hunger) | 0〜100 | 1時間ごとに-5 | 0になると体調悪化。ごはんで回復 |
| 幸福度 (happiness) | 0〜100 | 2時間ごとに-3 | 低いと進化に悪影響。遊びで回復 |
| 体力 (stamina) | 0〜100 | 睡眠時に回復 | 遊びすぎると低下 |
| 清潔度 (cleanliness) | 0〜100 | 3時間ごとに-2、うんち時-20 | 掃除で回復 |
| 体重 (weight) | 1〜99 | - | 食事で増加、運動で減少。進化条件に影響 |
| しつけ度 (discipline) | 0〜100 | - | しつけ行動で上昇。進化条件に影響 |
| 病気フラグ (sick) | true/false | - | 清潔度・空腹度が低いとランダムで発生 |
| 年齢 (age) | 0〜 | 1日+1 | リアル日数でカウント |
| 世代 (generation) | 1〜 | - | 何代目かを表す |

### 4.3 お世話アクション

| アクション | 効果 | クールダウン | 備考 |
|-----------|------|------------|------|
| ごはん（食事） | 空腹度+20、体重+2 | 30分 | メニューは3種類（おにぎり/パン/ケーキ）。ケーキは幸福度+5だが体重+5 |
| おやつ | 空腹度+5、幸福度+10、体重+3 | 1時間 | おやつの与えすぎは肥満→進化に悪影響 |
| 遊ぶ | 幸福度+15、体力-10、体重-1 | 1時間 | ミニゲーム形式（後述） |
| 掃除 | 清潔度+30 | なし | うんちが出現した時に実行 |
| 治療 | 病気を治す | なし | 病気フラグがtrue時のみ実行可能 |
| しつけ | しつけ度+10 | 2時間 | わがまま行動時に実行すると効果2倍 |
| 電気を消す | 就寝させる（体力回復） | - | 24:00〜6:00は自動就寝。手動も可 |

### 4.4 ミニゲーム（遊ぶアクション詳細）

遊ぶアクション実行時にミニゲームが開始される。スコアに応じて幸福度の上昇量が変動。

**ゲーム案: じゃんけんゲーム**
- ルール: キャラクターとじゃんけん3回勝負
- 2勝以上で「大成功」→ 幸福度+20
- 1勝で「成功」→ 幸福度+15
- 0勝で「失敗」→ 幸福度+5

**ゲーム案: キャッチゲーム**
- ルール: 上から降ってくるアイテムをキャラクターで受け止める（10秒間）
- 5個以上キャッチで「大成功」
- 3個以上で「成功」
- 2個以下で「失敗」

### 4.5 進化システム

#### 4.5.1 進化ツリー（初期設計: 第1世代）

```
            [たまご]
              │
        [ベビっち] (ベビー期 共通)
          ┌───┼───┐
          │   │   │
     [まるっち] [くちたまっち] [もひたまっち]  ← キッズ期（お世話度で分岐）
       ┌──┤     ┌──┤         ┌──┤
       │  │     │  │         │  │
  (以下ヤング期・アダルト期でさらに分岐)
```

#### 4.5.2 進化条件の決定要素

進化先は以下の要素の**複合スコア**で決定される:

| 要素 | 重み | 説明 |
|------|------|------|
| お世話ミス回数 | 30% | 空腹度・幸福度が0になった回数 |
| しつけ度 | 25% | 蓄積されたしつけ度 |
| 体重 | 15% | 標準体重からの乖離 |
| ミニゲーム成績 | 15% | ミニゲームの平均スコア |
| 親の遺伝子 | 15% | 第2世代以降で適用（後述） |

#### 4.5.3 進化先キャラクター数（計画）

| ステージ | キャラクター数 | 備考 |
|---------|-------------|------|
| ベビー期 | 2体 | 男の子/女の子 |
| キッズ期 | 4体 | お世話度で分岐 |
| ヤング期 | 6体 | お世話度+しつけ度で分岐 |
| アダルト期 | 10体 | 全条件の複合で分岐 |
| **合計** | **22体** | 第1世代の基本キャラクター |

### 4.6 結婚・世代交代システム

#### 4.6.1 結婚フロー

```
[アダルト期到達] → [結婚適齢期(アダルト期3日目〜)] → [結婚相手候補表示]
     → [相手選択] → [結婚演出] → [たまご誕生] → [親は旅立つ(1日後)]
     → [新しいたまごから育成開始]
```

#### 4.6.2 結婚相手候補
- システムがランダムに3体のNPCキャラクターを提示
- 各候補には見た目・性格パラメータが表示される
- 選んだ相手によって子供の遺伝子が変わる

#### 4.6.3 遺伝システム

子供のキャラクターは以下の遺伝情報を持つ:

```typescript
type Gene = {
  bodyColor: string;    // 体の色（親からランダム継承）
  eyeType: string;      // 目の形（親からランダム継承）
  personality: string;  // 性格傾向（進化条件の重みに影響）
  speciesPool: string[];// なれる進化先の候補（親の種族に依存）
};
```

- **体の色**: 両親のいずれかの色をランダムで継承（稀に突然変異で新色）
- **目の形**: 両親のいずれかをランダムで継承
- **性格傾向**: 両親の中間値＋ランダム要素
- **進化先候補**: 親の種族によって子供がなれる進化先が変わる（最重要要素）

#### 4.6.4 世代ボーナス
- 世代が進むごとに特別な進化先が解放される
- 3代目以降: 隠しキャラクター進化の可能性
- 5代目以降: レアキャラクター進化の可能性
- 10代目以降: 伝説キャラクター進化の可能性

### 4.7 時間経過システム

#### 4.7.1 リアルタイム連動
- ゲーム内時間は現実時間と連動する
- パラメータの自然減少はサーバーサイドで計算
- ユーザーがログインしていない間もパラメータは変動する

#### 4.7.2 オフライン中の処理
- 最後のアクセスからの経過時間を計算
- パラメータの自然減少を一括適用
- ただし「死亡」は発生させない（空腹度0が24時間以上継続した場合のみ病気にする）
- お世話ミスとしてカウントはする

#### 4.7.3 睡眠システム
- 24:00〜6:00はキャラクターが自動就寝
- 就寝中はパラメータの自然減少が半減
- 就寝中は体力が1時間ごとに+10回復
- 就寝中にお世話アクションは実行不可

### 4.8 死亡条件

| 条件 | 説明 |
|------|------|
| 寿命 | アダルト期到達後、結婚せず7日経過 |
| 病気放置 | 病気状態を48時間放置 |
| 世代交代 | 結婚→産卵後、1日で旅立ち（通常の世代交代フロー） |

死亡後は「お墓画面」を表示し、思い出を振り返った後、新しいたまごから再スタート。
（世代交代による旅立ちの場合は、既に次のたまごが存在するためシームレスに継続）

---

## 5. データベース設計

### 5.1 ER図（主要テーブル）

```
users
├── id (UUID, PK)
├── email
├── username
├── created_at
└── updated_at

characters (現在育成中のキャラクター)
├── id (UUID, PK)
├── user_id (FK → users.id)
├── name (キャラクターのニックネーム。1〜30文字。ユーザーが自由に命名可能)
├── species_id (FK → species.id)
├── stage (ベビー/キッズ/ヤング/アダルト)
├── gender (male/female)
├── hunger (0-100)
├── happiness (0-100)
├── stamina (0-100)
├── cleanliness (0-100)
├── weight (1-99)
├── discipline (0-100)
├── is_sick (boolean)
├── age_days (integer)
├── generation (integer)
├── gene (JSONB - 遺伝子情報)
├── parent_character_id (FK → character_history.id, nullable)
├── care_miss_count (integer)
├── mini_game_total_score (integer)
├── mini_game_play_count (integer)
├── born_at (timestamp)
├── last_fed_at (timestamp)
├── last_played_at (timestamp)
├── last_cleaned_at (timestamp)
├── last_disciplined_at (timestamp)
├── last_calculated_at (timestamp - パラメータ最終計算日時)
├── is_sleeping (boolean)
├── created_at
└── updated_at

character_history (過去のキャラクター記録)
├── id (UUID, PK)
├── user_id (FK → users.id)
├── name
├── species_id (FK → species.id)
├── final_stage
├── gender
├── generation
├── gene (JSONB)
├── parent_character_id (FK → character_history.id, nullable)
├── partner_species_id (FK → species.id, nullable)
├── cause_of_departure (marriage / death_age / death_sick)
├── age_at_departure (integer)
├── born_at (timestamp)
├── departed_at (timestamp)
└── created_at

species (キャラクター種族マスタ)
├── id (UUID, PK)
├── name (種族名)
├── stage (ベビー/キッズ/ヤング/アダルト)
├── description (説明)
├── image_key (画像ファイル識別子)
├── base_weight (標準体重)
├── rarity (common / rare / legendary)
└── created_at

evolution_rules (進化ルールマスタ)
├── id (UUID, PK)
├── from_species_id (FK → species.id)
├── to_species_id (FK → species.id)
├── condition (JSONB - 進化条件)
└── created_at

marriage_candidates (結婚相手NPCマスタ)
├── id (UUID, PK)
├── species_id (FK → species.id)
├── personality (JSONB)
├── gene (JSONB)
└── created_at

game_settings (ユーザーごとのゲーム設定)
├── id (UUID, PK)
├── user_id (FK → users.id)
├── sound_enabled (boolean)
├── notification_enabled (boolean)
└── updated_at
```

### 5.2 Supabase RLS（Row Level Security）ポリシー
- 各ユーザーは自分のデータのみ読み書き可能
- `species`, `evolution_rules`, `marriage_candidates` は全ユーザー読み取り可
- マスタデータの書き込みは管理者のみ

---

## 6. API設計（主要エンドポイント）

Supabaseクライアントを通じたデータアクセスを基本とし、複雑なロジックはEdge Functionsで実装。

### 6.1 Edge Functions

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/functions/v1/calculate-status` | POST | 経過時間に基づくパラメータ再計算 |
| `/functions/v1/feed` | POST | 食事アクション（クールダウン検証含む） |
| `/functions/v1/play` | POST | 遊びアクション |
| `/functions/v1/clean` | POST | 掃除アクション |
| `/functions/v1/cure` | POST | 治療アクション |
| `/functions/v1/discipline` | POST | しつけアクション |
| `/functions/v1/sleep` | POST | 就寝/起床の切り替え |
| `/functions/v1/check-evolution` | POST | 進化判定＆実行 |
| `/functions/v1/get-marriage-candidates` | GET | 結婚相手候補の取得 |
| `/functions/v1/marry` | POST | 結婚実行→世代交代処理 |
| `/functions/v1/get-family-tree` | GET | 家系図データ取得 |

---

## 7. 非機能要件

### 7.1 パフォーマンス
- ページ読み込み: 3秒以内（LCP）
- アクション応答: 500ms以内
- 同時接続ユーザー: 100人想定（Supabase無料枠の範囲）

### 7.2 セキュリティ
- Supabase Authによる認証
- RLSによるデータアクセス制御
- パラメータ改ざん防止のためサーバーサイドで計算
- CSRF対策（Next.jsデフォルト）

### 7.3 レスポンシブ対応
- スマートフォン優先（モバイルファースト）
- タブレット・PC対応
- 最小対応幅: 320px

### 7.4 アクセシビリティ
- WAI-ARIA対応
- キーボード操作対応

---

## 8. 通知機能（提案）

ユーザーが定期的にお世話することを促すため、以下の通知を**提案**する。

| 通知 | トリガー | 内容 |
|------|---------|------|
| お腹空き通知 | 空腹度が20以下 | 「○○がお腹を空かせています！」 |
| 病気通知 | 病気フラグON | 「○○が病気になりました...」 |
| 進化通知 | 進化発生時 | 「○○が進化しました！」 |
| 結婚適齢期通知 | アダルト期3日目 | 「○○が結婚適齢期になりました！」 |

※ ブラウザのPush Notification APIを使用（ユーザー許可制）

---

## 9. 将来的な拡張案（スコープ外・参考）

以下は初期リリースには含めないが、将来的に検討する機能:

- **マルチプレイ結婚**: 他ユーザーのキャラクターと結婚（Supabase Realtimeで実現可能）
- **ショップ機能**: ゲーム内通貨でアイテム・食事の購入
- **お出かけ機能**: キャラクターを特定の場所に連れて行き特別なイベント発生
- **ランキング**: 世代数・図鑑コンプリート率のランキング
- **実績/バッジ**: 特定条件達成で獲得できる称号

---

## 10. 必要なイラスト・画像一覧とプロンプト

### 10.1 イラスト総数

| カテゴリ | 枚数 | 備考 |
|---------|------|------|
| キャラクター（通常） | 22枚 | 全種族×通常ポーズ |
| キャラクター（アクション） | 22枚 | 食事/遊び/睡眠/病気で表情差分 ※1枚に4パターン |
| たまご | 3枚 | 通常/ひび/孵化 |
| 結婚相手NPC | 6枚 | NPC用キャラクター |
| 背景 | 4枚 | 朝/昼/夕/夜 |
| UIアイコン | 1枚 | 食事/遊び/掃除/治療/しつけ等のアイコンセット |
| 食べ物 | 4枚 | おにぎり/パン/ケーキ/おやつ |
| エフェクト | 4枚 | 進化/結婚/死亡/うんち |
| トップページ用メインビジュアル | 1枚 | |
| **合計** | **約67枚** | |

### 10.2 画像生成プロンプト一覧

> **Nano Banana Pro対応版**: 著作権キャラ参照・制限ワードを除去した修正版プロンプトは [`docs/image-prompts-nanobananapro.md`](./image-prompts-nanobananapro.md) を参照。
> 以下は初版（Gemini向け）プロンプト。Nano Banana Proを使用する場合は上記ファイルのプロンプトを使用すること。

#### 10.2.1 キャラクター（ベビー期: 2体）

**プロンプト1 - ベビーたまっち（男の子）**
```
A cute round baby virtual pet character, chibi style, simple design,
small round body with tiny arms and legs, big sparkling eyes, light blue body color,
happy expression, pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii Japanese virtual pet aesthetic, virtual pet game inspired.
Size: 256x256px
```

**プロンプト2 - ベビーたまっち（女の子）**
```
A cute round baby virtual pet character, chibi style, simple design,
small round body with tiny arms and legs, big sparkling eyes with eyelashes,
light pink body color, happy expression, small ribbon on head,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii Japanese virtual pet aesthetic, virtual pet game inspired.
Size: 256x256px
```

#### 10.2.2 キャラクター（キッズ期: 4体）

**プロンプト3 - まるっち**
```
A cute small round virtual pet character, toddler stage, chibi style,
perfectly round white body, small dot eyes, blushing cheeks, tiny feet,
simple and adorable design, pixel art inspired but smooth lines,
white background, transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト4 - くちたまっち**
```
A cute small virtual pet character, toddler stage, chibi style,
round body with prominent lips/beak, orange-yellow body color,
playful expression, small wings instead of arms,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト5 - もひたまっち**
```
A cute small virtual pet character, toddler stage, chibi style,
round body with a mohawk-like hair tuft on top, light green body color,
mischievous expression, small arms and legs,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト6 - みずたまっち**
```
A cute small virtual pet character, toddler stage, chibi style,
round body with polka-dot pattern, light purple body color,
gentle expression, water-drop shaped body,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

#### 10.2.3 キャラクター（ヤング期: 6体）

**プロンプト7 - ヤングまるっち**
```
A cute medium-sized virtual pet character, teenager stage, chibi style,
round body slightly taller than wide, white body with blue accents,
confident expression, small arms with visible hands,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト8 - ヤングくちっち**
```
A cute medium-sized virtual pet character, teenager stage, chibi style,
oval body with a duck-like bill, orange body color,
energetic expression, small wing-arms spread out,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト9 - ヤングもひっち**
```
A cute medium-sized virtual pet character, teenager stage, chibi style,
round body with tall spiky mohawk hair, green body color,
rebellious but cute expression, wearing a tiny scarf,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト10 - ヤングみずっち**
```
A cute medium-sized virtual pet character, teenager stage, chibi style,
water-drop shaped body, blue-purple gradient body color,
calm serene expression, flowing water-like appendages,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト11 - ヤングほしっち**
```
A cute medium-sized virtual pet character, teenager stage, chibi style,
star-shaped body, golden yellow body color,
cheerful sparkling expression, small star-shaped hands,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト12 - ヤングにじっち**
```
A cute medium-sized virtual pet character, teenager stage, chibi style,
cloud-shaped body, pastel rainbow gradient body color,
dreamy expression, soft fluffy texture appearance,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

#### 10.2.4 キャラクター（アダルト期: 10体）

**プロンプト13 - まめっち（優等生型）**
```
A cute adult virtual pet character, fully grown stage, chibi style,
round body with pointed ears, black and yellow body color,
intelligent kind expression, wearing tiny glasses,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, Mametchi-inspired.
Size: 256x256px
```

**プロンプト14 - めめっち（おしゃれ型）**
```
A cute adult virtual pet character, fully grown stage, chibi style,
round body with large curly hair/antenna, pink body color,
fashionable cute expression, big sparkling eyes with long eyelashes,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, Memetchi-inspired.
Size: 256x256px
```

**プロンプト15 - くちぱっち（食いしん坊型）**
```
A cute adult virtual pet character, fully grown stage, chibi style,
large round body with prominent duck lips, green body color,
happy relaxed expression, slightly chubby, holding a rice ball,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, Kuchipatchi-inspired.
Size: 256x256px
```

**プロンプト16 - ききっち（クール型）**
```
A cute adult virtual pet character, fully grown stage, chibi style,
sleek round body with sharp cool eyes, dark blue body color,
confident cool expression, small cape or scarf accessory,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト17 - ふらわっち（花型）**
```
A cute adult virtual pet character, fully grown stage, chibi style,
round body with flower petals around the head, pastel pink and white body color,
gentle sweet expression, leaf-shaped hands,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, Flowertchi-inspired.
Size: 256x256px
```

**プロンプト18 - おやじっち（お世話不足型）**
```
A cute but scruffy adult virtual pet character, fully grown stage, chibi style,
round body with stubble/beard shadow, brownish gray body color,
tired lazy expression, small bald spot on head, holding a newspaper,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, Oyajitchi-inspired.
Size: 256x256px
```

**プロンプト19 - にじいろっち（虹型・レア）**
```
A cute beautiful adult virtual pet character, fully grown stage, chibi style,
elegant round body, shimmering rainbow gradient body color,
majestic graceful expression, tiny crown on head, sparkle effects,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, rare character.
Size: 256x256px
```

**プロンプト20 - ほしぞらっち（星空型・レア）**
```
A cute beautiful adult virtual pet character, fully grown stage, chibi style,
round body covered in star/constellation pattern, deep navy blue body color,
mysterious gentle expression, glowing star eyes, tiny shooting star trail,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, rare character.
Size: 256x256px
```

**プロンプト21 - ひかりっち（光型・伝説）**
```
A cute majestic adult virtual pet character, fully grown stage, chibi style,
round body made of pure golden light, radiant white and gold body color,
divine peaceful expression, angel-like tiny wings, halo above head,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, legendary character.
Size: 256x256px
```

**プロンプト22 - やみっち（闇型・伝説）**
```
A cute mysterious adult virtual pet character, fully grown stage, chibi style,
round body made of shadowy dark energy, deep purple and black body color,
mysterious cool expression, tiny bat-like wings, crescent moon motif,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired, legendary character.
Size: 256x256px
```

#### 10.2.5 キャラクター表情差分（各キャラクター共通指示）

各キャラクターに対して、以下の表情差分を1枚のスプライトシートとして生成:

```
[Character name] expression sprite sheet, 4 expressions in a 2x2 grid:
Top-left: eating (happy with food, open mouth, holding food),
Top-right: playing (excited, jumping, sparkle effects),
Bottom-left: sleeping (eyes closed, peaceful, small "zzz" text),
Bottom-right: sick (pale color, sweat drop, dizzy swirl eyes).
Same character design as the base character, consistent style,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 512x512px (each expression 256x256px)
```

#### 10.2.6 たまご（3枚）

**プロンプト - たまご通常**
```
A cute simple egg, white with colorful small spots/pattern,
slightly glowing, sitting on soft surface, warm feeling,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト - たまごひび**
```
A cute egg with cracks forming on the surface, white with colorful spots,
light shining through the cracks, exciting feeling,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

**プロンプト - たまご孵化**
```
A cute egg hatching open, shell pieces flying outward,
bright light and sparkles coming from inside, joyful magical moment,
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

#### 10.2.7 結婚相手NPC（6枚）

**プロンプト（共通テンプレート - 性格を差し替えて6回生成）**
```
A cute adult virtual pet character designed as a marriage partner NPC,
chibi style, round body, [PERSONALITY_DESC], [COLOR] body color,
[EXPRESSION] expression, [ACCESSORY],
pixel art inspired but smooth lines, white background,
transparent PNG style, kawaii virtual pet game inspired.
Size: 256x256px
```

| # | PERSONALITY_DESC | COLOR | EXPRESSION | ACCESSORY |
|---|-----------------|-------|------------|-----------|
| 1 | gentle and kind personality | soft pink | warm gentle | tiny flower crown |
| 2 | energetic and sporty personality | bright orange | excited cheerful | tiny sweatband |
| 3 | intellectual and bookish personality | light blue | calm thoughtful | tiny round glasses |
| 4 | artistic and creative personality | lavender purple | dreamy creative | tiny beret hat |
| 5 | brave and adventurous personality | forest green | determined brave | tiny explorer hat |
| 6 | mysterious and elegant personality | deep crimson | cool mysterious | tiny masquerade mask |

#### 10.2.8 背景（4枚）

**プロンプト - 朝の背景**
```
A cute kawaii virtual pet game background, morning scene,
soft pastel sunrise colors, orange and pink sky,
small cute house with a garden, dewdrops on grass, birds flying,
warm gentle lighting, flat illustration style,
no characters, clean background for game UI overlay.
Size: 800x600px
```

**プロンプト - 昼の背景**
```
A cute kawaii virtual pet game background, daytime scene,
bright blue sky with fluffy white clouds,
small cute house with colorful flowers in garden, green grass,
cheerful sunny lighting, flat illustration style,
no characters, clean background for game UI overlay.
Size: 800x600px
```

**プロンプト - 夕方の背景**
```
A cute kawaii virtual pet game background, evening/sunset scene,
warm orange and purple gradient sky,
small cute house with warm window lights, autumn leaves falling,
nostalgic warm lighting, flat illustration style,
no characters, clean background for game UI overlay.
Size: 800x600px
```

**プロンプト - 夜の背景**
```
A cute kawaii virtual pet game background, nighttime scene,
deep dark blue sky with stars and crescent moon,
small cute house with soft glowing windows, fireflies around,
calm peaceful lighting, flat illustration style,
no characters, clean background for game UI overlay.
Size: 800x600px
```

#### 10.2.9 UIアイコンセット（1枚）

```
A set of cute kawaii game UI icons arranged in a 4x2 grid on white background:
Row 1: rice ball (food icon), game controller (play icon),
        broom (clean icon), medicine/syringe (cure icon).
Row 2: pointing finger (discipline icon), moon with "zzz" (sleep icon),
        heart (love/marriage icon), book (encyclopedia icon).
Each icon is simple, colorful, and in a consistent cute rounded style.
Flat design, no shadows, pixel art inspired but smooth lines,
transparent PNG style.
Size: 512x256px (each icon 128x128px)
```

#### 10.2.10 食べ物アイテム（4枚）

**プロンプト - おにぎり**
```
A cute kawaii rice ball (onigiri) with a happy face, nori seaweed wrap,
simple adorable design, pixel art inspired but smooth lines,
white background, transparent PNG style, game item icon.
Size: 128x128px
```

**プロンプト - パン**
```
A cute kawaii bread/toast with a happy face, golden brown color,
slightly puffy, simple adorable design,
pixel art inspired but smooth lines, white background,
transparent PNG style, game item icon.
Size: 128x128px
```

**プロンプト - ケーキ**
```
A cute kawaii strawberry shortcake slice with a happy face,
white cream, red strawberry on top, simple adorable design,
pixel art inspired but smooth lines, white background,
transparent PNG style, game item icon.
Size: 128x128px
```

**プロンプト - おやつ（クッキー）**
```
A cute kawaii cookie with a happy face, golden brown with chocolate chips,
star-shaped, simple adorable design,
pixel art inspired but smooth lines, white background,
transparent PNG style, game item icon.
Size: 128x128px
```

#### 10.2.11 エフェクト（4枚）

**プロンプト - 進化エフェクト**
```
A magical evolution effect, bright white light burst with colorful sparkles,
rainbow particles swirling, transformation energy,
no character, effect overlay only,
pixel art inspired but smooth lines, transparent background PNG.
Size: 256x256px
```

**プロンプト - 結婚エフェクト**
```
A romantic marriage celebration effect, pink and red hearts floating,
golden bells, flower petals scattering, ribbons,
no character, effect overlay only,
pixel art inspired but smooth lines, transparent background PNG.
Size: 256x256px
```

**プロンプト - 死亡/旅立ちエフェクト**
```
A gentle farewell effect, soft golden angel wings and halo,
gentle upward floating light particles, peaceful atmosphere,
small ghost with cute smile ascending,
pixel art inspired but smooth lines, transparent background PNG.
Size: 256x256px
```

**プロンプト - うんちアイコン**
```
A cute kawaii poop emoji style icon, brown swirl shape,
cute simple face with small smile, small stink lines,
simple adorable design, pixel art inspired but smooth lines,
white background, transparent PNG style.
Size: 128x128px
```

#### 10.2.12 トップページ用メインビジュアル（1枚）

```
A colorful cheerful main visual for a virtual pet raising game website,
featuring 5-6 cute chibi virtual pet characters of different colors
(pink, blue, green, yellow, purple) grouped together happily,
surrounded by hearts, stars, and sparkles,
large cute egg in the center background,
text space at the top for game title,
pastel rainbow gradient background,
kawaii Japanese virtual pet game aesthetic, virtual pet game inspired,
vibrant and inviting illustration, flat design style.
Size: 1200x630px
```

---

## 11. 開発フェーズ（提案）

### Phase 1: MVP（最小実用製品）- 2〜3週間
- ユーザー認証（ログイン/登録）
- キャラクター1体の育成（パラメータ管理、お世話アクション）
- 基本的な進化システム（ベビー→キッズ→ヤング→アダルトの1ルート）
- 時間経過によるパラメータ変動
- 基本UI（ゲームメイン画面）

### Phase 2: コア機能完成 - 2〜3週間
- 全進化ツリーの実装（22キャラクター）
- 結婚・世代交代システム
- 遺伝システム
- ミニゲーム実装
- 図鑑・家系図

### Phase 3: ポリッシュ - 1〜2週間
- アニメーション・エフェクト
- 通知機能
- レスポンシブ対応の調整
- パフォーマンス最適化
- テスト・バグ修正

---

## 12. 決定事項一覧

以下の事項は確定済み:

| # | 項目 | 決定内容 |
|---|------|---------|
| 1 | キャラクターの名前付け | **可能**（1〜30文字、任意。未入力時は種族名をデフォルト名として設定） |
| 2 | 課金要素 | **なし**（完全無料） |
| 3 | SNS共有 | **Phase3で検討** |
| 4 | 音声/BGM | **Phase3で検討**（フリー素材利用） |
| 5 | 多言語対応 | **日本語のみ** |
| 6 | パスワードリセット | **あり**（Supabase標準機能を利用） |
| 7 | ゲストプレイ | **なし**（要ログイン） |
| 8 | データ削除 | **あり**（GDPR対応。アカウント・全育成データの削除機能を実装） |
