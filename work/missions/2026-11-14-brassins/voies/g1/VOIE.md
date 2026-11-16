# Voie g1 — Corriger les défauts de k1 avant de montrer

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 40 tours · Dépend de : k1 · Décideur : pilote

## Objectif
Ses mots (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Les variantes des
séries e2, e4 sont faites et critiquées. Corriger chaque défaut bloquant de `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md` (5 au total) dans
e2c, e2d, e4b, e4d, sans changer l'idée de la variante ; puis, s'il reste du contexte, les non bloquants simples (une ligne de CSS ou de texte).

## Entrées
- `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md` : chaque défaut dit l'image, la zone et la correction attendue. Suivre la correction proposée.
- Les variantes : `work/missions/2026-11-14-brassins/voies/e2/`, `work/missions/2026-11-14-brassins/voies/e4/` (`etat.html`, PNG, `NOTE.md` ; `capture.mjs` de la série dans son dossier).
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres.
- L'identité de l'app est acquise (15.11, « Ça semble pas du tout respecter l'identité global de l'app ?? ») : garder la trousse `work/missions/2026-11-14-brassins/outils/identite/` et ses classes ; après correction, `node work/missions/2026-11-14-brassins/outils/controle-identite.mjs <série>` doit rendre IDENTITE OK.
- Fonction perdue (Carnet, Dossier, stock) : un accès à un toucher, comme l'en-tête de feuille de l'app (icônes Carnet et Dossier), pas une section neuve.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e2/`, `work/missions/2026-11-14-brassins/voies/e4/` (etat.html, NOTE.md et PNG des variantes), et `work/missions/2026-11-14-brassins/voies/g1/` (`RESULTAT.md`, `tests.txt`).
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS, ou `os.tmpdir()` préfixés `g1-`.

## Consignes
- Pour chaque variante corrigée, régénérer TOUTES ses images par le `capture.mjs` de sa série (mêmes noms) et ouvrir chacune (Read)
  avant de cocher. Classes préfixées par l'id de la variante (L26).
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction faite>` par défaut bloquant corrigé ; les non bloquants faits en
  dessous ; ce qui n'a pas pu l'être, dit et pourquoi. Vers 150 k de contexte, finis les images en cours et rends.
- Aucun chiffre neuf : ceux du brief ou de NOTE.md seulement ; α « — » ou sourcé.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2) ; jamais `type="number"` ; inconnu = « — » ; chiffres à la virgule ; cibles ≥ 44 px ; deux thèmes ; 390 et
  1280 ; premier plan actionnable, pas de cockpit ni de code interne.

## Critères
`work/missions/2026-11-14-brassins/voies/g1/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même
  format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
