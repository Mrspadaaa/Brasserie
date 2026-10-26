# Voie d2-import-bm — compléter le catalogue depuis le cache Beer Maverick (#180)

Agent : auteur (Sonnet), pour du code avec des choix. Avant de toucher à l'interface, lis `.claude/rules/affinee-frontend.md`.

## Ses mots
- 25.10 : « Une fois que ce sera bon, il faudra importé TOUTES les données de TOUS les houblons. »
- 25.10 : « Et et source afficher en premier le liens vers les info et fiche beermavriik mais ensuite affiche TOUTES les infos de
  manière exhaustive sur le houblons et ses caractéristiques »

## Constat du pilote (26.10)
- Couverture mesurée : `voies/d1-couverture/couverture.md`. Cohumulone 0 %, farnésène 1,3 %, géraniol 0,9 %, linalol 21 %,
  usage 20 %, substituts 0 %.
- Cause : `scripts/scrape-hop-community.mjs` ne lit que 6 lignes du tableau des pages Beer Maverick (α, β, huile, myrcène,
  humulène, caryophyllène). Les pages publient bien plus.
- Les pages sont déjà en cache, avec leur reçu sha256 : 319 pages `https://beermaverick.com/hop/…`, relevées le 2026-09-08, dans
  `C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources/`. Ce cache est dans le dépôt principal,
  ignoré par git. Le nom du fichier est le sha256 de l'URL, et un `.json` voisin porte l'URL et la date de relevé.
- Exemple, Nelson Sauvin, lu dans le cache :
  - Purpose : Aroma ; Ownership : ™ NZ Hops Ltd.
  - Co-Humulone as % of Alpha : 20-25 % ; Alpha-Beta Ratio : 1:1 - 3:1 ;
  - › Farnesene : 0-1 % ; › All Others : 6-49 % (« Including β-pinene, linalool, geranoil & selinene ») ;
  - sections : Flavor & Aroma Profile, Hop Pairings, Beer Styles, Substitutions, Hop Statistics.

## À faire
1. **Hors ligne strict.** `scripts/hop-source-cache.mjs` reçoit :
   - un mode `--offline`, où un absent du cache lève une erreur et ne télécharge jamais ;
   - un chemin de cache réglable (`HOP_SOURCE_CACHE`).

   Ajoute un test : sans le cache, une erreur, et aucun `fetch`. **Aucun accès réseau dans cette voie**, aucun accès Firestore.
2. **Extraction étendue**, depuis le cache seulement. Chaque valeur porte sa source : l'URL de la page, sa date de modification
   publiée et la date de relevé.
   - Valeurs :
     - cohumulone, en % des acides α (unité à part, pas en % de l'huile) ;
     - farnésène et « All Others », en % de l'huile ;
     - rapport α/β, en texte brut ;
     - usage (Aroma, Bittering, Dual) et propriétaire.
   - Listes :
     - styles de bière ;
     - substituts, chacun relié à l'id du catalogue quand le nom se résout, sinon gardé avec son nom ;
     - accords (Hop Pairings).
   - Profil d'arôme : s'il est dans la page (radar à 9 axes, de 0 à 5), extrais-le en champ cité. « All zero values mean there are
     no aroma values » : tout à zéro devient null. **Ne le branche pas au moteur** : c'est une décision à part (une convention du
     moteur), à écrire en DÉCISION À PRENDRE avec la couverture obtenue.
   - Règles :
     - un inconnu reste null, jamais 0 ;
     - « 0-0 » est inconnu, mais « 0-1 % » est une vraie plage ;
     - aucun texte en prose de la page n'est importé (origine, généalogie) : seulement des valeurs, des noms et des listes.
