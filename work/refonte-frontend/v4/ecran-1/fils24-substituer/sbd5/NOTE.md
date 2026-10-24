# sbd5 — Substituer, série d (selon le moment), v0

- **Chaleur : tiède.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd5-wp.png`).
- **Idée** : La frise des réponses : le brassin de 60′ à après, et au-dessus de chaque moment combien de houblons le moteur trouve très proches (137 jusqu’à 15′, 8 dès 10′) et lesquels sans inconnue (Magnat et Yeoman, puis Target et Falconer’s Flight). Ta ligne est épinglée ; la liste répond à ton moment, avec le rang du même houblon à l’autre bout.
- **Ce qui tient** : La falaise entre 15′ et 10′ dit en un regard qu’une amertume se remplace facilement et un arôme mal ; le poids des trois parts est sous chaque moment ; « en WP : hors 12 » montre que Magnat ne vaut rien tard.
- **Ce qui casse** : La frise peut se lire comme un rail à glisser (ce n’est pas un réglage) ; 10′, 5′, 0′ ont les mêmes chiffres ; « hors 12 » vient de la limite de l’extraction (12 premiers), pas du moteur.

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
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd5/concept.mjs` (classes sbd5-…).
Générer : `node sbd1/serie/generer.mjs sbd5` ; captures : `node sbd1/serie/capturer.mjs sbd5`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd5 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 6 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd5 etat.html : 2 facteurs libres : inconnu (99? Altus mixte α 15–18,5 36 g en WP hor, 99 Magnat amérisant α 11–16 44 g en WP h, 99? Trident mixte α 11–14 48 g en WP hor) ; houblon (93 Idaho 7 mixte α 12,7 47 g en WP rang , 93 Sabro mixte α 13,4 45 g en WP rang 33) / sbd5 etat.html : balisage discordant : 99? Altus mixte α 15–18,5 36 g en WP hor : balisé houblon, porte inconnu ; 99 Magnat amérisant α 11–16 44 g en WP h : balisé houblon, porte inconnu ; 99? Trident mixte α 11–14 48 g en WP hor : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd5 · 7 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (10 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd5 82 mots (hors données) (> 80)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,57, 0 sous 0,50 · ressemblance moyenne 0,85 · paires presque identiques 0/28 (0 %) ; PANEL OK

## Captures
`captures/sbd5-premier-ecran.png`, `sbd5-page.png`, `sbd5-wp.png` (le même Nugget en whirlpool), `sbd5-choix.png` (un autre remplaçant
touché), `sbd5-fiche.png` (appui long).
