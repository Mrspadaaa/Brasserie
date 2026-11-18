OK — p6 : g6 9/8/8/9, c2h6 9/7/8/8 ; 10 problèmes trouvés, 2 corrigés, 8 restants, aucun bloquant

Critique Opus, regard neuf (aucune passe précédente lue). Référence : f1 « Caisse et semaines », qu'il note 8/10
(`…/2026-11-15-besoins/f/f1/f1-allonger-390.png`). Sources : PORTRAIT v2 ; SPEC des 15 et 16.11 (f1 « top », « 8/10 »,
filtres de planification, onglet Calendrier en bas, + « volant » avec ses actions calendrier, b1r).

Captures ouvertes : toutes les planches `_pl-*` ; g6 repos 390 (avant et après retouche), repos cave 390 (après),
geste 390 (avant et après), geste cave 390 (après), paysage 844 (après), repos 1280 ; c2h6 repos 390, geste 390.
Les captures g6 de 03:14 précédaient le dernier build (03:17) : tout a été recapturé (390, 844, 1280, deux thèmes).

## Sens métier (avant le visuel)
Rien d'absurde. Coûts de brassin de 138 à 232, une cuve occupée de 3 à 5 semaines, brassage le mardi, loyer de 400
par mois, impôt sur la bière de 210 à 380 par trimestre, « IPA à cru » (houblonnage à cru) : tout existe chez un
microbrasseur. Les comptes se recoupent : S49 3 872 = 4 152 + 120 − 400 ; S50 −2 j = 4 j pour 2 ; « 259 à te permettre »
= le plus bas du libre de S47 à la fin (S24).

## Notes sur 10 (brasseur, UX/UI, parcours, navigation)

### g6 « Ta semaine » : 9, 8, 8, 9
- **Brasseur, 9.** La carte répond à « je peux ou pas ? » en argent et en jours, avec le brassin de la semaine et la
  S50 qui coince. Chaque brassin porte son coût. Ça dépasse f1 (temps, argent et jours sur une ligne).
  Défaut restant : les bulles de mousse de la bande annuelle (semaines trop chargées) sont muettes depuis que la
  légende a été retirée.
- **UX/UI, 8.** Le tableau est dense et propre, dans les deux thèmes. Défaut restant : quand une barre est trop courte,
  son étiquette passe dehors, tantôt à droite, tantôt à gauche : « Malt groupé −540 » à gauche d'une barre vide à 390,
  « Marché printemps », « La Cigogne » et « Saison » à gauche de leur case à 1280. On ne sait plus quelle case elle nomme.
- **Parcours, 8.** L'« et si » est clair : valeurs barrées, nouvelle valeur, 3 059 au plus serré. Défaut restant :
  le glisser n'est pas jouable (« La déplacer ↔ » est un bouton). La bande « payer en », toute verte ici, ne dit rien
  de plus que « elle tient ».
- **Navigation, 9.** Il y a l'onglet Calendrier, le + volant marqué S47 (avec Partout, Sur Calendrier et Poser en,
  conforme à b1r), la barre ‹ S47 → S1 › et la poignée sur l'année. Le plein écran est en paysage.
  Défaut restant : aucun nom d'écran en tête ; seul l'onglet dit qu'on est dans le Calendrier (doute).
- Phrase prédite : « g6 très très bien, la carte Cette semaine c'est exactement ça. Mais les petites bulles jaunes je
  sais pas ce que c'est ? »

### c2h6 « à te permettre » : 9, 7, 8, 8
- **Brasseur, 9.** « 259 à te permettre », puis « 1 928 dès S26 · 4 505 dès S33 » : il voit combien il peut engager,
  et à partir de quand. C'est la meilleure réponse des deux à « quand je peux acheter le frigo ».
  Défaut restant : le libre de S49 manque au repos (voir problème 4).
- **UX/UI, 7.** Défaut restant : à 390, la tête (chiffre, hypothèses, marches, courbe, frise de pastilles) prend
  590 px sur 844. Au repos, on ne voit que deux semaines et demie. L'axe des mois se serre.
- **Parcours, 8.** Le glisser du Frigo est vraiment bon : rouge ou vert par semaine, « payé en S30 ✓ ».
  Défaut restant : la section Brassins est rejetée sous le +, son titre reste seul au-dessus d'un vide.
- **Navigation, 8.** On a la poignée sur la courbe, 4 sem. / 3 mois / 6 mois / An, les filtres par type, le paysage
  plein écran et le + volant. Défaut restant : deux réglages de période en double (poignée et segments), et les
  filtres coupés à droite (« Trava… »).
- Phrase prédite : « c2h6 le à te permettre avec dès S26 c'est top, et le glisser du frigo aussi. Mais en haut
  ça prend tout l'écran, je vois presque rien de mes semaines »

## Combien et quels problèmes
10 trouvés : 2 corrigés dans `p6/build.mjs`, 8 restants. Aucun n'est bloquant (pas de geste sans effet visible,
aucune valeur fausse, rien d'illisible au point de cacher l'essentiel).

