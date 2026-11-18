OK — p7 : g7 9/8/9/8, c2h7 9/7/8/7 ; 13 problèmes, 0 bloquant ; les 8 restes de p6 réglés (le n° 4 seulement dans g7)

Critique Opus, regard neuf : aucune passe précédente vue, sauf `p6/CRITIQUE.md` pour le contrôle des 8 restes.
Référence : f1 « Caisse et semaines », qu'il note 8/10 (`…/infallible-grothendieck-129ed4/work/missions/2026-11-15-besoins/f/f1/f1-allonger-390.png`).
Sources lues : PORTRAIT v2, et dans SPEC les lignes du 15.11 (f1 « top », « 8/10 », filtres de planification, plein écran en paysage,
b1r) et du 16.11 (onglet Calendrier en bas, + « volant » qui porte ses actions de calendrier).

Captures ouvertes, une à une : f1-allonger-390 ; g7 repos 390, geste 390, etsi 390, paysage 844, repos 1280, geste cave 390 ;
c2h7 repos 390, geste 390, paysage 844, repos 1280, repos cave 390.
Non ouvertes : g7 repos cave 390, etsi cave, paysage cave, repos cave 1280 ; c2h7 geste cave, paysage cave, repos cave 1280.
Je n'ai pas joué le glisser dans Chrome. `pointerdown` est bien dans `g7/etat.html` (2) et dans `c2h7/etat.html` (1), mais je ne
juge le geste que sur sa capture figée.

## Sens métier (avant le visuel)
Rien d'absurde. Les semaines tombent juste : 2026 a 53 semaines ISO, S53 commence le 28 déc. et S1 le 4 janv. 2027, S26 le
28 juin 2027. Une cuve de 1 fermenteur prend des brassins de 3 à 5 semaines, sans chevauchement. Loyer de 400, impôt de 210 à 380,
brassage le mardi.

Les comptes se recoupent :
- g7 : S47 4 180 − 148 = 4 032, S49 4 152 + 120 − 400 = 3 872, S50 + 1 180 = 5 172, S51 + 120 − 176 = 5 116.
- L'« et si » : le libre monte de 215 par semaine jusqu'à S22, ce qui fait 2 800 à S22 ; on a donc 259 + 2 800 = 3 059 au plus serré.
- Le glisser du frigo : l'écart vaut 1 020 à S22 (17 semaines de 60 depuis S6, sa fenêtre), puis 60 de plus par semaine, puis
  −480 à S27, soit les 8 semaines de 60 non encore mises de côté jusqu'à S35. Le premier ✓ est en S26, juste après le plus serré
  (S24).
- c2h7 : la caisse de S49 vaut −280, celle de S50 +1 300.

## Les 8 restes de p6/CRITIQUE.md
- n° 3 (bulles muettes) : réglé, « ○ semaine trop chargée » est écrit sur la bande, à 390, en paysage et à 1280.
- n° 4 (étiquettes des deux côtés) : réglé dans g7 seulement, une étiquette sortie de sa barre est toujours à droite ou dessous.
  Le défaut reste dans c2h7 (problème 9).
- n° 5 (glisser non jouable) : réglé. Le geste a son état (tenu, fantôme, ✓/✗, carte « Tu tiens ») ; je ne l'ai pas joué.
- n° 6 (libre de S49 absent) : réglé, 3 872 est visible au repos dans c2h7.
- n° 7 (Brassins rejeté sous le +) : réglé, la section suit Achats sans trou.
- n° 8 (tête de 590 px) : réglé, la courbe est repliée et la liste commence vers 300 px ; on voit S47 à S51.
- n° 9 (axe des mois serré) : réglé, les mois sont en initiales.
- n° 10 (« à te permettre » sous une poignée) : réglé, l'étiquette est dégagée en paysage.

## Notes sur 10 (brasseur, UX/UI, parcours, navigation)

### g7 « Ta semaine » : 9, 8, 9, 8
- **Brasseur, 9.** La carte répond en argent et en jours à « je peux ou pas ? » (259, 1 j libre, Blonde mardi, S50 · 4 j pour 2).
  Chaque chose a son coût, chaque semaine son libre. C'est nettement au-dessus de f1 : on garde la frise de f1, et on y ajoute
  les activités sans budget, les fêtes et les jours.
  Défaut restant : au repos à 390, le + cache le libre de S52, S53 et S1 (problème 1).
- **UX/UI, 8.** Le tableau est dense et net, dans les deux thèmes.
  Défaut restant : des traits de soulignement plus larges que leur case (problème 5), et un trait vert qui traverse les
  chiffres de la semaine tenue (problème 4).
