# Voie d3b-affichage — les données fusionnées dans Comparer et dans la fiche (#180, seconde étape de D154)

Agent : auteur (Sonnet), pour du code. Les écrans sont ses choix : Comparer cmc2k, et la fiche avec ses Sources (règle n° 1). On
remplit avec les nouvelles données, on ne redessine pas. Aucun texte, aucune légende, aucun bouton en plus.

Avant de toucher à l'interface, lis :
- `.claude/rules/affinee-frontend.md` ;
- DESIGN.md et `docs/ui-compacte.md`, pour les parties utiles.

## Ses mots
- « ne regroupe jamais plusieurs huiles. Sauf si c'est utile et que elles sont déjà séparé à un endroit. Donc je veux les deux » (D154).
- « Et et source afficher en premier le liens vers les info et fiche beermavriik mais ensuite affiche TOUTES les infos de manière
  exhaustive sur le houblons et ses caractéristiques » (25.10).
- « Il faut récupérer un maximum de données. Toutes données sera bonne à prendre. » ; et sur la diffusion : « C'est pas plublic
  donc pas de problème » (D78).

## Entrées
- `src/data/hopV4/complements.json` et son chargeur `src/domain/hopIndex/v4/complements.ts` : `chargerComplements()` par import
  dynamique, `valeursDe(id, champ)` et `enveloppeDe(id, champ)`. Lis `voies/d3a-fusion/RESULTAT.md` et `rapport.md`.
- La composition de Comparer (`src/ui/hopIndex/comparer/Huiles.tsx`, voie o1), le tableau de chimie (`valeurs.ts`, `compose()`,
  `huile()`) et la fiche Sources (`src/ui/hopIndex/fiche/sources.ts`, `SourcesFiche.tsx`).

## À faire
1. **Une seule source de vérité.** `compose()` et `huile()` prennent l'enveloppe de :
   - `composes-houblon.json` ;
   - le catalogue ;
   - `complements.json`.

   Les références des sources s'affichent comme aujourd'hui (BM, HS…), avec des abréviations courtes pour les nouvelles (BH
   BarthHaas, JH John I. Haas, CF Charles Faram, BHA, HL Hopslist, HPA, YVH…). Le titre complet est au survol, comme `titreRef()`.
2. **Composition** : chaque huile nommée qui a une valeur a sa ligne. Le sélinène y entre quand un houblon comparé l'a.
   - Le reste « autres » retranche toute huile qui a sa ligne, et ne nomme plus que celles qui n'en ont pas : aujourd'hui le
     β-pinène, qu'aucune source du catalogue ne publie.
   - Le contrôle D154 de `tests/integration/comparerValeurs.chrome.mjs` reste vert.
3. **La fiche, Sources** : toutes les valeurs de toutes les sources, champ par champ.
   - Pour chaque valeur : sa source, son année, le lien vers la fiche, dans la présentation compacte actuelle (lignes groupées par
     thème, détail replié si c'est long).
   - Les nouveaux champs aussi : polyphénols, xanthohumol, thiols, intensité d'arôme, sélinène, rendement et conservation.
   - Une valeur `suspect` ou `horsEnveloppe` ne s'affiche pas dans l'enveloppe. Elle reste visible dans le détail replié, marquée
     d'un signe discret, avec sa raison au survol.
   - Les liens des fiches fournisseurs viennent après Beer Maverick, dans l'ordre de ses mots.
4. **Le chargement à la demande** :
   - Comparer lance `chargerComplements()` dès son ouverture, la fiche dès son ouverture : la feuille Valeurs ou Sources a ses
     données quand on la touche.
   - Avant leur arrivée, rien ne saute à l'écran : pas de « ? » qui devient une valeur sous le doigt, pas de ligne qui pousse les
     autres. Une feuille ouverte avant la fin du chargement attend sans clignoter, au plus quelques centaines de ms, ou se
     remplit sans décalage. Mesure-le.
   - Hors ligne, le morceau est en cache (PWA) ; sinon, les valeurs du catalogue seules, sans erreur.
5. **Contrôles et tests** :
   - étends `comparerValeurs.chrome.mjs` : une valeur venue de `complements.json`, par exemple le géraniol de Nelson Sauvin s'il
     existe, ou un trio choisi pour en avoir, s'affiche ;
   - un test unitaire de la fusion des trois sources dans `compose()` ;
   - un test de la fiche : chaque champ présent dans `complements.json` pour un houblon s'affiche dans Sources.

## Critères
- `comparerValeurs.chrome.mjs` vert en 390 et en `--large` (trio Nelson, et `--trio saaz`), D154 compris.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert, `moteurInchange` compris.
- `npm run build` vert ; B5 ≤ 150 ko (`node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`), et le morceau
  `complements` reste à part ; `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`.
- Captures en 390 × 844, ouvertes et regardées :
  - la composition et le tableau de chimie, Nelson Sauvin, Citra et Mosaic, puis un trio riche en données nouvelles ;
  - la feuille Sources de Nelson Sauvin et de Citra, en haut et en bas.

## Possède
- `src/ui/hopIndex/comparer/Huiles.tsx`, `valeurs.ts`, `Feuilles.tsx` (lignes et références seulement), `comparer.css` (règles des
  lignes seulement), `src/ui/hopIndex/comparer/EcranApp.tsx` (le préchargement seulement).
- `src/ui/hopIndex/fiche/`.
- `tests/integration/comparerValeurs.chrome.mjs`, `tests/unit/hopIndexV4/`.
- `work/missions/2026-10-25-integration-houblons/voies/d3b-affichage/`.

Ne touche pas au moteur (`src/domain/hopIndex/v4/` sauf l'appel au chargeur), ni à `complements.json`, ni à `fusion.mjs`. Une erreur
de données s'écrit dans RESULTAT.md. La voie r177 possède `src/services/hopV55/`. Pas de `git mv`, pas de `git stash`. Fichiers de
travail dans `os.tmpdir()`.

Écris RESULTAT.md tôt et complète-le. Retour en une ligne.
