OK — 35 problèmes, 5 bloquants : gfc CORRIGER (2), e6a CORRIGER (1), e9na CORRIGER (2, dont 1 attend l'accord), e3gb et e6c CONFORMES.

- **gfc** (fiche fermentation) — CORRIGER : toast « Stock Citra −100 g / Annuler » illisible (pavé noir vide) ; bande « °C cuve » vide sans le dire. Phrase prédite : « Le toast est vide, et la cuve, elle est où ? » Corrections dans VERDICT.md.
- **e3gb** (carnet et Dossier) — CONFORME : 7 non bloquants (bloc « Brassé le » au-dessus des onglets, « Carnet à jour » trop tôt, pictos avant le nom…).
- **e6a** (liste des brassins) — CORRIGER : deux réglages de période à 1280, l'en-tête filtre encore la liste (geste « Toutes » sans effet). Correction : `batches={batches}` sur l'onglet Brassins, sélecteur de l'en-tête caché.
- **e6c** (feuille Filtrer) — CONFORME : 3 non bloquants (puces sur deux rangées, puces à 0 déplacées, phrase du vide).
- **e9na** (Atelier R&D) — CORRIGER : libellés IA de sa maquette remplacés (attend l'accord pour `rangerNote`, hors voie) ; pastille « Lager » en ambre au lieu du jaune pâle de sa maquette. Phrase prédite : « Une lager en ambre ? Et c'est plus l'IA qui range ? » Correction : teinte par style ; après accord, la tâche IA et ses libellés.

Tests : `voies/kq2/tests.txt` (G1 : VERDICT OK ; aucune suite Vitest).
Captures : toutes celles listées « Ouvertes » dans VERDICT.md ont été ouvertes, chacune une fois ; les non ouvertes sont nommées par maquette.

LEÇON PROPOSÉE : aucune
