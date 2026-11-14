# s2bp2 — calendrier en feuille, passe 2 (tiède)
**Idée** : ▦ à côté du mois ouvre un calendrier à plage (react-day-picker `mode="range"`) ; la plage posée devient une pilule teintée qui garde ‹ ›.
**Repos** : v6a telle quelle + bouton ▦ 32 px (page entière, rangée du bas vue). **Feuille** : raccourcis « 1er – 15 · 16 – 30 · mois passé », toucher 1 puis 15, pied d'aperçu avant « Voir ». **Après** : « ‹ ▦ 1er → 15 nov. › | × ».
**Défauts du critique** :
1. ‹ › disparaissaient en plage → gardés dans la pilule de plage, ils la font glisser de 15 j (17 → 31 oct. · 16 → 30 nov., dans leur aria-label).
2. Feuille sans effet chiffré → pied « 15 jours · 5 opérations », « à payer 0,00 · dépensé 296,80 », « hors plage loyer du 25 · 400,00 » (greffe s1a).
3. Pilule noire trop lourde → bleu clair #E6EFF8, bord #A9C9E8, comme la plage de s1b ; « ✓ Payé » reste le plus foncé.
**Greffes** : raccourcis de durée (3, D262b) ; « 1er » ; IA qui suit la plage (« Pourquoi le brassage pèse autant ? »). Non posées : la loupe « 3-17 nov. » (chemin bis, à part), le bandeau à cheval (montré dans s2ap2).
**Montants** : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; loyer 400,00 gris « hors plage » sous Charges fixes, jamais 0 ; retard 2025 gardé.
**Boosters** : `calendrier-plage`, `raccourcis-plage`, `apercu-effet`, `pastille-plage` ; v6a : piles-basses, lignes-entieres, pastille-retard. B10 : 0 type=number.
**Ce qui casse** : la feuille cache encore les piles pendant le choix (le pied le compense) ; ‹ › restent à 28 px comme dans v6a.
