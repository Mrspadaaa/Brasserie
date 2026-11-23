OK — 18 problèmes, 1 bloquant

# Critique de vision, tour 4 : Calendrier, Finances (Prévisions comprises), Bord

- Version : e8e9e77cb (tag en-ligne/2026-11-20-tour4), copie locale détachée, serveur de dev sur le port 3131.
- Données :
  - l'app avec `?dev-local&finance-demo`, données de démonstration en mémoire, réseau externe coupé, aucune écriture réelle ;
  - le banc `?preview=calendrier`, données simulées : dans l'app de démonstration, le calendrier n'a aucun brassin daté, donc les gestes sur les barres se jouent sur le banc.
- Tailles et thèmes : 390×844 tactile, 844×340 tactile, 1280×900 ; clair et cave.
- Captures : `work/missions/2026-11-20-critique-tour4/a-cap/` (`<thème>-<largeur>-<état>.png`).
  - Planches ouvertes : `a-cap/planches/`.
  - Journal : `a-cap/journal.json` et `journalreprise.json`.
- États joués :
  - Bord : repos, Échéances, Ouvrir les finances, Cette semaine au calendrier, Pilsner, Gérer ;
  - Finances, Synthèse : repos, toucher une barre, Pourquoi ?, Autre période, Payer ;
  - Finances, Opérations : repos, une fiche, filtre par barre, Payer, En retard ;
  - Finances, Prévisions : repos, fiche d'un achat, Avec ou Sans, 12 mois ;
  - Finances, Annuel : repos, Mois par mois ;
  - Calendrier : repos, menu de période, jalon touché, + Ventes, courbe cachée, Maintenant ;
  - banc du Calendrier : fiche d'un brassin, glisser pendant et après, Liste, Plein écran.
- Règle n° 1 : aucun de ces trois écrans n'est au registre `choix/ecrans.json`. L'acquis « frise des opérations » (19.11) est présent (f2, f6) : barre touchée, Opérations filtré, frise de 30 jours.

## Combien et quels problèmes ?

1. **BLOQUANT : valeur fausse.** Prévisions, fiche « Fermenteur supplémentaire, 750,00 CHF » : la case « Pour rester à zéro » affiche « Tu restes au-dessus de zéro ».
   - La même fiche dit dans Limites : « aucun mois ne tient le seuil de 0,00 CHF d'ici fin nov. 2027 ».
   - La vue 12 mois montre « −1 492,66, sous zéro 25.07 ».
   - Le brasseur décide un achat sur une conclusion que la même feuille contredit.
   - Captures : `clair-390-f12-previsions-fermenteur.png`, `clair-1280-f12-…`, `clair-390-f14-previsions-12-mois.png`.
2. Opérations : sur une facture non payée (« à payer · 25 nov. · dans 5 j »), le bouton noir porte « ✓ Payé ». On lit « déjà payé ». Même chose sur « Solde atelier », en retard. Non bloquant.
   - Captures : `clair-390-f6-operations-repos.png`, `clair-844-f10-operations-en-retard.png`.
3. Synthèse : « Payer » touché sur « Solde atelier 60,00 » ouvre « Payer l'Atelier » à 460,00. Non bloquant.
   - Le loyer, pas encore dû (25 nov.), y est coché d'office.
   - Les deux lignes affichent déjà « ✓ soldé » avant le paiement.
   - Capture : `clair-390-f5-synthese-payer.png`.
4. Les deux « Payer » ne font pas la même chose. Celui de la Synthèse ouvre une feuille. Celui d'Opérations paie d'un seul toucher (« Payé 400,00 · Annuler · Autre montant »). Non bloquant.
   - Captures : `clair-390-f5-…`, `clair-390-f9-operations-payer-loyer.png`.
5. Bord › Finances dit « Charges 725,40 CHF » ; Finances › Synthèse dit « Dépensé 696,80 », matériel 28,60 « à part ». Deux chiffres pour le même mois, sans dire pourquoi. Non bloquant.
   - Captures : `clair-390-b1-bord-repos.png`, `clair-390-f1-synthese-repos.png`.
6. Bord › Stocks : « Pilsner · Stock 3 / seuil 2 kg · À compléter +3 kg ». L'article est au-dessus du seuil mais à commander, sans dire que c'est pour un brassin prévu (Stocks dit « manque 3 kg »). Non bloquant.
   - Captures : `clair-390-b1-…`, `clair-390-b5-bord-pilsner.png`.
7. Prévisions à 390, cartes « Avec / Sans Fermenteur supplémentaire » : le texte va mot par mot en colonne, et « supplémentair / e » est coupé au milieu du mot. Non bloquant.
   - Captures : `clair-390-f11-previsions-repos.png`, `clair-390-f13-previsions-sans-fermenteur.png`.
8. Courbe des Prévisions à 390 : des étiquettes sont tronquées (« Fermenteur su… », « sans Fermenteur supplé… 2 857,34 »), et un pointillé traverse « sans Fermenteur ». Non bloquant.
   - Captures : `clair-390-f11-…`, `cave-390-f11-…`.
