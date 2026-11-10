OK — Synthèse g3a portée : entré/dépensé, à-payer hachuré, caisse, litre ; domaine commun periodeSynthese posé et testé

## Fichiers écrits
- Domaine commun (uo l'importe) : `src/domain/finance/periodeSynthese.ts` ; test `tests/unit/periodeSynthese.test.ts` (31 verts). Posé AVANT l'écran.
- Écran : `src/ui/finance/FinanceOverview.tsx` (réécrit, plus aucun JSX de l'ancien), `src/ui/finance/synthese/{Scene,Caisse,Lignes,Pourquoi}.tsx`, `libelles.ts`, `src/ui/finance/synthese.css` (classes `syn-`).
- `src/components/tabs/FinancesTab.tsx` : branche Synthèse remplacée, état et calculs de « Coûts » supprimés, imports morts retirés ; N1 de uo câblé (`onAddProof`, `onPay` dans `row()`, `assistant` au journal, `{financeAssistant}` retiré après le journal) ; la `finance-bar` (h2 + ⚙) ne reste que pour Annuel.
- Tests : `tests/integration/synthese.test.tsx` (19 verts) ; adaptés : `soldeDepartVisible`, `equipmentProjects`, `financeWorkspace` (it Synthèse), `mobileDailyViews` (L111), `tests/ux-mobile/financePeriodDrilldown.test.tsx` et `finance.browser.mjs` (non chargés par vitest).
- `voies/us/PLAN.md` (corrigé, §10 = constat par constat des revues A et B), `capturer.mjs`, `captures/`, `tests*.txt`, `build.txt`.

## Critères
- `npx tsc --noEmit` hors firebase-admin : vide (vert). `npx vite build` : exit 0.
- `npx vitest run tests/integration/synthese.test.tsx tests/unit/periodeSynthese.test.ts tests/integration/soldeDepartVisible.test.tsx tests/integration/equipmentProjects.test.tsx` : 4 fichiers, 62 tests verts (`tests.txt`). Rouge d'abord : l'ancien écran n'avait ni recettes ni résultat (aucun test T1-T21 ne pouvait passer sur HEAD) ; le domaine a eu 3 échecs de fixture corrigés au 2e essai.
- Rejeu large (12 fichiers, 153 tests) : 150 verts, **3 rouges qui ne viennent pas de ma voie** : `financeWorkspace` (« Rechercher une opération » : la loupe a disparu du journal de uo ; « N sorties » : plusieurs boutons dans Prévisions, fichiers modifiés par une autre voie) et `mobileDailyViews` (même textbox). Les assertions Synthèse de ces `it` passent (elles précèdent la ligne qui échoue). À adapter par uo / la voie Prévisions.
- Captures (`voies/us/captures/`, 390 tactile et 1280, clair et cave, 6 états chacune : repos, bas, pourquoi, octobre, tout, replié) : **ouvertes** clair-390 repos/bas/replié/octobre/tout, cave-390 repos/bas/pourquoi, clair-1280 repos, cave-1280 repos/octobre. Les autres (pourquoi 1280/clair, replié cave, tout cave/1280, octobre clair 1280) existent mais ne sont pas ouvertes.
- Défauts vus et corrigés : fil du gain invisible (vert sur vert) → vert foncé de la maquette ; couleurs de catégorie du thème clair trop sombres → couleurs vives de g3a (hex de la maquette) dans les deux thèmes ; pastille « +430,20 » débordante en « tout » ; pastille du loyer tronquée → retour à la ligne ; mois courant qui disparaissait du segment après un clic sur « oct. ».

## Essais
Domaine 2 (fixture : `echelle(0,…)` attendu faux, `profil`), écran 4 (À vérifier de la démo, à-payer sans solde, texte « Solde de départ à renseigner » sans point, TVA `warn`), captures 4 passes.

## Doutes et limites
- Pas de côte à côte image contre image avec g3a (comparé à l'œil : g3a-page.png ouverte, structure, hauteurs, hachures, légende identiques). **DEMANDE EXECUTANT** : voir plus bas.
- Axes non audités : `a11y-audit` formel (noms accessibles, cibles 24 px des chips « Payer » et des petits segments), contraste des textes sur les couleurs vives en cave.
- Le litre : un seul instantané (le dernier estimé) ; pas de test d'égalité avec la valeur de Prévisions (fonction de `brewForecast.ts` non exportable, hors Possède) ; l'égalité avec `coutLitre` du même instantané est testée.
- `ledger.warnings` (« Solde de trésorerie initial à confirmer. ») ouvre une ligne « À vérifier » repliée même quand le solde est seulement à confirmer : doublon léger avec la caisse.
- La pastille globale « Compagnon hors connexion · mode local » de l'App recouvre le bas de la Synthèse à 390 (chrome de l'App, pas touché).

## Écarts avec la maquette choisie, à montrer au brasseur
1. « Électricité 68,00 » devient « Charges fixes 68,00 » (D1) ; le loyer garde son nom de pièce (« Loyer de l'atelier »).
2. ⚙ absent : l'en-tête « En caisse » (bouton) ouvre le solde et les paramètres.
3. Pas de sélecteur de mois précis : trois mois + « tout » (les mois plus anciens se lisent dans Opérations).
4. Liste « Coût des brassins » réduite au dernier brassin estimé + « + ».
5. « Pourquoi ? » : phrase calculée sans IA, sans pastille « exemple » ni projection ; le titre change selon le cas (« Pourquoi si peu ? », « Pourquoi une perte ? », « Où va ce qui est entré ? »).
6. Ajouts qui n'existent pas dans g3a, utiles ou obligatoires : ligne « À vérifier » (paiements à confirmer, pièces sans date, avoirs, matériel sans registre, seuil de TVA ; alerte TVA franchie toujours visible) ; hachure verte « à encaisser » ; légende « n à confirmer » ; écart rouge et « Perdu » quand dépensé > entré avec de l'entré.
7. Sur la démo, une ligne « Matériel sans registre » apparaît sous la caisse (revue A US-2) : g3a n'en a pas. Si le brasseur la juge de trop : la retirer (une ligne dans `Lignes.tsx › Verifier`).
8. « Comprendre mes dépenses · Compagnon brasseur » (composant `FinanceAssistant` réemployé, revue US-14) à la place de « ✦ Compagnon brasseur ».

## À faire par le pilote / les autres voies (hors Possède)
- **uo** : adapter `financeWorkspace.test.tsx` (textbox « Rechercher une opération », L37-53) et `mobileDailyViews.test.tsx` (L113-130) ; importer `periodeSynthese` pour sa barre du mois (test d'égalité « dépensé » Synthèse = légende d'Opérations sur la fixture de `periodeSynthese.test.ts`).
- **Bord** (`DashboardTab.tsx:160-162,301-302`) : « Résultat de la période » = recettes − dépenses TTC avec le matériel compté en charge → sur la démo −5,40 au Bord contre +23,20 ici. À aligner sur `periodeSynthese` (D2).
- **Annuel** : met la pièce `materiel` sans ligne ni registre en charge (la Synthèse la met à part) ; écart écrit dans l'en-tête du module et testé.
- `scripts/agents/inventaire-ecrans.mjs` L125-126 (zone `overviewPart`, déjà périmée sur HEAD) ; `CostComposition.tsx` et `FinancePeriod.tsx › FinancePeriodBar` (utilisé encore par le journal) : `CostComposition` est maintenant orpheline.
- `tests/ux-mobile/*` ne sont pas chargés par `vitest.config.ts` (L11).

## DEMANDE EXECUTANT
1. `node work/missions/2026-11-09-compta-prix/voies/us/capturer.mjs` (serveur : `http://localhost:3000`, `?dev-local&finance-demo`) → 24 PNG dans `voies/us/captures/`, sortie attendue : `"erreurs": []`, `"manques": []`.
2. Côte à côte avec `p2/g3a/g3a-page.png` et `g3a-1280.png` (modèle : `voies/uv/cote-a-cote.mjs`) pour `clair-390-repos`, `cave-390-repos`, `clair-1280-repos`, `cave-1280-repos` ; ouvrir les quatre.
3. Ouvrir en plus : `*-pourquoi`, `cave-1280-tout`, `clair-1280-octobre`.
4. `npx vitest run tests/integration/synthese.test.tsx tests/unit/periodeSynthese.test.ts --reporter=dot` : 50 tests verts attendus.

DÉCISION À PRENDRE : garder ou retirer la ligne « Matériel sans registre » sur la démo (écart 7). Recommandation : la garder (c'est l'écart réel avec l'Annuel), mais la replier dans « Origine et limites » si le brasseur la trouve de trop.

CONNAISSANCE : le « dépensé » d'une période (matériel à part, avoirs, à-payer hachuré) a une seule définition, `src/domain/finance/periodeSynthese.ts` ; la règle du matériel y est celle de g3a et diverge de l'Annuel (registre, `businessUsePct`).
LEÇON PROPOSÉE : un test de rendu qui compte les lignes d'« À vérifier » doit partir de la fixture de la démo (la ligne « Matériel sans registre » y apparaît) ; un écart voulu avec la maquette (ligne ajoutée) se voit sur la capture de la démo, pas seulement sur l'état vide.
