---
name: moteur-parcours-limites
description: Ce que le moteur de la maquette jouable ne sait pas simuler (moments, levure, visée en palier) et ce qu'on en tire honnêtement à l'écran.
type: metier
maj: 2026-10-26
sources: prototypes/houblons-v4/parcours/src/moteur/index.ts (MOMENTS_SIMULES, l. 107) ; work/missions/2026-10-25-integration-houblons/voies/g1-suggerer-moments/rapport.md ; RESULTAT.md des voies p3-comparer, p4-dryhopper, r4-suggerer, dh4a, dh4b, jc-levure de work/missions/2026-10-23-maquette-parcours/voies/
---

Relevé par les voies de la maquette jouable (24.10). Le moteur reste celui de [[modele-brassage]] ; son coût est dans
[[cout-calcul-moteur]].

- **Moments** : l'arôme n'est simulé qu'à 60′, 10′, au whirlpool, au dry hop actif et après (`MOMENTS_SIMULES`). Entre
  deux, seule une interpolation dessinée comme telle est honnête ; ailleurs l'écart est inconnu, jamais 0 (D65).
- **Levure** : `effetLevure` et `lireBiere` ne modélisent pas l'arôme propre d'une souche ; l'écart de levure se lit par
  `proposeVoies(…, { leviersLevure: true })`. Idaho 7 : Verdant et Diamond ne changent rien (centre 0 par convention, donc
  inconnu) ; seule Pomona bouge (~+13 agrumes, confiance faible).
- **Visée** : en palier absolu, l'ensemble des voies dépend de l'ampleur ({ floral 0,57 } perd 5 voies sur 13 face à
  { floral 1 }) : lire la visée en crans entiers.
- **Reproductible** : avec { floral 1, citrus 1, resin −1 } et `leviersLevure`, `proposeVoies` redonne exactement le cas
  c1 de q2b, en direct, sans grille figée.
- **Stout 16D à 4 g/L** : le floral gagné est le même à 10′ et au whirlpool (écart < 0,05 cran) ; seul l'IBU les sépare
  (~37 contre ~15 pour Idaho 7).
- **Galaxy** : le moteur simule 18,9 sur 100 de baies alors qu'aucune fiche ne les cite, et la stout y est inconnue :
  l'écart d'une bière inconnue se mesure depuis 0, ce qui le grossit.
- **Suggérer ne départage pas les variétés** (g1, 26.10). Dans `proposeVoies`, l'effet d'une famille citée ne dépend que du
  moment et de la dose, jamais de la variété : on mesure une seule valeur pour les 233 houblons qui citent l'agrume. L'ordre
  est donc :
  1. le nombre de familles citées ;
  2. la dérive d'IBU ;
  3. l'ordre alphabétique (21C, agrumes au dry hop : 23 ex æquo en tête).

  Les moments sont fixés en dur (10′, whirlpool, dry hop) : aucun ajout à 60′, aucune visée d'IBU.
