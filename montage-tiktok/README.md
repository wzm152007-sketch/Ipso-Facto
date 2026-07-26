# 🎬 Montage TikTok — atelier (style storytime Fortnite)

Dossier créé pour **ne pas oublier** le style de montage demandé et pour
**monter chaque vidéo** au format court / TikTok.

Style appris à partir de : `reference/reference_style_shxrk_fncs.mp4`
Recette détaillée : **[STYLE_GUIDE.md](./STYLE_GUIDE.md)**

## Arborescence

```
montage-tiktok/
├── README.md            ← ce fichier
├── STYLE_GUIDE.md       ← la recette exacte du style
├── reference/           ← vidéo de référence + aperçu des frames
├── entrees/             ← déposer ici les vidéos brutes à monter
├── sorties/             ← les shorts finis sortent ici
├── assets/              ← habillages réutilisables
└── scripts/
    ├── montage.sh       ← pipeline principal (reframe + sous-titres + CTA)
    └── make_captions.py ← génère les sous-titres animés (.ass)
```

## Utilisation rapide

```bash
cd montage-tiktok

# 1) Avec un fichier de sous-titres .srt (ex. export Whisper)
./scripts/montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 -s entrees/clip.srt

# 2) Avec un simple texte du script (réparti sur la durée)
./scripts/montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 -x entrees/script.txt

# 3) Transcription automatique (nécessite Whisper installé)
./scripts/montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 --auto-captions

# 4) Découper un extrait de 40 s à partir de 5 s, recadrage par crop
./scripts/montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 \
    -t 00:00:05 -d 40 --reframe crop -s entrees/clip.srt
```

### Options principales

| Option              | Rôle                                                        |
|---------------------|-------------------------------------------------------------|
| `-i` / `--input`    | vidéo brute d'entrée (obligatoire)                          |
| `-o` / `--output`   | short final (obligatoire)                                   |
| `-s` / `--srt`      | sous-titres timés `.srt`                                    |
| `-x` / `--txt`      | texte brut du script (réparti sur la durée)                 |
| `--auto-captions`   | transcription auto via Whisper si installé                  |
| `-t` / `--trim`     | début de l'extrait (ex. `00:00:05`)                         |
| `-d` / `--duration` | durée en secondes                                           |
| `--reframe`         | `blur` (défaut) · `crop` · `fit`                            |
| `--cta`             | texte du carton final (défaut : `LIKE & ABONNE-TOI !`)      |
| `--no-cta`          | supprime le carton final                                    |

## Sous-titres automatiques (Whisper)

Le pipeline peut transcrire tout seul si Whisper est présent :

```bash
pip install -U openai-whisper     # une fois (télécharge un modèle)
./scripts/montage.sh -i entrees/clip.mp4 -o sorties/short.mp4 --auto-captions
```

Sinon, fournissez un `.srt` (`-s`) ou le texte du script (`-x`) et les
sous-titres animés sont générés automatiquement au bon style.

## Le workflow "chaque vidéo que tu m'envoies"

1. Tu envoies la vidéo brute (gameplay, facecam, etc.).
2. Je la place dans `entrees/`.
3. Je génère/récupère la transcription (voix off) → sous-titres animés.
4. Je lance `montage.sh` : reframe 9:16, coupes, sous-titres, CTA, audio normalisé.
5. Le short prêt à publier sort dans `sorties/`, je te le renvoie.

## Ce qui est automatisé vs. manuel

- **Automatisé** : format 9:16 1080×1920, sous-titres animés stylés, carton CTA,
  normalisation audio, découpe d'extrait, punch-in de base.
- **À affiner à la main / selon la vidéo** : choix des meilleurs moments,
  placement précis du B-roll (facecam, captures de tweets), timing artistique
  des coupes sur les temps forts. Donne-moi les indications et je les applique.
