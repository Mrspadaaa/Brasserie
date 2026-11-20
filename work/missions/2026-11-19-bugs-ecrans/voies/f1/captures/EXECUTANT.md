# Captures f1, tour 2 (k2, 20.11) — lues par l'auteur

Lancement : `node scripts/with_server.mjs --server "npx vite --port 3108 --strictPort" --port 3108 --timeout 120 -- node work/missions/2026-11-19-bugs-ecrans/voies/f1/banc/capturer.mjs` (390-clair relancé seul : premier passage dépassé le délai de 240 s à froid). Sorties : `sortie-k2.txt`, `sortie-k2-390clair.txt`. 0 erreur de console.

## Preuve 1 — onglet Simuler (T3B-6)
- « Détail des ajouts et IBU » ne contient PAS l'onglet : il ouvre le panneau d'IBU par ajout (HopBitternessPanel). L'atelier à onglets Bilan / Simuler / Goût-levure vit dans « Potentiel aromatique » : le banc ouvre d'abord « Détail », ne trouve pas l'onglet, puis ouvre « Potentiel aromatique ».
- Onglet trouvé (rôle tab, nom exact « Simuler ») : **true** aux 4 combinaisons (390 clair, 390 cave, 1280 clair, 1280 cave).
- « durée d'ébullition » : **absente** aux 4.
- Texte de « Viser des IBU » : « Viser des IBU / Déplacer un ajout / Remplacer un houblon / Dose à cru — Ajout : Nouvel ajout, 1. Target · Ébullition, 2. East Kent Goldings · Ébullition — Alpha du lot à simuler 11,3 % — Minutes avant la fin 60 min — Cible totale à chaud (vide) IBU — Repères : 20 IBU 30 IBU 40 IBU — Réinitialiser — Simulation locale. Pour conserver un changement, ouvre la modification de recette. » Ouvertes : fiche-390-cave-simuler, fiche-1280-clair-simuler (minutes avant la fin = 60, message « Saisis la cible totale d'IBU à chaud. »).

## Largeurs (n° 15)
390 : colonne 374 px, barre 374 px, même x (8). 1280 : colonne 540 px (x 370), barre 540 px (x 370) : alignées (avant : barre sur toute la page, max-w-3xl).

## Ouvertes après correctif
fiche-390-clair-4 et fiche-1280-cave-3 : Ébullition « 60′ » sans phrase redite ; Fermentation sans sous-titre ni pastilles redites (Primaire 18 °C 10 j, Garde 4 °C 7 j) ; Déroulé finit sur « Puis concasser : 1 mm. » ; Brassins : LOT-001 « 1,062 » ; Additifs Lactose 300 g et Whirlfloc 1 g.
