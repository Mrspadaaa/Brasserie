# PLAN — voie uo : port de v6b (Opérations), étape 1 (aucun code écrit)

HEAD du relevé : `a0d94832`. Maquette lue et ouverte : `p4/v6b/etat.html`, `NOTE.md`, `v6b-page.png`, `v6b-1280.png` (390 et 1280 vus).
Portée (L01) : l'onglet **Opérations** de Finances (`view==='journal'`), remplacé en entier par v6b. Rien d'autre n'est touché.

## 0. Défauts visés
Pas d'id de diagnostic : voie de port (COMMUN.md). Ce qui est visé est l'écart entre l'écran actuel et le choix du brasseur (règle n° 1) :
barre d'outils de 4 étages (période, recherche + catégorie, rail Courantes/Archives + puces, « Autres filtres »), en-têtes de jour,
lignes à 3 colonnes sans geste, aucun total par catégorie, aucun geste sur la ligne. Ses mots : « v5a … Beaucoup mieux mais plus compact
les lignes, mais quasiment parfait » (09.11). « Remplacer, jamais fusionner » : aucun bloc de l'ancien écran ne reste à côté.

## 1. Inventaire de la maquette (élément par élément, état par état)

| # | Élément v6b (classe) | Repris tel quel | Donnée réelle (source) | État / remarque |
|---|---|---|---|---|
| E1 | En-tête d'app, onglets Synthèse/Opérations/Prévisions/Annuel, nav du bas, bouton + | hors voie (App, FinancesTab) | — | existent déjà ; **non portés ici** |
| E2 | Pastille de mois `‹ novembre ›` (`v6b-pill`) | oui | `journal.month` ; `shiftMonth` (financeFormat) | mois courant : sans l'année ; autre année : « nov. 2025 ». Touche sur le nom = champ `type=month` natif (accessible, `aria-label="Période du journal"`, masqué par découpe, pas `display:none`) pour les sauts lointains ; `moisValide` de FinancePeriod conservé |
| E3 | Pastille « en retard 60,00 » (`v6b-due`, rouge) | oui | somme du reste à payer des écritures ouvertes dont `finance.dueDate < todayISO()` (toutes années, archives comprises : suivi) | affichée seulement si > 0 ; toucher = filtre `late` (les chasses de l'ancien rail y passent) |
| E4 | Loupe de recherche | **adaptée** | `journal.query` | la maquette met la loupe dans l'en-tête d'app (hors voie). Ici : loupe dans la bande, ouvre un champ de recherche sur une ligne (« Rechercher une opération », `Input` existant, ✕ pour effacer). Ouvert d'office si `query` non vide (demande venue de la synthèse ou d'une fiche). À lister (§7, D1) |
| E5 | Piles par catégorie (`v6b-piles`, 112 px mobile, 200 px à 1280) : Ventes ‖ Fixes, Brassage, Nettoyage ‖ Matériel | oui | **`periodeSynthese` (voie us, `src/domain/finance/periodeSynthese.ts`)** ; uo ne recalcule rien (§ 8, UO-1) | pile pleine = payé, hachurée = à payer ; valeur au-dessus, nom dessous ; une catégorie absente du mois n'a pas de pile. Piles = **le mois affiché, hors filtres** ; masquées en « Par date », en Archives et quand un exercice (`year`) ou un suivi élargit la période (§ 8, UO-3) |
| E6 | Légende « payé · à payer · dépensé » | oui | **`periodeSynthese`** (mêmes nombres que la Synthèse) | « payé » avec pastille multicolore, « à payer » hachurée, « dépensé ». « Payé » **hors matériel** : payé + à payer = dépensé (UO-2) ; l'écart avec la maquette (325,40 contre 296,80) est noté pour le brasseur |
| E7 | Groupes par catégorie toujours ouverts (`v6b-g`) : carré d'icône (20 px), nom, sous-total | oui | `CATEGORY_LABELS` ; icônes : maison, +, épi, goutte, cible (celles de la maquette, SVG repris) | ordre : Charges fixes, Ventes, Brassage, Nettoyage, puis une ligne pointillée et « Matériel · à part », puis « En retard · <année> ». Catégories réelles sans modèle (Local et travaux, Autres frais, Apports) : même gabarit, icône `lucide` à 14 px, teinte des jetons `finance-tag-*` existants (liste §7, D3) |
| E8 | Ligne d'opération en deux étages (`v6b-op`, 36 px) : liseré 4 px · nom + « · tiers » / état · pièce | oui | `description`, `transactionVendor`, `paymentState`, `finance.dueDate`, dernier paiement, preuve (§3.2) | mêmes hauteurs pour toutes les lignes, avec ou sans geste |
| E9 | Pastilles d'état : `✓ payé 9 nov. · banque` (vert), `à payer · 25 nov. · dans 16 j` (hachuré ambre), `à payer depuis le 20 déc. 2025` (rouge), `✓ encaissé …` | oui | §3.2 | exceptions du code actuel conservées dans la même pastille : « Reste X à payer/encaisser », « À encaisser », « Paiement à confirmer », « Paiement à vérifier », « Soldé », « Imputé », « Annulé » |
| E10 | Pièce : `facture` / `ticket` / `sans pièce` (icône 14 px, ambre si manquante) | oui | `sansJustificatif`, `sourceDocumentType`, `proofUpload` (§3.2) | l'« exemple » de la maquette (« Pièces jointes : exemple ») **n'est pas porté** : ce sont les vraies pièces |
| E11 | Geste noir `✓ Payé` (sortie) ou `✓ Encaissé` (entrée) (28 px) sur la ligne à payer du mois | oui | `FinanceService.recordPayment` | un toucher : reste dû, aujourd'hui, mode « banque » (hypothèse du geste rapide, écrite dans la pastille ; correction par la fiche) ; état « Paiement à confirmer » : ouvre la feuille de paiement (date à demander) — pas de date inventée |
| E12 | Geste discret `✓ Payé` (24 px, contour) sur la ligne en retard ; `+ pièce` (24 px) sur ligne sans pièce | oui | idem ; `+ pièce` → `onAddProof` | une seule action par ligne ; priorité : payer > pièce |
| E13 | État dessiné « après ✓ Payé » : fond vert clair, « ✓ payé aujourd'hui · banque », geste « Annuler » ; piles pleines, « à payer 0,00 » | oui | `CONTRE-<id>` (contre-écriture existante) | « Annuler » visible tant que le dernier paiement non annulé est daté d'aujourd'hui ; le fond vert dure 3 s |
| E14 | Pied : puce IA `✦ …`, `Par date`, `Filtres ⌄`, `Doublons`, `Apport ou prélèvement privé`, `Archives` | oui, mêmes mots | voir §2 | IA : voir E15 |
| E15 | Puce IA « ✦ Pourquoi les charges fixes pèsent autant ? » | **adaptée** | `FinanceAssistant` (existant, prépare une question, jamais d'envoi) | le composant garde son libellé du code (« Vérifier mes opérations ») ; il est posé dans le pied (prop `assistant`) au lieu de passer sous la liste ; question dynamique = D2 |
| E16 | `Par date` | **lecture à confirmer** | `allDates` | la maquette ne dessine pas son résultat. Lecture retenue par le pilote : **toutes les dates** classées par jour (en-tête de jour + total du jour), mois désactivé, piles masquées. Lecture étroite écartée (mois seul regroupé par jour) : écrite dans RESULTAT.md, testée comme variante (UO-6). Hook `journal-date-toggle`, `aria-pressed` |
| E17 | `Filtres ⌄` | oui (panneau) | états, périmètre, catégorie | panneau sous le pied : puces d'état avec comptes (`role=group`, « État des opérations », les mêmes que le code actuel), Courantes/Archives/Tout, sélecteur de catégorie, « Écritures annulées uniquement », « Retirer les filtres » |
| E18 | `Doublons` | oui | `ledgerDuplicates` | puce avec compte si > 0 ; la pastille dit le nombre ; un toucher filtre `doublon` ET montre la note « N écritures possiblement en double. Rien n'est supprimé… » + « Ce n'est pas un doublon » (garde AM n° 7 conservée, `data-testid="journal-duplicates"`) |
| E19 | `Apport ou prélèvement privé` | oui | `onPrivateMovement` | puce du pied ; caché en mode Archives (comme aujourd'hui) |
| E20 | `Archives` | oui | scope `archives`, `ArchiveManagerSheet` via `onManageArchives` | puce bascule le périmètre ; en mode Archives : sélecteur « Année archivée » et « Gérer les archives » apparaissent sous le pied |
| E21 | Fiche d'une opération = toucher la ligne | oui | `onOpen` | inchangé |
| E22 | 1280 : piles à gauche (400 px, collées), liste à droite | oui | media query ≥ 900 px | la bande `.v6b-left` sticky ; mêmes valeurs |
| E23 | Thème cave (sombre) | **à dessiner** | jetons `--cave-*` | la maquette n'a que le clair ; couleurs de rôle (liserés, piles) en valeurs fixes, texte et fonds en jetons (même parti que `previsions.css`), contraste mesuré en étape 2 |

États de l'écran à capturer (étape 2, 390 tactile et 1280, clair et cave, `?dev-local&finance-demo`) : mois normal (maquette) ·
après ✓ Payé + Annuler · Par date · Filtres ouvert · recherche ouverte · Archives · liste vide (« Aucune opération trouvée ») ·
doublons · pagination · mois sans ventes · avoir et annulée.

## 2. Changements (fichier, fonction)

Fichiers **possédés** : `src/ui/finance/TransactionJournal.tsx` (réécrit, mêmes exports), `TransactionRow.tsx` (réécrit),
`src/ui/finance/operations/**` (neuf), `src/ui/finance/operations.css` (neuf), `tests/integration/operations*.test.tsx` (neufs),
les 5 tests d'intégration du journal (adaptés, §4). `journal.css` n'est **pas** dans Possède : il reste chargé tel quel (FinancesTab
utilise `journal-chip`, `FinancePeriod` `finance-period`) ; plus aucun de ses sélecteurs ne s'applique au nouvel écran, sauf `journal-chip` du pied.
Le CSS mort de `journal.css` (rail, toolbar, jour…) est listé pour nettoyage (§7).

### 2.1 `operations/calculs.ts` (pur, testé d'abord)
- `categorieDeLigne(t)` : catégorie **de l'écriture** pour ranger une ligne dans un groupe de la liste (une facture mixte paraît une seule fois, sous `tx.category`) ; aucun montant n'en dépend. Le « matériel à part » de la **liste** appelle le prédicat de `periodeSynthese` (même règle que les piles).
- ~~`pilesDuMois`~~ **supprimée** : les piles et la légende viennent de `periodeSynthese({transactions, payments, mois, aujourdhui})` (voie us), appelée avec `mois` du journal, sur **toutes** les écritures (pas sur la liste filtrée). `operations/piles.ts` ne fait que mettre ses `postes` en hauteurs (règle de trois sur les centimes).
  ventilée si `finance.lines` existe, sinon la catégorie de l'écriture). Entrées = celles affichées dans les groupes de catégorie.
- `retard(entrees, today)` → `{ totalCents, parAnnee }` : actives, `paymentState` unpaid/partial, `dueDate < today`.
- `echeanceLabel(dueISO, today)` → « 25 nov. · dans 16 j » / « aujourd'hui » / « depuis le 20 déc. 2025 » / « sans échéance » (jamais 0 jour inventé).
- `paiementRapide(tx, etat, today, id)` → `FinancialPayment | null` : `null` si état `unknown` (date à demander) ou reste 0 ; sinon `{amountCents: remaining, date: today, method:'bank', direction, recordedAt}`.
- `contrePaiement(p)` → `{…p, id:'CONTRE-'+p.id, direction inversée, reversalOfId:p.id, note}` avec **la date du paiement d'origine** (comme `TransactionDetails.tsx:76` ; B9). L'id du paiement rapide est tiré **une fois par ligne** (`useState(idFor)`, comme `PaymentSheet`).
- `dernierPaiementAnnulable(tx, payments, today)` : dernier paiement non annulé dont `date === today`, sinon `null`.

### 2.2 `operations/*.tsx`
`Bande.tsx` (pastille mois, pastille retard, loupe, `PilesSvg`/piles CSS, légende), `Groupe.tsx` (en-tête de catégorie ou de jour), `Pied.tsx` (puces),
`PanneauFiltres.tsx` (états + périmètre + catégorie), `NoteDoublons.tsx`. Classes préfixées `ops-` (L26), variables `--ops-*`.

### 2.3 `TransactionJournal.tsx`
- **Interface conservée telle quelle** : props `transactions, payments, archives, request, state, onStateChange, renderRow, onManageArchives, onPrivateMovement, onScopeChange` ;
  exports `sansJustificatif`, `createJournalState`, `JournalState`, `JournalRequest`, `JournalScope`, `JournalFilter`. Les tests passent un `renderRow` factice et ignorent les props en trop (`onSale`).
- **Ajouts optionnels, rétro-compatibles** : prop `assistant?: ReactNode` (E15) ; champ optionnel `JournalState.page` inchangé. Aucun nouveau champ d'état : « Filtres ouverts » et « loupe ouverte » sont de l'état local d'écran.
- La logique de sélection (`bases`, `matchesState`, `counts`, `filtered`, doublons écartés, demande `request`, scroll de puce, pagination 50) est **déplacée, pas réécrite** ; seul le rendu change.
- Rendu : bande → groupes (catégorie, mois) ou jours (Par date) → pagination → pied → panneau.
- Retard hors du mois : une écriture ouverte et en retard dont la date n'est pas le mois affiché passe dans « En retard · <année> » (hors piles, dans la pastille) ; ouverte non échue hors mois : dans son groupe de catégorie avec sa date dans la pastille (règle actuelle conservée : une pièce ouverte reste visible).
- `Matériel · à part` : le prédicat de `periodeSynthese` (lignes `equipment` non passées en charge, ou catégorie `materiel`/`renovation` sans lignes), pas une règle de uo. `Ventes` = `recettes`. `Apports` : groupe sans pile. Ordre des lignes d'un groupe : tri actuel (date décroissante, `recordedAt` décroissant, id) (UO-9).

### 2.4 `TransactionRow.tsx`
Props actuelles inchangées (`transaction, transactions, payments, state, onOpen`) + optionnelles `onAddProof?`, `onPay?` (feuille complète pour l'état « à confirmer »).
Une `div.ops-row` (grille liseré · texte · geste · montant) ; le bouton principal `button.ops-main` (classe `finance-op` gardée comme crochet, voir §4) porte
nom, tiers, état, pièce ; son `::after` couvre la ligne (zone de toucher), le geste est un second bouton au-dessus (pas de bouton dans un bouton).
Nom accessible : `description · catégorie · tiers · montant · état` (format actuel). Le montant reste en `aria-hidden`.
Écriture : `FinanceService.recordPayment(paiementRapide(...))` ; erreur affichée sur la ligne (`role=alert`), double clic bloqué (`busy`) ; « Annuler » = `contrePaiement`.

## 3. Règles de calcul

### 3.1 Piles et légende (les nombres viennent du domaine)
Les piles et la légende ne sont **pas calculées ici** : `periodeSynthese` (us) fait foi, `uo` l'importe. Invariants repris et testés côté uo : la somme des postes = la somme des montants au centime, payé + à payer = dépensé, une annulée n'entre ni dans une pile ni dans un sous-total, une facture à 26 lignes compte une fois.
Les sous-totaux de groupe de la **liste** (par écriture) se somment sur les lignes affichées ; ils peuvent différer d'une pile pour une facture mixte (reliquat, lignes d'une autre catégorie) : une facture mixte paraît une fois, sous sa catégorie d'écriture.
- légende (valeurs de `periodeSynthese`) : « payé » hors matériel, « à payer » = reste, « dépensé » = payé + à payer ; la pile Matériel garde sa valeur propre. Test : payé + à payer = dépensé sur la fixture, avant et après ✓ Payé.
- un montant inconnu n'est jamais 0 : état « Paiement à confirmer » = ni payé ni à payer dans les piles, ligne « à confirmer » dans la légende s'il y en a ; pièce sans date : « Date à vérifier », hors piles du mois, dans un groupe « Sans date ».
- Ventes : `recettes` ; payé = encaissé (hachure = à encaisser). Pas de signe − sur les piles, `+` sur Ventes.
- Centimes entiers partout (`transactionAmount`), formatage `amountOnly` / `formatCHF`, aucun arrondi flottant.

### 3.2 État et pièce d'une ligne
- état : `settlementLabel` (code actuel) + date du dernier paiement (`shortDate`) + mode (`bank`→banque, `cash`→espèces, `twint`→TWINT, `other` : rien) ; « payé aujourd'hui » si la date est celle d'aujourd'hui.
- pièce : `sansJustificatif` → « sans pièce » ; sinon type (`sourceDocumentType` : `invoice`→facture, `receipt`→ticket, `credit_note`→avoir ; absent → « pièce ») + détail « · Pilsner 25 kg » si une seule ligne `finance.lines` avec quantité et unité ; `proofUpload` queued/failed : « envoi en cours » / « à renvoyer » (jamais « sans pièce » à tort, règle de `sansJustificatif`).

## 4. Tests qui échouent d'abord (fixtures, aucun Gemini, aucun réseau)

Nouveaux, `tests/integration/operationsCalculs.test.tsx` (purs) :
1. fixture v6b (6 opérations de novembre + Solde atelier 2025, dates « aujourd'hui = 9 nov. ») → `pilesDuMois` = payé 32540, à payer 40000, dépensé 69680 ; après paiement du loyer : 72540 / 0 / 69680.
2. `retard` : 6000 en 2025, `parAnnee` = {2025: 6000} ; loyer échéance 25 nov. : pas en retard.
3. `echeanceLabel('2026-11-25','2026-11-09')` = « 25 nov. · dans 16 j » ; échéance passée ; vide → « sans échéance ».
4. `paiementRapide` : montant = reste, date = aujourd'hui, `null` pour `unknown` ; pièce partiellement payée : montant = reste seul.
5. `contrePaiement` : id `CONTRE-…`, sens inversé, même montant ; rejouée par `FinanceService.recordPayment` sur fixture mémoire : état redevient `unpaid` ; second « Annuler » refusé (« déjà annulé »).
6. Matériel et rénovation vont « à part » ; un avoir fournisseur diminue la pile ; ligne ventilée : chaque ligne dans sa catégorie.

`tests/integration/operationsEcran.test.tsx` (rendu, `TransactionJournal` + vraie `TransactionRow`) :
7. mois de la fixture : 5 groupes + « En retard · 2025 », 7 lignes ; ordre des groupes ; sous-totaux 468,00 / +720,00 / 186,80 / 42,00 / 28,60.
8. « ✓ Payé » sur le loyer → paiement écrit (`financialPayments`), « payé aujourd'hui », « Annuler » visible, « à payer 0,00 » ; Annuler → retour à « à payer · 25 nov. ». Double clic = un seul paiement.
9. ligne « Paiement à confirmer » : le geste ouvre la feuille (`onPay`), aucun paiement écrit.
10. Par date : en-têtes de jour, mois désactivé ; Filtres : comptes des puces ; Doublons : note + « Ce n'est pas un doublon » ; Archives : « Année archivée ».
11. une seule action par ligne ; hauteur de ligne identique avec et sans geste (style calculé : même `min-height`) ; zone du geste ≥ 24 px (B12).

Tests existants **adaptés** (leurs données et attentes de logique restent ; seuls les sélecteurs du rendu changent) :
`financeJournalUx` (6 cas : « Toutes les dates » → « Par date », puces d'état dans le panneau « Filtres » ouvert d'abord, catégorie dans le panneau, recherche via la loupe),
`financeArchives` (« Autres filtres » → « Filtres » ; « Archives » puce du pied ; pagination inchangée), `financeJournalDoublons` (cliquer « Doublons » avant la note ;
la puce garde « Doublons possibles » + 27), `financeJournalDoubleSomme` (le texte du journal ne répète plus les sommes ; à relire contre la nouvelle bande), `ta2-compteur`
(`.finance-period-count` : le compteur d'opérations n'existe plus tel quel dans la maquette : il devient le sous-total du groupe ; test réécrit sur le sous-total, voir D5).

## 5. Appelants hors Possède (grep `src/ tests/ scripts/`, rejoués sur HEAD)

Rejeu HEAD : `npx vitest run` sur les 8 fichiers ci-dessous = **8 fichiers, 51 tests verts** (`voies/uo/tests-head.txt`).

| Appelant | Ligne | Usage | Change ? |
|---|---|---|---|
| `src/components/tabs/FinancesTab.tsx` | 22–23, 61–62, 98, 108, 112, 141 | `TransactionJournal` (mêmes props), `TransactionRow` (props actuelles), `createJournalState`, `JournalRequest` | **non** (interface gardée) ; **besoins** : voir §7 N1, N2 — pas dans Possède, listés |
| `src/ui/finance/FinanceOverview.tsx` | 4, 17 | `type JournalRequest` (`filter: 'due'`, `'unknown'`, `'late'`…) | non : type conservé tel quel |
| `src/ui/finance/PieceDejaSaisie.tsx` | 18 | commentaire seul (« le mot court du règlement, celui du journal ») | non ; les mots courts « Payé / À payer / Reste … / Paiement à confirmer » sont conservés dans l'état de ligne |
| `src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/Pages.tsx` | 1433 / 28, 43 | prop `sansJustificatif` d'un autre composant | non (faux positif du nom) |
| `tests/integration/financeArchives.test.tsx` | 12, 39, 80 | `TransactionJournal` + `renderRow` factice, « Autres filtres », « Archives », pagination | **adapté** |
| `tests/integration/financeJournalUx.test.tsx` | 5 + 8 cas | puces d'état, « Toutes les dates », recherche, catégorie, `request` | **adapté** |
| `tests/integration/financeJournalDoublons.test.tsx` | 5, 24, 31–56 | note de doublon, puce « Doublons possibles » | **adapté** |
| `tests/integration/financeJournalDoubleSomme.test.tsx` | 5, 34 | texte total (pas de double somme) | **à relire** |
| `tests/unit/depense/onglets/ta2-compteur.test.tsx` | 7, 23 | `.finance-period-count` | **adapté** (D5) |
| `tests/integration/financeWorkspace.test.tsx` | 37–44, 53 | passe par `FinancesTab` : `Rechercher une opération`, puce `À payer` `aria-pressed`, `Achat mixte` « Paiement à confirmer » | **à adapter** : le bouton de ligne doit contenir « Paiement à confirmer » (c'est prévu : état dans le bouton principal) ; la puce `À payer` est dans le panneau Filtres (ouvrir d'abord) |
| `tests/ux-mobile/financePeriodDrilldown.test.tsx` | 89 | `[data-finance-period-operations]` | non (autre écran : le détail de période) |
| `tests/ux-mobile/finance.browser.mjs` | 133, 139 | idem (autre écran) | non |
| `scripts/check-invoice-journey-emulator.mjs` | 1048–1057 | `button.finance-op`, `.journal-date-toggle[aria-pressed="false"]`, `#finance-tab-journal`, aria-label qui commence par la description | **gardé compatible** : le bouton principal garde `finance-op`, « Par date » garde `journal-date-toggle`, onglet inchangé ; **non rejoué** (émulateur Firebase + Chrome, hors poste de la voie) |
| `scripts/agents/inventaire-ecrans.mjs` | 128 | liste de fichiers de l'écran `journal` | à compléter par le pilote avec `src/ui/finance/operations/**` et `operations.css` |

Autres contrôles à rejouer en étape 2 : `controle-choix.mjs` (D105), `controle-teinte.mjs` (D106) si l'écran est au registre ; `npx tsc --noEmit` hors firebase-admin ; `npx vite build`.
Le CSS global `finance.css` (`.finance-op*`, `.finance-status`, `.finance-row`, `.finance-list`) sert d'autres écrans (TransactionDetails, TaxWorkspace, UpgradeWorkspace…) : **aucune règle n'y est modifiée** ; l'écran neuf se protège par `.ops …` plus spécifique et un reset de `.finance-op` dans `operations.css`.

## 6. Risques

- **Argent** : « ✓ Payé » écrit un paiement en un toucher. Garde-fous : reste dû exact (jamais un montant saisi), date du jour (jamais future, `validateFinancialPayment`), mode « banque » = défaut de la feuille actuelle, **contre-écriture** disponible le jour même, refus si état `unknown`, double clic bloqué, échec du service montré sur la ligne, pièce annulée/avoir imputé sans geste. Sans réseau : `FirestoreRepo.put` est la file hors ligne actuelle, rien de nouveau.
- **Données existantes** : aucune écriture de schéma ; lecture seule des champs actuels ; écritures sans `dueDate` ni date : libellés honnêtes (« sans échéance », « Date à vérifier »), jamais 0.
- **Arrondis** : tout en centimes entiers ; une pile n'a jamais de hauteur calculée sur des flottants (ratio de centimes). Un total de groupe = somme des lignes affichées (test).
- **Hors ligne** : l'écran lit les mêmes magasins ; rien d'asynchrone nouveau.
- **Performance** : mêmes `useMemo` qu'aujourd'hui, `paymentState` calculé une fois par écriture et passé à la ligne (commentaire existant conservé) ; piles calculées sur la liste déjà filtrée (une passe).
- **Tests existants** : 5 fichiers à adapter ; une adaptation ne supprime aucune garde (doublons, archives, suivi des factures d'avant, pagination, recherche).
- **Thème cave** non dessiné par la maquette : contraste à mesurer (étape 2), captures ouvertes (L12).
- **Algorithme** : pas d'algorithme non trivial (sommes, bornes de date, pas de géométrie ni image) ; L29 : pas d'« État de l'art » à écrire. Hauteur des piles = règle de trois sur des centimes.

## 7. Décisions et besoins (pour le pilote, la voie ne les tranche pas seule)

- **D1 — Recherche.** La maquette met la loupe dans l'en-tête d'app. Défaut retenu : loupe dans la bande (aucun changement hors voie). Option : le pilote relie l'en-tête à `journalState.query` (App/FinancesTab).
- **D2 — Puce IA.** Défaut : `FinanceAssistant` actuel dans le pied (« Vérifier mes opérations »). La question dynamique de la maquette (« Pourquoi les charges fixes pèsent autant ? », tirée de la catégorie dominante) demande de modifier `FinanceAssistant.tsx` (hors Possède).
- **D3 — Catégories sans modèle** : « Local et travaux » (`renovation`) rangé « Matériel · à part » ; « Autres frais » après Nettoyage ; « Apports » sans pile. Teintes des liserés : dérivées des jetons `finance-tag-*` (non dessinées). À montrer au brasseur si un doute.
- **D4 — Légende** : « dépensé » exclut le matériel, « payé » l'inclut (nombres de la maquette). Défaut : tel quel (99 %), noté dans le test.
- **D5 — Compteur** `.finance-period-count` (« 3 opérations ») : absent de la maquette, remplacé par les sous-totaux de groupe. Le test `ta2-compteur` suit.
- **D6 — `+ pièce`** : aucune fonction « joindre une pièce après coup » dans `FinanceService` ; `EditTransactionModal` a un champ fichier (`type="file"`, l. 331). Défaut : `onAddProof` si fourni, sinon la fiche (`onOpen`).
- **D7 — Pas de « ✓ Payé » en un toucher sur un paiement partiel dont le reste est > 0 et dû plus tard ?** Défaut : autorisé (le reste est le montant) ; recommandation : oui.
- **N1 (FinancesTab, voie us)** : passer `onAddProof={()=>setEditing(t)}` et `onPay={()=>setPaying(t)}` dans `row()` (l. 112) ; passer `assistant={financeAssistant}` à `TransactionJournal` et **retirer** `{financeAssistant}` après lui (l. 141) pour qu'il ne reste pas à côté.
- **N2** : `scripts/agents/inventaire-ecrans.mjs` l. 128 (fichiers de l'écran). Nettoyage de `journal.css` (rail, toolbar, jour, extra, empty) quand plus personne ne l'utilise : à faire après la voie us.
- **Hors périmètre** : fiche `TransactionDetails`, feuilles de saisie, Synthèse, Prévisions, Annuel, `FinancePeriod.tsx`, `finance.css`, `financeFormat.ts`, `CategoryTag.tsx`, tout schéma Firestore, tout appel Gemini, la fonction « joindre une pièce » (D6), la vue dessinée du thème cave au-delà du port.

## 8. Corrections après revue (09.11) — constat par constat

Décisions du pilote (`DECISIONS.md`) : D1 à D6 et « Par date » retenues ; piles et légende = `periodeSynthese` de la voie us. Le corps du plan ci-dessus est corrigé
aux lignes concernées (E5, E6, E11, E16, § 2.1, § 2.3, § 3.1) ; ce tableau dit pour chaque constat s'il est retenu ou écarté.

| Constat | Verdict | Raison et changement |
|---|---|---|
| A UO-1 (B) deux « dépensé » | **retenu** | `operations/` n'a plus de `pilesDuMois`. Elle importe `periodeSynthese` (us). Test d'égalité Synthèse / Opérations sur la fixture et sur un cas avec ouverte d'un autre mois. **Attente** : le fichier n'existe pas au moment de la correction ; la barre du mois ne se code qu'une fois présent avec ses tests verts |
| B 6 (G) même règle redéfinie | **retenu** | même réponse que UO-1 ; `categorieDeLigne` ne sert plus qu'à ranger les lignes de la liste |
| A UO-2 (G) « payé » inclut le matériel | **retenu** | légende : payé hors matériel, payé + à payer = dépensé ; test avant et après ✓ Payé ; l'écart avec la maquette (325,40 contre 296,80, 725,40 contre 696,80) va dans RESULTAT.md pour le brasseur. Remplace D4 |
| A UO-3 (G) piles sur la liste filtrée | **retenu** | piles = mois affiché, hors filtres ; masquées en Par date, Archives, exercice ; tests « même pile avec et sans filtre », « absente en Archives » (table ci-dessous) |
| A UO-4 (G) « ✓ Payé » pour une vente, banque | **retenu** | libellé « ✓ Encaissé » pour une entrée ; mode « banque » dit dans la pastille, présenté comme hypothèse du geste rapide dans RESULTAT.md ; après le jour, la correction passe par la fiche (la ligne payée un autre jour n'a pas d'« Annuler ») ; test vente non encaissée → paiement `in` |
| A UO-5 (G) et B 1 (B) filtre actif invisible | **retenu** | pastille « Retirer le filtre : À payer » dans la bande, hors panneau, pour tout filtre ≠ `all`, pour la recherche et la catégorie ; compte sur « Filtres ⌄ » ; la puce choisie est amenée à l'écran à l'ouverture (`scrollIntoView` conservé). Tests : arrivée `payable`, `due`, `unknown`, `review`, `late` panneau fermé |
| B 2 (B) `year`, `followingUp`, `archiveYear`, `periodLabel` | **retenu** | table état → affichage ci-dessous ; la pastille de mois dit « Exercice 2026 », « Tous les exercices », « Archives 2025 » comme `periodLabel` aujourd'hui |
| A UO-6 (G) « Par date » | **écarté** (décision du pilote) | lecture large conservée ; la lecture étroite est écrite dans RESULTAT.md avec un test de chaque ; « Toutes les dates » n'a pas d'autre bouton |
| A UO-7 (G) et B 7 (G) « + pièce » | **retenu comme limite** | D6 du pilote tenue : `onAddProof` → `EditTransactionModal` (pièce en base64 `legacy-inline`, `amountCents` recalculé en flottant) ; écrit en limite dans RESULTAT.md. Test uo : « + pièce » appelle `onAddProof`, n'écrit rien. Test « ne change ni montant ni lignes » : hors Possède (modale), proposé au pilote. Sans `onAddProof` : la fiche. Une vente sans pièce n'est pas ambre (gris) ; une charge sans pièce l'est : question au pilote |
| A UO-8 (D) FinancesTab non verrouillé | **retenu** | un test d'intégration passant par `FinancesTab` : l'assistant une seule fois (dans le pied), « Paiement à confirmer » ouvre la feuille ; rejoué quand us a livré FinancesTab |
| A UO-9 (D) ordre des lignes | **retenu** | tri actuel (§ 2.3) ; test du sous-total de groupe = somme des lignes |
| A UO-10 (D) date des tests | **retenu** | `vi.setSystemTime('2026-11-09T10:00:00')` dans chaque test d'écran et de calcul |
| A UO-11 (D) `type="month"` | **retenu** | dit dans RESULTAT.md : sans sélecteur natif (Firefox bureau) le champ est un texte ; ‹ › reste le chemin principal |
| B 3 (B) ventilation, reliquat, facture mixte | **retenu** | reliquat et ventilation par ligne = `periodeSynthese` (invariant « somme des postes = somme des montants »). Dans la liste, une facture mixte paraît **une seule fois**, sous `tx.category`. Test (modèle `financeJournalDoubleSomme` avec reliquat) |
| B 4 (G) garde TA2 / double somme | **retenu** | deux tests ajoutés avant toute adaptation : « une annulée n'entre ni dans une pile ni dans un sous-total » ; « une facture à 26 lignes = un sous-total de 110,40, jamais 220,80 sauf 26 écritures distinctes en plus » ; l'avoir et l'annulée ont leur capture |
| B 5 (G) appelants oubliés | **retenu** | `tests/integration/mobileDailyViews.test.tsx` (l. 113-120, 128-130 : champ de recherche visible, « Période du journal », « Archives », recherche conservée après Prévisions/Annuel) et `tests/ux-mobile/financePeriodDrilldown.test.tsx` rejoués sur HEAD (§ 5 bis). `financeWorkspace` et `mobileDailyViews` ne sont pas dans mon Possède et `financeWorkspace` est à us : les lignes à changer leur sont remises, jamais éditées ici. Pour limiter la casse : la loupe s'ouvre toute seule si `query` est non vide, et garde sa valeur quand on quitte l'onglet (état du journal inchangé) |
| B 8 (D) collision CSS | **retenu** | la classe racine `finance-journal` est abandonnée (racine `ops`) ; `journal.css` ne s'y applique plus ; reset de `.finance-op` par `.ops .ops-main.finance-op` (spécificité plus forte) ; style calculé vérifié par test et par capture |
| B 9 (D) date de la contre-écriture | **retenu** | date du paiement d'origine (§ 2.1) ; id rapide tiré une fois par ligne |
| B 10 (D) orphelins | **retenu** | à lister pour le pilote : `FinancePeriodBar`, `journal-period-reading`, `finance-journal`, `journal.css`, `CostComposition` |

### Table état → affichage (B 2)
| Cas | Période (pastille) | Piles | Groupes |
|---|---|---|---|
| `scope=current`, mois, `filter=all` | mois | oui (mois) | catégories |
| idem + filtre d'état, recherche ou catégorie | mois (+ pastille « Retirer le filtre ») | oui, inchangées | catégories |
| `scope=current` + filtre de suivi (`due late payable receivable review unknown proof undated doublon`) | « Tous les exercices » | non | catégories sur toutes les dates (suivi) |
| `allDates` (Par date, ou demande de la Synthèse) | « Toutes les dates » | non | jours |
| `year` renseigné (Annuel) | « Exercice 2026 » | non | catégories |
| `scope=archives` | « Archives 2025 » ou « Toutes les années archivées » | non | catégories |
| `scope=all` | « Toutes les dates » | non | jours |
| écriture sans date | — | hors piles | groupe « Date à vérifier » |

### 5 bis. Appelants ajoutés
`tests/integration/mobileDailyViews.test.tsx`, `tests/ux-mobile/financePeriodDrilldown.test.tsx` : rejeu sur HEAD dans `tests-head.txt` (section ajoutée à l'étape 2). Le « 51 verts » de l'étape 1 comptait
`financeQuickActions` et `bDiversJournal` qui n'exercent pas le journal : ils ne servent plus de preuve.

### Tests ajoutés par la revue (rouges d'abord)
12. égalité Synthèse / Opérations (`periodeSynthese` appelée par les deux) sur la fixture et sur un cas avec ouverte d'un autre mois.
13. payé + à payer = dépensé avant et après ✓ Payé.
14. mêmes piles avec et sans filtre ; absentes en Archives, Par date et exercice.
15. vente non encaissée : libellé « ✓ Encaissé », paiement `in`.
16. arrivée par `request` (`payable`, `unknown`, `late`) : pastille « Retirer le filtre » visible, panneau fermé.
17. annulée : ni pile ni sous-total ; facture à 26 lignes : 110,40 une fois.
18. facture mixte : une ligne, sous `tx.category` ; sous-total = somme des lignes.
19. `FinancesTab` : l'assistant une seule fois ; « Paiement à confirmer » ouvre la feuille.
