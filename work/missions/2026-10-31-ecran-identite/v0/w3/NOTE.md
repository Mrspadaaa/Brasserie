# w3 — la carte bière, dans la langue de la carte houblon

- **Série** : w, la réponse d'abord. **Chaleur : tiède** (la forme de l'approche : la bière résumée en une carte).
- **Axes** : A1 (carte « bière » dense, comme la carte houblon), A2 (piste du fermenteur façon « +1 cran »), A5 (rond NOLO à la
  place du + de la carte houblon), A6 (coller sur recette neuve seulement).
- **L'idée** : J3 « comme houblons » pris au mot. La bière est une carte de la même famille que la carte houblon : nom souligné
  pointillé, pastille de style, rond à droite, rangée de pictos chiffrés, piste dessous. On touche un picto, son réglage s'ouvre
  sous la carte, jamais par-dessus.

## Baseline (plancher à enrichir)
- [x] En-tête commun, fil des 7 étapes, bandeau Grain · OG · IBU · EBC, pied et lanceur + : tels quels.
- Écarts voulus : la carte grise « Identité » devient la carte bière ; « Matériel du plan » devient une carte matériel dans la
  même langue (cuve 45 L, fermenteur 30 L) ; le verre prend la couleur prévue (EBC du bandeau), tireté vide sur recette neuve.

## Honnêteté (J7)
- « ~3 L évaporés » et « ~24 L conseil » portent le « ~ » ; légende au « ? » : taux du profil, sinon 10 %/h ; conseil = 20 %
  d'espace libre, repère provisoire.
- Recette neuve : verre vide tireté (pas de couleur inventée), « style à choisir », placeholder pour le nom.
- Maquette : évaporation recalculée à la louche.

## Boosters UX (boosters-ux)
- `pictos-valeurs` — lire et choisir ; quatre pictos chiffrés, un toucher ouvre le réglage (`etat-touche.png` : ébullition ouverte,
  60 · 90, ± 5 min).
- `editeur-volume` — ajuster ; ± 1 L, saisie, 24 · 30 ; ouvert au repos sur le volume (cadre noir sur le picto).
- `piste-fermenteur` — lire ; piste jaune à la couleur de la bière, tireté du conseil, « +6 L libres » en vert, rouge au-delà.
- `rond-nolo` — déclencher ; rond comme le + des houblons, noir quand actif (`etat-nolo.png`).
- `verre-couleur`, `style-pastille`, `nom-sur-place`, `coller-neuve`.
- B1 OK — 8 boosters ; avant/après : `capture-haut.png`, `etat-touche.png`.
- B2 OK — dominante : la carte (nom 34 px, pictos 40 px) ; un seul `primary`.
- B3 OK — 61 mots (51 sans l'en-tête) ; repères, espace libre, matériel à un toucher.
- B4 OK — carte bière, réglage, carte matériel ; pictos en cases teintées, pas de carte dans la carte.
- B5 à mesurer.
- B6 ECHEC — 7 tailles (12 à 24).
- B7 OK — CONTRASTE OK après assombrissement des petits mots sur cases teintées (4,17 → plus de 4,5:1).
- B8 OK — neuve, plein, NOLO capturés ; BRUTES OK.
- B9 partiel — piste animée, pression ; mouvement réduit respecté.
- B10 OK — 0 `type="number"`.
- B11 — « neipa v3, Double IPA 22A, 24 L, 60 min, ~3 L évaporés, 6 L libres » d'un coup d'œil.
- B12 OK — STANDARD OK ; même vocabulaire que la carte houblon (rond, pointillé, pictos de trait).
- B13 OK — cibles ≥ 24 px hors « Eau » du fil ; 0 chevauchement.

## Ce qui tient, ce qui casse
- Tient : on reconnaît la langue des houblons ; le rond NOLO est un vrai geste ; la couleur de la bière donne l'identité.
- Casse : le picto « évaporés » (vapeur) ne se nomme pas seul, d'où le mot dessous ; « ~24 conseil » à côté de « 24 fermenteur »
  peut se lire comme un doublon ; du blanc sous la carte matériel.

## Contrôles (sorties recopiées)
- `verifier-page.mjs` → PAGE OK.
- `controle-commun.mjs … --sans=mots,au-style,fiche,trait` → COMMUN OK (au-style, fiche, trait : houblons absents ici).
- `mots-premier-ecran.mjs --max=80` → w3 61 mots, MOTS OK.
- `controle-panel.mjs` → PANEL OK ; remplissage w3 0,545.
- `controle-choix.mjs` : sans objet.
