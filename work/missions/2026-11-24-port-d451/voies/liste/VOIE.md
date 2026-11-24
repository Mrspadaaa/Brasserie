# Voie liste — liste en arbre, coup d'œil, saisie rapide, et branchement de toutes les vues (port D451, voie 3)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 150 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ Interfaces, § Ce qui disparaît n° 2, 3, 5, 6, § Risques 1 et 9), puis DOSSIER.md,
  puis les sections « BRANCHEMENT : » des RESULTAT.md des voies probleme et afaire ; ouvre en image
  maquettes3/cap/v01-{liste,saisie,epreuve}.png, maquettes2/cap/v01-liste.png et maquettes3/cap/actuel-liste.png.
- Prérequis : voies domaine, ia, greffe-p2, probleme, afaire commitées.

## Économie
- Mécanique : aucune ; plus de 3 captures à refaire : `DEMANDE EXECUTANT`.
- Gestes (pilote, en ligne, ZZ TEST) : coup d'œil (chaque case filtre) ; Arbre, À faire, 🔔 ; déplier un sous-domaine ;
  ouvrir un problème, un carnet houblons, un mémo ; Résolus 2026 › Relecture ; saisie depuis la liste : texte, photo seule,
  micro ; carte « rangé pour toi » : OK, Changer, Rattacher à…, Annuler ; + volant ; lien collé (barre de lecture et ses
  5 états inchangés) ; hors ligne (message gardé, IA au retour) ; `?carnet=v0` rend l'ancienne liste.

## À faire
1. Inventaire en tête de RESULTAT.md : chaque élément des écrans liste, saisie, epreuve ; son composant ; ce qui disparaît.
2. Liste : coup d'œil 4 cases, filtres, arbre, champ « Une idée, un problème… » avec photo et micro ; « À ranger ».
3. Saisie rapide : feuille « rangé pour toi » (titre, Domaine › …, nouveau problème ou rattaché avec la citation, état,
   tâche proposée), OK · Changer · Rattacher à… ; tout s'annule d'un toucher.
4. Branchement : routes `afaire`, `relecture`, carnet ouvert recomposé ; intentions de la voie domaine dans actionsCarnet ;
   l'ancienne liste joignable par `?carnet=v0` jusqu'à son classement (PLAN § Risques 9).

## Critères
- tsc : aucune erreur neuve ; tests/unit/carnetsListe*.test.ts verts ; tous tests/unit/carnets*, c48..c64Regles,
  port-q4-carnet, lot11Carnet verts (assertions D451 listées) ; `npm run build` vert ; banc `?preview=carnets` : les
  10 écrans de maquettes3 v01 et les 6 de maquettes2 v01 atteints par un vrai parcours ; `git status --short` propre hors
  Possède ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/ListeCarnets.tsx, Domaines.tsx, LigneRangee.tsx, ChampCarnet.tsx, Bandeau.tsx, CadreArrivee.tsx,
NoteEnVrac.tsx, AnciennesNotes.tsx, pictos.tsx, CarnetsVue.tsx, ecransCarnet.tsx, apercuCarnet.tsx, bandeauxCarnet.tsx,
carnetsTypes.ts, useNavigationCarnet.ts, actionsCarnet.ts, useDonneesCarnets.ts, lectureRegles.ts, lignesRegles.ts,
retourCarnet.ts, carnets-liste.css, carnets.css ; neufs ArbreCarnets.tsx, CoupDOeil.tsx, FeuilleRangement.tsx,
listeRegles.ts ; neufs tests/unit/carnetsListe*.test.ts ; assertions D451 n° 2, 3, 5, 6 ; ton dossier de voie. Ne touche
pas les fichiers des autres voies (un manque : `DÉCISION À PRENDRE`). Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil.
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/liste/tests.log 2>&1; tail -5 …/tests.log
