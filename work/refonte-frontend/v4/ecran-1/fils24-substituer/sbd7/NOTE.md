# sbd7 — Substituer, série d (selon le moment), v0

- **Chaleur : chaude.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd7-wp.png`).
- **Idée** : L’entonnoir du moment : les 318 variétés passent par les clés de classement du moteur, dans l’ordre (arôme décrit, chers pour amériser, très proches, sans inconnue, en stock et assez). À 60′, 137 très proches et 2 en stock (Nelson Sauvin, Galaxy) ; en whirlpool, 8, et aucun en stock qui suffise.
- **Ce qui tient** : Rend visible la règle de classement, que personne ne voit d’habitude ; le moment change les tamis (« chers pour amériser » disparaît en whirlpool) ; la sortie de l’entonnoir est la liste à choisir.
- **Ce qui casse** : Six étages de chiffres avant la liste : la réponse est au milieu de l’écran ; les largeurs en racine carrée adoucissent l’écart 137 / 8 ; l’étage « assez en stock » ne garde que les très proches.

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
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd7/concept.mjs` (classes sbd7-…).
Générer : `node sbd1/serie/generer.mjs sbd7` ; captures : `node sbd1/serie/capturer.mjs sbd7`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd7 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 5 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd7 etat.html : 2 facteurs libres : inconnu (99 Magnat amérisant α 11–16 44 g, 99 Yeoman amérisant α 12–16 43 g, 97 Helios mixte α 16,8–21 32 g) ; houblon (86 Nelson Sauvin mixte α 9,6 62 g, 85 Galaxy mixte α 17,2 35 g) / sbd7 etat.html : balisage discordant : 99 Magnat amérisant α 11–16 44 g : balisé houblon, porte inconnu ; 99 Yeoman amérisant α 12–16 43 g : balisé houblon, porte inconnu ; 97 Helios mixte α 16,8–21 32 g : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd7 · 6 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (10 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd7 86 mots (hors données) (> 80)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,57, 0 sous 0,50 · ressemblance moyenne 0,85 · paires presque identiques 0/28 (0 %) ; PANEL OK

## Captures
`captures/sbd7-premier-ecran.png`, `sbd7-page.png`, `sbd7-wp.png` (le même Nugget en whirlpool), `sbd7-choix.png` (un autre remplaçant
touché), `sbd7-fiche.png` (appui long).

## Reprise du remplissage (retour du pilote, M14)
Le premier écran porte en plus le cas de la stout à trois moments : Nugget 46 g à 60′, puis le même Nugget déplacé en whirlpool et en dry hop. Pour chaque moment, la réponse du moteur (meilleur sans inconnue, dose, IBU, nombre de très proches, premier en stock qui suffit) et le poids des trois parts (bande grise et bleu-vert) ; la colonne foncée est le moment de ta ligne. Ce que le remplaçant perd et gagne face à Nugget (familles des fiches, « emportés à 60′ ») suit le remplaçant choisi. Le rythme est resserré (5 px entre blocs). Remplissage du premier écran (controle-panel) : voir la ligne du panel ci-dessus.
