# Voie s3 — Budget d'un brassin m4bb-a, Compagnon m4ia-c

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 386e29f4 (commité)
- Décideur en cas de doute : pilote

## Objectif
Budget d'un brassin m4bb-a, Compagnon m4ia-c : porté dans l'app, branché, typé, testé, au banc (choix du brasseur du 15.11, SPEC-BRASSEUR).

## Entrées
- Ses mots (15.11) : « m1do-a · m1ar-c · m3pr-c · m3pm-d · m3im-c · m4bb-a · m4pf-c · m4ia-c ».
- Les maquettes citées ci-dessous (etat.html, png, NOTE.md) ; `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` pour ses goûts.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/BrewBudgetDialog.tsx`
- `src/ui/finance/BrewBudgetSheet.tsx`
- `src/ui/finance/brew-budget.css`
- `src/ui/finance/budget`
- `src/ui/finance/FinanceAssistant.tsx`
- `src/ui/finance/compagnon`
- `src/components/tabs/FinancesTab.tsx`
- `tests/integration/budgetPiles.test.tsx`
- `tests/integration/compagnonContexte.test.tsx`
- `work/missions/2026-11-14-finances/voies/s3`

## Consignes
- **Budget d'un brassin = m4bb-a** (`work/missions/2026-11-14-finances/voies/m4/m4bb-a/`) : la feuille « Quel brassin veux-tu estimer ? » de `FinancesTab` (ligne ~137) et l'entrée du budget deviennent m4bb-a (piles « quand tu paies » : déjà payé, à payer hachuré, part de l'année ; le litre). Lecture du pilote : le flux c3a (`CoutBrassinFlux.tsx`, son choix du 09.11) reste à un toucher (« Détail du litre »), rien n'est retiré ; `CoutBrassinFlux.tsx` et le domaine `brewBudget.ts` ne changent pas.
- **Compagnon = m4ia-c** (`work/missions/2026-11-14-finances/voies/m4/m4ia-c/`) : `FinanceAssistant` ; la pile visée entourée, les pastilles du contexte qui part (cochées), les questions. Gemini jamais appelé : tests avec le service simulé ; le contexte envoyé = celui du domaine `assistantContext.ts`.
- Dans `FinancesTab.tsx`, ne toucher que le choix du brassin, le budget et le compagnon (d'autres voies branchent leurs feuilles par leurs propres fichiers).
- Tests : piles justes (centimes, = brewBudget), c3a atteignable ; pastilles décochées absentes du contexte simulé.
- Captures 390 et 1280, clair et cave, de chaque vue ouverte et après son geste, côte à côte avec sa maquette, dans `work/missions/2026-11-14-finances/voies/s3/cap/`, ouvertes.

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
- La ligne « Tests » : `npx vitest run tests/integration/budgetPiles.test.tsx tests/integration/compagnonContexte.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s3/tests.txt`.
Réponse finale au pilote : une ligne.
