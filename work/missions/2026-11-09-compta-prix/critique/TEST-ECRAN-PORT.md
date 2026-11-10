OK — 28 problèmes, 4 bloquants (Prix 1, Argent 2, Annuel 1) ; Synthèse et Opérations fidèles, Argent conditionné non capturé (DEMANDE EXECUTANT)

# Test d'écran — les cinq écrans portés (10.11)

Version : 6e3d7edf (worktree jolly-mahavira). App `http://localhost:3000/?dev-local&finance-demo`, Chrome du poste, 390 tactile (×2) et 1280, clair et cave.
Fixture de ue posée en mémoire pour Prix et Argent (Pale Ale de septembre, conditionné, 202,77 ; Pale Ale de novembre, planifié ; tarifs 5,00 · 10,00 · 160,00).
Script `critique/capturer-test-port.mjs`, captures `critique/captures-port/<config>-<écran>-<état>[-bas].png` (65 par configuration), journal `journal.json`.
Ouvertes en plein format (36) : clair-390 Synthèse repos/bas/pourquoi/tout/caisse ; Opérations repos/bas/payé/annulé/par-date/filtres (et l'état filtré « à payer » venu de la Synthèse) ;
Prix repos/bas/an/feuille/proposer ; Argent planifié ; Annuel tête/bas/mois/étapes 1 à 9 ; cave-390 Synthèse, Opérations, Annuel tête ; clair-1280 Synthèse.
Non ouvertes : les autres cave et 1280 (existent), aucune erreur de page dans le journal, aucun débordement horizontal mesuré.
Question posée à chaque capture : combien et quels problèmes ? Gravité : B bloquant (geste sans effet, valeur fausse, élément de sa maquette absent, illisible), G gênant, D détail.

| écran | maquette | thème | largeur | états vus | problèmes | bloquants | verdict |
|---|---|---|---|---|---|---|---|
| Finances › Synthèse | g3a-page, g3a-etat | clair, cave | 390, 1280 | repos, bas, Pourquoi, oct., tout, replié, caisse, « à payer » | 6 | 0 | fidèle (écarts annoncés 1 à 3 de us vus) |
| Finances › Opérations | v6b-page, v6b-etat | clair, cave | 390 | repos, bas, ✓ Payé, Annuler, Par date, Filtres, loupe, Archives, filtré depuis la Synthèse | 6 | 0 | fidèle, à retoucher |
| Clients › Prix | c7c-page (1 et 2) | clair | 390 | repos, bas, par an, Changer le prix, Proposer | 5 | 1 | à corriger |
| fiche brassin › Argent | e3a-page (1 et 2) | clair | 390 | planifié seulement (conditionné : la carte n'a pas été ouverte par le script) | 4 | 2 | à corriger |
| Finances › Annuel | g6-page, g6-1 à g6-9 | clair, cave | 390 | tête, Mois par mois, 9 étapes, Oui, Proposer depuis le stock, Matériel | 7 | 1 | à corriger |

## 1. Finances › Synthèse — g3a (6 problèmes, 0 bloquant) — fidèle

La structure est celle de g3a dans les quatre configurations : deux colonnes à la même échelle, gain encadré relié en pointillé, loyer hachuré « à payer 25 nov. », matériel 28,60 à part, légende, caisse avec barre libre / à payer et pastilles Payer, litre 7,51 avec +, fournisseurs repliés, segment de mois. Les trois écarts annoncés par us sont là et acceptables.

1. Pourquoi ? — la réponse dit « parti surtout dans « Charges fixes » : 468,00 CHF, soit 65 % » alors que la colonne au-dessus écrit « Charges fixes 68,00 » et le loyer à part ; g3a-etat nomme le loyer (« le loyer : 400,00, soit 56 % »). Le brasseur lit 68 puis 468 sous le même mot (clair-390-syn-pourquoi). G.
2. tout — la pastille « Solde atelier · anci… » est tronquée et chevauche la pastille « Loyer de l'atelier 400,00 » dans la zone hachurée (clair-390-syn-tout). G.
3. repos — bloc « Matériel sans registre · Joints de la cuve : rangé à part, mais sans immobilisation au registre (l'Annuel le compte autrement) » : absent de g3a, jargon au premier plan, trois lignes entre la caisse et le litre (toutes configurations). G.
4. repos — la pastille du loyer prend deux lignes (« Loyer de l'atelier / 400,00 ») là où g3a tient sur une (« Loyer 400,00 ») ; à 1280 elle tient. D.
5. repos-bas — la ligne IA dit « Comprendre mes dépenses · Compagnon brasseur › » au lieu de « ✦ Compagnon brasseur › ». D.
6. caisse — « Solde de départ (CHF) 4000 » sans format suisse (4 000,00) ; la case « J'ai vérifié ce solde… » est juste. D.

Doutes (non comptés) : la pastille d'App « Compagnon hors connexion · mode local » recouvre le litre à 390 (chrome, dit par us) ; « payé 296,80 » (Opérations) et « Dépensé 696,80 » (Synthèse) se réconcilient avec le matériel 28,60 à part, mais rien ne le dit sur l'écran.

## 2. Finances › Opérations — v6b (6 problèmes, 0 bloquant) — fidèle, à retoucher

Bande ‹ novembre › + « en retard 60,00 » + loupe, piles aux couleurs des catégories, Fixes hachurée 400 sur 68 payés, légende payé / à payer / dépensé, groupes dans l'ordre de v6b, lignes de 36 px avec le geste à gauche du montant. « ✓ Payé » sur le loyer : pile pleine, payé 696,80 / à payer 0,00, ligne verte « payé aujourd'hui · banque » + « Annuler » comme v6b-etat ; « Annuler » rétablit tout. Par date, Filtres, loupe et Archives répondent.

1. repos — toute opération payée aujourd'hui porte « Annuler » : six boutons « Annuler » à l'écran du jour, et « + pièce » n'apparaît que sur les opérations d'un autre jour (5 oct., 5 sept. en Par date). v6b montre « + pièce » sur la ligne payée sans pièce ; le jour où le brasseur saisit un ticket, il ne peut pas joindre la pièce depuis la liste (clair et cave 390, ops-repos). G.
2. repos et Par date — « sans p » : « sans pièce » tronqué sur la ligne Ventes, coupé par le bouton (clair et cave). G.
3. Filtres — « Toutes 7 » à côté de « À compléter 15 · Sans justificatif 15 » : deux périmètres (le mois / toutes les dates) sur la même rangée, les nombres paraissent faux (clair-390-ops-filtres). G.
4. Filtres — le panneau s'ouvre sous la rangée de boutons, hors écran à 390 : il faut défiler pour le voir. D.
5. repos — la ligne IA dit « Vérifier mes opérations » ; v6b posait la question du mois « ✦ Pourquoi les charges fixes pèsent autant ? ». D.
6. venu de la Synthèse par « à payer » — après « ✓ Payé », la ligne du loyer disparaît de la liste filtrée : plus d'« Annuler » visible (il faut retirer le filtre). D.

Doute : payé 296,80 au lieu de 325,40 de la maquette (matériel hors du « payé », annoncé par uo) ; à dire au brasseur.

## 3. Clients › Prix — c7c (5 problèmes, 1 bloquant) — à corriger

Rail Carnet · Prix · Impôt bière, tuiles 33 cl / 75 cl / Fût 20 L, « Il te reste 2,52 CHF par bouteille · 50 % du prix », bascule « 9 162,72 par an ⇄ » qui échange bien la tête et l'échelle en gras (état 2 identique à c7c-2 : « Il te resterait 9 162,72 CHF par an », « si 1 200 L en 33 cl estimé », 75 cl ≤ 8 048,00), aiguille 5,00 pleine, zones à perte / mince / il te reste, « +0,10 → +363,60 /an », « coût 2,48 · 7,51 CHF/L › », 41 paient le brassin / 40 pour toi. Changer le prix : feuille bière, format, prix HT, emballage, TTC, reste.

1. repos — **les crans 4,50 et 6,00 et leurs valeurs posées sur la courbe (2,02 · 3,52 ; 7 344,72 · 12 798,72 par an) sont absents** ; seule la valeur 2,52 est posée ; l'axe va de 0 à 8 au lieu de 0 à 7. C'est le point 3 de c7c (« valeurs posées sur la courbe dans l'unité lue »). **B** (élément de sa maquette absent).
2. repos — la tuile « Fût 20 L · prix ? » alors que la ligne juste dessous dit « À compléter · Pale Ale Fût 20 L · 160,00 › » : le tarif a un prix et la tuile dit qu'il n'en a pas (le format n'est pas « présent » dans le brassin : aucun fût conditionné). c7c montre « Fût 160,00 ex. ≤ 27,54 ». G.
3. Changer le prix — « 5 » et « 0,3 » dans les champs au lieu de 5,00 et 0,30 (B12 format suisse). D.
4. repos — ajouts hors maquette : « Comprendre le calcul ⌄ » et « 81 bouteilles · vendu 405,00 · reste 202,23 CHF » (utiles, à montrer). D.
5. repos à 390 — la barre Proposer · Changer le prix est recouverte par la pastille « Compagnon hors connexion · mode local » (chrome de l'App). D.

## 4. fiche d'un brassin › Argent — e3a (4 problèmes, 2 bloquants ; état planifié seulement) — à corriger

Vu : « Pale Ale de novembre · planifié », rubrique Argent (4e, après Mesures · Carnet · Dossier, écart annoncé par ue), six marches numérotées, encart Prévisions.

1. planifié — **« ✦ Proposer » absent** : le bas de la fiche porte « Fermer » (chrome de BatchDetailSheet) ; e3a met Proposer en primaire sur les deux états. **B**.
2. planifié — **« Dans Prévisions : 0,00 avant le 20.11 · 0,00 le 04.12 · 0,00 le 30.01 »** : trois zéros là où e3a écrit « 57,42 avant le 20 nov. · 6,84 en déc. » et sa note dit « ce qui manque dit « ? » et compte à part, jamais 0 » ; dates « 20.11 » au lieu de « 20 nov. ». **B** (valeur fausse : rien n'est prévu à 0,00, c'est inconnu).
3. planifié — « Brassin, ? L » et « le brassin ? » alors que l'en-tête dit « 30 L visés » et e3a « 27 L prévus » ; l'impôt du brassin (30 L à 11,9 °P) est calculable. G.
4. planifié — « ⚠ Stock à confirmer · voir Mesures » sur un brassin planifié, qui n'a pas de stock. D.

DEMANDE EXECUTANT : l'état conditionné (Pale Ale de septembre, 81 bouteilles) n'a pas été capturé : la carte n'a pas été trouvée par `cliquer`/`cliquerTexte` dans Brassins (voir `journal.json`, manques). À faire : dans `capturer-test-port.mjs`, après `cliquer(page, 'Brassins')`, lire `document.querySelector('main').innerText` pour trouver où la carte du lot conditionné s'affiche (sous-onglet, groupe replié, Stocks) et l'ouvrir, puis capturer `argent` et `argent-bas` (390 clair et cave, 1280 clair) ; à ouvrir côte à côte avec `p4/e3a/e3a-page.png` (haut) : litre 7,51 en trois notions (0,83 · 2,38 · 4,30), règle de l'impôt 16,88 | 25,32 | 33,76 et 6,84, bouteille 2,48 en tranches 2,10 · 0,30 · 0,08, règle du prix 5,00, reste 2,52 avec bascule bouteille / an, brassin 202,23 en 81 bouteilles (41 paient 202,77 · vendu 405,00), bouton ✦ Proposer.

## 5. Finances › Annuel — g6 (7 problèmes, 1 bloquant) — à corriger

Tête g4a : 2026 ⌄ · provisoire · Mois par mois, perte hachurée rouge avec « Stock au 31 déc. ? », Entré 720,00, colonne Dépensé + usure (usure hachurée « estimé »), piste de 9 avec 2 / 9 prêtes et Continuer, Impôts Fribourg, TVA, Dossier et archives. Les 9 étapes ont la tête commune « ‹ Annuel · Clôture 2026 · n / 9 », la piste, une question, un terme au second plan et une action noire ; les 12 tuiles de mois, le pont 4 000 → 4 181,60, les deux colonnes d'inventaire avec ≈ 22,42, l'escalier 1 800 → 921,60 avec −288,00 hachuré, les deux plateaux, les six tuiles privées, l'anneau 0/6, les deux tickets et le classeur sont là. Perte −506,40 au lieu de −477,80 : annoncé par ug (domaine).

1. tête — **« Matériel en charge 28,60 » écrasé sous l'usure : son texte chevauche « Nettoyage 42,00 », les deux sont illisibles** (clair et cave 390). **B** (illisible). Correction : hauteur minimale de bande ou étiquette sortie à droite comme la Synthèse le fait pour le matériel.
2. Mois par mois — en-têtes « Résultat · Entré · Dépensé » au-dessus d'une grille de quatre mois par ligne qui ne montre qu'un chiffre par mois : trois titres sans colonnes. G.
3. étape 8 — « À confirmer (annexe 05) » déborde de la carte à droite ; dessous « Justificatif manquant : DEMO-T1 — … », « DEMO-T2 », « DEMO-T3 » : identifiants bruts à l'écran. G.
4. étape 1 — la pastille « loyer noté en nov. seulement » de g6-1 est absente (deux pastilles sur trois). G.
5. étape 6 — le curseur « électricité 68,00 à confirmer » de g6-6 est absent, et les tuiles « ? » ne sont pas hachurées comme dans la maquette. G.
6. tête — TVA « 0 % » là où g6 écrit « 0,7 % » (part du seuil) ; lequel est juste ? à vérifier dans `fribourgTax`. D.
7. étape 5 — colonne « Tu dois » étroite : « Solde atelier · ancienne année », « Loyer de l'atelier » coupés sur deux lignes, montants décalés. D.

Doutes (non comptés) : l'étape 3 ajoute deux paragraphes d'explication (≈ 22,42 ; « La bière en cave se saisit dans la feuille… ») que g6-3 n'a pas ; la pastille d'App « Compagnon hors connexion » recouvre le bas de chaque étape à 390.

## Captures manquantes
- Argent conditionné (voir DEMANDE EXECUTANT ci-dessus).
- Opérations et Prix à 1280 et Argent cave : prises (`captures-port/`), non ouvertes.
