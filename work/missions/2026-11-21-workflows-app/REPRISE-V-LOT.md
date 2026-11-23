# REPRISE V-LOT (21.11, fin)

Voie V-LOT : B1, PI-4, E2, VUE-SAUTE brassins. Worktree port-carnet, branche claude/port-carnet-1711. **Tout commité.**

## Commits (index temporaire + update-ref ; index réel remis à HEAD pour mes chemins, FicheFermentation et BatchDetailSheet gardent la part indexée d'une autre voie, 2 lignes « virgule-ok »)
- 547cb2075 PI-4 : « Mesurer » sur la carte d'un lot en cuve ouvre fiche et geste (mesureDemandee.ts, listeModel, CarteBrassin, pied de la fiche).
- 5e123c765 E2 : prévision de la courbe (prevision.ts, `milliPrevu`), « Comme prévu · 1,0xx » ; prévision, question et « Autre » en props de BatchDetailSheet (plus d'état partagé) ; chaines.mjs E2 : un toucher « Mesurer · B-ZZ-FERM ».
- 0595f711a VUE-SAUTE : puces à place fixe, « Tous » même élément, clés Période / Tout effacer, ligne de résultat à hauteur fixe.
- 43bd9224d B1 : reste à vendre sur la carte, toucher → caisse sur cette bière (`Caisse` prop `batchIdInitial`) ; B1-CARTE : étape après vente (114 × 33 cl · 2 fûts) et NEIPA choisie depuis son reste.

## Cause B1 après vente
`venteComptoir33` touchait « 33 cl » par `contient` dans toute la page : le premier élément trouvé était le reste « 120 × 33 cl · 2 fûts » de la carte, sous la caisse ; le doigt tombait sur la tuile « fût 20 L » au même endroit → 6 fûts vendus, F-001/F-002 livrés. Correctif de l'étape : `dans: '.cs-tiles button'`. Le calcul du reste était juste.

## Preuves
- chaines B1-CARTE, E2, B11 sur l'arbre : PARCOURS CHAINES OK. Sur en-ligne/2026-11-21-tour7 : B1 KO (carte absente), E2 KO (« Mesurer · B-ZZ-FERM » introuvable).
- principes --controle VUE-SAUTE --seul brassins : arbre PRINCIPES OK (CLS 0) ; tag ECHEC (« Tous » doigt remplacé, CLS 0,041 ; session 0,048).
- vitest : 13 fichiers, 132 verts (v-lot, brassins-sans-titre, CT4-B-8-11, caisses ×7, q2, q6, productionInsights). tsc : rien dans les fichiers de la voie.
- Build `VITE_HOP_V4=on VITE_CARNET_IA=production` : exit 0.
- Captures 390 / 1280 × clair / cave (liste, Mesurer, caisse depuis le reste), ouvertes : scratchpad de la session, dossier `caps/`.

## Constats hors voie (à verser à BUGS.md par le pilote)
- Fiche fermentation, graphe : deux étiquettes superposées en haut à gauche (« 1,050 » sur une autre), 390 et 1280.
- Fiche fermentation à 390 : l'étiquette « auj. » rognée (« uj »).
