# PLAN uv — port de v3a (la caisse : vente et facture)

Étape 1 (plan seul, aucun code, aucun commit). Lu au 09.11 dans le worktree, sur HEAD 317dd446 (f1, d1, d3 y sont). Aucun IBAN recopié, aucune donnée réelle.
`dom/` = `src/domain/finance/`. Lu en entier : `p2/v3a/etat.html` (183 lignes, un seul état dessiné), `NOTE.md`, `v3a-page.png` (390) et `v3a-1280.png`, ouvertes en image.
Registre : `work/refonte-frontend/v4/choix/ecrans-app.json:98-105` (facture-vente, v3a, choisi, « La caisse complète / Choix définitif »).
Consigne du brasseur (09.11) : **remplacer, jamais fusionner** : v3a remplace entièrement l'écran actuel, Facturer et Encaisser une vente ; aucun bloc de l'ancien ne reste
à côté (§ 0 et § 3 : inventaire de ce qui part). Domaine déjà prêt (f1) : `preparerQrFacture`, `QrFactureInvalide`, `problemesAdresse`, `adresseDepuisTexte`, `libelleFacture`,
`invoiceTotals` (centimes), `SwissQrBillService.generateInvoicePdf` (option `qr`, `creancier`, `debiteur`), `prochainNumeroFacture`, `doublonsNumeroFacture`, `echeanceFacture`.
Domaine d1 : `FormatVente`, `litresNets` (`dom/chaineLitre.ts:14-58`).

## 0. Constats qui orientent le plan

1. **Deux écrans, deux chemins de code aujourd'hui.** `QuickActionModal.tsx` : écran `quick-sale` (`:1220-1253`), état `sale*` (`:162-170`), `handleSaveSale` (`:543-568`), `handleDownloadSaleReceipt` (`:570-585`), entrée de menu « Encaisser une vente » (`:709-711`), titre (`:666`) ;
   `ClientsTab.tsx` : `InvoiceSheet` chargé en lazy (`:37`, `:373`), bouton Facturer (`:281`), `handleGenerateInvoicePdf` (`:187`). Le plan les remplace **par une seule `Caisse`** ; ils ne gardent aucun champ.
