OK — quatre Comparer jouables sur la base jouable, moment choisi (5 moments), ≤ 100 mots

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/cma1/` à `cma4/` : `etat.html` (instantané du premier rendu, puis React), `assets/` (script et feuille de la construction, ~3 Mo par variante), `src/` (les quatre fichiers substitués : `index.tsx`, `Etapes.tsx`, `calcul.ts`, `comparer.css`), `NOTE.md`.
- `work/refonte-frontend/v4/ecran-1/fils25-comparer/captures/cma[1-4].png`, `-moment.png`, `-long.png`, `-nelson.png` (390 × 844, ×2).
- Construction : export de HEAD 1ff7cdfd dans le scratchpad (l'arbre de travail `prototypes/houblons-v4/parcours/src` est en chantier par une autre session : `ecrans/ma-biere` supprimé, construction cassée), vite avec un hook `load` qui substitue les fichiers de `cmaN/src/`. Base reconstruite ainsi = capture identique à `base-jouable.png`. Scripts hors du dépôt.

## Les quatre
- cma1 (froide) « Les étapes, à toucher » : la bande de la base en 5 lignes-radios (60′ · 10′ · WP · DH actif · DH après), la choisie à l'encre, le moment sur le radar. 97 mots.
- cma2 (tiède) « La tête parle le moment » : à 60′ et 10′ la tête dit ~IBU de l'ajout ; au WP et au dry hop, l'huile totale mesurée (mL/100 g). 99 mots.
- cma3 (tiède) « Lui seul, une rangée » : les mots hors 16D en rangée du tableau sous les têtes (◇ et mot précis) ; fil du temps ; écart : radar sous le tableau. 99 mots.
- cma4 (chaude) « Le brassin » : cinq appareils au trait en tête (chaudière à grand ou petit feu, tourbillon, fermenteur qui bulle ou au repos), une mini barre par houblon sous chacun, ★ au meneur. 82 mots.
- Communs : textes retirés (« Face à ta stout, par », « chacun », « dans », phrase de « ses mots », pied, lien Panel OSU, phrase finale) ; ⇄ × + ↑ ↓ ★ en pictos au trait (écart déclaré).

## Critères
- G1 `variantes.mjs cma1 cma2 cma3 cma4` → VARIANTES-CMP-4
- G2 `controle-pictos-trait … --page=etat.html` → TRAIT OK (56/56/46/56 pictos, 0 faute)
- G3 `controle-quand-comparer … --page=etat.html` → QUAND OK (4 moments reconnus sur chaque page, les valeurs changent)
- Hors GATES : `controle-commun --sans=mots` → COMMUN OK ; `controle-panel` → PANEL OK (ressemblance 0,89) ; gestes ⇄ × ＋ (recherche « nel » → Nelson Sauvin) joués sur les quatre.
- Captures toutes ouvertes, dont `-nelson` (Motueka face à Nelson Sauvin) et `-moment`.

## Prédiction
« La 4 avec les cuves c'est vachement bien, on voit direct quand ça monte ; la 2 avec les IBU à 60′ et l'huile au dry hop c'est très bien mais faut le radar plus grand ».

DÉCISION À PRENDRE : cma3 sort le radar r2 du premier écran (écart à la base, motivé par « À revoir ») ; à lui de dire si c'est permis. Les assets de chaque variante (~3 Mo ×4) vivent dans `work/` : à garder ou à republier hors git.

CONNAISSANCE : une variante d'un écran de la maquette jouable se construit fidèlement en substituant ses fichiers à la construction (vite, hook `load` qui garde l'id du module, donc ses imports relatifs) ; le moteur sait déjà poser un ajout au whirlpool et en dry hop actif (`comparer(…, { quand })`). Dans le moteur, WP donne les mêmes crans que 10′ sur ce cas.

LEÇON PROPOSÉE : un contrôle qui lit le fichier `etat.html` par expression régulière (`variantes.mjs`) ne voit rien d'une page React ; écrire ces contrôles sur le DOM rendu (ici contourné par un instantané du premier rendu dans la page).
