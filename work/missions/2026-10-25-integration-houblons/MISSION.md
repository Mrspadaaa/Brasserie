# Mission 2026-10-25-integration-houblons

## Objectif
La porte B s'ouvre. Ses mots, le 24.10 dans la nuit : « En attendant les variations dryhopping et mon choix dessu. Tu peux
commencer la mise en place pour l'intégration dans la vrai application. Faire une liste des tâche, mettre à jour git et suivre
tout ça. Jusqu'à l'intégration. La fluidité, l'optimisation de code est très importante vu qu'il y aura beaucoup de données !! »

L'outil houblons de la maquette jouable (`prototypes/houblons-v4/parcours/`, ses choix dans `work/refonte-frontend/v4/choix/ecrans.json`)
entre dans l'app (`src/`). Il remplace l'atelier V5.5 à l'étape Houblons, sans rien perdre de ses choix (règle n° 1) et en restant
fluide avec beaucoup de données.

Fini veut dire :
- chaque écran de l'outil est branché dans l'app, atteint par un vrai parcours dans Chrome (fixtures, puis émulateurs Firebase),
  typé, testé, build vert ;
- `controle-choix.mjs` et les contrôles de ses choix tournent sur l'app elle-même, plus seulement sur la maquette ;
- les budgets de fluidité tiennent sur le jeu « beaucoup de données », sous processeur ×4, et un contrôle échoue au-delà ;
- hors ligne et données préservés ; rien de supprimé sans son accord ; push, PR, fusion et déploiement sur son accord.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Ouvrir la porte B | maquette seule ; intégration dans l'app | brasseur | tranchée le 24.10 nuit : l'intégration commence (D64) |
| Liste des tâches et suivi | issues GitHub `Mrspadaaa/Brasserie` sous une épopée ; cette mission | pilote | tranchée : épopée « Intégration houblons v4 », une issue par tâche, cases cochées à la preuve |
| Architecture d'intégration et de fluidité (calcul hors du fil principal, chargement des données, écoutes Firestore par écran, coexistence avec V5.5, ordre des écrans) | à cadrer sur l'état des lieux | conseil | tranchée le 24.10 nuit (D65) : pile de routes dans App, wizard monté ; une porte d'écriture ; calcul async, worker si le banc échoue ; JSON à la demande ; V5.5 sous drapeau |
| Budgets de fluidité | ceux de la mission thème-performance (toucher ≤ 100 ms ; image d'un glisser ≤ 16 ms en médiane, 33 ms au 95e centile ; écran ≤ 2,5 s à froid ; ×4) ; sortie du rail ≤ 50 ms (D134) | pilote | tranchée pour commencer, à revoir avec le jeu « beaucoup de données » |
| Écrans dont son choix est ouvert (Dryhopper #146, Comparer r6a++, Substituer #145, Levure #156) | intégrer la version jouable du jour, puis sa reprise | pilote | tranchée : on intègre d'abord les écrans choisis ; les autres suivent son choix, sans bloquer les fondations |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| i0-etat | état des lieux mesuré : pièces de la maquette et de l'app classées (fini, inachevé récupérable, inutilisable), écarts B1 à B9 de #143, poids et temps mesurés, volumes de données et leur croissance, découpage proposé en tâches avec critères | jugement | auteur | sonnet | 100 | `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md`, `voies/i0-etat/RESULTAT.md` | — | `voies/i0-etat/verifier.mjs` (sections, mesures chiffrées, aucune écriture dans `src/`) | pilote | — |
| i0-relecture | relecture de l'état des lieux : trois mesures rejouées par leur commande, le classement confronté au code, les écarts B1 à B9 vérifiés ; un verdict | jugement | relecteur | sonnet | 40 | `voies/i0-relecture/RESULTAT.md` | i0-etat | `voies/i0-relecture/verifier.mjs` (verdict, trois mesures rejouées) | pilote | — |
| t1-branche-verte | #160 (T1) : un houblon inconnu rend « non simulé » au lieu d'une exception, test rouge sur HEAD puis vert ; tests du prototype dans le Vitest de la racine ; parcours wizard → hopV55 → retour joué dans Chrome | jugement | auteur | sonnet | 70 | `prototypes/houblons-v4/parcours/src/moteur/index.ts`, `prototypes/houblons-v4/tests/`, `vitest.config.ts`, `voies/t1-branche-verte/**` | — | `voies/t1-branche-verte/verifier.mjs` ; npm run build | pilote | — |
| t14-url | #161 (T14 minimal) : résolveur commun de page cible et `controle-choix.mjs --url` ; CHOIX OK sur la maquette servie, témoin servi en échec | jugement | auteur | sonnet | 70 | `work/refonte-frontend/v4/tournoi/outils/lib/`, `…/controle-choix.mjs` et les contrôles appelés, `…/servir.mjs`, `…/temoins/choix-url-*/`, `prototypes/houblons-v4/maquettes/parcours-t14/`, `voies/t14-url/**` | t1-branche-verte | `voies/t14-url/verifier.mjs` ; controle-choix --registre | pilote | — |
| t3-pile | #162 (T3) : pile de routes dans App, le wizard monté sous les couches d'outils, retours existants inchangés, drapeau hopV4 éteint, joué dans Chrome | conception | auteur | opus | 90 | `src/pages/useFullScreenRoute.ts`, `src/App.tsx`, `src/ui/hopIndex/devHook.ts`, `src/ui/hopIndex/HopToolLayer.tsx`, `src/ui/hopIndex/flags.ts`, `tests/integration/`, `tests/unit/`, `voies/t3-pile/**` | t1-branche-verte | `voies/t3-pile/verifier.mjs` (suite complète) ; npm run build | pilote | — |
| t4-moteur | #163 (T4) : le moteur v4 et ses données déménagent dans `src/domain/hopIndex/v4/` et `src/data/hopV4/`, une seule copie ; maquette et tests importent de là ; rien de plus au démarrage | jugement | auteur | sonnet | 80 | `src/domain/hopIndex/v4/`, `src/data/hopV4/`, `prototypes/houblons-v4/src/`, `prototypes/houblons-v4/data/`, chemins d'import de `prototypes/houblons-v4/parcours/src/` et `prototypes/houblons-v4/tests/`, `voies/t4-moteur/**` | t1-branche-verte, t3-pile, t14-url | `voies/t4-moteur/verifier.mjs` ; batterie 46/46 ; controle-etats | pilote | — |

Chemins de « Possède » : relatifs à la racine du dépôt ; `voies/…` est relatif au dossier de cette mission.

## Agents
- i0-etat : faite (ETAT OK, 18 tâches).
- i0-relecture : faite (accepté, 6 défauts corrigés par le pilote).
- t1-branche-verte : faite (BRANCHE OK 131/131, build vert, rejoués par le pilote ; parcours wizard → atelier → wizard rouvert : étape 3/7, brouillon intact, sans DraftFreshnessChoice ; capture 05 ouverte). Restes reportés à T3 (#162) : DraftFreshnessChoice sur une recette enregistrée, à jouer avec une fixture.
- t14-url : faite (URL OK : CHOIX OK sur la maquette servie, 7 écrans, levure ouverte ; témoin choix-url-legende-retiree en ECHEC ; REGISTRE OK ; batterie en mode fichier 45/45, ETATS 141/141, CABLAGE OK, rejoués par le pilote).
- t3-pile : acceptée par le pilote (lot pile et retours 13/13, build vert, parcours Chrome 10 captures ; captures 05, 08, 09 ouvertes). Le critère « suite complète » ne peut passer : 14 rouges existaient déjà sur HEAD (arbre détaché, mêmes 14 avant et après) → #177. Le cadre jaune des captures est le focus de PageShell après une saisie clavier (PageShell inchangé). Budget d'ouverture d'une couche : ~400 ms ×4 en serveur de dev, à mesurer sur le build (T17, #166).

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Boucle de retour
- Un critère rouge : l'agent corrige dans sa voie, 3 essais ; puis SendMessage au même agent (2 relances) ; puis le pilote
  réécrit le contrat.
- Une plainte du brasseur sur l'app : SPEC-BRASSEUR mot pour mot, DEFAUTS-RECURRENTS avec un contrôle qui échoue sur la version
  rejetée, puis correction (L13).
- Un budget de fluidité dépassé : la tâche n'est pas finie ; la mesure et sa cause vont dans l'issue.

## Budget
Écrite le 24.10 vers 21 h 30 : 5 h à 7 %, semaine à 60 % (Fable 66 %). Contexte du pilote : 260 k sur 1 M.

## Sources
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`
- `work/missions/2026-10-23-maquette-parcours/MISSION.md`
- `work/missions/2026-10-23-theme-performance/MISSION.md`
- `work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md`
- `work/refonte-frontend/v4/choix/ecrans.json`
- Épopée #159 ; issues #119, #121, #143, #144, #148, #149

## Reprise (25.10, vers 1 h)

- Fait et poussé (`claude/refonte-houblons-v4`) : état des lieux i0 (relu), conseil D65, épopée #159 et issues #160 à #176 ; T1 (#160), T14 (#161), T3 (#162) fermées.
- #177 : 14 tests déjà rouges sur HEAD (atelier V5.5, monkey, YeastRecipeChoice) ; bloque la bascule, pas les tâches.
- t4-moteur (#163) : faite (MOTEUR OK 24 fichiers, tests 131/131, build vert, démarrage 919 ko ; BATTERIE 46/46 ; ETATS 141/141 ; rejoués par le pilote). Décision (b) du pilote : outils vivants du prototype repointés (scripts/, ecran/src/, mesurer-voies.ts ; build-data et build-bands écrivent dans src/data/hopV4/) ; générateurs des lots publiés de work/ laissés tels quels. Ensuite, dans l'ordre du verdict : T5 (#164), T6 (#165), T17 (#166), T9 (#167), T11 (#168), T8 (#169), T12 (#170), T7 si le banc échoue (#171), T10 (#172), T13 (#173), T15 (#174), T16 (#175), T18 (#176).
- Méthode par tâche : VOIE.md et GATES.md avec un `verifier.mjs` qui échoue d'abord sur HEAD ; agent auteur (Sonnet, Opus pour une direction) ; le pilote rejoue chaque critère, regarde les captures, committe, pousse, ferme l'issue avec ses preuves et coche l'épopée.
- Le budget d'ouverture d'une couche (100 ms ×4) se mesure sur le build de production, pas sur le serveur de dev (~400 ms) : T17.
- Attendent l'utilisateur : retrait de V5.5, service worker, fusion des catalogues, catalogue réel (R9), PR et fusion vers main. Attendent le brasseur : états d'attente, budget t2, Comparer r6a++, Dryhopper, Levure.

## Signature
