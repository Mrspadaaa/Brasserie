TESTS ROUGES 109 rouges / 164 total (54 verts de garde-fou, 1 sauté) — commit : voir `git log -1 -- tests/unit/c54Regles.test.tsx`

# RESULTAT c54-tests

## Endroits où chaque règle s'applique (grep des équivalents)
- **R19** (colonne prix du tableau, prix unitaire entier ailleurs) : `src/ui/carnets/TableauCarnet.tsx` (cellules `__prix`, mesure `poserLargeurs` 44 à 104 px) = SEUL endroit à corriger ; garde-fous (le prix unitaire reste entier) : `PrixPastille.tsx` / feuille Articles (`FeuilleCartes`, `CarteClassee`), `Comparer.tsx` (`comparer.ts` ligne de prix), `FicheArticle.tsx`.
- **R20** (une fonction nomme la marche, jamais « 2 mouvements » sans nom) : `src/ui/calendrier/entete/Courbe.tsx` `placerNoms` (forme courte `court: "${n} mouvements"`, ligne 312) ; `src/ui/finance/previsions/EscalierSvg.tsx` `texteLot` et `texteLotCourt` (« 2 sorties −159,95, 08.12 » : même défaut, sans nom) ; `src/ui/finance/analyse/Escalier.tsx` (`lotsDuJour`, déjà « + 1 autre »). Non testé : `LectureCourbe.tsx` (détail au doigt : chaque mouvement a son nom).
- **R21** (groupes par mots-clés) : `functions/src/lienFusion.ts` (`ORDRE`, `trierParDecision`, `rangDeDecision`, `RANG_INCONNU`, familles de noms : « Étape » absent) ; `functions/src/lienLibelles.ts` (`prioriserValeurs`, `traduireValeurs` : nom « Branchement ») ; `functions/src/lireLien.ts` ; `src/domain/carnets/modele.ts` (`lireCarnet`, ligne 280) ; `src/domain/carnets/comparer.ts` (`valeursLuesOrdonnees`, carte et Comparer) ; `src/ui/carnets/FicheArticle.tsx` (ligne 171) ; `TableauCarnet.tsx` (`rangColonne`, colonne choisie par `trierParDecision`).
- **R22** (jauge : petit à gauche, grand à droite) : `FicheArticle.tsx` `Piste` (le grand à gauche pour « plus » : le défaut) ; `CarteArticle.tsx` `CarteClassee` (`cn-reglette-plein`, juste) ; `Choisir.tsx` `Reglette` (g05-11 : « ‹ mieux » à gauche, MAQUETTE CHOISIE) ; Comparer n'a pas de jauge.

## Fichiers écrits
- `tests/unit/c54Regles.test.tsx` (4 blocs `describe` R19, R20, R21, R22) ; `tests/fixtures/c54/chambre-froide.json` (noms réécrits à la main d'après les captures A-F1-1, Z-F1-1 : aucune donnée personnelle) ; ce dossier (`tests-rouge.log`). Aucun fichier de `src/` ni `functions/` modifié (`git status` : seuls `.codex/hooks.json` et `source4-portable-bundle-manifest-01.json`, déjà modifiés avant la voie).

## Sortie décisive (`tests-rouge.log`, `npx vitest run tests/unit/c54Regles* --reporter=dot`)
`Tests 109 failed | 54 passed | 1 skipped (164)`

| Règle | rouges | verts | total | rouges pour la bonne cause |
|---|---|---|---|---|
| R19 | 6 | 10 | 16 | la cellule du tableau dit « 79080 L · 9,88 CHF/L » (nombre, quantité, prix unitaire) ; verts = prix unitaire entier dans feuille Articles, pastille, Comparer, fiche (garde-fous, justifiés : endroits déjà justes) |
| R20 | 15 | 3 | 18 | Calendrier 366/334/300 px, 3 jeux de noms : étiquette posée « 2 mouvements −159,95 » (reproduit le tour 54) ; `texteLotCourt` « 2 sorties −159,95, 08.12 » ; bulle de Prévisions pour noms longs. Verts : bulle de noms courts, parité des noms (déjà juste au calendrier, Prévisions et Analyse quand le nom tient) |
| R21 | 85 | 36 | 121 | 6 endroits × 2 pages : « Étape » loin de « Tension », énergie coupée, « Quantité de frigorigène » loin du fluide, noms jamais vus (« Phases d'alimentation », « Charge de réfrigérant », « Régime nominal 400 W ») non rangés par mot-clé, « Étape » jamais nommé « Branchement » à la lecture. Verts : dimensions et porte (déjà justes), noms sans mot-clé après les groupes (déjà juste) |
| R22 | 3 | 5 | 9 (1 sauté) | fiche, critère « plus » : rond de 242 à gauche, borne « 242 la plus haute » à gauche. Verts : critère « moins » et feuille Articles (garde-fous) |

Essais : un par critère après la correction des deux filtres de test (marche −159,95 isolée du petit achat du même jour ; liste connue pour le test des noms sans mot-clé).

## Doutes et limites
- jsdom ne mesure rien : « rien n'est rogné au bord d'une cellule » se lit par le contenu de la cellule (seulement le prix) ; la preuve à 390 px reste en ligne.
- R21, mot-clé dans la VALEUR (« 400 W ») : lecture de « kWh, W, V » de la règle comme unités de valeur. Si la règle les voulait seulement dans les noms, retirer ce test (un seul `it`, « un nom inconnu dont la VALEUR est en W »).
- R21, le froid se teste sans la température (elle décide d'abord, C50-4, et reste en tête) ; l'énergie inclut « Étape » et « Phase » ; « Branchement » est testé seulement à la lecture d'une page (`lireLien`), seul endroit qui renomme.
- R20, « une seule fonction » se prouve par comportement (parité du nom aux trois endroits, jamais de nombre seul) ; aucun nom de fonction n'est imposé au correcteur.

DÉCISION À PRENDRE : la réglette de l'écran Choisir (`Reglette`, g05-11) met « ‹ mieux · 242 » à gauche pour un critère « plus » : sens inverse de R22 (« petit à gauche, grand à droite partout »). C'est une maquette choisie par le brasseur (règle n° 1). Options : (A) la laisser et dire que R22 ne couvre que fiche et feuille Articles ; (B) inverser la réglette de Choisir aussi, en montrant le changement au brasseur. Recommandation : A tant qu'il n'a pas vu la variante en mini maquette. Le test est écrit et SAUTÉ (`it.skip`, dernier du bloc R22) : le retirer du `skip` si B est choisie.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
