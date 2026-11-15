OK — intégration finie : suite 1096 fichiers verts, seuls 54 échecs d'environnement (modules absents) ; tsc 0, build vert

Sortie finale (`tests.txt`) : `Test Files  54 failed | 1096 passed | 1 skipped (1151)` · `Tests  2 failed | 12358 passed | 40 skipped (12400)`. Les 54 fichiers en échec sont **tous** l'environnement, rouges aussi sur HEAD 2d290f56 : 53 non collectés (`firebase-admin` ×12, `firebase-functions` ×9, `cheerio` ×6, `firebase-admin/auth`… : `functions/node_modules` absent) et `brewerHopAdviceTransportV1.browser` (2 tests, `@noble/hashes` absent). Aucun test de src/ ne reste rouge.
`npx tsc --noEmit` hors firebase-admin : 0 ligne (`tsc.txt`). `npx vite build` : `built in 14.46s` (`build.txt`, sortie dans `%TEMP%`).

## Branchements
- `src/App.tsx` : `onOpenSale={() => setQuickAction('quick-sale', actionLauncherRef.current)}` dans `<FinancesTab>` (1 ligne).
- `src/components/tabs/FinancesTab.tsx` : rien à poser (us avait câblé `onAddProof`, `onPay`, `assistant`) ; l'Annuel est à ug.
- `src/ui/vente/formatsVente.ts` : `tarifDuFormat` lit `tarif.format?.id` puis le nom, et `tarif.biere` puis le nom ; `biereDuTarif` exportée. Test Prix → Caisse neuf dans `tests/unit/caisseCalculs.test.ts`. `calculPrix.ts` (ue) garde sa copie `biereLegacy` : non touchée.
- `scripts/agents/inventaire-ecrans.mjs` : zones et fichiers des écrans portés (Synthèse g3a, Opérations v6b, Prévisions p5b, Annuel g6, Clients › Impôt bière et Prix c7c). `--verifier` : 15 problèmes → 9, **tous** `identité/…` de `BrewWizard.tsx` (antérieurs, hors de cette mission). `work/refonte-frontend/inventaire-ecrans.json` reste « périmé » : à régénérer par le pilote (hors Possède).
- `scripts/check-invoice-journey-emulator.mjs` : `#tax-tab-documents` (2 clics) → `button « 9. Dossier »` ; « Excel » → `« Opérations Excel »` ; le test « bouton ZIP visible » lit l'`aria-label`. `node --check` vert ; **non rejoué** (émulateur : hors consigne).

## Échecs rencontrés et geste
| Test | Cause | Geste |
| --- | --- | --- |
| `financeWorkspace` « synthèse commune… » ; `mobileDailyViews` « finances sur la synthèse… » | ancien écran : recherche et états du journal derrière la loupe et « Filtres » (v6b) | réécrits, même intention, aucune assertion retirée |
| `financeWorkspace` « guide la préparation annuelle… » | ancien Annuel ; Annuel g6 par étapes | piste « 2. Solde d’ouverture » → « Renseigner le solde » → Annuler ; solde posé ; piste « 1. » → « Joindre » → onglet Opérations, « Achat mixte » visible |
| `financeWorkspace` « registre existant… » | idem | piste « 4. Matériel » → bouton de la cuve (« À compléter ») → feuille « Modifier l’amortissement » |
| `financeWorkspace` « fige une version annuelle… » | idem | piste « 9. Dossier » → « Figer la version » ; chiffres figés gardés après une dépense (assertions sur le domaine inchangées) ; « Version figée » devient « 2026, figé » + bouton « Travailler sur une nouvelle version » |
| `rejeu-649b/virgule-transversale` (TE-23) | **régression vraie** : `{pct} %` sans formateur | `nombreFr(x, 0)` : `finance/synthese/Pourquoi.tsx` (4), `prix/ChaineArgent.tsx` (1), `prix/PrixEcran.tsx` (2), `TarifSheet.tsx` (1), `finance/annuel/Etapes2.tsx` (2), `finance/annuel/Tete.tsx` (1) |
| `financeAnnuelSaisie` (11) | rouges au 2e passage, pendant qu'ug adaptait | verts au rejeu isolé et au passage final |
| 53 collectes + hop browser | environnement | notés, non touchés |

## Fichiers écrits
`src/App.tsx`, `src/ui/vente/formatsVente.ts`, `scripts/agents/inventaire-ecrans.mjs`, `scripts/check-invoice-journey-emulator.mjs` ; une ligne par fichier hors Possède, régression prouvée (TE-23) : `Pourquoi.tsx`, `ChaineArgent.tsx`, `PrixEcran.tsx`, `TarifSheet.tsx`, `annuel/Etapes2.tsx`, `annuel/Tete.tsx` (import et appel de `nombreFr`) ; tests : `financeWorkspace`, `mobileDailyViews`, `caisseCalculs` ; voie : `tests.txt`, `tests-1er-passage.txt`, `tests-2e-passage.txt`, `tsc.txt`, `build.txt`.

## Doutes et limites
- Aucune capture : cette voie ne change pas le rendu. Le bouton « Vente » de Prévisions et le parcours Prix → Caisse ne sont pas rejoués en navigateur.
- Le script d'émulateur (`check-invoice-journey-emulator.mjs`) et `tests/ux-mobile/*` (non chargés par vitest, L11) ne sont pas rejoués ici.
- Les 3 tests Annuel de `financeWorkspace` vérifient les gestes et le domaine, pas l'aspect de la maquette g6 (captures d'ug, à ouvrir par l'exécutant).
- Piège Bash du poste revu : un heredoc a retiré des `\` d'un regex d'un script de remplacement (`/^\d{4}…/` devenu `/^d{4}…/`), vu à l'échec du test ; corrigé à l'Edit, relu, vert.

DÉCISION À PRENDRE : routées au pilote, non touchées par ix : journal « marge … % » de `storage.ts:1205` (omettre quand `marginPercent` absent) ; champs de `functions/src/brewerAppContext.ts` (déployable : irréversible) ; suppression de `CreativePricing.tsx` et `CostComposition.tsx` (orphelins) ; régénérer `work/refonte-frontend/inventaire-ecrans.json`.
CONNAISSANCE : `controle-virgule.mjs` (TE-23) lit tout `src/` : un écran neuf qui écrit `{pct} %` sans `nombreFr` échoue au test d'ensemble, pas dans ses tests : les quatre voies d'écrans l'avaient (8 + 3 occurrences). Sans `functions/node_modules`, 53 fichiers ne se collectent pas : comparer des listes, pas des totaux.
LEÇON PROPOSÉE : ajouter `rejeu-649b/virgule-transversale` aux critères de chaque voie d'écran (L05 : exigence transversale, un contrôle qui lit tout `src/`) ; il a échoué trois fois à l'intégration, jamais dans une voie.
