# Voie c2-comparer-valeurs — les défauts de la feuille Valeurs de Comparer

Agent : auteur (Sonnet), pour corriger du code. Comparer est son choix cmc2k (règle n° 1,
`work/refonte-frontend/v4/choix/ecrans.json`) : on répare, on n'ajoute ni ligne, ni légende, ni texte.

Avant de toucher à l'interface, lis :
- `.claude/rules/affinee-frontend.md` : la densité utile, le compact ;
- DESIGN.md et `docs/ui-compacte.md`, pour les parties utiles.

Code partagé : la maquette jouable et l'app lisent les mêmes fichiers de `src/ui/hopIndex/comparer/`.

## Défauts vus par le pilote (26.10)
Captures de la voie d2 : `voies/d2-import-bm/captures/6-comparer-valeurs-composition.png` et `7-comparer-valeurs-bas.png`, en
390 × 844, Nelson Sauvin, Citra, Mosaic.
1. **Ligne IBU aux étapes** (`Feuilles.tsx`, `data-role="ibu-etapes"`) : « dry hop après à froid » déborde de sa colonne et
   chevauche la voisine (`white-space: nowrap`). Il répète aussi « à froid : ? » après un nom qui dit déjà « à froid ».
   - Correctif du pilote, **déjà dans l'arbre, non commité** : `comparer.css` (`.pq-comparer-vi-l`) et `Feuilles.tsx` (« ? »,
     la raison au survol).
   - Vérifie-le dans un vrai rendu, et garde-le ou améliore-le.
2. **Mot coupé** : dans le tableau de chimie, « humulène » se casse en « humulèn / e ». Aucun mot ne doit se couper au milieu.
   Trouve la règle qui le coupe, et fais tenir le nom (la colonne s'ajuste, ou le nom passe à la ligne entre deux mots).
3. **« inconnu » pour une donnée qu'on a.**
   - Constat : Mosaic affiche « inconnu » au myrcène, à l'humulène, au linalol et au géraniol du tableau de chimie, alors que la
     composition juste au-dessus donne 47–55 % et 10–16 %.
   - Cause : `valeurs.ts` ne lit que `composes-houblon.json`, qui a 8 fiches. Le catalogue (`src/data/hopV4/proto-data.json`, via
     le moteur) porte `oils.myrcene`, `oils.humulene`, `oils.caryophyllene`, `oils.farnesene`, `oils.others`, `cohumulone`
     (Beer Maverick) et `hsLinalool` (Hopsteiner), chacun avec sa page source.
   - Correctif : quand une ligne du tableau existe déjà, elle prend aussi ces valeurs, avec leur référence (BM, HS). La plage
     reste l'enveloppe de toutes les sources, comme aujourd'hui. « inconnu » ne reste que si aucune source n'a la valeur.
   - N'ajoute aucune ligne au tableau.
4. **Ligne « Autres » de la composition** (`Huiles.tsx`, `plageDe`).
   - Aujourd'hui : « Autres » = 100 − (myrcène + humulène + caryophyllène). Le farnésène y entre donc, alors que la ligne dit
     « β-pinène, linalol, géraniol ». Et elle affiche « ? » dès qu'un des trois manque.
   - Décision du pilote (réversible) : « Autres » lit d'abord `oils.others`, la valeur publiée « All Others » de Beer Maverick,
     qui est exactement β-pinène, linalol, géraniol et sélinène. Le calcul ne reste qu'en repli, quand la valeur publiée manque.
   - Le farnésène n'a pas de ligne : en ajouter une serait un ajout visuel, qui lui sera montré à part. Ne l'ajoute pas.
5. **Fiche du moteur** : `src/domain/hopIndex/v4/fiches.ts` écrit encore `farnesene: null` avec la raison « non importé ». Branche-le
   sur `oils.farnesene`, avec sa source.
   - Lance `tests/unit/hopIndexV4/moteurInchange.test.ts`. Si ses empreintes changent, arrête ce point et écris pourquoi.
   - Aucun résultat du moteur ne doit bouger sans décision.

## Un contrôle qui échoue sur la version d'avant (L13)
Écris `tests/integration/` ou un script `puppeteer-core` dans cette voie, sur Comparer ouvert avec Nelson Sauvin, Citra et Mosaic,
feuille Valeurs, en 390 × 844. Il vérifie que :
- aucun texte de la feuille ne déborde de sa cellule : `scrollWidth ≤ clientWidth + 1` sur chaque cellule, et aucun rectangle de
  texte ne recouvre celui d'une colonne voisine ;
- aucun mot n'est coupé : un mot seul ne donne qu'un rectangle, par `Range.getClientRects()` sur chaque mot des noms de ligne ;
- aucune cellule « inconnu » n'existe là où le catalogue a la valeur, pour les lignes myrcène, humulène, caryophyllène et linalol.

Prouve qu'il échoue sur `79ca35f5` (HEAD avant ta voie, sans le correctif du pilote : `git stash` interdit, utilise
`git worktree add` dans `os.tmpdir()` ou `git show` des fichiers). Il doit passer après.

## Critères
- Le contrôle : rouge sur 79ca35f5, vert après.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert, `moteurInchange` compris.
- `npm run build` vert ; `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`.
- Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`), en 390 × 844 puis en
  1280 × 800, toutes ouvertes et regardées :
  - la composition ;
  - le tableau de chimie ;
  - la ligne IBU.

  Compare-les côte à côte avec les captures 6 et 7 de d2 : rien d'autre ne doit avoir bougé.

## Possède
- `src/ui/hopIndex/comparer/Feuilles.tsx`, `Huiles.tsx`, `valeurs.ts`, `comparer.css` (règles de la feuille Valeurs seulement).
- `src/domain/hopIndex/v4/fiches.ts` (le farnésène seulement).
- `tests/unit/hopIndexV4/`, `tests/integration/` (ton contrôle).
- `work/missions/2026-10-25-integration-houblons/voies/c2-comparer-valeurs/`.

Deux autres voies sont en vol :
- p2-rendu possède `src/ui/hopIndex/comparer/index.tsx`, `src/pages/PageShell.tsx` et cinq CSS hors de Comparer ;
- r177-tests-rouges possède l'atelier V5.5.

N'y touche pas. Pas de `git mv`, pas de `git stash`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec les preuves, les captures ouvertes, et ce qui reste.
