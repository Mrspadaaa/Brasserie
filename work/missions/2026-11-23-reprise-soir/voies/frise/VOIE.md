# Voie frise — reconstruire le cœur de la frise du Calendrier (D444)

Lis : ../../COMMUN.md (sauf la copie : TA copie est `C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal`, branche claude/lot-cal ;
crée-la si elle n'existe plus : `git worktree add ../lot-cal claude/lot-cal`) ; work/missions/2026-11-23-calendrier-en-ligne/VOIE-LOT-CAL.md
(contrat court, fait foi ; ne lis pas l'historique) ; ETAT-DES-TACHES.md § Calendrier ; D444 dans work/refonte-frontend/decisions.md ; lignes
CAL-ETAT-COHERENT, CAL-TOUCHER-GRADUATION, CAL-ETIQUETTE-GRAIN-AU-DESSUS, CAL-GRADUATION-ROGNEE de work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md.

## Départ
Dans lot-cal : `git merge --no-edit origin/main` (main = 06c430228). Conflit : le dire, ne rien jeter. node_modules : s'il manque, jonction vers
../Brasserie/node_modules (PowerShell New-Item -ItemType Junction).

## À faire
0. Inventaire écrit (INVENTAIRE.md dans ton dossier de voie) de TOUTES les fonctions et gestes de la frise et de son en-tête actuels
   (CalendrierTab.tsx, domain/calendrier.ts, ui/calendrier/**) : aucun ne doit être perdu. L'écran ne change pas (ses choix).
1. Cœur reconstruit : échelle de temps standard (d3-scale scaleTime + d3-time), UN seul état (période, vue, cadre) dont tout l'affichage
   est dérivé ; `fenetre`, `periodeLocale`, `vue`, `echelleVoulue`, `fenetreAvant` et le cadre de l'en-tête unifiés. Découper CalendrierTab.tsx et
   domain/calendrier.ts au passage.
2. Test par modèle e2e/calendrier/etat-coherent.spec.ts : ajouter les gestes manquants (plage de plusieurs années, poignées tenues longtemps)
   et l'invariant « axe ⊇ cadre » ; il doit reproduire « 24 sem. pour 4 ans » sur l'ancien cœur (rouge), vert sur le nouveau.
3. CAL-TOUCHER-GRADUATION, CAL-ETIQUETTE-GRAIN-AU-DESSUS (« S52 2026 – S1 2027 » en jours), CAL-GRADUATION-ROGNEE, « J A J O » sans année à 3 ans.
4. N'écris pas dans entete/BandeSemaines.tsx sauf si plus aucun autre agent n'y travaille (vérifie `git log -3 -- <fichier>` et la date).

## Critères
- `npx tsc --noEmit -p .` → 0 ; tests unitaires calendrier verts ; etat-coherent.spec (ETAT_RUNS=200) vert ; témoin rouge sur l'ancien cœur noté.
- `node scripts/parcours/calendrier.mjs <dossier>` → OK ; captures 390 avant/après des vues 3 sem., 6 sem., 3 ans, 4 ans, toutes ouvertes,
  identiques hormis les défauts corrigés.
- Commits dans claude/lot-cal ; fin : « PRÊT À METTRE EN LIGNE <hash> ». Pas de déploiement.

OWNS (dans lot-cal) : src/ui/calendrier/** (sauf entete/BandeSemaines.tsx), src/domain/calendrier*.ts et src/domain/calendrier/**, src/ui/CalendrierTab.tsx
ou son chemin réel, e2e/calendrier/**, tests calendrier ; ton dossier de voie (dans Brasserie). maxTurns 120.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : après chaque étape finie, une ligne (fait, preuve, commit).
- Tests : sortie écrite dans un fichier, jamais dans le contexte : `npx vitest run <fichiers> --reporter=dot > voies/frise/tests.log 2>&1; tail -5 voies/frise/tests.log`.
