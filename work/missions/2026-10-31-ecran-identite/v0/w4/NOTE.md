# w4 — la phrase-bière, chaque mot se touche

- **Série** : w, la réponse d'abord. **Chaleur : tiède** (la forme de l'approche : la bière résumée en une phrase).
- **Axes** : A1 (phrase-bière éditable sur place), A2 (fermenteur couché, à l'échelle), A5 (NOLO comme un mot de la phrase),
  A6 (coller sur recette neuve seulement).
- **L'idée** : « Je brasse neipa v3 en Double IPA, 24 L en fermenteur, bouillie 60 min, sans NOLO. » La phrase est le
  formulaire : chaque mot en case grise se touche et s'édite sous la phrase. Dessous, ce que la phrase donne : les litres libres
  et le fermenteur rempli.

## Baseline (plancher à enrichir)
- [x] En-tête commun, fil, bandeau, pied et lanceur + : tels quels.
- Écart voulu : plus aucun libellé de champ ; la phrase est une réponse (elle se lit), pas une explication. Risque assumé : la
  règle « aucune phrase explicative au repos » vise l'explication ; celle-ci ne contient que ses choix.

## Honnêteté (J7)
- « conseil ~24 L » au tireté, « ~3 L évaporés » ; légende au « ? » (profil, sinon 10 %/h ; 20 % repère provisoire).
- Recette neuve : « Je brasse quelle bière ? en quel style ? » ; fermenteur plein en rouge (30 L du profil dans 30 L), comme l'app.
- Maquette : évaporation recalculée à la louche.

## Boosters UX (boosters-ux)
- `phrase-biere` — lire et choisir ; mots en cases ; un toucher sur « 24 L » l'inverse (noir) et ouvre ± sous la phrase
  (`etat-touche.png`).
- `editeur-volume` — ajuster ; ± 1 L et saisie.
- `mot-nolo` — déclencher ; « sans NOLO » ↔ « NOLO ≤ 0,5 % », en vert (`etat-nolo.png`).
- `fermenteur-couche` — lire ; barre 72 px à la couleur de la bière, tireté du conseil ; panneau vert, ambre, rouge selon l'état.
- `coller-neuve`.
- B1 OK — 5 boosters ; avant/après : `capture-haut.png`, `etat-touche.png`.
- B2 OK — dominante : la phrase (33 px) ; un seul `primary`.
- B3 OK — 65 mots (55 sans l'en-tête), dont 13 de la phrase.
- B4 OK — phrase, résultat, trois lignes repliées.
- B5 à mesurer.
- B6 ECHEC — 7 tailles (13 à 40).
- B7 OK — CONTRASTE OK.
- B8 OK — neuve, plein, NOLO capturés ; BRUTES OK.
- B9 partiel — inversion du mot touché, barre animée ; mouvement réduit respecté.
- B10 OK — 0 `type="number"`.
- B11 — la phrase EST la réponse ; la capture se lit à voix haute.
- B12 OK — STANDARD OK.
- B13 OK — mots-cibles de 40 px de haut ; 0 chevauchement au repos ; le + peut couvrir le chevron du matériel quand NOLO
  allonge la page (`etat-nolo.png`, hors repos).

## Ce qui tient, ce qui casse
- Tient : on dit sa bière comme on la raconte ; zéro libellé ; le geste est au mot près.
- Casse : la phrase coûte de la hauteur (4 lignes) ; une phrase peut agacer s'il la lit comme du texte au premier plan ;
  à la recette neuve, « en quel style ? » est moins direct qu'un champ.

## Contrôles (sorties recopiées)
- `verifier-page.mjs` → PAGE OK.
- `controle-commun.mjs … --sans=mots,au-style,fiche,trait` → COMMUN OK.
- `mots-premier-ecran.mjs --max=80` → w4 65 mots, MOTS OK.
- `controle-panel.mjs` → PANEL OK ; remplissage w4 0,507 (le plus bas de la série).
- `controle-choix.mjs` : sans objet.
