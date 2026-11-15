OK — justificatif de paiement sur la fiche, 5 tests réalignés ; suite = base (59 fichiers, 14 tests), build et typage verts

## Fichiers écrits
- `src/ui/finance/DocumentProofLink.tsx` : prop optionnelle `document={{id,fileName}}` ; avec elle, le lien ne lit que ce document (jamais le justificatif de la pièce). Sans elle : comportement inchangé (`documentProofLink.test`, `fiche.test` d3c verts dans la suite).
- `src/ui/finance/TransactionDetails.tsx` : sous « Paiements », la ligne du paiement qui porte `proofDocumentId` montre une rangée « ▢ nom du fichier — Justificatif » ; un paiement sans justificatif n'en montre pas.
- `src/ui/finance/fiche/fiche.css` : 3 règles `.fiche-hist-pj` (nom à gauche, lien à droite, jetons du thème).
- `tests/integration/financeWorkspace.test.tsx` : nouveau test du justificatif de paiement (2 paiements, un seul avec justificatif ; le clic charge `proof-virement` et lui seul) ; « Date réelle du paiement » et « Enregistrer ce mouvement » réécrits (voir plus bas).
- `tests/integration/depenseMedicament.test.tsx`, `tests/integration/editTransactionBe66.test.tsx`, `tests/integration/liveDataViews.test.tsx` : réalignés (voir plus bas).
- `voies/r2/` : `tests.txt`, `tests-complet.txt`, `ROUGES.md`, `build.txt`, `capturer.mjs`, `cap/` (4 PNG).

## Tests voisins réalignés (comportement remplacé par ses choix, rien d'autre baissé)
- `financeWorkspace` « date réelle » : m5pa-d. Pièce sans suivi : s'ouvre sur « autre », date vide et obligatoire. Facture suivie : « aujourd’hui » pressé, pas de champ ; « autre » ouvre le champ plafonné à aujourd’hui. (Avant : champ toujours visible, valeur du jour.)
- `financeWorkspace` « apport privé » : m5ap-a. Feuille « De ta poche à la brasserie », bouton « Enregistrer l’apport » ; les chiffres gardés (caisse 22 050, ventes 0, apport 12 050). « Enregistrer ce mouvement » reste dans le test de l'avoir (inchangé, q2 l'a laissé tel quel).
- `depenseMedicament` : le renvoi ouvre « De la brasserie à ta poche » + « Enregistrer le prélèvement » (m5ap-a), montant et motif préremplis comme avant. Le mock `FinanceService` de ce fichier recevait `getPlans` seul : ajout de `getPayments` et `getProfile` (la feuille lit le registre pour son effet sur la caisse ; sans solde de départ : « — »).
- Rouges réels venus de q4, hors des deux fichiers du VOIE.md, nommés comme la consigne le permet : `editTransactionBe66` (2 tests) et `liveDataViews` (1 test) attendaient l'ancien « Modifier » (total « 0,00 CHF » toujours montré, « Dossier Google Drive »). m5mo-c : TVA et total seulement si assujettie, montants sans « CHF », chemin Drive en mots. Réalignés : config assujettie simulée, `'216,20'`, `'0,00'`, `'23,80'`, bloc `.mod-drv`, aucun nombre à point décimal gardé (`/\d\.\d{2}(?!\d)/`).

## Critères
- G1 `vitest-lu.mjs tests.txt` : `VITEST OK` (5 fichiers, 55 tests ; la ligne du VOIE.md en demandait 3 : ajout de `editTransactionBe66` et `liveDataViews`). Commande avec `NO_COLOR=1` (sinon codes ANSI et le lecteur répond ECHEC à tort, relevé par q1, q2, q4).
- G2 `lire.mjs ROUGES.md "base rouge" ROUGES` : `ROUGES OK`. Suite complète : 59 fichiers rouges, 14 tests rouges, 13 790 verts : identique à f2 (`comm` : 0 fichier neuf, 0 disparu).
- G3 `lire.mjs build.txt "built in" BUILD` : `BUILD OK` (32 s) ; `check-no-dev-auth.mjs` : bundle propre.
- G4 `tsc.mjs` : `TSC OK`.
- Essais : G1 3 (mock FinanceService incomplet, puis libellés CHF de q4), les autres 1.

## Captures (ouvertes, 4 vues)
`cap/fiche-pj-390-clair.png`, `-390-cave.png`, `-1280-clair.png`, `-1280-cave.png` : fiche « Loyer de l’atelier » (pièce payée, facture jointe), paiement du 9 nov. avec « Virement 9 nov. 2026.pdf » et lien « Justificatif » en bleu à droite, « Corriger ce paiement… » dessous. Lisible dans les deux thèmes, aucun débordement, aucune erreur console. La ligne de la pièce (« facture · bail-atelier.pdf ») et celle du paiement se distinguent par le nom du fichier. Banc `?dev-local&finance-demo`, paiement ajouté en mémoire seulement (`PAI-R2-VIR`).

## Contrôles de la v6a et de la frise
- `controle-v6a.mjs 3000` : `V6A OK`.
- `controle-frise.mjs 3000` : `FRISE ECHEC` (4 KO : barre du 14 vide, loyer « hors plage », légende null, poignée). Le script cible en dur « le 14 nov. » (`barres[13]`, plage « 1er → 14 nov. ») ; les paiements de la démo sont datés d'aujourd'hui, donc du 15. C'est la date du jour, pas un des quatre ports : aucun fichier de l'écran Opérations ou de la frise n'est modifié (`git status`). À rejouer avec la date fixée ou le script rendu indépendant du jour (hors de ma voie : f1).

## Doutes et limites
- Base : je n'ai pas remonté un worktree de base ; j'ai pris la liste de f2 (rouges d'environnement, faite sur sa base) et vérifié l'identité exacte des fichiers et du nombre de tests. Les causes sont celles de f2 (`functions/` sans node_modules, etc.).
- Première passe complète : 63 fichiers, 27 tests (lancée pendant la compilation et les captures). Outre les 3 tests réalignés : `modifierMontant` (9) et `fuzzSaisie` (1, 30 s dépassées) rouges sous charge, verts seuls ×3, avec 20 autres fichiers et dans la 2e passe. Les assertions de `modifierMontant` en cause (« un lot Firestore par étape », `B1`) dépendent du découpage des écritures par tour de boucle : à surveiller sous charge (voie q4, `executerCorrection.ts`).
- Le lien « Justificatif » d'un paiement ouvre le document par `loadFinanceDocument` (Drive) ; testé avec ce service simulé, pas joué sur Drive réel. Dans le banc, il n'ouvre rien (pas de Drive).
- Un paiement déjà écrit ne peut pas recevoir de justificatif après coup (les paiements sont immuables) : le justificatif se joint au moment de payer (q1).
- Le test de la fiche vit dans `financeWorkspace.test.tsx` (mon Possède), pas dans `ficheBarre.test.tsx` (q3).

DÉCISION À PRENDRE : aucune (le libellé « Justificatif » du lien du paiement reprend celui de la pièce ; la maquette m5fo-a n'a pas de justificatif de paiement : la rangée est une extension minimale de sa ligne de paiement).

CONNAISSANCE : `controle-frise.mjs` dépend de la date du jour (le 14 du mois codé en dur) : il échoue tout autre jour que le 14.
LEÇON PROPOSÉE : un contrôle de banc ne code pas la date en dur (il lit `todayISO` ou fixe l'horloge) ; relevé : frise rouge le lendemain de sa voie.
