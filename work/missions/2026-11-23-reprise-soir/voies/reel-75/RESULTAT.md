RESULTAT reel-75 : 30 problèmes (B 8, m 22, D 3) — corrigés rejoués 9/31 tenus (R73), 22 rouverts — carnet identique oui — BUGS OK

# Voie reel-75 : ses carnets réels, en lecture seule, tour 75 (25.11)

Version : paquet servi `index-DLKIyTrR.js` (curl au départ, et page servie avant et après). Le VOIE.md disait index-SSQ_J86L.js : c'est le DOSSIER qui prime. Le service worker de l'onglet servait encore index-L94x-z-O.js (tour 73) : il a été contourné (CDP `Network.setBypassServiceWorker`), sans aucune donnée touchée.
Où : https://brasserie-l-affinee.web.app, Chrome de débug 9222, mon onglet (fermé à la fin par page.close() puis disconnect), 390 × 844, toucher.
Tests : sans objet (test d'écran). Contrôle du registre : `bugs.log`, « BUGS OK : 2428 bugs, 606 ouverts, 202 sources ».

## Lecture seule : données identiques, oui
- Garde dans l'onglet : tout POST vers les fonctions et l'IA est bloqué (aiTask, carnetIA, getBrewerActivity, syncFinancialLedger), ainsi que toute écriture Firestore (update, delete ou transform : la requête est annulée et journalisée). Résultat : 0 écriture tentée, 0 « Enregistrement… », 0 appel IA, aucune ligne au journal IA.
- Gestes faits : ouvrir, défiler, toucher une ligne, Choisir ouvert puis Retour (jamais le bouton vert de l'écran Choisir), Quand ouvert puis Fermer (jamais une puce), filtres, en-têtes, onglets. Jamais : Relire, Escalader, Poser le prix, Veille, menu ⋯, ni priorité.
- Avant et après (`avant.json`, `apres.json`), sur le même paquet :
  - « −463 CHF à dépenser sans passer sous 0 (S53) » ; période « 6 sem. » ;
  - les 16 barres de la frise (hors ZZ) sont identiques ;
  - puces identiques : À venir 11, Carnets 32, Réalisés 5, 8 je cherche, 0 décidés, 0 notés, 5 résolus ;
  - le texte de la liste dépliée est identique, à une ligne près : le bandeau « Synchronisation comptable : internal », un artefact de ma garde ;
  - cache Firestore : 3 523 documents hors ZZ, 0 empreinte ni updateTime changés, 0 document neuf.
- Le filtre « je cherche » que mes vues avaient laissé actif a été retiré avant le relevé après (journal : « filtre retiré »).

## Couverture
- Ses 32 carnets se décomposent en 16 carnets à lui et 16 ZZ TEST. Les 16 siens ont tous été ouverts (C01 à C16, `tous-sortie.json`) :
  - Houblons citra et Chambre froide en entier : carnet, chaque fiche, Choisir ouvert puis fermé pour chaque fiche, Comparer, Quand ;
  - les 14 autres : carnet, fil et Quand (ils n'ont aucun article).
- Autres vues :
  - 1 résolu ouvert sur 5 (Sol, murs…) ; les 5 vus dans la liste « résolus 2026 » ;
  - Anciennes notes, À faire, cloche ;
  - la liste au repos, puis filtrée, avec repli d'un domaine et d'un sous-domaine sous filtre.
- Pour les mettre côte à côte avec ses plaintes, les deux carnets ZZ de ses captures du 25.11 (malt pilsner, pompe qui chauffe) ont été ouverts en lecture seule.
- Planches ouvertes, toutes à 390 :
  - ses plaintes : `pl/plaintes-a.png`, `pl/plaintes-b.png` ;
  - Houblons citra : `pl/K01a.png`, `pl/K01b.png` ;
  - Chambre froide : `pl/K02a.png`, `pl/K02b.png`, `pl/K02c.png` ;
  - autres carnets : `pl/C1.png`, `pl/C2.png`, `pl/C3.png` ;
  - liste : `pl/V1.png`, `pl/V2.png`, `pl/X.png` ;
  - ZZ de ses plaintes : `pl/Z.png` ;
  - pièces seules : `cap/C01-f2.png`, `cap/C01-f2-choisir.png`, `cap/C03-carnet.png`, `cap/C04-carnet.png`, `cap/C05-carnet.png`, `cap/C07-carnet.png`.
- Maquettes choisies de comparaison : maquettes2 `v01-fiche` et `v01-carnet` ; maquettes3 `v01-liste`.

## Rejeu des R73 : 9 tenus sur 31, 22 rouverts
Les 9 tenus, vérifiés en ligne sur index-DLKIyTrR.js :
- R73-1 : le tableau dit ≈73,9 pour MotlerHops et « à relire » pour Brau, plus aucun « ? » à côté d'une valeur connue (C01-carnet).
- R73-2 : le rang 1 est MotlerHops, sur une base CHF/kg ; Brau n'a pas de rang, marqué « ? ».
- R73-3 : plus aucun « 0,10 » ni sur la fiche ni au Choisir (C01-f2, C01-f2-choisir).
- R73-16 : plus aucun lien brut dans les fils, il ne reste que domaine et titre.
- R73-22 : « Budget 300 CHF · du Planning », hors de la ligne Critère.
- R73-26 : Quand dit « 300 CHF estimé » ou « 400 CHF · budget », plus de « prix ? ».
- R73-27 : le résolu n'affiche plus « durée 78 jours » ni « Toujours le bon choix ? » (X-5).
- R73-28 : la liste au repos est compacte, avec environ 20 lignes visibles (V-0).
- R73-29 : sous filtre, Brasserie et Brassage se replient et se déplient (V-2, X-2, X-3).

Les 22 rouverts :
- R73-4 (B) : la fiche CITRA n'a pas la table des conditionnements ; elle affiche « ≈4 CHF rendu » pour 50 g, et 250 g et 500 g restent sans prix.
- R73-5 (B, gravité relevée) : le bouton dit « Choisir · MotlerHops, 1 kg », mais l'écran Choisir dit « Part dans À venir : ≈4 CHF », soit le prix des 50 g.
- R73-6 : sa note « Semble difficile… » n'est pas sur la fiche MotlerHops.
- R73-7 : Comparer affiche encore « 10 % - 15 % » espacé.
- R73-8 : le bloc Offre garde environ 40 px de vide (les 4 fiches).
- R73-9 : au Choisir, MotlerHops et « en stock » sont redits 4 fois ; chez Brau, les arômes sont dits 3 fois.
- R73-10 : « place parmi les 2 » et « 2 988 CHF » sont toujours coupés au Choisir de Chambre froide. Les « + 13 autres valeurs » repliées, elles, sont un progrès.
- R73-11 : « 5 différent », « 4 différent ».
- R73-12 : Chambre froide garde deux « 1 » contraires.
- R73-13 : le bouton Choisir de Comparer est noir ; il est sans nom pour Chambre froide.
- R73-14 : photo minuscule au milieu d'un bandeau gris.
- R73-15 : Quand reste caché sous le champ dans les carnets longs. Il est tenu dans les carnets courts.
- R73-17 : les liens de Frigo et de l'armoire malte ne sont ni lus ni marqués « non lu ».
- R73-18 : Chambre froide s'ouvre au milieu du tableau. Houblons citra, lui, s'ouvre en haut.
- R73-19, R73-20, R73-21 (B) : ZZ M3 avec gastro-held.ch, « Achat prévu fin du mois. » et ZZ c69 sont toujours dans ses fils.
- R73-23 : la 1re bulle redit titre, budget et dates sur les 13 carnets du Planning et sur le résolu.
- R73-24 : la pastille « Idée · 3 sept. » reste sur les 9 carnets « Dans À venir », et sur Sol, qui est « En cours ».
- R73-25 (B) : Quand dit « S26 » pour Embouteillage et « S17 » pour Frigo, sans 2027, alors que À faire dit « dès le 1 mai 2027 » ; le résolu Sol, murs dit « S50 » sans 2025.
- R73-30 : en tête de chaque sous-domaine, un ZZ TEST ; Houblons citra et Chambre froide sont invisibles au repos (V-0), et sous les ZZ avec le filtre (X-1).
- R73-31 : Anciennes notes s'affiche encore sous À faire et sous la cloche.

Je ne possède pas les lignes R73-n de BUGS.md : je n'y ai pas touché. Statut à y porter :
- pour les 9 tenus : « vérifié — en ligne index-DLKIyTrR.js (tour 75), 25.11 (preuve : voies/reel-75/RESULTAT.md) » ;
- pour les 22 autres : « rouvert en ligne index-DLKIyTrR.js (tour 75) ».

Lignes possédées mises à jour :
- C59-6 vérifié (plus aucun 0,10) ;
- PX-1 vérifié, cœur corrigé (les restes vont à R73-4 et R73-5) ;
- C61-4 rouvert (1 kg contre ≈4 CHF).

## Combien et quels problèmes ? 30 : 22 rouverts et 8 neufs (B 8, m 22)
Gravité : B est un bloquant (geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible), m un mineur.

**A. Ses données anciennes, ni recalculées ni rangées** (CARNET-SES-DONNEES-EXISTANTES)
1. B — Houblons citra, fiche CITRA : la table « je prends · prix · CHF/kg rendu » de sa maquette v01-fiche est absente ; « ≈4 CHF rendu » pour 50 g ; 250 g et 500 g sans prix (K01-f1). R73-4
2. B — Houblons citra : « Choisir · MotlerHops, 1 kg » envoie « ≈4 CHF » dans À venir, soit le prix des 50 g (K01-f1, K01-f1-choisir). R73-5
3. m — Houblons citra : sa note « Semble difficile à obtenir sur le site français » n'est pas rattachée à la fiche MotlerHops ; sa maquette la montre, avec « dispo ? » (C01-carnet, K01-f1). R73-6
4. m — Frigo + congel et Armoire malte : leurs liens ne sont ni lus en articles ni marqués « non lu » (C05, C12). R73-17
5. B — ZZ malt pilsner et ZZ pompe : ses plaintes du 25.11 se rejouent à l'identique. La note reste montrée en article (« Articles 1 : Autre fournisseur… 4 CHF ») et en critère (« Critère : La pompe… brûlante… ») (Z01, Z02). R75-1
6. B — Aucun fil ancien rangé proposé : malt pilsner garde ses bulles brutes avec la pastille « À comparer », alors que « Commandé 2 sacs chez l'autre » vaut un résolu ; pompe : « … Résolu. » n'amène aucune proposition. Aucun « Ranger » dans les 18 carnets ouverts (Z01, Z01-s1, Z02 ; plainte notes-vrac). R75-2
7. m — Brau : la fiche dit « prix ? », mais « Choisir · Brau » est en vert ; l'écran Choisir n'a aucun prix, et son pourquoi n'est que « Brau- und Rauchshop. » (C01-f2, C01-f2-choisir). R75-5
8. m — Frigo et Armoire malte : liens réduits au domaine (« galaxus.ch », « digitec.ch », « brack.ch » ×2, « landi.ch ») ; on ne sait plus quel frigo (C05, C12). R75-7

**B. Présentation : textes, chiffres, place**
9. m — Comparer Houblons : α « 10 % - 15 % » espacé, alors que le tableau et la fiche disent « 10–15 » (K01-comparer). R73-7
10. m — Bloc Offre : environ 40 px vides entre « en stock » et le crayon ou Ouvrir ; Brau : 3 lignes vides (K01-f1, K02-f1, C01-f2). R73-8
11. m — Textes redits : MotlerHops et « en stock » 4 fois au Choisir ; arômes 3 fois chez Brau (puces, Caractéristiques, Choisir) ; prix 3 fois au Choisir de Chambre froide (K01-f1-choisir, C01-f2, K02-f1-choisir). R73-9
12. m — Choisir de Chambre froide : « place parmi les 2 » et « 2 988 CHF » coupés par le cadre (K02-f1-choisir, K02-f2-choisir). R73-10
13. m — Comparer : « 5 différent » (Houblons), « 4 différent » (Chambre froide). R73-11
14. m — Comparer de Chambre froide : bouton noir « Choisir » sans nom ; celui de Houblons est nommé mais noir, alors qu'il est vert sur la fiche (K02-comparer-s1, K01-comparer-s1). R73-13
15. m — Fiches de Chambre froide : photo minuscule au centre d'un bandeau gris (K02-f1, K02-f2). R73-14
16. m — Tableau de Chambre froide : colonne article d'environ 70 px, mots coupés (« frigorifiq / ue », « m / m ») sur 8 lignes (K02-carnet). R75-3
17. m — Même prix au kilo écrit « ≈73,9 » au tableau et à Comparer, « 73,80 CHF/kg » sur la fiche et au Choisir. R75-4
18. m — Texte en chasse fixe espacée : « États-Unis », « Air pulsé », « 0 à 8 °C » au Choisir ; « 20.11.2026 » dans Anciennes notes (C01-f2-choisir, K02-f1-choisir, V-5). R75-6

**C. Disposition, ouverture**
19. m — Chambre froide : deux « 1 » contraires (tableau 1 = 2,6 m³ ; « Prix au m³ » 1 = 4,06 m³), dans le carnet et dans Comparer (K02-carnet, K02-comparer-s1). R73-12
20. m — Quand ouvert dans un carnet long (Houblons citra, Chambre froide) : puces coupées sous le champ, réglette et « Au calendrier » hors de vue (C01-quand, K02-quand). R73-15
21. m — Chambre froide s'ouvre au milieu du tableau ; titre et en-tête hors de vue (K02-carnet). R73-18

**D. Tests ZZ écrits dans ses carnets** (une écriture est nécessaire pour les retirer, hors de cette voie)
22. B — Chambre froide : « ZZ TEST — M3 — cellule de garde 2,6 m3 » et « gastro-held.ch » (K02-carnet, K02-carnet-s1). R73-19
23. B — Achat brasserie : « Achat prévu fin du mois. » (C03-carnet). R73-20
24. B — Sol : « ZZ TEST — c69 mémo… » (C07-carnet). R73-21

**E. Import du Planning**
25. m — 1re bulle qui redit titre, budget, dates et « (Planning, Équipements) », sur 13 carnets et sur le résolu (C1 à C3, X-5). R73-23
26. m — Pastille « Idée · 3 sept. » sur les 9 carnets « Dans À venir », et sur Sol « En cours au 20.11.2026 ». R73-24
27. B — Quand : Embouteillage dit « S26 », alors que À faire dit « dès le 1 mai 2027 » ; Frigo dit « S17 », sans 2027 ; Sol, murs dit « S50 », sans 2025 (C04, C04-quand, C05, V-6, X-5). R73-25
28. m — Quand a deux formes : « S26 · 2500 CHF estimé » et « 1 mai 2027 · 1500 CHF · budget » ; « 2500 » s'écrit sans espace sous « Budget 2 500 CHF » ; la semaine est tantôt celle de la fin, tantôt celle du début (Sol S21). R75-8

**F. Liste des carnets**
29. m — Au repos, chaque sous-domaine replié affiche un ZZ TEST en titre ; Houblons citra et Chambre froide ne se voient pas. Filtrés, ils restent sous les ZZ (V-0, X-1 ; plainte carnet-priorite). R73-30
30. m — Anciennes notes de l'Atelier s'affiche sous la liste À faire et sous « Aucune veille demandée » (V-6, V-7). R73-31

**Doutes (non comptés)**
- D1 — « Synchronisation comptable : internal · Actualiser » couvre le champ « Ajouter à… ». La cause en est ma garde, qui bloque syncFinancialLedger. Mais si la synchro échoue vraiment chez lui, le code brut « internal » s'affiche sur le champ.
- D2 — La réglette Quand d'Embouteillage (juin · juil. · août) ne dit pas 2027.
- D3 — Liste au repos : les lignes de sous-domaine (« Brassage 5 ZZ TEST — … ») comptent-elles comme lignes de carnets au contrôle CARNET-LISTE-COMPACTE ? Sa maquette v01-liste montre au repos les carnets du premier domaine en lignes pleines.

## Côte à côte avec ses plaintes du 25.11
- citra-fiche : α est serré (« 10–15 % ») et il n'est plus redit dans Caractéristiques. Restent le bloc Offre vide, la table des conditionnements absente, « ≈4 » pour 50 g, et désormais un « 1 kg » qui contredit le prix (1, 2, 10).
- citra-carnet : CHF/kg rempli (≈73,9), Brau « à relire », plus aucun lien brut. Tenu.
- carnet-liste-compact : liste dense, filtre repliable. Tenu ; reste l'ordre (29).
- carnet-priorite : ses carnets restent sous les ZZ (29).
- champ-ouvert : le champ « Ajouter à… » est replié sur une ligne d'environ 41 px. Tenu.
- note-devenue-article, note-devenue-critere : identiques à sa capture (5).
- notes-vrac : identique, rien n'est rangé ni proposé (6).

## Fichiers
- Scripts : `outil.mjs` (avec contournement du service worker), `garde.mjs` (écritures Firestore bloquées), `parcours.mjs` (le rang « ? » est désormais ouvert), `releve.mjs` (filtre remis), `extra.mjs`, `fermer.mjs`, `verser.cjs`.
- Sorties : `avant.json`, `apres.json`, `tous-sortie.json`, `vues-liste.json`, `vues2.json`, `extra.json`, `zz-sortie.json`, `journal.txt`, `bugs.log`.
- BUGS.md : R75-1 à R75-8 versés après R73-31 ; statuts de C59-6, PX-1 et C61-4 mis à jour.

LEÇON PROPOSÉE : un onglet de test en ligne contourne le service worker (CDP Network.setBypassServiceWorker) et note le paquet effectivement servi : le 25.11, le SW servait encore le tour 73 alors que l'hébergement servait le tour 75.
