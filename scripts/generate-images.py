#!/usr/bin/env python3
"""
たまごっちゲーム 画像一括生成スクリプト (Nano Banana Pro / Gemini API)

全67枚の画像をレート制限・リトライ・中断再開に対応して自動生成する。

使い方:
  pip install google-genai Pillow
  export GEMINI_API_KEY="your-api-key"
  python scripts/generate-images.py

オプション:
  --output-dir    出力先ディレクトリ (default: public/images)
  --delay         リクエスト間隔(秒) (default: 5)
  --resume        中断した箇所から再開 (default: True)
  --start-from    指定IDから開始 (例: --start-from 30)
  --only          特定IDのみ生成 (例: --only 1,2,3)
  --category      特定カテゴリのみ (例: --category character)
  --dry-run       実際には生成せずプロンプトを表示
  --model         使用モデル (default: gemini-3-pro-image-preview)
"""

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Gemini SDK (google-genai) を使用
# ---------------------------------------------------------------------------
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("=" * 60)
    print("ERROR: google-genai パッケージが必要です")
    print("  pip install google-genai Pillow")
    print("=" * 60)
    sys.exit(1)

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "prompts.json"
PROGRESS_FILE = SCRIPT_DIR / ".generation-progress.json"

DEFAULT_MODEL = "gemini-3-pro-image-preview"
DEFAULT_DELAY = 5  # 秒
MAX_RETRIES = 4
BACKOFF_BASE = 2  # 指数バックオフの底


def load_prompts() -> list[dict]:
    """prompts.json を読み込む"""
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_progress() -> dict:
    """進捗ファイルを読み込む（存在しなければ空dict）"""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed": [], "failed": []}


def save_progress(progress: dict):
    """進捗ファイルを保存"""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def generate_single_image(
    client: "genai.Client",
    model: str,
    prompt_data: dict,
    output_dir: Path,
    total_count: int = 0,
    skip_existing: bool = True,
) -> bool | None:
    """
    1枚の画像を生成して保存する。
    成功時 True、失敗時 False、スキップ時 None を返す。
    """
    prompt_id = prompt_data["id"]
    name = prompt_data["name"]
    filename = prompt_data["filename"]
    prompt_text = prompt_data["prompt"]
    target_size = prompt_data["size"]

    output_path = output_dir / filename

    # 既存ファイルが存在する場合はスキップ
    if skip_existing and output_path.exists():
        file_size_kb = output_path.stat().st_size / 1024
        print(f"  [SKIP] {name} ({filename}) - 既に存在 ({file_size_kb:.1f} KB)")
        return None

    total_label = total_count if total_count > 0 else "?"
    print(f"\n{'='*60}")
    print(f"[{prompt_id:02d}/{total_label}] {name}")
    print(f"  -> {output_path}")
    print(f"  Size: {target_size}")
    print(f"  Prompt: {prompt_text[:80]}...")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt_text,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )

            # レスポンスから画像パートを探す
            image_saved = False
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                        image_bytes = part.inline_data.data
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        with open(output_path, "wb") as f:
                            f.write(image_bytes)
                        file_size_kb = len(image_bytes) / 1024
                        print(f"  [OK] 保存完了 ({file_size_kb:.1f} KB)")
                        image_saved = True
                        break

            if image_saved:
                return True
            else:
                print(f"  [WARN] 画像データがレスポンスに含まれていません (attempt {attempt}/{MAX_RETRIES})")
                # テキストレスポンスがあれば表示
                if response.text:
                    print(f"  Response text: {response.text[:200]}")

        except Exception as e:
            wait_time = BACKOFF_BASE ** attempt
            print(f"  [ERROR] attempt {attempt}/{MAX_RETRIES}: {e}")
            if attempt < MAX_RETRIES:
                print(f"  {wait_time}秒後にリトライ...")
                time.sleep(wait_time)
            continue

    print(f"  [FAIL] {MAX_RETRIES}回リトライ後も失敗")
    return False


