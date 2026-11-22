OK — l'article neuf en français, le nom imprimé gardé, la facture suivante reliée toute seule (D295), « Sur la facture » à la fiche

Voie n1-nom-fr, temps 2b + correction D295 et REVUE-CODE (02.11), base HEAD b112d8fa. Aucun commit, aucun déploiement, Gemini jamais appelé (réponses du banc rejouées ou fictives).

## TEMOIN AVANT :
- Base verte avant tout code : 118 fichiers, 2004 tests (`base-vitest.log`). Banc doc14 avec `--noms` : 27 OK, 0 KO (`bout-avant/`). « Malt Viennois » pour « Wiener Malz » : `banc-f5c-prod-paires/results.json` l. 1864.
- Témoins N1 à N5 (`tests/unit/depense/nom-b/`, `temoin-avant.log`, `temoin-avant-2.log`) : **73 rouges, 27 verts** sur 100 (les verts sont des gardes de non-régression : sans `nameFr` rien ne change, etc.). Rouges, sur des valeurs :
  `expected 'Wiener Malz' to be 'Malt de Vienne'` (N1) ; article créé sans `nomsFacture` (N2) ; 11 rouges de `lien.test.ts` (N3) ; `expected [] to deeply equal [ { ref: 'A', data: { nomsFacture: ['Vienna Malt'] }, options: { merge: true } } ]` (N4) ;
  « Sur la facture : … » introuvable (N5) ; `table-i-f` 37/37 (`combinerRegles` absent) ; `refus.test.ts` 3 rouges ; écran 5 rouges.
- **D295, témoin rouge puis vert** (`d295-avant.log`, `d295-apres.log`) : les tests de l'écran retournés (« relié, pas de Garder ») : **3 rouges** sur le code d'avant (« Garder » rendu à la place du lien), puis **verts** après le passage à `relieAuto`.

## Critères
1. Témoins : `tests/unit/depense/nom-b` : **11 fichiers, 109 tests verts** (`revue-apres.log`).
2. `npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/stockLineMatching.test.ts tests/integration/{expenseSheet,expenseSheetMouture,jus0Journey,mobileDailyViews}.test.tsx` (copie isolée, `final-vitest.log`) : **129 fichiers, 2113 tests verts** ; aucun test existant modifié.
3. `npx tsc --noEmit -p tsconfig.json` : 0 erreur ; `npm run build` : sortie 0 (`build2.log`).
4. Bout en bout (`lancer.sh`, `bout-pleine3/`, 390 et 1280, `--noms` rejeu réel) : `doc14,nom-b,doc1,doc2,doc3,doc4,doc5,doc6` → **112 OK, 0 KO, 0 ARRÊT** ; `grep -ciE "hmr update|page reload" vite.log` = 0.
   Captures ouvertes (390) : `390-14-nomb-depense-b.png` (la facture suivante : cube coché, « 1 relié », aucune barre jaune ni « Garder » : la colonne B de `b-suivantes.png`) ; `390-12-nomb-plateau-a.png` (plateau ouvert de la 1re facture : « imprimé « Wiener Malz Alpha » », champ « article « Malt Viennois Alpha » · nouvel article ») ;
   `390-13-nomb-fiche.png` et `390-16-nomb-fiche-2.png` (« Sur la facture : Wiener Malz Alpha · Vienna Malt Alpha » sous « Nom », stock 35 Kg). Les mêmes à 1280 dans `bout-pleine3/`.
5. doc1 à doc6 : même passe, 0 KO.

## Ce qui est fait
- **D295** : à l'arrivée du français, une ligne « nouvel article » intacte dont le français désigne un seul article est reliée comme à la lecture : `relieAuto` (« relié à « … », nom déjà au stock »), `stockAction:'existing'`, aucun `proposedStock`. Restent : le jaune là où le nom imprimé le donne (« Haferflocken » : `traduireLignes` saute les lignes déjà reliées),
  « choisis » pour `ambigu`, la règle « α, poids, unité du libellé » (D215). Pastille et écran lisent la même ligne (`rangees.ts`, `confiance.ts`, `etat.ts`).
- **N1** `articleNeufDe` : nom français, toute catégorie ; **N2** `StockItem.nomsFacture`, `PurchaseLineDraft.nomLu` (posé à la lecture) ; **N3** `matchSurNom`, `combinerRegles` (table 5 × 7), noms gardés ; **N4** `nomsAppris` + `put merge` à `savePurchase` ; **N5** `StockDetailSheet` ;
  refus d'un second article du même nom ; clé f4 inchangée ; cas `nom-b` du banc.
