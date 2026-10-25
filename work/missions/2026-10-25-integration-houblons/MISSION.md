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
| t5-causes | #164 (T5) : fabrique creerMoteur (données injectées), caches bornés, substitutes sur les 8 rendus sans stock × catalogue, cache de hopDescriptorEvidence par contenu chez l'appelant, formateurs Intl en cache ; banc scripts/bench-hop-v4 ×1 ×5 ×10 | conception | auteur | opus | 80 | `src/domain/hopIndex/v4/`, `prototypes/houblons-v4/parcours/src/moteur/`, trois fichiers de formatage, `prototypes/houblons-v4/tests/`, `scripts/bench-hop-v4.*`, `voies/t5-causes/**` | t4-moteur | `voies/t5-causes/verifier.mjs` ; batterie 46/46 ; controle-etats ; npm run build | pilote | — |
| t6a-ecriture | #165 (T6, a) : la conversion déménage dans src/domain/hopIndex/v4/recipeConversion.ts ; applyHopV4Change par writeRecipeDraft ; aller-retour qui garde hopV55*, stockItemRef, hopLotId | jugement | auteur | sonnet | 80 | `src/domain/hopIndex/v4/recipeConversion.ts`, `…/integration/conversion.ts`, deux tests du prototype, `src/pages/BrewWizard.tsx` (applyHopV4Change), `tests/unit/hopIndexV4/`, `voies/t6a-ecriture/**` | t5-causes | `voies/t6a-ecriture/verifier.mjs` ; npm run build | pilote | — |
| t6b-async | #165 (T6, b) : client asynchrone des calculs lourds (contrat de messages, servi sur le fil principal) ; aucun écran sur le moteur par défaut ; rien de visible ne change | conception | auteur | opus | 80 | `src/domain/hopIndex/v4/client.ts`, `…/v4/index.ts`, `prototypes/houblons-v4/parcours/src/moteur/`, `…/ecrans/` (appels), tests du client, `voies/t6b-async/**` | t5-causes | `voies/t6b-async/verifier.mjs` ; batterie 46/46 ; controle-etats ; npm run build | pilote | — |
| t17-banc | #166 (T17) : contrôle bloquant scripts/check-hop-tools-perf.mjs sur un jeu réaliste, calculs classés par moment (glisser 4 ms, toucher 25 ms, repos 50 ms par tranche sur ce PC, ×4 affiché), témoin lent en échec ; verdict du moteur écrit | jugement | auteur | sonnet | 80 | `scripts/check-hop-tools-perf.mjs`, `scripts/bench-hop-v4.ts`, `tests/fixtures/hopV4-volume/`, `package.json` (script), `voies/t17-banc/**` | t5-causes, t6b-async | `voies/t17-banc/verifier.mjs` | pilote | — |
| t9-paresseux | #167 (T9) : moteur, données et client v4 dans un chunk à la demande (≤ 150 ko gzip), préchargé au repos en ligne, ouvert hors ligne après un premier lancement ; démarrage inchangé | jugement | auteur | sonnet | 80 | `src/ui/hopIndex/`, `src/App.tsx` (préchargement), `vite.config.ts` (découpage), `scripts/check-hop-budget.mjs`, `tests/unit/hopIndexV4/`, `voies/t9-paresseux/**` | t3-pile, t4-moteur, t6b-async | `voies/t9-paresseux/verifier.mjs` | pilote | — |
| t5b-voies | #178 (T5b) : proposeVoies, l'effet d'un houblon à un moment mis en cache par moteur, partagé avec les leviers levure ; mêmes empreintes ; proposer froid ×5 au tiers au plus | conception | auteur | opus | 80 | `src/domain/hopIndex/v4/voies.ts`, `profil-simule.ts`, `yeast.ts`, `lru.ts`, `prototypes/houblons-v4/tests/`, `voies/t5b-voies/**` | t5-causes, t17-banc | `voies/t5b-voies/verifier.mjs` ; batterie 46/46 ; controle-etats | pilote | — |
| t8-donnees | #169 (T8) : useHopData depuis le stock, la dégustation et le catalogue du moteur (sans fusion des catalogues) ; moteur réutilisé par empreinte : un snapshot identique ne relance rien ; fixture de production lue | jugement | auteur | sonnet | 80 | `src/ui/hopIndex/useHopData.ts`, `src/domain/hopIndex/v4/moteur.ts`, `…/donneesApp.ts`, `tests/unit/hopIndexV4/`, `voies/t8-donnees/**` | t5-causes, t6a, t6b, t9 | `voies/t8-donnees/verifier.mjs` | pilote | — |
| t11-communs | #168 (T11) : les composants communs de la maquette (Pictos, JetonHoublon, BarreStyle, Legende, familles → familyTokens…) déménagent dans src/ui/hopIndex/, une seule copie ; rendu identique | jugement | auteur | sonnet | 80 | `src/ui/hopIndex/` (fichiers neufs), `prototypes/houblons-v4/parcours/src/` (commun et imports), `controle-traits.mjs` (chemin), `tests/unit/hopIndexV4/`, `voies/t11-communs/**` | t4-moteur, t9-paresseux | `voies/t11-communs/verifier.mjs` ; batterie 46/46 ; controle-etats | pilote | — |
| t7-worker | #171 (T7) : un worker persistant sert le contrat du client (calculs lourds), repli sur le fil principal en file://, aucun état d'attente visible ; toucher Ma bière → Suggérer ≤ 100 ms ×4 | conception | auteur | opus | 80 | `src/ui/hopIndex/hopTools.worker.ts`, `…/hopToolsTransport.ts`, `src/domain/hopIndex/v4/client.ts`, `prototypes/houblons-v4/parcours/src/moteur/`, `…/coquille/` (préchauffage), tests, `voies/t7-worker/**` | t6b, t17, t5b, t11 | `voies/t7-worker/verifier.mjs` ; batterie 46/46 ; controle-etats | pilote | — |
| t12-ma-biere | #170 (T12) : l'étape 3 du wizard, drapeau hopV4 allumé, rend son écran choisi (base v4.10, légende v2a) par le même code que la maquette (écran déménagé dans src/ui/hopIndex) ; V5.5 gardé drapeau éteint ; captures côte à côte | conception | concepteur | opus | 80 | `src/ui/hopIndex/`, `src/pages/BrewWizard.tsx` (étape 3), `prototypes/houblons-v4/parcours/src/`, `work/refonte-frontend/v4/tournoi/outils/` (chemins, repères), tests, `voies/t12-ma-biere/**` | t7-worker | `voies/t12-ma-biere/verifier.mjs` ; batterie 46/46 ; controle-etats ; controle-choix.mjs (fichier, et --url sur l'app) | brasseur | reprise |
| t12-critique | #170 : l'étape portée jugée contre sa maquette choisie, état par état | jugement | critique | fable | 40 | `voies/t12-critique/RESULTAT.md` | t12-ma-biere | `voies/t12-critique/verifier.mjs` | pilote | — |

