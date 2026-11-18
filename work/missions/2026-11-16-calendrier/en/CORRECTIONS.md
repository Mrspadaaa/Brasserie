# Corrections du 16.11 au soir (versions montrées : q4, p1, q5, l5, l1)

Avant toute modification, la v0 a été copiée dans `en/v0/` : html, scripts de build et captures. Rien d'autre n'a changé : q1 à q3, q6, p2 à p6 et l2 à l4 sont reconstruites par un code identique. La frise et le + sont contrôlés identiques à la base.

## Portrait

**q4 (130 px, courbe 52)**

- **Mois** : « déc. mars juin sept. » sont en 14 px, sur une bande teintée dans le haut du cadre de la courbe.
  - La bande occupe la marge vide au-dessus de la caisse, qui monte au plus à 5 850 hors festival. L'échelle passe de 8 000 à 8 400.
  - Seule la pointe du festival traverse la bande ; elle est dessinée par-dessus.
- **Pourquoi pas sous la courbe** :
  - Une rangée de mois sous la courbe coûte 16 px, ce qui porte la tête à 146 px, autant que la base.
  - Chaque sortie tombe au début d'un mois : Hotte en mars-avril, Embout. en juin, Frigo en septembre. Sous la courbe, leurs pointillés traverseraient les noms de mois.
  - Fûts, Hotte et Embout. ne tiennent pas sur une seule rangée, même avec 12 px d'écart : entre les traits de Hotte et d'Embout. il n'y a que 37 px, et l'étiquette de Fûts en fait 74. Il faut donc deux rangées de sorties.
- **Sorties sur deux rangées** :
  - En haut, Hotte −900 et Frigo −1 800. En bas, Fûts −1 080 (ajouté, à sa semaine) et Embout. −2 800.
  - Hotte et Embout. ne sont plus sur la même ligne, et 13 px séparent Fûts d'Embout.
  - Les pointillés de la seconde rangée passent entre les étiquettes de la première.
- **Texte secondaire** :
  - « à dépenser · plus serré » est en `--mut`, le texte secondaire de l'app (DESIGN.md, cave-400), en poids 500.
  - Contraste mesuré : 5,74:1 en clair (#666 sur #fff) et 5,70:1 en cave (#9a8a7e sur #12100e).
- **Fenêtre** : elle ne couvre plus que la courbe. Son bord coupait « déc. ».
- **Courbe** : 52 px, comme la base (58 en v0).

**q5 (134 px, inchangée en hauteur)**

- **Texte secondaire** : le même pour « CHF à dépenser · » (poids 500, 5,74:1 et 5,70:1).
- **Nom de l'embouteilleuse** : « Embouteilleuse » ne tient pas dans la ligne des causes, où il manque environ 45 px sur 366. « Embout. » reste affiché, et chaque cause devient un bouton qui donne le nom complet au toucher (`title` et `aria-label` : « Embouteilleuse −2 800, S22 »).

**p1 (142 → 130 px, courbe 54)**

- **Étiquettes** : le seuil passe à 800, et chaque étiquette porte un nom. « +520 » et « −540 », qui n'en avaient pas, sont retirés.
- **Couleurs** : seules les marches nommées sont en couleur (4 px). Les autres marches de 500 ou plus sont en gris (`--mut`, 2,5 px).
- **Hauteur** : ligne de tête de 26 px et rangées resserrées (sorties en 85, mois en 98). La tête gagne 12 px, et la courbe garde 54 px (56 en v0, 52 dans la base).
- **Sombre** : les captures en cave sont faites, avec `THEME=cave node en/cap-p.mjs p1`.

## Paysage

**l1 (143 → 171 px, courbe 54) et l5 (140 → 165 px, courbe 50) ; base 174**

- **Mois** : ils sont sur une bande teintée, sous la courbe et de sa largeur.
  - En l1, un filet et 8 px les séparent des dates.
  - En l5, la loupe et la rangée des écarts les en séparent.
- **Semaines** : « S47 … S5 » est remis au-dessus de chaque date, en 14 px gris. S47 est en bleu, comme dans la base.
- **l1** :
  - « +1 100 mariage » est nommé. Le festival passe sur une seconde rangée, et le pointillé du mariage passe à gauche de son étiquette.
  - ⇅ et les hypothèses sont réunis en un seul menu de réglages (`aria-haspopup="menu"`), placé à côté des filtres.
- **l5** :
  - La rangée des sorties de l1 est reprise sous la courbe : hotte, fûts, embouteilleuse et frigo, chacune avec son pointillé et son triangle.
  - Les mini-barres sont retirées : le signe et la couleur suffisent.
  - La loupe part du bas de la fenêtre.
  - Les écarts restent ceux de la v0 : −148, +120, −20, +988, −56, +486, −60, −460, −260, +120, −112, −280.
- **Hauteur** : les ajouts demandés (S47, mariage, sorties) coûtent 28 px à l1 et 25 px à l5. Les deux têtes restent plus basses que la base.

## Contrôles

```
q4 tête 130 px (15.4 %) · 15 textes · petits 0 · hors 0 · chevauchés 0 · coupés 0 · cibles<24 0 · + 295,728,16 sous le + 0 · boutons hors écran 0 · rangées 56,192,230,316,380,406,470 → TETE OK
q5 tête 134 px (15.9 %) · 17 textes · petits 0 · hors 0 · chevauchés 0 · coupés 0 · cibles<24 0 · + 295,728,16 sous le + 0 · boutons hors écran 0 · rangées 56,192,230,316,380,406,470 → TETE OK
p1   tête 130 px (15.4 %) · graphe 100 px · min 14 px · frise IDENTIQUE · + 295,728 → CONTROLE OK (clair et cave)
## l1 : en-tête 171 px (43.8 %) ; courbe(s) 54 px ; frise identique ; + identique ; code frise identique — aucun défaut
## l5 : en-tête 165 px (42.3 %) ; courbe(s) 50/45 px ; frise identique ; + identique ; code frise identique — aucun défaut
CONTROLE OK (témoin l-temoin échoue comme attendu)
```

## Captures (ouvertes)

- Pages entières :
  - portrait : `cap/q4.png`, `cap/q4-cave.png`, `cap/q5.png`, `cap/q5-cave.png`, `cap/p1.png`, `cap/p1-cave.png`, `cap/tete-p1.png`, `cap/tete-p1-cave.png` ;
  - paysage : `cap/l1.png`, `cap/l1-cave.png`, `cap/l5.png`, `cap/l5-cave.png`.
- Zooms ×3 : `cap/zoom-q4.png`, `cap/zoom-q4-cave.png`, `cap/zoom-q5.png`, `cap/zoom-p1.png`, `cap/zoom-p1-cave.png`, `cap/zoom-l1.png`, `cap/zoom-l1-cave.png`, `cap/zoom-l5.png`.
- La v0, pour comparer côte à côte : `v0/cap/`.

## Décision à prendre

En q4, les mois sont soit en haut du cadre (tête de 130 px, ce qui est livré), soit sous la courbe (tête de 146 px, autant que la base).
