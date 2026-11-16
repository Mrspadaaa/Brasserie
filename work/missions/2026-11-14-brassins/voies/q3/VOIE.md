# Voie q3 — Port du carnet et du dossier d'un brassin, notes rangées par l'IA (e3gb)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : son choix (fait) · Décideur : pilote

## Objectif
Ses choix (15.11, mot pour mot dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`) : « Carnet : e3gb » = e3gb, les rubriques Carnet et Dossier de la fiche ; les notes en vrac rangées par l'IA la moins chère, proposées, validées par lui.
Règle n° 1 (CLAUDE.md) : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Porter chaque maquette TELLE QUELLE
dans l'app, chaque état et chaque geste, branchée sur les vraies données et le vrai code (L03, L11) : ce qu'elle n'a pas, le port le retire.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons (`src/theme/themes.css`) et fonctions du domaine existants (`src/domain/batch*.ts`,
`src/services/batchSchedule.ts`) réutilisés ; aucun calcul réécrit (L29).

## Entrées
- e3gb : `work/missions/2026-11-14-brassins/voies/e3g/e3gb/etat.html` (la source), ses PNG (Read, chaque état), `NOTE.md` ; défauts non bloquants restants dans `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md`, `k2`, `k3`, `k4` (§ e3gb).
- Identité : `work/missions/2026-11-14-brassins/outils/identite/LISEZMOI.md` (les classes de la maquette correspondent aux jetons de l'app) ; DESIGN.md ; `.claude/rules/affinee-frontend.md` (une fois).
- Inventaire du code actuel : `work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` (fichier:ligne par vue), `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md`.
- Banc local : `work/missions/2026-11-14-brassins/voies/a1-banc/banc.mjs` et `fixtures.json` (5 brassins « ZZ ») ; vérification locale : `cerveau/agents/verification-locale.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/production/carnet/`, `src/ui/BatchDetailSheet.tsx (rubriques Carnet et Dossier seulement)`, `tests/unit/port-q3-`, et `work/missions/2026-11-14-brassins/voies/q3/` (`RESULTAT.md`, `tests.txt`, `INVENTAIRE.md`, `captures/`, ta copie du banc).
- Hors de ta voie, en lecture seule : La rubrique Mesures et l'état en fermentation (voie q1 en même temps) ; le moteur d'IA lui-même. Trois autres voies portent en même temps (q1 fermentation, q2 liste, q3 carnet, q4 Atelier) : ne touche rien d'autre ; dans un fichier partagé, relis juste avant chaque Edit.
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json`, le manifeste source4 ; aucun champ Firestore neuf (une donnée que la maquette montre et que le modèle n'a pas : « non mesurée » ou absente, et une ligne « ACCORD : … » dans RESULTAT.md) ; ni commit, ni stash, ni déploiement.

## Consignes
- Les dépendances se résolvent depuis le node_modules du dossier parent du dépôt (le banc tourne). Les erreurs tsc de `functions/` existent sur HEAD : ignorées par G1. Économise le contexte : fichiers par sections (grep, sed -n), sorties filtrées, chaque PNG une fois ; lis l'etat.html de la maquette par sections.
1. `INVENTAIRE.md` d'abord : pour chaque maquette, chaque élément visible et chaque geste (L03), avec où il vit dans le code (existe / à créer / à retirer).
2. Porter ; Vitest pour les règles (`tests/unit/port-q3-*.test.tsx`), peu de fixtures ; tests existants des fichiers touchés rejoués.
- IA : passer par le service d'IA existant (`grep -rn "aiTask|flash-lite" src/services | head`), le modèle le moins cher déjà configuré ;
  JAMAIS d'appel réel dans un test (simulé, cerveau/agents/gemini-tests-reels.md) ; hors ligne : la note reste en vrac. Une proposition n'est
  jamais appliquée sans son geste. Si le service exige une fonction serveur neuve ou un réglage facturé : « ACCORD : … » dans RESULTAT.md, et
  l'interface branchée sur une réponse simulée derrière un drapeau éteint.
3. Captures : copie `banc.mjs` dans `work/missions/2026-11-14-brassins/voies/q3/`, serveur sur le port 3113 (`node scripts/with_server.mjs --server "npm run dev -- --port 3113 --strictPort" --port 3113 -- node work/missions/2026-11-14-brassins/voies/q3/banc.mjs`),
   seulement tes vues ; pour chaque état de chaque maquette : `captures/<id>-<état>-app-390-clair.png`, plus cave et 1280 au repos. Ouvre chaque capture (Read) à
   côté de la PNG de la maquette ; liste numérotée des écarts restants dans RESULTAT.md (« combien et quels problèmes ? », D344), puis corrige.
4. Pas de `npm run build` (les autres voies tournent) : `npx tsc --noEmit` et Vitest ; le pilote fait le build.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ;
  hors ligne préservé ; pas de cockpit ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/q3/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/q3/RESULTAT.md » avec ce qui reste.
- La ligne « Tests » écrite dans un fichier : `npx vitest run port-q3 --reporter=dot > work/missions/2026-11-14-brassins/voies/q3/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
