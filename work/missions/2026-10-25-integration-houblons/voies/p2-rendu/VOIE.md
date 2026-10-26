# Voie p2-rendu — le rendu des outils houblons sous les budgets (#179)

Agent : auteur (Sonnet), pour du code mesuré. Le dessin des écrans est son choix (règle n° 1) : cette voie ne change aucun
pixel, elle ne fait que retirer des coûts de rendu.

## Ses mots
« SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me propose ça. Dans le pire des cas »

## Le constat : banc de production, voie p1-banc-prod
Lis `voies/p1-banc-prod/RESULTAT.md`.
- Le moteur pèse environ 13 ms. C'est le recalcul de style, forcé par des lectures de géométrie et des `focus()`, qui
  domine : un restyle complet coûte 70 ms avec Comparer ouvert, à ×1.
- Les causes relevées par le profil :
  1. `src/ui/hopIndex/comparer/index.tsx` : un `useLayoutEffect` sans tableau de dépendances (vers la l. 156). Il fait trois
     `getBoundingClientRect` et recrée un `ResizeObserver` à chaque rendu. Le profil lui donne environ 320 ms par ouverture à
     ×4, et 41 ms à chaque changement de moment.
  2. `src/pages/PageShell.tsx` :
     - l'observateur d'isolation (`MutationObserver` global, l. 126 et 369-373) relit `getComputedStyle` sur la chaîne
       d'ancêtres à chaque mutation. Le profil lui donne environ 78 ms par toucher sur « + » des grammes ;
     - un `focus()` à chaque couche empilée coûte 104 ms à l'ouverture de Comparer.
  3. Les règles `body:has(...)` : −20 à −50 % sur le changement de moment et sur les grammes, rien sur les ouvertures (A/B mesuré).

## À faire
1. Rejoue d'abord le banc sur HEAD, pour avoir ta référence du jour, sur ce poste chargé :
   `node scripts/bench-hop-prod.mjs --n=8 --sortie=<os.tmpdir()>/p2-avant`.
2. Corrige (1). La bande teintée de cmc2k doit rester exactement à sa place, et suivre :
   - le changement de colonne retenue ;
   - le changement de moment ;
   - le redimensionnement de la fenêtre ;
   - le repli des sections.

   Mesure seulement quand c'est utile : `ResizeObserver` créé une fois, plus les dépendances qui changent la colonne ou la
   hauteur.
3. Corrige (2), sans casser l'isolation des couches (le lecteur d'écran et le Tab ne doivent pas atteindre la page de
   dessous) :
   - ignore les mutations internes à la page de devant ;
   - ne donne le focus qu'à la couche qui vient d'apparaître, une fois.

   Les tests de la pile (`tests/integration/AppRoutePile*.test.tsx`, `AppLanceurOutilsHoublons.test.tsx`) et l'isolation
   restent verts.
4. Rejoue le banc après chaque correctif, avec le même nombre de prises. Donne l'avant et l'après en alternance, pour annuler
   la dérive du poste.
5. Seulement si (1) et (2) ne suffisent pas pour le changement de moment ou les grammes, fais (3) : remplace les `body:has(...)`
   de `brewer-chat.css`, `brewer-navigation.css`, `floating-actions.css`, `water/workshop.css` et `yeast-choice.css` par un
   attribut posé en JS. Ne touche pas à `fiche.css`, qu'une autre voie possède : dis s'il faudrait le faire.
6. Si Comparer reste au-dessus d'environ 200 ms à l'ouverture à ×4, écris en DÉCISION À PRENDRE le compromis (c) du banc,
   chiffré. Ne le construis pas : il touche à son dessin et lui sera montré.

## Critères
- Le banc après : chaque mesure citée, avec avant et après. « erreurs de page : aucune ».
- Captures dans Chrome, en 390 × 844, à ouvrir : Comparer avant et après, au même état. La bande teintée est au même pixel,
  ce que tu mesures avec `getBoundingClientRect` dans le script de capture. Le changement de moment montre la bande qui suit.
- `controle-fonctions-rail.mjs`, `controle-radar-base.mjs` et `controle-etats.mjs` tiennent sur la maquette reconstruite.
- `npx vitest run tests/unit/hopIndexV4 tests/integration` vert (hors les échecs connus de #177, à citer) ;
  `npx vitest run tests/unit/designTokens.test.ts` vert ; `npm run build` vert ; `node scripts/audit_inputs.mjs` →
  `INPUT PROTECTION AUDIT PASSED`.

## Possède
- `src/ui/hopIndex/comparer/index.tsx`, `src/pages/PageShell.tsx`.
- Les cinq CSS de (3) : leurs règles `:has` seulement, et seulement si (3) est fait.
- `tests/integration/` pour la pile.
- `work/missions/2026-10-25-integration-houblons/voies/p2-rendu/`.

Deux autres voies sont en vol :
- d2-import-bm possède `src/ui/hopIndex/fiche/`, `src/ui/hopIndex/comparer/valeurs.ts`, `src/domain/hopIndex/v4/data.ts`,
  `src/data/` et `tests/unit/hopIndexV4/` ;
- r177-tests-rouges possède l'atelier V5.5 et ses tests.

N'y touche pas. `scripts/bench-hop-prod.mjs` se lance, ne se modifie pas sans raison écrite. Pas de `git mv`. Fichiers de travail
dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec l'avant et l'après, les captures ouvertes, et ce qui reste.
