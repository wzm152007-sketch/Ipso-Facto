#!/usr/bin/env bash
# =============================================================================
# montage.sh — Transforme une vidéo brute en short TikTok (style storytime)
#
# Recette appliquée (voir STYLE_GUIDE.md) :
#   - reframe 9:16 en 1080x1920 (fond flou ou crop), 30 fps
#   - découpe optionnelle (trim)
#   - sous-titres animés majuscules (depuis .srt/.txt, ou Whisper si dispo)
#   - normalisation audio (loudnorm)
#   - carton final "LIKE & ABONNE-TOI !"
#
# Exemples :
#   ./montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 -s entrees/clip.srt
#   ./montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 --auto-captions
#   ./montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 -t 00:00:05 -d 40 --reframe crop
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
W=1080; H=1920; FPS=30
IN=""; OUT=""; SRT=""; TXT=""; TRIM_START=""; DURATION=""
REFRAME="blur"          # blur | crop | fit
AUTO_CAPTIONS=0
CTA_TEXT="LIKE & ABONNE-TOI !"
FONT_FILE="/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
NO_CTA=0

usage() { grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input)     IN="$2"; shift 2;;
    -o|--output)    OUT="$2"; shift 2;;
    -s|--srt)       SRT="$2"; shift 2;;
    -x|--txt)       TXT="$2"; shift 2;;
    -t|--trim)      TRIM_START="$2"; shift 2;;
    -d|--duration)  DURATION="$2"; shift 2;;
    --reframe)      REFRAME="$2"; shift 2;;
    --auto-captions) AUTO_CAPTIONS=1; shift;;
    --cta)          CTA_TEXT="$2"; shift 2;;
    --no-cta)       NO_CTA=1; shift;;
    -h|--help)      usage;;
    *) echo "Option inconnue : $1"; usage;;
  esac
done

[[ -z "$IN" || -z "$OUT" ]] && { echo "Erreur : -i et -o requis."; usage; }
[[ ! -f "$IN" ]] && { echo "Introuvable : $IN"; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg manquant"; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$(dirname "$OUT")"

# --- 1. Découpe (trim) -------------------------------------------------------
SEG_ARGS=()
[[ -n "$TRIM_START" ]] && SEG_ARGS+=(-ss "$TRIM_START")
[[ -n "$DURATION"   ]] && SEG_ARGS+=(-t "$DURATION")

# --- 2. Transcription automatique (optionnelle, si Whisper installé) ---------
if [[ "$AUTO_CAPTIONS" -eq 1 && -z "$SRT" && -z "$TXT" ]]; then
  if command -v whisper >/dev/null; then
    echo ">> Transcription Whisper..."
    ffmpeg -y -loglevel error "${SEG_ARGS[@]}" -i "$IN" -vn -ac 1 -ar 16000 "$TMP/audio.wav"
    whisper "$TMP/audio.wav" --language French --model small \
            --output_format srt --output_dir "$TMP" >/dev/null 2>&1 || true
    SRT="$(ls "$TMP"/*.srt 2>/dev/null | head -1 || true)"
    [[ -n "$SRT" ]] && echo ">> SRT généré : $SRT" \
                    || echo ">> Whisper a échoué, vidéo sans sous-titres."
  else
    echo ">> Whisper non installé — installez-le (pip install -U openai-whisper)"
    echo "   ou fournissez un .srt via -s. On continue sans sous-titres."
  fi
fi

# --- 3. Génération des sous-titres ASS stylés --------------------------------
ASS=""
if [[ -n "$SRT" ]]; then
  ASS="$TMP/captions.ass"
  python3 "$HERE/make_captions.py" "$SRT" "$ASS" --w "$W" --h "$H" --font "FreeSans"
elif [[ -n "$TXT" ]]; then
  ASS="$TMP/captions.ass"
  DUR_FOR_TXT="${DURATION:-$(ffprobe -v error -show_entries format=duration \
      -of csv=p=0 "$IN")}"
  python3 "$HERE/make_captions.py" "$TXT" "$ASS" --w "$W" --h "$H" \
      --font "FreeSans" --duration "$DUR_FOR_TXT"
fi

# --- 4. Filtre de reframe 9:16 ----------------------------------------------
case "$REFRAME" in
  crop) VF="scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H";;
  fit)  VF="scale=$W:$H:force_original_aspect_ratio=decrease,pad=$W:$H:(ow-iw)/2:(oh-ih)/2:black";;
  blur) VF="split=2[bg][fg];[bg]scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,boxblur=24:6[bgb];[fg]scale=$W:$H:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2";;
  *) echo "reframe inconnu : $REFRAME (blur|crop|fit)"; exit 1;;
esac
VF="$VF,fps=$FPS,format=yuv420p,setsar=1"

# incruste les sous-titres si présents
if [[ -n "$ASS" ]]; then
  ASS_ESC="${ASS//\\/\\\\}"; ASS_ESC="${ASS_ESC//:/\\:}"
  VF="$VF,ass='$ASS_ESC'"
fi

# --- 5. Rendu du corps de la vidéo ------------------------------------------
echo ">> Rendu principal..."
ffmpeg -y -loglevel error "${SEG_ARGS[@]}" -i "$IN" \
  -filter_complex "[0:v]$VF[v]" \
  -map "[v]" -map 0:a? \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r "$FPS" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  "$TMP/body.mp4"

# --- 6. Carton CTA de fin ----------------------------------------------------
if [[ "$NO_CTA" -eq 0 ]]; then
  echo ">> Carton CTA..."
  ffmpeg -y -loglevel error \
    -f lavfi -i "color=c=0x101014:s=${W}x${H}:d=2:r=$FPS" \
    -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 2 \
    -filter_complex "[0:v]drawbox=0:0:${W}:${H}:0x101014:t=fill,\
drawtext=fontfile=$FONT_FILE:text='${CTA_TEXT}':fontcolor=white:fontsize=110:\
borderw=8:bordercolor=black:x=(w-tw)/2:y=(h/2-th):\
alpha='if(lt(t,0.3),t/0.3,1)',\
drawtext=fontfile=$FONT_FILE:text='ABONNE-TOI POUR LA SUITE':fontcolor=0xF5C518:\
fontsize=52:borderw=6:bordercolor=black:x=(w-tw)/2:y=(h/2+80):\
alpha='if(lt(t,0.5),t/0.5,1)',setsar=1[v]" \
    -map "[v]" -map 1:a \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r "$FPS" \
    -c:a aac -b:a 192k -ar 44100 -ac 2 \
    "$TMP/cta.mp4"

  echo ">> Concaténation corps + CTA..."
  ffmpeg -y -loglevel error -i "$TMP/body.mp4" -i "$TMP/cta.mp4" \
    -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" \
    -map "[v]" -map "[a]" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ar 44100 -ac 2 \
    "$OUT"
else
  cp "$TMP/body.mp4" "$OUT"
fi

echo ""
echo "==================================================================="
echo " Terminé : $OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | \
  awk '{printf "  Durée : %.1f s\n", $1}'
echo "==================================================================="
