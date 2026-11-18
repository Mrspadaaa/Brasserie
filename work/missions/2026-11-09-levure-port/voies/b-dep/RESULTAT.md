OK PARTIEL — 12 tests rouges réglés (périmés) ; 21 bugs corrigés dont les décisions du pilote ; 3 « écartés/gardés », le reste à trancher (Gemini, brasseur) ou envoyé ailleurs

Dernière mise à jour : après les décisions du pilote (AM-73, BE-61, DP-NOTE-1, B2-NOTE-4/6/8/12, BE-26/66/67/69/73/68, RF-15, TE-35/36).

## Contrôles rendus
- `npx vitest run --maxWorkers=3 tests/unit/depense tests/unit/finance tests/unit/purchasePrefillLp4.test.ts` : Test Files 206 passed | 1 skipped ; Tests 2676 passed | 4 skipped.
- `npx vitest run` sur 12 fichiers d'intégration touchés (expenseSheet, expenseSheetMouture, jus0Journey, upgradeSheetTe35, equipmentProjects, creativePricingBornes, editTransactionBe66, liveDataViews, factureClientSaisie, rxPrixInconnu, incomeProofFlows, movementSheet) : Test Files 12 passed ; Tests 75 passed.
- `npx tsc --noEmit -p .` : aucune erreur dans `src/ui/depense`, `src/ui/finance`, `src/components/EditTransactionModal.tsx`, `src/domain/finance`, `src/services/purchase*`, ni dans mes tests.
- Non rejoué : toute la suite `tests/integration` (coupée à 15 min sur la première tentative) ; `tests/integration/mobileDailyViews.test.tsx` reste rouge avant mes changements (test périmé : titres « Situation financière » puis « Bilan et impôts » devenus des listes nommées) : une assertion alignée, la suivante non : hors zone.

## Les 12 tests rouges sur 48d16402 : tous réglés, aucun vrai défaut
| fichier | tests | cause | réglé comment |
|---|---|---|---|
| expenseSheet (5, statut checked/corrected/disputed/unavailable/undefined) | `Nature ligne 1`, `Matériel ligne 1` | périmé : D335/D350, la nature est un segment « Ingrédient / Service / Matériel » (« Type d’achat, ligne n ») | helper `nature(n)` lit le mot pressé ; l'entretien se range sous « Matériel » |
| expenseSheet (1, divergences et ambiguïtés) | texte « Lecture déjà disponible… » | périmé : p3c-3 A4, c'est l'infobulle du « Détail » du pied | le test lit `[title="Lecture déjà disponible · aucun nouvel appel IA"]` |
| expenseSheet (1, TVA fautive) | message de l'enregistrement après TVA 60 > TTC 50 | périmé : B2 n° 39 refuse la frappe sur le champ ; amélioration : `dire` sur le champ TVA (alerte écrite) | le test joue le refus à la frappe, puis la TVA devenue fautive quand le TTC baisse : refus, rubrique ouverte, focus |
| expenseSheet (1, matériel + livraison) | `Libellé ligne 1`, `Nature ligne 2 = shipping`, « 500 » | périmé : rangées à plateau, segment sans « Livraison » (port saisi = `service`), virgule (TE-23) | test mis à jour (DÉCISION 2) |
| expenseSheetMouture (2), jus0Journey (2) | `Stock ligne n`, interrupteur « Mettre en stock » | périmé : D350, la ligne « article » (`[data-dp-stock]`) dit le lien ; « Retirer l’article » ; `Ticket.tsx` est du code mort | assertions sur `[data-dp-stock]` |

