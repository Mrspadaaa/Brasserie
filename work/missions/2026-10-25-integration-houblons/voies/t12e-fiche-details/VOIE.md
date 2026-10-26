# Voie t12e-fiche-details — la fiche et l'étape Houblons, ses derniers retours (#184)

Agent : auteur (Sonnet), pour du code. Le dessin de ces écrans est fixé par ses choix : on le complète, on ne le refait pas. Avant de
toucher à l'interface, lis `.claude/rules/affinee-frontend.md`, sur la densité utile et le compact.

## Ses mots (25.10, sur l'app déployée)
- « Explique pas le 42% autre pour lotus par exemple » (le « ? » et la mention « autres 42 % »).
- « Aussi dans source -> renvoi vraiment à la source »
- « Et et source afficher en premier le liens vers les info et fiche beermavriik mais ensuite affiche TOUTES les infos de manière
  exhaustive sur le houblons et ses caractéristiques »
- Plus tôt : « le rail ne fait plus disparaître les ibu, ebc » (voie t12d : le bandeau ne se masque que si le rail monte jusqu'à lui).

## À faire
1. **« autres 42 % » expliqué pour ce houblon**, au toucher de la mention (carte de Ma bière et fiche) ou dans le « ? » :
   - une ligne de calcul, du genre « 5 de ses 12 mots n'entrent dans aucune des 12 familles » ;
   - la liste de ces mots, traduits, avec ◇.

   Le chiffre et la liste viennent d'un même calcul. Ajoute un test.
2. **Sources** (la feuille « Sources › » de la fiche, et chaque source citée sous une valeur) :
   - **en premier**, le lien vers la page Beer Maverick du houblon (le champ `url` du catalogue), puis les fiches fournisseurs qui
     ont une adresse ; chaque lien s'ouvre dans un nouvel onglet (`target="_blank" rel="noopener"`). Une source sans adresse
     s'affiche avec son nom complet et sa date, sans lien ;
   - **ensuite, toutes les informations du houblon, exhaustives** : nom et alias, origine, usage, α, β, cohumulone, huile totale
     et chaque composé connu (myrcène, humulène, caryophyllène, farnésène, linalol, géraniol…), descripteurs et mots
     (traduits, avec leur famille ou ◇), substituts connus, stockage, et tout autre champ présent dans le catalogue
     (`src/data/hopV4/proto-data.json`, `varieties[]`) ou dans les sources du moteur ;
   - chaque valeur porte sa source et sa plage ; un champ inconnu s'écrit « ? », jamais 0. Présente-le de façon compacte :
     des lignes groupées par thème, le détail replié si c'est long.

   Ajoute un test : sur un houblon du catalogue, chaque champ présent est affiché, et le lien BM pointe sur son `url`.
3. **Le bandeau toujours masqué pendant le glisser du rail**, comme avant. Retire la condition « seulement s'il monte jusqu'à lui »
   dans `src/ui/hopIndex/maBiere/rail.ts` (voir `voies/t12d-rail/RESULTAT.md`, DÉCISION). Il revient au relâcher, sans saut.
4. **Suggérer reçoit la visée posée dans Ma bière**, par la porte. C'est l'option (a) de t12d : sans visée ni dégustation, il le dit
   sobrement et ne propose rien d'inventé.
5. **« modifier les ibu fait sauter l'app »** n'a pas été reproduit à 390 × 844. Rejoue-le à 390 × 640 et 390 × 700, avec une
   recette longue comme la sienne (deux ajouts, levure, liste des ajouts rapides). Corrige s'il saute.

## Critères
- Les nouveaux tests sont verts ; `npx vitest run tests/unit/hopIndexV4` vert ; `npm run build` vert ;
  `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED` ; `npx vitest run tests/unit/designTokens.test.ts` vert.
- Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`), en 390 × 844, à ouvrir :
  - la feuille Sources d'un houblon, en haut et en bas ;
  - l'explication de « autres » ;
  - le rail pendant un glisser ;
  - Suggérer avec une visée.

## Possède
`src/ui/hopIndex/fiche/`, `src/ui/hopIndex/maBiere/` (Carte, rail, Frise, index, hote), `src/ui/hopIndex/suggerer/`,
`src/ui/hopIndex/parcours/visee.ts`, `tests/unit/hopIndexV4/`, `work/missions/2026-10-25-integration-houblons/voies/t12e-fiche-details/`.

Une autre voie (t15c-outils) possède `HopToolLayer.tsx`, `substituer/`, `dryhopper/` et `levure/` : n'y touche pas. Pas de `git mv`.
Fichiers de travail dans `os.tmpdir()`. Retour en une ligne ; RESULTAT.md avec les preuves et les captures ouvertes. Si tu approches ta
limite de tours, écris RESULTAT.md avec ce qui reste.
