# r2 — la carte « TVA payée » de Synthèse s'ouvre en vue, par trimestre, barre empilée par taux (tiède)

- **Chaleur** : tiède (la forme de l'approche r : les rangées et chips de l'app, plus une barre et quatre colonnes).
- **Axes** : place = une carte de Synthèse qui ouvre la vue (geste `carte-synthese`) ; période = trimestre (T1…T4 et l'année,
  ‹ année ›) ; forme = barre empilée par taux ; « si assujetti » = le net « récupéré − facturé », hypothèses au toucher.
- **L'idée** : le sélecteur de période est lui-même un graphique — quatre colonnes de trimestre empilées par taux, l'inconnu
  posé dessus en case hachurée chiffrée — et, sous le total, la barre de ce qui a été dépensé par taux, où l'inconnu hachuré
  se voit à sa vraie taille (2025 : 80 % de la barre).
- **Une question** (L10) : « Combien la TVA me coûte-t-elle, et est-ce que je la récupère ? » ; seul facteur libre : la période.

## Ce qui vient de la base
En-tête, onglets (Synthèse active), rangées de « Situation financière » (Trésorerie, Règlements à suivre, « Tout voir ») où la
carte TVA prend place ; pilules de période de Prévisions (« 30 jours / 90 jours / 12 mois ») devenues colonnes ; montants en mono
à droite ; barre de composition des dépenses (même vocabulaire barre + pastilles, DESIGN.md « catégories financières ») ; tuile
① TVA de p3c-3 dans la feuille de la douteuse ; barre du bas et +.

## Honnêteté
Inconnu : case hachurée chiffrée sur chaque colonne, segment hachuré à sa part du TTC, tiret dans la colonne TVA, « au moins »,
total ocre souligné quand l'inconnu dépasse la moitié. Le net « si » n'existe qu'en différence, avec ses trois hypothèses et
« n dépenses à TVA inconnue non comptées » ; jamais un « récupéré » seul, aucun curseur. Étranger : segment rayé gris, rangée
« DE à part » en EUR, hors du total. Douteuse : chip « 1 choisie à la saisie » et tuile de p3c-3.

## Boosters UX (boosters-ux)
- `periode-trimestre` — choisir ; colonnes T1…T4 + Année ; empilées 2,6 % / 8,1 %, inconnu en case ; r2-geste-trimestre-t2.
- `barre-taux` — comparer ; barre empilée du TTC par taux ; chaque segment filtre la liste ; r2-geste-segment-inconnu.
- `filtre-taux` — comparer ; rangée de légende (dépenses, dépensé, TVA) ; filtre la liste.
- `inconnues`, `douteuse`, `etranger` — suivre ; chips et rangées ; filtre ou feuille (r2-geste-douteuse-ouverte).
- `si-net` — déclencher ; repli ; « +44,62 − 130,38 = −85,76 » et ses hypothèses (r2-si-390).
- `carte-tva`, `carte-retour` — naviguer ; la carte de Synthèse avec sa mini barre ; r2-geste-carte-synthese.
- `statut-reglage` — régler ; chip « Non assujetti › ».
- B1 OK (9 boosters, captures avant/après) · B2 OK (dominante « 44,62 CHF » ; aucune action primary) · B3 OK (60 mots) ·
  B4 OK (période, réponse, barre + légende, net, dépenses) · B5 s.o. · B6 OK (12/13-14/16/28) · B7 OK (CONTRASTE OK) ·
  B8 OK (7 états) · B9 s.o. · B10 OK (aucun champ) · B11 OK (« Au T4 2026, je ne récupère pas ; au moins 44,62 CHF de TVA,
  surtout du matériel à 8,1 % ; assujetti, je paierais 85,76 de plus ») · B12 OK (STANDARD OK) · B13 OK (cibles ≥ 24 px ;
  segments de barre de 6 px au moins, doublés par la rangée de légende).
- Écart voulu : B6, la barre compte le TTC dépensé, pas la TVA — seule façon de montrer l'inconnu à sa taille sans l'inventer.

## Contrôles (sorties)
- controle-choix `--ecran=finances` : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (Finances hors `ecrans.json`).
- controle-commun : `COMMUN OK` après un `STANDARD ECHEC S3, rayons hors échelle : 2px×13` (coins des colonnes) corrigé.
- mots-premier-ecran `--max=60 --sans-lignes` : 59 puis 60 avec l'en-tête « dépenses » → `MOTS OK`.
- controle-contraste : `CONTRASTE OK` (pire « Synthèse » 5,63:1). verifier-page : `PAGE OK`.
