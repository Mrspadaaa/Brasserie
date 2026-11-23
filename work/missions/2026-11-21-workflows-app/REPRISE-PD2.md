# REPRISE PD-2 (21.11) — « un réel solde son prévu », côté dépense

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`. AUCUN COMMIT FAIT. Scratchpad : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/pd2/`.
Pièges du poste : Bash perd les barres inverses (heredoc, sed) ; fichiers CRLF : `types.ts`, `forecast.ts`, `purchaseEntry.ts` (écrire `\r\n` par `String.fromCharCode(13)` dans un script node) ; `ExpenseSheet.tsx`, `venteSuites.ts` en LF. Le code se pose avec Write/Edit.
Le tag `en-ligne/2026-11-21-tour8` = HEAD 5fb61c580 = le build `C:/Users/mrspa/AppData/Local/Temp/wfd-build` (déjà construit, config parcours) : `node scripts/parcours/chaines.mjs <dossier> --build C:/Users/mrspa/AppData/Local/Temp/wfd-build --etape PD2-MALT,PD2-POMPE,PD2-IMPOT`.

## Fait (non commité, dans l'arbre)
Banc (scripts/parcours) :
- `chaines-outils.mjs` : `pageNeuve(banc, entrees, sortie, { lecture, delaiLecture })` (lecture de pièce SIMULÉE dans la page, `aiTask` répondu, réseau hors localhost coupé) ; `s.piece('Photographier', { prefixe: true })` donne `fixtures/piece-simulee.png` au sélecteur ; le message console « wasm streaming compile failed » est ignoré.
- `fixtures/lectures.mjs` (nouveau) : `lecturesChaines(aujourdhui)` = facture (421,57), ticket (Landi, soude), impot (OFDF 37,37), pompe (450, du jour −24) ; `fixtures/piece-simulee.png` (copie de documents/piece.png).
- `chaines.mjs` : import de `lectures.mjs`, `jouer()` passe `{ lecture }` si l'étape a `lecture:`, helpers `lirePiece`, `confirmerPiece`, `ditPage` (function), `aDepenser`, `calendrierSurSixMois`, et 3 étapes `PD2-MALT`, `PD2-POMPE`, `PD2-IMPOT` (insérées avant « La file port »).
- `pd2-sonde.mjs`, `pd2-sonde2.mjs` : sondes JETABLES, à supprimer avant tout commit (`node scripts/parcours/pd2-sonde.mjs <build> <genre> <dossier>` affiche texte, boutons, tx, plans, Calendrier, erreurs).
Domaine / service / UI :
- `src/domain/venteSuites.ts` : `memeFournisseur` (mots, sans accents ni formes juridiques, le plus court inclus dans l'autre) ; `planSoldeParDepense` accepte les prévus manuels ET matériel (actif, ou projet `draft`), tri par écart de date puis de montant (règle de la caisse), `dateIso` en entrée. Tests `tests/unit/venteSuites.test.ts` réécrits (14 verts).
- `src/domain/finance/soldeImpot.ts` (nouveau) : `estPieceImpot`, `echeanceImpotSoldeePar(items, piece)` (groupe les sorties `brew:<lot>:impot` par date, la plus proche de la pièce), `retirerSoldees`.
- `src/domain/finance/forecast.ts` : les sorties dérivées dont l'id est dans `finance.soldeIds` d'une dépense active sont retirées. `types.ts` : `TransactionFinance.soldeIds?: string[]`. `src/services/purchaseEntry.ts` : `PurchaseDraft.soldeIds`, écrit dans `finance`.
- `src/ui/finance/soldePrevu.ts` (nouveau) : `soldeLeVuPlan(planId, montantChf)` = `planApresVente` puis `FinanceService.savePlan` (plan soldé `completed`, jamais pour un récurrent).
- `src/ui/finance/ExpenseSheet.tsx` : ligne `data-suite="prevu"` « ✓ Solde l’achat prévu « titre » −420,00 CHF » (décochable : « Ne solde pas ») ou « l’impôt prévu » ; posée avant les rubriques (scan et saisie) ; `soldeLeVuPlan` appelé après `savePurchaseWithProofReceipt`. **Contient 2 `console.error('PD2-DEBUG…')` TEMPORAIRES (dans `echeanceImpot`) : à retirer.**

## Preuves
- Rouge sur tour8 (3 étapes KO : la ligne « Solde l'achat prévu » absente, « Commande de malt » et « Pompe » restent au Calendrier ; mesure du 21.11 : à dépenser 1 010 → 560 pour la pompe).
- Vert sur l'arbre : `PD2-MALT` OK (ligne cochée d'office et décochable, facture liée à P-MALT, plan `completed`, plus de Commande de malt au Calendrier). `tsc --noEmit` propre ; vitest `venteSuites` 14 verts.

## Reste à faire (dans l'ordre)
1. **PD2-POMPE rouge sur l'arbre** : la pompe (Brewferm, matériel, 450) propose « Commande de malt −420 » car le plan P-MALT (vendor « ZZ TEST ») est un sous-ensemble de « ZZ TEST Brewferm » et plus proche par la date. Corriger le TRI de `planSoldeParDepense` : d'abord fournisseur égal (mots identiques) avant sous-ensemble, plan sans fournisseur en dernier ; puis catégorie égale ; puis écart de date ; puis de montant ; puis id. Ajouter un test (pompe + P-MALT partageant « ZZ TEST » → la pompe). Puis vérifier dans l'étape : projet dans Réalisés (« À venir 0 · Réalisés 1 » : `estRealise` dérive de la facture liée payée, et le plan passe `completed`), Pompe absente du Calendrier, « à dépenser » inchangé.
2. **PD2-IMPOT** : sur l'arbre la feuille ne propose rien (`echeanceImpot` nul). Les 2 `console.error('PD2-DEBUG')` dans `ExpenseSheet.tsx` disent pourquoi : lancer `node scripts/parcours/pd2-sonde.mjs <build gardé> impot <dossier>` (ligne `ERRS`) ; build gardé : `C:/Users/mrspa/AppData/Local/Temp/chaines-build-05Fsli` (avec les debug). Pistes : `buildForecast` de la feuille sans `includeEquipmentProjects`/`brewReglages`/`brewTaxReduction` donne peut-être pas de sorties `:impot` (le Calendrier de `useDonneesCalendrier.ts` les passe : voir `construireModele`), ou exception avalée, ou `estPieceImpot` faux. Retirer les debug ensuite.
3. Commits par index temporaire (patch réappliqué sur l'index), message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Commit 1 : banc + MALT + POMPE + domaine dépense + tests ; commit 2 : IMPOT. Vérifier `git log -3` avant de toucher `src/ui/finance/operations`, synthèse (PERIODE modifie `FinanceOverview.tsx`, `synthese.css`, `synthese/Scene.tsx` : ne PAS les ajouter). Jamais `git add -A`, stash, push, `seedData.ts`, `source4-…json`.
4. WFD-6 « Article neuf » (ticket Landi, ligne « ZZ TEST Soude caustique 2 kg », stock CIP alcalin, sans article existant) : jouer la lecture `ticket`, Confirmer, lire Stocks › Articles ; si l'article n'entre pas au stock sans phrase, c'est un vrai défaut → étape `PD2-ARTICLE` rouge sur tour8, puis correction. Sinon : le dire.
5. À la fin : `node scripts/parcours/chaines.mjs <dossier>` OK en entier ; vitest dépense et finance (`npm test -- tests/unit/venteSuites.test.ts` + les tests `tests/**/finance*`, `purchase*`, `forecast*`, `expense*`) ; build `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` ; marquer WFD-1, WFD-3, WFD-4 (et WFD-6 si corrigé) dans `Brasserie/work/missions/BUGS.md` + verser les WFD-n absents (WFD-1 à 9, voir `work/missions/2026-11-21-workflows-app/ANALYSE-documents.md` § 3) ; `node scripts/agents/controle-bugs.mjs` OK.
6. WFD-2 (échéance non lue, PD-3), WFD-5 (PD-1), WFD-7, WFD-8 (PD-4), PD-5 : hors périmètre (Calendrier, `functions/`).

## Notes de conception (à garder)
- Réalisés est DÉRIVÉ (`estRealise` : facture liée payée ≥ budget) ; le plan passe aussi `completed` par `soldeLeVuPlan` (couvre l'achat à payer, non payé).
- Facture non payée sans échéance liée à un plan actif : la prévision garde le plan « réservé » ; le plan `completed` règle ce cas (la facture est comptée à part, PD-3 lui donnera sa date).
- L'impôt : lien `finance.soldeIds` = ids `brew:<lot>:impot` de l'échéance de la période (même date) ; la pièce réelle est seule à compter. Montant jamais comparé (l'impôt estimé diffère de la facture réelle).

CONNAISSANCE : la prévision dérive l'impôt par brassin (`brew:<lot>:impot`), sans plan : seul un champ de la pièce peut le solder. LEÇON PROPOSÉE : aucune.
