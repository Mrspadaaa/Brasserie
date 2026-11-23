---
name: role-continu
description: Le rôle d'un houblon (arôme, amérisant, mixte) est un continuum ; le moteur lit l'usage réel mesuré, jamais une étiquette.
type: metier
maj: 2026-10-31
sources: work/refonte-frontend/v4/SPEC-BRASSEUR.md (31.10) ; Beer Analytics usage-types (src/data/hopSources/beeranalytics-*.json) ; voies t3 et k2 (mission 2026-10-25-integration-houblons)
---

# Le rôle d'un houblon est un continuum

Le brasseur, le 31.10 : « mixte veut aussi dire amerisant en fait le rôle d'un houblon n'est jamais vraiment totalement défini ».

## Ce qu'il faut savoir
- L'étiquette d'usage n'est pas une vérité. Beer Maverick classe Warrior, Columbus et Nugget en « mixte » ; Beer Analytics range
  Warrior dans « bittering » ; tous trois amérisent très bien.
- La mesure qui compte est l'usage réel. Beer Analytics publie, par houblon, le nombre de recettes par moment (`stats["usage-types"]`) :
  Mash, First Wort, Boil, Aroma, Dry Hop. Warrior : Boil 29 885, Aroma 741.
- On en tire deux parts continues : la part au frais ((Aroma + Dry Hop) ÷ total) et la part d'ébullition (Boil ÷ total).

## Comment le moteur s'en sert
- Une part départage à rang égal ; elle ne fait jamais basculer une catégorie, et elle n'exclut jamais.
- Une donnée absente laisse le houblon au milieu : l'inconnu ne recule pas (L14).
- Les règles qui lisaient une étiquette d'usage (g2b à 60′, D106 dans Substituer, R4 de s3) sont à relire sous ce principe.

Voir [[substitution-moteur]], [[moteur-parcours-limites]] et [[penser-brasseur]].
