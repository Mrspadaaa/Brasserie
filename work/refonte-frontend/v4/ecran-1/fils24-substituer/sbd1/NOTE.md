# sbd1 — Substituer, série d (selon le moment), v0

- **Chaleur : froide.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd1-wp.png`).
- **Idée** : u4 affiné : le classement de u4 (note, plage quand une composante manque, rangé par le pire cas), dont chaque barre se découpe selon les poids du moment (60′ : amertume 60 %, huiles 20 %, arôme étranger 20 % ; whirlpool : 10 / 30 / 60).
- **Ce qui tient** : La réponse en une ligne (« Magnat 99, Yeoman 99, sans inconnue » ; 137 très proches à 60′, 8 en whirlpool) ; la barre dit pourquoi une note est haute ; le hachuré garde l’inconnu ouvert (Altus 79–99) ; le stock en icône ; « Dans ta stout » montre que l’ébullition emporte presque tout (~3 contre ~4).
- **Ce qui casse** : Encore une liste : proche de u4 au premier coup d’œil ; la découpe des barres demande la légende la première fois ; le face-à-face n’a que quatre familles.

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
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd1/concept.mjs` (classes sbd1-…).
Générer : `node sbd1/serie/generer.mjs sbd1` ; captures : `node sbd1/serie/capturer.mjs sbd1`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd1 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 9 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd1 etat.html : 2 facteurs libres : inconnu (Magnat amérisant α 11–16 % 99, Yeoman amérisant α 12–16 % 99, Altus mixte α 15–18,5 % 79–99) ; houblon (Idaho 7 mixte α 12,7 % 93, Sabro mixte α 13,4 % 93, Nelson Sauvin mixte α 9,6 % 86) / sbd1 etat.html : balisage discordant : Magnat amérisant α 11–16 % 99 : balisé houblon, porte inconnu ; Yeoman amérisant α 12–16 % 99 : balisé houblon, porte inconnu ; Altus mixte α 15–18,5 % 79–99 : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd1 · 8 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (10 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd1 72 mots (hors données)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,57, 0 sous 0,50 · ressemblance moyenne 0,85 · paires presque identiques 0/28 (0 %) ; PANEL OK

## Captures
`captures/sbd1-premier-ecran.png`, `sbd1-page.png`, `sbd1-wp.png` (le même Nugget en whirlpool), `sbd1-choix.png` (un autre remplaçant
touché), `sbd1-fiche.png` (appui long).