- **Parcours, 9.** Le glisser du frigo répond à sa phrase du 15.11 (« entre la semaine 6 et 35 je vais mettre de côté ») :
  ✗ rouge jusqu'à S25, ✓ vert dès S26, les anciennes valeurs barrées, « il reste au moins 1 568 », Annuler et Payer en S27.
  L'« et si je ne la prenais pas ? » est clair.
  Défaut restant : pendant le geste, l'en-tête des semaines est hors de l'écran, et la rangée ✓/✗ n'a pas de numéro de semaine
  (problème 3).
- **Navigation, 8.** L'onglet Calendrier est en bas, le + volant suit la semaine (+ S47, puis + S27). On a ‹ S47 → S1 ›, la
  bande annuelle avec sa poignée, et le plein écran en paysage.
  Défaut restant : l'ordre des rangées change quand on tourne le téléphone (problème 7), et à 1280 le libre est sous la ligne
  de flottaison (problème 8).
- Phrase prédite : « g7 très très bien, le frigo que je glisse avec les croix et les coches c'est exactement ça. Mais quand je
  glisse je vois plus les semaines ? Et le + me cache mon libre »

### c2h7 « à te permettre » : 9, 7, 8, 7
- **Brasseur, 9.** « 259 à te permettre », puis « 1 928 dès S26 · 4 505 dès S33 » : il voit combien il peut engager et dès
  quand. Ses semaines ont leurs jours (l m m j v s d), « 4 j pour 2 » et le libre en fin de semaine.
  Défaut restant : des noms coupés (« Bouteilles de Noë… », problème 13), et pendant le glisser les fins de mois ne bougent
  pas (doute).
- **UX/UI, 7.**
  Défaut restant : dans la frise par type, des étiquettes sont à gauche de leur barre (problème 9). C'est le n° 4 de p6, corrigé
  dans g7 mais pas ici. Sur la ligne de Pale ale, deux étiquettes sont prises entre deux barres.
- **Parcours, 8.** Le glisser du frigo marche par sa bande rouge et verte, avec « payé en S30 ✓ ».
  Défaut restant : les 26 carrés de « lâcher ici » n'ont aucune semaine (problème 11), et le + couvre la barre du Festival
  (problème 12).
- **Navigation, 7.** On a la courbe repliable, 6 sem. / 3 mois / 6 mois / An, le paysage et le + volant.
  Défaut restant : à 390, les filtres par type sont hors de l'écran, à droite des hypothèses (problème 10) : on n'en voit qu'un
  bord.
- Phrase prédite : « c2h7 le 259 avec dès S26 c'est top, et je vois enfin mes semaines. Mais où sont passés mes filtres ??? »

## Combien et quels problèmes
13 problèmes, 0 bloquant : aucune valeur fausse, aucun élément de f1 absent, rien d'illisible au point de cacher l'essentiel,
et aucun geste vu sans effet.

