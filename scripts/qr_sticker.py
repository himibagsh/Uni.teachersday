"""Printable QR stickers for the card's «QR код наах хэсэг» box.

The box on the card measures 50 x 50 mm, so the sticker is 45 mm and sits
inside it with a margin. Everything is drawn as vector, so it stays crisp at
any size.

Decoration is kept to what a scanner tolerates. Readers threshold on
luminance, so every module stays dark against the paper: the colour ramp runs
between a deepened copper and the card's navy, both well under the luminance
of the background. Error correction is level H (30% recovery), which pays for
the cleared centre holding the benzene mark.
"""
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
import math

URL = 'https://himibagsh.github.io/Uni.teachersday/'

COPPER = (0xa8/255, 0x49/255, 0x1f/255)   # гүнзгийрүүлсэн зэс
NAVY   = (0x15/255, 0x1a/255, 0x33/255)
PAPER  = (0xfb/255, 0xfb/255, 0xfd/255)
GUIDE  = (0.84, 0.85, 0.88)

QUIET = 4          # заавал байх цагаан хүрээ, модулиар
EMBLEM = 7         # төвд цэвэрлэх талбай, модулиар


def matrix(url):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=0)
    q.add_data(url)
    q.make(fit=True)
    return [[bool(c) for c in row] for row in q.get_matrix()], q.version


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def in_finder(r, c, n):
    return ((r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7))


def in_emblem(r, c, n):
    lo = (n - EMBLEM) // 2
    return lo <= r < lo + EMBLEM and lo <= c < lo + EMBLEM


def draw_qr(cv, x0, y0, side, mat, n):
    """x0,y0 = bottom-left of the whole sticker; side = sticker edge length."""
    total = n + QUIET * 2
    m = side / total                      # нэг модулийн хэмжээ
    top = y0 + side

    def mx(c): return x0 + (c + QUIET) * m
    def my(r): return top - (r + QUIET + 1) * m

    # --- өгөгдлийн модулиуд ---
    pad = m * 0.055
    rad = m * 0.30
    for r in range(n):
        for c in range(n):
            if not mat[r][c] or in_finder(r, c, n) or in_emblem(r, c, n):
                continue
            t = (r + c) / (2 * (n - 1))
            cv.setFillColorRGB(*lerp(COPPER, NAVY, t))
            cv.roundRect(mx(c) + pad, my(r) + pad,
                         m - 2 * pad, m - 2 * pad, rad, stroke=0, fill=1)

    # --- булангийн гурван нүд ---
    for (r0, c0) in ((0, 0), (0, n - 7), (n - 7, 0)):
        t = (r0 + c0) / (2 * (n - 1))
        cv.setFillColorRGB(*lerp(COPPER, NAVY, t))
        ox, oy = mx(c0), my(r0 + 6)
        # гадна хүрээ: 7x7 дүүргээд дотор нь 5x5 цагаанаар хасна
        cv.roundRect(ox, oy, 7 * m, 7 * m, m * 1.05, stroke=0, fill=1)
        cv.setFillColorRGB(*PAPER)
        cv.roundRect(ox + m, oy + m, 5 * m, 5 * m, m * 0.75, stroke=0, fill=1)
        cv.setFillColorRGB(*lerp(COPPER, NAVY, t))
        cv.roundRect(ox + 2 * m, oy + 2 * m, 3 * m, 3 * m, m * 0.5, stroke=0, fill=1)

    # --- төвийн бензолын тэмдэг ---
    lo = (n - EMBLEM) // 2
    ex, ey = mx(lo), my(lo + EMBLEM - 1)
    es = EMBLEM * m
    cv.setFillColorRGB(*PAPER)
    cv.roundRect(ex, ey, es, es, m * 0.9, stroke=0, fill=1)
    cx, cy, rr = ex + es / 2, ey + es / 2, es * 0.33
    cv.setStrokeColorRGB(*NAVY)
    cv.setLineWidth(es * 0.085)
    p = cv.beginPath()
    for i in range(6):
        a = math.pi / 2 + i * math.pi / 3
        px, py = cx + math.cos(a) * rr, cy + math.sin(a) * rr
        if i == 0: p.moveTo(px, py)
        else: p.lineTo(px, py)
    p.close()
    cv.drawPath(p, stroke=1, fill=0)


def sheet(path, side_mm=45, cols=4, rows=5, pages=2, guides=True):
    mat, ver = matrix(URL)
    n = len(mat)
    cv = canvas.Canvas(path, pagesize=A4)
    cv.setTitle('Багшийн баяр · QR наалт')
    cv.setAuthor('«Багш, химийн боловсрол» хөтөлбөрийн оюутнууд')

    W, H = A4
    side = side_mm * mm
    gapx = (W - cols * side) / (cols + 1)
    gapy = (H - rows * side) / (rows + 1)

    for _ in range(pages):
        for r in range(rows):
            for c in range(cols):
                x = gapx + c * (side + gapx)
                y = H - gapy - side - r * (side + gapy)
                cv.setFillColorRGB(*PAPER)
                cv.rect(x, y, side, side, stroke=0, fill=1)
                if guides:
                    cv.setStrokeColorRGB(*GUIDE)
                    cv.setLineWidth(0.3)
                    cv.rect(x, y, side, side, stroke=1, fill=0)
                draw_qr(cv, x, y, side, mat, n)
        cv.showPage()

    # нэг том хувилбар: хаалга, самбарт
    big = 120 * mm
    cv.setFillColorRGB(*PAPER)
    cv.rect((W - big) / 2, (H - big) / 2 + 20 * mm, big, big, stroke=0, fill=1)
    draw_qr(cv, (W - big) / 2, (H - big) / 2 + 20 * mm, big, mat, n)
    cv.setFillColorRGB(*NAVY)
    cv.setFont('Helvetica', 11)
    cv.drawCentredString(W / 2, (H - big) / 2 + 6 * mm, URL)
    cv.showPage()

    cv.save()
    return ver, n


if __name__ == '__main__':
    ver, n = sheet('print/qr-stickers.pdf')
    print(f'QR version {ver} ({n}x{n} modules), ECC H')
    print('wrote print/qr-stickers.pdf')
