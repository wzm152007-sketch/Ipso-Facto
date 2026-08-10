# "OPEN YOUR EYE" — Continuous One-Shot Ascension

**Format:** 9:16 vertical (2160×3840), 24 fps
**Runtime:** 24 seconds, single unbroken take
**Camera package (look target):** ARRI Alexa Mini, 2x anamorphic primes
**Deliverable:** photoreal VFX one-shot, room → rooftop → troposphere → low orbit

---

## 1. Logline

A hooded monk woman presses one finger to a young man's forehead. Reality yields.
The ceiling unmakes itself and he is torn upward — through the floor above, through
the roof, through cloud, through atmosphere — until he hangs weightless over the
curvature of the Earth. The camera never cuts and never lets him go.

---

## 2. Character continuity lock

Paste these strings **verbatim** into every segment prompt. Drift in wardrobe or
hair is the single most common failure across chained generations.

### 2.1 HERO (from reference image)

> a young man in his early twenties, pale complexion, straight brown mid-length
> hair with a side-swept fringe falling over the forehead and covering the ears,
> light blue eyes, slim narrow build, sharp jawline; wearing a black short-sleeve
> football jersey with gold trim — gold collar piping, gold shoulder taping, a
> gold block-letter wordmark across the chest, faint tonal camo texture in the
> fabric — black mesh athletic shorts falling to the knee, white ribbed crew
> socks, black-and-white low-top leather sneakers

### 2.2 THE MONK

> a woman of indeterminate age in a heavy coarse-woven charcoal monastic robe,
> deep hood shadowing the upper face, only the mouth and jaw catching light,
> weathered bare hands, no jewelry, absolutely still, calm unblinking presence

### 2.3 SET (Beat A only)

> a bare concrete room, low ceiling, damp grey walls, one warm practical bulb
> off-frame left, dust suspended in the air

---

## 3. Camera & optical spec

| Parameter | Value |
|---|---|
| Body | ARRI Alexa Mini, open gate 3.4K ArriRaw |
| Glass | 2x anamorphic (Cooke Anamorphic/i or Atlas Orion) |
| Beat A lenses | 32 mm → 75 mm (optical zoom during dolly) |
| Beats B–D | 25 mm equivalent, wide, held |
| Stop | T2.8 interior → T5.6 exterior |
| Shutter | 180° (172.8° if 25 fps mastering) |
| Look | oval bokeh, horizontal blue streak flares, 2.39 anamorphic mumps |

> **Honest note on format:** a 2x anamorphic 2.39:1 image does not natively fit
> 9:16. Shoot open gate and center-extract vertically, or run spherical glass and
> add anamorphic characteristics in post. Keep the *artifacts* (oval bokeh, blue
> streaks, breathing) — they carry the look even in vertical.

---

## 4. Beat sheet — the unbroken take

### BEAT A — CONTACT · 0:00–0:06
Extreme close-up. Hero fills frame, breathing shallow, eyeline low.
The monk enters from frame right — not walking, *arriving* — and lifts one finger
to his forehead. On contact:

- **Camera:** dolly in 1.2 m while zooming from 75 mm back to 32 mm over 2.5 s.
  Classic vertigo — his head holds constant size, the room stretches away behind him.
- **VO (whispered, close-mic, female):** *"open your eye"* — lands at 0:03.5,
  half a beat **before** the finger touches. Sound precedes cause.
- **Physical tell:** dust in the air stops falling and hangs. Hero's pupils blow wide.
- **Out:** at 0:05.5 a hairline crack of white light opens in the ceiling directly above.

### BEAT B — THE PULL · 0:06–0:12
The ceiling doesn't break — it **unfolds**, concrete peeling outward like wet paper
against gravity. Hero's heels leave the floor. He goes up hard, arms trailing,
jersey snapping upward, hair pulled straight back.

- **Camera:** whip-tilt to vertical, then lock beneath him and match his velocity.
  Frame him low-third, boots toward lens, extreme wide-angle distortion.
- **Motion:** 0 → ~14 m/s inside one second. Monk stays below, shrinking, unmoved.
- **VFX:** debris rising past lens in slow arcs, subsurface dust bloom, the practical
  bulb below stretching into a long anamorphic streak.
