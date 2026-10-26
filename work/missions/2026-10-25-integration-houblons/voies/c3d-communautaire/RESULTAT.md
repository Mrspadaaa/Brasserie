OK — HopDatabase, hops-json, Hopslist, USDA (2 fiches) et index Brewer's Friend collectés ; GRIN non collectée

## État par source
| Source | Script `--offline` | JSON | Test | État |
|---|---|---|---|---|
| HopDatabase (MIT) | scripts/collecte-hop/hopdatabase.mjs | src/data/hopSources/hopdatabase.json (220 fiches, 0,64 Mo) | tests/unit/hopIndexV4/collecteHopdatabase.test.ts | faite |
| hops-json (MIT) | hopsjson.mjs | hopsjson.json (119 fiches) | collecteHopsjson.test.ts | faite |
| Hopslist | hopslist.mjs | hopslist.json (268 fiches, 1,09 Mo) | collecteHopslist.test.ts | faite (268 pages lues, 0 absente) |
| USDA ARS | usda.mjs | usda.json (2 fiches) | collecteUsda.test.ts | partielle : pas d'index public lisible, 2 accessions (Cascade 21092 et 56013) |
| Brewer's Friend | brewersfriend.mjs | brewersfriend.json (1112 lignes d'index) | collecteBrewersfriend.test.ts | partielle : index seul (alpha moyen de recettes, emploi, nombre de recettes) ; pages de détail non lues |
| GRIN | — | — | — | non collectée (voir doutes) |

Aussi écrits : `scripts/collecte-hop/communautaire-commun.mjs` (robots.txt, 1 requête par seconde par hôte, arrêt sur 401/403/429 ou défi, lecture des valeurs, rattachement sans forcer) et `tests/unit/hopIndexV4/collecteCommunautaire.test.ts`.
Dans le cache (ajout seulement) : 268 fiches Hopslist + plan du site + robots.txt, 3 fichiers de l'ARS, l'index Brewer's Friend, robots.txt de GRIN, et un marqueur `<sha256>.absent.json` pour le 404 de l'ARS (sinon le mode hors ligne ne le connaît pas).
Détail, hôtes et tableau champ par champ : `couverture.md` (même dossier).

## Critères (rejoués depuis la racine)
- Rejeu `node scripts/collecte-hop/<source>.mjs --offline` deux fois, sha256 égal, aussi sur le fichier écrit :
  - hopdatabase 434c4655…670a67d
  - hopsjson 99e12fd6…f07f64
  - hopslist c445e0ba…60a9f7
  - usda 7338a56b…ea591
  - brewersfriend 515f7b2b…95fdb
- `npx vitest run tests/unit/hopIndexV4` : 31 fichiers, 277 tests verts (dont 6 fichiers nouveaux, 34 tests).
- `npm run build` : sorti 0.
- `git diff --stat -- src/domain src/ui src/data/hopV4` : vide. Rien n'est fusionné ; aucun code de l'app n'importe les JSON.

## Essais utilisés
Aucun critère n'a dépassé un essai, sauf le rattachement (3 réglages : alias douteux refusés, pays lus tels quels avec DE = GR, noms sans pays ambigus laissés `null`).

## Doutes et limites
- Unités : HopDatabase et hops-json n'écrivent aucune unité, `unite` et `base` restent `null` ; la base des composés « additional_properties » est inconnue. À trancher au tri.
- Les 0–0 de HopDatabase sont des défauts d'agrégat : `null` avec `zeroParDefaut`, jamais 0. Chez Hopslist, « Trace » et « None » sont `qualitatif`, pas 0.
- Hopslist : quelques valeurs publiées étranges recopiées telles quelles (« 11.20 mL/100g », une huile en %). Rattachements par alias à relire : East Kent Golding, Hallertauer Gold, Whitbread Golding, Feux-Coeur. Refusés : Cicero → Citra, Hüll Melon → Huell Melon (règle des 4 lettres trop stricte pour ü).
- Composés demandés : linalol 70 fiches (HopDatabase) et 3 (Hopslist) ; géraniol 2 ; β-pinène 1 ; sélinène 1 ; farnésène 79 + 200 + 1. Ces bases ne remplacent pas Hopsteiner pour le linalol, le géraniol et le sélinène.
- USDA : plan du site de l'ARS interdit par robots.txt (/umbraco/) donc non lu ; un PDF de lignée n'est pas lisible par le lecteur du cache (texte seul). Une douzaine de requêtes d'exploration de l'ARS (404 pour la plupart) ont été faites hors cache avant le script.
- GRIN : robots.txt (Crawl-delay 10, /search/ interdit, « décourager le scraping ») lu ; les accessions n'existent que derrière une recherche dynamique. Non tentée, par prudence. DÉCISION À PRENDRE : la tenter quand même avec 10 s entre requêtes ? Recommandation : non, ses données sont surtout des passeports d'accessions.
- Brewer's Friend : serveur lent (13 s par page, un délai de 25 s dépassé) ; le détail est surtout de l'usage par style, pas de la chimie.
- Prose gardée dans le cache seulement : Info et Trade de hops-json, OTHER INFORMATION et MAJOR TRAITS de l'ARS, texte des pages Hopslist.
- `scripts/hop-source-cache.mjs` non modifié. Limite : il ne garde pas un 404 ; le marqueur ci-dessus le compense. Changement utile à lui apporter : mémoriser les 404/410 et rendre le statut dans l'erreur.

CONNAISSANCE : Hopslist (268 variétés) donne myrcène, humulène, caryophyllène, farnésène en % de l'huile pour 200 à 230 variétés, avec rendement et conservation à 20 °C : la source communautaire la plus riche en composés d'huile après Hopsteiner. HopDatabase ne porte linalol, farnésène, humulène que pour 98 variétés, sans unité écrite.
LEÇON PROPOSÉE : aucune
