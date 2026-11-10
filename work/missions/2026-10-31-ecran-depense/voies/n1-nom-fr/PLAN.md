# PLAN (version 2) — voie n1-nom-fr : son choix B (l'article en français, le nom imprimé gardé, toute facture suivante se relie)

Auteur : Sonnet, 02.11. Version 1 écrite avant la revue ; version 2 = `REVUE-PLAN.md` (24 constats, tous « corrigée ») intégrée. Aucun code de `src/` écrit.
Base : HEAD 498f4025 et suivant, branchements f4 commités ; copie isolée par `copie.mjs`. Exigences communes : `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`
(chemin plein). Lu : VOIE.md, COMMUN.md, `stockLineMatching.ts`, `articleNeuf.ts`, `purchaseEntry.ts`, `nomsFr.ts`, `ExpenseSheet.tsx`, `StockDetailSheet.tsx`, `confiance.ts`,
`etat.ts`, `rangees.ts`, `enrichissement.ts`, `ficheCle.ts`, `check-invoice-journey-emulator.mjs`, `b-depense.png`, `b-stock.png`, `b-suivantes.png`.

## A. Tableau « constat → section du plan » (24 constats ; étape = § 7, test = § 3, critère = VOIE.md § Critères 1 à 5)

| Constat | Résumé de la correction | Section | Étape | Test nommé (`tests/unit/depense/nom-b/`) | Critère |
|---|---|---|---|---|---|
| C1 (bloquant) | `traduireLignes` saute les lignes `existing` : D-g.2 « revenir à ambigu » retiré ; chemin réel dit | D-g, D-i | E5 | `ecran-nom-b.test.tsx` « vrai traduireLignes » (seul `AiClient.run` simulé) | 1, 2 |
| C2 | un lien venu de `nameFr` = proposition jaune « Garder » (`proposedStock`/`proposedRef`), jamais `relieAuto` | D-g | E5 | `ecran-nom-b.test.tsx` « Garder visible après l'arrivée » | 1, 4 |
| C3 | nom lu gardé à la lecture : `PurchaseLineDraft.nomLu` | D-b | E1, E5 | `conserve.test.ts` « libellé retouché → nom lu gardé, jamais le retapé » | 1 |
| C4 | nom gardé : jamais « sûr » sur deux articles ; déplacement à un lien manuel ; nameFr appris au « Confirmer » | D-d.3, D-f | E2, E4 | `appris.test.ts` « déplace », `lien.test.ts` « deux articles gardent le nom » + « Divers » | 1, 2 |
| C5 | un article non dérivé se nomme aussi en français ; refus du nom déjà pris pour toute catégorie | D-c, D-d.4, D-j | E3, E4 | `nom.test.ts` (flocons, orge, sucre, levure), `refus.test.ts` | 1, 2 |
| C6 | « intacte » définie ; recalcul sur brouillon et stock courants | D-g | E5 | `ecran-nom-b.test.tsx` un test par geste | 1 |
| C7 | hors ligne : deux cas (table renseignée / vide) | D-f, § 3 | E4 | `conserve.test.ts` « hors ligne × 2 » | 1 |
| C8 | une règle : jamais de nom gardé égal au nom de l'article, N2 et N4 | D-a | E1, E4 | `conserve.test.ts`, `appris.test.ts` | 1 |
| C9 | deux limites écrites telles quelles dans RESULTAT.md | § 8 | E9 | contrôle de lecture | — |
| C10 | fiche trouvée seulement par le français : `approchee` | D-d.5 | E3 | `fiche-fr.test.ts` | 1 |
| P1 (bloquant) | le cas `nom-b` sert ses pièces fictives ; nom attendu « Malt Viennois » ; ordre après `doc14` | § 6 | E8 | cas `nom-b` du banc | 4 |
| P2 | liste complète du grep, rejouée avant et après | § 5 | E0, E9 | rejeux | 2 |
| P3 | base = HEAD avec f4 ; `git diff` du Possède enregistré avant le code | E0 | E0 | `base-diff.txt` | 2 |
| P4 | articleNeufDe : lignes 36 et 39 prennent le nom français (non dérivé compris) | D-c | E3 | `nom.test.ts` | 1 |
| P5 | `confiance.ts` et `etat.ts` lisent `nomFr` ; `rangees.ts` (`ligneConfianceDe`) à ajouter au Possède | D-h | E6 | `ecran-nom-b.test.tsx` « confiance = plateau » | 1, 2 |
| P6 | lecture française = le nom seulement ; α, récolte, poids, unité imprimés | D-d.2 | E2 | `lien.test.ts` « α différente par le français → rien » | 1, 2 |
| P7 | ligne `new` touchée dont le français désigne un article : « existe déjà : relier ? », refus à l'enregistrement | D-j | E4, E5 | `refus.test.ts`, `ecran-nom-b.test.tsx` | 1, 2 |
| P8 | table complète imprimé × français | D-d.4 | E2 | `table-i-f.test.ts` (35 cellules) | 1 |
| P9 | harnais nommés, docblock jsdom | § 3 | E0 | en-têtes des fichiers | 2 |
| P10 | calcul avant `setDraft`, refs hors updater, StrictMode | D-g | E5 | `ecran-nom-b.test.tsx` « rendu deux fois » | 1 |
| P11 | comparaison au nom gardé sur `nomLu`, jamais `description` | D-d.1 | E2 | `lien.test.ts` « restes » | 1 |
| P12 | lecture `side:'line'` fixée, égalité des jetons | D-d.1 | E2 | `lien.test.ts` « jetons égaux » | 1 |
| P13 | sonde de doc14 avec `--noms` avant le code ; verdict de (k) au critère 4 | E0, § 6 | E0 | `sonde-doc14.txt` | 4 |
| P14 | chemin plein de COMMUN.md | en-tête | — | — | — |

