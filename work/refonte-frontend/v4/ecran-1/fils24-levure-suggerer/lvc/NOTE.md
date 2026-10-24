# lvc — chaude : la levure est le contexte, pas une voie ; ses effets se posent sous tes objectifs

Jeu court jc-levure (D35). Page : copie de Suggérer rendue par r4 (bundle dans `../assets/`).

## L'idée
L10 dit : un seul facteur varie, les autres sont sur la ligne de contexte. La levure est un de ces autres facteurs. Au
repos, elle n'est qu'une puce « US-05 » (icône levure) dans la rangée des réglages, entre « ? » et « Barres | Radar ».
Au toucher, un tiroir s'ouvre juste sous les trois cartes d'objectif. Ses colonnes sont alignées sur elles : Moins
résineux, Plus floral, Plus agrumes. Une rangée par souche (Pomona, Verdant IPA). Sous chaque carte, ce que la souche
fait **seule**, sans changer de houblon. Résineux et floral : hachurés, « ? » (le moteur n'en sait rien). Agrumes :
une petite piste chiffrée, avec une pointe orangée si hors style. À droite du nom, le noyau en orangé (~+4,3, hors
style). En pied : « Levure seule : houblons et IBU 59,7 inchangés, fermentation à revoir » et « Étape Levure › ».

## Données
Moteur en direct (`outils/levures-moteur.ts`, `donnees/levures-moteur.json`) : les mêmes nombres que lva et lvb.

## Chaleur : chaude
Forme libre : ni groupe de liste (lva), ni pont (lvb). La levure devient une lecture des objectifs. Les cartes disent
« ce que les houblons font » ; le tiroir dit, colonne par colonne, ce qu'une autre souche ferait à leur place.

## Ce qui tient
- Zéro bruit au repos : 5 caractères dans une puce, la liste et les cartes intactes.
- On y lit d'un coup que la levure n'aide ni le floral ni le résineux, et qu'elle pousse les agrumes déjà atteints et
  le noyau hors style. C'est la réponse honnête pour cette stout.

## Ce qui casse
- La puce ajoutée serre la rangée des réglages à 390 px : il reste 0 px de marge, et elle déborde dès qu'un libellé
  s'allonge.
- « US-05 » seul ne dit pas qu'on peut le toucher pour comparer (pas de chevron, retiré faute de place).
- L'orangé du noyau n'a pas de mot : il faut connaître le code « orangé = hors style » de la légende.

## Contrôles
- `controle-commun.mjs … --page=etat.html --sans=mots` : COMMUN OK. Premier essai : STANDARD ECHEC (S4, icône à
  1,6 px) ; redessinée à 1,2 px.
- Captures : `captures/lvc-repos.png`, `captures/lvc-toucher.png` (390 × 844), ouvertes.
