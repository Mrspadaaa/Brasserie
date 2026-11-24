# Dossier ecr7 — reste de E44-1 vu en ligne au tour 45 (voies/critique-45/RESULTAT.md, captures citées dans BUGS.md E45-1..3)

- Voie précédente : voies/ecr6/RESULTAT.md (règle unique datesDesOccurrences, src/domain/finance/forecast.ts ; indicationReference(genre)).
- E45-1 (m) : fin fausse d'une récurrente « à payer d'ici » dans l'aperçu et la carte de fin. Loyer Trim. : « 24.12 · 24.03 … 24.02.27 » (fin avant la 2e date) ; Salaire Mois 6 fois : « … 24.04.27 · 6 fois » alors que 6 mois depuis le 24.12 finissent le 24.05. La fin doit venir de la même règle que les dates (dernière occurrence de datesDesOccurrences), jamais d'un calcul à part depuis la date de saisie.
- E45-2 (m) : la liste HABITUELS de la saisie montre le Loyer « échéance le 24.02 » ; le Calendrier le met au 24.12 puis 24.03. La prochaine échéance des Habituels doit sortir de la même règle.
- E45-3 (D) : pour un Salaire, Référence propose « n° de facture », texte coupé dans Modifier. Un salaire n'est pas une facture : « Référence, facultatif » ; le texte tient sans coupure à 390 px.
- Rien ne change aux montants ni aux soldes ; aucune donnée réelle ; firestore.rules non touché.
