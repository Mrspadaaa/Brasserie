# Brief : l'outil d'analyse, passe 2 (10.11)

Ses mots sur la passe 1 (page https://claude.ai/artifact/AxXZLiq11AEYqsVDTjHJN4), lus avec leur poids :
- **a1a « Le passé accroché » = la base** : « Ça c'est bien … Mais plus de couleur, d'analyse et aussi vue par source, et vue par budget
  et vue par filtre et période / Un peu comme La cascade du mois a1e ».
- **a1e « La cascade du mois »** : « Ça c'est pas mal aussi » — et cité comme modèle pour les vues (caisse du 1er → ventes → chaque dépense
  → caisse du 31, prévu en pointillé, 2025 en gris, la frise des mois pour choisir).
- **a1b « Les tuiles en outil »** : « C'est bien pour de la sélection et une vue d'ensemble. Mais c'est en plus. »
Ses mots d'origine : « voir si je respecte mes budget, voir l'évolution réelle en fonction de mes opérations quand ça monte quand ça descend …
sur des vrais chiffres. Et aussi pouvoir comparer d'année en année ».

Sources à ouvrir avant de dessiner : `p6/a1a/` (etat.html, captures, NOTE), `p6/a1e/`, `p6/a1b/`, `p6/RESULTAT-a.md` ; et `p4/p5b/`.

## Ce que chaque variante doit avoir (plancher à enrichir)
1. **L'escalier de a1a reste le cœur** (marches réelles, étiquettes accrochées, prévu en pointillé, hors budget en orange, 2025), mais
   **en couleur** : chaque marche teintée par sa source (les couleurs de catégorie de l'app : Ventes vert, Charges fixes violet, Brassage
   or, Nettoyage cyan, Matériel bleu, Autres gris ; Malt/Houblons/Emballage si utile), gagné et perdu lisibles d'un coup d'œil.
2. **Plus d'analyse**, sans cockpit : ce que la période dit en une phrase chiffrée (plus forte baisse, poste qui dérape, écart au prévu
   et à 2025), un « ✦ Pourquoi ? » (IA, sourcée, au toucher), les points saillants marqués sur la courbe.
3. **Trois vues de la même période**, par un sélecteur compact (segment) :
   - **par source** : d'où vient et où va l'argent — une cascade à la a1e (caisse au début → ventes → chaque source → caisse à la fin),
     ou l'escalier filtré/coloré par source ;
   - **par budget** : réel contre prévu par source (dépassement hachuré, encoche 2025), brassins prévu → réel ;
   - **par filtre et période** : choisir la période (mois, du … au …, année) et filtrer (sources, fournisseurs, brassin) ; l'escalier et les
     chiffres suivent.
4. **Les tuiles de a1b en plus** : pour choisir et voir l'ensemble (12 mois gagné/perdu, règle du budget au pied, 2025 au coin) — comme
   sélecteur de période ou en tête repliable, jamais à la place de l'escalier.
5. **D'année en année** : 2025 visible dans chaque vue (trait gris, encoche, ou superposition au toucher).
6. Où elle s'ouvre : depuis Synthèse (a1a) ; dis-le dans la NOTE.

Données : la même année d'exemple que la passe 1 (marquée « exemple ») ; plus l'état honnête sur SES données (solde 100,00 au 8 janv. à
confirmer, vente 5 695,00 le 10.11, achats ≥ 27,68 ×5, matériel 5 500,00 à part, trois projets de matériel non datés, aucune prévision,
2025 vide) : rien d'inventé, inconnu hachuré, jamais 0.

Obligatoire : `BRIEF-AUTEUR.md` § « Obligatoire » ; `BRIEF-PASSE2.md` § « Corrections transversales » ; maquettes **statiques** ; DESIGN.md
(densité compacte, deux régimes : le détail à un toucher) ; charge `boosters-ux` avec `impeccable` et `ui-design-system` (la passe 1 ne
les avait pas chargés : charge-les cette fois).

Rends 6 variantes `a2a`–`a2f` dans `p7/<id>/` (etat.html préfixé `a2x-`, NOTE.md court, captures `node scripts/agents/verifier-page.mjs
<etat.html> --captures p7/<id>/<id>` + 1280, ouvertes). Dans chaque etat.html, quatre figures : la vue d'ouverture, puis les trois vues
(source, budget, filtre et période), et l'état honnête. Toutes partent de a1a ; elles varient sur la manière d'amener les trois vues et la
couleur (2 sobres, 2 franches, 2 audacieuses). Puis `p7/RESULTAT-a2.md` (une ligne par variante). N'écris que dans `p7/`. Rien dans
`src/`, aucun commit, pas de `git stash`. Rends une ligne.
