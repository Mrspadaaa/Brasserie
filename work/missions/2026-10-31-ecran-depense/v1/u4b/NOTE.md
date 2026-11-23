# u4b — le pont en rangées : la facture à gauche, montant compris, et ce que chaque ligne fait au stock (passe 2, 01.11)

- **Origine** : u4 (le pont, chaude), fusionnée avec z4 (le pont compact), selon `critique/SYNTHESE.md` § « u4 — le pont (fusion
  avec z4) ». La v0 (`v0/u4/`) n'a pas été touchée.
- **L'idée, toujours la même** : chaque ligne de la facture est câblée à son effet au stock. Elle est désormais **en rangées alignées** :
  quantité et unité imprimées, nom, montant | le lien | l'effet (« +6 kg », « nouveau », « Target bis », « +30 ? »).

## Les 3 retouches du critique, vérifiées
1. **Rangées de z4, montant sur chaque ligne, aucun croisement.**
   - Chaque rangée montre son montant : `7 malts 35,35`, `40 g Target α 11,3 1,60`, `30 ? Sabro 2,10`.
   - « 86,50 / 86,50 » est au pied du pont, et « — / — » tant que rien n'est lu (états 1 et 5).
   - Le câble est droit dans sa rangée. Un coude ne monte que d'une rangée, et seulement là où la ligne change de rangée :
     - le bis vers l'article existant, posé juste au-dessus (Target α 11,8 ; Hallertauer DE) ;
     - la mouture vers son malt (↑) ;
     - l'unité manquante est un « ? » sur le câble.
   - Plus aucun croisement : `u4b-e3-390.png`, `u4b-g-malts-ouverts.png`.
2. **Le bandeau noir redevient l'en-tête de la feuille.**
   - Fond gris, `86,50` en 28 px, « ✓ 23 lignes recoupées » qui ouvre la preuve (greffes u1 et r3) ; le bouton ⌄ ouvre sur place.
   - Les deux pastilles d'argent ouvrent leur calcul au toucher.
   - Trois tailles au premier écran : 28, 14 et 12 px. Le 13 px de la v0 est retiré.
3. **Honnêteté finie.**
   - Prix tels qu'imprimés, en chaîne : « 0,040 », « 0,0800 » (Galaxy), « 0,045 », « 0,070 ».
   - « Pour quoi ? » porte « proposé » ; la date d'achat porte « lue ».
   - L'inspecteur de r2 : « HO0102 imprimé « Target 11.3% » », `40 g × 0,040 = 1,60 ✓ au centime`, le segment Ingrédient / Service / Matériel,
     le choix d'article, Retirer.
   - Les 23 lignes, leurs codes et leurs libellés sont recopiés de `verite-facture-372765.json`.

## Greffes reçues (id d'origine)
- **u1, r3** — la preuve en trois rangées chiffrées, plus la page 2 :
  - `86,50` somme = total ; `23/23` quantité × prix = montant ; `2/2` lectures d'accord ;
  - « p. 2 coupée : seul son en-tête est visible » (`u4b-g-preuve.png`).
- **u2** — l'ordre par risque, l'argent puis le stock.
  - Le compteur « 6 à régler » porte 6 pastilles : bleues pour l'argent, ambre pour le stock, vertes une fois réglées.
  - Il saute au point suivant et l'ouvre (`u4b-g-saut-paye.png`, `u4b-g-saut-mouture.png`).
- **u2, r4** — le tableau des moutures et « +1,50 à part » :
  - « Maris Otter 6 Kg 2,30 → 2,40 /kg » ;
  - « Rattacher les 5 » (proposé) ou « Laisser en service » ;
  - ensuite, « malts ✓ mouture 36,85 », et « ✓ 2,40/kg » sur chaque malt une fois dépliés.
- **z4** — l'effet au stock par rangée ; les lignes sans doute repliées en une rangée : « 4 autres 15,00 → +200 g · 1 nouveau »,
  « 7 Stk levures 29,60 → +7 sachets · 1 nouveau ».