- **Out:** he clears the ceiling plane into a second room — an empty apartment,
  furniture bolted to a floor that is now a wall to him.

### BEAT C — THE BREACH · 0:12–0:18
Through the upper room in under a second. Roof timbers and shingle explode outward
in a blooming ring. Sudden brutal exposure shift — dim interior to blown-out daylight,
1.5 stops of clipping that recovers over 12 frames.

- **Camera:** stays under him, now falling *upward*. Rooftops of a low grey city
  rush away below. Horizon curls into frame at the edges.
- **Motion:** cloud deck at 0:15.5 — two full seconds of white blindness, only his
  silhouette readable, then punch-through into hard blue.
- **VFX:** vapour trails spiralling off his fingertips, water beading and streaming
  off the jersey, godrays raking through the cloud break.

### BEAT D — ORBIT · 0:18–0:24
Blue drains from the top of frame down. Black. Stars ignite.

- **Camera:** slows, then stops. First stillness in twenty seconds.
  Rotate 40° around him as he settles into a weightless drift, arms loose.
- **Frame out:** hero small in upper frame, the Earth's terminator sweeping the lower
  two-thirds, atmosphere a thin blue rind against black. Hold two full seconds.
- **He opens his eyes.** Cut to black on the blink.

---

## 5. Model-ready prompts

Most video models cap at 5–10 s. Generate four segments and chain them by feeding
the **last frame** of each as the **first frame** of the next. Do not rely on text
alone to carry continuity.

### 5.1 Master prompt (Sora-class, long-form single generation)

```
Continuous unbroken 24-second one-shot, 9:16 vertical, shot on ARRI Alexa Mini
with 2x anamorphic primes, photorealistic VFX, no cuts.

Extreme close-up on <HERO>. Dim bare concrete room, one warm practical light,
dust hanging in the air. <MONK> enters from frame right and raises one finger to
his forehead. On contact the camera performs a strong dolly-zoom vertigo effect —
pushing in while zooming out, his head holding size as the room stretches away
behind him. His pupils dilate. Dust freezes mid-air.

A hairline crack of white light splits the ceiling above. The concrete peels
outward against gravity and he is violently yanked upward. The camera whip-tilts
to vertical and locks beneath him, matching his velocity, boots toward lens,
extreme wide-angle distortion, debris rising past the frame in slow arcs.

He punches through into an empty apartment above, then explodes through the roof
in a blooming ring of timber and shingle. Sudden blown-out daylight. Grey city
rooftops rush away below. He falls upward into a cloud deck, two seconds of white
blindness, then bursts into hard blue sky with vapour spiralling off his fingertips.

The blue drains downward into black. Stars ignite. The camera slows, stops, and
orbits 40 degrees around him as he settles weightless above the curvature of the
Earth — the terminator sweeping below, atmosphere a thin blue rind against space.
He opens his eyes.

Cinematic lighting, continuous motion tracking, oval bokeh, horizontal blue lens
flares, motion blur, volumetric light, photorealistic.
```

Replace `<HERO>` and `<MONK>` with the §2 lock strings.

### 5.2 Segment prompts (Veo / Kling / Runway — 6 s each)

**SEG-01 · CONTACT**
```
Extreme close-up, 9:16, anamorphic. <HERO> in <SET>, breathing shallow. <MONK>
enters from frame right and touches his forehead with one finger. Strong dolly-zoom
vertigo effect — camera pushes in while the lens zooms out, background stretching
away, subject size constant. Pupils dilate. Suspended dust stops falling. A thin
crack of white light appears in the ceiling above on the final beat.
Slow push, then acceleration. Warm practical key, deep shadows, film grain.
```

**SEG-02 · THE PULL** — first frame = last frame of SEG-01
```
Same character, same room. The ceiling peels open against gravity. <HERO> is
violently pulled straight upward, arms trailing overhead, jersey and hair snapping
up. Camera whip-tilts to vertical and rises beneath him at matched speed, looking
up at his boots, extreme wide-angle lens distortion. Concrete debris and dust rise
past the lens. The hooded figure below shrinks away, motionless. Fast vertical
camera motion, heavy motion blur, dramatic perspective shift.
```

