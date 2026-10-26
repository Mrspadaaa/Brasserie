# dgz3 — « Ma cuve : ta stout → + Idaho 7 → + Pomona » (voie dgz, 24.10 soir)

**Chaleur : chaude.** Greffe `cuve-x3b` : « Ma cuve, jour après jour » de x3b, prise comme il l'a dit, « juste pour de la
comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure ».

## La base, gardée
L'écran Dryhopper de la maquette jouable, tel qu'il se joue : même shell, même bundle, même moteur, mêmes gestes ; greffe
injectée après le rendu. Rien de la base n'est retouché.

## L'idée
Un bloc « Ma cuve » entre la figure et les barres : douze colonnes empilées, une par famille, dans l'ordre des barres.
- **ta stout** (pointillé gris, comme la bière de base de x3b) : son profil avant l'ajout ;
- **+ Idaho 7** au moment tenu (couleur de la famille ; pâle si le moment est interpolé ; liseré orangé hors style) ;
- **+ levure Pomona** (hachuré bleu, le bleu de la bosse de levure de p4b2f) : ce que Pomona ajouterait à ce moment, par
  `effetLevure` (la même valeur que le pont « Levure Pomona ~+13 agrumes ») ; « rien ici » hors de l'actif.
Le trait noir au-dessus de chaque colonne est le haut de ta 16D ; une colonne qui le dépasse est hors style. Pépins, Melon
et Végétal : hachurés gris, « ? », jamais 0. Noyau et Baies : la base est inconnue, la colonne part de zéro (« ?→ »).
Le bloc suit le rail et la lecture au style / absolu.

## Ce qui tient
Capture `dgz3-geste.png` : au whirlpool, les colonnes redescendent, la part Pomona reste (~+13 agrumes, la levure agit sur
la bière finie) ; « + Idaho 7 whirlpool ».

## Ce qui casse
- Pas de chiffres sur les colonnes : les valeurs sont dans les barres juste dessous.
- « 2 dry hop » : un second ajout n'existe pas sur cet écran (un facteur libre) ; la troisième couche est la levure.

## Contrôles
| critère | sortie |
|---|---|
| `variantes.mjs` (G1) | VARIANTES-BIEN-4 |
| `controle-pictos-trait --page=etat.html` (G2) | TRAIT OK (29 pictos, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (libres : moment ; 9 contrôles) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (4 captures) | remplissage médian 0,73 ; DIVERSITÉ ECHEC (ressemblance 0,95) : base commune par contrat |
| `controle-choix --ecran=dryhopper` (base jouable) | CHOIX OK |

Captures ouvertes : `captures/dgz3.png`, `captures/dgz3-geste.png`.
