OK — D118 : la croix de Suggérer et de Comparer, empilés sur Ma bière, ramène à l'étape Houblons ; « + … » seul porte un mot

Voie p6b-croix-pile, Sonnet, 26.10.

## Fichiers écrits

- `src/ui/hopIndex/ouvrirCouche.ts` : `poserFermeurJusquaLEtape` et `fermerJusquaLEtape()` (même principe que l'ouvreur déjà posé par App).
- `src/ui/hopIndex/devHook.ts` : `useHopPileDevHook`, que App appelle déjà, pose le fermeur. Il ferme d'un saut (`closeTo`, vers la plus haute page de la pile) quand le sommet est Suggérer ou Comparer ET qu'un `hopBeer` est dessous ; sinon il rend `false`.
- `src/ui/hopIndex/HopToolLayer.tsx` : `onCloseAll` (fermeur, repli `onClose`) passé à Suggérer et à Comparer, et à leur fallback de chargement.
- **Hors de ma liste « Possède », nécessaires** : `suggerer/CadreApp.tsx`, `suggerer/EcranApp.tsx`, `comparer/CadreApp.tsx`, `comparer/EcranApp.tsx`. Le cadre de ces deux écrans n'avait qu'un `fermer` pour la croix ET pour l'onglet « Ma bière ». Il reçoit un `fermerTout?` optionnel (croix et `onClose` du PageShell) ; l'onglet « Ma bière » garde `fermer` (un niveau : revient à l'analyse, comme le dit le critique). Sans `fermerTout`, comportement inchangé. Ni `maBiere/index.tsx` ni `demandeReelle.test.tsx` ni `src/domain/` touchés.
- `src/ui/hopIndex/biere/index.tsx` : « + … » devient « + viser une famille » seulement quand `objectifs` est vide ; dès qu'une puce existe, « + … » comme la maquette. Même place, même forme (le libellé seul change).
- Tests neufs : `tests/unit/hopIndexV4/croixPile.test.tsx` (5 tests), `tests/unit/hopIndexV4/biereUnMot.test.tsx` (2 tests).
- Ma voie : `capture-croix.mjs`, `captures/`.

## Critères

- **Test qui échoue sur HEAD, puis passe.** `croixPile.test.tsx` avec la croix ramenée à l'état de HEAD (`onCloseAll = onClose`, retiré ensuite) : 3 échecs sur 5 (Suggestions, Comparer, Suggestions → Comparer), reçu `tabs>wizard>hopBeer>hopSuggest` au lieu de `tabs>wizard`. Avec la correction : 5/5. Les deux autres tests tiennent sur HEAD comme après : l'onglet « Ma bière » de Suggérer revient d'un niveau à Ma bière ; témoin, Suggérer ouvert depuis l'étape (sans Ma bière dessous) : la croix ferme d'un niveau. Pile réelle (`useFullScreenRoute`, `useHopPileDevHook`, `HopToolLayer`), écrans réels, drapeau hopV4 allumé, le geste passe par l'onglet cliqué.
- **`npx vitest run tests/unit/hopIndexV4 tests/integration/AppRoutePile.test.tsx`** : 716 verts, 13 rouges, tous dans `affinageD102.test.ts` (D174/D175 : classement du moteur, Citra cryo et maxBuy), des tests de `src/domain/` en cours de modification par f2 et c7 ; rien de commun avec la pile. `AppRoutePile.test.tsx` : vert. `croixPile` et `biereUnMot` : verts.
- **`npm run build`** : `✓ built in 21.70s`.
- **Captures 390 × 844, ouvertes en image** (`captures/`) : `apres-suggerer-avant-croix-390.png` (Suggérer, onglet Suggestions actif, croix en haut à gauche) puis `apres-suggerer-apres-croix-390.png` (l'étape Houblons 3/7 : Nugget 46 g, barres des familles, « Ouvrir l'analyse de ma bière », Retour / Suivant — Levure). Même couple pour Comparer (`apres-comparer-*` : « avant » ouverte en image ; « après » identique octet pour octet à celle de Suggérer, donc non rouverte). Parcours joué dans Chrome : `node scripts/with_server.mjs … capture-croix.mjs` imprime `CROIX OK`, piles « tabs > wizard > hopBeer > hopSuggest » puis « tabs > wizard » ; idem Comparer.
- **« + … »** : vérifié par `biereUnMot.test.tsx` (seul : « + viser une famille », avec une puce de visée : « + … », visée retirée : le mot revient). Pas de capture du bouton seul : l'écran Ma bière n'est pas capturé dans cette voie.

## Doutes et limites

- **Le mot du « + … ».** La maquette (`prototypes/houblons-v4/parcours/src/ecrans/biere/index.tsx`, l. 264-266) écrit « + … » dans tous les cas, aucun mot ; elle ne montre jamais le bouton seul (ses deux puces « + floral · − résineux » viennent d'une fixture). Je n'ai donc rien à « reprendre tel quel » pour le cas seul : j'ai pris la première formule du critique (§ 2) : « + viser une famille ». Son goût sur ce mot n'est pas cité ; alternative du critique : « + objectif ». Réversible en une ligne.
- **Portée de la croix (L01, lecture étroite).** Lu « empilée sur hopBeer » : Suggérer → Comparer **sans** Ma bière dessous (étape → Suggérer → Comparer) garde la croix d'un niveau (retour à Suggérer). D118 écrit « jamais ailleurs », « pont d'un autre outil » compris : c'est plus large. Pour l'élargir : retirer la condition `some(r => r.view === 'hopBeer')` de `devHook.ts`.
- **Onglet « Ma bière » de Comparer** : ferme un niveau, donc revient à Suggérer s'il a été ouvert depuis Suggérer (pas à Ma bière). Non traité (hors demande), signalé.
- **Défaut vu, pas le mien** : Comparer ouvert par l'onglet avec 0 houblon retenu (capture `apres-comparer-avant-croix-390.png`) montre un titre « pour ma bière ? » incomplet et une puce « Ma bière » qui se chevauche avec un rond, sous la tête. À voir par le pilote ou le critique.
- Le fermeur est posé par `useHopPileDevHook` à chaque changement de pile (écrit à chaque rendu de pile, retiré au démontage) ; sans pile posée (aperçu isolé), la croix reprend `onClose`.

DÉCISION À PRENDRE : (1) mot du « + … » seul : « + viser une famille » (pris) ou « + objectif » ; (2) D118 élargi à Suggérer → Comparer hors Ma bière : recommandé oui, c'est la lettre de la règle et une ligne à retirer ; non fait faute de consigne.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

## Pilote : D118 élargi

- Décision (pilote) : la croix d'une couche empilée ferme toute la pile jusqu'à l'étape Houblons, jamais ailleurs, y compris Suggérer → Comparer sans Ma bière dessous.
- Fichier modifié : `src/ui/hopIndex/devHook.ts` : condition `some(r => r.view === 'hopBeer')` retirée (ancienne l. 38) ; commentaire D118 réécrit en conséquence.
- Test : aucun test n'exigeait l'ancien comportement. Le témoin de `tests/unit/hopIndexV4/croixPile.test.tsx` (« Suggérer ouvert depuis l'étape … ferme d'un niveau ») reste vert : sans Ma bière dessous, la croix de `tabs > wizard > hopSuggest` ramène déjà à `tabs > wizard`. Aucun test Suggérer → Comparer sans Ma bière n'existe ; `croixPile.test.tsx` non modifié.
- Vérification : `npx vitest run tests/unit/hopIndexV4/croixPile.test.tsx tests/unit/hopIndexV4/biereUnMot.test.tsx tests/integration/AppRoutePile.test.tsx` : 3 fichiers, 9 tests verts (9/9).
- Vérification : `npx tsc --noEmit -p .` : sortie vide, code 0.
- Non vérifié : le cas Suggérer → Comparer sans Ma bière n'est couvert par aucun test ni capture. Le repli `closeTo(…, { view: 'hopBeer' })` sans hopBeer dans la pile n'est pas testé ; à vérifier si le pilote veut un test dédié.
- Non commité.
