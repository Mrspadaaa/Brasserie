OK — 18 états Suggérer (q2b), 19 Comparer (r6a, x3b), 26 acquis joués sur 5345f6ad ; 24 écarts (10 + 6 + 8), choix perdus en tête

Construction jouée : `prototypes/houblons-v4/maquettes/parcours-5345f6ad/` (Chrome, puppeteer-core, 390 × 844 tactile). Chaque état a sa paire de captures « choisie » et « 5345f6ad », ouvertes en planches côte à côte avant verdict (L12).

Verdicts : Suggérer 8 présents, 8 différents, 2 absents ; Comparer 13 présents, 1 différent, 5 absents ; acquis 18 présents, 5 différents, 3 absents.

## Fichiers écrits
- `work/refonte-frontend/v4/choix/etats/suggerer.json` (18), `comparer.json` (19), `acquis.json` (26)
- `work/refonte-frontend/v4/choix/etats/captures/etat-sugg-*`, `etat-comp-*`, `etat-acquis-*` (`-choisie.png`, `-5345f6ad.png`)
- ce fichier. Scripts et planches de travail : `C:\Users\mrspa\AppData\Local\Temp\p21b\` (hors dépôt).

## Choix perdus (en tête)

### Suggérer (q2b)
| id | ses mots | choisie (q2b) | 5345f6ad | écart |
|---|---|---|---|---|
| etat-sugg-levure | D96 : levure, biotransformation et ajout cumulé font partie de l'outil | groupe « Changer de levure » : LalBrew Verdant IPA et Pomona, chacune avec sa barre | absent | la liste s'arrête au dry hop |
| etat-sugg-ibu-details | q2b | volet « IBU après chaque voie (ma bière 59,7 ; style 50–70) » | absent | l'IBU par voie n'est écrit nulle part |
| etat-sugg-radar | m4, h4 ; « Barres \| Radar » | radar + « ‹ 10′ › » par voie, « Appliquer à la recette », « montrer sur le radar », « +11 » | différent | radar plus petit sous les cartes ; plus de décalage du moment, plus d'Appliquer, plus de case radar |
| etat-sugg-dry-hop | q2b | « Dry hop · actif » : Motueka 20 g, pastilles floral → agrumes, thiols, « creep » | différent | « Dry hop 4 g/L · après 3 j » ; pastilles bio et « creep » absentes de la ligne |
| etat-sugg-piste-objectif | D92 « Les bar de ce type sont plus informative » | piste dans la carte, visée en trait | différent | deux rails pleine largeur sous les cartes ; la carte ne garde que le verdict |
| etat-sugg-groupes-effet | q2b | deux groupes (+1 cran / +2 crans, puis +2 crans), cadres à bord noir | différent | un seul groupe, un rail « ~+0,9 » ; Nelson Sauvin et Galaxy partis en Remplacer / Dry hop |
| etat-sugg-assembler | q2b | « Assembler 5 + 5 g », barre l5b à droite de l'axe central | différent | rail fin sous la ligne ; l'axe vertical central de la liste a disparu |
| etat-sugg-remplacer | q2b | 3 remplaçants, deux barres chacun | différent | 5 remplaçants, un chiffre (~+0, ~−0,1) à la place des barres |
| etat-sugg-coeur | D117 | menu aimer · neutre · exclure | différent | un cœur plein ; plus de « exclure » |
| etat-sugg-repos | « Ça oui, c'est effectivement l'un de mes choix » | 3 cartes (Plus agrumes inclus), règle « ‹ visée \| visée › » | différent | 2 cartes (écart déjà écrit dans la NOTE), règle visée absente (D91) |

### Comparer (r6a, x3b)
| id | ses mots | choisie | 5345f6ad | écart |
|---|---|---|---|---|
| etat-comp-defi, -critere, -preuve, -frise-levure | « Avec les quelques petites améliorations des autres versions » (22.10) ; y1b | « Défi 2/4 », critère « par floral ⌄ », « Preuve : tire 20 bières », « Frise » (r6n2) | absents | aucun de ces quatre éléments notés n'est repris |
| etat-comp-biotransfo | D96 | biotransformation de x3b | absent | laissée à Dryhopper et Levure (écrit dans la NOTE) |
| etat-comp-colonne-plus | r6n2 p4 + L14 (Nelson Sauvin) | feuille avec α, rôle, « 67 % de ses mots hors des 12 familles : vin blanc… » | différent | liste de six noms sans aperçu : l'α et les mots hors familles de Nelson Sauvin se perdent avant l'ajout |

### Acquis
| id | ses mots | écart |
|---|---|---|
| etat-acquis-r6n2-dock | « r6n2 donne vraiment bien » (23.10) | absent : le dock Défi · Égaler · Valeurs · Preuve · Frise · Souche est remplacé par trois boutons (Chimie, Égaler, Panel OSU) |
| etat-acquis-levure-bio-cumul | D96 | absent : ni levure ni pastilles bio dans Suggérer, ni biotransformation dans Comparer |
| etat-acquis-maniere-w2 | « pas trop mal dans la manière de comparé » (20.10) | absent, mais r6a (choisie) ne le reprend pas non plus : question au pilote |
| etat-acquis-radars-m4-h4 | « Radar: m4 h4 très bien » | différent : en mode Radar de Ma bière, la grille de dégustation m4 (pas senti · faible · moyen · marqué) manque ; à recouper avec p21a |
| etat-acquis-barres-l5b, -q2b-suite-s5 | D92, « C'est effectivement qb2 reprise le mieux » | différent : en Suggérer, la barre l5b à droite de l'axe central est un rail sous la ligne (Comparer garde les barres) |
| etat-acquis-r6a-elements-notes | « reprendre trop peu d'éléments que j'avais noté » (22.10) | différent : critère, défi, tirage, frise, pastilles levure, jauge d'amertume non repris |
| etat-acquis-theme-blanc-gris-noir | D106 | différent, mineur : fond blanc tenu, texte mesuré rgb(51,51,51) contre rgb(22,22,26) |

## Tables complètes
Tous les états (id, ses mots, choisie, 5345f6ad, écart mesuré, verdict) sont dans les trois JSON. Résumé des présents :
- Suggérer présents : croix (D109), absolu, hors houblon, « + » vers Comparer, barre « Comparer (n) », fiche à l'appui long, bandeau IBU collé, légende « ? ».
- Comparer présents : repos (forme r6a, radar, colonnes), croix, absolu, retenir une colonne, chimie, égaler, panel OSU (replié, D114), pont « Placer … › » vers Dryhopper, fiche, légende, étapes 60′ / 10′ / dry hop (x3b), état à chaque ajout, référence Nugget.
- Acquis présents (18) : couleur des arômes, glisser le moment (rail : voie p20), disposition l8, Comparer v3, fiche g1 et Citra cryo, « + » (s5), y1b (Dryhopper, choix ouvert), panel OSU, vraies valeurs v1, picto épicé, maquette jouable, 80 mots (mesuré : Suggérer 67, Comparer 68), au style / absolu, « ~ simulé », croix, stock en icône, bascule barres / radar.

## Mesures
- Mots du premier écran à 390 × 844 : Suggérer q2b 52, 5345f6ad 67 ; Comparer r6a 74, 5345f6ad 68 (seuil 80).
- Croix : la maquette ouvre `#/ma-biere` (étape Houblons) depuis Suggérer et Comparer. « Comparer (n) » ouvre `#/comparer?h=motueka,idaho-7`. « Placer Idaho 7 › » ouvre `#/dryhopper/idaho-7-1`.
- Absolu : l'effet du groupe passe de ~+0,9 à ~+16.

