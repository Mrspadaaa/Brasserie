# Voie afaire — À faire (cette semaine, fin du mois, un jour) et la carte « À ranger » des imprévus (port D451, voie 5)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ Modèle : `taches`, § Décision « photo seule »), puis DOSSIER.md ; ouvre en image
  maquettes3/cap/v01-afaire.png et v01-epreuve.png.
- Prérequis : voie domaine commitée.

## Économie
- Mécanique : aucune.
- Gestes (pilote, en ligne, ZZ TEST) : cocher et décocher une tâche ; toucher une ligne (ouvre son problème) ; changer
  l'échéance ; achat daté → paraît dans À venir et au Calendrier, puis retiré ; carte « À ranger » : Oui, Nouveau
  problème, Laisser ; hors ligne.

## À faire
1. Plan court en tête de RESULTAT.md : éléments des deux écrans, composant, règle, test.
2. `AFaire` (vue) et `CarteARanger` (carte) exportés pour la voie liste, contrôlés par props (aucun magasin lu).
3. Règles dans `afaireRegles.ts` (libellés de groupe, coût, lien À venir).

## Critères
- tsc : aucune erreur neuve ; tests/unit/carnetsAFaire*.test.ts verts ; carnets*, planning-vers-carnet, c48..c64Regles
  verts ; `npm run build` vert ; `git status --short` propre hors Possède ; commit par chemins ; fin « PRÊT <hash> ».

OWNS : neufs src/ui/carnets/AFaire.tsx, CarteARanger.tsx, afaire.css, afaireRegles.ts ; neufs
tests/unit/carnetsAFaire*.test.ts ; ton dossier de voie. Lis operations.ts (`planAuCalendrier`, `planSuitCarnet`,
`idPlanDuCarnet`) sans y écrire. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil ; « BRANCHEMENT : » liste les props et rappels que la voie liste doit fournir.
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/afaire/tests.log 2>&1; tail -5 …/tests.log
