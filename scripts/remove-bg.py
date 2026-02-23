#!/usr/bin/env python3
"""
画像の市松模様（チェッカーボード）背景を除去し、透過PNGに変換するスクリプト
rembg (U2-Net) を使用
"""
import os
import sys
from pathlib import Path
from rembg import remove
from PIL import Image
import io

IMAGE_DIR = Path(__file__).parent.parent / "public" / "images"

# 背景除去をスキップするファイル（背景画像やUI素材）
SKIP_PREFIXES = ["bg_", "ui_"]

def process_image(filepath: Path) -> bool:
    """画像の背景を除去して上書き保存"""
    try:
        with open(filepath, "rb") as f:
            input_data = f.read()

        output_data = remove(input_data)

        # 結果を保存
        img = Image.open(io.BytesIO(output_data))
        img.save(filepath, "PNG")
        return True
    except Exception as e:
        print(f"  ERROR: {filepath.name} - {e}")
        return False

def main():
    if not IMAGE_DIR.exists():
        print(f"Error: {IMAGE_DIR} が見つかりません")
        sys.exit(1)

    png_files = sorted(IMAGE_DIR.glob("*.png"))

    # スキップ対象を除外
    target_files = [
        f for f in png_files
        if not any(f.name.startswith(prefix) for prefix in SKIP_PREFIXES)
    ]

    print(f"対象画像: {len(target_files)}枚 (スキップ: {len(png_files) - len(target_files)}枚)")
    print("=" * 50)

    success = 0
    failed = 0

    for i, filepath in enumerate(target_files, 1):
        print(f"[{i}/{len(target_files)}] {filepath.name} ... ", end="", flush=True)
        if process_image(filepath):
            print("OK")
            success += 1
        else:
            failed += 1

    print("=" * 50)
    print(f"完了: {success}枚成功, {failed}枚失敗")

if __name__ == "__main__":
    main()
