# Voie agenda — Bord › Agenda : le nom ouvre la feuille de la ligne sur place (T29-4)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 60 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote.
- Gestes : lectures par grep ciblé ; un script par lot.

## À faire
1. Toucher le nom d'une ligne de Bord › Agenda ouvre sa feuille (Modifier) sur place ; fermer ramène au Bord ; seule la case coche « Fait ».
2. Réemployer la feuille du Calendrier si elle convient ; sinon le plus petit branchement (id de l'item porté jusqu'à son éditeur).
3. Test de la règle « nom → feuille, case → fait », rouge puis vert.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues) ; tests touchés verts. Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/components/DashboardTab.tsx (ou le chemin réel de Bord › Agenda) ; src/App.tsx (le seul branchement de navigation) ; src/components/CreativeLabTab.tsx (ouverture de l'éditeur par id) ; tests/unit/ (fichier agenda que tu crées) ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/agenda/tests.log 2>&1; tail -5 voies/agenda/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote.
