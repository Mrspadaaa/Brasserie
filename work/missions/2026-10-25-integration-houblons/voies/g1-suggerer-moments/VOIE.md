# Voie g1-suggerer-moments — Suggérer à 60′ comme au dry hop, et l'IA par-dessus (diagnostic, puis plan)

Agent : auteur (Sonnet), pour un diagnostic chiffré et un plan. **Cette voie ne change pas l'écran** : son choix est q2b
(`work/refonte-frontend/v4/choix/ecrans.json`, entrée `suggerer`). Une évolution de l'écran lui sera montrée en mini maquettes.

## Ses mots (26.10)
- « Est-ce que l'ia est bien présente pour la substitution ? Elle peut aussi être présente pour la suggestion. »
- « Attention, la suggestion doit être pour du 60' comme pour du dryhopping »
- Plus tôt : « Pas que 10' mais surtout 60' » (sur Substituer).

## Ce qui est connu
- Le banc e1 (`voies/e1-banc-eval/RESULTAT.md`) : Suggérer ne départage pas les houblons qui citent les mêmes familles. Il les rend
  en un seul groupe, rangé par ordre alphabétique, parce que l'effet d'une famille citée ne dépend pas de la variété.
- Depuis, les descripteurs de 12 sources sont entrés dans les fiches (d4), et Substituer a un moteur v2 avec trois moments (e2).
- L'écran Suggérer : `src/ui/hopIndex/suggerer/`. Le moteur : `src/domain/hopIndex/v4/voies.ts` (`proposeVoies`) et ce qu'il appelle.

## À faire
1. **Diagnostic, chiffré, sur sa recette type** (21C, et la stout 16D des fixtures) :
   - à quels moments Suggérer propose-t-il aujourd'hui ? Peut-il proposer un ajout à 60′, un amérisant pour une IBU visée ? Comment
     le moment est-il choisi : par l'écran, la visée, ou en dur ?
   - Que rend-il à 60′ et au dry hop, pour 3 visées (plus d'agrumes, plus d'amertume, moins de résineux) ?
   - Le banc e1 de Suggérer, rejoué sur les données d'aujourd'hui : le groupe d'ex æquo est-il toujours là ?
2. **Plan**, en DÉCISION À PRENDRE, avec le coût estimé de chaque partie :
   - (a) le moteur : départager les houblons, par une intensité par variété (huiles, pouvoir aromatique, mots fins, comme v2), et un
     jeu à 60′ (α, cohumulone, β, usage) ;
   - (b) l'écran : comment le brasseur choisit 60′ ou dry hop dans q2b. Si q2b le permet déjà, comment ; sinon, des variantes à lui
     montrer ;
   - (c) l'IA : le même callable que Substituer (voie i2, en cours), en mode « suggestion », sur les 20 premiers du moteur.
3. Rien dans `src/`. Tes mesures se font par des scripts dans `scripts/eval-hop/` (nouveaux fichiers seulement).

## Critères
- `rapport.md` dans la voie : chiffres, exemples et plan.
- Les scripts sont déterministes (deux passes, même sha256).
- `npx vitest run tests/unit/hopIndexV4` vert (rien ne doit bouger).

## Possède
- `scripts/eval-hop/` (nouveaux fichiers seulement).
- `work/missions/2026-10-25-integration-houblons/voies/g1-suggerer-moments/`.

N'écris aucun code par heredoc ni par `node -e`.

Écris RESULTAT.md tôt. Retour en une ligne.