1. **Corrigé** (g6, geste 390) : la rangée Toi, vide de S15 à S22, faisait 38 px. Son libellé « Toi sans budget »
   chevauchait « Papiers ». Une rangée vide (hors Papiers) a maintenant 50 px à 390.
2. **Corrigé** (g6, 390) : la colonne des libellés faisait 62 px. « Comptoir » et « fermenteur » touchaient le trait
   de S47. Elle passe à 68 px, avec une marge de 5 px.
3. g6, 390, 1280 et paysage : les bulles de mousse de la bande annuelle sont muettes. Pas de légende ; le titre
   n'apparaît qu'au survol, et il n'y a pas de survol au doigt. Le brasseur a déjà refusé les icônes pas parlantes.
4. g6, 390 repos, 1280 et paysage : les étiquettes sorties des barres changent de côté. « Malt groupé −540 » est à
   gauche d'une barre bleue vide ; « Marché printemps », « La Cigogne » et « Saison » sont à gauche de leur case,
   « Dégustation » et « Marché de Noël » à droite. On ne sait plus quelle case l'étiquette nomme.
5. g6, geste : le glisser n'est pas jouable, « La déplacer ↔ » reste un bouton. La bande « payer en » toute verte
   n'apprend rien sur ce cas.
6. c2h6, repos 390 : sous S49, la colonne libre est vide. Ses lignes (Blonde en cuve, Ranger la réserve) et son
   libre de 3 872 sont rejetés sous le + ; un « li » dépasse sous le bouton. Le libre de S49 manque donc au repos.
7. c2h6, geste 390 : la section Brassins est rejetée sous le +. Son titre reste seul au-dessus d'un vide, et les
   barres n'apparaissent que sous la barre d'onglets.
8. c2h6, 390 : la tête occupe 590 px sur 844. Au repos, on voit deux semaines et demie de la liste ; c'est peu pour
   un calendrier.
9. c2h6, 390 : l'axe des mois se serre (« 2027 févr mars avr », « août sept » collés).
10. c2h6, geste 390 : l'étiquette « à te permettre » de la courbe passe sous la poignée gauche de la sélection.

Doutes, non comptés :
- g6, paysage et 1280 : une case pointillée verte sans nom en S7 (Laver fûts, à sa droite). Le vert opposé au noir
  des pointillés n'est expliqué nulle part.
- c2h6 : la frise de pastilles sous la courbe (une vingtaine, dont des pointillés) ne se lit qu'avec les filtres de
  couleur placés plus bas.
- g6 : « vert : elle tient, il reste au moins 259 ». Si on payait l'embouteilleuse plus tard, le plus bas changerait :
  le 259 est-il juste pour chaque case ?
- Mesure de p6 : « Fêtes » sous le + de c2h6 à 844. Je n'ai rien vu sous le + dans `c2h6-paysage-844.png` ; doute maintenu.

## Pour la passe suivante (pas sûr ni mineur, donc non fait)
- Problèmes 6 et 7 : la fonction `degage` déplace des lignes pour les sortir du +, ce qui crée des trous et cache
  des valeurs. Méthode standard : laisser le flux tel quel, réserver en bas de liste la hauteur du + (padding-bottom)
  et accepter que le + couvre une ligne au défilement, ou bien le replier en pastille pendant le défilement.
  C'est contraire à la consigne « rien sous le + » de la p5 : choix de méthode à trancher par le pilote.
- Problème 3 : soit une légende d'un mot à la première bulle (« trop chargée »), soit le chiffre « 4 j » dans la bulle.
- Problème 4 : l'étiquette toujours à droite de sa case, et à gauche seulement contre le bord, avec un trait qui l'y relie.
- Problème 8 : à 390, replier la courbe en bande (comme celle de g6), dépliable d'un toucher.

## Fichiers
- `p6/build.mjs` : trois chaînes changées. `LC` passe de 62 à 68 à 390 ; la marge de `.§rt` passe à 5 px ; la hauteur
  d'une rangée vide (hors Papiers) passe à 50 px à 390. Copie d'avant : `%TEMP%/p6-build-avant.mjs`.
  **Attention** : `build.mjs` est produit par `assemble.mjs`. Rejouer `assemble.mjs` efface ces trois retouches ;
  elles sont à reporter dans `assemble.mjs` (ou `g6.part.mjs`).
- Recaptures (03:22 et suivantes) : g6 et c2h6, repos, geste et + à 390, paysage et paysage-plus à 844, repos à 1280,
  clair et cave → CAPTURES OK. Les planches `_pl-*.png` n'ont pas été refaites (elles datent d'avant).

LEÇON PROPOSÉE : une retouche de rangée à hauteur conditionnelle se vérifie sur l'état au repos aussi. Ma première
version agrandissait Papiers (toujours « vide » au sens du code) et poussait le libre de S52 et de S1 sous le + ;
vu à la recapture du repos en cave, puis corrigé.
