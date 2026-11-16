# Voie s1 — Doublons m1do-a, Archives m1ar-c, FN-2

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 386e29f4 (commité)
- Décideur en cas de doute : pilote

## Objectif
Doublons m1do-a, Archives m1ar-c, FN-2 : porté dans l'app, branché, typé, testé, au banc (choix du brasseur du 15.11, SPEC-BRASSEUR).

## Entrées
- Ses mots (15.11) : « m1do-a · m1ar-c · m3pr-c · m3pm-d · m3im-c · m4bb-a · m4pf-c · m4ia-c ».
- Les maquettes citées ci-dessous (etat.html, png, NOTE.md) ; `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` pour ses goûts.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/TransactionJournal.tsx`
- `src/ui/finance/operations`
- `src/ui/finance/operations.css`
- `src/ui/finance/journal.css`
- `src/ui/finance/ArchiveManagerSheet.tsx`
- `src/ui/finance/TransactionRow.tsx`
- `src/domain/finance/duplicates.ts`
- `src/domain/finance/archive.ts`
- `tests/integration/doublonsPaire.test.tsx`
- `tests/integration/archivesFrise.test.tsx`
- `tests/integration/operationsPeriode.test.tsx`
- `work/missions/2026-11-14-finances/voies/s1`

## Consignes
- **Doublons = m1do-a** (`work/missions/2026-11-14-finances/voies/m1/m1do-a/`) : la paire dans la liste, ses gestes (garder les deux / annuler celle-ci) ; « Ce n'est pas un doublon » gardé.
- **Archives = m1ar-c** (`work/missions/2026-11-14-finances/voies/m1/m1ar-c/`) : la frise des années avec la poignée, ranger une année finie, parcourir une année rangée ; « Gérer les archives » mène ici. Règles d'archive du domaine inchangées.
- **FN-2** (`work/missions/BUGS.md`) : le « ✓ Payé » de la rangée reste un toucher (v6a), suivi d'un avis « Payé 400,00 · Annuler · Autre montant » ; « Autre montant » ouvre la feuille Payer m5pa-d sur cette pièce ; « Annuler » inverse le paiement par un contre-paiement.
- Tests : la paire et son geste ; ranger et parcourir une année ; l'avis après « ✓ Payé ».
- Captures 390 et 1280, clair et cave, de chaque vue ouverte et après son geste, côte à côte avec sa maquette, dans `work/missions/2026-11-14-finances/voies/s1/cap/`, ouvertes.

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
- La ligne « Tests » : `npx vitest run tests/integration/doublonsPaire.test.tsx tests/integration/archivesFrise.test.tsx tests/integration/operationsPeriode.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s1/tests.txt`.
Réponse finale au pilote : une ligne.
