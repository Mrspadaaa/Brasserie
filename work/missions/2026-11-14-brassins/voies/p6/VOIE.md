# Voie p6 — Corriger le port du bilan (e7a) et du bouton + (e11a)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : kp · Décideur : pilote

## Objectif
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » La critique du port (`work/missions/2026-11-14-brassins/voies/kp/VERDICT.md`)
rejette e7a, e11a : corriger chaque défaut [B] de ces sections, puis les non bloquants simples, pour que l'app soit sa maquette
telle quelle, état par état.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons et fonctions du domaine existants réutilisés (L29).

## Entrées
- `work/missions/2026-11-14-brassins/voies/kp/VERDICT.md` § e7a, § e11a (chaque défaut : état, zone, attendu) ; maquettes `work/missions/2026-11-14-brassins/voies/e*/<id>/` (PNG, etat.html par sections).
- Ce qui a été fait : `work/missions/2026-11-14-brassins/voies/p2/RESULTAT.md` et `INVENTAIRE.md`, `work/missions/2026-11-14-brassins/voies/p3/RESULTAT.md` et `INVENTAIRE.md`.
- e11a : SEULS les défauts n° 3 et 4 (le + nommé selon le sous-onglet, son menu) sont à porter. Les n° 1, 2 et 5 (cartes de la liste, puces,
  cartes recette) relèvent de la liste et du carnet de recettes, dont son choix est ouvert (page « six questions ») : règle « rien ne vient
  d'un écran dont le choix est ouvert ». Les écrire « attendent son choix » dans RESULTAT.md et les cocher ainsi.
- `fabActions.ts` sert aussi d'autres onglets (Finances, Stock) : ne change que les entrées de l'onglet Brassins ; leurs tests rejoués.
- e7a n° 2 : dans `ProductionCatalog.tsx`, seulement masquer la barre de la liste en vue Bilan et passer `onBack` ; rien d'autre de la liste.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/production/CatalogAnalysis.tsx`, `src/ui/production/BatchOutcomeAnalysis.tsx`, `src/ui/production/bilan/`, `src/ui/production/ProductionCatalog.tsx`, `src/components/tabs/ProductionTab.tsx`, `src/ui/FloatingActions.tsx`, `src/domain/fabActions.ts`, `tests/unit/port-p6-*.test.tsx`, `work/missions/2026-11-14-brassins/voies/p6/` (RESULTAT.md, tests.txt, captures/, ta copie du banc).
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json` ; aucun champ Firestore neuf ; ni commit, ni stash, ni déploiement. Une autre voie corrige en même temps (p5 la fiche, p6 le bilan et le bouton +) : ne touche rien d'autre.

## Consignes
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction>` par défaut [B] corrigé ; ce qui ne peut l'être, dit et pourquoi.
- Tests Vitest pour les règles touchées ; rejouer aussi `tests/unit/port-` et les tests d'intégration des fichiers touchés (`grep -l` dans tests/integration).
- Captures : copie le banc de p2 (`work/missions/2026-11-14-brassins/voies/p2/banc.mjs`), port 3106, seulement les états corrigés, mêmes noms que `work/missions/2026-11-14-brassins/voies/p2/captures/` mais dans `work/missions/2026-11-14-brassins/voies/p6/captures/`. Ouvre chaque capture à côté de la PNG de la maquette ; « combien et quels problèmes ? » ; corrige.
- Économise le contexte : fichiers par sections (grep, sed -n), sorties filtrées, chaque PNG une fois.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ; hors ligne préservé ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/p6/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/p6/RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : `npx vitest run port- --reporter=dot > work/missions/2026-11-14-brassins/voies/p6/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
