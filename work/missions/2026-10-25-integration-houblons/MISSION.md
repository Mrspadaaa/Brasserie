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

- Mis à jour le 25.10 vers 7 h 30. Épopée #159 : fermées #160 à #169, #171, #178 (preuves en commentaire). Ouvertes : #170 (T12, en vol), #172, #173, #174, #175, #176, #177 (14 tests rouges d'avant), #179 (rendu : Suggérer 447 ms ×4, moteur 0 ms).
- t12-ma-biere (#170) : faite, rejouée (MA-BIERE-APP OK, CHOIX OK, BATTERIE 46/46, ETATS 141/141, tests 270/270, démarrage 919 ko). t12-critique : ACCEPTÉ avec trois écarts à régler avant de la lui montrer : thème cave au lieu de son clair (#144), « + » flottant sur « Suivant », en-tête « Houblons 3/7 » (D58). Aussi : appui long → fiche absent dans l'app ; controle-choix --url sans adresse qui ouvre l'étape 3. Skill webapp-testing adapté (3cedac2c) : parcours réel 11/11 ; défauts vus : « OG NaN » et « IBU 0 » sur une recette neuve (l'inconnu en « ? ») → à corriger avec les écarts (T12b, #170 ouverte).
- Ensuite : #179 (rendu : focus de PageShell, useViewport, démontage, nœuds ; réparer substituer l. 241 puis recalculs au worker), T10 (#172), T13 (#173), T15 (#174), T16 (#175, sur accord), T18 (#176), #177.
- Méthode par tâche : VOIE.md et GATES.md, un `verifier.mjs` qui échoue sur HEAD ; agent auteur (Sonnet, Opus pour une direction ; concepteur Opus et critique Fable pour ce qu'il voit) ; le pilote rejoue chaque critère (un seul passage de batterie à la fois sur `maquettes/parcours`), committe, pousse, ferme l'issue avec ses preuves, coche l'épopée.
- Mesures de référence : démarrage 919 ko gzip (budget 350, #121) ; chunk des outils 117 ko ; couche préchargée 36 à 59 ms ×4 ; `npm run check:hop-perf` ECHEC 5 à 6 (Suggérer à froid 205 ms, tranche des voies 345 ms, Comparer jour après jour 120 ms).
- Attendent l'utilisateur : retrait de V5.5, service worker, fusion des catalogues, catalogue réel (R9), PR et fusion vers main. Attendent le brasseur : états d'attente, budget t2, Comparer (lot fils25 en cours), Dryhopper, Levure.

## Reprise (25.10, 21 h)
- Fait et poussé : T12b (#170 fermé), radar commun RadarBase dans l'app (src/ui/hopIndex/commun) et les 9 vues, Ma bière sur la baseline (rb2), registres de Comparer sur cmc2k (D69), Comparer cmc2k dans l'app (t15a, t15b ; 8624c8f8), lanceur + masqué sous les outils, drapeau qui ne lit que sa clé (d53cbcfe).
- Déployé (D71) : hébergement seul en production, https://brasserie-l-affinee.web.app, VITE_HOP_V4=on. PR #183 ouverte vers main (pas de CI sur le dépôt).
- Fait : t13 (fiche, Suggérer, #173 fermé), t12c (IBU réel, haut commun), redéployés (D72, 63130965). En vol : t12d-rail (Sonnet : rail 120′, saut de vue au +, bandeau masqué au glisser, phrase « Changement appliqué » masquée, IBU présenté comme avant au format compact ; #184) et t15c-outils (Sonnet : Substituer, Dryhopper, Levure ; #174). Todo ajouté : #185 IBU à froid. Redéployer depuis une copie propre (D72) après le rejeu Haiku de chaque lot.
- Ensuite, sans attendre son retour (« N'attende jamais sur mon feedback ») : Substituer, Dryhopper, Levure dans l'app (reste de #174, Sonnet) ; mesure de fluidité en production (D70, Haiku) puis #179 ; #180 import complet ; #181 affinage (tests IA permis, journalisés) ; #182 compagnon ; T10 (#172) ; T18 (#176). Après chaque lot : rejeu Haiku, commit par chemins (L17), push, redéploiement de l'hébergement s'il le faut pour qu'il joue.
- Répartition (L18) : Haiku le mécanique, Sonnet le code et les ports, Opus seulement ce qu'il voit et le pilotage.

## Règle de la fluidité (25.10, soir)
- Ses mots : « SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me propose ça. Dans le pire des cas ». Une étape qui bloque sur la fluidité ne bloque pas la mission : un compromis mesuré (avant, après) lui est proposé, en DÉCISION À PRENDRE de la voie.
- Ensuite, à sa demande : importer toutes les données de tous les houblons (#180), après Comparer et la fiche ; l'écriture en production attend son accord. Puis affiner Suggérer et Substituer sur un banc d'évaluation (#181), avec des tests d'appel IA permis s'ils gagnent en qualité sans lenteur (journalisés, hors npm test, production sur accord) ; enfin brancher les outils au compagnon brasseur (#182).
- En vol (25.10, soir) : t15a-comparer (Comparer cmc2k dans l'app, #174), rb2-ma-biere (radar commun dans Ma bière). Fait : t12b (#170 fermé), rc-registres-comparer (D69).

## Signature
