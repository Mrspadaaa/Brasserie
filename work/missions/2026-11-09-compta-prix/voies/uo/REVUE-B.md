# Revue B (code et risques) du PLAN de la voie uo (Opérations v6b)

Relecteur sans mémoire, lecture seule hors ce fichier. Gravité : B = bloquant avant code, G = grave, D = détail.

## Verdict : PLAN À CORRIGER (3 B, 4 G, 3 D). Le plan est précis sur l'argent (contre-écriture, refus de l'état inconnu, reste exact). Mais il laisse tomber des cas que le code gère aujourd'hui (filtre actif invisible, période d'exercice, ventilation par lignes) et oublie des tests appelants.

## Constats

1. **B — Un filtre actif devient invisible.**
   Aujourd'hui, une demande venue de la Synthèse ou de l'Annuel (`filter: 'payable' | 'unknown' | 'review' | 'due'`) active une puce visible, avec `journal-active-filter` « Retirer le filtre » (`TransactionJournal.tsx` rail et `specialFilter`) et `scrollIntoView` de la puce choisie (l. 148-153, commentaire : « la liste change sans que rien ne dise pourquoi »).
   Dans le plan, les puces d'état vont dans le panneau `Filtres ⌄` fermé par défaut ; seul `late` a une pastille (E3). La liste filtrée change donc sans rien dire.
   Correction : un indicateur du filtre actif et un « Retirer » visibles hors panneau, pour tout filtre ≠ `all` ; test dédié (reprendre `financeWorkspace.test.tsx:37-44`, qui ouvre à la main le panneau et masque le défaut).

