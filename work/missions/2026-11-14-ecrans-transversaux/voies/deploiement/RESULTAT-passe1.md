deploiement : prêt, non déployé — 20 commits portés sur en-ligne/2026-11-15-finances (branche deploy/transversaux, 70c75825), tsc, build et contrôles verts, banc local vu ; arrêt demandé avant l'étape 6 (le brasseur a choisi b1s-b pour le +, un port suit)

## Étapes
1. Copie neuve `C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux`, branche `deploy/transversaux` sur `en-ligne/2026-11-15-finances` (80249f3f) : fait.
2. Cherry-pick des 21 commits de `en-ligne/2026-11-14-atelier-uv4..claude/ecrans-transversaux` : 20 commits portés, 1 sauté (vide, voir plus bas). Dernier : 70c75825 (« Réglages : à saisir centré… »).
3. `.env` et `src/data/seedData.ts` copiés du dépôt principal ; `npm ci` racine et `functions/` : codes 0 (journaux npm-ci*.log). `functions/.env` non touché.
   `scripts/check-firebase-config.mjs` n'existe pas dans le tag finances (il n'est que dans le dépôt du pilote) ; il lit `dist/assets` : lancé depuis le dépôt du pilote sur le dist de la copie, après le build.
4. `npx tsc --noEmit -p .` : 0 erreur (tsc.txt). `VITE_HOP_V4=on npm run build` : vert, 27 s (build.txt).
   `check-no-dev-auth` : « Bundle de production propre ». `check-build-flags` : « DRAPEAUX OK » (Houblons « on », enrichissement « production »). `check-firebase-config` : « CONFIG FIREBASE OK » (firebase-BpvggEnB.js). `grep dev-local dist/assets/*.js` : 0 occurrence.
5. Banc local : serveur de dev de la copie sur 3044 (`?dev-local`, VITE_HOP_V4=on), script `banc.mjs`, 390 tactile (DPR 2) et 1280, thème clair. 20 captures dans `avant/`, toutes écrites, plusieurs ouvertes (voir plus bas). Journal : `banc-journal.json`.
6 et 7. NON FAITS sur ordre du pilote : ni `firebase deploy`, ni tag `en-ligne/2026-11-15-transversaux`.

## Conflits et résolutions
- `fbdaa4d4` (Le + selon l'écran, b1r), `src/components/CreativeLabTab.tsx` : le tag déployé a remplacé les listes Contacts et Événements de l'Atelier par `ContactsView` et `TodoTimeline` (atelier-kckd). Gardé : la version déployée (les deux composants, avec leurs boutons « Noter » et « Poser »). Écarté : l'ancien JSX des deux sections que notre commit ne faisait que retoucher (retrait du bouton + interne). Gardé de notre commit : le retrait des boutons « + Noter une idée de bière » dans Recettes (fusion propre). `pricing-test` garde son bouton déployé. Conséquence à savoir : à l'Atelier, Contacts et Événements ont encore leur propre « Noter / Poser », en plus du + flottant (le « un seul + » de b1r n'y est pas appliqué ; c'est le choix déployé de kckd).
- `44e1fcc0` (Fûts : message vide), `src/ui/KegBoard.tsx` : le tag futs a déjà « Ajoute des fûts avec le bouton « + ». » avec le nouveau filtre multiple. Gardé : la version déployée ; le commit devient vide et a été sauté (20 commits au lieu de 21).
- Aucun conflit sur Finances, Frise, Bande, App.tsx, QuickActionModal : les commits port-m3 s'appliquent seuls. Finances déployé relu en rendu (captures 390 `05-finances`, 1280 `06-finances-plage`) : intact, avec sa plage « sept. oct. nov. tout … » et la feuille Période commune.

## Banc local — ce qui a été vu (captures ouvertes)
- 390 `02-plus-page` : page Plus (Je saisis, Thème, Période avec frise et poignées, Assistant, Atelier, Conversations, Journal, Connexions) ; FAB + à droite. Rien de coupé.
- 390 `04-periode-depuis-plus` : feuille Période · Novembre 2026 « Elle vaut pour toute l'application », frise 30 jours. OK.
- 1280 `06-finances-plage` : feuille Période depuis Finances, même frise. OK.
- 390 `05-finances` : Finances déployé (Synthèse, Opérations, Prévisions, Annuel ; Entré/Dépensé ; Revoir le mois). OK (après attente du chargement de l'écran : la première prise tombait sur « Chargement de l'écran… », attente du banc, pas un défaut).
- 390 `03-reglages` : Réglages d3p2 (onglets à point de santé, bilan à segments, barres TVA, IBAN avec Corriger). OK.
- 390 `08-recherche-milk` : feuille de recherche « Milk » (lot LOT-001 + recette, Brasser/Mesure). OK.
- 1280 `10-brassins-plus` : menu du + sur Brassins : Nouveau brassin, Saisir une densité, Courses, puis Partout (Écriture, Facture, Vente, Recette, Compagnon hors connexion). OK.
- Entrées du + sur Brassins aux deux largeurs : Nouveau brassin, Saisir une densité, Courses, Écriture, Facture, Vente, Recette, Compagnon.
- Console : une seule erreur, « Failed to load resource : 403 » (une ressource externe au démarrage dev-local, identique sur chaque passe ; pas d'exception de page).
- Non ouvertes en plein format : 01, 07, 09 aux deux largeurs, 1280 des autres numéros (écrites dans `avant/`).

## Tests
`npx vitest run tests/unit --reporter=dot` (tests.txt) : 3 fichiers rouges, 912 verts, 2 sautés (917) ; 3 tests rouges, 11 435 verts, 6 sautés. Les trois sont déjà rouges sur le tag `en-ligne/2026-11-15-finances` (rejoués dans un worktree détaché du tag, mêmes fichiers, tests-tag-rouges.txt), avec les mêmes écarts (26 classes muettes, 9 degrés de palette, mêmes lignes `src/domain/...` pour la virgule) :
- `designTokens.test.ts` : « n'utilise aucun degré absent de la palette » (controlesCroisesVue.tsx:85 text-cave-300, déployé).
- `factureQr.test.ts` : 12b, gabarit du seed refusé (dépend du `seedData.ts` local copié).
- `rejeu-649b/virgule-transversale.test.ts` : TE-23, `{nombre} unité` sans formateur (brewDayBilan, brewDayCalculs, controlesPiece, déployés).
Aucun nouveau rouge. Worktree du tag retiré ensuite (jonction node_modules retirée d'abord ; node_modules de la copie intact, 708 entrées).
Vu aussi en plein format : 390 `10-brassins-plus` (menu du + à tuiles sur Brassins, FAB en ×).

## Pour la reprise du déploiement (le pilote)
- Copie prête : `C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux`, HEAD 70c75825, dist/ construit (VITE_HOP_V4=on). Le serveur de dev du banc (3044) est arrêté.
- CONNAISSANCE : `check-firebase-config.mjs` lit `dist/assets` : un build propre à un tag qui ne le contient pas se vérifie en l'appelant depuis un autre dépôt. LEÇON PROPOSÉE : aucune.
- Si le port b1s-b s'ajoute : cherry-pick par-dessus dans cette copie, rejouer étapes 4 à 6.
- `scripts/check-firebase-config.mjs` manque dans le tag finances : l'appeler depuis le dépôt du pilote avec le chemin `dist/assets` de la copie.
