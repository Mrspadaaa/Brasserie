REPRISE : work/missions/2026-11-14-finances/voies/s1/RESULTAT.md — code écrit et `tsc` OK ; tests, captures et critères G1 à G3 NON joués (plafond de contexte atteint).

# Voie s1 — état de reprise (15.11)

## Fait (code, `node work/missions/2026-11-14-finances/outils/tsc.mjs` → TSC OK après l'écriture de ArchiveManagerSheet ; deux Edit mineurs ensuite, tsc à rejouer)

### Doublons m1do-a
- `src/domain/finance/duplicates.ts` : `LedgerDuplicate` gagne `titre` (« Même facture » / « Même référence QR » / « Même commande ») et `detail` (« finit par 04471 », « n° … »). `reason` inchangé.
- `src/ui/finance/operations/doublons.ts` (neuf) : `ContextePaire` (contexte React : la ligne remplace son geste), `annulerEcriture` (contre-paiement `CONTRE-<id>` de chaque paiement actif, un lot par étape, puis `StorageService.revertTransaction`), `saisiesLe` (« saisies le 14 et le 15 oct. »), `DELAI_RETABLIR_MS = 8000`.
- `src/ui/finance/operations/PaireDoublons.tsx` + `paire.css` (neufs) : avis ×n, un cadre par groupe (raison + repère, lignes complètes `renderRow`, « saisies le … », « Ce n’est pas un doublon »). `data-testid="journal-duplicates"` gardé sur le conteneur.
- `TransactionJournal.tsx` : le filtre « Doublons » ne remplace plus la bande (le mois reste, comme la maquette) ; la liste, la pagination et l'état vide laissent la place à la paire ; le filtre se referme quand plus aucun groupe (effet) ; l'ancien bloc `ops-doublons` est retiré ; les règles `.ops-doublons` retirées de `operations.css`.
- `TransactionRow.tsx` (réécrit en entier avec Write : fin de ligne LF désormais) : dans `ContextePaire`, geste « Annuler celle-ci » (ou « Rétablir » + pastille « annulée le 15 nov. », barré).
- ÉCART À LA MAQUETTE, imposé par les règles Firestore (`updatedTransactionGuard` : une écriture annulée ne se modifie plus) : « Rétablir » n'existe que pendant 8 s. L'annulation s'écrit à la fin du délai, au départ de l'écran (cleanup) ou à `pagehide`. Un refus (stock consommé, avoir lié…) remet la ligne et affiche le message. Le montant « octobre, brassage −94,50 » et « Doublons : plus rien, le filtre se referme » de la maquette sont des légendes d'effet : non portés comme texte ; l'effet (filtre qui se referme) l'est.