## Améliorations de la maquette qui ne contredisent pas ses choix
- Bandeau IBU / OG / EBC collé sous la tête de Suggérer ; réponse « ★ Idaho 7 devant Cascade ~+0,4 cran » en tête de Comparer ; « contre ★ » chiffré en retenant une autre colonne ; plus de 4 remplaçants (cinq) ; pont « Placer … › » direct vers Dryhopper avec le houblon.

## Critères
- G1 : `ETATS-BIEN` (18 / 19 / 26 états, captures existantes, verdicts rendus) — essai 1 après correction du script de génération.
- G2, G3 : voir ci-dessous (rejoués en fin de tour).

## Essais, doutes et limites
- Pas de relevé à 1280 px : sa maquette choisie (q2b, r6a, x3b) est dessinée à 390 px ; non joué.
- « Choisie » : q2b `etat-b.html` et r6a `etat.html` sont des pages statiques. Quand le geste n'y existe pas (Radar, fiche, ♡), la capture choisie vient de la page de la base v4.10 qui le montre (`suggestions-radar.html`, `etat-b.html`, `fiche.html`) ; chaque entrée le dit dans `jeu.selecteur_geste_choisie`. Pour r6n2 (défi, critère, preuve, frise, colonne +), la capture choisie est r6n2, que ses mots du 23.10 valident.
- La « fiche courte Citra cryo » est jouée par l'appui long sur la ligne Citra cryo de Suggérer ; son contenu (α 10–15 % · lot 24,8 %, 1/1) est celui du choix.
- Un caractère `\b` écrit par l'éditeur est devenu un contrôle (M10) dans mon premier script : corrigé sans backslash. Aucune écriture hors de « Possède » (`pistes-l5f.png` à la racine existait avant la voie).
- Le rail (glisser par 5′) et Ma bière sont relevés par p19, p20, p21a ; ici une seule capture de contexte.

DÉCISION À PRENDRE : faut-il remettre dans la maquette les éléments perdus ? Options : (a) rétablir tout ce qui figure dans ses maquettes choisies (groupe levure, volet IBU par voie, dry hop actif avec pastilles, « ‹ 10′ › » et « Appliquer » du mode Radar, menu exclure, aperçu de la colonne +, dock r6n2) ; (b) rétablir seulement ce qu'il a validé en toutes lettres (q2b : levure, IBU par voie, dry hop actif, barres l5b sur l'axe, 3 cartes ; r6n2 : dock) et poser le reste en variantes (L24). Recommandation : (b), dans cet ordre : barres l5b sur l'axe central (Suggérer), dock r6n2 et ses quatre éléments (Comparer), levure et dry hop actif, puis le mode Radar. Levure restant un écran au choix ouvert, son groupe se tranche avec le brasseur.

CONNAISSANCE : en Suggérer, 5345f6ad a remplacé la barre l5b à droite d'un axe central par un rail sous chaque ligne, et supprimé le deuxième groupe « même effet » : ces deux écarts expliquent l'impression que la liste « a perdu » ses barres (D124).

LEÇON PROPOSÉE : un inventaire d'écran choisi doit lister les états atteints par un geste (onglet, « + », réglage, appui) avec une capture par état ; à 5345f6ad, 10 écarts sur 18 en Suggérer et 6 sur 19 en Comparer ne se voyaient qu'après un geste ou plus bas dans la page.
