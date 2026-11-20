# Voie r2 — BK2-1, BK2-2, BK2-3, BK2-4, BK2-6, BR-100, BE-53, RJ-14, TE-53, TE-54, GE-NOTE-5 (reprise de tous les ouverts, 20.11)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Fiche de recette, atelier houblons, levure et conduite (hors src/ui/etapeLevure) : étiquettes de l'empâtage, « Produit exact non choisi », « AVANT », jargon du catalogue de levures, contraste d'« Appliquer », deux boutons de conduite, « À préciser » qui déborde, atelier V5.5 ouvert depuis Stocks (prose de développeur), collision de deux auteurs à relire. Chaque id de `BUGS-VOIE.md` reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (raison).
Le brasseur (19.11) : « Corrige tout ». La note de chaque ligne contient souvent la cause et une recommandation (A, B, (c)…) : pars-en, sans refaire l'exploration.
**Choix du brasseur (goût, forme, règle métier)** : prépare la correction quand même — l'option recommandée par la note, ou la lecture la plus étroite et réversible ; jamais redessiner l'écran ni retirer ce que sa maquette choisie montre (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`). Commit à part par défaut, ou derrière un réglage s'il change une forme choisie ; verdict « ouvert — accord requis : <option préparée, sha> » et une ligne « ACCORD : <id> — <question en une ligne> » dans RESULTAT.md.
**Données réelles** : jamais écrites ; prépare seulement le geste (étapes ou script en lecture seule) dans voies/r2/.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `work/missions/2026-11-19-bugs-ecrans/voies/r2/BUGS-VOIE.md`
- Avant chaque défaut : `grep "| <id> |" ../Brasserie/work/missions/BUGS.md` et `git log --all --oneline --grep "<id>" | head` ; s'il est déjà « corrigé » ou en cours dans une autre session, verdict « corrigé | <son sha> | fait par … » ou « ouvert — pris par <session> » et passer.

## Possède (seuls chemins où écrire, avec voies/r2/)
- src/ui/recette/Dessins.tsx, src/domain/hopStage.ts, src/ui/YeastCataloguePanel.tsx, src/ui/YeastRecipeWorkbench.tsx, src/ui/YeastPitchingPanel.tsx, src/ui/NoloRecipeSimulator.tsx, src/ui/FermentationWorkshop.tsx, src/ui/conduite/**, src/ui/hopIndex/** (TE-53, TE-54 ; l'atelier V5.5 : src/ui/hopV55/** appartient à w1, ne pas y écrire), src/ui/identite/** (BK2-6)
- les tests `tests/unit/bugs-r2-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- Interdits en plus de COMMUN.md : src/ui/etapeLevure/** ; le travail non commité de E1-1 (src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx) ; ne jamais les écrire ni les committer.
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Commit par chemins, message « Bugs tous (r2) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement, ni de données réelles, ni de Gemini réel ; jamais stash/reset/checkout. Réponse finale au pilote : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; penser en brasseur ; virgule décimale (fr-CH) ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`, puis les lignes « ACCORD : … ».
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/r2/tests.txt 2>&1`.
- Captures APRÈS correctif, 390 tactile et 1280, clair et cave, de chaque écran touché, OUVERTES (Read), dans `voies/r2/captures/` (port 3104 via scripts/with_server.mjs, ?dev-local). Plafond de contexte : à 200 k, écris RESULTAT.md à jour et rends « REPRISE : voies/r2/RESULTAT.md ».
