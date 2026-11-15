# Voie p3 — Port de la coque de l'onglet (e11a) et d'Adapter les volumes (e10c), filtre de période

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 70 tours · Dépend de : son choix (fait) · Décideur : pilote

## Objectif
Ses choix (15.11, mot pour mot dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`) : « e11a — e10c » = e11a, la coque de l'onglet Brassins : sous-onglets, compteurs, bouton d'action ; « e11a — e10c » = e10c, Adapter les volumes : recette source, volume cible, facteur, eaux, ingrédients, volume refusé, carnet vide.
Règle n° 1 (CLAUDE.md) : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Porter chaque maquette TELLE QUELLE
dans l'app, chaque état et chaque geste, branchée sur les vraies données et le vrai code (L03, L11) : ce qu'elle n'a pas, le port le retire.

## État de l'art
Port d'interface sans algorithme neuf : composants, jetons (`src/theme/themes.css`) et fonctions du domaine existants (`src/domain/batch*.ts`,
`src/services/batchSchedule.ts`) réutilisés ; aucun calcul réécrit (L29).

## Entrées
- e11a : `work/missions/2026-11-14-brassins/voies/e11/e11a/etat.html` (la source), ses PNG (Read, chaque état), `NOTE.md` ; défauts non bloquants restants dans `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md`, `k2`, `k3`, `k4` (§ e11a).
- e10c : `work/missions/2026-11-14-brassins/voies/e10/e10c/etat.html` (la source), ses PNG (Read, chaque état), `NOTE.md` ; défauts non bloquants restants dans `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md`, `k2`, `k3`, `k4` (§ e10c).
- Identité : `work/missions/2026-11-14-brassins/outils/identite/LISEZMOI.md` (les classes de la maquette correspondent aux jetons de l'app) ; DESIGN.md ; `.claude/rules/affinee-frontend.md` (une fois).
- Inventaire du code actuel : `work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` (fichier:ligne par vue), `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md`.
- Banc local : `work/missions/2026-11-14-brassins/voies/a1-banc/banc.mjs` et `fixtures.json` (5 brassins « ZZ ») ; vérification locale : `cerveau/agents/verification-locale.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/components/tabs/ProductionTab.tsx`, `src/ui/production/volumes/`, `tests/unit/port-p3-`, `src/App.tsx (lignes du filtre de période seulement)`, et `work/missions/2026-11-14-brassins/voies/p3/` (`RESULTAT.md`, `tests.txt`, `INVENTAIRE.md`, `captures/`, ta copie du banc).
- Hors de ta voie, en lecture seule : Le contenu des sous-onglets Recettes et Atelier R&D (choix ouverts), la liste des brassins et ses filtres (choix ouvert), `fabActions.ts`, Finances, Stock. Deux autres voies portent en même temps (p1 la fiche, p2 le bilan, p3 la coque) : ne touche rien d'autre.
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json`, le manifeste source4 ; aucun champ Firestore neuf (une donnée que la maquette montre et que le modèle n'a pas : « non mesurée » ou absente, et une ligne « ACCORD : … » dans RESULTAT.md) ; ni commit, ni stash, ni déploiement.

## Consignes
- (15.11, pilote) Vitest ne lit que `tests/unit/**` : tests dans `tests/unit/port-p3-*.test.tsx` (déplacer ceux écrits ailleurs). Les erreurs `tsc` de `functions/` existent sur HEAD : hors voie, ignorées par G1.
1. `INVENTAIRE.md` d'abord : pour chaque maquette, chaque élément visible et chaque geste (L03), avec où il vit dans le code (existe / à créer / à retirer).
2. Porter ; Vitest pour les règles (`tests/unit/port-p3-*.test.tsx`), peu de fixtures ; tests existants des fichiers touchés rejoués.
- Filtre de période (`src/App.tsx:171-172`, `COUVERTURE.md` ligne « Période de l'application ») : « Ce mois » par défaut cache 3 brassins
  sur 5 au banc. Correctif étroit et réversible (L01) : un brassin en cours (planifié, en fermentation, en garde) reste visible quelle que soit
  la période ; la période ne filtre que les terminés. Test qui échoue sur HEAD, puis passe.
3. Captures : copie `banc.mjs` dans `work/missions/2026-11-14-brassins/voies/p3/`, serveur sur le port 3103 (`node scripts/with_server.mjs --server "npm run dev -- --port 3103 --strictPort" --port 3103 -- node work/missions/2026-11-14-brassins/voies/p3/banc.mjs`),
   seulement tes vues ; pour chaque état de chaque maquette : `captures/<id>-<état>-app-390-clair.png`, plus cave et 1280 au repos. Ouvre chaque capture (Read) à
   côté de la PNG de la maquette ; liste numérotée des écarts restants dans RESULTAT.md (« combien et quels problèmes ? », D344), puis corrige.
4. Pas de `npm run build` (les autres voies tournent) : `npx tsc --noEmit` et Vitest ; le pilote fait le build.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots ; cibles ≥ 44 px ; deux thèmes ; 390 tactile et 1280 ;
  hors ligne préservé ; pas de cockpit ; Gemini jamais réel dans un test.

## Critères
`work/missions/2026-11-14-brassins/voies/p3/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil ; vers 150 k de contexte, rendre « REPRISE : work/missions/2026-11-14-brassins/voies/p3/RESULTAT.md » avec ce qui reste.
- La ligne « Tests » écrite dans un fichier : `npx vitest run port-p3 --reporter=dot > work/missions/2026-11-14-brassins/voies/p3/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
