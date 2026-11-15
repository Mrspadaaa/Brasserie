# Voie q4 — Modifier = m5mo-c, tout se modifie, montant payé compris

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : m5 (maquettes)
- Décideur en cas de doute : pilote

## Objectif
Porter dans l'app la maquette choisie m5mo-c (contrat réécrit du 15.11, `work/missions/2026-11-14-finances/MISSION.md` en bas), branchée, typée, testée, au banc.

## Entrées
- Maquette : `work/missions/2026-11-14-finances/voies/m5/m5mo-c/etat.html`, `m5mo-c.png`, `NOTE.md` ; défauts du critique : lignes « | m5mo-c » de `work/missions/2026-11-14-finances/critique/sv/SYNTHESE-M5.md` (corriger ceux qui ne contredisent pas la maquette).
- Code actuel : `src/components/EditTransactionModal.tsx`, `src/ui/finance/modifier`, `src/domain/finance/correctionMontant.ts` et leurs appelants (`src/components/tabs/FinancesTab.tsx`, lecture seule).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/components/EditTransactionModal.tsx`
- `src/ui/finance/modifier`
- `src/domain/finance/correctionMontant.ts`
- `tests/unit/correctionMontant.test.ts`
- `tests/integration/modifierMontant.test.tsx`
- `work/missions/2026-11-14-finances/voies/q4`

## Consignes
- `EditTransactionModal` (seul appelant : `FinancesTab`) devient m5mo-c : la pièce en tête, les champs de m2mo-a, le montant **modifiable même payé** ; quand il change sur une pièce payée, le choix « Le paiement suit » / « Reste à payer » et l'aperçu avant / après de m5mo-c.
- Règle du domaine (décision du pilote, prudente et réversible) : le verrou `moneyLocked` ne tient plus que si l'**année de la pièce est close** (une clôture existe pour cette année) ou archivée, ou si la pièce est annulée ; il dit alors pourquoi en une ligne. Sinon tout se modifie.
- Fonction pure `planCorrection(piece, paiements, nouveauMontantCents, choix)` dans `src/domain/finance/correctionMontant.ts` qui rend la suite d'écritures permise par les règles Firestore : hausse + « paiement suit » = changer le montant puis un paiement de la différence ; hausse + « reste à payer » = changer le montant seul ; baisse sous le payé = contre-paiement `CONTRE-<id>` du dernier paiement, changer le montant, puis un paiement du nouveau montant (moins ce qui reste payé) ; baisse au-dessus du payé = changer le montant seul. Testée (Vitest), en centimes. L'écran exécute ce plan par les services existants, dans l'ordre.
- TVA : si la pièce a une ventilation TVA, elle est recalculée comme aujourd'hui pour une pièce non verrouillée.
- Captures 390 et 1280, clair et cave, de l'état ouvert et de l'état après le geste, côte à côte avec la maquette, dans `work/missions/2026-11-14-finances/voies/q4/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : la maquette choisie est portée telle quelle (`etat.html` et l'image de sa voie) : mots, ordre, couleurs, tailles, gestes ; un port retire ce qu'elle n'a pas. Captures côte à côte maquette / app.
- Écritures et paiements : risque élevé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Toute écriture passe par les services existants (Dexie puis Firestore), jamais un chemin parallèle. Les règles Firestore (`../../../firestore.rules`, lecture seule, ne jamais modifier) imposent : un paiement est immuable, une correction passe par un contre-paiement `CONTRE-<id>` du même montant ; `settlementBalanceCents` ≤ montant de la pièce ; création d'un paiement = mise à jour de la pièce limitée à `settlementBalanceCents` et `lastPaymentId`. Un champ en plus sur un paiement est permis.
- Hors ligne gardé ; jamais `type="number"` (`inputmode="decimal"`) ; 44 px ; inconnu ≠ 0 ; hachure = à payer, rouge = en retard, pointillé = sans pièce ; deux thèmes (clair, cave).
- Gemini jamais appelé. Pas de Fable, aucun sous-agent. `npx tsc` : ignorer les erreurs de `functions/`. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (plan d'abord, puis chaque étape faite, écarts à la maquette, LEÇON PROPOSÉE éventuelle).
- La ligne « Tests » : `npx vitest run tests/unit/correctionMontant.test.ts tests/integration/modifierMontant.test.tsx --reporter=dot > work/missions/2026-11-14-finances/voies/q4/tests.txt`.
Réponse finale au pilote : une ligne.
