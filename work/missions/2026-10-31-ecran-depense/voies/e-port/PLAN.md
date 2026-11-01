# PLAN — voie e-port : « Nouvelle dépense » devient r2b (le ticket)

Plan écrit avant tout code (`sans-memoire.md` § 2). Lu : VOIE.md, GATES.md, COMMUN.md, `v1/r2b/etat.html` + NOTE.md, `critique/VERDICTS-v1.md`,
`BRIEF-ECRAN.md`, `ExpenseSheet.tsx` (320 l.), `InvoiceScanReview.tsx`, tous les tests qui rendent `ExpenseSheet`, `invoicePoints.ts`,
`functions/src/invoiceControls.ts` (type `ScanPoint`), `purchaseEntry.ts`, `purchasePrefill.ts`, `stockLineMatching.ts`, `apercuDev.ts` (Malts).

**Portée (L01), en une ligne** : l'écran `ExpenseSheet` (feuille ouverte par QuickActionModal, StocksTab, UpgradeWorkspace) change de peau et de
structure d'affichage ; son état, ses gardes et tous ses appels de service restent les mêmes. Lecture étroite : rien dans `src/services/` ne bouge.

## 0. Ce que je décide (le plan tranche)

1. **La logique ne bouge pas, le JSX sort.** `ExpenseSheet.tsx` garde `draft`, `attach`, `save`, `attachToExisting`, `focusIssue`, `pendingId`,
   `pendingRef`, `proofSent`, `proofAttached`, `saveLocked`, `scanLocked`, `proposedStock`, `lineStartsOpen`, `sameAs`, `receipt`. Il passe
   à des composants de `src/ui/depense/` des valeurs et des rappels. Raison : les gardes de r2b (D7) sont prouvées par des tests ; les déplacer
   les expose pour rien.
2. **Les identifiants que les tests lisent restent** (voir § 5) : libellés `Total TTC en CHF`, `Pour quoi ?`, `Stock ligne n`, `Unité ligne n`,
   `Libellé ligne n`, `Nature ligne n`, `Montant ligne n`, `Matériel ligne n`, `Fournisseur`, `N° de facture`, `Catégorie`, `TVA source (CHF)`,
   `Taux source (%)` ; ids `purchase-*` ; attributs `data-purchase-line`, `-lines`, `-date`, `-payment`, `-options` ; région
   `Vérification du justificatif` ; région `Achat peut-être déjà enregistré` ; boutons `Confirmer et enregistrer`, `Enregistrer la dépense`,
   `Vérifier la synchronisation`, `Changer`, `Même achat`, `Autre achat`, `Rattacher le justificatif`, `Terminé`, `Connecter Drive`.
   Quand le texte visible de la maquette est plus court (« Confirmer »), le nom accessible reste l'ancien par `aria-label` qui **commence par le
   texte visible** (« Confirmer » ⊂ « Confirmer et enregistrer »).
3. **Les chips sont les points qui pèsent** (voir § 3). Ce n'est pas la liste figée de la maquette.
4. **Aucun mot que le service ne tient pas** : pas de « Target bis », « Créer CH », « tu peux fermer », « 0,4 / 0,7 Mo » en direct (§ 8).

## 1. Points du plan (les 16)

| n | Point | Section |
|---|---|---|
| P1 | Bandeau + tuiles Payé/TVA + chips numérotées (le premier écran) | § 2, 3 |
| P2 | Le ticket : 23 lignes dans l'ordre du papier, montant, un picto, pastille-mot (critique n° 1), plateau | § 2, 4 |
| P3 | Interrupteur « Mettre en stock : oui / non » (critique n° 4) | § 4 |
| P4 | Mouture (S5) : proposée, liée au seul geste (« Rattacher les 5 » ou une à une), « mouture → Maris Otter » | § 4 |
| P5 | Points typés l2 : statut recalculé, chips, preuve | § 3 |
| P6 | TVA : trois tuiles lues, bases à l'échelle, « — HT non imprimé », sans « Tu n'es pas assujetti » (critique n° 3) | § 4 |
| P7 | Payé le + base de la date (A7) | § 4 |
| P8 | S8 (`purchaseSimilarOrders`) + doublon exact : état 8, « Même achat · ne pas doubler », « Voir 380001 » | § 4 |
| P9 | Pied, Drive, envoi, reçu qui reste, `onSaved(reçu)`, gardes r2 | § 4, 8 |
| P10 | Bande collante « 1 2 3 4 5 6 · point courant · y aller » (critique n° 2, z2b) | § 4 |
| P11 | En-tête éditable sur place ; « Drive à connecter » dans le bandeau | § 4 |
| P12 | États 1, 5, 6, 9 (lecture en cours, erreur, Drive pas connecté, hors ligne) | § 4 |
| P13 | Saisie manuelle, matériel, plan lié : tout l'ancien écran reste atteint | § 5 (« Rien ne se perd ») |
| P14 | Fixture de développement + crochet de QuickActionModal | § 6 |
| P15 | Deux libellés des vues Finances | § 7 |
| P16 | Tests : témoins avant, tests existants nommés, script G7 | § 9, 10 |

## 2. Composants (`src/ui/depense/`, nouveaux ; classes `dp-…`, styles dans `depense.css`)

