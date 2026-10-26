OK — barthhaas 97, johnihaas 81, charlesfaram 157, britishhops 34 fiches ; scripts --offline stables, tests, couverture.md ; IHPS (PDF gov.si) reste

## État par source
| Source | État | Détail |
|---|---|---|
| BarthHaas | faite | 97 fiches (palisade et simcoer : 404). Linalol 76, géraniol 59, farnésène 78, thiols 22, deux roses aromatiques de 12 axes, descripteurs, lignée, formes. |
| John I. Haas | faite | 71 PDF + 10 pages. Linalol 36, géraniol 3, farnésène 58, sélinène 6. Crawl-delay 10 s respecté. Mosaic : la page redirige vers la liste. |
| Charles Faram (Hop Oracle) | faite | 157 fiches : α, β, cohumulone, huile, intensité d'arôme, myrcène, humulène, farnésène (134), icônes de descripteurs. Ni linalol, ni géraniol, ni β-pinène, ni sélinène : non publiés. |
| British Hop Association | faite (optionnelle) | 34 fiches : α, β, cohumulone, huile (en %), myrcène, humulène, farnésène (souvent « trace »), intensité sur 10. |
| HVG / Hallertau | sondée, rien à collecter | robots.txt 404 ; accueil de 4 Ko sans fiche. |
| Chmelařský institut / Žatec | sondée, rien à collecter | robots.txt 200 ; services et analyses, aucun tableau par variété. |
| IHPS Žalec | à faire | La « Opisna sortna lista za hmelj 2021 » est un PDF sur gov.si (hôte non sondé, robots.txt non lu). Non téléchargé. |

Aucun hôte n'a répondu 401, 403 ou 429. β-pinène : publié nulle part dans ces quatre sources.

## Critères (sorties décisives)
- `node scripts/collecte-hop/<source>.mjs --offline` deux fois, sha256 égal entre les deux et au sha256sum du JSON :
  barthhaas 1dcec8d1…, charlesfaram 044b14c8…, johnihaas 6158bad9…, britishhops d80ca2e5….
- `npx vitest run tests/unit/hopIndexV4` : 43 fichiers, 335 tests verts (dont collecteBarthHaas 10, collecteCharlesFaram 6, collecteJohnIHaas 8, collecteBritishHops 4).
- `npm run build` : vert (« built in 20.88s »).
- `git diff --stat -- src/domain src/ui src/data/hopV4` : vide ; `scripts/hop-source-cache.mjs` inchangé.

## Fichiers écrits
scripts/collecte-hop/{europe-commun,europe-champs,barthhaas,charlesfaram,johnihaas,britishhops}.mjs ; src/data/hopSources/{barthhaas,charlesfaram,johnihaas,britishhops}.json ; tests/unit/hopIndexV4/collecte{BarthHaas,CharlesFaram,JohnIHaas,BritishHops}.test.ts ; voies/c3b-europe/{couverture.md,doutes.md,rapport.mjs,RESULTAT.md} ; cache en ajout (pages, 71 PDF, reçus d'erreur `.erreur.json`).

## Essais utilisés
PDF Haas : 4 passes de correction de lecture (libellé/valeur séparés, Myrcene détaché, valeurs avant libellés, unités dans la ligne). Autres sources : une à deux passes.

## Doutes et limites
Détail dans `couverture.md` (section Doutes) : bases d'huile parfois déduites (`baseLue: false`) ; fiches HPA appariées par l'ordre du flux PDF (champ `appariement`, cohérent mais non vérifié sur l'image) ; erreurs de la source gardées (BarthHaas TerraFlux « -1 - 7% », Charles Faram Summit huile « 10.5-30.0 ») ; fournisseurs en désaccord (huile de Citra) ; BHA donne l'huile en % ; conditions de BarthHaas, Charles Faram et BHA non consultées ; chevauchement bref de deux requêtes sur charlesfaram.com en début de voie, sans 429. `hop-source-cache.mjs` lit en texte : les PDF et reçus d'erreur passent par `europe-commun.mjs` (à fusionner dans le fichier partagé si voulu).

DÉCISION À PRENDRE : les conditions du site John I. Haas interdisent reproduction et affichage public sans accord écrit. Options : (a) garder la collecte privée, sans publication ; (b) demander l'accord à Haas. Recommandation : (a) pour le tri, (b) avant que des chiffres de Haas ne s'affichent dans l'app.

CONNAISSANCE : BarthHaas publie sur chaque fiche deux roses aromatiques de 12 axes avec valeurs numériques (profil typique et profil 2023) ; Charles Faram et la BHA publient une intensité d'arôme (sur 10 pour la BHA) ; les fiches HPA de Haas donnent le sélinène ; aucune des quatre sources ne publie le β-pinène.
LEÇON PROPOSÉE : aucune
