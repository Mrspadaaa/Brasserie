OK — verdicts v2 : r4c PRÊTE À MONTRER, z2c PRÊTE À MONTRER, u2c PRÊTE À MONTRER

# Verdicts de la passe 3 (Malts/sucres 2/7, 31.10, critique neuf, D207)

Lu, dans l'ordre : PORTRAIT.md ; VERDICTS-v1.md et RELANCE-v1.md ; la table « Décisions » de MISSION.md ; les trois NOTE.md ; chaque
capture ouverte en image (L12) : r4c -repos, -plateau-noir, -couleurs, -sucre, -sucre-noir, -fruit, -huit, -ajout-zero, -doublon, -creer,
-1280 ; z2c -repos, -couleurs, -sucre-couche, -sucre-hors-cuve, -couleur-pendant, -huit, -1280 ; u2c cap-recette, -couleurs, -couleur-apres,
-sucre, -lactose, -huit, -vide, -1280. Référence : `../2026-10-31-ecran-identite/v1/r4-a/g1-ebullition-repos.png` (pied à 750–775 px sur 844,
0,54 sur `controle-panel`). Vérifié dans le code : `KIND_DEF` de `BrewWizard.tsx` (fruit 90, extrait 75, lactose 0) ; `part()` de r4c
(l. 290 : tout ce qui n'est pas lactose dit 100) ; `ogAttendue()` de z2c (l. 256–258 : PPG repères tapés) ; `MOT()` de u2c (l. 351).

Règle n° 1 : aucune maquette choisie pour cet écran ; la langue à prolonger est r4-a (en-tête, fil, bandeau, cartes claires, grand chiffre
à droite, piste à pouce noir). Les trois la tiennent. Aucun D105.

Règle du remplissage (décision du 31.10) : seuil ≥ 0,50 (r4-a fait 0,54) et le vide sous le pied jugé sur capture. Bas du pied à 390 :
r4-a 0,92 · r4c 0,93 (`r4c-repos`, 21 px avant le +) · z2c 0,94 · u2c 0,95. Les trois sont au niveau de sa référence ou mieux : la plainte
D4/D149 de la v1 (220–250 px de blanc) est levée partout.

## r4c — la balance (passe 3 de r4b) : PRÊTE À MONTRER, après un micro-correctif du pilote

Corrections de VERDICTS-v1 (§ r4b et Commun) :
- **Remplissage par de l'information** : faite. `r4c-repos` : carte de repères dépliée (Rendement 75 % repère, piste OG avec la plage du
  style, marque des couleurs, échelle des teintes 0–40 avec le crochet 6–14). 0,55, pied à 0,93.
- **Échelle des teintes u3** (greffe due) : faite, `r4c-repos` ; `r4c-couleurs` : repère posé à 7,3, mot « Paille » en grand.
- **Plateau clair, piste et pouce noir de r4-a** : fait, `r4c-repos` ; c'est exactement la piste d'Identité, remplie à la teinte du malt
  quand elle est connue (`r4c-couleurs`), pointillée pour un sucre (`r4c-sucre`). **Plateau noir gardé en second état** : `r4c-plateau-noir`,
  `r4c-sucre-noir` (D126).
- **« 3 couleurs à renseigner », 12 px** : fait, `r4c-repos`, `r4c-ajout-zero` (« 4 couleurs »).
- **Lecture à 0 sans surbrillance système** : fait, `r4c-ajout-zero` : « 0 » ocre, cadre fin, plus de rectangle jaune.
- **Greffe z1** : fait, `r4c-creer` : « Créer « Mangue » · fruit : en fermentation, J+3 ».
- **Greffe u1** : fait, `r4c-doublon` : « Pilsner Malz déjà 5,0 kg », 4 lignes, pas de doublon créé.
- **Sucre comme l'app** : fait pour le sucre et le lactose (`r4c-sucre` : « Dextrose · Sucre · ébullition · 100 % ferm. » ; `r4c-huit` :
  lactose « 0 % ferm. »). **Partiel pour le fruit** : `r4c-fruit` dit « Purée de mangue · Fruit · J+3 · 100 % ferm. » ; l'app met 90
  (`KIND_DEF.fruit.fermentability`), u2c et z2c disent 90. Cause : `part()` l. 290 ne distingue que le lactose.
