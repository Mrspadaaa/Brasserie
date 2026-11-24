# Voie probleme — carnet ouvert : en-tête du genre, fil, Je cherche, Décidé, Résolu, Relecture (port D451, voie 4)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 150 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ Modèle, § Interfaces, § Ce qui disparaît n° 4, 5, 6, 8), puis DOSSIER.md ; ouvre
  en image maquettes3/cap/v01-{vapeur,fuite,resolu,relecture,co2,malt}.png, v05-resolu.png, v03-resolu.png,
  maquettes2/cap/v01-{memo,recolte,idee,probleme}.png et maquettes3/cap/actuel-probleme.png.
- Prérequis : voie domaine commitée. La voie greffe-p2 peut tourner en même temps : n'importe que les signatures
  actuelles de `TableauCarnet` et `rubriqueArticles`.

## Économie
- Mécanique : aucune ; plus de 3 captures à refaire : `DEMANDE EXECUTANT`.
- Gestes (pilote, en ligne, ZZ TEST) : changer d'état dans les deux sens (4 × 4), Rouvrir ; option : piste, veille,
  écarter (raison), retenir, écarter une 2e fois ; carte « tâche proposée » À faire et Plus tard ; « Fermer grâce à
  l'achat ? » Oui et Annuler ; « Pourquoi B plutôt que A ? · Ajouter » ; « Toujours le bon choix ? » Oui et Pas sûr ;
  changer la photo avant / après ; écrire dans le champ « Ajouter à … » (le message reste dans ce carnet) ; hors ligne.

## À faire
1. Inventaire en tête de RESULTAT.md : chaque écran de la maquette (base et greffes 2, 3), chaque élément, son composant.
2. Composants neufs et `CarnetOuvert` recomposé : en-tête du genre, barre d'état, options, fil, blocs Résolu et Relecture.
3. Retouches du VERDICT : options en deux colonnes à 50 %, libellés entiers ; « ≈ 910 CHF » dans la rangée des jetons.
4. Ce qui disparaît n° 4, 5 (dans CarnetOuvert), 6 (crayon visible ; « Renommer » reste au menu ⋯), 8 (rendu).

## Critères
- tsc : aucune erreur neuve ; tests/unit/carnetsProbleme*.test.ts verts ; lot3CarnetOuvert, c48..c64Regles, carnets* verts
  (assertions D451 listées) ; `npm run build` vert ; banc `?preview=carnets` : chaque écran de la maquette atteint ;
  `git status --short` propre hors Possède ; commit par chemins ; fin « PRÊT <hash> ».

OWNS : src/ui/carnets/CarnetOuvert.tsx, RubriqueQuand.tsx, CriteresCarnet.tsx, FeuilleNote.tsx, RenommerCarnet.tsx,
Photos.tsx, ouvertCalculs.ts, carnetOuvertTypes.ts, histoireCarnet.ts, photo.ts, carnets-fil.css ; neufs EnTeteGenre.tsx,
FilCarnet.tsx, BarreEtat.tsx, OptionsProbleme.tsx, ResoluProbleme.tsx, RelectureResolus.tsx, QuestionPourquoi.tsx,
filRegles.ts ; neufs tests/unit/carnetsProbleme*.test.ts ; assertions D451 n° 4, 5, 6, 8 ; ton dossier de voie.
Ne touche pas CarnetsVue, ecransCarnet, actionsCarnet, carnetsTypes (voie liste : décris dans RESULTAT les rappels et
routes dont tu as besoin, sous « BRANCHEMENT : »). Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil.
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/probleme/tests.log 2>&1; tail -5 …/tests.log