## 0. Portée (L01), écran, ses mots

- **Portée** : le nom d'un article NEUF né d'une ligne lue, le nom imprimé gardé, le lien des factures suivantes, la fiche de l'article (une ligne). Écrans : « Nouvelle dépense »
  (le champ « article « … » » du plateau, rien d'autre de neuf) et la fiche de l'article (« Sur la facture : … » sous « Nom »). Rien dans la liste du stock (ce serait C). Pas de fusion
  des doublons (D). Aucune migration, aucun article existant renommé.
- **Ses mots** : « Oui b c'est très bien » (02.11) ; « Ça traduits en français et fait le bon lien » (D271) ; « on veut pas de retrouver avec plein de fiche du même produit » (31.10).
  Maquette B reprise telle quelle : champ « article « Malt de Vienne » » + « imprimé « Wiener Malz » » (déjà au plateau, D275) ; fiche : « Sur la facture : Wiener Malz » en petit sous « Nom » ;
  factures suivantes reliées (barre jaune, `b-suivantes.png`).
- **Mesures de la sonde v1 (arbre d'avant la revue)** : `articleNeufDe` nomme « Wiener Malz » (jamais le français) ; « Wiener Malz » ne relie ni « Vienna Malt » ni « Malt de Vienne » ;
  « Haferflocken » ↔ « Flocons d'Avoine », « Röstgerste » ↔ « Orge torréfiée » : aucun lien ; stock « Flocons d'Avoine » + « Haferflocken », ligne « Haferflocken » → `matchStockLine` rend « Haferflocken »
  (mots exacts) ; `nomAffiche("Malt de Vienne")` = « Malt de Vienne » ; clé f4 `malt||malz wiener` (imprimé) contre `malt||de malt vienne` (français).

## 1. Défauts visés (5)

| Id | Défaut | Cause mesurée |
|---|---|---|
| N1 | Le nouvel article porte le nom imprimé | `articleNeufDe` ne lit que `ligne.description` ; `nameFr` reste « affichage seulement » |
| N2 | Le nom imprimé ne se garde nulle part | `StockItem` sans champ ; `newStockItem` n'écrit que `name` |
| N3 | Une facture d'une autre langue ne se relie pas | `matchStockLine` / `regleProduit` comparent `description` à `item.name`, rien d'autre |
| N4 | Un lien d'une autre langue n'apprend rien | aucun écrit sur l'article existant à « Confirmer » hors `currentStock` |
| N5 | La fiche ne dit pas le nom imprimé | `StockDetailSheet` : rien sous « Nom » |

## 2. Décisions de conception

**D-a. Le champ et sa règle unique (C8).** `StockItem.nomsFacture?: string[]` (`types/index.ts`, seul champ nouveau). Il contient la BASE imprimée (`lireOptions(nom, variante, unité).base`,
celle que `traduireLignes` envoie), chaque nom une fois (comparaison `pliee`), 8 noms au plus, 80 caractères au plus. **Une seule règle, N2 comme N4 : un nom n'est jamais gardé s'il égale
l'un des noms de l'article en mots normalisés (`pliee(nom) === pliee(item.name)`)** ; il n'y a donc jamais de doublon à la fiche, et N5 n'a rien à masquer. Absent = article d'avant B ou saisi
à la main : lisible et juste, aucune valeur écrite par défaut. Aucune règle Firestore à toucher (`firestore.rules` l. 176-182 ne contrôle que `currentStock`) ; `storage.ts` écrit les articles par
`{...item}` ; `merge:true` ne touche que ses clés.

**D-b. Le nom lu, gardé à la lecture (C3).** Nouveau champ facultatif `PurchaseLineDraft.nomLu?: string` (`purchaseEntry.ts`) : la base de `item.name`/`item.variant`/`item.unit` par `lireOptions`
(`ui/depense/optionsDuNom`, déjà utilisé par `nomsFr.ts`), posée dans `applyOutcome` (`ExpenseSheet.tsx` l. 315) pour chaque ligne lue. Il ne change plus : retaper le libellé ne le touche pas.
`nomImprimeDe(line) = line.nomLu` (trim, 80 caractères) ; une ligne sans `nomLu` (saisie à la main, brouillon d'avant B) n'a pas de nom imprimé : rien n'est gardé, rien n'est appris, « Sur la facture »
ne ment jamais. Plus de repli sur `description`. Le champ n'est pas écrit dans la dépense enregistrée (brouillon seulement, comme `imprime` et `nameFr`).

**D-c. Le nom français propre et les articles non dérivés (C5, P4).** `nomFrPropre(nameFr)` (`articleNeuf.ts`) = l'expression de `nomAffiche` (nom lu sans options, deux-points final ôté) ; test d'égalité avec
`nomAffiche` sur 6 cas (on n'importe pas `ui/depense/etat` dans le domaine). `ligneDeBrouillon` pose `nomFr` (= `nomFrPropre(line.nameFr)`) et `nomLu` ; `LigneProduit`/`StockLineInput` gagne `nomFr?` et `nomLu?`.
`articleNeufDe` : `libelle = nomFr ?? ligne.description.trim()` (lignes 36 et 39 d'aujourd'hui) ; donc `name = tape || (derive ? regle.nom/regle.article.name : libelle)` et `nomPropose` suivent le français,
**pour un article non dérivé aussi** (flocons, orge torréfiée, sucre, levure, emballage, produit d'entretien : la catégorie ne décide pas, la présence de `nameFr` décide). Le nom que le brasseur a
tapé (`articleName`) gagne toujours ; un libellé corrigé efface `nameFr` (déjà : `updateLine(…,{description,nameFr:undefined})`). Sans `nameFr` : le nom imprimé comme aujourd'hui. Pour une levure, le français
de la traduction sert tel quel (par catégorie : « Levure » ne fait pas exception ; la marque imprimée reste dans le nom gardé et au plateau).

**D-d. Règle de lien (`stockLineMatching.ts`), `matchStockLine` et `regleProduit` restent les deux portes.**
1. **Nom gardé** (lien sûr, P11, P12). Dans `examine`, une ligne dont `nomLu` a les mêmes jetons (`readProductLabel(nom, {unit, quantity, hop, yeast, side:'line'}).tokens`, `sameName`) qu'un `item.nomsFacture`
   (lu `side:'line'` lui aussi) obtient `pass = 1` et passe TOUTES les autres portes (catégorie, unité, α, récolte, poids du sachet, malté, nature inconnue, frères numérotés). La comparaison porte sur `nomLu`,
   jamais sur `description` (qui peut valoir « base · restes » ou le français du scanner).
2. **Nom français (P6)** : `matchSurNom(line, items, nom?)` est le corps actuel de `matchStockLine`, avec un nom de jetons substituable. Appelé sur le libellé imprimé ; si `line.nomFr`, appelé aussi avec `nom = nomFr` :
   **seuls les jetons du nom viennent du français** (`nameKinship` reçoit les jetons français) ; α, récolte, poids de sachet, malté, unité et `deduced` restent lus sur le libellé imprimé (`L`). Un `nameFr` qui perd « 7,5 % »
   ne rend pas muette la porte de l'α (D215). Un seul article distinct → proposition `existing` au niveau d'aujourd'hui (D277 sûr / repris jaune / inconnu rouge, aucun niveau inventé).
3. **Deux candidats (C4)** : `candidatsLies(line, items)` (exporté) = articles DISTINCTS trouvés par le nom gardé, l'imprimé et le français (y compris les candidats d'un `ambigu`). `matchStockLine` rend `undefined`
   s'il y en a ≥ 2 ; `regleProduit` rend `{cas:'ambigu', candidats, nom}` (règle d'ambiguïté existante : « plusieurs articles … : choisis », `data-dp-ambigu`, aucun lien d'office). Un nom imprimé gardé sur DEUX articles ne donne
   donc jamais un lien sûr.
4. **Table de combinaison imprimé (I) × français (F) (P8)** — règles : R1 candidats distincts (meme ou ambigu des deux lectures, et noms gardés) ≥ 2 → `ambigu` (candidats réunis) ; R2 exactement 1 → `meme` ; R3 sinon le plus sévère de
   `incertain > neuf > inconnu`, à égalité la lecture imprimée ; le NOM est toujours le français (`nomPropre(nomFr)` pour houblon et malt, `nomFr` sinon, puis `nomLibre` : « bis », origine, `nomsPris` stock + lignes neuves de la saisie : S6 et D215 restent vrais).
   Sorties (colonnes = F ; `X,Y,Z` articles, `V,W` voisins) :

   | I \ F | absent | meme X | meme Y | ambigu{X,Z} | incertain W | neuf W | inconnu |
   |---|---|---|---|---|---|---|---|
   | meme X | meme X | meme X | ambigu{X,Y} | ambigu{X,Z} | meme X | meme X | meme X |
   | ambigu{X,Y} | ambigu{X,Y} | ambigu{X,Y} | ambigu{X,Y} | ambigu{X,Y,Z} | ambigu{X,Y} | ambigu{X,Y} | ambigu{X,Y} |
   | incertain V | incertain V | meme X | meme Y | ambigu{X,Z} | incertain V | incertain V | incertain V |
   | neuf V | neuf V | meme X | meme Y | ambigu{X,Z} | incertain W | neuf V | neuf V |
   | inconnu | inconnu | meme X | meme Y | ambigu{X,Z} | incertain W | neuf W | inconnu |

   (`table-i-f.test.ts` joue les 35 cellules avec des fixtures construites par cellule ; le nom rendu est vérifié français.) Les données lues (α, EBC, origine, récolte, poids) viennent toujours du libellé imprimé.
5. **Fiche de catalogue (C10)** : `ficheLaPlusProche` cherche d'abord sur le nom imprimé, puis, s'il ne trouve rien, sur le nom français ; `approchee` est celui du catalogue (une fiche trouvée seulement par le français et approchée porte `approchee:true`).
   Rien ne change pour un article qui a déjà sa fiche.

**D-e. La clé de fiche f4 ne change pas.** `travauxDeLaSaisie` (`enrichissement.ts`, hors Possède, intact) calcule la clé sur `nomPropre(line.description)` : l'imprimé (`malt||malz wiener`). Son nom d'article et son verdict `s6`
passent par `ligneDeBrouillon` + `articleNeufDe` (donc suivent mon changement sans toucher ce fichier). Conséquences : une facture suivante reliée n'est pas `new`, donc ne crée aucun travail f4 ; la clé reste celle de l'imprimé.
Les témoins `tests/unit/depense/enrichir/**` restent verts sans changement (rejoués, § 5). Une voie f4-bout écrit dans `enrichissement*.ts` : elle peut demander une correction dans `articleNeuf.ts` ou `purchaseEntry.ts` (le pilote la transmet).

**D-f. Écriture à « Confirmer » (`purchaseEntry.ts`).**
- *Article neuf* (`newStockItem`) : `nomsFacture:[nomLu]` seulement si `nomLu` existe et n'égale pas le nom de l'article (D-a) ; nom français quand `nameFr`. Sans `nameFr` (« Confirmer » trop tôt, échec, hors ligne table vide) : nom = imprimé, `nomsFacture` absent
  (égal au nom). Hors ligne **deux cas testés (C7)** : table de noms renseignée (`nameFr` arrive hors ligne, `nomsFr.ts:149-156` sert une base déjà en table) → nom français ET nom gardé ; table vide → nom imprimé seul. Un seul `put` de création dans la file locale ; rien d'autre.
- *Article existant relié* (N4) : après la boucle des mouvements, pour chaque ligne `existing` de `nomLu` non vide, avec `pliee(nomLu) !== pliee(item.name)` et absent de `item.nomsFacture` : un `FirestoreRepo.put('stockItems', ref, {nomsFacture:[...union]}, {merge:true})` par article
  (jamais `updateStockItem` : il réécrirait `currentStock` en concurrence avec `adjustNumber`). **Déplacement (C4 ii)** : si ce nom est déjà gardé sur un AUTRE article A (lien manuel vers B), il est retiré de A (même union, un `put merge` pour A) : l'erreur se corrige par le geste
  ordinaire. **Un lien venu de `nameFr` (C4 iii)** ne s'apprend qu'au « Confirmer » qui le garde : le brouillon écrit au plus à `savePurchase`, jamais à l'arrivée du nom. Sous la garde `submitted` (double clic : une fois) ; un rejeu après refus recalcule la même union (idempotent). Plafond 8 : au-delà rien n'est écrit,
  aucun nom retiré (sauf le déplacement). Un lien manuel s'apprend aussi : il l'a vu et confirmé ; ce qui l'encadre : le nom appris passe toutes les portes (catégorie, unité, α, récolte, poids), n'est jamais « sûr » sur deux articles, et se déplace au geste suivant. Sans écran de retrait (la fiche reste celle de `b-stock.png`).

**D-g. Quand `nameFr` arrive (`ExpenseSheet.tsx`, `.then` de `traduireLignes`, C1, C2, C6, P10).**
- **Le chemin réel (C1)** : `traduireLignes` saute toute ligne `existing` dont le `stockRef` est au stock (`nomsFr.ts:136-137`). Une ligne déjà reliée à la lecture par ses mots exacts (« Haferflocken » face à `[Flocons d'Avoine, Haferflocken]`) est une PROPOSITION jaune « Garder », jamais un lien d'office, et ne reçoit pas de `nameFr` : le second candidat « Flocons d'avoine » n'est pas examiné pour elle (limite dite, § 8 ; l'élargir est la décision D1, § 9, `nomsFr.ts` étant hors Possède). **Plus de « retour à ambigu » d'une proposition** (retiré). Le cas des deux candidats se joue sur une ligne
  NON reliée par l'imprimé : ligne imprimée sans mots communs, `nameFr` désignant deux articles → `ambigu`.
- **Une ligne est « intacte » (C6)** quand elle est dans `neufDOffice`, sans `articleName`, et hors `manuallyClassified`. Les autres (quantité, unité, nature changées, choix « Créer », nom tapé) ne sont jamais reprises.
- **Recalcul (P10)** : dans le `.then`, AVANT `setDraft`, sur le brouillon courant (une ref `draftCourant` mise à jour à chaque rendu) et le stock COURANT (`existants` du rendu, pas `existantsLus`), pour chaque ligne qui reçoit `nameFr` : `regleProduit(ligneDeBrouillon({...ligne, nameFr}))`.
  Les refs (`proposedStock`, `proposedRef`, `voisins`, `neufDOffice`, `relieAuto`) sont mutées hors de l'updater `setDraft(previous => …)` (qui se rejoue deux fois en StrictMode) ; l'updater ne fait que poser `nameFr` et, pour les lignes décidées, `stockAction`/`stockRef`.
- **Ligne intacte, résultat `meme` (C2)** → `{stockAction:'existing', stockRef}` + `proposedStock.add(id)` + `proposedRef.set(id, ref)` + `neufDOffice.delete(id)` : proposition jaune avec « Garder » (repris, D277), jamais `relieAuto` (le lien repose sur une traduction, pas sur des mots imprimés).
  Résultat `ambigu` → `{stockAction:'none'}` + voisin posé (« plusieurs articles … : choisis », `data-dp-ambigu`). Autre résultat : la ligne reste `new` ; son nom devient le français par le calcul vivant (`neufParLigne` ; la signature de cache `sig` reçoit `l.nameFr` et `l.nomLu`).
- Ligne `none`, ligne `existing` de choix du brasseur, ligne dont il a tapé le nom : intactes. Pas de `nameFr` (hors ligne, échec, « Confirmer » avant son arrivée) : rien ne change, nom imprimé, jamais d'attente.

**D-h. `confiance.ts`, `etat.ts`, `rangees.ts` (P5).** Le Possède est étendu à `confiance.ts` et `etat.ts` (`memeProduit`) ; **`rangees.ts` (`ligneConfianceDe`, l. 26-30) n'y est pas** : sans lui, `confiance.ts` ne reçoit jamais `nameFr`/`nomLu`. `LigneConfiance` (confiance.ts) gagne `nameFr?`, `nomLu?` ; `regleProduit(ligneDeBrouillon({…, nameFr, nomLu}))` aux l. 91 et 354 ; `memeProduit(description, unit, items, quantity, vendor, nomFr?, nomLu?)` ;
`etat.ts:170/197` (`ligneProduit(line)`) passent déjà la ligne entière. **Demande au pilote : ajouter `src/ui/depense/rangees.ts` (une ligne, `ligneConfianceDe`) au Possède** (D2, § 9). Sinon la pastille et le plateau calculeraient deux verdicts pour une même ligne.

**D-i. Test d'écran fidèle (C1).** `ecran-nom-b.test.tsx` ne remplace pas le module `nomsFr` : il garde le vrai `traduireLignes` et ne simule que `AiClient.run` (`traduireNoms`), table mémoire. Le saut des lignes `existing` y est donc réel.

**D-j. Refus d'un second article du même nom (C5, P7).** `validatePurchase` (`purchaseEntry.ts` l. 455-463) : pour une ligne `new` SANS nom tapé dont `regleProduit` rend `meme` (par l'imprimé ou le français), refus avec le message existant (« cet article existe déjà (« X ») : relie la ligne à cet article »), **pour toute catégorie** quand la ligne a un `nameFr` (`article.derive || ligne.nomFr`) ; sans `nameFr` le comportement
d'avant reste (aucun test existant ne change). Pour un article non dérivé de nom français pris par le stock ou une autre ligne neuve de la saisie (`nomsPris`) : même refus que le nom tapé (« Un article porte déjà ce nom : relie-le ou change le nom »). À l'écran, une ligne `new` touchée dont le français désigne un article existant : le même message au « Confirmer » et la pastille voisin existante ; jamais un
second article en silence, aucun élément d'interface neuf.

**D-k. N5 (`StockDetailSheet.tsx`, après le `Field` « Nom », seul changement).** Si `item.nomsFacture` a au moins un nom : `<p className="text-xs text-cave-400" data-stock-noms-facture>Sur la facture : A · B</p>` (texte, pas de contrôle). Lecture seule ; `onSave` garde `...draft` : la liste survit à « Enregistrer ».

## 3. Tests qui échouent d'abord (`tests/unit/depense/nom-b/**`, Gemini simulé, fixtures fictives, aucun nom du brasseur)

« TEMOIN AVANT » : lancés sur l'arbre d'aujourd'hui (copie isolée), rouges sur des assertions de comportement (champs nouveaux lus par cast, valeurs comparées), sortie collée dans RESULTAT.md ; puis les mêmes verts.
Harnais : les fichiers `.tsx` commencent par `// @vitest-environment jsdom` (`vitest.config.ts:54,60` : `node` par défaut, jsdom seulement sous `tests/integration/**`) ; modèle d'écran `tests/unit/depense/noms-fr/ecran-noms.test.tsx` ; modèle d'écriture `tests/unit/depense/fiche/ecriture.test.ts` (mocks `storage`, `firestoreRepo`, `financeService`, `financeDocuments` ; clés `['put','stockItems',…]`, `['increment',…]`).

| Fichier | Défaut | Cas (donnée → attendu) |
|---|---|---|
| `nom.test.ts` | N1, P4, C5 | « Wiener Malz » + `nameFr` « Malt de Vienne », stock vide → `articleNeufDe(...).name` et `nomPropose` = « Malt de Vienne » ; sans `nameFr` → « Wiener Malz » ; `articleName` tapé → le tapé ; deux-points final ôté ; `nomFrPropre` = `nomAffiche` sur 6 cas ; **non dérivés** : « Haferflocken » → « Flocons d'avoine », « Röstgerste » → « Orge torréfiée », sucre, levure, emballage : nom français ; « Malt de Vienne » au stock → `meme` ; deux lignes de même `nameFr` → 2e « … bis » (dérivé) ; houblon « Cascade 7,5 % CH » + `nameFr` : nom français, α et origine du libellé imprimé |
| `conserve.test.ts` | N2, C3, C7, C8 | `savePurchase` d'une ligne `new` avec `nomLu` « Wiener Malz » et `nameFr` → `{name:'Malt de Vienne', nomsFacture:['Wiener Malz']}` ; libellé retouché à la main → `nomsFacture` = le nom LU, jamais le retapé ; ligne sans `nomLu` (main, brouillon ancien) → pas de clé ; sans `nameFr` → pas de clé (égal au nom) ; **hors ligne ×2** : table renseignée → nom français + nom gardé, table vide → nom imprimé seul ; un seul `put` de création ; article d'avant B (sans champ) : `matchStockLine`/`regleProduit` rendent ce qu'ils rendent avant |
| `lien.test.ts` | N3, C4, P6, P11, P12 | stock `[Malt de Vienne]` : « Wiener Malz » (`nameFr` « Malt de Vienne ») → lien ; « Vienna Malt » (même `nameFr`) → lien ; stock `[{Vienna Malt, nomsFacture:['Wiener Malz']}]` : « Wiener Malz » → lien (pass 1) ; « Haferflocken » + « Flocons d'avoine » vs `[Flocons d'Avoine]` → lien ; vs `[Flocons d'Avoine, Haferflocken]` : `matchStockLine` et `regleProduit` avec `nomFr` → `candidatsLies` = 2, `ambigu` ; « Röstgerste » (« Orge torréfiée ») → lien ; « Premium Pilsner Malz » ↔ « Premium Pilsner Malt » inchangé ; **jetons** : `nomLu` « Wiener Malz » = jetons du nom gardé en `side:'line'` ; **restes** : `description` « Wiener Malz · gemahlen » (ou français du scanner), `nomLu` « Wiener Malz » → lien par le nom gardé ; **nom gardé sur deux articles** → `ambigu`, jamais sûr ; **négatifs** : `nameFr` « Malt de Vienne » vs `[Malt de Munich]` → rien ; unité incompatible → rien ; catégorie refusée (article « Emballage ») → rien ; nom gardé sur un article « Divers » / autre catégorie → rien ; houblon : nom gardé mais α imprimée différente → rien ; **`nameFr` sans α, α imprimée ≠ article → rien** (D215) |
| `table-i-f.test.ts` | P8 | les 35 cellules du tableau D-d.4, nom français vérifié |
| `appris.test.ts` | N4, C4, C8 | ligne `existing` « Vienna Malt » sur « Malt de Vienne » → un `put merge nomsFacture:['Vienna Malt']` ; `currentStock` jamais dans le `put` ; `adjustNumber` appelé ; 2e `savePurchase` (double clic) → 0 écrit de plus ; 2e facture « Vienna Malt » → pas de doublon ; nom lu = nom de l'article → aucun écrit ; plafond 8 → aucun écrit ; ligne sans `nomLu` → aucun écrit ; **déplacement** : « Oat Flakes » gardé sur A, lien manuel vers B → retiré de A, ajouté à B ; lien venu de `nameFr` : rien n'est écrit avant `savePurchase` ; apprentissage sur un article « Divers » : écrit mais ne relie ensuite aucune ligne d'une autre catégorie |
| `fiche-n5.test.tsx` | N5 | `StockDetailSheet` avec `nomsFacture:['Wiener Malz','Vienna Malt']` → « Sur la facture : Wiener Malz · Vienna Malt » sous « Nom » ; sans le champ → rien ; « Enregistrer » → `onSave` reçoit le champ. Rejoue aussi `tests/integration/mobileDailyViews.test.tsx` (rend `StockDetailSheet`) |
| `fiche-fr.test.ts` | C10 | fiche trouvée seulement par le nom français et approchée → `fiche.approchee:true` ; imprimé qui trouve → inchangé |
| `refus.test.ts` | P7, C5 | `validatePurchase` : ligne `new` touchée dont `nameFr` désigne un article (dérivé et non dérivé) → refus au message existant ; non dérivé de nom français pris par le stock / par une autre ligne neuve → refus « Un article porte déjà ce nom » ; sans `nameFr` → comportement d'avant |
| `ecran-nom-b.test.tsx` | N1, N3, C1, C2, C6, P5, P7, P10 | `ExpenseSheet` jsdom, **vrai `traduireLignes`** (seul `AiClient.run` simulé, table mémoire) : le champ « Nom de l'article, ligne n » montre « Malt de Vienne » après l'arrivée ; « Confirmer » avant l'arrivée → « Wiener Malz » ; l'arrivée relie une ligne `new` intacte à l'article du stock **en proposition jaune avec « Garder »** (pas `relieAuto`) ; « Haferflocken » face à `[Flocons d'Avoine, Haferflocken]` : proposition « Garder » vers « Haferflocken », `AiClient.run` n'a pas reçu cette ligne (saut réel) ; ligne non reliée dont `nameFr` désigne deux articles → `data-dp-ambigu` ; **un test par geste qui empêche la reprise** : nom tapé, quantité changée, unité changée, nature changée (`manuallyClassified`), « Créer » choisi, lien choisi ; **StrictMode** (rendu deux fois) : aucune ref doublée, un seul `Garder` ; confiance (pastille) et plateau donnent le même verdict pour la même ligne avec `nameFr` ; ligne `new` touchée dont le français désigne un article : message « cet article existe déjà … » au « Confirmer » |
| `cle-f4.test.ts` | D-e | `travauxDeLaSaisie` avec et sans `nameFr` : `cle`, `ligne.nomPropre` identiques (imprimé), `s6.cas` identique |

## 4. Risques et leur réponse

- **Données existantes** : aucun article lu n'est réécrit ; champ facultatif ; `grep` des lecteurs de `StockItem` (`storage.ts`, `StocksTab`, sync) : aucun ne le retire ; les règles Firestore l'acceptent. Son stock réel mêle des articles français et des articles au nom imprimé allemand (nés avant B) : intouchés.
- **Deux candidats** : D-d.3 et D-g, testés ; la fusion des doublons n'est pas faite.
- **Une fiche par produit** : le nom français pris (stock, autre ligne, `nomsPris` y compris « nom + origine ») suit `nomLibre` (dérivés) ou le refus (non dérivés) ; S6 et D215 inchangés (suites `fiche/*` rejouées).
- **Mauvais lien appris** : D-f (jamais « sûr » sur deux articles, déplacement au geste suivant, mêmes portes que partout).
- **Hors ligne / file d'envoi** : un `put` de création (nom et nom gardé) ; N4 un `put merge` par article, sous la garde `submitted` ; aucune écriture avant les validations. Concurrence entre appareils : deux N4 simultanés peuvent perdre un nom (réappris à la facture suivante).
- **Double clic** : gardes `submitted` et `saveLocked` inchangées ; test N4. **Arrondis / unités** : aucune quantité ni prix touchés ; portes d'unité (D213, D277) non relâchées.
- **Perf** : `matchSurNom` au plus 2 fois par ligne ; `stock/perf.test.ts` rejoué (seuil inchangé).

## 5. Tests et scripts hors Possède qui appellent les fonctions changées (grep `tests/` et `scripts/` entiers, complété par la revue)

Sortie du `grep -rlE "matchStockLine|regleProduit|proposeStockItem|articleNeufDe|ligneDeBrouillon|newStockItem|articlesNeufsDe|savePurchase|StockDetailSheet"` : `scripts/agents/inventaire-ecrans.mjs`, `scripts/test_deep_interactive_buttons.mjs`, `scripts/test_modal_inspect.mjs` (inventaires, non rejoués : aucune assertion sur le nom) ;
`tests/integration/{expenseSheetMouture,jus0Journey,mobileDailyViews}.test.tsx`, `tests/unit/{purchaseEntry,stockLineMatching}.test.ts`, `tests/unit/depense/{banc-k7/{arrondi,categorie},enregistrement/{mouture-prix,paiement-prix,unites},enrichir/{aide,file,montage,procedure,temoin},fiche/{ecriture,fiche,lignes-372765,regle},port/port-enregistrement,raccord/unites-enregistrement,stock/{chasse-17-10,chasse-etendue,facture-372765,identite,perf,relecture,unites}}`.
Ajoutés par la revue (rendent l'écran ou l'écrivent) : `tests/integration/expenseSheet.test.tsx`, `tests/unit/depense/{banc-k6/genres-d262c,drive-fond/{confirmer,contrat-synchrone,feuille},ecran/{ecran,finitions,p3c,tri},qr/ecran-qr,rangees/rangees,noms-fr/**}`. Sources qui les appellent : `App.tsx`, `StocksTab.tsx`, `fabActions.ts`, `apercuDev.ts`, `confiance.ts`, `etat.ts`, `enrichissement.ts`, `proofQueue.ts`.
**Mesure, pas affirmation** : tout `tests/unit/depense` + ces fichiers d'intégration rejoués (E0) avant le code (base = HEAD avec f4, copie isolée) et (E9) après ; je ne dis « additif » qu'après la seconde passe. Un test qui casse : je m'arrête, le pilote tranche (aucun test existant n'est modifié).

## 6. Bout en bout (critère 4) — le cas `nom-b` du banc (P1, P13)

`scripts/check-invoice-journey-emulator.mjs` reçoit : un cas `nom-b` dans `CASES` (l. 1937), un chargement de fixture, et hors `ALL_CASES` si besoin ; les autres cas inchangés. Le cas **sert lui-même ses pièces fictives** (réponses `scanInvoice` et `traduireNoms` du cas, comme `enrichirAnswer` l. 1814 pour `lookupIngredient`), sans toucher au manifeste ni à `loadReplay` :
- seconde facture fictive (fournisseur fictif) : ligne « Vienna Malt » dont le `traduireNoms` du cas rend le même nom français que le rejeu réel de « Wiener Malz » (« Malt Viennois », `banc-f5c-prod-paires/results.json`), **déclaré fictif** ; le nom attendu de l'article est donc « Malt Viennois » (vérifié en E0 dans `results.json`, sinon la fixture suit la valeur lue) ;
- **ordre** : `--cases doc14,nom-b` dans la même passe (chaque cas rouvre un onglet sur la même base) ; `nom-b` relit `all(c.db,'stockItems')`, vérifie en précondition que l'article « Malt Viennois » existe avec `nomsFacture` contenant « Wiener Malz » (sinon KO « précondition : doc14 d'abord ») ;
- vérifie : (1) après « Confirmer » de doc14 les nouveaux articles de malt portent leur nom français et `nomsFacture` ; (2) la seconde facture : la ligne se relie (proposition jaune « Garder »), comptage des articles avant/après identique, « Confirmer » → `nomsFacture` reçoit « Vienna Malt » ; (3) la fiche montre « Sur la facture : … » ; captures 390 et 1280, ouvertes (L12) ; aucun « hmr update » / « page reload » dans `vite.log` (L17).
- **Verdict de doc14 (k) mesuré d'avance (E0)** : une sonde jouée sur doc14 avec `--noms` donne quelles lignes se relient (articles semés de `seedPlan` l. 718-733, `STOCK_DOC14`) ; le résultat attendu de (k) (« nouvel article d'office », l. 1435-1436) s'écrit dans RESULTAT.md et entre au critère 4 ; si une ligne change de verdict, je le dis avant de coder. Rejeu des six autres pièces (critère 5).

## 7. Étapes de la voie (temps 2b), chaque étape tests d'abord

- **E0** : copie isolée ; `git diff -- <fichiers du Possède>` enregistré dans `voies/n1-nom-fr/base-diff.txt` (isole le diff de la voie du reste, L17) ; base verte rejouée (`tests/unit/depense` + intégration listée § 5) ; sonde doc14 avec `--noms` (`sonde-doc14.txt`) ; vérif « Malt Viennois » dans `results.json` ; témoins N1 à N5 rouges (« TEMOIN AVANT »).
- **E1** : `types/index.ts` (`nomsFacture`), `purchaseEntry.ts` (`PurchaseLineDraft.nomLu`), `articleNeuf.ts` (`nomFrPropre`, `nomImprimeDe`, `ligneDeBrouillon`).
- **E2** : `stockLineMatching.ts` (`nomLu`/`nomFr` dans `StockLineInput`, `matchSurNom`, `candidatsLies`, nom gardé, `regleProduit` à deux lectures, table).
- **E3** : `articleNeuf.ts` (`articleNeufDe` : nom français, fiche en repli).
- **E4** : `purchaseEntry.ts` (`newStockItem`, N4 avec déplacement, `validatePurchase`).
- **E5** : `ExpenseSheet.tsx` (`nomLu` dans `applyOutcome`, `.then` de D280, `draftCourant`, signature de cache, refus).
- **E6** : `confiance.ts`, `etat.ts` (et `rangees.ts` si le pilote l'ajoute).
- **E7** : `StockDetailSheet.tsx` (N5).
- **E8** : cas `nom-b` du banc ; captures ouvertes.
- **E9** : tout rejoué (vitest, `tsc --noEmit`, `npm run build`, banc doc14 + `nom-b`, doc1 à doc6), RESULTAT.md.

## 8. Limites dites telles quelles (à reprendre dans RESULTAT.md, C9)

1. **Un article créé avant l'arrivée de `nameFr`** (« Confirmer » trop tôt, échec de traduction, table vide hors ligne) porte le nom imprimé ; une facture suivante dont le français est « Malt de Vienne » ne le relie pas. N3 ne referme pas ce cas ; la clé f4 sur l'imprimé ne le rattrape pas. La fusion des doublons (D) n'est pas demandée.
2. **Deux traductions qui diffèrent** (deux appareils, cache vidé, IA qui varie) donnent des jetons différents : le lien par `nameFr` suppose la même traduction ; sinon pas de lien (jamais un faux lien), et le nom imprimé gardé (N4) rattrape à partir de la facture suivante.
3. Une ligne déjà reliée à la lecture par ses mots exacts n'est pas traduite (`nomsFr.ts:136-137`) : son second candidat français n'est pas examiné.
4. « Wiener Malz » ↔ « Vienna Malt » sans nom français : non relié (la table `fermentables/noms.ts` pourrait le faire, non demandé).
5. Un nom appris par un lien manuel faux est corrigé par le lien suivant (déplacement), pas par un retrait depuis la fiche.

## 9. Hors périmètre et décisions pour le pilote

- Hors périmètre : fusion des doublons (D) ; nom français dans la liste du stock (C) ; édition ou retrait de `nomsFacture` à la fiche ; migration ou renommage d'un article existant ; `enrichissement*.ts` (f4-bout), `ficheCle.ts`, `nomsFr.ts`, `firestore.rules`.
- **D1** (recommandation : non, garder le saut) : élargir `traduireLignes` aux lignes `existing` proposées pour examiner le second candidat français (cas « Haferflocken ») ; `nomsFr.ts` est hors Possède et le test f5c `traduireLignes` l'exige.
- **D2** (recommandation : oui) : ajouter `src/ui/depense/rangees.ts` (`ligneConfianceDe`, une ligne) au Possède, sinon la confiance diverge du plateau (D-h).
- Les trois choix de la v1 sont tranchés par la revue : tout lien confirmé s'apprend (avec déplacement) ; plus de retour à « choisis » d'une proposition ; fiche de catalogue en repli sur le français.
