# dgz4 — « Les 12 familles, moment par moment » (voie dgz, 24.10 soir)

**Chaleur : chaude.** Greffe libre `carte-chaleur` : une idée à moi, hors de ses exemples. Les courbes de p4b2f suivent
trois familles ; cette carte montre **les douze sur les 24 moments d'un coup** : où chaque famille monte, et à quel moment.

## La base, gardée
L'écran Dryhopper de la maquette jouable, tel qu'il se joue : même shell, même bundle, même moteur, mêmes gestes ; greffe
injectée après le rendu. Rien de la base n'est retouché.

## L'idée
Un bloc entre la figure et les barres : 12 lignes (une par famille, son picto au trait à gauche) × 24 cases, alignées sur la
géométrie du rail de p4b2f (mêmes zones grises du whirlpool et de l'après, ★ au-dessus du meilleur). Plus la case est
foncée, plus la bière en a à ce moment, à l'échelle « au style » (pleine au haut de ta 16D) ; absolu suit la lecture.
Famille inconnue : ligne hachurée (« ? »). Hors style : liseré orangé (Résineux l'est partout : déjà au-dessus avant
l'ajout, comme ta dégustation). Moment interpolé : case en pointillé. Le cadre noir suit le rail ; toucher une colonne pose
le rail là (raccourci, pas un second réglage).

Lecture en trois secondes : agrumes, tropicaux, baies et floral montent d'un bloc à l'actif ; l'ébullition n'ajoute presque
rien d'aromatique ; l'après n'apporte que résineux en plus.

## Ce qui tient
Capture `dgz4-geste.png` : colonne « après · 3 j » touchée → rail, bandeau et barres suivent.

## Ce qui casse
- 184 px de haut : une barre seulement reste au premier écran.
- Pas de chiffres dans les cases (la barre en dessous les donne pour le moment tenu) ; les petites familles (épicé ~+2,
  herbacé ~+6) restent très pâles, ce qui est juste.

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

Captures ouvertes : `captures/dgz4.png`, `captures/dgz4-geste.png`.
