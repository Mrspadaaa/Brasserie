OK — 318 houblons importés du cache Beer Maverick (hors ligne) : cohumulone 90 %, farnésène 78 %, usage 100 %, Sources complétée ; B5 tenu

## Fichiers écrits (tous dans « Possède »)
- `scripts/hop-source-cache.mjs` : `--offline` (ou `HOP_SOURCE_OFFLINE=1`), `HOP_SOURCE_CACHE`, option `cache`. Hors ligne : une page absente ou au reçu sha256 faux lève une erreur ; jamais de `fetch` ; le dossier de cache n'est ni créé ni écrit.
- `scripts/scrape-hop-community.mjs` : `main()` exporté et gardé (importable sans effet), extracteur étendu `extraireFicheBM`, `lirePourcent`. Hors ligne, manifeste et licences vont dans `os.tmpdir()/affinee-hop-scrape` (le cache du dépôt principal n'a pas bougé : mtime du manifeste inchangé, 2026-09-08).
- `src/data/hopBeerMaverickBootstrap.json` : `hopVarieties` identique à HEAD (comparaison JSON) ; nouvelle clé `hopBeerMaverickFiches` (318 dossiers : source, `modifiedAt`, `retrievedAt`, `sha256`, valeurs brutes `raw`).
- `prototypes/houblons-v4/scripts/build-data.mjs` (lit le dépôt et le fixture ; aucun Firestore ; deux passes donnent le même fichier) → `src/data/hopV4/proto-data.json`.
- `src/domain/hopIndex/v4/data.ts` : `cohumulone`, `oils.farnesene`, `oils.others`, `purpose`, `bm` (champs optionnels ; `BM_AXES`, `BM_CLASSES_HSI`, `bmLienId`).
- `src/ui/hopIndex/fiche/sources.ts`, `SourcesFiche.tsx` ; `comparer/valeurs.ts` : NON modifié (voir DÉCISION).
- Tests : `cacheHorsLigne` (7), `couvertureCatalogue` (4), `coherenceCatalogue` (15), `moteurInchange` (3), `ficheSourcesAutres` (mis à jour, 14).
- Dans la voie : `couverture-apres.mjs`, `couverture-apres.md`, `banc-d2.mjs`, `captures/` (8 images).

## Ce qui est extrait (par page, chaque valeur avec sa page, sa date de modification publiée, sa date de relevé et le reçu sha256)
cohumulone (% des α), farnésène et « All Others » (% de l'huile), rapport α/β (texte), usage (Aroma/Bittering/Dual), propriétaire, indice de stockage HSI, styles, substituts (reliés à l'id quand le nom ou le lien se résout, sinon gardés avec leur nom ; « aucun » = liste vide), accords avec leur nombre de bières, profil d'arôme 9 axes. Aucune prose importée. « Unknown » et « 0-0 » = null ; « 0-1 % » reste une plage. Radar : liste vide (136 pages) ou tout à zéro = null. Valeurs illisibles (« 0--1% » Apolon, « 0--16% » Lemondrop, radar « 01 » Styrian Kolibri) = null et dites dans le manifeste. Le substitut « Zeus » dans la page de Zeus (lui-même) est écarté.

## Critères (sorties décisives)
1. `couvertureCatalogue.test.ts` : ROUGE sur HEAD — 3 échecs « expected 0 to be ≥ 90 / 75 / 90 », prouvé avec la copie de HEAD (`git show HEAD:… > tmp/proto-head.json`, branchée par un alias vitest dans une config temporaire ; l'arbre n'est pas touché). VERT après : cohumulone 287/318 = 90,3 %, farnésène 249/318 = 78,3 %, usage 318/318 = 100 %. Seuils laissés tels (≥ 90 / 75 / 90) : le cache les permet ; les manques viennent de la source (31 « Unknown », 11 farnésènes « Unknown », 58 pages sans ventilation de l'huile).
2. `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` (+ hopIngestionQualification, hopCatalogueQualification, hopCatalogueLoader) : 26 fichiers, 258 tests verts.
3. `npm run build` : vert (tsc + vite + check-private-research).
4. `node scripts/audit_inputs.mjs` : `INPUT PROTECTION AUDIT PASSED: 647 protected usages in 335 files`.
5. Le moteur rend les mêmes résultats : `moteurInchange.test.ts` vert sur la copie de HEAD ET sur les nouvelles données, mêmes trois empreintes sha256 (variétés lues par le moteur, profil des 318 houblons, classement des substituts de 12 houblons).
6. Maquette : `construire.mjs` n'existe pas au chemin cité de la voie ; le générateur (`ecran-1/base/generateur/build.mjs`) lit `prototypes/houblons-v4/data/proto-data.json`, que je n'ai pas modifié. Les trois contrôles exigent un dossier construit (sans lui : ETATS = usage affiché, RADAR-BASE ECHEC 9 « page absente », FONCTIONS-RAIL 0/37 « page absente ») : NON REJOUÉS, aucune dépendance aux fichiers changés. Limite assumée.
7. Captures 390 × 844 prises ET ouvertes (`captures/`) : Sources de Nelson Sauvin en haut (`1-sources-haut.png` : lien Beer Maverick en premier avec « modifiée 08.03.2023, relevée 08.09.2026 »), milieu (`2-…` : cohumulone 20–25 % des α, farnésène 0–1 %, autres huiles 6–49 %), profil d'arôme (`2b-…`), bas (`3-…` : styles, substituts, accords) ; Comparer Valeurs (`5`, `6`, `7`). Banc : `BANC D2 OK` (9 vérifications, aucune erreur de page).

## Couverture avant → après (détail : `couverture-apres.md`)
cohumulone 0 → 287 (90,3 %) · farnésène 4 → 249 (78,3 %) · autres huiles 0 → 258 (81,1 %) · usage 64 → 318 (100 %) · substituts 0 → 217 (68,2 % ; 101 pages disent n'en avoir aucun) · styles 0 → 261 (82,1 %) · accords 0 → 42 (13,2 %) · profil d'arôme 0 → 181 (56,9 %) · HSI 71 · propriétaire 132 · rapport α/β 287. Reste à combler hors cache : linalol 251/318, géraniol 315/318 (Beer Maverick les range dans « All Others »).

## Poids et fluidité
- `proto-data.json` : 434 466 → 537 041 octets ; gzip 48 819 → 66 219 (+17,4 ko). Première version (non compacte) : 601 301 octets, gzip 71,6 ko : elle faisait passer B5 à 153,8 ko (DÉPASSÉ) ; forme compacte (dates sans heure, ids sans préfixe, accords en paires, radar en 9 nombres, HSI en 4 nombres) → B5 tenu.
- `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : B5 131,0 ko (HEAD, build de `git archive` hors arbre) → 148,3 ko (budget 150, marge 1,7 ko). B1 920 ko et B2 773 ko : DÉPASSÉS depuis avant (mêmes chiffres sur HEAD), inchangés. Chunk paresseux `hopBeerMaverickBootstrap` (panneaux techniques) : 1,77 Mo, +22 % (clé `hopBeerMaverickFiches`), chargé à la demande.
- `npm run check:hop-perf` : ECHEC (5) sur HEAD (Dryhopper, Comparer ×2, Suggérer ×2 / préchauffage) ; sur l'arbre 5 à 7 selon la passe (4 passes : 6, 5, 7 ; les 2 de plus, « Levure » et « le tout », sont à la limite du budget et varient d'une passe à l'autre, n = 10). Les empreintes du moteur sont identiques : le moteur ne lit aucun champ ajouté. Aucun budget de calcul n'est lié à cette voie.

## Essais utilisés
Aucun critère n'a dépassé 3 essais. Trois accrocs corrigés : (a) barres obliques inverses mangées par mon propre outil de saisie (regex du scraper corrigées avec l'outil d'édition) ; (b) 1ʳᵉ forme de `bm` trop lourde (B5 dépassé) → forme compacte ; (c) tests de cohérence qui ont révélé des faits de la source (voir doutes).

## Erreur de méthode, signalée
Pour calculer les empreintes de `moteurInchange`, j'avais d'abord remplacé `proto-data.json` par HEAD dans l'arbre, puis remis. Vérifié : identique octet pour octet à la copie faite avant (`cmp`), régénération identique. Refait ensuite proprement (alias vitest vers `os.tmpdir()/proto-head.json`).

## Doutes et limites
- Une valeur porte sa source par son dossier (une page = une source) ; dans l'app, chaque ligne de la feuille Sources a le lien de la page et les dates sont dans l'en-tête du lien.
- Source : 12 codes d'alias partagés entre variétés (GR/US ; `usda56013` pour Cascade et Taiheke ; `hal`, `tet`, `hpa016` à vérifier), 6 alias égaux au nom (CTZ, BRU-1…). Laissés tels (le moteur lit les alias) ; test à liste fermée.
- Source : Apolon (somme des minimums 101) et Lemondrop (116) se contredisent ; leur « All Others » est aussi illisible. Gardés tels, test à liste fermée.
- 28 substituts/accords sur 926 non reliés (Tettnang, Northern Brewer… ambigus ou sans lien) : gardés avec leur nom.
- Styles de la page gardés tels qu'écrits (« Pislner », « zips », « Teas » y figurent) ; seul « and » initial retiré.
- Comparer, capture 7 : le texte « dry hop après à froid » se superpose en haut de la ligne d'IBU. Aucun fichier de Comparer n'est modifié par cette voie ; non diagnostiqué.
- `git status` montre des fichiers que je n'ai pas touchés (PageShell.tsx, plusieurs css, `comparer/index.tsx`) : travail d'une autre voie.
- `functions/src/hopIndexSchema.ts` (hors Possède) ne connaît pas ces analytes : d'où la clé sœur `hopBeerMaverickFiches`, hors du schéma validé des fiches.
- `src/domain/hopIndex/v4/fiches.ts` (hors Possède, `hopSheet`) écrit encore `farnesene: null` avec la raison « non importé » : à brancher sur `oils.farnesene`.

## DÉCISION À PRENDRE : Comparer, ligne « Autres » de la composition des huiles
Le fichier qui la dessine est `comparer/Huiles.tsx`, hors de mon « Possède » (`valeurs.ts` n'a ni ligne farnésène ni ligne « autres »). Elle calcule « Autres » = 100 − (myrcène + humulène + caryophyllène), donc y met le farnésène, et affiche « ? » dès qu'un des trois manque. Mesuré : sur 234 houblons comparables, 84 ont un écart > 1 point avec la valeur publiée (Nelson Sauvin : 7–49 calculé, 6–49 publié) ; 24 houblons passeraient de « ? » à une valeur. Options : (1) `plageDe('autres')` lit `oils.others` d'abord, repli sur le calcul (3 lignes, aucune nouvelle ligne, cmc2k respecté) ; (2) ajouter une ligne « Farnésène » (ajout visuel : à lui montrer en mini maquette) ; (3) ne rien changer. Recommandation : (1), maintenant ; (2) seulement s'il la veut.

## DÉCISION À PRENDRE : profil d'arôme Beer Maverick (9 axes, 0 à 5) et le moteur
Extrait en champ cité (`bm.arome`), affiché dans Sources, NON branché au moteur. Couverture : 181/318 = 56,9 % (136 pages sans profil = « no aroma values », 1 illisible). Il ne recoupe pas les 12 familles du moteur (« Grassy », « Berry »… ; pas de melon, pomme/poire, terreux) : le brancher exige une convention de correspondance. Recommandation : ne pas le brancher ; garder l'affichage.

## DÉCISION À PRENDRE : marge du budget B5 (1,7 ko)
Le moindre ajout de données au catalogue repasse B5 au-dessus de 150 ko. Compromis mesuré : sortir le bloc `bm` de `proto-data.json` vers un fichier chargé à la demande à l'ouverture de la feuille Sources (économie estimée : environ 13 ko gzip sur les 17,4 ko ajoutés), au prix d'un chargement asynchrone dans une feuille aujourd'hui synchrone. Recommandation : le faire à la prochaine extension du catalogue, pas maintenant.

CONNAISSANCE : le cache Beer Maverick (318 pages, relevé le 2026-09-08) publie bien plus que les 6 lignes lues avant ; sa ventilation de l'huile manque sur 58 pages ; « Unknown » est écrit pour 31 cohumulones et 11 farnésènes ; le radar est vide (liste vide) sur 136 pages ; « All Others » contient linalol et géraniol non séparés.
LEÇON PROPOSÉE : un outil d'édition ou un shell peut manger les barres obliques inverses d'une regex écrite par commande : écrire le code avec l'outil d'édition, relire les regex dans le fichier, lancer `node --check` avant tout calcul. Et ne jamais remplacer un fichier suivi dans l'arbre pour obtenir une référence : `git show` vers `os.tmpdir()`.
