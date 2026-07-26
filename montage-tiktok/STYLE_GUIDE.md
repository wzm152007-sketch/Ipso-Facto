# Guide de style — Montage TikTok (storytime Fortnite)

> Style appris à partir de la vidéo de référence :
> `reference/reference_style_shxrk_fncs.mp4`
> (SHXRK / Zetfar — "a joué avec le mauvais duo aux FNCS")

Ce document décrit **exactement** la recette de montage à reproduire pour chaque
nouvelle vidéo. Le script `scripts/montage.sh` automatise la plus grande partie.

---

## 1. Format technique

| Paramètre        | Valeur cible                            |
|------------------|-----------------------------------------|
| Ratio            | 9:16 vertical                           |
| Résolution       | 1080 × 1920 (la réf. est en 576×1024)   |
| FPS              | 30                                      |
| Durée            | **court** : 20 à 60 s (idéal 30–45 s)   |
| Codec vidéo      | H.264, ~8–12 Mb/s                       |
| Codec audio      | AAC 44.1 kHz stéréo, normalisé (loudnorm)|
| Container        | .mp4                                     |

## 2. Structure narrative (storytime)

1. **Hook (0–3 s)** — une phrase choc qui donne envie de rester ("Il a joué avec
   le mauvais duo aux FNCS...", "OH MON DIEU !"). Coupe rapide dès la 1re seconde.
2. **Développement (3 s → fin-2 s)** — la voix off raconte, le montage enchaîne
   les plans **au rythme de la parole** (une idée = un plan = un sous-titre).
3. **CTA outro (2 dernières s)** — carton final "LIKE & ABONNE-TOI !" avec
   👍 et 🔔.

## 3. Rythme de coupe

- Beaucoup de coupures : la réf. a **~17 coupes en 46 s** (≈ 1 coupe / 2,7 s).
- On **coupe sur la voix** : chaque nouvelle phrase/idée = nouveau plan.
- On **retire les silences et les hésitations** (jump cuts).
- Aucun plan ne dure plus de ~4 s sans changement (coupe, zoom, ou punch-in).

## 4. Sous-titres animés (élément signature)

- **Toujours présents**, c'est la marque du style.
- **MAJUSCULES**, police **grasse** (type Montserrat/Impact ; ici FreeSans Bold).
- Blanc plein + **contour noir épais** (lisible sur n'importe quel fond).
- Centrés, milieu de l'écran (légèrement sous le centre).
- Découpés en **petits morceaux de 2–3 mots** (pas la phrase entière).
- **Apparition "pop"** : léger fondu + montée d'échelle (80 % → 100 %).
- Synchronisés à la voix (karaoké de phrases).

## 5. Habillage visuel

- **B-roll varié** qui illustre le propos :
  - gameplay Fortnite (l'action principale),
  - facecam du joueur (réactions),
  - captures d'écran (tweets, posts, page de profil, classements).
- **Punch-ins / zooms** (zoompan lent) sur les moments forts du gameplay.
- Reframe des captures d'écran en 9:16 (fond flou + capture centrée).

## 6. Audio

- Voix off au premier plan (la narration porte la vidéo).
- Musique/ambiance en fond léger (optionnel).
- **Normalisation loudness** pour un volume constant et fort (cible ~ -14 LUFS).

---

## Checklist avant export

- [ ] 9:16 en 1080×1920, 30 fps
- [ ] Durée 20–60 s
- [ ] Hook percutant dès la 1re seconde
- [ ] Sous-titres animés majuscules du début à la fin
- [ ] Coupes serrées, silences retirés
- [ ] Au moins 1 punch-in / zoom sur un temps fort
- [ ] Carton "LIKE & ABONNE-TOI !" à la fin
- [ ] Audio normalisé
