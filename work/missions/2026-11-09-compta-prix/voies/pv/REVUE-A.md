# Revue A du plan pv (p5b, Prévisions) — regard MÉTIER ET FIDÉLITÉ (sans mémoire, 09.11)

Lu : VOIE.md, PLAN.md, DECISIONS.md, p4/p5b (etat.html, NOTE.md, p5b-page.png, p5b-haut.png ouvertes), voies/d2 et d3 RESULTAT.md, code visé
(`FinancesTab.tsx`, `forecast.ts`, `brewForecast.ts`, `materielFutur.ts`, `upgrades.ts`, `BrewBudgetDialog.tsx`). Rien exécuté ; chiffres recalculés à la main
à partir du code de `brewForecast.ts:195-221` (dates) et de d2/RESULTAT.md (montants).

## Verdict

**REFUSÉ EN L'ÉTAT — à corriger avant le code (4 bloquants, 7 graves, 4 détails).** Le plan est sérieux (inventaire complet de p5b, « remplacer, jamais fusionner »
tenu, honnêteté du solde inconnu, appelants rejoués). Mais sa fixture de tests, copiée sur les nombres de la maquette, **n'est pas ce que `buildForecast` produira**
avec le domaine d2 livré : les tests rouges de l'étape 2 s'écriraient faux, ou on forcerait le domaine (hors Possède). Deux nombres de la fiche sont faux. Le chiffre
« 179 bouteilles » n'a pas la source que le plan lui donne.

## Bloquants (B)

**B1 — La fixture et les soldes attendus ne sont pas ceux de d2 (PLAN.md:125-128, 133, 140).**
Le plan écrit « achats −57,42 le 13.11 ; impôt −6,84 ~18.12 » et la suite 4 121,60 → 1 121,60 → 1 064,18 → 664,18 → 657,34 → 257,34 → −142,66 → −892,66, « vérifiés à la main ».
Or d2 découpe le brassin en **quatre** sorties (`brewForecast.ts:211-220`, d2/RESULTAT.md l.9) : achats 22,42 (J−7 = 13.11), énergie et nettoyage 11,00 (J = 20.11), emballage 24,00
(conditionnement J+21 − 7 = 04.12), impôt 6,84 (fin de trimestre 31.12 + 30 j = **30.01.2027**, pas ~18.12). 57,42 = 22,42 + 11 + 24 n'est pas un montant de sortie.
Recalcul : 4 121,60 (atelier 11.11) → 4 099,18 (13.11) → 1 099,18 (frigo 15.11) → 1 088,18 (20.11) → 688,18 (loyer 25.11) → **664,18** (emballage 04.12) → 264,18 (loyer 25.12) →
−135,82 (loyer 25.01 : sous zéro 25.01 ✓) → −885,82 (fermenteur 28.01) → **−892,66 le 30.01** (impôt). Le solde de fin (−892,66), le jour sous zéro (25.01), « À payer 460,00 »,
« Prévu 1 550,00 », 64,26 et 3 000 coïncident ; **le plus bas tombe le 30.01 (pas le 28.01)**, « 257,34 » devient 264,18, « 1 121,60/1 064,18/657,34/−142,66 » n'existent pas,
et le nombre de sorties est **10, pas 8** (atelier, achats, frais, frigo, emballage, impôt, 3 loyers, fermenteur).
Attendu : recalculer la fixture sur le vrai `buildForecast` (script jetable dans `os.tmpdir()`), corriger § 5 (tests `escalier`, `placement`, « pli 8 sorties », « plus bas le 2027-01-28 »,
« 8 sorties » à PLAN.md:140) avant d'écrire un test. C'est exactement la leçon d3 « vérifier à la main sur sa fixture » : elle n'a pas été appliquée.