- **Rien de tronqué** : fait (« Purée de mangue », « Weizenmalz hell », « 0,40 » entiers, ligne sur deux rangs).
- **Piste à l'échelle** : fait, 0–2 kg pour 0,40 (`r4c-sucre`), 0–8 pour 5 kg (`r4c-repos`), figée pendant le geste.
- **Annexe hors du premier écran** : fait (846 px / 902 px, `r4c-1280` sans annexe visible).
- **OG** : « — » au bandeau, piste de repères sans curseur (décision du pilote appliquée, `r4c-repos`).

Défauts nouveaux :
1. `r4c-fruit` : « 100 % ferm. » pour un fruit, faux au regard de l'app (90). Règle : Commun « sucre comme l'app » ; L14 (un nombre faux
   devant lui sur un houblon phare, ici une famille). Correction : `part()` lit la fermentabilité par famille (grain/sucre 100, fruit 90,
   extrait 75, lactose 0). Une ligne.
2. `r4c-huit` : le bandeau ocre « Non fermentescible : il remonte la densité finale. » est posé entre les repères et le plateau de
   **Münchner Malz**, sans nommer le lactose : « on a un truc qui sort de nulle part » (PORTRAIT § 4). u2c fait juste : la phrase sous la
   ligne du lactose, avec son nom (`cap-lactose`). Correction : la même place ou le mot « Lactose : » devant.
3. `r4c-fruit` : la carte de repères se replie d'elle-même quand le plateau du fruit (plus haut, règle J+) ouvre : l'échelle des teintes
   et la marque disparaissent du premier écran. Il pourrait demander où est passée sa couleur. Goût prêté, pas une règle : je signale.
4. La piste OG sans curseur (partagée avec u2c) : voir Commun.

Phrase prédite : « Le ticket avec les kilos et les barres, c'est bien, et le plateau clair c'est Identité. Ma couleur face au style, c'est
ça qu'il me faut. Par contre 100 % pour la mangue, c'est faux. »

