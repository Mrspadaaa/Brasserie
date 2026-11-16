# cd1 — g-d1 complet (16.11)

Base : `paliers/g-d1.html` (son choix « g-d1 · Ou p4 ») : courbe, barres, 7 rangées, ligne de tête de d1, onglet Calendrier.
On y remet chaque élément de CHOIX-CALENDRIER.md perdu en route. Chaque chose est contrôlée contre fb (sa maquette choisie)
et contre l'inventaire, pas contre le palier précédent.

Fichiers :
- `cd1.html` : 390 × 844, clair.
- `cd1-cave.html` : la même page en thème cave.
- `cd1-paysage.html` : 844 × 390, plein écran, 12 semaines.
- Outils : `build.mjs` (génère les trois pages), `cap.mjs` (captures DPR 2 et contrôles), `dump.mjs` et `dump2.mjs`
  (relevé des données du proto sources2 vivant, dans `donnees.json`).

Données : tous les chiffres viennent du proto sources2 vivant : soldes, mouvements, charges, rangées, « ensuite 1 782 dès
S26 · 28 juin / 4 359 dès S33 · 16 août », « 2 en retard ». fb affichait 259, 1 928 et 4 505, d'une autre série : ces
chiffres ne sont pas repris. La courbe et les pictos sont copiés de g-d1.

