# Voie t3-usage-au-frais — R4 lit l'usage réel au frais (Beer Analytics), pas le seul « mixte » de Beer Maverick

Agent : auteur (Sonnet). Le moteur et sa table dérivée. **Pas de serveur ni de Chrome** : la voie k1 travaille dans l'arbre, et le
contrôle Chrome viendra au rejeu. Le mécanique va dans une `DEMANDE EXECUTANT :`. Écris RESULTAT.md tôt.

## Le défaut
Sa neipa v3 est saturée (78 g de Lotus à 20′ et 144 g au dry hop actif). À « plus d'agrumes » au dry hop actif, Suggérer met en tête
Warrior, Cashmere, Columbus et Nugget. R4 (s3, commit 4a752523) fait reculer un amérisant au whirlpool et au dry hop, mais elle lit
l'usage de Beer Maverick, qui classe Warrior, Columbus et Nugget en « mixte » : rien ne bouge. Lis `voies/s3-saturation/RESULTAT.md`
(sections R4).

## La donnée
Beer Analytics, dans `src/data/hopSources/beeranalytics-*.json` (non suivis par git ; présents ici), donne :
- `stats["usage-types"].parMoment`, le nombre de recettes par moment (Mash, First Wort, Boil, Aroma, Dry Hop). Warrior : Boil 29 885,
  Aroma 741, Dry Hop peu ;
- la catégorie du site dans `categorie` ou dans l'URL (`/hops/bittering/warrior`).

## Ce qui est demandé
1. La part au frais d'un houblon : (Aroma + Dry Hop) ÷ toutes ses recettes. Ajoute-la à la table dérivée par
   `scripts/collecte-hop/typicite-styles.mjs`, qui écrit `src/data/hopV4/typicite-styles.json`.
   - L'en-tête dit la source et la licence (CC BY-SA 4.0).
   - Mets la table à la place d'aujourd'hui, ou à côté.
   - Le poids reste hors du chunk B5 : elle se charge déjà à part.
2. R4 lit cette part. Au whirlpool et au dry hop, un houblon que les brasseurs n'emploient presque jamais au frais passe après les autres à
   rang égal, avec sa raison écrite.
   - Pose le seuil par principe et écris-le d'abord : par exemple, la catégorie « bittering » du site, ou une part au frais très
     inférieure à la médiane du catalogue. Il ne se règle jamais sur Warrior ni sur sa neipa (L20).
   - Sans donnée, rien ne change : l'inconnu ne recule pas.
   - Jamais une exclusion.
3. Si la position de R4 (après la clé de départage) l'empêche d'agir sur la neipa saturée, mesure aussi une position plus haute.
   Garde-fou : les reculs des phares traditionnels au dry hop que s3 a vus (jusqu'à 70 places).

## Critères
- `node scripts/collecte-hop/typicite-styles.mjs --verifier` : `TYPICITE OK`.
- Un test rouge sur 4a752523, puis vert.
- `npx vite-node` d'un banc `scripts/eval-hop/t3-*.ts` sur la neipa saturée, « plus d'agrumes » au dry hop actif : la tête, avant et après.
  Attendu : plus aucun houblon presque jamais employé au frais dans les 4 premiers.
- `s3-general.ts` (contradictions, phares), `f5-phares.ts`, Citra cryo sur 16 listes et East Kent Goldings premier du stout S1 : un tableau
  avant/après, sans régression.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : vert. `npx tsc --noEmit` : sans sortie.
- Les états, dans la `DEMANDE EXECUTANT` : `construire.mjs`, puis `controle-etats.mjs`.

## Possède
- `src/domain/hopIndex/v4/voies.ts` (R4 seulement), `typicite.ts` et `typicite-acces.ts`.
- `scripts/collecte-hop/typicite-styles.mjs`, `src/data/hopV4/typicite-styles.json`.
- `scripts/eval-hop/t3-*` (neufs), `tests/unit/hopIndexV4/saturationD195.test.ts` et un test neuf.
- `work/missions/2026-10-25-integration-houblons/voies/t3-usage-au-frais/`.

La voie k1 modifie `src/domain/hopIndex/v4/substitution.ts` : n'y touche pas. N'écris aucun code par heredoc ni par `node -e`. Pas de
`git stash`, aucun commit. Rends une ligne.
