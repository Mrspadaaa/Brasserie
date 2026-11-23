# z2b — la facture annotée au stylo, les 23 lignes sur le papier (passe 2, 01.11)

Base : `v0/z2/etat.html` (chaleur tiède, « là je vois ce qu'elle a lu »), reprise telle quelle : le papier blanc sur fond gris
#E9E9E9, l'en-tête imprimé, le tampon, le bloc MWST cerclé avec ses chiffres lus tels quels, les accolades à l'encre, le stylo en
tête, le tiroir de la dépense. La v0 n'est pas touchée.

## Ce qui a changé, et pourquoi

**Retouche 1 (critique z2-1) : les 23 lignes sont imprimées sur le papier**, dans l'ordre de la facture, colonnes Menge /
Bezeichnung / Betrag, l'icône de lien dans la marge gauche (un seul picto par rangée), les accolades à l'encre entre chaque malt et
sa « Zuschlag Schrotung » (mouture), le montant de chaque ligne tapable. Le bas du premier écran n'est plus vide : remplissage
**0,91** (controle-panel, v0 : 0,63 selon le critique).

**Retouche 2 (z2-2) : six pastilles au stylo**, le même jeu de points que r et u, dans l'ordre du risque : 1 TVA imprimée
(argent) · 2 Payé le supposée (argent) · 3 mouture ×5 (stock) · 4 Target α 11,3 ≠ 11,8 (stock) · 5 Sabro unité ? (stock,
**simulé**) · 6 Hallertauer Blanc CH ≠ DE (stock). Chaque pastille et chaque « y aller » descend à sa ligne du papier et la fait
clignoter ; le geste se fait **sur la ligne**, avec le bouton inline de r1 : « Target bis / même lot », « g · kg · Stk », « Créer
« Hallertauer Blanc CH » / même article », « ↑ » sur chaque mouture. La capture `z2b-etat4b-390.png` montre six ✓.

**Retouche 3 (z2-3) : l'en-tête du papier s'édite sur place** (fournisseur, n°, date : champs soulignés en pointillé, comme r4-a) ;
les chips remontent sous le tampon (Brassage, prévue · aucune, Drive prêt) ; le reste de la dépense (Pour quoi ? proposé, Déjà payé /
À payer, moyen, échéance, catégorie, prévue, HT non imprimé, + ligne, regrouper, 86,50 / 86,50, justificatif Voir / Changer) est dans
la carte « Dépense » sous le papier à 390, dans la colonne de droite à 1280.

## Greffes reçues (id d'origine)
- **u1** (`u1-preuve.png`) : le tampon ouvre la preuve : « 23 × (quantité × prix) = montant, au centime », « somme 86,50 = total
  imprimé 86,50 », « deux lectures d'accord sur le reste », « 1 page vue ; page 2 coupée : ses lignes sont inconnues, l'argent vu est
  complet » (`z2b-preuve-390.png`).
- **r1** : la rangée de doute avec son bouton inline (Target bis, Créer CH, g · kg · Stk).
- **z1** : les points numérotés, barrés une fois réglés (la liste « À régler » et les pastilles ✓).
- **u2** : le tableau des moutures « lu 2,30 → avec mouture 2,40 /kg » (cinq malts) + « Rattacher les 5 / Laisser en service »,
  ouvert par le point 3 sous la première mouture (`z2b-moutures-390.png`) ; chaque mouture garde aussi son « ↑ ».
- **u4** : le Target existant (stock α 11,8, grisé) posé devant « Target bis α 11,3 » ; idem Hallertauer Blanc DE devant « Créer CH ».
- **u3** : les bases TVA à l'échelle sous le bloc MWST cerclé : 86,50 en bleu gris, **+23,90** hachuré rouge au-delà.
- **r3 / r2** : la barre des 23 montants à l'échelle sous l'en-tête, aux couleurs des familles, hachurée sur les lignes en doute (ambre)
  puis en vert une fois réglées ; une touche = la ligne.
- **r2** : le plateau de ligne au toucher du nom : « imprimé « Maris Otter, Kg » · MA0221 », `6 Kg × 2,30 = 13,80 ✓` (quantité et
  montant tapables), Ingrédient / Service / Matériel, « Stock Maris Otter ⇄ », Retirer la ligne (`z2b-plateau-390.png`).
- **r2 / r4** : « = 2 sachets » en pastille grise sur les levures en Stk.
- **r4** : « 30 ? » sur Sabro, « rien tant que l'unité manque » dans son plateau ; pastille bleue « nouveau » (cercle pointillé +).
- **r3** : la carte « Payé le » sous la mention imprimée « Betrag per E-Finance dankend erhalten » : 27.04.2026 supposée = facture,
  « c'est la date / autre date ».
- **r2 / z4** : l'état 8 en tableau à deux colonnes (ce papier / déjà enregistré : n°, date, commande, total) et le pied « Rattacher le
  justificatif ».
- **r2 / r4** : le pied actif pendant l'envoi (« Envoi au Drive 0,4 / 0,7 Mo · tu peux fermer, ça continue »), puis le reçu avec le nom
  lisible, « Ouvrir dans Drive · L'Affinée / Justificatifs / 2026 · vérifié ».
- **u1 / z3** : le compte des liens est porté par la barre et la marge (13 reliés, 2 nouveaux, 2 bis, 1 ?, 5 moutures = 23), sans rangée
  de cinq pictos à déchiffrer (retouche commune).

## Retouches communes
Un seul jeu de six points ; « Pour quoi ? » marqué « proposé » ; un picto par rangée, le mot au toucher (plateau) ; 1280 à deux
colonnes (papier à gauche, points + dépense à droite, sticky) ; **Confirmer reste actif** dans tous les états, points réglés ou non,
Drive à connecter compris (« Pas de bloquage ») ; le doute reste sur la ligne même quand le stylo le résume (A1 « les deux »).

## Honnêteté
Chaque chiffre vient de `verite-facture-372765.json` : 23 lignes, prix tels qu'imprimés (« 0,040 », « 0,0800 »), codes article, bloc
MWST (26,20 / 1,95 ; 84,20 / 2,20 ; 2,80), 86,50. Simulé et dit sur la page (annexe) et dans le plateau de Sabro : Sabro imprime « g »
(rendu illisible pour montrer D214) ; le stock (Target α 11,8, Hallertauer DE, les reliés) et le doublon 380001 sont fictifs. HT vide,
« non imprimé » ; Payé le « supposée = facture » ; une valeur déduite n'est jamais montrée comme lue.

## Baseline cochée
justificatif (nom, 0,7 Mo, Voir, Changer, Drive prêt) · Total TTC tapable · Pour quoi ? (proposé) · Achat du (en-tête) · Déjà payé /
À payer · Payé le + moyen · Échéance (avec À payer) · Fournisseur (en-tête, sur place) et catégorie · Lier à une dépense prévue ·
lignes (type d'achat Ingrédient / Service / Matériel, article du stock ⇄, quantité, unité imprimée gardée, montant) · + ligne ·
regrouper · Retirer la ligne (plateau) · 86,50 / 86,50 · n° facture, commande, TVA, taux · Confirmer et enregistrer · ×. Matériel :
aucune ligne sur sa facture ; le type « Matériel » est dans le plateau.

## Boosters UX (boosters-ux)
`stylo-point-courant`, `tampon-preuve`, `barre-montants`, `chips-depense`, `edition-sur-place`, `deux-valeurs`, `bases-echelle`,
`carte-paye-le`, `unite-segment`, `type-achat`, `bascule-reglement`, `action-unique`. B1 OK (captures repos / 4a / 4b / moutures /
plateau / preuve diffèrent) · B2 OK (le papier, un seul primary) · **B3 ECHEC : 149 mots au premier écran** (seuil 70, toléré 98) :
ce sont les 23 lignes demandées par la retouche 1 (quantité, unité, nom, α, montant), pas de l'explication ; voir DÉCISION · B4 OK ·
B5 OK · B6 OK (12 / 14 / 16-22, mono tabulaire) · B7 OK (CONTRASTE OK) · B8 OK (9 états joués sur l'écran, `?etat=n`, captures 390 et
1280) · B9 OK · B10 OK (0 `type="number"`) · B11 : « la facture 372765, 86,50, 23 lignes recoupées, six points dont la TVA » · B12 OK ·
B13 OK (24–26 px, boutons de ligne 20–22 px dans une rangée de 26 px : exception d'espacement).

## Contrôles (sorties)
`verifier-page` : PAGE OK. `controle-commun --profil=sans-houblons` : COMMUN ECHEC 1 (mots) ; couleurs, survol, blocs, contraste,
standard, parlant, brutes OK. `mots-premier-ecran --modere` : 149 (> 98). `controle-contraste` : CONTRASTE OK. `capturer.mjs` :
CAPTURES OK, 11 écrans d'état × 2 largeurs, sans erreur de script. `controle-panel` (z2b-haut-390 avec z2-haut) : remplissage z2b
**0,91** (≥ 0,55).

## Ce qui tient, ce qui casse
Tient : le papier entier est là, annoté, et chaque doute a son geste sur sa ligne ; à 1280 la colonne de droite porte les six points
et la dépense. Casse : 149 mots au premier écran (le papier parle) ; un PDF à 35 lignes fait un long papier ; le pied sticky cache la
dernière ligne tant qu'on n'a pas défilé jusqu'au bout.
