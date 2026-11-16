OK — 36 problèmes, 4 bloquants

Version : d31751d8. Mode « Test d'écran », 55 captures ouvertes (39 × 390 clair, 7 × 390 cave, 7 × 1280 clair, 2 × 1280 cave).
Verdict, table et liste : `VERDICT.md` ; la section `## Pour les maquettes` (7 lignes) sert d'entrée aux concepteurs.

Bloquants : (1) « Ce mois » cache 3 brassins sur 5, dont une cuve en garde ; (5) J+n un jour de moins (J+4 au lieu de J+5) ;
(6) « 38,5 L conditionnés · 15.10.2026 » : la date est celle du brassage ; (7) Stout 5,8 % sur la carte, 5,9 % vol sur la fiche.

Doutes à lever avant les maquettes ou le port : formule de l'alcool (extrait réel 6,6 % contre 131,25 → 6,4 %) ; conditionnement
refusé « grain prévu à l'ébullition », sans doute dû aux fixtures a1 (`use: "mash"` n'est pas une valeur `FermentableUse`).

Tests : `tests.txt` (sorties des CHECK G1 et G2) ; aucune suite Vitest (rien dans `src/`).

LEÇON PROPOSÉE : une fixture de banc écrit les valeurs d'énumération du code (`empatage`, pas `mash`). Une valeur hors type déclenche
un garde-fou réel (« grain prévu à l'ébullition », conditionnement refusé) et se lit comme un défaut de l'écran. Contrôle : valider
`fixtures.json` contre les types avant la capture.