**B2 — Le brassin : une étiquette de la maquette, quatre sorties du domaine (PLAN.md:47, 66, 74).**
La maquette montre « brassin Pale Ale −57,42, 20.11 » en une pastille (achats, frais, emballage réunis à 20.11) et l'impôt à part. Le domaine donne quatre `ForecastItem`
à quatre dates, aux libellés « Pale Ale · achats », « … · énergie et nettoyage », « … · emballage · date estimée », « … · impôt sur la bière » (`brewForecast.ts:205`).
Le plan ne tranche ni le regroupement, ni quelle pastille ouvre la fiche, ni la date affichée. Fusionner trois dates sur une marche fausse l'escalier (l'argent sort à trois dates).
Attendu : décision écrite. Recommandé : une marche et une pastille brun par date exacte (libellé court « brassin Pale Ale · achats −22,42, 13.11 »), toutes ouvrant la même fiche du
brassin ; écart avec la maquette (une pastille) listé comme compromis « 99 % » et montré au critique. Dessiner aussi ce que le cadre 370×500 fait de 10 pastilles (la NOTE de p5b
« Casse » l'annonce) : la fixture elle-même déclenche déjà « + N ».

**B3 — Fiche du brassin : le détail double compte (PLAN.md:66).**
« Achats 57,42 · Énergie et nettoyage 11,00 · Emballage 24,00 · Impôt 6,84 » = 99,26, alors que le total est 64,26 (`cashRequiredTTC`, d2). Les achats sont 22,42.
Attendu : « Achats 22,42 · Énergie et nettoyage 11,00 · Emballage 24,00 · Impôt 6,84 » ; test sur la somme des lignes = total de l'étiquette, au centime (R3 le promet, sans le tester ici).

**B4 — « Pour rester à zéro : 179 bouteilles » : la source citée ne fait pas ce calcul (PLAN.md:59, 201 ; DECISIONS.md:4-5).**
179 × 5,00 = 895 ≈ le déficit −892,66 : la maquette divise le **trou de trésorerie** par le prix de la bouteille. `mesurerAchat().ventes` (`materielFutur.ts:161-178`) divise **le prix
d'achat** (3 000) par la **marge** après coût complet du litre ; avec un coût de format réaliste le résultat est de l'ordre de plusieurs centaines à milliers de bouteilles, jamais 179.
Le plan colle l'étiquette « pour rester à zéro » sur la mauvaise grandeur : un brasseur lirait un faux nombre de ventes pour ne pas passer sous zéro.
Attendu : définir « pour rester à zéro » (recommandé : −plus bas ÷ prix de la bouteille, en trésorerie, avec la réserve « avant coût de production » dite), avoir un nom distinct pour
« bouteilles pour payer le matériel » (`ventes`), un test avec la fixture (déficit 892,66 ÷ 5,00 = 179 après arrondi au-dessus), et tant que le prix manque : « à compléter », jamais 0 ni 179.

## Graves (G)

**G1 — D8 : le plan contredit la décision du pilote (PLAN.md:207 ; DECISIONS.md:5-6).**
Le pilote : « les loyers comptés dans « Prévu » sont dessinés comme tels » (donc en style Prévu, pointillé bleu). Le plan D8 : « facture, plan et récurrent en pastille neutre pleine ».
Les deux loyers récurrents seraient neutres tout en étant comptés « Prévu » : exactement l'incohérence que le pilote a voulu retirer. Attendu : D8 réécrit selon DECISIONS (récurrent,
plan, tendance, projet non testé = pointillé bleu ; seule la facture est neutre pleine) ; la maquette montre 25.12 neutre : compromis listé. Corriger l'inventaire E6/E7 pareillement.

**G2 — Titre et horizon : « Fin janvier » n'est pas ce que 90 j donne (PLAN.md:43, 58 ; `forecast.ts:forecastHorizonEnd`).**
9.11 + 90 j = 7.02.2027 (exclu) : le dernier jour est le 6.02, titre « Fin février », axe jusqu'au 06.02 (4 mois : nov. déc. janv. févr.), pas l'axe de la maquette (9.11 → 31.01).
La tuile de la fiche dit « Fin janvier » en dur (F3). Attendu : titre, tuile et étiquette de fin dérivés de l'horizon ; l'écart de capture avec p5b est listé d'avance (sinon le critique
le comptera comme défaut), ou le titre dit la date de fin exacte.

**G3 — Entrées (sorties seules dessinées) (PLAN.md:49, 112 ; `forecast.ts` direction `in`).**
Une facture à encaisser ou un plan d'entrée change l'escalier (marche montante). p5b n'a aucun état « entrée » ; le plan met `entrees` dans `notions` et un pli « Entrées : aucune › »
mais ne dit ni la pastille (couleur, signe), ni sa place dans la légende, ni le test. Cas neuf à ranger dans un état de la maquette (L03). Attendu : une ligne d'inventaire et un test
(entrée de 500 sur 25.11 : marche vers le haut, pastille « + », le solde de fin la compte, le pli dit « Entrées : 500,00 »).

**G4 — Pièces sans échéance : le solde de tête les ignore (PLAN.md:92 ; `forecast.ts` `undated`).**
`buildForecast` met hors graphe toute pièce à payer sans échéance (`undatedOutCents`). Le plan les place seulement dans le pli « Limites », présent « seulement si la prévision est
incomplète ». Le chiffre de tête et le point bas sont donc trop optimistes sans signe visible au premier plan : l'inconnu devient « 0 » en pratique. Attendu : une marque courte au
premier plan, près de la légende (« + 2 pièces sans date, 340,00 hors graphe › ») qui ouvre les limites ; test avec une facture sans échéance.

