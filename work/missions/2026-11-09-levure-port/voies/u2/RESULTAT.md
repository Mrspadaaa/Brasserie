OK — verdict du port corrigé : C1 à C5, M1, M2, M5, S1 à S6 faits ; M6 (données) et la date « épuisée » restent à d1 ; tsc propre, 48 tests verts.

## Correctifs du verdict (critique/VERDICT-port.md)
Tests d'abord : `tests/integration/etapeLevure/vues-corrections.test.tsx` écrit avant le code ; sortie avant correction dans `voies/u2/tests-avant.txt` (8 échecs sur 10 : C1 ×2, M1, S1, S3, S4, S6, C5). Après : `voies/u2/tests.txt`, **`Tests  48 passed (48)`** (5 fichiers), `tsc` : 0 erreur. M2 se mesure dans Chrome (largeur de défilement des cellules) : je ne l'ai pas rejoué sur la version fautive, seulement après correction.
- **C1 (bloquant)** : l'alcool visé vient de la recette : `abvViseDe(recipe, refs)` (EtapeLevure.tsx, u1, ajoutée) = la cible `abvTarget` si elle est saisie, sinon le **milieu de la plage d'alcool de Ma levure** (`evaluateYeastRecipeDesign` : OG de la recette et atténuation de la levure, la même lecture que « ≈ 6,9–7,2 % vol »), arrondi à 0,1 : 7,1 % sur la recette du banc. Dans l'app (`c2` : trait rouge, ○ de l'index, bascule présents ; résumé « repères 19 °C · 7,1 % »). Sans levure ni cible : rien, jamais 0.
- **M1 (bloquant)** : « Ajouter à Comparer » met `tapee` en tête, puis les proches.
- **M2 (bloquant)** : cellule Dose qui passe à la ligne (sachets, puis le nombre), `overflow: hidden` sur toute cellule ; `capturer-app.mjs` mesure `debordements` : `[]` à 390 avec trois colonnes (US-05, Verdant, Pomona), clair et cave.
- **S1 (bloquant)** : au repos la liste s'ouvre sur « US-05 · ta levure · la référence », ⊕ grisé ; avec un axe où la référence est muette, elle reste en tête avec ses « ⌕ thiols ? ».
- **C2** : forme (sèche/liquide) de la fiche sous le nom (référence, sinon la fiche de travail de d1). Non fait : date de la fiche (« NL · 27.09 · stock ? ») et descripteurs « très propre · esters légers » (données de d1 : la 1056 dit « neutre »).
- **C3** : titre court « Vendue CH · FR · DE », compte collé, « à vérifier » en badge. **C4** : lignes « STA1 ? » pâles ; « épuisée » (d1 `enStockIci`) sur les vendues ici dont le relevé dit épuisé — sans la date 27.09, que l'API ne donne pas. **C5** : « — » ou « estimé » sur chaque ligne de l'index.
- **M5** : titre de colonne = le code (« 1056 »), le fabricant dessous sans « Brewing ». **M4** : branché : « ⌕ » d'une cellule ou d'une pastille affiche `CelluleRecherche` (« recherche… n/20 », valeur à confirmer) via `useEtatRecherche` de u1 ; sans fournisseur, le comportement précédent.
- **S2** : le levier °C est dessiné (axe lu de la preuve « de 15 à 30 °C », ta conduite 19, flèche « plus chaud »). Les bornes sont **parsées de la phrase de preuve** : à remplacer par un champ structuré de d1 (`levier: { borneMin, borneMax, sens }`) ; la bande « tropical maximal 22–30 °C » n'est pas dessinée (pas de donnée). **S3** : « 10–15 °C · 19 hors plage » en rouge sur chaque ligne dont la plage ne couvre pas la conduite ; pas « perçu faible · soufre » (donnée absente). **S4** : référence muette : les vendues ici documentées sur les axes choisis restent, triées par niveau. **S5** : la boîte de levier seulement avec une preuve chiffrée. **S6** : « 30 L · 19 °C » dans l'en-tête.
- **M6** : données (phénols US-05 POF−, floculation 1056) : d1.
- Captures dans l'app : 36 (`captures-app/`, `capturer-app.mjs`), montages maquette | app à 390 et 1280, clair et cave : `voies/u2/montages/<cadre>.png` (`montage.mjs`), tous 9 générés ; ouverts : m1, s1, c2. Les 2 dernières lignes de CSS (⊕ grisé) sont postérieures aux captures. Console : quelques `net::ERR_FAILED` (requêtes bloquées hors localhost), aucune erreur de page.

