OK — Annuel g6 porté (tête g4a + 9 étapes), tsc et build verts, 38 tests neufs verts ; captures à rejouer par l'exécutant

Voie ug (09-10.11). PLAN.md corrigé constat par constat (§ 9 : 6 bloquants A/B et les graves, retenu / écarté + raison), puis étape 2.

## Fichiers écrits
- `src/ui/finance/TaxWorkspace.tsx` (réécrit : point d'entrée de l'Annuel, même export), `src/ui/finance/annuel/{calculs.ts, Ecrire.ts, dossier.ts, ctx.ts, Tete.tsx, Etapes.tsx, Etapes2.tsx, Feuilles.tsx}`, `src/ui/finance/annuel.css`.
- `src/ui/finance/FinanceForms.tsx` : `ClosingSheet` (`cote`, `proposer`, `propositions` ; une ligne reprise du stock n'a plus de valeur 0 : champ vide, l'enregistrement la refuse ; « Utiliser 22,42 » est un geste), `AssetSheet` (`initial`).
- `src/components/tabs/FinancesTab.tsx` : bloc Annuel seulement (`Edit` ciblés, relu avant ; barre `finance-bar`, `ExerciceField`, versions, lien archives et assistant retirés ; imports `Settings2`, `Field`, `ExerciceField` retirés ; 2 états ajoutés `closingOpts`, `assetInitial`).
- Tests neufs : `tests/integration/annuelCalculs.test.tsx` (17), `annuelEcran.test.tsx` (11), `annuelGestes.test.tsx` (10), aide `annuelSupport.tsx` (hors du motif `annuel*.test.tsx` du Possède : fichier neuf sans test). Adaptés : `taxWorkspace.test.tsx`, `financeAnnuelSaisie.test.tsx`.
- `voies/ug/` : PLAN.md, RESULTAT.md, `capturer.mjs`, `tests*.txt`, `tsc.txt`, `build.txt`.

## Critères (sorties)
- `npx vitest run annuelCalculs annuelEcran annuelGestes taxWorkspace financeAnnuelSaisie mobileDailyViews` : 90 verts (69 pour les cinq premiers) ; `financeWorkspace.test.tsx` : 3 rouges attendus (hors Possède, voir ci-dessous). Régression (financeArchives, financeJournalUx, dashboardNavigation, equipmentProjects, fix114, synthese, fribourgTax, finance, taxArchive, financeArchiveContinuity) : 10 fichiers, 97 verts (`tests-regression.txt`).
- Rouge d'abord : `tests-rouge.txt` (HEAD exporté dans le dossier temporaire) : `annuelEcran` rouge par module introuvable, `annuelGestes` 9 rouges par assertion sur l'ancien écran.
- `npx tsc --noEmit` : seules les 2 erreurs `firebase-admin` (`tsc.txt`). `npx vite build` : vert (`build.txt`).

