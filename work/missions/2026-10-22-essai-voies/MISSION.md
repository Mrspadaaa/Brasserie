# Mission 2026-10-22-essai-voies

## Objectif
Premier essai réel du système de voies sur des tâches utiles : verser la mémoire locale dans le
second cerveau (mécanique, Haiku), et diagnostiquer pourquoi Nelson Sauvin paraît ordinaire (action
5 de la reprise du lot 21 ; jugement, Sonnet). « Fini » : chaque voie rend une ligne, ses critères
rejoués par le pilote passent, et les notes entrent dans la carte du cerveau.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Notes de mémoire déjà portées par une leçon | verser aussi ; ne pas verser | pilote | tranchée : ne pas verser, la leçon suffit (pas de doublon) |
| Correction du rattachement des descripteurs | options de la voie b | brasseur | ouverte : la voie b prépare, le conseil peut filtrer, le brasseur choisit |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur |
|---|---|---|---|---|---|---|---|---|---|
| a-cerveau-memoire | 24 notes versées au format du cerveau | mécanique | executant | haiku | 40 | cerveau/brasseur, agents, sources, 8 fichiers listés | — | existent, cerveau --fichiers, note --contient | pilote |
| b-nelson-sauvin | note prouvant la cause et chiffrant 2 ou 3 corrections | jugement | auteur | sonnet | 80 | cerveau/metier/descripteurs-hors-familles.md, ANNEXE.md | — | note --exiger --contient, cerveau --fichiers | pilote |

## Boucle de retour
Courte : chaque voie rejoue ses critères, 3 essais. Moyenne : le pilote rejoue
(`systeme.mjs voies … --modeles haiku,sonnet`) ; un échec repart au même agent par SendMessage avec
le défaut. Longue : l'option retenue pour les descripteurs devient un contrôle (DEFAUTS, « À
contrôler, lot 21 », point 3) avant toute correction de l'outil.

## Budget
Avant : 5 h à 2 %, semaine à 0 % (22.10, ~9 h 15). Plafonds : 40 + 80 tours.

## Sources
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
- `work/refonte-frontend/registre.md`
- `prototypes/houblons-v4/data/pack-fiches.json`
- `prototypes/houblons-v4/data/correspondance-familles.json`
- `prototypes/houblons-v4/src/engine/hops.ts`
- `cerveau/INDEX.md`

## Signature
22.10, pilote. Le rejeu des critères par le pilote (`systeme.mjs voies … --modeles haiku,sonnet`) :

```
OK a-cerveau-memoire (haiku) — 24 notes versées au cerveau ; G1 à G3 tenus.
OK b-nelson-sauvin (sonnet) — note descripteurs-hors-familles : cause de Nelson Sauvin « ordinaire », trois corrections
VOIES OK 2/2
```

- **Retours** : une ligne chacune, comme prévu. Coût : environ 337 k jetons et 11 min pour la voie
  Haiku ; environ 312 k jetons et 12,5 min pour la voie Sonnet. `git status` : rien hors de leurs
  périmètres.
- **Relecture du pilote** :
  - Voie a : notes fidèles (échantillon relu). `systeme.mjs fidelite` est à 0 perte sur chimie-eau.
    Sur design-system-historique, une alerte « 0.75 » rendu en « 12 px » : c'est la même valeur, pas
    une perte.
  - Voie b : diagnostic chiffré, avec la ligne de code à l'appui. Elle a corrigé deux erreurs du
    contrat du pilote : la table mot → famille vit dans `hopExtrapolationBootstrap.json`, pas dans
    `correspondance-familles.json` ; le « fruit de la passion » n'est dans aucune fiche du dépôt.
- **Leçons** :
  - voie a → M04 (condenser sans perdre), mécanisée par la nouvelle commande `systeme.mjs fidelite` ;
  - voie b → L14 complétée par un contrôle chiffré (part sans famille au-delà de 50 %, témoin l5f),
    confié à la voie r0 de la reprise.
- **Connaissance** :
  - voie a : les erreurs du hook pendant un lot de notes qui se citent sont transitoires, et seul
    le contrôle final fait foi (ajouté à `docs/agents/systeme.md`) ;
  - voie b : le contenu est dans la note `descripteurs-hors-familles`, ajoutée à la carte d'INDEX.
- **Décisions** :
  - notes déjà portées par une leçon : non versées (pilote) ;
  - correction des descripteurs : A puis B recommandés, au brasseur ; C au conseil, après B (portée
    dans la mission `2026-10-22-reprise-lot21`).
- **Écart au système** : les types d'agents n'étaient pas encore chargés au lancement. Repli
  `general-purpose` avec le modèle de la voie, donc `maxTurns` non appliqué pour ces deux voies.
- **Budget** : la fenêtre de 5 h est à 12 % et la semaine à 2 % après les deux voies, le conseil
  complet (dix appels) et les essais.