9. Prévisions 12 mois à 390 : le bas de la page (« Entrées : aucune · 14 sorties · Limites (1) ») et le bouton rouge « Vente » sont sous le + volant et la pastille du compagnon. Non bloquant.
   - Capture : `clair-390-f14-previsions-12-mois.png`.
10. Annuel › Mois par mois : les en-têtes « Résultat · Entré · Dépensé » sont posés au-dessus d'une grille de 4 mois (janv., févr., mars, avr.). Les colonnes ne correspondent pas aux titres, et seul le résultat est montré. Non bloquant.
    - Captures : `clair-390-f16-annuel-mois.png`, `clair-844-f16-…`.
11. Fiche de prévision : le bloc « Limites (3) » met environ 80 mots au premier plan (« énormément d'information pour rien »). Non bloquant.
    - Capture : `clair-390-f12-…`.
12. Calendrier : toucher un jalon de Papiers (Loyer de l'atelier) quitte le Calendrier. La fiche s'ouvre sur Finances › Opérations ; la fermer laisse sur Finances, pas sur la frise. Non bloquant.
    - Captures : `clair-390-c3b-cal-loyer-toucher.png`, `clair-844-c3b-…`.
13. Calendrier › « Maintenant : 1 en retard » : « échéance le 20 déc. · 60 CHF », sans l'année. C'est le 20 déc. 2025, mais on le lit comme une échéance à venir. Non bloquant.
    - Captures : `clair-390-c6-cal-maintenant.png`, `clair-844-c6-…`.
14. Fiche d'un brassin à 390 (Saison de ferme) : la ligne « pas brassée · brassage prévu / le 10 nov. · / prête / le 18 déc. / au plus tôt » est cassée en quatre colonnes déchirées, mal lisible. À 1280, elle tient sur une ligne. Non bloquant.
    - Capture : `clair-390-k2b-banc-saison-toucher.png`.
15. Menu de période à 844×340 : la pastille « 3 mois » choisie mord sur « 6 mois » (textes collés, coupés). Non bloquant.
    - Capture : `clair-844-c2b-cal-menu-toucher.png`.
16. Calendrier à 844×340, en 3 mois : dans Papiers, le cadre pointillé d'une prévision et l'étiquette « Loyer de l'atelier −400 » se superposent sur la même ligne. « Solde atelier · ancienne année −60 » est coupé au bas. Non bloquant.
    - Captures : `clair-844-c2-cal-menu-periode.png`, `clair-844-c2b-…`.
17. La pastille « Compagnon hors connexion · mode local » est posée sur le contenu. Hors connexion, c'est le cas réel à la brasserie. Non bloquant.
    - À 390, elle couvre « Fournisseurs, matériel », « Contrôle métrologique » et « Joints de la cuve ».
    - À 844×340, elle est au milieu de l'écran : sur la barre « Charges fixes », sur « Ingrédients » et sur les Papiers.
    - Captures : `clair-390-f1-…`, `clair-390-b2-…`, `clair-844-b3-…`, `clair-844-b5-…`.
18. Banc du Calendrier à 390 en cave : la page déborde à l'horizontale (largeur de défilement > 390) au repos, pendant le glisser et dans la Liste. En clair, seulement pendant le glisser. Non bloquant.
    - Source : `journal.json`.
    - Captures : `cave-390-k1-banc-repos.png`, `cave-390-k3-…`, `cave-390-k6-banc-liste.png`.

## Doutes (non comptés)

- « Toucher » Loyer et « toucher » Saison de ferme : avec `element.click()`, rien ne s'ouvrait (c3, k2). Avec un vrai toucher ou un vrai clic, la fiche s'ouvre dans les 6 configurations (c3b, k2b). C'est un artefact du banc, pas un geste sans effet.
- 844×340 : après le toucher du menu de la frise, la pastille de période de l'en-tête affiche « Tout » alors que la frise est en 3 mois (`clair-844-c2b-…`). Je n'ai pas vérifié si mon toucher a d'abord touché l'en-tête.
- « −1 493 CHF à dépenser · S43 ’27 » : un montant « à dépenser » négatif se lit mal. La Prévision dit « sous zéro 25.07 », et non « S43 ». Ce sont peut-être deux questions différentes (le point le plus bas, le premier passage sous zéro).
- Fiche Fermenteur : « Mon litre · à compléter · aucun brassin planifié », alors que la démonstration a deux brassins « planifiés » sans date.
- Synthèse : l'étiquette « Brassage 186,80 » est grise sur l'or, avec un contraste faible dans les deux thèmes.
- Le glisser se joue à la souris, même en tactile. Le geste du doigt n'est pas éprouvé ici.

## Ce qui tient

- La barre touchée dans la Synthèse filtre Opérations sur la bonne catégorie et la bonne période. La plainte du 19.11 est réglée (f2, f8).
- Glisser un brassin : « S49 · 30 nov. · lâcher ici » pendant le geste ; après, le conflit « 3 fûts promis à La Cigogne le 23 déc. · prête le 28 déc. › Livrer le 29 déc. · Annuler » (k3, k4, 1280).
- Les fiches d'opération ont une confirmation du paiement et une case « Sans justificatif, c'est normal » (c3b).
- Les thèmes clair et cave sont cohérents, sans texte illisible repéré en cave.
