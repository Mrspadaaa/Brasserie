# Lot Calendrier du 23.11 — contrat réécrit (pilote)

Ordre et contenu inchangés (points 1 à 5 du brief), avec ces ajouts :

## Point 1, cause probable (lue par le pilote dans le code)
- `src/ui/calendrier/frise/Rangee.tsx:914` `largeurJourA` : colonne d'un jour → largeurColonne, sinon largeurColonne / 7 :
  toute colonne est lue comme une SEMAINE. À 51 sem. les colonnes sont des MOIS (~30 j) : tirer 5 colonnes = 35 jours
  dessinés et écrits au lieu de ~150 (Hefe « 18 avr. » au lieu de sept.).
- Même hypothèse : `usePointeur.ts:244` `largeurJourDe` (repli /7) et sans doute `pasDe` (glisse comptée en colonnes = semaines).
- Correctif : largeur d'un jour = largeurColonne / jours réels de SA colonne (comme `xDuJour`, Rangee.tsx:305) ; pas du glisser
  en jours réels ; une seule fonction date ↔ x partout.
- Commit SÉPARÉ dès que la propriété fast-check (D438) et l'e2e CAL-LACHER-OU-DESSINE passent : le pilote le met en ligne
  aussitôt (D440, porte légère). Retour intermédiaire autorisé pour ce seul commit : « POINT 1 PRÊT <hash> ».

## Méthode (D438, D439, D440)
- Un test par plainte + propriétés fast-check ; pas d'autres tests d'écran. Ne lance que tes tests ; pas la suite entière.

## Ajout 23.11 9:05 (pilote) — CAL-ECHELLE-SUIT-CADRE refusé une 2e fois
- Ses mots : « Et échelle toujours pas dynamique... » sur sa capture brasseur-23-11/2sem-0902.jpg (tour 15 : la pastille suit
  — nouveau paquet — mais la bande « S48 S49 » reste pleine largeur sous un cadre plus étroit, étiquette « S48 – S46 2027 »).
- Donc le point 2 n'est PAS en place sur la vraie app, malgré l'e2e vert sur fixture : reproduis-le d'abord EN LIGNE à 2 sem.,
  3 sem., 14 sem. en tirant les poignées ; trouve pourquoi l'e2e passait (il ne joue pas le même geste ou pas la même entrée).
- L13 : 2e refus du même élément → si la cause n'est pas un simple oubli de branchement, change de genre de solution
  (ex. la bande ne s'étale plus sur toute la largeur : elle est DESSINÉE dans le SVG de la courbe, même transformation x).
- Puis CAL-PLUS-QU-UN-AN et CAL-AUJOURDHUI-COURBE (message précédent), puis points 3 à 5.
