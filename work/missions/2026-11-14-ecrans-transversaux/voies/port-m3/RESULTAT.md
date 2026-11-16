OK — période = plage de Finances, une seule source ; tsc, tests, build verts ; captures vues ; commits 9e906ee5 et baf75fde

Worktree : `C:/Users/mrspa/AppData/Local/Temp/transversaux-port` (branche claude/ecrans-transversaux). Commits : 8b17e2e7 (port initial), 008888f7 (port-b1), **9e906ee5** (port m3 révisé : la période de l'app = la plage « du … au » de Finances), **baf75fde** (corrections trouvées aux captures).

## Message du brasseur (15.11) traité
« utiliser une plage comme pour les finances » : la période de l'app est la plage de Finances (frise d'Opérations, deux poignées, raccourcis, champs « jj.mm »). Une seule source (`useState<Periode>` dans App) ; Plus, Finances (Synthèse et journal d'Opérations), Brassins et Bord la lisent. Code : src/components/periode/{periode.ts, ChoixPlage.tsx, useDonneesFrise.ts, PastillePeriode.tsx}, src/components/plus/PagePlus.tsx, src/components/Header.tsx, src/ui/finance/operations/donneesFrise.ts (extrait de TransactionJournal), FinancesTab.tsx, App.tsx (3 lignes : `datesEcritures` retiré, `transactions` passé à Header et PagePlus). Commit d'App.tsx fait par hunks : les autres modifications d'App.tsx (voie port-r3 : recherche, `<CommandPalette … />`) et `QuickActionModal.tsx` ne sont PAS dans mes commits.

## Critères (sorties décisives)
- tsc : `tsc.txt` vide, sortie 0 (après les corrections).
- Témoin ET-PER rejoué sur la plage : sur le tag `en-ligne/2026-11-14-atelier-uv4`, test complet = ECHEC « Cannot find module …/periode/periode » (`temoin-et-per-depart.txt`), contrôle de lecture seul = ECHEC « expected … not to match /useState\(todayISO\(\)\.slice\(0, 7\)\)/ » (`temoin-et-per-depart-lecture.txt`) ; sur le port : 14 tests verts (`temoin-et-per-port.txt`) et lecture verte (`temoin-et-per-port-lecture.txt`). Dossier temporaire et jonction retirés, node_modules intact.
- `tests.txt` (période, headerSignataire, bDiversEntete, dashboardNavigation, synthese) : 8 fichiers, 96 verts. Après corrections : période + periodeSaisie + headerSignataire + bDiversEntete = 65 verts.
- Build : `build.txt` vert après les corrections (« built in 31.96s », DRAPEAUX OK).
- Suite complète (`tests-tout.txt`, 21 min) : 6 fichiers rouges, 13 tests, tous connus d'avant : expenseSheet 1, recipeAiWorkflow 2, recipeEditing 6, yeastPitchingExecution 2, designTokens 1, virgule-transversale 1. Aucun rouge à moi (fuzzSaisie, headerSignataire, dashboardNavigation, synthese verts). La suite a tourné pendant mes corrections de ChoixPlage/CSS/Header : après elles, 65 tests ciblés verts.
- Captures : `captures/` (390 DPR 2 tactile et 1280, clair et cave, 12 états) et 8 planches `captures/cote-a-cote-*.png`, toutes ouvertes (voir ci-dessous). Parcours : `parcours-et-per.json`.

## Parcours ET-PER (parcours-et-per.json, 4 passes, contexte Chrome neuf par passe)
Chaque passe : Nov. au départ, « T4 » posé dans Plus (champs 01.10 → 31.12) : Bord, Finances (« 4e trimestre 2026 »), Brassins, feuille de la pastille disent T4 ; flèche ‹ depuis Brassins : T3, puis Finances lit « Juil. – sept. 2026 » ; « 12.10 → 03.11 » tapé dans la feuille : la pastille dit « 12 oct. → 3 nov. » (1280) ou « 12.10–03.11 » (390) sur Finances, Brassins, Bord ; la Synthèse montre « Arrondi aux mois entiers : octobre 2026 à novembre 2026 ». Duo d'avatars sur la même ligne que la pastille à chaque étape (contrôle `duoMemeLigne`).

## Combien et quels problèmes (captures ouvertes) — corrigés
1. 1280, carte Période de Plus : frise et raccourcis écrasés dans une colonne de 26 px (la grille `.ops` à deux colonnes d'Opérations dès 900 px s'appliquait). Corrigé : `.ops.pr-plage` en une colonne (periode.css) ; revu en image, clair et cave.
2. 390, plage dans l'en-tête : « 12 oct. → 3 nov. » (196 px de pastille) chassait le duo d'avatars sur une 2e ligne sur Finances, Brassins, Bord. Corrigé : sous 430 px la plage se dit « 12.10–03.11 » (pastille de ~170 px) ; l'étiquette ARIA reste la forme longue. Vérifié : le duo est sur la ligne de la pastille à chaque étape, 4 passes.
3. Saisie des jours : le champ rempli gardait son texte (« 0112.1007 » en tapant « 12.10 » dans « 01.07 ») et la période posée à « 12.1 » (lu 12 janvier) réécrivait le champ pendant la frappe. Corrigé : sélection au focus, champ non réécrit pendant la frappe, plage posée à deux chiffres de mois ou en quittant le champ ; test `tests/integration/periodeSaisie.test.tsx` (2 cas) vert.
4. Duo d'avatars : le A était presque caché derrière le G (la maquette m3 montre G et A côte à côte). Corrigé : écart de 4 px au lieu de 10 (Header.tsx) ; revu en cave et en clair.
5. Banc : la période persistait d'une passe à l'autre (un seul profil Chrome) et les écrans paresseux étaient pris sous « Chargement de l'écran… » : un contexte neuf par passe, et attente de l'écran (captures.mjs).

## Combien et quels problèmes — restent (hors de ma voie ou limites)
6. Aucune écriture en dev-local : « 0 opération », « 0 écriture », barres de dépense absentes dans la frise et dans Finances. Les barres ne sont donc pas vues dans la carte ; elles viennent du même `Frise` qu'Opérations (test de la donnée en lecture seule : `donneesFriseDe`). À voir sur des données réelles ou une fixture d'écritures ; non fait ici (aucune écriture).
7. Le bouton « + » flottant recouvre la dernière ligne de la liste sur Plus et Finances au 390 : c'est le + de port-b1, pas le mien.
8. Étape `finances-mois-precedent` du parcours : le bouton « Mois précédent » de la bande de Finances n'est pas présent sur la Synthèse (chips sept./oct./nov./tout) : l'étape n'a rien touché, la pastille reste T3. Les chips de la Synthèse ne sont pas des boutons de ma voie ; aucun défaut vu.
9. La Synthèse (FinanceOverview) compte au mois entier : la mention d'arrondi s'affiche (décision du pilote). Elle apparaît sous les onglets, en petit.
10. Écart avec m3 : l'en-tête de Plus dit « Ma Brasserie » (donnée de l'app) là où la maquette met « L'Affinée · Fribourg » ; carte Période de la maquette (barres de 12 mois) remplacée par la frise de Finances sur demande du brasseur.

