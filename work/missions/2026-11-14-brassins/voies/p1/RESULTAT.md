OK — fiche câblée (e1a, e2a, e4c) : échelle, starter à cocher, FG, conditionner ; captures 390/1280 ouvertes ; 22 anciens tests périmés à adapter

## Fichiers écrits (3e passe)
- `src/ui/BatchDetailSheet.tsx` : points 1 à 6 de la reprise faits. `StageLadder` rendu (`ladder`) ; bandeaux de stock conditionnés par `stockShown` ; panneau « ⋯ » (Supprimer, NOLO masqué au repos) ; section Dossier sans le sélecteur « Étape du brassin » ni « Passer en… » pour planifié et post, panneau Étape + « Revenir à « Planifié » » pour annulé ; toast « FG x,xxx enregistrée · Annuler » (8 s) ; relevé enveloppé (`releveRef`, ouvre le repli « Corriger les mesures ») ; `YeastPreparationPanel` refait en carte e1a (en-tête Starter + pastille, lignes quand / quoi / case 24 px dans 44 px, 1re case = démarre la préparation, le reste dans le repli « Produit, inoculum, régularisation ») ; bouton « Étape » ajouté sur le Conditionné (seul chemin vers le retour en garde).
- `fiche/ui.tsx` (graduations aux bords calées, chevrons), `fiche/PlannedDate.tsx` (segment actif encre).
- `voies/p1/banc.mjs` (copie du banc a1, fixtures ZZ + plan de starter + fûts ZZ-F02/F03, scénarios e1a, e2a, e4c), `captures/` (54 PNG), `journal.json` (0 geste sans effet, 0 erreur console).

## Critères
- G1 : `TSC OK`.
- G2 : `port-p1` 6 verts.
- G3 : `CAPTURES OK` (e1a, e2a, e4c en 390 clair ; 390 cave et 1280 clair aussi, 54 fichiers). Ouvertes une fois en image : e1a repos et bas, e1a geste, e2a repos, e2a conditionné, e4c repos, e4c retour.
- G4 : `HORS OK`.
- Essais : 1 par critère.

Doute : le dernier rejeu complet du banc (date de conditionnement au format JJ.MM.AAAA) tournait encore à la fin ; sa ligne « BANC OK n captures » est dans `%TEMP%/p1banc.log`. Les 54 PNG viennent des passes précédentes, `e4c-retour` à rouvrir pour vérifier que « 2026- » a disparu.

## Écarts numérotés (maquette ↔ app), corrigés ou connus
Corrigés : (1) segment « Reporter » clair au lieu d'encre ; (2) graduations « 1,000 » et « di 22 » coupées au bord ; (3) flèches du geste date en − / + au lieu de ‹ ›.
Connus, non corrigés :
4. Budget : le bouton existant (`BrewBudgetButton`, hors Possède) s'écrit « Estimer le budget de ce brassin » sur 3 lignes dans la grille Budget / Compagnon / Étape. Il faut un prop `label` dans `finance/BrewBudgetDialog.tsx`.
5. Hachures de la maquette (jauge « ≈ L en cuve », « Abandonner le lot ») non reprises : aplat.
6. Sous-titre de fiche : « ID · style · volume » ; la maquette ajoute « F3 · levurée le 27.10 » (fermenteur absent du modèle ; date de levurage disponible, non posée).
7. Bande « garde 2 °C » du graphique et « stable 8 j » à trois relevés : consigne absente du modèle ; la stabilité est calculée sur les vrais relevés (la fixture n'en a pas assez).
8. e1a repos : le jour proposé « Lundi 16.11 » de la maquette n'est pas inventé (pas de règle de jour de brassage) ; l'app montre la date planifiée (09.11, 6 j de retard) et deux jours rapides au lieu de trois.
9. Le palet de l'échelle se touche, il ne se glisse pas ; « libère F3 » et « Brasser … dans F3 » omis.

## Tests existants périmés par la maquette (hors Possède, non touchés)
22 échecs, tous dus au changement de parcours voulu par e1a / e2a / e4c, pas à un défaut de logique : `tests/integration/batchAm4Am5.test.tsx` (7, sélecteur « Étape du brassin » et « Passer en… » remplacés par l'échelle), `batchFollowUp` (2), `batchPackagingVolume` (4, « Passer en « Conditionné » » remplacé par la saisie Conditionné de l'échelle), `batchStockFollowUp` (4), `yeastPitchingExecution` (5 : le starter vit dans l'onglet Préparer, ses détails dans un repli fermé). `batchDetail` et `batchSchedule` : verts.
Point 9 : pas de test de rendu ajouté (jsdom n'est pas chargé pour `tests/unit`) ; le rendu est prouvé par le banc.

DÉCISION À PRENDRE : adapter ces 22 tests d'intégration au nouveau parcours (ouvrir l'échelle, section Préparer, repli du starter) par une voie qui possède `tests/integration/` ; recommandation : oui, Sonnet, avant tout déploiement, car ils gardent la règle « stock suit le chemin existant ».
DÉCISION À PRENDRE : ajouter un prop `label` à `BrewBudgetButton` (écart 4) ; recommandation : oui, une ligne.
ACCORD (inchangés) : fermenteur, litres par fût, entrée en garde, consigne 2 °C, verdict du carnet : « — » ou omis, aucun champ neuf ; bande de FG visée = cible ± 0,002 (hypothèse de la maquette) ; « conditionner » écrit `packaging`, `volumePackagedL`, `bottlingDate` et passe les fûts en `plein`.
CONNAISSANCE : `bottlingDate` et les dates de brassage s'écrivent JJ.MM.AAAA ; une date ISO s'affiche « 2026- » dans la marche Conditionné.
LEÇON PROPOSÉE : un port qui remplace un sélecteur et un bouton doit lister dès le brief les tests d'intégration qui les cherchent, et nommer qui les adapte.