Verdict : **PRÊTE À MONTRER**, après le micro-correctif 1 par le pilote (et le 2 s'il tient en une ligne) ; pas de relance. Ses deux
plateaux (clair, noir) vont côte à côte sur la page de choix.

## z2c — le verre complet (passe 3 de z2b) : PRÊTE À MONTRER, après le même micro-correctif que r4c

Corrections de VERDICTS-v1 (§ z2b et Commun) :
- **Lecture « 0,4( »** : faite, `z2c-sucre-couche` : « 0,40 » entier sur la ligne et dans le plateau.
- **Titre du plateau sur toute la largeur, segments dessous** : fait, `z2c-couleur-pendant` : « Weizenmalz hell », trois moments en tiers.
- **Fils tiretés sans croiser l'échelle** : fait. L'échelle des teintes est passée à gauche du verre, les fils partent du bord droit et
  sont horizontaux (`z2c-repos`). À 8 grains, les quatre derniers fils se courbent vers la marge (`z2c-huit`) : lisible, un peu de faisceau.
- **Le « — » flottant reçoit un mot** : fait, « teinte — » puis « teinte Paille » (`z2c-couleurs`).
- **Sucre en deux états (D126)** : fait, `z2c-sucre-couche` (couche pointillée au-dessus de la mousse, ligne en tête) et
  `z2c-sucre-hors-cuve` (ligne pleine largeur sous le verre, cube, puce « hors cuve »). Les deux sont propres ; il tranche.
- **Piste à l'échelle de l'ingrédient** : fait, 0–2 pour 0,40 (`z2c-sucre-couche`), 0–3 pour 1,5 (`z2c-couleur-pendant`).
- **Annexe hors du premier écran** : fait (`z2c-repos`, `z2c-1280` : rien sous le pied).
- **Remplissage** : 0,84, pied à 0,94 ; le verre prend l'écran (`z2c-repos`).
- **Convention du sucre** : faite, « Sucre · ébullition · 100 % ferm. », masse à droite (signature z2, acceptable).
- **Marque 12 px** : **non faite**, gardée à 14 px parce que bouton. Écart déclaré, réversible en une ligne ; le mot est le bon. Je ne le
  compte pas contre elle, mais le pilote l'aligne s'il veut un seul mot dans les trois.

Défauts nouveaux :
1. `z2c-repos`, `z2c-huit`, `z2c-sucre-couche` : la puce « OG attendue ~1,061 » (~1,066 avec le dextrose, ~1,071 à 8 grains) est calculée
   avec des PPG repères tapés dans la maquette (`ogAttendue()`, l. 256–258). C'est exactement ce que la décision du pilote du 31.10 a retiré
   de r4c : « L'OG suit l'app : « — » tant qu'un potentiel manque ». Et dans le même premier écran, le bandeau dit « OG — » et la puce
   « ~1,061 » : deux OG qui se contredisent à 15 px l'une de l'autre, « ??? » garanti. Règle : table Décisions de MISSION.md ; honnêteté
   (PORTRAIT § 3.4, « l'inconnu jamais à zéro » vaut aussi pour l'inconnu inventé). Correction : `data-role="og"` reste « — » et la puce dit la
   plage du style comme r4-a (« OG — · style 1,060–1,085 »), les PPG sortent de la maquette. Une ligne, à faire par le pilote comme pour r4c.
2. `z2c-repos` : la colonne de droite a deux trous (≈ 100 px au-dessus de Pilsner, ≈ 150 px dessous) parce que chaque ligne fait face à sa
   couche. Le verre explique le trou et il remplit l'écran ; il pourrait quand même dire « pourquoi c'est espacé comme ça ? ». À 1280
   (`z2c-1280`) les trous font 150 à 200 px dans une colonne de 370 px. Goût prêté, D55 n'est pas enfreinte (l'écran est plein) : je signale.
3. `z2c-couleurs` : le plateau d'Haferflocken naît sous le pli et la capture le coupe ; la note dit que la page glisse. Capture fixe, pas
   un défaut : à dire sur la page de choix (PORTRAIT § 3.5).

Phrase prédite : « Là c'est parlant : je vois mes couches, les kilos en face, ma couleur à côté. Le sucre dans le verre, je préfère. Mais
pourquoi OG — en haut et 1,061 juste dessous ? »

Verdict : **PRÊTE À MONTRER**, après le micro-correctif 1 (OG « — », identique à celui déjà fait sur r4c) ; captures repos, huit,
sucre-couche et 1280 à refaire ensuite (elles portent le chiffre). Pas de relance d'agent. Ses deux états du sucre vont côte à côte.

## u2c — nom et masse d'un trait (passe 3 de u2b) : PRÊTE À MONTRER

Corrections de VERDICTS-v1 (§ u2b et Commun) :
- **Une seule marque de couleur manquante par ligne** : faite, `cap-recette` : pastille « ? », barres gris plein, plus de hachures.
- **Étagère repliée quand elle est vide** : faite, `cap-huit` : plus de « — » orphelin.
- **Échelle des teintes u3 sous la composition** : faite, bandes nommées Paille · Dorée · Ambrée · Cuivrée, crochet 6–14, trait à 7,3 et
  « Paille · dans le style » (`cap-couleur-apres`). Vérifié : `MOT()` donne Paille jusqu'à 8, le trait tombe dans la bande Paille, cohérent.
- **Remplissage** : 0,51, pied à 0,95 : au niveau de r4-a. Carte de repères dépliée (`cap-recette`), repliée à 5 lignes (`cap-lactose`,
  « Rendement 75 % repère OG — »).
- **Sucre comme l'app** : fait, et le plus fidèle des trois : « Sucre · ébullition · 100 % ferm. » (`cap-sucre`), « Lactose · 0 % ferm. »
  avec sa phrase sous la ligne, « Fruit · J+3 · 90 % ferm. » (`cap-lactose`).
- **Marque 12 px** : faite (« 5 couleurs à renseigner » à 8 grains).
- **Rien de tronqué** : fait, « Purée de mangue », « 0,40 », « 0,50 ».
- **Piste à l'échelle** : sans objet, u2 n'a pas de piste ; juste.
- **Annexe hors du premier écran** : fait ; `cap-1280` en deux colonnes.

Défauts nouveaux :
1. `cap-recette` : la carte de repères porte « OG attendue — » et une piste 1,040–1,100 où rien n'est posé, sauf la bande du style. La note
   le dit elle-même : « à quoi sert une piste vide ? ». Même chose dans r4c. Voir Commun : ce n'est pas un défaut de u2c, c'est la
   conséquence de la décision OG « — », à régler pareil dans les deux.
2. `cap-1280` : deux colonnes, puis 250 px de blanc sous les deux. Sur ordinateur seulement ; l'app de base fait pareil. Je signale.
3. `cap-recette` : la composition grise en haut et la barre de part grise de chaque ligne disent deux fois la même chose tant que la
   couleur manque ; moins lourd qu'en v1 (plus de hachures), acceptable.

Phrase prédite : « Pratique pour taper vite, les gros chiffres sont bien, et la teinte avec les mots c'est clair. Ça reste une liste,
mais y a plus de vide. »

Verdict : **PRÊTE À MONTRER**, sans correction obligatoire.

## Classement

1. **z2c** — la seule qui « montre un max d'info au même endroit » : le verre, les kilos en face, la teinte à côté, et le sucre visible
   dans la cuve ou hors cuve. Un défaut vérifiable (l'OG inventée contre la décision), une ligne à corriger ; le reste est du goût (trous de
   la colonne). PORTRAIT § 1.2 : entre un écran sobre et un écran dense dont chaque élément sert, il prend le dense ; § 3.6 : « le
   graphique beaucoup plus grand ».
2. **r4c** — tout ce qui était demandé est fait, le plateau clair est la piste d'Identité et le noir reste au choix ; le ticket est juste et
   dense. Un chiffre faux (fruit 100 %), un bandeau qui sort de nulle part, une carte qui se replie seule.
3. **u2c** — la plus propre et la plus fidèle à l'app pour le sucre, la seule sans chiffre faux ; mais la plus « liste », et rien n'y
   montre la masse en geste. Il la trouvera « pas mal » ; il ne la choisira sans doute pas, sauf pour la vitesse de saisie.

Progrès de la passe : oui. Les trois plaintes de la v1 (vide sous le pied, « 0,4( », pavé noir imposé) sont levées. La passe est
**satisfaisante** : aucun REJET, phrase prédite positive pour les trois ; deux micro-correctifs d'une ligne avant la page.

## Commun avant la page de choix

- **OG « — »** dans les trois, au bandeau et dans les repères (décision du 31.10) : z2c à aligner (micro-correctif). Puis, pour la
  piste vide de r4c et u2c, deux lectures possibles que le pilote tranche, réversibles : garder la piste avec la bande du style (elle
  dit où il doit arriver ; le curseur viendra avec les potentiels du stock), ou la remplacer par la puce de r4-a « OG style 1,060–1,085 »
  jusqu'au port. Je penche pour la puce : une piste sans pouce ni valeur risque « ça c'est inutile » (PORTRAIT § 4). Pas un REJET.
- **Fermentabilité par famille** (grain/sucre 100, fruit 90, extrait 75, lactose 0) : r4c à aligner (micro-correctif).
- **Marque à 12 px** : z2c à 14 px si le pilote veut un seul mot et une seule taille dans les trois ; sinon dire l'écart sur la page.
- **Captures refaites après micro-correctifs** : r4c-fruit, r4c-huit ; z2c-repos, -huit, -sucre-couche, -1280. Ouvertes avant la page (L12).

## Ce qui doit figurer sur la page de choix du brasseur (D126, une page, variantes côte à côte avec r4-a)

Pour chaque variante, à 390 : repos, couleurs renseignées, sucre, 8 grains ; une capture 1280. Et les axes qu'il tranche seul :
1. **La scène** : le verre (z2c) · le ticket et son plateau (r4c) · la liste à gros chiffres (u2c).
2. **Le plateau** : clair à la r4-a (`r4c-repos`, `z2c-sucre-couche`) · noir à règle défilante (`r4c-plateau-noir`, `r4c-sucre-noir`).
3. **Le sucre** : couche fine dans le verre (`z2c-sucre-couche`) · « hors cuve » (`z2c-sucre-hors-cuve`) · ligne du ticket ou de la liste
   (`r4c-sucre`, `cap-sucre`).
4. **La teinte face au style** : dégradé continu 0–40 et crochet (`r4c-couleurs`) · bandes nommées et « dans le style » (`cap-couleur-apres`)
   · échelle verticale le long du verre (`z2c-couleurs`).
5. **Les repères OG** tant que les potentiels manquent : piste avec la bande du style (r4c, u2c) · puce (z2c) ; à montrer si le pilote
   ne tranche pas lui-même.
Dire sur la page ce qu'une capture fixe ne montre pas : le plateau de z2c glisse sous le pli ; la carte de repères de r4c se replie
quand un plateau haut ouvre.

LEÇON PROPOSÉE : aucune. (La décision OG prise sur r4c n'a pas été propagée aux deux autres relances : c'est L05 déjà écrite, « répéter
une exigence transversale dans chaque brief ».)
