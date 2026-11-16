# Voie k6 — Critique de g6a à g6c et e5na à e5nd avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 25 tours · Dépend de : g6, e5n · Décideur : pilote

## Objectif
Ses mots (15.11), mot pour mot : « e7a — e6a — e6c Des filtres qui comptent — Créer un brassin ?? Pas convaincu — e4c ». Pour g6a à
g6c (e6a greffée des filtres qui comptent de e6c) et e5na à e5nd (Créer un brassin, refait d'un autre genre) : « combien et quels
problèmes il y a ? », comme lui. Pour g6 : la liste de e6a reconnaissable, les filtres de e6c présents et comptés. Pour e5n : rien de
la forme des 4 refusées (e5a à e5d), et convaincant là où elles ne l'étaient pas. Un verdict par maquette (MONTRER ou CORRIGER).

## Entrées
- Images : `work/missions/2026-11-14-brassins/voies/g6/g6[a-c]/*.png`, `voies/e5n/e5n[a-d]/*.png` et leurs NOTE.md ; parents et refusées :
  `voies/e6/e6a/`, `voies/e6/e6c/`, `voies/e5/e5[a-d]/` (repos seulement) ; `voies/e5n/RESULTAT.md` (pourquoi il n'était pas convaincu).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres ; `voies/c3/DIAGNOSTIC.md` (7 causes).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` ; l'app : `voies/a1-banc/captures/fiche-fermentation-390-clair.png`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/k6/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image ; ne relis pas les etat.html. Vérifie chaque
  chiffre contre « Les chiffres » (L14).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; une section `## <id> — MONTRER|CORRIGER` par maquette, liste numérotée,
  `[B]` devant un bloquant (attente manquée, chiffre faux, fonction perdue en silence, illisible, texte coupé, hors identité de
  l'app, retour d'une cause c3) ; chaque défaut dit l'image, la zone et la correction. Finir par `## Classement` (les 4, une ligne
  chacune, avec la phrase qu'il dirait).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; inconnu « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280 ; identité de l'app.

## Critères
`work/missions/2026-11-14-brassins/voies/k6/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : les captures des greffes, toutes ouvertes.
Réponse finale au pilote : une ligne.
