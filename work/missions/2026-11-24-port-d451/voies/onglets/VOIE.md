# Voie onglets — Stocks › Matériel en une seule rangée « Matériel ▾ · Parc · À venir · Carnets · Réalisés » (port D451, voie 7)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 60 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ Ce qui disparaît n° 1), puis DOSSIER.md.
- Prérequis : voie liste en ligne et regardée par le pilote. Hors Carnet : dernière, à part, un seul commit révocable.

## Économie
- Mécanique : aucune.
- Gestes (pilote, en ligne) : depuis Matériel, ▾ ouvre Articles, Recompter, Courses, Fûts (chacun atteint, puis retour) ;
  Parc, À venir, Carnets, Réalisés ; le bouton d'action suit le sous-onglet (`onSubTabChange`) ; « Ouvrir le carnet »
  depuis À venir et le calendrier (`openCarnetRequest`) ; 390 et 1280.

## À faire
1. Plan court en tête de RESULTAT.md : les deux rangées actuelles, ce qui change, ce qui ne change pas.
2. Dans Matériel seulement : une rangée ; ailleurs (Articles, Recompter, Courses, Fûts) la rangée actuelle, inchangée.
3. Un seul drapeau en tête de fichier (`MATERIEL_UNE_RANGEE = true`) : le mettre à `false` rend l'état d'avant.

## Critères
- tsc : aucune erreur neuve ; tests existants de Stocks verts (grep `StocksTab` dans tests/) ; `npm run build` vert ;
  `controle-choix.mjs` sans écart neuf ; `git status --short` propre hors Possède ; commit par chemins ; fin « PRÊT <hash> ».

OWNS : src/components/tabs/StocksTab.tsx (la rangée de Matériel et le drapeau seulement) ; ton dossier de voie. Ne touche
ni src/ui/stock ni src/ui/carnets. Ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil.
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/onglets/tests.log 2>&1; tail -5 …/tests.log
