# Voie greffe-p2 — articles, fiche, tableaux houblons et matériel, Comparer (passe 2 v01 telle quelle) (port D451, voie 6)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ Ce qui disparaît n° 7, § Interfaces), puis DOSSIER.md ; ouvre en image les paires
  maquettes2/cap/actuel-*.png et v01-*.png citées au DOSSIER.
- Prérequis : voie domaine commitée.

## Économie
- Mécanique : aucune ; si plus de 3 captures à refaire, `DEMANDE EXECUTANT` (consigne auteur).
- Gestes (pilote, en ligne, ZZ TEST) : glisser une carte (Déplacer, Retirer) ; ouvrir la fiche ; Comparer avec et sans
  critère ; déplier les égaux ; Choisir ; Escalader et Relire inchangés.

## À faire
1. Inventaire en tête de RESULTAT.md, écran par écran (carnet houblons, chambre froide, articles, fiche, Comparer avec
   critère, sans critère) : ce que la maquette a, ce que l'app a déjà (beaucoup est porté : c59, c61, prix-houblon), l'écart.
2. Porter l'écart, rien d'autre ; garder les signatures exportées de `TableauCarnet` et `rubriqueArticles` (props neuves
   facultatives seulement).
3. Règles de colonnes et d'ordre dans `tableauRegles.ts` (testables), pas dans le .tsx.

## Critères
- tsc : aucune erreur neuve ; tests/unit/carnetsGreffeP2*.test.ts verts ; c48..c64Regles, carnetsComparer*, carnets* verts ;
  `npm run build` vert ; `git status --short` propre hors Possède ; commit par chemins ; fin « PRÊT <hash> ».

OWNS : src/ui/carnets/TableauCarnet.tsx, ArticlesCarnet.tsx, CarteArticle.tsx, FicheArticle.tsx, FeuilleCartes.tsx,
Comparer.tsx, Choisir.tsx, PrixPastille.tsx, carnets-decider.css ; neuf src/ui/carnets/tableauRegles.ts ; neufs
tests/unit/carnetsGreffeP2*.test.ts ; assertions D451 n° 7 des tests existants ; ton dossier de voie. Lis
src/domain/carnets/comparer.ts, prixRendu.ts, prixUnitaire.ts sans y écrire (une règle de calcul fausse :
`DÉCISION À PRENDRE`). Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil.
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/greffe-p2/tests.log 2>&1; tail -5 …/tests.log
