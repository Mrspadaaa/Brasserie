# Voie kg — Critique des greffes gfa à gfd avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 25 tours · Dépend de : gf · Décideur : pilote

## Objectif
Ses mots (15.11), mot pour mot : « s4a Tableau de cuverie, fiche dépliée s4a — s6c Conduite de z1, houblons en colonnes s6c — Dans
l'idéal mais s4a est beaucoup trop chargé. Mais j'aime bien le graph sur le temps ». Pour gfa, gfb, gfc, gfd : « combien et quels
problèmes il y a ? », comme lui, avant qu'on les lui montre. D'abord ses trois attentes : (1) moins chargé que s4a, (2) le graphique dans
le temps de s4a reconnaissable, (3) les houblons en colonnes de s6c. Un verdict par greffe (MONTRER ou CORRIGER).

## Entrées
- Images : `work/missions/2026-11-14-brassins/voies/gf/gf[a-d]/*.png` et leurs NOTE.md ; parents à côté :
  `voies/s4/s4a/s4a-repos-390-clair.png`, `voies/s6/s6c/s6c-repos-390-clair.png`.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres ; `voies/c3/DIAGNOSTIC.md` (7 causes).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` ; l'app : `voies/a1-banc/captures/fiche-fermentation-390-clair.png`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/kg/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image ; ne relis pas les etat.html. Compte les éléments au premier écran de chaque greffe et de s4a. Vérifie chaque
  chiffre contre « Les chiffres » (L14).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; une section `## gf<x> — MONTRER|CORRIGER` par greffe, liste numérotée,
  `[B]` devant un bloquant (attente 1, 2 ou 3 manquée, chiffre faux, fonction perdue en silence, illisible, texte coupé, hors identité de
  l'app, retour d'une cause c3) ; chaque défaut dit l'image, la zone et la correction. Finir par `## Classement` (les 4, une ligne
  chacune, avec la phrase qu'il dirait).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; inconnu « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; identité de l'app.

## Critères
`work/missions/2026-11-14-brassins/voies/kg/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : les captures des greffes, toutes ouvertes.
Réponse finale au pilote : une ligne.
