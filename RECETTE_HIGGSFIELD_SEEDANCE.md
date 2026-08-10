# Recette de production — Higgsfield + Seedance

Plan de tir concret pour générer *"Open Your Eye"* (voir `ONESHOT_OPEN_YOUR_EYE.md`).
4 plans, ~25 s, assemblés en un faux plan-séquence.

> **Prompts en anglais, volontairement.** Higgsfield comme Seedance sont
> nettement plus performants en anglais qu'en français — le français dégrade
> le suivi de prompt. Les consignes sont en français, les prompts restent en anglais.

> **Note d'honnêteté :** les interfaces de ces deux plateformes évoluent vite.
> Les noms de presets et d'options ci-dessous correspondent à ce que je connais ;
> si un libellé diffère dans ton UI, prends l'équivalent le plus proche.

---

## 1. Répartition des plans

| # | Beat | Plateforme | Pourquoi |
|---|---|---|---|
| 01 | Le contact + vertigo | **Higgsfield** | preset caméra *Dolly Zoom* natif — c'est exactement le mouvement, en un clic |
| 02 | L'arrachement | **Seedance** (I2V) | excellent sur mouvement vertical rapide + cohérence perso |
| 03 | Le toit / les nuages | **Seedance** (I2V, 10 s) | tient la durée longue sans casser la trajectoire |
| 04 | L'orbite | **Seedance** (I2V) | rendu spatial et lumière dure très propre |

Durées : 5 + 5 + 10 + 5 = **25 s**, à rogner à 24 s au montage.

---

## 2. Règle absolue : le chaînage

C'est **tout** l'enjeu. Chaque plan démarre sur la dernière image du précédent.

```
image de réf. ──▶ SHOT-01 ──▶ [dernière frame] ──▶ SHOT-02 ──▶ [dernière frame] ──▶ SHOT-03 ──▶ …
```

Pour extraire la dernière frame de chaque rendu :

```bash
ffmpeg -sseof -0.1 -i shot01.mp4 -vframes 1 -q:v 1 frame01_end.png
```

Sans ffmpeg : mets la vidéo en pause sur la toute dernière image et fais une
capture d'écran en pleine résolution. Moins propre, mais ça marche.

**Ne compte jamais sur le texte seul pour la continuité du personnage.**
C'est l'image de départ qui la porte.

---

## 3. SHOT-01 — Higgsfield

**Réglages**

| Paramètre | Valeur |
|---|---|
| Mode | Image-to-Video |
| Image de départ | ta photo de référence (le jeune homme au maillot noir/or) |
| Preset caméra | **Dolly Zoom** (ou *Vertigo* selon le libellé) |
| Intensité mouvement | fort / high |
| Durée | 5 s |
| Format | 9:16 |

**Prompt**

```
A hooded woman in a heavy charcoal monastic robe enters from the right and
slowly raises one finger to the young man's forehead. He stares upward, pupils
dilating. Dust hangs frozen in the air. Dim concrete room, single warm practical
light, deep shadows. Cinematic, photorealistic, anamorphic lens flares, film grain.
```

**Negative**

```
cuts, text, watermark, extra limbs, deformed hands, changing clothes, second
person, cartoon, low resolution
```

> Si le preset *Dolly Zoom* ne se déclenche pas assez fort, baisse la description
> du mouvement dans le prompt : les presets Higgsfield entrent en conflit avec les
> instructions caméra écrites. Laisse le preset piloter, le texte décrit l'action.

---

## 4. SHOT-02 — Seedance (I2V)

**Réglages :** Seedance 1.0 Pro · Image-to-Video · **5 s** · 1080p · 9:16
**Image de départ :** `frame01_end.png`

```
The ceiling peels open against gravity and the young man is violently pulled
straight upward, arms trailing overhead, hair and jersey snapping upward. The
camera whip-tilts to vertical and rises beneath him at matched speed, looking up
at his sneakers, extreme wide-angle distortion. Concrete debris and dust rise past
the lens. The hooded figure below shrinks away, motionless. Fast vertical camera
movement, heavy motion blur, photorealistic.
```

