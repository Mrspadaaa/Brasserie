# Voie q2 — Apport = m5ap-a, les deux poches avec justificatif

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : m5 (maquettes)
- Décideur en cas de doute : pilote

## Objectif
Porter dans l'app la maquette choisie m5ap-a (contrat réécrit du 15.11, `work/missions/2026-11-14-finances/MISSION.md` en bas), branchée, typée, testée, au banc.

## Entrées
- Maquette : `work/missions/2026-11-14-finances/voies/m5/m5ap-a/etat.html`, `m5ap-a.png`, `NOTE.md` ; défauts du critique : lignes « | m5ap-a » de `work/missions/2026-11-14-finances/critique/sv/SYNTHESE-M5.md` (corriger ceux qui ne contredisent pas la maquette).
- Code actuel : `src/ui/finance/MovementSheet.tsx`, `src/ui/finance/mouvement` et leurs appelants (`src/components/tabs/FinancesTab.tsx`, lecture seule).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/MovementSheet.tsx`
- `src/ui/finance/mouvement`
- `tests/integration/apportPoches.test.tsx`
- `work/missions/2026-11-14-finances/voies/q2`

## Consignes
- `MovementSheet` (Opérations › « Apport ou prélèvement privé ») devient m5ap-a : Ta poche → La brasserie, le montant sur la flèche, « Dans l'autre sens : je reprends », l'effet (caisse change, ventes − dépenses inchangé), Quand, Sur quel compte, Motif, le justificatif, Enregistrer.
- Le justificatif est la pièce de l'opération d'apport, par le mécanisme de pièce jointe existant de la pièce (lire `EditTransactionModal`, `ExpenseSheet`, `ProofUploadNotice`).
- Le remboursement (`original` passé à `MovementSheet`) garde son comportement actuel ; le décrire dans RESULTAT.md s'il n'a pas de place dans la maquette.
- Un test d'intégration : l'apport enregistré a le bon sens, le bon montant, le bon compte, son justificatif ; le prélèvement aussi.
- Captures 390 et 1280, clair et cave, de l'état ouvert et de l'état après le geste, côte à côte avec la maquette, dans `work/missions/2026-11-14-finances/voies/q2/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : la maquette choisie est portée telle quelle (`etat.html` et l'image de sa voie) : mots, ordre, couleurs, tailles, gestes ; un port retire ce qu'elle n'a pas. Captures côte à côte maquette / app.
- Écritures et paiements : risque élevé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Toute écriture passe par les services existants (Dexie puis Firestore), jamais un chemin parallèle. Les règles Firestore (`../../../firestore.rules`, lecture seule, ne jamais modifier) imposent : un paiement est immuable, une correction passe par un contre-paiement `CONTRE-<id>` du même montant ; `settlementBalanceCents` ≤ montant de la pièce ; création d'un paiement = mise à jour de la pièce limitée à `settlementBalanceCents` et `lastPaymentId`. Un champ en plus sur un paiement est permis.
- Hors ligne gardé ; jamais `type="number"` (`inputmode="decimal"`) ; 44 px ; inconnu ≠ 0 ; hachure = à payer, rouge = en retard, pointillé = sans pièce ; deux thèmes (clair, cave).
- Gemini jamais appelé. Pas de Fable, aucun sous-agent. `npx tsc` : ignorer les erreurs de `functions/`. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (plan d'abord, puis chaque étape faite, écarts à la maquette, LEÇON PROPOSÉE éventuelle).
- La ligne « Tests » : `npx vitest run tests/integration/apportPoches.test.tsx --reporter=dot > work/missions/2026-11-14-finances/voies/q2/tests.txt`.
Réponse finale au pilote : une ligne.