2. **Le menu « + » n'est pas dans le Possède.** Le libellé « Encaisser une vente » du « + » vient de `src/ui/FloatingActions.tsx:181` (`onSale` branché `App.tsx:1069` vers `quick-sale`). VOIE.md dit « + › Vendre ». Sans toucher `FloatingActions.tsx`, l'entrée du menu resterait « Encaisser une vente » : un reste de l'ancien. Voir DÉCISION D1.
3. **Aucune vente ne porte de brassin ni de format.** Le grand livre n'a ni `batchId` par ligne ni `formatId` (`FinanceLine`, `dom/types.ts:5-20`, hors Possède). `TransactionFinance.batchId` existe mais pour une seule écriture. `FinanceLine.sourceReference` est libre et n'est lu par aucune règle de finance (`grep` : seules les projections de nuances l'emploient). La ligne de vente s'y encode : `vente:<batchId>:<formatId>` (fonction pure testée, § 2.3) ; `quantity`, `unit: 'pièce'`, `unitPriceCents` portent le reste. Pas de schéma neuf.
4. **Les tarifs n'ont ni format ni volume** (`PricingItem`, `types/index.ts:756-765` : `product`, `priceHT`…). Les tuiles 33 cl / 75 cl / fût 20 L et leurs prix (5,00 / 10,00 / 160,00 de la maquette) sont un exemple commun de la maquette (NOTE.md), pas une donnée. Voir DÉCISION D3.
5. **« Settings » n'a aujourd'hui aucun champ d'identité de la brasserie** : seulement l'IBAN (`SettingsModal.tsx:233-262`, `ibanErreur` `:69`, `handleSave` `:76-81`). `config.company.address` (« Rue de l'Exemple 1 ») et `npa` (« 1000 Ville ») viennent du gabarit `seedData.ts:33-43` (hors Possède) ; `problemesAdresse` les refuse (P7, testé en f1). Il faut donc **créer** le bloc d'identité, pas le déplacer.
6. **`Client.address` est une chaîne** (`types/index.ts:728`) ; `EditClientModal.tsx` n'a pas de champ adresse (relu en entier, 120 lignes). Les clients existants gardent leur chaîne ; `adresseDepuisTexte` la découpe sans inventer, sinon « adresse ? ».
7. **`ReceiptService.createSaleTransactionWithReceipt` génère encore une quittance A5** (`receiptService.ts:180-212`), hors Possède, fixe `id`, `proofUrl`, `description: Vente … — client`. Réemployé tel quel pour « Payé ici » (la quittance est un service, pas un écran) ; le seul écran qui la déclenchait (l'ancien quick-sale) disparaît.
8. **Numéro** : `InvoiceSheet.tsx:20` fabrique encore `FAC-<année>-<8 hex>` ; remplacé par `prochainNumeroFacture(getTransactions(), annéeÉmission)` au moment d'enregistrer, conservé identique au retry (`pending.current`, comme aujourd'hui). `doublonsNumeroFacture` n'a aucun appelant (RESULTAT f1 : R4, D4) : branché ici (§ 2.5).
9. **v3a n'a qu'un état dessiné** (panier, Facture QR, annexe imprimée, bande « adresse ? »). « Payé ici », « Comptoir », vide, brasserie incomplète, hors ligne, erreur d'enregistrement sont des cas qui se rangent **dans** cet état, sans composant neuf (L03) : § 2.2.

## 1. Défauts visés (INVENTAIRE-CODE, `NOTE.md` de v3a, PLAN-METIER § 3.3)

| Id | Défaut | Corrigé par |
|---|---|---|
| 20 | deux entrées pour vendre (« Encaisser une vente », Clients › Facturer), deux écrans, deux logiques | une `Caisse` ; « + › Vendre » et Clients › fiche › Facturer l'ouvrent ; `InvoiceSheet` et l'écran `quick-sale` actuel retirés du chemin |
| 9 | « No QR », pas de vraie QR-facture | `preparerQrFacture` (f1) appelé à Facturer en mode « Facture QR » ; annexe = la facture telle qu'imprimée ; aucune facture QR sans QR |
| 10 | destinataire sans adresse ; n° `FAC-<8 hex>` | adresse structurée du client (EditClientModal) ; n° continu `FAC-2026-0001` |
| 11 | adresse structurée de la brasserie introuvable | nouveau bloc « Identité et adresse de la brasserie » (Réglages), le même formulaire s'ouvre depuis la bande « adresse ? » de la caisse (§ 2.6) |
| 21 | échéance libre à saisir ; journal avec le premier article seulement | puces à réception · 10 j · 30 j (30 par défaut, `echeanceFacture`) ; libellé `libelleFacture` (tous les articles) |
| 13 (assiette impôt) | les litres sortis d'un brassin ne sont pas connus | une ligne de vente porte `batchId` + format : `litresVendus(brassin)` alimente la jauge « 12,4/27 L nets » et, plus tard, l'assiette réelle (`beerTaxForVolume({ litresSortis })`, hors périmètre ici) |
| v3a-NOTE | « sans nom ? » illisible ; deux bières impossibles ; désignation libre perdue ; prix par client | Comptoir, pastille bière + « + bière », tuile Autre, pastilles Pro/Privé (prix par client : rien d'inventé) |
| TE-6, TE-7, AM-67, MV-38, TE-55 | prix inconnu pris pour 0, prix négatif, date hors bornes, vente à 999 999 CHF, « conservé dans Drive » sans preuve | **gardés** : règles rejouées dans la caisse (§ 2.4, § 4) ; seule la date libre disparaît (D4) |

## 2. Changements, fichier par fichier

### 2.1 Données (types, config) : `src/types/index.ts`, `src/domain/companyDefaults.ts`, `src/services/storage.ts`
- `types/index.ts` : `AdresseSaisie { rue: string; numero: string; npa: string; localite: string; pays: string }` (le nom `AdresseStructuree` de `swissQrBill.ts:9` y ajoute `nom` ; `AdresseSaisie` est son équivalent stocké, sans `nom`). `Client.adresse?: AdresseSaisie` (la chaîne `address?` reste, pour les lecteurs actuels et les anciennes fiches) ; `AppConfig.company.adresse?: AdresseSaisie` (optionnel : une config stockée sans le champ reste valide). Aucun champ obligatoire neuf (les données existantes ne cassent pas).
- `companyDefaults.ts` : `adresseBrasserie(company, env): AdresseStructuree | null` : `company.adresse` + `company.name` ; sinon `adresseDepuisTexte(company.address, company.npa)` ; sinon repli `.env` (`VITE_COMPANY_*`) découpé de même ; `null` si rien de lisible. **Pas de valeur inventée** : le gabarit « Ville » est refusé en aval par `problemesAdresse`. `ibanOrNotice` inchangé.
- `storage.ts` : aucun changement prévu (`getConfig` étale déjà `company`, `:1258`) ; un test prouve qu'une `adresse` stockée survit à `saveConfig` puis `getConfig`. Si le test échoue, correction minimale dans `getConfig`.
- Anciennes données : un client à `address` seule s'affiche avec son adresse découpée si possible, sinon « adresse ? » (jamais une adresse devinée). Une fiche n'est réécrite qu'au geste d'enregistrer du brasseur.

### 2.2 `src/ui/vente/Caisse.tsx` (neuf), `src/ui/vente/caisse.css` (neuf, classes `cs-…`, L26)
`export function Caisse({ open, onClose, clientIdInitial, onSaved }: …)`. Hébergée par `Sheet` (`src/ui/Sheet.tsx`, large : `max-width` 1100 px à ≥ 900 px, deux colonnes comme v3a ; 760 px de contenu en dessous). L'en-tête de la figure (logo, thème, recherche, ×) est le cadre de l'app : seul le « × Fermer la vente » devient la fermeture de la feuille ; la barre du bas et le FAB ne sont pas portés (dit dans RESULTAT).
Chaque élément de v3a, à reprendre tel quel (mesures de `etat.html`, jetons de l'app pour les couleurs : aucun hex de la maquette copié, la teinte est jugée par `controle-teinte.mjs`) :

| Élément de v3a | Port |
|---|---|
| **À qui** : avatars 46 px (initiales), pastille Pro (bleu) / Privé (blanc bordé), sélection noire + anneau bleu, « Comptoir » (picto échoppe), « + client » (cercle pointillé) | clients de `StorageService.getClients()` (favoris d'abord, défilement horizontal, `min-width: 70px`) ; Comptoir = pas de client ; « + client » ouvre `EditClientModal` vide, puis sélectionne le client créé |
| **Bière** : pastille ambre (verre, nom, mois, jauge 96 px, « 12,4/27 L nets ») et « + bière » | brassins vendables : statut `conditionne`/`termine` avec bouteilles ou fûts (`BatchPackaging`) ; jauge = `litresVendus` ÷ `litresNets({conditionneL: volumePackagedL, …})`. Source des litres dite (conditionnés / enregistrés / à noter, comme up) ; inconnu → jauge hachurée « litres à noter », jamais 0 ; « + bière » ajoute une 2e pastille, le panier garde les lignes des deux |
| **4 tuiles** 92 px : 33 cl, 75 cl, fût 20 L, Autre ; compteur noir 34 px, « − » rond 30 px ; tuile active en ambre | un tap ajoute 1, « − » retire 1 ; appui long = quantité au pavé (`ChampNombre`, max 10 000, jamais `type="number"`) ; prix de la tuile = tarif lié (D3), inconnu → « prix ? » (pas 0) |
| **Autre** (pointillé, « consigne, verres… ») | ouvre une ligne libre dans la langue de la tuile : désignation, quantité, prix (`ChampNombre`, plafonds de l'ancienne feuille 10 000 / 10 000, prix vide = inconnu, négatif et « abc » refusés avec les messages de TE-6/TE-7) |
| **Ticket** gris : lignes « 24 × 33 cl … 120,00 », pastille « prix exemple » (ocre), « sans TVA », total mono 30 px | « prix exemple » seulement sur la fixture `?finance-demo` ; en vrai, la pastille n'existe pas (le prix vient d'un tarif, cité). « sans TVA » quand `!isTvaRegistered` ; assujetti : lignes HT, TVA, TTC (taux `tvaNormalRate` par ligne, `invoiceTotals`) |
| **Segment** « ✓ Payé ici » / « Facture QR » (noir sur l'actif) | deux boutons `aria-pressed` ; « Facture QR » par défaut (comme la maquette) |
| **Puces** « à réception · 10 j · 30 j » → « 9 déc. » | `echeanceFacture(émission, 30)` par défaut ; visibles seulement en « Facture QR » |
| **Facturer 180,00 CHF** (noir, 48 px) | une primaire. En « Payé ici » le libellé devient « Encaisser 180,00 CHF » (même place, même style) |
| **Bande hachurée** « adresse ? + adresse » | la bande unique des manques (liste ci-dessous) ; chaque manque a son bouton « + … » |
| **Annexe** : la facture imprimée (n°, date, L'Affinée + localité, destinataire, lignes, total, ✂, QR + Compte masqué + Montant, « QR exemple ») | vraie facture : n° réel mono (`prochainNumeroFacture`, au lieu de « 2026-suivant »), date = aujourd'hui, brasserie et localité de la config, lignes = panier ; QR réel (`SwissQRCode` de `swissqrbill/svg`, `import()` à l'ouverture) quand l'adresse et l'IBAN sont valides ; Compte masqué « CH·· ···· (Réglages) », jamais l'IBAN ; « QR exemple » sur le QR de remplissage quand la brasserie est incomplète |
| **Modifier / Envoyer le PDF** | « Modifier » replie l'annexe sur le panier ; « Envoyer le PDF » = enregistrer puis partager/télécharger le PDF (Web Share si disponible, sinon téléchargement, comme `doc.save` actuel) |

États rangés dans l'état unique de v3a (aucun composant neuf) :
- **Vide** : tuiles à 0, ticket « rien dans le panier », bouton Facturer éteint (jamais « 0,00 CHF » facturable).
- **Comptoir** : pas de client ; « Facture QR » reste permis (QR sans débiteur, norme) ; « Payé ici » est le cas courant.
- **Payé ici** : puces d'échéance masquées ; sous le segment, **deux puces TWINT · Espèces** (D2) ; l'annexe devient « la quittance imprimée » (même cadre, sans zone QR, « payé le … · TWINT ») ; bouton « Encaisser ».
- **Bande des manques** (une seule, ocre hachurée, un bouton par ligne) : « adresse du client ? + adresse » (ouvre `EditClientModal` sur le champ adresse ; facture QR permise sans, l'annexe dit « adresse à compléter ») ; « adresse de la brasserie ? + adresse » et « IBAN ? » (ouvrent `IdentiteBrasserie`, § 2.6 ; **bloquent Facture QR**, pas « Payé ici ») ; « hors ligne : QR indisponible » (message de `preparerQrFacture`, **bloque Facture QR**) ; « numéro en double FAC-2026-0003 » (D4 de f1).
- **Erreur d'enregistrement** : message `role="alert"` dans la bande ; bouton « Reprendre la confirmation » ; le brouillon (PDF + numéro + écriture) est conservé à l'identique (`pending` comme `InvoiceSheet.tsx:27` et `QuickActionModal.tsx:170`) ; tout est désactivé pendant ce temps (`fieldset disabled`).
- **Après succès** : message de succès `onSaved` (texte TE-55 conservé : « Quittance/Facture … conservée dans Drive » seulement sur preuve, sinon « gardée sur cet appareil, pas dans Drive »).

### 2.3 Logique pure : `src/ui/vente/` (testée seule, sans React)
- `panier.ts` : `Panier = { lignes: { batchId?: string; formatId: string; designation: string; quantite: number; prixHT: number | null }[] }` ; `totaux(panier, assujetti)` via `invoiceTotals` (centimes, `prixHT: null` → `null`, jamais 0) ; `messageBornes(totalCents)` via `messageMontantChfHorsBornes(total, 'income')` (50 000 CHF, ancienne règle MV-38).
- `formatsVente.ts` : `FORMATS_VENTE: FormatVente[]` (33 cl 0,33 L ; 75 cl 0,75 L ; fût 20 L, `chaineLitre.ts:58`) ; `formatDepuisTarif(product)` : 33 cl / 75 cl / « fût 20 L » reconnus dans le nom du tarif (insensible à la casse et aux espaces), sinon `null` ; `tarifDuFormat(tarifs, formatId, nomBiere)`.
- `ligneVente.ts` : `encoderLigneVente(batchId, formatId)` → `vente:<batchId>:<formatId>` ; `decoderLigneVente(texte)` → `{ batchId, formatId } | null`.
- `brassinsVendables.ts` : `litresVendus(transactions, batchId)` = Σ quantité × volume du format sur les recettes non annulées (`finance.voidedAt` absent) ; `jaugeBrassin(batch, litresVendus, litresNetsSaisis)`.
- `enregistrerVente.ts` : deux fonctions asynchrones `preparerFacture(entrée): Promise<IncomeEntry>` et `preparerEncaissement(entrée): IncomeEntry`, qui ne font aucune écriture ; l'écriture est `saveIncomeEntry` (inchangé, hors Possède), appelée par la caisse. Facture : `prochainNumeroFacture`, `preparerQrFacture`, `SwissQrBillService.generateInvoicePdf(client, items, config, numéro, { date, dueDate, qr, creancier, debiteur, download: false })`, `prepareFinanceDocument`, écriture `paymentStatus: 'unpaid'`, `dueDate`, `invoiceNumber`, lignes une par article, libellé `libelleFacture`. Encaissement : `ReceiptService.createSaleTransactionWithReceipt` (inchangé) puis `FinancialPayment` direction `in`, méthode `twint` ou `cash`, comme `QuickActionModal.tsx:557`.

### 2.4 Règles métier reprises, une par une
- Aucun article sans prix (« Article N : indique son prix »), aucun prix négatif ni illisible, un article à 0 CHF ne se facture pas (`InvoiceSheet.tsx:41-43`) ; total ≤ 0 refusé.
- Total > 50 000 CHF : message de la borne, bouton éteint, rien enregistré (`venteComptoirBornes.test.tsx:28-36`).
- Assujetti sans UID : `generateInvoicePdf` lève déjà (AM-66) ; message dans la bande.
- Double clic : `useRef` `busy`, comme `saving.current` (`InvoiceSheet.tsx:26`) et `saleBusy` (`QuickActionModal.tsx:170`).

### 2.5 `QuickActionModal.tsx` : retirer, pas ajouter
- Supprimés : état `sale*` (`:162-170`), `saleAmountMessage` (`:262`), la remise à zéro `:277`, `handleSaveSale`, `handleDownloadSaleReceipt`, tout le contenu du bloc `quick-sale` (`:1220-1253`), les imports devenus inutiles (`MoneyField` si plus utilisé ailleurs, `ReceiptService`, `saveIncomeEntry`, `purchaseIsoDate`, `montantChf`…, vérifiés par `tsc` et `grep`).
- Le bloc devient `{screen === 'quick-sale' && ( <Caisse open onClose={resetAndClose} onSaved={onSuccessMessage} /> )}` : **la ligne d'ancre `{screen === 'quick-sale' && (` reste** (la zone de `scripts/agents/inventaire-ecrans.mjs:226` s'y accroche). La `Caisse` apporte son propre `Sheet` : l'enveloppe `ModalShell` + l'en-tête « Enregistrer une vente » ne s'affichent plus pour cet écran (`initialScreen === 'quick-sale'` : la caisse est montée seule, sans la modale vide derrière).
- Entrée du menu de la modale (`:709-711`) : « Encaisser une vente » → **« Vendre »**, même icône.
- Ancien titre `Enregistrer une vente` (`:666`) supprimé (il n'y a plus de modale d'enregistrement).

### 2.6 Adresses : `IdentiteBrasserie` (neuf), `SettingsModal.tsx`, `EditClientModal.tsx`
- `src/ui/vente/AdresseChamps.tsx` (neuf) : rue, n°, NPA, localité, pays (`CH` par défaut, 2 lettres), `inputMode`, `autoComplete` désactivé (comme l'IBAN), erreurs en français tirées de `problemesAdresse` (rôle `brasserie` ou `client`). Réemployé par les deux écrans suivants : un seul formulaire.
- `src/ui/vente/IdentiteBrasserie.tsx` (neuf) : nom, UID, `AdresseChamps`, IBAN (le champ de Réglages **déplacé** dans ce composant, une seule copie). `SettingsModal.tsx` l'affiche à l'onglet où se trouve l'IBAN aujourd'hui (`:233-262`, le bloc « IBAN Brasserie » est remplacé, pas doublé) ; la caisse l'ouvre en `Sheet` depuis la bande « adresse ? ». Les deux écrivent `StorageService.saveConfig` ; `ibanErreur` et sa règle « seul un IBAN tapé faux bloque » (`SettingsModal.tsx:69-78`, `settingsIban.test.tsx`) sont conservés tels quels.
- `EditClientModal.tsx` : **le champ adresse** (sous Email, `AdresseChamps` visible, comme le reste de la fiche ; pas replié avec les notes) ; l'enregistrement écrit `adresse` et, par compatibilité des lecteurs, `address` = « rue n°, NPA localité ». La validation : NPA à 4 chiffres pour CH, jamais bloquante (un client sans adresse est permis).

### 2.7 `ClientsTab.tsx` (Facturer seulement)
- Le bouton « Facturer » (`:281`) reste au même endroit et même libellé (tests `compactClients`, `mobileDailyViews` le cherchent) ; il ouvre `Caisse` avec `clientIdInitial={client.id}`. `handleGenerateInvoicePdf` (`:187`) et l'état `invoiceClient` (`:79`) sont remplacés par un état `caisseClient`.
- L'import `React.lazy` de `InvoiceSheet` (`:37`) devient celui de `Caisse` (même chunk que `QuickActionModal`, donc `swissqrbill` ne charge qu'à l'ouverture, mesuré au build : f1 avait promis la mesure).
- **Rien d'autre dans ClientsTab n'est touché** (impôt, tarifs : voies up et ailleurs).

### 2.8 `src/ui/finance/InvoiceSheet.tsx`
Retiré du chemin : plus aucun import dans `src/`. Le fichier n'est pas supprimé (accord requis) ; `tests/integration/factureClientSaisie.test.tsx` n'importe plus que la `Caisse`. Listé dans RESULTAT comme « orphelin, à supprimer sur accord ».

## 3. Remplacer, jamais fusionner : ce qui part, ce qui devient quoi

| Bloc de l'ancien | Sort |
|---|---|
| Montant TTC (`MoneyField`) | remplacé par le total du ticket (calculé des lignes) |
| Client facultatif (texte libre) | remplacé par les avatars (clients réels, Comptoir) : plus de nom tapé à la main |
| « Bière / conditionnement » (texte libre) | remplacé par pastille bière + tuiles |
| Règlement TWINT / Espèces / Virement / Facture | « Payé ici » (+ puces TWINT · Espèces au second plan) et « Facture QR » ; **Virement = Facture QR** (la facture est payée par virement) : dit dans RESULTAT |
| Justificatif de paiement joint (facultatif) | **absent de v3a** : non porté, **listé pour le pilote** (§ 6, D5). Recommandation : un justificatif se joint depuis le détail de l'écriture au journal |
| Bouton « Quittance PDF » (aperçu avant enregistrement) | remplacé par l'annexe (aperçu permanent) et « Envoyer le PDF » |
| `DriveConnection` et « Une quittance sera conservée dans ton Drive privé » | non portés (absents de v3a) ; le résultat est dit au succès (TE-55) ; une erreur Drive s'affiche dans la bande avec « Reprendre la confirmation » |
| `InvoiceSheet` : date d'émission, échéance libres, article (produit, désignation, quantité, prix), « Ajouter un article », « Retirer cet article » | date = aujourd'hui (listée, D4) ; échéance = puces ; articles = tuiles ; « Autre » pour la désignation libre ; « − » retire |
| Texte d'aide « Les articles saisis créent une vente à encaisser… » | non porté (la maquette n'a aucune phrase d'aide : B3 « 55 mots ») |

## 4. Tests : rouges d'abord (fixtures, jamais Gemini, IBAN d'exemple public de la norme marqué test)

Nouveaux (`tests/integration/caisse*.test.tsx`, `tests/unit/caisse*.test.ts`) ; chacun doit échouer sur HEAD (module `src/ui/vente/Caisse` introuvable) avant le code :
1. `caisseCalculs.test.ts` : panier 24 × 5,00 + 6 × 10,00 = 18 000 ct (« 180,00 ») ; 2,135 × 1 = 214 ct ; prix `null` → total `null`, jamais 0 ; assujetti : TVA par ligne en centimes ; total > 50 000 CHF → message de borne ; `formatDepuisTarif('Pale Ale 33 cl')` → 33 cl, `'Fût 20 L'` → fût, `'Carton'` → `null` ; `encoder`/`decoderLigneVente` aller-retour, entrée illisible → `null` ; `litresVendus` : 24 × 0,33 + 6 × 0,75 = 12,42 L, une écriture annulée (`voidedAt`) exclue, une écriture d'un autre brassin exclue ; jauge « 12,4/27 » arrondie à 0,1 L, litres nets inconnus → pas de jauge chiffrée.
2. `caisseVente.test.tsx` (React) : « Vendre » dans le menu de `QuickActionModal` ouvre la caisse ; Clients › fiche › Facturer ouvre **la même** caisse, client choisi (avatar `aria-pressed`) ; tuiles : un tap +1, « − » −1 ; tuile sans tarif affiche « prix ? » et n'ajoute rien au total ; « Facture QR » par défaut, 30 j → échéance de `echeanceFacture` ; Facturer appelle `saveIncomeEntry` **une fois**, entrée `paymentStatus: 'unpaid'`, `invoiceNumber` = `FAC-2026-0001` (puis `0002` sur un grand livre qui contient `0001`), lignes portant `vente:<batch>:<format>` ; retry après rejet : même entrée (`toBe`), `generateInvoicePdf` appelé une fois ; hors ligne (`preparerQrFacture` rejeté) : rien d'enregistré, message dans la bande ; brasserie incomplète : « Facture QR » éteinte, « Payé ici » permis ; Comptoir : débiteur absent ; client sans adresse : QR permis, annexe « adresse à compléter » ; « Payé ici » exige TWINT ou Espèces ; 999 999 CHF refusé ; message de succès sans « Drive » sans preuve, « Quittance conservée dans Drive. » avec ; pas d'import de `InvoiceSheet` dans `ClientsTab` ni `QuickActionModal` (lecture du source).
3. `caisseAdresses.test.tsx` : `EditClientModal` enregistre `adresse` et `address` ; un client à `address` seule s'affiche découpé ; `IdentiteBrasserie` refuse « Ville », accepte une adresse complète, ne touche pas l'IBAN valide existant ; une `adresse` stockée survit à `getConfig` ; `adresseBrasserie` (repli `.env`, chaîne, structurée, rien → `null`).

**Tests existants** (HEAD, 20 fichiers, **139 tests verts**, `tests-head.txt`) : voir § 5 ; ceux de l'ancien écran sont **réécrits sur la caisse** (même règle, même assertion de fond), pas supprimés, sauf `date en 2062` (D4).

## 5. Appelants hors Possède (`grep` sur `src/`, `tests/`, `scripts/` entiers ; rejoués sur HEAD : 20 fichiers, 139 verts)

Rejoué : `tests-head.txt` = `Test Files 20 passed`, `Tests 139 passed (139)` (dont `factureQr`, `financeInvoice`, `facture-372765`, `settingsIban`, `bDiversIbanConfig`).

| Appelant | Ce qu'il lit | Effet du port |
|---|---|---|
| `src/ui/FloatingActions.tsx:181` | libellé « Encaisser une vente » | à changer en « Vendre » : **hors Possède** (D1) |
| `src/App.tsx:1069,1075-1084` | `onSale → setQuickAction('quick-sale')`, `QuickActionModal` | aucun changement : l'écran garde le même nom `quick-sale` |
| `scripts/agents/inventaire-ecrans.mjs:225-226, 253` | zone `{screen === 'quick-sale' && (` … `{screen === 'brew-batch' && !recipes.length`, marqueurs « Enregistrer une vente » / `quick-sale`, fichier `InvoiceSheet.tsx` | les deux ancres restent ; le marqueur « Enregistrer une vente » disparaît du source (titre supprimé) : `--verifier` le dira, **déjà en échec sur HEAD** (ancres `BrewWizard.tsx`) : à corriger par le pilote, hors Possède |
| `scripts/check-invoice-journey-emulator.mjs` | l'entrée « Entrer une facture » (scan), pas la vente | aucun |
| `tests/integration/AppQuickActionReturn.behavior.test.tsx:198, :71-73 de financeQuickActions` | `menuitem « Encaisser une vente »`, `Montant TTC encaissé` | à changer si D1 accepté ; la vérification de focus reste |
| `tests/integration/brewerNavigation.test.tsx:85,99`, `dashboardNavigation.test.tsx:211`, `fix114.test.tsx:137`, `FloatingActions.behavior.test.tsx:74`, `floatingActionsShellLayout.test.tsx:336,340` | libellé du menu « Encaisser une vente » | idem, hors Possède : à changer seulement avec D1 |
| `tests/integration/financeQuickActions.test.tsx:28-33,71-73`, `venteComptoirBornes.test.tsx` (5 tests), `incomeProofFlows.test.tsx` (2 tests : un sur InvoiceSheet, un sur l'encaissement) | dialogue « Enregistrer une vente », champ « Montant TTC encaissé », bouton « Valider l'encaissement » | **changent** : `incomeProofFlows` et `factureClientSaisie` sont dans le Possède ; `financeQuickActions` et `venteComptoirBornes` ne le sont pas : à réécrire sur la caisse avec accord (D1) ou nouveaux `caisse*` (je réécris les assertions de fond dans les tests neufs et le pilote retire les deux anciens) |
| `tests/integration/compactClients.test.tsx:67-69`, `mobileDailyViews.test.tsx:82-84` | bouton « Facturer » (visible au dépli) | **inchangés** (même libellé, même place) |
| `tests/integration/financeJournalUx.test.tsx:202` | `queryByRole('button', {name:'Enregistrer une vente'})` absent | reste vert |
| `tests/integration/compactClients.test.tsx`, `liveDataViews.test.tsx` | `EditClientModal` | rejoués : un champ adresse s'ajoute, aucune assertion sur la liste des champs (`grep` : seule occurrence « Vérifie l’adresse email », sans rapport avec des champs Rue / NPA nommés autrement) |
| `src/services/receiptService.ts` | `config.company.address/npa`, `COMPANY_FALLBACK` | inchangé (la quittance garde ses champs chaîne ; `adresse` les complète sans les retirer) |
| `tests/integration/bDiversIbanConfig.test.tsx`, `settingsIban.test.tsx` | IBAN de Réglages : étiquette « IBAN Brasserie (factures par virement) », id `settings-company-iban` | **gardés tels quels** dans `IdentiteBrasserie` (même étiquette, même id, même nom) |
| `tests/integration/rxPrixInconnu.test.tsx` | `InvoiceSheet` (prix inconnu) | à réécrire sur `Caisse` (prix inconnu = « prix ? », jamais 0) : hors Possède, **listé** pour le pilote |

## 6. Risques

- **Données existantes** : clients à `address` chaîne ; config sans `company.adresse` ; anciennes écritures `FAC-<année>-<8 hex>` (ignorées par `prochainNumeroFacture`, déjà prévu f1). Aucun champ obligatoire neuf, aucune réécriture de masse.
- **Hors ligne** : le QR veut `import()` de `swissqrbill` : préchargé à l'ouverture de la caisse (décision f1) ; hors ligne sans chunk en cache : « QR indisponible », « Payé ici » reste permis, aucune facture sans QR enregistrée. Aucune écriture de transaction avant `saveIncomeEntry`.
- **Double clic / retry** : une ref `busy` et un brouillon conservé (`pending`), n° figé au premier essai ; un retry après expiration de la confirmation ne regénère ni n° ni PDF ; `saveIncomeEntry` est déjà idempotent sur l'entrée.
- **Arrondis** : tout en centimes entiers via `invoiceTotals` (`centimesNet`) ; `toCents` de `ledger.ts` (faux sur ~5 % des demi-centimes, f1) n'est pas utilisé.
- **Poids** : `swissqrbill` entre dans le chunk de `Caisse`, pas du paquet principal : à mesurer au build (`vite build`, taille des chunks avant/après).
- **Numérotation sur deux appareils** : le doublon est signalé dans la bande ; jamais renuméroté après envoi (P6).
- **Prix par client** : aucun (« à venir », maquette) ; pastille Pro/Privé seulement. Rien d'inventé.
- **Lecture du « prix exemple »** : la pastille n'a de sens que sur fixture ; elle ne s'affiche jamais sur un vrai tarif (sinon un vrai prix serait dit « exemple »).

## 7. Hors périmètre

Prix par client ; TVA réduite ; avoirs et notes de crédit ; rappels d'impayés ; envoi par e-mail depuis l'app (seul le PDF partagé/téléchargé) ; assiette de l'impôt (`litresSortis`, voie up) ; suppression de `InvoiceSheet.tsx` ; signalement du doublon **à la synchro** (seul l'enregistrement local est branché) ; le déduit du stock bouteilles/fûts d'un brassin vendu (rien n'existe aujourd'hui, à ne pas inventer) ; mise à jour du registre et des scripts hors Possède.

## DÉCISIONS À PRENDRE (pilote)

- **D1** — Libellé « + › Vendre » : le menu « + » vit dans `src/ui/FloatingActions.tsx` (hors Possède). Options : (a) étendre le Possède à ce fichier et aux tests qui nomment « Encaisser une vente » (`AppQuickActionReturn`, `brewerNavigation`, `dashboardNavigation`, `fix114`, `FloatingActions.behavior`, `floatingActionsShellLayout`, `financeQuickActions`, `venteComptoirBornes`) ; (b) laisser « Encaisser une vente » au « + » et ne changer que le menu de la modale (l'entrée reste en double). **Reco : (a)** : un seul libellé, « Vendre » ; la consigne « remplacer, jamais fusionner » interdit de laisser l'ancien nom.
- **D2** — « Payé ici » : la maquette n'a pas de moyen de paiement ; `FinancialPayment` en exige un (`twint` / `cash` / `bank`). Option : deux puces TWINT · Espèces sous le segment, **sans valeur par défaut** (un moyen inconnu n'est pas inventé), « Encaisser » éteint tant qu'aucune n'est touchée. **Reco : oui.**
- **D3** — Prix des tuiles : `PricingItem` n'a pas de format. Option : lier par le nom du tarif (« … 33 cl », « … 75 cl », « Fût 20 L » + nom de la bière) ; un tarif non reconnu passe par « Autre » ; un format sans tarif affiche « prix ? ». Alternative : ajouter `formatId` au tarif (`TarifSheet`, hors Possède). **Reco : par le nom maintenant**, `formatId` plus tard.
- **D4** — Date d'émission libre : absente de v3a (l'annexe montre « 9 nov. 2026 »). La date = aujourd'hui ; on perd la possibilité d'antidater une facture (la règle AM-67 « 2062 » n'a plus d'objet). **Reco : accepter** ; si le brasseur veut antidater, un geste sur la date de l'annexe, à lui montrer en mini maquettes.
- **D5** — Justificatif de paiement joint, absent de v3a : non porté. **Reco** : le joindre depuis le détail de l'écriture au journal (hors voie) ; à confirmer.
- **D6** — `Virement` disparaît comme moyen : une vente par virement est une « Facture QR » payée plus tard. **Reco : accepter.**
- **Hors périmètre à signaler** : `rxPrixInconnu.test.tsx`, `inventaire-ecrans.mjs` (`--verifier` déjà en échec sur HEAD pour `BrewWizard.tsx`) à rejouer ou corriger par le pilote.

## 8. Revues (REVUE-A : 15 constats dont 2 B ; REVUE-B : 14 dont 4 B) et décisions du pilote (DECISIONS.md) : sort de chacun

Décisions du pilote reprises : D1 (a) Possède étendu à `FloatingActions.tsx` et aux tests qui nomment « Encaisser une vente » ; D2 puces TWINT · Espèces sans défaut ; D3 lien par nom de tarif ; D4 la date de l'annexe se touche ; D5 justificatif depuis le journal (manque listé) ; D6 Virement = Facture QR.
**Possède ajouté** (REVUE-B 6, 9, 14) : `src/ui/FloatingActions.tsx`, `src/dev/financeDemo.ts` (clients, tarifs, brassin de démonstration, marqués démo), `tests/integration/rxPrixInconnu.test.tsx`, `financeQuickActions.test.tsx`, `venteComptoirBornes.test.tsx`, et les tests qui nomment « Encaisser une vente » (D1).

### Les six bloquants, chacun prouvé par un test (rouge d'abord, sur une `Caisse` qui compile et échoue à l'assertion : `tests-rouge.txt`)
| Constat | Sort | Ce qui change dans le plan | Test |
|---|---|---|---|
| A1 : l'adresse saisie depuis la caisse est écrasée par Réglages (`formData` est un instantané, `SettingsModal.tsx:76-81`) | **retenu** | `IdentiteBrasserie` est contrôlé (`value`/`onChange`) dans Réglages et n'y écrit rien seul ; la feuille de la caisse écrit `company` seulement, en relisant `getConfig()` à l'enregistrement (lecture-modification-écriture). Et `SettingsModal.handleSave` fusionne par `companyFraiche(initial, saisi, frais)` (pure, `companyDefaults.ts`) : un champ que le brasseur n'a pas touché reprend la valeur fraîche du stockage, un champ touché garde sa saisie. Le champ IBAN ne copie jamais `COMPANY_FALLBACK.iban` dans la config (il ne s'écrit que s'il est tapé) | `caisseAdresses` : adresse écrite par la caisse, Réglages ouvert avec la config **périmée**, Enregistrer : adresse et IBAN conservés ; IBAN non touché → pas écrit ; `companyFraiche` seul |
| A2 + B7 : « Payé ici » : écriture et quittance ne disent pas le panier | **retenu** | « Payé ici » n'emploie plus `createSaleTransactionWithReceipt`. L'écriture est bâtie par `enregistrerVente.ts` depuis `invoiceTotals` : `amountHT`, `tvaAmount`, `amountTTC`, `amountCents` et les lignes viennent de la même somme au centime ; **les lignes `vente:<brassin>:<format>:<litres>` sont écrites aussi en « Payé ici »** (sinon la jauge ignore le comptoir). Le PDF est `ReceiptService.generateReceiptPdf` (service inchangé, hors Possède) avec `beerName` = `libelleFacture`-like (140 car.) : **la quittance imprimée est une ligne de résumé + le total** ; l'annexe « Payé ici » montre exactement cela (« quittance : une ligne ») et le dit. Changer la quittance A5 pour porter les lignes = demande hors Possède, listée | `caisseVente` : non assujetti et assujetti : `amountHT + tvaAmount = amountTTC`, Σ lignes = `finance.amountCents`, une ligne `vente:` par article en « Payé ici » ; le `beerName` passé au PDF contient tous les articles |
| B1 : hors ligne, **aucun** enregistrement ne passe (`incomeEntry.ts:27-36` : preuve Drive de l'original puis confirmation serveur) | **retenu** | la phrase « Payé ici reste permis hors ligne » est retirée. Bande : « hors ligne : l'enregistrement attend le réseau », brouillon conservé, « Réessayer » ; au retour du réseau : même entrée, jamais de double | `caisseVente` : `saveIncomeEntry` rejeté pour **les deux** modes → message dans la bande, bouton « Reprendre la confirmation », deuxième appel avec la **même** entrée (`toBe`) ; `preparerQrFacture` rejeté → rien d'enregistré |
| B2 : focus, `inert`, Échap, retour au lanceur viennent de `ModalShell` | **retenu** | **un seul hôte : `ModalShell` `size="xl"`** (1 240 px à ≥ 1 024 px). `Caisse` = `ModalShell` + `CaisseContenu` ; `ClientsTab` monte `Caisse` ; `QuickActionModal` garde son `ModalShell` (même ancre `{screen === 'quick-sale' && (`) et y rend `CaisseContenu` : jamais deux dialogues empilés, que l'entrée vienne du « + » direct (`initialScreen`) ou du menu de la modale. Dialogue nommé « Vendre » (l'ancien « Enregistrer une vente » disparaît : la maquette n'a pas ce titre). `dismissible={!busy}` | `financeQuickActions` réécrit : dialogue « Vendre » avec le focus, aucun autre dialogue, Échap ferme hors `busy`, bloqué pendant `busy` ; `AppQuickActionReturn` (il mocke la modale) : libellé « Vendre » seulement |
| B3 : une fiche à `address` non découpable perdrait son adresse | **retenu** | `EditClientModal` n'écrit `address` que si `adresse` est saisie **complète** (nom de rue, NPA, localité) ; sinon `address` reste telle quelle et s'affiche en lecture au-dessus des champs (« adresse enregistrée : Case postale 123 »). `adresse` prime pour la caisse ; `address` est dérivée à chaque écriture complète | `caisseAdresses` : client `address: 'Case postale 123'`, enregistrer un téléphone → `address` inchangée, `adresse` absente ; adresse complète saisie → les deux écrites |
| B4 : double toucher, fermeture avec brouillon | **retenu** | `busy` est posé **avant** le premier `await` (`preparerQrFacture`) ; × et Échap bloqués pendant `busy`. Le brouillon (`entree`, n°, PDF, panier, mode) vit dans un module (`brouillon.ts`), pas dans le composant : fermer puis rouvrir après un rejet **restitue le même panier et la même entrée**, la caisse n'offre que « Reprendre la confirmation » (pas de 2e vente). Fermer avec un brouillon : un premier appui avertit (« une écriture locale existe : FAC-… ; elle se confirmera »), le second ferme | `caisseVente` : deux clics synchrones sur Facturer, `preparerQrFacture` différé → `saveIncomeEntry` et `generateInvoicePdf` une fois ; rejet, fermeture, réouverture → `saveIncomeEntry` rappelé avec la **même** entrée, aucun 2e n° |

### Les autres constats
| Constat | Sort | Raison / plan |
|---|---|---|
| A3 (Comptoir + Facture QR) | retenu | Comptoir : segment par défaut « Payé ici » ; « Facture QR » éteinte avec la ligne « une facture a besoin d'un client » dans la bande. Aucune « Destinataire : Comptoir » |
| A4 (UID de gabarit) | retenu | `uidValide` (`CHE-###.###.###`, pas de `X`) dans `IdentiteBrasserie` ; assujetti avec UID invalide : ligne « n° UID ? » dans la bande, bloque **les deux** modes ; test |
| A5 (deux primaires, flux) | retenu | « Facturer » enregistre (n° figé) puis la caisse passe à « Facture FAC-… enregistrée » : « Envoyer le PDF » (partage/téléchargement, répétable sans réenregistrer, `saveIncomeEntry` jamais rappelé) et « Nouvelle vente ». Avant : « Envoyer le PDF » = enregistrer puis partager. Test : partage annulé, 2e clic sans `saveIncomeEntry` |
| A6 + B8 (fût 20 L ; jauge à 0 pour les ventes anciennes) | retenu | la capacité du fût vient de `KegItem.capacityL` des fûts du brassin, sinon 20 L « à vérifier » ; les litres sont écrits dans la ligne (`vente:<brassin>:<format>:<litres>`) ; la jauge est libellée « notés depuis la caisse » et n'est pas un restant ; test : fût 30 L = 30 L ; ventes anciennes sans référence ignorées sans dire 0 restant |
| A7 (tarifs ambigus) | retenu | correspondance sur format ET nom de la bière (normalisé) ; plusieurs candidats ou aucun → « prix ? » ; le tap ouvre la ligne libre préremplie (désignation, format) ; règle rejouée sur la fixture démo |
| A8 + B11 (date, D4) | retenu | tap sur la date de l'annexe → `<input type="date">` (second plan) ; l'année du n° (`prochainNumeroFacture(…, année)`), l'échéance (`echeanceFacture`) suivent ; `messageDateHorsBornes` garde AM-67 ; antidater : compromis dit dans RESULTAT |
| A9 (écarts non listés) | retenu | rubrique « Écarts assumés vs v3a » ci-dessous, reprise dans RESULTAT |
| A10 (« Modifier » à 1280) | retenu | à ≥ 900 px il remet le focus sur le panier ; à 390 il replie l'annexe ; testé |
| A11 (QR exemple) | retenu | dessin décoratif non encodant (le SVG de la maquette), marqué « QR exemple », jamais dans un PDF : une brasserie incomplète ne produit aucune facture QR |
| A12 (jauge qui dépasse, format absent) | retenu | barre pleine + « au-delà du conditionné », jamais bloquant ; tuile d'un format absent du brassin atténuée ; testé sur fixture |
| A13 (avoirs) | retenu | `litresVendus` ignore les avoirs ; hors périmètre dit (§ 7) |
| A14 (double source d'adresse) | retenu | `adresse` prime pour la caisse, `address` dérivée à chaque écriture complète ; lecteurs de la chaîne (`fribourgTax.ts:54`, `financeExport.ts:45`) inchangés ; écrivains de `client.address` relus par `grep` à l'étape 2 |
| A15 (hors ligne) | retenu | « Réessayer » dans la bande ; la perte (aucune facture hors ligne) listée dans RESULTAT |
| B5 (débiteur partiel) | retenu | débiteur = `undefined` dès que `problemesAdresse(client, 'client')` (nom exclu) n'est pas vide ; l'annexe dit « adresse à compléter » ; test client à NPA sans localité |
| B6 (fixture sans clients ni tarifs) | retenu | `financeDemo.ts` ajoute 2 clients (Pro, Privé), 3 tarifs « Pale Ale 33 cl / 75 cl / Fût 20 L », 1 brassin conditionné ; ids `DEMO-…`, noms marqués ; « prix exemple » = donnée de la fixture, jamais en réel |
| B9 (appelants) | retenu | scripts hors Possède à signaler au pilote : `scripts/test_all_buttons.mjs:210-222`, `scripts/manual_monkey_test.mjs:182-185`, `scripts/real_conditions_ui_test.mjs:134` ; `rxPrixInconnu.test.tsx` au Possède, réécrit sur la caisse |
| B10 (config, règles) | retenu | couvert par A1 ; la caisse lit `getConfig()` à l'ouverture, pas une prop ; `firestore.rules.template` sans `hasOnly` sur ces champs (lu par la revue) : à confirmer par l'émulateur, hors cette voie |
| B12 (n° qui change) | retenu | le n° est figé à l'ouverture de la caisse (ref), affiché et utilisé tel quel ; revalidé au clic seulement pour la bande « numéro en double » |
| B13, B14 | retenu | ancre conservée ; Possède complété ci-dessus |

### Écarts assumés vs v3a (à reprendre dans RESULTAT)
(a) hôte `ModalShell` xl au lieu de la page (barre du bas et FAB de la figure = cadre de l'app, non portés) ; (b) puces TWINT · Espèces (D2) ; (c) annexe « quittance » (une ligne + total) que v3a ne dessine pas ; (d) bande des manques à plusieurs lignes, « adresse ? » seul quand c'est le seul manque ; (e) numéro réel au lieu de « 2026-suivant » ; (f) date de l'annexe touchable (D4) ; (g) « Réessayer » et la bande hors ligne ; (h) état « Facture enregistrée » avec « Nouvelle vente ».

## Commandes de l'étape 2

`npx vitest run tests/unit/caisse*.test.ts tests/integration/caisse*.test.tsx tests/integration/factureClientSaisie.test.tsx tests/integration/incomeProofFlows.test.tsx <appelants du § 5> --reporter=dot > work/missions/2026-11-09-compta-prix/voies/uv/tests.txt 2>&1` ; `npx tsc --noEmit` (hors `firebase-admin`) ; `npx vite build` ; captures `?dev-local&finance-demo` à 390 tactile et 1280, clair et cave, états : panier, Facture QR, Payé ici, Comptoir, bande des manques, annexe, côte à côte avec `v3a-page.png` / `v3a-1280.png`, ouvertes ; `controle-choix.mjs` (`work/refonte-frontend/v4/tournoi/outils/`) et `controle-teinte.mjs`.
