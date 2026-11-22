OK — b1s-b2 « La pile au pouce » portée : pile qui monte du + flottant, tsc/tests/build verts, ET-PLUS OK, commit fe6f39a0

Port du 15.11 de `voie-r2-b1/b1s-b2.html` (choix du brasseur : « Ça j'aime énormément, à améliorer et implémenter »). Remplace la feuille b1s-a. Worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, branche `claude/ecrans-transversaux`.

## Fait
- `src/components/navigation/PlusSheet.tsx` réécrit en pile : action de l'écran pleine (56 px, couleur de la rubrique) contre le +, ses autres actions au-dessus (48 px, larges, teintées), « Sur <écran> », puis « Partout » en deux colonnes de pilules de 44 px (l'impaire seule en haut à droite), Compagnon en dernier. Ordre du DOM = ordre lu depuis le + (`column-reverse`) : l'action de l'écran est la première entrée du menu (focus à l'ouverture), alors qu'elle s'affiche en bas, au pouce.
- `navigation.css` : `.plus-pile` (300 px, 8 px au-dessus du + ; 460 px et 12 px au 1280), voile propre derrière la pile (fond de page à 80 % + flou 6 px, fondu sur 110 px), pilules `.plus-pp` (`--tc` = couleur de rubrique), × neutre à l'ouverture (surface, bord, plus d'anneau de paille ni d'ombre lourde), 80 px d'air en fin de liste. Le voile de page (`.plus-voile`) est gardé.
- `src/ui/FloatingActions.tsx` : le menu est la pile (plus de panneau ni de feuille ; sur page plein écran elle monte du + ou descend s'il est docké en haut) ; le + ouvert devient un × neutre.
- Gardé tel quel : table `plusMenuFor`/`fabActions` (une par écran, 14), `monte` (un commun déjà en tête n'est pas répété ; sa lettre reste active), + flottant aux deux largeurs, rail 1280, toast à gauche du +, recherche r3p2 (lit `autres`/`ici`), caisse v3a, « Courses » honnête, état de l'app (jamais d'exemple de la maquette).
- Libellés : courts au 390 (Écriture, Facture, Vente, Recette, Brassin), pleins et lettrés au 1280, comme la maquette ; nom accessible toujours plein (`aria-label`).
- Tests : `tests/unit/plus-ecran-pile.test.ts` (6 tests : ordre action > autres > Partout, « Sur <écran> » et « rien à créer », libellés 390/1280 et lettres, pilule seule, ET-PLUS ≥ 11 compositions, hors connexion) ; 3 attentes d'intégration réalignées (textContent des pilules : `Écriture`, `Facture`, `Compagnon` sans précision) dans brewerNavigation, FloatingActions.behavior, floatingActionsShellLayout.
- ET-PLUS (`audit-plus-et.mjs`, réécrit pour la pile) : chaque commun est en « Partout » dans l'ordre ou monté en tête (ni doublon ni perte), Compagnon dernier avec « hors connexion », action juste en 1re entrée, ≥ 11 en-têtes distincts sur 14, + flottant 56×56, pile au-dessus du + et alignée à droite, sous l'en-tête. Serveur de banc : port 3039.

## Preuves (commit **fe6f39a0** ; App.tsx non touché)
- `tsc.txt` vide (0 erreur). `tests.txt` : 35 passed (plus-ecran, plus-ecran-pile, recherche-modele). `tests-integration-plus.txt` : 6 fichiers, 44 passed. `tests-b2.txt` (suite `tests/unit`) : 2 failed / 11316 passed, les deux rouges connus et étrangers à la voie (designTokens : `text-cave-300` dans depense/ et finance/ ; virgule-transversale). `build.txt` : exit 0 (verrou pris et retiré). `audit-et.txt` : `ET-PLUS OK` (390 et 1280 : 14 écrans, 14 en-têtes distincts). Tag de départ non rejoué (pas de checkout) ; l'ancien audit échouait déjà sur le menu unique. Serveur 3039 arrêté.
- Essais : tests d'intégration 2 (3 attentes réalignées), captures 2 (anneau du × et « Sur Clients » corrigés après la première planche), audit 1, build 1.
- Détail : `tout-b2.log` (enchaînement `tout-b2.sh`) et les fichiers `tsc.txt`, `tests.txt`, `tests-integration-plus.txt`, `tests-b2.txt`, `build.txt`, `audit-et.txt`, `captures/` (14 écrans × 390/1280 × clair/cave, repos et menu), planches `captures/cote-a-cote-390-clair-brassins.png`, `-390-cave-brassins.png`, `-1280-clair-brassins.png`, `cote-a-cote-ecrans-clair-1..3.png`, `cote-a-cote-ecrans-cave-1..3.png` (12 écrans app / b1s-b2-vues-390.png).

## « Combien et quels problèmes ? » (planches ouvertes : Brassins 390 clair, cave, 1280 clair, 12 écrans clair 1 et 3)
1. La pile est superposable à la maquette (positions, deux colonnes, pilule seule, voile, couleurs de rubrique, Clients noir en clair).
2. Écarts de données (voulus, l'app ne sait pas) : « Courses » à la place de « Ajouter aux courses · froment » ; « Saisir une densité » absent quand aucun brassin n'est en fermentation (fixture dev-local vide) ; « Marché, bar » et « fût vendu » absents de Encaisser une vente ; « sera LOT-001 » (numérotation de l'app) au lieu de « sera B-033 ».
3. Corrigé après la première planche : × avec anneau de paille et ombre lourde (1280) ; « Sur Carnet » au lieu de « Sur Clients ».
4. Hors voie : en-tête de l'app (période, avatars) ≠ celui de la maquette (port-m3) ; fond d'écran de la fixture vide.

## DÉCISION À PRENDRE
« Ajouter aux courses » (libellé de la maquette) : l'app n'a pas d'ajout direct, le geste ouvre Courses. Reste « Courses » (honnête). Option (c) : vraie saisie « ajouter une ligne » (fonction neuve). Recommandation : garder « Courses » jusqu'à ce choix.

## manque : (ce que la maquette montre et que l'app ne sait pas)
« Saisir une densité » sans brassin en fermentation ; précisions « Marché, bar », « fût vendu », « froment », « pour 25 L » ; ids B-0xx ; badge « 1 » de Stocks (fixture).

CONNAISSANCE : le menu du + est une pile (`PlusSheet`, classes `plus-pile`/`plus-pp`, `column-reverse`) ; `plusMenuFor` inchangé ; le + ouvert est un × neutre.
LEÇON PROPOSÉE : aucune.
