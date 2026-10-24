# sbd3 — Substituer, série d (selon le moment), v0

- **Chaleur : tiède.**
- **Question** : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (`data-libre="houblon"`). Le moment, la dose au même IBU
  et la base sont fixés sur la ligne de contexte ; le cas réel est Nugget 46 g à 60′ (stout export 16D, S1) ; `?cas=wp` rend le même Nugget
  déplacé en whirlpool, pour montrer que la réponse change (capture `sbd3-wp.png`).
- **Idée** : La largeur des colonnes est le poids du moment : amertume, huiles, arôme prennent la place que le moteur leur donne ; la colonne qui pèse le plus est lue en détail (plages d’α, dose), les autres en résumé et éteintes.
- **Ce qui tient** : Le moment se lit sans un mot : à 60′, la colonne Amertume noire occupe la moitié du tableau ; en whirlpool, c’est l’Arôme ; la même grille, deux lectures.
- **Ce qui casse** : Le tableau est serré à 390 px (noms à 112 px) ; à 60′, la colonne arôme se réduit à trois traits ; les notes « ? » (huiles inconnues) demandent la légende.

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
Aucun écart à la baseline. Socle commun de vocabulaire : `sbd1/serie/socle.mjs` ; composition propre : `sbd3/concept.mjs` (classes sbd3-…).
Générer : `node sbd1/serie/generer.mjs sbd3` ; captures : `node sbd1/serie/capturer.mjs sbd3`.

## Contrôles (joués une fois, sorties recopiées)
- Baseline, `controle-commun.mjs … --page=etat.html --sans=mots` (série entière) : COMMUN OK
- `controle-une-question.mjs` : sbd3 · titre « Lequel à la place de Nugget ? » · libres : inconnu, houblon · 8 contrôle(s) · contexte : moment, dose, base · 2 faute(s) / sbd3 etat.html : 2 facteurs libres : inconnu (Altus 99? mixte α 15–18,5 36 g ? ? ? ?, Magnat 99 amérisant α 11–16 44 g ? ?, Trident 99? mixte α 11–14 48 g ? ? ? ?) ; houblon (Idaho 7 93 mixte α 12,7 47 g, Sabro 93 mixte α 13,4 45 g ? ?, Nelson Sauvin 86 mixte α 9,6 62 g ? ?) / sbd3 etat.html : balisage discordant : Altus 99? mixte α 15–18,5 36 g ? ? ? ? : balisé houblon, porte inconnu ; Magnat 99 amérisant α 11–16 44 g ? ? : balisé houblon, porte inconnu ; Trident 99? mixte α 11–14 48 g ? ? ? ? : balisé houblon, porte inconnu (le détecteur ne reconnaît pas les variétés du seul catalogue, Magnat, Altus… : « inconnu »)
- `controle-sans-famille.mjs` : sbd3 · 7 houblon(s) repéré(s) · 1 au-dessus de 50 % (Nelson Sauvin 83 % ✓) ; série : SANS-FAMILLE OK (10 houblon(s) au-dessus de 50 %, part « autres » visible)
- `mots-premier-ecran.mjs --sans-donnees --max=80` : sbd3 90 mots (hors données) (> 80)
- `controle-panel.mjs` (huit premiers écrans) : 8 captures · remplissage médian 0,57, 0 sous 0,50 · ressemblance moyenne 0,85 · paires presque identiques 0/28 (0 %) ; PANEL OK

## Captures
`captures/sbd3-premier-ecran.png`, `sbd3-page.png`, `sbd3-wp.png` (le même Nugget en whirlpool), `sbd3-choix.png` (un autre remplaçant
touché), `sbd3-fiche.png` (appui long).
