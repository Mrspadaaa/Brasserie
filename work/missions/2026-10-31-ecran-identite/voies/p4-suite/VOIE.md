# Voie p4-suite — la suite de tests se termine : le singe de l'atelier de l'eau et les hopV55 épuisent la mémoire

- Mission : 2026-10-31-ecran-identite (le déploiement d'Identité attend `npm test` entier vert)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (diagnostic, puis code avec un choix)
- Plafond : 80 tours ; 3 essais par critère
- Décideur en cas de doute : pilote (écris `DÉCISION À PRENDRE : …` dans RESULTAT.md et prends l'option prudente et réversible)

## Ce qui est su (31.10, nuit, pilote)
- `npm test -- --maxWorkers=2` ne se termine pas sur ce poste. Un processus Vitest meurt avec « FATAL ERROR: Ineffective mark-compacts
  near heap limit … JavaScript heap out of memory », vers 4 080 Mo, puis « Channel closed » (voie p3, `voies/p3-champ/RESULTAT.md`).
  Même chose avec le `ChampNombre.tsx` de HEAD.
- **Reproduit seul** : `npx vitest run tests/integration/monkey.test.tsx --maxWorkers=1 --logHeapUsage --reporter=verbose`. On voit
  « atelier de l'eau, graine 1 » vert (423 Mo), « graine 7 » vert (623 Mo), puis FATAL pendant la **graine 42**. Le monkey de
  l'assistant (graines 3, 11, 99) n'a pas été atteint.
- `tests/integration/hopV55*` (68 fichiers) : selon p3, ils épuisent aussi la mémoire du processus ; on ne sait pas lequel.
- Le reste de `tests/integration`, en six parts, est vert ; `tests/unit` est vert (6 955 tests).

## Objectif
1. **Trouver le geste** : rejoue la graine 42 de `lacherLeSinge(atelier, 42, 250)` et note le numéro du tour et le geste où la mémoire
   s'emballe. Méthode suggérée : journal et `process.memoryUsage()` par tour, dans un fichier de sonde à toi, hors du dépôt ou dans
   ton dossier.
2. **Nommer la cause** :
   - soit un défaut de l'app : une boucle ou une allocation sans borne dans `SaltSolver` ou ses enfants, pour une valeur tapée au
     hasard, par exemple un volume ou une dose extrême. Un brasseur pourrait figer l'écran de la même façon : c'est le cas qui compte ;
   - soit un défaut du test : son journal, ses vérifications, un écouteur jamais retiré.
3. **Corriger à la cause**, avec un test qui échoue avant la correction (L13) :
   - défaut de l'app : borne ou garde dans l'app, plus un test unitaire ou d'intégration court qui rejoue le geste fautif ;
   - défaut du test : corrige le harnais.
   Dans les deux cas, ne réduis jamais le singe : pas une graine ni un geste en moins, pas une assertion ni un plafond affaiblis.
4. **hopV55** : trouve quel fichier épuise la mémoire quand il tourne seul (`--logHeapUsage`). Nomme la cause et corrige-la de même.
   Si un fichier est lourd par nature (catalogue entier), dis-le avec ses chiffres. Hausser le tas (`execArgv`, `poolOptions`) n'est
   permis que si la mesure le justifie, et tu l'écris.
5. Rejoue la suite entière : `npm test -- --maxWorkers=2`. Une suite qui dure plus de 10 minutes se lance en arrière-plan, avec un
   journal en fichier.

## Possède (seuls chemins où écrire)
- `tests/integration/monkey.test.tsx` (harnais seulement, jamais une graine ni un geste en moins)
- `src/ui/SaltSolver.tsx` et les fichiers de l'atelier de l'eau que la cause désigne (`src/ui/water*`, `src/domain/water*`) :
  écris dans RESULTAT.md la liste exacte de ceux que tu touches
- les fichiers `tests/integration/hopV55*` et `src/ui/hopV55*` ou `src/services/hopV55/*` que la cause désigne : liste-les aussi
- `vitest.config.ts`, seulement si la mesure le justifie
- les tests neufs de la correction, sous `tests/unit/` ou `tests/integration/`
- `work/missions/2026-10-31-ecran-identite/voies/p4-suite/`

Interdits :
- les fichiers des autres voies en cours : `src/ui/identite/`, `src/ui/finance/`, `src/services/purchaseEntry.ts`,
  `src/services/stockLineMatching.ts`, `tests/unit/identite/`, `tests/unit/depense/` ;
- `functions/.env` (ne pas le lire), `source4-portable-bundle-manifest-01.json`, `.codex/`, `work/refonte-frontend/` ;
- aucun appel Gemini : la suite reste simulée ;
- aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`, aucune installation dans `node_modules`, pas de `git stash`, aucun commit.

## D'abord
Écris `COMPRIS.md` dans ce dossier, avec ces parties : Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes. Lance G1, puis
seulement après, diagnostique.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` :
- ligne 1 : `OK — monkey graine 42 : <cause en 8 mots> ; hopV55 : <cause> ; npm test vert` ou `ECHEC — …` ;
- le geste fautif (numéro du tour, geste, mémoire avant et après) ;
- la cause et la correction, avec le fichier et la ligne ;
- `TEMOIN AVANT` : le test neuf, rouge avant la correction (sortie) ;
- les fichiers touchés ;
- les durées et la mémoire de la suite entière ;
- `LEÇON PROPOSÉE : …` ou `aucune`.

Puis une ligne au pilote.
