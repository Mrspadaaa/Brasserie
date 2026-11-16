# Voie p7 — Les 4 derniers bloquants du port (contre-critique kp2)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : kp2 · Décideur : pilote

## Objectif
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » La critique du port (`work/missions/2026-11-14-brassins/voies/kp2/VERDICT.md`)
garde 4 bloquants [B] (§ e2a, e4c, e7a, e11a) : les corriger, puis les non bloquants simples, pour que l'app soit sa maquette
telle quelle, état par état.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons et fonctions du domaine existants réutilisés (L29).

## Entrées
- `work/missions/2026-11-14-brassins/voies/kp2/VERDICT.md` § e7a, § e11a (chaque défaut : état, zone, attendu) ; maquettes `work/missions/2026-11-14-brassins/voies/e*/<id>/` (PNG, etat.html par sections).
- Ce qui a été fait : `work/missions/2026-11-14-brassins/voies/p2/RESULTAT.md` et `INVENTAIRE.md`, `work/missions/2026-11-14-brassins/voies/p3/RESULTAT.md` et `INVENTAIRE.md`.
- Décisions du pilote : (1) e2a « Rebrasser cette <style> » : câbler `onRebrew` de `ProductionTab` (ou `App.tsx`, seulement ce passage de prop) vers le geste existant (`setBrewRecipeId` + `setQuickAction('brew-batch')`, voir `voies/p5/RESULTAT.md` DÉCISION). (2) e4c date d'entrée en garde : si le modèle garde déjà une trace datée des changements d'étape (`grep -n "history|statusChangedAt|stage" src/types* src/domain/batch*.ts`), l'utiliser ; sinon AUCUN champ Firestore neuf : écrire « ACCORD : date d'entrée en garde » dans RESULTAT.md, montrer les seules dates connues, et cocher « attend l'accord ». (3) e7a alcool : tiré de OG et FG confirmées quand l'alcool n'est pas saisi (fonction du domaine existante), test qui échoue avant. (4) e11a phrase-réponse de la liste : la rétablir (régression du masquage de la vue Bilan), test.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/BatchDetailSheet.tsx`, `src/ui/production/fiche/`, `src/App.tsx` (passage de `onRebrew` seulement), `src/ui/production/CatalogAnalysis.tsx`, `src/ui/production/BatchOutcomeAnalysis.tsx`, `src/ui/production/bilan/`, `src/ui/production/ProductionCatalog.tsx`, `src/components/tabs/ProductionTab.tsx`, `src/ui/FloatingActions.tsx`, `src/domain/fabActions.ts`, `tests/unit/port-p7-*.test.tsx`, `work/missions/2026-11-14-brassins/voies/p7/` (RESULTAT.md, tests.txt, captures/, ta copie du banc).
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json` ; aucun champ Firestore neuf ; ni commit, ni stash, ni déploiement. Seule voie en cours.

## Consignes
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction>` par défaut [B] corrigé ; ce qui ne peut l'être, dit et pourquoi.
- Tests Vitest pour les règles touchées ; rejouer aussi `tests/unit/port-` et les tests d'intégration des fichiers touchés (`grep -l` dans tests/integration).
- Captures : copie le banc de p2 (`work/missions/2026-11-14-brassins/voies/p2/banc.mjs`), port 3107, seulement les états corrigés, mêmes noms que `work/missions/2026-11-14-brassins/voies/p2/captures/` mais dans `work/missions/2026-11-14-brassins/voies/p7/captures/`. Ouvre chaque capture à côté de la PNG de la maquette ; « combien et quels problèmes ? » ; corrige.
- Économise le contexte : fichiers par sections (grep, sed -n), sorties filtrées, chaque PNG une fois.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ; hors ligne préservé ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/p7/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/p7/RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : `npx vitest run port- --reporter=dot > work/missions/2026-11-14-brassins/voies/p7/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
