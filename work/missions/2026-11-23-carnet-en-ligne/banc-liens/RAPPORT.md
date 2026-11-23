# Banc réel de 25 liens dans le Carnet (23.11, 11:45 à 12:50 UTC)

Ses mots : « Ça a pas du tout été testé avec des vrai appel IA sur la vrai app le carnet ??? »

App en ligne https://brasserie-l-affinee.web.app/, paquet servi **index-CbOKAB_r.js** (tour 23). Testeur : Opus.
Outil : playwright-core `connectOverCDP('http://127.0.0.1:9222')`, MA fenêtre, 390 × 844, UA Android, toucher CDP.
Chaque lien est collé (`insertText` puis Entrée) DANS un carnet « ZZ TEST — banc liens — n » ouvert, jamais depuis la liste.
Vérité : la même page ouverte dans un second onglet à moi (JSON-LD, og:, texte visible, capture `verite/vNN.png`).
Captures de l'app : `bNN-fin.png` (fin), `bNN-3s.png`, `bNN-15s.png` ; planches A, B, C et bandeaux (regardées).
Ses vrais carnets lus d'abord, en lecture seule : un seul a des articles, « Chambre froide » (ggmgastro, gastro-held).

## Résultat par lien

Nom : = exact, ≈ raccourci correct, ✗ faux ou incomplet. Champ « — » : absent de l'app ; « ✓ abs. » : absent et la page ne le donne pas
aux robots ou n'en a pas. Temps : collage → fin de l'IA. Lecture : statut rendu par `lireLien` (sans modèle).

| n | site (genre) | lecture | nom | prix et devise | photo | caract. | temps | statut affiché | carnet |
|---|---|---|---|---|---|---|---|---|---|
| 1 | gastro-held (redirigé) | lue | = | ✓ 1 820,90 CHF (net ; TTC 1 968,39) | ✗ | ✗ | 35,6 s (IA coupée) | « L'IA n'a pas répondu » | ✓ |
| 2 | gastro-held Shopify + utm/gclid | lue | = | ✓ 1 011,90 CHF | ✗ | ✗ | n.m.¹ | n.c.¹ | ✓ |
| 3 | ggmgastro de-de-eur | lue | = | ✓ 3 249,99 EUR (net) | ✓ | ✓ | 5,1 s | ✗ « page non lue » | ✓ |
| 4 | ggmgastro de-ch-chf | lue | = | ✓ 3 789,62 CHF (net) | ✓ | ✓ | 8,1 s | ✗ « page non lue » | ✓ |
| 5 | ggmgastro en-gb-gbp | lue | = | ✓ 172,53 GBP (net) | ✓ | ✓ | 5,1 s | ✗ « page non lue » | ✓ |
| 6 | brouwland EN (Cloudflare) | bloquée | ≈ (adresse) | ✓ abs. | ✓ abs. | ✓ abs. | 5,1 s | ✓ « bloque la lecture » | ✓ |
| 7 | brouwland FR (Cloudflare) | bloquée | ≈ (adresse) | ✓ abs. | ✓ abs. | ✓ abs. | 5,1 s | ✓ « bloque la lecture » | ✓ |
| 8 | galaxus FR, produit retiré | lue | ✗ « Réfrigérateur à boissons » | ✓ abs. | ✗ image « no-image » | ✗ | 6,1 s | ✗ « page non lue » | ✓ |
| 9 | brewtools, lien mort → recherche | illisible | ≈ (adresse) | ✓ abs. | ✓ abs. | ✓ abs. | 5,1 s | ≈ « ni nom ni prix » | ✓ |
| 10 | kegland Shopify AUD | lue | ≈ (coupé « Thermomet ») | ✓ 79,95 AUD | ✓ | ✗ | 6,1 s | ✗ « page non lue » | ✓ |
| 11 | kegland Shopify + utm/fbclid | lue | = | ✓ 170,10 AUD | ✓ | ✗ | 5,6 s | ✗ « page non lue » | ✓ |
| 12 | speidels-braumeister | lue | = | ✓ 1 990 EUR | ✓ | ✗ | n.m.¹ | n.c.¹ | ✓ |
| 13 | speidels-braumeister (kit) | lue | = | ✓ 4 995 EUR | ✓ | ✗ | 6,1 s | ✗ « page non lue » | ✓ |
| 14 | hobbybrauerversand → braumarkt (Cloudflare) | bloquée | ≈ (adresse) | ✓ abs. | ✓ abs. | ✓ abs. | 5,1 s | ✓ « bloque la lecture » | ✓ |
| 15 | brewtools /products/ | illisible | ≈ (adresse) | ✗ (879,00 EUR manqué) | ✗ | ✗ | 5,1 s | ✗ « ni nom ni prix » | ✓ |
| 16 | galaxus DE, non livrable | lue | = | ✓ abs. | ✓ | ✗ | 6,1 s | ✗ « page non lue » | ✓ |
| 17 | galaxus + utm/gclid | lue | ✗ « KS340L » | ✓ 445 CHF | ✓ | ✗ | 5,1 s | ✗ « rangé ici · page non lue » | **✗ Frigo + congel** |
| 18 | digitec | lue | ✗ « CNCQ2T518EB » | ✓ 450 CHF | ✓ | ✗ | 5,1 s | ✗ « rangé ici · page non lue » | **✗ Frigo + congel** |
| 19 | brack | lue | ≈ (sans marque) | ✓ 544,80 CHF | ✓ | ✗ | 6,8 s | ✗ « rangé ici · page non lue » | **✗ Frigo + congel** |
| 20 | brack + gclid/utm | lue | ≈ (sans marque) | ✓ 341,10 CHF | ✓ | ✗ | 7,3 s | ✗ « rangé ici · page non lue » | **✗ Frigo + congel** |
| 21 | hornbach, article retiré | lue | = | ✓ abs. | ✓ | ✗ | 5,8 s | ✗ « page non lue » | ✓ |
| 22 | landi (étagère) | indisponible (8,2 s) | ≈ (adresse) | ✗ (79,95 CHF manqué) | ✗ | ✗ | 13,3 s | ✗ « site injoignable » | ✓ |
| 23 | landi (congélateur) | lue | = | ✓ 379 CHF | ✓ | ✗ | 6,6 s | ✗ « page non lue » | ✓ |
| 24 | jumbo (403 aux robots) | bloquée | ≈ (adresse) | ✓ abs. (429 CHF en vrai) | ✓ abs. | ✓ abs. | 6,3 s | ✓ « bloque la lecture » | ✓ |
| 25 | bauhaus | bloquée | ≈ « Marley Kellerablauf » | ✓ abs. (31,95 CHF en vrai) | ✓ abs. | ✓ abs. | 7,3 s | ✓ « bloque la lecture » | ✓ |

