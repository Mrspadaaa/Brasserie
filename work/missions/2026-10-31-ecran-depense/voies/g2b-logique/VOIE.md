# Voie g2b-logique — sûr quand c'est sûr, une nature qui suit sa famille, aucun « ? » hors stock

Agent : `auteur` (Sonnet). Plafond : 80 tours. Lire d'abord `../g-commun.md`, puis `src/ui/depense/confiance.ts` (D277), `src/ui/depense/familles.ts`,
`src/ui/depense/finale.ts`. Travaille dans le worktree ; tests, tsc par `copie.mjs`. La voie g2a écrit en même temps dans l'écran (voir Possède).

## Méthode (L13)
Pour chaque défaut : un test qui échoue sur HEAD (sortie gardée dans `voies/g2b-logique/rouge-*.txt`), puis la correction, puis vert. Lignes fictives
du même genre que sa pièce (une quincaillerie : pot de vernis « 5,8KG » à 1, brosses, détartrant, ruban, combinaison) ; jamais ses valeurs. Chaque
règle se vérifie aussi sur les pièces de brassage du banc : **aucune** ligne d'ingrédient (malt, houblon, levure, sucre, additif) ne change de niveau
ni d'unité (compte avant / après sur `rejeu-k6.json`, comme f2-confiance : 0 « sûr » faux).

## Ce qu'il faut corriger (défaut du pilote, réversible)
1. **D328a, sûr quand c'est sûr.** Hors des familles d'ingrédients, une ligne à quantité entière dont q × prix = montant tombe juste est une pièce
   `sur` (rien d'affiché), y compris quand le nom porte une contenance (un pot « 5,8KG » à 1 est une pièce). Les familles d'ingrédients gardent leurs
   règles d'aujourd'hui.
2. **D328b, rien de « ? » hors stock.** Une ligne d'une nature hors stock (`maintenance`, `other`, `service`…) n'est jamais `inconnu` pour l'unité ni
   comptée « ? » dans un en-tête (`groupes.ts`, `qteDe…`) : sa quantité se montre avec l'unité déduite (pièce) ou sans unité, au niveau `sur`.
3. **D328c, la nature suit la famille.** Une ligne lue `stock` (→ `ingredient`, `scanKind` de `finale.ts:35`) dont la famille, lue sur son nom, sa
   catégorie lue ou la catégorie de la dépense, est hors ingrédients et sans catégorie de stock (`STOCK_CATEGORIES`) prend la nature de sa famille
   (nettoyage → `cleaning`, rénovation et autres → `other`, emballage → `packaging`, matériel → `equipment`, si ces familles n'ont pas de stock chez
   lui : vérifie) ; elle ne part pas en stock, ne crée aucun article (« nouveau ») ; un article déjà au stock relié par référence ou par nom la garde
   en ingrédient. Le type d'achat de chaque ligne = sa bande. Ce qu'il change à la main reste le sien.
4. Rends au pilote la liste des fonctions changées et leur effet sur les pièces du banc (compte avant / après par niveau et par nature).

## Possède
`src/ui/depense/confiance.ts`, `src/ui/depense/familles.ts`, `src/ui/depense/groupes.ts`, `src/ui/depense/finale.ts`, `tests/unit/depense/g2b/**`, les tests
existants de `tests/unit/depense/confiance/` et `tests/unit/depense/groupes*` que ses changements rendent caducs (dire lesquels et pourquoi),
`work/missions/2026-10-31-ecran-depense/voies/g2b-logique/**`. Interdits : les fichiers de la voie g2a, `functions/**`.

## Critères (le pilote les rejoue)
1. Chaque défaut 1 à 3 : un test rouge sur HEAD (sortie gardée) puis vert.
2. Pièces de brassage du banc : 0 changement de niveau ou d'unité sur une ligne d'ingrédient (sortie avant / après gardée).
3. `copie.mjs "npx vitest run tests/unit/depense"` vert (hors échecs connus d'environnement, nommés) ; tsc vert.
4. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/g2b-logique/RESULTAT.md`, puis une ligne `G2B OK — …` ou `G2B ECHEC — …`.
