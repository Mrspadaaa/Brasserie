OK — 6 problèmes, 3 bloquants (les deux Sun Store en pages d'une dépense : la page 1 perdue, 163,85 payés contre 149,25 sans rouge, total coupé à 390 ; l'entrée « Documents », le rouge des totaux BAUHAUS et ses gestes tiennent)

Version : c76481aa (`claude/refonte-houblons-v4`), bundle servi `index-Bm7Esjph.js`, https://brasserie-l-affinee.web.app, compte connecté, 10.11.
Quatre passages, script `critique/en-ligne/jouer5.mjs` (repris de `jouer4.mjs`) : a) BAUHAUS tachée 390 clair ; b) Sun Store 1 + 2 en deux
fichiers par le bouton « Documents », 390 cave ; c) idem 1280 clair ; d) BAUHAUS tachée 1280 cave. Lectures Gemini : 1 neuve (b, 16 s), 3 servies
du cache (a 3 s, c 3 s, d 2 s) ; 4 appels au plus, tenu. 42 captures dans `critique/en-ligne-4/`, 17 planches `planches/p01` à `p17`
(`en-ligne/planches4.mjs`), toutes ouvertes (L12). Sorties : `en-ligne-4/sortie-*.txt`. « Confirmer » jamais touché ; tout fermé par × › Abandonner
(`preuveEncore:false`, retour Finances). Aucune erreur de page, aucun mot brut.

## Les trois points demandés

