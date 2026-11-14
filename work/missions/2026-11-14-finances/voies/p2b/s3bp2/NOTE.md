# s3bp2 — la phrase aux dates touchables (passe 2 de s3b, chaude)
**Idée** : la période se dit « du 1er au 15 nov. » ; chaque date est un mot qu'on touche. Repos = v6a + une puce « du _ au _ » (76 px), rien d'autre.
**Défauts du critique** : 1. phrase du repos (+30 px) → retirée, seule la puce dans la rangée du mois (354 px tenus, débord 0). 2. loyer disparu → ligne « hors plage » sous Charges fixes, 400,00 gris non mis à 0. 3. pilule grisée + « ↺ novembre » → la phrase prend la pilule, ‹ › font glisser la plage de 15 j (17 → 31 oct. · 16 → 30 nov.), un seul retour « × novembre ». 4. bornes de styles différents → même pastille bleue pour « 1er nov. » et « 15 nov. », l'active a seulement l'anneau de focus. 5. point noir du 9 → barrette aux couleurs des 5 catégories (comme la légende « payé »), 25 hachuré = à payer.
**Greffes** : aperçu de l'effet avant « Voir » (s1a : 5 opérations · à payer 0,00 · dépensé 296,80 · hors plage : loyer 400,00) ; ‹ › glissent (s1b) ; hors plage (s2a) ; points aux couleurs (s2b).
**Geste** : puce (1) → 1er (2) → 15 (3) → « Voir » 44 px (4). Calendrier façon react-day-picker, mode range ; dates aussi en `input type=date`.
**Après** : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; retard 60,00 à part ; IA « Pourquoi le brassage pèse autant ? ».
**À cheval** : ‹ du calendrier → octobre ; une part sans données dit « du 17 au 31 oct. · aucune opération saisie » (inconnu ≠ 0), non dessiné ici.
**Boosters** : `du-au`, `phrase-editable`, `calendrier-plage`, `apercu-effet`, `hors-plage`. Cibles : puce 28 px (zone 44), mots 24 px (zone 44), jours 38 px, « Voir » 44, « ✓ Payé » 24 inchangé.
**Images** : s3bp2-repos, -ouvert, -apres, -page (après, page entière : rangée IA, Par date, Filtres, Doublons, Apport, Archives vue).
**Ce qui casse** : le calendrier couvre les piles pendant le choix (l'aperçu en pied compense) ; « après » ajoute une rangée de 28 px (durée et ×).
