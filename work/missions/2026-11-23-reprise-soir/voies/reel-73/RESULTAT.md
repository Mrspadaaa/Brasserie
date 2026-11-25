RESULTAT reel-73 : 31 problèmes (B 10, m 21, D 4) — corrigés rejoués 5/8 vérifiés, 3 rouverts — carnet identique oui — BUGS OK

# Voie reel-73 : ses carnets réels, en lecture seule (25.11)

Version : paquet servi `index-L94x-z-O.js` (tour 73), https://brasserie-l-affinee.web.app, Chrome de débug 9222, mon onglet, 390 × 844, toucher.
Tests : sans objet (test d'écran). Contrôle du registre : `bugs.log` → « BUGS OK : 2420 bugs, 600 ouverts, 202 sources ».

## Lecture seule : données identiques, oui
- Garde dans l'onglet : tout POST vers les fonctions et l'IA bloqué (aiTask, carnetIA, et aussi syncFinancialLedger et getBrewerActivity) ; écritures Firestore et avis « Enregistrement… » guettés à chaque vue.
- Gestes : ouvrir, défiler, toucher une ligne, Choisir ouvert puis Retour (jamais le bouton vert de l'écran Choisir), Quand ouvert puis Fermer (jamais une puce), filtre, en-têtes, onglets. Aucun Relire, Escalader, Oui/Pas sûr, Veille, Poser le prix.
- Résultat : 0 écriture Firestore, 0 « Enregistrement… », 0 appel IA (aucune ligne au journal IA).
- Avant et après (`avant.json`, `apres.json`) : même paquet ; « −463 CHF à dépenser… (S53) », « 6 sem. » ; 16 barres de la frise identiques ; pastilles (Carnets 32, 8 je cherche, 0 décidés, 0 notés, 5 résolus) identiques ; texte de la liste dépliée identique ; cache Firestore : 3 523 documents hors ZZ, 0 empreinte changée.

## Couverture
17 carnets actifs ouverts : Houblons citra, Chambre froide (chacun : carnet, 2 fiches, Choisir ouvert puis fermé pour chaque fiche, Comparer, Quand) ; Achat brasserie, Embouteillage, Frigo + congel, Hotte recyclage, Sol, Jalon brasser, 2ème évier, Installation électrique 27A, Extincteur, 3 armoires, Conformité, Jalon conformité (carnet, fil, Quand). Les 5 résolus 2026 ouverts, Anciennes notes, À faire, cloche, liste au repos et filtrée.
Captures ouvertes, en planches de 4 : `pl/K01a-c.png`, `pl/K02a-c.png`, `pl/L1-4.png`, `pl/Lq.png`, `pl/V1-2.png`, `pl/W1-2.png` ; les pièces unitaires sont dans `cap/`. Comparées à ses maquettes choisies (maquettes2 v01-fiche, v01-comparer, v01-articles ; maquettes3 v01-liste) et à ses 4 captures de plainte du 25.11.

## Combien et quels problèmes ? 31, en 6 causes (10 bloquants)
Gravité : B = bloquant (geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible) ; m = mineur. Registre : R73-1 à R73-31.

**A. Ses données lues avant les correctifs, jamais recalculées** (CARNET-SES-DONNEES-EXISTANTES)
1. B — Houblons citra, tableau : CHF/kg « ? » sur les deux lignes, alors que la fiche MotlerHops dit 73,80 CHF/kg et que Comparer l'affiche (K01-carnet, K01-f1). R73-1
2. B — Houblons citra : MotlerHops classé 1er sans base, les deux prix au kilo étant « ? » ; Comparer « Classé par Prix » avec Brau à « ? » (K01-carnet, K01-comparer). R73-2
3. B — Houblons citra, Brau : la fiche dit « prix ? », mais Choisir dit « 0,10 CHF » et « Part dans À venir : 0,10 CHF » (prix du gramme). Une valeur fausse partirait dans À venir (K01-f2, K01-f2-choisir). R73-3
4. B — Fiche MotlerHops : « ≈4 CHF rendu » pour 50 g. Les poids 250 g et 500 g sont listés sans prix, et la table « je prends · prix · CHF/kg » de sa maquette manque (K01-f1). R73-4
5. m — « Choisir · MotlerHops, 1 kg » dans Comparer, alors que le seul prix est pour 50 g ; « Choisir · MotlerHops » sur la fiche, sans quantité. R73-5
6. m — Sa note « Semble difficile à obtenir… » reste dans le fil ; elle n'est pas rattachée à la fiche MotlerHops (sa maquette l'y montre). R73-6

**B. Rendu des valeurs**
7. m — α en chasse fixe espacée : « 10  -  15 », α géant sur la fiche, « 10 % - 15 % » dans Choisir. R73-7
8. m — Bloc Offre : environ 60 px vides, sur les 4 fiches. R73-8
9. m — Textes redits : α trois fois, prix deux fois dans Choisir, et un pourquoi « En stock, MotlerHops. ». R73-9
10. m — Choisir de Chambre froide : 20 caractéristiques recopiées, sur 4 écrans ; « place parmi les 2 », « 1er sur 2 » et « 2 988 CHF » coupés par le cadre (K02-f1-choisir). R73-10
11. m — « 4 différent » dans Comparer (Houblons citra, Chambre froide). R73-11
12. m — Chambre froide : deux « 1 » contraires sur le même écran (moins cher : 2,6 m³ ; prix au m³ : 4,06 m³). R73-12
13. m — Comparer de Chambre froide : bouton noir « Choisir » sans nom. R73-13
14. m — Fiche Chambre froide : photo minuscule dans un bandeau gris pleine largeur. R73-14
15. m — Quand ouvert sur un carnet long : puces, réglette et « Au calendrier » restent sous le champ Ajouter (K01-quand, K02-quand, L03-quand). R73-15

**C. Fil et liens**
16. m — Liens bruts, avec gclid et utm, dans le fil : Houblons citra (2), Chambre froide (3), Frigo + congel (4), Armoire malte (1). R73-16
17. m — Les 4 liens de frigos et le lien landi ne sont jamais devenus des articles, et aucun état « non lu » n'est affiché (L03, L10). R73-17
18. m — Chambre froide s'ouvre au milieu du fil, tableau hors écran ; le titre de Houblons citra est rogné sous les onglets. R73-18

**D. Des tests ZZ ont écrit dans SES carnets** (toujours là)
19. B — Chambre froide : « ZZ TEST — M3 — cellule de garde 2,6 m3 » et le lien gastro-held de ce test (rejoue CA12-M3-1). R73-19
20. B — Achat brasserie : « Achat prévu fin du mois. », phrase du test c64 (rejoue C64-8). R73-20
21. B — Sol : « ZZ TEST — c69 mémo : le sol époxy… », du 25.11 (rejoue C69-2). R73-21

**E. Carnets importés du Planning (3 sept.) mal lus**
22. m — « Critère : Budget du Planning : 300 CHF » : un budget présenté comme critère, sur 12 carnets. R73-22
23. m — Le premier message recopie en vrac titre, budget et dates ; le même texte, coupé, sert de « problème » aux 5 résolus. R73-23
24. m — « Idée · 3 sept. » sur 9 carnets qui sont « Dans À venir » ; le coup d'œil affiche « 0 décidés ». R73-24
25. B — Quand faux ou contradictoire : Embouteillage « S26 » dans le carnet mais « sem. du 26 avr. 2027 » dans À faire ; Installation électrique « vers avr. » pour un 01.05.2027 ; aucune année pour 2027. R73-25
26. m — Quand « prix ? » alors que le budget est connu et que la feuille Quand propose « 400 CHF · budget ». R73-26
27. m — Résolus importés : « 78 jours · 1 note » identique pour les 5 ; « tes notes ne le disent pas » ×5 ; « Toujours le bon choix ? » posé sur de simples travaux. R73-27

**F. Liste des carnets** (tour 73 servi : CARNET-LISTE-COMPACTE pas encore en ligne)
28. B — Au repos, à 390 × 844, aucune ligne de carnet visible : seulement des sous-domaines repliés, le coup d'œil en 4 cases et la rangée Arbre/À faire/cloche (V-0). R73-28
29. B — Avec le filtre « je cherche », toucher « Brasserie » ou « Brassage » ne replie rien : geste sans effet, vérifié par le texte (V-3, W-1, W-2). R73-29
30. m — Avec le filtre, Houblons citra et Chambre froide sont rangés sous les ZZ TEST ; le carnet actif n'est pas en tête (sa plainte carnet-priorite). R73-30
31. m — « Anciennes notes de l'Atelier · 3 » apparaît sous À faire et sous la cloche. R73-31

Doutes, non comptés :
- D1 : bandeau « Synchronisation comptable : internal · Actualiser ». Il vient de ma garde (syncFinancialLedger bloqué), mais il montre au brasseur un code brut « internal ».
- D2 : « passé · S29 » sur des carnets « Dans À venir » non faits ; un brasseur lirait peut-être « en retard ».
- D3 : le champ d'Embouteillage affiche « Ajouter ici… » sur la capture, alors que le texte dit « Ajouter à Embouteillage… ».
- D4 : arômes « ? » chez MotlerHops alors que l'autre Citra a citron vert et mangue. C'est honnête (« non publié par le vendeur »), mais le brasseur le lira comme un manque.

## Corrigés rejoués sur ses carnets (index-L94x-z-O.js)
- Vérifiés : C59-8 (Alpha 13,6 %), C61-1 (liste sans « dès 0,10 »), LE-1 (guet vide partout), PX-2 (« prix CHF »), PX-3 (Escalader sur prix « ? »).
- Rouverts « en cours » : C59-6 et PX-1 (« 0,10 CHF » de retour dans Choisir et vers À venir ; prix « ? » sur la fiche Brau), C61-4 (CHF/kg « ? » au tableau, rang sans base).
- Justes sur son carnet, état laissé « en cours » (la partie carnet neuf n'a pas été rejouée) : C61-3, C61-6.
- Non rejoués, parce qu'ils demandent une écriture : BD-1, C61-2, C61-5.

## Restes
- Le tour 73 est encore servi : les correctifs c74 et suivants ne sont pas en ligne. Les causes A, B et F sont à rejouer au prochain déploiement, sur ces mêmes carnets.
- Causes D (pollution ZZ) : il faut retirer trois messages de SES carnets. C'est une écriture sur ses données réelles, donc elle attend l'accord du brasseur ou du pilote.

LEÇON PROPOSÉE : un test qui tape dans le champ d'un carnet ou utilise le mémo le fait sur un carnet ZZ ouvert, et son relevé avant/après compare aussi le TEXTE du fil de chacun de ses carnets. Trois tests (M3, c64, c69) ont laissé des ZZ dans ses carnets, et ils y sont encore deux jours après.
