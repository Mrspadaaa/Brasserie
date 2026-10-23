# Levure, étape de Dryhopper — Et avec quelle levure ?

Voie p4-dryhopper, 23.10. Fichiers : `index.tsx`, `levure.css` (classes `pq-lev-`), `jeu.mjs`.

## Base

L'étape de Dryhopper de la carte (`fils22-carte/levure-etape`, « Puis la levure »), enrichie de a2b (« voir ce que la
levure change reset vraiment interessant ») et de x3b réduit (« ma bière de base -> 1 dry hop, 2 dry hop: levure »).
Choix encore ouvert du brasseur : étape (ici) ou outil propre (a2b).

- Un seul facteur libre, la levure (D98) : US-05, Pomona, Verdant, Diamond. Houblon, dose, moment (le brouillon de
  Dryhopper) et base sont fixés sur la ligne de contexte.
- « Ajouter à ma bière » inscrit l'ajout (houblon, dose, moment, levure) et revient à Ma bière ; « ‹ » ou « Quand »
  revient à Dryhopper.

## Idées reprises

- Chaque tuile de levure dit déjà ce qu'elle change (Pomona ~+13 agrumes) ; « ? » hachuré quand le moteur n'a pas de
  taux pour elle (Verdant, Diamond : « non documenté », jamais 0).
- La biotransformation se voit (`data-role="biotransformation"`) : géraniol (floral) → citronellol (agrumes), la jauge
  de conversion bas–haut et son centre (Pomona ~50 %, convention H41/H50/H51), lue dans le moteur
  (`biotransfoLevure`).
- La confiance du moteur (moyenne, faible pour Pomona) avec ses raisons au survol.
- Les familles qui bougent, en barres l5b (rond : avec US-05 ; barre : avec la levure choisie).
- L'ajout cumulé, x3b réduit (`data-role="ajout"`) : Nugget seul (le résineux goûté le 18.10, vraie valeur), + Idaho 7,
  + la levure : floral, agrumes, résineux.
- « Après fermentation, rien ne change » (carte) quand le moment n'est pas le dry hop actif.

## Écarts

- Pas de tableau a2b complet (cuve, levure, CO₂ en trois colonnes) : la chaîne x3b le résume en une ligne par famille.
- Les deux pastilles d'étape (« Quand », « Levure ») sans numéro : 70 mots au plus.

## Pour l'app

- `index.tsx` → `src/ui/hops/HopTiming.tsx`, étape `step: 'yeast'`.
- `biotransfoLevure` est lu dans le moteur : l'adaptateur devrait l'exposer (besoin socle).
- La levure de la recette s'écrit avec l'ajout (Dexie puis Firestore) ; le catalogue des levures vient de l'app.