3. **Régénérer** `src/data/hopBeerMaverickBootstrap.json` depuis le cache, puis `src/data/hopV4/proto-data.json` par
   `prototypes/houblons-v4/scripts/build-data.mjs`. Ce script doit tourner hors ligne, sur les fichiers du dépôt et le fixture
   déjà présent. S'il lit Firestore, arrête-toi et écris-le.
   - Étends `CatalogueHop` (`src/domain/hopIndex/v4/data.ts`) avec des champs optionnels : `cohumulone`, `oils.farnesene`,
     `oils.others`, `purpose`, et un bloc `bm` (styles, substituts, accords, propriétaire, profil d'arôme).
   - Les lecteurs actuels ne changent pas. Le moteur rend les mêmes résultats : prouve-le sur les tests existants.
4. **Montrer** ces valeurs là où elles sont déjà attendues, sans nouveau dessin :
   - la feuille Sources de la fiche (`src/ui/hopIndex/fiche/`, « toutes les infos exhaustives »), chaque valeur avec sa source ;
   - les lignes de composition de la feuille Valeurs de Comparer (`src/ui/hopIndex/comparer/valeurs.ts`), si elles affichent
     aujourd'hui « ? » pour le farnésène ou les autres huiles.

   Comparer est son choix cmc2k : remplis les lignes existantes, n'en ajoute pas. Un ajout visuel nécessaire va en DÉCISION À
   PRENDRE.
5. **Couverture après.** Relance `voies/d1-couverture/couverture.mjs`, et écris `couverture-apres.md` dans cette voie, avec
   l'avant et l'après par champ.
   - Un test de couverture, `tests/unit/hopIndexV4/couvertureCatalogue.test.ts`, d'abord rouge sur HEAD : cohumulone ≥ 90 %,
     farnésène ≥ 75 %, usage ≥ 90 % des 318 variétés. Ajuste les seuils à la couverture réelle du cache, et dis pourquoi.
   - Des tests de cohérence : min ≤ max ; un pourcentage ≤ 100 ; les substituts reliés existent ; aucun alias en double.
6. **Poids et fluidité.** Donne la taille de `proto-data.json` avant et après, et lance `node scripts/check-hop-budget.mjs` et
   `npm run check:hop-perf`. Si un budget casse, propose un compromis mesuré en DÉCISION À PRENDRE, par exemple les compléments
   chargés à la demande.

## Ce qui reste hors de la voie
- Le linalol et le géraniol par houblon : Beer Maverick les range dans « All Others ». Ils viendront de fiches fournisseurs, dont la
  collecte attend son accord. Chiffre le reste à combler.
- Toute nouvelle collecte réseau, toute écriture dans Firestore.

## Critères
- `couvertureCatalogue.test.ts` : rouge sur HEAD, vert après.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert.
- `npm run build` vert.
- `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`.
- La maquette reconstruite (`node work/refonte-frontend/v4/tournoi/outils/construire.mjs`, si elle lit `proto-data.json`) tient :
  `controle-etats.mjs` → `ETATS OK`, `controle-radar-base.mjs` → `RADAR-BASE OK`, `controle-fonctions-rail.mjs` → `FONCTIONS-RAIL OK`.
- Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`), en 390 × 844, à ouvrir :
  - la feuille Sources de Nelson Sauvin, en haut et en bas, avec la cohumulone 20–25 % et le farnésène 0–1 % ;
  - la feuille Valeurs de Comparer.

## Possède
- `scripts/scrape-hop-community.mjs`, `scripts/hop-source-cache.mjs`.
- `src/data/hopBeerMaverickBootstrap.json`, `src/data/hopV4/proto-data.json`.
- `prototypes/houblons-v4/scripts/build-data.mjs`.
- `src/domain/hopIndex/v4/data.ts`, `src/ui/hopIndex/fiche/`, `src/ui/hopIndex/comparer/valeurs.ts` (les lignes seulement).
- `tests/unit/hopIndexV4/`, `work/missions/2026-10-25-integration-houblons/voies/d2-import-bm/`.

Une autre voie (p1-banc-prod) possède `scripts/bench-hop-prod.mjs` et `scripts/vite-banc.config.mjs` : n'y touche pas. Pas de
`git mv`. Le cache du dépôt principal se lit seulement, n'y écris rien. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec les preuves, la couverture avant et après, les tailles et les captures ouvertes. Si tu
approches ta limite de tours, écris RESULTAT.md avec ce qui reste.
