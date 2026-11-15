# Revue B (code et risques) du PLAN.md de la voie ue

Verdict : **OK sous réserves : 2 bloquants (B) à trancher avant le code, 5 graves (G), 5 détails (D).**
Le plan est dense et bien sourcé (appelants, rejeu HEAD, risques). Les bloquants touchent la règle qui donne le coût d'un tarif
et le sort des tarifs existants : sans eux, l'écran peut afficher un chiffre faux. Lecture seule, rien exécuté hors greps.

Vérifié sur le code (HEAD a0d94832) : `chaineLitre.ts` (coutFormat, troisNotions, litresNets), `graduations` (`escalier.ts:100`) et
`placerEtiquettes` (`placement.ts:28`) existent et sont commités ; `estimerBrassinsPlanifies` (`brewForecast.ts:122`) ; les lignes
citées de `ClientsTab.tsx` (81, 195-201, 279-373), `TarifSheet.tsx`, `BatchDetailSheet.tsx:212,263-264`, `CreativeLabTab.tsx:209-211,275`,
`storage.ts:1205` sont exactes. Possède disjoint de us (FinancesTab, FinanceOverview, synthese) et de uo (TransactionJournal/Row,
operations) : aucun fichier commun. `git status --short` : seuls des dossiers `work/` non suivis, aucun source modifié.

## Bloquants

**B1. Quel brassin donne le coût d'un tarif ? Règle absente.** `PLAN.md` § 1 lignes 1, 12, 13 et § 5-3 : le sélecteur liste « les noms de
`batches` » et le coût vient du « dernier instantané du brassin », mais le tarif est par bière et format (`product = "<Bière> <format>"`)
et le coût par brassin. Or `Batch` porte `name`, `style`, `recipeRef` (`types/index.ts:660-668`) : deux brassins « Pale Ale de septembre »
et « Pale Ale d'octobre » donneraient deux « bières », deux tarifs, et `tarifDuFormat` de la caisse (`formatsVente.ts:33-40`, test
`biere.includes(part)`) ne retrouverait pas « Pale Ale de septembre 33 cl » pour le brassin d'octobre : « prix ? » à la caisse, prix présent
dans Prix. Correction attendue : écrire dans le plan l'identité de « la bière » (recette `recipeRef` ou nom de recette, pas le nom du lot),
et quel brassin chiffré sert au coût (le plus récent chiffré de cette bière ? sinon « ? »), avec un test sur deux brassins de même
recette et un brassin non chiffré.