## Essais utilisés
Tests neufs : 2 passes de correction (libellés de test, rôle `img` des SVG, base 68,00 de l'électricité venue de la démo). Adaptation des 2 tests existants : 3 passes. Aucun critère à 3 essais.

## DEMANDE EXECUTANT :
1. Lancer le serveur de ce worktree : `cd C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2 && npx vite --port 3000` (en arrière-plan ; attendre « ready »).
2. `node work/missions/2026-11-09-compta-prix/voies/ug/capturer.mjs clair-390 cave-390 clair-1280 cave-1280` ; sortie attendue : 4 × 12 lignes `CAPTURE …`, journal JSON avec `erreurs: []` et `manques: []` (sinon lister les clics manqués).
3. Fichiers : `voies/ug/captures/{clair,cave}-{390,1280}-{tete,mois,annee,etape1-operations … etape9-dossier}.png` (48 images).
4. Captures à OUVRIR (en image, une par une) par le pilote ou le critique, côte à côte avec `p3/g6/g6-page.png`, `g6-1280.png`, `g6-haut.png` et `g6-1-operations.png` … `g6-9-dossier.png` : au minimum clair-390 (tête, mois, étapes 1 à 9), cave-390 (tête, étapes 3, 4, 8), clair-1280 (tête, étape 4), cave-1280 (tête). Juger : trou rouge hachuré et « Stock au 31 déc. ? », piles lisibles, piste de 9, hauteurs d'étape à 390, contraste cave (rouge du trou), débordement des cartes d'inventaire et des tickets.
5. Rejeu : `npx vitest run tests/integration/annuelCalculs.test.tsx tests/integration/annuelEcran.test.tsx tests/integration/annuelGestes.test.tsx tests/integration/taxWorkspace.test.tsx tests/integration/financeAnnuelSaisie.test.tsx --reporter=dot` : attendu 5 fichiers, 69 tests verts.
Les captures NE sont PAS prises : aucune validation visuelle n'est affirmée (L12).

## Écarts avec la maquette (« 99 % », à lister au brasseur)
1. Perte de la tête : le domaine fait foi (décision D1) : joints en charge ; sur la démo le montant n'est pas −477,80 mais celui de `perteAvantStock` (toujours dit « avant stock » ; « −506,40 » dans la fixture du plan, qui compte aussi l'électricité de la démo). Le ticket de l'étape 8 ne donne un montant « à reporter » qu'une fois `tax.ready` ; avant : « avant stock, ce n'est pas encore le montant à reporter », Copier désactivé.
2. « Rien » (étape 1) absent : aucun champ ne retient un mois vide ; texte de second plan qui renvoie à « Tout est noté » (besoin domaine `emptyMonths`).
3. Pastille « loyer noté en nov. seulement » : n'existe que si un plan récurrent démarre avant le mois courant ; sur la démo (loyer daté du 25 nov.) elle est absente.
4. Étape 2 : « Oui » n'écrit rien (ni solde du 31 déc. copié de la caisse) ; année passée : « Saisir le solde du 31 déc. » ouvre la feuille des soldes.
5. Étape 8 : le revenu « avant stock » est nommé provisoire ; la fortune à copier = montant confirmé de l'annexe 05, sinon « À confirmer (annexe 05) », caisse + cuve − dettes en aide au second plan. CTA noir « Préparer le dossier » (étape 9), lien « Instructions officielles Fribourg 2025 » au second plan.
6. Étape 4 : « Petit achat » = état par défaut (charge de l'année, comme le domaine), sans écriture mémo (D2 écarté dans sa forme, § 9) ; « Matériel » ouvre `AssetSheet` prérempli.
7. Étape 6 : tuile bière en CHF estimé (pas de litres : aucun coût au litre dans le domaine) ; base du curseur proposée par mots-clés (à 100 % pro seulement), sinon saisie libre ; fragile, dit à l'écran « d'après … à vérifier ».
8. Libellé « Autres frais » (Synthèse) au lieu de « Petits achats » ; feuille « Année et versions » (non dessinée) ; titre « Annuel » masqué (BE-63) ; TVA : ligne absente sans seuil, libellé « sur 12 mois à ce jour », arrondi du domaine (un `floor`).
9. Les formulaires (ClosingSheet, AssetSheet, TaxClosingSheet, ArchiveManagerSheet, ProfileSheet) restent des feuilles : la maquette n'en dessine aucun.
10. Texte visible de l'étape 9 : « Télécharger le dossier » (`aria-label` « …avec justificatifs » gardé).

## À faire par le pilote (hors Possède)
- `tests/integration/financeWorkspace.test.tsx` (3 cas rouges, voie us) : 
  - l. 96-107 « guide la préparation annuelle » : `click tab Annuel` → `click button /^2\. Solde d’ouverture/` → `Renseigner le solde` est devenu `Non, corriger` (profil sans solde : « Renseigner le solde » existe encore à l'étape 2) ; « Ouvrir les opérations » → étape 1, bouton « Joindre » (filtre `proof`) ou « Ajouter » ;
  - l. 131-139 « registre existant » : `click /^4\. Matériel/` puis `button /Cuve 30 L/` (le bouton « Matériel à amortir » n'existe plus) ;
  - l. 198-200 « fige une version » : `click /^9\. Dossier/` puis `button /^Figer la version/` (plus de `tab 'Dossier'` ni de `Conserver une version de référence`).
- `scripts/check-invoice-journey-emulator.mjs:1105-1131` (émulateur, non rejoué) : `#tax-tab-documents` n'existe plus (aller à l'étape 9 par `button[aria-label^="9. Dossier"]`), et le texte visible du bouton est « Télécharger le dossier » (innerText) ; « Excel » est une tuile du classeur.
- `scripts/agents/inventaire-ecrans.mjs:132` : fichiers de l'écran `annual` (`annuel/**`, `annuel.css`) ; la zone-marqueur `{view==='annual'&&<>` a disparu (devenue `{view==='annual'&&<TaxWorkspace`).
- Nettoyage futur : règles `tax-steps`, `tax-next-task`, `tax-copy-*`, `tax-document-intro` de `tax.css` (mortes) ; vue `annual` de `FinanceAssistant` (plus montée dans l'Annuel, testée par `brewerChat.test.tsx:96`).
- Besoins de domaine : D1 alignement `annual.ts` sur `periodeSynthese` (si le brasseur préfère −477,80), `FinanceService.setCapitalTreatment`, `FribourgTaxClosing.emptyMonths`, `codesRevenu` de `fribourgTax.ts` (le code « 1.210 ou 1.220 » avant le choix principal/accessoire n'est pas affiché : phrase « choisis principale ou accessoire »).

## Doutes et limites
- Rien de visuel n'est vérifié : CSS écrit sans rendu ouvert ; tailles (étape 3 à 390, tickets, piste à 22 px de zone tactile) à juger sur les captures.
- Retour Android : l'étape est un état local, pas une URL.
- `key={year}` remonte l'écran à chaque exercice valide : la feuille « Année et versions » se ferme dès que les quatre chiffres sont tapés (test adapté).
- `FinancesTab` modifié en parallèle par d'autres voies : mon diff est limité au bloc Annuel, à vérifier au `git diff` avant commit.
- `BrewerChat` simulé dans les tests ; aucun appel Gemini.

CONNAISSANCE : `buildAnnualReport` laisse `resultCents` nul tant que les inventaires ne sont pas confirmés ou qu'une pièce de capital n'est pas classée ; une pièce `materiel` AVEC `finance` mais sans ligne est une charge silencieuse (pas d'alerte), SANS `finance` elle bloque le résultat. La démo `financeDemo` a un « Électricité 68,00 » qui fonde la base du curseur de l'étape 6.
LEÇON PROPOSÉE : un plan qui chiffre une fixture doit la tirer de la fixture réelle (`financeDemoEntries()`), pas la recopier de la maquette : 3 attendus du plan étaient faux (électricité omise, `resultCents` nul).
