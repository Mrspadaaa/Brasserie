OK — lecteur Beer Analytics, test et collecte polie prêts ; collecte en cours en tâche de fond (~20 houblons sur 435 au rendu)

**À savoir d'abord.** Le site compte 435 pages de houblons, chacune avec jusqu'à 12 fichiers de graphiques : environ 5 700 requêtes, soit près de 3 h 20 à 1 requête toutes les 2,1 s. Le script `--telecharger` tourne donc encore en arrière-plan (lancé à 11 h 15, les quatre houblons demandés d'abord, puis le catalogue, puis les autres). Il se relance sans risque : ce qui est dans le cache n'est jamais retéléchargé. Quand il aura fini, il faut relancer `node scripts/collecte-hop/beeranalytics.mjs --offline --rapport` pour réécrire les JSON et `couverture.md` sur le cache complet. Les fichiers livrés dans ce dépôt portent aujourd'hui 22 fiches (Galaxy, Citra, Nelson Sauvin et Motueka compris).

## Fichiers écrits
- `scripts/collecte-hop/beeranalytics.mjs` : lecteur, téléchargement poli (`--telecharger`), relecture du cache (`--offline`), rapport (`--rapport`).
- `src/data/hopSources/beeranalytics.json` (index : une ligne par houblon), `beeranalytics-<lettre>.json` (fiches), `beeranalytics-series-<lettre>.json` (séries mensuelles : popularité, levures). Découpé par lettre : l'ensemble dépassera 2 Mo (un houblon pèse ~24 Ko). Chaque fichier reste sous 2 Mo.
- `tests/unit/hopIndexV4/collecteBeerAnalytics.test.ts` (11 tests, HTML et JSON synthétiques).
- `voies/c3h-beer-analytics/couverture.md` (généré), `journal-collecte.json` (requêtes, statuts, absents, arrêts), ce fichier.
- Le cache `public-sources/` : ajout seulement (robots.txt, sitemap.xml, pages, JSON de graphiques).

## Ce que le site publie et ce qui est gardé
- robots.txt : `User-agent: *` → `Disallow: /wa/` seul ; GPTBot exclu (non concerné). Licence du pied de page : CC BY-SA 4.0. Aucun 401/403/429, aucune page de défi (130 puis ~100 requêtes, toutes 200 au moment d'écrire).
- Pas de chimie : linalol, géraniol, farnésène, β-pinène, sélinène ne sont pas publiés (0 fiche). Source d'**usage** seulement.
- Par houblon : nombre de recettes ; usage (Purpose), classe α (Low/Moderate/High), origine ; α et β déclarés par les recettes (min < milieu < max) ; part du poids de houblon (Amount) ; substituts, accords (ordre de la page), arômes avec leur famille de couleur ; histogrammes α/β ; recettes par moment d'ajout (Mash, First Wort, Boil, Aroma, Dry Hop) ; dosage par moment et par style (quartiles, moyenne, bornes, en fraction du poids de houblon) ; part du houblon dans les recettes de chaque style (avec l'adresse du style quand elle est sans ambiguïté) ; houblons associés (12 au plus, dosage dans les recettes qui contiennent les deux) ; levures ; popularité mensuelle depuis 2012 (jusqu'à 2026-10).
- La prose de la page (« Profile ») reste dans le cache.

## Critères
- `node scripts/collecte-hop/beeranalytics.mjs --offline` deux fois de suite : `sha256 2073de1d1525c0fc3d589d1ab62737810993a860084a338fb3abb54bfa6f87de` des deux fois (cache figé entre les deux, 22 fiches). Le sha change quand le cache grandit : c'est la somme des empreintes de tous les fichiers de sortie.
- `npx vitest run tests/unit/hopIndexV4/collecteBeerAnalytics.test.ts` : 11/11. `npx vitest run tests/unit/hopIndexV4` : 461 verts, **1 rouge qui n'est pas de moi** : `complements.test.ts` (« déterminisme du script de fusion ») ; la fusion lit une liste fixe de sources, pas mes fichiers, et `git status` montre crosbyhops, hpa, indiehops et yakimavalleyhops modifiés par une autre voie (c3g) : le rejouer quand c3g aura fini.
- `npm run build` : vert (« built in 21.83s »).
- `git diff --stat -- src/domain src/ui src/data/hopV4` : non vide, 13 fichiers modifiés **avant** ma voie (trace du `git status` de départ : src/ui/hopIndex, src/domain/hopIndex/v4, proto-data.json). Je n'ai touché à aucun d'eux ; mes écritures sont toutes sous scripts/, src/data/hopSources/, tests/ et work/missions/.

## Essais utilisés
Aucun critère n'a demandé plus d'un essai. Deux défauts corrigés en route : les marqueurs `_vides`/`_manquants` mêlés aux statistiques (sortis dans `graphiquesVides` et `graphiquesNonLus`) ; l'ordre de téléchargement (les quatre houblons demandés d'abord, ce qui a obligé à arrêter puis relancer le script : le journal a perdu environ 100 requêtes déjà faites, il sous-compte donc d'autant).

## Doutes et limites
- Collecte incomplète au rendu (voir en tête). Chaque fiche porte `graphiquesNonLus` si un graphique manque encore au cache, et `graphiquesVides` si le site publie « no_data » (ex. `trending-yeasts`, presque toujours vide).
- « Amount » : la page écrit « min < milieu < max » sans dire médiane ou moyenne ; les six valeurs du graphique ne retombent pas sur le milieu de la carte. Gardé tel quel, rien recalculé.
- Les dosages sont des **fractions du poids total de houblon** de la recette, pas des grammes ni des g/L. À ne pas confondre avec une dose.
- Le moment « Aroma » du site ne distingue pas whirlpool et flame-out ; aucune durée ni température.
- Biais de communauté : un houblon rare a peu de recettes (Adeena : 49), ses parts sont fragiles. À pondérer par `recettes` au tri.
- Code de style BJCP non publié (nom seulement ; `styleSlug` quand le sitemap le donne sans ambiguïté, sinon null).
- Pages non lues : `/hops/flavors/*`, `/styles/*`, tendances, `recipes/random.inc` (échantillon aléatoire de recettes). Possible pour une suite.
- Le script suppose que le site garde ses structures actuelles (`detail-info`, `badge-list`, `data-chart`).

DÉCISION À PRENDRE : laisser tourner la collecte jusqu'au bout (~3 h) puis régénérer, ou s'arrêter au catalogue (256 houblons, ~2 h) ? Recommandation : jusqu'au bout, c'est la même cadence et le script reprend où il en est ; le pilote relance `--telecharger` s'il a été coupé, puis `--offline --rapport`.

CONNAISSANCE : Beer Analytics publie l'usage, pas la chimie ; ses chiffres sont des parts de poids de houblon par recette, par moment d'ajout et par style, avec des houblons associés et des levures ; licence CC BY-SA 4.0 (à citer).

LEÇON PROPOSÉE : aucune
