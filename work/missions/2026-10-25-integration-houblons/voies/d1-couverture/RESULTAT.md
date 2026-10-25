OK — Couverture mesurée : 18 champs sur 318 variétés, script et rapport écrits.

Fichiers écrits :
- work/missions/2026-10-25-integration-houblons/voies/d1-couverture/couverture.mjs
- work/missions/2026-10-25-integration-houblons/voies/d1-couverture/couverture.md
- work/missions/2026-10-25-integration-houblons/voies/d1-couverture/RESULTAT.md

Critères (sorties décisives) :
- Lancement `node work/missions/2026-10-25-integration-houblons/voies/d1-couverture/couverture.mjs` : exit 0 ; « Contrôles : OK » (présent + absent = 318 pour chacun des 18 champs).
- Cohérence des totaux : 318 par champ (ligne « OK : chaque champ couvre exactement 318 variétés »).
- Familles du moteur : 297 variétés avec au moins une famille, 21 « inconnue ». Recoupé avec hopDescriptorEvidence du moteur (bundle esbuild hors dépôt) : 297 et les 12 totaux par famille identiques.
- Trois chiffres : cohumulone 0/318 (absent partout) ; géraniol 3/318 (0,9 %, composes seulement) ; oils.farnesene 4/318 (1,3 %, composes seulement). `substituts` : 0/318, aucun champ stocké (calculé à l'exécution).
- Phares : 12 fiches (Saaz en trois : CZ, Late, US), de 2 à 6 champs manquants chacune.

Essais utilisés : 2 sur la mise en forme (une virgule parasite, un `else` dupliqué, corrigés) ; aucun critère rouge sur le calcul.

Ce qui reste douteux :
- VOIE.md et GATES.md de la voie n'existent pas dans le dossier : la voie a été exécutée sur le brief du message. Je n'en ai rien écrit.
- « Saaz » n'est pas une fiche unique : j'ai listé les trois (CZ, Late, US).
- linalol : `hsLinalool` (% de l'huile, Hopsteiner) et `composes` (autre unité) sont comptés présents sur les deux, sans valeur croisée.
- Valeurs `composes` : relevés H/S (hypothèses ou secondaires) ; leur présence n'est pas une mesure vérifiée.
- « sources » = provenances valides distinctes (auteur + titre) ; 17 variétés sans aucune fiche.
- Les 20 plus incomplets sont surtout des variétés sans données de composés ni de fiches (Feux-Coeur Francais, Saugatuck…) : le classement suit le nombre de champs, pas leur importance.
- Aucune écriture dans src/ ; dépôt inchangé hors ce dossier.

CONNAISSANCE : Données houblons (25.10) : cohumulone absent du catalogue (0/318), géraniol 3/318 et farnésène 4/318 seulement dans composes-houblon.json (8 fiches), substituts non stockés.
LEÇON PROPOSÉE : Une voie lancée sans VOIE.md ni GATES.md dans son dossier. Cause : le contrat n'a pas été écrit avant le lancement. Règle : vérifier l'existence de VOIE.md et GATES.md avant d'activer un exécutant, sinon rendre ECHEC.
