# PLAN — voie n1-nom-fr : son choix B (l'article en français, le nom imprimé gardé, toute facture suivante se relie)

Auteur : Sonnet, 02.11. Temps 1 : aucun code de `src/` écrit. Une sonde jetable (`tests/unit/depense/nom-b/sonde.test.ts`, effacée) a mesuré les cas de la
consigne sur l'arbre d'aujourd'hui (copie isolée) ; ses sorties sont en § 0. Lu : VOIE.md, COMMUN.md, `stockLineMatching.ts`, `articleNeuf.ts`,
`purchaseEntry.ts`, `nomsFr.ts`, `ExpenseSheet.tsx` (l. 300-350, 560-625), `StockDetailSheet.tsx`, `enrichissement.ts` (`travauxDeLaSaisie`), `ficheCle.ts`,
`b-depense.png`, `b-stock.png`, `b-suivantes.png` (ouvertes).

## 0. Portée (L01), écran, ses mots, mesures

- **Portée** : le nom d'un article NEUF né d'une ligne lue, le nom imprimé gardé, le lien des factures suivantes, la fiche de l'article (une ligne). Écrans : « Nouvelle
  dépense » (le champ « article « … » » du plateau, sans autre changement) et la fiche de l'article (« Sur la facture : … » sous « Nom »). Rien dans la liste du
  stock (ce serait C). Pas de fusion des doublons (D). Aucune migration, aucun article existant renommé.
- **Ses mots** (SPEC) : « Oui b c'est très bien » (02.11) ; « Ça traduits en français et fait le bon lien » (D271) ; « on veut pas de retrouver avec plein de fiche du
  même produit » (31.10). La maquette B est reprise telle quelle : champ « article « Malt de Vienne » » + « imprimé « Wiener Malz » » (déjà au plateau, D275),
  fiche : « Sur la facture : Wiener Malz » en petit sous « Nom », factures suivantes reliées à « Malt de Vienne ».
- **Mesures de la sonde (arbre d'aujourd'hui)** :
  - `articleNeufDe` d'une ligne « Wiener Malz » → nom « Wiener Malz » (le nom français n'entre nulle part dans le nom de l'article neuf) ;
  - `matchStockLine` / `regleProduit` : « Wiener Malz » ↔ « Vienna Malt » : aucun lien ; ↔ « Malt de Vienne » : aucun ; « Haferflocken » ↔ « Flocons d'Avoine » : aucun ;
    « Röstgerste » ↔ « Orge torréfiée » : aucun ; ligne « Malt de Vienne » ↔ article « Wiener Malz » : aucun. Mêmes mots seuls : « Malt de Vienne » ↔ « Malt de Vienne » = `meme` ;
  - stock « Flocons d'Avoine » + « Haferflocken », ligne « Haferflocken » : `matchStockLine` rend « Haferflocken » (sûr, mêmes mots) ; ligne « Flocons d'avoine » : « Flocons d'Avoine » ;
  - `nomAffiche("Malt de Vienne")` = « Malt de Vienne » ; `nomPropre` n'ôte pas « Malt de » ; la clé f4 `cleFiche('malt', nom)` est `malt||malz wiener` (imprimé) et
    `malt||de malt vienne` (français) : le nom français changerait la clé s'il y entrait.

## 1. Défauts visés (5)

