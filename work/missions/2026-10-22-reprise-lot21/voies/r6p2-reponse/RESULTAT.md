OK — r6p2 : réponse en grand, « contre ★ » chiffré ; D56 « moins résineux » corrigé

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/generer.mjs` (copie de r6n2, classes `r6p2-…`), `etat.html`, `captures.mjs`, `NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p2-*.png` (21 captures)
- ce RESULTAT.md. Rien d'autre (`git status` vérifié : seuls `r6p2/` et `captures/r6p2-*` sont à moi).

## Ce que fait la variante
- La réponse devient la plus grosse chose de l'écran, dans un cadre à filet noir (b4) : « ★ ● Idaho 7 ✓ par [❀ floral ⌄] … ❀ ~+1,3 ».
- Dessous, le pourquoi, deux ou trois signes par houblon : « contre ★ · ● Cascade ❀ ≈−0,4 · ● Galaxy ❀ ≈−0,4 ⚠🍍 › ». « = » sous 0,15 cran, vert si l'écart va dans le sens de sa demande. La ligne ouvre « Pourquoi ce classement ».
- Toucher une colonne réécrit la ligne en perte chiffrée contre ★ : « ● Cascade contre ★ ❀ ≈−0,4 🌲 = » ; pour Galaxy, « … ⚠ sort 🍍 ». La ligne prend le liseré de la colonne touchée.
- ★ suit dans la tête de colonne. Par « moins résineux », la ligne montre que tous sont à « = » : aucun houblon ne baisse le résineux.
- À quatre colonnes, les noms de la ligne deviennent les ronds lettrés de w2.

## Idées reprises (d'où → où)
- La réponse directe et le pourquoi (b4, Dryhopper) → le cadre de réponse.
- La ligne du doigt « contre ★ » (greffe b4, r7-verdict) → la seconde ligne du cadre, au toucher d'une colonne.
- Le rond lettré (w2) → « contre ★ » à quatre colonnes.
- Restes du critique r6nc2 :
  - radar moins rose : moustache et « // » à l'encre, surface pleine à 16 % ;
  - pont de la Frise construit depuis le cas : « enchaîner Idaho 7 puis Galaxy », plus Citra ;
  - dans Souche, Pomona n'a plus la forme d'un bouton ;
  - l'ordre du titre ne contredit plus celui des colonnes : le titre devient « Lequel pour ma stout ? ».
- Payé :
  - le titre passe en 14 px gris ;
  - « Face à ta stout » et « pourquoi ? » ne sont plus écrits ;
  - le pont Dryhopper monte dans l'en-tête, faute de place sur la ligne de réponse avec « moins résineux ».
- Résultat : 71 mots (r6n2 : 79), trois tailles de texte (20, 14, 12), et le tableau finit 4 px plus bas que dans r6n2. Il n'y a pas de vide nouveau.

## Correction après le rejet du critique (D56 / D10)

Défaut : par « moins résineux », le ✓ « reste dans ta 16D » passait sous le mot « par ».
- Le bloc du nom ne rétrécit plus (`flex: none` sur le bloc et sur ses signes, marge de 2 px après le signe).
- Libellé de pastille de plus de huit caractères, à trois colonnes : « 🌲 ~+1,9 » passe en bout de la ligne « contre ★ ». La ligne de réponse reste sur une seule ligne et la hauteur ne change pas.
- À quatre colonnes, la ligne « contre ★ » est déjà pleine : la pastille passe sous le nom (`flex-wrap`) et le gain reste en haut. Le tableau descend de 28 px, dans ce seul état.

Libellés rejoués et ouverts :
- `r6p2-resineux-390.png` : ✓ et « par » séparés ;
- `r6p2-resineux-galaxy-390.png` ;
- `r6p2-resineux-quatre-390.png` ;
- `r6p2-agrumes-390.png` ;
- `r6p2-tropicaux-390.png` ;
- `r6p2-premier-ecran.png` (floral) : inchangé.

Aucun chevauchement, rien de coupé. Rien d'autre n'a changé.

## Sorties décisives (rejouées depuis la racine)
- G1 : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK ; mots sauté)
- G2 : `r6p2 71 mots` / `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. Il a d'abord échoué parce que la ligne du pourquoi nommait des houblons dans son aria-label. Corrigé : le libellé ouvre sur « Pourquoi ce classement ».
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`
- G5 : `ALPHA OK`
- G6 : `REPRISE OK (27 repris, 2 en contexte, 8 en pont, 0 écartés)`
- G7 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G8 : `EXISTENT OK 7`
- G9 : `NOTE OK`
- Captures : `CAPTURES r6p2 OK` (aucune erreur de page).

## Captures
Ouvertes en image et jugées avec le PORTRAIT :
- `r6p2-premier-ecran.png`, comparée à `r6n2-premier-ecran.png` : même disposition, même densité, et la réponse lisible en trois secondes ;
- `r6p2-toucher-390.png` (Cascade touché) et `r6p2-galaxy-390.png` ;
- `r6p2-resineux-390.png` : le chevauchement nom / pastille vu au premier essai, corrigé ;
- `r6p2-tropicaux-390.png` et `r6p2-critere-390.png` ;
- `r6p2-quatre-390.png` : la ligne débordait au premier essai, corrigée par les ronds lettrés ;
- `r6p2-quatre-nelson-390.png`, `r6p2-pourquoi-390.png` ;
- `r6p2-fiche-390.png` : « 1 seule fiche : Beer Maverick », D71 déjà réglé dans le noyau ;
- `r6p2-frise-390.png`, `r6p2-souche-390.png`, `r6p2-defi-390.png`, `r6p2-legende-390.png`.

Régénérées sans être rouvertes, parce que ce sont les feuilles de r6n2, inchangées : `r6p2-390.png`, valeurs, preuve, égaler, ajout, absolu-galaxy, agrumes-idaho.

## Prédiction
« Pas mal, là je vois tout de suite Idaho 7 et ce que les autres perdent, et le "=" sur le résineux c'est parlant. Mais 0,4 c'est rien, pourquoi une grosse étoile ? »

DÉCISION À PRENDRE : sous un cran d'avance, ★ creuse plutôt que pleine ? Les bandes se recouvrent et la réponse en grand donne du poids à ~0,4 cran. La page le dit seulement par « ≈ » et dans la feuille du pourquoi. C'est au brasseur de choisir, en variante.

CONNAISSANCE : à 390 px, la ligne de réponse de Comparer tient « ★ nom ✓ par [pastille] gain » seulement si le pont part ailleurs. « Cascade » avec « moins résineux » fait ~330 px. Une ligne « contre ★ » tient 3 houblons nommés, ou 4 en ronds lettrés.

LEÇON PROPOSÉE (complétée après le rejet) : le chevauchement de « moins résineux » était déjà sous mes yeux à la première capture, et je ne l'ai pas vu à l'échelle ×2. Il faut agrandir chaque ligne de texte dense ou interactive de chaque état, sans s'arrêter à l'état de départ. Constat de départ : une variante qui ajoute du texte au toucher doit capturer le cas le plus long des données (nom le plus long, critère le plus long, quatre colonnes), pas seulement l'état de départ. Le 23.10, r6p2 :
- état de départ (Idaho 7, floral) : propre ;
- « moins résineux » : nom et pastille se chevauchaient ;
- quatre colonnes : Nelson Sauvin coupé à « N ».
Seules les captures de ces états l'ont montré. Rôles : concepteur, auteur. Contrôle : aucun ; on pourrait faire jouer à `verifier-page.mjs` chaque `?crit=` et `?n4` pour y chercher les débordements.
