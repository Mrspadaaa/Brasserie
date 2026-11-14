# Voie c2 — Critique des passes 2 avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 25 tours · Dépend de : p2a, p2b, p2c · Décideur : pilote

## Objectif
Pour s1e2, s1g, s2a2 et s3b2 : « combien et quels problèmes il y a ? », comme le brasseur, avant qu'on les lui montre. Un verdict
par variante (MONTRER ou CORRIGER), et pour CORRIGER la liste exacte des défauts à corriger.

## Entrées
- Images : `work/missions/2026-11-14-brassins/voies/p2a/s1e2/`, `p2a/s1g/`, `p2b/s2a2/`, `p2c/s3b2/` (six PNG chacune) et leurs `NOTE.md`.
- `work/missions/2026-11-14-brassins/voies/t1/SYNTHESE.md` § Candidates, § Retouches communes (ce qui devait être corrigé).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres (baseline et vrais chiffres).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/c2/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image (24) ; ne relis pas les etat.html. Vérifie chaque chiffre contre « Les chiffres » (L14).
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; puis une section `## <id> — MONTRER|CORRIGER` par variante, liste
  numérotée (bloquant : chiffre faux, élément de la baseline absent, illisible, geste sans effet, texte coupé ou chevauché).
- MONTRER si aucun bloquant ; les autres problèmes restent listés (ils iront sur la page comme réserves).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/c2/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
