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
| Choix farnésène et cohumulone (Comparer, Valeurs) | 26.10 v1 | https://claude.ai/artifact/2243SR3kYaE6PfgU2d2yM4 | `voies/m1-farnesene/page.html` |
| Récap demandé pour 13 h | 26.10 v1 | https://claude.ai/artifact/FGsk4BBYVoxFa2DYaeAikJ | scratchpad de la session (`recap-2026-10-26.html`) |
| Listes de remplaçants (Substituer, D77) — caduque, D155 : u4 masqué | 26.10 v1 | https://claude.ai/artifact/KG2Zn5f5A3Ro8ZkEEjHFhD | `voies/m2-listes-substituts/page.html` |
| Remplaçants dans son écran Substituer (D77, D155) | 26.10 v2 | https://claude.ai/artifact/SpBwwn9ecTXzhAF8SEQXmC | `voies/m3-listes-u4/page.html` |
| Remplaçants à 60′, A contre v2 (D86) | 26.10 v1 | https://claude.ai/artifact/VoB2WMtR4oifyvUAohENAD | `voies/m4-listes-60/page.html` |
| Dryhopper à froid : amertume, hop creep, limites | 26.10 v1 | https://claude.ai/artifact/WW2mmg7gWgUVSnT4PTWTFf | `voies/m5-dryhopper-froid/page.html` |
| Récap du 26.10, 13 h | 26.10 v2 | https://claude.ai/artifact/EFGywfPa5yLiwTgDzQb16v | scratchpad de la session (`recap-2026-10-26-13h.html`) |
| Suggérer à 60′ comme au dry hop (q2b, M1 à M3, IA) | 26.10 v1 | https://claude.ai/artifact/Npss86xUpf259xJaemSKjH | `voies/m6-suggerer-moment/page.html` |
| Radar : voir le manque d'un houblon sur trois (D183) | 26.10 v1 | https://claude.ai/artifact/Gd66AfKhbqzdQ7xdt19Wiq | `voies/m8-radar-manque-partiel/page.html` |

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

