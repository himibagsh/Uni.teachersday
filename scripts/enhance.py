"""Багш нарын зургийг дэлгэцэнд тохируулан томруулж, зөөлөн хурцална.

Утас зургийг 3 дахин нягт дэлгэцэнд зурдаг тул 100-250 пикселийн эх зургийг
хөтөч өөрөө сунгахад бүдгэрдэг. Энд урьдчилан Lanczos-оор томруулж, өсгөсөн
хэмжээнд тохирсон зөөлөн хурцлалт нэмнэ. Хөтчийн энгийн сунгалтаас цэвэрхэн.

Байхгүй нарийвчлалыг нөхөж чадахгүй: 105x131 эх зураг томорсон ч тодрохгүй.
Жинхэнэ шийдэл нь тэнхимээс эх файлыг нь авах.

    python3 scripts/enhance.py
"""
import cv2, numpy as np, glob, os
from pathlib import Path

OUT_W = 440                      # 4:5 -> 440 x 550

def enhance(bgr, out_w=OUT_W):
    h, w = bgr.shape[:2]
    factor = out_w / w
    out_h = round(out_w * 5 / 4)
    if factor <= 1:
        return cv2.resize(bgr, (out_w, out_h), interpolation=cv2.INTER_AREA)
    # хүчтэй томруулахын өмнө JPEG-ийн чимээг намируулна
    den = cv2.bilateralFilter(bgr, 5, 22, 22) if factor > 2.2 else bgr
    up = cv2.resize(den, (out_w, out_h), interpolation=cv2.INTER_LANCZOS4)
    sigma = 1.0 + 0.5 * min(factor, 4)
    amount = 0.34 if factor > 2.4 else 0.26
    blur = cv2.GaussianBlur(up, (0, 0), sigma)
    return np.clip(cv2.addWeighted(up, 1 + amount, blur, -amount, 0), 0, 255).astype(np.uint8)

def main():
    files = sorted(glob.glob('assets/img/bagsh/*.jpg'))
    total_before = total_after = 0
    for f in files:
        src = cv2.imread(f)
        total_before += os.path.getsize(f)
        cv2.imwrite(f, enhance(src), [cv2.IMWRITE_JPEG_QUALITY, 88,
                                      cv2.IMWRITE_JPEG_PROGRESSIVE, 1,
                                      cv2.IMWRITE_JPEG_OPTIMIZE, 1])
        total_after += os.path.getsize(f)
        print(f'  {Path(f).name:<22} {str(src.shape[1::-1]):>11} -> ({OUT_W}, {round(OUT_W*5/4)})')
    print(f'\n{len(files)} portraits | {total_before//1024} KB -> {total_after//1024} KB')

if __name__ == '__main__':
    main()
