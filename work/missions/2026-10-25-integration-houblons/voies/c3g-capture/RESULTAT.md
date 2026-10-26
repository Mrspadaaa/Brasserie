OK — audit de capture des 20 sources ; 5 lecteurs corrigés (Yakima, Crosby, Indie, HPA, Haas) ; Key Aromas non collectés (hôte tiers)

## Fichiers écrits
- `scripts/collecte-hop/audit-capture.mjs` (nouveau) ; lecteurs modifiés : `yakimavalleyhops.mjs`, `hpa.mjs`, `johnihaas.mjs`, `europe-champs.mjs`, `c3c-commun.mjs` (partagé : crosbyhops et indiehops en profitent).
- `src/data/hopSources/` régénérés : `yakimavalleyhops.json`, `crosbyhops.json`, `indiehops.json`, `hpa.json`, `johnihaas.json`. Les 15 autres sont identiques à HEAD (sha256 égal).
- Tests ajoutés : `collecteYakimavalleyhops`, `collecteCrosbyhops`, `collecteIndiehops`, `collecteHpa`, `collecteJohnIHaas` (`tests/unit/hopIndexV4/`).
- `voies/c3g-capture/` : `rapport.md` (tableaux avant et après, raisons), `avant.md|json`, `apres.md|json`, `fusion-apport.txt`.
- Rien dans `src/domain`, `src/ui`, `src/data/hopV4`. Le cache n'a reçu aucune écriture ; aucune requête réseau.

## Critères
- Audit : tableau avant et après dans `rapport.md`. Aucun champ publié sous 95 % sans raison écrite : 18 lignes restent sous 95 %, chacune avec sa raison (cellules « — » vides, phrases, rapport humulène/caryophyllène, fiches à libellés mêlés TALUS et HBC 472).
- `--offline` deux passes, sha256 égal, vérifié pour les 11 lecteurs relancés : yakimavalleyhops 6580f5d8…, crosbyhops 08177e86…, indiehops bfc9060e…, hpa e01eef1a…, johnihaas 4c083865… (les 6 autres inchangés).
- `npx vitest run tests/unit/hopIndexV4` : 465 verts, 1 rouge : `complements.test.ts` « déterminisme du script de fusion ». Cause : `complements.json` (écrit par d3a) date d'avant la capture corrigée ; la fusion rend maintenant un autre sha256. Le pilote régénère (`node scripts/collecte-hop/fusion.mjs`), je n'y touche pas.
- `npm run build` : vert (exit 0), relancé après la dernière modification.

## Taux avant → après (champs publiés, détail dans `rapport.md`)
- Yakima : huile 53 → 100 %, farnésène 39 → 100 %, linalol 41 → 100 %, sélinène 33 → 100 %, alpha 82 → 99 % ; 133 → 146 fiches (13 pages de houblon sans titre « Hop Profile » étaient perdues).
- Crosby : huile 90 → 100 %, myrcène 84 → 100 %, caryophyllène 68 → 100 %, linalol 63 → 100 %, géraniol 40 → 100 %.
- Indie : huile 84 → 100 %. HPA : huile 91 → 100 %, humulène 82 → 100 %, caryophyllène 59 → 97 %. Haas : huile 90 → 100 %, linalol 79 → 95 %.

