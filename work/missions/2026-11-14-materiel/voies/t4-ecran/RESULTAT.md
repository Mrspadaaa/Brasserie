ECHEC — rejeté : 13 problèmes, 5 bloquants (fiche 390 non câblée : dépenses vides, toast sans Annuler, Payer sans effet ; lectures arrondies ; réglette de l'ajout absente)

Livrable : `work/missions/2026-11-14-materiel/critique/ECRAN-PORT.md` (table, P1–P13, doutes D1–D7, conforme, verdict A CORRIGER).
Tests : sans objet
Captures : 16 de l'app (d2a 7, d2b 8, journaux) et 7 de za3, toutes ouvertes ; 390 clair et cave, 1280 clair et cave.

- **port-za3** (Stocks › Matériel, d2a + d2b) — REJET : P1 à P5 bloquants (règle n° 1 / D105 : élément de sa maquette absent ou
  faux ; geste sans effet). Phrase prédite : « La liste c'est exactement ma maquette, mais sur le téléphone la fiche me dit que
  j'ai rien payé, arrondit mes mesures et je peux pas annuler. » Correction : props de `<EquipmentSheet>` dans StocksTab
  (transactions, batches, onChange → ecrireMateriel, onPayMaintenance, today) ; décimales ≥ 2 pour le pH ; réglette de l'ajout.
  Relance : voie d2b (P1–P4, P7, P9, P13) et d2a (P5, P6, P8, P10–P12), puis ce test d'écran.

DEMANDE EXECUTANT : (après correctifs) dans W, banc `?dev-local` comme d2b, préréglage pH-mètre (sans calibration de fixture) :
1. recapturer d2b-ph-390, ph-hors-390, ph-cave-390, ph-1280 ; attendu « +0,01 ✓ », « +0,02 ✓ », « 4,03 · 7,02 », « ±0,05 »,
   « 37,40 CHF · 2 prix connus » à 390 ;
2. jouer Étalonné à 390 puis capturer le toast (« Étalonné · à jour jusqu'au 15.12 · Annuler ») et l'effet d'Annuler ;
3. jouer « Payer un entretien » à 390 : capture de la Dépense ouverte ;
4. capturer filtre « À traiter » après un geste, ajout / vide / traiter en cave, 1280 après un geste ; ouvrir chaque capture.

LEÇON PROPOSÉE : un port qui a deux chemins d'ouverture (feuille 390, panneau 1280) câble les deux avec les mêmes props, et le
banc compare les deux largeurs champ par champ (ici dépenses et toast justes à 1280, absents à 390).
