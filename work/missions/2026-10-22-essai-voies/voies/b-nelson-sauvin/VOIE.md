# Voie b-nelson-sauvin — pourquoi Nelson Sauvin paraît ordinaire

- Mission : 2026-10-22-essai-voies
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (puis conseil ou brasseur pour la correction à retenir)

## Objectif
Trouver, preuves à l'appui, pourquoi l'outil houblons fait paraître Nelson Sauvin « ordinaire » et
Motueka « ultra fruité ». Proposer deux ou trois corrections chiffrées. Le livrable est une note du
second cerveau. Aucun code n'est modifié.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` — section « Le lot 21, son retour » : « nelson sauvin
  est un houbon ordinaire alors que c'est un un houbon incroyable » ; « motueka est ultra fruité ».
- `work/refonte-frontend/registre.md` — retour du lot 21, point 5 (constat du pilote sur la fiche).
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/captures/l8g-fiche-390.png` — la fiche de Nelson
  Sauvin telle qu'elle s'affiche (à ouvrir en image).
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/l5f/` — la variante l5f critiquée.
- `prototypes/houblons-v4/data/pack-fiches.json` — descripteurs des fiches.
- `prototypes/houblons-v4/data/correspondance-familles.json` — rattachement des mots aux 12 familles.
- `prototypes/houblons-v4/src/engine/hops.ts` — `describeFamilies`, `familyWords`.
- `prototypes/houblons-v4/src/engine/fiches.ts` — usage côté fiche.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `cerveau/metier/descripteurs-hors-familles.md` (la note)
- `work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/ANNEXE.md` (tableaux complets, scripts
  d'analyse recopiés en bloc de code si utiles)

## Consignes
- Mesurer, ne pas supposer : pour Nelson Sauvin, Motueka, et trois témoins (Citra, Saaz, Galaxy),
  donner le nombre de descripteurs, la part rattachée à une famille, les mots « sans famille », et
  le poids de chaque famille qui s'affiche. Un script Node jetable lancé avec Bash convient. Le
  recopier dans ANNEXE.md, pas dans le dépôt.
- Cause : le mécanisme exact (fichier, fonction, ligne), et pourquoi il efface ce qui fait Nelson
  Sauvin (vin blanc, groseille à maquereau, fruit de la passion…) et gonfle Motueka.
- Options : 2 ou 3 corrections (rattachement des mots, famille ou part « autres » visible,
  pondération…). Pour chacune : ce qui change pour ces 5 houblons, le risque pour les autres, l'effort,
  et ce qui reste au brasseur à trancher.
- Penser en brasseur (L04, L14) : la réputation connue d'un houblon sert de témoin. Nelson Sauvin est
  réputé pour ses notes de vin blanc, groseille à maquereau et fruits tropicaux.
- Note au format du cerveau (voir `cerveau/INDEX.md`). En-tête : `name: descripteurs-hors-familles`,
  `type: metier`, `maj: 2026-10-22`, sources = les fichiers lus. Corps de 50 lignes au plus, avec
  les parties `**Constat**`, `**Cause**`, `**Preuves**`, `**Options**`. Le détail va dans ANNEXE.md.

## Exigences transversales et acquis
Honnêteté des données (source citée, inconnu ≠ 0). Code couleur des arômes (acquis). Peu de texte
au premier plan : une option qui ajoute du texte à la carte doit le dire.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `DÉCISION À PRENDRE` pour l'option à retenir. Réponse
finale au pilote : une ligne.
