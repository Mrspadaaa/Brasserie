# Voie f2b — Corriger les défauts de c4b avant de montrer

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 40 tours · Dépend de : c4b · Décideur : pilote

## Objectif
Ses mots (14.11) : « Pas super fan de aucun, lance une critique et fait d'autres versions ». Les séries s6 et s7 sont faites et
critiquées. Corriger chaque défaut bloquant de `work/missions/2026-11-14-brassins/voies/c4b/VERDICT.md` (4 au total) dans s6c, s7a, s7c, sans changer l'idée de
la variante, puis les défauts non bloquants simples (une ligne de CSS ou de texte) de toutes les variantes des séries s6 et s7.

## Entrées
- `work/missions/2026-11-14-brassins/voies/c4b/VERDICT.md` : chaque défaut dit l'image, la zone et la correction attendue. Suivre la correction proposée.
- Les variantes : `work/missions/2026-11-14-brassins/voies/s6/` et `work/missions/2026-11-14-brassins/voies/s7/` (`etat.html`, PNG, `NOTE.md` ; le script de capture de la série est dans son dossier
  ou dans son `RESULTAT.md`).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/s6/` et `work/missions/2026-11-14-brassins/voies/s7/` (etat.html et PNG des variantes), et `work/missions/2026-11-14-brassins/voies/f2b/` (`RESULTAT.md`, `tests.txt`, scripts).
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS, ou `os.tmpdir()` préfixés `f2b-`.

## Consignes
- Pour chaque variante corrigée, régénérer TOUTES ses images (mêmes noms, 390 × 844, `isMobile`, `hasTouch` ; 1280 et cave s'ils
  existent) et ouvrir chacune (Read) avant de cocher. Classes préfixées par l'id de la variante (L26).
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction faite>` par défaut bloquant corrigé ; les non bloquants faits,
  en dessous ; ce qui n'a pas pu l'être, dit et pourquoi.
- Aucun chiffre neuf : ceux du brief seulement ; α « — » ou sourcé.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline du brief (geste m2, z1, J+n depuis le levurage, deux températures, FG en bande, dry hop nommé et fusionné au stock,
  premier plan actionnable, pas de cockpit) ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et 1280.

## Critères
`work/missions/2026-11-14-brassins/voies/f2b/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
