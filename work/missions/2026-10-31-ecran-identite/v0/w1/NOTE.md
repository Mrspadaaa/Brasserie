# w1 — chaque champ montre sa conséquence

- **Série** : w, la réponse d'abord. **Chaleur : froide** (affine la baseline : mêmes blocs, même ordre, compactés).
- **Axes** : A1 (formulaire compacté, la baseline), A2 (fermenteur dessiné à l'échelle dans la tuile du volume), A4 (raccourcis
  de durée 30 · 60 · 90 plus valeur libre), A5 (interrupteur), A6 (coller seulement sur une recette neuve).
- **L'idée** : la valeur se lit en grand, et sa conséquence vit dans la même tuile (volume → fermenteur rempli et litres libres ;
  ébullition → litres évaporés ; NOLO → alcool visé). Plus de phrase « 3 L évaporés — autant d'eau… » au repos.

## Baseline (plancher à enrichir)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner (absent sur une recette neuve, comme l'app), import, thème : tels quels.
- [x] Fil des 7 étapes : tel quel.
- [x] Bandeau Grain · OG · IBU · EBC : tel quel ; absent sur une recette neuve (hasMetrics), comme l'app.
- [x] Pied Retour · Suivant — Malts/sucres, qui laisse son coin au lanceur + ; le + flottant, tel quel.
- Écarts voulus : le titre « Identité » de la carte part (doublon de l'en-tête, « Text header inutile ») ; « Choix pour ce brassin »
  et « Matériel du plan » deviennent la tuile et une ligne repliée (J8) ; le bouton « Coller » du corps ne reste que sur une
  recette neuve (A6, J9 : doublon de l'icône d'en-tête).

## Honnêteté (J7)
- « ~3 L évaporés » porte le « ~ » du simulé ; la légende (« ? ») dit : taux du profil, sinon 10 % par heure.
- « conseil 24 » est un conseil (30 × 0,8), marqué par le mot et par un tireté à sa vraie hauteur ; l'espace libre (20 %) est
  « repère provisoire » au dépliage. Le volume, le conseil et le moût d'avant ébullition restent trois données ; le dernier n'est
  pas affiché (pas de chiffre inventé).
- Inconnu : un champ vide affiche « — » (jamais 0) ; style non choisi : pastille tiretée « à choisir ».
- Maquette : l'évaporation est recalculée à la louche (3 L pour 24 L et 60 min, proportionnel) ; dans l'app, le calcul ne change pas.

## Boosters UX (boosters-ux)
- `tuile-volume` — ajuster ; champ décimal + pas ± 1 L ; fermenteur dessiné 0–30 L à la couleur de la bière ; au toucher +1 L
  ×3 (`etat-touche.png`) : 27 L, remplissage monté, « 3 L libres » passe en ambre (au-dessus du conseil).
- `tuile-ebullition` / `raccourcis-ebullition` — choisir ; 30 · 60 · 90 + valeur libre ; « ~3 L évaporés » suit.
- `conseil-reglable` — ajuster ; « conseil 24 » ouvre l'espace libre sur place, sous les tuiles.
- `interrupteur-nolo` — déclencher ; interrupteur, conséquence « style 7,5–10 % » → « alcool visé ≤ 0,5 % » (`etat-nolo.png`).
- `style-pastille`, `coller-neuve` (recette neuve seulement, `etat-neuve.png`).
- B1 OK — 6 boosters marqués ; captures avant/après : `capture-haut.png` / `etat-touche.png`.
- B2 OK — dominante : les deux tuiles (24 L, 60 min) ; un seul `primary` d'action (Suivant) ; le segment 60 actif est noir aussi
  (sélection, comme « Au style ») : à surveiller.
- B3 OK — 62 mots au premier écran (52 sans l'en-tête), 7 groupes ; repères, espace libre, matériel, atelier NOLO à un toucher.
- B4 OK — nom/style, tuiles, NOLO, matériel ; pas de carte dans une carte (le fermenteur est un dessin).
- B5 à mesurer (R2 non joué en v0).
- B6 ECHEC — 6 tailles au premier écran (12, 13, 14, 15, 16, 18 ; 40 px des valeurs saisies hors compte) ; chrome compris.
- B7 OK — `controle-contraste` CONTRASTE OK ; couleur toujours avec un mot (libres, de trop, conseil).
- B8 OK — neuve, plein, NOLO dessinés (`etat-neuve.png`, `etat-plein.png`, `etat-nolo.png`) ; BRUTES OK ; hors ligne : rien de réseau.
- B9 partiel — pression `scale(.97)`, remplissage animé 200 ms, `prefers-reduced-motion` coupé ; délai non mesuré.
- B10 OK — aucun `type="number"` (0) ; `inputmode` decimal/numeric, virgule acceptée.
- B11 — « neipa v3, une Double IPA de 24 L dans 30 L (6 L libres), 60 min, sans NOLO » se lit sur la capture.
- B12 OK — `controle-standard` STANDARD OK (rayons 8 px, pilules, ronds ; un seul trait d'icône).
- B13 OK — aucune cible sous 24 px hors l'onglet « Eau » du fil commun (22 × 38) ; 0 chevauchement au repos.

## Ce qui tient, ce qui casse
- Tient : la réponse en grand, la conséquence à côté du geste ; plus aucune phrase au repos ; « 6 L libres » vert, ambre, rouge.
- Casse : les trois étiquettes du fermenteur se serrent en haut (24 sur 30, c'est la vraie échelle) ; tuiles de hauteur égale, du
  blanc sous les raccourcis ; le style reste un champ, sans conséquence visible.

## Contrôles (sorties recopiées)
- `verifier-page.mjs etat.html --captures capture --min-images 0` → PAGE OK (390 px, sans erreur).
- `controle-commun.mjs v0 w1…w6 --page=etat.html --sans=mots,au-style,fiche,trait` → COMMUN OK. Raison du `--sans` : au-style,
  fiche et trait exigent des houblons (`data-houblon`, pictos de famille), absents de l'écran Identité ; mots joué à part.
- `mots-premier-ecran.mjs … --max=80` → w1 62 mots, MOTS OK.
- `controle-panel.mjs` (6 captures w) → PANEL OK ; remplissage w1 0,611.
- `controle-choix.mjs` : sans objet, Identité n'est pas au registre `ecrans.json` (aucun choix).
