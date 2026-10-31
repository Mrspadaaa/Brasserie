# w5 — l'étiquette de la bière

- **Série** : w, la réponse d'abord. **Chaleur : chaude** (forme libre).
- **Axes** : A1 (la carte devient une étiquette), A2 (niveau du fermenteur au pied de l'étiquette), A5 (NOLO en tampon),
  A6 (coller sur recette neuve seulement).
- **L'idée** : l'identité, c'est l'étiquette de la bouteille. Le nom en grand, le style en ruban, deux sceaux (24 L, 60 min), un
  tampon NOLO de biais, le niveau en bas. L'étiquette prend la couleur prévue de la bière ; chaque pièce se touche.

## Baseline (plancher à enrichir)
- [x] En-tête commun, fil, bandeau, pied et lanceur + : tels quels.
- Écarts voulus : la forme entière ; repères, évaporation et matériel passent en puces sous l'étiquette.

## Honnêteté (J7)
- « ~3 L évaporés » et « conseil ~24 » (dans le réglage) marqués ; légende au « ? ».
- Recette neuve : étiquette blanche, bande hachurée (pas de couleur inventée), « ta bière », « style ? ».
- La couleur de l'étiquette vient de l'EBC du bandeau (9,5) ; sans grain, pas de couleur.
- Maquette : évaporation recalculée à la louche.

## Boosters UX (boosters-ux)
- `etiquette`, `ruban-style` — lire ; le style en ruban teal (palette des styles).
- `sceau-volume` — ajuster ; le sceau ouvre ± sous l'étiquette, avec « conseil ~24 » (`etat-touche.png`).
- `sceau-ebullition` — ajuster ; ± 5 min, 60 · 90.
- `tampon-nolo` — déclencher ; tampon tireté gris → vert plein (`etat-nolo.png`).
- `niveau-fermenteur` — lire ; jauge à la couleur de la bière, tireté du conseil, rouge hachuré si plein (`etat-plein.png`).
- `coller-neuve`.
- B1 OK — 7 boosters ; avant/après : `capture-haut.png`, `etat-touche.png`.
- B2 OK — dominante : le nom (50 px) puis les sceaux ; un seul `primary`.
- B3 OK — 51 mots (41 sans l'en-tête), le plus sobre de la série.
- B4 OK — une étiquette, une rangée de puces.
- B5 à mesurer.
- B6 ECHEC — 7 tailles (13 à 42).
- B7 OK — CONTRASTE OK.
- B8 OK — neuve (étiquette blanche), plein, NOLO capturés ; BRUTES OK.
- B9 partiel — niveau animé, pression ; mouvement réduit respecté.
- B10 OK — 0 `type="number"`.
- B11 — « neipa v3, Double IPA, 24 L, 60 min, sans NOLO, 6 L libres » : l'objet se reconnaît avant de se lire.
- B12 OK — STANDARD OK ; le tampon et les sceaux sont un vocabulaire neuf, hors de la langue houblons.
- B13 OK — cibles ≥ 24 px hors « Eau » ; 0 chevauchement.

## Ce qui tient, ce qui casse
- Tient : fort, mémorable, la bière comme objet ; nom et style dominent, comme il les dit.
- Casse : la teinte crème-or de l'étiquette frôle le « papier chaud » qu'il a refusé pour le thème (D106) — ici l'objet seul,
  pas la page, à juger ; du blanc sous les puces ; l'étiquette ne parle pas la langue houblons.

## Contrôles (sorties recopiées)
- `verifier-page.mjs` → PAGE OK.
- `controle-commun.mjs … --sans=mots,au-style,fiche,trait` → COMMUN OK.
- `mots-premier-ecran.mjs --max=80` → w5 51 mots, MOTS OK.
- `controle-panel.mjs` → PANEL OK ; remplissage w5 0,687.
- `controle-choix.mjs` : sans objet.
