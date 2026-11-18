# r4 — la lentille TVA du journal : le récap en haut qui renvoie, la frise des mois, une pastille par dépense (chaude)

- **Chaleur** : chaude (forme libre ; place hors des trois du cadrage : l'onglet Opérations, mode « Journal / TVA »).
- **Axes** : place = Opérations (au-delà des axes : ses mots « un récap en haut comme sur le screen est top, avec la possibilité
  de clicker et avoir des revois » et « les pastilles sur les items ») ; période = l'année, mois par mois (frise de 12 colonnes,
  ‹ année ›) ; forme = liste à pastilles + récap à renvois ; « si assujetti » = aucun chiffre de TVA : ses ventes face au seuil
  de 100 000 CHF (fait, pas simulation), l'AFC et la fiduciaire.
- **L'idée** : la TVA n'est pas un écran de plus, c'est une lecture du journal qu'il connaît : chaque dépense porte sa pastille
  de taux et sa TVA ; le récap en haut (2,6 % · 8,1 % · ? 4) filtre le journal au toucher ; la frise des mois montre d'un coup
  d'œil quand la TVA est partie (mai, octobre) et choisit le mois.
- **Une question** (L10) : « Combien la TVA me coûte-t-elle, et est-ce que je la récupère ? » ; seul facteur libre : la période.

## Ce qui vient de la base
En-tête, onglets (Opérations actif), titre « Mes opérations », segment à deux modes (comme « Situation / Coûts »), pas d'année,
journal groupé par mois avec sous-total, montants mono à droite, récap bordé à chips de la Dépense p3c-3 (« Somme = imprimé »,
« 23 lignes ») transposé, tuile ① TVA de p3c-3 dans la feuille de la douteuse, barre du bas et +.

## Honnêteté
Inconnue : pastille hachurée « ? », TVA « — », case hachurée sur la colonne du mois, sous-total « ≥ » quand le mois a une
inconnue et « — » quand il n'a que des inconnues (corrigé : juin affichait 0,00) ; « au moins » et total ocre en 2025.
Douteuse : chip « 1 choisie à la saisie », ligne ocre soulignée, feuille de p3c-3. Étranger : chip « DE à part », ligne en EUR
« à part », hors total et hors frise. « Non remboursée » est un bouton vers le réglage. « Si assujetti » : aucun montant de TVA,
aucun curseur ; la jauge des ventes contre le seuil est une donnée enregistrée.

## Boosters UX (boosters-ux)
- `recap` / `renvoi-taux` / `inconnues` / `etranger` — lire et filtrer ; chips du récap ; le journal se réduit
  (r4-geste-renvoi-inconnues).
- `frise-mois` — choisir la période ; 12 colonnes empilées par taux, inconnu hachuré ; r4-geste-mois-octobre.
- `douteuse` — vérifier ; feuille de p3c-3 (r4-geste-douteuse-ouverte).
- `si-seuil` — déclencher ; jauge « 9 860,00 / 100 000 CHF », AFC, fiduciaire (r4-si-390).
- `lentille-tva`, `statut-reglage` — mode du journal ; réglage du statut.
- B1 OK · B2 OK (dominante « 171,83 CHF ») · B3 OK (44 mots ; journal marqué `data-mots="lignes"`) · B4 OK (récap, frise,
  journal) · B5 s.o. · B6 OK · B7 OK (pire 4,54:1, initiales des mois à venir) · B8 OK (7 états) · B9 s.o. · B10 OK ·
  B11 OK (« Je ne récupère pas ; au moins 171,83 CHF en 2026, surtout en mai et octobre ; 4 dépenses sans TVA lue ») ·
  B12 OK (STANDARD OK) · B13 OK (cases de mois 26 × 66 px à 390).
- Écart voulu : la place (Opérations) sort des trois axes du cadrage ; chaleur chaude, ses mots à l'appui.

## Contrôles (sorties)
- controle-choix `--ecran=finances` : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (Finances hors `ecrans.json`).
- controle-commun : `COMMUN OK` du premier coup. mots `--max=60 --sans-lignes` : 44 → `MOTS OK`.
- controle-contraste : `CONTRASTE OK` (pire « N » 4,54:1). verifier-page : `PAGE OK`.
