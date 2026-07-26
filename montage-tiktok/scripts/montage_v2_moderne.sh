#!/usr/bin/env bash
# =============================================================================
# montage_v2_moderne.sh — Montage "moderne" pour le clip Sweey/Akiraa
#
# Effets appliqués :
#   - 1080x1920 @ 60 fps (fluide)
#   - étalonnage punchy (saturation +25 %, contraste léger)
#   - bandeau titre animé sous la facecam (chute + rebond + flottement)
#   - flash blanc + secousse caméra sur le cut (~13.15 s)
#   - audio normalisé (loudnorm)
#   - carton final "LIKE & ABONNE-TOI !"
#
# Usage : ./montage_v2_moderne.sh <in.mp4> <titre.png> <out.mp4> [t_flash]
# =============================================================================
set -euo pipefail

IN="${1:?video entree}"
TITLE="${2:?bandeau PNG}"
OUT="${3:?sortie}"
TFLASH="${4:-13.15}"

W=1080; H=1920; FPS=60
PRESET="${X264_PRESET:-veryfast}"
FONT_FILE="/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$(dirname "$OUT")"

# Position du bandeau : juste sous la facecam (bas de facecam ≈ 576 px)
TITLE_Y=596

echo ">> Rendu principal (effets modernes)..."
ffmpeg -y -loglevel error -i "$IN" -loop 1 -t 3600 -i "$TITLE" \
  -filter_complex "\
[0:v]scale=${W}:${H},\
eq=saturation=1.25:contrast=1.05:brightness='if(between(t,${TFLASH},${TFLASH}+0.25),(${TFLASH}+0.25-t)*1.6,0)',\
scale=$((W+44)):$((H+78)),\
crop=${W}:${H}:x='(iw-ow)/2+if(between(t,${TFLASH},${TFLASH}+0.4),16*sin(70*(t-${TFLASH}))*exp(-9*(t-${TFLASH})),0)':y='(ih-oh)/2+if(between(t,${TFLASH},${TFLASH}+0.4),10*cos(55*(t-${TFLASH}))*exp(-9*(t-${TFLASH})),0)'[base];\
[1:v]format=rgba,fade=t=in:st=0.15:d=0.3:alpha=1[title];\
[base][title]overlay=x='(W-w)/2':y='${TITLE_Y}+7*sin(2.2*t)-330*exp(-6.5*t)':shortest=1,\
fps=${FPS},format=yuv420p,setsar=1[v]" \
  -map "[v]" -map 0:a? \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v libx264 -preset "$PRESET" -crf 20 -pix_fmt yuv420p -r "$FPS" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  "$TMP/body.mp4"

echo ">> Carton CTA..."
ffmpeg -y -loglevel error \
  -f lavfi -i "color=c=0x101014:s=${W}x${H}:d=2:r=${FPS}" \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 2 \
  -filter_complex "[0:v]drawtext=fontfile=${FONT_FILE}:text='LIKE & ABONNE-TOI !':fontcolor=white:fontsize=110:borderw=8:bordercolor=black:x=(w-tw)/2:y=(h/2-th):alpha='if(lt(t,0.3),t/0.3,1)',drawtext=fontfile=${FONT_FILE}:text='ABONNE-TOI POUR LA SUITE':fontcolor=0xF5C518:fontsize=52:borderw=6:bordercolor=black:x=(w-tw)/2:y=(h/2+80):alpha='if(lt(t,0.5),t/0.5,1)',setsar=1[v]" \
  -map "[v]" -map 1:a \
  -c:v libx264 -preset "$PRESET" -crf 20 -pix_fmt yuv420p -r "$FPS" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  "$TMP/cta.mp4"

echo ">> Concaténation..."
ffmpeg -y -loglevel error -i "$TMP/body.mp4" -i "$TMP/cta.mp4" \
  -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset "$PRESET" -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  "$OUT"

echo ""
echo " Terminé : $OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | \
  awk '{printf "  Durée : %.1f s\n", $1}'
