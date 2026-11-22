# Recontrôle 2 : as/cal.html et cal-paysage.html (17.11)

Critique calibré (portrait v2). J'ai rejoué au doigt (puppeteer-core, `Input.dispatchTouchEvent`), en 390 × 844 tactile et en 844 × 390, thème clair, plus 2 captures en cave. Le script est une copie de `src/jouer.mjs` dans `cap/recontrole2/jouer.mjs`. Les sorties sont dans `cap/recontrole2/_jeu.json` : 0 erreur de page sur les 21 parcours.
J'ai ajouté deux sondes, `zoom.mjs` et `loyer.mjs`. La première fait les zooms ×3 ; la seconde mesure ce qui recouvre l'étiquette du loyer (`elementFromPoint`).
J'ai ouvert les 58 captures : 36 une à une, et les 22 états « avant » ou répétés sur deux planches (`planche-p.png`, `planche-l.png`). J'ai aussi ouvert 3 zooms et les comparaisons page14 c2-b-apres et recontrole1/p-c1d-apres-bas.
Comme demandé, COMPACT, G3 et G5 ne sont pas jugés. La pose F3, dont les cases chevauchent « Fêtes », est identique sur la base et n'est pas comptée.

## Points de RECONTROLE1, rejoués

| Point | Verdict | Ce que je vois |
|---|---|---|
| reste 13, c2-b | corrigé | La bulle est remplacée par le détail sous la bande : « S12 · 22 → 28 mars », 3 lignes, « la semaine −487 ». Le curseur ne barre plus « Embouteilleuse » ni « Six fûts inox ». « Hotte −900 » se lit en entier en portrait (`z-p-c2b-tete.png`) ; le point noir touche le bord du dernier 0 sans le manger. |
| reste 11, noms de rangées | corrigé | « Brassins » est net, sans trait de mois (`z-p-c1d-noms.png`). |
| nouveau 1, barre du Marché de printemps | corrigé | La barre est visible en avril, avec « +910 » à côté (`z-p-c1d-noms`, `p-c1d-apres`). Le nom est perdu en portrait : voir les doutes. |
| nouveau 2, boutons de tête pendant la lecture | corrigé | ±, 6 sem. ou 3 mois, ⏲2 et ⛶ sont visibles pendant et après, avec `visibility: visible` mesuré, dans les deux sens. |
| nouveau 3, menu f5-a | corrigé | Les sous-titres sont retirés. On lit « Dupliquer en S51 +1 180 · 2 j ». « Retirer S50 : 5 120 → 3 940 » est en rouge. Le menu est ancré sous la barre, les + et les noms restent visibles. |
| nouveau 4, piste f6-b | corrigé | La Blonde décalée garde « J0 / 28 » et sa piste entière. « brassée dès le 23 nov., sera prête le 21 déc. » est passé dans l'alerte. |
| nouveau 5, « lâcher ici » sur Porter | corrigé | « Porter d'hiver −176 » est entier pendant le glisser, en portrait comme en paysage. |
| doute, + volant sur f4-b | encore vrai | En portrait, le + volant couvre la fin de « −540 » de Commande groupée de malt (« −54( »), en clair comme en cave. Le bouton flotte comme dans la base. |
| doute, fantôme f1-a paysage | encore vrai | Le fantôme hachuré est presque entièrement sous la barre glissée de 3 semaines. Seul un bord pointillé dépasse vers S53. |

Sens métier : rien d'absurde, et les chiffres sont les mêmes dans les deux sens.
- Retirer le Marché de Noël : S50 passe de 5 120 à 3 940, et le creux de 113 à −1 067.
- S12 : −611 + 536 − 412 = −487.
- S24 : −320 + 128 = −192.
- Blonde décalée en S48 : du 23 nov. au 21 déc. (28 j), et « S47 4 032 → 4 180 ».
- Porter : du 15 déc. au 11 janv., prête le 18 janv.

## Restes (encore vrais)
- f4-b portrait : le + volant couvre « −540 » de la Commande groupée de malt, qu'on lit « −54( ». Doute, comme la base.
- f1-a paysage pendant : le fantôme hachuré est caché sous la barre glissée ; seul son bord pointillé dépasse. Doute.

## Nouveaux problèmes, les plus graves d'abord
1. **c1-d, vue année, Papiers (bloquant, régression de la passe 3)** : la ligne du loyer est une barre grise vide sur toute l'année. « Loyer du local −400 / mois » a disparu, en portrait comme en paysage (`p-c1d-apres-bas`, `p-c1d-papiers`, `l-c1d-papiers`). La sonde le confirme : l'étiquette `.as-il` « Loyer du local » est sous la barre `as-ib as-plein`, qui la recouvre. Seul un bout de son soulignement pointillé dépasse. Au recontrôle 1, l'étiquette était sur la barre. Cause probable : la règle « barres au-dessus des étiquettes ». Une barre qui court sur tout l'axe doit garder son nom par-dessus, ou le poser à côté.
2. **c1-d année** : le tiret de liaison est collé au signe du montant quand le nom manque (« — −380 », « — +910 », « — +2 140 », « — +1 100 »), et on lit deux tirets de suite. Le tiret seul suffit quand il y a un nom ; sans nom, il faudrait l'ôter.

## Doutes, non comptés
- c1-d année portrait : 5 montants sans nom, contre 2 au recontrôle 1. Il s'agit de deux brassins (« −380 », « −150 ») et de trois fêtes (« +2 140 », « +910 », « +1 100 »). C'est conforme à c5-b, où le montant reste seul faute de place, mais le brasseur ne sait pas quelle bière coûte −380 sans toucher.
- f6-b portrait pendant : « S48 · 23 nov. · lâcher ici » s'affiche dans la courbe zoomée en haut, loin du doigt posé sur la Blonde (environ 330 px plus bas). Il ne cache rien d'utile, mais il n'est plus sous le doigt, comme dans f1-b.

## Phrase prédite
« Là ça joue : je lis la semaine sans que rien ne se cache, et le menu est comme ma maquette. Mais sur l'année mon loyer est une barre grise vide, on ne sait pas ce que c'est. »

Note : 8 / 10
