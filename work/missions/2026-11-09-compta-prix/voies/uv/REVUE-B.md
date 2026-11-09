# REVUE-B — voie uv, regard B (code et risques) — plan avant code, sans mémoire

Lu : VOIE.md, PLAN.md (173 l.), DECISIONS.md, RESULTAT.md, tests-head.txt ; code vérifié par grep et lecture sur le worktree (HEAD 317dd446).
Gravité : B = bloquant avant code, G = grave (à corriger dans le plan ou le premier test), D = détail.

**Verdict : OK avec réserves.** L'inventaire des appelants est bon sur le fond (les 20 fichiers et 139 verts se retrouvent dans `tests-head.txt`), le remplacement est cadré, les anciennes règles TE-6/TE-7/AM-67/MV-38/TE-55 sont reprises. Quatre points B doivent être écrits dans le plan avant le premier test rouge ; les autres se règlent en tests.

## Constats

1. **B — « Hors ligne : Payé ici reste permis » est faux ; aucun enregistrement ne passe hors ligne** (PLAN.md § 2.2 « Bande des manques », § 6 « Hors ligne »).
   Preuve : `saveIncomeEntry` (`src/services/incomeEntry.ts:27-36`) appelle d'abord `saveFinanceDocumentConfirmed` (`financeDocuments.ts:72-94` : `getDocFromServer`, refus hors ligne via `offlineOriginalError`), puis `waitForDocument` qui lève « en attente » si `fromCache` (`firestoreRepo.ts:~296-300`). Les deux modes (Payé ici comme Facture QR) échouent donc hors ligne ; seul `preparerQrFacture` est testé comme « hors ligne » au § 4.
   Correction : le plan dit la vérité (bande « hors ligne : l'enregistrement attend le réseau », bouton gardé, brouillon conservé) ; test : `saveIncomeEntry` rejeté pour **les deux** modes, message dans la bande, rien de double au retour du réseau. Retirer « Payé ici permis » de la phrase sur le hors ligne.

2. **B — Retour du focus et montage dans `ModalShell` non traités** (PLAN.md § 2.5, § 5 ligne `AppQuickActionReturn`).
   Preuve : `AppQuickActionReturn.behavior.test.tsx:198-221` exige un `dialog` « Saisie rapide », le bouton « Fermer la saisie rapide », l'événement de libération du modal, l'`inert` de l'app et le retour du focus au lanceur ; `financeQuickActions.test.tsx:60-75` exige le focus sur le bouton du menu puis `Escape`. Tout cela vient de `ModalShell` (`QuickActionModal.tsx:640`, `dismissible={!saleSaving…}`). Le plan fait monter la `Caisse` dans son propre `Sheet` « sans la modale vide derrière » seulement pour `initialScreen === 'quick-sale'` ; quand l'écran s'ouvre depuis le menu de la modale (`initialScreen === 'menu'`, bouton `:709`), la modale reste derrière et deux dialogues s'empilent. Le plan écrit « la vérification de focus reste » sans dire comment elle reste verte.
   Correction : décrire le montage des deux chemins (lanceur « + » direct ; menu de la modale), qui garde l'`inert`/le retour de focus (réemployer `ModalShell`, ou prouver que `Sheet` rend les mêmes événements) ; rejouer `AppQuickActionReturn` et `financeQuickActions` **sur la caisse** (le dialogue aura un autre nom, à justifier) ; test rouge d'abord sur HEAD avec la nouvelle assertion.

3. **B — Une fiche client existante peut perdre son adresse** (PLAN.md § 2.6, EditClientModal).
   Preuve : `EditClientModal.tsx:41-48` écrit `{...draft, …}` ; le plan ajoute « `address` = "rue n°, NPA localité" » à chaque enregistrement. Un client dont `address` n'est pas découpable par `adresseDepuisTexte` (« Case postale 123 », texte libre) s'ouvre avec des champs vides ; enregistrer pour changer un téléphone écraserait `address` par une chaîne vide ou partielle. `address` est lu par la facture (`swissQrBill.ts:203`).
   Correction : n'écrire `address` que si `adresse` est saisie complète ; sinon laisser la chaîne d'origine intacte (et la montrer en lecture au-dessus du formulaire). Test rouge : client à `address: 'Case postale 123'`, enregistrer sans toucher l'adresse, `address` inchangée.

4. **B — Double toucher et brouillon à la fermeture non couverts** (PLAN.md § 2.2 « Erreur d'enregistrement », § 4 test 2, § 6).
   Preuve : l'ancien `InvoiceSheet` pose `dismissible={false}` et refuse `onClose` pendant `saving.current` (`InvoiceSheet.tsx:26,62`) ; l'ancien modal bloque `resetAndClose` pendant `saleBusy` (`QuickActionModal.tsx:265`) mais l'efface sinon (`pendingSale.current = undefined`, `:277`). Le plan garde `busy` et `pending` mais ne dit rien de la fermeture avec un brouillon en attente. Or `saveIncomeEntry` écrit en local **avant** la confirmation (`incomeEntry.ts:38-39`, `state.staged = true`) : fermer puis refaire la vente après une confirmation perdue crée une seconde écriture (second n° ou seconde vente).
   De plus `busy` doit être posé **avant** le premier `await` (`preparerQrFacture` est asynchrone) : sinon deux touchers rapides préparent deux numéros/PDF.
   Correction : écrire la règle (× et Échap bloqués pendant `busy` ; avec `pending`, la fermeture demande de reprendre la confirmation ou avertit qu'une écriture locale existe) ; ajouter au § 4 un test « deux clics synchrones sur Facturer, `preparerQrFacture` différé : `saveIncomeEntry` et `generateInvoicePdf` appelés une fois » et un test « rejet puis fermeture puis réouverture ».

5. **G — Débiteur au QR : adresse partielle non décidée** (PLAN.md § 2.2 « Bande des manques »).
   Preuve : `preparerQrFacture` refuse un débiteur incomplet (`swissQrBill.ts:~149-153`, `problemesAdresse(…,'client')` exige NPA, localité, pays). Le plan dit « client sans adresse : QR permis » mais ne dit pas ce qui arrive avec un client à adresse découpée à moitié (NPA sans localité) : la facture entière serait refusée, ce qui contredit la bande « facture QR permise sans ».
   Correction : règle écrite et testée : débiteur = `undefined` dès que `problemesAdresse` du client n'est pas vide, nom exclu ; l'annexe dit « adresse à compléter ». Test sur un client à adresse partielle.

6. **G — La fixture `?dev-local&finance-demo` ne contient ni clients, ni tarifs, ni brassins** (PLAN.md « Commandes de l'étape 2 », § 2.2 « prix exemple »).
   Preuve : `src/dev/financeDemo.ts` (36 l.) ne fait que `add('config'…)`, stocks, recette, transactions, plans ; aucun `add('clients'|'tarifs'|'batches')`. Les captures « côte à côte avec v3a » seraient donc faites sur un écran vide (« prix ? », pas d'avatars, pas de jauge) ; la pastille « prix exemple » du plan n'a pas de source. Le fichier est hors Possède.
   Correction : étendre le Possède à `src/dev/financeDemo.ts` (ou un seed local dans `voies/uv/` injecté par le banc de capture) avec deux clients (Pro, Privé), des tarifs « … 33 cl / 75 cl / Fût 20 L » et un brassin conditionné, tous marqués démo ; écrire « prix exemple » = « donnée de la fixture démo », jamais affichée en réel.

7. **G — L'annexe « quittance imprimée » ne correspond pas au PDF réel de « Payé ici »** (PLAN.md § 2.2 États, § 2.3).
   Preuve : `ReceiptService.generateReceiptPdf` prend un seul `beerName` et un seul `amountTTC` (`receiptService.ts:~100-170` : une ligne, « TOTAL ENCAISSÉ »), pas le panier. Le plan affiche une quittance à lignes (« 24 × 33 cl… ») mais réemploie le service tel quel. Autre écart : le service calcule HT/TVA sur le total (`:187-190`) alors que `invoiceTotals` arrondit par ligne ; pour un assujetti, l'écriture (`amountHT`, `tvaAmount`) et ses lignes peuvent différer d'un centime.
   Correction : décider avant code : soit le libellé de `beerName` porte `libelleFacture` et l'annexe dit « quittance : une ligne », soit la quittance est générée par `generateInvoicePdf`/un cousin avec les lignes. Test : pour un assujetti, `amountHT + tvaAmount = amountTTC` et somme des lignes = `finance.amountCents` (`ledger.ts:201` l'exige déjà).

8. **G — La jauge « litres vendus » compte 0 pour toutes les ventes déjà saisies** (PLAN.md § 0 n° 3, § 2.3 `litresVendus`, § 6 « Données existantes »).
   Preuve : aucune écriture existante ne porte `sourceReference: vente:…` ; `litresVendus` = Σ sur ces seules lignes. La jauge « 12,4/27 L nets » sous-estime donc un brassin déjà vendu à la main (inconnu ≠ 0, L14). Autre hypothèse en dur : « fût 20 L » (`FORMATS_VENTE`) alors que `BatchPackaging.kegIds` renvoie à des fûts de capacité propre (`types/index.ts:640-644`).
   Correction : la jauge dit « depuis la caisse » (ou n'affiche que « litres notés depuis la caisse ») et ne présente pas un restant ; la capacité du fût vient du fût, sinon 20 L marqué « à confirmer ». Test : brassin avec ventes anciennes sans référence.

9. **G — Appelants non listés au § 5** (PLAN.md § 5, grep sur `scripts/` incomplet).
   Preuve : `scripts/test_all_buttons.mjs:210-222` clique « Encaisser une Vente » ; `scripts/manual_monkey_test.mjs:182-185` et `real_conditions_ui_test.mjs:134` cherchent « Ajouter un article » dans la feuille de facture. Le plan ne cite que `inventaire-ecrans.mjs` et `check-invoice-journey-emulator.mjs`. Dans les tests, `tests/integration/rxPrixInconnu.test.tsx` importe `InvoiceSheet` (listé) mais n'est ni dans le Possède ni dans la liste D1.
   Correction : ajouter ces trois scripts à la liste « hors Possède à signaler au pilote » et `rxPrixInconnu.test.tsx` au Possède (réécriture sur la caisse). Sans cela, après le port, un test garde l'ancien orphelin vert et crée un faux acquis.

10. **G — `Client.adresse` / `company.adresse` : règle Firestore et écriture de config à vérifier par test** (PLAN.md § 2.1, § 2.6).
    Preuve : `firestore.rules.template:135,141` liste `clients` et `config` ; je n'y vois pas de `hasOnly` sur leurs champs (lecture partielle, à confirmer par le test d'émulateur déjà prévu en étape 2). `getConfig` étale bien `company` (`storage.ts:1258`). Risque réel : `SettingsModal` écrit toute la config depuis `formData = useSyncedDraft(config, isOpen)` (`SettingsModal.tsx:50,76-81`) ; si l'App n'a pas rafraîchi `config` après l'écriture de `IdentiteBrasserie` depuis la caisse (la `QuickActionModal` ne reçoit pas `config`, `App.tsx:1075-1084`), l'enregistrement suivant des Réglages effacerait l'adresse neuve. L'App rafraîchit sur ses abonnements (`App.tsx:355,400`) : probablement sans risque, mais non prouvé.
    Correction : test d'intégration « adresse écrite via IdentiteBrasserie, puis Réglages ouverts et enregistrés : adresse et IBAN conservés » ; et « enregistrer l'identité sans toucher l'IBAN n'écrit pas l'IBAN de repli `.env` » (le champ montre `COMPANY_FALLBACK.iban`, `SettingsModal.tsx:243`). La caisse lit `StorageService.getConfig()` à l'ouverture, pas une prop.

11. **G — Tests rouges d'abord : le rouge annoncé est trivial** (PLAN.md § 4).
    Preuve : « chacun doit échouer sur HEAD (module `src/ui/vente/Caisse` introuvable) » : un import manquant est rouge par construction et ne prouve rien du comportement (L13). Seuls les tests de domaine (`litresVendus`, `formatDepuisTarif`) sont réellement rouges par la fonction.
    Correction : pour chaque règle reprise (TE-6, TE-7, MV-38, TE-55, AM-67 date touchée, retry même entrée), écrire l'assertion de comportement sur la caisse avec un `Caisse` minimal vide qui compile et échoue sur l'assertion ; consigner la sortie rouge dans `tests.txt` avant le code. Ajouter au § 4 un test de la date touchée (D4) : bornes AM-67, année du n° (`prochainNumeroFacture(..., annéeÉmission)`), échéance recalculée depuis la date choisie.

12. **D — Le n° affiché peut changer entre l'annexe et l'enregistrement** (PLAN.md § 0 n° 8, § 2.2 Annexe).
    Preuve : l'annexe montre `prochainNumeroFacture(getTransactions(), année)` au rendu ; le plan le calcule « au moment d'enregistrer ». Entre les deux, une synchro peut ajouter `FAC-…-0001` : le PDF porte un autre n° que celui vu.
    Correction : figer le n° à l'ouverture de la caisse ou à la première préparation, et l'afficher avec le même ; revalider au clic seulement pour la bande « numéro en double ».

13. **D — `inventaire-ecrans.mjs` : le marqueur « Enregistrer une vente » disparaît** (PLAN.md § 5). Déjà vu par l'auteur ; ancre `{screen === 'quick-sale' && (` à conserver, correct. Rien d'autre.

14. **D — Possède** : `src/ui/FloatingActions.tsx` et les tests nommés vont au Possède par D1 (DECISIONS.md) : conforme. Il manque seulement `src/dev/financeDemo.ts` (constat 6) et `tests/integration/rxPrixInconnu.test.tsx` (constat 9). `git status --short` : seuls des dossiers de mission sont modifiés ; aucun fichier de `src/` écrit à ce stade (conforme au plan sans code).

## Vérifié et sans défaut
- `sourceReference` n'est lu par aucune règle de `src/domain/finance` ni `src/services/finance*` (grep : seule la déclaration `types.ts:16`) : l'encodage `vente:<batchId>:<formatId>` est sans effet de bord. Firestore rejette `undefined` mais `stripUndefined` existe (`firestoreRepo.ts:220`).
- `Client.adresse?` et `company.adresse?` optionnels : les données existantes (clients à `address`, config sans le champ) se relisent sans migration.
- `prochainNumeroFacture` ignore les anciens `FAC-<année>-<8 hex>` (`numeroFacture.ts:11,27`) ; les ventes anciennes ne cassent pas la suite.
- Total des lignes = montant : `ledger.ts:201` l'impose, `invoiceTotals` produit des centimes entiers : la ligne par article tient.

LEÇON PROPOSÉE : aucune