2. **B — `year`, `followingUp`, `archiveYear` et `periodLabel` ne sont pas traités.**
   Le code actuel affiche « Exercice 2026 » (`year`, demande de l'Annuel : `openJournal({year, allDates, filter:'review'})`, `FinancesTab.tsx:150`), « Tous les exercices » (`followingUp`) et « Archives 2025 ». La maquette n'a qu'une pastille `‹ novembre ›`.
   Le plan ne dit pas ce que montrent la pastille, les piles et les groupes quand `year` est renseigné, quand un suivi élargit la période (`FOLLOW_UP_FILTERS`), ou quand `allDates` arrive par défaut à `true` via `request` (`allDates: request.allDates ?? true`, l. 160). Aucune règle pour choisir entre « groupes par catégorie du mois » et « par jour (Par date) ».
   Correction : une table état → affichage (scope × filter × allDates × year), et dire si les piles se calculent sur la liste filtrée (ce qui trompe : 400 € de « payable » vendus comme « le mois ») ou sur le mois entier.

3. **B — Ventilation par lignes sans reliquat, et facture mixte placée dans plusieurs groupes ou aucun.**
   §3.1 : « payé = Σ min(montant ligne, part payée) … par ligne ventilée si `finance.lines` existe ». Une facture dont les lignes ne couvrent pas le total (TVA, transport, remise) perd son reliquat dans les piles, alors que le sous-total de groupe et la légende « dépensé » doivent égaler 696,80. La voie us traite ce cas (`us/PLAN.md` T4) ; uo non.
   Les groupes sont par catégorie de l'écriture, les piles par ligne : une facture matériel + brassage s'affiche dans un seul groupe mais alimente deux piles. Test 7 (« somme des lignes affichées ») ne couvre pas ce cas. Le filtre de catégorie actuel (`keep()`, l. 202-204) place déjà une facture dans chaque catégorie de ses lignes.
   Correction : écrire où paraît une facture mixte, répartir le reliquat sur `tx.category`, et ajouter le test (modèle : `financeJournalDoubleSomme` avec reliquat).

4. **G — Garde TA2 / DoubleSomme : réécriture à faire plus finement qu'« adapter ».**
   `ta2-compteur.test.tsx` garantit que les annulées se listent mais ne s'additionnent pas. `financeJournalDoubleSomme` garantit qu'une facture à 26 lignes vaut une opération de 110,40 une fois, et qu'on ne voit « 220,80 » qu'avec 26 écritures distinctes en plus.
   Le plan supprime le compteur (D5) et laisse « à relire ». Les tests rouges du plan (§4) ne testent ni « une annulée n'entre ni dans une pile ni dans un sous-total », ni « une facture à 26 lignes = un sous-total de 110,40 ». L'état « avoir et annulée » n'existe que comme capture.
   Correction : ajouter ces deux tests purs dans `operationsCalculs` avant d'adapter l'ancien.

5. **G — Appelants oubliés.**
   `tests/integration/mobileDailyViews.test.tsx:113-120, 128-130` attend, dès l'ouverture d'Opérations : champ « Rechercher une opération » visible (la loupe est fermée par défaut dans le plan), `Période du journal`, bouton `Archives`, et que la recherche persiste après un tour par Prévisions et Annuel. Il n'est ni dans §5 ni dans les 5 fichiers « adaptés ».
   `tests/integration/financeWorkspace.test.tsx` est cité mais n'est pas dans le Possède de uo, et us en édite les mêmes lignes (L37-44). Deux propriétaires pour un fichier.
   Le rejeu HEAD de uo cite 8 fichiers dont « quick actions » et « bDiversJournal » (`tests-head.txt`, `RESULTAT.md`). Ces deux-là n'exercent pas le journal (bDiversJournal teste `AuditLogModal`) : le « 51 verts » ne couvre donc pas `mobileDailyViews` ni `financePeriodDrilldown`.
   Correction : ajouter `mobileDailyViews` à §5 (liste `uo` des lignes à changer, remise à us qui en est propriétaire) ; refaire le rejeu avec les vrais appelants.

6. **G — Même règle de calcul que us, redéfinie.**
   Voir `us/REVUE-B.md` n° 5. uo (`categorieDeLigne`, `pilesDuMois`) range le matériel par catégorie de ligne, us par `capitalTreatment` ; le « dépensé » de la légende (696,80) et celui de la Synthèse doivent rester identiques. À faire consommer le domaine commun `src/domain/finance/periodeSynthese.ts`, avec un test de cohérence sur la démo.

7. **G — « + pièce » passe par `EditTransactionModal`, qui stocke la pièce en base64 dans l'écriture.**
   `EditTransactionModal.tsx:331-340` : `FileReader.readAsDataURL` → `proofUrl`, puis `StorageService.updateTransaction`. Cela contourne le circuit Drive (`finance.proofDocumentId`, `proofUpload`) qu'utilise la saisie moderne ; l'Annuel qualifie ce chemin de `legacy-inline` (`annual.ts` `proofSource`), avec le risque de taille du document Firestore.
   La modale réécrit aussi `finance.amountCents = Math.round(amountTTC*100)` pour toute écriture à `finance` (l. 62), sur des montants flottants.
   La décision D6 du pilote (« ouvre la modification ») est prise ; mais le plan doit l'écrire comme limite connue et ajouter un test : « + pièce » sur une facture à lignes ne change ni le montant ni les lignes. Option plus sûre : renvoyer à la fiche `onOpen` tant qu'aucun service « joindre » n'existe.

8. **D — CSS : collision possible.** Le bouton principal garde la classe `finance-op` (crochet du script `check-invoice-journey-emulator.mjs:1048-1057`). `finance.css:53` y met une grille, et `journal.css:88-91` ajoute `.finance-journal .finance-op` (même spécificité qu'un `.ops .ops-main`, dépend de l'ordre de chargement). Abandonner la classe racine `finance-journal` ou utiliser `:where` ; vérifier le style calculé en jsdom ou en capture.

9. **D — Contre-écriture : la date.** Le plan écrit `date: today` et « même forme que `TransactionDetails` ». Or `TransactionDetails.tsx:76` reprend la date du paiement d'origine (`{...p, id:'CONTRE-'+p.id, …}` sans changer `date`). Les deux restent valides (`financeService.ts:105` interdit seulement une date antérieure), mais choisir et tester. Pour un double toucher, générer l'id du paiement rapide une fois par ligne (comme `PaymentSheet`, `useState(idFor)`), pas à chaque clic.

10. **D — Orphelins.** Après uo et us, `FinancePeriodBar` (FinancePeriod.tsx), `journal-period-reading`, `finance-journal` et `journal.css` (hors Possède) ne sont plus utilisés ; à lister pour le pilote avec `CostComposition`.

## Vérifié
- Interface `TransactionJournal` : exports et props du plan identiques au code (`TransactionJournal.tsx:33-117`).
- `FinanceService.recordPayment` : refus de la date future, du dépassement de reste, de l'avoir imputé, du double « annulé » (`financeService.ts:22-27, 90-115`) ; `CONTRE-<id>` et `reversalOfId` exacts.
- `paymentState` : après contre-écriture l'état redevient `unpaid` (événements présents), comme dit au test 5.
- `check-invoice-journey-emulator.mjs` : dépend de `button.finance-op`, `.journal-date-toggle`, `#finance-tab-journal` ; le plan les garde.
- `v6b` : maquette sans titre « Opérations » ni ⚙ (voir `us/REVUE-B.md` n° 4, à traiter ensemble).

## Non vérifié
- Rendu, captures, thème cave, contraste.
- Contenu exact des 8 cas de `financeJournalUx` et `financeJournalDoublons` (non relus un par un).
- Hors ligne réel de `recordPayment` (`FirestoreRepo.put` et `adjustNumber`) : repris de l'existant, non rejoué.
- Que `finance-tag-*` fournisse les teintes pour `Local et travaux` et `Autres frais` en cave : les classes clair existent (`finance.css:73-77`), cave non lu.
