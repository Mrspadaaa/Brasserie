OK — 56 problèmes, 8 bloquants ; à montrer : e9a, e9b, e9c, e11a, e11b ; à corriger : e9d, e10a à e10d, e11c, e11d

- Verdict détaillé : `work/missions/2026-11-14-brassins/voies/c5c/VERDICT.md`. Les 53 images et les 12 NOTE.md ont été ouverts ;
  chaque chiffre a été vérifié contre BRIEF-AUTEUR.
- G1 rejoué depuis la racine : `VERDICT OK` (voir `tests.txt`). Tests : aucune suite Vitest, rien dans `src/`.
- `git status` : seul `voies/c5c/` est neuf. SPEC-BRASSEUR.md était déjà modifié avant la voie.

## Par variante
- **e9a** (L'atelier remis d'aplomb) — MONTRER. « Propre, c'est l'actuel en lisible. » 3 problèmes ; à retoucher : la feuille de
  saisie à montrer, l'échelle des prix par format.
- **e9b** (Le chemin des idées) — MONTRER. « L'idée qui finit en cuve, j'aime bien. » 5 problèmes ; le titre des tarifs met le fût
  en avant au lieu du plus rentable.
- **e9c** (Le fil des semaines) — MONTRER. « Là je vois ce qui presse. » 5 problèmes ; la rangée de mois doit commencer en novembre,
  et « un toucher » est à retirer.
- **e9d** (Envie contre effort) — CORRIGER (relance de passe 2) : la bulle du geste couvre « À PRÉPARER ». « Sympa, mais on lit plus
  rien. »
- **e10a** (Le calculateur remis d'aplomb) — CORRIGER (relance) : 40 L proposés sans alerte, avec 44,8 L d'empâtage dans un système
  de 30 L. « Ça rentre pas, et il me le dit pas ? »
- **e10b** (La cuve d'abord) — CORRIGER (relance) : « Ramener à 30 L » remplit F1 à ras bord. « 30 L dans une cuve de 30 ? Ça
  déborde. » La correction tient en une valeur ; c'est la meilleure de la série.
- **e10c** (La pesée du jour de brassage) — CORRIGER (relance) : aucune alerte à 40 L. « La liste de pesée, oui, mais 44,8 L dans
  ma cuve de 30… »
- **e10d** (L'abaque, un seul trait) — CORRIGER (relance) : les bulles cachent les axes (« E1 »), et « 1 sachet jusqu'à 20 L » est
  faux pour 24 L. « Malin, mais faux et illisible. »
- **e11a** (La coque remise d'aplomb) — MONTRER. « Ça c'est clair. » 3 problèmes (« À cru », « Sur Brassins », « 2 °C » en place
  de la cuve).
- **e11b** (Sous-onglets sous le pouce) — MONTRER. « Deux gestes aujourd'hui, la semaine : très bien. » 5 problèmes (fond du menu,
  libellés coupés).
- **e11c** (La cuverie dans l'onglet) — CORRIGER (relance) : « F2 vide depuis 6 j » est faux, et contredit « La Pale Ale attend
  F2 ». « C'est la Pale Ale qui est en retard, pas F2. »
- **e11d** (Le classeur à intercalaires) — CORRIGER (relance) : les titres surlignés se chevauchent (« La Pale Ale » coupée).
  « Original, mais on lit pas le titre. »

LEÇON PROPOSÉE : un écran qui change une quantité (volume, dose) se juge d'abord au cas qui dépasse l'installation ; trois variantes
sur quatre de e10 affichaient 44,8 L d'empâtage dans un système de 30 L comme faisable, alors que la NOTE le relevait. Ajouter au
brief d'écran de calcul : « au-delà de la cuve, le titre le dit ».
