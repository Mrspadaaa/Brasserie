# s3c — la loupe comprend une période
**Idée** : la recherche de v6a lit une période tapée (« 3-17 nov. », « 15.10–10.11 », « semaine 45 ») et la pose en pastille de filtre ; une puce « du … au » à côté du mois pour qui ne tape pas.
**Chaleur** : chaude. Base v6a telle quelle ; au repos seule la puce pointillée « du … au » (28 px) s'ajoute dans la rangée du mois.
**Geste au doigt** : loupe → « 3-17 nov. » → première suggestion « Période : du mar. 3 au mar. 17 nov. » avec sa frise de 30 jours (plage en bleu, le 9 et le 25 marqués) → « Poser ». Image `s3c-ouvert.png`.
**Après** : pastille « 3 → 17 nov. × » sous le mois (pilule grisée), « 5 opérations · 1 après le 17 » ; × revient au mois. Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80.
**Boosters** : `recherche-periode` (saisie libre comprise), frise d'aperçu, `pastille-periode` (filtre visible, ×), `du-au` (puce).
**Cibles** : puce 28 px (zone 44 px), × 26 px ; « ✓ Payé » 24 px inchangé.
**Ce qui casse** : rangée du mois pleine (pilule + puce + retard = 354 px sur 354) ; à 360 px de large la puce doit passer en icône seule. L'analyse de dates tapées est un vrai chantier (formats suisses, années) : à bâtir sur une bibliothèque (chrono-node ou équivalent), pas à la main.
