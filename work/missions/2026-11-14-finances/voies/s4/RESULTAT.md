OK — FN-3 à FN-12 portés, testés (102 verts), émulateur OK ; captures à faire par l'exécutant, FN-1 écarté à valider

## Critères
- G1 : `node …/vitest-lu.mjs …/s4/tests.txt` → VITEST OK (6 fichiers, 102 tests verts).
- G2 : `node …/tsc.mjs` → TSC OK.
- G3 : `node …/o1/controle-v6a.mjs 3000` → V6A OK.
- Émulateur (FN-10) : `…/s4/emulateur.txt` → « EMULATEUR OK : 8 contrôles joués contre les règles du dépôt, un lot par étape ; témoins refusés », dont le nouveau cas « baisse sous le payé + j'ai bien payé : l'avoir à recevoir de 2,00 est accepté ».
- Essais : 1 par critère après correction de 3 tests (étiquette, ligne « correction », radio).

## État de chaque FN (le pilote met BUGS.md à jour)
- **FN-1 : écarté, à valider.** f2d (« Mon mois », `v0/f2d/NOTE.md` seul, pas d'etat.html) ne dit rien du règlement par défaut de la saisie ; `ecrans.json` : « Fond = la vraie Nouvelle dépense, jamais le fond dessiné de la maquette ». Aucune maquette ne met « À payer » par défaut : rien changé dans ExpenseSheet. DÉCISION À PRENDRE : garder « Payé » par défaut (comptoir) ou passer à « À payer » ; recommandation : garder, état « écarté ».
- **FN-10 : corrigé.** Sous le payé, deux choix, aucun d'office (Enregistrer sans choix dit « Choisis… » et n'écrit rien) : « Erreur de saisie : j'ai payé 9,00 » (le paiement suit) et « J'ai bien payé 10,00 : 1,00 trop payé » (avoir à recevoir). `planCorrection(…, 'avoir')` ajoute l'étape `avoir` ; `avoirDeTropPaye` bâtit le `refund` (lié à la pièce, `refundApplication: 'cash'`, non encaissé, sens inverse), écrit par `StorageService.addTransaction` après `validateRefundTransaction` (vérifié avant la première écriture). « Reste à payer » n'existe toujours pas sous le payé.
- **FN-12 : corrigé.** `estMouvementPrive` : le plan d'un apport / prélèvement force « suit », jamais d'avoir ; la fiche n'offre ni « Noter un encaissement », ni « Corriger ce paiement saisi par erreur » (c'est ce geste qui créait la créance) ; un apport sans paiement affiche « Apport : aucun paiement noté », jamais « À encaisser ». Annuler l'écriture et Modifier restent.
- **FN-11 : corrigé** (pas d'« Échéance et prévision » ni d'échéance sur un apport).
- **FN-8 : corrigé.** « Fournisseur, n° de pièce » montre `finance.vendor · finance.invoiceNumber` quand `proofNotes` est vide ; retapé, il réécrit fournisseur (avant « · ») et n° de pièce ; `proofNotes` n'est pas rempli.
- **FN-9 : corrigé.** `subcategory` n'est plus remplie par « Divers » (reste vide).
- **FN-3, FN-4 : corrigés.** `payer/etiquettes.ts` : couleur par pièce (teinte de catégorie de m5pa-d, rouge en retard ; deux pièces de même teinte : variantes `color-mix` claire / sombre) ; nom court distinct (« pièce A », « pièce B » ; premier mot minuscule « loyer » quand il suffit, comme la maquette ; « retard · nom » si deux retards).
- **FN-5 : corrigé** : `strokeLinecap="round"` sur les pastilles de la fiche et de Modifier (les points de longueur nulle se dessinent).
- **FN-6 : corrigé.** Paire paiement / contre-paiement repliée en une ligne « date · mode · corrigé » + montant barré ; un toucher ouvre les deux écritures.
- **FN-7 : corrigé.** La ligne dit « virement de 12,00 · 2 pièces » (lue dans la note « Virement de … réparti sur N pièces », anciennes écritures comprises).

