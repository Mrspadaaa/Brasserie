# u1 — La carte « Rénovation » en tête du Bord

- **Chaleur** : froide (la plus sage). Rien de neuf dans l'app sinon une carte teintée de plus sur le Bord.
- **Idée en une phrase** : la rénovation devient une carte du Bord, posée en tête : « Ensuite » (le prochain geste, un
  bouton « Fait »), puis ses projets par horizon, chacun avec ses trous en pastilles pointillées (« prix ? », « date ? »,
  « pose ? ») ou son budget chiffré, et un champ « Ce qui te manque… » pour noter en une ligne.
- **Axes** : lieu = le Bord ; représentation du manque = pastilles « ? » ; prochain geste = un bandeau noir unique ;
  avancement = quatre crans (Idée, À étudier, Devis en cours, Prêt à acheter) ; ouverture = dépliage sur place.
- **Ce qui vient de la base** : en-tête et barre du bas tels quels ; cartes teintées du Bord (Brassins, Stocks, Finances,
  Agenda) ; les horizons Bientôt / Ensuite / Plus tard, les étapes et le budget achat + livraison + installation de
  `UpgradeWorkspace` / `upgrades.ts` ; « Noter l'achat » ; « À estimer » devenu « prix ? ». Plancher enrichi : le
  prochain geste, les trous visibles d'un coup d'œil, la saisie en une ligne sans feuille.
- **Honnêteté** : un montant n'apparaît que s'il est saisi (fictif) ; un prix ou une date absents restent un trou, jamais
  une estimation. La trésorerie (état `caisse`) est celle renseignée dans Finances ; « 2 sans prix » reste hors du calcul.
- **Boosters cochés** : pastille (trous), crans d'avancement, jauge segmentée (caisse), dépliage sur place, édition en
  ligne (Noter + horizon segmenté), état hors ligne avec « à envoyer », vide qui invite.
- **États** (`?etat=`) : jour1 (rien de noté, champ seul), encours (défaut), ajout (champ rempli, horizon), ouvert (hotte
  dépliée : achat, livraison, pose de Sophie 6 h), depasse (hotte facturée 3 980 sur 3 610 prévus, +370 en rouge),
  caisse (au compte 6 200, à payer 4 450, reste 1 750), fini (5 sur 5, 6 590 facturés, 18 h notées), horsligne.
- **Données** : fictives (ses cinq titres ; Sophie, Marc ; montants et heures inventés).
- **Écart de baseline** : la carte Finances du Bord est repliée (« Ce mois › ») pour laisser la place ; aucune valeur
  inventée.
