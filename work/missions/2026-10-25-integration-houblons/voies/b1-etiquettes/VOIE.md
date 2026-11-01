# Voie b1-etiquettes — option B, étape 1 : étiquettes honnêtes et « 1 source », sans changer un chiffre

Agent : auteur (Sonnet). Écris RESULTAT.md tôt.

## Sa décision (31.10)
« B » : un panel croisé précalculé pour toutes les variétés, avec les ids conservés, en trois étapes (D201). Lis
`voies/v2-verite-croisee/RESULTAT.md`, § 3.2 et 3.3, et l'inventaire I18 à I20 et I23. Lis aussi `cerveau/metier/verite-croisee.md`.

## Ce qui est demandé (B1, l'option A de l'audit)
1. Corriger I18 à I20 et I23 : les 188 ajouts ne sont plus étiquetés « Beer Maverick ». Chaque plage dit ses vraies sources.
2. La confiance : une valeur qui n'a qu'une source porte « 1 source » ; sinon « n sources ».
   - **Un seul endroit** : c'est la ligne de sources de la fiche, là où la source est déjà montrée (D168, ses mots : « un endroit qui renvoie
     la source suffit. C'est tout »). Aucune mention ailleurs, aucune surcharge.
3. **Aucun chiffre ne change** : les empreintes du moteur sont identiques, à l'octet près.

## Critères
- Un test rouge sur HEAD, puis vert : un ajout n'est plus étiqueté « Beer Maverick », et « 1 source » apparaît là où il faut.
- Les empreintes `proposer`, `suggerer`, `substitutes` et `remplacants` sont inchangées.
- `npx vitest run tests/unit/hopIndexV4 --maxWorkers=2` : vert. Un rouge qui vient d'une autre voie (t3, c9) se note, sans se corriger.
  `npx tsc --noEmit` : sans sortie.
- `tests/integration/controle-sources-une-fois.mjs` : vert. C'est une exécution Chrome : écris-la dans une `DEMANDE EXECUTANT :`, à lancer
  dans `C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans` après `git checkout` de ton commit, ou au rejeu final.
- Une capture d'une fiche d'ajout et d'une fiche à une seule source, ouverte (L12). Fais-la au rejeu si tu ne peux pas lancer de serveur.

## Possède
- Les fichiers d'étiquette et d'affichage des sources que cite l'audit : `data.ts`, `donnees.ts`, `sources.ts`, `fiches.ts`,
  `MarquesVue.tsx`, et leurs tests.
- `work/missions/2026-10-25-integration-houblons/voies/b1-etiquettes/`.

c9 possède `catalogue-ajouts.json` et `alias-noms.json` ; t3 possède `voies.ts` et `typicite*`. N'y touche pas. Pas de serveur dans l'arbre
principal. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
