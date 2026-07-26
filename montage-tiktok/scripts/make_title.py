#!/usr/bin/env python3
"""
make_title.py — Génère un bandeau titre PNG transparent avec emoji couleur,
au style storytime (majuscules grasses, blanc, contour noir épais).

Usage :
  python3 make_title.py "😱 SWEEY TUE AKIRAA" titre.png [--size 92] [--w 1080]

Les emojis sont rendus via Noto Color Emoji, le texte via FreeSans Bold.
"""
import argparse
import unicodedata
from PIL import Image, ImageDraw, ImageFont

TEXT_FONT = "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
EMOJI_NATIVE = 109  # NotoColorEmoji (bitmap) ne se rend qu'à cette taille


def is_emoji(ch):
    if ch in "️‍":
        return True
    try:
        return unicodedata.category(ch) == "So" or ord(ch) >= 0x1F000
    except Exception:
        return False


def split_runs(text):
    """Découpe le texte en runs (is_emoji, chunk)."""
    runs = []
    for ch in text:
        e = is_emoji(ch)
        if runs and runs[-1][0] == e:
            runs[-1][1] += ch
        else:
            runs.append([e, ch])
    return runs


def render(text, out, size, maxw):
    text = text.upper()
    font = ImageFont.truetype(TEXT_FONT, size)
    efont = ImageFont.truetype(EMOJI_FONT, EMOJI_NATIVE)
    stroke = max(4, size // 11)
    pad = stroke * 3
    esize = int(size * 1.15)  # taille cible des emojis

    # mesure
    runs = split_runs(text)
    widths = []
    for e, chunk in runs:
        if e:
            n = len([c for c in chunk if c not in "️‍"])
            widths.append(n * (esize + size // 6))
        else:
            widths.append(int(font.getlength(chunk)))
    total_w = sum(widths) + 2 * pad
    total_h = size + 2 * pad + size // 4

    img = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = pad
    baseline_y = pad + size // 8

    for (e, chunk), w in zip(runs, widths):
        if e:
            for c in chunk:
                if c in "️‍":
                    continue
                em = Image.new("RGBA", (EMOJI_NATIVE + 30, EMOJI_NATIVE + 30), (0, 0, 0, 0))
                ImageDraw.Draw(em).text((0, 0), c, font=efont, embedded_color=True)
                bbox = em.getbbox()
                if bbox:
                    em = em.crop(bbox)
                em = em.resize((esize, esize), Image.LANCZOS)
                img.paste(em, (x, baseline_y + (size - esize) // 2), em)
                x += esize + size // 6
        else:
            d.text((x, baseline_y), chunk, font=font, fill="white",
                   stroke_width=stroke, stroke_fill="black")
            x += w

    # réduit si trop large
    if img.width > maxw:
        r = maxw / img.width
        img = img.resize((maxw, int(img.height * r)), Image.LANCZOS)

    img.save(out)
    print(f"OK : {out} ({img.width}x{img.height})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("text")
    ap.add_argument("output")
    ap.add_argument("--size", type=int, default=92)
    ap.add_argument("--w", type=int, default=1020, help="largeur max")
    ap.parse_args()
    a = ap.parse_args()
    render(a.text, a.output, a.size, a.w)
