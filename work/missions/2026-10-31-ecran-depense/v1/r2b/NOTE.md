# r2b — le ticket, passe 2 (01.11)

- **Base** : v0/r2 (le ticket), classée première sur 12 par le critique. C'est un plancher à enrichir : rien n'en est retiré, sauf le compteur « 6 à régler », que la retouche 1 remplace.
- **Chaleur** : tiède, inchangée. La forme reste la ligne de ticket de Malts s1, avec le bandeau et les tuiles d'Identité r4-a.
- **L'idée, en une phrase** : il lit sa facture comme le papier ; les six points sont numérotés par risque au premier écran, et chacun se règle sur sa propre ligne, d'un toucher.

## Ce qui a changé, et pourquoi

**Retouche 1 — les doutes de stock montent au premier écran.**
- Sous les tuiles 1 TVA et 2 Payé, une rangée de chips numérotées par risque : « 3 mouture ×5 +1,50 · 4 Target α · 5 Sabro unité · 6 Hallertauer CH » (greffes z1 et u2).
- Une chip saute à sa ligne, avec un éclair ambre. Une fois réglée, elle se barre et sa pastille passe au vert.
- Le doute reste aussi sur la ligne (retouche commune).
- La chip 3 ouvre le tableau des moutures.
- Le « +1,50 » des moutures est compté à part jusqu'au rattachement. Ensuite, chaque malt affiche « ✓ 2,40/kg » (greffe r4).

**Retouche 2 — chaque point se règle sur sa ligne, sans plateau.**
- Target : la rangée du stock existant, grisée, « Target α 11,8 », est posée juste au-dessus du bouton « Target bis », avec ⇄ (greffe u4).
- Hallertauer : « Hallertauer Blanc DE » grisé, puis « Créer CH » et ⇄.
- Sabro : g · kg · Stk, sur la ligne même (greffe r1).
- Mouture : sur la première sous-ligne, « Rattacher les 5 », plus un toucher pour chacune. Le chevron ouvre le tableau « lu 2,30 → 2,40 /kg » des 5 malts, avec « Rattacher les 5 » et « Laisser en service » (greffe u2).

**Retouche 3 — la preuve.** « ✓ 23 lignes » ouvre :
- trois rangées chiffrées (greffe r3) : somme des lignes = imprimé 86,50, quantité × prix au centime 23/23, lectures d'accord 2/2 ;
- « 1 page vue, page 2 coupée : l'argent vu est complet » (greffe u1) ;
- le compte des liens, en pictos avec leur mot (greffes u1 et z3) : 13 reliés · 2 nouveaux · 2 bis · 1 unité ? · 5 moutures, soit 23 lignes. Le compte du critique, « 14 reliés … 1 ? », dépassait d'une ligne ; je l'ai corrigé.

