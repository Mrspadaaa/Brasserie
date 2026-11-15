REPRISE : work/missions/2026-11-14-finances/voies/s2c/RESULTAT.md — 3 vues portées et testées (G1 VITEST OK, G2 TSC OK) ; captures et finitions CSS restent, G3 non rejoué

# État de reprise de la voie s2c (15.11)

## Fait (preuves)
- **G1** : `node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/s2c/tests.txt` → `VITEST OK` (3 fichiers : previsionAjout 9 tests, bienAmorti 11, profilEffets 16, tous verts).
- **G2** : `node work/missions/2026-11-14-finances/outils/tsc.mjs` → `TSC OK` après mes écritures (un échec vu plus tôt, `BrewBudgetSheet.tsx(223)` et `projet/ProjetPiste.tsx(124)`, est dans les fichiers d'autres voies, pas les miens ; à re-vérifier).
- **G3** (`controle-v6a.mjs 3000`) : pas encore rejoué.
- Fichiers écrits (tous dans Possède) :
  - `src/ui/finance/profil/ProfilEffets.tsx` + `profil.css` (classes `pfc-`) : m4pf-c. Titre « Solde et paramètres ». Cartes : Solde de départ (champ + courbe de caisse `courbeDeCaisse` = `summarizeLedger(...).cashCents` mois par mois, pastille date, bascule « Vérifié » = vraie case `checkbox` avec aria-label « J’ai vérifié ce solde, avant les paiements de cette journée. »), Tout est noté depuis (pastille mois + 12 cases tactiles, `moisCompletsDepuis`, phrase « N mois complets : la tendance est calculée. »), Production prévue (champ + curseur 0–4 000 L pas 50, 0 = non renseignée ; 3 effets : charges fixes `annualBrewFixedCosts`÷litres, brassins = litres ÷ `litresNets` du 1er brassin de `estimerBrassinsPlanifies`, coût du litre `coutLitre.affiche.complet` du même brassin, « — » si inconnu), TVA (`tvaThresholdStatus`, texte seulement, pas de jauge), rangée repliée « Précisions » (phrases de l'ancienne feuille). `parametres` : la carte « Tout est noté depuis » est amenée dans la vue (ref callback, une fois).
  - `src/ui/finance/bien/BienCuve.tsx` + `bien.css` (classes `bic-`) : m3im-c. Titre = nom du bien (« Ajouter un amortissement » si neuf), sous-titre « son usure · terme : amortissement ». Segment « 20 % du reste / 10 % du prix » (taux de `DEPRECIATION_CATEGORIES`), barres = `barresDuBien` (achat, valeur reprise année avant le départ, puis `depreciationForYear(...).closingCents` jusqu'à exercice+4, 6 années au plus), un seul chiffre « si 10 % du prix : −180,00 en 2026 », « Usure à garder en 2026 » (calcul sur `{...draft, openingConfirmed:true}` = aperçu, dit « Aperçu : l’Annuel ne compte cette usure qu’une fois… » tant que non confirmé ; « — » + note si le domaine refuse), curseur Part pro, 6 cases (Prix, Achetée, En service, Départ, Valeur 1er janv., 1re année = entière/moitié/aucune), ligne verte de confirmation (vraie case), deux plis « Matériel du stock, achat lié, catégorie » (tous les champs actuels : stock, nom, achat lié, ligne, avoirs, catégorie AFC, taux) et « Vendue ou mise au rebut » (cession complète). `annual.ts` intouché.
  - `src/ui/finance/FinanceForms.tsx` : `ProfileSheet` → `<ProfilEffets>`, `AssetSheet` → `<BienCuve>` (imports ajoutés, anciens corps et `ASSET_CATEGORIES` retirés). `PaymentSheet` intouchée. `PlanSheet` délègue toujours à `PlanSheetC` (s2).
  - `tests/integration/previsionAjout.test.tsx`, `bienAmorti.test.tsx`, `profilEffets.test.tsx`.
  - `work/missions/2026-11-14-finances/voies/s2c/capturer.mjs` : script de captures (`node work/missions/2026-11-14-finances/voies/s2c/capturer.mjs [390|1280|tout] [clair|cave|tout]`, sort `cap/<vue>-<ouvert|apres>-<largeur>-<thème>.png`, vues pf, pr, im). Premier essai 390 clair : seule `cap/pf-ouvert-390-clair.png` produite (la suite s'est figée plus de 5 min après `pf-ouvert` ; processus peut-être encore vivant : à tuer, voir ci-dessous).

## Vu sur capture (pf-ouvert-390-clair.png, ouverte en image)
Très proche de la maquette m4pf-c : titre, 4 cartes, frise avec point vert / bleu, bascule verte « Vérifié », cases de mois, curseur doré, trois effets, TVA, pied Annuler / Enregistrer. Défauts à corriger (CSS, dans `profil.css`) :
1. Les champs nombre (`.pfc-nb`) sont des `textarea` en tactile (le composant `Input` rend un textarea auto-dimensionné quand le pointeur est grossier) : le chiffre colle en haut et « CHF » / « L/an » passe en dessous. Corriger : `.pfc .pfc-nb { display:block; resize:none; overflow:hidden; line-height:24px; height:40px !important; padding:8px 0 !important; }` ; même défaut probable dans `bien.css` (`.bic-in`, cellules Prix, Valeur 1er janv., Départ) et dans `prevision.css` (`.pvc-in`, à vérifier sur capture).
2. Solde affiché « 4000 » sans décimales ni séparateur : passer `fractionDigits={2}` au `NumberInput` du solde (maquette : « 3 250,00 CHF »).
3. Cases de mois en `--water` (gris-bleu) au lieu du cyan de la maquette : jeton thème, écart à dire dans RESULTAT (ou choisir un jeton plus vif).
4. Les trois effets montrent « — » sur `?finance-demo` (aucun brassin planifié dans ce banc) : juger l'effet 3 sur `?dev-local&finance-demo=reel` (REEL-LOT-2 et 3 sont planifiés) ; le script de capture doit utiliser `finance-demo=reel` pour pf.
5. Pied : Annuler est cerclé (pied commun `.fx4-sheet` de s2), la maquette l'a en fond gris sans bord : écart mineur, déjà convenu en s2.

## Reste à faire (ordre)
1. Tuer l'éventuel processus de capture figé (`wmic process where "name='node.exe'" get ProcessId,CommandLine | grep capturer`, puis `taskkill /PID <pid> /F`), corriger les 5 points ci-dessus, relancer `tsc`.
2. Captures : un seul essai de `capturer.mjs 390 clair` pour voir pourquoi l'étape après `pf-ouvert` se fige (suspect : `page.evaluate` sur `input.pfc-range` ou `cliquer('Tout est noté depuis août', contains, aria)`), puis **DEMANDE EXECUTANT** (ci-dessous) pour le reste.
3. Juger chaque capture ouverte en image, côte à côte avec `voies/m3/m3pr-c/m3pr-c.png`, `voies/m3/m3im-c/m3im-c.png`, `voies/m4/m4pf-c/m4pf-c.png`.
4. Rejouer G1, G2, G3 (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` → V6A OK) et FRISE (`node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` → FRISE OK).
5. `git status --short` à la fin (je n'ai écrit que dans Possède ; `cut.mjs` est dans le dossier scratchpad de session, hors dépôt).

## DEMANDE EXECUTANT (à lancer après les corrections CSS ; banc déjà lancé, ne pas le relancer)
Commandes, depuis la racine du dépôt, dans l'ordre :
1. `node work/missions/2026-11-14-finances/voies/s2c/capturer.mjs 390 clair`
2. `node work/missions/2026-11-14-finances/voies/s2c/capturer.mjs 390 cave`
3. `node work/missions/2026-11-14-finances/voies/s2c/capturer.mjs 1280 clair`
4. `node work/missions/2026-11-14-finances/voies/s2c/capturer.mjs 1280 cave`
Fichiers attendus dans `work/missions/2026-11-14-finances/voies/s2c/cap/` : `pf|pr|im` × `ouvert|apres` × `390|1280` × `clair|cave` = 24 PNG ; chaque ligne `ECHEC …` de la sortie est à remonter telle quelle. Sortie attendue : une liste de noms de fichiers puis `erreurs page … : aucune`. Captures à ouvrir en image : toutes ; l'auteur les juge. (Le script doit d'abord utiliser `finance-demo=reel` pour `pf` ; l'étape `im` imprime les boutons de l'étape 4 « Matériel et usure » pour trouver le bon bouton de bien.)

## Tests existants cassés par le port (fichiers non possédés : à corriger par le pilote ; les noms viennent des mots de la maquette)
- Titre du dialogue du profil : « Solde et paramètres financiers » → « Solde et paramètres ». Touche `tests/integration/financeWorkspace.test.tsx` (ligne ~116 `getByRole('dialog',{name:'Solde et paramètres financiers'})`), `tests/integration/soldeDepartCause.test.tsx` (lignes ~165), `tests/integration/impotBiereSheet.test.tsx` (lignes ~267-268). Le bouton de la Synthèse (aria-label « Solde et paramètres financiers ») ne change pas, ni les mocks `coutBrassinRenvois` et `prixACompleter` (ils simulent la feuille).
- Le pli « Paramètres des prévisions et des brassins » n'existe plus (les réglages sont des cartes visibles, comme la maquette) : `soldeDepartCause.test.tsx` (~228-233) et `impotBiereSheet.test.tsx` (~268) doivent vérifier à la place que `parametres` amène sur la carte « Tout est noté depuis » (`aria-label` de la section ; `scrollIntoView` appelé une fois, comme dans `profilEffets.test.tsx`).
- Titre du dialogue du bien : « Modifier l’amortissement » → le nom du bien (maquette : « Cuve de fermentation »). Touche `tests/integration/financeAnnuelSaisie.test.tsx` (~125) et `tests/integration/financeWorkspace.test.tsx` (~154). La case « Je confirme la catégorie, les valeurs d’ouverture… » (role checkbox), « Valeur d’acquisition TTC (CHF) », « Date de cession », « Catégorie AFC à confirmer » gardent leurs noms.
- Pas à moi (échecs vus, autres voies) : `coutBrassinRenvois` (BrewBudgetSheet), `synthese` T18 compagnon, `financeAnnuelSaisie` « Solde d’ouverture » (plusieurs headings).

## Écarts à la maquette (à confirmer sur capture)
- m4pf-c : champs à 44 px ; bascule « Vérifié » = case réelle (rôle checkbox) pour garder le nom accessible des tests ; effet 3 sans « ≥ » : coût du litre exact du domaine ou « — » avec « manque : … » ; étiquette de l'effet 3 = titre du 1er brassin planifié (« Prochain brassin » si aucun) ; rangée « Précisions » ajoutée (phrases de l'ancienne feuille sans place dans la maquette : « … ») ; cases de mois cliquables (place le début de l'historique à ce mois) ; pas de jauge TVA (passe 2).
- m3im-c : la barre de reprise (année avant le départ) = `openingValueCents` ; arrondi au franc pour les étiquettes (922, 737, 590, 472 contre 921… dans la maquette : l'arrondi du domaine est le bon) ; 1re année = liste entière / moitié / aucune (+ la valeur actuelle si autre) ; un aperçu « à confirmer » remplace l'absence de chiffre tant que non confirmé.
- m3pr-c (s2) : toujours non vu sur capture ; voir `voies/s2/RESULTAT.md` (écarts). Tests écrits et verts ; reste à le voir au rendu et à corriger.

## Doutes
- Le rendu de `PlanSheetC` (m3pr-c) et de `BienCuve` n'a pas encore été regardé en image ; le défaut textarea (point 1) les touche probablement.
- À vérifier : une prévision « À recevoir » garde la catégorie par défaut « Charges fixes » (comportement hérité de s2/de l'ancienne feuille, à confirmer).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : en tactile (`useCoarsePointer`), `Input` (et donc `NumberInput`, `ChampNombre`) rend un `textarea` auto-dimensionné : tout style de champ inline doit viser `textarea` aussi, avec hauteur et `line-height` forcés.
LEÇON PROPOSÉE : aucune.
