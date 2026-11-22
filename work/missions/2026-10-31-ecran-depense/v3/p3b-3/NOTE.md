# p3b-3 — l'index (passe 3, 01.11)

- **Chaleur** : chaude (forme libre, même base).
- **Axes** : en-tête de groupe = **ligne de sous-total collante** (fine, soulignée à la couleur du groupe : « Houblons 7 ·
  270 g + 30 ? · 20,05 ») ; densité = **une rangée** sans colonnes (nom · α · qté · pastilles · montant) ; à droite, le **rail
  des 23 lignes**, collant, à la couleur de chaque ligne, hachuré sur les doutes : un toucher y mène ; renvoi = **défilement +
  éclair** sur toutes les lignes visées, avec un pas « 1/2 › ✕ » pour la suivante ; mouture **en pastille sur la rangée de son
  malt** (« ↳0,60 », en tirets tant qu'elle n'est pas rattachée ; un toucher ouvre son plateau) ; bascule « n° » en tête du rail
  (ordre du papier) ; échec Drive = **bandeau plein en haut de l'app**, qui reste jusqu'au geste ; réussi = rien.
- **L'idée** : la liste dense de son ticket, avec un index des 23 lignes sous le pouce.

## Base et pastilles de r1
Mêmes coches que p3b-1 pour le récap et les six points (4, 5, 6 sous leur rangée ; 3 sous la ligne Malts ; 1 et 2 en tuiles).
Pastilles r1 sur la ligne : picto, « = 2 sachets », « 30 ? », la mouture devient elle-même une pastille. Écart : la mouture
quitte sa propre rangée ; sa ligne du papier reste entière (montant, état, plateau) et la vue papier la remet à sa place.

## Baseline — cochée
Comme p3b-1 ; [~] fiche matériel. Drive : rien avant Confirmer.

## Boosters UX
- Boosters : `barre`, `rail`, `renvoi`, `pas`, `preuve`, `compte-liens`, `sous-total`, `ligne`, `mouture-pastille`, `mouture`,
  `plateau`, `bis`, `unite`, `tva`, `paye`, `reglement`, `achat-du`, `justificatif`, `confirmer`, `echec-drive`, `lecture`, `hors-ligne`.
- B1 OK · B2 OK · B3 OK (42 mots hors lignes) · B4 OK · B5 OK · B6 OK · B7 OK (5,24:1) · **B8 OK** (12 états) · B9 OK (éclair 1,2 s,
  réduit : cadre) · B10 OK · **B11 OK** (« tout le ticket, et l'index à droite ») · B12 OK (rail sans rayon, trois rayons ailleurs) ·
  B13 OK (rail 24 px de large ; un segment fait ~30 px de haut à 390).

## Lignes
`LIGNES a=14 b=23` ; base, l'app servie : `LIGNES a=7 b=12` → LIGNES OK. Honnêteté du compte : les pastilles de mouture comptent
comme lignes (elles le sont sur le papier) ; le compte des rangées seules n'a pas été mesuré à part.

## Ce qui tient, ce qui casse
- Tient : 23 lignes atteignables d'un toucher, sous-totaux toujours en haut ; le bandeau d'échec ne se rate pas.
- Passe 3b : le rail porte son libellé vertical « 23 lignes » au-dessus de « n° », sans `title`. Il suit l'ordre affiché : par
  catégorie, chaque mouture après son malt ; ou l'ordre du papier. Les comptes du récap ont leurs mots (r2b). Pendant la lecture, les
  rubriques sont vides (« à lire »).
- Casse : à 390, la rangée longue (Hallertauer Blanc CH α 9,5 30 g) touche le montant.

## Corrections du critique 3c (01.11)
Voir `../p3b-RESULTAT.md`, section « Corrections du critique ».
- Pendant la lecture, Déjà payé et À payer sont gris.
- La navigation est celle de l'app.
- LALLEMAND Windsor est en entier à 390.
- La pastille porte « ↳ mouture 0,60 » ; une fois réglée, le montant reste et un ✓ s'ajoute.