**G5 — Tests d'écran sur la date du jour (PLAN.md:125, 140 ; `FinancesTab.tsx:94` `todayISO()`).**
Les tests d'écran (« étiquettes comme boutons nommés frigo −3 000… », « fin … ») dépendent de `todayISO()` ; la fixture est figée au 2026-11-09. Le plan ne parle ni de `vi.setSystemTime`,
ni d'un `asOf` passé à `Previsions`. Sans cela les tests dérivent d'un jour à l'autre. Attendu : horloge figée dans le test d'écran et `asOf` en prop de `Previsions` (le domaine l'accepte).

**G6 — « Prévoir » : cas hors lot planifié et hors horizon (PLAN.md:29, 108, 143 ; `BrewBudgetDialog.tsx:45`).**
`onOpenForecast` reçoit `{planId, batchId?}`. Un budget de recette sans lot (pas de `batchId`) laisse le plan « Prévoir » comme item `source:'brew'` sans `batchId` (non remplacé par d2) :
le plan ne dit pas quelle étiquette ouvrir ; un lot dont les sorties tombent hors de l'horizon actif (lot dans 5 mois, horizon 30 j) n'a pas d'étiquette à ouvrir. Un lot commencé ou terminé : aucune
sortie dérivée. Attendu : trois lignes de cas : recette seule → fiche par `planId` ; hors horizon → l'horizon passe à celui qui contient la ligne, ou message nommé ; sans sortie → « ce brassin n'a plus de sortie prévue ». Test pour chacun.

**G7 — Le bouton « Vente » et la coordination avec la voie uv (PLAN.md:49, 161, 200).**
`git status` montre `src/ui/FloatingActions.tsx` et `src/ui/vente/` en cours d'écriture par une autre voie. Un « Vente » caché tant que la prop manque donne un écran sans le bouton primaire
de la maquette ; un second chemin vers la saisie de vente risquerait de doubler celui d'uv. Attendu : lire le contrat d'uv, réemployer son ouverture (une seule porte), nommer la prop et son câblage
`App.tsx` (hors Possède) dans la demande au pilote ; test « Vente appelle l'action, une fois ».

## Détails (D)

**D-1 — Projet sans durée d'usure (PLAN.md:47, 58).** La pastille agrandie de p5b dit « usure 600, litre 8,01 » ; sans durée (tous les projets d'avant d3) le plan dit « à renseigner » dans la fiche
mais ne dit pas la sous-ligne de la pastille. Attendu : « usure ? » (jamais 0 ni 600), couvert par un test.

**D-2 — Source du litre (PLAN.md:58, 139).** « Mon litre 7,51 → 8,01 » vient de `BrassinPrevu.coutLitre.complet` d'un brassin et de `profile.annualProductionL`. Le plan ne dit pas quel brassin
(plusieurs ? aucun ?) ni d'où vient « 1 200 L » du test. Attendu : brassin le plus proche, sinon « — » (pas de brassin planifié) ; production annuelle absente : « — » ; un test par cas.

**D-3 — Éléments ajoutés à la maquette (PLAN.md:91, 100, 204).** Icône réglages dans la tête et assistant sous le pied ne sont pas dans p5b (règle n° 1). Compromis listés, bien : les garder
hors du premier écran visible à 390 (assistant sous le pli, icône dans le pli « Limites » seulement) ; à défaut, les dire au critique avant la capture.

**D-4 — Tendance et retards (PLAN.md:68).** Les items `trend` datés au 1er du mois (« Autres dépenses · chargesFixes », clé brute) et les factures échues (daté `asOf`) tombent sur la marche
d'aujourd'hui ou sur chaque 1er : nombreuses pastilles que p5b ne montre pas. Attendu : libellé de la tendance lu avec la table `CATEGORY_LABELS` (comme `forecastRow` aujourd'hui,
`FinancesTab.tsx:147`), tendance regroupée en une pastille « dépenses courantes » par mois, retards groupés « en retard » sur la marche d'aujourd'hui ; test avec 3 mois de tendance.

## Points justes (à conserver)

- Remplacer, jamais fusionner : sous-onglets, cinq totaux, case « Inclure », « Comparer les mois », « Voir les N suivantes » retirés, chacun avec son sort (§ 3) ; `UpgradeWorkspace` gardé pour `CreativeLabTab`.
- Notions : À payer 460,00 + Prévu 1 550,00 + brassin 64,26 + projet 3 000 = total des sorties 5 074,26 (vérifié) ; somme testée au centime.
- Inconnu ≠ 0 : solde de départ (D4), usure absente, bouteilles sans prix, partiel nommé (« −57,42, ? »), jamais « exemple » sur donnée réelle.
- Honnêteté de R11 (`ignoreUpgradePlanId` n'agit que sur les brassins) et de § 6 (test `financePeriodDrilldown` non chargé par vitest).
- Hors Possède respecté (aucun fichier de domaine écrit) ; aucune écriture hors `saveUpgrade`.

## À faire avant l'étape 2

1. Recalculer la fixture sur le vrai domaine et corriger § 5 (B1) ; trancher le regroupement du brassin (B2) ; corriger la fiche (B3) ; définir « pour rester à zéro » (B4).
2. Réaligner D8 sur DECISIONS (G1) ; ajouter l'état « entrées » (G3), la marque des pièces sans date (G4), l'horloge des tests (G5), les trois cas de « Prévoir » (G6), le contrat « Vente » avec uv (G7).
3. Une seconde lecture rapide du plan corrigé (B1 à B4 seulement) avant le code.

LEÇON PROPOSÉE : un plan qui recopie les nombres d'une maquette comme valeurs attendues doit les recalculer sur le vrai domaine livré avant d'écrire ses tests (ici 57,42 d'un seul tenant, 28.01 et 257,34 ne sont pas ceux de d2 ; 10 sorties, pas 8).