Chemins de « Possède » : relatifs à la racine du dépôt ; `voies/…` est relatif au dossier de cette mission.

etape-houblons choisie : « Partir sur cette version » (base v4.10, D107) et « Tu peux intégrer légende type leg3-v2a » (D61, D140) — la reprise T12 part de là.

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
- t4-moteur (#163) : faite (MOTEUR OK 24 fichiers, tests 131/131, build vert, démarrage 919 ko ; BATTERIE 46/46 ; ETATS 141/141 ; rejoués par le pilote). Décision (b) du pilote : outils vivants du prototype repointés (scripts/, ecran/src/, mesurer-voies.ts ; build-data et build-bands écrivent dans src/data/hopV4/) ; générateurs des lots publiés de work/ laissés tels quels. - t5-causes (#164) : faite (CAUSES OK au rejeu : substitutes ×10 froid 82 à 86 ms — un rejeu à 101,9 ms, isolé —, chaud 3,3 ms ; tests 138/138 ; BATTERIE 46/46 ; ETATS 141/141 ; build vert ; functions intact). Ouverts : proposer ×10 froid ≈ 1,1 s (→ #166, #171) ; les écrans de la maquette importent encore le moteur par défaut, ils passent par moteur() de l'adaptateur dans T6 (#165).
- t6a-ecriture : faite (ECRITURE OK 160/160, build vert ; un hopV55Applications survit intact au remplacement v4 de sa ligne mais ne la décrit plus : dit dans les notes du patch).
- t6b-async : faite (ASYNC OK 149/149, BATTERIE 46/46, ETATS 141/141, build vert, démarrage 919 ko ; rejoués par le pilote). Contraintes d'un futur worker reportées dans #171 (aucun état d'attente sans son choix ; préchauffer ce qu'un toucher ouvre ; mode ?calcul=differe comparé en captures).
- t17-banc (#166) : faite (BANC OK rejoué ; verdict du moteur PERF-OUTILS ECHEC 5 à 6 : glisser OK ; Suggérer à froid ~1,1 s (proposer 0,67 s + leviers levure 0,43 s, un seul appel synchrone) → worker #171 et optimisation de proposeVoies ; Comparer « jour après jour » 120 ms ; Dryhopper et Comparer 12 au bord ; snapshot identique relance (T8, #169)).
- t9-paresseux (#167) : faite (PARESSEUX OK rejoué : chunk des outils 117 ko gzip, démarrage +21 octets ; couche préchargée 36 à 59 ms ×4 ; hors ligne après un premier lancement en ligne joué, captures ouvertes ; à froid sans préchargement 614 ms ×4 avec un repli Suspense de 300 ms : un état d'attente que ses maquettes n'ont pas → noté pour T12, #170).
- t8-donnees (#169) : faite (DONNEES OK rejoué après correction du motif du critère par le pilote ; tests 81/81 ; fixture de production : 18 articles reliés, 0 non relié ; snapshot identique : aucun calcul relancé ; démarrage 919 ko).
- t5b-voies (#178) : acceptée par le pilote comme gain partiel. Son critère (÷3 à ×5) n'est pas tenu : proposer ×5 644 → 332 ms (÷1,9). Sur le jeu réaliste : ouvrir Suggérer 862 → 205 ms (÷4,2), tranche des voies 1 113 → 345 ms (÷3,2). Empreintes identiques ; tests 152/152 ; BATTERIE 46/46 ; ETATS 141/141 ; build vert, rejoués sur le code final. Le reste est dans predictHopRecipe (functions/, intact) et recipe.ts : plancher ≈ 250 ms sans eux → worker #171.
- t11-communs (#168) : faite (COMMUNS OK, BATTERIE 46/46, ETATS 141/141, démarrage 919 ko, rejoués par le pilote).
- t7-worker (#171) : acceptée par le pilote, critère G1 non tenu. Le worker persistant sert le client (http ; repli sur le fil principal en file://). Les longues tâches du préchauffage passent de 3 143 à 1 315 ms bloquants ×4. Le toucher Ma bière → Suggérer reste à 447 ms ×4, entièrement du rendu (moteur 0 ms) → #179. BATTERIE 46/46, ETATS 141/141 ; tests 265/265 après correction du test de structure de T9 par le pilote (familles et worker admis).
- Ensuite, dans l'ordre du verdict : T11 (#168), T8 (#169), T12 (#170), T7 si le banc échoue (#171), T10 (#172), T13 (#173), T15 (#174), T16 (#175), T18 (#176).
- Méthode par tâche : VOIE.md et GATES.md avec un `verifier.mjs` qui échoue d'abord sur HEAD ; agent auteur (Sonnet, Opus pour une direction) ; le pilote rejoue chaque critère, regarde les captures, committe, pousse, ferme l'issue avec ses preuves et coche l'épopée.
- Le budget d'ouverture d'une couche (100 ms ×4) se mesure sur le build de production, pas sur le serveur de dev (~400 ms) : T17.
- Attendent l'utilisateur : retrait de V5.5, service worker, fusion des catalogues, catalogue réel (R9), PR et fusion vers main. Attendent le brasseur : états d'attente, budget t2, Comparer r6a++, Dryhopper, Levure.

## Signature
