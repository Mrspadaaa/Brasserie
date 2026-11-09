# Étape 2 de d2, uc, up : coder après la revue

Revues : `REVUE-P2-A.md` (métier) et `REVUE-P2-B.md` (code). Décisions du pilote : `DECISIONS-PHASE2.md`.
1. Traite chaque constat de ta voie des deux revues dans PLAN.md (retenu / écarté + raison). Bloquants à corriger d'abord :
   - d2 : lire `ogTarget` (pas `og`), passer l'alcool et la réduction d'impôt ; un test prouve que la prévision dérivée retrouve
     exactement les montants de c3a sur la fixture (64,26 CHF ; 33,42 avant le brassage · 30,84 plus tard).
   - uc : à la réouverture, `netVolumeL` n'est lu que si `netVolumeSource` le permet ; sinon « — » (défaut 27) ; un test le prouve.
2. Code ; tests rouges d'abord puis verts (`--reporter=dot > voies/<id>/tests.txt`) ; `npx tsc --noEmit` vert hors `firebase-admin`.
3. uc et up : captures de l'écran porté (`?dev-local&finance-demo`) à 390 tactile et 1280, clair et cave, côte à côte avec la maquette,
   **ouvertes** (L12), dans `voies/<id>/captures/`. Le test d'écran final revient au critique.
Reste dans ton Possède. RESULTAT.md au fil. Aucun commit, pas de `git stash`. Rends une ligne.