## Reprise autonome (25.10, nuit) — « Continue sans mes feedback, tu me feras un récap demain à 13h »
- Récap à lui faire le 26.10 à 13 h (tâche programmée de la session ; si elle a disparu, le faire à la reprise) : fait et déployé, en cours, accords en attente, décisions prises seul, suite.
- Méthode par lot : voie Sonnet (code) ou concepteur Opus (ce qu'il voit) → rejeu Haiku dans la copie propre `%TEMP%/deploy-63130965` (`git -C … checkout --detach <commit>`) → commit par chemins (L17) → build `VITE_HOP_V4=on npm run build` et `node scripts/check-no-dev-auth.mjs` dans la copie → `node_modules/.bin/firebase deploy --only hosting --project brasserie-l-affinee` depuis la copie → issue et D-n.
- File d'attente, dans l'ordre :
  1. 5d3f89bc (t12e) : rejeu Haiku en cours, puis déployer (D74).
  2. t15c-outils (Substituer, Dryhopper, Levure, #174) : finir, rejouer, commiter, déployer.
  3. « autres n % » : compter un mot une seule fois (t12e DÉCISION), Sonnet.
  4. Fluidité en production (D70) : un banc sur le build de production (sans ?dev-local), Haiku pour mesurer, Sonnet pour le banc ; puis #179 (rendu de Suggérer, Substituer, Comparer).
  5. #180 : état des lieux de la couverture des données (Haiku), plan des sources et import local avec tests (Sonnet) ; rien en production sans accord.
  6. #181 : banc d'évaluation hors ligne et affinage (Sonnet) ; tests IA réels seulement journalisés, hors npm test.
  7. #182 : compagnon brasseur (Sonnet), après 5 et 6.
  8. #177 : les tests rouges anciens (Sonnet), si le temps le permet.
- Saut au « + » (D153) : non reproduit en test ; à revérifier dans son Chrome au retour.
- 26.10, 00 h 20 : points 1 à 3 faits et déployés (D74, 36ba5643). En vol :
  - p1-banc-prod (point 4) ;
  - d2-import-bm (point 5). La cause des trous : le collecteur ne lisait que 6 lignes des pages Beer Maverick. Réextraction depuis
    le cache local du 08.09 (319 pages), sans réseau ni Firestore ;
  - r177-tests-rouges (point 8, indépendant).

  #181 attend d2 : les substituts de Beer Maverick serviront de vérité de terrain au banc d'évaluation.
- **26.10, 01 h 40 : ARRÊT PROPRE, quota hebdomadaire à 79 %** (sa règle : stop à 80 %, aucun lancement dès 77 %). Il reprend
  sur sa demande ; remise à zéro le 31.10 vers 03 h.
  - Déployé : D74 (36ba5643) et D76 (1ea6ddd1).
  - Commité, non déployé :
    - 50f00b78, c2 suite : l'huile du catalogue, l'encadré ⇄, l'en-tête. Rejeu Haiku dans la copie propre, puis déploiement ;
    - dec0295d, e1 : le banc d'évaluation.
  - Non commité, dans l'arbre : p2-rendu (#179). Fichiers : `PageShell.tsx`, `comparer/index.tsx`, cinq CSS sans `:has`, deux
    tests d'intégration.
    - Gain à ×1 : moment et grammes ÷ 1,8 ; ouvertures inchangées.
    - À finir : captures (la bande cmc2k au même pixel), contrôles de maquette, vitest hopIndexV4 et intégration, build,
      audit. Voir `voies/p2-rendu/RESULTAT.md`.
  - r177 : diagnostic seul. 15 délais dépassés, aucune assertion fausse ; le coût est dans
    `src/services/hopV55/operationScopedQualifiedValidation.ts` (canonique, SHA-256, `structuredClone`). Rien corrigé.
  - Prochaines actions, dans l'ordre :
    1. finir et prouver p2, puis le commiter ;
    2. rejouer et déployer 50f00b78 et p2 ;
    3. conseil sur l'option 1 de e1 (mots hors famille dans `substitutes()`, Nelson Sauvin 155e → 2e) et sur l'intensité par
       variété dans Suggérer, qui est plat ;
    4. r177 : mémoïser la validation canonique ;
    5. #182, le compagnon.
  - À lui : la page de choix farnésène et cohumulone (table « Pages ») ; la collecte des fiches fournisseurs pour le linalol et le
    géraniol (accord) ; le protocole d'essai IA de e1 § 7 (aucun appel fait).
- **26.10, matin : reprise.** L'utilisateur : « Oublie la règle 80% elle est fausse, tu peux la supprimer » (retirée, REMPLACES.md).
  Il accorde la collecte et l'essai d'IA : « Il faut récupérer un maximum de données. Toutes données sera bonne à prendre. Il
  faudra trié ensuite. Pour le moment récupère TOUT ». Et sur les huiles : « ne regroupe jamais plusieurs huiles. Sauf si c'est
  utile et que elles sont déjà séparé à un endroit. Donc je veux les deux » (D154). Le farnésène a donc sa ligne, par sa règle ;
  la cohumulone reste à choisir sur la page.
  - En vol : o1-huiles-separees, c3a-hopsteiner, c3b-europe, c3c-amerique-oceanie, c3d-communautaire (règles :
    `voies/c3-COMMUN.md`), ia1-reclassement, p2-rendu (reprise), r177 (reprise).
  - Ensuite :
    - trier et fusionner les données collectées (seconde étape de D154 : toutes les huiles séparées) ;
    - conseil sur les réglages du moteur, éclairé par ia1 ;
    - rejouer et déployer.
- **26.10, fin d'après-midi.**
  - Fait et commité :
    - c3a à c3d : 18 sources collectées ;
    - d3a : fusion, `complements.json`, règles d'aberrance ;
    - d3b : Comparer et la fiche lisent les compléments, précharge au repos ;
    - o1 (D154) et p2 (#179) ;
    - ia1 et ia2 : IA Flash-Lite, 160 appels, 1,28 CHF ;
    - e1 suite (D77) ;
    - m3, les listes dans son vrai écran u4 (D155) ;
    - r177 (#177 : 197/197, reste l'erreur de worker des tours froids) ;
    - r180 (D79 : le pack Beer Maverick de nouveau installable).
  - En vol : le rejeu complet de 6d021cfb (`npm test` entier, prototype, contrôles), puis le déploiement (D80).
  - À lui : choisir sur la page m3 (`SpBwwn9ecTXzhAF8SEQXmC`) ; la cohumulone sur la page m1.
  - Petites suites :
    - `fiches.ts` l. 59, texte « substituts non importés » devenu faux (non affiché) ;
    - les tours froids de V5.5 à alléger ;
    - IHPS (PDF sur gov.si) à collecter ;
    - mécaniser le refus du heredoc (règle d'agent ajoutée, hook à proposer).

## Règle de la fluidité (25.10, soir)
- Ses mots : « SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me propose ça. Dans le pire des cas ». Une étape qui bloque sur la fluidité ne bloque pas la mission : un compromis mesuré (avant, après) lui est proposé, en DÉCISION À PRENDRE de la voie.
- Ensuite, à sa demande : importer toutes les données de tous les houblons (#180), après Comparer et la fiche ; l'écriture en production attend son accord. Puis affiner Suggérer et Substituer sur un banc d'évaluation (#181), avec des tests d'appel IA permis s'ils gagnent en qualité sans lenteur (journalisés, hors npm test, production sur accord) ; enfin brancher les outils au compagnon brasseur (#182).
- En vol (25.10, soir) : t15a-comparer (Comparer cmc2k dans l'app, #174), rb2-ma-biere (radar commun dans Ma bière). Fait : t12b (#170 fermé), rc-registres-comparer (D69).

## Signature

## Reprise (26.10, vers 15 h 30) : arrêt levé à 15 h 50 (quota réel à 89 % ; sa règle : plus d’agent dès 98 %, arrêt à 99 %)
« À 99% d'usage hebdo fait attention. Enregistrer bien TOUT pour la reprise et arrêt ». Le quota est remis à zéro le 31.10 vers 03 h.
Le contexte de cette session était à 50 % (500 k) : reprendre dans une **session neuve**, depuis ce paragraphe.

### En ligne (production)
- Hébergement au commit **9dba6971** (D95) : d4, Substituer v2 avec l'IA (puce dans la tête), D90, son choix D dans Dryhopper, s1, t1,
  le ★, la bulle du jour.
- Callable **hopReclasserIA** déployé seul, en europe-west6 (D92).
- Branche `claude/refonte-houblons-v4` poussée jusqu’à 2c87c4d8 (tous les commits) ; le travail des voies arrêtées n’est pas commité (ci-dessous).

### Commité, non déployé (après 9dba6971)
- g2b (e511311b, 31aa9605) : options `palier60` et `dryHop`, la sortie de m7.
- g2d (34eae4a7) : options d'apport minoritaire c, m, w ; défaut inchangé.
- u1 et v1 : diagnostics ; import et export vérifiés.
- Décisions D96 à D98, défauts D164 à D177, tickets #187 et #182 (commentaire).

### Voies arrêtées en plein travail (à reprendre ; leurs fichiers restent NON COMMITÉS dans l'arbre de travail)
1. **s2-sources-une-fois** (D168 à D170, puis D173). Fichiers :
   - `src/ui/hopIndex/commun/plagesSources.ts` ;
   - `comparer/{Feuilles,Huiles,index}.tsx` ;
   - `fiche/{FicheHoublon,Matrice,Replis}.tsx` ;
   - `maBiere/{Ajouter,Carte,briques,index,legende-bande}.tsx` et `maBiere/carteOuverte.tsx` (neuf) ;
   - `substituer/index.tsx` ;
   - `tests/unit/hopIndexV4/{plagesSources,traductionMots}.test.ts` ;
   - `tests/integration/controle-sources-une-fois.mjs`.

   État inconnu : relire son `RESULTAT.md`, faire `git diff`, puis relancer le même contrat (`voies/s2-sources-une-fois/VOIE.md`).
   L'appui long sur les grammes (D173) était demandé après les trois points. Deux tests rouges, dans `sourcesLignes.test.tsx`, viennent
   de ce travail en cours.
2. **p6-ma-biere-app** (D171, D97) : `src/ui/hopIndex/biere/` (neuf, partiel ; il en était à la CSS). Contrat :
   `voies/p6-ma-biere-app/VOIE.md`. Une fois l'écran prêt, rebrancher `analyse = true` dans `maBiere/index.tsx`, l. 75 et 76.
3. **f1-affinage-diagnostic** (D174 à D176, le principe de l'α) : `scripts/eval-hop/f1-{diagnostic,formes,sonde}.ts`,
   `voies/f1-affinage-diagnostic/formes.json`. Rapport non écrit ; relancer le contrat.
4. **m7-suggerer-rangees** (D165, D166) : capturer partiel (`voies/m7-suggerer-rangees/`). Le relancer **après** avoir choisi l'option
   d'apport (D99 ci-dessous), parce que les listes en dépendent.
5. **c5-houblons-manquants** : arrêté à 40 tours, sans rapport (`voies/c5-houblons-manquants/`). Le relancer en Sonnet ou par
   morceaux.
- En plus, hors agent : le téléchargement poli de Beer Analytics (PID 8368, lettres A, B, C, G, M, N déjà écrites dans
  `src/data/hopSources/beeranalytics*.json`, non commités). Quand il a fini :
  `node scripts/collecte-hop/beeranalytics.mjs --offline --rapport`.

### Décisions à prendre à la reprise (pilote)
- **D99, à décider** : activer l'option **c** de g2d par défaut au dry hop. Mesuré : Citra passe de la 54e à la 2e place, Mosaic de
  la 134e à la 20e, Nelson Sauvin de la 107e à la 31e ; 0 barre changée ; 0 ms. Les empreintes changent. Ensuite, mesurer m2 avant
  Ma bière.
- Choisir le défaut de départage des ex æquo (k1 ou k3, D91), à lui montrer dans q2b.

### Questions posées au brasseur (réponses du 26.10 : D100 ; PR #183 fusionnée, 59702c18)
- Sa recette a-t-elle des ajouts à 15, 20 ou 30′ ? C'est la cause probable des barres hachurées ; D177 prévoit d'interpoler.
- Test à l’aveugle moteur contre IA : ACCORDÉ (budget 0,5 CHF), à faire.
- Essai de l’IA dans Suggérer : ACCORDÉ (budget 0,5 CHF), puis production, à faire.
- PR #183 FUSIONNÉE (59702c18). Écrire les nouvelles données dans le catalogue Firestore : ACCORDÉ (script, émulateur, sauvegarde, puis écriture). Test dans son Chrome en lecture seule : ACCORDÉ.
- Choix encore ouverts sur ses pages : m1 (farnésène, cohumulone), m4 (remplaçants à 60′). Choix faits : m5 (D), m6 (M1 + M2 + IA,
  avec réserves).

### File d'attente, dans l'ordre
1. Finir s2, puis rejeu, critique et redéploiement : les sources une seule fois, la carte qui se referme, l'anglais, l'appui long.
2. Finir p6 (l'onglet Ma bière dans l'app), puis critique et redéploiement.
3. D99, puis m7 : la planche des rangées et du vrai dry hop, à publier.
4. f1 (affinage : Cryo, coupes, poids de l’α, formes produit), puis c5 (houblons manquants) et #187 (rattachement du stock ; règle du 26.10 : une origine non répertoriée, comme Cascade CHE, se lie à la variété la plus proche, avec un astérisque).
5. D172 : le dry hop actif dans Substituer, avec un diagnostic des données de levure. D177 : interpoler 20′.
6. #182 : le compagnon. Il crée et enrichit déjà les houblons dans Firestore, mais les outils v4 ne le lisent pas : il faut une
   surcouche en lecture.

Méthode (skill voies, 26.10) : une voie de code s'arrête au code, aux tests, au build et à son contrôle ; la suite mécanique va à un
exécutant Haiku. Le plafond de l'auteur est de 120 tours (nouvelle session).

## Reprise (26.10, vers 18 h) : état courant (remplace la file de 15 h 30)
Quota hebdomadaire : 91 % (`get_usage`). Sa règle : plus d'agent dès 98 %, arrêt à 99 %. Contexte du pilote : 70 %.

**En ligne** : hébergement **6e368cbd** (D103), callable `hopReclasserIA` (D92). PR #183 fusionnée dans main (59702c18). La branche
continue et est poussée.

**Commité, pas en ligne :**
- p6 (418a514e) et p6b (c4e20c5e) : Ma bière dans l'app, la croix qui ramène à l'étape (D118 élargi) ;
- d99 et c6 (846b76aa) : option c au dry hop, 505 variétés au catalogue, alias ;
- e4 (b41a8194) : états mis à jour après D168 ;
- D104 : B5 à 162 ko ;
- p6 : toucher de la visée à 237 ms en dev, à mesurer en production.

**Non commité (arbre de travail) :**
- **c7**, les 188 variétés branchées : recherche, Substituer, Suggérer, marques, astérisque ;
- **f2**, A, B1 borné à 80, C (J1), D (banc), D105.

Les deux voies se mêlent dans `voies.ts`. On les commite ensemble après f4.

**En vol :**
- **f4** (D106 : coût de Suggérer, tests de départage, usage à 60′) ;
- **f3** (diagnostic de la liste « Ajouter », D179).

**Puis :**
1. commiter c7, f2 et f4 ;
2. rejeu complet Haiku (`DEMANDE EXECUTANT` de c7 comprise : `check:hop-perf`, B5, captures) ;
3. critique de c7 (marques, astérisque) ;
4. déploiement de Ma bière, D99, du catalogue et de l'affinage.

**Ensuite :**
- f3, puis la correction de « Ajouter » ;
- m7 (planche des rangées, D165 et D166, à refaire sur D99) ;
- B2 et les formes (modèle b) en mini maquettes ;
- accords D100 :
  - test à l'aveugle, 0,5 CHF ;
  - IA de Suggérer, 0,5 CHF ;
  - Firestore : script, émulateur, sauvegarde ;
  - test dans son Chrome, en lecture seule ;
- D172 (dry hop actif et levure), D177 (interpolation à 20′), D178 (Comparer sans houblon), #182 (surcouche compagnon), #187 (stock) ;
- voie de profil (D101) pour les six budgets dépassés.

## Reprise (26.10, vers 19 h 30) : état courant (remplace celle de 18 h)
Quota hebdomadaire : 92 %. Règle : plus d'agent dès 98 %, arrêt à 99 %. Contexte du pilote : 81 %.

**En ligne** : hébergement **fb0d14e3** (D110) : Ma bière dans l'app, sa croix, D99, catalogue et alias, sources à un seul endroit.
PR #188 fusionnée (71dc41bb). Callable IA (D92).

**Commité, pas encore poussé ni en ligne** :
- lot moteur **689160fb** : c7 (505 variétés branchées), f2, f4, f5, f6, f7 ;
- r2 **f5a53f99** : radar, tiretés le long du bord et points visibles ;
- e5 **83aee2c1** : états de Dryhopper ;
- B5 à 164 ko (D109, son accord).

**En vol** :
- **rejeu complet de f5a53f99** (Haiku, journaux dans `%TEMP%/rejeu-lot/`) ;
- **r2-suite** : Comparer en mode Absolu, où les rayons tiretés restent (critique), et la capture de la marque « peu de données » ;
- **m8** : mini maquettes du manque d'une série sur 3, au radar (D183).

**Pour finir le lot** :
1. commiter r2-suite ;
2. rejouer les contrôles du radar sur ce commit ;
3. déployer depuis la copie propre, quand plus rien n'y tourne, puis lire « found N files » et la page servie (L17) ;
4. pousser, ouvrir une PR, la fusionner quand elle est propre (son accord D110 : « Fait une pr et tu merge une fois que c'est propre ») ;
5. publier m8 après la critique.

**Ensuite** :
- m7 (rangées et vrai dry hop, à refaire sur le lot) ;
- P4 et P5 de « Ajouter », B2 de Substituer, formes « Citra · pellets / cryo » : en mini maquettes ;
- D182 (gooseberry) ;
- accords D100 : test à l'aveugle, IA de Suggérer, écriture Firestore, test dans son Chrome ;
- D172 (dry hop actif et levure), D177 (20′), D178 (Comparer sans houblon) ;
- #182, #187 ;
- voie de profil D101 (6 budgets).

## Reprise (26.10, vers 20 h 30) : complément
- Commités depuis 19 h 30, pas encore poussés ni en ligne :
  - r2-suite (d2d8d69f) ;
  - u2 (61eff519) : interpolation entre 10′ et 60′ ;
  - u3 (a403041d) : rond pointillé, raison au survol, whirlpool à 80 °C supposé ;
  - x2 (7f811c2c) : export concis ;
  - m8 publié (Gd66AfKhbqzdQ7xdt19Wiq). Son choix est attendu ; le critique classe C, B, E en tête.
- Le rejeu de f5a53f99 n'est pas déployable :
  - le test V5.5 `hopV55PagePropertyAdviceV3` est rouge ;
  - 14 états sont en échec ;
  - la préchauffe au repos est plus lente.

  En vol : **e6** (diagnostic et corrections sûres). Ensuite : rejeu ciblé de HEAD, déploiement, PR.
- D185 : deux scripts de levure à aligner sur l'export concis.

## Reprise (26.10, vers 21 h) : complément
- Le quota hebdomadaire est à 94 % et le contexte du pilote à 89 % (compaction à 97 %).
- Commités, non poussés :
  - e6 (e4e12edf) ;
  - D114 : son choix G, le trou du 0, à porter sur Substituer et Comparer ;
  - D186 : les points confondus.
- En vol :
  - **p7** : G et les points confondus, dans `commun/` ;
  - **w1** : la préchauffe dans le worker, et le face à face sans produit d'arôme à 60′. Cette voie bloque le déploiement.
- Ensuite : un rejeu ciblé de HEAD, puis le déploiement depuis la copie propre (personne d'autre n'y écrit ; lire « found N files »
  et la page servie). Puis push, PR, et fusion une fois propre.

## Reprise (26.10, vers 21 h 45) : complément
- Commités : p7 (a3bb8346 : G, le trou du 0, et les points confondus) et w1 (b1d73ea1 : la préchauffe dans le worker, le face à face
  sans produit d'arôme). Rien n'est encore poussé depuis 2cccbdc0.
- En vol : **le rejeu complet de b1d73ea1** (Haiku, journaux dans `%TEMP%/rejeu-b1d7/`). S'il est vert :
  1. déployer depuis la copie propre (lire « found N files » et la page servie, L17) ;
  2. pousser ;
  3. ouvrir une PR et la fusionner, avec `--match-head-commit`.
- Ensuite :
  - la page des listes k1/k3 sur sa Double IPA (D91) ;
  - m7 ;
  - les mini maquettes P4 et P5 de « Ajouter », B2 et les formes ;
  - les accords D100 ;
  - D172, D178, D182, D185, #182, #187 ;
  - la voie de profil D101, avec les tâches de 100 à 250 ms qui restent après la préchauffe (w1), dont l'arrivée du catalogue plein de c7.

## Reprise (26.10, vers 22 h 30) : complément
- Rejeu de b1d73ea1 : typage, build, B5 (163,5 ko), worker de production et 10 contrôles Chrome sont verts. Trois bloquants restent ;
  la voie **e7** les traite :
  1. « NaN » dans l'assistant de recette (`monkey.test.tsx`, graine 11, échoue aussi seul) ;
  2. 6 états de Substituer attendent l'ancien face à face (Citra cryo) ;
  3. `controle-radar-base` ne trouve plus 9 pages, sans doute depuis p7.
- Après e7 : un rejeu ciblé (monkey, `hopIndexV4`, build, `construire`, états, radar-base), puis le déploiement depuis la copie
  propre, le push et la PR.

## Reprise (27.10, vers 7 h 10) : ÉTAT COURANT (remplace les précédentes)
Quota hebdomadaire : 94 % (remis à zéro le 31.10 vers 3 h). Règle : plus d'agent dès 98 %, arrêt à 99 %. Contexte du pilote à 94 % :
la compaction est imminente.

**En ligne :** **be15e480** (D116). PR #189 fusionnée (97cbbf95). La branche est poussée jusqu'à f9dac656, plus les commits
documentaires d'après.

**En vol :** **f8** (D118) : k3 par défaut, formes qui reprennent leur variété, contrôle D191 sur ses 6 houblons de Double IPA.

**Ses retours du 27.10, à traiter, dans l'ordre :**
1. f8 (D190, D191), puis rejeu, déploiement et PR.
2. **D187, radar de Comparer en Absolu** : montrer la plage type du style, normalisée aux extrêmes. Aujourd'hui illisible, tout est
   au centre. Voie d'interface, puis critique.
3. **D188, Suggérer** :
   - l'IA, accordée en D100 (budget 0,5 CHF), est à faire : essai, puis production ;
   - un bouton pour ajouter directement le houblon à la recette, à montrer en mini maquettes sur q2b.
4. **D189** précisé (« Quand je change le timing ») : voie **r3** en vol avec D187 (échelle au style fixe par style à tous les moments ; Absolu normalisé aux extrêmes avec la bande du style).
5. **Les choix qui attendent sa page** : les listes k1 et k3 (D91, peut-être réglé par D118), m7, P4 et P5 de « Ajouter », B2 et le
   sélecteur de forme.
6. **Les accords D100** : test à l'aveugle, IA de Suggérer, écriture Firestore, test dans son Chrome.
7. D172, D178, D182, D185, #182, #187, et la voie de profil D101.
- 27.10 : **r3 commité** (radar de Comparer, D187 et D189). Suggérer a sans doute le même défaut D189 : voie courte **r4** lancée. Ensuite : f8, puis rejeu, déploiement et PR.
