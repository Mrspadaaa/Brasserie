# Voie d3c-drive-code — l'envoi au Drive en arrière-plan, codé sur le plan relu

Agent : auteur (Sonnet). Plafond : 150 tours. Pilote : Opus. Date : 01.11. Décisions : D235 (ses mots), D237 (choix du pilote).

## Ses mots (01.11, mot pour mot)
« Finalement, pour la logistique d'envoi sur le drive, c'est invisible, c'est à la fin en arrière plan. Et si ça fail. Grosse notification,
renvoie sur la facture pour upload le justificatif ou/et réparé le lien drive »

## Le contrat : le plan relu
`voies/d3-drive-fond/PLAN.md` (v2, § 0 à § 9, avec T1 à T8 au § 8), relu par deux regards neufs : `REVUE-conception.md` et `REVUE-pret.md`,
leurs sections « Seconde lecture (v2) » (CONCEPTION OK, PRET OK). Tri : `REVUE-PLAN.md`. Tu codes ce plan, rien de plus ; un écart
nécessaire au code s'écrit d'abord dans PLAN.md (§ 10), avec sa raison.

## À faire, dans l'ordre
0. **Les huit précisions des secondes lectures**, écrites dans PLAN.md § 10 avant le code :
   - la notification ne lit jamais une dépense annulée (`finance.voidedAt`) ;
   - tout `drive/auth-required` donne le motif `auth` et « Reconnecter Drive » ;
   - un délai minimal entre le premier et le dernier échec passager avant `failed network`, pour que six réveils en trois minutes ne
     suffisent pas (pilote : 2 h au moins, en constante) ;
   - « Abandonner » pour un job sans dépense : sur la notification « sans dépense » elle-même ;
   - le test hors ligne accepte `queued` et `pending` ;
   - le code nu `unavailable` de `saveFinanceDocumentConfirmed` est dans la table des échecs (passager) ;
   - le prédicat « feuille ouverte » lit `[role="dialog"]` et `[role="alertdialog"]` ;
   - les chemins `tests/integration/taxArchive.test.ts` et `backupTransfer.test.ts` sont corrigés, ainsi que la phrase sur le témoin
     `confirmer.test.ts`.
1. **Le témoin sur HEAD (L13)** : écris `tests/unit/depense/drive-fond/confirmer.test.ts` d'abord, lance-le sur le code d'aujourd'hui, et
   note sa sortie rouge (la bonne raison : l'appel attend Drive) dans RESULTAT.md.
2. **Le code** (§ 2 et § 5 du plan) ; puis les tests nouveaux (§ 4.1) et les tests existants à réécrire (§ 4.2), chacun selon l'attendu
   du plan.
3. **Le banc Chrome sur émulateurs** (`scripts/check-invoice-journey-emulator.mjs`, D237 n° 5) : ajoute le cas `drive-fond` avec les
   réglages de Drive factice du plan (lent, `storageQuotaExceeded`, jeton refusé, rechargement en plein envoi, hors ligne au moment de
   « Confirmer »), 390 tactile et 1280 : la feuille se ferme en moins de 2 s réseau présent ; l'échec fait paraître la notification, qui
   reste ; « Renvoyer le justificatif » ouvre la dépense ; « Reconnecter Drive » est là pour le motif `auth`. **Témoin** : le cas
   `drive-fond` échoue sur HEAD (`git show HEAD:<fichier>` vers `os.tmpdir()`, remis le temps du témoin, puis tes versions). Captures du cas,
   **ouvertes** (L12) : feuille fermée après « Confirmer », notification d'échec à 390, dépense rouverte.
4. Mets à jour les cas existants du banc que le plan déclare rouges par conception (« reçu puis Terminé », lien lu juste après la
   fermeture, hors ligne), en gardant leur intention (le lien arrive, plus tard).

## Exigences transversales (COMMUN.md, acquis)
Rien n'est perdu : jamais d'effacement d'un justificatif sur un doute (T1) ; le hors ligne tient ; aucun appel Drive ni Gemini réel ;
aucune dépendance nouvelle (`fake-indexeddb` ou autre : accord requis, ne l'ajoute pas) ; règles, fonctions et schéma inchangés (un champ
facultatif seulement) ; densité de DESIGN.md (cibles ≥ 24 px, texte ≥ 12 px) ; la mise en page de l'écran r2b ne change pas (seul le
pied après « Confirmer ») ; la forme de la notification est **provisoire** (D237 n° 6) : simple, lisible, une seule, avec ses deux gestes.

## Possède
`src/services/proofQueue.ts`, `src/services/proofQueueStore.ts`, `src/services/proofUploadStatus.ts` (neufs),
`src/ui/finance/ProofUploadNotice.tsx` (neuf), `src/ui/finance/TransactionDetails.tsx`, `src/services/purchaseEntry.ts`,
`src/domain/finance/types.ts` (le type `ProofUpload` et le champ facultatif), `src/ui/finance/ExpenseSheet.tsx` (le pied après
« Confirmer » seulement), `src/App.tsx` (monter la notification, démarrer la file : rien d'autre), `src/ui/finance/TransactionJournal.tsx`
(le prédicat), `tests/unit/depense/drive-fond/**`, les tests existants que le § 4.2 dit « réécrits », `scripts/check-invoice-journey-emulator.mjs`,
`work/missions/2026-10-31-ecran-depense/voies/d3-drive-fond/PLAN.md` (§ 10 seulement), `work/missions/2026-10-31-ecran-depense/voies/d3c-drive-code/**`.
**Non touchés** : `financeDocuments.ts`, `driveFileStore.ts`, `ModalShell.tsx`, `FinancesTab.tsx`, `firestore.rules`, `functions/`,
`package.json`. Serveur de dev et émulateurs seulement dans ce dossier de travail, jamais dans `C:/Users/mrspa/Documents/Brasserie`. Pas de
commit, pas de build de production pour déployer, pas de déploiement. Ne touche jamais `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env`. Fichiers de travail : ton dossier de voie ou `os.tmpdir()`.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- la commande vitest exacte de RESULTAT.md (tests/unit/depense, tous les fichiers du § 4.2, `tests/unit/purchaseEntry.test.ts`,
  `tests/integration/expenseSheet.test.tsx`, `expenseSheetMouture.test.tsx`, `jus0Journey.test.tsx`, `financeQuickActions.test.tsx`,
  `fix114.test.tsx`, `financeDocumentPersistence.test.ts`, `--maxWorkers=2`) suivie de `&& echo TESTS DRIVE OK` → TESTS DRIVE OK
- `node scripts/audit_inputs.mjs` → INPUT PROTECTION AUDIT PASSED
- `npm run build && echo BUILD OK` → BUILD OK (vérification seulement, sans déploiement)
- le banc sur émulateurs, cas `drive-fond` et cas existants touchés, commande exacte dans RESULTAT.md → `EMU-INVOICE-JOURNEY-OK`, code 0
- `node scripts/with_server.mjs --server "npm run dev -- --port 5619 --strictPort" --port 5619 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/b1-bande/controle-bande.mjs` → BANDE OK (b1 tient)

## Retour
`voies/d3c-drive-code/RESULTAT.md` : le diff en trois phrases, la sortie rouge du témoin sur HEAD, les sorties des critères, les captures
regardées, les écarts au plan (§ 10). Puis une ligne : `D3C OK — <résumé>` ou `D3C ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.