**B2. Tarifs existants sans format ni bière : aucun état de c7c ne les montre.** `PLAN.md` § 8 « Données existantes » : une ligne ancienne
« sans format reconnu » est rangée « sous Autre », mais c7c n'a que le segment 33 cl · 75 cl · fût (élément 2) et § 1 bis n'a pas de cas
« Autre ». Les fixtures réelles sont de ce genre : `tests/integration/compactClients.test.tsx:169-170` (« Bouteille 75 cl consignée »,
« Bouteille 33 cl », sans nom de bière), `seedData`, `financeDemo.ts:16`. `biereDuTarif` rend alors `''` et `tarifDuFormat` accepte
n'importe quelle bière (`!part`). Après le port, la liste « tous les tarifs » de Clients disparaît (§ 3 : tableau remplacé) : un tarif sans
bière ni format devient injoignable, ni lu ni supprimable (la feuille ne s'ouvre que depuis un format). Correction attendue : un état
dans c7c pour « tarif non rattaché » (une ligne sous les tuiles, ouvrant la feuille), ou la liste conservée dans « Changer le prix »
pour tous les tarifs, et un test sur une ligne « Bouteille 33 cl » sans bière.

## Graves

**G1. Deux sources du format, la caisse ne lit pas le champ.** `PLAN.md` § 5-1, § 7 (`formatsVente.ts` « ne lit pas encore `format` »).
Le nom reste modifiable (§ 3, renommage) : renommer en « Ma blonde » garde `format: 33cl` dans Prix et fait « prix ? » à la caisse
(`formatDepuisTarif` ne lit que le libellé, `formatsVente.ts:18-24`). Idem pour une bière nommée « Fût d'or » (regex `\bfut\b`).
Correction : soit le nom se recompose toujours depuis (bière, format) et n'est plus libre pour un tarif porté, soit lister pour le pilote
un changement de 3 lignes de `formatDepuisTarif`/`tarifDuFormat` (voie uv terminée, hors Possède ue) à faire **avant** que le champ soit
écrit en production, et un test croisé Prix → Caisse (le prix fixé dans Prix est bien celui proposé à la caisse).

**G2. `tarifDuFormat` ne distingue pas « aucun », « plusieurs » et « prix 0 ».** `formatsVente.ts:39` rend `null` dans les trois cas ;
§ 1 bis veut deux textes (« Pas encore de prix » / « plusieurs prix pour ce format ») et § 5-3 le prévoit « (uv) ». Il faut une fonction
neuve dans `src/ui/prix/` (non l'importer telle quelle) ; le plan ne le dit pas, et un test de § 6 (« doublon ») ne passerait pas.

**G3. L'audit est immuable : D9 est un préalable, pas un souhait.** `storage.ts:1205` : `nombreFr(undefined, 1)` rend `''`
(`nombreAffiche.ts:11-12`), donc chaque enregistrement d'un tarif neuf écrit « marge  % » dans `auditLogs`, collection immuable
(`functions/src/dataSchema.ts`, `IMMUTABLE_COLLECTIONS`). Écrit une fois, jamais corrigé. DECISIONS.md « D9 retenue » ne nomme personne.
Correction : nommer qui change `storage.ts:1205` (une ligne : omettre « · marge … % » si absent) avant le premier enregistrement
réel ; un test ue l'exige (journal d'un tarif sans `marginPercent` ne contient pas « marge  % »).

**G4. « Proposer » aveugle sur les coûts et le format.** `functions/src/brewerAppContext.ts:13` liste les champs envoyés au scope
`clients-tarifs` : `product costIngredients costLabor costFixed costTotal priceHT marginCHF marginPercent`. Les nouveaux tarifs n'ont
aucun coût ni `format`/`emballageUnite` : la question de « Proposer » ne verra que nom et prix. Le plan (§ 5-1) dit « omis » sans noter
que ça vide l'assistant. Hors Possède et à déployer (irréversible) : lister pour le pilote ; en attendant, la question prête doit
**écrire** le coût et le reste dans son texte (données de l'écran), non seulement le scope. Test : le texte de `initialQuestion`
contient coût, prix et format.

**G5. Tests changés : liste incomplète.** § 6 ne cite pas : `tests/integration/rxPrixInconnu.test.tsx:32` (attend `#tf-costIngredients`,
`#tf-costFixed`, `#tf-priceHT` vides : rouge dès que la feuille perd ces champs) ; `tests/integration/bDiversImpot.test.tsx:24` (clique le
bouton `name: 'Impôt sur la bière'`, rouge si D5 renomme le rail) ; `impotBiereClients.test.tsx:15-19` (lit la source de ClientsTab :
interdit 16,88/25,32/33,76, à garder vrai). À l'inverse § 6 cite `liveDataViews`, `dashboardNavigation`, `contactConversionUnique`,
`equipmentProjects` pour l'entrée « Tarifs » de l'Atelier : `grep "Tarifs\|pricing-test\|Essais de tarifs" tests/` ne trouve rien dans ces
fichiers (seul `scripts/test_deep_interactive_buttons.mjs:627`). Refaire la liste par grep, pas de mémoire ; rejouer les 46 fichiers de HEAD
après le code. Aucun des tests `rejeu-*` n'est dans `portee-defauts.json` (grep vide), mais leur objet (BE-98 : plafond, vide ≠ 0)
est une plainte devenue contrôle : le déplacer sur le champ prix sans l'affaiblir, et le dire dans RESULTAT.

## Détails

**D1. Échelles liées : le plan se contredit.** § 1 élément 7 : crans /an « 0 · 5 k · 10 k · 15 k » ; § 11 : « le cran /an est le cran
/bouteille × unités/an ». Les deux ne sont pas compatibles (1-2-5 sur /bouteille donne 3 636, 7 272…). `graduations` rend des crans en
centimes et élargit les bornes (`escalier.ts:100-108`) : décider quelle échelle porte la graduation (la lue ?) et que l'autre en dérive ;
test de géométrie : 0 aligné sur les deux échelles, un cran lu = un cran de l'autre.

**D2. `netEnregistre` est privé** (`ImpotBiereSheet.tsx:65`, non exporté) ; § 5-3 « même sélection que netEnregistre d'up » invite à une
copie. Utiliser `baseImpot(batch, …).litres` (exporté, l.84), sinon le coût du litre et l'impôt divergeront.

**D3. Encart « Dans Prévisions » : entrées d'`estimerBrassinsPlanifies`** (`brewForecast.ts:45`, transactions, plans, profil, actifs,
stock, dates) à assembler dans la fiche du brassin, comme `Previsions.tsx:128` : un troisième assemblage après `mesureProjet.ts:34`.
Demander à pv un petit utilitaire commun, ou n'afficher que ce que `brassins.find(...)` rend ; garder le calcul hors de `BatchDetailSheet`
(déjà volumineux) et le charger paresseusement.

**D4. Build et tsc dans un arbre partagé avec us et uo.** Les trois voies écrivent dans le même worktree : `npx tsc --noEmit`,
`vite build` et vitest de ue verront les fichiers à moitié écrits des autres. Écrire dans RESULTAT quelles erreurs viennent de
`src/ui/finance/synthese/**` ou `operations/**`, et ne jamais « corriger » hors Possède. Aussi `src/ui/clients.css` (classes `tarif-*`)
n'est pas dans Possède : les classes de la feuille refaite doivent venir de `prix.css`, sans toucher clients.css.

**D5. « Tests rouges d'abord réels » : le rouge annoncé est un import manquant.** § 6 : `prixCalcul.test.ts` « rouge : module absent » =
erreur d'import, pas un échec d'assertion. Créer d'abord les modules vides (exports qui rendent `null`) pour que le rouge enregistré
dans `tests-rouge.txt` montre chaque valeur attendue (2,52 ; 3 636 ; 41 ; ≤ 5,03). Les anciens tests réécrits (compactClients, rejeu-*)
doivent d'abord être rejoués rouges sur le nouveau code, sinon un test réécrit trop mou passe.

## Hors ligne, données, risques écartés

- Hors ligne : lecture locale (`StorageService`, `FinanceService.snapshot`), aucun appel réseau hors « Proposer » non envoyé : conforme.
- Données Firestore : `firestore.rules.template:138` laisse passer un champ neuf (collection générique) ; `clean()` (`storage.ts:340`)
  ne retire que `__docId` ; `saveTarifs` garde les champs hérités. Aucune migration nécessaire. Champs de coût devenus optionnels :
  seuls lecteurs `ClientsTab.tsx:81,164,357-360`, `TarifSheet.tsx`, `storage.ts:1205`, `financeDemo.ts:16`, `brewerAppContext.ts:13` :
  inventaire du plan exact (grep refait). Les fixtures `caisseVente.test.tsx:34` et `caisseCalculs.test.ts:11` restent valides.
- Possède vs voies voisines : `types/index.ts` et `ClientsTab.tsx` étaient aussi à uv (commité d4bb2126, terminé) ; pas de conflit avec us/uo.

LEÇON PROPOSÉE : aucune (les points B1 et B2 relèvent de L19 et L28 : lire les données réelles avant de planifier).
