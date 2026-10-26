# Voie m3-listes-u4 — les listes de remplaçants dans SON écran Substituer, tel quel (D155)

Agent : auteur (Sonnet). Aucune conception : cette voie montre son écran choisi tel quel, et seul l'ordre des remplaçants
change d'une colonne à l'autre.

## Ses mots (26.10)
- « Mais je comprends pas, on a déjà une vue pour substituer, et c'est pas du tout celles ci ??? »
- « Comment cette info a été perdue ?? »

## Ce qui a été faux (voie m2, à ne pas refaire)
`voies/m2-listes-substituts/capturer.mjs` :
- masquait tout l'écran Substituer de l'app (`.pq-substituer > :not(.m2l-ajout) { display: none }`) ;
- posait à sa place une liste inventée : rang, α, usage, mots partagés ; sans score ni stock.

Son écran est **u4** (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`, entrée `substituer`) :
- sa capture : `work/refonte-frontend/v4/ecran-1/fils11-substitution/captures/u4-vue-390.png` ;
- ses états : `work/refonte-frontend/v4/choix/etats/substituer.json`.

Ouvre ces fichiers avant tout. Dans l'app, l'écran vit dans `src/ui/hopIndex/substituer/`.

## Ce que la page doit montrer
La même question que m2 : « Quelle liste te remplace le mieux chaque houblon ? ». Mais chaque vignette est **la vraie vue Substituer
de l'app, entière et inchangée** : en-tête, réponse en gras, rangées, scores, « Lire ces scores », pied. Seul l'ordre des
remplaçants vient de la colonne :
- **A · l'actuel** : le moteur, sans rien injecter ;
- **B · mots, prudent** et **C · mots, fort** : `voies/e1-banc-eval/resultats/listes-lambda.json` (`reglage_prudent`, `reglage_retenu`) ;
- **D · C + IA** : `voies/ia1-reclassement/resultats/cote-a-cote.json`, pour 8 houblons.

## À faire
1. **Le contrôle d'abord (L13)** : `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs <script de capture>`.
   - Il échoue si le script cache des nœuds de l'écran de l'app : une règle CSS qui masque ses enfants (`display: none`,
     `visibility: hidden` sur `:not(...)` ou sur les classes de l'écran).
   - Ou si, une fois la page rendue, l'écran compte moins de nœuds visibles après l'injection qu'avant : le script le mesure à
     chaque capture et l'écrit dans un JSON que le contrôle lit.
   - Il doit échouer sur `voies/m2-listes-substituts/capturer.mjs`, et passer sur le tien.
2. **Un ordre imposé, en développement seulement.** Dans `src/ui/hopIndex/substituer/`, sous `import.meta.env.DEV` seulement :
   - si `window.__hopSubstituerOrdre` porte une liste (id de variété et score), l'écran l'utilise à la place du classement du
     moteur ;
   - tout le reste de l'écran est inchangé, son code compris ;
   - le build de production n'en garde aucune trace : `grep __hopSubstituerOrdre dist/assets/*.js` vide, et ajoute-le à
     `scripts/check-no-dev-auth.mjs` s'il convient, sinon un test.
   - Le score de chaque candidat est celui de sa colonne (listes-lambda), ou celui que recalcule `scripts/eval-hop` avec ce réglage.
     Jamais inventé. Dis d'où vient chaque score.
3. **Les captures**, dans l'app (`?dev-local&etape=houblons`, `VITE_HOP_V4=on`), en 390 × 844 :
   - Substituer ouvert sur le houblon lui-même (l'original est bien ce houblon, pas Nugget renommé), au dry hop ;
   - au repos, puis « Lire ces scores » ouvert si la liste s'y lit mieux ;
   - si l'app ne peut ouvrir Substituer que sur un houblon de la recette, ajoute ce houblon au brouillon de la fixture par la porte
     de l'app, jamais par le DOM.
4. **La page**, `voies/m3-listes-u4/page.html`, sur le modèle de la page m2 (vignettes A à D, la visionneuse), avec A en référence.
   - Ajoute en tête, à côté de A, sa capture u4 (`u4-vue-390.png`), légendée « u4 · ton choix ».
   - Elle doit passer `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m3` → `PAGE OK`.
5. **Le regard** : ouvre côte à côte ta capture A de Nelson Sauvin et `u4-vue-390.png`. Mêmes blocs, même ordre de lecture. Seuls
   les noms, les nombres et l'ordre peuvent différer. Écris dans RESULTAT.md ce que tu as comparé.

## Critères
- `controle-capture-fidele.mjs` : rouge sur le script de m2, vert sur le tien.
- `npx vitest run tests/unit/hopIndexV4` vert ; `npm run build` vert ; aucune trace de l'ordre imposé dans `dist/`.
- `PAGE OK` ; captures ouvertes.

## Possède
- `src/ui/hopIndex/substituer/` (l'ordre imposé, en développement seulement).
- `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs`.
- `tests/unit/hopIndexV4/`, `scripts/check-no-dev-auth.mjs` (une ligne, si besoin).
- `work/missions/2026-10-25-integration-houblons/voies/m3-listes-u4/`.

D'autres voies sont en vol : d3b-affichage (`src/ui/hopIndex/comparer/`, `fiche/`, `HopToolLayer.tsx` ou l'hôte de Ma bière) et
r177 (`src/services/hopV55/`). Rien de leurs fichiers. Pas de `git mv`. Fichiers de travail dans `os.tmpdir()`.

Écris RESULTAT.md tôt et complète-le. Retour en une ligne.