| point | vu | verdict |
|---|---|---|
| Un seul bouton « Documents » et sa note ; un fichier → lecture | 390 et 1280, clair et cave : un bouton plein (noir en clair, ambre en cave), picto pages, « Documents » ; note « Un fichier, ou plusieurs photos du même ticket · PDF ou image · 4 Mo max. » ; « Photographier le ticket » seulement en tactile ; « Saisir sans justificatif ». Sélecteur `application/pdf,image/*`, `multiple`, sans `capture`. Un fichier (BAUHAUS) → lecture directe, bloc en 2 à 3 s | **tient** |
| BAUHAUS piège : totaux faux en rouge, pastille → geste, aucun clavier | « Somme ≠ imprimé 277,60 / 352,05 −74,45 » rouge, cadre rouge, drapeau rouge d'une ligne « À vérifier · 74,45 CHF manquants » ; « Payé = imprimé · TWINT 352,05 » vert ; Somme → « Comparer à la photo » ouvre l'original en haut ; Lectures (ambre) → ouvre la ligne du désaccord ; `activeElement` = le bouton touché après chaque pastille, jamais un champ. Aucun chevauchement (`chev: []` sur toutes les rangées, 4 passages) | **tient** (voir 6 ; la lecture en cache compte 29 = 29, donc « Ajouter / Remplir la ligne » n'est pas atteignable en ligne : vu au banc p1 seulement) |
| Sun Store 1 + 2 en pages : sans chevauchement, en-tête au pire point | Deux fichiers → rangée « 1 2 + page · Lire 2 pages · ajoute la suivante, puis Lire », frise « 2 pages ✓ · lecture · vérification » ; après lecture « Articles lus = comptés 3 · 2 rabais » sur une ligne, rien de chevauché ; « 2 pages lues » ; pas de drapeau | **tient pour la forme, pas pour le fond** (problèmes 1 à 3) |

## Sa question : « combien et quels problèmes il y a ? »

1. **BLOQUANT — La page 1 est perdue et tout est vert.** Les deux photos sont deux tickets du même passage (ticket 1 : Paracétamol 5,40 + Ibuprofène 9,20 = 14,60, TVA 0,37 ; ticket 2 : vaccins 149,25 ; « Total EFT CHF 163,85 » imprimé sur les deux). Lecture neuve (b, 390 cave) : la première passe les avait (lignes Paracétamol et Ibuprofène, total 163,85, TVA 0,37), la vérification les a « corrigées » : « 8 corrigées », 163,85 barré pour 149,25, 0,37 barré pour 0,00, les deux lignes barrées « pas retrouvée · 1/6 » ; cache (c, 1280 clair) : 5 lignes, 149,25, TVA 0,00, plus trace des deux articles. Pendant ce temps « Articles lus = comptés 3 · 2 rabais », « Somme = imprimé 149,25 », « Brut − rabais 149,25 / 149,25 », « Lignes hors articles · Photo : rien à signaler » sont cochés vert. En brasseur : « j'ai payé 163,85, il me met 149,25 et tout est vert ? ». Valeur fausse (total, TVA), éléments absents (2 lignes réelles). Attendu : une donnée lue une fois et absente de la relecture n'est pas barrée en silence sous des coches vertes ; le total imprimé d'une dépense à plusieurs pages est celui du règlement (163,85), les 149,25 un sous-total ; l'écart passe en rouge (problème 2).
2. **BLOQUANT — Deux totaux qui ne concordent pas, rien en rouge : sa plainte du 09.11 rejouée.** Rangée « · Payé · TWINT  montant non lu » en gris, note dessous « Le terminal affiche 163,85, plus que le total » : le montant est donc lu, et il dépasse le total de 14,60 ; aucun rouge, aucun drapeau « À vérifier », aucune pastille (`pastillesEcart: []`), aucun geste. Même rendu 390 cave et 1280 clair. SPEC 09.11 : « quand 2 totaux sont incorrectes, ça le marque pas en rouge ». Attendu : « ! Payé ≠ imprimé 163,85 / 149,25 +14,60 » rouge, drapeau « À vérifier · 14,60 CHF payés en plus », geste « Comparer à la photo » (ou « Ajouter la ligne manquante » quand le compte d'articles le dit), et un texte qui ne se contredit pas (« montant non lu » / « affiche 163,85 »).
3. **BLOQUANT — Le total est coupé à 390.** Cave, Sun Store (`b-04`, `b-05`, `b-08`, `b-09`) : la case du total montre « 149,; », le « 25 » est tronqué, parce que « 163,85 » barré et « 5 lignes » se serrent à côté. Texte illisible sur le chiffre principal de l'écran ; BAUHAUS (sans valeur barrée) et 1280 s'affichent entiers. Attendu : le total entier d'abord, la valeur barrée à la ligne ou en note.
4. **Icônes de stock sur une dépense « Autre ».** 390 cave : les lignes barrées Paracétamol, Ibuprofène et H21 portent le pictogramme paquet (`b-06`, `b-07`). SPEC 09.11 : « juste ce qui concerne vraiment le brassage » ; le verdict 3 avait 0 icône sur Sun Store. Attendu : aucune icône de stock sur une dépense hors brassage, lignes barrées comprises. Non bloquant.
5. **Le pied « pas retrouvée · 1/6 » mange l'écran à 390.** Bande de quatre lignes (« SUN STORE Paracétamol cpr 500 mg 20 pce 5,40 · pas retrouvée · 1/6 · Tout valider · Garder · Retirer ») fixe sur toutes les vues (`b-04` à `b-09`), qui masque le bas de la liste ; « Tout valider » entérine en un toucher les 6 corrections, dont la perte de la page 1 (problème 1). D277 : le pied dit le pire point, en une ligne. Non bloquant.
6. **1280 : « Comparer à la photo » n'a rien à comparer.** BAUHAUS cave (`d-07`) : l'original s'ouvre en haut dans un cadre pleine largeur, le ticket fait ~140 px de large, texte illisible, le bloc rouge est dessous. Le geste fait ce qu'il dit, mais la comparaison est impossible sans zoom. Attendu : la photo en colonne à côté du bloc, ou à hauteur lisible. Non bloquant.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| bauhaus a 01, 02 | clair | 390 | Finances ; entrée « Documents », « Photographier le ticket », note, « Saisir sans justificatif » | — | — |
| bauhaus a 03, 04 | clair | 390 | lecture du cache : 352,05, 29 lignes, drapeau rouge « 74,45 CHF manquants », Somme rouge, Payé vert, Lectures ambre, « 12 à contrôler » | — | — |
| bauhaus a 05, 06 | clair | 390 | lignes Rénovation 29 (Peinture et sols 5, Outillage 5, Divers travaux 16), 0 icône | — | — |
| bauhaus a 07 | clair | 390 | Somme touchée → « Voir l'original » ouvert en haut, focus bouton | — (doute : défilement) | — |
| bauhaus a 08 | clair | 390 | Lectures touchée → BAUHAUS BUT NAAHU ouverte (« 1 pièce L × 1,20 », Matériel, « article — · hors stock ») | — (doute D329) | — |
| bauhaus a 09 à 11 | clair | 390 | bloc inchangé ; × › Abandonner, retour Finances | — | — |
| sunstore b 01 à 03 | cave | 390 | Finances ; entrée ambre ; 2 pages jointes, « Lire 2 pages », frise | — | — |
| sunstore b 04, 05 | cave | 390 | lecture neuve 16 s : « 149,; » + 163,85 barré, 5 lignes, tout vert, Payé gris « montant non lu / terminal 163,85 », TVA 0,00 (0,37 barré), « 8 corrigées » | 1, 2, 3, 5 | 1, 2, 3 |
| sunstore b 06, 07 | cave | 390 | lignes : H21 « 2 × — 50,00 », ancienne H21 barrée (icône), Vaxigrip, Rabais, Comirnaty, Rabais, Paracétamol et Ibuprofène barrés (icônes) ; pied « pas retrouvée · 1/6 » | 1, 4, 5 | 1 |
| sunstore b 08 à 10 | cave | 390 | bloc inchangé ; × › Abandonner, retour Finances | 1, 2, 3 | 1, 2, 3 |
| sunstore c 01 à 03 | clair | 1280 | Finances ; entrée noire pleine largeur, note ; 2 pages jointes, « Lire 2 pages » | — (doute) | — |
| sunstore c 04 à 08 | clair | 1280 | cache 3 s : 149,25, 5 lignes, tout vert, Payé gris « montant non lu / terminal 163,85 », TVA 0,00, « Lignes = total 149,25 », 0 icône | 1, 2 | 1, 2 |
| sunstore c 09, 10 | clair | 1280 | × › Abandonner, retour Finances | — | — |
| bauhaus d 01, 02 | cave | 1280 | Finances ; entrée ambre pleine largeur | — (doute) | — |
| bauhaus d 03 à 06 | cave | 1280 | deux colonnes : bloc rouge à gauche (drapeau une ligne), 29 lignes à droite | — | — |
| bauhaus d 07 | cave | 1280 | Somme touchée → original ouvert, ~140 px de large | 6 | — |
| bauhaus d 08, 09 | cave | 1280 | Lectures touchée → ligne ouverte ; bloc inchangé | — | — |
| bauhaus d 10, 11 | cave | 1280 | × › Abandonner, retour Finances | — | — |

## Doutes (non comptés)
- Sun Store : « Pour quoi ? SUN STORE · services · proposé » et « Fournisseur et catégorie SUN STORE · Autre » : deux catégories pour une dépense.
- « H21 Avaccination par pharmacien/ne » : « A vaccination » collé par la lecture ; « 2 × — 50,00 » (prix unitaire inconnu) est honnête.
- 390 : « Comparer à la photo » fait défiler en haut ; le bloc rouge passe sous la photo, comparer demande un aller-retour (déjà noté au VERDICT-4).
- BAUHAUS : « Voir le désaccord » ouvre la ligne sans l'autre lecture (D329, déjà noté).
- 1280 : le bouton « Documents » et « Lire 2 pages » font 1 246 px de large, la note en gris 11 px : lisible, mais tout l'écran pour un bouton.
- BAUHAUS 390 cave et Sun Store 390 clair non joués (chaque pièce dans un thème par largeur, pour tenir les 4 lectures).
- La lecture BAUHAUS en cache compte 29 = 29 : les gestes « Ajouter la ligne manquante » / « Remplir la ligne ajoutée » et la bande « ce qui manque » n'ont pas été vus en ligne.

LEÇON PROPOSÉE : une dépense à plusieurs photos se joue avec deux tickets distincts du même règlement, pas seulement avec deux vues d'un même ticket : c'est là que la relecture « corrige » des données vraies et que le total du terminal diverge du total imprimé.
