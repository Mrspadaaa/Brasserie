# r3 — une section d'Annuel « Bilan et impôts » : la TVA brassin par brassin, une perle par dépense (chaude)

- **Chaleur** : chaude (forme libre : un collier de perles par brassin, un bloc noir « Non remboursée », une balance).
- **Axes** : place = une section d'Annuel (onglet Annuel, « Bilan et impôts », ‹ année ›) ; période = par brassin (sa
  ventilation naturelle, regard Brasseur) ; forme = liste à pastilles (une perle par dépense : couleur = taux, longueur = sa TVA,
  hachurée « ? » = inconnue) ; « si assujetti » = le net en balance « récupérée / facturée », hypothèses au toucher.
- **L'idée** : la TVA se lit là où il pense, au brassin : « #24 Stout : 22,72 CHF, 0,45 CHF/L », et chaque dépense est une perle
  colorée — ses mots, « les pastilles sur les items, ça rend la chose très clair ». Un toucher sur un brassin déroule ses factures.
- **Une question** (L10) : « Combien la TVA me coûte-t-elle, et est-ce que je la récupère ? » ; seul facteur libre : la période
  (le brassin dans l'année).

## Ce qui vient de la base
En-tête, onglets (Annuel actif), titre « Bilan et impôts » de l'app (`FinancesTab.tsx:156`), pas d'année, montants mono à
droite, chevrons, chips au bord de 1 px ; échelle EBC pour la pastille de couleur de chaque bière (son usage réservé : la
couleur d'un moût) ; tuile ① TVA de p3c-3 dans la feuille de la douteuse ; barre du bas et +.

## Honnêteté
Inconnue : perle hachurée « ? » sans longueur (aucune TVA inventée), brassin tout inconnu à « — » sans prix au litre ; « au
moins » ; total ocre souligné en 2025 (21 sur 27). Douteuse : perle cerclée de pointillés ocre, ligne ocre « choisie à la
saisie », feuille de p3c-3. Étranger : rangée « Étranger, à part », perle « DE 19 % » au trait, montant en EUR, hors total.
Balance : jamais un « récupérée » seul, le net en tête ; hypothèses (ventes enregistrées au taux normal, méthode effective, TDFN
sans récupération, inconnues non comptées) et AFC au toucher. Statut : le bloc « Non remboursée » mène au réglage.

## Boosters UX (boosters-ux)
- `brassin` — choisir la période ; rangée de brassin ; perles + somme + CHF/L ; déroule ses dépenses (r3-geste-brassin-23).
- `inconnues` — suivre ; chip hachuré ; ouvre le premier brassin qui a une inconnue (r3-geste-inconnues).
- `douteuse` — vérifier ; perle cerclée et ligne ocre ; feuille de p3c-3 (r3-geste-douteuse-ouverte).
- `etranger` — lire ; rangée à part (r3-etrangere-390).
- `si-balance` — comparer ; deux jauges sur la même échelle, net en tête ; hypothèses (r3-si-390).
- `annee`, `statut-reglage` — choisir l'année ; régler le statut.
- B1 OK · B2 OK (dominante « 171,83 CHF » et le bloc « Non ») · B3 OK (42 mots) · B4 OK (récap, brassins, balance) ·
  B5 s.o. · B6 OK · B7 OK (CONTRASTE OK, 5,63:1) · B8 OK (7 états) · B9 s.o. · B10 OK · B11 OK (« Je ne récupère pas ; au
  moins 171,83 CHF en 2026, à peu près 20 CHF et 0,33 CHF/L par brassin, 70 CHF hors brassin ; assujetti, je paierais 567 de
  plus ») · B12 OK (STANDARD OK) · B13 OK (rangées entières).
- Écart voulu : B3 — les rangées de brassin (sous-totaux de groupes de dépenses, perles comprises) sont marquées
  `data-mots="lignes"`, comme les groupes à sous-total de la Dépense (D238). Sans ce marquage : 78 mots ; avec : 42.

## Contrôles (sorties)
- controle-choix `--ecran=finances` : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (Finances hors `ecrans.json`).
- controle-commun : `COMMUN OK` du premier coup.
- mots-premier-ecran `--max=60 --sans-lignes` : 78 → ECHEC, puis 42 → `MOTS OK` (brassins marqués lignes, voir l'écart).
- controle-contraste : `CONTRASTE OK` (pire « Annuel » 5,63:1). verifier-page : `PAGE OK`.
