OK — z1, z2, w2, w3 corrigés (10 points du critique) ; ENTETE OK ×4 ; cap-w compte le + et les liens

Versions jugées conservées telles quelles : `v8/_juge/` (z1, z2, w2, w3 .html, build*.mjs, cap*.mjs) et `v8/_juge/cap/` (captures, contrôles).
z3, z4, w1 écartés, non retouchés. Rejouer : `node v8/build.mjs z1 z2 ; node v8/build-w.mjs w2 w3 ; node v8/cap.mjs base z1 z2 ; node v8/cap-w.mjs w2 w3`.

## Portrait (corps identique octet pour octet à gi2/r2-c)
- **z1** (point 4, greffe) : « S47 » sort de la règle du haut, qui ne porte plus que mars, juin et sept. La brosse dit ce qu'elle
  couvre : « S47 – / S52 », en deux lignes centrées sous ses poignées. À 14 px, une ligne ne tient pas dans ses 44 px.
- **z2** (point 3, greffe) : « S47 » quitte le rang des noms, qui ne garde que Six fûts inox −1 080 et Fête de village +2 140. La brosse
  descend jusqu'à l'axe et porte « S47 – / S52 ». On ne lit plus « Six fûts en S47 ».
- cap.mjs : la règle « texte dans la brosse » exempte cette seule étiquette (classe `v8-fen`).

## Paysage 844 × 390
- **Point 6, bloquant** : la cause est dans le corps à 13 semaines. La règle gi2 `.k18-ln{top:116px!important}`, écrite pour
  6 semaines, poussait le lien du panier de l'IPA 51 px trop bas, à travers « Dégustation à la brasserie ». Chaque lien reprend
  son décalage de r2-c (−3 px) : celui de l'IPA monte du panier jusqu'à sa barre. Dégustation n'est plus traversée.
- **Point 7, bloquant** : le + volant passe au bord droit, à 12 px du bord, 14 px au-dessus des onglets. Il était à 127 px du bord,
  un reste du calcul en colonne. Plus aucun libellé n'est sous sa colonne. Seul celui de l'IPA y tombait, à l'intérieur de sa
  barre : il passe à gauche de la barre (« IPA houblon à cru −232 — ») et s'arrête avant le +. Les autres libellés restent où ils étaient.
- **Point 8 (w3)** : la rangée des mois n'existe plus à part. Les mois se posent dans le ciel du cadre de la courbe, comme dans z1.
  L'échelle passe de 9 733 à 8 800, le cadre de 124 + 18 à 112 px. Tracé de la courbe : 91 px (portrait 87). La frise est à
  184 px au lieu de 214, soit 30 px de corps en plus : Brassins entier et le titre de Fêtes au repos. Réglage pris sur une grille
  (YMAX × CH) : le plus bas qui nomme tout ce que r6b nomme et pose la légende sous Hotte.
- **Points 9 et 10** : Hotte se pose sous la courbe, à gauche de son saut, et « ▨ 1 140 mis de côté » se pose juste dessous,
  comme en portrait. C'est une contrainte dure du placeur. La légende n'est plus dans le rang des mois, ni collée à Mariage.
- **w2** : même en-tête (cadre 110 px, tracé 89 px), repli en une ligne au défilement inchangé. Avant, la courbe ne mesurait que
  73 px : le contrôle de l'en-tête échouait sur w2.
- Mariage +1 100 passe en deux lignes (nom, montant). Marché de printemps reste une marque seule, comme dans r6b portrait.

## Contrôles (sorties)
- `controle-entete-cal` : ok z1 (courbe 87, bande 35, en-tête 202) ; ok z2 (87, 35, 182) ; ok w2 (89, 35, 182) ; ok w3 (91, 35, 184).
  Avant correction : w2 KO (courbe 73).
- `cap.mjs` : ok base, z1 et z2 (petits 0, hors 0, chevauchés 0, sur trait 0, dans la brosse 0, + à 14 px des onglets ;
  corps identique à r2-c).
- `cap-w.mjs`, qui contrôle désormais aussi le corps : texte sous la colonne du +, texte sur un pointillé de lien, chevauchements,
  et légende ni dans le rang des mois ni à moins de 20 px d'un nom.
  - Sur les versions jugées (`cap/controle-w-avant.txt`) : KO w2 et KO w3. Sous le + : 11. Sur un lien : 1 (Dégustation).
    Légende : dans le rang des mois (w2), collée à Mariage à 8 px (w3).
  - Après correction (`cap/controle-w.txt`) : ok w2 et ok w3. Sous le + 0, sur un lien 0, chevauchés 0, légende libre.

## Captures (ouvertes)
- Portrait : `v8/cap/z1.png`, `z2.png`, `_tete-z1.png`, `_tete-z2.png`, `planche-tetes.png` (base, z1, z2), et les `-toucher`.
- Paysage : `v8/cap/w2.png`, `w2-defile.png` (replié), `w2-defile2.png` (défilé de 480 px), `w2-toucher.png`, et les mêmes pour w3.

## Reste ouvert
- z2 n'a toujours aucun mois, comme le critique en doutait ; z1 les garde.
- Paysage : Festival +2 450 est posé au-dessus de son pic, sur la hauteur des mois, à 29 px de « sept. » et 60 px de « juin ».
  Il a un montant, donc il ne se lit pas comme un mois. À regarder.
- Le corps du paysage s'écarte de r2-c sur trois points, tous expliqués plus haut : le + au bord droit, le libellé de l'IPA à gauche
  de sa barre, le décalage du lien.

Prédiction : « z2 enfin lisible ; w3 ressemble au portrait, et on voit enfin les brassins ».
DÉCISION À PRENDRE : faut-il garder le + volant au bord droit en paysage (12 px) ? Il était à 127 px, un reste du calcul en colonne.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle de chevauchement d'une maquette couvre toute la page qui défile, corps compris. Il compte comme
obstacles le + volant (sa colonne, à toute hauteur) et les pointillés des liens. cap-w.mjs le fait désormais.
