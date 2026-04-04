#!/usr/bin/env python3
"""
白背景を透過に変換するスクリプト
新規追加キャラ画像 + 表情差分の白背景を除去する
"""

from PIL import Image
import os
import sys

# 対象ファイル（新規追加分すべて）
TARGET_DIR = "public/images"
TARGET_FILES = [
    # ベビー
    "baby_fuwacchi.png",
    "baby_fuwacchi_expressions.png",
    "baby_kiracchi.png",
    "baby_kiracchi_expressions.png",
    # キッズ
    "kids_hoshitamacchi.png",
    "kids_hoshitamacchi_expressions.png",
    "kids_hanatamacchi.png",
    "kids_hanatamacchi_expressions.png",
    "kids_yukitamacchi.png",
    "kids_yukitamacchi_expressions.png",
    "kids_hinatamacchi.png",
    "kids_hinatamacchi_expressions.png",
    # ヤング
    "young_honacchi.png",
    "young_honacchi_expressions.png",
    "young_yukicchi.png",
    "young_yukicchi_expressions.png",
    "young_hinacchi.png",
    "young_hinacchi_expressions.png",
    "young_kiracchi.png",
    "young_kiracchi_expressions.png",
]

def remove_white_background(image_path, threshold=240, edge_feather=2):
    """
    白背景を透過に変換する。
    threshold: この値以上のRGB値を白とみなす
    edge_feather: キャラのエッジ付近のアンチエイリアスを考慮
    """
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # 既に透明なピクセルはスキップ
            if a == 0:
                continue
            # 白〜ほぼ白のピクセルを透過に
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
            # 薄い白（アンチエイリアス部分）は半透明に
            elif r >= threshold - 20 and g >= threshold - 20 and b >= threshold - 20:
                # 白に近いほど透明に
                whiteness = min(r, g, b)
                alpha_factor = max(0, (threshold - whiteness) / 20)
                new_alpha = int(a * alpha_factor)
                pixels[x, y] = (r, g, b, new_alpha)

    img.save(image_path, "PNG")
    return img.size


def main():
    processed = 0
    skipped = 0

    for filename in TARGET_FILES:
        filepath = os.path.join(TARGET_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  [SKIP] {filename} - ファイルが存在しません")
            skipped += 1
            continue

        # 既に透過かどうかチェック
        img = Image.open(filepath).convert("RGBA")
        pixels = list(img.getdata())
        # 四隅のピクセルで白背景チェック
        w, h = img.size
        corners = [
            pixels[0],           # 左上
            pixels[w - 1],       # 右上
            pixels[(h - 1) * w], # 左下
            pixels[h * w - 1],   # 右下
        ]
        white_corners = sum(1 for r, g, b, a in corners if r > 240 and g > 240 and b > 240 and a > 200)

        if white_corners >= 2:
            size = remove_white_background(filepath)
            file_kb = os.path.getsize(filepath) / 1024
            print(f"  [OK] {filename} - 白背景除去完了 ({size[0]}x{size[1]}, {file_kb:.1f}KB)")
            processed += 1
        else:
            # 透過済みでも薄い白が残っている可能性があるのでチェック
            # 端のピクセル列で白が多いか確認
            top_row = pixels[:w]
            white_top = sum(1 for r, g, b, a in top_row if r > 240 and g > 240 and b > 240 and a > 200)
            if white_top > w * 0.3:
                size = remove_white_background(filepath)
                file_kb = os.path.getsize(filepath) / 1024
                print(f"  [OK] {filename} - 部分的な白背景を除去 ({size[0]}x{size[1]}, {file_kb:.1f}KB)")
                processed += 1
            else:
                file_kb = os.path.getsize(filepath) / 1024
                print(f"  [SKIP] {filename} - 既に透過済み ({file_kb:.1f}KB)")
                skipped += 1

    print(f"\n完了: 処理={processed}枚, スキップ={skipped}枚")


if __name__ == "__main__":
    main()