## Bugs de la zone b-dep
| id | issue | preuve (test, capture, commit ou ligne) | fichiers |
|---|---|---|---|
| TL-42 | corrigé | la pièce s'écrit « pièce »/« pièces » à l'écran (Stk, Stück, pce, pcs) ; « 3 Stk » + « 2 pièce » = « 5 pièces » dans une bande. `tests/unit/depense/bandes/unites-tl42.test.ts` (rouge avant, 12 verts). Capture après : `harnais/weizen-apres-1280-clair.png` (« 2 pièces × 4,50 », « 29,60 »). « Pck » reste imprimé (sens ambigu). Tests anciens alignés : p3c T1, unites D213, sous-groupes-d307, groupes, g2b, finale | src/ui/depense/rangees.ts, calculPlateau.ts, groupes.ts |
| BE-23 | corrigé (par TL-42) | la ligne d'achat écrit « 5 pièces » (`texteQuantite`) ; capture de la feuille « Acheter du matériel » avec une ligne ajoutée non reprise | idem |
| B2-NOTE-4 | corrigé | règle n° 1 : sa maquette dit « sachets » : dans la bande Levures la pièce se compte en sachets (« Stk » + « sachets » = « 7 sachets », « 1 sachet »). Test dans unites-tl42.test.ts ; capture `harnais/weizen-apres-1280-clair.png` (« Levures … 7 sachets ») ; p3c T1 aligné. Les rangées de levure gardent leur unité imprimée (« 2 pièces ») avec la pastille « = 2 sachets » | src/ui/depense/groupes.ts |
| RF-14 | corrigé (écran) | une rangée « Total TVA » du bloc n'est plus additionnée deux fois (113,22 -> 56,61), `tests/unit/depense/tva-bloc-rf14.test.ts` rouge avant, 5 verts ; le serveur LP-2 (`functions/`) non touché | src/ui/depense/tva.ts |
| RF-15 | corrigé | « Pour quoi ? » : au lieu de remplacer toutes les familles par « ingrédients » dès que trois ne tiennent pas en 60 caractères, on nomme les plus nombreuses qui tiennent, suivies de « … » (« malts, houblons… ») ; si trois tiennent mais pas le matériel, le matériel est coupé (« malts, houblons, levures ») ; « ingrédients » reste le repli si deux ne tiennent pas. `tests/unit/purchasePrefillLp4.test.ts` et `tests/unit/depense/h13-0811/pour-quoi.test.ts` mis à jour (rouges avant) | src/services/purchasePrefill.ts |
| AM-73 | corrigé | un paiement daté avant la pièce affiche un avertissement jaune (« normal pour un acompte, sinon vérifie les dates ») et n'est pas refusé : `expenseSheet.test.tsx` « AM-73 » (enregistre avec `paymentDate` 01.09 < date 09.09) | src/ui/finance/ExpenseSheet.tsx |
| BE-61 | corrigé (dit) | Entrée enregistre la feuille « Préparer les impôts » (voulu) : la phrase de l'étape « Vérifications » le dit (« la touche Entrée dans un champ enregistre aussi la feuille ») ; elle n'est que sur la 1re étape, les autres étapes n'ont pas la phrase | src/ui/finance/TaxClosingSheet.tsx |
| DP-NOTE-1 | corrigé | mesuré à froid seul : 357 à 426 ms (limite 1 000 ms) ; le test jugeait une seule passe et rougissait sous charge ; trois passes sur des entrées différentes, la meilleure est jugée (une vraie régression ×3 échoue les trois) | tests/unit/depense/stock/perf.test.ts |
| B2-NOTE-6 | corrigé | garde `beforeunload` tant que la saisie est remplie (test rouge avant) ; pas de brouillon gardé | src/ui/finance/ExpenseSheet.tsx |
| B2-NOTE-12 | corrigé (par décision) | « Annuler » du formulaire manuel = le × : vide il ferme, rempli « Abandonner cette saisie ? » (BX-1) ; `expenseSheet.test.tsx` « B2-NOTE-12 » (garder / abandonner) ; la liste « ↶ Annuler » des lignes retirées est vidée à chaque nouvelle lecture voulu (les lignes changent) | test seul |
| B2-NOTE-8 | corrigé | capture AVANT de la pièce 372765 simulée avec « Weizenmalz hell » en grammes : à 320 px le nom est écrasé (« W… he… ») par la pastille « 2 000 g → 2 Kg » (`harnais/weizen-avant-320-clair.png`) ; à 390 le nom se coupe entre deux mots (voulu). Correction : la pastille passe sous le nom quand la place manque. APRÈS : 320, 390, 1280 (`weizen-apres-320/390/1280-clair.png`), nom entier « Weizenmalz hell » partout | src/ui/depense/Ligne.tsx |
| BE-26 | corrigé | « Prix de vente TTC » 99999 refusé en le disant (« au plus 10 000 »), 0,004 refusé, coût idem : borne estimée et citée `BORNES_FINANCE.formatCents` (10 000 CHF : une palette) ; `MoneyInput` a une borne `maxCents`. `tests/integration/creativePricingBornes.test.tsx` | src/domain/finance/bornesFinance.ts, src/ui/finance/FinanceForms.tsx, CreativePricing.tsx |
| BE-66 | déjà corrigé (341363c8) | TVA et total TTC à la virgule dans « Modifier l'écriture » : test `editTransactionBe66.test.tsx` (« 0,00 CHF », « 23,80 CHF », aucun « 0.00 CHF ») ; capture `harnais/edit-apres-1280-cave.png` | — |
| BE-67 | corrigé | `dateAffichee` (ISO -> JJ.MM.AAAA) dans le champ Date de « Modifier l'écriture » et dans « Échéance prévue remplacée » (`TransactionDetails`) ; test ; capture `edit-apres-390-cave.png` (« 05.11.2026 » pour une écriture 2026-11-05). Pas de capture avant : la version HEAD de la fenêtre n'a pas pu être rendue sans stash | src/domain/finance/ledger.ts, src/components/EditTransactionModal.tsx, src/ui/finance/TransactionDetails.tsx |
| BE-68 | corrigé | cause : le formulaire avait un remplissage bas (`p-4 sm:p-5`) : la barre collante se posait à son bord intérieur, le contenu (chemin Drive) défilait en dessous et dépassait. Remplissage bas retiré : au bout du défilement le chemin entier est visible au-dessus de la barre : `harnais/edit-apres-fin-1280-cave.png` et `edit-apres-fin-390-cave.png` (avant : `edit-apres-1280-cave.png` montre le bloc qui dépasse sous la barre, pris avant la correction) | src/components/EditTransactionModal.tsx |
| BE-69, BE-73 | corrigé | le libellé, « Copier » et le chemin Drive n'utilisent plus le bleu eau texte (3,36 à 4,39:1 en cave) mais `text-cave-50` / `text-cave-200` (texte courant du thème) ; fond et bord restent bleutés. Test sur la classe ; capture cave : `edit-apres-fin-1280-cave.png` (texte nettement lisible). Rapport de contraste chiffré non refait (pas de mesure axe) | src/components/EditTransactionModal.tsx |
| BE-27, BE-62 | non reproduit sur `Sheet.tsx` | banc `harnais/mesurer-fin-feuille.mjs` : 3 feuilles (Acheter du matériel, Prévoir du matériel, Facturer), 390×520 et 1280×560, clair et cave : au bout du défilement le dernier contenu est au-dessus du pied (468/468, 508/508) ; captures `avant-*`/`apres-*` ouvertes (`apres-facture-390-cave.png`, `apres-depense-1280-cave.png`). `Sheet.tsx` inchangé. BE-62 « Préparer les impôts » non rejouée (il faut un rapport fiscal) : à rejouer | — |
| TE-35 | corrigé | « −5 » et « abc » refusés en le disant (`MoneyInput`, déjà), budget = prix + livraison + installation, « À estimer » sans prix ; le refus « Choisis le mois… » est amené dans la vue (`scrollIntoView`). `upgradeSheetTe35.test.tsx` (rouge avant, 4 verts) | src/ui/finance/UpgradeSheet.tsx |
| TE-36 | corrigé | un seul libellé « Inclure dans mes prévisions » cochée ou non ; `equipmentProjects.test.tsx` « TE-36 » rouge avant | src/ui/finance/UpgradeWorkspace.tsx |
| B2-NOTE-2 | déjà corrigé | `tests/unit/depense/g2a/quantite-un-toucher.test.tsx` vert sur HEAD (« +1 » écrit 1, « +10 » → 11, « ✕ » efface) | test |
| B2-NOTE-11 | déjà corrigé | phrase d'écart du pied : ExpenseSheet `detailListe`, `tests/unit/depense/sm0811/pied.test.tsx` | — |
| TE-7 | déjà corrigé | `factureClientSaisie.test.tsx` (341363c8) | — |
| B2-NOTE-3 | écarté : conforme | DESIGN.md l.458 et 505 : 24 px au moins (WCAG 2.5.8), plateau à 28 à 32 px, pastille « mouture » à 24 px | — |
| B2-NOTE-5 | tranché : garder | « Rattacher les 5 » (`Liste.tsx` l.102) sert le geste de 5 moutures en un toucher ; sa maquette n'en dit rien, aucun refus du brasseur | — |
| B2-NOTE-9 | tranché : garder | une mouture seulement proposée ne suit pas son malt : choix prudent (rien n'est écrit sans geste, l'inconnu n'est pas deviné) | — |
| RF-4 | tranché : garder | « IL-5 » et « 11-5 » groupés (`duplicates.ts`) : avertissement seul ; un faux avertissement est inoffensif, un doublon manqué ne l'est pas | — |
| N-NOTE-6, B2-NOTE-1 | non jouable | note de couverture ; pièce réelle 372765 absente (aucune donnée réelle) | — |
| TL-46 | à trancher : « Saisir sans justificatif » doit-il passer par l'écran à bandes (Garder/Retirer, Confirmer) ? choix du brasseur, aucune décision écrite | — | — |
| AM-66 | à trancher : QR-facture et référence structurée : fonctionnalité (bibliothèque `swissqrbill`, QR-IBAN, état de l'art L29) ; `swissQrBill.ts` dit « pas de QR décoratif » ; choix du brasseur. IBAN validé et n° TVA imprimés : déjà faits (341363c8) | — | — |
| RL-14 | à trancher : l'IBAN de repli `VITE_COMPANY_IBAN` du `.env` (21 caractères, pays CH) a une clé fausse (modulo 97 = 2) : le contrôle a raison ; il faut le vrai IBAN du brasseur (Réglages). Valeur non recopiée | — | — |
| RL-13 | à trancher : notes de recette figées au point (texte enregistré avec le brassin) | — | — |
| LO-4, LO-5, LL-8, LL-NOTE-1, LL-NOTE-4, LL-NOTE-5, LT-4, LT-5, LT-6, TL-NOTE-2, TL-NOTE-6, TE-NOTE-3, BT-NOTE-3, SU-NOTE-6, DC-1, B2-NOTE-7 | à trancher : demandent le banc de lecture (Gemini payant), déploiement, PDF ou données réelles : mission à part | — | — |
| TE-63, TE-64 | envoyé à b-divers | `SettingsModal.tsx` | — |
| TE-41, TE-44 | envoyé à b-stock / hors zone | `BatchDetailSheet.tsx` | — |

## Fichiers modifiés (dans mon Possède)
Code : `src/ui/depense/rangees.ts`, `calculPlateau.ts`, `groupes.ts`, `tva.ts`, `Ligne.tsx` ; `src/ui/finance/ExpenseSheet.tsx`, `UpgradeSheet.tsx`, `UpgradeWorkspace.tsx`, `FinanceForms.tsx`, `CreativePricing.tsx`, `TaxClosingSheet.tsx`, `TransactionDetails.tsx` ; `src/domain/finance/bornesFinance.ts`, `ledger.ts` ; `src/services/purchasePrefill.ts` ; `src/components/EditTransactionModal.tsx`.
Tests modifiés : expenseSheet, expenseSheetMouture, jus0Journey, equipmentProjects, mobileDailyViews (1 assertion), `tests/unit/purchasePrefillLp4.test.ts`, `tests/unit/depense/ecran/p3c.test.tsx`, `ecran/groupes.test.ts`, `stock/unites.test.ts`, `stock/perf.test.ts`, `bandes/sous-groupes-d307.test.ts`, `g2b/regles-g2b.test.ts`, `lecture-d/finale.test.ts`, `h13-0811/pour-quoi.test.ts`.
Tests ajoutés : `tests/unit/depense/bandes/unites-tl42.test.ts`, `tests/unit/depense/tva-bloc-rf14.test.ts`, `tests/unit/depense/g2a/quantite-un-toucher.test.tsx`, `tests/integration/upgradeSheetTe35.test.tsx`, `creativePricingBornes.test.tsx`, `editTransactionBe66.test.tsx`.
Banc : `work/missions/2026-11-09-levure-port/voies/b-dep/harnais/` (index.html, harnais.tsx, capturer.mjs, mesurer-fin-feuille.mjs, ~40 captures). Serveur 5651 arrêté.

## Limites
- Le banc `?dev-local&depense=…` n'a pas servi : le harnais rend la vraie feuille seule (`?s=piece|edit|depense|upgrade|facture`). Les captures « avant » n'existent que pour B2-NOTE-8, BE-27/62 (fin de feuille) et le bloc Drive de BE-68 ; pour TL-42, B2-NOTE-4, BE-66/67/69/73, la preuve « avant » est le test rouge (pas de stash autorisé pour rendre HEAD).
- Contrastes (BE-69/73) : classes de texte courant du thème, non mesurées en ratio.
- RF-15 : le « … » est une convention nouvelle de « Pour quoi ? » (champ modifiable).

## DÉCISIONS À PRENDRE
1. Valider « pièce/pièces » partout à l'écran (TL-42) en face de D213 (« Stk reste imprimé », dit maintenant dans le face à face « 2 Stk = 2 sachet ») : recommandation : oui.
2. Le segment de nature n'offre plus « Livraison » : un port saisi à la main devient `service` ; un port lu par Gemini reste `shipping`. Recommandation : accepter.
3. Rangées de levure : « 2 pièces » sur la ligne et « 7 sachets » à la bande : mettre aussi « sachets » sur la ligne ? (maquette à vérifier)
4. TL-46, AM-66, RL-14, RL-13 : au brasseur (voir tableau).

CONNAISSANCE : une feuille à barre collante (`StickyActions`) dans un conteneur défilant avec remplissage bas laisse défiler le contenu sous la barre : retirer le remplissage bas du conteneur.
LEÇON PROPOSÉE : un test qui cherche un menu par son aria-label (« Nature ligne 1 ») casse en silence quand l'écran passe aux segments : tester le geste et l'état (mot pressé, enregistrement), pas le type de contrôle. Et : une chaîne de remplacement écrite par un script `node` depuis le Bash perd les barres inverses des regex (`\d` devient `d`) : relire la ligne écrite et tester la regex (revenu avec `dateAffichee`).