- **Revue du code (REVUE-CODE.md), les 8 constats** :
  1. `confiance-b.test.ts` : `confianceLigne(ligneConfianceDe({stockAction:'none', nameFr, nomLu}))` ; **mutations jouées** dans la copie isolée (`mutations.sh`, `mutations.log`) : M1 `rangees.ts` sans `nameFr/nomLu` → 2 rouges ; M2 `confiance.ts` → 2 rouges ; M3 `etat.ts` `memeProduit` sans `noms` → 1 rouge.
  2. Gestes : nom tapé, quantité, unité (avant) + nature changée, « Créer » choisi, lien choisi (`ecran-nom-b.test.tsx`). Mutations : M4 sans la garde `neufDOffice` → « Créer » rouge ; M6 sans la garde `articleName` → « nom tapé » rouge ; **M5 sans la garde `manuallyClassified` → 14/14 verts** : cette garde est
     redondante (changer la nature met déjà `stockAction:'none'`, donc `l.stockAction!=='new'` écarte la ligne) ; gardée par prudence, dite ici. Le « lien choisi » est de même couvert par `stockAction!=='new'`.
  3. Le bouton « bis » affiche `neuf.name` dans tous les cas (`ExpenseSheet.tsx`, `garderBisEl`) ; à l'arrivée du français, le voisin d'un cas `neuf`/`incertain` est posé pour que la barre « bis » se montre. Test : « Kaskade 7,5 % CH » (français « Houblon Cascade ») : bouton, aria-label et champ disent « Houblon Cascade CH » ; M7 (nom imprimé) → rouge.
  4. `table-i-f.test.ts` : NOM_I pour l'imprimé, NOM_F pour le français ; le nom rendu dit quelle lecture a parlé.
  5. Le test StrictMode est renommé pour ce qu'il prouve (idempotence du rendu ; les refs sont un Set et une Map) ; le calcul hors de l'updater est dans le code (lecture) : pas de compteur.
  6. Contrôle « doc14 (n) » entériné par le pilote ; **correction de mon rendu précédent** : `caseDoc14` confirme bien doc14 (étape (f)) ; (n) vérifie sur les articles réellement créés (6 lignes de stock) : français rejoué différent → nom français + base dans `nomsFacture`, sinon nom imprimé. 390 et 1280 : OK.
  7. `fiche-fr.test.ts` exige `approchee: true` (alias « Viennois » de la fiche « Wiener Malz », trouvé seulement par le français) ; `appris.test.ts` : « un lien venu du français : rien n'est écrit avant `savePurchase` ».
  8. `StockDetailSheet` réutilise `memeNom` (`stockLineMatching.ts`, bâti sur `pliee`) comme `newStockItem` et `nomsAppris` ; test apostrophe, trait d'union, point, marques. **Trouvé par (n)** : « CARABELGE® » gardé sous l'article « CARABELGE » : `memeNom` ignore ® ™ © désormais.

## Fichiers écrits
`src/types/index.ts`, `src/domain/stock/articleNeuf.ts`, `src/services/stockLineMatching.ts`, `src/services/purchaseEntry.ts`, `src/ui/finance/ExpenseSheet.tsx`, `src/ui/StockDetailSheet.tsx`, `src/ui/depense/{confiance,etat,rangees}.ts`,
`scripts/check-invoice-journey-emulator.mjs` (cas `nom-b` ; contrôle `doc14 (n)`, seul ajout dans un autre cas), `tests/unit/depense/nom-b/**` (11 fichiers de test + `aide.ts`, `ecriture-aide.ts`), cette voie (`PLAN.md`, journaux, `mutations.sh`, `bout-*`).

## Rien ne se perd
Aucun article existant renommé ni migré ; champ facultatif, ajout seulement ; `firestore.rules` et `nomsFr.ts` intacts ; les 2004 tests d'avant verts, aucun modifié ; une dépense enregistrée avant B reste lisible. Le `tests/unit/hopIndexV4/fraisT3.test.ts` non suivi n'est pas à moi.

## Limites dites telles quelles
1. Un article créé avant l'arrivée de `nameFr` (« Confirmer » trop tôt, échec, table vide hors ligne) porte le nom imprimé : une facture dont le français est « Malt de Vienne » ne le relie pas ; la fusion des doublons (D) n'est pas demandée.
2. Deux traductions qui diffèrent (deux appareils, cache vidé, IA qui varie) : pas de lien par le français (jamais un faux lien) ; le nom imprimé gardé rattrape dès la facture suivante.
3. `traduireLignes` saute les lignes déjà reliées (`nomsFr.ts:136-137`) : « Haferflocken » face à `[Flocons d'Avoine, Haferflocken]` est une proposition jaune « Garder » vers « Haferflocken » (D277), jamais un lien d'office ; son second candidat français n'est pas examiné.
4. « Wiener Malz » ↔ « Vienna Malt » sans nom français : non relié. 5. Un nom appris par un lien manuel faux se corrige par le lien suivant (déplacement), pas par un retrait à la fiche.
6. Le relié par le français repose sur une traduction : il est « sûr » à l'écran (D295, décision du pilote) ; seul « Confirmer » l'écrit et l'apprend.

DÉCISION À PRENDRE : élargir `traduireLignes` aux lignes déjà reliées (cas Haferflocken) ? (a) non, garder le saut ; (b) oui, `nomsFr.ts` et son test changent. Recommandation : (a).
CONNAISSANCE : trois sources de lien qui ne se mélangent pas : les mots du libellé imprimé, les noms imprimés gardés par l'article (lien sûr), les mots du nom français (jamais une donnée : α, poids, unité restent du libellé) ; deux articles qui correspondent donnent « choisis ». Un test « X = Y » se prouve par la mutation d'une ligne (REVUE-CODE).
LEÇON PROPOSÉE : un test d'égalité (« confiance = plateau », « nom français vérifié ») doit échouer quand on retire la ligne qu'il garde ; jouer la mutation avant de l'accepter (reprise de la proposition de la revue ; M5 montre qu'une garde peut être redondante et le dire).