| Fichier | Rôle | Reprend de la maquette |
|---|---|---|
| `etat.ts` (pur, testé) | `recalculerLecture(scan, draft)` → `{points, statut}` ; `pointsDeLEcran(...)` → chips numérotées ; `compteLiens(lignes, ...)` ; `effetStock(ligne, ...)` → pastille-mot ; `prixAvecMouture(...)` ; `baseDeLaDate(draft)` ; `lignesDuPapier(draft)` | `L`, `PTS`, `preuve()`, `ico()`, `MOTS` |
| `Pictos.tsx` | `PictoLien` (relié, nouveau, bis→« nouvel article voisin », unité à préciser, gris, mouture), SVG de la maquette ; `aria-label` = le mot | `ico()` |
| `Bandeau.tsx` | fournisseur + date (éditables sur place), total 32 px (`Input` protégé, `id="purchase-total"`, `aria-label="Total TTC en CHF"`), chip « n lignes » + état de lecture, barre des n lignes (largeur = montant), « Drive à connecter » | `#r2b-bd` |
| `Preuve.tsx` | les trois rangées chiffrées, « page coupée », compte des liens, remarques de la lecture | `#r2b-preuve` |
| `Tuiles.tsx` | tuile 1 TVA, tuile 2 Payé ; panneaux TVA (3 grandes tuiles, bases à l'échelle, « — HT non imprimé ») et Payé le (carte supposée / facture, C'est la date / Autre date) | `#r2b-tu`, `#r2b-ptva`, `#r2b-ppay` |
| `Chips.tsx` | chips numérotées (barrées une fois réglées) ; `BandeCollante` (position sticky sous le titre, apparaît quand le bandeau sort de l'écran, `IntersectionObserver`) | `#r2b-pts` + greffe z2b |
| `Ticket.tsx` | `Ligne` (grille 24 px / nom / montant, sous-ligne qté·unité·α·conversion, pastille-mot, ligne de correction : voisin grisé + bouton, g · kg · Stk), `Mouture`, `TableauMoutures`, `Plateau` | `.r2b-li`, `.r2b-mo`, `.r2b-plat` |
| `Rubriques.tsx` | `<details>` Pour quoi ? (proposé) · Achat du · Fournisseur et catégorie · Lier à une dépense prévue · Référence et TVA | `.r2b-more` |
| `Doublon.tsx` | panneau « Peut-être déjà enregistré » (doublon exact **et** S8) avec grille de comparaison | `#r2b-dup` |
| `Pied.tsx` | Drive prêt / à connecter, bouton, envoi, reçu (nom, dossier, « Ouvrir dans Drive », « octets · taille vérifiée », « À revoir : … ») | `#r2b-pied` |
| `apercuDev.ts` + `apercu/lecture-372765.json` | fixture (§ 6) | — |
| `depense.css` | styles, mappés sur les jetons de l'app (`--cave-*`, `--attention`, `--hop`, `--ebc-straw`, `--alert-strong`) ; **le thème suit** (aucune couleur en dur, sauf les quatre teintes de famille de la barre, prises dans DESIGN.md) | `<style>` |

Largeurs : 390 = une colonne ; ≥ 900 px = grille de la maquette (gauche 440 : verdict, preuve ouverte d'office, tuiles, chips, rubriques ; droite
≤ 720 : ticket). La rive stock de u4b à 1280 n'est pas faite (VOIE).

## 3. Les points qui pèsent (P5) — règle des chips

Source unique : `recomputeInvoicePoints` (déjà dans `invoicePoints.ts`, appelé tel quel).

- `recalculerLecture(scan, draft)` fabrique un `RecalculableScan` **depuis le brouillon courant** : `items` = lignes du brouillon (`id`, `description`
  → `name`, `kind`, `quantity`, `unit`, `unitPrice` → `price`, `amount` → `amountTTC`), `amountTTC` = `draft.amount`, `amountHT` =
  `draft.sourceNetAmount ?? null`, `tvaAmount` = `draft.sourceVatAmount ?? null` (jamais `undefined`, sinon le point `ht-tva-ttc` du serveur serait
  refait sans donnée), `linesLost`, `points`, `controls`, `review` du résultat lu. Appelé à chaque correction (quantité, prix, montant, total) par
  `useMemo` sur `draft.lines` et `draft.amount`. Une valeur tapée par le brasseur entre dans le calcul et n'est **jamais écrasée** (le calcul est pur).
- Statut affiché = `statutDeLecture(scan.result, recalcul)`. Le chip « n lignes » porte l'icône du statut : `checked` coche verte,
  `corrected` coche grise, `disputed` point d'exclamation ambre, `unavailable` point d'interrogation ambre. Jamais de coche verte sur un statut qui ne
  l'est pas. Les quatre titres actuels (« Lecture vérifiée », « Corrections proposées », « Lecture à confirmer », « Vérification incomplète »)
  sont la première rangée de la preuve.
- **Chips, dans l'ordre du risque** : (a) argent : `ScanPoint` avec `peserPoint(p)` et `enjeu === 'argent'`, regroupés par chip (TVA : `tva-incoherente`,
  `ht-tva-ttc`, `taux-tva-hors-plage` ; Total : `somme-ecart`, `somme-incomplete`, `total-absent` ; une chip par ligne pour `ligne-montant`) ; (b) « Payé le » quand
  `paymentDateBasis === 'document_date'` (A7, pas un `ScanPoint`) ; (c) stock : `ScanPoint` `enjeu === 'stock'` qui pèsent (`unite-absente`, `alpha-libelle`,
  `nature-a-preciser`, `ambiguite-ligne`) **plus** les moutures proposées (`proposeMillingSurcharges`) **plus** les voisins (§ 4, P2). Un point qui ne
  pèse pas (`type-deduit`) n'est pas une chip. `lectures-divergentes` pèse sauf majorité : il l'est dans `PESE_PAR_CODE`, je le lis, je ne le refais pas.
