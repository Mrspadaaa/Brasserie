# Voie h1-herbace — « trop herbal » : un critère à prendre en compte

Agent : auteur (Sonnet). Le moteur et ses données de style. La voie s'arrête au code, aux tests et aux mesures. Le mécanique va dans une
`DEMANDE EXECUTANT :`. Écris RESULTAT.md tôt.

## Ses mots (31.10)
« Il y a un écran qui met en lumière, trop herbal, genre de problème qui arrive lorsque l'on utilise du houblons frais. C'est un critère
aussi important à prendre en compte » (D197).

L'écran, c'est sans doute le panel OSU de Comparer, sur Cascade (`src/ui/hopIndex/comparer/Feuilles.tsx`, vers la ligne 415 ;
`comparer/valeurs.ts`, `panelOSU`, étude E04, source H22) : « les agrumes plafonnent dès 8 g/L, l'herbacé monte encore ; 4–8 g/L ». Une
grosse dose au dry hop, ou du houblon frais, apporte de l'herbacé et du végétal au lieu de plus d'agrumes.

## Ce qu'a trouvé le pilote (à vérifier)
- Le moteur a une courbe de dose propre à l'herbacé : `profil-simule.ts`, `courbeDe`, avec les familles `agrumes`, `herbace` et
  `intensite`, chacune avec son K.
- En 22A, `src/data/hopV4/style-bands.json` met `herbal` et `green` en `neutre`, bande [0, 30], sans source (`from: []`).
- Depuis a4 (D125, règle 1, `DEBORDEMENT_NEUTRE_DEFAUT`), l'excès d'une famille neutre ne compte plus au rang. Donc rien ne freine une
  dose qui rend la bière herbacée. Sur sa neipa saturée (78 g de Lotus à 20′, 144 g au dry hop), plus de dry hop ajoute de l'herbacé sans
  rien d'agrumes.

## Ce qui est demandé
1. **Vérifier le modèle contre la donnée.** Compare la courbe simulée de l'herbacé et des agrumes, en fonction de la dose de Cascade au dry
   hop (1 à 16 g/L), avec les mesures E04 de `panelOSU`. Tableau, et écart. Si le simulé ne monte pas comme la mesure, corrige le K depuis
   la donnée. Ce réglage se fait sur Cascade et se juge sur un autre houblon ou une autre source s'il y en a une (L20). Dis-le sinon.
2. **Une règle de principe.** Un excès d'herbacé ou de végétal au-dessus de la bande est un défaut, même quand le style n'en dit rien :
   le BJCP range le goût d'herbe coupée parmi les défauts.
   - Ces deux familles comptent donc au rang et en « hors du style » quand elles sont `neutre`.
   - Exceptions :
     - quand le brasseur demande d'en ajouter (s3 R1 : sa demande prime) ;
     - quand le style les attend (`attendue`).
   - Écris la règle avant de mesurer.
   - Elle ne touche pas à a4 pour les autres familles neutres, comme la poire d'El Dorado.
3. **L'effet attendu.** Sur la neipa saturée, « plus d'agrumes » ne propose plus d'ajouter une grosse dose au dry hop qui n'apporte que de
   l'herbacé. Une voie qui garde l'herbacé dans la bande passe devant : le whirlpool, une dose moindre, ou un autre houblon.
4. **Le houblon frais.** Dis si le catalogue ou les formes connaissent une forme fraîche (wet hop). Si oui, mesure son herbacé. Sinon,
   écris-le dans RESULTAT.md comme un manque, sans rien inventer.

## Critères
- Un test par règle, rouge sur HEAD, puis vert (L13).
- Un banc `scripts/eval-hop/h1-*.ts` :
  - le tableau dose → herbacé et agrumes, simulé contre E04 ;
  - la neipa saturée, avant et après ;
  - les 124 cas d'`a4-general.ts` / `s3-general.ts` (phares, contradictions carte/liste, nombre de propositions).
- Non-régressions, en tableau :
  - El Dorado (D127) ;
  - Citra cryo premier dans 2 listes sur 16 au plus ;
  - East Kent Goldings premier du stout S1 ;
  - `f5-phares` ;
  - `bannirZero.test.ts`.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : vert. `npx tsc --noEmit` : sans sortie.
- Dans la `DEMANDE EXECUTANT` : les états (`construire.mjs`, `controle-etats.mjs`), le build à part et B5.

## Possède
- `src/domain/hopIndex/v4/voies.ts` (la règle du débordement seulement), `profil-simule.ts` (le K de l'herbacé, si la donnée le demande).
- `src/data/hopV4/style-bands.json`, seulement si tu y portes la règle au lieu de la coder.
- `scripts/eval-hop/h1-*`, des tests neufs, et les tests qu'une empreinte oblige à adapter, avec la raison « D197 ».
- `work/missions/2026-10-25-integration-houblons/voies/h1-herbace/`.

La voie k1 modifie `substitution.ts` : n'y touche pas. Pas de serveur ni de Chrome si une autre voie en fait tourner. N'écris aucun code par
heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
