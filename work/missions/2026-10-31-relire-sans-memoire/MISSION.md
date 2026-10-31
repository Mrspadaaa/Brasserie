# Mission 2026-10-31-relire-sans-memoire

## Objectif
Ses mots, à propos de `google/elephant-goldfish-model` : « Intéressant pour notre workflow ? », puis « Tous » pour les trois idées
proposées : le test de compréhension d'une consigne, la revue du plan avant le code, le rapport d'écart entre la doc et le code.
Adapter, sans installer le plugin. Fini : la marche à suivre (`.claude/skills/voies/references/sans-memoire.md`) est branchée dans
le skill `voies`, `docs/agents/systeme.md` et l'agent `relecteur` ; ses trois contrôles (`systeme.mjs comprendre`, `revue`, `ecarts`)
tournent, échouent sur leurs témoins, et le rapport d'écart a servi une première fois sur les docs des finances (voie e1 de la
mission `2026-10-31-ecran-depense`).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Installer le plugin ou adapter les idées | installer ; adapter | pilote | tranchée : adapter. Le plugin attend un humain à chaque section, recouvre nos relectures, et ferait tourner du code tiers |
| Les trois idées | 1 ; 1 et 2 ; les trois | utilisateur | tranchée : « Tous » (31.10) |
| Un relecteur neuf par usage, jamais le pilote ni un agent repris | — | pilote | tranchée : « a review in the same context is not a Goldfish review » (EGM) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| o1 | les contrôles `comprendre`, `revue` et `ecarts` dans systeme.mjs, avec leurs témoins | jugement | auteur | sonnet | 70 | scripts/agents/systeme.mjs, work/missions/2026-10-31-relire-sans-memoire/voies/o1/** | — | temoins, témoins bons et négatifs, essai réel sur les docs des finances | pilote | — |
| e1 | premier rapport d'écart (sens) entre les docs des finances et le code, pour la mission dépense | jugement | relecteur | sonnet | 40 | work/missions/2026-10-31-ecran-depense/ecarts/**, work/missions/2026-10-31-relire-sans-memoire/voies/e1/RESULTAT.md | — | rapport au format § 3, classes, doc:ligne et code:ligne | pilote | — |

## Boucle de retour
Un critère en échec : l'auteur corrige dans sa voie (3 essais). Un rejeu en échec : relance par un agent neuf avec le défaut précis.
Trop de faux positifs dans `ecarts` sur les vraies docs : le pilote resserre la règle des identifiants, sans cacher les vrais écarts.

## Budget
Deux voies Sonnet (o1 auteur, e1 relecteur neuf).

## Sources
- `.claude/skills/voies/references/sans-memoire.md`
- `scripts/agents/systeme.mjs`
- `docs/agents/systeme.md`

## Signature
`systeme.mjs voies` (31.10, nuit) : VOIES OK 2/2.
- OK o1 (sonnet) : `comprendre`, `revue` et `ecarts` dans systeme.mjs, 31 cas témoins, six fichiers témoins, essai réel.
- OK e1 (sonnet) : 34 écarts sur 5 documents. Son G2 a d'abord échoué, parce que la suite du pilote était écrite en puces ; elle est maintenant en paragraphe.

Contrôles : TEMOINS, CABLAGE, AGENTS, CHARGE, REMPLACES et CERVEAU OK.

Premiers usages réels :
- `comprendre` sur la voie p4 de Malts/sucres. Le premier test a échoué sur la forme (trois fichiers sur une ligne) et a relevé deux doutes : l'ancre et la durée d'« Annuler ». La consigne a été réécrite, puis un test neuf a donné COMPRIS OK (6 doutes, dont un utile : valider au téléphone sans Entrée).
- `ecarts` sur les docs des finances : 1 écart, `invoice-v3` (`docs/gemini-budget.md:37`).

Décisions du pilote :
- Portée de `ecarts` : sur les notes du cerveau et les règles, 12 écarts, dont 5 faux (42 %). Hors du domaine et des notes dont les `sources` citent du code, le résultat est un indice que le relecteur tranche (écrit dans `sans-memoire.md` § 3).
- Les commandes sont dans `docs/agents/systeme.md` § Commandes.
- À l'utilisateur, un écart se dit avec le côté qui tient (§ 3, après le malentendu du Drive).

Leçon proposée par o1 : régler un contrôle sur un corpus, puis le juger sur un autre. Elle est couverte par L20 (« se choisit sur une moitié des cas, se juge sur l'autre »), donc pas de leçon neuve.

Reste ouvert :
1. Mécaniser « plafond de voie ≤ maxTurns de l'agent » dans `systeme.mjs mission`. Ici, e1 était à 40 tours pour un relecteur qui en a 30.
2. Sept noms de code cités par des notes du cerveau sont absents du dépôt (`waterManualSparge`, `capAlkaline`, `ionAlarms`, `cacheBase`…, voir `voies/o1/RESULTAT.md`) : ces notes sont à corriger.
3. Le reste des écarts des finances (`invoice-v3` → `invoice-v4`, etc.) se corrige dans la mission dépense.
