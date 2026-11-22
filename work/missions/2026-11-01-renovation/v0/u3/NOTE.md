# u3 — La frise des mois, et le bac « sans mois »

- **Chaleur** : chaude (forme libre : la rénovation se planifie sur le calendrier, pas dans une liste).
- **Idée en une phrase** : une page « Rénovation » (depuis le Bord) où chaque projet est posé sur le mois où il sera
  payé, le long d'un rail noir qui part d'aujourd'hui ; ce qui n'a pas encore de mois attend dans un bac pointillé, en
  jetons à glisser sur la frise.
- **Axes** : planification = rail vertical des mois ; manque = le bac (chaque jeton dit son trou : « mois ? »,
  « prix ? ») ; prédiction = en état `caisse`, le solde « après » chaque mois, en piste ; vue d'ensemble = une ligne de
  résumé (CHF chiffrés, heures de toi, nombre sans mois) ; ouvrir = déplier le bloc sur la frise ; noter = une feuille
  (rayon 24 px) avec le choix du mois en pastilles, « sans mois » par défaut.
- **Ce qui vient de la base** : en-tête, barre du bas (Bord actif), retour « ‹ Bord » ; le mois de paiement prévu
  (`datePrecision: month`) et « Date à choisir » de `UpgradeWorkspace` deviennent la frise et le bac ; étapes, budget
  achat + livraison + pose ; « Inclure dans les prévisions » devient « poser sur un mois ». Enrichi : les heures notées
  (artisan, toi) sur chaque bloc et en résumé, pour un brasseur qui a peu de temps.
- **Honnêteté** : les mois viennent du calendrier (aujourd'hui : novembre 2026) ; un projet n'est posé que si son mois
  est saisi ; le solde « après » ne compte que les projets chiffrés et datés, et le dit en bas (« Pas compté : évier
  (sans mois), armoire et site (sans prix) ») ; aucune couleur d'alerte sur un solde, l'app n'a pas de seuil.
- **Écart de baseline** : couleurs propres aux cinq projets (sarcelle, bleu, prune, ambre, indigo), hors des repères de
  rubrique, pour suivre un projet du bac à la frise. Raison : sur une frise, la couleur est l'identité du projet.
- **Boosters cochés** : frise (rail, point d'aujourd'hui), jetons glissables, piste de solde, dépliage sur place,
  pastilles de mois, feuille de saisie, hors ligne (jeton pointillé « à envoyer »), vide qui invite.
- **États** : jour1, encours (défaut), ajout (feuille), ouvert (hotte dépliée ; l'évier glissé sur décembre), depasse
  (décembre : hotte 3 980, prévu 3 610), caisse (6 200 → 2 590 → 2 130), fini (cinq blocs cochés, 6 590 facturés,
  18 h), horsligne.
- **Données** : fictives (ses cinq titres ; Sophie, Marc, Luca ; montants et heures inventés).
