# Voie w1 — TL-7, TL-19, TL-16, T3-11, BK2-5, TE-27 (reprise de tous les ouverts, 20.11)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Assistant de recette (BrewWizard) : NOLO répété et « SG », brouillon repris sans le dire, alerte d'eau rouge à l'ouverture, matériel d'une recette neuve, section Additifs absente (épice), atelier V5.5 entier dans l'étape Houblons. Chaque id de `BUGS-VOIE.md` reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison).
Le brasseur (19.11) : « Corrige tout ». La note de chaque ligne contient souvent la cause et une recommandation (A, B, (c)…) : pars-en, sans refaire l'exploration.
**Choix du brasseur (goût, forme, règle métier)** : prépare la correction quand même — l'option recommandée par la note, ou la lecture la plus étroite et réversible ; jamais redessiner l'écran ni retirer ce que sa maquette choisie montre (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`). Commit à part par défaut, ou derrière un réglage s'il change une forme choisie ; verdict « ouvert — accord requis : <option préparée, sha> » et une ligne « ACCORD : <id> — <question en une ligne> » dans RESULTAT.md.
**Données réelles** : jamais écrites ; prépare seulement le geste (étapes ou script en lecture seule) dans voies/w1/.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `work/missions/2026-11-19-bugs-ecrans/voies/w1/BUGS-VOIE.md`
- Avant chaque défaut : `grep "| <id> |" ../Brasserie/work/missions/BUGS.md` et `git log --all --oneline --grep "<id>" | head` ; s'il est déjà « corrigé » ou en cours dans une autre session, verdict « corrigé | <son sha> | fait par … » ou « ouvert — pris par <session> » et passer.

## Possède (seuls chemins où écrire, avec voies/w1/)
- src/pages/BrewWizard.tsx (t3-corrections y corrige B1-NOTE-3, BR-91, TE-13 : `git status --short src/pages/BrewWizard.tsx` AVANT chaque modification ; s'il est modifié et non commité par une autre session, n'écris pas : mets ton changement en patch dans voies/w1/patches/<id>.diff et verdict « ouvert — patch prêt, BrewWizard occupé » ; s'il est propre, modifie, teste et committe aussitôt, par chemin), src/ui/wizard/**, src/ui/Nolo*.tsx, src/ui/nolo/**, src/ui/water/** (TL-16), src/ui/hopV55/** (TE-27), src/domain/recipeDraft*.ts
- les tests `tests/unit/bugs-w1-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Interdits en plus de COMMUN.md : src/ui/etapeLevure/** ; le travail non commité de E1-1 (src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx) ; ne jamais les écrire ni les committer.
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Commit par chemins, message « Bugs tous (w1) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement, ni de données réelles, ni de Gemini réel ; jamais stash/reset/checkout. Réponse finale au pilote : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; penser en brasseur ; virgule décimale (fr-CH) ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`, puis les lignes « ACCORD : … ».
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/w1/tests.txt 2>&1`.
- Captures APRÈS correctif, 390 tactile et 1280, clair et cave, de chaque écran touché, OUVERTES (Read), dans `voies/w1/captures/` (port 3103 via scripts/with_server.mjs, ?dev-local). Plafond de contexte : à 200 k, écris RESULTAT.md à jour et rends « REPRISE : voies/w1/RESULTAT.md ».
