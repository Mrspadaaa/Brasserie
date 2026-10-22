# Mission <AAAA-MM-JJ-sujet>

## Objectif
<La demande, ses mots, et ce que « fini » veut dire ici.>

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| <question> | <A ; B> | <voie, pilote, conseil, brasseur ou utilisateur> | <ouverte / tranchée : …> |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| <id> | <livrable> | <mécanique, jugement ou conception> | <executant, auteur, relecteur, concepteur ou critique> | <haiku, sonnet, opus ou fable> | <tours> | <chemins> | <ids ou —> | <commandes ou contrôles> | <pilote, conseil ou brasseur> | <v0 ×N, tri, passe 2, passe 3, reprise ou —> |

Ce que le brasseur verra passe par l'entonnoir (`references/entonnoir.md`) : des séries `v0 ×N` (3 à 8
variantes chacune, 30 au moins en tout), un `tri` par le critique, une `passe 2` par les mêmes auteurs.
Une `reprise` part d'une variante choisie (« <id> choisie : ses mots »).

## Agents
<Pour un lot en entonnoir : l'identifiant de l'agent de chaque série, repris par SendMessage pour la passe 2.>

## Boucle de retour
<Ce qui se passe si une voie échoue, si le relecteur rejette, si le brasseur se plaint : contrôles à
ajouter, leçons possibles, qui relance.>

## Budget
<Usage avant (get_usage), plafond visé, usage après.>

## Sources
- `<chemin vérifié>`

## Signature
<Sortie de `node scripts/agents/systeme.mjs voies <mission>`, décisions prises, leçons et notes
ajoutées, ce qui reste ouvert, ce qui attend l'utilisateur.>
