# w6 — trois réponses géantes : quoi, combien, comment

- **Série** : w, la réponse d'abord. **Chaleur : chaude** (forme libre : une affiche en trois bandes).
- **Axes** : A1 (la réponse en très grand), A2 (tube du fermenteur à l'échelle de ses 30 L), A4 (nombres géants éditables,
  ± et 60 · 90), A5 (grand interrupteur NOLO), A6 (coller sur recette neuve seulement).
- **L'idée** : la question de l'outil, en trois bandes. « quoi » : Double IPA (le nom en dessous, « plus tard » sur une recette
  neuve, J2) ; « combien » : 24 L à 92 px, le tube du fermenteur à côté ; « comment » : 60 min, et NOLO.

## Baseline (plancher à enrichir)
- [x] En-tête commun, fil, bandeau, pied et lanceur + : tels quels.
- Écarts voulus : le style passe avant le nom (J2 : le nom peut venir après) ; les questions sont des libellés de rangée, à gauche,
  pas des surtitres.

## Honnêteté (J7)
- « conseil ~24 » au tireté, à sa vraie hauteur dans le tube ; « ~3 L évaporés » ; légende au « ? ».
- Plein : « 2 L de trop » en rouge sous le nombre, tube hachuré (`etat-plein.png`) ; neuve : « un style ? », « son nom, plus tard ».
- Maquette : évaporation recalculée à la louche.

## Boosters UX (boosters-ux)
- `style-geant` — choisir ; le style à 40 px ouvre la liste.
- `nombre-geant-volume` — ajuster ; le nombre se tape sur place, ± 1 L.
- `tube-fermenteur` — lire ; tube 0–30 L, couleur de la bière, tireté du conseil, « 6 L libres » dans la vraie zone libre.
- `nombre-geant-ebullition`, `raccourcis-ebullition` — ajuster ; ± 5, 60 · 90.
- `interrupteur-nolo` — déclencher ; grand interrupteur, vert (`etat-touche.png` : NOLO touché).
- `coller-neuve`.
- B1 OK — 7 boosters ; avant/après : `capture-haut.png`, `etat-touche.png`.
- B2 OK — trois masses nettes, le 24 et le 60 dominent ; un `primary`, le segment 60 noir (sélection).
- B3 OK — 57 mots (47 sans l'en-tête), 3 bandes et une ligne.
- B4 OK — trois bandes séparées par un filet ; aucun panneau imbriqué.
- B5 à mesurer.
- B6 ECHEC — 7 tailles (13 à 40 ; nombres saisis à 92 px hors compte).
- B7 OK — CONTRASTE OK.
- B8 OK — neuve, plein, NOLO capturés ; BRUTES OK.
- B9 partiel — tube animé, interrupteur animé ; mouvement réduit respecté.
- B10 OK — 0 `type="number"`.
- B11 — « Double IPA, 24 L, 60 min » se lit à deux mètres.
- B12 OK — STANDARD OK.
- B13 OK — cibles ≥ 24 px hors « Eau » ; 0 chevauchement.

## Ce qui tient, ce qui casse
- Tient : la question de l'outil se voit ; le geste est sur le nombre lui-même ; le tube ne ment pas sur sa position.
- Casse : le nom (« neipa v3 ») passe au second rang, ce qu'il peut ne pas vouloir sur une recette reprise ; les mots « quoi,
  combien, comment » sont-ils utiles une fois compris ? ; 92 px est beaucoup pour un nombre qu'il change rarement.

## Contrôles (sorties recopiées)
- `verifier-page.mjs` → PAGE OK.
- `controle-commun.mjs … --sans=mots,au-style,fiche,trait` → COMMUN OK.
- `mots-premier-ecran.mjs --max=80` → w6 57 mots, MOTS OK.
- `controle-panel.mjs` → PANEL OK ; remplissage w6 0,597.
- `controle-choix.mjs` : sans objet.
