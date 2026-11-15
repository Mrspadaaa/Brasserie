# Voie s4 — Correctifs FN-1, FN-3 à FN-12 du jeu en ligne

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 386e29f4 (commité)
- Décideur en cas de doute : pilote

## Objectif
Correctifs FN-1, FN-3 à FN-12 du jeu en ligne : porté dans l'app, branché, typé, testé, au banc (choix du brasseur du 15.11, SPEC-BRASSEUR).

## Entrées
- Ses mots (15.11) : « m1do-a · m1ar-c · m3pr-c · m3pm-d · m3im-c · m4bb-a · m4pf-c · m4ia-c ».
- Les maquettes citées ci-dessous (etat.html, png, NOTE.md) ; `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` pour ses goûts.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/modifier`
- `src/components/EditTransactionModal.tsx`
- `src/domain/finance/correctionMontant.ts`
- `src/ui/finance/payer`
- `src/ui/finance/fiche`
- `src/ui/finance/TransactionDetails.tsx`
- `src/ui/finance/mouvement`
- `src/ui/finance/MovementSheet.tsx`
- `src/ui/finance/CategoryTag.tsx`
- `src/ui/finance/ExpenseSheet.tsx`
- `src/domain/finance/ledger.ts`
- `tests/unit/correctionMontant.test.ts`
- `tests/integration/modifierMontant.test.tsx`
- `tests/integration/payerVirement.test.tsx`
- `tests/integration/ficheBarre.test.tsx`
- `tests/integration/apportPoches.test.tsx`
- `tests/integration/fnJeuEnLigne.test.tsx`
- `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs`
- `work/missions/2026-11-14-finances/voies/s4`

## Consignes
Constats : lignes FN-1 à FN-12 de `work/missions/BUGS.md` et `work/missions/2026-11-14-finances/voies/z1/JEU-EN-LIGNE.md` (FN-2 est à la voie s1). Les trois graves d'abord :
- **FN-10** (baisse sous le payé) : jamais d'argent qui disparaît. Deux choix : « Erreur de saisie : j'ai payé 9,00 » (le paiement suit, comme aujourd'hui) et « J'ai bien payé 10,00 : 1,00 trop payé » qui enregistre un avoir à recevoir de 1,00 du fournisseur par le mécanisme d'avoir existant (`refund`, « Enregistrer un avoir ou remboursement ») ; la caisse reste juste. `planCorrection` testé ; l'émulateur `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs` rejoué avec ce cas (EMULATEUR OK).
- **FN-12** : un apport (ou prélèvement) ne devient jamais une créance « À encaisser » ; corriger son montant suit le paiement ; « Noter un encaissement » n'apparaît pas pour un apport ; **FN-11** : pas d'« Échéance et prévision » sur un apport.
- **FN-8** : « Fournisseur, n° de pièce » montre le fournisseur et le n° existants ; **FN-9** : « Précision » ne se remplit jamais seule (aucun « Divers » ajouté à l'enregistrement).
- **FN-3, FN-4** : la barre de Payer donne une couleur par pièce (celles de m5pa-d) et une étiquette qui les distingue (nom court lisible, pas le premier mot en minuscules). **FN-5** : icône pour « Autres frais ». **FN-6** : dans la fiche, une paire paiement / contre-paiement se replie en une ligne « corrigé » (détail à un toucher). **FN-7** : la ligne d'un paiement issu d'un virement dit « virement de 12,00 · 2 pièces ».
- **FN-1** : lire la maquette choisie de l'ajout d'une dépense (f2d, `work/missions/2026-11-10-onglet-finances/v0/f2d/`) : si elle met « Payé » par défaut, FN-1 est écarté (le dire dans RESULTAT.md, état « écarté » à proposer) ; sinon suivre la maquette.
- Mettre l'état de chaque FN traité dans RESULTAT.md (le pilote met BUGS.md à jour).
- Captures 390 et 1280, clair et cave, de chaque vue ouverte et après son geste, côte à côte avec sa maquette, dans `work/missions/2026-11-14-finances/voies/s4/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : chaque maquette choisie portée telle quelle (`etat.html`, image, NOTE.md de sa voie ; les défauts du critique y sont déjà corrigés en passe 2) : mots, ordre, couleurs, tailles, gestes ; un port retire ce qu'elle n'a pas ; captures côte à côte maquette / app. Plancher à enrichir pour le contenu actuel (L07) : une donnée ou action actuelle sans place dans la maquette va dans un « … » et RESULTAT.md le dit.
- Acquis à garder verts : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK), `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK), ses choix déjà en ligne (v6a + s2ap2, g3a, p5b, g6, m5pa-d, m5ap-a, m5fo-a, m5mo-c).
- Écritures et paiements : risque élevé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Services existants seulement ; règles Firestore `C:/Users/mrspa/Documents/Brasserie/firestore.rules` en lecture seule (paiement immuable, contre-paiement `CONTRE-<id>`, un lot par étape comme `src/ui/finance/modifier/executerCorrection.ts`).
- Hors ligne gardé ; jamais `type="number"` ; 44 px ; inconnu ≠ 0 ; hachure = à payer, rouge = en retard, pointillé = sans pièce ; clair et cave. Gemini jamais appelé (simulé dans les tests).
- Pas de Fable, aucun sous-agent. `npx tsc` : `node work/missions/2026-11-14-finances/outils/tsc.mjs` ignore `functions/`. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas. Trois autres voies écrivent en même temps dans d'autres fichiers.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (plan, chaque étape, écarts à la maquette).
- La ligne « Tests » : `npx vitest run tests/unit/correctionMontant.test.ts tests/integration/modifierMontant.test.tsx tests/integration/payerVirement.test.tsx tests/integration/ficheBarre.test.tsx tests/integration/apportPoches.test.tsx tests/integration/fnJeuEnLigne.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s4/tests.txt`.
Réponse finale au pilote : une ligne.
