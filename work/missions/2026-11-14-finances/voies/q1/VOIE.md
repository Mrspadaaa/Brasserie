# Voie q1 — Payer = m5pa-d, un virement pour plusieurs pièces

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : m5 (maquettes)
- Décideur en cas de doute : pilote

## Objectif
Porter dans l'app la maquette choisie m5pa-d (contrat réécrit du 15.11, `work/missions/2026-11-14-finances/MISSION.md` en bas), branchée, typée, testée, au banc.

## Entrées
- Maquette : `work/missions/2026-11-14-finances/voies/m5/m5pa-d/etat.html`, `m5pa-d.png`, `NOTE.md` ; défauts du critique : lignes « | m5pa-d » de `work/missions/2026-11-14-finances/critique/sv/SYNTHESE-M5.md` (corriger ceux qui ne contredisent pas la maquette).
- Code actuel : `src/ui/finance/FinanceForms.tsx`, `src/ui/finance/payer`, `src/domain/finance/repartition.ts`, `src/domain/finance/types.ts` et leurs appelants (`src/components/tabs/FinancesTab.tsx`, lecture seule).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/FinanceForms.tsx`
- `src/ui/finance/payer`
- `src/domain/finance/repartition.ts`
- `src/domain/finance/types.ts`
- `tests/unit/repartitionVirement.test.ts`
- `tests/integration/payerVirement.test.tsx`
- `work/missions/2026-11-14-finances/voies/q1`

## Consignes
- La feuille Payer (`PaymentSheet`, ouverte depuis une rangée « à payer » ou la fiche) devient m5pa-d : un seul montant de virement pour toutes les pièces encore à payer du **même fournisseur** ; il solde d'abord la plus ancienne (le retard), puis la suivante ; la dernière peut rester en partie à payer. Une pièce seule : la même feuille, une seule rangée.
- État de l'art (L29) : c'est l'imputation d'un paiement sur des factures ouvertes (« payment allocation », FIFO par échéance puis date). Une fonction pure `repartirVirement(pieces, montantCents)` dans `src/domain/finance/repartition.ts`, en centimes entiers, testée (Vitest : FIFO, partiel, montant > total refusé, pièces d'autres fournisseurs exclues, arrondis).
- Écriture : un paiement par pièce touchée (même date, même moyen), par le service actuel de `PaymentSheet`, l'un après l'autre (chaque pièce a son `lastPaymentId`).
- Justificatif : celui de m5pa-d (photo ou fichier), joint à chaque paiement du virement par un champ optionnel `proofDocumentId` (et nom) sur `FinancialPayment`, déposé par le mécanisme de pièce jointe existant (`ExpenseSheet`, `ProofUploadNotice`, `DocumentProofLink` : le lire, ne pas en créer un autre). Sans justificatif, le paiement s'enregistre quand même (la ligne le dit, pointillé).
- Captures 390 et 1280, clair et cave, de l'état ouvert et de l'état après le geste, côte à côte avec la maquette, dans `work/missions/2026-11-14-finances/voies/q1/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : la maquette choisie est portée telle quelle (`etat.html` et l'image de sa voie) : mots, ordre, couleurs, tailles, gestes ; un port retire ce qu'elle n'a pas. Captures côte à côte maquette / app.
- Écritures et paiements : risque élevé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Toute écriture passe par les services existants (Dexie puis Firestore), jamais un chemin parallèle. Les règles Firestore (`../../../firestore.rules`, lecture seule, ne jamais modifier) imposent : un paiement est immuable, une correction passe par un contre-paiement `CONTRE-<id>` du même montant ; `settlementBalanceCents` ≤ montant de la pièce ; création d'un paiement = mise à jour de la pièce limitée à `settlementBalanceCents` et `lastPaymentId`. Un champ en plus sur un paiement est permis.
- Hors ligne gardé ; jamais `type="number"` (`inputmode="decimal"`) ; 44 px ; inconnu ≠ 0 ; hachure = à payer, rouge = en retard, pointillé = sans pièce ; deux thèmes (clair, cave).
- Gemini jamais appelé. Pas de Fable, aucun sous-agent. `npx tsc` : ignorer les erreurs de `functions/`. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (plan d'abord, puis chaque étape faite, écarts à la maquette, LEÇON PROPOSÉE éventuelle).
- La ligne « Tests » : `npx vitest run tests/unit/repartitionVirement.test.ts tests/integration/payerVirement.test.tsx --reporter=dot > work/missions/2026-11-14-finances/voies/q1/tests.txt`.
Réponse finale au pilote : une ligne.