## Fichiers écrits
`src/domain/finance/correctionMontant.ts`, `src/components/EditTransactionModal.tsx`, `src/ui/finance/modifier/executerCorrection.ts`, `src/ui/finance/modifier/modifier.css`, `src/ui/finance/TransactionDetails.tsx`, `src/ui/finance/fiche/fiche.css`, `src/ui/finance/payer/PayerVirement.tsx`, `src/ui/finance/payer/etiquettes.ts` (neuf), `tests/unit/correctionMontant.test.ts`, `tests/integration/modifierMontant.test.tsx`, `tests/integration/fnJeuEnLigne.test.tsx` (neuf), `work/…/q5/emulateur.mjs`, `s4/tests.txt`, `s4/emulateur.txt`. (`git status` montre d'autres fichiers modifiés par les autres voies.)

## Écarts, doutes, limites
- Caisse sous « J'ai bien payé » : les règles Firestore interdisent un réglé au-dessus du montant ; le paiement redescend donc au nouveau montant (ex. 9,00) et l'excédent (1,00) apparaît comme avoir à recevoir : la caisse du registre est sur-estimée de 1,00 jusqu'à l'encaissement de l'avoir, la créance est visible. Pas d'argent « disparu », mais pas non plus une caisse exacte au centime avant encaissement. À confirmer par le pilote.
- Choix imposé (pas de défaut) sous le payé : écart à « le paiement suit, comme aujourd'hui » ; voulu (FN-10 : « sans rien demander »). Réversible : un défaut « suit » = une ligne.
- Un apport : plus de correction d'un paiement isolé depuis la fiche (seul Modifier et l'annulation). À confirmer.
- L'aperçu « Dans Opérations » ne montre pas la rangée de l'avoir (le texte du choix la dit).
- Pastille « Autres frais » ailleurs (rangées d'Opérations, hors Possède) : même trait non arrondi probable (`operations/`), à vérifier par la voie qui la possède.
- Pas de capture ni de revue visuelle faites (plafond de contexte atteint) : validation visuelle NON effectuée. Mise en page 390 des deux choix de Modifier (deux colonnes, libellés longs) non vue.

## DEMANDE EXECUTANT
Banc déjà lancé : `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Dossier : `work/missions/2026-11-14-finances/voies/s4/cap/`.
1. Rejouer : `npx vitest run tests/unit/correctionMontant.test.ts tests/integration/modifierMontant.test.tsx tests/integration/payerVirement.test.tsx tests/integration/ficheBarre.test.tsx tests/integration/apportPoches.test.tsx tests/integration/fnJeuEnLigne.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s4/tests.txt` puis `node work/missions/2026-11-14-finances/outils/vitest-lu.mjs …/s4/tests.txt` (attendu VITEST OK) ; `node work/missions/2026-11-14-finances/outils/tsc.mjs` (TSC OK) ; `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK) ; `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK) ; `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs` (EMULATEUR OK).
2. Captures 390 (tactile) et 1280, thèmes clair et cave, une à la fois, chacune ouverte en image, côte à côte avec la maquette (`voies/m5/m5pa-d/m5pa-d.png`, `m5mo-c/m5mo-c.png`, `m5fo-a/m5fo-a.png`, `m5ap-a/m5ap-a.png`) :
   a. Payer m5pa-d : deux pièces « ZZ TEST — pièce A » 10,00 et « … pièce B » 15,00 (même fournisseur, catégorie Autres frais), virement 12,00 : barre à deux couleurs, légende « pièce A 10,00 · pièce B 2,00 · reste 13,00 » ; avant et après « ✓ Payer ».
   b. Modifier m5mo-c : pièce payée 10,00 → 9,00 : les deux choix « Erreur de saisie : j'ai payé 9,00 » / « J'ai bien payé 10,00 : 1,00 trop payé » (390 : lisibilité, pas de débordement) ; après « J'ai bien payé » : fiche de la pièce (9,00 payé) et l'avoir de 1,00 « à encaisser » dans Opérations ; champ « Fournisseur, n° de pièce » rempli, « Précision » vide.
   c. Fiche m5fo-a : pastille « Autres frais » avec ses trois points ; Paiements avec une ligne « corrigé » repliée puis ouverte ; ligne « virement de 12,00 · 2 pièces ».
   d. Apport m5ap-a : fiche d'un apport (ni « Échéance et prévision », ni « Noter un encaissement ») ; corriger son montant (hausse) : le paiement suit, aucun « À encaisser ».
3. Rendre la liste des défauts vus (numérotée) ; le pilote renvoie à l'auteur pour juger.

DÉCISION À PRENDRE : FN-1 (voir plus haut) ; caisse pendant l'avoir à recevoir ; défaut « suit » ou choix imposé sous le payé. Recommandation : FN-1 écarté, choix imposé gardé, caisse acceptée avec la créance visible.

CONNAISSANCE : les règles Firestore (`paymentBalance(after) <= paymentAmount(after)`) interdisent un paiement net au-dessus du montant de la pièce : un trop-payé réel se représente par un paiement redescendu + un avoir `refund` à recevoir, jamais par un réglé excédentaire.

LEÇON PROPOSÉE : aucune
