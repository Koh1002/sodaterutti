# 画像一括生成スクリプト

Nano Banana Pro (Gemini 3 Pro Image) API を使って全67枚のゲーム画像を自動生成するスクリプト。

## セットアップ

### 1. Python パッケージをインストール

```bash
pip install google-genai Pillow
```

### 2. APIキーを取得

[Google AI Studio](https://aistudio.google.com/apikey) でAPIキーを発行。

### 3. 環境変数を設定

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## 使い方

### 全67枚を一括生成（基本）

```bash
python scripts/generate-images.py
```

### まず何が生成されるか確認（Dry Run）

```bash
python scripts/generate-images.py --dry-run
```

### カテゴリ別に分けて生成（推奨）

レート制限が厳しい場合、カテゴリごとに分けて実行すると安定する:

```bash
# Step 1: キャラクター通常（22枚）
python scripts/generate-images.py --category character

# Step 2: 表情差分スプライトシート（22枚）
python scripts/generate-images.py --category expression

# Step 3: たまご（3枚）
python scripts/generate-images.py --category egg

# Step 4: NPC（6枚）
python scripts/generate-images.py --category npc

# Step 5: 背景（4枚）
python scripts/generate-images.py --category background

# Step 6: UI・食べ物・エフェクト（9枚）
python scripts/generate-images.py --category ui
python scripts/generate-images.py --category food
python scripts/generate-images.py --category effect

# Step 7: メインビジュアル（1枚）
python scripts/generate-images.py --category main
```

### リクエスト間隔を調整

レート制限に引っかかる場合は間隔を長くする:

```bash
# 10秒間隔（安全重視）
python scripts/generate-images.py --delay 10

# 15秒間隔（無料枠で安定）
python scripts/generate-images.py --delay 15
```

### 途中から再開

スクリプトは進捗を自動保存するため、中断しても再実行すれば続きから:

```bash
# 中断後、再実行すると生成済みをスキップ
python scripts/generate-images.py

# 進捗をリセットして最初から
python scripts/generate-images.py --no-resume
```

### 特定の画像だけ再生成

```bash
# ID 13, 22, 45 だけ生成
python scripts/generate-images.py --only 13,22,45

# ID 30 以降を全部生成
python scripts/generate-images.py --start-from 30
```

### 出力先を変更

```bash
python scripts/generate-images.py --output-dir ./my-images
```

## ファイル構成

```
scripts/
├── README.md                    # このファイル
├── generate-images.py           # メインスクリプト
├── prompts.json                 # 全67枚のプロンプトデータ
└── .generation-progress.json    # 自動生成される進捗ファイル
```

## 出力先

デフォルトで `public/images/` に以下の構成で保存される:

```
public/images/
├── baby_boy.png                 # #01 ベビー男の子
├── baby_girl.png                # #02 ベビー女の子
├── kids_marucchi.png            # #03 まるっち
├── ...                          # (全キャラクター)
├── baby_boy_expressions.png     # #23 表情差分
├── ...                          # (全表情差分)
├── egg_normal.png               # #45 たまご
├── egg_cracked.png              # #46
├── egg_hatching.png             # #47
├── npc_gentle.png               # #48 NPC
├── ...
├── bg_morning.png               # #54 背景
├── bg_afternoon.png             # #55
├── bg_evening.png               # #56
├── bg_night.png                 # #57
├── ui_icons.png                 # #58 UIアイコン
├── food_onigiri.png             # #59 食べ物
├── ...
├── effect_evolution.png         # #63 エフェクト
├── ...
├── icon_poop.png                # #66
└── main_visual.png              # #67 メインビジュアル
```

## レート制限の目安

| プラン | RPM (1分あたり) | 推奨 --delay | 67枚の所要時間 |
|--------|----------------|-------------|--------------|
| 無料枠 | 10 RPM | `--delay 10` | 約12分 |
| 有料枠 | 60 RPM | `--delay 2` | 約3分 |
| Vertex AI | 制限による | `--delay 5` | 約6分 |

## トラブルシューティング

### レート制限エラー (429)

```bash
# 間隔を長めに設定
python scripts/generate-images.py --delay 15
```

### 途中で止まった

```bash
# そのまま再実行（自動で続きから）
python scripts/generate-images.py
```

### 特定の画像だけ失敗した

スクリプト終了時に失敗IDが表示されるので、そのIDだけ再生成:

```bash
python scripts/generate-images.py --only 5,18,22
```

### 進捗をリセットしたい

```bash
python scripts/generate-images.py --no-resume
# または直接削除
rm scripts/.generation-progress.json
```