## Suite du pilote (mise à jour)
1. **`documente` et `trouver`** : la recomposition est supprimée ; `Chercher.tsx` et `Comparer.tsx` appellent `api.documente` et `api.trouver` de `index.ts` (d1 les a livrés). `ApiVue` ne garde que `chercher` étendu (`tapee`, `stockIds`).
2. **Ligne Dose** (Comparer) : calculée par `doseDeLaLevure` de `dose.ts`, jamais recopiée. Elle a besoin de la recette et du produit : `Comparer` prend deux props optionnelles `recette` et `supply` (type `PropsComparer`). Sans elles, la ligne n'est pas dessinée. Cellule : sachets (pleins jusqu'au minimum, hachurés jusqu'au maximum) + « 2–3 sachets » ; sinon la plage en g ; sinon « à renseigner » (jamais 0). **Modifié dans `EtapeLevure.tsx` (voie u1), trois lignes** : `volumeL: recipe.volumeL` et `abvVise: recipe.abvTarget ?? undefined` dans les repères (sans `abvVise`, le résumé n'affichait pas « 7 % » et la tolérance n'avait pas de repère), et `<Comparer {...props} recette={recipe} supply={supply} />`. Dans l'app : US-05 « 2–3 sachets », Verdant « 2–3 sachets », une levure sans produit documenté « à renseigner ».
3. **Phénols de US-05** : pas encore corrigés côté d1 (`valeurAxe(US-05, 'phenols')` rend `null`, vérifié par `voies/u2/sonde.mts` : `npx vite-node work/missions/2026-11-09-levure-port/voies/u2/sonde.mts`). La vue lit l'API sans règle propre : dès que d1 livre, la cellule dira « faibles · fiche ». À rejouer : `m2` de `capturer-app.mjs` (les phénols de US-05 ne doivent plus être une cellule « ⌕ »).
4. **Captures dans l'app** (`?dev-local&etape=levure`, `capturer-app.mjs`, port 5657, API de d1) : 36 captures dans `voies/u2/captures-app/` (9 cadres × 390/1280 × clair/cave), 0 erreur de page, aucun réseau hors localhost. Ouvertes et regardées : c1 et s3 à 390 clair, c2 à 390 cave, m1 et m3 à 390 clair, m3 à 1280 cave, s2 à 1280 cave ; avec les 20 captures du banc de la voie déjà ouvertes. Pas toutes les 36 : le reste est de la même mise en page à un autre format. Corrigé à la vue : étiquettes de lignes qui se touchaient (hauteur minimale des quatre lignes d'effets), cellule Dose centrée à tort.
5. **Contrôles** : `tsc` : 0 erreur ; `vitest tests/integration/etapeLevure --maxWorkers=2 --reporter=dot > voies/u2/tests.txt` : `Tests  33 passed (33)` (4 fichiers).

### Côte à côte avec les maquettes, cadre par cadre
- **c6b 1** (1056 tapé) : tient — résumé d'une ligne, puces, carte, trois rayons, pistes avec fantôme bleu et repère rouge, US-05 en tête. Écart de données : la 1056 est « fabricant présent en Europe » (d1) là où la maquette disait « rare ».
- **c6b 2** (feuille) : tient — légende, index de 18 à 30 px avec « ⌕ n », histogramme 4 · 57 · 262 · 327, « ≈ 7 % vol · ta bière » (visible depuis que `abvVise` est passé), bascule éteinte, vendues ici sur l'échelle, Trier, Voir. Écart : feuille = `Sheet` de l'app.
- **c6b 3** (trois filtres) : tient — phrase noire, barre et légende des rayons, bande « STA1 non documentée 258 · dont 4 vendues ici », 4 lignes pâles « ⌕ STA1 ? », « sans STA1 · fiche ».
- **s5a 1** (repos) : tient — référence teintée, effets en tête, fiche, Ma bière, Dose en sachets. Écart : les phénols de US-05 sont encore « non déclarés » (point 3).
- **s5a 2** (toucher) : contour au toucher et appel de `onChercherDonnee` ; pas de « recherche… 3/20 » (la coque lance la recherche).
- **s5a 3** (cas limite) : le W-34/70 du catalogue trouvé par la recherche (« Hefebank Weihenstephan W 34/70 ») n'a pas de plage °C : la vue montre « ⌕ chercher », pas « 19 hors ». « 19 hors » est joué dans le test sur données simulées (NovaLager 10–15 °C).
- **s7a 1, 2, 3** : tiennent — 12 axes groupés, « Moins d'atténuation » (levier empâtage, vendues ici d'abord, écarts sur piste), deux axes (levier °C avec sa preuve, jauges, Europe grisée). Écart de données : avec US-05 sans thiols ni floculation, Verdant n'est pas « + thiols et + clair » (sa floculation est moyenne).

