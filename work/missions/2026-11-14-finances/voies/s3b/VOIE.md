# Voie s3b — Budget d'un brassin m4bb-a

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 386e29f4 (commité)
- Décideur en cas de doute : pilote

## Objectif
Budget d'un brassin m4bb-a : porté dans l'app, branché, typé, testé, au banc (reprise de s3 : lire d'abord work/missions/2026-11-14-finances/voies/s3/RESULTAT.md, noyaux purs déjà écrits et verts).

## Entrées
- Ses mots (15.11) : « m1do-a · m1ar-c · m3pr-c · m3pm-d · m3im-c · m4bb-a · m4pf-c · m4ia-c ».
- Les maquettes citées ci-dessous (etat.html, png, NOTE.md) ; `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` pour ses goûts.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/BrewBudgetDialog.tsx`
- `src/ui/finance/BrewBudgetSheet.tsx`
- `src/ui/finance/brew-budget.css`
- `src/ui/finance/budget`
- `src/components/tabs/FinancesTab.tsx`
- `tests/integration/budgetPiles.test.tsx`
- `work/missions/2026-11-14-finances/voies/s3b`

## Consignes
- **Budget d'un brassin = m4bb-a** (`work/missions/2026-11-14-finances/voies/m4/m4bb-a/`) : la feuille « Quel brassin veux-tu estimer ? » de `FinancesTab` (ligne ~137) et l'entrée du budget deviennent m4bb-a, sur les noyaux purs de s3 (`src/ui/finance/budget`). Le flux c3a (`CoutBrassinFlux.tsx`) reste à un toucher (« Détail du litre ») ; `CoutBrassinFlux.tsx` et `brewBudget.ts` ne changent pas.
- Dans `FinancesTab.tsx`, ne toucher que le choix du brassin et le budget.
- Test : piles justes (= brewBudget), c3a atteignable.
- Captures 390 et 1280, clair et cave, de chaque vue ouverte et après son geste, côte à côte avec sa maquette, dans `work/missions/2026-11-14-finances/voies/s3b/cap/`, ouvertes.

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
- La ligne « Tests » : `npx vitest run tests/integration/budgetPiles.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s3b/tests.txt`.
Réponse finale au pilote : une ligne.
