# Voie q3 — Fiche = m5fo-a, la fiche rangée avec la facture en barre

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : m5 (maquettes)
- Décideur en cas de doute : pilote

## Objectif
Porter dans l'app la maquette choisie m5fo-a (contrat réécrit du 15.11, `work/missions/2026-11-14-finances/MISSION.md` en bas), branchée, typée, testée, au banc.

## Entrées
- Maquette : `work/missions/2026-11-14-finances/voies/m5/m5fo-a/etat.html`, `m5fo-a.png`, `NOTE.md` ; défauts du critique : lignes « | m5fo-a » de `work/missions/2026-11-14-finances/critique/sv/SYNTHESE-M5.md` (corriger ceux qui ne contredisent pas la maquette).
- Code actuel : `src/ui/finance/TransactionDetails.tsx`, `src/ui/finance/fiche` et leurs appelants (`src/components/tabs/FinancesTab.tsx`, lecture seule).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/TransactionDetails.tsx`
- `src/ui/finance/fiche`
- `tests/integration/ficheBarre.test.tsx`
- `work/missions/2026-11-14-finances/voies/q3`

## Consignes
- `TransactionDetails` devient m5fo-a : la fiche rangée de m2fo-a (en-tête, montant, payé, facture jointe, lignes vers le stock et la recette) avec la facture en barre de m2fo-c (segments proportionnels aux lignes, chacun ouvre son article du stock).
- Toutes les actions actuelles restent atteignables (Modifier, Payer, Rembourser, ouvrir l'article du stock, la recette) ; une action que la maquette n'a pas va dans un « … » et RESULTAT.md le dit.
- Une pièce sans lignes : pas de barre (la fiche rangée seule) ; une pièce sans justificatif : pointillé.
- Un test : barre proportionnelle aux lignes (centimes), clic sur un segment = `onOpenStockItem`.
- Captures 390 et 1280, clair et cave, de l'état ouvert et de l'état après le geste, côte à côte avec la maquette, dans `work/missions/2026-11-14-finances/voies/q3/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : la maquette choisie est portée telle quelle (`etat.html` et l'image de sa voie) : mots, ordre, couleurs, tailles, gestes ; un port retire ce qu'elle n'a pas. Captures côte à côte maquette / app.
- Écritures et paiements : risque élevé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Toute écriture passe par les services existants (Dexie puis Firestore), jamais un chemin parallèle. Les règles Firestore (`../../../firestore.rules`, lecture seule, ne jamais modifier) imposent : un paiement est immuable, une correction passe par un contre-paiement `CONTRE-<id>` du même montant ; `settlementBalanceCents` ≤ montant de la pièce ; création d'un paiement = mise à jour de la pièce limitée à `settlementBalanceCents` et `lastPaymentId`. Un champ en plus sur un paiement est permis.
- Hors ligne gardé ; jamais `type="number"` (`inputmode="decimal"`) ; 44 px ; inconnu ≠ 0 ; hachure = à payer, rouge = en retard, pointillé = sans pièce ; deux thèmes (clair, cave).
- Gemini jamais appelé. Pas de Fable, aucun sous-agent. `npx tsc` : ignorer les erreurs de `functions/`. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (plan d'abord, puis chaque étape faite, écarts à la maquette, LEÇON PROPOSÉE éventuelle).
- La ligne « Tests » : `npx vitest run tests/integration/ficheBarre.test.tsx --reporter=dot > work/missions/2026-11-14-finances/voies/q3/tests.txt`.
Réponse finale au pilote : une ligne.
