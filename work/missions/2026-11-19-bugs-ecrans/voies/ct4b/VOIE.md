# Voie ct4b — critique de vision du tour 4, Recettes et Brassins (n° 4, 5, 6, 12, 13, 14, 15)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Recettes et éditeur : aperçu qui s'ouvre sur le stock, carte Houblons de la fiche sans unités, carte d'ajout de l'étape Houblons incomplète, + qui recouvre l'Identité à 390, éditeur à 844×340, colonne gauche vide des Recettes à 1280, largeur qui change à chaque étape. Chaque id de `BUGS-VOIE.md` reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison). Les bloquants d'abord.
Rapport complet, captures citées et doutes : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-20-critique-tour4/b-recettes-brassins.md` (captures relatives au dossier de ce rapport). Lis-le d'abord, sections Problèmes, Comparaison et Doutes.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- le rapport ci-dessus ; `voies/ct4b/BUGS-VOIE.md`

## Possède (seuls chemins où écrire, avec voies/ct4b/)
- src/pages/RecipePage.tsx, src/ui/recette/**, src/ui/production/recettes/**, src/ui/hopIndex/** (carte de la fiche), src/ui/wizard/**, src/ui/floating-actions.css, src/ui/page-shell.css, src/pages/BrewWizard.tsx (une autre voie y retire l'atelier V5.5 : `git status --short src/pages/BrewWizard.tsx` juste avant chaque Edit ; modifié par une autre session → attends la fin de ta voie pour ce point ou rends « ouvert — BrewWizard occupé »)
- les tests `tests/unit/bugs-ct4b-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Interdits : src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx (travail non commité d'une autre session). Avant chaque fichier : `git status --short <fichier>` ; modifié et non commité par une autre session → n'écris pas, verdict « ouvert — fichier occupé ».
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Une valeur fausse se corrige à la source (même calcul que la fiche, jamais un second calcul). Commit par chemins, message « Bugs tour 4 (ct4b) : CT4-B-n — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement, de données réelles ni de Gemini réel ; jamais stash/reset/checkout. Réponse finale : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; penser en brasseur : houblon = nom, α, rôle, arômes, moment et dose, puis IBU (L04) ; virgule décimale ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- CT4-B-n | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/ct4b/tests.txt 2>&1`.
- Captures APRÈS correctif, 390 tactile et 1280 (et 844×340 pour le n° 13), clair et cave, OUVERTES (Read), dans `voies/ct4b/captures/` (port 3111 via scripts/with_server.mjs, ?dev-local). Plafond : à 200 k, RESULTAT.md à jour et « REPRISE : voies/ct4b/RESULTAT.md ».
