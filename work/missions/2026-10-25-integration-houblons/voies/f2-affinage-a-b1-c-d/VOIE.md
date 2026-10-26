# Voie f2-affinage-a-b1-c-d : les corrections d'affinage qui ne changent pas son écran

Agent : auteur (Sonnet). Cette voie modifie le moteur. Elle s'arrête au code, aux tests, au build et aux mesures. Pour la suite mécanique,
écris une `DEMANDE EXECUTANT :`.

## Base
Le diagnostic f1 est dans `voies/f1-affinage-diagnostic/rapport.md` (DÉCISION, plan de A à F) et dans `RESULTAT.md`. Lis-les. Son principe
est dans `cerveau/metier/substitution-moteur.md`, dernière puce : l'α se règle par la dose ; il compte, mais pas seul, et selon le style.

## Décision du pilote (D102)
1. **A, correctif.**
   - Dans Suggérer, le pool « à acheter » se fait par clé et non plus par variété : Citra simple et Citra Cryo ont chacun leur place.
   - La démotion « produit d'arôme » s'applique à 60′.
   - Pour une forme produit, le rang du palier se calcule sur l'α **de la variété**, pas sur celui du lot. Code concerné : `voies.ts`
     l. 238, 244, 487 et 536, `palier.ts`, `infoPalierDe`.
   - Contrôle de D174 : Citra simple apparaît partout où Citra Cryo apparaît, sauf raison écrite. Citra Cryo n'est plus 1er à 60′ du seul
     fait de son α de lot.
2. **B1.** Dans Suggérer, on classe tout, puis on coupe à l'affichage. `buyLimit 4` et `perHop 2` deviennent des limites d'**affichage**, et
   `maxBuy` est retiré. Le nombre de rangées montrées ne change pas.
   - Mesure le coût (L20) : il ne doit pas régresser au-delà du bruit, selon `npm run check:hop-perf` et `proposeVoies`, à chaud et à
     froid.
   - Contrôle de D175 : aucun phare n'est coupé avant le rang final, sauf par une exclusion écrite (D90).
3. **C, J1.** Dans Substituer, à 60′ : α de 0,4 à 0,15, β 0,25, cohumulone 0,3, usage 0,3, selon la mesure de f1 sur l'autre moitié.
   Vérifie d'abord le poids actuel du code : f1 lit 0,7 à `substitution.ts:30`, et non 0,8. Mets à jour les empreintes avec une ligne
   « D102 ».
4. **D, le banc.** Mets dans `scripts/eval-hop/` le banc de f1 : P1 (substituts Hopsteiner par moment, Hopslist, Hops Direct), P2 (ses
   jugements), P3 (Beer Maverick, α constant). Jamais Beer Maverick seul. Rejoue-le avant et après A, B1 et C, et donne les chiffres.

Hors de cette voie :
- B2, l'affichage de Substituer, à lui montrer ;
- B3, D90 en drapeau ;
- S, Suggérer 60′ par ressemblance, après le test à l'aveugle ;
- F, les formes : modèle (b), en mini maquettes.

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` vert. Les empreintes changées portent une raison.
- `npm run build` vert.
- `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`, build fait avec `VITE_HOP_V4=on`.
- Les contrôles de D174 et D175 échouent sur HEAD, puis passent.
- Le banc D rend la même sortie sur deux passes.
- Rapport des houblons phares (L14), avant et après.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `palier.ts`, `substitution.ts` et `departage.ts`.
- Les tests d'empreinte : `moteurInchange.test.ts`, `client-async.test.ts`, `worker-calculs.test.ts`.
- Les tests neufs.
- `scripts/eval-hop/` : nouveaux fichiers, et les `f1-*.ts` à reprendre.
- `work/missions/2026-10-25-integration-houblons/voies/f2-affinage-a-b1-c-d/`.

La voie c7 travaille dans `data.ts`, `hops.ts`, `quickAdd.ts` et `voies.ts`, cette dernière seulement pour le tri `peuDeDonnees`. Si vous
touchez `voies.ts` tous les deux, fais tes changements par Edit ciblés, relis le fichier avant chaque Edit, et signale tout conflit.
N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`. Écris RESULTAT.md tôt. Rends une ligne.
