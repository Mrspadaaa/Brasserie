# Exécution DEMANDE EXECUTANT — voie w1 (2026-11-20)

## Étapes
- Étape 1 (capture) : `captures-journal.txt` finit par « Commande terminée, code 143 » : rien relancé.
- Étape 2 (tests) : `npx vitest run …` (8 fichiers demandés) → 16 fichiers, 112 tests, tous passés, sortie dans `voies/w1/tests.txt`. Aucun échec.
- Étape 3 (contrôles) : `verdicts.mjs w1` → `VERDICTS OK (6)` ; `verdicts.mjs w1 --tests` → `TESTS OK`.
- Étape 4 (images) : 31 images ouvertes, constats ci-dessous.
- Étape 5 (TL-19 en Chrome) : ÉCHEC, deux fois, passé. Voir plus bas.

## Captures (une ligne par image)
- w1-te27-houblons-1280-clair : atelier « Atelier houblons avancé · études, prévisions et essais » replié sous « Ajouter un houblon », une ligne. Conforme.
- w1-te27-houblons-1280-cave : idem en sombre. Conforme.
- w1-te27-houblons-390-clair : idem à 390. Conforme.
- w1-te27-houblons-390-clair-bas : idem, bas de page. Conforme.
- w1-te27-houblons-390-cave : idem en sombre. Conforme.
- w1-te27-houblons-390-cave-bas : idem, bas de page. Conforme.
- w1-tl7-identite-1280-clair : interrupteur NOLO activé, pas de titre « Objectif NOLO », mais une invite « Cette recette n'a pas de matériel figé… Adapter à mon matériel actuel · Système 30L » (pas de panneau NOLO). Conforme à la variante « invite de matériel ».
- w1-tl7-identite-1280-cave : idem en sombre. Conforme.
- w1-tl7-identite-390-clair : idem à 390. Conforme.
- w1-tl7-identite-390-clair-bas : idem, bas de page. Conforme.
- w1-tl7-identite-390-cave : idem en sombre. Conforme.
- w1-tl7-identite-390-cave-bas : idem, bas de page. Conforme.
- w1-tl7-levure-1280-clair : étape Levure, aucun « Objectif NOLO », seulement l'invite de matériel. Conforme.
- w1-tl7-levure-1280-cave : idem en sombre. Conforme.
- w1-tl7-levure-390-clair : idem à 390. Conforme.
- w1-tl7-levure-390-clair-bas : idem, bas de page. Conforme.
- w1-tl7-levure-390-cave : idem en sombre. Conforme.
- w1-tl7-levure-390-cave-bas : idem, bas de page. Conforme.
- w1-tl7-recap-1280-clair : Récapitulatif, menu « Plus » ouvert avec « Régler le NOLO » ; aucun « Objectif NOLO ». Conforme.
- w1-tl7-recap-1280-cave : idem en sombre. Conforme.
- w1-tl7-recap-390-clair : idem à 390 (menu « Plus » ouvert, « Régler le NOLO » en bas du menu). Conforme.
- w1-tl7-recap-390-clair-bas : idem, bas de page. Conforme.
- w1-tl7-recap-390-cave : idem en sombre. Conforme.
- w1-tl7-recap-390-cave-bas : idem, bas de page. Conforme.
- w1-bk25-additifs-1280-clair : étape Malts/sucres, « Additifs · 1 » ouvert, Coriandre, quantité 12,5, unité g. Le moment (Ébullition) n'est pas lisible sur l'image : doute. Conforme pour le nom, la quantité et l'unité.
- w1-bk25-additifs-1280-cave : idem en sombre. Même doute sur le moment.
- w1-bk25-additifs-390-cave : CAPTURE NON EXPLOITABLE : écran « Chargement de la brasserie… ». Le contrôle « sans débordement à 390 » n'est pas établi.
- w1-bk25-additifs-390-cave-bas : idem, « Chargement de la brasserie… ». Non exploitable.
- w1-tl16-eau-1280-clair : Eau et sels, « Il manque 13,7 L d'eau » en ambre et « Le calcul donne 25,6 / 4,9 L · recaler » en ambre, aucun rouge. Conforme.
- w1-tl16-eau-1280-cave : idem en sombre, ambre. Conforme.
- w1-tl16-eau-390-cave : écran « Chargement… / Ouverture de la page… ». Non exploitable.
- w1-tl16-eau-390-cave-bas : ne montre PAS l'onglet Eau mais « Malts/sucres 2/7 » avec « Brouillon repris sur cet appareil » (bannière de reprise). Ne correspond pas au nom du fichier : à vérifier (possible décalage de capture). Non conforme au nom.
- explore-eau-390 (hors liste) : Eau et sels 6/7 à 390, « Minimum appliqué », sans rouge à l'ouverture. Hors contrôle, pour information.

## Étape 5 — TL-19 en Chrome : ÉCHEC (deux tentatives)
- Tentative A (`capturer.mjs`, fonction `reprise`, trois essais déjà au RESULTAT) : `#wz-title` introuvable.
- Tentative B (`voies/w1/reprise-tl19.mjs`, nouveau script : « + » puis « Nouvelle recette ») : accueil chargé, « + » cliqué, mais « Nouvelle recette » non trouvée dans le menu. `#wz-title` absent en 390 clair et 1280 clair. Journal : `voies/w1/reprise-tl19-journal.txt`. Aucune erreur de page.
- Donc : aucune capture `w1-tl19-reprise-*` produite. La phrase « Brouillon repris sur cet appareil. » n'est pas vue en Chrome. Preuve reste le test Vitest seul.
- Piste non vérifiée : le libellé du menu « Actions rapides » ou l'état du « + » (ouverture peut-être par un autre geste). À regarder à la main.

## Doutes
- Trois captures (bk25 390 cave et bas, tl16 390 cave) sont des écrans de chargement : les contrôles à 390 de bk25 et tl16 restent non prouvés.
- Le moment « Ébullition » de l'Additif n'est lisible sur aucune capture 1280.
- tl16-eau-390-cave-bas ne montre pas l'onglet Eau : fichier à regénérer.
- Tests et verdicts verts ne remplacent pas ces captures.
