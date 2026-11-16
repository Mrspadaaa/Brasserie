# Voie c4b — Critique des séries s6 et s7 avant de montrer

- Mission : 2026-11-14-brassins · Agent : critique · Modèle : opus (Fable interdit) · Niveau : jugement · Plafond : 25 tours · Dépend de : s6, s7 · Décideur : pilote

## Objectif
Ses mots (14.11), devant les 19 premières : « Pas super fan de aucun, lance une critique et fait d'autres versions ». Pour
s6a, s6b, s6c, s7a, s7b, s7c : « combien et quels problèmes il y a ? », comme le brasseur, avant qu'on les lui montre. Un verdict par variante
(MONTRER ou CORRIGER), et pour CORRIGER la liste exacte des défauts à corriger.

## Entrées
- Images : `work/missions/2026-11-14-brassins/voies/s6/`, `work/missions/2026-11-14-brassins/voies/s7/` (tous les PNG des dossiers `s6a` à `…c`) et leurs `NOTE.md`.
- `work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md` : les 7 causes du refus précédent. Une variante qui retombe dans une cause est un défaut.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres (baseline et vrais chiffres).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/c4b/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre chaque image ; ne relis pas les etat.html. Vérifie chaque chiffre contre « Les chiffres » (L14) ; un houblon : α « — » ou sourcé.
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; puis une section `## <id> — MONTRER|CORRIGER` par variante, liste
  numérotée (bloquant : chiffre faux ou inventé, élément de la baseline absent, illisible, geste sans effet, texte coupé ou chevauché,
  retour d'une cause c3). Chaque défaut dit l'image et la zone, et la correction attendue.
- MONTRER si aucun bloquant ; les autres problèmes restent listés. Finir par `## Classement` : les 6 dans l'ordre où il les aimerait, une ligne chacune.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/c4b/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
