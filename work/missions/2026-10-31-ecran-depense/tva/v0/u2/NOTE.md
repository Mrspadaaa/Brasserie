# u2 — La frise des mois (tiède)

- **Chaleur** : tiède. La forme de mon approche (réponse chiffrée + représentation qui la porte), dans un onglet existant.
- **Idée en une phrase** : dans Annuel « Bilan et impôts », un segment « TVA » ; douze colonnes, une par mois, empilées par
  taux (2,6 % or, 8,1 % bleu) ; un toucher sur un mois ouvre ses factures ; l'interrupteur « Si j'étais assujetti » retourne
  la frise : la TVA des ventes pousse sous l'axe, mois par mois.
- **Axes** : place (Annuel, l'année fiscale) ; temps (mois, pas postes) ; incertitude dessinée (chapeau hachuré « ? » sur le
  mois concerné, contour ambre « ! » pour le doute) ; remboursement en frise divergente au lieu d'une feuille.
- **Repris de la base** : en-tête, onglets, titre « Bilan et impôts » (titre réel de la vue `annual`), exercice réglable,
  rangée Compagnon brasseur, barre du bas et +. Mono pour montants et dates.
- **Données (fixtures)** : mêmes que u1, réparties par mois (somme 869,89 ; or 124,48, bleu 745,41) ; mars 312,43 =
  Inox-Pro 286,23 + Malterie 15,71 + Vetropack 10,49. Ventes mensuelles de 31 240,00 ; TVA comprise 2 340,83.
- **États** : `annee` ; `inconnues` (« 776,98 + ? », chapeaux hachurés en mai et juil.–oct., lignes « ≤ 52,45 ») ;
  `douteuse` (juin hachuré ambre, choix sur la ligne Vetropack) ; `etrangere` (repères DE / CH sous l'axe, EUR à part) ;
  `vide` (douze emplacements en pointillé, 2025 en rappel) ; `si` (frise divergente, récupéré / à verser / coût) ;
  `horsligne` (bandeau, octobre coiffé « ? », « 869,89 + ? »).
- **Boosters** : [x] frise mensuelle empilée, touchable [x] pastilles de taux (légende = valeurs) [x] interrupteur de
  scénario [x] frise divergente [x] hachures d'incertitude [x] choix sur place pour le doute [x] axe en trimestres (peu
  de mots) [ ] curseur.
- **Écart à la baseline** : aucun ; le segment « Bilan · TVA » est un ajout dans la rangée titre existante d'Annuel.
