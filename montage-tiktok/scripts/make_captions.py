#!/usr/bin/env python3
"""
make_captions.py — Génère des sous-titres animés ".ass" au style storytime
(majuscules grasses, contour noir épais, apparition "pop"), à partir :
  - d'un fichier .srt (recommandé : sortie Whisper), OU
  - d'un fichier texte brut (.txt) réparti sur une durée donnée.

Usage :
  python3 make_captions.py entree.srt sortie.ass [--w 1080] [--h 1920]
  python3 make_captions.py script.txt sortie.ass --duration 42 --w 1080 --h 1920

Le style vise à reproduire les sous-titres de la vidéo de référence.
"""
import argparse
import re
import sys

def srt_time_to_cs(t):
    # "00:00:03,120" -> centièmes de seconde
    h, m, rest = t.split(":")
    s, ms = rest.split(",")
    return (int(h) * 3600 + int(m) * 60 + int(s)) * 100 + int(ms) // 10

def cs_to_ass(cs):
    # centièmes -> H:MM:SS.cc
    h = cs // 360000
    cs %= 360000
    m = cs // 6000
    cs %= 6000
    s = cs // 100
    c = cs % 100
    return f"{h}:{m:02d}:{s:02d}.{c:02d}"

def parse_srt(path):
    with open(path, encoding="utf-8-sig") as f:
        content = f.read().strip()
    blocks = re.split(r"\n\s*\n", content)
    cues = []
    for b in blocks:
        lines = [l for l in b.splitlines() if l.strip()]
        if len(lines) < 2:
            continue
        # trouve la ligne de timing
        timing = next((l for l in lines if "-->" in l), None)
        if not timing:
            continue
        start_s, end_s = [x.strip() for x in timing.split("-->")]
        text_lines = lines[lines.index(timing) + 1:]
        text = " ".join(text_lines).strip()
        if text:
            cues.append((srt_time_to_cs(start_s), srt_time_to_cs(end_s), text))
    return cues

def chunk_words(text, max_words=3):
    """Découpe une phrase en morceaux de 2-3 mots (style storytime)."""
    words = text.split()
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words:
            chunks.append(" ".join(cur))
            cur = []
    if cur:
        chunks.append(" ".join(cur))
    return chunks

def cues_to_chunks(cues, max_words=3):
    """Redécoupe chaque cue en petits morceaux de 2-3 mots, timés au prorata."""
    out = []
    for start, end, text in cues:
        chunks = chunk_words(text, max_words)
        if not chunks:
            continue
        dur = max(end - start, len(chunks) * 25)  # min ~0.25s/morceau
        step = dur / len(chunks)
        for i, ch in enumerate(chunks):
            cs = int(start + i * step)
            ce = int(start + (i + 1) * step)
            out.append((cs, ce, ch))
    return out

def parse_txt(path, duration_s):
    with open(path, encoding="utf-8-sig") as f:
        text = " ".join(l.strip() for l in f if l.strip())
    chunks = chunk_words(text, 3)
    if not chunks:
        return []
    total = int(duration_s * 100)
    step = total / len(chunks)
    return [(int(i * step), int((i + 1) * step), ch) for i, ch in enumerate(chunks)]

ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Story,{font},{fsize},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,1,0,1,{outline},{shadow},5,60,60,{marginv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

def build_ass(chunks, w, h, font):
    fsize = int(h * 0.055)          # ~105 px sur 1920
    outline = max(3, int(h * 0.006))
    shadow = max(1, int(h * 0.002))
    marginv = int(h * 0.06)         # légèrement sous le centre (align 5)
    header = ASS_HEADER.format(w=w, h=h, font=font, fsize=fsize,
                               outline=outline, shadow=shadow, marginv=marginv)
    lines = []
    for start, end, text in chunks:
        text = text.upper().replace("\n", " ").strip()
        # pop-in : fondu + montée d'échelle 80%->100%
        anim = r"{\fad(60,40)\fscx80\fscy80\t(0,110,\fscx100\fscy100)}"
        lines.append(
            f"Dialogue: 0,{cs_to_ass(start)},{cs_to_ass(end)},Story,,0,0,0,,{anim}{text}"
        )
    return header + "\n".join(lines) + "\n"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="fichier .srt ou .txt")
    ap.add_argument("output", help="fichier .ass de sortie")
    ap.add_argument("--w", type=int, default=1080)
    ap.add_argument("--h", type=int, default=1920)
    ap.add_argument("--font", default="FreeSans")
    ap.add_argument("--duration", type=float, default=None,
                    help="durée (s) si l'entrée est un .txt")
    ap.add_argument("--max-words", type=int, default=3)
    args = ap.parse_args()

    if args.input.lower().endswith(".srt"):
        cues = parse_srt(args.input)
        chunks = cues_to_chunks(cues, args.max_words)
    else:
        if args.duration is None:
            sys.exit("Erreur : --duration requis pour une entrée .txt")
        chunks = parse_txt(args.input, args.duration)

    if not chunks:
        sys.exit("Aucun sous-titre généré (entrée vide ?).")

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(build_ass(chunks, args.w, args.h, args.font))
    print(f"OK : {len(chunks)} sous-titres écrits dans {args.output}")

if __name__ == "__main__":
    main()
