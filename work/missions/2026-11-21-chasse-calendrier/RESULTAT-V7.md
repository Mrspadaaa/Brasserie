REPRISE : work/missions/2026-11-21-chasse-calendrier/RESULTAT-V7.md — V7 : CHD-3, CHD-4, CHD-5, CHV-12 corrigés (607844278, rouge tour8, vert arbre) ; CHV-18 NON corrigé (CH-V18 reste rouge, contrôle à affiner).

Agent arrêté à ~165 k (contexte lourd en lectures, au-delà des 120 k demandés).

## Fichiers (port-carnet, commit 607844278)
- `src/ui/calendrier/frise/Rangee.tsx` : `pastille()` réécrite. CHD-3 : un brassin compte ses lignes de prévision datées dans la fenêtre (champ `lignes`), pas son budget entier ; sans ligne dans la fenêtre : « aucun mouvement », jamais « solde non renseigné ». CHD-4 : une échéance récurrente (`proposition: 'echeance'`, le loyer) compte au solde, dite « prévu ». CHD-5 : nouveau `mot` (« confirmé » seulement si tout est encaissé ; « à encaisser » / « à payer » pour une facture attendue ; « prévu » dès qu'une prévision, un plan ou un coût à venir y entre), et le texte `conf` posé à côté (le JSX lit `p.conf`) ; la lecture (aria-label) détaille « dont +27 encaissé, +1 200 à encaisser, +1 030 prévu ». `parJour` ajouté au Pick de `RangeeProps.barre` (demande du pilote, voie « jour »).
- `src/domain/calendrier.ts` : type `LigneBrassin`, champ `ChoseCalendrier.lignes`, fonction `lignesBrassin` (mêmes lignes que `budgetBrassin`), posée dans `preparerChoses`.
- `scripts/parcours/chaines-v7.mjs` (nouveau, bloc distinct à fusionner) : étapes `CH-D3`, `CH-D4`, `CH-D5`, `CH-V12`. Commande : `node scripts/parcours/chaines-v7.mjs <dossier> --build <build> --themes clair,cave --largeurs 390 --caps` (`--ref en-ligne/2026-11-21-tour8` ou `--build` d'un build du tag ; `DUMP=1` pour lire les pastilles).
- BUGS.md : CHD-3, CHD-4, CHD-5, CHV-12 « corrigé 607844278 » (lignes seules, à la main). CHV-18 inchangé (ouvert).

## Preuves
- Tour8 (build `scratchpad/build-tour8`), 390 clair : CH-D3 KO (2 sem. « −90 + coût à venir · confirmé 26 oct.–8 nov. » ; 6 sem. « −228 ») ; CH-D4 KO (6 sem. « −600 », An « −1 051 ») ; CH-D5 KO (3 mois Ventes « +2 257 confirmé », Achats « −1 200 confirmé ») ; CH-V12 KO (Papiers 6 mois et An : « confirmé S44–S16 » 104 px dans 101).
- Arbre : `CHAINES V7 OK` (clair, 390) : D3 2 sem. « coût à venir · prévu » (plus de −90) et 6 sem. « −183 » ; D4 6 sem. « −1 000 », An « −5 851 » (−1 051 − 4 800) dit « prévu » ; D5 3 mois Ventes et Achats « prévu » (Ventes : +27 encaissé, +1 200 à encaisser, +1 030 prévu ; Achats : −420 à payer, −780 prévu), contre-épreuve 6 sem. Ventes « confirmé » (+27 encaissé) ; V12 aucun mot rogné.
- Captures ouvertes : `scratchpad/o7-arbre/CH-V12-390-clair-an.png`, `CH-D5-390-clair-3m.png` (lecture : pastilles « prévu oct.–oct. », « prévu S44–S3 » entières, rien de coupé).
- Vitest : 11 fichiers `tests/unit/calendrier*` 259/259 ; `calendrierFrise`, `calendrierPC153`, `calendrierPaquetE` verts ; `tsc --noEmit` propre.

## Reste à faire
1. Cave et 1280 de CH-D3/D4/D5/V12 : non joués (seul le clair à 390 l'a été) ; rejouer `--themes clair,cave --largeurs 390,1280` (V12 saute le 1280). Ouvrir aussi la capture D3 2 sem. et D4 An.
2. Aucun test Vitest neuf pour `pastille` (règles de calcul : fenêtre par date, mot selon le statut). À écrire dans `tests/unit/` (par exemple `calendrierPastille.test.ts`).
3. CHV-18, non fait. `poser` (Rangee.tsx) essayé « côté d'abord, lignes ensuite » pour les marques : CH-V18 donne les mêmes 12 KO que tour8, donc le changement n'avait aucun effet et je l'ai retiré (rien d'inprouvé commité). Cause probable : le contrôle CH-V18 (chaines-v2.mjs) mesure « place à droite » jusqu'au bord de l'écran moins 8 px, mais la frise réserve à droite la zone du + volant (`reserveDroite`) et des noms longs (« Vente 6 × Pale Ale — Comptoir ») ne tiennent vraiment pas à droite : le gauche est alors forcé, pas un zigzag. À refaire : mesurer la place à droite en retranchant la réserve du +, ne garder en rouge que les étiquettes qui auraient tenu, puis voir si un vrai zigzag reste (« Impôt sur la bière · Fruty » en An, « Foire du Valais » en 6 mois) ; sinon l'option B de RESULTAT-V2 (le miroir suffit) est la bonne.
4. `controle-bugs.mjs` : lancé à la fin (voir ci-dessous).

## Doutes
- « confirmé oct.–oct. » en An : la période dit deux fois le même mois (étiquettes de colonnes d'un mois) ; préexistant, à voir avec V8 (périodes).
- Le mot « prévu » prend désormais presque toutes les pastilles ; leur style (plein / pointillé) n'a pas bougé (`confirme` garde son sens d'avant).
- Papiers en An garde « + coût à venir » et « 1 sans montant » (préexistant : TVA sans montant).

DÉCISION À PRENDRE : CHV-18, option A (poser les marques côté d'abord) ou B (zigzag assumé, lisible grâce au miroir de V2) ? Recommandation : affiner d'abord le contrôle (point 3) ; si un zigzag réel reste, A avec capture de la hauteur des rangées.
CONNAISSANCE : une pastille de rangée qui somme le budget d'une barre compte hors fenêtre ; la somme se fait sur les lignes datées (`ChoseCalendrier.lignes`).
LEÇON PROPOSÉE : aucune
