# Voie g2a-departage : départager les houblons dans Suggérer (dry hop et chaud), sans changer ce que l'app montre

Agent : auteur (Sonnet). Cette voie touche du code du moteur. Elle n'est pas visible tant que le pilote n'a pas basculé le défaut.

## Pourquoi
Mesure de la voie g1 (`voies/g1-suggerer-moments/rapport.md`, § 1.2 et § 1.4) :
- Dans `proposeVoies`, l'effet d'une famille citée ne dépend pas de la variété.
- La liste se range donc par le nombre de familles citées, puis par la dérive d'IBU, puis par ordre alphabétique.
- Exemple, recette 21C, visée « plus d'agrumes » au dry hop : 23 houblons sont ex æquo en tête (African Queen, Belma, Galaxy…).

Le brasseur, le 26.10 : « la suggestion doit être pour du 60' comme pour du dryhopping ».

## Décision du pilote (D88, avis croisé Brasseur et Contradicteur : `conseil-suggerer-rang/question.md`)
Les deux regards rejettent un départage fondé sur le seul vocabulaire.
- Les clés « fiche marquée », « premier descripteur » et « part des fiches » lisent toutes les mêmes mots.
- Or l'outil récompense le vocabulaire connu, pas la puissance (`cerveau/metier/descripteurs-hors-familles.md`).
- Risque : rejouer « nelson sauvin est un houbon ordinaire » (L14).

**Trois clés seront mesurées.** Aucune n'est figée avant la confrontation aux houblons phares et le jugement du brasseur sur les
listes.

- **K1, la cascade de g1** :
  1. fiche marquée ;
  2. premier descripteur ;
  3. part des fiches ;
  4. signal d'huile, ou à défaut l'huile totale.
- **K2** :
  1. part des fiches qui citent la famille ;
  2. puis le signal d'huile **propre à la famille** seulement, jamais l'huile totale : linalol ou géraniol pour l'agrume et le
     floral, myrcène pour le résineux, thiols pour le tropical ;
  3. les ex æquo restants restent ex æquo, et sont signalés comme tels dans la sortie.
- **K3** : la valeur de la famille sur le radar Beer Maverick de la variété. Ce radar couvre 181 variétés ; cherche où il vit dans
  `src/data/hopV4/proto-data.json` ou dans les compléments. C'est une échelle de source, lue pour l'ordre seulement, jamais
  affichée comme une intensité.

Règles communes aux trois clés :
- **l'inconnu passe après le connu, jamais à 0** ;
- la clé vient **après la distance à la visée** et ne change jamais l'effet calculé : les barres de q2b restent identiques.

## À faire
1. **Le moteur.** Ajoute dans `src/domain/hopIndex/v4/voies.ts` une option `departage: 'aucun' | 'k1' | 'k2' | 'k3'`. Tu peux aussi
   en faire un petit module voisin, importé par `voies.ts`.
   - **Le défaut reste `'aucun'`** : le comportement d'aujourd'hui, à l'octet près. Les empreintes de `moteurInchange.test.ts`, de
     `prototypes/houblons-v4/tests/client-async.test.ts` et de `worker-calculs.test.ts` ne doivent pas bouger.
   - Une autre voie (m6) capture Suggérer dans l'app pendant que tu travailles : l'écran ne doit pas changer.
2. **Les tests** (`tests/unit/hopIndexV4/`, nouveaux fichiers). Pour chaque clé :
   - l'ordre à l'intérieur d'un groupe d'ex æquo change ;
   - les effets ne changent pas ;
   - l'inconnu passe après le connu.
3. **La mesure**, par un nouveau script dans `scripts/eval-hop/`, déterministe (deux passes, même sha256).
   - **Les houblons phares (L14).** Pour « plus d'agrumes », « plus de tropical » et « plus de floral », au dry hop et à 10′, sur
     la 21C et sur la stout de g1 : le rang de Citra, Nelson Sauvin, Motueka, Galaxy, Mosaic, Hallertau Blanc et Cascade, avec
     chaque clé, comparé à `'aucun'`. Juge chacun d'après sa réputation. Par exemple, Nelson Sauvin ne doit pas couler en
     « tropical » ou en « vin blanc et fruits » ; si un houblon coule, dis-le.
   - **La provenance du départage.** Pour chaque clé, combien de départages viennent de chaque étape. Pour K1, combien des 179
     valeurs viennent de l'huile totale.
   - **Le banc de 66 houblons de g1, coupé en deux moitiés** (L20). Choisis sur une moitié, juge sur l'autre :
     - le premier groupe médian ;
     - le rang de X ;
     - le rappel@10, qui n'est qu'indicatif : g1 a montré qu'il récompense parfois un artefact.
   - **Les 10 listes à montrer au brasseur**, en JSON dans la voie : pour chaque cas et chaque clé, les 10 premiers, chacun avec
     son α, ses familles et la valeur qui l'a départagé.
4. **Ta recommandation de défaut**, en une ligne de DÉCISION À PRENDRE, avec la raison chiffrée. Ne bascule pas le défaut toi-même.

## Critères
- `npx vitest run tests/unit/hopIndexV4` vert, empreintes inchangées.
- `npx vitest run prototypes/houblons-v4/tests` vert.
- `npm run build` vert.
- Le script rend la même sortie sur deux passes : même sha256, noté dans RESULTAT.md.
- `rapport.md` contient les chiffres, les rangs des houblons phares, la provenance et les deux moitiés du banc.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, et un nouveau module voisin pour le départage.
- `tests/unit/hopIndexV4/` : nouveaux fichiers seulement. La voie i2 y écrit aussi ; ne touche pas ses fichiers.
- `scripts/eval-hop/` : nouveaux fichiers seulement.
- `work/missions/2026-10-25-integration-houblons/voies/g2a-departage/`

N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
