# Dossier c67-tests — règles tirées du test en ligne du tour 67 (voies/critique-67/RESULTAT.md), port D451

Lignes : `grep -n "^| C67-" work/missions/BUGS.md`. Maquette : work/missions/2026-11-24-carnet-workflow/maquettes3/v01.html (règle n° 1) ; verdict D451 : work/missions/2026-11-24-carnet-workflow/D451/VERDICT.md § 4.
- R56 (C67 liste) : chaque problème de la liste porte sa jauge d'état (4 pastilles), son état en mot et son dernier pas, comme v01.
- R57 (rangement) : « rangé pour toi » range un problème de matériel au brassage (vapeur, fuite, fusible…) en Brasserie › Brassage (ou la catégorie matérielle), genre problème ; jamais « Local · idée ». La règle se tire du SENS (mots du matériel et du brassage), pas de l'exemple : teste au moins 3 phrases neuves (pas de vapeur).
- R58 : changer le genre ou l'état d'un carnet ouvert se voit AUSSITÔT, sans sortir et revenir.
- R59 : le coût d'un problème ne somme pas des options ALTERNATIVES ; il dit le coût de la retenue (ou une fourchette des pistes), jamais la somme.
- R60 : le Résolu montre les options fermées avec leur raison (v01, greffe v05).
- R61 : dater une tâche (« appeler l'électricien ») ne crée JAMAIS un achat dans À venir ; seule une tâche d'achat avec un coût y va, à la date donnée (pas « aujourd'hui » par défaut si une date est choisie).
- R62 : les m et les écarts restants C67-n.
La double rangée d'onglets (C67) relève de la voie onglets du port, hors de ces tests.
Code : src/ui/carnets/, src/domain/carnets/ (suivi, fil, taches, arbre), src/domain/carnets/ia.ts, analyseLocale.ts.
