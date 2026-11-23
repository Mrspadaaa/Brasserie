# sbd6 — Substituer, série d (selon le moment), v0

- **Chaleur : chaude.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd6-wp.png`).
- **Idée** : Le chaudron : la cuve dessinée au moment de ton ajout. À 60′, le feu et la vapeur qui emporte les pictos d’arôme du remplaçant ; dans le moût, l’IBU qui reste (60). En whirlpool, 80 °C, les pictos restent dans la stout. Les remplaçants attendent sur l’étagère, cônes à la taille de leur dose.
- **Ce qui tient** : L’idée se comprend sans légende : ce qui monte part, ce qui est dans la cuve reste ; le cône plus gros dit plus de grammes ; l’IBU en grand porte la réponse à 60′.
- **Ce qui casse** : Illustration : moins de chiffres que les autres ; la vapeur ne dit pas combien part (le ~ est écrit dans la cuve) ; 80 °C · 20 min est la valeur supposée du moteur, pas sa recette.

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
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd6/concept.mjs` (classes sbd6-…).
Générer : `node sbd1/serie/generer.mjs sbd6` ; captures : `node sbd1/serie/capturer.mjs sbd6`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd6 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 6 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd6 etat.html : 2 facteurs libres : inconnu (Altus 99? · 36 g mixte α 15–18,5, Magnat 99 · 44 g amérisant α 11–16, Trident 99? · 48 g mixte α 11–14) ; houblon (Nelson Sauvin 86 · 62 g mixte α 9,6, Galaxy 85 · 35 g mixte α 17,2) / sbd6 etat.html : balisage discordant : Altus 99? · 36 g mixte α 15–18,5 : balisé houblon, porte inconnu ; Magnat 99 · 44 g amérisant α 11–16 : balisé houblon, porte inconnu ; Trident 99? · 48 g mixte α 11–14 : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd6 · 6 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (10 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd6 76 mots (hors données)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,57, 0 sous 0,50 · ressemblance moyenne 0,85 · paires presque identiques 0/28 (0 %) ; PANEL OK

## Captures
`captures/sbd6-premier-ecran.png`, `sbd6-page.png`, `sbd6-wp.png` (le même Nugget en whirlpool), `sbd6-choix.png` (un autre remplaçant
touché), `sbd6-fiche.png` (appui long).

## Reprise du remplissage (retour du pilote, M14)
Le premier écran porte en plus le cas de la stout à trois moments : Nugget 46 g à 60′, puis le même Nugget déplacé en whirlpool et en dry hop. Pour chaque moment, la réponse du moteur (meilleur sans inconnue, dose, IBU, nombre de très proches, premier en stock qui suffit) et le poids des trois parts (bande grise et bleu-vert) ; la colonne foncée est le moment de ta ligne. Ce que le remplaçant perd et gagne face à Nugget (familles des fiches, « emportés à 60′ ») suit le remplaçant choisi. Le rythme est resserré (5 px entre blocs). Remplissage du premier écran (controle-panel) : voir la ligne du panel ci-dessus.
