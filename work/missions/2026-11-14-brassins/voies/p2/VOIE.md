# Voie p2 — Port du bilan : mes brassins en chiffres (e7a)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : son choix (fait) · Décideur : pilote

## Objectif
Ses choix (15.11, mot pour mot dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`) : « e7a — … » = e7a, le bilan : « Ai-je atteint ma cible ? », production par mois, styles, houblons, alcool et amertume, retours de dégustation.
Règle n° 1 (CLAUDE.md) : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Porter chaque maquette TELLE QUELLE
dans l'app, chaque état et chaque geste, branchée sur les vraies données et le vrai code (L03, L11) : ce qu'elle n'a pas, le port le retire.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons (`src/theme/themes.css`) et fonctions du domaine existants (`src/domain/batch*.ts`,
`src/services/batchSchedule.ts`) réutilisés ; aucun calcul réécrit (L29).

## Entrées
- e7a : `work/missions/2026-11-14-brassins/voies/e7/e7a/etat.html` (la source), ses PNG (Read, chaque état), `NOTE.md` ; défauts non bloquants restants dans `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md`, `k2`, `k3`, `k4` (§ e7a).
- Identité : `work/missions/2026-11-14-brassins/outils/identite/LISEZMOI.md` (les classes de la maquette correspondent aux jetons de l'app) ; DESIGN.md ; `.claude/rules/affinee-frontend.md` (une fois).
- Inventaire du code actuel : `work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` (fichier:ligne par vue), `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md`.
- Banc local : `work/missions/2026-11-14-brassins/voies/a1-banc/banc.mjs` et `fixtures.json` (5 brassins « ZZ ») ; vérification locale : `cerveau/agents/verification-locale.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/production/CatalogAnalysis.tsx`, `src/ui/production/BatchOutcomeAnalysis.tsx`, `src/ui/production/bilan/`, `tests/unit/port-p2-`, et `work/missions/2026-11-14-brassins/voies/p2/` (`RESULTAT.md`, `tests.txt`, `INVENTAIRE.md`, `captures/`, ta copie du banc).
- Hors de ta voie, en lecture seule : La fiche d'un brassin, la liste et ses filtres (choix ouvert), Finances (autre session). Deux autres voies portent en même temps (p1 la fiche, p2 le bilan, p3 la coque) : ne touche rien d'autre.
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json`, le manifeste source4 ; aucun champ Firestore neuf (une donnée que la maquette montre et que le modèle n'a pas : « non mesurée » ou absente, et une ligne « ACCORD : … » dans RESULTAT.md) ; ni commit, ni stash, ni déploiement.

## Consignes
- (15.11, pilote) Vitest ne lit que `tests/unit/**` : tests dans `tests/unit/port-p2-*.test.tsx` (déplacer ceux écrits ailleurs). Les erreurs `tsc` de `functions/` existent sur HEAD : hors voie, ignorées par G1.
1. `INVENTAIRE.md` d'abord : pour chaque maquette, chaque élément visible et chaque geste (L03), avec où il vit dans le code (existe / à créer / à retirer).
2. Porter ; Vitest pour les règles (`tests/unit/port-p2-*.test.tsx`), peu de fixtures ; tests existants des fichiers touchés rejoués.

3. Captures : copie `banc.mjs` dans `work/missions/2026-11-14-brassins/voies/p2/`, serveur sur le port 3102 (`node scripts/with_server.mjs --server "npm run dev -- --port 3102 --strictPort" --port 3102 -- node work/missions/2026-11-14-brassins/voies/p2/banc.mjs`),
   seulement tes vues ; pour chaque état de chaque maquette : `captures/<id>-<état>-app-390-clair.png`, plus cave et 1280 au repos. Ouvre chaque capture (Read) à
   côté de la PNG de la maquette ; liste numérotée des écarts restants dans RESULTAT.md (« combien et quels problèmes ? », D344), puis corrige.
4. Pas de `npm run build` (les autres voies tournent) : `npx tsc --noEmit` et Vitest ; le pilote fait le build.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ;
  hors ligne préservé ; pas de cockpit ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/p2/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/p2/RESULTAT.md » avec ce qui reste.
- La ligne « Tests » écrite dans un fichier : `npx vitest run port-p2 --reporter=dot > work/missions/2026-11-14-brassins/voies/p2/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
