OK — Payer = m5pa-d porté : un virement réparti sur les pièces du même fournisseur, justificatif joint (1 test d'un autre fichier à adapter)

## Fichiers écrits
- `src/domain/finance/repartition.ts` (neuf) : `repartirVirement(pieces, montantCents)`, `refusDuVirement`, `ordreDImputation`, `piecesOuvertesDuTiers`, `cleDuTiers`.
- `src/domain/finance/types.ts` : `FinancialPayment.proofDocumentId?`, `proofFileName?` (champs optionnels ; les règles Firestore autorisent un champ de plus).
- `src/ui/finance/payer/PayerVirement.tsx`, `src/ui/finance/payer/payer.css` (neufs).
- `src/ui/finance/FinanceForms.tsx` : `PaymentSheet` (même signature, FinancesTab non touché) délègue à `PayerVirement` ; l'ancien formulaire est retiré.
- `tests/unit/repartitionVirement.test.ts` (13 tests), `tests/integration/payerVirement.test.tsx` (10 tests).
- `voies/q1/capturer.mjs`, `voies/q1/cap/*.png`, `voies/q1/tests.txt`.

## État de l'art (L29)
Imputation d'un paiement sur des factures ouvertes (FIFO par échéance, puis date, puis id), centimes entiers, fonction pure ; aucune bibliothèque utile (quelques lignes, aucun arrondi car aucune division). Même ordre que `summarizeLedger.outstanding`.

## Critères
- G1 `node …/vitest-lu.mjs voies/q1/tests.txt` : `VITEST OK` (2 fichiers, 23 tests). ⚠ la ligne « Tests » du VOIE.md, sans `NO_COLOR=1`, écrit des codes couleur dans tests.txt et le lecteur répond `VITEST ECHEC` à tort ; relancer avec `NO_COLOR=1 npx vitest run … --reporter=dot > …/tests.txt`. tests.txt actuel : relancé ainsi.
- G2 `tsc.mjs` : `TSC ECHEC` seulement à cause de `functions/` (`firebase-admin/firestore` absent du worktree, consigne : à ignorer). `npx tsc --noEmit -p tsconfig.json | grep -v "^functions/"` : 0 erreur. Essais : 1.

## Comportement porté (m5pa-d)
- Feuille « Payer <tiers> », sous-titre « N pièces à payer au même fournisseur » (« Une pièce à payer » si seule). « Ton virement » = un montant mono 24 px, par défaut tout ce qui reste sur les pièces cochées ; tronçons (retard rouge, pièce à sa couleur de catégorie, reste hachuré) et légende ; « Le plus ancien d'abord » ; une rangée par pièce (case, liseré rouge si en retard / hachuré si à payer, étiquette « depuis le … » / « à payer · 25 nov. », montant imputé, « ✓ soldé » ou « sur 400,00 · reste 160,00 »).
- Case décochée = pièce hors du virement ; une pièce seule : case figée. Montant > total : refusé (le champ le dit, le bouton reste éteint, rien n'est écrit).
- Justificatif : cadre pointillé « sera joint aux 2 pièces » ; plein « joint aux 2 pièces » avec nom, « Changer », « Retirer ». Un seul original déposé par `prepareFinanceDocument` + `saveFinanceDocumentConfirmed` (mécanisme de `ExpenseSheet`, nom Drive par `driveProofFileName`), lié à chaque paiement par `proofDocumentId` / `proofFileName`. Format (JPEG, PNG, WebP, PDF) et taille (4 Mo) vérifiés à la sélection. Si Drive refuse : aucun paiement écrit, erreur dite. Sans justificatif : le paiement s'enregistre quand même.
- « Le [aujourd'hui] [autre] avec [banque] [⌄] » : « autre » ouvre « Date réelle du paiement » (≤ aujourd'hui) ; ⌄ ouvre espèces / TWINT / autre moyen.
- Écriture : `FinanceService.recordPayment` pièce par pièce, la plus ancienne d'abord (même date, même moyen, id et horodatage stables pour un réessai identique ; note « Virement de … réparti sur N pièces » quand N > 1). Après un échec au milieu : message avec le montant déjà écrit, le reste du virement à refaire. Paiement historique inconnu : date vide, bouton éteint jusqu'à la date, note conservée.
- Encaissement (vente) : mêmes mécanismes, mots adaptés (« Encaisser », « Ton encaissement », « à encaisser »), jamais mêlé aux dépenses du même nom.

## Captures (ouvertes)
`voies/q1/cap/` : `payer-{390,1280}-{clair,cave}-{ouvert,300,apres}.png` ; planches maquette / app : `planche-390-clair.png`, `planche-390-cave.png` (ouvertes). Parcours joué sur `?dev-local&finance-demo` : fiche du loyer → « Noter un paiement » → feuille (2 pièces : solde atelier 60 en retard + loyer 400) → 300 → ✓ Payer : le loyer passe à « Reste 160,00 », 0 erreur console. Les 1280 sont prises mais je n'ai ouvert que le 390 clair et cave.

## Écarts à la maquette (assumés)
1. Cibles à 44 px (Photo, Fichier, pastilles, cases) au lieu de 36–40 px de la maquette : exigence transversale, défaut 2 du critique. Le bouton fichier porte le mot « Fichier » (défaut 2).
2. Ordre « justificatif avant Le … avec » gardé tel que la maquette (le défaut 3 du critique le contredit : règle n° 1). Défaut 1 (« joint » sans rien) : déjà « sera joint » dans etat.html, repris ; devient « joint » une fois un fichier choisi.
3. Titre : « Payer Atelier » (nom du tiers tel que saisi), la maquette écrit « Payer l'Atelier » (article inventé impossible sans grammaire du nom). Titre de feuille en graisse normale : c'est l'en-tête du composant `Sheet`, partagé, pas à moi.
4. Saisie en cours : « 300 » (pas « 300,00 ») tant que le champ a le focus ; « 300,00 » au repos.
5. Rouge du retard : jeton de l'app (`--alert-strong-texte`), plus sombre que #D6453D en clair, saumon en cave.
6. Fiche : le bouton principal du loyer (« Noter un paiement », voie q3) paraît vide en clair sur la capture (noir sur noir) : hors de ma voie, à vérifier côté q3.

## Doutes et limites
- `tests/integration/financeWorkspace.test.tsx` l. 100 (« propose la date du jour pour une facture suivie », attend un champ « Date réelle du paiement » prérempli à aujourd'hui) échoue : m5pa-d n'a que les pastilles « aujourd'hui » / « autre », la date n'est un champ qu'avec « autre ». Hors de mon Possède. Correction d'une ligne : cliquer « autre » avant l'assertion, ou attendre `aria-pressed` sur « aujourd'hui ». Les lignes 96-97 (historique inconnu : date vide, requise) passent.
- Le justificatif de paiement est écrit mais pas encore relu dans la fiche (`TransactionDetails` / `DocumentProofLink` lisent le justificatif de la pièce, pas celui d'un paiement) : à brancher par la voie qui possède la fiche (q3) ; `loadFinanceDocument(proofDocumentId)` suffit.
- Pas joué en ligne ni sur de vrais fichiers Drive (banc local : `saveFinanceDocumentConfirmed` est la copie locale, testé en simulé). Le critique et le relecteur des paiements (q1/q4) restent à faire.
- Pas de `DEMANDE EXECUTANT` : les captures sont faites (script `capturer.mjs <port>` rejouable).

DÉCISION À PRENDRE : « Payer Atelier » ou « Payer l'Atelier » ? Recommandation : garder le nom brut (honnête, sans article deviné) ; l'article n'est ajoutable qu'avec un champ « article » du tiers.
CONNAISSANCE : `vitest … > fichier` colore la sortie même redirigée : le lecteur `vitest-lu.mjs` exige `NO_COLOR=1` (sinon faux `VITEST ECHEC`).
LEÇON PROPOSÉE : aucune
