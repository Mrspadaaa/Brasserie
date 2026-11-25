RESULTAT reel-77 : 29 problèmes (B 6, m 23, D 3) — corrigés rejoués 18/39 tenus (R73 14/31, R75 4/8), 21 rouverts — carnet identique oui — BUGS OK

# Voie reel-77 : ses carnets réels, en lecture seule, tour 77 (25.11)

- Version : paquet servi `index-CC3nR2pp.js`. Vérifié par curl au départ, puis dans la page servie avant et après (= DOSSIER). Le VOIE.md disait index-SSQ_J86L.js et « tour 73 » : c'est le DOSSIER qui prime. Le service worker a été contourné (CDP `Network.setBypassServiceWorker`).
- Où : https://brasserie-l-affinee.web.app, Chrome de débug 9222, mon onglet (fermé à la fin par page.close() puis disconnect), 390 × 844, toucher.
- Tests : sans objet (test d'écran). Contrôle du registre dans `bugs.log` : « BUGS OK : 2436 bugs, 613 ouverts, 202 sources ».

## Lecture seule : données identiques, oui
- Garde dans l'onglet :
  - tout POST vers les fonctions et l'IA est bloqué ;
  - toute écriture Firestore est annulée et journalisée ;
  - toucher refuse toute cible Reclasser, Laisser, Relire, Escalader, Monter, Descendre, Poser le prix, Veille, ainsi que le bouton vert du Choisir.
- Résultat : 0 appel IA, 0 « Enregistrement… » de mon fait, aucune ligne au journal IA, carte « Reclasser ce carnet ? » jamais touchée.
- Relevé avant (`avant.json`) puis après (`apres.json`), même paquet :
  - cache Firestore : 3 525 documents hors ZZ, 0 changé, 0 neuf, 0 absent ;
  - texte de la liste dépliée identique ; puces identiques (À venir 11, Carnets 32, Réalisés 5, 7 je cherche, 8 décidés, 0 notés, 5 résolus) ;
  - barres de la frise : les 16 sont identiques à celles de reel-75 (apres). Après, seules 5 sont visibles, toutes comprises dans les 16 : à 10:40:12, cal-77 a passé la période à « 1 sem. » pour son propre test ;
  - « CHF à dépenser » : −463 → −458 → −463. Le −458 vient de la vente ZZ « k77 ventes » (+5) que cal-77 a créée puis supprimée ;
  - par rapport à reel-75, 2 entrées de plus dans le cache : `creativeItems/CR-136ff25e…` et `CR-f9082ee4…`. Ce sont des pierres tombales (noDocument), des ZZ de cal-77 supprimés. Aucune donnée à lui.
- **À dire au pilote : ma garde a gêné cal-77.**
  - La persistance Firestore est partagée entre les onglets du profil. Mon onglet a relayé, et donc bloqué, des écritures ZZ de cal-77 :
    - `creativeItems` de 10:31:16 à 10:34:51 (« ZZ TEST — k77 fêtes ») ;
    - `financialPlans/PLAN-eaceb526…` à 10:39:18 (« ZZ TEST — k77 ventes »).
  - Ces écritures sont parties ensuite par un autre onglet : la file `mutations` était vide à 10:37.
  - Conséquence : les durées « Enregistrement… » mesurées par cal-77 pendant ces deux créneaux sont faussées (8 462 ms à 10:39). Il faut les rejouer ou les écarter.
  - Remède pour la suite : ne pas lancer en même temps une voie qui garde en lecture seule et une voie qui écrit, dans le même profil Chrome.

## Couverture
- Ses 32 carnets se répartissent en 16 à lui et 16 ZZ. Les 16 siens ont tous été ouverts (`tous-sortie.json`) :
  - Houblons citra et Chambre froide en entier : carnet défilé, chaque fiche, Choisir ouvert puis Retour, Comparer, Quand ouvert puis Fermer ;
  - les 14 autres : carnet, fil et Quand.
- ZZ malt pilsner et ZZ pompe, pour les mettre côte à côte avec ses plaintes : `zz-sortie.json`.
- Liste :
  - au repos ;
  - filtrée « je cherche », avec repli de domaine et de sous-domaine ;
  - Résolus, avec un résolu ouvert (Sol, murs) ;
  - Anciennes notes ;
  - À faire.
- Non couvert : la cloche. Ma garde a refusé le bouton « Veilles : 0 », la règle /^Veille/ étant trop large. R73-31 n'est donc rejoué que sous À faire.
- Captures ouvertes :
  - Houblons citra : `cap/C01-carnet`, `C01-f1`, `C01-f1-s1`, `C01-f1-choisir`, `C01-f2`, `C01-f2-choisir`, `C01-comparer`, `C01-comparer-s1`, `C01-quand` ;
  - Chambre froide : `cap/C02-carnet`, `C02-carnet-s1`, `C02-f1`, `C02-f1-choisir`, `C02-f1-choisir-s1`, `C02-comparer`, `C02-comparer-s1` ;
  - planches : `pl/C1` à `pl/C4` (C03 à C16, Z01, Z02), `pl/Q1` (Quand), `pl/V1`, `pl/V2`, `pl/X` ;
  - ses plaintes du 25.11 : citra-fiche, citra-carnet, carnet-liste-compact, carnet-priorite ;
  - maquettes : maquettes2 `v01-fiche` et `v01-carnet`, maquettes3 `v01-liste`.

## Rejeu du tour 77 (c75-fix)
- Carte « Reclasser ce carnet ? » : présente sur ZZ malt pilsner et ZZ pompe, avec « Rien n'est écrit avant votre OK » (`pl/C4`). Elle n'a pas été touchée. Elle n'apparaît sur aucun de ses 16 carnets (voir D1).
- Citra au conditionnement : la table « je prends · prix · CHF/kg rendu » est là ; 50 g ✓ 3,72 € ≈ 73,8 ; 250 g et 500 g « prix à relire ». « Choisir · MotlerHops, 50 g » et « Part dans À venir : ≈3,69 CHF » concordent. Plus aucun « 1 kg » sans prix.
- Quand avec l'année : tenu pour Embouteillage (« 1 mai 2027 ») et pour les projets 2027. Pas tenu pour Frigo (« S17 ») ni pour le résolu Sol, murs (« S50 »).

## R73 : 14 tenus sur 31, 17 rouverts
Je ne possède pas les lignes R73 et R75 de BUGS.md : le pilote y porte le statut.
- Tenus, « vérifié — en ligne index-CC3nR2pp.js (tour 77) » :
  - R73-1 : ≈73,8 au tableau, Brau « à relire » ;
  - R73-2 : rang 1 = MotlerHops, Brau « ? » ;
  - R73-3 : plus aucun 0,10 ;
  - R73-4 : la table des conditionnements est là, les prix inconnus sont dits « à relire » ;
  - R73-5 : 50 g et ≈3,69 CHF partout ;
  - R73-6 : sa note est sur la fiche (« dispo douteuse · ta note ») et dans Comparer ;
  - R73-7 : α « 10–15 % » serré dans Comparer ;
  - R73-11 : « 5 différents », « 4 différents » ;
  - R73-16 : plus de lien brut ;
  - R73-22 : « Budget … · du Planning » ;
  - R73-26 : Quand sans « prix ? » ;
  - R73-27 : le résolu n'affiche plus la durée ;
  - R73-28 : liste dense ;
  - R73-29 : sous filtre, les en-têtes se replient et se déplient (V-2, V-3, X-2, X-3).
- Rouverts : R73-8, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 30, 31 (détail ci-dessous).

## R75 : 4 tenus sur 8, 4 rouverts
- Tenus :
  - R75-1 : ZZ malt pilsner n'a plus d'article ; ZZ pompe n'a plus de critère ;
  - R75-2 : un fil ancien se voit proposer « Reclasser » ;
  - R75-4 : ≈73,8 sur toutes les surfaces ;
  - R75-5 : le Choisir de Brau dit « Part dans À venir : prix à relire », le pourquoi est vide.
- Rouverts : R75-3, R75-6, R75-7, R75-8.
- Lignes possédées : C61-4 passe à « vérifié — en ligne index-CC3nR2pp.js (tour 77) ». C59-6 et PX-1 restaient vérifiés et le sont encore ; je ne les ai pas réécrits.

## Combien et quels problèmes ? 29 : 21 rouverts et 8 neufs (B 6, m 23)
Gravité : B = bloquant (geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible) ; m = mineur.

**A. Ses données anciennes, ni recalculées ni rangées** (CARNET-SES-DONNEES-EXISTANTES)
1. B — Houblons citra : la fiche MotlerHops dit « Non publié par le vendeur : Arômes », sans puce. Comparer met « ? » en Arômes pour MotlerHops. Le carnet affiche pourtant « citron vert, mangue, fruits tropicaux », et c'est la même variété. Sa maquette v01-fiche montre les puces d'arômes (C01-f1-s1, C01-comparer). **R77-2**
2. B — Quand : Frigo + congel dit « S17 » sans 2027 (le Planning va du 01.08.2026 au 01.05.2027). Le résolu Sol, murs dit « S50 » sans 2025 (C05-carnet, X-5). Embouteillage est tenu. R73-25
3. m — Frigo + congel et Armoire malte : liens réduits au domaine (« galaxus.ch », « digitec.ch », « brack.ch » ×2, « landi.ch »), ni lus ni marqués « non lu » (pl/C1, pl/C3). R73-17 et R75-7
4. m — Sol : pastille « Idée · 3 sept. », alors que sa bulle dit « En cours au 20.11.2026 » et que Quand dit « passé · S21 ». Trois états contraires. Les 9 carnets « Dans À venir » sont désormais « Décidé », c'est tenu (pl/C2). R73-24
5. m — Les deux Jalons : la 1re bulle redit le titre (« Jalon — … Jalon du Planning, sans date »). Les autres carnets sont tenus : leur bulle ne donne plus que les dates (pl/C2, pl/C4). R73-23

**B. Présentation : unités, chiffres, textes, place**
6. B — Comparer Houblons : la ligne « prix CHF » affiche ≈73,8, qui est le prix au kilo, alors que le sachet de 50 g coûte ≈3,69 CHF. Un brasseur lit « 73,8 CHF » (C01-comparer). **R77-1**
7. m — Choisir de Brau : la carte de MotlerHops dit « 3,72 » sans unité (en €), alors que partout ailleurs c'est ≈3,69 CHF (C01-f2-choisir). **R77-3**
8. m — Rang de Brau : « ? » au tableau, mais « 2 » sous le Choisir de MotlerHops (C01-carnet, C01-f1-choisir). **R77-4**
9. m — Comparer Houblons : la bande prix fait ≈140 px (cadre « ? », Relire et Escalader empilés) et le tableau commence sous la moitié de l'écran (C01-comparer). **R77-5**
10. m — Liste filtrée : « à comparer · 2697,7… », sans espace de milliers et coupé (V-1, X-1). **R77-6**
11. m — Brau s'appelle « Brau » au tableau, « Brau- und Rauchshop » ailleurs ; son bouton vert passe sur deux lignes (C01-f2-choisir). **R77-7**
12. m — Sa note dans le fil n'a pas l'étiquette « rattachée à MotlerHops » de sa maquette v01-carnet (C01-carnet). **R77-8**
13. m — Bloc Offre : environ 40 px vides entre « en stock » et le crayon ou Ouvrir, sur les 4 fiches (C01-f1, C01-f2, C02-f1). R73-8
14. m — Textes redits :
    - Brau : arômes dits 3 fois (puces, Caractéristiques, Choisir) ;
    - Chambre froide : 2 697,74 dit 3 fois au Choisir ;
    - fiche MotlerHops : « 50 g · ≈73,8 CHF/kg · TVA d'import » dans la table, puis à nouveau sous l'Offre (C01-f1, C01-f2, C02-f1-choisir). R73-9
15. m — Choisir de Chambre froide : « place parmi les 2 » et « 2 988 CHF » coupés au bord droit ; « CHF » passe à la ligne sous 2 697,74 (C02-f1-choisir). R73-10
16. m — Chambre froide : deux « 1 » contraires, 2,6 m³ au tableau et au prix, 4,06 m³ au prix au m³. Le « Compromis » l'explique, mais deux pastilles « 1 » restent (C02-carnet-s1, C02-comparer-s1). R73-12
17. m — Comparer de Chambre froide : bouton vert, mais « Choisir » sans nom. Celui des Houblons est nommé (C02-comparer-s1). R73-13
18. m — Fiches de Chambre froide : photo minuscule au centre d'un bandeau gris (C02-f1). R73-14
19. m — Tableau de Chambre froide : colonne article d'environ 70 px, mots coupés (« frigorifiq / ue ») sur 8 lignes (C02-carnet). R75-3
20. m — Chasse fixe sur du texte : « 0 à 8 °C », « 550 Watt », « 1N~/PE », « 230 V » au Choisir ; « 20.11.2026 » dans Anciennes notes (C02-f1-choisir, pl/V2). R75-6

**C. Disposition, ouverture**
21. m — Quand ouvert dans un carnet long : puces coupées sous le champ, réglette et « Au calendrier » hors de vue (Houblons citra, Chambre froide, Frigo) (C01-quand, pl/Q1). R73-15
22. m — Chambre froide s'ouvre au milieu du tableau ; titre et en-tête hors de vue (C02-carnet). R73-18

**D. Tests ZZ écrits dans ses carnets** (il faut une écriture pour les retirer, hors de cette voie)
23. B — Chambre froide : « ZZ TEST — M3 — cellule de garde 2,6 m3 » et « gastro-held.ch » (C02-carnet-s1). R73-19
24. B — Achat brasserie : « Achat prévu fin du mois. » (pl/C1). R73-20
25. B — Sol : « ZZ TEST — c69 mémo… » (pl/C2). R73-21

**E. Import du Planning**
26. m — Quand a deux formes : « S29 · 300 CHF estimé » contre « 1 sept. 2027 · 400 CHF · budget ». Quand ouvert d'Embouteillage écrit « 2500 CHF estimé » sans espace, alors que le carnet dit « Budget 2 500 CHF » (pl/C1, pl/C2, pl/Q1). R75-8

**F. Liste des carnets**
27. m — Au repos, chaque sous-domaine affiche un ZZ TEST en titre, et Houblons citra et Chambre froide ne se voient pas. Filtrés, ils restent sous les ZZ. Sa maquette v01-liste montre ses carnets en lignes pleines (V-0, V-1 ; plainte carnet-priorite). R73-30
28. m — Anciennes notes de l'Atelier reste sous la liste À faire (V-6, V-6-s1). Sous la cloche : non rejoué. R73-31

Total : 28 lignes numérotées. Le n° 3 regroupe deux identifiants (R73-17 et R75-7), d'où 29 problèmes comptés. B = 6 (nos 1, 2, 6, 23, 24, 25).

**Doutes (non comptés)**
- D1 — Aucun de ses 16 carnets ne reçoit la carte « Reclasser ». Pourtant Sol (Idée / En cours / passé) est visiblement mal rangé.
- D2 — La réglette Quand d'Embouteillage (« juin · juil. · août ») ne dit pas 2027.
- D3 — Une nouvelle rubrique « À ranger 4 » apparaît dans la liste au repos (que des ZZ). Elle n'est pas dans sa maquette v01-liste. À juger quand ses vrais carnets y passeront.

## Côte à côte avec ses plaintes du 25.11
- citra-fiche :
  - tenu : α serré (« 10–15 % »), table des conditionnements, prix cohérent à 50 g ;
  - reste : le bloc Offre vide (13) et les arômes absents (1).
- citra-carnet : tenu (CHF/kg ≈73,8, Brau « à relire », plus de lien brut).
- carnet-liste-compact : tenu (liste dense, repli sous filtre).
- carnet-priorite : non tenu, ses carnets restent sous les ZZ (27).

## Fichiers
- Scripts (repris de reel-75) :
  - `outil.mjs`, avec un garde-geste dans `toucher` ;
  - `garde.mjs`, qui journalise les documents visés ;
  - `liste.mjs` et `commun.mjs`, plus robustes ;
  - `idb.mjs` et `idb2.mjs` : lecture seule de la file d'écritures et du cache, dans une page vide sans l'app ;
  - `verser.cjs`.
- Sorties : `avant.json`, `apres.json`, `tous-sortie.json`, `zz-sortie.json`, `vues-liste.json`, `extra.json`, `idb.json`, `journal.txt`, `bugs.log`.
- BUGS.md : R77-1 à R77-8 versés après R75-8 ; C61-4 passé à vérifié.

LEÇON PROPOSÉE : un test d'écran gardé en lecture seule ne tourne pas en même temps qu'une voie qui écrit dans le même profil Chrome. La persistance Firestore est partagée entre onglets : le 25.11, l'onglet gardé de reel-77 a relayé et bloqué les écritures ZZ de cal-77 (creativeItems, financialPlans) et faussé ses mesures d'« Enregistrement… ».