def main():
    parser = argparse.ArgumentParser(
        description="たまごっちゲーム 画像一括生成スクリプト (Nano Banana Pro)"
    )
    parser.add_argument(
        "--output-dir",
        default="public/images",
        help="出力ディレクトリ (default: public/images)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DELAY,
        help=f"リクエスト間隔(秒) (default: {DEFAULT_DELAY})",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        default=True,
        help="中断した箇所から再開 (default: True)",
    )
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="進捗をリセットして最初から実行",
    )
    parser.add_argument(
        "--start-from",
        type=int,
        default=None,
        help="指定IDから開始 (例: --start-from 30)",
    )
    parser.add_argument(
        "--only",
        type=str,
        default=None,
        help="特定IDのみ生成 (カンマ区切り, 例: --only 1,2,3)",
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        choices=["character", "expression", "egg", "npc", "background", "ui", "food", "effect", "main"],
        help="特定カテゴリのみ生成",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="既にファイルが存在する画像をスキップ (default: True)",
    )
    parser.add_argument(
        "--no-skip-existing",
        action="store_true",
        help="既存ファイルを上書きして再生成",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際には生成せずプロンプトを表示",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"使用モデル (default: {DEFAULT_MODEL})",
    )

    args = parser.parse_args()

    # --- APIキー ---
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key and not args.dry_run:
        print("ERROR: 環境変数 GEMINI_API_KEY を設定してください")
        print("  export GEMINI_API_KEY='your-api-key'")
        sys.exit(1)

    # --- プロンプト読み込み ---
    all_prompts = load_prompts()

    # --- フィルタリング ---
    prompts = all_prompts

    if args.only:
        target_ids = [int(x.strip()) for x in args.only.split(",")]
        prompts = [p for p in prompts if p["id"] in target_ids]
    elif args.category:
        prompts = [p for p in prompts if p["category"] == args.category]
    elif args.start_from:
        prompts = [p for p in prompts if p["id"] >= args.start_from]

    # --- 進捗管理 ---
    progress = load_progress()
    if args.no_resume:
        progress = {"completed": [], "failed": []}
        save_progress(progress)

    if args.resume and not args.no_resume:
        completed_ids = set(progress.get("completed", []))
        skipped = [p for p in prompts if p["id"] in completed_ids]
        prompts = [p for p in prompts if p["id"] not in completed_ids]
        if skipped:
            print(f"[RESUME] {len(skipped)}枚は生成済みのためスキップ")

    # --- skip-existing設定 ---
    skip_existing = args.skip_existing and not args.no_skip_existing

    # --- 既存ファイルチェック ---
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if skip_existing:
        existing_files = [p for p in prompts if (output_dir / p["filename"]).exists()]
        new_files = [p for p in prompts if not (output_dir / p["filename"]).exists()]
    else:
        existing_files = []
        new_files = prompts

    # --- サマリ表示 ---
    total_prompts = len(all_prompts)
    print("=" * 60)
    print("  たまごっちゲーム 画像一括生成")
    print("=" * 60)
    print(f"  モデル     : {args.model}")
    print(f"  出力先     : {args.output_dir}")
    print(f"  リクエスト間隔: {args.delay}秒")
    print(f"  全プロンプト : {total_prompts}枚")
    print(f"  対象(フィルタ後): {len(prompts)}枚")
    if skip_existing:
        print(f"  既存スキップ : {len(existing_files)}枚")
        print(f"  新規生成対象 : {len(new_files)}枚")
    print(f"  生成済み(進捗): {len(progress.get('completed', []))}枚")
    total_time_min = (len(new_files) * args.delay) / 60
    print(f"  推定時間   : 約{total_time_min:.1f}分")
    print("=" * 60)

    if not new_files:
        print("\n全ての画像が生成済みです！新しいキャラを追加するには prompts.json を編集してください。")
        return

    # --- Dry Run ---
    if args.dry_run:
        if existing_files:
            print(f"\n[SKIP] 以下の{len(existing_files)}枚は既に存在するためスキップ:")
            for p in existing_files:
                size_kb = (output_dir / p["filename"]).stat().st_size / 1024
                print(f"  #{p['id']:02d} {p['name']} ({p['filename']}) [{size_kb:.1f} KB]")

        print(f"\n[DRY RUN] 以下の{len(new_files)}枚を新規生成します:\n")
        for p in new_files:
            print(f"  #{p['id']:02d} {p['name']} -> {p['filename']}")
            print(f"       {p['prompt'][:100]}...")
            print()
        print(f"新規生成: {len(new_files)}枚 / スキップ: {len(existing_files)}枚")
        return

    # --- Gemini Client初期化 ---
    client = genai.Client(api_key=api_key)

    # --- 生成ループ (新規のみ) ---
    success_count = 0
    fail_count = 0
    skip_count = len(existing_files)

    for i, prompt_data in enumerate(new_files):
        result = generate_single_image(
            client, args.model, prompt_data, output_dir,
            total_count=total_prompts, skip_existing=skip_existing,
        )

        if result is True:
            success_count += 1
            progress["completed"].append(prompt_data["id"])
            if prompt_data["id"] in progress.get("failed", []):
                progress["failed"].remove(prompt_data["id"])
        elif result is None:
            skip_count += 1
        else:
            fail_count += 1
            if prompt_data["id"] not in progress.get("failed", []):
                progress["failed"].append(prompt_data["id"])

        # 進捗を都度保存（中断に備える）
        save_progress(progress)

        # 最後のリクエスト以外はディレイを入れる（スキップ時は不要）
        if result is not None and i < len(new_files) - 1:
            print(f"  [{args.delay}秒待機中...]")
            time.sleep(args.delay)

    # --- 最終レポート ---
    print("\n" + "=" * 60)
    print("  生成完了レポート")
    print("=" * 60)
    print(f"  新規成功: {success_count}枚")
    print(f"  スキップ: {skip_count}枚")
    print(f"  失敗    : {fail_count}枚")
    print(f"  累計完了: {len(progress['completed'])}/{total_prompts}枚")

    if progress.get("failed"):
        print(f"\n  失敗したID: {progress['failed']}")
        print("  失敗分を再実行するには:")
        failed_ids = ",".join(str(x) for x in progress["failed"])
        print(f"    python scripts/generate-images.py --only {failed_ids}")

    print(f"\n  出力先: {output_dir.resolve()}")
    print("=" * 60)


if __name__ == "__main__":
    main()