- **u4** — l'article existant (Target α 11,8, grisé, tireté) posé au-dessus de « Target bis ».
  - Deux câbles en fourche ; le choix efface l'autre ; le doublon évité reste visible (`u4b-g-target-regle.png`).
- **z3** — les tuiles de TVA :
  - « 2,80 lu · colonne MWST », « 4,15 · 1,95 + 2,20 lus », « – vide · proposé » (en vert) et « – HT non imprimé » ;
  - dessous, les bases, avec l'écart de 23,90.
- **z2** — le tampon « ✓ 23 lignes recoupées », incliné, qui vire au rouge avec l'écart dès que le total change.
- **r3 / r2** — la barre des 23 montants à l'échelle du total imprimé :
  - hachurée sur les doutes ; toucher une part ouvre sa ligne ;
  - un débordement serait hachuré en rouge.
- **r2** — le plateau de ligne ; et la pastille « = 2 sachets » sur une ligne en Stk.
- **r3** — la carte « Payé le » : « supposée 27.04.2026 » à côté de « date de la facture 27.04.2026 », « Date de paiement non imprimée ·
  « Betrag per E-Finance dankend erhalten » », puis « C'est la date » ou « Autre date ».
- **r2, z4** — l'état 8 en tableau à deux colonnes : n°, commande, total (380001 simulé, et dit).
- **r2, r4** — le pied reste actif pendant l'envoi :
  - « Envoi au Drive 0,4 / 0,7 Mo · tu peux fermer » ; 0,7 Mo vient de la vraie taille du fichier, 735 721 octets ;
  - puis le reçu : « L'Affinée / Justificatifs / 2026 », le nom lisible, « 735 721 octets · taille vérifiée », « Ouvrir dans Drive ».

## Retouches communes du lot
- **Les 6 points alignés**, par risque :
  1. TVA 2,80 · 4,15 ;
  2. Payé le 27.04, supposée ;
  3. 5 moutures ;
  4. Sabro, unité ;
  5. Target α 11,3 · 11,8 ;
  6. Hallertauer CH · DE.
- **Le simulé est dit** :
  - au premier écran, une pastille « simulé » sur le titre « Stock » ;
  - la phrase entière dans la Fiche et dans l'annexe : le stock d'essai, Target α 11,8 et Hallertauer DE, l'unité de Sabro (sa facture imprime
    « g »), la prévision de 90,00, la dépense 380001 et la lecture.
- **Les pictos** : un seul par tuile, toujours accompagné de son mot (« nouveau », « +6 kg », « Target bis », « +30 ? »).
  Plus aucune rangée de cinq cubes.
- **À 1280 px**, la colonne de droite porte les 6 points (cochés, barrés, avec la valeur retenue), la preuve et « Référence et TVA ».
  La Fiche s'ouvre d'office.
- **« Confirmer et enregistrer » reste toujours actif**, points réglés ou non, Drive non connecté ou hors ligne compris.
  `u4b-g-enregistre.png` enregistre avec 6 points ouverts (« Pas de bloquage »).
- **Le doute reste sur la ligne** : la rangée est teintée ambre et son plateau s'ouvre dessous. Le compteur n'en est que le résumé.

## Les 9 états, sur le vrai écran (`?etat=`, captures à 390 et à 1280)
1. **Lecture** : les trois étapes et « Saisir à la main » ; squelettes à la taille finale ; fiche vide « en lecture » ; colonne de droite
   cachée.
2. **Lue, sans point** : illustration, dite.
3. **Le premier écran.**
4. **TVA réglée**, puis `4t` **tout réglé**.
5. **Erreur** : « Lecture impossible · le fichier est gardé », Relire, « Saisir à la main ». La fiche est ouverte et vide, le pont tient une
   première ligne à la main, « — / — ».
6. **Drive à connecter** : « Connecter Drive » au pied ; Confirmer reste actif.
7. **Envoi**, puis `7r` **le reçu**.
8. **Doublon** : le tableau à deux colonnes.
9. **Hors ligne** : brouillon gardé ; Confirmer donne « enregistré au retour du réseau ».

