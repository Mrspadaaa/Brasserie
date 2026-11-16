# Voie c2f — Corriger les bloquants de c2 (s1e2, s1g, s3b2)

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 30 tours · Dépend de : c2 · Décideur : pilote

## Objectif
Corriger dans `voies/p2a/s1e2/etat.html`, `voies/p2a/s1g/etat.html` et `voies/p2c/s3b2/etat.html` chaque défaut marqué [B] de
`work/missions/2026-11-14-brassins/voies/c2/VERDICT.md`, puis les non bloquants de la même section qui se corrigent en une ligne ;
recapturer les six images de chaque variante touchée et les rouvrir.

## Entrées
- `work/missions/2026-11-14-brassins/voies/c2/VERDICT.md` (sections s1e2, s1g, s3b2 seulement).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § « Les chiffres » (seuls chiffres permis ; ni Blanche ni Brune).
- Scripts de capture : `voies/p2a/` (`p2a-cap.mjs` ou celui du RESULTAT) et `voies/p2c/` ; fichiers de travail préfixés `c2f-`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/p2a/s1e2/`, `voies/p2a/s1g/`, `voies/p2c/s3b2/`, `voies/c2f/`.

## Consignes
- Ne rien redessiner : corriger ce qui est listé. Chaque correction cochée dans `voies/c2f/RESULTAT.md` avec l'image qui la prouve.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Aucun chiffre hors de « Les chiffres » ; inconnu = « — » ; étiquettes jamais chevauchées ; cibles ≥ 44 px ; deux thèmes.

## Critères
`voies/p2a/GATES.md` et `voies/p2c/GATES.md` (G1, G2), et `work/missions/2026-11-14-brassins/voies/c2f/GATES.md`.

## Rendre
- `voies/c2f/RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `voies/c2f/tests.txt` porte la sortie des CHECK,
  au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, recapturées et ouvertes.
Réponse finale au pilote : une ligne.