## Trouvaille grave, hors consigne : valeurs décalées dans hpa.json
Les fiches PDF de HPA (35 sur 48) avaient leurs valeurs décalées d'une ligne : une cellule « — » vide en mode colonnes (`pdftotext -layout`) faisait prendre à chaque libellé la valeur du suivant. Exemple Mosaic : myrcène = 1-1.5 (c'était l'huile), humulène = 47-53 (c'était le myrcène). Corrigé (lecture `-raw`, test à l'appui). Le `complements.json` actuel contient ces valeurs fausses jusqu'à régénération. L'audit compte des présences et ne l'aurait pas vu : à ce titre, un contrôle de valeur reste à faire sur les PDF (Haas, NZ Hops, BarthHaas).

## Key Aromas et Aroma/Flavor Intensity (YVH) : arrêt, 0 requête
- La page en cache ne contient ni ces données ni l'adresse d'une requête : seulement un conteneur vide `fulfilled-reviews-all` (bloc d'application Klaviyo Reviews) et le script `static.klaviyo.com/onsite/js/VQEefX/klaviyo.js`.
- L'appel qui remplit le module part de ce script d'un hôte tiers (Klaviyo), pas de la page. Reconstituer son appel d'API reviendrait à rétro-concevoir un service tiers : hors de « une adresse publique lisible dans le code de la page ». Je n'ai fait aucune requête.
- Je ne peux pas non plus affirmer que « Key Aromas » vient de ce module : c'est le seul bloc dynamique de la page, rien ne le prouve.
- À faire : les lire dans le Chrome du brasseur (onglet Réseau de la page Galaxy ; ou capture + saisie à la main des votes), puis les garder tels quels (mot, nombre de votes, date).

## Fusion rejouée sans écrire (`fusion-apport.txt`)
Sur 251 variétés rattachées : valeurs 8877 → 9156 (+279) ; suspectes 231 → 204 ; non rattachées 369 → 374 (nouvelles fiches Yakima sans variété).
- Variétés avec enveloppe : β 243 → 244, huile 228 → 230, myrcène 214 → 216, humulène 212 → 213, caryophyllène 184 → 186, farnésène 203 → 205, linalol 122 → 125 ; α, cohumulone, géraniol, β-pinène, sélinène : même nombre, plus de valeurs (α +29, farnésène +57, huile +54, caryophyllène +34, myrcène +28, humulène +27, sélinène +3, linalol +17).
- Galaxy : huile 9 → 10 valeurs, cohumulone 7 → 8, myrcène 7 → 8, humulène 7 → 8, caryophyllène 6 → 7, farnésène 7 → 8, linalol 4 → 5, sélinène 2 → 3 (enveloppes inchangées : la fiche Yakima confirme celles de Beer Maverick).
- Citra : alpha 13 → 14, β 12 → 13, huile 11 → 13, cohumulone 10 → 11, myrcène 8 → 9, humulène 7 → 9, caryophyllène 7 → 8, farnésène 7 → 9, linalol 5 → 6, polyphénols 4 → 5.
- Mosaic : α 11 → 12, β 11 → 12, huile 10 → 12, cohumulone 9 → 10, myrcène 7 → 8, humulène 7 → 8, caryophyllène 6 → 7 ; farnésène 4 → 3 et polyphénols 1 → 0 : le zéro de la fiche HPA décalée n'existe plus (les deux étaient des artefacts).
- Nelson Sauvin : huile 11 → 12, farnésène 8 → 9 ; le reste inchangé (il manquait déjà peu de chose chez Yakima).
- Géraniol : 68 variétés avant et après (pas de gain : les pages qui le publient sont rares).
- Thiols de Crosby (µg/kg, Magnum) capturés dans `crosbyhops.json` mais la fusion ne les ajoute pas : unité différente du champ « thiols » de la table.

## Essais, doutes, limites
- Essais : trois au plus par critère (Yakima : six passes de format, une à une, jusqu'à 100 %).
- Doute 1 : l'audit compte une présence ; un décalage ou un mauvais appariement n'y apparaît pas (cas HPA).
- Doute 2 : 5 pages Yakima publient aussi un « Lot Information and Analysis » (valeurs du lot de l'année : alpha, huile) gardé dans `lots` ; la fusion ne le lit pas.
- Doute 3 : l'audit exclut les 7 fichiers `beeranalytics*` d'une autre voie. brewersfriend, hopdatabase, hopsjson, ihps, usahops : hors audit page à page (raisons dans `rapport.md`).
- `c3c-commun.mjs` modifié alors qu'il est partagé : ses lecteurs ont tous été relancés, six restent identiques.

DÉCISION À PRENDRE : régénérer `complements.json` maintenant (pilote : `node scripts/collecte-hop/fusion.mjs`) ? Recommandation : oui, avant tout affichage, car le fichier actuel porte les valeurs HPA décalées ; le test de déterminisme repasse au vert à ce moment.
CONNAISSANCE : les fiches PDF HPA/Haas (`-layout`) décalent les valeurs quand une cellule est vide : lire en ordre de lecture (`-raw`) ; les pages YVH ont cinq formats d'analyse.
LEÇON PROPOSÉE : un contrôle de capture qui compte les présences ne voit pas une valeur rattachée au mauvais libellé ; ajouter un contrôle d'exactitude (recompte une valeur de référence par fiche) avant de dire une collecte finie.
