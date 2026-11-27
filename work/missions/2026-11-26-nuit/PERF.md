# Performance — nuit du 26 au 27.11

Mesures sur l'app EN LIGNE (lecture seule, son compte, ses données), Chrome 157, 390 × 844 tactile, **CPU ralenti ×4** (téléphone moyen).
Outils : `outils/perf.mjs` (chargements, passages d'écran : clic → page calme, 400 ms sans mutation ni tâche longue), `outils/profil.mjs`
(profil CPU d'un passage, temps propre rapporté aux modules sources par les cartes d'un build identique : même empreinte `index-BJS-wSZ1.js`).

## Avant (tour 80, en ligne le 26.11 à 23 h 50)

| mesure | valeur |
|---|---|
| chargement à froid (sans cache ni service worker) : barre visible / page calme | 2 981 ms / 3 517 ms ; 1 590 Ko transférés ; FCP 584 ms |
| chargement à chaud : barre / calme | 2 079 ms / 2 479 ms |
| Bord (depuis Clients) | **1 220 ms**, dont 1 091 ms de tâches longues |
| Calendrier | **1 379 ms**, dont 1 226 ms de tâches longues |
| Bord (retour) | 1 087 ms |
| Recettes | 574 ms ; Brassins 497 ; Atelier 489 ; Finances 454 ; Clients 380 ; Stocks 102 ; Volumes 80 |

Poids (build de production) : entrée `index` 206 Ko (65 Ko gzip, React) ; morceau de démarrage **App 2 562 Ko (679 Ko gzip)** ; firebase 637 Ko (152 Ko gzip).
Dans App : données levures et bootstrap (yeastReferencesCore et ses JSON, ≈ 720 Ko), **jsPDF 334 Ko**, Dexie 98 Ko, domaine finance 101 Ko.

## Causes trouvées

1. **Bord et Calendrier** : profil, 2 passages, CPU ×4 — Bord : `brewBudget.ts` 2 745 ms (resolveBudgetStock 1 355, flèches de recherche 1 229) ;
   Calendrier : `brewBudget.ts` 2 699 ms. Problème d'école : jointure par balayage (`stock.find` / `stock.filter` avec `toLocaleLowerCase` sur tout
   le stock) répétée pour chaque demande × chaque brassin planifié × chaque estimation. Méthode standard : index par table de hachage + mémo des clés.
2. **jsPDF au démarrage** : `companyDefaults` importait `adresseDepuisTexte` de `swissQrBill.ts`, qui importe jsPDF statiquement.

## Corrigé (sûr, même résultat)

- ec7aa5312 : `adresseQr.ts` (adresse seule) ; jsPDF sort du démarrage : **App 2 562 → 2 151 Ko, gzip 679 → 545 Ko (−134 Ko)**. Tests factures verts.
- brewBudget (2 commits) : index du stock par référence et par nom, mémo des clés ; réindexé si le tableau change sur place
  (test `brewBudgetIndexStock.test.ts`). Banc synthétique (15 brassins planifiés, 300 articles, 200 achats) : 72 → 48 ms par série d'estimations.

## Écrit, non fait cette nuit (raison)

- Données levures (≈ 720 Ko) dans le démarrage : `yeastReferencesCore` est le « noyau » voulu (voie l3, 10.11) ; le rendre paresseux touche le
  calcul de la Levure, des Houblons et du NOLO (décision d'architecture : conseil, pas une nuit de correctifs).

## Après (lot 1 en ligne, `index-Bc72xyPN.js`, 27.11 vers 1 h 30, mêmes conditions)

| mesure | avant | après |
|---|---|---|
| Bord (depuis Clients) | 1 220 ms (tâches longues 1 091) | **610 ms (105)** |
| Bord (retour) | 1 087 ms (1 061) | **133 ms (132)** |
| Calendrier | 1 379 ms (1 226) | 1 299 ms (**355**) ; profil : `brewBudget.ts` 2 699 → **53 ms** (2 passages, CPU ×4) ; le reste est le travail du navigateur (style, mise en page : « (program) » 1,6 s) |
| chargement à froid : barre / calme | 2 981 / 3 517 ms | 2 552 / 3 362 ms ; FCP 584 → 288 ms |
| morceau App (build) | 2 562 Ko / 679 Ko gzip | 2 151 Ko / 545 Ko gzip |

Bruit : une seule série par version (un agent travaillait dans un autre onglet pendant la seconde) ; les écarts de 20 % ne disent rien, ceux du Bord (×2 à ×8) et du profil (×50) si.

## Reste écrit (non fait)

- Calendrier : 1,6 s CPU ×4 de style et mise en page à l'ouverture (`getBoundingClientRect` 101 ms : mesures en boucle dans la frise ?). À profiler avec la trace Performance (Layout/Recalculate Style) avant toute retouche.
- Données levures au démarrage (≈ 720 Ko) : voir plus haut.
- Mesure Levure du registre (T4-6, cal-77 : retour sur Levure 251–510 ms) : l'éditeur ne s'ouvre en ligne que sur une recette ; non remesuré cette nuit (aucune recette ZZ TEST enregistrée, et en créer une écrit dans ses données).

## Calendrier après le lot 2 (trace Performance, CPU ×4, 27.11 vers 1 h 40)

Trace `outils/trace.mjs` (Clients → Calendrier) : JS 684 ms (FunctionCall) + minuteries 273 ms ; style 136 ms et mise en page 105 ms seulement, dont
≈ 70 ms forcées par CalendrierTab et 38 ms par `murMiseEnPage.ts`. Les « 1,3 s » de `perf.mjs` comptent l'attente d'un DOM calme (animations de la frise) :
le coût CPU réel du passage est ≈ 0,2 s sur un téléphone moyen. Rien de sûr à corriger de plus cette nuit.
