#!/usr/bin/env python3
"""
Generate the "Open Your Eye" one-shot end to end.

Chains 4 image-to-video generations on fal.ai (Seedance), feeding the last
frame of each shot into the next, then assembles and trims the result.

Usage:
    pip install fal-client
    export FAL_KEY="votre_cle"
    python3 generate_oneshot.py reference.jpg

Output:
    out/shot01..04.mp4, out/FINAL.mp4

Note: run this on your own machine. The sandbox this was written in has no
network access to fal.ai and no ffmpeg.
"""

import os
import subprocess
import sys
from pathlib import Path

try:
    import fal_client
except ImportError:
    sys.exit("Manque fal-client. Lancez : pip install fal-client")

# Si fal renomme l'endpoint, c'est la seule ligne a changer.
MODEL = "fal-ai/bytedance/seedance/v1/pro/image-to-video"

OUT = Path("out")

NEGATIVE = (
    "cuts, jump cuts, scene transitions, text, subtitles, watermark, logo, "
    "extra limbs, deformed hands, warped face, changing hairstyle, changing "
    "clothes, second person, crowd, cartoon, anime, low resolution, "
    "letterbox bars, horizontal framing"
)

SHOTS = [
    {
        "name": "shot01",
        "duration": 5,
        "prompt": (
            "A hooded woman in a heavy charcoal monastic robe enters from the "
            "right and raises one finger to the young man's forehead. He stares "
            "upward, pupils dilating. The camera performs a strong dolly zoom "
            "vertigo effect, pushing in while the background stretches away "
            "behind him. Dust hangs frozen in the air. Dim concrete room, single "
            "warm practical light, deep shadows. Cinematic, photorealistic, "
            "anamorphic lens flares, film grain."
        ),
    },
    {
        "name": "shot02",
        "duration": 5,
        "prompt": (
            "The ceiling peels open against gravity and the young man is "
            "violently pulled straight upward, arms trailing overhead, hair and "
            "jersey snapping upward. The camera whip-tilts to vertical and rises "
            "beneath him at matched speed, looking up at his sneakers, extreme "
            "wide-angle distortion. Concrete debris and dust rise past the lens. "
            "The hooded figure below shrinks away, motionless. Fast vertical "
            "camera movement, heavy motion blur, photorealistic."
        ),
    },
    {
        "name": "shot03",
        "duration": 10,
        "prompt": (
            "He bursts through a rooftop in an exploding ring of timber and "
            "shingles. Hard exposure shift from dark interior to blown-out "
            "daylight. The camera stays directly beneath him, ascending, as grey "
            "city rooftops rush away below and the horizon curves. He rises into "
            "a thick white cloud deck, visible only as a silhouette, then punches "
            "through into deep blue sky. Vapour trails spiral off his fingertips. "
            "Continuous vertical tracking shot, sunlight godrays, photorealistic."
        ),
    },
    {
        "name": "shot04",
        "duration": 5,
        "prompt": (
            "The blue sky drains from the top of the frame to black as stars "
            "appear. The camera decelerates to a stop and slowly orbits around "
            "him while he settles into weightless drift, limbs loose. The "
            "curvature of the Earth fills the lower frame, terminator line "
            "sweeping, thin blue atmospheric rind against black space. He opens "
            "his eyes. Slow graceful motion, hard sunlight, deep black shadows, "
            "photorealistic space."
        ),
    },
]


def need_ffmpeg():
    if subprocess.run(["which", "ffmpeg"], capture_output=True).returncode != 0:
        sys.exit("ffmpeg introuvable. Installez-le : apt install ffmpeg / brew install ffmpeg")


def last_frame(video: Path, png: Path):
    """Extract the final frame so the next shot can start exactly where this one ends."""
    subprocess.run(
        ["ffmpeg", "-y", "-sseof", "-0.1", "-i", str(video), "-vframes", "1", "-q:v", "1", str(png)],
        check=True,
        capture_output=True,
    )


def render(shot, image_path: Path) -> Path:
    print(f"[{shot['name']}] generation ({shot['duration']}s)...")
    url = fal_client.upload_file(str(image_path))
    result = fal_client.subscribe(
        MODEL,
        arguments={
            "prompt": shot["prompt"],
            "negative_prompt": NEGATIVE,
            "image_url": url,
            "duration": shot["duration"],
            "resolution": "1080p",
            "aspect_ratio": "9:16",
        },
        with_logs=False,
    )
    video_url = result["video"]["url"]
    dest = OUT / f"{shot['name']}.mp4"
    subprocess.run(["curl", "-sSL", "-o", str(dest), video_url], check=True)
    print(f"[{shot['name']}] -> {dest}")
    return dest


def assemble(clips):
    listing = OUT / "list.txt"
    listing.write_text("".join(f"file '{c.resolve()}'\n" for c in clips))

    raw = OUT / "raw.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", str(raw)],
        check=True, capture_output=True,
    )

    final = OUT / "FINAL.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(raw), "-t", "24",
         "-vf", "scale=2160:3840:flags=lanczos,fps=24",
         "-c:v", "libx264", "-crf", "16", "-preset", "slow", str(final)],
        check=True, capture_output=True,
    )
    return final


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 generate_oneshot.py <image_de_reference>")
    if not os.environ.get("FAL_KEY"):
        sys.exit("FAL_KEY non definie. export FAL_KEY='...'")

    need_ffmpeg()
    ref = Path(sys.argv[1])
    if not ref.exists():
        sys.exit(f"Introuvable : {ref}")

    OUT.mkdir(exist_ok=True)

    clips = []
    current = ref
    for shot in SHOTS:
        clip = render(shot, current)
        clips.append(clip)
        # chainage : la derniere image devient l'image de depart du plan suivant
        current = OUT / f"{shot['name']}_end.png"
        last_frame(clip, current)

    final = assemble(clips)
    print(f"\nTermine : {final}")
    print("Reste a faire a la main : fondus de 4-6 images sur les 3 raccords, "
          "etalonnage, et la bande son (voir ONESHOT_OPEN_YOUR_EYE.md section 6).")


if __name__ == "__main__":
    main()
