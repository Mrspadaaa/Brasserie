OK — 28 problèmes, 3 bloquants ; 10 parcours manquants

Voie a1-analyse (critique, Opus ; Fable interdit). Livrable : `work/missions/2026-11-14-materiel/analyse/ANALYSE.md`.

- Captures ouvertes : 31 sur 31 dans `banc/`, plus sa capture en ligne `brasseur/14-11-stocks-materiel.jpg`. Cela couvre 390 tactile
  et 1280, clair et cave, pour la liste, À traiter, les actions et la fiche ; les autres états sont à 390 clair.
- Bloquants :
  - P1 : « À traiter » ne compte que l'état saisi à la main. Sa capture montre « À traiter · 0 » alors que le pH-mètre s'étalonne
    chaque mois.
  - P2 : l'entretien est un texte libre, sans date ni échéance.
  - P3 : aucun geste « fait », et rien n'est daté ni gardé.
- Parcours manquants M1 à M10 : entretien dû, entretien fait, panne, étalonnage, dépenses, valeur, vendu ou réformé, brassage, ajout
  depuis le vide, historique. Les données déjà en base sont nommées : `equipmentRef`, `FinancialAsset`,
  `BrewhouseProfile.equipmentRefs`, `existingEquipmentId`.
- Gate G1 : `NOTE OK P28 M10`.
- Non capturés, à prendre en passe 2 : À traiter vide, la confirmation de suppression, la ligne « Moulin à malt », et les états
  secondaires en cave et à 1280.
- Tests : sans objet (aucun code).
- Fichiers écrits : `analyse/ANALYSE.md` et ce fichier. Rien d'autre.

LEÇON PROPOSÉE : aucune