| Id | Défaut (VOIE § « Ce que B demande ») | Cause mesurée |
|---|---|---|
| N1 | Le nouvel article porte le nom imprimé, pas le français | `articleNeufDe(ligne, …)` ne lit que `ligne.description` (l'imprimé, `nameFr` arrive après et reste « affichage seulement », `PurchaseLineDraft.nameFr`) |
| N2 | Le nom imprimé ne se garde nulle part | `StockItem` sans champ ; `newStockItem` n'écrit que `name` |
| N3 | Une facture dans une autre langue ne se relie pas | `matchStockLine`/`regleProduit` ne comparent que les mots de `description` à `item.name` |
| N4 | Un lien d'une autre langue n'apprend rien | aucun écrit sur l'article existant à « Confirmer » hors `currentStock` |
| N5 | La fiche ne dit pas le nom imprimé | `StockDetailSheet` : rien sous « Nom » |

## 2. Décisions de conception (le plan tranche ce que la consigne laisse)

**D-a. Le champ.** `StockItem.nomsFacture?: string[]` (types/index.ts, seul champ nouveau). Contient la BASE imprimée (celle que `lireOptions(nom, variante, unité).base`
rend et que `traduireLignes` envoie : « Wiener Malz », sans option ni suffixe d'unité), une fois chacune (comparaison `pliee`), 8 noms au plus, 80 caractères au plus.
Absent = article d'avant B ou saisi à la main : lisible et juste, aucune valeur par défaut écrite. Une liste, pour garder les noms de plusieurs langues. Firestore :
aucune règle à toucher (`firestore.rules` l. 176-182 ne contrôle que `currentStock`) ; `storage.ts` écrit les articles par `{...item}` (pas de liste blanche) et `merge:true`
ne touche que ses clés.

**D-b. Le nom imprimé d'une ligne** (`nomImprimeDe(line, draft?)`, pur, dans `articleNeuf.ts`) : la base de `line.imprime` (`lireOptions(imprime.nom, imprime.variante, line.unit).base`)
si la ligne a un `imprime` ; sinon `line.description` quand le brouillon vient d'une lecture (`scanModel` ou `documentHash`) ; sinon rien (une saisie à la main n'a pas de
facture : « Sur la facture » ne mentirait pas). Limite dite : sur une ligne lue sans `imprime` (nom = désignation), un libellé retouché à la main avant « Confirmer »
serait gardé comme imprimé ; l'interface ne change pas pour s'en protéger (hors Possède).

**D-c. Le nom français propre** (`nomFrPropre(nameFr)`, `articleNeuf.ts`) : exactement l'expression de `nomAffiche` (nom lu sans options, deux-points final ôté) ; test d'égalité
avec `nomAffiche` sur les cas (on n'importe pas `ui/depense/etat` dans le domaine). `ligneDeBrouillon` pose `nomFr` (facultatif) et `LigneProduit`/`StockLineInput` reçoit
`nomFr?: string`. Un nom que le brasseur a tapé (`articleName`) gagne toujours (déjà le cas : `nomTape`). Un libellé corrigé efface `nameFr` (déjà : `updateLine(…,{nameFr:undefined})`
dans le champ « Libellé ») : la description du brasseur devient le nom. Sans `nameFr` : le nom imprimé, comme aujourd'hui, jamais d'attente.

**D-d. Règle de lien unique** (`stockLineMatching.ts`) — `matchStockLine` et `regleProduit` restent les deux seules portes ; ils gagnent trois lectures, aucun niveau nouveau :
1. **Nom gardé** (lien sûr) : dans `examine`, une ligne dont les mots (mêmes jetons que le libellé, `sameName`) égalent ceux d'un `item.nomsFacture` obtient `pass = 1`,
   et passe toutes les autres portes (catégorie, unité, α, récolte, poids, malté, nature inconnue, frères numérotés). Rien n'est relâché.
2. **Nom français** : `matchStockLine(line, items)` devient `matchSurNom(line, items)` (corps actuel) appelé sur `line.description` ; si `line.nomFr`, appelé aussi sur
   `{...line, description: nomFr}`. Un seul article distinct trouvé → lien (même niveau que la règle sur le nom imprimé : proposition `existing`, D277 sûr/repris/rouge
   inchangés, pas de niveau inventé). L'`identity` rendue est celle de la lecture qui a trouvé (donc `deduced` vient du libellé lu).
3. **Deux candidats** : `candidatsLies(line, items)` (exporté) = articles DISTINCTS trouvés par (1), l'imprimé et le français. `matchStockLine` rend `undefined` s'il y en a ≥ 2 ;
   `regleProduit` rend `{cas:'ambigu', candidats, nom}` (la règle d'ambiguïté existante : « plusieurs articles … : choisis », `data-dp-ambigu`, ligne laissée sans lien, jamais un
   lien d'office). Cas de la consigne : stock « Flocons d'Avoine » + « Haferflocken », ligne « Haferflocken » de `nameFr` « Flocons d'avoine » → ambigu.
4. **Nom de l'article neuf** : `regleProduit` calcule la voie « inconnu / incertain / neuf / ambigu » sur l'imprimé ET sur le français (mêmes boucles, `membres`), prend la plus
   sévère (ambigu > incertain > neuf > inconnu ; égalité : l'imprimé) mais NOMME avec le français (`base` = `nomPropre(nomFr)` pour houblon et malt, sinon `nomFr`), puis `nomLibre`
   (suffixe « bis », origine, `nomsPris` : un nom français déjà pris par un article ou par une autre ligne neuve de la saisie donne le même verdict qu'aujourd'hui, S6/D215/« bis »
   restent vrais avec le nom français). Données lues (α, EBC, origine, récolte, poids) : toujours du libellé imprimé (la traduction n'est jamais une donnée, `nomsFr.ts`).
5. **Fiche** (`fiche` de s6, catalogue) : `ficheLaPlusProche` cherche d'abord sur le nom imprimé, puis, s'il ne trouve rien, sur le nom français (jamais le contraire : rien ne
   change pour un article qui a déjà sa fiche).

**D-e. La clé de fiche f4 ne change pas.** `travauxDeLaSaisie` (`enrichissement.ts`, hors Possède, intact) calcule `nom = nomPropre(line.description…)` → clé sur l'imprimé
(`malt||malz wiener`), et son `s6` / nom d'article passe par `ligneDeBrouillon` + `articleNeufDe` (donc suit mon changement de nom sans toucher ce fichier : le verdict `s6`
reste identique à celui de l'enregistrement). Conséquence : (i) une même fiche par produit tient car une facture suivante reliée n'est pas `new` donc ne crée aucun travail ;
(ii) deux premières factures du même produit dans deux langues, sans lien (cas hors ligne ou `nameFr` absent) donneraient deux clés : c'est exactement le cas que N3/N4
referment dès que le lien existe ; non résolu hors lien (limite dite, fusion = D, non demandée). Les témoins `tests/unit/depense/enrichir/**` doivent rester verts sans changement :
rejoués sur HEAD avant et après.

**D-f. Écriture à « Confirmer »** (`purchaseEntry.ts`) :
- *Article neuf* (`newStockItem`) : `...(imprime ? {nomsFacture:[imprime]} : {})`, avec `derive.name` français. Hors ligne : le même `put` de création (file locale) porte nom et
  nom gardé ; rien d'autre dans la file ; `nameFr` absent → nom imprimé + nom gardé (le nom gardé est l'imprimé, le nom de l'article aussi : pas de doublon à la fiche, N5 ne
  répète pas le nom de l'article).
- *Article existant relié* (N4) : après la boucle des mouvements, pour chaque ligne `existing` dont le nom imprimé (D-b) a un `pliee` différent de `pliee(item.name)` et absent de
  `item.nomsFacture` : `FirestoreRepo.put('stockItems', ref, {nomsFacture:[...union]}, {merge:true})`. Un seul écrit par article (les noms de toutes les lignes de la saisie réunis),
  `merge` de champ (pas `updateStockItem`, qui réécrirait `currentStock` en concurrence avec `adjustNumber`). Dans `savePurchase` après la garde `submitted` → un double clic n'écrit
  qu'une fois ; un rejeu après refus recalcule la même union (idempotent). Plafond 8 noms : au-delà, rien n'est écrit (jamais un nom retiré). Rien pour une ligne sans nom imprimé.
  Un lien appris à la main (le brasseur a choisi l'article) est appris aussi : il l'a vu et confirmé ; risque dit en § 4.

**D-g. Quand `nameFr` arrive** (`ExpenseSheet.tsx`, le `.then` de `traduireLignes`, l. 343-347). Pour chaque ligne qui reçoit son `nameFr` :
- ligne `new` encore intacte (dans `neufDOffice`, sans `articleName`, non touchée) : recalcul `regleProduit` avec `nomFr` sur le stock lu (`existantsLus` gardé en ref) ;
  `meme` → `{stockAction:'existing', stockRef}` + `relieAuto.set(id, nom)` (« relié à « … », nom déjà au stock ») + `neufDOffice.delete` ; sinon reste `new`, son nom devient le français
  par le calcul vivant (`neufParLigne`, la signature de cache `sig` reçoit `l.nameFr`) ;
- ligne `existing` proposée par l'imprimé et intacte (dans `proposedStock`, jamais touchée) dont le résultat avec `nomFr` est `ambigu` (le cas « Haferflocken ») : revient à
  `{stockAction:'none', stockRef:undefined}`, sort de `proposedStock`/`proposedRef`, le voisin est posé (`voisins`) pour que « plusieurs articles … : choisis » s'affiche ;
  une proposition qui a été touchée par le brasseur n'est jamais reprise ;
- ligne `none` (ambigu d'emblée) : rien ne change ; ligne dont le brasseur a tapé `articleName` ou choisi un lien : intacte (jamais un choix du brasseur remplacé) ;
- aucun changement tant que `nameFr` n'est pas là (hors ligne, échec, « Confirmer » avant l'arrivée) : nom imprimé, comme aujourd'hui.

**D-h. N5** (`StockDetailSheet.tsx`, après le `Field` « Nom », seul changement) : si `item.nomsFacture` (hors nom de l'article) a au moins un nom,
`<p className="text-xs text-cave-400">Sur la facture : A · B</p>` (texte, pas de nouveau contrôle ; `data-stock-noms-facture`). Lecture seule : la fiche n'édite pas la liste (aucun
écrit nouveau depuis la fiche). `onSave` garde `...draft`, donc la liste survit à un « Enregistrer ».

## 3. Tests qui échouent d'abord (`tests/unit/depense/nom-b/**`, Gemini simulé, fixtures fictives)

« TEMOIN AVANT » : lancés sur l'arbre d'aujourd'hui (copie isolée), rouges sur des assertions de comportement (jamais un import manquant : les champs nouveaux sont lus avec un cast
et la valeur attendue est comparée), sortie collée dans RESULTAT.md ; puis le même test vert.

| Fichier | Défaut | Cas (donnée → attendu) |
|---|---|---|
| `nom.test.ts` | N1 | ligne « Wiener Malz » + `nameFr` « Malt de Vienne », stock vide → `articleNeufDe(...).name` « Malt de Vienne » (et `nomPropose`) ; `nameFr` absent → « Wiener Malz » ; `articleName` tapé → le tapé ; `nameFr` « Frais :  » style deux-points → sans deux-points ; `nomFrPropre` = `nomAffiche` sur 6 cas ; « Malt de Vienne » déjà au stock → `meme` (pas de second article) ; deux lignes de même `nameFr` dans la saisie → la 2e « … bis » (nomsPris/virtuels) ; houblon « Cascade 7,5 % CH » + `nameFr` → nom français + α/origine du libellé imprimé |
| `conserve.test.ts` | N2 | `savePurchase` d'une ligne `new` avec `imprime` → article `{name:'Malt de Vienne', nomsFacture:['Wiener Malz']}` ; sans `imprime` en saisie à la main → pas de clé ; sans `nameFr` → `name`=imprimé et `nomsFacture:['Wiener Malz']` (le champ de N5 omettra le doublon) ; hors ligne (`navigator.onLine=false` simulé) : même écrit ; article d'avant B (sans champ) : `matchStockLine`/`regleProduit` rendent ce qu'ils rendent à HEAD |
| `lien.test.ts` | N3 | stock `[Malt de Vienne]` : ligne « Wiener Malz » (`nameFr` « Malt de Vienne ») → lien ; ligne « Vienna Malt » (`nameFr` « Malt de Vienne ») → lien ; stock `[{Vienna Malt, nomsFacture:['Wiener Malz']}]` : « Wiener Malz » → lien (pass 1) ; « Haferflocken » + « Flocons d'avoine » vs `[Flocons d'Avoine]` → lien ; vs `[Flocons d'Avoine, Haferflocken]` → `matchStockLine` rien, `regleProduit` `ambigu` (2 candidats) ; « Röstgerste » (`nameFr` « Orge torréfiée ») vs `[Orge torréfiée]` → lien ; « Premium Pilsner Malz » vs « Premium Pilsner Malt » inchangé. **Négatifs** : `nameFr` « Malt de Vienne » vs `[Malt de Munich]` → rien ; unité incompatible (kg vs L) → rien ; catégorie refusée (article « Emballage ») → rien ; houblon : nom gardé mais α différente → rien ; sans `nameFr` ni nom gardé : identique à HEAD (les suites `stock/*`, `fiche/regle` rejouées) |
| `appris.test.ts` | N4 | ligne `existing` « Vienna Malt » sur « Malt de Vienne » → `put('stockItems', ref, {nomsFacture:['Vienna Malt']}, {merge:true})` une fois ; 2e `savePurchase` du même brouillon (double clic) → 0 écrit de plus ; 2e facture « Vienna Malt » → pas de doublon (déjà là) ; nom imprimé = nom de l'article → aucun écrit ; plafond 8 → aucun écrit ; ligne sans nom imprimé → aucun écrit ; `adjustNumber` toujours appelé, `currentStock` jamais dans le `put` |
| `fiche-n5.test.tsx` | N5 | `StockDetailSheet` rendu avec `nomsFacture:['Wiener Malz','Vienna Malt']` → « Sur la facture : Wiener Malz · Vienna Malt » sous « Nom » ; un nom égal à l'article n'y est pas ; sans le champ → rien ; « Enregistrer » → `onSave` reçoit le champ |
| `ecran-nom-b.test.tsx` | N1, N3, piège | `ExpenseSheet` (jsdom, `traduireLignes` simulé comme `noms-fr/ecran-noms.test.tsx`) : le champ « Nom de l'article, ligne n » montre « Malt de Vienne » après l'arrivée ; « Confirmer » avant l'arrivée → « Wiener Malz » ; l'arrivée relie une ligne `new` intacte à l'article du stock ; ne reprend pas une ligne dont le brasseur a tapé le nom ; revient d'une proposition ambiguë (Haferflocken) en `data-dp-ambigu` ; une proposition touchée n'est pas reprise |
| `cle-f4.test.ts` | piège clé | `travauxDeLaSaisie` d'une saisie avec et sans `nameFr` : `cle`, `ligne.nomPropre` identiques (imprimé), `s6.cas` identique |

## 4. Risques et leur réponse

- **Données existantes** : aucun article lu n'est réécrit ; le champ est facultatif ; `grep` des lecteurs de `StockItem` (`storage.ts`, `StocksTab`, sync) : aucun ne le retire ;
  les règles Firestore l'acceptent. Son stock réel mêle des articles français et des articles au nom imprimé allemand (nés avant B) : aucun n'est touché ; ils se relient par
  les mots (comme avant) ou, s'ils portent un `nomsFacture` appris, par ce nom.
- **Deux candidats** : § D-d.3, testé. La fusion des doublons n'est pas faite ; l'écran propose seulement « choisis ».
- **Une fiche par produit** : le nom français déjà pris (stock, autre ligne de la saisie, `nomsPris` y compris « nom + origine ») suit `nomLibre` ; S6 et D215 inchangés (suites
  `fiche/*` rejouées). Le lien par nom français est ce qui empêche le second article du même produit.
- **Mauvais lien appris** : un nom gardé par un lien manuel faux relierait plus tard « sûr » à tort ; la fiche le montre (N5), pas d'édition en B. Mitigation : le nom gardé passe
  toutes les autres portes (catégorie, unité, α, récolte, poids). Alternative : n'apprendre que les liens venus du nom français ou de l'imprimé. **Recommandé : tout lien confirmé.**
- **Hors ligne / file d'envoi** : un seul `put` de création (nom et nom gardé) ; N4 un `put merge` par article, sous la garde `submitted` ; aucune écriture avant les validations ;
  `traduireLignes` hors ligne n'a pas de `nameFr` : rien d'attendu. Concurrence entre appareils : deux N4 simultanés peuvent perdre un nom (relu et réappris à la facture suivante).
- **Double clic** : garde `submitted` et `saveLocked` inchangées ; test N4.
- **Arrondis / unités** : aucune quantité ni prix touchés ; les portes d'unité (D213, D277) sont celles de `examine`, non relâchées (test unité incompatible).
- **Perf** : `matchSurNom` appelé 2 fois par ligne au plus ; la chasse `stock/perf.test.ts` rejouée (seuil inchangé).

## 5. Tests et scripts hors Possède qui appellent les fonctions changées (grep `tests/` et `scripts/` entiers)

`matchStockLine`, `regleProduit`, `proposeStockItem`, `articleNeufDe`, `ligneDeBrouillon`, `newStockItem`, `articlesNeufsDe`, `savePurchase` : `tests/unit/stockLineMatching.test.ts`,
`tests/unit/purchaseEntry.test.ts`, `tests/integration/{expenseSheetMouture,jus0Journey}.test.tsx`, `tests/unit/depense/{banc-k7,enregistrement,fiche,enrichir,port,raccord,stock}/**` ;
sources : `App.tsx`, `StocksTab.tsx`, `fabActions.ts`, `apercuDev.ts`, `confiance.ts`, `etat.ts`, `enrichissement.ts`. Tous additifs (champs facultatifs, mêmes signatures) : rejoués sur HEAD
avant (base) et après ; `confiance.ts` (art « repris » d'une ligne `none`) lit `regleProduit` : avec `nomFr` absent de ses lignes, résultat identique. Aucun de ces fichiers n'est
modifié par moi ; si un test casse, je m'arrête et le pilote tranche (aucun test existant n'est changé). `scripts/check-invoice-journey-emulator.mjs` : un cas `nom-b` ajouté, les autres inchangés.

## 6. Bout en bout (critère 4) — plan d'un cas `nom-b`

Sur doc14 avec `rejeu-d272b.json` (noms français rejoués, aucun Gemini) : (1) « Confirmer » → relecture de la base de l'émulateur : les nouveaux articles de malt portent le nom
français ET `nomsFacture` (le nom de la pièce) ; (2) une seconde facture fictive (fournisseur fictif, « Vienna Malt » avec `nameFr` « Malt de Vienne » contre l'article né de
« Wiener Malz ») : la ligne se relie, aucun nouvel article (comptage avant/après), « Confirmer » → `nomsFacture` reçoit « Vienna Malt » ; (3) la fiche (`StockDetailSheet`) montre
« Sur la facture : … ». Captures 390 et 1280, ouvertes (L12). Aucun « hmr update » / « page reload » dans `vite.log` (L17). Rejeu des six autres pièces (critère 5).

## 7. Hors périmètre (dit, non fait)

- Fusion des doublons (D) ; nom français dans la liste du stock (C) ; édition de `nomsFacture` à la fiche ; migration ou renommage d'un article existant.
- Un lien allemand ↔ anglais sans nom français (« Wiener Malz » ↔ « Vienna Malt ») : `fermentables/noms.ts` (table de noms) pourrait le faire, non demandé ; à proposer comme suite.
- `enrichissement.ts` (clé f4 sur l'imprimé), `ficheCle.ts`, `nomsFr.ts` (la traduction n'est pas touchée), `firestore.rules`.

## 8. Fichiers à écrire (tous dans le Possède)

`src/types/index.ts` (+1 champ), `src/services/stockLineMatching.ts` (`nomFr`, `candidatsLies`, `matchSurNom`, `regleProduit`), `src/domain/stock/articleNeuf.ts` (`nomFrPropre`,
`nomImprimeDe`, nom et fiche), `src/services/purchaseEntry.ts` (`newStockItem`, N4), `src/ui/finance/ExpenseSheet.tsx` (`.then` de D280, signature de cache), `src/ui/StockDetailSheet.tsx` (N5),
`tests/unit/depense/nom-b/**`, `scripts/check-invoice-journey-emulator.mjs` (cas `nom-b`).

## 9. Questions que je tranche, que le pilote peut renverser

1. Apprendre sur tout lien confirmé (recommandé) ou seulement sur les liens par nom français/imprimé (moins de risque de poison).
2. Revenir d'une proposition `existing` intacte à « plusieurs articles : choisis » à l'arrivée de `nameFr` (recommandé, c'est la consigne « jamais un lien d'office ») ou la garder
   et signaler en jaune.
3. Fiche de catalogue cherchée aussi sur le nom français en repli (recommandé, testé) ou imprimé seul.