- Une chip est « réglée » (barrée) par un **geste du brasseur** (tuile TVA choisie, « C'est la date », liaison faite, unité choisie) ou parce que le recalcul
  l'a levée ; jamais par le temps ni par défaut. Le « revu » ne vaut que pour la même `signature` (comme l2).
- Sans `points`/`controls` (ancienne lecture, ou lecture simulée sans typage) : **aucune coche verte** ; les rangées de preuve disent « non contrôlé » ;
  les chips ne sont que (b) et (c) calculés côté écran. Le simulé est marqué.
- Les `remarques` et les phrases de `issues`/`review.findings`/`ambiguity` restent lisibles : liste repliée « Remarques de la lecture (n) » dans la
  preuve, chaque phrase une fois (dédoublonnée contre `point.message`). Elles ne comptent pas dans les 100 mots du repos.

## 4. Changements, par point (fichier et fonction)

**P1 / P5 / P10 / P11 / P12 — `ExpenseSheet.tsx`, `return`.** Le `ModalShell` reste (titre, ×, `dismissible={!busy&&!saving}`, `aria-labelledby`). En-tête :
titre, icône « Voir le justificatif » (ouvre le panneau justificatif : Voir l'original, Changer), **icône « Changer »** (bouton réel, `aria-label="Changer"`,
désactivé comme aujourd'hui quand `saving||pendingId` : un test hors Possède lit `getByRole('button',{name:'Changer'})` sans ouvrir de panneau), ×.
Corps : `Doublon` → `Bandeau` → `Preuve` → `Tuiles` → panneaux → `Chips` → `Ticket` → `Rubriques`. Bande collante : `IntersectionObserver` sur le bandeau ; quand il
sort, une bande 28 px sous l'en-tête : chips en pastilles numérotées, nom du point courant (le premier non réglé), « y aller » (saute + éclair ambre,
`scrollIntoView` ; `prefers-reduced-motion` : sans animation).
- **États** : 1 `busy` (trois étapes Envoi · Lecture · Vérification avec un temps écoulé réel `elapsed` calculé côté écran depuis le début de `attach`, jamais
  inventé ; les étapes « Envoi ✓ » / « Lecture » reposent sur les jalons réels de `attach` : `setAttachment` puis `scanDocument` ; « Vérification » ne s'allume
  qu'à la réponse) ; 2 lue sans point ; 3-4 avec points ; 5 `scan.ok===false` : bandeau « — », aucune valeur proposée, rubriques « à saisir », erreur avec Relire /
  Saisir à la main (Relire = `attach(attachment)` si le fichier est gardé ; sinon cacher) ; 6 `FirebaseAuthService.hasDriveAccess()` faux → « Drive à connecter » dans le
  bandeau et au pied, `DriveConnection` reste monté (bouton `Connecter Drive`) ; 9 `navigator.onLine===false` (+ écouteurs `online`/`offline`) → pied « Hors ligne ·
  brouillon gardé » ; Confirmer reste **actif** : le clic tente l'enregistrement et le service dit lui-même qu'il est hors connexion (test C8 de jus0).

**P2 — `Ticket.tsx`.** Une ligne = `<article data-purchase-line>` contenant un `<details>` (le plateau) dont le `<summary>` est la ligne du ticket (grille 24 px / nom
/ montant). Raison : trois fichiers de tests hors Possède lisent `[data-purchase-line] summary`. Le `summary` contient, dans cet ordre : picto (aria-label = mot du
lien), nom (le libellé imprimé, `line.description`), **pastille-mot** de l'effet au stock à droite du nom (« +6 kg » si relié et conversion valide via
`formatUnitLink`/`stockQuantityFor` ; « nouveau » si `stockAction==='new'` ; « unité ? » ; rien sur une mouture ni un service), sous-ligne (quantité · unité imprimée ·
α · chip de conversion `formatUnitLink` verbatim — « 25 kg → 25 000 g », « 2 Stk = 2 sachet »), montant. Textes que ces tests exigent et que je garde dans le
`summary` : `proposé` (marque + `sr-only` « proposé : <nom de l'article> » pour les lignes dont `proposedStock` contient l'id), le nom de l'article lié, « unité à préciser »
(visible : pastille « unité à préciser » — seule ligne concernée), « poids du sachet non confirmé ». Le plateau reprend `fields` d'aujourd'hui (mêmes `aria-label`,
mêmes `select`) restylé ; montants, quantité, prix en édition sur place par `Input` protégé (jamais `type="number"`) ; ligne de contrôle « 6 × 2,30 = 13,80 ✓ » ou
l'écart au centime (calcul en centimes entiers, comme `lineMathCheck`). Une ligne `service`/`shipping`/`discount` n'a pas de `select` « Stock ligne » (comme aujourd'hui).
La sélection d'une seule ligne ouverte à la fois n'est pas imposée (le natif `<details>` suffit).
- **Voisin** : pour une ligne sans proposition, si `readProductLabel` donne le même nom propre qu'un article du stock (même catégorie) mais pas la même
  α/origine/récolte, la ligne de correction montre cet article **grisé** (« Target α 11,8 », valeurs lues du stock) à côté du bouton. Lecture seule : ne lie
  rien, ne change aucune règle d'appariement, n'appelle pas `matchStockLine` autrement qu'aujourd'hui. Le geste « Créer » pose `stockAction:'new'` avec le libellé imprimé ; ⇄
  ouvre le plateau (Combobox). **Le bouton s'appelle « Créer Target 11.3% » (le nom que `savePurchase` écrira vraiment, `line.description.trim()`), pas « Target bis »** (§ 8, décision 2).
- Unité manquante (D214) : g · kg · Stk sur la ligne même ; le choix écrit `unit` de la ligne (l'unité devient celle que le brasseur a choisie, `unitPrice` retiré
  par `updateLine` : règle d'aujourd'hui) ; rien n'entre en stock tant que `isReadableUnit` est faux (la validation de `validatePurchase` le dit, inchangée).

**P3.** Plateau : rangée « Mettre en stock » = interrupteur (`role="switch"`, `aria-checked`, libellé « oui »/« non » à côté, 28 px) **au-dessus** du `select`
`Stock ligne n` (qui reste, pour les trois valeurs `none` / `existing` / `new` et pour les tests). Interrupteur non → `stockAction:'none'` (+ `proposedStock.delete`) ;
oui → `existing` (le `stockRef` proposé s'il y en a un, sinon vide : le Combobox demande l'article, la validation existante refuse tant qu'il manque). Jamais
`new` par le seul interrupteur : « Dans le doute, rien ». Le lien souligné « Aucun mouvement de stock » disparaît (c'est l'interrupteur qui le dit).

**P4 — mouture (S5).** `proposeMillingSurcharges(draft.lines)` donne `{lineId,parentId}[]`. Sous-ligne `↳ mouture` en pointillé ambre, montant ; sur la première
non liée : bouton « Rattacher les 5 » (n réel) = boucle de `confirmMillingSurcharge` sur chaque proposition (une seule mise à jour de `draft.lines`) ; sur chacune : un
toucher la lie (`confirmMillingSurcharge`), un toucher de plus la détache (`updateLine(id,{surchargeOf:undefined})` : champ du brouillon, pas un service). Le chevron ouvre
`TableauMoutures` : « lu 2,30 → 2,40 /kg » par malt, avec « Rattacher les 5 » et « Laisser en service » (état d'écran seulement : la mouture reste une ligne
de service, aucun lien écrit). Une fois liée : « ✓ mouture → Maris Otter » sur la sous-ligne et « ✓ 2,40/kg » sous le montant du malt. Le prix « avec mouture » est
calculé en centimes ((montant malt + montant mouture) / quantité) **et comparé au chiffre que `savePurchase` écrit** par un test (`mouture-prix.test.ts` lu au codage ; si
la valeur écrite diffère, l'écran dit celle du service). Rien n'est lié sans geste : état initial = `surchargeOf` absent partout.

**P6 — TVA (`Tuiles.tsx`, `etat.ts`).** Tuile 1 : valeurs lues côte à côte « 2,80 · 4,15 » quand `tva-incoherente` pèse ; sinon une valeur et « lue ». Panneau : trois tuiles
tirées du `ScanPoint.details` (colonne MWST lue ; somme N + R = relation du point ; « — proposé · HT vide » = ne rien écrire) → écrit `sourceVatAmount` (via `patch`) ou le
laisse vide. Aucune autre valeur n'est proposée que celles du point. Dessin des bases à l'échelle du total : `Math.round` interdit dans le dessin (largeurs en
rapport d'entiers de centimes), légende « cadre = total 86,50 » **sans** la phrase « Tu n'es pas assujetti » (critique n° 3 ; aucune supposition sur le brasseur). Quatrième
élément « — HT non imprimé » (greffe u4b) quand `amountHT` est nul. Sans `vat`/`details` : le panneau montre la seule TVA lue et le champ tapé (`TVA source`).

**P7 — Payé le (A7, `Tuiles.tsx`).** Tuile 2 : la tuile est le seul texte `Payé le 27.04.2026` (un élément) suivi de « supposée » (ambre, tirets) quand
`paymentDateBasis==='document_date'`, « confirmée » après « C'est la date » (`patch({paymentDate: <même date>})` → `patchPurchaseDraft` pose `typed`), ou « tapée ». Le panneau (contenu `data-purchase-payment`) garde `DateField` + raccourcis Hier/Aujourd'hui/Demain
et le choix `Moyen de paiement`, Déjà payé / À payer, échéance quand à payer. « La base » dit **ce qui est retenu** : « facture 27.04 » / « livraison … » selon la
source ; aucune date n'est inventée : sans date lue, la tuile dit « — ». La mention « Betrag per E-Finance dankend erhalten » vient de `paymentEvidence==='paid'` + `fieldWarnings`/`evidence` ;
si le texte imprimé n'est pas dans le résultat, la ligne ne cite aucun texte imprimé (elle dit « paiement lu sur le document »).

**P8 — S8 et doublons (`Doublon.tsx`).** Candidat = `duplicates[0]` (exact, comme aujourd'hui) sinon `purchaseSimilarOrders(draft, transactions)[0]` (appel pur, **nouveau
dans cet écran**, pas un service). Même grille de comparaison (N°, Date, Commande, Total ; les lignes égales en ambre), mêmes boutons `Même achat` / `Autre achat` (`aria-pressed`),
mêmes phrases de conséquence, même région `Achat peut-être déjà enregistré`. Le doublon exact bloque comme aujourd'hui (erreur « doublon » tant qu'aucun choix) ; **le S8 ne bloque
jamais** (c'est le contrat du service : signal). Libellés : « Même achat · ne pas doubler » est le texte visible court de `Même achat` (aria-label `Même achat`) ; « Voir 380001 »
déplie les lignes de l'achat existant (lecture seule, déjà dans `tx.finance.lines`). Fixture : la transaction 380001 du 30.04 (sonde d1) est fournie en simulé.

**P9 — pied, Drive, reçu (`Pied.tsx`, `ExpenseSheet.save`).** Boutons : `Confirmer` (`aria-label="Confirmer et enregistrer"`) si `scan.ok`, `Enregistrer` (`aria-label="Enregistrer la
dépense"`) sinon, `Vérifier la synchronisation` si `pendingId`, `Rattacher le justificatif` / `Fermer sans rien enregistrer` / `Terminé` comme aujourd'hui : mêmes conditions, mêmes
`disabled`. **Toujours actif** (hors `saving`) même avec des points ouverts. Pendant `saving` : « Envoi au Drive · 0,7 Mo » (taille de `attachment.size`, **barre indéterminée**), sans « tu peux
fermer » (la feuille n'est pas fermable pendant l'envoi : `dismissible={!busy&&!saving}`). `proofSending` (`drive/in-progress`) reste un `role="status"` avec son texte, inchangé.
- **Reçu qui reste** : à la réussite, `save` appelle `onSaved(proof)` **puis ne ferme plus** ; l'écran passe en état « enregistré » (un `useState` `done`), le pied montre le reçu
  de la maquette : `receipt.fileName`, `receipt.folder`, lien « Ouvrir dans Drive » (https `drive.google.com` seulement, `receiptSentence` inchangé), « n octets · taille vérifiée »
  seulement si `receipt.bytes` est présent **et** `receipt.verified===true`, puis « À revoir : … » (ce qui reste ouvert : TVA vide, date supposée gardée, moutures en service, lignes
  sans mouvement de stock) calculé depuis l'état réel. Bouton `Terminé` → `onClose()`. Le × et la touche Échap appellent aussi `onClose`. Le formulaire est désactivé (`done`) :
  impossible de ré-enregistrer ou de changer le fichier (double clic sûr ; `saveLocked` reste).
  **Test touché** : `tests/unit/depense/raccord/ecran-recu.test.tsx:72` (`expect(state.onClose).toHaveBeenCalled()` juste après la sauvegarde). Voir § 10, décision 1.
- Tant que la confirmation est en attente (`pendingId`), l'ancien texte `receiptSentence` s'affiche (« Justificatif rangé dans « … » sous « … », empreinte vérifiée. » + lien) et, sans reçu,
  « sera rangé dans ton Drive privé » : trois tests hors Possède lisent ces phrases.
- Les trois textes de garde de r2b (`attach` : « L’enregistrement attend sa confirmation… », « Le justificatif est déjà rattaché… », « Ce fichier est déjà parti… ») restent
  dans le même `role="alert"`, mots pour mots ; l'ordre des tests `pendingRef` → `proofAttached` → `proofSent` ne change pas.

**P10.** Voir P1. **P11** : `Bandeau` — fournisseur et date de la facture sont des champs pointillés éditables sur place. Le champ de la rubrique « Fournisseur et catégorie » garde `id="purchase-vendor"`
et le libellé `Fournisseur` (les tests le lisent) ; celui du bandeau est une seconde vue du même état, `aria-label="Fournisseur (bandeau)"`, sans `id` (pas de doublon
d'identifiant). La date du bandeau ouvre la rubrique « Achat du » (`DateField`). « Drive à connecter » : pastille orange du bandeau, bouton → focus du `Connecter Drive`.

**P13.** Voir le tableau § 5. Sans fichier, l'écran montre la zone de dépôt actuelle (restylée, mêmes textes), puis le formulaire manuel dans la même mise en page r2b
(bandeau sans lecture : « — » et total tapé ; ticket d'une seule ligne ; rubriques). Matériel : la ligne `equipment` garde `Matériel ligne n`, `Combobox` « Matériel »,
la phrase de fiche créée ; l'intention `equipment` garde le titre « Acheter du matériel ».

## 5. InvoiceScanReview et « Rien ne se perd »

`InvoiceScanReview.tsx` **garde son nom et son export** (importé par rien d'autre que `ExpenseSheet`, vérifié par `grep`). Il devient le conteneur
`<section aria-label="Vérification du justificatif">` = bandeau-verdict + preuve (il prend `result`, `cached`, `recalcul`, `statut`, `draft` en props et rend `Bandeau`
et `Preuve` de `src/ui/depense/`). Le mode `compact` et le mode plein actuels sont supprimés après `grep` des usages : un seul usage (`compact`), l'autre branche est du
code mort. Les textes `Lecture déjà disponible · aucun nouvel appel IA.` et le `aria-label="Détails de la lecture"` (sur le chip « n lignes ») restent.

| Fonction de l'écran d'avant | Où dans r2b | Texte/test qui la tient |
|---|---|---|
| Joindre / déposer / photographier / « Saisir sans justificatif » | zone de dépôt actuelle conservée (même JSX, restylé) tant que `!attachment` | `Justificatif de la dépense`, `Joindre un justificatif` |
| Voir le justificatif (image / PDF) ; Changer | icônes d'en-tête + panneau justificatif | `Changer` |
| Revue de lecture, statut, remarques, « lecture déjà disponible » | chip « n lignes » + preuve | 4 titres, `Détails de la lecture` |
| Doublon exact, Même / Autre achat, rattacher, Terminé | `Doublon` + pied (mêmes boutons) | jus0 JUS-1 |
| Total TTC (+ « calculé » si somme des lignes, devise ≠ CHF) | bandeau, `Input` protégé, `id="purchase-total"` | `Total TTC en CHF`, `Original : … Montants à renseigner en CHF.` |
| Pour quoi ? | rubrique, « proposé » si `descriptionSource==='scan'` | `Pour quoi ?` |
| Achat du + raccourcis Hier/Aujourd'hui/Demain, mois | rubrique `data-purchase-date` | `Mois — Date de l’achat` |
| Déjà payé / À payer, payé le, moyen, échéance, indice paiement | tuile 2 + panneau `data-purchase-payment` | `Payé le …`, `Hier` |
| Fournisseur, catégorie (indices À confirmer) | rubrique, `ScanHint` conservé | `Fournisseur`, `Catégorie` |
| Lier à une dépense prévue + échéance concernée | rubrique (seulement si des plans existent) | `purchase-plan`, `purchase-occurrence` |
| Lignes : libellé, type d'achat, montant, extrait, stock (3 valeurs), Combobox article, quantité, unité, matériel (3 valeurs), Combobox matériel | plateau de la ligne | tous les `aria-label …ligne n` |
| Ajouter une ligne (≤ 35), retirer, regrouper en une dépense | pied du ticket + plateau | `Ajouter une ligne`, `Retirer la ligne n` |
| Détail X / Y (écart) | pied du ticket | `Détail : …` |
| Référence et TVA : n° de facture, commande, TVA, taux, indices | rubrique `Référence et TVA du document` | `TVA source (CHF)`, `N° de facture` |
| Erreurs « À corriger » + focus sur le champ (ouvre les `details` **et les panneaux**) | `focusIssue` étendu aux panneaux | `Vérifie le montant de TVA` |
| Reçu Drive, « sera rangé », DriveConnection | pied + pastille | `receiptSentence`, `Connecter Drive` |
| Gardes `pendingId`, `proofSent`, `proofAttached`, `saveLocked`, `scanLocked` | inchangées dans `ExpenseSheet` | changer-fichier, rattachement-en-cours |
| Hors ligne, invalidation Drive (`drive/auth-required`) | pied + `DriveConnection always` | jus0 C8, expenseSheet |
| `onSaved(reçu)` | appelé, puis l'écran reste jusqu'à `Terminé` | ecran-recu (touché) |
| Intention matériel, plan lié, fiche matériel créée | titre, ligne `equipment`, plateau | expenseSheet « matériel » |
| Retiré, avec raison | la phrase « Types d'achat et articles … rien n'entre en stock avant l'enregistrement » (aide au repos, interdite par le brief) → devient la bulle du plateau seulement si une ligne est ouverte ; « Sans assujettissement TVA, le montant TTC est la dépense » → retirée (supposition, critique n° 3) | — |

## 6. Fixture de développement (P14)

- `src/ui/depense/apercu/lecture-372765.json` : **copie** de `diagnostic/d1/lecture-simulee-372765.json` (pas d'import depuis `work/`), vérifiée par `grep` : ni nom ni adresse du brasseur
  (le fournisseur « Brau- und Rauchshop GmbH » est imprimé sur sa facture et déjà dans la maquette). Sabro : `unit:''` (simulé, marqué). Points : `apercuDev.ts` les fabrique avec les
  fonctions de `invoicePoints.ts` (`recomputeInvoicePoints`, `signerPoint`, `peserPoint`) et un point `tva-incoherente` écrit à la main (details N 11,20 / R 75,30 ; bases 26,20 + 84,20 ;
  2,80 ≠ 4,15) ; `review` = celui de `…reconciliee.json` (`disputed`, `readers` 3) ; `controls` calculés. Chaque champ simulé est commenté « SIMULÉ ».
- Stock simulé : Target α 11,8, Hallertauer Blanc DE (et ceux de la maquette) ; transaction 380001 (sonde d1) pour l'état 8. `ApercuDepense = { outcome, fichier, stocks, transactions, etat, drive, reseau, enregistrer }`.
- `ExpenseSheet` reçoit une prop facultative `apercu?: ApercuDepense`. Présente : `attach` n'est pas appelé, `applyOutcome(outcome)` (le bloc post-scan de `attach`, **extrait en
  fonction sans changer son texte**) pose le brouillon ; `stocks`/`transactions` viennent de la prop ; `enregistrer` (simulé, avec envoi temporisé et reçu fabriqué) remplace
  `savePurchaseWithProofReceipt`/`confirmPurchase` — **ces appels réels ne sont jamais faits** sous `apercu`. La prop n'est passée que par `QuickActionModal` :
  ```
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('depense')) import('../ui/depense/apercuDev').then(...)
  ```
  (même méthode que `fermentescibles/apercuDev.ts` : éliminé de `dist/`). Contrôle en G3 : après `npm run build`, `grep -r "apercuDev\|lecture-372765\|SIMULÉ" dist/` ne trouve rien ; le résultat le dit.
- Paramètres : `?dev-local&depense=<état>` où état ∈ `1,2,3,4,4b,5,6,7,7b,8,9` ; `QuickActionModal` ouvre `ExpenseSheet` à l'ouverture de la modale (déclencheur `initialScreen='quick-expense'` ou `?depense` seul) ; `document.body.dataset.apercu` dit l'état posé quand il est prêt.

## 7. Libellés des vues Finances (P15)

- `forecast.ts:125` : `Achats de ${category} non projetés (irréguliers).` → `Achats de ${libellé en minuscule} non projetés (irréguliers).` avec une table locale
  `{brassage:'brassage', materiel:'matériel', nettoyage:'nettoyage', chargesFixes:'charges fixes', renovation:'local et travaux', divers:'autres frais'}` (mêmes mots que
  `CATEGORY_LABELS` de `FinanceForms.tsx`, en minuscules ; le domaine n'importe pas l'UI). Inconnue : la clé telle quelle. **Le test hors Possède `ta6-tendance.test.ts:20` cherche
  `Achats de brassage non projetés` : la minuscule le garde vert** (c'est pourquoi la table est en minuscules). Test neuf : `tests/unit/depense/ecran/libelles.test.ts`.
- `FinanceForecastSummary.tsx:27` : la phrase « Les montants ci-dessous couvrent les données renseignées. » dit ce qui manque, bâtie des props : solde de départ absent
  (`!openingCashReady`) ; `ledger.unknownPaymentCount` paiements historiques à confirmer ; `warnings.length` limites. Ex. : « Il manque le solde de départ et 3 paiements à confirmer ; les
  montants couvrent le reste. » Aucune cause inventée : si `incomplete` sans l'une de ces trois causes, la phrase dit « Certaines données manquent (voir les limites). ». Le titre
  `Prévision incomplète` ne change pas (`financeWorkspace.test.tsx:49,91` le lisent).

## 8. Divergences voulues avec la maquette (la raison de chacune)

1. « tu peux fermer », « 0,4 / 0,7 Mo » : l'envoi ne rend aucune progression et la feuille ne se ferme pas pendant l'envoi → barre indéterminée + « 0,7 Mo » (taille connue).
2. « Target bis » / « Créer CH » : `savePurchase` nomme l'article neuf par `line.description.trim()` (`purchaseEntry.ts` ~l.401-405) et n'écrit aucun « bis » → le bouton affiche le nom réel.
3. « Betrag per E-Finance dankend erhalten » : cité seulement si le résultat le porte.
4. Une icône « Changer » de plus dans l'en-tête (le panneau caché ne serait pas atteignable par `getByRole`).
5. Hors ligne : pas de promesse « Enregistré dès le retour du réseau » (le justificatif exige Drive en ligne).

## 9. Tests

**Témoin avant (L13)** — `tests/unit/depense/ecran/` (jsdom, Gemini et Drive simulés, fixture 372765 copiée dans `…/ecran/fixtures/`), lancés **avant** le code ; chacun doit échouer sur HEAD :
- `bandeau-points.test.tsx` : après lecture de 372765 : chips « TVA », « Payé le », « mouture », « Sabro » visibles dans le DOM, numérotées 1 à n (échoue : aucune chip aujourd'hui).
- `statut-recalcul.test.tsx` : corriger une quantité qui rompt `qté × prix` fait apparaître une chip « Ligne n » et passe le statut à « Lecture à confirmer » ; la remettre le lève (échoue : statut figé à `review.status`).
- `mouture.test.tsx` : aucune ligne `surchargeOf` à l'ouverture ; « Rattacher les 5 » → 5 `surchargeOf` ; détacher une ; `draft` envoyé à `savePurchaseWithProofReceipt` le porte.
- `s8.test.tsx` : transaction 380001 même commande/total → panneau S8 affiché, Confirmer reste actif et enregistre (échoue : aucun appel à `purchaseSimilarOrders`).
- `date-base.test.tsx` : « Payé le 27.04.2026 » + « supposée » ; « C'est la date » → base `typed`, chip barrée ; un second scan ne l'écrase pas.
- `recu-reste.test.tsx` : après succès, `onSaved(reçu)` appelé, `onClose` **pas** appelé, reçu affiché, `Terminé` ferme (échoue : la feuille se ferme).
- `pastille-stock.test.tsx` : pastilles « +6 kg », « nouveau », « unité à préciser » ; aucune pastille sur la mouture.
- `interrupteur.test.tsx` : l'interrupteur écrit `none`/`existing`, jamais `new` ; l'état se lit (`aria-checked`).
- `tva-sans-supposition.test.tsx` : aucune occurrence de « assujetti » dans l'écran ; la TVA lue est « 2,80 · 4,15 ».
- `apercu-absent.test.ts` : `ExpenseSheet` sans prop `apercu` appelle les vrais services (mocks) ; avec la prop, aucun appel.
- `libelles.test.ts` : « Achats de brassage non projetés », « de charges fixes », « de local et travaux » (jamais `chargesFixes`) ; phrase de la prévision pour les trois causes et pour aucune.
- `etat.test.ts` : fonctions pures (`prixAvecMouture` en centimes, `compteLiens` = 13 reliés · 2 nouveaux · 2 voisins · 1 unité ? · 5 moutures = 23, ni plus ni moins que les lignes).

**Tests existants.**
- *Hors Possède, doivent rester verts sans modification* (G5 les rejoue) : `tests/unit/depense/raccord/*` (4 fichiers), `stock/ecran`, `stock/unites`, `enregistrement/*`, `lecture/*`, `onglets/*`, `jus0Journey`, `driveFileStore`, `financeDocumentPersistence`, `equipmentProjects`, `purchase*`, `stockLineMatching`, `geminiScanner`, `financeWorkspace`, `financeForecast`, `ta6`. La structure (§ 0.2, § 4 P2) est faite pour cela. **Un seul que je sais casser** : `ecran-recu.test.tsx:72` (`onClose` appelé tout de suite). Les autres sont prouvés en les rejouant avant et après.
- *Dans mon Possède, texte qui change* (`expenseSheet.test.tsx`) : « présente honnêtement le statut… » (titres lus dans la preuve, pas dans une région repliée) ; « conserve les divergences… » (le clic sur `Détails de la lecture` ouvre la preuve, les phrases y sont) ; « ouvre uniquement la TVA fautive… » (la TVA fautive est dans la rubrique `Référence et TVA` : `closest('details')` ouvert ; le panneau TVA n'est pas un `details`) ; « 0 `details[data-purchase-options][open]` » (inchangé : panneaux ≠ details). Chacun garde son comportement ; seul un sélecteur peut changer et je le dis dans RESULTAT.md.
- Hors Possède, **lus mais non rendus par ExpenseSheet** : `scripts/check-invoice-journey-emulator.mjs` et `check-fix114-ui.mjs` (sélecteurs `[data-purchase-date] summary`, `[data-purchase-payment] summary`, `details[data-purchase-lines] > summary`, `article[data-purchase-line]`) : le parcours émulateur est un script manuel, hors G5. Ma structure garde `details[data-purchase-lines] > summary` et `article[data-purchase-line]` ; `[data-purchase-date] summary` aussi ; **`[data-purchase-payment] summary` disparaît** (le panneau Payé n'est plus un `details`). À signaler au pilote ; non rejoué (émulateur Firebase, hors périmètre).
- Rejeu **sur HEAD avant le code** de tous les tests de G5 (+ `financeWorkspace`, `financeForecast`, `ta6`) : sortie dans RESULTAT.md.

## 10. Décisions du pilote (revue triée, 01.11) — elles prévalent sur tout le plan

**T1 statut** : `recalcul` n'est passé à `statutDeLecture` que si la lecture porte des `points` ; sans `points` (ancien format) : plancher `disputed`, « Lecture à confirmer », jamais « vérifié ».
`expenseSheet.test.tsx:86-90` : checked/corrected/disputed anciens attendent « Lecture à confirmer », unavailable/undefined « Vérification incomplète » (raison écrite dans le test) ; ajouts : nouveau
format sans point qui pèse = « Lecture vérifiée », avec un point qui pèse = « à confirmer ». Un geste du brasseur ne change jamais le statut (seul le recalcul le fait) ; la chip « tout réglé » dit « points revus ».
**T2 largeur** : `src/ui/ModalShell.tsx` au Possède pour une prop facultative `size?: 'lg'|'xl'` (défaut `lg` inchangé). **T3 chips** : table complète `code → chip` sur `PESE_PAR_CODE` (TVA par son code, code
inconnu qui pèse = chip générique) ; fixture = sortie du vrai rapprochement du serveur (`functions/src` importé) sur les deux lectures simulées de d1, écrite une fois par un script de la voie ; unité de Sabro
simulée et dite ; aucune règle d'appariement ajoutée (voisin = `matchStockLine`/`ingredientIdentity`) ; une chip de r2b sans source est absente et l'écart est dit. **T4** : le pied reste cliquable ; si
`validatePurchase` refuse, rien n'est écrit, `focusIssue` va à la ligne, le pied dit « 1 unité à préciser » ; G7 joue ce geste. **T5** : feuille ouverte seulement s'il y a un reçu Drive ; sinon fermée comme
aujourd'hui ; `ecran-recu.test.tsx` au Possède pour ce seul changement (`onClose` à « Terminé »). **T6** : article neuf = vrai nom ; D215/D216 relèvent de S6 ; « Créer » refusé si le nom normalisé est celui d'un
article du stock (c'est « Relier »). **T7** : 100 mots = repli (b) puis textes courts ; repli (a) non fait ; G7 imprime la mesure. **T8** : sélecteurs d'émulateur acceptés, listés dans RESULTAT. **T9** : ordre
1 état/statut/témoins → 2 ExpenseSheet, bandeau, ticket, pied → 3 panneaux Payé/TVA/preuve, mouture, S8 → 4 G7 ; coupe dans l'ordre : bande collante, « Voir 380001 », deux libellés Finances, grille 1280 ; tests en 5-6
fichiers. **G5** + `financeQuickActions`, `fix114` (rejoués sur HEAD d'abord).

Corrections (une ligne chacune) — Conception : 1 table code→chip + fixture issue du serveur (T3) · 2 pied cliquable, refus motivé (T4) · 3 reçu seulement avec reçu Drive (T5) · 4 statut figé par geste, « points
revus » (T1) · 5 « À revoir » = chips ouvertes à l'enregistrement avec la valeur gardée · 6 `financeQuickActions` et `fix114` rejoués et nommés · 7 lien de mouture dérivé de `millingParentIndex` ET `surchargeOf===parent.id`,
rien si malt non relié · 8 plateau lit `lineMathCheck`, `toCents` · 9 une ligne par indice `ScanHint` (« calculé » sur total déduit, date absente visible) · 10 repli (b) puis textes · 11 S8 : état `similarChoice` séparé, jamais
`duplicateConfirmed`, ne bloque jamais, visible même avec doublon exact · 12 `const apercu = import.meta.env.DEV ? props.apercu : undefined`, `import type` seul, `grep dist/` · 13 `stockRef` posé au retour « oui » · 14 « Envoi au Drive »
seulement si fichier sans reçu · 15 « Fichier prêt » au lieu de « Envoi ✓ » · 16 second bouton « Remplacer le fichier » · 17 `IntersectionObserver` gardé (racine = conteneur défilant, absent en jsdom) · 18 « Achats divers non projetés » ·
19 `details[data-purchase-lines] open` enveloppe le ticket. Prêt : 1 T1 · 2 T2 · 3 panneaux toujours montés, cachés par classe CSS (ni `hidden` ni style en ligne) · 4 remarques dépliées à l'ouverture de la preuve, chip
`aria-label="Détails de la lecture"` · 5 `details[data-purchase-lines] open` sans `data-purchase-options`, son `summary` porte « n proposée(s) par la lecture, à vérifier » · 6 chaque ligne du brouillon (mouture comprise) =
`article[data-purchase-line]` à un seul `summary` direct · 7 G7 clique l'action rapide puis « Facture » et attend `body.dataset.apercu`, crochet avant `if(!isOpen)` · 8 chips de la fixture listées avec leur source · 9 T9 ·
10 aucun doublon d'id/libellé/rôle · 11 `ScanHint` du total vit dans le bandeau (sr-only + « calculé »), `form` englobe le corps · 12 témoins rouges pour la bonne raison · 13 crochets `data-dp-*` ↔ maquette.

*(Ancien § 10, supplanté par ce qui précède — conservé pour mémoire.)*

1. **Reçu qui reste** : changer `ecran-recu.test.tsx:72` (hors Possède) pour attendre `onClose` à `Terminé`, et ne plus fermer à l'enregistrement ? *Recommandation : oui* (c'est la consigne « le reçu reste affiché jusqu'à la fermeture ») ; sinon le reçu n'est jamais visible. Les trois parents (`QuickActionModal`, `StocksTab`, `UpgradeWorkspace`) ne dépendent pas du moment de `onClose`.
2. **Nom de l'article neuf (« bis », « CH »)** : l'écran affiche le nom réel. Pour écrire « Target bis » / « Cascade CH » il faut changer `purchaseEntry.ts` (interdit ici) : une voie de service à part. *Recommandation : relais vers une voie suivante ; port avec le vrai nom d'ici là.*
3. **100 mots** : la maquette est à 98 ; mes ajouts visibles au repos (pastilles-mots, « n proposées par la lecture, à vérifier » exigé par `jus0Journey.test.tsx:208`, icône Changer) les dépassent peut-être. Le script G7 compte les mots du premier écran (390 × 844, état 3, annexe exclue) et les imprime. *Si > 100, ordre de repli décidé ici : (a) la pastille des lignes « relié » passe au plateau (elle reste sur nouveau / voisin / unité ?), (b) le décompte des propositions se met en `sr-only` dans le `summary` (le texte reste pour le test, l'info visible reste la chip). Recommandation : accepter ce repli sans attendre.*
4. **`[data-purchase-payment] summary`** du script émulateur disparaît (§ 9). *Recommandation : accepter ; le script est manuel et le pilote le met à jour.*
5. **G1** : `comprendre` ne lit que le premier chemin de chaque puce de « Possède » (`InvoiceScanReview`, `FinanceForecastSummary`, `tests/unit/depense/ecran/` sont en second) ; je les ai donc laissés hors de « Écrit dans » de COMPRIS.md. Ils sont bien dans mon Possède.

## 11. Risques

- **Argent / double écriture** : `saveLocked`, `pendingId`, `proofSent` intacts ; l'état `done` bloque un second enregistrement ; l'interrupteur de stock ne pose jamais `new`.
- **Données existantes** : aucun champ de document Firestore ajouté ni retiré ; `PurchaseDraft` n'a pas de nouveau champ (les états d'écran — chips réglées, moutures « en service », voisins — vivent dans le composant). Une dépense enregistrée avant reste lisible (l'écran n'écrit que par `savePurchaseWithProofReceipt`/`confirmPurchase`).
- **Hors ligne** : le clic reste actif ; l'erreur du service est inchangée ; le brouillon est gardé.
- **Arrondis** : tout calcul de prix/écart en centimes entiers (`Math.round(x*100)`), jamais sur des flottants affichés ; comparaison avec `lineMathCheck`/`sumCheck` (une seule source).
- **Unités** : l'unité imprimée n'est jamais réécrite (`formatUnitLink` affiché, `unit` de la ligne intact) ; unité vide = « unité à préciser », rien en stock.
- **Fixture en production** : la prop `apercu` ne peut venir que d'un import dynamique sous `import.meta.env.DEV` ; test + `grep dist/`.
- **Cibles et clavier** : 28 px minimum sur les chips et l'interrupteur (DESIGN.md), `Input` protégé partout (`audit_inputs.mjs`), jamais `type="number"`, focus visible, `aria-expanded` sur les tuiles.
- **Taille de `ExpenseSheet`** : après extraction, le fichier doit tomber nettement sous 320 lignes de JSX.

## 12. G7 — le script (`voies/e-port/capturer-depense.mjs`)

Modèle : `p8-port/capturer-malts.mjs` (puppeteer-core, `with_server.mjs`, trois modes `souris390`, `tactile390` (échelle 2), `pc1280`). Pour chaque état 1 à 9 (+4b, 7b) :
ouvre `http://localhost:<port>/?dev-local&depense=<état>` et `v1/r2b/etat.html?etat=<état>` ; joue les gestes de la maquette (les 6 retouches de `verifier-retouches.mjs`
traduites en sélecteurs de l'app : R1 six points visibles au-dessus du pied ; chip → ligne, barrée une fois réglée ; R2 six points réglés sans plateau, total 86,50 ; R3 preuve à un
toucher, colonne gauche pleine à 1280 ; pied actif avec points ouverts et reçu) ; écrit la scène côte à côte (app à gauche, maquette à droite) dans `captures/` ; vérifie : chaque geste a
l'effet de la maquette, **aucune erreur de console**, **aucun débordement horizontal** (`scrollWidth ≤ clientWidth` à 390), pied visible au repos, **aucune requête hors localhost**
(les polices Google de la maquette sont les seules tolérées côté maquette, jamais côté app), nombre de mots du premier écran imprimé. Sortie `DEPENSE OK` (code 0) ou
`DEPENSE ECHEC n` + liste. Mécanique : si la série dépasse trois captures à refaire, je rédige `DEMANDE EXECUTANT` pour Haiku ; j'ouvre moi-même en image repos, point réglé, preuve, TVA, enregistré,
erreur, aux trois modes.

## 13. Hors périmètre

`src/services/*` (nom « bis », progression d'envoi, fermeture pendant l'envoi), `invoicePoints.ts`, `functions/`, rive stock de u4b à 1280, fiche matériel dessinée (la facture n'a aucune ligne matériel), le panneau de matériel
neuf, `BrewWizard`, `fermentescibles/`, `identite/`, tests hors Possède (aucun modifié), émulateur Firebase, déploiement, commit.