**À 1280.**
- La colonne gauche porte le verdict, la preuve (ouverte d'office), les tuiles, les chips, puis les rubriques, avec « Référence et TVA » ouverte.
- Le ticket est à droite, plafonné à 720 px pour que le nom reste près de son montant.

**TVA.**
- Le panneau montre trois grandes tuiles (greffe z3) : « 2,80 · colonne MWST · lu », « 4,15 · N + R · 1,95 + 2,20 », et « — · proposé · HT vide » en vert.
- Les bases sont dessinées à l'échelle du total : le cadre vaut 86,50, et les bases 26,20 + 84,20 = 110,40 le débordent de +23,90, hachuré rouge (greffe u3).

**Payé le.**
- Une carte « payé le · supposée 27.04 / facture 27.04 », avec la mention « Date de paiement non imprimée · « Betrag per E-Finance dankend erhalten » » (greffe r3, facultative).
- Deux boutons : C'est la date / Autre date.

**Le pied.**
- « Confirmer » est toujours actif, même avec les six points ouverts (« Pas de bloquage sur une attente de mon feedback c'est primordial »).
- Ce qui reste ouvert s'enregistre sans risque : TVA vide, date supposée gardée, moutures en service, lignes douteuses sans mouvement de stock.
- Le reçu donne « 2026-04-27 Brau- und Rauchshop 372765.jpg », le chemin « L'Affinée / Justificatifs / 2026 », « Ouvrir dans Drive », puis une ligne « À revoir : … » (greffes r2 et r4).
- Pendant l'envoi : « Envoi au Drive · 0,4 / 0,7 Mo · tu peux fermer ».

**Retouches communes.**
- « Pour quoi ? » est marqué « proposé ».
- Le prix 0,040 est gardé tel qu'imprimé.
- Au repos, un picto par ligne. Au toucher, le plateau dit le lien en mot (relié, nouvel article, article bis, unité à préciser).
- L'annexe dit en une ligne ce qui est simulé.

**Autres corrections.**
- État 1 : rien de la facture n'est encore lu. Les rubriques et le Détail sont cachés ; restent Règlement (Payé / À payer) et « Pour quoi ? à taper ».
- État 5 : les rubriques affichent « à saisir », sans « proposé ».
- État 2 : TVA 2,80 lue.
- Un paramètre `?etat=` rend le vrai écran dans chaque état.

## Honnêteté
- Chaque chiffre vient de sa facture 372765 : 23 lignes, 86,50, MWST 2,80, N 1,95 + R 2,20, bases 26,20 + 84,20, lignes N 11,20 / R 75,30, 0,7 Mo, commande 686863, 10 Tage netto → 07.05.2026 marqué « déduite ».
- **Simulé**, et dit dans l'annexe :
  - l'unité illisible de Sabro (sa facture imprime « g ») ;
  - le stock Target α 11,8 et Hallertauer Blanc DE ;
  - l'état 2, c'est-à-dire sa facture sans ses points ;
  - l'état 8, le doublon 380001 du 30.04 (sonde d1).
- Ni son nom ni son adresse ne figurent dans la page.

## Baseline (inventaire) — cochée
- [x] Justificatif (icône d'en-tête : Voir l'original, Changer).
- [x] Total TTC (bandeau, se tape).
- [x] Pour quoi ? (proposé).
- [x] Achat du.
- [x] Déjà payé / À payer.
- [x] Payé le (supposée) et E-Finance.
- [x] Échéance déduite.
- [x] Fournisseur et catégorie.
- [x] Lier à une dépense prévue.
- [x] Les lignes. Le plateau montre l'imprimé et le code, `quantité × prix = montant` éditables avec le contrôle au centime, Ingrédient / Service / Matériel, l'article ⇄, aucun mouvement, retirer.
- [x] Ajouter.
- [x] Regrouper.
- [x] Détail X / Y, avec l'écart.
- [x] Référence et TVA : n°, pro-forma, commande, TVA, taux, HT « — non imprimé ».
- [x] Pied Confirmer, avec l'état du Drive.
- [x] ×.
- [~] Fiche matériel non dessinée : la facture n'a aucune ligne matériel.

## Boosters UX
- Boosters :
  - `chips-points` : saut et barré ;
  - `preuve` / `preuve-ouverte` ;
  - `compte-liens` ;
  - `barre` (23 segments ; un toucher donne la ligne) ;
  - `tva` / `tva-choix` ;
  - `paye` ;
  - `reglement` ;
  - `ligne` (plateau) ;
  - `mouture` / `mouture-tous` ;
  - `bis` ;
  - `unite` ;
  - `stock` ;
  - `drive` ;
  - `confirmer`.
- B1 OK — chaque geste change l'écran : chip barrée, prix au kg, tuile verte.
- B2 OK — 86,50 en 32 px ; une seule action noire.
- B3 OK, au plafond — 98 mots ; aucune phrase d'aide au repos.
- B4 OK — dans l'ordre : verdict, argent (1, 2), stock (3 à 6), ticket, le reste replié.
- B5 OK.
- B6 — tailles 12 / 14 / 16 / 24 / 32 px.
- B7 OK — pire contraste 5,24:1.
- B8 OK — 11 états capturés.
- B9 OK.
- B10 OK — aucun `type="number"`.
- B11 OK.
- B12 OK.
- B13 OK — cibles de 24 à 32 px ; le doigt a 28 px sur les chips.

## Contrôles (01.11, depuis la racine)
- `controle-commun v1 r2b --page=etat.html --profil=sans-houblons` : COMMUN OK.
- `mots-premier-ecran … --max=100` : r2b 98 mots, MOTS OK. À 105, il était en ÉCHEC. Je suis passé à 98 en raccourcissant « Confirmer et enregistrer » en « Confirmer », en remplaçant le ⌄ texte par un chevron SVG et en donnant 50 px aux lignes au lieu de 46.
- `controle-contraste …` : 188 textes, pire « TVA » 5,24:1, CONTRASTE OK.
- `verifier-page etat.html --min-images 0` : PAGE OK (390 px, sans erreur).
- `verifier-retouches.mjs` (dans ce dossier) : RETOUCHES OK 6/6.
  - R1 : les 6 points sont lisibles au-dessus du pied (pastilles à 199, 235 et 269 px ; le pied commence à 792).
  - R1 bis : une chip saute à sa ligne et se barre.
  - R2 : les six points se règlent avec 0 plateau ouvert, et le total reste 86,50.
  - R3 : la preuve s'ouvre en un toucher.
  - R3 à 1280 : la colonne gauche descend jusqu'au pied, sans trou.
  - Le pied reste actif, et le reçu dit ce qui reste à revoir.
- `controle-panel` sur les 13 captures d'états : remplissage médian 0,56. Le verdict est DIVERSITÉ ECHEC, ce qui est attendu : ce sont les états d'un même écran, et non une série v0.

## Captures (toutes ouvertes)
- `r2b-etat{1,2,3,4,4b,5,6,7,7b,8,9}-390.png` et `-1280.png`.
- `r2b-repos`, `r2b-page`, `r2b-1280`, `r2b-1280-annexe`.
- Gestes : `r2b-preuve`, `r2b-tva-ouverte`, `r2b-paye-ouvert`, `r2b-chip-target`, `r2b-chip-mouture`, `r2b-moutures-rattachees`, `r2b-sabro-unite`, `r2b-ligne-ouverte`, `r2b-enregistre-points-laisses`.

## Ce qui tient, ce qui casse
- **Tient** :
  - les six points se lisent d'un coup d'œil sans défiler, et chacun se règle sur sa ligne ;
  - la preuve chiffrée est à un toucher ;
  - le pied ne bloque jamais, et le reçu dit ce qui reste.
- **Casse** :
  - 98 mots, au plafond ; une ligne de plus sur le premier écran fait échouer le contrôle ;
  - à 390, Sabro et Hallertauer restent sous le pli : il faut la chip pour y aller ;
  - le panneau TVA ouvert pousse les chips 3 à 6 sous lui ;
  - le dessin des bases à l'échelle demande une ligne d'explication (« Le cadre est le total »).
