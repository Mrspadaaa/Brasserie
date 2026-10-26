# cma1 — Les étapes, à toucher

**Chaleur : froide** (les idées retenues, affinées : la bande-sélecteur de la base, D128, et les moments de rpb1, « 60′ · 10′ · WP | actif · après », accepté).

## L'idée
La base avait déjà un sélecteur (toucher une étape), mais il ne se voyait pas : il l'a redemandé (« surtout pouvoir choisir quand comparé »). Ici chaque étape est une ligne-bouton avec sa pastille radio ; la choisie passe à l'encre, pleine largeur ; le radar porte le moment choisi (« dry hop », « 10′ »).

## Greffes (data-greffe)
- `cma1-etapes-a-toucher`, `rpb1-wp-actif-apres` : la bande, cinq lignes, `[data-role="quand-comparer"]`.
- `cma1-moment-sur-radar` : la pastille du moment sous « ~ simulé ».

## Ce qui tient
- Le choix se lit en trois secondes : une ligne noire, un rond plein.
- Les cinq moments restent comparés ensemble, au repos (D107) ; WP égale 10′ dans le moteur (montré tel quel).
- 97 mots au premier écran (base : 114).

## Ce qui casse
- Cinq lignes au lieu de trois : les rangées des familles descendent (Floral à Tropicaux au premier écran).
- Les valeurs du Nugget ne sont plus écrites dans la colonne de gauche : son trait pointillé reste sur chaque barre, sa valeur dans le title.
- « DH après » touche le premier nombre dans la ligne choisie.

## Construction (commune à la série cma)
- La page est la maquette jouable elle-même : le code React de `prototypes/houblons-v4/parcours/src/ecrans/comparer/` (HEAD 1ff7cdfd, exporté hors de l'arbre de travail, en chantier par une autre session), avec les quatre fichiers de `src/` substitués à la construction (vite, hook `load`) ; le moteur calcule en direct. `assets/` : script et feuille de cette construction. `etat.html` porte l'instantané du premier rendu (React le remplace au montage).
- Communs à la série (« moins de texte inutile ») : retirés « Face à ta stout, par », « chacun », le mot « dans » du verdict (✓ reste), la phrase « face à …, d'après ses fiches · en gras… », les deux phrases du pied (« ~ dans la cuve… », « Résineux déjà au-delà… »), le lien « Panel OSU… » (« Beaucoup trop mis en avant » ; il reste dans Preuve) et la phrase finale « ~ simulé par le moteur… ». Les glyphes ⇄ × + ↑ ↓ ★ deviennent des pictos au trait (même sens, même place) : écart déclaré, ils ne comptent plus comme mots.
- Le moment : cinq moments du moteur (60′, 10′, whirlpool, dry hop actif, dry hop après), `comparer(…, { quand })` ; colonnes, rangées, verdict « hors » et radar suivent. Départ : dry hop après (celui de la base).
- ⇄ × ＋ (recherche) : ceux de la base, inchangés, joués sur les quatre pages (3 colonnes → × 2 ; ＋ ouvre la recherche ; ⇄ « Remplacer Cascade », « nel » → Nelson Sauvin).

## Contrôles (25.10)
- `variantes.mjs` → VARIANTES-CMP-4 ; `controle-pictos-trait` → TRAIT OK ; `controle-quand-comparer` → QUAND OK.
- `controle-commun --sans=mots` → COMMUN OK ; `controle-panel` (cma1 à cma4) → PANEL OK (ressemblance 0,89).

## Captures
`captures/cma1.png`, `cma1-moment.png` (10′), `cma1-long.png`, `cma1-nelson.png` (Motueka face à Nelson Sauvin).