### Archives m1ar-c
- `src/domain/finance/archive.ts` : `planRangement`, `peutRanger`, `limiteRangee`, `piecesParMois` (purs ; règles d'archive inchangées).
- `src/ui/finance/operations/FriseArchives.tsx` + `archives.css` (neufs) : frise (barres par mois, année en cours jusqu'au mois courant, zone rangée encadrée froide, pointillé = ancienne limite, pastille rouge « N reste au suivi ↓ », poignée `role="slider"` 44 px : glisser, flèches, toucher une année ; `data-vaul-no-drag`).
- `src/ui/finance/ArchiveManagerSheet.tsx` (réécrit) : titre « Les archives » ; frise ; « rangé jusqu'à fin 2025 · rien n'est supprimé » ; « Le journal de tous les jours garde 449 → 208 pièces » ; lignes d'années (rangée le …, à suivre, rapport figé, Consulter ›) ; pied « Remettre » / « Ranger 2025 ». Sans choix, « Ranger 2025 » pose d'abord la poignée (aperçu), un second toucher écrit. Messages `onSaved` identiques à l'ancien code. « Classer » (nouvelles pièces d'une année rangée) en lien dans la ligne. Notes gardées (plancher à enrichir) : règlements à confirmer, pièces sans date, « disponible dès qu'une année est terminée ».
- ÉCARTS : pas d'icône d'archive dans le titre (le titre de `Sheet` est une chaîne) ; pas de bouton × propre (celui de `Sheet`) ; plus de paragraphes d'explication (défaut 2 de la passe 2) ; « Archiver/Réintégrer/Confirmer l'archivage » disparaissent.

### FN-2
- `TransactionRow.tsx` : après « ✓ Payé » (toujours un toucher), avis `role="status"` « Payé 400,00 · Annuler · Autre montant » sous la ligne pendant 10 s (liens de 44 px, `ops-avis` dans `paire.css`). « Annuler » = contre-paiement ; « Autre montant » = contre-paiement puis `onPay` (feuille Payer m5pa-d, `PaymentSheet` de `FinancesTab`) sur cette pièce de nouveau due. Après l'avis, la ligne garde son « Annuler » (v6a, état « Après »). Pendant l'avis, le geste de droite est masqué (pas deux « Annuler »).
- ATTENTION : « Autre montant » laisse la pièce impayée si la feuille est fermée sans payer (le contre-paiement est écrit). À signaler au brasseur ; alternative : ne pas inverser et ouvrir la feuille sur une pièce déjà soldée (m5pa-d n'a pas ce mode).

### Tests écrits
- `tests/integration/archivesFrise.test.tsx` écrit (7 tests) ; jamais lancé.

## Reste à faire (dans l'ordre)
1. `node work/missions/2026-11-14-finances/outils/tsc.mjs` (après les deux petits Edit).
2. Lancer `npx vitest run tests/integration/archivesFrise.test.tsx --reporter=dot --no-color` et corriger. Points à vérifier : le texte « reste au suivi » dans le 2e test (j'ai mis une regex `/60,00|100,00 reste au suivi/` : la facture B2 vaut 100,00) ; le nom accessible des colonnes « <an> : N pièce(s), ranger jusqu'à fin <an> » ; `suivante`/`precedente` quand `limite` change.
3. Écrire `tests/integration/doublonsPaire.test.tsx` : `TransactionJournal` + `renderRow={(t, p) => <TransactionRow …/>}`, deux dépenses même fournisseur et même n° de facture, payées ; `vi.mock` de `financeService` (`getPayments`, `recordPayment`) et de `StorageService.revertTransaction` (comme `operationsPeriode.test.tsx`) ; vérifier avis « 2 pièces peut-être en double », « Même facture », deux « Annuler cette pièce en double », clic → « Rétablir » + « annulée le », « Rétablir » rend la ligne, `vi.useFakeTimers` + 8 s → `recordPayment` d'un `CONTRE-…` puis `revertTransaction(id)`, « Ce n’est pas un doublon » ferme la vue.
4. Ajouter dans `tests/integration/operationsPeriode.test.tsx` (propriété de la voie) : le test « (d bis) » existant cherche `getByRole('button', { name: 'Annuler le paiement du jour' })` juste après « ✓ Payé » : il échouera, car l'avis masque ce geste. Le remplacer par : avis « Payé 100,00 », bouton « Annuler le paiement de 100,00 » → `recordPayment` d'un `CONTRE-…` ; bouton « Autre montant… » → contre-paiement puis `onPay` appelé (prop passée à `TransactionRow`, attendre une microtâche) ; après 10 s (`vi.useFakeTimers`), l'avis disparaît et « Annuler le paiement du jour » revient.
5. Lancer la ligne Tests du VOIE.md (sortie `tests.txt`), puis G1 `node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s1/tests.txt` → VITEST OK ; G2 tsc → TSC OK ; G3 `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` → V6A OK ; acquis : `controle-frise.mjs 3000` → FRISE OK.
6. Tests d'autres fichiers probablement cassés par le port, NON propriété de la voie, à signaler au pilote : `tests/integration/financeJournalDoublons.test.tsx` (texte « 27 écritures possiblement en double », « Même commande 686863 » + libellé long, bouton « Ce n’est pas un doublon » gardé), `tests/integration/financeArchives.test.tsx` 2e test (« Archiver <année> », « Confirmer l’archivage », « Réintégrer … »). Rejouer `npx vitest run tests/integration --reporter=dot --no-color` filtré sur finance/operations/archive pour la liste exacte.
7. Captures (DEMANDE EXECUTANT ci-dessous), ouvertes en image.

## DEMANDE EXECUTANT (à lancer après les points 1 à 5)
- Banc : `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Jeu de démonstration : prévoir une paire de doublons (même fournisseur + même n° de facture, ou même référence QR) et une année passée archivable ; si `finance-demo` n'en contient pas, le dire (ne rien écrire hors du banc local).
- Captures dans `work/missions/2026-11-14-finances/voies/s1/cap/`, 390 px tactile puis 1280 px, thème clair puis cave, chaque vue ouverte puis après son geste :
  1. Opérations › « Doublons » : paire (m1do-a) ; après « Annuler celle-ci » (ligne barrée + « Rétablir »).
  2. Opérations › « Filtres » › « Gérer les archives » : frise au repos ; après avoir touché une année (poignée + pointillé + « Ranger 20xx ») ; après « Consulter » d'une année rangée.
  3. Opérations (mois, une pièce à payer) : après « ✓ Payé » : l'avis « Payé … · Annuler · Autre montant » ; après « Autre montant » : feuille Payer m5pa-d.
- Chaque capture à côté de `voies/m1/m1do-a/m1do-a.png` et `voies/m1/m1ar-c/m1ar-c.png` (côte à côte), ouverte et décrite : écarts relevés.
- Sorties attendues : `V6A OK`, `FRISE OK`.

## Doutes
- Le contrôle `controle-v6a.mjs` mesure les lignes au repos : aucun changement de hauteur attendu (l'avis n'existe qu'après un geste), non rejoué.
- La poignée au pointeur (glisser) n'est testée qu'au clavier et au toucher d'année dans jsdom ; le glisser réel se juge aux captures/banc.
- Fin de ligne : `TransactionRow.tsx` est passé de CRLF à LF ; `TransactionJournal.tsx`, `archive.ts` restent CRLF.

DÉCISION À PRENDRE : « Rétablir » après « Annuler celle-ci » (maquette) n'est faisable qu'en différant l'écriture de 8 s (règles Firestore). Options : (a) différé 8 s, tel que porté (recommandé) ; (b) écriture immédiate sans « Rétablir » (écart à sa maquette). Et « Autre montant » (FN-2) inverse le paiement avant d'ouvrir la feuille : le pilote juge si ce comportement convient.
CONNAISSANCE : les règles Firestore interdisent toute modification d'une écriture annulée (`updatedTransactionGuard`) : aucun « Rétablir » après coup ; un outil de poste : `/tmp` de Bash n'est pas celui de Node (`cygpath -m /tmp`).
LEÇON PROPOSÉE : aucune
