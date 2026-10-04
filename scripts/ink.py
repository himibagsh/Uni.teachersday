"""Photograph -> pen drawing.

A local-mean threshold traces edges, so dark hair becomes hatching rather than a
solid mass. Two things keep 23 very different sources consistent: the face is
located first so the vignette sits on it, and the threshold is auto-tuned per
photograph to land on the same ink density. Nothing is invented — every line
comes from the photograph the students supplied."""
import cv2, numpy as np

WORK_H = 900

def prep(bgr, clahe=2.0):
    g = bgr if bgr.ndim == 2 else cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    h, w = g.shape
    s = WORK_H / h
    g = cv2.resize(g, (max(1, int(round(w*s))), WORK_H),
                   interpolation=cv2.INTER_CUBIC if s > 1 else cv2.INTER_AREA)
    if clahe:
        g = cv2.createCLAHE(clipLimit=clahe, tileGridSize=(8, 8)).apply(g)
    g = cv2.bilateralFilter(g, 9, 60, 60)
    g = cv2.bilateralFilter(g, 9, 60, 60)
    return cv2.medianBlur(g, 3)

def find_face(g):
    """Every source is already cropped to a 4:5 headshot, so the head sits in a
    predictable place; no detector needed."""
    h, w = g.shape
    return w/2, h*0.40, min(w, h)*0.55

def despeckle(binary, min_frac=9e-5):
    ink = (binary == 0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(ink, connectivity=8)
    min_px = max(12, int(min_frac * binary.size))
    keep = np.array([False] + [stats[i, cv2.CC_STAT_AREA] >= min_px for i in range(1, n)])
    return np.where(keep[lab], 0, 255).astype(np.uint8)

def vignette(binary, cx, cy, fs):
    h, w = binary.shape
    rx, ry = fs * 1.45, fs * 1.75
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - cx)/rx)**2 + ((yy - cy)/ry)**2)
    keep = np.clip((1.30 - r) / 0.50, 0, 1)
    f = binary.astype(np.float32)/255
    return np.clip(1 - (1 - f) * keep, 0, 1)

def _ink_ratio(binary, cx, cy, fs):
    h, w = binary.shape
    x0, x1 = int(max(0, cx-fs*0.6)), int(min(w, cx+fs*0.6))
    y0, y1 = int(max(0, cy-fs*0.7)), int(min(h, cy+fs*0.7))
    box = binary[y0:y1, x0:x1]
    return float((box == 0).mean()) if box.size else 0.0

def draw(bgr, block=23, target=0.085, clahe=2.0, min_frac=9e-5, C=None):
    """target = share of the face box that should be ink. Auto-solves for C."""
    g = prep(bgr, clahe=clahe)
    cx, cy, fs = find_face(g)

    def binarise(c):
        return cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY, block, c)
    if C is None:
        lo, hi = 1.0, 24.0            # higher C -> less ink
        for _ in range(14):
            mid = (lo + hi) / 2
            if _ink_ratio(binarise(mid), cx, cy, fs) > target:
                lo = mid
            else:
                hi = mid
        C = (lo + hi) / 2
    b = binarise(C)
    b = despeckle(b, min_frac)
    return vignette(b, cx, cy, fs), C, (cx, cy, fs)