## Fichiers écrits
- `src/ui/etapeLevure/Chercher.tsx` (c6b ; porte aussi les pièces communes : pastilles, disponibilité, « ⌕ chercher », pistes, `apiDe`), `Comparer.tsx` (s5a), `Suggerer.tsx` (s7a), `vues.css` (classes `lvv-`, jetons `--cave-*`, deux thèmes).
- `tests/integration/etapeLevure/vues.test.tsx` (15 tests, API simulée `vues-simule.ts`) et `vues-reel.test.tsx` (4 tests sur l'API réelle de d1).
- Voie : `banc/index.html` + `banc/banc.tsx` (banc hors bundle, servi par vite), `capturer.mjs`, `captures/` (essais), ce fichier.
- Aucune coquille vide à remplacer : u1 importe déjà mes trois composants, sans `api` en prop ; `apiDe` trouve `src/domain/levure/index.ts` par `import.meta.glob`. Fichiers ajoutés à la voie : `capturer-app.mjs`, `captures-app/`, `tests.txt`, `sonde.mts`.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur dans mes fichiers (reste une erreur de `MaLevure.tsx` ligne 132, à u1 : `??` et `||` sans parenthèses).
- `npx vitest run tests/integration/etapeLevure/vues* --maxWorkers=2` : **19 verts**. Gestes joués : trois filtres posés donnent le compte et retirer rend la liste ; ⊕ ajoute une colonne et × la retire ; « − » sur Atténuation reclasse la liste (vendues ici d'abord, levier de l'API) ; deux axes se combinent (le troisième remplace le plus ancien) ; « ⌕ » appelle `onChercherDonnee` et rien d'autre ; une carte à 0 des deux côtés se replie ; US-05 en tête de « Vendue CH · FR · DE » après « 1056 » (API réelle) ; la feuille porte les 18 filtres.
- Chrome : voir « Suite du pilote », points 4 et 5 (36 captures dans l'app, 0 erreur de page).

## Ce qui est porté (par vue)
- **Chercher c6b** : champ ; ligne de résumé de l'API (premier mot gras, repères en rouge, compte à droite) ; puces qui défilent ; carte de la levure tapée (`tapee` de l'API, effets en pastilles de famille, pistes °C et %) ; trois rayons « Vendue CH · FR · DE » / « Fabricant présent en Europe » / « Rare en Europe » (renommage du pilote), pistes avec la plage de la levure tapée en fantôme bleu et le repère 19 °C en rouge ; feuille à index des 18 filtres (point = posé, rond rouge = repère, « ⌕ n » non documentées, « estimé »), histogramme de la tolérance avec « ≈ 7 % vol · ta bière », bascule « ne garder que ≥ 7 % » éteinte (un repère n'est jamais un filtre), les 5 vendues ici sur la même échelle, Trier, « Voir n » ; filtres posés = phrase noire, chaque mot retirable ; barre et légende des rayons ; bande « STA1 non documentée 258 · dont 4 vendues ici » ; ces 4 en lignes pâles « ⌕ STA1 ? » (retrouvées en relançant la recherche sans ce filtre : l'API écarte les fiches muettes, la vue les montre « à vérifier » hors du compte).
- **Comparer s5a** : colonnes (référence = levure de la recette, teintée, `réf.`), effets en tête (esters, phénols, houblon, sucres restants), puis Fiche (atténuation, température avec visée, « 19 hors » en alerte, floculation), puis « Ma bière » (FG et alcool, de l'OG et de l'atténuation) ; cellule muette = « ⌕ non déclarés / non documenté / chercher » (appelle `onChercherDonnee`, contour au toucher) ; ⊕ ouvre une feuille de choix (même ordre que Chercher), ⇄ remplace, × retire.
- **Suggérer s7a** : « Je veux… », 12 cartes − / + groupées Arômes (estimé) · Corps · Conduite, comptes de `comptesAxes`, carte choisie en grand avec son levier (l'API le coupe : « °C : plus chaud » dans l'en-tête, la preuve « 3SH +33 à +72 % de 15 à 30 °C, Samia 2026 » dans une boîte), autres groupes en puces, « + un 2ᵉ axe », carte sans donnée repliée, pistes °C et % de s6a au repos, écart sur piste avec la levure de base en pointillé, jauges des deux axes par ligne, ⊕ vers Comparer. Aucun but nommé.

## Essais utilisés
Deux tours de réglage visuel sur les captures (noms trop longs, pastilles trop hautes, feuille grise, index débordant, ligne pâle, chevauchements) ; aucun critère n'a dépassé trois essais.

## Écarts à la maquette, et leur raison
1. **Ligne déroulée** (toucher une ligne : « Choisir pour ma recette », « Comparer ») : la maquette c6b ne montre aucun geste de choix ; sans lui l'écran ne sert à rien (`onChoisir`). Un détail à un toucher, pas une carte.
2. **Feuille de Chercher** = le composant `Sheet` de l'app (vaul), pas un cadre à 120 px du haut : légende en sous-titre (« ● posé · ○ repère · ⌕ non documentées », retouche 1 du critique), fond blanc. Le pied (Trier, Voir) y tient.
3. **Comparer** : 3 colonnes au plus à 390 px (houblons : 4) ; ⇄ = « Remplacer » (la maquette ne dit pas ce qu'il fait) ; la colonne de la levure de la recette n'a ni ⇄ ni ×. La cellule « recherche… 3/20 » n'est pas dessinée : la recherche est lancée par la coque, la vue ne sait pas où elle en est.
4. **Comparer, ligne Dose** : portée (voir « Suite du pilote », point 2).
5. **Suggérer, graphique du levier °C** (axe 15–30 °C avec bande et repère 19) : remplacé par le texte du levier et sa preuve ; l'API ne rend qu'une phrase, pas la bande. Frise J0–J12 : non portée (absente des trois cadres de s7a).
6. Libellés courts dans les cartes de 84 px et l'index (« Tolérance à l'alcool » → « Tolérance », « Température » → « °C », « Clarté · floculation » → « Clarté »). Pastilles : un seul descripteur par ligne, deux dans la carte (densité).
7. « Effacer » ajouté à la rangée de puces de Suggérer (remettre au repos) ; « Retirer les filtres » dans l'état vide de Chercher.
8. « épuisée 27.09 » (1007) : non dit, `Disponibilite` n'a pas ce champ.

## Doutes et limites
- `PropsAvecApi` ajoute à `PropsVue` deux props **optionnelles** : `api` (tests, banc) et `stockIds` (filtre « En stock chez moi »). Sans `stockIds`, ce filtre est grisé (« — ») et son panneau le dit : u1 doit passer les ids du stock s'il veut ce filtre.
- `apiDe` ne complète plus l'API : `documente` et `trouver` viennent de d1.
- Le tri de la feuille (prix, atténuation, °C, tolérance) se fait dans la vue, par rayon, sur les valeurs de l'API ; « proche » garde l'ordre de l'API. `FILTRES_ESTIMES` (famille, effets, sans alcool) est une constante de la vue.
- Console du banc : une ligne « 404 » (ressource statique du banc, probablement l'icône) ; aucune erreur de page.
- Densité : cibles ≥ 24 px (index 30, moitiés − / + 28, puces 28, « ⌕ » 24).

DÉCISION À PRENDRE : aucune ouverte. À brancher par u1 si le brasseur veut le filtre « En stock chez moi » : passer `stockIds` (ids de référence des levures en stock) à `<Chercher>` ; sans lui, ce filtre est grisé et le dit.

CONNAISSANCE : l'API de d1 **écarte** d'une liste filtrée les fiches dont la donnée du filtre est muette (« l'inconnu n'est jamais un accord ») ; le contrat ne le disait pas. Les vues les retrouvent en relançant `chercher` sans ce filtre et en gardant celles que `DEFS[filtre].valeur` rend `null`, vendues ici seulement (cadre 3 de c6b : « dont 4 vendues ici », hors du compte). Les options de plage de d1 s'écrivent `<8`, `8-10`, `>=12` ; `bornesDe` (Chercher.tsx) les lit.

LEÇON PROPOSÉE : un contrat écrit avant le domaine se vérifie sur le domaine dès qu'il existe, pas seulement sur l'API simulée de la voie : mon API simulée gardait les fiches muettes dans la liste, la vraie les écarte, et la vue des « à vérifier » en dépendait. Faire tourner un test sur l'API réelle (`vues-reel.test.tsx`) dès la livraison de d1, et écrire dans le contrat ce que fait une fiche sans donnée.

## Livraisons de d1 branchées (dernier passage)
- `Suggestion.levierDetail` : le levier °C est tracé depuis `plage` (axe 15–30 °C, ta conduite 19, flèche « plus chaud »), la preuve vient de la phrase ou de `source` ; plus aucun parsing de texte.
- `Disponibilite.stock` : « épuisée au relevé du JJ.MM » (jamais une rupture datée) sur les lignes de Chercher et de Suggérer.
- Floculation de la 1056 : « faible à moyen » affiché (cellule qui passe à la ligne), plus « ⌕ chercher ».
- M4 : « ⌕ » de Comparer (`CelluleInconnue`) et de Suggérer/Chercher (`NonDoc`) lisent `useEtatRecherche` : « recherche… n/20 », valeur « à confirmer », Retenir, Écarter (`CelluleRecherche` de u1).
- Tests : `tests/integration/etapeLevure/vues-reel-d1.test.tsx` (3 tests) ajouté ; `voies/u2/tests.txt` : voir la ligne « Tests » (tous les fichiers de `tests/integration/etapeLevure`, dont ceux de u1). Captures : `voies/u2/captures-d1/` (s3 et c1 dans l'app, m1 sur le banc API réelle) ; « épuisée au relevé » est vérifié par le test, pas visible sur la capture c1 (la ligne 1007 est sous le pli).

## Second verdict (VERDICT-port-2.md) : N1, N2, N3, N6, C2 corrigés
- **N2 (bloquant)** : « épuisée au relevé du 27.09 » sur sa propre ligne sous le nom (ligne du nom qui peut passer à la ligne) ; mesure `chevauche: 0` dans l'app à 390 et 1280, clair et cave ; captures `voies/u2/captures-v2/c3-*` ouvertes (390 clair, 390 cave, 1280 cave).
- **N1 (Comparer, Chercher, Suggérer)** : une cellule ou une pastille qui porte la recherche (`CelluleRecherche`) s'étire en hauteur et passe à la ligne : « Service IA momentanément indisponible. OK » entier à 390 (`rognes: 0`), capture m2-390-clair ouverte.
- **N3** : le compte suit le titre du rayon (même bloc). **N6** : « 10–15 °C · 19 hors plage » en rouge (s3-1280-clair ouverte).
- **C2** : « liquide » (forme du produit vendu, `yeastSupplyBootstrap`, seulement s'il n'y en a qu'une) et « relevé du 27.09 · stock ? » (`Disponibilite.stock`) sur la carte de la 1056 (c1-390-clair ouverte). Pas de date de fiche (aucune donnée). N4 (arômes de Pomona) : d1.
- Contrôles : tsc 0 erreur, `controle-virgule.mjs` « VIRGULE OK », `tests.txt` : voir la ligne « Tests ».

## Verdict final, L-c : titres de rayon à 390
« Ici · CH FR DE 4 », « Europe 25 », « Rare 73 » sur une ligne à 390 (≤ 640 px, `data-court` en CSS) ; le titre long reste dans `title` et à 1280. Mesure dans l'app : hauteur des titres 15–16 px (une ligne) ; captures `voies/u2/captures-v3/c3-*` (390 clair, 390 cave, 1280 clair ouvertes). tsc 0 erreur ; `tests.txt` : `Tests  51 passed (51)`.
