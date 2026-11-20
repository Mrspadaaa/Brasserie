# Voie f1 — T3B-6, T3B-11, T3B-12 (test en ligne passe 4, 20.11)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Fiche de recette (Milk Stout) : IBU « durée d'ébullition à compléter » malgré 60′, « aucun brassin » malgré LOT-001, lactose et Whirlfloc rangés sous Houblons, noms de malts abîmés (encodage). Chaque id de `BUGS-VOIE.md` (hors « lignes liées ») reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (accord requis, hors voie).
Ces défauts ont été vus EN LIGNE le 20.11 sur le tag tour3 (d95d69dfc), qui contient déjà nos correctifs du 19.11 : le correctif précédent (commit de la ligne liée) n'a pas suffi. Lire `work/missions/2026-11-18-choix-calendrier/tour2/en-ligne/RAPPORT-4.md` (Brasserie : `git -C ../Brasserie show c3d2ed733:work/missions/2026-11-18-choix-calendrier/tour2/en-ligne/RAPPORT-4.md`) pour le constat exact. Reproduire avec des données comme celles du brasseur (recette importée, vrais noms), pas sur une fixture qui évite le cas.
Le brasseur (19.11) : « Corrige tout ». Goût non tranché : lecture la plus étroite et réversible (renommer en mots de brasseur, replier le technique derrière un dépliant), jamais redessiner l'écran ; notée dans le verdict.

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `work/missions/2026-11-19-bugs-ecrans/voies/f1/BUGS-VOIE.md`
- Avant chaque défaut : `grep "| <id> |" ../Brasserie/work/missions/BUGS.md` ; s'il est déjà « corrigé » par une autre session, verdict « corrigé | <son sha> | déjà fait par … » et passer.

## Possède (seuls chemins où écrire, avec voies/f1/)
- src/pages/RecipePage.tsx, src/ui/hopIndex/HopRecipeWorkbench.tsx, src/ui/hopIndex/suggerer/**, src/ui/hopIndex/biere/**, src/services/hopV55/**, src/ui/recipe/**, src/domain/recipeImport/**, src/services/recipeImport*, src/domain/recipe*.ts
- les tests `tests/unit/bugs-f1-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
Hors de cette liste : ne pas écrire ; verdict « ouvert — hors voie : <fichier>, changement exact ».

## Consignes
COMMUN.md. Test qui échoue d'abord (L13), puis correctif, puis vitest. Commit par chemins, message « Bugs T3B (f1) : <id> — … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Jamais de déploiement, ni de données réelles. Réponse finale au pilote : une ligne.

## Exigences transversales et acquis (L05, L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan (« pas de cockpit ») ; penser en brasseur ; virgule décimale (fr-CH) ; jamais type="number" ; échelle de DESIGN.md.

## Critères
`GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : `- <id> | corrigé|écarté|ouvert | <sha ou —> | <note>`.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/f1/tests.txt 2>&1`.
- Captures 390 tactile et 1280, clair et cave, de chaque écran touché, APRÈS correctif, ouvertes, dans `voies/f1/captures/` (port 3108 via scripts/with_server.mjs). Si la capture demande trop de tours, `DEMANDE EXECUTANT :` dans RESULTAT.md (quoi capturer, où, comment).