## Écarts et « manque : … »
- manque : lignes de valeur « Drive · IA Rapide » (Connexions cloud et IA) et « IBAN à corriger » (Réglages) : l'app n'a pas d'état prêt ; non inventés.
- La frise de l'en-tête ne retire pas les archives ; ouvrir le journal par « Registre » / « Paiements inconnus » pose « Tout » comme période de l'app (une seule période, assumé).
- `CatalogToolbar` : le bloc « Choisir les dates » (période `custom`) reste dans le code, jamais atteint. `GrillePeriode.tsx` reste dans le dossier (m3r-a, provisoire), non monté.
- Doute : la suite complète date de la version avant les 4 corrections (ChoixPlage, CSS, Header) ; les fichiers touchés sont couverts par les 65 tests ciblés rejoués après.

DÉCISION À PRENDRE : la période doit-elle aussi dire « Tout » dans la frise ? (aujourd'hui : le raccourci « Tout » existe, la frise montre alors le mois en cours). Recommandation : garder, rien d'inventé.
CONNAISSANCE : la période d'app se garde sous `app_global_time_filter` en texte (`month-AAAA-MM`, `quarter-AAAA-T`, `year-AAAA`, `range-AAAA-MM-JJ_AAAA-MM-JJ`, `all`) ; les anciennes valeurs se relisent. `depuisJours` range une plage en mois / trimestre / exercice quand elle les couvre exactement. Piège CSS : `.ops` (operations.css) devient une grille à deux colonnes dès 900 px et place tout enfant en colonne 2 : tout composant qui réutilise `.ops` hors d'Opérations doit forcer une colonne.
LEÇON PROPOSÉE : aucune