¹ Liens 2 et 12 : mon script a planté sur une capture après le collage (fenêtre masquée) ; carte relevée ensuite, temps et bandeau perdus.
Appels du 2 et du 12 bien notés au journal.

## Taux de champs justes (25 liens)

| Champ | juste (valeur juste ou absence honnête) | rempli et juste (ce que le brasseur obtient) |
|---|---|---|
| Nom | 22/25 (88 %) : 11 exacts, 11 raccourcis corrects, 3 faux ou incomplets (8, 17, 18) | 22/25 |
| Prix et devise | 23/25 (92 %) ; 2 manqués (15, 22) | 14/25 (56 %) ; 0 converti en CHF (6 en EUR, GBP, AUD) ; 4 nets sans « HT » |
| Photo | 20/25 (80 %) ; fausses ou manquées : 1, 2, 8, 15, 22 | 14/25 (56 %) |
| Caractéristiques | 9/25 (36 %) | 3/25 (12 %), ggmgastro seul |
| Statut affiché (bandeau) | 7/23 (30 %) mesurés | — |
| Carnet de destination | 21/25 (84 %) | — |
| Temps | médiane 5,8 s ; 5,1 à 8,1 s pour 21 liens ; 13,3 s (landi) ; 35,6 s (IA coupée) | lireLien : 0,14 à 1,7 s, une fois 8,2 s |

## Causes par famille

**Lecture de la page (`lireLien`)** : 15 pages lues sur 25, 6 bloquées (Cloudflare : brouwland, braumarkt ; jumbo, bauhaus), 2 illisibles,
1 indisponible. Échecs à tort : landi étagère « indisponible » à 8,2 s (BL-7), brewtools /products/ redirigé puis « illisible » (BL-8).
Photo jamais lue sur gastro-held (BL-5) ; image « no-image » de Galaxus prise pour une photo (BL-12). Caractéristiques lues sur
ggmgastro seulement (BL-6). Marque perdue sur Galaxus/Digitec (BL-9). Nom coupé à 100 caractères en plein mot (BL-13).
Prix nets lus comme prix (BL-11). Aucune invention constatée : pages bloquées sans prix ni photo inventés.

**IA (`rangerCarnet`)** : 50 appels (25 phrases de création, 25 collages) ; sur les 23 collages mesurés, 22 réussis en 2,9 à 6,9 s, 1 échec « coupée au plafond de sortie » à 33,8 s (BL-10).
**4 fois l'IA a rendu le carnetId d'un vrai carnet** (CARNET-PLANNING-T-13, « Frigo + congel ») pour des frigos collés dans un carnet ZZ
ouvert, et l'app l'a appliqué (BL-1, bloquant). Nom des pages bloquées tiré de l'adresse, raisonnable.

**Affichage** : le bandeau dit « page non lue » sur les 14 pages lues observées (BL-4) ; il dit « Lien rangé ici » quand l'article est parti
dans un autre carnet (BL-2) ; aucun geste pour retirer ou déplacer un article une fois le bandeau parti (BL-3) ; adresse encodée
illisible (BL-14) ; article retiré ou lien mort sans statut juste (BL-15). Les pages bloquées sont bien dites (5/5).

## Données réelles touchées

- **« Frigo + congel » contient encore 4 articles de test** (KS340L 445 CHF, CNCQ2T518EB 450 CHF, Gewerbekühlschrank Gastro 208L Mitte
  544,80 CHF, GK130L01 341,10 CHF) et affiche « 4 articles à comparer ». Je ne les ai pas retirés : l'app n'offre aucun geste pour le
  faire (BL-3), et une écriture directe dans Firestore est une écriture sur ses données réelles, qui attend son accord.
  Capture avant : `G-frigo-congel-0.png`. Son plan À venir (400 CHF, S17) n'a pas changé à l'écran du carnet.
- « Chambre froide » : lue seulement, pas touchée.
- Les 25 carnets ZZ : supprimés (voir Nettoyage).

## Nettoyage

Les 25 carnets ZZ supprimés par « ⋯ › Supprimer le carnet » (titre vérifié avant chaque confirmation). Après rechargement : Carnets 15
(comme au départ), aucun « banc liens » dans la liste (`Z-liste-finale.png`). Le n° 10 a résisté une fois (« supprimé » au script,
encore listé au contrôle), supprimé au second passage : cause non établie (toucher manqué ou suppression non appliquée), à surveiller.
Restent les 4 articles de test dans « Frigo + congel » (voir plus haut) : accord attendu pour les retirer.

## Coût IA

74 + 1 lignes au journal `ia-journal.jsonl` (méthode `banc-liens`) : 25 lireLien (0 CHF) et 50 rangerCarnet à 0,005 CHF estimés,
soit **0,25 CHF estimés**.
