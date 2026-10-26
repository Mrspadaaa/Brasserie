OK — 102 fiches Hopsteiner collectées (cache + JSON rejouable hors ligne), 89 rattachées, 0 blocage

## Fichiers écrits
- `scripts/collecte-hop/hopsteiner.mjs` : lecteur et générateur, `--offline`, aucun réseau, exporte `lireFiche`, `lireValeur`, `rattacher`.
- `scripts/collecte-hop/hopsteiner-collecte.mjs` : téléchargement poli (robots.txt, 1 requête/s, arrêt sur 401/403/429), cache d'abord.
- `src/data/hopSources/hopsteiner.json` : 102 fiches, 587 Ko (< 2 Mo, pas découpé). Importé par aucun code.
- `tests/unit/hopIndexV4/collecteHopsteiner.test.ts` : 9 tests sur un HTML synthétique.
- `work/missions/2026-10-25-integration-houblons/voies/c3a-hopsteiner/couverture.md` et ce fichier.
- Cache (ajout seulement, `…/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources/`) : 5 pages de liste, 102 fiches,
  4 pages annexes (mentions légales .de, 3 pages publiques hopsteiner.us), chacune avec son reçu.

## Critères
- `node scripts/collecte-hop/hopsteiner.mjs --offline` deux fois : sha256 `376c594ce68e9a911b8fd07cbd79bdd1b73e7c2aaca904b33aaaff0f65d139d3` les deux fois ; `sha256sum` du fichier identique.
- `npx vitest run tests/unit/hopIndexV4` : 25 fichiers, 243 tests verts (dont les 9 du lecteur).
- `npm run build` : « built in 20.79s », code 0.
- `git diff --stat -- src/domain src/ui src/data/hopV4` : **non vide (8 fichiers)**, mais ce sont des modifications déjà présentes dans l'arbre au départ
  (`git status` initial : `src/ui/*.css`, `hopIndex/comparer/index.tsx`, `PageShell.tsx`…), d'autres voies. Aucun fichier de ces dossiers n'est écrit par
  cette voie (`git status` sur mes chemins : seuls `scripts/collecte-hop/`, `src/data/hopSources/`, mon test et mon dossier). Le critère littéral sort donc
  non vide sans que ce soit mon fait ; à rejouer sur un arbre propre ou sur le diff de mes chemins.

## Ce qui a été trouvé
- Hopsteiner Europe (`www.hopsteiner.de`) publie les 102 variétés en HTML, sans blocage, robots.txt permissif (`Disallow` /typo3 seulement).
- Par fiche : α, β, cohumulone, huile totale (100 %) ; farnésène (81) ; **linalol (77)** ; polyphénols (37), xanthohumol (78) ; classe « Thiol impact » (70) ;
  8 notes d'arôme 0-5 ; descripteurs ; rendement, maturité, pays, maladies ; variétés alternatives par usage « Brewhouse » (42) / « Dry Hopping » (29) ;
  date « Last updated ».
- **Jamais publiés par Hopsteiner : géraniol, β-pinène, sélinène, myrcène, humulène, caryophyllène** (0 fiche). Le linalol du catalogue (`hsLinalool`, 64) passe à 77
  possibles ; α et huile des 79 fiches déjà reliées sont identiques au catalogue.
- Citra, Mosaic, Simcoe, Amarillo, Galaxy ne sont pas chez Hopsteiner Europe.
- Rattachement : 79 par lien existant, 10 par code (à vérifier : `heb`, `ssg`, `sul`), 7 ambiguës laissées `null` avec candidats, 6 absentes du catalogue (Alora, Erebus, HS09326, Nobella, Styrian Gold, Titan).

## Essais, doutes, limites
- Essais : aucun critère n'a dépassé un essai ; une correction de forme en cours de route (valeurs « < 0.1 » et « ca. 5 » d'abord lues comme texte, puis qualificatif ; graphique
  d'arôme à 8 zéros de Phoenix et Santiam lu comme « non évalué », valeur null, brut gardé).
- `hopsteiner.us/variety-data-sheets/` charge ses données par un script qui a rendu 0 octet ; non contourné. Les PDF par variété (`pim.hopsteiner.de/api/v1/en/varieties/<code>.pdf`)
  sont la copie exacte de la fiche HTML (vérifié sur Nelson Sauvin) : non téléchargés en masse.
- **Non fait** : la table « Hopsteiner laboratory values 2020-2023 » (α moyen par variété et par récolte) du PDF `Guidelines_2023.pdf`, et des guides plus anciens. La mise en
  page à colonnes imbriquées n'est pas extractible proprement avec `pdftotext` ; reste à lire à la main ou avec un outil de tableaux. Ces PDF ne sont pas dans le cache
  (le cache n'enregistre que du texte).
- Le module `scripts/hop-source-cache.mjs` n'a pas été changé. Besoin éventuel : un mode binaire (PDF) pour le cache ; non demandé ici.
- Le JSON garde une phrase courte de lignée (« Genetic origin ») par variété ; pas d'autre prose.

DÉCISION À PRENDRE : droits de réutilisation des fiches Hopsteiner. Les mentions légales (`/en/imprint`, § 3) limitent copies et téléchargements à un usage privé non commercial et exigent
un accord écrit pour le stockage en base. Options : (a) garder le JSON hors fusion et hors publication tant qu'il n'y a pas d'accord ; (b) demander l'accord écrit à Hopsteiner (info@hopsteiner.de) ;
(c) fusionner seulement des valeurs chiffrées avec lien vers la fiche, comme le fait déjà le catalogue pour 79 variétés. Recommandation : (c) pour l'usage interne actuel, (b) avant toute mise en
ligne publique. À router vers le brasseur (accord externe).

CONNAISSANCE : Hopsteiner Europe publie 102 fiches HTML sans blocage ; il ne publie jamais géraniol, β-pinène, sélinène, myrcène, humulène ni caryophyllène, seulement farnésène (81) et linalol (77) ; ses mentions légales limitent l'usage à du privé non commercial (note à créer, sources/).

LEÇON PROPOSÉE : aucune
