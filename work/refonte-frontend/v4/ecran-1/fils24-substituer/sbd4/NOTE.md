# sbd4 — Substituer, série d (selon le moment), v0

- **Chaleur : tiède.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd4-wp.png`).
- **Idée** : La carte de l’ajout, éclairée par le moment : les remplaçants prennent la place de Nugget sur le rail du brassin (vocabulaire de l’étape Houblons de la base v4.10) ; à 60′ l’α et l’IBU sont en gras, la bande des 12 arômes éteinte ; en whirlpool, la bande s’allume et l’IBU pâlit.
- **Ce qui tient** : Parle brasseur dans son ordre (nom, rôle, α, dose, IBU, arômes) ; reprend la carte qu’il a validée ; le « ~ » de ce qui reste dans la stout est sur chaque carte.
- **Ce qui casse** : La bande éteinte peut se lire « pas d’arôme » plutôt que « parti à l’ébullition » ; six cartes poussent le reste du rail bas.

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
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd4/concept.mjs` (classes sbd4-…).
Générer : `node sbd1/serie/generer.mjs sbd4` ; captures : `node sbd1/serie/capturer.mjs sbd4`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd4 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 6 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd4 etat.html : 2 facteurs libres : inconnu (Altus mixte α 15–18,5 99? 36 g 60 IBU ~3, Magnat amérisant α 11–16 99 44 g 60 IBU , Trident mixte α 11–14 99? 48 g 60 IBU ~7) ; houblon (Nelson Sauvin mixte α 9,6 86 62 g 60 IBU, Galaxy mixte α 17,2 85 35 g 60 IBU ~7) / sbd4 etat.html : balisage discordant : Altus mixte α 15–18,5 99? 36 g 60 IBU ~3 : balisé houblon, porte inconnu ; Magnat amérisant α 11–16 99 44 g 60 IBU  : balisé houblon, porte inconnu ; Trident mixte α 11–14 99? 48 g 60 IBU ~7 : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd4 · 6 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (10 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd4 61 mots (hors données)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,57, 0 sous 0,50 · ressemblance moyenne 0,85 · paires presque identiques 0/28 (0 %) ; PANEL OK

## Captures
`captures/sbd4-premier-ecran.png`, `sbd4-page.png`, `sbd4-wp.png` (le même Nugget en whirlpool), `sbd4-choix.png` (un autre remplaçant
touché), `sbd4-fiche.png` (appui long).

## Reprise du remplissage (retour du pilote, M14)
Le premier écran porte en plus le cas de la stout à trois moments : Nugget 46 g à 60′, puis le même Nugget déplacé en whirlpool et en dry hop. Pour chaque moment, la réponse du moteur (meilleur sans inconnue, dose, IBU, nombre de très proches, premier en stock qui suffit) et le poids des trois parts (bande grise et bleu-vert) ; la colonne foncée est le moment de ta ligne. Ce que le remplaçant perd et gagne face à Nugget (familles des fiches, « emportés à 60′ ») suit le remplaçant choisi. Le rythme est resserré (5 px entre blocs). Remplissage du premier écran (controle-panel) : voir la ligne du panel ci-dessus.
