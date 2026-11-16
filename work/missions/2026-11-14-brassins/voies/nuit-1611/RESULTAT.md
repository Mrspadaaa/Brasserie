OK — constats 2 à 5 corrigés ; 1 et 6 non reproduits (banc Chrome 390 et 1280) ; build et bancs verts ; commité, non déployé.

## Constats (jeu en ligne nuit 16.11)
1. « Prévu le 30.11.2020 » : NON REPRODUIT (banc Chrome + test). `c1.mjs` : Brasser la Blonde, lundi 30 novembre, Planifier, ouvre la fiche, « Commencer le brassage », lit le texte de la Conduite : « Prévu le 30.11.2026 » à 390 et à 1280 (année lue 2026, `C1 OK`). Captures zoomées ouvertes : `captures/nuit-c1-3-prevu-zoom-390.png`, `-1280.png` ; Conduite entière : `nuit-c1-4-conduite-*.png`. Test : `tests/unit/fix-nuit-1611-1.test.tsx` (7 verts, tous formats stockés).
2. Fiche restée ouverte après « Commencer le brassage » : CORRIGÉ (`ProductionTab.tsx` ferme la fiche). Test `fix-nuit-1611-2`. Vu en capture : `nuit-c1-4-conduite-390.png`, aucune fiche derrière.
3. Hauteur de la feuille qui saute : CORRIGÉ (`BatchDetailSheet.tsx`, `h-[88dvh]` hors fiche de fermentation). Test `fix-nuit-1611-3`. Chrome (`c35.mjs`) : hauteur identique sur Préparer, Carnet, Dossier : 743 px à 390, 704 px à 1280. Captures `nuit-c3-onglet-*`. Doute : la fiche courte (Préparer) laisse du vide sous les boutons ; le brasseur peut préférer un `min-h` (à juger).
4. Feuille « Ranger » pleine largeur : CORRIGÉ (`CatalogItemMenu.tsx`, `lg:max-w-xl lg:mx-auto`). Test `fix-nuit-1611-4`. Chrome : 576 px centrée à 1280 (x=352), pleine largeur à 390 (feuille du bas). Captures `nuit-c4-ranger-*`.
5. Calendrier tout « cuve pleine » : CORRIGÉ (option a). `cuveModel.ts` (`finNonDatee`), `FeuilleBrasser.tsx`, `brasser.css`. Test `fix-nuit-1611-5`. Chrome : 4 cases en pointillé (14 au 17.11, NEIPA et Pale Ale sans mise en bouteille datée) et clé « fin non datée » dans la légende, à 390 et à 1280. Captures `nuit-c5-damier-*`. Le 17.11 (Pils datée) reste en pointillé car les deux autres cuves n'ont pas de fin : voulu.
6. « Tout effacer » laisse « À brasser » : NON REPRODUIT (banc Chrome + test). `c6.mjs` : puce « À brasser » posée, feuille Filtrer (style Stout, 2 filtres), « Voir les 1 », « Tout effacer » de la liste : toutes les puces repassent à `aria-pressed=false`, la liste revient à 5 brassins, à 390 et à 1280. Captures ouvertes : `nuit-c6-avant-effacer-390.png` (2 filtres, À brasser posée), `nuit-c6-apres-effacer-390.png` et `-1280.png`. Test `fix-nuit-1611-6` (3 verts). Non essayés : le lien « Tout effacer » de la feuille et son pied « Tout effacer · n » (couverts par le test composant, pas par Chrome).

## Fichiers
src : `src/components/tabs/ProductionTab.tsx`, `src/ui/BatchDetailSheet.tsx`, `src/ui/production/CatalogItemMenu.tsx`, `src/ui/production/brasser/{FeuilleBrasser.tsx,brasser.css,cuveModel.ts}`.
Tests : `tests/unit/fix-nuit-1611-1.test.tsx` à `-6.test.tsx`.
Voie : `c1.mjs`, `c6.mjs`, `c35.mjs` (bancs Chrome, `socle.mjs` : fixtures ZZ et ouverture), `captures/`.

## Critères rejoués
- `npx tsc --noEmit` : seules 2 erreurs, dans `functions/src/brewer*Store.ts` (module `firebase-admin/firestore` absent), hors périmètre, déjà là avant ; aucune dans `src/` ni `tests/`.
- Vitest complet (26 min, machine chargée par d'autres sessions) : `FAILS 64 BASE 64 NEW 2`. Les 2 nouveaux : `dashboardNavigation` (2 tests, « dialog Garde du mois précédent » introuvable) échoue AUSSI avec les 6 fichiers src remis à HEAD (essai fait, fichiers restaurés et comparés) : préexistant, pas de nous. `fuzzSaisie` : « Timeout calling onTaskUpdate » dû à la charge ; seul avec `--testTimeout=120000` : 12 verts sur 12, l'erreur RPC restante est un artefact de charge. Donc aucun échec causé par nos changements. `port-sb-brasser-creer`, `batchDefautsB`, `compactProduction` et les tests de BatchDetailSheet : verts.
- `npx vite build` : OK (37 s). `check-build-flags.mjs dist` : 3 `DRAPEAUX OK`. `check-no-dev-auth.mjs` : « Bundle de production propre ».
- Bancs : sb (3122) `BANC OK 11 captures` ; s1 (3121) `BANC OK 27 captures`.

## Essais, limites
- Plusieurs essais de banc ont échoué par ma faute de script (clic sur « Voir les analyses » au lieu de « Voir les n », fiche encore en chargement à 390) ; corrigés, aucun critère d'app.
- Non déployé. Pas de donnée réelle (fixtures ZZ, `?dev-local`).

## DÉCISION À PRENDRE
BUGS.md : je n'ai pas pu écrire dans `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md` (l'outil refuse : checkout de base hors du worktree) ; le BUGS.md de ce worktree n'a pas la section « Jeu en ligne nuit 16.11 ». Le pilote applique, section « Jeu en ligne nuit 16.11 » :
- ligne 1 : « 1. grave » devient « 1. NON REPRODUIT (16.11, banc) » ;
- ligne 6 : « 6. mineur » devient « 6. NON REPRODUIT (16.11, banc) » ;
- lignes 2 à 5 : ajouter à la fin « corrigé <hash du commit> » (hash donné dans ma réponse).

CONNAISSANCE : `dashboardNavigation.test.tsx` (« Garde du mois précédent ») est rouge sur HEAD, indépendamment de la voie ; la liste de base de `newfails2.cjs` ne le contient pas. La suite complète prend 26 min quand d'autres sessions tournent.
LEÇON PROPOSÉE : aucune
