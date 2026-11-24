# Dossier c48-fix

- Tests à rendre verts : tests/unit/c48Regles.test.tsx (+ fixture tests/fixtures/c48/), écrits depuis les règles par la voie c48-tests (voies/c48-tests/RESULTAT.md : liste des endroits par règle, 21 rouges sur 28, prop attendue `onRelire` sur la fiche et sur Comparer).
- Règles (lignes C48 de BUGS.md, test de son carnet « chambre froide », voies/critique-48/RESULTAT.md) :
  - R1 : un prix publié (même hors TVA, même avant le titre ou loin sous le titre) est lu ; un article lu sans prix se voit proposer « Relire » (geste du brasseur, jamais automatique).
  - R2 : aucun libellé de tableau du Carnet coupé au milieu d'un mot à 390 px (retour à la ligne entre mots, ou libellé court entier).
  - R3 : un seul classement ; Articles et Comparer disent le même critère en tête.
  - R4 : le compromis ne recopie pas le tableau.
  - R5 : ce qui décide d'abord (température, volume, matière, énergie, fluide, refroidissement) ; rien de cela perdu par les plafonds (24 lues, 10 gardées) ni par la fusion IA ; « 4,06 m³ », « 230V », « R290 », « Air pulsé » lus ; « Température de » n'est pas un nom de ligne.
- Décisions du pilote (règle n° 1 : sa maquette choisie de Comparer reste telle quelle) :
  - (a) R3 : la chaîne « Classé par » suit le vrai tri (critère, puis prix), la ligne Prix reste épinglée comme dans la maquette.
  - (b) R4 : la phrase du compromis de sa maquette g01-8 reste ; la règle « ne recopie pas » s'applique seulement au compromis sans critère (calculé ou IA). Les tests R4 qui exigent l'inverse sur le cas avec critère sont caducs : à adapter, cités.
  - (c) Replier les lignes identiques de Comparer : hors de cette voie.
