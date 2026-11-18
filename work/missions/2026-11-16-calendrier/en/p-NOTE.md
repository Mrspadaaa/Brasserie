# En-têtes p1 à p6 sur g-d1 (16.11)

Ses mots : « Plus de place au graph et plus d'info sur ces mouvements, moins d'info sur le reste ».
Base : `paliers/g-d1.html`, portrait 390 × 844. Seule la tête (`#lhead` et `#mini`) est remplacée. La bande des
semaines (S47… et soldes), la frise, le + et les onglets restent ceux de la base.

Fichiers : `p1.html` à `p6.html`, générés par `build-p.mjs`. Les données viennent de `p-serie.json`, relevé par
`p-serie.mjs` dans le proto sources2 vivant, la même source que g-d1. Captures et contrôles : `cap-p.mjs`, qui
écrit `cap/p-mesures.json`.

## Hauteurs

« Tête » : du haut de l'écran au haut de la frise. « Jusqu'aux barres » : la même, plus la bande des semaines
inchangée (55 px). « Courbe » : hauteur utile de la courbe (de 0 au haut de l'échelle).

| version | idée | tête | jusqu'aux barres | courbe | dessin entier |
|---|---|---|---|---|---|
| base g-d1 | 113 en ligne, courbe de l'année, puce 6 sem. posée sur la fenêtre | 146 px (17,3 %) | 202 px (23,9 %) | 52 px | 88 px |
| p1 Marches | La courbe porte ses mouvements. Chaque marche de 500 ou plus est un trait épais : vert si l'argent entre, rouge s'il sort. Montant et nom court sont rangés sur une ligne au-dessus (entrées) ou au-dessous (sorties), reliés par un pointillé. Ligne de tête mince. | 142 px (16,8 %) | 198 px (23,5 %) | 56 px | 108 px |
| p2 Volume | Comme un cours de bourse : la courbe en haut, dessous le mouvement net de chaque semaine en barres vertes ou rouges, sur les mêmes semaines. Les mouvements de 800 ou plus portent leur montant. Le chiffre clé passe en pied, contre la frise. | 142 px (16,8 %) | 198 px (23,5 %) | 54 px, plus 36 px de barres | 110 px |
| p3 Rubans | Les grandes entrées en étiquettes vertes sur un ruban au-dessus, les grandes sorties en rouges sur un ruban dessous. Chacune est épinglée à sa semaine par un fil et porte le picto de sa rangée de la frise, et son nom court quand il tient. Les 6 semaines de la fenêtre, déjà dans la frise, n'ont pas d'étiquette. | 140 px (16,6 %) | 196 px (23,2 %) | 53 px | 111 px |
| p4 Mis de côté | Le creux expliqué. Entre la caisse (noir) et ce qui reste à dépenser (bleu), l'argent mis de côté s'empile achat par achat, une teinte par achat, nommé dans sa bande (Embouteilleuse, Frigo, Hotte). Le 113 se pose au-dessus du creux, relié par un pointillé. Pas de ligne de texte en propre. | 142 px (16,8 %) | 198 px (23,5 %) | 88 px | 112 px |
| p5 Pictos | Une colonne à gauche porte le chiffre clé : 113 CHF, à dépenser, S24, 2 en retard, 6 sem. Sur la courbe, les pictos des rangées (fête, vente, chariot, outil) sont posés sur la marche où l'argent bouge, plus gros pour les gros montants. | 140 px (16,6 %) | 196 px (23,2 %) | 86 px (sur 278 de large) | 132 px |
| p6 Épingles | Chaque grand mouvement est une étiquette épinglée sur la courbe, à la couleur de sa rangée de la frise : montant, nom court, pointe vers sa marche. | 142 px (16,8 %) | 198 px (23,5 %) | 70 px | 114 px |

## Contenu gardé dans les six

- 113 CHF avec son sens : « à dépenser » (p6 aussi, et l'aria dit « sans passer sous 0 »).
- Le plus serré : S24, le point bleu au creux.
- Les retards : pastille ⏲ 2, ou « 2 en retard » en mots dans p5. La période : 6 sem. ⌄, les autres à un toucher. Le plein écran ⛶.
- La courbe de l'année avec la fenêtre des 6 semaines et ses poignées. Plus rien n'est posé dessus (perte n° 11 corrigée).
- Pastilles réduites à 26 px de haut, texte à 14 px.

## Honnêteté des données

- Caisse, libre et mis de côté viennent de `serie()` et `flux()` du proto sources2. Le creux S24 vaut 113, comme g-d1.
- Trois mouvements de la frise manquaient au proto : Auberge du Lac +260 (S49), Houblons Suisse −312 (S50) et
  Brouwland −94 (S52). Ils sont repris de ses aria. `build-p.mjs` vérifie, semaine par semaine, que la somme des
  choses plus 120 de ventes égale le mouvement de la courbe. Il s'arrête sinon.
- Une étiquette porte le montant de la chose, par exemple Fête +2 140. Une marche porte le net de la semaine, par
  exemple +1 860 (loyer −400 la même semaine). p2 étiquette le net, puisque ses barres sont nettes.
- p4 : les bandes rejouent `deCote()`, la part linéaire de chaque achat sur sa fenêtre. Le contrôle passe, la somme
  égale D semaine par semaine.

## Contrôles (`node en/build-p.mjs && node en/cap-p.mjs`)

```
p1..p6 IDENTIQUE hors tête            (chaîne HTML hors tête = base, à l'octet)
p-base tête 146 px (17.3 %) · jusqu'aux barres 202 · graphe 88 px · min 14 px · + 295,728
p1   tête 142 px (16.8 %) · jusqu'aux barres 198 · graphe 108 px · min 14 px · frise IDENTIQUE · + 295,728
p2   tête 142 px (16.8 %) · jusqu'aux barres 198 · graphe 110 px · min 14 px · frise IDENTIQUE · + 295,728
p3   tête 140 px (16.6 %) · jusqu'aux barres 196 · graphe 111 px · min 14 px · frise IDENTIQUE · + 295,728
p4   tête 142 px (16.8 %) · jusqu'aux barres 198 · graphe 112 px · min 14 px · frise IDENTIQUE · + 295,728
p5   tête 140 px (16.6 %) · jusqu'aux barres 196 · graphe 132 px · min 14 px · frise IDENTIQUE · + 295,728
p6   tête 142 px (16.8 %) · jusqu'aux barres 198 · graphe 114 px · min 14 px · frise IDENTIQUE · + 295,728
CONTROLE OK
```

`cap-p.mjs` vérifie :
- la tête plus basse que la base et le dessin plus haut ;
- rien sous 14 px ;
- aucun texte chevauché, coupé, hors de l'écran ou au-dessus du bord ;
- aucun bouton hors de l'écran, chaque cible d'au moins 24 px et non couverte ;
- la frise identique au pixel (capture de 1 200 px depuis son haut, barres fixes masquées) ;
- le + à la même place (295, 728).

Il ne mesure pas un texte posé sur un trait de courbe : ce point a été jugé sur les captures.

## Captures (390 × 844, DPR 2, regardées en plein format)

- Pages entières : `cap/p1.png` à `cap/p6.png`. Base : `cap/base.png`, réécrite depuis par la voie q, même page.
- Têtes : `cap/tete-p1.png` à `cap/tete-p6.png` (les 250 px du haut).

## Limites vues sur les captures

- p5 : à 278 px de large, les marches sont serrées. Fête, Frigo, Fûts et Mariage cèdent leur place au picto voisin. Le
  chariot de l'Embouteilleuse n'a pas son « −2 800 » (au toucher). C'est la plus chargée des six.
- p6 : les étiquettes ne tiennent pas toutes. Embouteilleuse −2 800, Fûts −1 080, Festival +2 450 et Sols −600 sont
  posées ; Fête, Frigo et Mariage sont à un toucher.
- p4 : l'étiquette du 113 est posée à gauche du creux, et le pointillé descend sous « CHF ».
- p2, p3 : la courbe gagne peu (53 à 56 px contre 52). La place gagnée va aux barres ou aux rubans, qui sont
  l'information sur les mouvements.
- Thème cave non capturé : les six n'emploient que les variables du thème de l'app (`--fin`, `--ok`, `--bad`,
  `--e-*`, `--bg`, `--halo`).

## Boosters UX (boosters-ux)

- Courbe-mouvements (p1 à p6) : besoin « lire et comparer » ; représentation : marche colorée, barre, étiquette,
  picto ; effet : la cause d'une montée ou d'une descente se lit sur la courbe. Statique, sans geste joué.
- B2 : la courbe domine dans chacune (100 à 132 px, contre 26 à 28 px de texte).
- B3 : la tête perd 4 à 6 px et le texte se réduit à « 113 CHF à dépenser S24 ».
- B6 : 14 px au plus petit, chiffres tabulaires.
- B13 : cibles de 26 px au moins, aucune couverte.
- B7, B8 : non mesurés.
