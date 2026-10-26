OK — Freestyle Hops : 19 pages variétés collectées (22 requêtes), mais aucun nombre d'analyse publié ; hors ligne identique, build vert

## Fichiers écrits
- `scripts/collecte-hop/freestylehops.mjs` (lecteur, `--offline`) et `scripts/collecte-hop/freestylehops-reseau.mjs` (lecture peu intrusive : 2,1 s entre deux requêtes, une à la fois, plafond 80 compté dans un journal, arrêt sur 401/403/429/défi, aucun contournement).
- `src/data/hopSources/freestylehops.json` : 19 fiches, 15,8 ko. La table des sources porte `diffusion` et `autorisation` (citation, 26.10, « déclarée par l'utilisateur »).
- `tests/unit/hopIndexV4/collecteFreestylehops.test.ts` : 8 tests (HTML synthétique, robots, plan, hors ligne sans `fetch`).
- `work/missions/2026-10-25-integration-houblons/voies/c3f-freestyle/` : `couverture.md`, `journal-requetes.json`.
- Cache en ajout : robots.txt, sitemap.xml, son sous-plan, 19 pages (22 fichiers + reçus).

## Critères
- `node scripts/collecte-hop/freestylehops.mjs --offline` deux fois : sha256 `500e1b276e410fdfa937373d2616bbbbdb5e8f1f9eaad640e4c722a537309d15` les deux fois.
- `npx vitest run tests/unit/hopIndexV4` : 49 fichiers, 394 tests verts.
- `npm run build` : vert.
- `git diff --stat -- src/domain src/ui src/data/hopV4` : vide.

## Compte des requêtes
22 sur 80 : robots.txt (1), sitemap (2), 19 pages `/hop-varieties/<x>/`. Toutes en 200. Aucun 401, 403, 429, ni défi. Aucun PDF lié, donc aucune lecture d'image. Détail horodaté : `journal-requetes.json`.

## Constat décisif
Les pages variétés ne publient aucun nombre d'analyse : ni α, ni huile, ni linalol, géraniol, farnésène, β-pinène, sélinène. On y trouve des textes d'arôme (gardés dans le cache), de quoi extraire des mots courts, des accords nommés, des stades de récolte, la composition des mélanges, quelques valeurs de produit (sucres de Kohia Nelson, dosage whirlpool de Mega Motueka et Super Sauvin, éthanol de SubZero). Nelson Sauvin, Motueka, Riwaka et Nectaron : présents, sans nombre. Détail dans `couverture.md`.

## Essais utilisés
Un par critère (aucun échec). Un réglage du vocabulaire (« noble » retiré : style, pas arôme).

## Doutes et limites
- Descripteurs repérés par mots dans le texte (vocabulaire fermé, mots niés écartés) : à trier avant toute fusion.
- Autorisation déclarée par l'utilisateur, non vérifiée par l'agent. Le robots.txt interdit ClaudeBot, Claude-Web, anthropic-ai ; le script s'identifie avec l'agent existant, couvert par `User-agent: *`.
- Nouveau fichier `freestylehops-reseau.mjs` : j'ai écrit mon propre lecteur réseau (2 s, compteur, journal), car celui de c3c-commun attend 1,1 s ; `scripts/hop-source-cache.mjs` n'est pas modifié. Il écrit le cache dans le même format (reçu sha256).
- `fusion.mjs` peut lire tout `src/data/hopSources/` : le pilote la régénère ; je n'y ai pas touché.

DÉCISION À PRENDRE : lire `/documents-2/` (fiches techniques ?) et une page produit `/hops/<variété>-t90-hop-pellets-N/` par variété (une dizaine de requêtes) ? Options : (a) non, on s'en tient aux pages variétés (état actuel) ; (b) oui, `/documents-2/` seule d'abord (1 requête) pour voir si des fiches PDF d'analyse y sont ; (c) oui, une page produit par variété phare (Nelson Sauvin, Motueka, Riwaka, Nectaron, Rakau, Waimea, Southern Cross : 7 requêtes). Recommandation : (b), puis (c) si une analyse y figure ; ces chemins dépassent le périmètre écrit par le pilote, qui l'a limité aux pages variétés, et l'utilisateur a demandé de ne pas être intrusif.

CONNAISSANCE : les pages variétés de freestylehops.com ne contiennent que du texte d'arôme (aucune analyse) ; la page `/hop-varieties/maui-nelson-2/` est Limequat ; le robots.txt autorise `*` mais interdit nommément ClaudeBot, Claude-Web, anthropic-ai (`ai-train=no`).
LEÇON PROPOSÉE : aucune
