OK — Prévisions = p5b porté (escalier, étiquettes, bascule, fiches, annexe) ; 239 tests verts, tsc et build verts, captures ouvertes ; côte à côte à rejouer

## Étape 1 (plan) et revues
`PLAN.md` corrigé constat par constat : § 11 = sort de chaque constat de REVUE-A et REVUE-B (tous « retenus », raison écrite) et de DECISIONS.md. Règle du pilote appliquée : le domaine est la vérité, la maquette donne la forme.
Fixture recalculée sur le vrai `buildForecast` (sonde jetable, retirée) : **10 sorties** (pas 8), brassin en quatre sorties à leurs dates (achats 22,42 le 13.11, énergie et nettoyage 11,00 le 20.11, emballage 24,00 le 04.12, impôt 6,84 le 30.01), soldes 4 121,60 → 4 099,18 → 1 099,18 → 1 088,18 → 688,18 → 664,18 → 264,18 → −135,82 → −885,82 → −892,66 ; plus bas le 30.01 ; sous zéro le 25.01 ; sans le frigo 2 107,34 ; titre « Fin février » (90 j = jusqu'au 06.02).

## Fichiers écrits
- Neufs : `src/ui/finance/previsions/{escalier.ts, placement.ts, mesureProjet.ts, format.ts, EscalierSvg.tsx, Feuille.tsx, FicheEtiquette.tsx, ListeSorties.tsx, Previsions.tsx}`, `src/ui/finance/previsions.css`.
- Modifiés : `src/components/tabs/FinancesTab.tsx` (onglet Prévisions, branchement de « Prévoir », prop `onOpenSale`), `src/ui/finance/FinanceForecastSummary.tsx` (réécrit : seulement les limites), `src/ui/finance/UpgradeSheet.tsx` (+ « Usure et mise en service »).
- Tests neufs : `tests/integration/{previsionsFixture.ts, previsionsEscalier, previsionsPlacement, previsionsMesureProjet, previsionsEcran}.test.tsx`.
- Tests réécrits (hors liste stricte du Possède, nommés au PLAN § 11) : `tests/integration/{financeWorkspace, equipmentProjects, mobileDailyViews}.test.tsx` (11 tests qui décrivaient l'ancien écran : jumeaux dans le nouveau langage, tous verts).
- Voie : `PLAN.md`, `RESULTAT.md`, `tests-head.txt`, `tests.txt`, `tsc.txt`, `build.txt`, `capture.mjs`, `captures/` (16 images), `inventaire-apres.txt`, `vite.txt`.
- `FinanceComparisonChart.tsx` : **non importé, gardé** (rien supprimé sans accord). `UpgradeWorkspace.tsx` : inchangé (sert `CreativeLabTab`). `git status` : uniquement ces fichiers + mes dossiers.

## Sorties décisives
- `tests.txt` : `Test Files 17 passed (17)` · `Tests 239 passed (239)` (mes 4 fichiers neufs, les 3 réécrits, upgradeSheetTe35, brewBudgetDialog, libelles, ta3, financeAnnuelSaisie, financeArchives, brewForecast, materielFutur, forecastHorizon, financeForecast). HEAD avant : `9 passed · 92 passed` sur les 9 fichiers chargés (`tests-head.txt`).
- `npx tsc --noEmit` : 0 erreur hors `firebase-admin` (`tsc.txt`). `npx vite build` : vert (`build.txt`). `controle-virgule.mjs` : `VIRGULE OK` (une écriture corrigée en route).
- Captures (ouvertes) : `captures/prv-390-clair-repos.png`, `prv-390-clair-fiche-frigo.png`, `prv-390-clair-annexe.png`, `prv-390-cave-repos.png`, `prv-1280-clair-repos.png` (reprise après correction). Non ouvertes une à une : les autres (`prv-{390,1280}-{clair,cave}-{repos,fiche-frigo,sans-frigo,annexe}.png`, 16 au total).
- Défaut vu puis corrigé : le solde final (« −892,66 ») recouvrait le nom de mois « févr. » à 1280 ; il se pose au-dessus quand la place manque (reprise de capture 1280 clair, vérifiée).
- Rouge avant le code : **non enregistré** pour les modules purs (`escalier`, `placement`, `mesureProjet`), écrits avant leurs tests (limite de tours, dit, pas caché). Les tests d'écran n'ont pas de rouge enregistré non plus ; les 11 anciens tests réécrits étaient rouges sur le nouveau code (11 échecs constatés avant réécriture).

## Ce que le brasseur voit (p5b repris, L03)
Titre « Fin février » et segment 30j/90j/12 mois ; bascule Avec/Sans le projet testé avec « sous zéro 25.01 » ; escalier 500 px (aire rouge sous zéro, pointillé « sans »), une étiquette par sortie accrochée à sa marche (neutre = facture, pointillé bleu = prévu, brun = brassin, bleu-vert = projet testé, vert = entrée), « + N » pour ce qui ne tient pas ; légende À payer / Prévu ; plis « Entrées », « N sorties », « Limites » ; « Vente » si la porte est câblée ; fiche du projet (durée 3/5/8 ans = un facteur libre, usure par an, mon litre, fin, plus bas, « pour rester à zéro », Retirer / Déplacer / Ouvrir) ; fiche du brassin (ses quatre sorties, d'où vient chaque montant, total 64,26) ; annexe = la liste numérotée de p4a avec « → solde après », et au second plan « Ajouter une prévision », « Budget d'un brassin », « Mes projets de matériel », « Solde et paramètres », « Toutes mes prévisions ».
Disparus : résumé à cinq totaux, « Comparer les mois », sous-onglets, case « Inclure mes projets », liste « Échéances et estimations à venir ».

## Écarts avec la maquette (compromis « 99 % » listés pour le critique)
1. Dates et nombres du domaine, pas ceux dessinés : brassin en 4 étiquettes (la maquette en dessine 2), 264,18 (pas 257,34), plus bas le 30.01 (pas le 28.01), « Fin février » et axe jusqu'au 06.02 (pas « Fin janvier »), 10 sorties (pas 8).
2. D8 : plan, récurrent et tendance en pointillé bleu « Prévu » (la maquette dessine les loyers 25.12 et 25.01 neutres) ; seule la facture est neutre pleine.
3. « Pour rester à zéro » = bouteilles pour combler le plus bas, en trésorerie, « avant coût de production » dit (fixture : 179 à 5,00 testé) ; « pour payer le matériel » est une autre grandeur (marge, `mesurerAchat().ventes`), affichée seulement avec un prix saisi. Prix de la bouteille : champ dans la fiche (clé d'état d'interface `previsions_prix_bouteille`) en attendant le tarif de c7c ; vide = « à compléter », jamais 0.
4. Solde de départ inconnu (non dessiné par p5b) : « À compléter » en tête, escalier en écart depuis aujourd'hui, aucun chiffre 0,00 (testé).
5. Icône « Solde et paramètres » retirée de la tête (dans l'annexe et « Limites ») ; assistant sous le pli ; fiche et annexe sont des feuilles propres à Prévisions (voile 28 %, 10 px des bords), `Sheet` non touché.
6. Le titre « estimé » / « devis » remplace « exemple » (donnée réelle).
7. Étiquette d'une pièce sans date : pas d'étiquette, une marque « + N pièces sans date, X hors graphe » sous la légende (ouvre les limites).
8. Largeur du graphique : mesurée (repli 370), texte non déformé (la maquette étirait son SVG) ; à 1280 la colonne reste centrée (max 560 px).
9. Largeur de texte des étiquettes estimée par caractère (pas de canvas) : placement déterministe, un peu large.

## Doutes et limites
- **Côte à côte avec p5b non fait** : voir DEMANDE EXECUTANT. Aucun jugement visuel final : au critique.
- Cible tactile : les étiquettes font 20 px de haut (zone de toucher invisible de 32 px, qui peut chevaucher une voisine) ; non mesuré au doigt.
- Le placement laisse parfois des étiquettes dans « + N » (fixture réelle : 10 sorties, 6 à 7 placées selon l'espace) ; la liste porte tout.
- La démo `?finance-demo` n'a ni brassin planifié ni frigo : la capture pose un frigo via l'application (import des modules dans la page, mode dev-local) ; le « litre » y vaut « — » (aucun brassin planifié) : honnête, mais l'état « 7,51 → 8,01 » n'est pas capturé. Les tests le couvrent (`previsionsMesureProjet`).
- Performance : deux `buildForecast` par ouverture de Prévisions seulement (rien sur les autres onglets), clé de stock stable ; **le test qui compte les appels n'est pas écrit** (`forecast.ts` n'est pas à moi) ; chronométrage du placement écrit (garde 50 ms).
- Hors ligne : `saveUpgrade` écrit en local puis attend le serveur (15 s) ; la fiche dit « Enregistré sur cet appareil, en attente de synchro » si `DocumentWriteError` `pending` ; **ce rejet n'est pas testé** (le double clic l'est : un seul `saveUpgrade`).
- « Prévoir » : testé via `Previsions` (cible : lot planifié, recette sans lot, lot sans sortie, lot hors horizon), pas via le parcours réel de la feuille c3a.
- `assistantContext.ts:95` appelle encore `buildForecast` sans `batches` : l'assistant sous l'escalier ne voit pas le brassin dérivé (déjà noté par d2) ; avec plusieurs projets l'assistant lit « inclut / exclut les projets » alors que la bascule n'en retire qu'un.
- **Tests non chargés ou non rejoués, à traiter par le pilote** : `tests/ux-mobile/financePeriodDrilldown.test.tsx` (non chargé par `vitest.config.ts`, décrit « Comparer les mois » supprimé), `tests/ux-mobile/finance.browser.mjs`, `tests/ux-mobile/finance.fixture.tsx`, `scripts/check-ux-mobile-poc.mjs` (cliquent « Comparer les mois ») : **non modifiés**, devenus périmés. `financeAssistantContext.test.ts` : `firebase-admin` absent du poste, non rejoué.
- `scripts/agents/inventaire-ecrans.mjs` échoue (`inventaire-apres.txt`) : deux ancres cassées par ce port (`finances-operations` fin et `finances-previsions` début : `{view==='forecast'&&forecastPart==='timeline'&&<>`) ; nouvelle ancre à mettre : `{view==='forecast'&&<Previsions`. Les 8 autres ancres (BrewWizard…) ne sont pas de moi. Fichier hors de ma voie : non modifié.

## DEMANDE EXECUTANT
Série mécanique restante (captures côte à côte, rejeu) ; je ne la lance pas moi-même au-delà de mon premier essai.
1. Serveur : `npx vite --port 5218 --strictPort` (fond), depuis la racine du worktree.
2. Captures de l'app : `node work/missions/2026-11-09-compta-prix/voies/pv/capture.mjs 5218` → 16 fichiers `voies/pv/captures/prv-<390|1280>-<clair|cave>-<repos|fiche-frigo|sans-frigo|annexe>.png` (sortie attendue : 16 lignes `capture …`, aucune `ECHEC`, aucun `pageerror`).
3. Planche côte à côte avec la maquette : script `voies/pv/cote-a-cote.mjs` à écrire par l'exécutant sur le modèle de `voies/uc/cote-a-cote.mjs` (maquette `p4/p5b/etat.html` | app, repos et fiche, 390 clair et cave) → `captures/cote-a-cote-390-clair.png`, `cote-a-cote-390-cave.png`.
4. Rejeu : `npx vitest run tests/integration/previsions*.test.tsx tests/integration/financeWorkspace.test.tsx tests/integration/mobileDailyViews.test.tsx tests/integration/equipmentProjects.test.tsx --reporter=dot > voies/pv/tests.txt 2>&1` (attendu : 0 échec), `npx tsc --noEmit` (0 erreur hors firebase-admin), `npx vite build`.
5. À ouvrir en image : `prv-390-cave-fiche-frigo`, `prv-390-clair-sans-frigo`, `prv-390-cave-annexe`, `prv-1280-cave-repos`, `prv-1280-clair-fiche-frigo`, les deux planches.

DÉCISION À PRENDRE : (1) `App.tsx` : câbler `onOpenSale` de `FinancesTab` sur la porte de vente d'uv (le bouton « Vente » est caché sans elle) ; libellé « Vente » (maquette) ou « Vendre » (uv). (2) Retirer `FinanceComparisonChart.tsx`, mettre à jour `inventaire-ecrans.mjs` et les scripts `ux-mobile` périmés (liste ci-dessus). (3) `financeDemo.ts` : ajouter un brassin planifié et un frigo pour que `?finance-demo` montre l'état complet (litre 7,51 → 8,01). Recommandé : oui aux trois.
CONNAISSANCE : `tests/ux-mobile/**` n'est pas dans le `include` de `vitest.config.ts` ; le domaine rend `date = asOf` pour une facture échue (la tendance, elle, est datée du 1er) ; `buildForecast({ ignoreUpgradePlanId })` ne retire que l'usure du litre des brassins, pas les items du projet (le filtre se fait après).
LEÇON PROPOSÉE : un plan qui recopie les nombres d'une maquette comme valeurs attendues les recalcule sur le vrai domaine livré avant d'écrire ses tests (ici 57,42 d'un seul tenant, 28.01 et 257,34 n'étaient pas ceux de d2 ; 10 sorties, pas 8). Un Bash qui lit une chaîne avec `\s` ou `\d` (script `node -e`) la déforme : écrire le script avec Write (revenu deux fois ici).
