---
name: verite-croisee
description: Aucune source n'est la vérité (Beer Maverick compris) ; la vérité d'un houblon est un panel croisé de plusieurs sources et données.
type: metier
maj: 2026-10-31
sources: work/refonte-frontend/v4/SPEC-BRASSEUR.md (31.10) ; D102 D (banc à références indépendantes) ; voies c9 et v2 (mission 2026-10-25-integration-houblons)
---

# La vérité est un panel croisé

Le brasseur, le 31.10 : « Beer Maverick ne doit pas être la source de vérité. La source de vérité est un penel croisé de plusieurs source
et donnée ».

## Ce que ça veut dire
- **Une variété** existe parce que plusieurs sources la décrivent, pas parce qu'une source l'a, ou ne l'a pas.
- **Une valeur** (α, β, cohumulone, huiles, mots, usage) est une plage tirée de toutes les sources qui la donnent. On garde le nombre de
  sources et leur écart. Une valeur qui s'écarte se signale, sans être ni gardée seule ni effacée.
- **Un usage** se lit sur la donnée réelle, comme les recettes de Beer Analytics, et non sur une étiquette ([[role-continu]]).
- **Un inconnu** reste inconnu, jamais 0.

## Déjà acquis
- D102 D : un banc à références indépendantes (Hopsteiner par moment, Hopslist, Hops Direct, ses jugements), jamais Beer Maverick seul.

## Encore à faire
L'audit v2 du 31.10 recense ce qui ne tient pas encore ce principe :
- les identifiants de base `beermaverick-*` ;
- les « ajouts » définis comme absents de Beer Maverick ;
- le départage k3 par le radar Beer Maverick ;
- l'usage de Beer Maverick.
Changer l'identité des variétés est une décision d'architecture, qui passe par le conseil.

Voir [[substitution-moteur]] et [[descripteurs-hors-familles]].
