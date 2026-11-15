# Voie q6 — les 11 problèmes du test d'écran 8151bee7

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : 8151bee7 (commité)
- Décideur en cas de doute : pilote

## Objectif
Corriger les problèmes 1 à 11 de `work/missions/2026-10-31-ecran-depense/avant-deploiement/8151bee7/VERDICT.md` (captures dans ce dossier), sans rien changer d'autre.

## Entrées
- `work/missions/2026-10-31-ecran-depense/avant-deploiement/8151bee7/VERDICT.md` et ses captures (ouvrir celles citées).
- Maquettes : `work/missions/2026-11-14-finances/voies/m5/m5pa-d`, `m5ap-a`, `m5mo-c` (etat.html et png).
- `work/missions/2026-11-14-finances/voies/q5/RESULTAT.md` (un lot par étape, émulateur : `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/payer`, `src/ui/finance/mouvement`, `src/ui/finance/MovementSheet.tsx`, `src/ui/finance/modifier`, `src/components/EditTransactionModal.tsx`, `src/domain/finance/correctionMontant.ts`
- `src/ui/finance/TransactionRow.tsx`, `src/ui/finance/operations.css` (point 10 seulement)
- `tests/unit/correctionMontant.test.ts`, `tests/integration/modifierMontant.test.tsx`, `tests/integration/payerVirement.test.tsx`, `tests/integration/apportPoches.test.tsx`
- `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs` (le rejouer, l'adapter si le plan change)
- `work/missions/2026-11-14-finances/voies/q6`

## Consignes (décisions du pilote)
- **1** : une baisse **sous le payé** ne propose plus « Reste à payer » (le payé ne disparaît jamais) : seul « Le paiement suit » (c'était une erreur de saisie), et une ligne « Trop payé 12,00 ? Enregistre un avoir depuis la fiche » qui mène à l'avoir existant. Une baisse au-dessus du payé et une hausse gardent les deux choix de m5mo-c. Jamais d'échéance inventée pour une pièce payée. Test Vitest ; émulateur rejoué.
- **2, 3, 9** : le montant du virement a une seule valeur à l'écran : champ, barre et bouton disent le même nombre ; au-delà du total, le champ est ramené au total et le message tient sur une ligne sous le champ ; décocher une pièce recale le montant au nouveau total (s'il le dépassait). Test.
- **4** : l'effet « Ventes − dépenses » de l'apport se calcule comme Opérations (matériel à part exclu) ; même fonction que la bande d'Opérations, pas une copie. Test : +23,20 sur le banc de m5ap-a.
- **5** : Payer à 1280 : le corps occupe la largeur de la feuille comme la fiche.
- **6** : valeurs des champs centrées verticalement à 390 (Payer, Modifier, Apport) ; « sans TVA » sur la même ligne que le montant comme m5mo-c.
- **7** : « autre » date vide : le bouton dit pourquoi (« Choisis la date ») au lieu d'être gris muet.
- **8** : titre comme m5pa-d : « Payer l'Atelier » (article élidé devant voyelle) ; sinon « Payer » et le nom tel quel.
- **10** : la pastille d'échéance d'une rangée ne se coupe pas à 390 (« dans 10 j » visible) ; `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` reste V6A OK.
- **11** : Apport : les choix non pris gardent leur bord (boutons), « ⇄ Dans l'autre sens : je reprends » en lien bleu, comme m5ap-a.
- Captures 390 et 1280, clair et cave, de chaque point corrigé, dans `work/missions/2026-11-14-finances/voies/q6/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : m5pa-d, m5ap-a, m5mo-c, v6a telles quelles. Écritures : un lot par étape (q5), règles Firestore en lecture seule (`C:/Users/mrspa/Documents/Brasserie/firestore.rules`). Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Jamais `type="number"` ; 44 px. Pas de Fable, aucun sous-agent. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, une ligne par point.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/q6/emulateur.txt`.
- La ligne « Tests » : `npx vitest run tests/unit/correctionMontant.test.ts tests/integration/modifierMontant.test.tsx tests/integration/payerVirement.test.tsx tests/integration/apportPoches.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/q6/tests.txt`.
Réponse finale au pilote : une ligne.
