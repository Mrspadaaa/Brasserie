# cd1 — g-d1 complet, passe corrective (16.11)

Base : `paliers/g-d1.html` (son choix « g-d1 · Ou p4 ») : courbe, barres, 7 rangées, onglet Calendrier. Chaque
élément de CHOIX-CALENDRIER.md perdu en route y est remis, contrôlé contre fb (sa maquette choisie) et l'inventaire.
Cette passe corrige les 24 problèmes de la critique du 16.11 (portrait, bas, cave, paysage) sans rien changer d'autre.

Fichiers : `cd1.html` (390 × 844, clair), `cd1-cave.html` (cave), `cd1-paysage.html` (844 × 390, plein écran,
12 semaines). Générés par `build.mjs` ; `cap.mjs` capture (DPR 2) et contrôle. Données : relevé du proto sources2
vivant (`donnees.json`). Captures d'avant la passe : `cap/avant/`.

Captures, ouvertes en plein format : `cap/cd1.png`, `cap/cd1-bas.png`, `cap/cd1-cave.png`, `cap/cd1-paysage.png`.

## Les 24 problèmes, un par un

| n° | Correction | Vérifié sur |
|---|---|---|
| 1 | Mouvement = solde(n) − solde(n−1), caisse de départ 4 180 : −148 +120 −20 +988 −56 **+486** **−60** **−460** −260 +120 −112 −280. Tout s'additionne (5 064 + 486 = 5 550 ; 5 550 − 60 = 5 490 ; 5 490 − 460 = 5 030) | build.mjs (sortie), cd1.png |
| 2 | Jauge de 2 cases par semaine (▮▯ = 1 jour pris sur 2) ; dépassement : deux cases rouges et « +2 j » ; légende « jours ▮▯ sur 2 » | cd1.png, bande |
| 3 | Paysage : tête sur une ligne (113, « à dépenser cette semaine », ensuite datés, retard, quitter) ; hypothèses en face de la courbe ; bande réduite à S, date, solde (le reste à un toucher, `role=button` par semaine) ; barres de 22 px. Tête 174 px (44,6 %), frise 55,4 % ; Brassins, Fêtes, Ventes, Achats entières (avant : Brassins et Fêtes) | controle.txt, cd1-paysage.png |
| 4 | Résumés recomptés : Ventes « 4 · +900 » (+640, +260, mensuel, 3 fûts) ; Papiers « 3 · −806 » en portrait (loyer de déc., −312, −94), « 4 · −1 986 » en paysage (3 loyers, −312, −94, −380) | cd1-bas.png, paysage |
| 5 | Paliers datés en portrait : « 1 782 dès S26 · 28 juin », « 4 359 dès S33 · 16 août » ; ⛶ monté sur la ligne de tête | cd1.png ; témoin |
| 6 | « 2 en retard » : une ligne de 13 px, rouge, sans cadre, avec › (un toucher ouvre la liste) | cd1.png |
| 7 | Les 4 segments de fb (6 sem. / 3 mois / 6 mois / An) et l'intitulé « 16 nov. → 27 déc. » (paysage : « 16 nov. → 7 févr. ») | cd1.png, paysage |
| 8 | Filtres en 13 px ; la liste s'efface en fondu et finit sur « +3 › » ; en paysage, les 7 tiennent sur une ligne | cd1.png, paysage |
| 9 | Chaque picto a son mot dessous : « +260 », « mensuel », « 3 fûts », « à commander », « −312 », « −94 » | cd1.png, cd1-bas.png |
| 10 | Commande de malt avancée en S49, avant le Porter (S51) ; le chariot du Porter dit « à commander » | cd1-bas.png |
| 11 | Un seul nom : « Noël privés » dans les deux sens | cd1.png, paysage |
| 12 | Une règle des noms, dans les deux sens : dans la barre s'il tient, sinon au-dessus de son début (contre le bord droit s'il n'y tient pas). Largeur estimée par caractère, contrôlée en page (« NOM DEBORDE ») | controle.txt |
| 13 | Courbe 68 px en portrait (136 px de capture), 45 px en paysage (90) ; axe de fb : « D 2027 F M A M J J A S O N » | cd1.png, paysage |
| 14 | Paliers : trait vert plein de 2,5 px, valeur en tête (« 1 782 », « 4 359 ») | cd1.png |
| 15 | Pied fixe supprimé ; hypothèses sur une ligne sous les filtres (ordre de fb) ; la frise va jusqu'aux onglets | cd1.png |
| 16 | Cave : fond de barre à 34 % de la couleur de zone ; Achats est bleu | cd1-cave.png |
| 17 | Activités en violet (#6a4c93, cave #b8a0e6), Papiers en gris ; Travaux cave en vert-jaune (#b9c95c), distinct du doré du + | cd1-bas.png, cd1-cave.png |
| 18 | Rangée vide repliée en une ligne de 18 px : « ● Travaux + rien de prévu » | cd1-bas.png |
| 19 | ⛶ sur la ligne de tête ; en paysage, icône « quitter le plein écran » | cd1.png, paysage |
| 20 | « 113 CHF à dépenser cette semaine » | cd1.png |
| 21 | Trois tailles : 36, 16, 13 px (contrôle : « tailles 13/16/36 px ») | controle.txt |
| 22 | Paysage : une hypothèse par ligne, libellé à gauche, valeur alignée à droite ; pastille « exemple » au-dessus | paysage |
| 23 | « Loyer du local −400 / mois » | cd1-bas.png |
| 24 | Montants des factures du même côté : dessous en portrait, à droite en paysage | cd1-bas.png, paysage |

## Contrôles (`node cd/build.mjs && node cd/cap.mjs`, sortie dans `cap/controle.txt`)

| page | tête | rangées entières | défauts |
|---|---|---|---|
| cd1 au repos | 393 px (46,6 %) | 5 / 7 (Activités : titre ; Papiers sous le pli) | 0 |
| cd1 en bas | — | 7 / 7 | 0 |
| cd1-cave | idem | idem | 0 |
| cd1-paysage | 174 px (44,6 %) | 4 / 7 (Brassins, Fêtes, Ventes, Achats) | 0 |

- `cap.mjs` vérifie : texte sur texte, texte sur objet, objet sur objet, bord, coupe, + qui couvre, et désormais
  « NOM DEBORDE » (un nom posé dans sa barre doit y tenir). Le texte rogné de la liste des filtres sort du contrôle.
- Témoin `cap/temoin-dates.html` (⛶ remis sur la ligne « ensuite » datée) : il échoue, comme attendu
  (« BORD objet cd-ic 364-394 »).
- Sortie : **CONTROLE OK**.
- Les additions (problème 1) sont garanties par le calcul, pas par `cap.mjs` : il ne lit pas le sens des chiffres.
- `controle-choix.mjs` ne s'applique pas : le calendrier n'est pas dans `ecrans.json`. L'inventaire, c'est CHOIX-CALENDRIER.md.

## Limites restantes

- Portrait : la tête passe de 36,5 % à 46,6 %, parce que la période, l'intitulé et les hypothèses y sont revenus
  (fb : 57 %). Le pied fixe n'existe plus, la frise descend jusqu'aux onglets.
- Le + rond (celui de fb) flotte sur la frise au repos ; il ne couvre ni nom ni montant au repos ni en bas de page.
- Paysage : Travaux, Activités et Papiers restent sous le pli (un défilement). Pour les montrer, il faudrait
  renoncer à la règle « nom au-dessus de son début » pour les barres d'une semaine, ou au mot sous les pictos.

## CHOIX-CALENDRIER.md, ce qui a bougé

Statuts : ✔ présent, ◐ réduit ou partiel, — hors écran ou non montrable en statique. Lignes inchangées depuis le
premier cd1 : 1, 2, 4, 5, 6, 9, 10, 11, 13 à 31, 33 à 44 (voir l'historique Git de ce fichier).

| # | Élément | Coche | Où dans cd1 |
|---|---|---|---|
| 3 | Plein écran, rotation | ✔ | ⛶ sur la ligne de tête ; « quitter » en paysage |
| 7 | Échelles longues | ✔ | 4 segments, intitulé daté, fenêtre de 53 semaines sur la courbe |
| 8 | Période réglable, cohérente | ◐ (à préciser) | Les segments et la fenêtre de la courbe disent la même période |
| 12 | + en bas à droite, au-dessus des onglets | ✔ | Rond, droite, 3 px au-dessus des onglets |
| 27 | kh1r, conséquences visibles | ✔ | Courbe plus haute : hachures prévu / réel lisibles |
| 32 | Une date, pas un compteur | ✔ | Paliers datés en portrait comme en paysage ; retard en une ligne sans cadre |
| 38 | Thème de l'app | ✔ | Clair (défaut de DESIGN.md) et cave ; CHOIX-CALENDRIER.md l. 38 dit « cave par défaut » : à corriger par le pilote |
| 41 | Zones entourées réduites | ✔ | 113 en 36 px ; ⛶ 30 px ; retard une ligne de 13 px ; segments 28 px ; légende 13 px |

Pertes 1 à 16 de l'inventaire : toutes présentes. 17 (jours dans les barres) : barre de phases « J0 / 28 » gardée,
à confirmer avec lui. 18 (segments) : remis, comme fb.

## Boosters UX

- `fenetre` : la fenêtre à poignées sur la courbe de l'année, à glisser.
- `detail` : le ⌄ de « au plus serré S24 ».
- `periode` : les 4 segments.
- `filtres` : 7 puces de la couleur des rangées.
- `hypotheses` : valeurs pointillées, réglables sur place.
- Jauge des jours : 2 cases par semaine, rouges au-delà.

Gestes non joués : la page est statique.
