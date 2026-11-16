# Voie q5 — Corriger le port : gfc, e3gb

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : kq · Décideur : pilote

## Objectif
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » La critique du port (`work/missions/2026-11-14-brassins/voies/kq/VERDICT.md`)
rejette gfc, e3gb : corriger chaque défaut [B] de ces sections, puis les non bloquants simples, pour que l'app soit sa maquette
telle quelle, état par état.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons et fonctions du domaine existants réutilisés (L29).

## Entrées
- `work/missions/2026-11-14-brassins/voies/kq/VERDICT.md` § gfc, § e3gb (chaque défaut : état, zone, attendu) ; maquettes `work/missions/2026-11-14-brassins/voies/e*/<id>/` (PNG, etat.html par sections).
- Ce qui a été fait : `work/missions/2026-11-14-brassins/voies/q1/RESULTAT.md`, `work/missions/2026-11-14-brassins/voies/q3/RESULTAT.md`.
- Décisions du pilote : gfc n° 2 (cases des tâches) : les ranger dans un champ existant du brassin s'il en est un qui convient (notes, événements datés) ; sinon « ACCORD : … » et la case montrée inactive avec « à venir ». gfc n° 3 : « Ajouté auj. » ne déstocke QUE ce houblon (test qui échoue avant). gfc n° 4 : pas de feuille intercalée ; le geste se fait sur la carte, avec Annuler, comme la maquette. Pictos de familles d'arômes : composant existant de l'app (`grep -rln "FamilyIcon|pictos" src/ui | head`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/BatchDetailSheet.tsx`, `src/ui/production/fermentation/`, `src/ui/production/carnet/`, `src/ui/production/FermentationCurveChart.tsx`, `src/ui/production/BatchGravityEntry.tsx`, `tests/unit/port-q5-*.test.tsx`, `work/missions/2026-11-14-brassins/voies/q5/` (RESULTAT.md, tests.txt, captures/, ta copie du banc).
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json` ; aucun champ Firestore neuf ; ni commit, ni stash, ni déploiement. D'autres voies corrigent en même temps (q5 fiche, q6 liste, q7 Atelier) : ne touche rien d'autre ; relis juste avant chaque Edit.

## Consignes
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction>` par défaut [B] corrigé ; ce qui ne peut l'être, dit et pourquoi.
- Tests Vitest pour les règles touchées ; rejouer aussi `tests/unit/port-` et les tests d'intégration des fichiers touchés (`grep -l` dans tests/integration).
- Captures : copie le banc de q1 (`work/missions/2026-11-14-brassins/voies/q1/banc.mjs`), port 3115, seulement les états corrigés, mêmes noms que `work/missions/2026-11-14-brassins/voies/p2/captures/` mais dans `work/missions/2026-11-14-brassins/voies/q5/captures/`. Ouvre chaque capture à côté de la PNG de la maquette ; « combien et quels problèmes ? » ; corrige.
- Économise le contexte : fichiers par sections (grep, sed -n), sorties filtrées, chaque PNG une fois.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ; hors ligne préservé ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/q5/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/q5/RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : `npx vitest run port- --reporter=dot > work/missions/2026-11-14-brassins/voies/q5/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