## Boosters UX
| Booster | Rôle et effet | Captures |
|---|---|---|
| `pont-rangees` | lire et choisir ; les câbles changent de trait et de couleur au réglage | `g-target-ouvert` → `g-target-regle`, `g-saut-mouture` → `g-mouture-reglee` |
| `compteur-risque` | suivre et sauter | — |
| `barre-montants` | lire ; toucher une part ouvre sa ligne | — |
| `tampon-preuve` | lire | `g-preuve` |
| `argent` | choisir ; ouvre les tuiles de la TVA et la carte « Payé le » | `g-tva-ouverte` → `g-tva-reglee`, `g-paye-reglee` |
| `tuiles-tva` | choisir | — |
| `reglement` | choisir | — |
| `drive-pret` | lire | — |
| `justificatif` | lire | — |

- **B1** : OK.
- **B2** : OK. Le total domine ; un seul bouton plein.
- **B3** : OK, 92 mots.
- **B4** : OK. Familles nommées ; pas de carte dans une carte, sauf le plateau.
- **B5** : non mesuré.
- **B6** : OK. Trois tailles ; le mono porte les mesures seulement.
- **B7** : OK, CONTRASTE OK, pire 5,07:1.
- **B8** : OK, 9 états.
- **B9** : partiel, délai non mesuré.
- **B10** : OK. Aucun `type="number"` ; `inputmode="decimal"` ; chaque nombre se tape (total, quantité, prix, montant).
- **B11** : « 86,50 chez Brau- und Rauchshop, 6 à régler ; chaque ligne avec son montant, et ce qu'elle ajoute au stock ».
- **B12** : OK, STANDARD OK.
- **B13** : OK, rangées de 30 px.

## Contrôles (sorties)
| Contrôle | Sortie |
|---|---|
| `verifier-page` | PAGE OK (1 image, 390 px, sans erreur) |
| `controle-commun --profil=sans-houblons` | mots, couleurs, survol, blocs, contraste, standard, parlant, brutes OK → **COMMUN OK** (`sortie-commun.txt`) |
| `controle-standard`, premier passage | S3 ECHEC sur un rayon de 4 px (la barre) ; corrigé |
| `mots-premier-ecran --max=98` | 92 mots, MOTS OK |
| `controle-contraste` | 111 textes, pire « g » 5,07:1, CONTRASTE OK |
| `capturer.mjs` | CAPTURES OK (22 vues d'état et 11 gestes) |
| `grep type="number"` | 0 |

**`controle-panel`, hors liste, pour mémoire** : u4b-haut 0,47. Le fond le plus fréquent est le gris #F5F5F5, et les rangées blanches
s'en écartent de 30, sous le seuil de 60 : la mesure les compte comme vides. C'est le même angle mort que pour z4 (le critique : « z4
n'a pas à changer »). À l'œil, le premier écran est plein jusqu'au pied.

## Ce qui tient, ce qui casse
- **Tient** :
  - le mapping et l'argent sur la même rangée (« ça c'est ce que je voulais pour le stock », et les prix y sont) ;
  - le doublon évité se voit ;
  - aucun croisement ;
  - 92 mots, avec 6 points visibles.
- **Casse** :
  - à 390 px, « Hallertauer Bl… CH » est encore coupé ;
  - le moyen « Virement · E-Finance, déduit » et les étiquettes « proposé » et « lue » restent affichés pendant la lecture (état 1) ;
  - la barre des montants ne se touche pas part par part sous 1 CHF (le toucher prend la part la plus proche).

Captures (toutes dans `v1/u4b/`) :
- `u4b-e{1,2,3,4,4t,5,6,7,7r,8,9}-390.png` et `-1280.png` ;
- `u4b-g-{tva-ouverte,tva-reglee,saut-paye,paye-reglee,saut-mouture,mouture-reglee,target-ouvert,target-regle,malts-ouverts,preuve,enregistre}.png` ;
- `u4b-haut.png`, `u4b-page.png`.
