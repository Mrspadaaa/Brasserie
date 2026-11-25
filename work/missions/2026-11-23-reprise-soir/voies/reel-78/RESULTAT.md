RESULTAT reel-78 : 29 problèmes (B 4, m 25, D 3) — corrigés rejoués 7/29 tenus (R77 6/8, R73 1/17, R75 0/4), 22 rouverts — carnet identique oui — BUGS OK

# Voie reel-78 : ses carnets réels, en lecture seule, tour 78 (25.11)

- Version : paquet servi `index-DyC_sRPc.js`, morceau du Carnet `CarnetsVue-DV5jXtjm.js` (+ `CarnetsVue-RfSRhdmi.css`). Lu par curl au départ, puis dans la page servie avant et après. Le DOSSIER citait index-CC3nR2pp.js : un déploiement plus récent est en ligne. Le service worker a été contourné (CDP `Network.setBypassServiceWorker`, cache coupé).
- Où : https://brasserie-l-affinee.web.app, Chrome de débug 9222, mon onglet (fermé par page.close() puis disconnect ; jamais browser.close()), 390 × 844, toucher. Seul agent dans ce Chrome.
- Tests : sans objet (test d'écran). Contrôle du registre : `bugs.log` → « BUGS OK : 2444 bugs, 620 ouverts, 202 sources ».

## Lecture seule : données identiques, oui
- Garde : POST vers les fonctions et l'IA bloqués (17 : `getBrewerActivity` ×10, `syncFinancialLedger` ×7, appels de fond de l'app au chargement) ; écritures Firestore guettées : 0 ; « Enregistrement… » : 0 ; gestes refusés par la garde : 0 (Reclasser, Relire, Escalader, Monter/Descendre, bouton vert du Choisir jamais touchés). 0 appel IA, 0 ligne au journal IA.
- Avant (`avant.json`) / après (`apres.json`, liste rejouée par `apres2.mjs` car l'app rouvrait Chambre froide) :
  - cache Firestore : 3 525 documents hors ZZ, 0 changé, 0 neuf, 0 absent ;
  - « CHF à dépenser » : −463 → −463 ; période « 6 sem. » → identique ; barres de la frise : 16 → 16, identiques ;
  - puces : À venir 11, Carnets 32, Réalisés 5, 7 je cherche, 8 décidés, 0 notés, 5 résolus 2026 → identiques ; texte de la liste dépliée identique.
- Relevés de ses données hors Git : `avant.json`, `apres.json`, `tous-sortie.json` ignorés ; `apres2.json` et `vues-liste.json` (non couverts par .gitignore) déplacés hors du dépôt.

## Couverture
- Ses 16 carnets (32 = 16 siens + 16 ZZ), tous ouverts (`tous-sortie.json`, `tous.log`) :
  - Houblons citra et Chambre froide : carnet, chaque fiche, Choisir ouvert puis Retour, Comparer défilé, Quand ouvert puis Fermer ; haut de Chambre froide (`C02-haut`) ;
  - les 14 autres (pas d'article) : carnet, fil, Quand ouvert puis Fermer.
- Liste : repos, filtre « je cherche », repli Brasserie, Anciennes notes, À faire, cloche (rejouée cette fois : « Aucune veille demandée »).
- Non couvert : Résolus 2026 (puce coupée « 5 résolus 2… », mon script cherchait le mot entier) ; donc le « S50 » du résolu Sol n'est pas rejoué.
- Captures 390 ouvertes : `cap/C01-carnet`, `C01-f1`, `C01-f1-s1`, `C01-f1-choisir`, `C01-f2`, `C01-f2-choisir`, `C01-comparer`, `C01-comparer-s1`, `C01-quand`, `C02-carnet`, `C02-haut`, `C02-f1`, `C02-f1-choisir`, `C02-comparer`, `C02-comparer-s1`, `V-0-defaut`, `V-1-jecherche` ; planches `pl/C1` à `pl/C4` (C03 à C16, C02-f2, C02-f1-choisir-s1), `pl/Q1` (Quand C02, C04, C05, C07), `pl/V1`, `pl/V2` (repli, Anciennes notes, À faire, cloche, Quand C09). Ses plaintes du 25.11 (citra-fiche, citra-carnet, carnet-liste-compact, carnet-priorite), maquettes2 `v01-fiche`, `v01-comparer`, maquettes3 `v01-liste`.

## Rejeu du tour 78 (c77-fix)
- R77 (6 tenus sur 8), « vérifié — en ligne index-DyC_sRPc.js (tour 78) » :
  - R77-1 tenu : Comparer, ligne « CHF/kg ≈73,8 » épinglée, puis « prix CHF ≈3,69 · 50 g » (C01-comparer) ;
  - R77-2 tenu : fiche MotlerHops « arômes · variété » avec trois puces ; Comparer « … · variété » (C01-f1, C01-comparer) ;
  - R77-3 tenu : la carte MotlerHops sous le Choisir de Brau dit « ≈3,69 CHF » (C01-f2-choisir) ;
  - R77-4 tenu : Brau au rang « ? » sous le Choisir de MotlerHops (C01-f1-choisir) ;
  - R77-5 tenu : cellule prix de Brau « ? · à relire », sans bouton ; le tableau commence plus haut ;
  - R77-8 tenu : bulle « rattachée à MotlerHops » (C01-carnet) ;
  - R77-6 rouvert, R77-7 rouvert (ci-dessous).
- R73 rouverts au tour 77 (17) : 1 tenu, R73-25 (Quand : « S17 2027 » pour Frigo, « 1 mai 2027 », « 1 déc. 2027 » ; résolu Sol non rejoué). 16 rouverts.
- R75 rouverts au tour 77 (4) : 0 tenu.
- Les tenus du tour 77 (R73-1 à 7, 11, 16, 22, 26, 28, 29 ; R75-1, 2, 4, 5) restent tenus ; R73-27 non rejoué (Résolus).
- Lignes possédées : C61-3 passe à « vérifié — en ligne index-DyC_sRPc.js (tour 78) » (Alpha et Arômes dans Comparer) ; C61-6 reste en cours (« Particulièrement adapté pour / ales et IPA américaines », C01-f2). C59-6, C59-8, LE-1, BD-1, PX-1 à 3 : toujours vrais, non réécrits.
- Je ne possède pas les lignes R73, R75, R77 : le pilote y porte tenu ou rouvert d'après cette liste.

## Combien et quels problèmes ? 29 : 22 rouverts et 7 neufs (B 4, m 25)
Gravité : B = bloquant (geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible) ; m = mineur.

**A. Ses données anciennes, ni recalculées ni rangées** (CARNET-SES-DONNEES-EXISTANTES)
1. m — Frigo + congel et Armoire malte : liens réduits au domaine (« galaxus.ch », « digitec.ch », « brack.ch » ×2, « landi.ch »), ni lus ni marqués « non lu » (pl/C1, pl/C3). R73-17 et R75-7 (compté 2)
2. m — Sol : pastille « Idée · 3 sept. », bulle « En cours au 20.11.2026 », Quand « passé · S21 » : trois états contraires (pl/C2). R73-24
3. m — Les deux Jalons : la 1re bulle redit le titre (« Jalon — … Jalon du Planning, sans date ») (pl/C2, pl/C4). R73-23

**B. Présentation : chiffres, noms, textes, place**
4. **B** — Chambre froide, tableau : les articles s'appellent « 1500 x » et « 1800 x » (le nom court du tour 78 coupe à la première dimension) ; on ne sait plus ce qu'est la ligne (C02-haut). **R78-1** (régression c77-fix, doute que l'auteur avait écrit)
5. m — Fiche MotlerHops, table « je prends » : la ligne cochée dit « offre ↓ » en chasse fixe dans la colonne « CHF/kg rendu » au lieu de ≈73,8 ; sa maquette v01-fiche y met le chiffre (C01-f1). **R78-2**
6. m — Comparer Houblons : « vendu par 50 g », alors que la fiche dit 50 g, 250 g et 500 g (C01-comparer, C01-f1). **R78-3**
7. m — Comparer Houblons : Arômes identiques des deux côtés (l'un suffixé « · variété ») comptés dans « 6 différents » (C01-comparer). **R78-4**
8. m — Vendeur : « Brau » au tableau et au Choisir (« Choisir chez Brau »), « Brau- und Rauchshop » sur la fiche et son bouton (« Choisir · Brau- und Rauchshop »), « Brau- und Rauch… » coupé dans Comparer, « Brau- und Rauchshop » sur la carte sous le Choisir de MotlerHops (C01-f2, C01-f2-choisir, C01-comparer, C01-f1-choisir). R77-7
9. m — Liste filtrée : « à comparer · 2697,7… », sans espace de milliers et coupé (V-1). R77-6
10. m — Liste filtrée : les puces du coup d'œil coupées « 7 je cher… », « 8 déci… », « 0 no… », « 5 résolus 2… » (V-1). **R78-5**
11. m — Bloc Offre : ≈40 px vides entre « en stock » (ou Poser le prix / Relire / Escalader) et le crayon ou Ouvrir, sur les 4 fiches (C01-f1-s1, C01-f2, C02-f1, C02-f2). R73-8
12. m — Textes redits : Choisir de Chambre froide dit 2 697,74 trois fois (tête, réglette « 2 698 », « Part dans À venir ») (C02-f1-choisir, -s1). R73-9
13. m — Choisir de Chambre froide : « 2 697,74 / CHF » passe à la ligne en gros ; la carte de l'autre article met son nom sur 6 lignes dans une colonne étroite (C02-f1-choisir, C02-f1-choisir-s1). R73-10
14. m — Chambre froide : deux « 1 » contraires, 2,6 m³ au tableau, 4,06 m³ au prix au m³ (C02-haut). R73-12
15. m — Chambre froide : bouton vert « Choisir » sans nom dans Comparer et dans l'écran Choisir ; celui des Houblons est nommé (C02-comparer-s1, C02-f1-choisir-s1). R73-13
16. m — Fiches de Chambre froide : photo minuscule au centre d'un bandeau gris (C02-f1, C02-f2). R73-14
17. m — Tableau de Chambre froide : colonne article ≈70 px (« 1500 x / en stock / · TTC »), dimensions empilées sur 3 lignes à côté du prix (C02-haut). R75-3
18. m — Chasse fixe sur du texte : « 2,6 m³ » et « 230 V » au Choisir, « offre ↓ », « vendu par 50 g », « ≈3,69 CHF » dans la phrase « Part dans À venir », « note · 20.11.2026 » dans Anciennes notes (C02-f1-choisir, C01-f1, C01-comparer, pl/V1). R75-6
19. m — Quand ouvert, puces « Prix estimé ? » : « 1000 CHF », « 5000 CHF » sans espace (C09-quand). **R78-7**

**C. Disposition, ouverture**
20. m — Quand ouvert dans un carnet long : puces sous le champ, réglette et « Au calendrier » hors de vue (Houblons citra, Chambre froide, Frigo) (C01-quand, pl/Q1). R73-15
21. m — Chambre froide s'ouvre au milieu du tableau, titre et en-tête hors de vue (C02-carnet). R73-18

**D. Tests ZZ écrits dans ses carnets** (il faut une écriture pour les retirer, hors de cette voie)
22. **B** — Chambre froide : « ZZ TEST — M3 — cellule de garde 2,6 m3 » et « gastro-held.ch » (C02-carnet). R73-19
23. **B** — Achat brasserie : « Achat prévu fin du mois. » (pl/C1). R73-20
24. **B** — Sol : « ZZ TEST — c69 mémo… » (pl/C2). R73-21

**E. Dates et import du Planning**
25. m — Quand a deux formes : « S29 · 300 CHF estimé » contre « 1 sept. 2027 · 400 CHF · budget » ; la même fin de Planning (1 mai 2027) se dit « S17 2027 » (Frigo) et « 1 mai 2027 » (Embouteillage, Installation) (pl/C1 à C4). R75-8
26. m — Réglette de Quand sans année : « juin · juil. · août » (Embouteillage 2027), « avr. · mai · juin » (Frigo 2027), « août · sept. · oct. » (2ème évier 2027), « déc. · janv. · févr. » (Extincteur, passe d'année sans le dire) (C04-, C05-, C09-quand). **R78-6**

**F. Liste des carnets**
27. m — Au repos, chaque sous-domaine affiche un ZZ TEST en titre ; Houblons citra et Chambre froide invisibles. Filtrés, ils restent sous les ZZ. Sa maquette v01-liste montre ses carnets en lignes pleines (V-0, V-1 ; plainte carnet-priorite). R73-30
28. m — Anciennes notes de l'Atelier sous la liste filtrée, sous À faire et sous la cloche (V-1, pl/V1, pl/V2). R73-31

Total : 28 lignes numérotées ; la n° 1 compte deux identifiants (R73-17, R75-7) : 29 problèmes. B = 4 (nos 4, 22, 23, 24).

**Doutes (non comptés)**
- D1 — Choisir de MotlerHops, pourquoi proposé : « Seul prix au kilo lu. » ; vrai (Brau n'a pas de prix) mais un brasseur lirait « seul le prix au kilo a été lu », ce qui est faux (le prix du sachet l'est aussi).
- D2 — Extincteur : Quand « S53 » (Planning jusqu'au 31.12.2026) : juste en ISO, mais rare et peu parlant ; À faire dit « jusqu'au 31 déc. ».
- D3 — Aucun de ses 16 carnets ne reçoit la carte « Reclasser » (aucune occurrence dans les textes), alors que Sol est visiblement mal rangé (n° 2).

## Côte à côte avec ses plaintes du 25.11
- citra-fiche : tenu (α serré « 10–15 % », arômes en puces, table des conditionnements, Offre ≈3,69 CHF, CHF/kg dit une fois). Reste : bloc Offre vide (11), « offre ↓ » à la place du chiffre (5).
- citra-carnet : tenu (≈73,8, Brau « à relire », plus de lien brut, note rattachée).
- carnet-liste-compact : tenu au repos ; sous filtre, puces coupées (10).
- carnet-priorite : non tenu, ses carnets sous les ZZ (27).

## Fichiers
- Scripts (repris de reel-77) : `outil.mjs` (garde-geste ; « Veille » resserré pour laisser la cloche), `garde.mjs`, `commun.mjs`, `parcours.mjs` (+ morceaux servis), `releve.mjs`, `apres2.mjs`, `haut.mjs`, `vues-liste.mjs`, `montage.mjs`, `verser.cjs`.
- Sorties : `avant.json`, `apres.json`, `tous-sortie.json` (hors Git), `tous.log`, `vl.log`, `journal.txt`, `bugs.log`, `cap/`, `pl/`.
- BUGS.md : R78-1 à R78-7 versés après R77-8 ; C61-3 passé à vérifié, C61-6 mis à jour (toujours présent).

LEÇON PROPOSÉE : un fichier de relevé de ses données dont le nom sort des motifs de .gitignore (`apres2.json`, `vues-liste.json`) n'est pas ignoré : nommer tout relevé `avant*`/`apres*`/`idb*`/`tous*`, ou élargir le motif à `voies/**/*.json` hors DOSSIER.
