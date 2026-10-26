# Voie t1-traduction — aucun mot anglais affiché depuis les nouvelles sources (D160)

Agent : auteur (Sonnet), pour des données et du code.

## Le constat (pilote, 26.10)
Sur la capture de Substituer à 60′ de la page m4 (`voies/m4-listes-60/img/magnum-us-60-v2.png`), le face à face affiche des
mots anglais tels quels :
- Magnum (US) : « lui seul : muscade, **no distinct aroma characteristics** » ;
- Magnum (GR) : « lui seul : **net, clean bitterness** ».

Ces mots viennent des descripteurs des 12 sources entrés dans les fiches (voie d4, D83). La traduction de l'app
(`src/ui/hopIndex/fiche/traduction.ts`, `versFr`, `tagsFr`) ne les connaît pas.

## La règle
L'app est en français. Un descripteur affiché est traduit. Une phrase qui n'est pas un arôme ne s'affiche pas comme un mot
d'arôme : « no distinct aroma characteristics », « clean bitterness », « good for bittering »… Elle reste dans la donnée, avec sa
source, mais ne s'affiche pas parmi les mots.

## À faire
1. **Inventaire** : tous les mots et toutes les phrases des descriptions du catalogue (`proto-data.json`, les 12 sources) qui n'ont
   pas de traduction. Leur nombre, et les 50 plus fréquents.
2. **Classe-les** :
   - descripteur d'arôme, à traduire ;
   - générique (règle GENERIQUE de l'app) ;
   - pas un arôme, à écarter de l'affichage.

   Écris la règle de tri, et les cas douteux dans le rapport.
3. **Traduis** les descripteurs dans la table de traduction de l'app, au même endroit et dans la même forme que les traductions
   existantes. Une traduction de brasseur, en minuscules, courte. Pas de traduction automatique en ligne : tu traduis toi-même.
4. **Un test (L13)** qui échoue d'abord : pour les 318 houblons, chaque mot montré par « lui seul », « Ses mots » et la feuille Sources
   est en français, ou c'est un nom propre (houblon, lieu), ou un mot laissé tel quel par une décision écrite (« dank »…).
5. Les mots changent : cela peut changer les familles. Le lexique lit le texte anglais d'origine. Vérifie que
   `moteurInchange.test.ts` ne bouge pas, ou explique pourquoi.

## Critères
- Le test : rouge sur HEAD, vert après.
- `npx vitest run tests/unit/hopIndexV4` vert ; prototype `npx vitest run --root prototypes/houblons-v4` vert ; `npm run build` vert ;
  B5 ≤ 160.
- Capture de Substituer de Magnum (US) à 60′, avant et après, ouverte : plus aucun mot anglais.

## Possède
- `src/ui/hopIndex/fiche/traduction.ts`, et la table où vivent les traductions (dis laquelle).
- Le filtre d'affichage des phrases qui ne sont pas des arômes, à l'endroit où les mots se forment.
- `tests/unit/hopIndexV4/`.
- `work/missions/2026-10-25-integration-houblons/voies/t1-traduction/`.

La voie s1 touche en ce moment les traits de sources dans `src/ui/hopIndex/` : si tu dois toucher un même fichier, dis-le et ne
touche que tes lignes. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
