# REVUE-A — voie ug, regard MÉTIER ET FIDÉLITÉ (relecteur neuf, 09.11)

Lu : VOIE.md, PLAN.md, DECISIONS.md, `p3/g6/etat.html` (471 l.) + NOTE.md, `annual.ts`, `fribourgTax.ts`, `periodeSynthese.ts` (en-tête),
`forecast.ts:45`, `financeService.ts:132-170`, `TaxWorkspace.tsx`, `TaxClosingSheet.tsx`, `FinanceForms.tsx`, `FinancesTab.tsx`, `financeDemo.ts`.
Gravité : B = bloquant (corriger le plan avant tout code), G = grave (écart de métier ou de fidélité à régler avant l'écran concerné), D = détail.

## Verdict
**À CORRIGER avant code.** Le plan est sérieux (inventaire complet des 9 étapes, une seule voie d'écriture, domaine fait foi, écarts listés). Mais
3 points touchent à l'impôt et à la validité des écritures (B1 à B3) et le plan ne tient pas toutes ses promesses de fidélité à g6 (G). Aucun
« remplacer, jamais fusionner » n'est violé dans l'intention ; un point (G9) en laisse une trace.

## Bloquants

**B1 — `ecrireTax` ressuscite des vérifications périmées** (PLAN.md:96-97, §3.5 ; contrôle : `TaxClosingSheet.tsx:21`, `fribourgTax.ts:45`).
Le plan « applique `patch` sur `closing.tax` » puis pose `reviewedBasis = taxBasisKey(report)`. Or `closing.tax.reviews` stocké peut venir d'une
base plus ancienne (le domaine l'ignore à la lecture, `buildFribourgTaxReport` : `basisCurrent ? tax.reviews : {}`). Écrire `{journal:true}` par-dessus
avec la base courante rend vraies, d'un coup, toutes les anciennes cases (social, cas particuliers…) que le brasseur n'a pas revues sur les comptes
actuels. La feuille actuelle l'évite (`TaxClosingSheet.tsx:21` : `if (saved.reviewedBasis !== taxBasisKey(report)) saved.reviews = {}`).
Idem pour les effets de bord que la feuille pose et que le plan omet : `updateBalance` remet `reviews.balance=false` (`:31`), `updateCorrection`
remet `privateUse` et `social` à faux (`:32`). Le plan écrit des soldes (étape 2) et des corrections (étape 6) sans le faire.
Attendu : `ecrireTax` repart de `reviews = {}` si la base stockée n'est pas la courante ; une écriture de `balances` invalide `balance`, une de
`corrections` invalide `privateUse` et `social` ; tests 8, 15, 16, 19 : cas « base périmée » (une case `social:true` ancienne ne doit pas survivre
à « Tout est noté »).

**B2 — Étape 2, « Oui » écrit un solde bancaire du 31 déc. à partir du solde d'aujourd'hui, et annule le contrôle du domaine** (PLAN.md:48 ;
`fribourgTax.ts:56`, `:70`, `fribourgTax.ts` « Seul un compte bancaire… »).
(a) La maquette demande « Ta banque dit la même chose ? » pour **aujourd'hui** (« 4 181,60 aujourd'hui »). Le plan écrit une `TaxBalanceLine`
`bank` = `cashCents` (solde calculé au 31 déc., `annual.ts` via `summarizeLedger(…, end)`) : en novembre, c'est déclarer au fisc un solde de fin
d'année que personne n'a relevé, et il entre dans `totalAssetsCents` (`bankCash`).
(b) Ligne = `cashCents` par construction : `cashDifferenceCents = bankCash − cashCents` devient 0 tautologiquement ; le rapprochement banque/journal,
dont le but est de comparer un relevé indépendant, est neutralisé en un clic.
(c) La ligne est écrite sans `reference` (le domaine ajoute « Ajouter une référence aux comptes… », `fribourgTax.ts:62`) ni relevé joint
(« Joindre les relevés bancaires… ») : l'écran paraîtra fini et `tax.ready` restera faux sans que l'étape 2 dise pourquoi.
(d) Un second « Oui » ou une ligne `bank` existante : doublon, la somme des soldes double. Test 16 ne le couvre pas.
Attendu : année en cours (aujourd'hui ≤ 31 déc.) : « Oui » ne fait que confirmer (étape prête = `openingCash.confirmed`, déjà vrai) et **n'écrit pas**
de solde de clôture ; année passée : une seule ligne `bank` identifiée (remplace, n'ajoute pas), libellé « Compte bancaire au 31 déc. », référence
demandée, relevé à joindre dit sur l'écran. Compléter test 16 : en cours / passée / deux clics / ligne existante.

**B3 — Étape 8 : les nombres de la maquette ne sortent pas du domaine et le plan ne dit pas ce que le ticket affiche** (PLAN.md:54 ;
`fribourgTax.ts:68-81`, `annual.ts:185`).
- Revenu : `fields[income].amountCents = taxableResultCents`, **null** tant que `resultCents` est null, donc tant que les inventaires ne sont pas
  confirmés. La maquette affiche pourtant « −477,80 … ± stock ? / provisoire : stock ? ». Le plan écrit en même temps « montant `null` : À compléter,
  jamais 0 » : l'écran obtenu (À compléter) n'est pas g6 ; ou alors le ticket montre `perteAvantStockCents`, qui n'est **pas** le montant à reporter
  (il ignore `correctionCents`, parts privées de l'étape 6). La formule du ticket « ventes − dépensé − usure ± stock » (maquette) ne contient pas
  les corrections fiscales que le domaine ajoute.
- Fortune : la maquette montre « 4 873,60 = caisse + cuve − dettes ». Le domaine dit expressément le contraire (`fribourgTax.ts:71-72`, `explanation`
  du champ `wealth`) : « le patrimoine net comptable ne le remplace pas » ; `fields[wealth].amountCents` n'existe que si `movableWealth.confirmed`.
  Et `netAssetsCents` est null tant que le stock n'est pas confirmé (`totalAssetsCents` : `inventoryChangeCents == null`). Le plan cite
  `tax.netAssetsCents` comme source (colonne « Donnée réelle ») : il présenterait un nombre non reportable comme « à recopier ».
- Aucun nombre de la maquette n'est donc reproductible tel quel ; le plan doit trancher, pas laisser le codeur deviner.
Attendu : écrire, par ticket : état « provisoire » (stock ?) = le calcul partiel **nommé** (« avant stock » / « avant parts privées »), jamais présenté
comme le montant à reporter, Copier désactivé et dit pourquoi (liste `tax.missing` utile) ; fortune : afficher le détail caisse/cuve/dettes comme
**aide** (`netAssetsCents` ou ses composantes, « ? » si null) et le champ à copier = `movableWealth` confirmé, sinon « À confirmer (annexe 05) ».
Test 21 à compléter sur ces deux cas (stock non confirmé ; stock confirmé + correction privée). Rappel : tant que l'exercice court,
`fribourgTax.ts:52` interdit `ready` : l'étape 8 n'est « prête » qu'après le 31 déc., ce que T5 dit déjà ; le dire aussi ici.

## Graves

**G1 — Fixture du plan incohérente avec ses propres attendus** (PLAN.md:101 vs `financeDemo.ts:22`). La liste omet « Électricité 68,00 » (payée,
`chargesFixes`). Sans elle : payé = 470,40 (pas 538,40), pont = 4 249,60 (pas 4 181,60), charges fixes 400 (pas 468), perte = −438,40 (pas −506,40) :
les tests 1, 4 et D1 échoueraient pour la mauvaise raison. La démo réelle (`financeDemoEntries()`) a les six pièces T1 à T6 + six H : l'utiliser
(« peu de fixtures »), `vi.setSystemTime` sur le 09.11, plutôt qu'une fixture écrite à la main.

**G2 — « Loyer : noté en nov. seulement » (étape 1) n'est pas dérivable de la fixture** (PLAN.md:47, §3.3 ; `forecast.ts:45-58`,
`financeDemo.ts` `DEMO-LOYER` daté `${month}-25`). `planOccurrences` part de `plan.date` : le plan de la démo débute le 25 nov., donc aucune
occurrence en janv.–oct. La règle du plan (« occurrences passées sans pièce ») ne produit pas la pastille de g6 (« 400,00 chaque mois, prévu ») ; elle
n'en produit aucune. Attendu : dire que la pastille n'existe que si un plan récurrent démarre avant le mois courant, et que sur la démo l'étape 1
n'a que « rien noté » + « justificatifs 0 / 12 » (écart explicite avec g6-1), ou bien ajouter un besoin domaine/fixture (plan démarrant en janv.) à lister.

**G3 — Tête et « Mois par mois » donneront deux résultats différents sur le même écran** (PLAN.md:35, :112, :175 ; `periodeSynthese.ts:9-15`).
La tête suit le domaine (joints en charge, `businessUsePct` appliqué, usure ajoutée). `periodeSynthese` met les joints « à part » et n'applique pas
`businessUsePct`. La feuille T8 (Résultat / Entré / Dépensé) additionnera donc des mois dont le total ≠ la tête (−477,80 contre −506,40 sur la démo).
Le test 9 vérifie seulement mois = année **dans** `periodeSynthese`. Attendu : un test tête ↔ T8 (écart = matériel à part + usure, chiffré et dit à
l'écran : « dont matériel à part 28,60 »), ou ne pas afficher de « Résultat » dans T8 sans mention de l'écart.

**G4 — Le stock « ≈ estimé » de l'étape 3 est présenté comme celui du 31 déc., même pour une année passée** (PLAN.md:49, §3.4 l.92).
`valeurEstimee = dernière facture × stock courant` : valable (et étiqueté « estimé ») au plus pour l'exercice en cours. Pour 2025 consulté en 2026,
c'est le stock d'aujourd'hui rangé au 31 déc. 2025 : donnée trompeuse (L14). Attendu : proposition seulement si `year === année courante` (ou
date du stock ≤ date de clôture) ; sinon « ? ». Test 5 : ajouter le cas année passée.

**G5 — Étape 3 : cellule « ? » alors que les inventaires sont confirmés** (PLAN.md:49, §3.4 `inventairesParNature` : « somme ou `null` »).
Le domaine compte une nature sans ligne pour 0 dès que `inventoriesConfirmed` (`annual.ts:~178` : somme des `valueCents`). Afficher « ? » dans un
inventaire confirmé contredit le calcul de `inventoryChangeCents` ; afficher 0 serait inventé quand rien n'a été saisi. Attendu : confirmé + nature
sans ligne = « 0,00 (aucune ligne) » dit, non confirmé = « ? » ; états à ajouter à la liste § 1.2 (« États à rendre »). « Bière en cave » = lignes
`work-in-progress` + `finished` : dire que `ClosingSheet` ne propose que `raw`/`packaging` en reprise (`FinanceForms.tsx:116`) et comment le brasseur
saisit la bière en cave.

**G6 — D9 : le `valueCents: 0` d'« inconnu » est dans un fichier que la voie possède** (PLAN.md:183 contre VOIE.md « Possède … FinanceForms.tsx
(ClosingSheet …) » ; `FinanceForms.tsx:116`). Le plan dit « hors périmètre, à corriger par le pilote » alors qu'il modifie lui-même `ClosingSheet` (§ 2)
et que l'étape 3 y mène. « Reprendre les articles actuels » écrit 0 pour une valeur inconnue : un inventaire confirmé ensuite fausse
`inventoryChangeCents` et donc le résultat (« inconnu ≠ 0 »). Attendu : corriger dans la voie (valeur vide à saisir, case « confirmé » refusée tant
qu'une ligne est vide) ou le lister comme besoin ; ne pas dire « hors périmètre ».

**G7 — Étape 6 : tuile « Bière bue, offerte » en litres, base proposée par mots-clés, risque de double correction** (PLAN.md:52, D3 l.177 ;
`fribourgTax.ts:12` aide « Une part privée déjà retirée d'une dépense ne se corrige pas une deuxième fois »).
(a) g6 dessine « ? L » pour la bière ; le plan écrit un montant en CHF et ne dit pas comment des litres deviennent des francs (coût au litre ?). Sans
règle, la valeur est inventée ou la tuile mensongère. (b) La base proposée (charges dont la description contient « électricité »…) doit exclure les
pièces dont `finance.businessUsePct < 100` (déjà réduites dans `report`), sinon la part privée est retirée deux fois. (c) Aucun test (19) sur ces
deux cas. Attendu : règle écrite pour la bière (volume × coût de revient du brassin, avec sa source, ou saisie CHF directe dite « estimée ») ; base =
charge retenue dans `report`, jamais le TTC brut ; tests ajoutés.

**G8 — Étape 7 : l'état « moitié vue » de g6 est absent, et la piste revient en arrière sans le dire** (PLAN.md:53, :84 ; `etat.html:408` `.g6-v.h`).
(a) g6 a trois états de tuile (à faire / moitié / grisée « à comparer ») ; le plan n'en a que « faite » et « à refaire ». « Stock et matériel » (matériel
vu, stock ?) n'a pas de règle. (b) Piège de séquence : enregistrer les inventaires (étape 3) change `report.openingInventory`, donc `taxBasisKey`,
donc toutes les vérifications posées aux étapes 1, 5, 6 repassent à faux (`fribourgTax.ts:45`) : le brasseur qui avance « Continuer » voit ses étapes
prêtes se vider sans explication, hors de l'étape 7. Attendu : règle pour l'état moitié ; message « Les comptes ont changé » (phrase du domaine) sur
la tête et l'étape touchée ; test : 1 coché → inventaires enregistrés → piste 1 non prête + message.

**G9 — Étape 9 / figé : « Figer » sans clôture et « Préparer une nouvelle version » mal décrit** (PLAN.md:55, :118 ; `TaxWorkspace.tsx:115`,
`financeService.ts:138`).
(a) `freeze` exige `closing && !closing.report` (`TaxWorkspace.tsx:~62`) : sans clôture enregistrée, « Figer la version 2026 » est impossible ; le plan
ne dit pas l'état (désactivé + raison ? création d'une clôture ?). (b) Test 13 : « Préparer une nouvelle version appelle `onVersion` ». Actuellement ce
bouton ouvre `TaxClosingSheet` (« checks ») qui, sur un exercice figé, crée une clôture neuve et seulement alors appelle `onVersion(id)`
(`TaxClosingSheet.tsx:49-54`). `onVersion` seul ne crée aucune version. Attendu : décrire le geste réel (feuille → nouvelle clôture → `onVersion`) et
corriger le test 13 ; `ecrireTax` ne doit pas « refuser » le geste qui sert à sortir de l'état figé (cas `report` défini → nouvelle clôture, comme
`FinancesTab` fait pour `ClosingSheet`).

**G10 — « Ouvrir la déclaration » ne fait pas ce que fait g6 et pointe vers des instructions 2025** (PLAN.md:54 ; `etat.html:437`, `fribourgTax.ts:5-7`).
g6 : CTA noir « Ouvrir la déclaration » mène à l'étape suivante (Dossier). Plan : lien externe `tax.sourceUrl`, qui est le PDF d'instructions **2025**
(`FRIBOURG_TAX_SOURCE.url`, `fr.ch/media/57721`), pas la déclaration. Étiquette trompeuse, navigation différente de g6 sans être listée dans les
compromis (l. 192). Attendu : CTA noir = « Préparer le dossier » → étape 9 (g6 fidèle quant à la place) et lien officiel au second plan, libellé « Instructions
officielles Fribourg 2025 » (texte actuel) ; ou lister l'écart.

## Détails

**D1 — Postes de la pile : « Matériel » 28,60 apparaîtra deux fois** (PLAN.md:28, :175). `report.categories` contient la catégorie `materiel` (joints en
charge) ; le plan dessine en plus une tranche hachurée « joints : à décider ». Préciser : retirer `materiel` des postes et ne garder que la tranche hachurée
(ou l'inverse), jamais les deux ; le test 10 doit compter les segments.

**D2 — Étape 4 : « achat » = `acquisitionCents` ignore `businessUsePct`** (PLAN.md:93 ; `annual.ts:` `depreciationForYear` : `cost = acquisition × pct/100`).
Pour un matériel à 60 % pro, l'escalier montrerait 1 800 puis 1 080 : un saut sans cause. Utiliser le coût retenu par le domaine (`cost`) ou dire « 60 % pro ».

**D3 — D2 « Petit achat » : lien fragile entre la correction mémo et la pièce** (PLAN.md:176). Une `TaxCorrection` `other`/`included` « Joints : petit achat »
et « cesse de proposer la pièce » : par quel identifiant ? Prévoir `sourceId = tx.id` (champ existant, `types.ts` `TaxCorrection.sourceId`) pour retrouver la
décision, et dire que cette correction figure dans la liste de l'étape 6/feuille corrections (sinon le brasseur la verra surgir ailleurs).

**D4 — Étape 5 : où compléter nom et adresse des tiers ?** (PLAN.md:51 ; `fribourgTax.ts:56` « Compléter le nom et l'adresse des clients ou fournisseurs
encore ouverts »). « C'est complet » pose `reviews.balance`, mais `tax.ready` reste bloqué par l'adresse manquante des lignes « Tu dois » ; g6 ne montre
pas d'adresse. Préciser qu'un toucher sur une ligne ouvre la feuille `balance` (identité du tiers) et que l'écran 8 cite ce manque.

**D5 — Étape 9 : place des « Pièces complémentaires »** (PLAN.md:55). Fonction actuelle (`TaxWorkspace.tsx` ligne « Pièces complémentaires », feuille `attachments`) sans
emplacement dans le classeur g6 ; à dire (tuile « Justificatifs » ou ligne au second plan) pour que « remplacer » ne perde pas une fonction (cf. la liste
des fonctions de l'ancien écran du plan § 0).

**D6 — Étape 1 sans « Rien »** (PLAN.md:178, D4). Écart déjà nommé, accepté ; rappel : la pastille « Janv. à avr. : rien noté — vraiment rien acheté ni
vendu ? » reste dessinée sans bouton pour y répondre ; prévoir un texte de second plan qui renvoie à « Tout est noté » plutôt qu'une pastille sans geste.

## Ce qui est juste (preuves)
- Neuf étapes, textes, ordre et nombres de la piste : conformes à `etat.html:222-224`, `:235-459` ; « 2 / 9 » reproductible sur la démo (asset `openingConfirmed:true`,
  `openingCash.confirmed`) ; 12 pièces = « 0 / 12 », 213,00 de petits achats (28+31+34+37+40+43), 186,80 / 25 × 3 = 22,42, 921,60 = 20 % de 1 152,00 : vérifiés.
- D1 du pilote tient : la démo a `DEMO-T4` avec `finance` sans ligne, donc charge (`annual.ts:128`, pas d'alerte `:133`) : −506,40 = 720 − 938,40 − 288 vérifié.
- « Remplacer » : barre, `ExerciceField`, versions, engrenage, `TaxWorkspace` à onglets, lien archives et assistant en pied sont tous retirés du bloc Annuel ;
  fonctions conservées dans T9 / étape 9 (compromis listés l. 192).
- Écriture unique par `FinanceService.saveClosing`, centimes entiers, aucune règle d'amortissement/TVA/impôt réécrite : conforme à la règle du pilote.

LEÇON PROPOSÉE : un plan qui écrit dans `closing.tax` doit citer la feuille existante qui écrit au même endroit et reprendre ses effets de bord (base périmée vidée, relectures invalidées) ; ici B1 les omettait.
