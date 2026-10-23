# Mission 2026-10-23-controles-parcours

## Objectif
L'utilisateur, le 23.10 : « Regarde si ça suit la bonne voie, et que mes choix de mini maquettes sont bien respecter pour
l'implantation "final" ». Puis « Oui, continue », en réponse à : remettre en état le contrôle du rail (22 de ses plaintes)
et celui de l'intensité et de l'usage, pour la maquette de bout en bout.

L'audit a1 du 23.10 classe `controle-rail.mjs` « à adapter » : il ne tourne plus sur aucun écran actuel, et aucun GATES
ne l'appelle. `controle-usage-intensite.mjs` tourne sur le lot 15, mais il lit les données figées d'un cas
(`data-cas`, `donnees/<cas>.json`), alors que la maquette calcule en direct. Les écrans de la maquette
(`work/missions/2026-10-23-maquette-parcours/`) vérifient la loupe et D80 dans leur `jeu.mjs`, chacun à sa façon ; le
reste du rail n'est vérifié nulle part.

Fini veut dire :
- les deux contrôles ont un mode `--parcours`, qui lit le format de la maquette :
  - pages `prototypes/houblons-v4/maquettes/parcours/<route>/etat.html` ;
  - contrat de `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, « Contrat d'un écran » ;
  - le moteur en direct par `window.__parcours` ;
- chaque règle tenue a un témoin négatif qui échoue pour sa raison (`systeme.mjs echoue`), et un témoin positif passe ;
- le mode actuel reste intact (RAIL OK 1/1 sur la base consolidée, USAGE-INTENSITE OK sur q2b) ;
- les deux contrôles sont joués sur le parcours construit, et chaque échec y devient un défaut nommé pour la session
  de la maquette ;
- `portee-defauts.json` et DEFAUTS-RECURRENTS disent ce qui garde désormais chaque défaut, sur quel format.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Règles du rail sans objet dans la maquette (D28 la levure dans le rail ; D43 les −/+ de jours ; D45, D56, D61, D61 bis, D64 plusieurs houblons sur un même rail) | appliquer ; sans objet, avec sa raison | voie | ouverte : la voie classe chaque défaut dans sa NOTE, le pilote relit à la signature |
| D36 et D37 révisé (ébullition de durée variable) : la maquette n'a qu'une recette, à 60′ | tester par l'état ; déclarer le manque | pilote | tranchée : tester si `window.__parcours` le permet ; sinon, manque nommé et demandé à la session de la maquette (une route ou un état d'essai) |
| Forme de `data-source` de l'usage | « fournisseur » ou « règle » (D80) ; la forme longue (« règle : règle rôle-α v1… ») | pilote | tranchée : D80 dit « fournisseur » ou « règle » ; la forme longue est un défaut de l'écran |
| D47 sur Dryhopper : crans courts des autres segments pendant le geste (a1, passe 3) | les retirer ; les garder et déclarer l'écart | pilote | tranchée : les retirer, selon ses mots (« Juste les affiches quand on est à cette emplacement ») ; réversible s'il dit les avoir aimés |
| D46 sur un rail à crans | pouce continu, valeur accrochée au cran ; assouplir le seuil | pilote | tranchée : pouce continu, valeur accrochée, comme les curseurs de l'app ; seuil inchangé (« le slider est clancky pas fluide du tout ») |
| D45, D56, D61 bis, D64 (plusieurs houblons sur un rail) | sans objet ; joués | pilote | tranchée : joués ; l'étape Houblons de la base v4.10, son choix (« Ça c'est le bon »), porte plusieurs houblons sur une frise verticale. Passe 2 de c1-rail (G13 à G18) |
| Jouer un contrôle sur les écrans de l'autre mission | critère qui exige OK ; critère qui exige un verdict rendu | pilote | tranchée : un verdict rendu (`systeme.mjs verdict`) ; les échecs vont à la session de la maquette, qui possède ses écrans |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| c1-rail | mode `--parcours` de controle-rail.mjs (Ma bière : la poignée de chaque ligne ; Dryhopper : la frise), ses témoins, joué sur le parcours | jugement | auteur | sonnet | 120 | `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs`, `work/refonte-frontend/v4/tournoi/outils/temoins/rail-parcours-*/**`, `voies/c1-rail/**` | — | systeme.mjs echoue (témoins) ; systeme.mjs verdict (parcours) ; RAIL OK 1/1 sur la base consolidée | pilote | — |
| c2-intensite | mode `--parcours` de controle-usage-intensite.mjs (U1 sur toute route ; I1 sur Ma bière et Suggérer, contre le moteur en direct), ses témoins, joué sur le parcours | jugement | auteur | sonnet | 80 | `work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs`, `work/refonte-frontend/v4/tournoi/outils/temoins/usage-parcours-*/**`, `voies/c2-intensite/**` | — | systeme.mjs echoue (témoins) ; systeme.mjs verdict (parcours) ; USAGE-INTENSITE OK sur q2b | pilote | — |

Chemins de « Possède » : relatifs à la racine du dépôt ; `voies/…` est relatif au dossier de cette mission.

## Boucle de retour
- Un critère rouge : l'agent corrige dans sa voie, 3 essais au plus. Au-delà, SendMessage au même agent avec le défaut
  précis (2 relances), puis le pilote réécrit le contrat.
- Un échec sur le parcours n'est pas un échec de la voie : le pilote le transmet à la session de la maquette
  (local_6a42bfeb), qui possède ses écrans. Un manque du socle (une donnée exposée, une route d'essai) aussi.
- Une règle qui ne peut pas se tenir sur ce format : le pilote décide (sans objet, avec sa raison ; ou à brancher) et
  met `portee-defauts.json` à jour.

## Budget
Avant (23.10, ~15 h 15) : 5 h à 47 %, semaine à 58 %, Fable à 29 %. Plafond visé : 5 h sous 80 %.

## Sources
- `work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs`
- `work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs`
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
- `work/missions/2026-10-22-systeme-agents/voies/a1-audit-defauts/AUDIT.md`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json`
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`
- `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/jeu.mjs`
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/jeu.mjs`
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/jeu.mjs`

## Signature
23.10, soir, pilote.

**Voies** (`node scripts/agents/systeme.mjs voies work/missions/2026-10-23-controles-parcours`) : VOIES OK 2/2.
- c1-rail (sonnet) : `controle-rail.mjs --parcours`, 23 plaintes classées (22 jouées, D28 sans objet), rail horizontal
  et frise verticale à plusieurs houblons, 20 témoins ; ALL MET 19/19 rejoué par le pilote.
- c2-intensite (sonnet) : `controle-usage-intensite.mjs --parcours` (U1 usage et source, I1 intensité contre le moteur
  en direct), 11 témoins ; ALL MET 10/10.

**Sur la maquette** : défauts transmis à la session de la maquette et corrigés par elle (D35, D46, D47 sur Dryhopper ;
D55, le vide de la frise ; la source longue de l'usage). Construction d332792c : RAIL OK 2/2, publiée
(https://claude.ai/artifact/52UBb4F7iME2k3ZzsAv4x1).

**Décisions** (pilote) : D47, retirer les crans des autres segments ; D46, pouce continu et valeur accrochée ; D45,
D56, D61 bis, D64 joués (frise verticale de son choix) ; jouer les écrans d'autrui par `systeme.mjs verdict`.

**Ajouts au système** : `systeme.mjs verdict`, `systeme.mjs appels` (EXPECT `/…/` lu comme gate-check) ; le hook rappelle
les appels d'un script de contrôle et les témoins après `portee-defauts.json` ; `portee-defauts.json` : 21 plaintes
du rail à « garde ».

**Ouvert**
- D28 reste « à adapter » : sans objet dans la maquette.
- G15 (D56) a échoué une fois sous la charge d'une autre mesure dans Chrome : sous un processeur occupé, le geste peut
  ne pas atteindre la position.
- Non détecté : « la piste de chaque houblon couvre toute la colonne » (le contrôle prend le repère, pas un doigt
  entre deux repères).
- D45 n'est joué que sur un rail à crans en bulle, pas sur des minutes en graduations.
