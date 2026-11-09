OK — étape 2 : vraie QR-facture (swissqrbill, PNG dans jsPDF), n° continu, échéance, libellé ; 28 tests f1 verts, tsc sans erreur nouvelle

## Fichiers écrits
- `src/services/swissQrBill.ts` (réécrit : `AdresseStructuree`, `problemesAdresse`, `adresseDepuisTexte`, `preparerQrFacture`, `rasteriserNavigateur`, `QrFactureInvalide`, `libelleFacture`, `invoiceTotals` en centimes décimale-sûrs, PDF avec section paiement)
- `src/domain/finance/numeroFacture.ts` (neuf : `prochainNumeroFacture`, `doublonsNumeroFacture`, `echeanceFacture`)
- `tests/unit/factureQr.test.ts` (neuf, 28 tests)
- `voies/f1/PLAN.md` (§ 8 : chaque constat de REVUE-A F1-1…5 et REVUE-B f1-1…6, R4, R6 : retenu ou écarté), `tests-head.txt`, `tests-rouge.txt`, `tests.txt`, `tsc.txt`, `build.txt`, `RESULTAT.md`

## Sorties décisives
- Rouge d'abord (`tests-rouge.txt`) : `Test Files 1 failed (1) | Tests no tests` (module `numeroFacture` absent).
- Vert (`tests.txt`) : `Test Files 6 passed (6) | Tests 46 passed (46)` = `factureQr` (28) + appelants rejoués : `financeInvoice`, `factureClientSaisie`, `incomeProofFlows`, `rxPrixInconnu` (HEAD : 2 verts, ajouté à la revue), `facture-372765`. Avant correction : 1 échec (mon PNG de test était corrompu, `wrong PNG signature`) ; corrigé par un vrai PNG 32 × 32.
- `npx tsc --noEmit` : 2 erreurs, **toutes deux antérieures et sans rapport** (`functions/src/brewerCatalogueStore.ts`, `brewerScenarioStore.ts` : `firebase-admin/firestore` introuvable dans ce worktree) ; aucune dans mes fichiers.
- `node scripts/agents/controle-virgule.mjs` → `VIRGULE OK`.
- `vite build` (sortie dans `%TEMP%`, supprimée) : `built in 28.47s`, 0 erreur.

## Décisions du pilote appliquées
- F1-1 : arrondi entier décimale-sûr (`centimesNet`, 6 décimales avant `Math.round`), testé par **balayage de 20 000 valeurs x,xx5** (toutes à n + 1 ct) ; 2,135 → 214, 4,015 → 402. `toCents` (hors Possède, faux sur 1 132 valeurs) n'est pas utilisé.
- F1-2 : brasserie : nom, rue, numéro, NPA, localité, pays **tous obligatoires** ; le gabarit de `seedData` (« Ville », « Exemple », « Ma Brasserie ») est refusé, même découpé par `adresseDepuisTexte` (test 12b). Messages en « Réglages ».
- PNG dans jsPDF, aucune dépendance neuve ; 300 ppp (revue B), fond blanc opaque, PNG rendu contrôlé (`data:image/png;base64,` et > 1 000 car.). IBAN : seuls les exemples publics du guide SIX, marqués test.
- Aussi : `Infinity` toujours refusé (« précision »), montant ≤ 99 999 999 999 ct, « Case postale 123 » entière dans la rue, NPA à 4 chiffres sinon `null`.

## Doutes et limites
- **Non vérifié ici** : netteté réelle du PNG, fond blanc, poids du PDF, lecture du QR par l'application bancaire, rendu sur iOS. Pas de canvas dans Vitest ; `rasteriserNavigateur` n'est testé qu'en erreur hors navigateur. **Geste du pilote** : Chrome puis téléphone, IBAN d'exemple. Si flou ou lourd : variante vectorielle (D1).
- **Poids du paquet non mesuré** : `swissqrbill` n'entre dans aucun chunk tant qu'aucun écran n'appelle `preparerQrFacture` (build : aucun chunk nouveau). À mesurer quand uv branche la caisse.
- `generateInvoicePdf` : le 4e paramètre `invoiceNumber` n'a plus de valeur par défaut (les deux appelants le passent déjà). `InvoiceSheet.tsx` n'est pas modifié (uv) : il ne montre donc encore ni QR ni adresse, et son ancien numéro `FAC-<année>-<hex>` reste jusqu'à uv.
- Le test 20 (jsPDF décode le PNG sans DOM, section paiement sur page propre à 12 articles) passe en Node.
- `doublonsNumeroFacture` n'a **aucun appelant** tant qu'uv ne le branche pas (R4).

## DÉCISION À PRENDRE
- **D4** branchement de `doublonsNumeroFacture` : à inscrire dans la VOIE uv (avertir à l'enregistrement si le numéro existe) et dans uv ou d2 (signalement à la synchro). Recommandation : uv à l'enregistrement, signalement synchro plus tard.
- **D2 durci par le pilote** : la brasserie doit avoir aussi un **numéro de rue** (un lieu-dit sans numéro est bloqué). Recommandation : accepter, le message l'explique.
- À inscrire pour uv : précharger le chunk `swissqrbill` à l'ouverture de la caisse ; message « Hors ligne : QR indisponible » déjà rendu par `preparerQrFacture` ; appeler `prochainNumeroFacture` à l'enregistrement avec l'année de la date d'émission ; échéance par défaut `echeanceFacture(date, 30)` ; journal par `libelleFacture`.

## DEMANDE EXECUTANT
aucune

CONNAISSANCE : `toCents` (`ledger.ts:5`) arrondit faux sur ~5 % des demi-centimes (`Number.EPSILON` n'agit qu'au voisinage de 1) : 2,135 → 213 ; à corriger hors de f1 si d'autres écrans l'utilisent pour des produits quantité × prix. `swissqrbill` 4.4.1 accepte NPA, localité et rue vides.
LEÇON PROPOSÉE : un PNG de test se fabrique valide (signature et CRC) ; ne jamais en gonfler la fin pour « dépasser 1 000 caractères » (jsPDF lit « wrong PNG signature »).
