# Voie b1 — défauts ouverts (16)

- Mission : 2026-11-19-bugs-ecrans
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Chaque ligne de `BUGS-VOIE.md` (même dossier) reçoit un verdict prouvé dans `RESULTAT.md` : corrigé (commit), écarté (raison) ou ouvert (accord requis, hors voie).

## Entrées
- `work/missions/2026-11-19-bugs-ecrans/COMMUN.md` — méthode, interdits, format du verdict : À LIRE EN PREMIER
- `work/missions/2026-11-19-bugs-ecrans/voies/b1/BUGS-VOIE.md` — tes défauts, ligne complète (constat, note, captures citées)
- `work/missions/BUGS.md` — seulement pour un grep par id d'une ligne liée ; ne pas l'éditer

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- src/pages/BrewDayPage.tsx, src/pages/brew-day.css, src/ui/Brew*.tsx (sauf BrewerBudget.tsx), src/ui/brew-*.css, src/ui/companion/**, src/ui/lot/**, src/ui/production/**, src/ui/atelier/**, src/ui/BatchDetailSheet.tsx, src/ui/equipment/**, src/components/tabs/Brassins*, src/ui/FermentationTemperatureChart.tsx (BE-42 seulement ; touché par ma-levure : git status d'abord)
- les tests `tests/unit/bugs-b1-*.test.ts(x)` que tu crées, et un test existant du fichier que tu corriges
- `work/missions/2026-11-19-bugs-ecrans/voies/b1/`
Hors de cette liste : ne pas écrire ; si un correctif l'exige, verdict « ouvert — hors voie : <fichier> ».

## Consignes
Voir COMMUN.md. Réponse finale au pilote : une ligne.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Sa maquette choisie reste la base (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`) : corriger le défaut, jamais redessiner.
- Inconnu ≠ 0 ; peu de texte au premier plan ; penser en brasseur ; virgule décimale (fr-CH) ; jamais type="number" ; échelle de DESIGN.md.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (mis à jour tous les 3 défauts) : une limite de tours ne perd rien.
- `tests.txt` : `npx vitest run <tes tests et ceux des fichiers touchés> --reporter=dot > work/missions/2026-11-19-bugs-ecrans/voies/b1/tests.txt 2>&1`.
- Captures 390 tactile et 1280, clair et cave, de chaque écran touché, ouvertes, dans `voies/b1/captures/`.
