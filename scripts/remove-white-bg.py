#!/usr/bin/env python3
"""
白背景を透過に変換するスクリプト v2
フラッドフィル + グローバル白除去の2段構えで確実に除去する
"""

from PIL import Image
from collections import deque
import os
import sys


def flood_fill_from_edges(img, threshold=220):
    """四辺からフラッドフィルで白系ピクセルを透過にする"""
    pixels = img.load()
    w, h = img.size
    visited = set()
    queue = deque()

    # 四辺のピクセルをシードにする
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        if a == 0:
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))
        elif r >= threshold and g >= threshold and b >= threshold:
            pixels[x, y] = (r, g, b, 0)
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))
        elif r >= threshold - 15 and g >= threshold - 15 and b >= threshold - 15:
            whiteness = min(r, g, b)
            alpha_factor = max(0, (threshold - whiteness) / 15)
            pixels[x, y] = (r, g, b, int(a * alpha_factor))
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))


def global_white_removal(img, threshold=230):
    """
    全ピクセル走査で残った白系ピクセルを除去する。
    キャラ内部に閉じ込められた白領域も除去。
    ただしキャラ本体の薄い色は保護する。
    """
    pixels = img.load()
    w, h = img.size
    removed = 0

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
                removed += 1
            elif r >= threshold - 10 and g >= threshold - 10 and b >= threshold - 10:
                whiteness = min(r, g, b)
                alpha_factor = max(0, (threshold - whiteness) / 10)
                new_a = int(a * alpha_factor)
                if new_a < 10:
                    new_a = 0
                pixels[x, y] = (r, g, b, new_a)
                if new_a == 0:
                    removed += 1
    return removed


def process_image(filepath, is_light_char=False):
    """画像を処理する"""
    img = Image.open(filepath).convert('RGBA')

    # Step 1: エッジからフラッドフィル (threshold低め)
    flood_fill_from_edges(img, threshold=215)

    # Step 2: グローバル白除去
    # 薄い色のキャラ（ゆきたまっち等）は閾値を調整
    if is_light_char:
        # 明るいキャラはthreshold高めにしてキャラ本体を保護
        removed = global_white_removal(img, threshold=245)
    else:
        removed = global_white_removal(img, threshold=225)

    img.save(filepath, 'PNG')
    return removed


def main():
    TARGET_DIR = 'public/images'

    # 明るい色のキャラ（白/氷/クリーム系の本体色をもつもの）
    LIGHT_CHARS = {
        'baby_fuwacchi',    # クリーム白の本体
        'kids_yukitamacchi', # 白〜水色の氷キャラ
        'young_yukicchi',   # 白〜水色の氷キャラ
    }

    PROBLEM_FILES = [
        'baby_fuwacchi.png', 'baby_fuwacchi_expressions.png',
        'baby_kiracchi.png', 'baby_kiracchi_expressions.png',
        'kids_hoshitamacchi.png', 'kids_hoshitamacchi_expressions.png',
        'kids_hanatamacchi.png', 'kids_hanatamacchi_expressions.png',
        'kids_yukitamacchi.png', 'kids_yukitamacchi_expressions.png',
        'kids_hinatamacchi_expressions.png',
        'young_honacchi_expressions.png',
        'young_yukicchi.png', 'young_yukicchi_expressions.png',
        'young_hinacchi.png', 'young_hinacchi_expressions.png',
        'young_kiracchi.png', 'young_kiracchi_expressions.png',
    ]

    for fname in PROBLEM_FILES:
        fpath = os.path.join(TARGET_DIR, fname)
        if not os.path.exists(fpath):
            print("[SKIP] {} - not found".format(fname))
            continue

        # キャラ名を取得してlight判定
        char_name = fname.rsplit('.', 1)[0].replace('_expressions', '')
        is_light = char_name in LIGHT_CHARS

        removed = process_image(fpath, is_light_char=is_light)
        size_kb = os.path.getsize(fpath) / 1024
        light_tag = " (light-char)" if is_light else ""
        print("[OK] {} - {}px removed ({:.0f}KB){}".format(fname, removed, size_kb, light_tag))

    # 検証
    print("\n--- 検証 ---")
    ALL_NEW = [
        'baby_fuwacchi.png', 'baby_fuwacchi_expressions.png',
        'baby_kiracchi.png', 'baby_kiracchi_expressions.png',
        'kids_hoshitamacchi.png', 'kids_hoshitamacchi_expressions.png',
        'kids_hanatamacchi.png', 'kids_hanatamacchi_expressions.png',
        'kids_yukitamacchi.png', 'kids_yukitamacchi_expressions.png',
        'kids_hinatamacchi.png', 'kids_hinatamacchi_expressions.png',
        'young_honacchi.png', 'young_honacchi_expressions.png',
        'young_yukicchi.png', 'young_yukicchi_expressions.png',
        'young_hinacchi.png', 'young_hinacchi_expressions.png',
        'young_kiracchi.png', 'young_kiracchi_expressions.png',
    ]

    still_bad = []
    for fname in ALL_NEW:
        fpath = os.path.join(TARGET_DIR, fname)
        if not os.path.exists(fpath):
            continue
        img = Image.open(fpath).convert('RGBA')
        pixels = img.load()
        w, h = img.size
        white_count = 0
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a > 10 and r >= 225 and g >= 225 and b >= 225:
                    white_count += 1
        status = "OK" if white_count == 0 else "REMAINING: {}px".format(white_count)
        if white_count > 0:
            still_bad.append((fname, white_count))
        print("  {} - {}".format(fname, status))

    if still_bad:
        print("\nまだ白ピクセルが残っているファイル:")
        for f, c in still_bad:
            print("  {} ({})".format(f, c))
    else:
        print("\n全ファイル問題なし！")


if __name__ == '__main__':
    main()
