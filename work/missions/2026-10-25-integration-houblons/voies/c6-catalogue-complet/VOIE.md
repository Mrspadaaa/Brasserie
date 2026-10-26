# Voie c6-catalogue-complet : toutes les variétés au catalogue, et les noms bien rattachés

Agent : auteur (Sonnet). Cette voie touche les données et leur construction. Elle s'arrête quand le code, les tests, le build et le budget sont prouvés.

## Ses mots (26.10)
- « Il doit manquer quelques houblons aussi... »
- « Il faut tout mettre ?? Pas exclure certains ?? ». Décision D98 : au catalogue, toutes les variétés attestées par au moins une
  source. Rien n'est exclu à l'entrée. Ce qui a peu de données le dit ; le tri se fait dans les écrans.
- « SI un houblon à une origine non répertorié par exemple cascade CHE. Lié sa fiche à un cascade le plus proche et mettre une info avec
  Astérix » (#187).
- « Pour le moment récupère TOUT » ; « ne regroupe jamais plusieurs huiles » (D154).

## L'inventaire (voie c5 : `voies/c5-houblons-manquants/RESULTAT.md` et `manquants.json`)
- **(a)** 248 variétés manquent au catalogue de 318 : Krush (8 sources), Dolcita (6), Elani (5), Superdelic (4)… 51 sont citées par 2
  sources ou plus, 80 seulement par Brewer's Friend.
- **(b)** 58 formes produit. **Hors de cette voie** : leur modèle se décide après le diagnostic f1.
- **(c)** 49 noms mal rattachés. Exemples : « Mt. Hood », « Hallertauer Mittelfrüh », « NZ Cascade ». Ekuanot et Equinox sont en
  double : c'est la même variété (BarthHaas).
- **Paires douteuses** à ne pas forcer : Styrian Gold → Styrian Wolf, Cerera → Celeia, les codes HBC 522 et HS09326.

## À faire
1. **(c) Les rattachements.**
   - Une table d'alias dans la fusion (`scripts/collecte-hop/fusion.mjs`) et dans la construction du catalogue
     (`prototypes/houblons-v4/scripts/build-data.mjs`).
   - Les paires exactes et « proches » sûres y entrent. Les douteuses restent à part, en liste « à confirmer ».
   - Equinox devient un alias d'Ekuanot, avec un seul identifiant, et les recettes ou le stock qui pointaient l'un restent valides.
   - **L'origine non répertoriée** (Cascade CHE, NZ Cascade, Cascade (UK)…) se rattache à la variété la plus proche, avec un champ
     `origineNonRepertoriee` et l'origine lue. L'écran affichera un astérisque : ici, seulement la donnée et un test.
2. **(a) Les variétés manquantes** entrent au catalogue avec ce que leurs sources publient : α, β, cohumulone, huiles séparées, mots
   et usage.
   - Celles à une seule source, ou sans α, sont marquées `peuDeDonnees`.
   - Aucune valeur n'est inventée. L'inconnu reste inconnu, jamais 0.
   - Les règles de suspicion de la fusion s'appliquent (consensus, valeur aberrante).
3. **Le budget.**
   - Mesure la taille du pack et des chunks avant et après :
     - `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`, sur un build fait avec `VITE_HOP_V4=on`
       (B5 ≤ 160 ko) ;
     - le pack du prototype (≤ 560 ko, D85).
   - Si ça dépasse, propose et réalise le chargement paresseux des variétés `peuDeDonnees`, pour que le démarrage ne grossisse pas.
     Ne relève aucun plafond sans le dire en DÉCISION À PRENDRE.
   - Chronomètre `simulerCas`, `substitutes` et `proposeVoies` sur le catalogue agrandi, à chaud et à froid (L20).
4. **Les tests.**
   - Les alias, dont Ekuanot et Equinox, et « Cascade CHE » qui se rattache à Cascade avec `origineNonRepertoriee`.
   - Krush, Elani et Superdelic présents au catalogue.
   - Une variété `peuDeDonnees` qui ne passe jamais devant une variété documentée quand le reste est égal (D175 : ne rien exclure,
     mais ne pas la pousser non plus).
5. **Les empreintes.** Celles qui changent sont mises à jour avec une ligne de raison « c6 ».

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` vert. Seuls deux tests, dans `sourcesLignes.test.tsx`, peuvent
  être rouges à cause de la voie s2 en cours : dis-le.
- `npm run build` vert.
- Budgets mesurés et tenus, ou une DÉCISION écrite.
- La fusion est déterministe : deux passes, même sha256.

## Possède
- `scripts/collecte-hop/fusion.mjs` et `prototypes/houblons-v4/scripts/build-data.mjs`.
- `src/data/hopV4/` : `proto-data.json`, `complements*.json` et les packs régénérés.
- `src/domain/hopIndex/v4/data.ts`, seulement pour le chargement paresseux si nécessaire.
- Les tests neufs.
- `work/missions/2026-10-25-integration-houblons/voies/c6-catalogue-complet/`.

La voie d99 travaille dans `src/domain/hopIndex/v4/voies.ts`, `minoritaire.ts` et `palier.ts`, et s2 et p6 dans `src/ui/` : n'y touche
pas. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`. Écris RESULTAT.md tôt. Rends une ligne.