1. **g7, repos 390 (clair et cave)** : le + couvre le libre de S52, S53 et S1 (on lit « 56… » et « ( »). Au repos, une valeur
   est cachée sans défilement.
2. **c2h7, repos 390** : le + couvre le libre de S51 (« 5 116 » coupé). À 1280, il mord sur « caisse −56 » de S51.
3. **g7, geste 390** : l'en-tête des semaines est sorti de l'écran. La rangée « payer en » (✗ ✗ ✗ ✗ ✓ ✓ ✓ ✓) n'est rattachée à
   aucune semaine : seuls le fantôme et la carte disent S27.
4. **g7, geste 390 (clair et cave)** : le trait vertical vert et les bords de la colonne tenue traversent les chiffres de S27
   (2 093 barré, 1 613, 2 j).
5. **g7, 390** : des traits de soulignement plus larges que leur étiquette ou leur case. « Inventaire · 1 j » est souligné de
   S52 à S1 sous une case en S1 seule ; de même « Nettoyer les cuves » et « Fête de village » (geste).
6. **g7, repos 390** : « Malt groupé » est une longue barre bleue vide, avec son nom dessous. La barre fait près de trois
   colonnes ; on croit à un bloc sans nom.
7. **g7, paysage 844** : l'ordre des rangées n'est plus le même : Libre, Toi, Papiers, Cuve, Comptoir en paysage, contre Cuve,
   Comptoir, Achats, Toi, Papiers, Libre à 390 et à 1280. En tournant le téléphone, tout change de place.
8. **g7, repos 1280** : les chiffres du libre sont sous la barre d'onglets. On ne voit que le haut des verres, et « argent,
   jours » est coupé ; il faut défiler pour lire l'argent.
9. **c2h7, geste 390 et paysage 844** : des étiquettes sont à gauche de leur barre : « Houblons −480 », « Ambrée −156 »,
   « IPA d'été −228 », « Festival +2 450 », « IPA à cru −232 ». « Pale ale · −166 » et « Ambrée · −156 » se suivent entre deux
   barres. C'est le défaut n° 4 de p6, corrigé dans g7, encore là dans c2h7.
10. **c2h7, 390 (repos et geste, deux thèmes)** : les filtres (Brassins, Fêtes, Ventes…) sont à droite de la pastille des
    hypothèses, hors de l'écran ; on n'en voit qu'un bord. Ce sont ses « filtres de plannif » (15.11), invisibles sans glisser.
11. **c2h7, geste 390** : les 26 carrés « lâcher ici » n'ont aucun numéro de semaine. Les mois au-dessus n'ont pas la même
    largeur que les carrés : on ne sait pas quel carré est S26.
12. **c2h7, geste 390** : le + couvre la barre du Festival. Il dit « + S14 » quand le frigo est tenu en S30, alors que dans g7 il
    suit le geste (+ S27).
13. **c2h7, 390** : des noms coupés, « Bouteilles de Noël … » et « ‹ Bouteilles de Noë… », alors que la colonne montant est vide
    sur ces lignes.

Doutes, non comptés :
- c2h7, geste : les fins de mois (avr 2 351 … sept 4 505) gardent les valeurs d'avant le geste ; g7 barre l'ancienne et écrit
  la nouvelle. Ce n'est pas faux, mais c'est muet sur l'effet.
- g7 : la case de « Laver fûts » a des pointillés verts, les autres des pointillés noirs ; c'est expliqué nulle part
  (déjà en doute en p6).
- c2h7 : « Ranger la réserve · 3 j » se lit 1 j, suite, 1 j, suite de S48 à S51. Le troisième jour est-il en S52 ?
- g7 et c2h7 : « ○ semaine trop chargée » est une légende écrite au repos. Il refuse le texte au repos, mais aussi les icônes
  muettes ; trois mots semblent le bon compromis.
- g7, 1280 : l'axe des mois est en initiales, alors que RESULTAT annonce des noms abrégés à 1280. Ça se lit bien.

## Corrections dans les sources : aucune
Rien de corrigé dans `assemble.mjs` ni dans les fichiers part. Les corrections sûres touchent la génération des états. Il faut
donc recapturer, et le script de capture n'est pas dans `p7/` (« capt.mjs » est cité, mais introuvable ici). Avec le plafond de
tours, je ne peux pas reconstruire et recapturer proprement. Je ne livre pas une retouche que je n'ai pas vue (L12).

Corrections précises pour la passe suivante :
- **3 et 11** : écrire la semaine dans chaque case (« S22 ✗ », 11 px, dans `.§pk` de `g7.part.mjs` l. 123). Dans c2h7, numéroter
  un carré sur quatre sous la bande « lâcher ici ».
- **1, 2 et 12** : à 390, la marge du bas ne suffit pas au repos : le + reste au-dessus de la dernière rangée sans défilement.
  Soit le + se replie en pastille « + » de 56 px quand il chevauche un libre, soit le libre de la dernière colonne passe sous
  son verre. Dans c2h7, le + suit aussi la semaine tenue.
- **4** : arrêter le trait vertical au-dessus de la rangée Libre, ou le passer derrière les chiffres (z-index sous `.§lib b`).
- **5** : le soulignement d'une étiquette sortie prend la largeur de son texte, pas l'étendue de sa ligne.
- **7** : garder en paysage l'ordre du portrait, ou mettre Libre en tête partout. Le brasseur choisit (variante).
- **8** : à 1280, mettre Libre en tête, ou réduire la hauteur des rangées pour que tout le tableau tienne dans 800 px.
- **9** : reprendre la règle d'étiquette de g7 (à droite, sinon dessous avec un trait) dans le gantt de c2h7 (`gantt()`, l. 327
  de `build.mjs`).
- **10** : mettre les filtres sur leur propre ligne à 390, avant la pastille des hypothèses ; ou raccourcir celle-ci
  (« 4 180 · +120 · 2 j »).
- **13** : laisser le nom aller sur la colonne montant quand elle est vide.

LEÇON PROPOSÉE : un état de geste (glisser) se capture avec ses repères. L'en-tête des semaines, ou un numéro par case, doit
rester visible, sinon la capture prouve le dessin et pas le geste.