---

## 5. SHOT-03 — Seedance (I2V, format long)

**Réglages :** Seedance 1.0 Pro · Image-to-Video · **10 s** · 1080p · 9:16
**Image de départ :** `frame02_end.png`

```
He bursts through a rooftop in an exploding ring of timber and shingles. Hard
exposure shift from dark interior to blown-out daylight. The camera stays directly
beneath him, ascending, as grey city rooftops rush away below and the horizon
curves. He rises into a thick white cloud deck, visible only as a silhouette, then
punches through into deep blue sky. Vapour trails spiral off his fingertips.
Continuous vertical tracking shot, sunlight godrays, photorealistic.
```

> Seedance gère bien le multi-shot narratif — c'est justement ce qu'on **ne**
> veut pas ici. Évite toute virgule qui ressemble à un changement de plan
> ("then we see", "cut to"). Garde une seule trajectoire continue.

---

## 6. SHOT-04 — Seedance (I2V)

**Réglages :** Seedance 1.0 Pro · Image-to-Video · **5 s** · 1080p · 9:16
**Image de départ :** `frame03_end.png`

```
The blue sky drains from the top of the frame to black as stars appear. The camera
decelerates to a stop and slowly orbits around him while he settles into weightless
drift, limbs loose. The curvature of the Earth fills the lower frame, terminator
line sweeping, thin blue atmospheric rind against black space. He opens his eyes.
Slow graceful motion, hard sunlight, deep black shadows, photorealistic space.
```

---

## 7. Assemblage

```bash
# 1. concaténer
printf "file 'shot01.mp4'\nfile 'shot02.mp4'\nfile 'shot03.mp4'\nfile 'shot04.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy brut.mp4

# 2. rogner à 24 s + normaliser
ffmpeg -i brut.mp4 -t 24 -vf "scale=2160:3840:flags=lanczos,fps=24" \
       -c:v libx264 -crf 16 -preset slow montage.mp4

# 3. coller la bande son (voir §6 du shot package)
ffmpeg -i montage.mp4 -i audio.wav -c:v copy -c:a aac -b:a 320k -shortest FINAL.mp4
```

**Masquer les 3 raccords** — chaque jointure doit tomber dans un pic de mouvement :
nuage de débris (01→02), explosion du toit (02→03), traversée des nuages (03→04).
Un fondu de 4 à 6 images suffit, l'œil ne le voit pas dans le flou de mouvement.

---

## 8. Points de vigilance

- **La gravité.** Il *tombe vers le haut*. Cheveux, bas du maillot et chaussettes
  doivent traîner **vers le bas relativement au mouvement**, en permanence. Si un
  rendu le montre en vol plané "superman", refais-le — c'est le détail qui
  sépare le crédible du flottant.
- **Dérive du costume.** Vérifie à chaque plan : liseré doré au col, bande dorée
  aux manches, chaussettes blanches, sneakers noir et blanc. C'est la panne
  numéro un du chaînage.
- **Budget.** Compte 3 à 5 essais par plan avant d'avoir le bon. Prévois
  ~15–20 générations au total, pas 4.
- **Le vertigo (shot 01)** est le plan le plus dur. C'est aussi celui qui vend
  tout le reste. Ne le brade pas.

---

## 9. Si tu veux que j'automatise

Je peux écrire un script Python qui enchaîne les 4 appels API, extrait
automatiquement les dernières frames et assemble le tout. Il me faut :

- une clé API (**fal.ai** ou **Replicate** exposent Seedance ; Higgsfield a une
  API sur demande) ;
- que le domaine correspondant soit autorisé dans la politique réseau de
  l'environnement — actuellement `fal.ai` et `higgsfield.ai` renvoient 403 via le proxy.

Sans ces deux conditions, le script ne peut pas s'exécuter ici — mais il
tournerait sur ta machine.
