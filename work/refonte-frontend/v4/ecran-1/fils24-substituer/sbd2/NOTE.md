# sbd2 — Substituer, série d (selon le moment), v0

- **Chaleur : froide.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd2-wp.png`).
- **Idée** : Le face-à-face de u4 (« même IBU ») en écart de recette : ta ligne de Nugget épinglée (épuisée), un remplaçant à la fois, et les trois parts de la note rangées dans l’ordre de leur poids au moment (60′ : amertume d’abord ; whirlpool : arôme d’abord).
- **Ce qui tient** : Les vraies valeurs de u4 (α, β, huiles en plages, trait gris = Nugget, sources) ; l’ordre des sections change avec le moment sans rien ajouter ; « Arôme étranger » écrit ce que le 100 veut dire à 60′ (plus d’« arôme 100 » trompeur).
- **Ce qui casse** : Plus proche de Comparer que les autres (plages côte à côte) ; un remplaçant à la fois : pas de vue d’ensemble du classement ; les puces des remplaçants sont petites.

## Données et honnêteté
- Remplaçants, notes, composantes, dose au même IBU (plage par l’α du remplaçant), stock, rang : moteur v4, `substitutes('beermaverick-nugget',
  { moment, grams: 46, recipe: S1, style: 16D })` (`sbd1/donnees/remplacants-nugget.json`, script `sbd1/donnees/extraire-remplacants.ts`).
- « Dans ta stout » : `simulerCas`, stout S1 sans houblon + un seul ajout (`sbd1/donnees/profils-moments.json`, script
  `sbd1/donnees/simuler-moments.ts`) ; marqué « ~ », plage pâle jusqu’au haut simulé ; une famille sans fiche ni composé est hachurée « ? », jamais 0.
- Nelson Sauvin (83 % de mots sans famille) et Zenia portent leur part « autres » grise ; la fiche (appui long) liste les mots (vin blanc, groseille…).
- α : celui du lot quand il est lu (Nugget 13 %, Nelson Sauvin 9,6 %), sinon la plage variétale des fiches (Magnat 11–16 %).

## Baseline (plancher à enrichir)
Pictos au trait de la planche v3 (épicé : cannelle et clou croisés, `p-spice`) ; couleurs des familles ; α et rôle ; usage en mot (mixte,
amérisant, aromatique) ; au style par défaut, absolu à un toucher ; stock en petite icône (caddie, boîte, boîte barrée) ; thème blanc (D106) ;
la croix pour sortir (D109) ; légende derrière « ? » ; appui long ou survol long → fiche courte g1 (α, arômes sourcés, silhouette, goût).
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd2/concept.mjs` (classes sbd2-…).
Générer : `node sbd1/serie/generer.mjs sbd2` ; captures : `node sbd1/serie/capturer.mjs sbd2`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd2 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 6 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd2 etat.html : 2 facteurs libres : inconnu (Magnat 99, Yeoman 99, Altus 99?) ; houblon (Nelson Sauvin 86, Galaxy 85) / sbd2 etat.html : balisage discordant : Magnat 99 : balisé houblon, porte inconnu ; Yeoman 99 : balisé houblon, porte inconnu ; Altus 99? : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd2 · 3 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (7 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd2 69 mots (hors données)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,45, 5 sous 0,50 · ressemblance moyenne 0,89 · paires presque identiques 0/28 (0 %) ;   - REMPLISSAGE : médiane 0,45 < 0,55 (lot 21 : 0,62) ; les plus vides : sbd4-premier-ecran 0,39, sbd1-premier-ecran 0,42, sbd2-premier-ecran 0,43, sbd7-premier-ecran 0,45, sbd5-premier-ecran 0,45 ; PANEL ECHEC

## Captures
`captures/sbd2-premier-ecran.png`, `sbd2-page.png`, `sbd2-wp.png` (le même Nugget en whirlpool), `sbd2-choix.png` (un autre remplaçant
touché), `sbd2-fiche.png` (appui long).