**SEG-03 · THE BREACH** — first frame = last frame of SEG-02
```
Same character continuing upward. He bursts through a roof in an exploding ring of
timber and shingles. Hard exposure shift from dark interior to blown-out daylight.
Camera stays directly beneath him, ascending, as grey city rooftops rush away below
and the horizon curves. He rises into a thick white cloud deck — silhouette only —
then punches through into deep blue sky. Vapour trails spiral off his fingertips.
Continuous vertical tracking, sunlight godrays, anamorphic flares.
```

**SEG-04 · ORBIT** — first frame = last frame of SEG-03
```
Same character. The blue sky drains from the top of frame to black as stars appear.
Camera decelerates to a stop and slowly orbits 40 degrees around him while he
settles into weightless drift, limbs loose. Final framing: the figure small in the
upper frame, the curvature of the Earth filling the lower two-thirds, terminator
line sweeping, thin blue atmospheric rind against black space. He opens his eyes.
Slow graceful motion, hard sunlight, deep black shadows, photorealistic space.
```

### 5.3 Negative prompt (all segments)

```
cuts, jump cuts, scene transitions, split screen, text, subtitles, watermark,
logo, extra limbs, deformed hands, warped face, changing hairstyle, changing
clothes, wardrobe drift, second person, crowd, slow motion, cartoon, anime,
illustration, 3D render look, plastic skin, flickering, strobing, low resolution,
letterbox bars, horizontal framing
```

---

## 6. Audio design

| TC | Element |
|---|---|
| 0:00 | Room tone. Held sub at 38 Hz, barely audible. One breath. |
| 0:03.5 | **VO:** *"open your eye"* — whispered, female, extreme close-mic, tail into reverse reverb |
| 0:05.5 | All ambience cuts to silence for 8 frames |
| 0:06 | Impact — sub drop + concrete tear + cloth snap, hard transient |
| 0:06–0:12 | Rising doppler wind, pitch-bending upward, debris peppering |
| 0:12 | Roof breach — wood splinter crack, wide stereo blast |
| 0:15.5 | Cloud pass — wind muffles, low-pass sweep, everything underwater |
| 0:18 | Air thins: high frequencies roll off progressively to nothing |
| 0:20 | **Vacuum.** No wind. Heartbeat only, slowing. Single sustained low tone. |
| 0:24 | Blink. Silence. |

The VO landing *before* the touch is deliberate. Do not sync it to the finger.

---

## 7. Comp & finishing notes

- **Seam strategy.** Hide each generation boundary inside a motion event —
  the debris cloud (B), the roof blast (C), the cloud deck (D). Never seam on a
  clean plate. A 6-frame optical-flow morph across each join sells the continuity.
- **Speed ramp.** Beats B and C run at 110–125% to steepen the pull, with the
  ramp anchored on impacts so the audio transients stay on frame.
- **Grade.** Beat A crushed and warm (2900K practical, lifted black at 4%).
  Beat C blown neutral daylight, clipped highlights recovering over 12 frames.
  Beat D cold — 8000K key, absolute black, zero fill. Print-emulation LUT throughout.
- **Anamorphic pass in post.** Oval bokeh, 1.5% horizontal chromatic fringing,
  blue streak flares triggered off the practical (A) and the sun (C–D).
- **Gravity cheat.** He is *falling upward*, not flying. Hair, jersey hem, and
  sock tops must trail **downward-relative-to-motion** the entire time. This one
  detail is what separates convincing from floaty.
- **Grain.** Uniform 35 mm 500T grain over the finished comp, not per-layer.

---

## 8. Shot-order checklist

- [ ] Generate SEG-01 with hero reference image as first-frame conditioning
- [ ] Select take, export final frame at full res
- [ ] SEG-02 from that frame → repeat through SEG-04
- [ ] Assemble, apply speed ramps, morph the three seams
- [ ] Grade per §7, add anamorphic pass, grain
- [ ] Lay audio to §6 timing, VO at 0:03.5
- [ ] Master 2160×3840 24 fps, H.265, and a 2.39:1 center-extract alt
