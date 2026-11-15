# Voie q9 — Les derniers bloquants du port (contre-critique kq2)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : kq2 · Décideur : pilote

## Objectif
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » La critique du port (`work/missions/2026-11-14-brassins/voies/kq2/VERDICT.md`)
garde 5 bloquants [B] (§ gfc, e6a, e9na) : corriger chaque défaut [B] de ces sections, puis les non bloquants simples, pour que l'app soit sa maquette
telle quelle, état par état.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons et fonctions du domaine existants réutilisés (L29).

## Entrées
- `work/missions/2026-11-14-brassins/voies/kq2/VERDICT.md` § gfc, § e6a, § e9na (chaque défaut : état, zone, attendu) ; maquettes `work/missions/2026-11-14-brassins/voies/e*/<id>/` (PNG, etat.html par sections).
- Ce qui a été fait : `work/missions/2026-11-14-brassins/voies/q1/RESULTAT.md`, `work/missions/2026-11-14-brassins/voies/q3/RESULTAT.md`.
- Décisions du pilote : gfc n° 1 : le toast dit ce qui est fait et propose Annuler (test). gfc n° 2 : la bande °C cuve montre la température des relevés existants (champ °C du relevé de densité) ; si les fixtures du banc n'en ont pas, les ajouter aux fixtures du banc (jamais aux données réelles), et ne rien inventer à l'écran. e6a n° 1 : un seul réglage de période visible sur la liste Brassins : le plus étroit et réversible (masquer celui de l'en-tête pour ce sous-onglet seulement, sans changer les autres onglets) ; `src/components/Header.tsx` t'est accordé pour ce seul cas. e9na n° 1 : attend l'ACCORD (tâche serveur d'IA) : le cocher ainsi. e9na n° 2 : la teinte de la pastille de style « Lager » tirée de la couleur du style (jetons existants), comme la maquette.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/BatchDetailSheet.tsx`, `src/ui/production/liste/`, `src/components/Header.tsx` (période, sous-onglet Brassins seulement), `src/components/CreativeLabTab.tsx`, `src/ui/atelier/`, `src/ui/production/fermentation/`, `src/ui/production/carnet/`, `src/ui/production/FermentationCurveChart.tsx`, `src/ui/production/BatchGravityEntry.tsx`, `tests/unit/port-q9-*.test.tsx`, `work/missions/2026-11-14-brassins/voies/q9/` (RESULTAT.md, tests.txt, captures/, ta copie du banc).
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json` ; aucun champ Firestore neuf ; ni commit, ni stash, ni déploiement. D'autres voies corrigent en même temps (q5 fiche, q6 liste, q7 Atelier) : ne touche rien d'autre ; relis juste avant chaque Edit.

## Consignes
- `RESULTAT.md` : une ligne cochée `- [x] <id> n° <k> : <correction>` par défaut [B] corrigé ; ce qui ne peut l'être, dit et pourquoi.
- Tests Vitest pour les règles touchées ; rejouer aussi `tests/unit/port-` et les tests d'intégration des fichiers touchés (`grep -l` dans tests/integration).
- Captures : copie le banc de q1 (`work/missions/2026-11-14-brassins/voies/q1/banc.mjs`), port 3119, seulement les états corrigés, mêmes noms que `work/missions/2026-11-14-brassins/voies/p2/captures/` mais dans `work/missions/2026-11-14-brassins/voies/q9/captures/`. Ouvre chaque capture à côté de la PNG de la maquette ; « combien et quels problèmes ? » ; corrige.
- Économise le contexte : fichiers par sections (grep, sed -n), sorties filtrées, chaque PNG une fois.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ; hors ligne préservé ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/q9/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/q9/RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : `npx vitest run port- --reporter=dot > work/missions/2026-11-14-brassins/voies/q9/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
