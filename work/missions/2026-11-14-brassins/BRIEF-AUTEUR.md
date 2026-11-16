# Brief commun des concepteurs — Brassins, mini maquettes v0 (non jouables)

Lu à la place des sources. N'ouvre une source que pour vérifier.

## La question
Au téléphone, dans sa cuverie : **« où en est ma cuve, que dois-je faire maintenant ? »**, et relever sans clavier.
Écrans : la **fiche d'un brassin en fermentation** (le cœur), et la **liste des brassins** (ses cuves).

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 14.11 : « Brassins (liste, fiche d'un brassin, fermentation) : suite directe du jour de brassage, jamais repris. » ; « création de mini maquettes (non jouable) ».
- 10.11 : « utilise des slider plutot que de chiffre des input de chiffre sur téléphone » ; « utilise les ux, ui booster » ;
  « Ça invite pas au mesures, c'est pas bien fait, pas de renvoi... ».
- « regarde que les info sont des actionnable pas des "information, warning" » ; « Il faut que ce soit dense sur téléphone ».
- Mots du critique pour lui devant la fiche actuelle (jury) : « C'est quoi ZZ-HOP-ARO ??? Je viens voir où en est ma cuve, la courbe
  est tout en bas et je tape encore au clavier, j'avais dit des slider !!! ».

## Obligatoire, et rien d'autre
1. **Baseline (plancher à enrichir, L07)** — liste à cocher dans chaque NOTE.md :
   - geste de mesure de **m2** tel quel : un toucher pose la cible, le pouce glisse sur une piste (bande cible visible), ±0,1 (ou
     ±0,001 en densité), la valeur tapée reste à un toucher ; jamais `type="number"` ; chiffres à la virgule (1,018 ; 19,4 °C) ;
   - grammaire de **z1** (vue du jour de brassage en ligne) pour la continuité : en-tête de lot, cartes, « Relevés du jour » ; jetons
     de DESIGN.md (thèmes clair et « cave », tons neutres, sémantique) ;
   - **J+n compté depuis le levurage**, jours civils, dit avec sa date (« J+5 · levuré le 09.11 ») ;
   - **deux températures distinctes** : °C de la **cuve** (régulateur, chaque jour, face à la consigne de la recette) et °C de
     l'**échantillon** (facultative, liée au relevé de densité) ;
   - **FG visée en bande** (plage), jamais en point ; inconnu = « — » ; aucun chiffre inventé ; ABV et atténuation « provisoires »
     tant que la densité n'est pas stable ;
   - le **dry hop par son nom, sa dose et son jour** (« Citra · 180 g · J+6 ») ; « ajouté aujourd'hui » date l'ajout ET confirme le
     déstockage en un geste (la confirmation de stock n'est pas cachée, elle est fusionnée) ;
   - premier plan : ce qui fait agir ; stock, installation, budget, carnet, suppression à un toucher ; **pas de cockpit**, pas de
     bandeau d'alerte en tête, pas de paragraphe, pas de code interne, pas de « V5.5 », pas de secondes.
2. **Honnêteté** : les chiffres ci-dessous, rien d'autre.
3. **Au doigt à 390** : cibles ≥ 44 px, téléphone posé, mains mouillées : pas de geste fin à deux doigts.
4. **Interdits techniques** : HTML statique autonome par variante, classes préfixées par l'id de la variante (`s1a-…`, L26), script
   éventuel dans une fonction immédiate ; aucun fichier dans `src/`.

## Indicatif
- Skills à charger (exigés par lui) : `boosters-ux`, `impeccable`, `ui-design-system`. Les boosters : curseur, bascule, pastille,
  jauge, plage, frise, édition sur place — plutôt que du texte.
- Défauts constatés de l'écran actuel : `work/missions/2026-11-14-brassins/voies/a2-ecran/VERDICT.md` (§ « Pour les maquettes »).
- Trous fonctionnels : `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md`. Cadrage : `jury-brassins/fiche.md`.
- Écran actuel : `voies/a1-banc/captures/fiche-fermentation-390-clair.png`, `liste-remplie-390-clair.png`.
- Base z1 : `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/v0/z1/etat.html`
  et ses PNG ; geste m2 en ligne : `git show en-ligne/2026-11-12-p2c:src/ui/BrewDayMeasurements.tsx`.

## Les chiffres (aujourd'hui samedi 14.11.2026)
- **NEIPA · LOT-019**, fermenteur F1 (30 L), 24 L. Brassée et levurée le 09.11 (Verdant IPA, 19 °C) → **J+5**.
  OG 1,062. FG visée 1,010 – 1,014. Consigne cuve : 19 °C jusqu'à J+6, puis 21 °C (repos diacétyle) J+7 à J+9, puis garde 2 °C.
  Densités : 10.11 1,058 (éch. 20,0 °C) · 12.11 1,030 (20,5 °C) · 13.11 1,018 (20,5 °C). °C cuve : 10.11 19,3 · 11.11 19,6 ·
  12.11 19,4 · 13.11 19,1 · 14.11 — (pas encore relevée).
  Dry hop prévu : **Citra 100 g + Mosaic 80 g à J+6 (15.11)**, réservés au stock. Atténuation apparente provisoire 71 %,
  alcool provisoire 5,8 %.
- Liste (ses autres brassins) : **Pale Ale · LOT-020**, planifiée le 08.11 (date dépassée, 6 j), fermenteur F2 ; **Pils · LOT-017**,
  garde froide 2 °C depuis le 03.11, J+18, densité 1,010 stable depuis le 06.11, FG à confirmer ; **Stout · LOT-015**, conditionnée
  le 06.11 : 30 × 33 cl et fût 20 L (F-01), 5,9 % ; **Saison · LOT-012**, écoulée (vendue), 6,1 %.

## Chaque variante
- Un concept, une idée, un premier écran rempli (pas une page à moitié vide). Sa propre composition (pas de squelette commun).
- Images, 390 × 844 tactile, thème clair : (1) **repos** de la fiche NEIPA ; (2) **après un geste** (au choix : °C de cuve relevée,
  densité relevée au curseur, ou dry hop ajouté), avec la feuille ou l'état qui en résulte. Deux variantes de ta série montrent aussi
  la **liste** (390). Tes deux meilleures : aussi en cave et à 1280.
- `NOTE.md` : chaleur (froide, tiède, chaude), l'idée en une ligne, la baseline cochée, les écarts assumés (`--sans=…` et raison).
- Ouvre chaque image (Read) et juge-la comme lui avant de la rendre (L12).