Captures, ouvertes en plein format :
- `cap/cd1.png`
- `cap/cd1-bas.png` (défilée jusqu'en bas)
- `cap/cd1-cave.png`
- `cap/cd1-paysage.png`

## Composition (390 × 844)

De haut en bas :
1. Tête, sur deux lignes :
   - « 113 CHF », avec à côté « à dépenser sans passer sous 0 » et « au plus serré S24 ⌄ » ; à droite, l'étiquette
     rouge « ⏲ 2 / en retard » ;
   - « ensuite 1 782 dès S26 · 4 359 dès S33 » et ⛶.
2. Courbe : fenêtre libre, repère « S24 · 113 », deux traits verts aux paliers S26 et S33, mois.
3. Une ligne d'outils : « 6 sem. ⌄ », ⇅, puis les 7 filtres (la liste défile).
4. Bande des semaines :
   - en légende : « libre en fin de semaine » ; « dessous : caisse ± · jours sur 2 » ;
   - par semaine : S, date, solde, mouvement, jours (« 4/2 j » en rouge).
5. Frise, une seule règle pour ses titres : chaque rangée a sa ligne de titre, à gauche et au-dessus de ses barres
   (● nom, +, résumé à droite). Pas d'exception, y compris pour Travaux, qui est vide.
6. Bas d'écran :
   - pied fixe, avec les hypothèses à gauche ;
   - le + « + S47 » à droite, 3 px au-dessus des onglets ;
   - les onglets.

Le + reste flottant (ombre). Son pied lui réserve sa place : il ne couvre rien, au repos comme en bas de page.

Le paysage reprend la même tête :
- les hypothèses, la période et le tri passent dans une colonne de gauche ;
- les titres de rangée s'y alignent aussi (une seule règle, la même colonne pour toutes) ;
- une marge à droite garde le + sans rien couvrir.

## Contrôles (`cap/controle.txt`, `node cd/build.mjs && node cd/cap.mjs`)

| page | tête | rangées entières / avec titre visible | défauts |
|---|---|---|---|
| cd1 au repos | 308 px (36,5 %) | 6 / 7 | 0 |
| cd1 en bas | — | 7 / 7 | 0 |
| cd1-cave | idem | idem | 0 |
| cd1-paysage | 228 px (58,5 %) | Brassins, Fêtes entières (Ventes coupée) | 0 |

- Ce que vérifie `cap.mjs` :
  - texte sur texte ;
  - texte sur une barre, un point ou un bouton étrangers ;
  - objet sur objet ;
  - texte ou bouton hors écran ;
  - conteneur qui coupe son texte ;
  - le + qui couvre quoi que ce soit.
- Témoin `cap/temoin-dates.html` (dates rendues à « ensuite » en portrait, ce qui pousse ⛶ hors écran) : il échoue,
  comme attendu (« BORD objet cd-ic 368-396 »).
- Sortie : **CONTROLE OK**.
- `controle-choix.mjs` ne s'applique pas : le calendrier n'est pas dans `ecrans.json`. L'inventaire, c'est
  CHOIX-CALENDRIER.md, ci-dessous.

## CHOIX-CALENDRIER.md, ligne par ligne

Statuts : ✔ présent, ◐ présent mais réduit ou partiel, — hors de cet écran ou non montrable en statique, ✘ refusé et absent.

| # | Élément | Coche | Où dans cd1 |
|---|---|---|---|
| 1 | Courbe de caisse au-dessus, barres dessous, mêmes semaines | ✔ | Courbe, bande des semaines, frise sur les mêmes 6 colonnes |
| 2 | Temps et argent ensemble sous la caisse | ✔ | Bande : solde, mouvement (−148, +120, +988…), jours |
| 3 | Plein écran, rotation en paysage | ✔ | ⛶ sous l'étiquette « 2 en retard » ; `cd1-paysage.html` |
| 4 | Projets sans budget, activités en jours | ✔ | Rangée Activités (« Ranger la réserve 3 j ») ; ligne « jours » de la bande |
| 5 | f1 à 10/10 | ◐ | Méthode : toutes les pertes remises ; le verdict lui revient |
| 6 | Filtres de planification | ✔ | 7 puces : Brassins, Fêtes, Ventes, Achats, Travaux, Activités, Papiers |
| 7 | Échelles longues, fenêtres en semaines | ◐ | « 6 sem. ⌄ » (3 mois, 6 mois, An), fenêtre sur la courbe de 53 semaines ; le montant mis de côté n'a pas de donnée dans sources2 |
| 8 | Période réglable, cohérente aux endroits où elle se règle | ◐ (à préciser) | Deux endroits qui disent la même chose : la puce « 6 sem. ⌄ » et la fenêtre de la courbe (6 semaines) |
| 9 | Onglet Calendrier en bas, 6e onglet | ✔ | Barre du bas, Calendrier actif entre Finances et Brassins |
| 10 | Le + est un bouton volant | ✔ | « + S47 », ombre et halo, au-dessus du pied |
| 11 | + dynamique, actions générales toujours là | — | Menu du + non montré en statique (fb-plus : « Partout / Sur Calendrier / Poser en S47 ») ; le libellé S47 dit l'écran |
| 12 | + en bas à droite, juste au-dessus des onglets | ✔ | Droite, bas à 785 px, onglets à 788 px ; il ne couvre rien (contrôle) |
| 13 | Base fb | ✔ | Tout ce que fb montrait au repos est revenu (pertes 1 à 16) |
| 14 | Filtrer, trier, épingler, étoile | ✔ / ◐ | Puces de filtre, ⇅ visible ; ★ sur « Marché de Noël » ; épingler à l'appui long, non montré |
| 15 | Hyper lisible, peu d'actions, pas de clavier | ✔ | Valeurs pointillées réglables sur place (montants, hypothèses) ; aucun champ |
| 16 | Leviers L1 à L7 | ◐ | L1 : ampoule S50 et + par rangée ; les autres leviers ne se voient pas au repos |
| 17 | K11, gestes directs | — | Poignées visibles aux deux bouts des barres ; gestes non joués (statique) |
| 18 | + dans la section → carnet | ✔ | Un petit + dans chaque titre de rangée |
| 19 | Critères 9,5-10 | ◐ | Non joués ici (statique) |
| 20 | Calendrier au centre ; Finances en mode finance | — | Hors de cet écran |
| 21 | Thème flottant, éventail, balayage | ✘ | Absent |
| 22 | L8, calendrier général et calendriers de section | ✔ / — | Celui-ci est le général, dans son onglet ; ceux de section sont hors écran |
| 23 | Calendriers de section, Finances = fb-fin | — | Hors de cet écran |
| 24 | m3pr-c, kyh1, kh1r, m3im-c | — (à préciser) | Hors de cet écran |
| 25 | Courses, Bord, AC, BO | — (à préciser) | Hors de cet écran |
| 26 | K13, vraie vue paysage 844 × 390 | ✔ | `cd1-paysage.html` : 12 semaines, 7 filtres sur une ligne, titres de rangée à gauche |
| 27 | kh1r, graphe où l'on voit les conséquences | ✔ | Courbe en escalier hachurée (écart entre prévu et réel), repère du point le plus serré, paliers S26 et S33 |
| 28 | kyh1 | — | Hors de cet écran (Finances) |
| 29 | ky2b, « À relier » replié | — | Hors de cet écran |
| 30 | ky3b, anneaux | — (à préciser) | Hors de cet écran |
| 31 | kx2r1, points par client, échelle log | — | Hors de cet écran (Tarifs) |
| 32 | Pas de compteur anxiogène, une date | ✔ | Les paliers sont datés (S26, S33 ; en paysage « 28 juin », « 16 août ») ; « 2 en retard » est l'état réel du proto, en mots, et ne fait pas de compte à rebours |
| 33 | L1 sans intrusion : ni rangée ni case de pose | ✔ / ✘ | Aucune rangée de pose (les « + + + + » de fb sont absents) ; seulement l'ampoule et le petit + par rangée |
| 34 | L9 : chaque geste décompte ce qu'il use | — | Pas de geste en statique ; le chariot cerclé de rouge dit le manque de malt du Porter (S50) |
| 35 | Liens L5, L11… gardés | ◐ | Lien pointillé du chariot vers son brassin ; les autres liens ne se voient pas au repos |
| 36 | L18, entretien daté | ✘ | Absent |
| 37 | L14, commande en double | — (à préciser) | Absent |
| 38 | Thème de l'app (cave et clair, couleurs de zone) | ✔ | `cd1.html` en clair (le défaut de DESIGN.md), `cd1-cave.html` ; jetons de g-d1, donc de l'app |
| 39 | Cible 8,5, changer de méthode si boucle | ✔ | Méthode changée : contrôle contre l'inventaire et fb, plus contre le palier précédent |
| 40 | sources2, direction bonne, à compacter | ✔ | Direction gardée ; tête 36,5 % contre 41,9 % pour sources2, avec en plus mouvement, dates, jours, filtres, paliers, hypothèses |
| 41 | Zones entourées, réduites sans être supprimées | ✔ | Voir le détail sous le tableau |
| 42 | Mini maquettes statiques | ✔ | Trois pages statiques |
| 43 | Les 16 calendriers compacts, refusés | ✘ | Rien de leurs formes propres |
| 44 | g-d1 ou p4 | ✔ | Base g-d1 |

Détail de la ligne 41 (zones entourées), chacune réduite et toujours là :
- 113 : ramené à 36 px, sur la ligne de sa phrase ;
- plein écran : une icône de 28 px ;
- « 2 en retard » : une étiquette de 64 px ;
- segments : une puce ;
- « libre en fin » : une légende de 12 px ;
- mois et dates : 12 px ;
- montants : 13 px ;
- titres de rangée : une ligne de 20 px.

## Perdus en route, remis

| n° | Perte | Où dans cd1 |
|---|---|---|
| 1 | Mouvement de la semaine | Bande, ligne 4 (−148, +120, −20, +988, −56, +666) |
| 2 | Le solde est nommé | Légende « libre en fin de semaine » ; en paysage, « libre en fin » dans la colonne de gauche |
| 3 | Date de chaque semaine | Bande, ligne 2 (16 nov. … 21 déc. ; en paysage, jusqu'au 1er févr.) |
| 4 | Charge contre présence | Bande, ligne 5 (1/2 j … ; « 4/2 j » rouge avec silhouette) ; légende « jours sur 2 » |
| 5 | Hypothèses réglables | Pied fixe : « caisse 4 180 · +120 / sem. · présence 2 j », pointillés et pastille « exemple » ; en paysage, à gauche de la courbe |
| 6 | Filtres au premier plan | Ligne d'outils, 7 puces |
| 7 | Tri ⇅ | Bouton visible, à côté de la période |
| 8 | Résumé par rangée | À droite de chaque titre (« 2 · −324 », « 1 · +1 180 », « rien de prévu »…) |
| 9 | Prochains paliers | « ensuite 1 782 dès S26 · 4 359 dès S33 », traits verts sur la courbe ; dates en paysage |
| 10 | Le chiffre dit ce qu'il est | « à dépenser sans passer sous 0 » et « au plus serré S24 » ; « S24 · 113 » sur la courbe |
| 11 | Fenêtre libre sur la courbe | Plus rien ne la couvre (la puce est sortie de la courbe) |
| 12 | Titres en clair, à gauche, au-dessus | Une règle unique, pour les 7 rangées |
| 13 | « 2 en retard » en mots | Étiquette « ⏲ 2 / en retard » |
| 14 | Le + dit la semaine | « + S47 » |
| 15 | Thème cave | `cd1-cave.html` ; + doré, jetons de g-d1 |
| 16 | Paysage 844 × 390 | `cd1-paysage.html` |
| 17 | Jours dans les barres (à confirmer) | Laissé comme g-d1 (barre de phases, « J0 / 28 ») : c'est son choix le plus récent |
| 18 | Segments visibles (à préciser) | Puce « 6 sem. ⌄ », comme g-d1 (sa zone entourée) ; le pincement n'est pas montrable en statique |
| 19 | Menu du + et gestes | Non montrés : page statique |

## Écarts voulus

- Six tailles de texte (12, 13, 14, 16, 17 et 36 px) contre trois dans B6 :
  - la bande des semaines garde la hiérarchie de fb (solde 17 px, le reste plus petit) ;
  - le 113 garde son poids, celui de d1.
- Le pied fixe (50 px) prend de la hauteur à la frise : la Papiers du repos tombe sous le pli (son titre reste visible).
  C'est le prix d'un + qui ne cache rien et d'hypothèses toujours visibles.
- Paysage : la tête prend 58 %, et seules deux rangées sont entières. On y gagne le double de semaines et tous les
  filtres sur une ligne.

## Boosters UX

- `fenetre` : suivre et ajuster. La fenêtre à poignées sur la courbe de l'année ; on la glisse pour changer de semaines.
- `detail` : lire. Le ⌄ de « au plus serré S24 » déplie le détail.
- `periode` : choisir. La puce « 6 sem. ⌄ ».
- `filtres` : choisir. Sept puces de couleur, celle des rangées.
- `hypotheses` : ajuster. Valeurs pointillées réglables sur place.
- Valeurs « −148 », « 3 j » : ajuster. Elles s'éditent sur place, dans la barre.

Gestes non joués : la page est statique.
