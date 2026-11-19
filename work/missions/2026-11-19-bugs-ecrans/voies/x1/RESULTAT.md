# Voie x1
- BR-98 | corrigé | 3596e1fd3 | « Houblon pour ce style » (HopRecipeWorkbench) réemploie `optionsReference` de pickerOptions.ts : α publié (ou « α non publié », jamais 0), arômes, puis source et forme ; deux appels (repères du style, autres usages) gardent l'ordre des groupes
- BR-6 | corrigé | 3ac7ade75 | `lireAvecUnite` (numericInput.ts) lit l'unité tapée : « 0,1 kg » en g = 100 g, « 250 g » en kg = 0,25 kg, avec « 0,1 kg lu comme 100 g. » au champ (QuantityStepper) ; « 0,1 L » ou « 3 fûts » ou « beaucoup » : refusé avec message, valeur d'avant reprise (même si « 0,1 » était déjà parti au parent à la frappe). Champs en unité de pièce (sachet, Stk) : lecture inchangée. NumberInput non touché (sans unité)
- BR-5 | corrigé | 4d3bca213 | lecture étroite (b) : `avisSaccharification` (paliers/modele.ts) + note sous la courbe (EtapePaliers) : « 63 °C : FG plus basse d'environ N points (repère : 66,5 °C). » via `BrewingMath.attenuationForMashTemp` ; N = écart d'atténuation × (OG−1) ; sans OG : le sens et l'écart d'atténuation, sans chiffre de FG inventé ; rien à moins d'un point de FG ; palier retenu = saccharification la plus longue entre 62 et 72 °C. FG, alcool et yeastProjection.ts inchangés

Tests : `npx vitest run <17 fichiers liés à QuantityStepper/numericInput/HopRecipeWorkbench/paliers + 3 nouveaux> --maxWorkers=2` → 17 fichiers, 230 passés, 0 échoué (tests.txt). Rouge avant : 17 échecs sur 19 tests des trois nouveaux fichiers (rouge.txt, les 2 « passés » étant les cas déjà vrais : nombre sans unité, 66,5 °C sans avis). `tsc --noEmit` : aucune erreur dans les fichiers touchés.

Captures (voies/x1/captures/, journal : captures-journal.txt ; app locale dev-local port 3108, drapeau hopV4 éteint = écran livré, fixtures de dev) :
- br6-kg-{390,1280}-{clair,cave}.png, br6-litre-* : ouvertes : br6-kg-390-cave montre Nugget à 100 g, « 0,1 kg lu comme 100 g. » en orange sous le champ, IBU 130 (et non 0). Journal : « 0,1 L » refusé, champ reste 100, message « ce champ est en g. La valeur précédente (100 g) est conservée. » (aux 4 combinaisons).
- br5-defaut-*, br5-63-* : ouverte : br5-defaut-390-cave montre la note « 68,5 °C : FG plus haute d'environ 2 points (repère : 66,5 °C). » sous la courbe, au-dessus de Rinçage, lisible mais discrète (gris, 12 px). Les br5-63-* montrent la même recette : le geste « toucher le palier puis taper 63 » n'a pas trouvé le bouton du palier dans le script (palier touché : false) ; le cas 63 °C est prouvé par le test d'intégration BR-5 (BrewWizard réel, 63 °C), pas par capture.
- br98-liste-1280-{clair,cave}.png : ouverte (clair) : liste « Repères pour ce style » avec, par houblon, « α non publié · <arômes> · source · forme » (Dolcita, Citra, Nectaron, Wai-iti, Simcoe…). 390 (clair et cave) : combobox non trouvé par le script (disposition étroite de l'atelier), captures non probantes pour BR-98.

Doutes et limites :
- Le catalogue de démarrage (guide) ne publie pas d'α pour la plupart des variétés : la liste dit donc « α non publié » (vrai, jamais 0) avec les arômes ; l'α s'affiche pour les variétés qui en ont (test : « 11–13 % α »).
- BR-98 non capturé à 390 et BR-5 à 63 °C non capturé : à rejouer par un exécutant si le pilote le veut (DEMANDE EXECUTANT ci-dessous).
- Les fichiers de la voie : banc/ (banc.html, banc-main.tsx : fiche recette simulée « ZZ TEST — Double IPA »), capturer.mjs, capturer98.mjs. Aucune donnée réelle, aucun Firebase.
- Un avis BR-5 s'affiche aussi pour toute recette de la maquette à 68,5 °C par défaut : voulu (écart réel de 2 points sur 1,066).

DEMANDE EXECUTANT :
1. `node scripts/with_server.mjs --server "npm run dev -- --port 3108 --strictPort" --port 3108 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/x1/capturer98.mjs` → « CAPTURES98 OK » ; ouvrir br98-liste-390-clair.png et -cave.png (le script cherche `input[aria-label="Houblon du scénario"]` : à 390, si absent, trouver le bon sélecteur ou ouvrir l'onglet Simuler et choisir « Nouvel ajout » dans « Ajout à simuler »).
2. Capture BR-5 à 63 °C : dans capturer.mjs, le bouton de palier se cherche par `aria-label` `^Palier \d` contenant « 68,5 » ; vérifier le libellé réel (`p.evaluate` sur les `button[aria-label^="Palier"]`) puis relancer.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `BrewingMath.attenuationForMashTemp` n'est appelée que par `avisSaccharification` (paliers/modele.ts) ; yeastProjection.ts n'en dépend toujours pas (FG et alcool restent indifférents à l'empâtage ; seul l'avis le dit).
LEÇON PROPOSÉE : aucune.
