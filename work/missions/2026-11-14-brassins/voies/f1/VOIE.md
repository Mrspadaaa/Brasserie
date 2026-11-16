# Voie f1 — Finir les séries v0 s1 et s3 (captures, NOTE.md, contrôles, tests.txt)

- Mission : 2026-11-14-brassins · Agent : executant · Modèle : haiku · Niveau : mécanique · Plafond : 40 tours · Dépend de : s1, s3 · Décideur : pilote

## Objectif
Les concepteurs s1 et s3 se sont arrêtés au plafond de contexte. Finir leur « Reste à faire » mécanique : captures manquantes, NOTE.md
par variante, sorties des contrôles, `tests.txt`, ligne 1 de RESULTAT.md. **Ne modifie aucun `etat.html`** : contraste, couleurs et
densité (COMMUN, PANEL en ECHEC) se corrigent en passe 2 ; les écrire tels quels.

## Entrées
- `work/missions/2026-11-14-brassins/voies/s1/RESULTAT.md` (§ Fait, § Sorties des contrôles, § Reste à faire : points 2 et 3 seulement).
- `work/missions/2026-11-14-brassins/voies/s3/REPRISE.md` (§ Reste à faire : points 1 à 5 ; captures par `capture.mjs`).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § « Obligatoire » (baseline à cocher).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/s1/` et `voies/s3/` : PNG, `*/NOTE.md`, `tests.txt`, `RESULTAT.md` ; et `voies/f1/`.

## Consignes
- NOTE.md, par variante : `Chaleur : <froide|tiède|chaude>` (s1a froide, s1b tiède, s1c tiède, s1d chaude, s1e chaude ; s3a froide,
  s3b tiède, s3c tiède, s3d chaude, s3e chaude) ; `Idée :` une ligne tirée de RESULTAT/REPRISE ; `Baseline :` les points
  d'« Obligatoire » 1, [x] seulement si la source le dit, sinon [ ] ; `Écarts :` et `Hypothèses :` repris mot pour mot de la source ;
  `Contrôles :` lignes COMMUN et PANEL qui concernent la variante.
- s3 : rejoue la commande de captures du point 1 de REPRISE.md, ouvre (Read) les 2 caves et les 2 1280 et dis en une ligne ce que
  tu vois (vide, coupé, ou rendu complet) ; puis les points 2 et 3 (sorties dans `voies/f1/controles-s3.txt`).
- s1 : rejoue les deux commandes de contrôle du RESULTAT (sorties dans `voies/f1/controles-s1.txt`).
- RESULTAT.md de chaque série, ligne 1 : `OK — v0 rendue (5 variantes) ; contrôles : <PANEL …> <COMMUN …> ; corrections en passe 2`.
  Garde le reste ; s3 : crée RESULTAT.md à partir de REPRISE.md.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : ce qui n'est pas dans la source reste « non dit ».

## Critères
`voies/s1/GATES.md` et `voies/s3/GATES.md` (G1 à G3 chacun), depuis la racine du dépôt.

## Rendre
- `voies/f1/RESULTAT.md` tenu au fil (une ligne par série et par CHECK), mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `voies/s1/tests.txt` et `voies/s3/tests.txt`
  portent la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, de s3 rejouées et ouvertes.
Réponse finale au pilote : une ligne.
