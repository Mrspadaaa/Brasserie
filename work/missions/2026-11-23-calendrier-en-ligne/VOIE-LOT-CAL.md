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

## Ajout 23.11 9:10 — grain des graduations (CAL-GRAIN-SUIT-DUREE)
- Ses mots : « si je mets 1 ou 2 ou peut être 3 je devrais voir les jours plutôt que les semaines.. comme les mois pour une année ».
- Le grain suit la largeur du CADRE (pendant le tirage, à chaque durée) : jours jusqu'à 3 sem., semaines au-delà, mois pour un an
  et plus. À faire AVEC la priorité 1 (même bande, même transformation x), un seul cycle PRÊT / EN LIGNE / preuve en ligne.

## Ajout 23.11 (vérif. en ligne de fix13) — arrondi du lâcher
- À 14 sem., doigt dans la 2e moitié de S3 → écrit S4 : le lâcher arrondit à la colonne la plus proche au lieu de prendre la
  colonne SOUS le doigt. Corriger (plancher, pas arrondi) dans la transformation unique ; la propriété fast-check passe à
  « date écrite ∈ colonne sous le doigt » (plus de ± 1).

## Ajout 23.11 9:40 — PRIORITÉ 1 maintenant (redit une 2e fois)
- « On voit toujours pas sur le graph où est le moment présent, et la pastille bleu, on comprend pas à quoi ça sert »
  (capture brasseur-23-11/40sem-0937.jpg, tour 17).
- CAL-AUJOURDHUI-COURBE : un trait vertical « aujourd'hui » sur la courbe, de la couleur de la semaine bleue du calendrier,
  à chaque échelle ; hors fenêtre : rien (pas d'invention).
- CAL-POINT-BLEU-MUET (pilote, réversible) : retirer le point bleu du creux ; la pastille « −4 563 · S26 '27 » le dit déjà.
- Puis CAL-PLUS-QU-UN-AN (redit : « je peux toujours avoir que 1 ans ??? »). Les deux dans UN cycle PRÊT / EN LIGNE / preuve.

## Ajout 23.11 9:55 (pilote) — après le tour 18 (trait d'aujourd'hui en ligne, 00b081c1f, index-Do-2h6kK.js)
- « ‹ auj. » au bord quand aujourd'hui sort de la vue : GARDÉ (pilote, réversible ; répond à « où est le moment présent »).
- Ordre : (1) preuve en ligne du trait d'aujourd'hui à 1, 6, 40, 51 sem. ; (2) point bleu du creux retiré (CAL-POINT-BLEU-MUET) ;
  (3) plus d'un an (CAL-PLUS-QU-UN-AN) : patch et test gardés par l'agent précédent (an-auj-en-cours.patch,
  plus-qu-un-an.spec.ts.txt dans lot-cal) ; trouver pourquoi la barre ZZ MOYEN se pose au 21 déc. au lieu du 27 avec 5 ans
  (soupçon : la transformation date↔x de alignement.ts arrondit sur des colonnes plus larges, cf. arrondi du lâcher plus haut :
  plancher, colonne sous le doigt) ; (4) point 3 (D436) ; (5) « −1 663 » pousse « CHF à dépenser » sous ± à 14 sem., bouton de
  durée qui garde l'ancienne valeur pendant le tirage ; (6) lenteur mesurée en ligne ; (7) bandeau « Enregistrement… ».

## Ajout 23.11 9:50 — PRIORITÉ 0 : CAL-UN-SEUL-AXE (3e plainte), D441
- « Toujours un gros problème entrer l'axe du graph et l'axe du calendrier, 3 ème fois que je le dis... » (captures
  brasseur-23-11/10sem-0947.jpg, 3sem-0947.jpg). Cause visible : la bande suit la fenêtre de la COURBE (S44…S3), les rangées
  dessinent la fenêtre du CADRE étirée sur toute la largeur → « prête 29 déc. » tombe sous S1.
- D441 : une seule fenêtre et une seule transformation date → x pour courbe, bande et rangées (celle de la courbe) ; le cadre
  est une zone qui traverse courbe et rangées. Vérifier TOUT ce qui dépend de la largeur des colonnes des rangées (glisser,
  bord, lâcher, CAL-LACHER-OU-DESSINE, fiches) : les règles fast-check doivent passer sur la nouvelle géométrie.
- Test : CAL-UN-SEUL-AXE (DEFAUTS-RECURRENTS) rouge sur le tour 18 ; preuve en ligne par SES deux gestes (10 sem., 3 sem.).
- Leçon : un correctif d'un élément (la bande) se juge avec ce qui l'entoure (les rangées) : capture d'écran ENTIÈRE regardée.

## Ajout 23.11 9:53 — avec la PRIORITÉ 0 : CAL-GRILLE-SUR-GRADUATIONS
- « le découpage en section, c'est très bien et très pratique, mais du c'est pas corrélé à l'échelle ça donne aucune
  information ??? » (capture grille-0951.jpg : il a tiré chaque graduation vers le bas). Les lignes de colonnes des rangées
  = les graduations de la bande, même grain (jours / semaines / mois), même x. Même cycle que D441.
