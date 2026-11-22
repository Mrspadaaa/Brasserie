# z3 — la carte TVA de Synthèse ouvre la gaufre : une case = 2 CHF, un rang par mois (v0 TVA, série z, 01.11)

**Chaleur : chaude.** Forme libre : la TVA se compte en cases, comme des pièces. Une case = 2 CHF de TVA, verte à 2,6 %, bleue à
8,1 % ; chaque facture sans TVA lue est une case hachurée « ? », qui n'a pas de montant et le dit. Dans Synthèse, une carte « TVA
payée · 2026 » montre la gaufre de l'année en un bloc (`?etat=carte`) ; la toucher ouvre la vue : un rang de cases par mois, les
mois lourds ouverts d'office sur leurs factures, les mois vides en tirets. Une seule idée : voir la TVA, pas la lire.

**Axes** : place = une carte de Synthèse qui ouvre la vue ; période = année (‹ 2026 ›), lue mois par mois ; « si assujetti » =
aucun chiffre, un pli sous « Remboursée : 0,00 » avec l'AFC, la fiduciaire et le réglage ; forme = gaufre (hors des trois formes
du brief : forme libre de la chaleur chaude).

**Honnêteté** : la case « ? » n'a pas de longueur ; un mois dont toute la TVA est inconnue affiche « ? », jamais 0 ; à 14 inconnues
la réponse se dit « total partiel ». La douteuse est une case en pointillé « choisie ». L'allemande n'a pas de case : une ligne
violette « DE 19 % · 228,00 · hors des cases · hors CH ». Statut : chip à interrupteur « Non assujetti · réglage ». L'unité de la
case est écrite une fois (« ■ = 2 CHF »), à droite du statut.

**Ce qui vient de la base** : la coquille, et dans l'état `carte` les rangées de Synthèse telles quelles (Trésorerie, Pour une
situation fiable, Règlements à suivre, Origine et limites, Comprendre mes dépenses), la carte posée après Trésorerie.

## Boosters UX (boosters-ux)
- Boosters : `carte-tva` — déclencher ; la carte entière ouvre la vue. `periode` — ajuster ; stepper ‹ 2026 ›. `statut` — lire,
  déclencher ; chip à interrupteur. `chip-taux` — comparer, suivre ; chips par taux qui filtrent les cases (les autres s'effacent).
  `mois` — choisir ; un rang pressé ouvre ses factures. `si-assujetti` — déclencher ; pli AFC / fiduciaire.
- B1 OK (6 boosters ; un chip éteint les cases des autres taux, un rang ouvre ses factures) · B2 OK (le 160,19 ; un primary dans le
  vide) · B3 OK (49 mots hors lignes ; les rangs de mois sont marqués `data-mots="lignes"` : ce sont les lignes de dépenses,
  groupées par mois) · B4 OK · B5 OK · B6 : 12 / 14 / 28 (+ 16 et 18 de la coquille) · B7 OK (pire « avr. » 4,94:1) · B8 OK (sept
  états, plus `carte`) · B9 OK (fond du rang pressé) · B10 s.o. · B11 : « 80 cases, 160 CHF, surtout en avril-mai, trois « ? » » ·
  B12 OK · B13 OK (rangs de 28 px, cases non interactives).
- Écarts voulus : cases et jetons à angles droits (rayon 0) ; légende d'unité d'un seul mot-signe (« ■ = 2 CHF ») au repos, sans
  elle la case n'a pas de valeur.

## Contrôles (sorties)
PAGE OK · COMMUN OK · MOTS OK (49) · CONTRASTE OK (74 textes, pire 4,94:1) · CHOIX OK (0 ; Finances sans entrée). Correctifs : le
total à 28 px (spécificité CSS), colonne de valeur élargie pour « +1? », carte en `div role=button` (un bouton dans un bouton
cassait la carte), mois lourds ouverts d'office, cases 14 px.
