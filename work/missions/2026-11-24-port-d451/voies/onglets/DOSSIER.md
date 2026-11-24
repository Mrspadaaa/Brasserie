# Dossier onglets (voie 7)

VERDICT § « Ce qui disparaît » n° 1 : « La double rangée d'onglets (Articles · Recompter · Courses · Fûts · Matériel, puis
Parc · À venir · Carnets · Réalisés). Elle devient une seule rangée, « Matériel ▾ · Parc · À venir · Carnets ·
Réalisés ». Le menu ▾ doit garder l'accès aux autres sous-onglets de Stocks. » Image : maquettes3/cap/v01-liste.png (haut
de l'écran) contre maquettes3/cap/actuel-liste.png.

Code : src/components/tabs/StocksTab.tsx — `tabs` (l. 531-537 : stock « Articles », recompter, courses, futs, materiel),
`SEGMENTS_MATERIEL` (l. 101 : parc, avenir, carnets, realises), rendu du segment l. 815-846, `onSubTabChange` (l. 316),
bouton d'action (l. 343), lecture de l'état gardé (l. 186) ; App.tsx l. 291 et 751 (`stocks_materiel`, `surCarnets`) en
lecture seule. D420 : Recompter est un sous-onglet.

Portée (L01, lecture étroite) : seulement quand Matériel est actif. Les autres sous-onglets gardent leur rangée. Rien
d'autre de Stocks ne change. Hors Carnet : si le registre `work/refonte-frontend/v4/choix/ecrans.json` porte un choix sur
cette rangée, `controle-choix.mjs` le dit ; un écart → ECHEC et `DÉCISION À PRENDRE`, rien n'est forcé.

Tests : aucun neuf obligatoire (UI) ; si une règle naît (quel sous-onglet le ▾ rend), elle va dans une fonction pure testée.
