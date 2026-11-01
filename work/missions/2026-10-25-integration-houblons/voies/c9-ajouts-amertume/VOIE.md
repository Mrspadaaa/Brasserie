# Voie c9-ajouts-amertume — « Il doit manquer des choses » : les 76 ajouts sans amertume

Agent : auteur (Sonnet). Les données du catalogue, pas l'écran. La voie s'arrête aux données, aux scripts, aux tests et aux mesures. Le
mécanique va dans une `DEMANDE EXECUTANT :`. Écris RESULTAT.md tôt.

## Ses mots (31.10)
Sur « Substituer à 60′ ne met plus en tête de houblons à l'amertume inconnue » : « On en a vraiment ? Avec toutes Nos données comment c'est
possible ?? » ; puis « Il doit manquer des choses » (D199).

## Ce qu'a vu le pilote
- `src/data/hopV4/catalogue-ajouts.json` (c6, D98) : 188 variétés citées par les sources et absentes de Beer Maverick. **76 n'ont aucun
  α** (`alpha: null`, ni `hs`, ni cohumulone, ni usage). Exemples : Bru, Kohia Nelson, Limequat, Mapuche, machops, Mega Motueka, Cluster
  fugget, Extra styrian dana. Elles n'ont que des fiches d'arôme.
- Trois causes probables, à prouver une par une :
  1. **Des doublons mal rattachés** : « Bru » serait BRU-1, « Extra styrian dana » serait Styrian Dana… Vois `src/data/hopV4/alias-noms.json` et
     `rattachement.mjs`.
  2. **Des noms qui ne sont pas des variétés** : un produit, une marque, une coquille. Ce serait le cas de machops, Limequat ou Mega Motueka.
  3. **Une donnée collectée mais pas fusionnée.** Beer Analytics (`src/data/hopSources/beeranalytics-*.json`, non suivis par git, présents
     ici ; la couverture est dans `work/missions/2026-10-25-integration-houblons/voies/c3h-beer-analytics/couverture.md`) donne pour 92 %
     de ses 435 houblons l'α et le β déclarés par les recettes, la classe α, l'origine et l'usage par moment. 174 d'entre eux sont absents
     du catalogue de base. D'autres sources de `src/data/hopSources/` peuvent avoir l'α : hopslist, brewersfriend, yakimavalleyhops,
     bsg, barthhaas, hopsdirect, nzhops, usahops…

## Ce qui est demandé
1. **Un tableau des 76**, une ligne par variété :
   - la cause (doublon de X, pas une variété, donnée trouvée dans telle source, ou rien nulle part) ;
   - la preuve : le nom dans la source, l'URL de la fiche ;
   - ce qui est trouvé : α, β, cohumulone, huile, usage.
2. **Les corrections, par un script rejouable**, pas à la main :
   - **un doublon** devient un alias de la variété existante, dans `alias-noms.json`, et son entrée d'ajout est fondue, sans perdre ses
     fiches. Ne fonds rien sans preuve : un nom proche ne suffit pas, il faut la même origine ou une source qui les dit identiques ;
   - **ce qui n'est pas une variété** est marqué comme tel (`nature: 'produit' | 'inconnu'`) et ne sort plus comme remplaçant. C'est un
     drapeau, pas une suppression ;
   - **une donnée trouvée** remplit `alpha`, `beta`, `cohumulone`, `oil` et `usage`, avec sa source, et une marque quand c'est « déclaré par
     les recettes » (Beer Analytics) et non une fiche de producteur. Le moteur doit pouvoir le dire. Garde la forme actuelle des plages.
   - **rien nulle part** : laisse inconnu. L'inconnu n'est jamais 0 (L14).
3. Les 174 houblons de Beer Analytics absents du catalogue : combien manquent vraiment, et faut-il les ajouter ? Une proposition chiffrée,
   pas d'ajout massif sans le dire.

## Critères
- Un script `scripts/collecte-hop/c9-ajouts.mjs`, rejouable et déterministe, avec un mode `--verifier` qui rend `C9 OK`.
- Avant et après : le nombre d'ajouts sans aucune variable d'amertume connue (aujourd'hui 76). Et Substituer à 60′ pour Nugget, avec les 10
  premiers rangs (`work/missions/2026-10-25-integration-houblons/voies/d60-diagnostic/d60-bru.ts`, ou ton banc).
- Témoin : un test qui échoue sur HEAD. Par exemple, « Bru » n'est plus un candidat à part, ou bien son α est connu.
- Non-régressions :
  - `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` ;
  - `tests/unit/hopIndexV4/collecteBeerAnalytics.test.ts` ;
  - les empreintes, avec la raison « D199 » si elles changent ;
  - B5 ≤ 164 ko, car les ajouts se chargent à part.
  La voie t3 change le moteur en même temps : un rouge qui vient d'elle se note, sans se corriger.

## Possède
- `src/data/hopV4/catalogue-ajouts.json`, `src/data/hopV4/alias-noms.json`.
- Le script qui produit les ajouts (cherche lequel : c6), et `scripts/collecte-hop/c9-*`.
- Les tests des données concernés.
- `work/missions/2026-10-25-integration-houblons/voies/c9-ajouts-amertume/`.

N'écris jamais dans `src/data/hopSources/`. La voie t3 possède `voies.ts`, `typicite*.ts` et `typicite-styles.json` : n'y touche pas. Pas de
serveur ni de Chrome. Aucune donnée réelle (Firestore). N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit.
Rends une ligne.
