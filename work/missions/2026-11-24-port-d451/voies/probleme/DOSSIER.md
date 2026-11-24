# Dossier probleme (voie 4)

Base : maquettes3/src/v01.mjs (lis-le : 213 lignes, tout y est), écrans `vapeur` (Décidé), `fuite` (Je cherche), `resolu`,
`relecture`, `co2`, `malt` ; atomes communs : maquettes3/src/atomes.mjs (`jauge`, `ST` couleurs d'état, `tg` jetons,
`CAT` catégories, `ecranFil` : barre de titre avec chevron, titre, pastille de catégorie, ⋯).
Greffe 2 : maquettes3/src/v05.mjs l. 87-102 (paire avant / après en tête du Résolu ; « Résolus en 2026 · 5 · le dernier en
vert » en tuiles photo ; tuile sans photo = picto de sa catégorie). Greffe 3 : maquettes3/src/v03.mjs l. 83 (« Pourquoi B
plutôt que A ? Tes notes ne le disent pas. · Ajouter ») et l. 123 (« Toujours le bon choix ? · Oui · Pas sûr »).
Genres (greffe 1, en-tête seulement) : maquettes2/v01.html écrans `memo` (« mémo · fait le … », notes datées, « coût
380 CHF »), `recolte` (« récolte · au congélateur », 2,4 kg → 0,52 kg, 22 %), `idee` (« idée · vers S10 »), `probleme`
(« problème · provisoire ») ; le reste de ces écrans est le fil.

Écrans à rendre (VERDICT § 4, n° 3 à 6) :
- Je cherche : barre d'état (jauge 4 pastilles + 4 libellés, l'actif coloré) ; jetons « trouvé n · pas trouvé n · devis ·
  ≈ total » sur une rangée ; fil (jour en pastille, bulles à droite, bulle IA à gauche) ; carte « tâche proposée » À faire
  / Plus tard.
- Décidé : options en 2 colonnes (photo ou picto, nom entier, jeton d'état) ; fil avec bulle de veille ; « B retenu ·
  30 nov. · dans À venir » ; question honnête si `pourquoiDe` rend `null`.
- Résolu : avant / après (greffe 2) ; tampon « Résolu en N jours », « Fermé grâce à l'achat du … » ; options fermées avec
  leur raison ; « Rangé : Domaine › … » ; tuiles des résolus de l'année ; « ira dans Réalisés » (seulement si un plan lié),
  Rouvrir ; question honnête.
- Relecture : recherche ; fiche problème / essayé / pris / pourquoi (ses notes citées) / durée ; avant → après ;
  « Le fil ▸ » ; « Toujours le bon choix ? » ; autres résolus par catégorie.
- Champ « Ajouter à <court> … » ancré en bas (ChampCarnet de la voie liste, interface actuelle).

Règles d'affichage dans `filRegles.ts` (tests) : regroupement par jour et plages (« 21 – 22 nov. ») ; repli des anciens
(« ▴ 4 notes du 3 au 6 nov. ») ; total « ≈ » des coûts connus seulement ; question honnête affichée ssi aucune citation ;
« 2e fois » ; tuile sans photo → picto ; « ira dans Réalisés » ssi plan lié.

Disparaît : gabarit Critère / Articles « collez un lien » / Notes en cartes / Quand (ne paraissent que s'ils servent :
achat ou critère posé) ; « votre lien : « … » » (CarnetOuvert l. 145) ; crayon visible (l. 186) ; carte de note du
Planning (l. 122-125), devenue bulle du fil (projection de la voie domaine).
Gardé : barre de lecture d'un lien, Escalader, Relire, prix D447, menu ⋯ (Renommer, Supprimer, Déplacer).

Doutes du critique à surveiller (VERDICT § 3) : la jauge peut se lire « étape n sur m » (K4) : l'état reste écrit à côté.
