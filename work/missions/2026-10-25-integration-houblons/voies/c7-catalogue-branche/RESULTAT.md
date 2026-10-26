OK PARTIEL — catalogue plein branché (recherche, Substituer, Suggérer, marques, astérisque), tests verts ; B5 160,6 ko et fluidité « après » restent à trancher

GATES.md n'existe pas pour cette voie : critères pris de VOIE.md.

## Fichiers écrits
- Possède : `src/domain/hopIndex/v4/data.ts` (catalogue plein = un tableau à identité stable, `cataloguePleinCharge`, `siCataloguePleinArrive`), `hops.ts`, `voies.ts` (une clé de tri `peuDeDonnees` avant le nom), `quickAdd.ts` (idem, champ `peuDeDonnees`), `src/ui/hopIndex/precharge.ts` (chargement au repos, `chargerCataloguePleinAuRepos`), `maBiere/Ajouter.tsx` (recherche, clé de cache = recette + catalogue + stock), `maBiere/Carte.tsx`, `fiche/FicheHoublon.tsx`, neufs `fiche/marques.tsx` (enveloppe + hook), `fiche/MarquesVue.tsx` (marques, chargé à la demande).
- **Hors Possède (nécessaires, à valider)** : `src/ui/hopIndex/parcours/donnees.ts` (`configurerDonnees` prend le catalogue plein dès qu'il est arrivé et se rejoue à son arrivée ; `catalogueDuMoteur`), `src/ui/hopIndex/useHopData.ts` et `outils.ts` (le stock se relie aux 505 variétés), `src/domain/hopIndex/v4/donneesApp.ts` (`origineDuNom`, et `varieteDe` relie « Cascade CHE » à Cascade quand le nom seul ne trouve rien).
- Tests : `tests/unit/hopIndexV4/catalogueBranche.test.tsx` (10 tests). Voie : `capturer.mjs`, `premier-ecran.mjs`, `img/01-recherche-krush.png`, `img/02-asterisque-cascade-che.png`.

## Ce qui est fait
1. Chargement : le morceau `catalogue-ajouts` (104 ko, 10,7 ko gzip) arrive après les outils, au repos (`precharge.ts`), et à l'affichage de l'étape si le repos n'a pas eu lieu. Le premier rendu se fait sur les 317 ; à l'arrivée, `configurerDonnees` est rejouée et les propositions se recalculent.
2. Lecteurs : recherche et ajout (Krush trouvé, ajouté), candidats de Substituer (Krush parmi les remplaçants de Columbus), « à acheter » de Suggérer, Comparer (sa recherche lit `donnees().catalogue`), stock relié aux 505. Aucun filtre ajouté : seul un tri à égalité.
3. `peuDeDonnees` : à égalité, jamais devant une variété documentée, dans `quickAdds`, le pool de `proposeVoies` et `styleFit` ; marque « peu de données » sur la ligne d'ajout, la carte du rail et la fiche.
4. Astérisque : un article de stock « Cascade CHE » se relie à Cascade ; la ligne porte « * » ; au toucher : « fiche de Cascade (US) ; origine CHE non répertoriée ». Seul le stock écrit une origine (aucune donnée de catalogue ne la porte).
5. Hors ligne : le morceau est un import dynamique du build, donc mis en cache comme les autres chunks (non rejoué hors ligne ici).

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : 871 verts, 13 rouges, tous dans `affinageD102.test.ts` (voie f2 D102, en cours dans `voies.ts`). Je les ai rejoués avec mes tris retirés : ils échouent pareil. Mes 10 tests sont verts. Mordant vérifié : le test de `quickAdds` et celui des voies échouent sans mon tri.
- `tsc --noEmit` : propre. `VITE_HOP_V4=on npm run build` : exit 0.
- B5 : **160,6 ko > 160 : DÉPASSÉ** (profil-simule, hopExtrapolationBootstrap, styleSelection). Chunk `profil-simule` 147,3 ko gz. Ma part y est environ 0,35 ko ; le reste vient des modifications non commitées de f2 (`voies.ts`) et p6. Ni les marques ni `origineDuNom` ne sont dans ce chunk (marques à la demande). B1 921 ko et B2 773 ko : déjà dépassés avant.
- Deux captures 390 × 844 ouvertes (banc `?dev-local&etape=houblons`, `capturer.mjs` : CAPTURES OK) :
  - 01 : « krush » tapé, une ligne : « Krush α 10–14,1 % double », 10 g +4 IBU, bande d'arômes, pastille 10′ en pointillé, icône « à acheter ». Pas de marque (8 sources, documentée). Rien ne déborde.
  - 02 : stock « Houblon Cascade CHE 5,5% » posé dans le cache local du banc. La ligne Cascade (α 5,5 % aromatique, stock) porte « * » après l'icône ; touché, la phrase « * fiche de Cascade (US) ; origine CHE non répertoriée » passe sur sa ligne. Lisible. Limite : l'astérisque est loin du nom (fin de rangée) ; la ligne grandit de deux lignes quand elle est ouverte.
- Fluidité : **avant** = `npm run check:hop-perf` du début de voie : ECHEC (6), les mêmes six budgets que le tableau de c6 (Dryhopper 31 ms, Comparer 12 : 27 ms, jour après jour 132 ms, Suggérer sans préchauffage 277 ms, tranche de préchauffage 569 ms, premier écran + préchauffage 634 ms) ; glisser 1,13/1,74, Substituer 3,98/6,90, premier écran Ma bière 6,79/30,22. **Après : NON MESURÉ.** Mon lancement n'a pas rendu sa sortie avant le plafond. Mesure à rejouer : voir DEMANDE EXECUTANT. Le banc du dépôt mesure les 317 ; c6 a mesuré le catalogue complet (froid 5 à 8 ms de plus sur `substitutes`). `proposer` sur les 505 n'est pas mesuré.

## Essais
Test des voies : 4 essais (la coupe `maxBuy` a disparu sous les pieds, f2 la retire ; refait par jumeaux de tout le catalogue). B5 : 3 allègements (marques chargées à la demande, tables raccourcies) sans effet sur le chiffre, car ils sortaient du chunk compté ; seule la part de domaine y reste.

## DEMANDE EXECUTANT :
Racine du dépôt, rien d'autre ne tourne pendant les mesures. Aucun code à écrire.
1. `npm run check:hop-perf` deux fois ; coller les deux tableaux dans un fichier de la voie `perf-apres.txt`. Attendu : même verdict ECHEC (6), aucune mesure en hausse au-delà de ±2 ms par rapport à `perf-avant` (valeurs ci-dessus).
2. `node scripts/with_server.mjs --server "npm run dev -- --port 5282 --strictPort" --port 5282 --env VITE_HOP_V4=on --timeout 120 -- node work/missions/2026-10-25-integration-houblons/voies/c7-catalogue-branche/premier-ecran.mjs --n=5` : attendu `PREMIER-ECRAN OK`, deux lignes JSON (sans / avec) ; le premier écran « avec » ne doit pas dépasser « sans » de plus du bruit ; Krush trouvé (`true` ×5) seulement dans la série « avec ».
3. `VITE_HOP_V4=on npm run build` puis `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : noter B5.
4. Rejouer `node scripts/with_server.mjs --server "npm run dev -- --port 5281 --strictPort" --port 5281 --env VITE_HOP_V4=on --timeout 120 -- node work/missions/2026-10-25-integration-houblons/voies/c7-catalogue-branche/capturer.mjs` : `CAPTURES OK` ; ouvrir `img/01-…png` et `img/02-…png`.
5. États et maquette : l'écran de l'étape Houblons n'a pas de maquette choisie touchée par cette voie ; si le pilote veut le contrôle des choix, `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre` (attendu CHOIX OK) et `tests/integration/controle-ma-biere-app.mjs` (attendu MA-BIERE-APP OK).

## DÉCISION À PRENDRE
1. **B5 160,6 ko pour un plafond de 160.** Ma part est d'environ 0,35 ko ; f2 et p6 pèsent plus. Options : relever B5 à 162 ; ou faire alléger `voies.ts` par f2. Recommandation : relever à 162, puis vérifier à la clôture de f2.
2. **Fichiers hors Possède** (voir plus haut), nécessaires pour que les écrans voient les 505 variétés. Recommandation : garder.
3. **Fluidité non mesurée après** : ne pas clore la voie avant la demande ci-dessus.
4. Limite d'astérisque : seuls les articles de stock écrivent une origine (« Cascade CHE »). Une recette qui cite « Cascade CHE » sans stock n'a pas d'astérisque. Recommandation : garder.

CONNAISSANCE : le catalogue des écrans n'est lu que par `parcours/donnees.ts` (`configurerDonnees`) ; le worker de calcul n'est pas utilisé par l'app (fil principal). Le test de structure interdit tout import de valeur dans `donneesApp.ts` : un import d'un fichier voisin y échoue.
LEÇON PROPOSÉE : un test de tri « à égalité » doit être éprouvé en retirant la clé ; ici le premier jet passait sans elle. Quand un fichier d'une autre voie bouge sous les pieds (`voies.ts`), ne pas faire de `git apply -R` dessus pour une mutation : copier le fichier et le restaurer.
