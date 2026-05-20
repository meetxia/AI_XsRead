"""
封面图片批量压缩脚本
将 covers-optimized 目录下的 PNG 转换为 JPG，目标大小 100-200KB
"""
import os
from pathlib import Path
from PIL import Image

SRC_DIR = Path(__file__).parent / "covers-optimized"
OUT_DIR = Path(__file__).parent / "covers-jpg"
TARGET_MIN = 100 * 1024   # 100 KB
TARGET_MAX = 200 * 1024   # 200 KB
INITIAL_QUALITY = 82      # 起始质量
MIN_QUALITY = 40          # 最低质量下限

OUT_DIR.mkdir(exist_ok=True)

results = []

for src_path in sorted(SRC_DIR.glob("*.png")):
    stem = src_path.stem
    out_path = OUT_DIR / f"{stem}.jpg"

    with Image.open(src_path) as img:
        # 转 RGB（PNG 可能含 alpha 通道）
        if img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # 二分法找合适的 quality 值
        lo, hi = MIN_QUALITY, 95
        best_quality = INITIAL_QUALITY
        best_size = None

        for _ in range(10):  # 最多迭代 10 次
            mid = (lo + hi) // 2
            import io
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=mid, optimize=True, progressive=True)
            size = buf.tell()

            if TARGET_MIN <= size <= TARGET_MAX:
                best_quality = mid
                best_size = size
                break
            elif size > TARGET_MAX:
                hi = mid - 1
            else:
                lo = mid + 1
                best_quality = mid  # 记录最接近下限的质量
                best_size = size

        # 写出文件
        img.save(out_path, format="JPEG", quality=best_quality, optimize=True, progressive=True)
        final_size = out_path.stat().st_size
        src_size = src_path.stat().st_size

        results.append({
            "name": stem,
            "src_kb": round(src_size / 1024, 1),
            "out_kb": round(final_size / 1024, 1),
            "quality": best_quality,
        })
        print(f"  ✓ {stem}.jpg  {round(src_size/1024)}KB → {round(final_size/1024)}KB  (q={best_quality})")

print(f"\n完成！共处理 {len(results)} 张，输出目录：{OUT_DIR}")
avg_out = sum(r['out_kb'] for r in results) / len(results)
print(f"平均输出大小：{avg_out:.1f} KB")
