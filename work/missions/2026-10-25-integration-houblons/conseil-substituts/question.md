# Avis croisé — le classement de Substituer (#181)

Niveau : avis croisé (skill `conseil`, 2 appels : Brasseur et Contradicteur ; le pilote tranche). Type de décision : déléguée au
pilote pour le moteur (réversible, un réglage), brasseur pour ce qu'il voit (les listes lui seront montrées côte à côte).

## Question cadrée
Faut-il changer le classement de `substitutes()` aux moments d'arôme (10′, whirlpool, dry hop) en y ajoutant la ressemblance des
**mots hors des 12 familles** (option 1), puis proposer un geste « Affiner avec l'IA » qui reclasse les 20 premiers avec Gemini
3.5 Flash-Lite (option C) ? Ou faut-il garder le moteur tel quel, ou choisir l'IA seule ?

## Faits mesurés (26.10)
- Banc hors ligne `scripts/eval-hop/banc-eval.ts`, contre les substituts publiés par Beer Maverick sur 217 houblons. Cette
  référence est imparfaite : elle n'est réciproque que pour 25 % des paires, et elle suit l'α plus que l'arôme.
  - Moteur actuel : rappel@10 de 10 à 11 %, MRR 0,12, environ trois fois le hasard. 10′, whirlpool et dry hop donnent le même
    classement.
  - Nelson Sauvin : Hallertau Blanc 155e. Les premiers sont Boomerang, Herkules et Phoenix, qui ne disent ni vin blanc, ni raisin,
    ni groseille.
  - **Option 1** : cosinus des mots hors famille, pondéré par leur rareté et mêlé au score d'arôme, λ = 0,25. MRR 0,12 → 0,20,
    rappel@10 11 → 18 %, rang médian 27 → 14. Hallertau Blanc 155e → **2e** pour Nelson Sauvin. Coût négligeable.
  - Option 2, des poids par moment (amertume 0,8) : meilleur MRR, mais c'est un alignement sur l'α de Beer Maverick, contraire à
    l'attente du brasseur sur Nelson Sauvin. Non recommandée.
  - Option 3 (radar Beer Maverick) : moins bonne que les mots.
- **Essai d'IA réel** (100 appels, 1,10 CHF, journalisés) :
  - IA 3.8 sur les 20 premiers du moteur, 78 cas : MRR 0,079 → 0,164. Elle ne peut pas remonter Hallertau Blanc, qui est hors
    de la fenêtre ; gain non établi à 60′.
  - IA sur les 20 premiers de l'option 1, 9 houblons phares au dry hop : MRR 0,18 → 0,56. Hallertau Blanc **1er** pour Nelson
    Sauvin. Mais 9 cas seulement.
  - Flash-Lite égale 3.8 en qualité sur 13 appels : p95 2,8 s et 0,003 CHF par geste, contre 7,4 s et 0,012 CHF pour 3.8.
- Le brasseur n'a vu aucune de ces listes.

## Contraintes
- L'app marche hors ligne : sans réseau, le moteur seul répond.
- L'écran Substituer est son choix u4, sans nouveau texte inutile. Sa règle : « pas de cockpit », les détails à un toucher.
- Son avis sur les houblons phares fait foi :
  - « nelson sauvin est un houbon ordinaire alors que c'est un un houbon incroyable » ;
  - « motueka est ultra fruité ».
- Fluidité : un geste ne doit pas figer l'écran. Une IA de 2 à 3 s doit rester un geste volontaire, avec un repli.
- Gemini en production est facturé : le brancher dans l'app demande son accord. L'essai, lui, est accordé.

## Ce qui est attendu de chaque regard
Un avis tranché, depuis ton regard, en 300 mots au plus :
1. option 1 seule, C (option 1 puis IA à la demande), IA seule, ou rien ;
2. le défaut fatal ou l'angle mort ;
3. ce qu'il faut montrer au brasseur avant de brancher quoi que ce soit.

## Sources (à ouvrir seulement pour vérifier un point)
- `work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/RESULTAT.md` et `resultats/rapport.md`.
- `work/missions/2026-10-25-integration-houblons/voies/ia1-reclassement/RESULTAT.md` et `resultats/rapport.md`.
- `cerveau/metier/substitution-moteur.md`, `cerveau/metier/descripteurs-hors-familles.md`.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, section Substituer.
