# Critique : as/cal.html et cal-paysage.html (17.11)

Critique calibré (portrait v2). Captures ouvertes : as/cap (jouer.mjs, gestes au doigt CDP), maquettes page14/img, base se/z2s.

## Au fil
Repos = base (p-repos identique à base-portrait). + volant à 15 px des onglets. Captures de as/cap ouvertes : repos, f1a, f2a, f4b, f5a, f6b, c1d, c2b, c3a (portrait), repos, f1a, f4b, f5a, c1d, c3a (paysage), cave f5a ; maquettes f1-b, f2-a, f4-a, f5-b, f6-b, c5-b, c3-a, c3-b (ids réels selon la correspondance de page14).

## Combien et quels problèmes : 19, dont 3 bloquants

1. **f1-a pendant, écart à sa maquette (bloquant)** : la tête « 113 » disparaît pendant le glisser ; pas d'axe des montants ; pas de marche « −540 » en rouge ; pas de colonne S51 éclairée dans la frise ni d'étiquette « S51 · 14 déc. · lâcher ici » sous le doigt (f1-b-avant). Le brasseur ne sait pas où il lâche.
2. **f1-a pendant, colonnes décalées** : la courbe zoomée n'est pas calée sur la frise. En portrait, S51 de la courbe est au-dessus de la colonne S50. En paysage, la courbe a 15 semaines (S47–S8) contre 13 colonnes.
3. **f1-a pendant** : « 5 064 → 4 524 » est barré par le trait de la courbe, en portrait comme en paysage.
4. **f4-b portrait, valeur fausse (bloquant)** : le Porter est coupé par la fenêtre de 6 semaines. « En cuve 15 → 28 déc. · Prête 11 janv. » est calculé sur la seule partie visible. En paysage, le même brassin dit « 15 → 1 janv. · Prête 18 janv. ». Une même bière a deux dates selon le sens du téléphone.
5. **c3-a, valeurs incohérentes (bloquant)** : la même semaine S24 donne Ventes +128 et la semaine −192 en portrait, mais +126 et −194 en paysage.
6. **c3-a portrait, écart à sa maquette** : la grande courbe s'ajoute sous la petite courbe de tête, ce qui fait deux courbes empilées. Dans c3-b, la grande remplace la petite et la tête « 113 » reste seule.
7. **f5-a Retirer** : la tête passe à « −1 067 » et s'élargit. Le bouton plein écran sort de l'écran et le bouton ⏲2 est coupé au bord.
8. **f5-a Retirer** : sur la courbe recalculée, « Frigo −1 800 » et « Hotte −900 » sont barrés par le tracé.
9. **f5-a paysage** : le menu s'ouvre au-dessus et couvre la barre Marché de Noël qu'on vient de presser. Sa pointe vise l'icône ⟳ des Ventes. Sa maquette dit « sous la barre ».
10. **f5-a portrait** : le menu prend toute la largeur. Il cache les carrés + et les noms des rangées Ventes à Papiers. Dans f5-b, le menu est ancré à la barre et laisse ces noms visibles.
11. **c1-d année, illisible par endroits** : les traits de colonnes traversent les noms (« Porter c'hiver », « Blonde c'automne », « houblon à cru », « Dégustation à la brasserie »), en portrait comme en paysage.
12. **c1-d année, frise en escalier** : un événement par ligne (7 lignes pour Brassins, 6 pour Fêtes), avec des blocs larges. Ventes passe sous le pli. c5-b range plusieurs événements par ligne, en barres fines.
13. **c2-b** : la bulle des deux mouvements se pose sur la gauche de la courbe. Elle cache le point lu sous le doigt et les noms Embouteilleuse et Hotte. Dans c3-a, la bulle est à côté et le point cerclé reste visible.
14. **f6-b** : il n'y a pas de fantôme hachuré à l'ancienne place de la Blonde (S47), alors que sa maquette en montre un.
15. **f4-b** : les petites icônes des étapes (brassage, cuve, prête) et le trait pointillé entre la barre et le panneau manquent par rapport à f4-a.
16. **f2-a** : les deux boutons de l'alerte sont empilés. L'alerte fait 340 px et repousse Achats. Dans sa maquette, les boutons sont côte à côte et l'alerte est plus basse.
17. **f4-b paysage** : « 15 → 1 janv. » ne donne pas le mois de départ (15 déc.).
18. **f1-a paysage pendant** : « Commande groupée de malt » chevauche le fantôme hachuré, et des lettres sont barrées.
19. **c3-a paysage** : l'axe des mois est coupé à droite (« nov »).

## Doutes, non comptés
- Paysage : seules 2 rangées environ tiennent sous la tête, avec une médiane de 86 px (COMPACT ECHEC). La sortie est identique sur se/z2s-paysage.html, donc le défaut vient de la base.
- PLUS ECHEC et BASE G3 cherchent `.k14-pl` et des chips filtres. Son choix F3 et r2-c mettent le + dans le carré et l'œil par rangée : ces deux contrôles sont périmés, pas le livrable.
- BASE G5 compte 8 semaines, alors que la capture l-repos en montre 13 (S47–S6). Le contrôle se trompe probablement.
- f1-a après : sur la capture, la page a défilé et la tête n'est plus en vue. Je n'ai pas pu vérifier que le 113 recalculé s'affiche.

## Phrase prédite
« Les gestes sont là, mais en glissant je ne vois pas où je lâche, et le Porter n'a pas les mêmes dates quand je tourne le téléphone. »

Note : 5,5 / 10
