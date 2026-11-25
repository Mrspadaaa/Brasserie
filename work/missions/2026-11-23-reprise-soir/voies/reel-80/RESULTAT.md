RESULTAT reel-80 : 26 problèmes (B 5, m 21, D 7) — corrigés rejoués 16/38 tenus (R78 6/7, R77 1/2, R75 0/4, R73 3/16, EXA 6/9) — carnet identique oui — BUGS OK

# Voie reel-80 : ses carnets réels, en lecture seule, tour 80 (25.11)

- Version : paquet servi `index-BJS-wSZ1.js` (Last-Modified 25.11 14:11:57), morceau du Carnet `CarnetsVue-Bbac1XMA.js` (+ `CarnetsVue-CzQ4j3_i.css`). Lu par curl au départ et à la fin, et dans la page servie avant et après : le même du début à la fin. Le DOSSIER citait index-SSQ_J86L.js et deploiements.log index-CoXAhg_q.js : un déploiement plus récent était en ligne. Service worker contourné (CDP `Network.setBypassServiceWorker`, cache coupé).
- Où : https://brasserie-l-affinee.web.app, Chrome de débug 9222, mon onglet (page.close() puis disconnect ; jamais browser.close()), 390 × 844, toucher. Seul agent dans ce Chrome.
- Tests : sans objet (test d'écran). Contrôle du registre : `bugs.log` → « BUGS OK : 2459 bugs, 635 ouverts, 202 sources ».

## Lecture seule : données identiques, oui
- Garde : 36 POST de fond bloqués (`getBrewerActivity` ×21, `syncFinancialLedger` ×15) ; écritures Firestore : 0 ; « Enregistrement… » : 0 ; gestes refusés par la garde : 0. Reclasser, Laisser, Relire, Escalader, Monter/Descendre, Supprimer, Choisir vert jamais touchés. 0 appel IA, donc 0 ligne au journal IA.
- Avant (`avant.json`) et après (`apres.json`), hors Git :
  - cache Firestore : 3 528 documents hors ZZ, 0 changé, 0 absent, 0 neuf ;
  - « CHF à dépenser » : −463 → −463 ; période « 6 sem. » → identique ; barres de la frise : 16 → 16, identiques ;
  - puces : À venir 11, Carnets 32, Réalisés 8, 5 je cherche, 11 décidés, 3 notés, 8 résolus 2026 → identiques ; texte de la liste dépliée identique.
- Tous les relevés portent un nom ignoré par Git (`avant`, `apres`, `tous-*.json`) ; vérifié par `git check-ignore`.
- Seul effet d'interface : la feuille ⋯ ouverte sur 6 carnets ZZ ne s'est pas fermée par Échap ; elle est partie au retour à la liste, sans aucune écriture.

## Couverture
- Ses 16 carnets (32 = 16 à lui + 16 ZZ), tous ouverts (`tous-sortie.json`, `tous.log`) :
  - Houblons citra et Chambre froide : carnet défilé, chaque fiche, Choisir ouvert puis Retour, Comparer défilé, Quand ouvert puis Fermer ;
  - les 14 autres : carnet, fil, Quand ouvert puis Fermer.
- Liste : au repos, filtre « je cherche », repli de Brassage sous filtre, Résolus 2026 (puce) et un résolu (Sol, murs), Anciennes notes, À faire défilé, cloche.
- ZZ (rejeu EXA, lecture seule) : 13 carnets ouverts et comptés (`tous-zz.json`), feuille ⋯ ouverte sur 6, résolus levure, malt et pompe ouverts (`res.mjs`).
- Captures 390 ouvertes : `cap/C01-carnet`, `C01-f1`, `C01-f1-s1`, `C01-f1-choisir`, `C01-f2`, `C01-f2-choisir`, `C01-comparer`, `C01-comparer-s1`, `C01-quand`, `C02-carnet`, `C02-carnet-s1`, `C02-f1`, `C02-f1-choisir`, `C02-f1-choisir-s1`, `C02-comparer`, `C03-carnet`, `C04-quand`, `C05-carnet`, `C07-carnet`, `V-0-defaut`, `X-1-filtre`, `Z01-feuille`, `Z03`. Planches : `pl/C1` à `pl/C4` (C05 à C16 et les Quand), `pl/V1` et `pl/V2` (repli, résolus, À faire, cloche, Anciennes notes), `pl/R` (résolus ZZ, Z07).
- Ses plaintes du 25.11 (citra-fiche, citra-carnet, carnet-priorite) ; maquettes : maquettes2 `v01-fiche` et `v01-comparer`, maquettes3 `v01-liste`.

## Rejeu des corrigés du tour 80
Le pilote porte ces états sur les lignes R73, R75, R77, R78 et EXA : je ne les possède pas.

- R78 : 6 tenus sur 7, « vérifié — en ligne index-BJS-wSZ1.js (tour 80) » :
  - R78-1 : plus de « 1500 x » ; le nom entier est revenu, mais coupé dans sa colonne (voir n° 7, R75-3) ;
  - R78-2 : la ligne 50 g dit « ≈73,8 CHF/kg » (C01-f1) ;
  - R78-3 : « vendu par 50 g à 500 g » (C01-comparer) ;
  - R78-5 : puces entières sous filtre (X-1) ;
  - R78-6 : réglette « avr. 2027 », « août 2027 », « janv. 2027 » (C04-quand, pl/C1, pl/C2) ;
  - R78-7 : « 1 000 CHF », « 5 000 CHF » (C09-quand) ;
  - R78-4 rouvert (n° 15).
- R77 : R77-7 tenu (« Brau » sur la fiche, au Choisir, dans Comparer) ; R77-6 rouvert (n° 14).
- R75 : 0 tenu sur 4 ; R75-3, R75-6, R75-7, R75-8 rouverts (nos 7, 13, 4, 16).
- R73 rouverts au tour 78 : 3 tenus sur 16.
  - Tenus : R73-12 (plus deux « 1 » contraires, mais voir R80-2), R73-15 (Quand ouvert : puces, réglette et « Au calendrier » à l'écran, C01-quand, pl/C4), R73-18 (Chambre froide s'ouvre en haut, C02-carnet).
  - Rouverts : 8, 9, 10 (en partie), 13 (en partie : nommé dans Comparer « Choisir · ggmgastro.com », pas dans l'écran Choisir), 14, 17, 19, 20, 21, 23, 24, 30, 31.
  - Rejoués enfin : R73-27 tenu (le résolu Sol, murs ne dit plus « durée 78 jours », X-5) ; R73-29 tenu (Brassage se replie sous filtre, X-2). R73-28 reste tenu (lignes visibles au repos).
- EXA (carnets ZZ, lecture seule) : 6 tenus sur 9 rejoués.
  - Tenus : EXA-3 (malt Résolu, « Retenu : Autre fournisseur · +4 CHF le sac », pl/R) ; EXA-4 (carte « Reclasser ce carnet ? » sur la levure, critère né d'une phrase, pl/R) ; EXA-5 (options « Un humidificateur dans la salle », « Steam condenser sur la cuve », « Joint du couvercle », Z03) ; EXA-6 (45 bulles sur 45 avec leur ⋯, 13 carnets) ; EXA-7 (levure : picto de levure et « Dernier fait : « Monté à 19 °C… » », pl/R) ; EXA-10 (plus de « Pourquoi … ? » ; vapeur « « finalement pas utile » », Z03).
  - Rouverts : EXA-1 (n° 22) ; EXA-9 et EXA-11 en partie (n° 18 : la date est lue et dite, « sem. du 7 déc. », « sem. du 30 nov. », « sem. du 28 déc. », mais la tâche reste rangée sous « Un jour »).
  - Non rejoués : EXA-2 (il faut supprimer) et EXA-8 (il faut écrire dans le champ), interdits ici.
- Lignes que je possède : C61-6 toujours présent (« Particulièrement adapté pour / ales et IPA américaines », C01-f2), mis à jour. C59-6, C59-8, LE-1, BD-1 et PX-1 à 3 non réécrits ; LE-1 et BD-1 : aucun « Enregistrement… » vu.

## Combien et quels problèmes ? 26 : 22 rouverts et 4 neufs (B 5, m 21)
Gravité : B = bloquant (geste sans effet, valeur fausse, élément de sa maquette absent, texte illisible) ; m = mineur.

**A. Ses données anciennes et les tests ZZ dans ses carnets** (CARNET-SES-DONNEES-EXISTANTES)
1. **B** — Chambre froide : « ZZ TEST — M3 — cellule de garde 2,6 m3 » et « gastro-held.ch non lu » dans son fil (C02-carnet-s1). R73-19
2. **B** — Achat brasserie : « Achat prévu fin du mois. », phrase du test c64 (C03-carnet). R73-20
3. **B** — Sol : « ZZ TEST — c69 mémo : le sol époxy… » (C07-carnet). R73-21
4. m — Frigo + congel et Armoire malte : liens réduits au domaine (« galaxus.ch », « digitec.ch », « brack.ch » ×2, « landi.ch »). Ils sont maintenant marqués « non lu · produit et prix inconnus », mais on ne sait toujours pas quel frigo, et rien n'entre dans Articles (C05-carnet, pl/C2). R73-17 et R75-7 : compté 2.
5. m — Sol : pastille « Idée · 3 sept. », bulle « En cours au 20.11.2026 » et Quand « passé · S21 » disent trois états contraires (C07-carnet). R73-24
6. m — Les deux Jalons : la 1re bulle redit le titre (« Jalon — … Jalon du Planning, sans date ») (pl/C1, pl/C3). R73-23

**B. Présentation : chiffres, noms, textes, place**
7. **B** — Tableau de Chambre froide : le nom entier tient dans une colonne de ≈60 px, coupé au milieu des mots (« 1500 x 1200 m m - groupe frigorifiq ue en stock · TTC ») ; cinq colonnes à 390, dimensions sur 3 lignes. Illisible (C02-carnet). R75-3, aggravé depuis que R78-1 a rendu le nom entier.
8. m — Bloc Offre : ≈40 px vides entre « en stock » et le crayon/Ouvrir (MotlerHops, les 2 fiches de Chambre froide) (C01-f1-s1, C02-f1). R73-8
9. m — Fiche MotlerHops : « en stock » dit trois fois (Offre, Caractéristiques « Disponibilité », « Part dans À venir ») ; Poids « 50 g, 250 g et 500 g » redit sous la table « je prends » (C01-f1-s1). R73-9
10. m — Choisir de Chambre froide : la carte de l'autre article met son nom sur 4 lignes dans une colonne étroite (« 1800 x / 1500 mm - / groupe / frigorifique ») (C02-f1-choisir-s1). R73-10, en partie
11. m — Choisir de Chambre froide : bouton vert « Choisir » sans nom ; celui des Houblons dit « Choisir chez MotlerHops » ; Comparer dit désormais « Choisir · ggmgastro.com » (C02-f1-choisir-s1). R73-13, en partie
12. m — Fiches de Chambre froide : photo minuscule au centre d'un bandeau gris (C02-f1). R73-14
13. m — Chasse fixe mêlée dans une même liste : « 2,6 m³ » et « 230 V » en chasse fixe, « 550 Watt » et « 0 à 8 °C » non (C02-f1-choisir, -s1). R75-6
14. m — Liste filtrée : « ·à compar…2697,74 CHF », sans espace après le point ni de milliers, et coupé (X-1). R77-6
15. m — Comparer Houblons : Arômes identiques des deux côtés (l'un suffixé « · variété ») comptés dans « 5 différents » (C01-comparer). R78-4

**C. Dates et Planning**
16. m — Quand a deux formes : « S17 2027 · 400 CHF estimé » (Frigo) contre « 1 mai 2027 · 1 500 CHF · budget » (Installation), pour la même date ; « estimé » et « budget » pour le même budget du Planning (pl/C1 à C4). R75-8
17. m — **neuf** : Quand ne dit pas s'il donne un début ou une échéance. Échéance pour Achat (« jusqu'au 13 juil. » → S29), Frigo, Hotte, Armoires et Extincteur ; début pour Embouteillage (« jusqu'au 1 juil. 2027 » → « 1 mai 2027 »), Installation, 2ème évier et Conformité. À faire, lui, dit « dès le » ou « jusqu'au » (C03, C04-quand, pl/C1, V-6). **R80-1**
18. m — À faire : les tâches datées sont rangées sous « Un jour » (« Sentir à nouveau… · sem. du 7 déc. », « Renouveler l'assurance… · sem. du 28 déc. », Extincteur « jusqu'au 31 déc. ») (pl/V1, pl/V2). EXA-9 et EXA-11, en partie : compté 2.

**D. Liste des carnets** (sa plainte carnet-priorite)
19. m — Au repos, chaque domaine montre d'abord les ZZ TEST en lignes pleines ; Houblons citra, Achat, Chambre froide et Frigo sont repliés dans « Brassage 2 Houblons citra · Achat brasserie : m… » et « Fermentation 2 ». Sa maquette v01-liste montre ses carnets en lignes pleines (V-0). R73-30
20. m — « Anciennes notes de l'Atelier · 3 » reste sous la liste filtrée (X-1, pl/V2). Il n'est plus sous À faire ni sous la cloche. R73-31

**E. Gestes et blocs vides**
21. m — **neuf** : Prix au m³ (carnet et Comparer « En barres ») : deux cercles de rang vides en pointillés devant les barres (C02-carnet, C02-comparer). **R80-2**
22. **B** — Feuille ⋯ d'une bulle : « Modifier » à y −1, « Changer en façon » à y 51, cachés sous l'en-tête Matériel/Carnets, sur 6 carnets sur 6 (Z01-feuille). EXA-1
23. m — **neuf** : ZZ fenêtre et ZZ truc à voir : le fil se réduit à un séparateur « 24 nov. » au-dessus du vide (la note égale au titre est retirée), alors que la liste cite encore cette note en sous-titre (pl/R, V-0). **R80-3**
24. m — **neuf** : sous-titre de liste en lien brut « « https://www.brewt… » » (ZZ inspection), au repos, sous filtre et sous Anciennes notes (V-0, X-1, V-5). **R80-4**

Total : 24 lignes numérotées ; les nos 4 et 18 comptent chacun deux identifiants : 26 problèmes. B = 5 (nos 1, 2, 3, 7, 22).

**Doutes (non comptés)**
- D1 — Choisir de Chambre froide, pourquoi proposé : « La moins chère. » Vrai au total (2 697,74 contre 2 987,51), faux au m³ (1 038 contre 736). Le brasseur le relèverait.
- D2 — Choisir de MotlerHops : « Seul prix au kilo lu. » se lit « seul le prix au kilo a été lu », ce qui est faux.
- D3 — Quand ouvert : un mot « Prix » isolé après « … CHF estimé » (Frigo, Extincteur), sans puces de prix ; ailleurs, les puces « Prix estimé ? ».
- D4 — Fiche MotlerHops : 250 g et 500 g restent « prix à relire · ? », alors que sa maquette v01-fiche montre un prix par ligne ; la page du vendeur les donne peut-être.
- D5 — « Part dans À venir : …, avec le pourquoi. » : la tournure est peu claire.
- D6 — ZZ vapeur : « Steam condenser sur la cuve · aucun article encore » au-dessus de deux liens « à relire » (Z03).
- D7 — Extincteur : Quand « S53 » est juste en ISO, mais rare et peu parlant.

## Côte à côte avec ses plaintes du 25.11
- citra-fiche : tenu sur α « 10–15 % », les arômes en puces, la table « je prends » avec ≈73,8 et le prix dit une fois. Restent le bloc Offre vide (8) et « en stock » redit (9).
- citra-carnet : tenu (≈73,8, Brau « à relire », plus de lien brut, note rattachée).
- carnet-liste-compact : tenu (lignes à points d'état, puces entières).
- carnet-priorite : non tenu, ses carnets repliés sous les ZZ (19).

## Phrase prédite du brasseur
« Les tests sont toujours dans mes carnets, la chambre froide est illisible, et le menu ⋯ se cache sous le bandeau. »

## Fichiers
- Scripts (repris de reel-78) : `outil.mjs`, `garde.mjs`, `commun.mjs`, `parcours.mjs`, `releve.mjs`, `vues-liste.mjs`, `extra.mjs`, `montage.mjs`, `verser.cjs`. Neufs : `zz.mjs` (rejeu EXA) et `res.mjs` (résolus ZZ).
- Sorties : `avant.json`, `apres.json`, `tous-sortie.json`, `tous-zz.json`, `tous-vues.json`, `tous-extra.json` (hors Git) ; `tous.log`, `vl.log`, `zz.log`, `journal.txt`, `bugs.log`, `cap/`, `pl/`.
- BUGS.md : R80-1 à R80-4 versés après R78-7 ; C61-6 mis à jour (toujours présent).

LEÇON PROPOSÉE : aucune
