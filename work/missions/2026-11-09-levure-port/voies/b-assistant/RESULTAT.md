OK partiel — 40 bugs corrigés (test rouge d'abord), 28 déjà corrigés ou non reproduits ; restes : trois questions de goût ou de règle d'une ligne chacune.

# Résultat b-assistant (09.11), version 2 — 152 bugs (134 + 18 du pilote), Possède étendu

Méthode : chaque bug relu contre HEAD ; geste rejoué dans Chrome (`?dev-local&etape=houblons&recette=identite`, port 5655, arrêté à la fin ; banc `banc.mjs` et `sonde1` à `sonde11` dans ce dossier). Depuis la consigne du pilote : le test ou la mesure Chrome d'abord, rouge sur le code d'alors, puis le correctif. **Exceptions dites** : le lot de la première passe (ChampNombre, Eau négatifs, parts, barre, EBC hors échelle) a été testé après ; `jours.ts` (AM-5) : test écrit avant le module mais jamais lancé rouge ; TE-29 (nom « Palier 2 ») sans test (Chrome seulement) ; PD-9 et la ligne « phases » de la fiche (`RecipePage`) : fiche non ouverte en Chrome (le banc n'y accède pas).

## Possède étendu (consigne 1)
Utilisés : `ui/DilutionField.tsx`, `ui/BrewSheet.tsx`, `ui/Combobox.tsx` (partagé), `ui/RecipeTextExport.tsx`, `ui/RecipeInstallationChoice.tsx`, `ui/WaterAnalysisTable.tsx`, `ui/NoloRecipeSimulator.tsx` et `domain/noloRecipeSolver.ts` (un formateur de densité), `domain/recipeMetrics.ts` (`ibuListe`). Non touchés : étape Levure, Dépense, atelier V5.5, `FormNav.tsx`, `PageShell`, `FloatingActions.tsx` (voir les « à trancher »).

## Tableau — corrigés
| id | issue | preuve | fichiers |
|---|---|---|---|
| BR-65, BE-19 | corrigé | refus de saisie dit (volume, ébullition, capacité) : « Valeur hors limites, de 1 à 2000 L. Valeur gardée : 20 L. » ; Chrome 390 et 1280 (`s5-identite-390-clair`) ; `refusSaisie.test` (8) | identite/ChampNombre.tsx, CarteVolume, CarteEbullition, TuilesMateriel, regles.ts |
| BR-85, BE-9 | corrigé | sel, acide, épaisseur « −1 » : valeur d'avant rendue + phrase (Chrome 1280 ; `waterRefusNegatif.test`) | water/SaltDoseControl, AcidDoseControl, WaterVolumes |
| BR-84, BE-8 | corrigé | « 2,5 » tapé reste « 2,50 » (Chrome ; avant : « 2,51 ») | water/WaterVolumes.tsx |
| BR-80, BE-4 | corrigé (code ; champ dans un `<details>`, non rejoué) | « Osmosée disponible » : borne 1000 L dite, plus de « 10009 » | water/WaterDilution.tsx |
| BR-78, BE-2 | corrigé | `bAssistantHorsZone.test` rouge puis vert : litres −1 / 99999 → « 0 L retenu » / « 20 L retenu » dits | ui/DilutionField.tsx |
| BR-64, BE-18, MV-16 | corrigé | test rouge puis vert : espace libre 99999 / −1 → 20 % gardé + phrase ; entier (plus de 0,004 %) | ui/RecipeInstallationChoice.tsx |
| BR-24 | corrigé | test rouge puis vert : l'aperçu masque le bloc de réimport, le .txt le garde | ui/RecipeTextExport.tsx |
| BR-26 | corrigé en partie | test rouge puis vert + Chrome 390 (`s10-recap-390-clair`) : ligne « Quantité / SafAle US-05 ». Reste : sans unité enregistrée (fixture), la case n'a pas d'unité (honnête : inconnu) | ui/BrewSheet.tsx |
| BR-25 | corrigé | test rouge puis vert + Chrome 390 : « Fermentation primaire » passe à la ligne | ui/BrewSheet.tsx |
| TE-33 | corrigé (2 des 3) | tests rouges puis verts : « 2 phases » au récap (Chrome) et à la fiche ; « 0 IBU » d'un IBU annoncé à 0 → inconnu (`recipeMetrics.test`). « Galaxy 17.2% » : introuvable dans le code actuel | ui/BrewSheet.tsx, pages/RecipePage.tsx, domain/recipeMetrics.ts |
| BR-66, BE-20 | corrigé | `noloRecipeSolver.test` modifié (1,035 au lieu de 1,0346), rouge puis vert ; curseur à 3 décimales | domain/noloRecipeSolver.ts, ui/NoloRecipeSimulator.tsx |
| BR-62, BE-16, BR-86, BE-10 | corrigé (BR-86 : même composant, profil d'eau non rejoué) | Chrome avant : liste 190 px, 168 noms sur 248 coupés ; après : 416 px au 1280, 366 px au 390 décalée à gauche, 1 coupé (`s7-styles-390`, `s7-styles-1280`) ; `comboboxLargeurListe.test` | ui/Combobox.tsx |
| BR-81, BE-5 | corrigé | `waterAnalysisDoubleToucher.test` rouge puis vert : un ✓ dans les 600 ms qui suivent « Modifier » est ignoré | ui/WaterAnalysisTable.tsx |
| BR-82, BE-6 | corrigé | Chrome 390 avant : 17 éléments hors écran (Mg à 401, pH à 641) ; après : 0 (`s11-analyse-edition-390`) | ui/WaterAnalysisTable.tsx |
| RJ-12, BR-13, N-NOTE-1 | corrigé | Chrome cave, mesure WCAG : « empâtage » 2,51:1 sur la ligne choisie → plus aucun texte sous 4,5:1 (sauf chevron décoratif) | fermentescibles/correctifs.css |
| BR-14 | corrigé | Chrome : seule cible < 24 px de l'étape = bascule des repères 16 × 24 → 24 × 24 | correctifs.css |
| BR-90, BE-14 | corrigé en partie | Chrome Eau clair et cave : 3 contrastes (4,23 ; 3,92 ; 4,16) → 0 ; case 20 → 24 px. « Départ 11 mg/L » sur ion choisi : non retrouvé | water/WaterDilution, WaterFeedback |
| AM-11 | corrigé | repère « 63,3 EBC › » dit au bord ; il chevauchait « style 59–79 » (vu en cave 1280) : remonté de 14 px, l'étiquette de style se cale à droite (`s8-Malts-1280-cave`, `s5-ferm-390-clair`) ; test rouge puis vert | fermentescibles/Reperes.tsx |
| PI-2 | corrigé | un grain hors de l'empâtage a une part nulle dans la barre (test) | fermentescibles/EtapeFermentescibles.tsx |
| PD-4 | corrigé | la question « Remplacer sa masse par … ? » vient sous le champ d'ajout (test : ordre du DOM) | EtapeFermentescibles.tsx |
| AM-5 | corrigé | `jour.test` (4) : « J+60 tombe après la fin du programme de fermentation (14 j) » ; plafond d'un an ; branché à l'étape. Non rejoué en Chrome | domain/fermentables/jours.ts, EtapeFermentescibles, BrewWizard |
| BR-31 | corrigé | Chrome avant : le retrait du seul palier ne dit rien ; `saccharification.test` rouge puis vert ; message au conseil des Paliers | domain/fermentables/empatage.ts, pages/BrewWizard.tsx |
| TE-29 | corrigé en partie | un palier ajouté s'appelle « Palier 2 » (plus « Palier ») ; la ligne mash-out éditable : à trancher | BrewWizard.tsx |
| TL-17 | corrigé | `parts.test` : 62 + 19 + 19 = 100 (avant 63 + 19 + 19 = 101) ; fiche non ouverte en Chrome | domain/fermentables/parts.ts, RecipePage.tsx |
| TL-24 | corrigé | « 2 sachets », g et mL invariables (test) | parts.ts, RecipePage.tsx |
| PD-9, BR-101, BE-54 | corrigé en partie | « Couleur attendue … — 37,4 EBC » (plus de SRM, virgule) ; restes « Bêta 64.5 °C », « 71.5 % d'efficacité » non traités | RecipePage.tsx |
| BR-22 | corrigé (code ; non rejoué, il faut vider la recette) | « OG retenue 1,066 · aucun fermentescible pour la calculer » | BrewWizard.tsx |
| MV-17 | corrigé (code) | le nom d'exemple suit le style | BrewWizard.tsx |

## Tableau — déjà corrigés ou non reproduits
| id | issue | preuve |
|---|---|---|
| AM-9 | déjà corrigé, conforme au pilote | `BrewWizard.tsx` l. 917 : `details.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75`, repère « repère » si non déclaré |
| PD-2 | déjà corrigé | Chrome, 9000 kg : OG et teinte « — », alerte « OG 105,228 : aucune bière ne monte au-delà de 1,130 » |
| TE-28 | déjà corrigé | Chrome Paliers : 99 °C → « Entre 35 et 80 °C… » ; durées et phases hors bornes dites (0d56e2da) |
| BR-77, BE-1 | déjà corrigé | Chrome : gypse 99999 → « au-delà de 500 g… valeur précédente conservée » (ce37a55c) |
| BR-79, BE-3 | déjà corrigé (code) | `bornesProcede.eauIssues` : acide hors de 0,2 à 1 mL/L, « erreur de saisie probable » |
| BR-83, BE-7, BR-23 | déjà corrigé | Chrome : rinçage 99999 et empâtage −1 → alertes (0d56e2da) |
| TE-30 | déjà corrigé en partie | Chrome : alertes « 16 393,3 L/kg » et « Empâtage trop volumineux » ; « Moût avant ébullition » reste la cible par choix (MV-31) |
| AM-20, AM-24, AM-32, BR-10 | déjà corrigé | Chrome : 2000 L → « +1970 L de trop » ; 89f948ea, 0d56e2da, 32de3a47 |
| BR-63, BE-17, BR-87, BE-11, BR-88, BE-12, BR-97, BE-50, BR-102, BE-55 | déjà corrigé | 5b5132a0 (virgule, bornes) |
| BR-116, BE-87 | déjà corrigé (Bilan) | 89f948ea ; la feuille Brassins : hors zone |
| BR-17 | déjà corrigé | Chrome : « Malts/sucres 2/7 » au titre comme au rail (bc9e084c) |
| BR-20 | déjà corrigé | Chrome : volume 2,5 L, 6,1 kg → au récap « 2,44 kg/L : au-delà de 0,7 kg/L, aucune bière n'existe » et « OG retenue 1,548… » |
| TL-8 | déjà corrigé en partie | « 14.2 % AA » n'existe plus (TE-23) ; « 71.8 % » de `brewingMath` : hors zone |
| TL-13 | déjà corrigé dans ma zone | « Non calculable / Non comparable » n'existent plus dans `BrewWizard` ; restes dans `YeastPitchingPanel` et l'atelier V5.5 (interdits) |
| TL-18 | non reproduit | Chrome 390 et 1280 : deux « Fermer » dans le DOM, un seul visible (en-tête `sm:hidden` / `hidden sm:block`) |

## « À trancher » — une ligne chacun : question · recommandation · nature
Non examiné = plafond de tours, ce n'est pas un verdict.
| id | question · recommandation · nature |
|---|---|
| TL-31, BR-28, BR-89, BE-13, BR-103, BE-56 | Le « + » flottant couvre des valeurs au bord droit en défilant. Le replier au défilement vers le bas (hors de l'écran, il revient en remontant) ? Reco : oui, un seul comportement dans `FloatingActions.tsx`. **Goût** (sa maquette garde le bouton) |
| BR-104, BE-57 | Le volet « Budget » s'ouvre déjà défilé (carte sous l'en-tête). Reco : `scrollIntoView` du début du volet à l'ouverture. **Règle**, non examiné |
| TL-30 | Nom tronqué à 500 px dans le champ. Reco : garder (nom et pastille de style sur une ligne, r4-a) ; infobulle du nom entier. **Goût** (règle n° 1) |
| TL-7, TE-15 | « Objectif NOLO » répété, 9 champs et 6 dépliants dans Identité. Reco : un seul panneau replié, résumé au premier plan. **Goût**, à montrer |
| TL-10 | Malts proposés sans couleur ni PPG : table de couleurs sourcée ? Reco : oui, une table (Weyermann/Castle) citée, jamais inventée. **Règle** (donnée) |
| TL-16 | Alerte d'eau rouge dès l'ouverture d'une recette enregistrée : (a) garder, (b) recalculer avec « Annuler », (c) ambre « à recaler ». Reco : (c). **Goût**, à montrer |
| TL-11, TL-12, TL-26, TL-27 | Restes décrits (sections absentes de la fiche, deux entrées du menu +, noms de malts doublés, « 0 % ferm. », six sous-sections repliées). Reco : un ticket par reste. **Règle**, non examiné |
| TL-19, BR-7 | « Nouvelle recette » rouvre un brouillon sans le dire ; « Enregistrer » ouvert par « Modifier » retourne à la liste défilée. Reco : dire « brouillon repris » ; revenir à la fiche. **Règle**, non examiné |
| TL-23 | Repère OG barrant son chiffre en sombre : jamais rejoué. Reco : mesurer avec la sonde 8 en cave. **Règle**, non examiné |
| TL-25 | Sous-titre « Sucres et ajouts » : phrase de pédagogie à la place d'un résumé. Reco : « 2 sucres · 1 fruit ». **Goût** |
| BR-91, BE-15 | « Eau » au rail, « Eau et sels » au titre ; 14 fichiers de tests lisent « Eau et sels ». Reco : garder le court au rail (comme « Récap. »). **Goût** |
| BR-27 | Budget : coûts négatifs acceptés. Reco : même refus dit (`rejeter` + `onRefus`). **Règle** ; fichier du budget (voie d), non touché |
| BR-96, BE-49, BR-98, BR-99, BE-52, BR-100, BE-53, BR-105, BE-58, BR-106, BE-59 | Fiche de recette : volume du brassin 99999, houblons sans α, onglet choisi 1,83:1, bouton choisi sans marque, étiquette du radar, titre « 8 recettes ». Reco : mesurer en Chrome (sonde 8 sur la fiche) puis corriger. **Règle**, non examiné |
| BR-114 à BR-117, BE-85 à BE-88 | Feuilles Mesures et Brassins (densité 2,5, 57,9 L conditionnés pour 19,8 L, « Supprimer ce brassin » muet). Reco : voie b-stock/b-divers (Brassins). **Règle**, hors zone |
| TE-11 | « Ranger la recette » pour un bouton « … » : libellé juste mais forme de menu. Reco : « Plus d'actions ». **Goût** (mot) |
| TE-12, PD-8 | FG et ABV « — » avec US-05. Reco : estimer depuis l'atténuation du fabricant, dite « estimée ». **Règle**, étape Levure (u1/u2) |
| TE-13 | « OG retenue / calculée » non expliquée, disparaît au premier malt. Reco : infobulle « retenue = la cible enregistrée ». **Règle**, non traité |
| TE-14 | NOLO : « 10.4 L » (point), 4,2 + 27,6 ≠ 31,8, 4 décimales (BR-66 fait), « Données manquantes » sans les nommer. Reco : nommer les données. **Règle**, non examiné |
| TE-31 | Carte « HCO₃ 0 ppm » et résumé « −1,2 ppm » pour le même ion épuisé. Reco : planché à 0 ppm partout. **Règle**, non examiné |
| TE-32 | La copie enregistrée garde la date de l'original, donc n'est pas en tête du tri « Date ↓ ». Reco : date d'enregistrement. **Règle**, service de sauvegarde, non examiné |
| TE-29 (reste) | Ligne « Mash-out 67 → 76 °C » non éditable parmi les paliers. Reco : la montrer comme palier éditable. **Goût**, à montrer |
| BR-67, BE-21 | « Proposer l'empâtage Froment » réécrit les paliers sans retour. Reco : une ligne « Paliers remplacés · Annuler ». **Goût**, non examiné |
| BR-19 | Famille de l'ajout : bascule à 5 valeurs parcourues à l'aveugle. Reco : liste des familles au lieu du cycle. **Goût**, à montrer |
| MV-7, MV-8, MV-9, BR-11 | Famille par défaut d'un nom neuf (Miel, Coriandre, Mangue) ; « dext » → Carapils ou Dextrose. Reco : deviner la famille d'après le nom connu, sinon demander. **Goût**, à montrer |
| TE-17, PI-1, SU-NOTE-2 | « J+3 » et « fermentation » pour un même état ; ⇄ d'un grain mal placé ; « 0,2 » Entrée = masse ? Reco : un seul mot « J+3 » ; ⇄ renommé « Remettre à l'empâtage » ; oui, « 0,2 » = masse. **Goût**, à montrer |
| M-4 | EBC 267 sans alerte : seuil de plausibilité ? Reco : alerter au-delà de 60 EBC par ligne de grain (sourcé EBC Malt). **Règle** (donnée), attend l'audit AM |
| RJ-10 | Texte inconnu → malt à 0 kg, EBC de toute la recette « — ». Reco : EBC calculé sans la ligne à 0 kg. **Règle**, non examiné |
| B1-NOTE-3, B1-NOTE-5, BA-NOTE-1 | « Abandonner » après un premier geste ; recette rechargée sans fiche ; double toucher sur « Fermer ». Reco : tests de geste dédiés. **Règle**, non examinés |
| BR-4 | IBU de la carte et de la fiche d'une même recette différents. Reco : `ibuListe` partout (déjà la règle) ; chercher la carte qui ne l'emploie pas. **Règle**, non examiné |
| BR-5 | Saccharification 67 → 63 °C sans effet sur l'atténuation. Reco : relier la température de saccharification à la fermentescibilité (modèle). **Règle** (métier), pas un défaut d'écran |
| BR-6 | « 0,1 kg » tapé en g devient 0,1 g (Houblons). Reco : refuser l'unité dans le champ. **Règle**, fichier des houblons (b-houblons) |
| TL-NOTE-4, TR-NOTE-2, TR-NOTE-3, TR-NOTE-4, GE-NOTE-2 | non jouable : notes sans geste exact ; TR-NOTE-3 est traité (TE-33 : IBU annoncé à 0 = inconnu) |
| TE-NOTE-7, SU-NOTE-1 | Données « ZZ TEST » et brouillon à supprimer. Reco : à l'accord du brasseur, en une demande groupée. **Règle** (irréversible) |

## Validation visuelle (consigne 5) — captures ouvertes, `captures/`
`s5-identite-390-clair` (message sous « 20 » ; vu), `s5-ferm-390-clair` (repère EBC ; vu), `s8-Malts-1280-cave` (contraste, repère sans chevauchement ; vu après correctif), `s7-styles-390` et `s7-styles-1280` (liste des styles ; vu), `s5-eau-1280-clair` (épaisseur « 2,50 » ; vu), `s10-recap-390-clair` (Quantité, phases, retour à la ligne ; vu), `s11-analyse-edition-390` (tableau dans l'écran ; vu).
Limites : Eau à 390 et fiche de recette (`RecipePage`) non captures ; thème cave contrôlé par mesure WCAG sur Malts, Identité, Paliers et Eau à 1280, une capture ouverte seulement.

## Tests (consigne 3)
**Suite complète** (`npx vitest run --reporter=dot --maxWorkers=2 > tests.txt`, fichier dans ce dossier) : `Test Files  9 failed | 1103 passed | 1 skipped (1113)` ; `Tests  15 failed | 12694 passed | 5 skipped (12714)`.

Échecs de ce run, tous hors de mes correctifs : `prototypes/houblons-v4/tests/{client-async,pack,worker-calculs}` (3 fichiers, 6 tests, atelier V5.5) ; `tests/unit/hopIndexV4/etapeHoublons` (atelier) ; `tests/integration/mobileDailyViews` (Finances, « Bilan et impôts » : voie Dépense) ; `tests/integration/{recipeEditing,yeastPitchingWizardOwnership}` (ancienne Levure : u1, 5 tests) ; `tests/unit/rejeu-649b/virgule-transversale` (restes : `ui/etapeLevure/Suggerer.tsx`, u1).
Deux échecs étaient de mon fait, corrigés après ce run et rejoués verts à part : `virgule-transversale` (`RecipePage` « {pct} % » et `empatage.ts` : formateur `nombreFr`) et `designTokens` (`text-cave-500` de `RecipePage`, déjà à HEAD, rendu `text-cave-400`). Les 24 tests de l'ancienne Levure cités par le pilote ne sont pas touchés ; ce run en montre 5 rouges seulement, les autres sont passés ou ne tournent plus.
Après ces deux corrections je n'ai pas relancé la suite entière (≈ 20 min) : les fichiers concernés, `tests/unit/{identite,fermentescibles,fermentables}`, `bAssistantHorsZone`, `comboboxLargeurListe`, `waterRefusNegatif`, `waterAnalysisDoubleToucher`, `recipeMetrics`, `noloRecipeSolver`, `designTokens`, `virgule-transversale` (hors `Suggerer`) ont été rejoués verts séparément.

## Fichiers modifiés
`src/ui/identite/{ChampNombre,CarteVolume,CarteEbullition,TuilesMateriel}.tsx`, `regles.ts`, `identite.css` ; `src/ui/water/{SaltDoseControl,AcidDoseControl,WaterDilution,WaterVolumes,WaterFeedback}.tsx` ; `src/ui/fermentescibles/{EtapeFermentescibles,Reperes}.tsx`, `correctifs.css` ; `src/ui/{DilutionField,BrewSheet,Combobox,RecipeTextExport,RecipeInstallationChoice,WaterAnalysisTable,NoloRecipeSimulator}.tsx` ; `src/domain/fermentables/{parts,empatage,jours}.ts` (neufs) ; `src/domain/{noloRecipeSolver,recipeMetrics}.ts` ; `src/pages/{BrewWizard,RecipePage}.tsx`.
Tests neufs : `tests/unit/{bAssistantHorsZone,comboboxLargeurListe,waterRefusNegatif,waterAnalysisDoubleToucher}.test.tsx`, `tests/unit/identite/refusSaisie.test.tsx`, `tests/unit/fermentables/{parts,saccharification,jour}.test.ts`, `tests/unit/fermentescibles/b-assistant-0911.test.tsx` ; modifiés : `noloRecipeSolver.test.ts`, `recipeMetrics.test.ts`.

CONNAISSANCE : `src/ui/water/*`, `RecipePage`, `BrewWizard`, `Combobox`, `DilutionField`, `BrewSheet` sont en CRLF : un remplacement exact doit convertir les fins de ligne (`edit-recipe.cjs`). La clé du thème est `laffinee.theme` (pas `theme`). Le banc Chrome doit attendre le titre de l'étape avant de taper. Un `heredoc` Bash perd les barres inverses des regex (`\d` → `d`) : écrire les scripts avec Write.

LEÇON PROPOSÉE : un bug « ouvert » de BUGS.md peut être déjà corrigé (23 de 70 relus) : commits du 08.11 qui citent l'id, jamais reportés. Après un commit de correctif, écrire l'id dans la ligne au même geste, et commencer chaque voie par `git log --grep <id>` avant tout code. Seconde : un contraste ou une cible se mesure en Chrome (sonde 8 : WCAG et 24 px) avant de corriger, pas à l'estime.

---
# 3e PASSE — les « non examinés » (consigne du pilote) ; ces lignes remplacent celles du même id plus haut
Test rouge d'abord à chaque fois, sauf mention. Mises à jour tous les 5 bugs.

## Fiche de recette et Eau à 390 : atteintes, captures ouvertes
- **Parcours réel du banc `?dev-local` : impossible jusqu'au carnet.** Chrome : recette de démonstration par l'assistant, « Enregistrer la recette », retour au tableau de bord, Brassins › « Recettes (0) » : Firestore refuse sans jeton, rien n'est lu (`sonde12.mjs`, carnet vide). Je n'ai pas touché `App.tsx` (u1).
- **Contournement, dit** : `fiche.html` + `fiche-main.tsx` (dans ce dossier, jamais livrés) montent la **vraie `RecipePage`** sur la recette de démonstration SIMULÉE (celle de l'étape Identité + un palier, deux phases, 2 sachets). Seule la lecture du carnet est contournée ; calculs, styles et sections sont ceux de l'app. Captures `s13-fiche-1280-clair` et `s13-fiche-390-clair` (ouvertes), `s13-fiche-390-cave`.
- **Vu** : « Couleur attendue : Noire — 63,3 EBC. » (PD-9) ; « Fermentation · 2 phases » (TE-33) ; parts du grain 76 + 16 + 8 = 100 % (TL-17) ; « 2 sachets » dans la section Levure (TL-24) ; contrastes < 4,5:1 : 0 et cibles < 24 px : 0 sur la fiche (1280 clair, 390 clair et cave, sections ouvertes).
- **Pas corrigé, vu** : l'en-tête de la section Levure écrit encore « SafAle US-05 · 2 sachet » : c'est `YeastRecipeHeading` (fichier de la Levure, interdit).
- **Eau à 390** (`s14-eau-1-390-clair`, `s15-radar-390-cave`, ouvertes) : onglets « 1. Eau » / « 2. Sels » ; épaisseur « −1 » refusée et dite (aucun débordement horizontal) ; gypse « −1 » dit ; radar entier.

## Tableau
| id | issue | preuve | fichiers |
|---|---|---|---|
| RJ-10 | corrigé | `bAssistantNonExamines.test` : l'EBC se calcule malgré un grain inconnu à 0 kg ; avec une masse il bloque toujours ; « 1 couleur à renseigner » ne compte pas une ligne à 0 kg (3 tests rouges puis verts ; celui de l'étape a d'abord échoué sur une erreur de fixture, sa version rouge n'a pas été vue) | domain/beerColor.ts, fermentescibles/EtapeFermentescibles.tsx |
| TE-29 | corrigé, test ajouté (demandé) | `nomPalierAjoute` : « Palier 2 », jamais deux fois le même nom (2 tests rouges, module absent, puis verts) ; branché au bouton « Ajouter un palier » | domain/fermentables/empatage.ts, BrewWizard.tsx |
| TE-31 | corrigé | `waterRefusNegatif.test` rouge puis vert : « HCO₃ −1,2 » → « 0 ppm » à la carte comme au résumé (`hco3Affiche`) | water/AcidDoseControl.tsx, WaterWorkbench.tsx |
| TL-25 | corrigé | `parts.test` (3 tests rouges puis verts) : sous-titre « 2 ajouts · 1,3 kg », la phrase de pédagogie passe dans le corps. Section « Sucres et ajouts » non ouverte en Chrome (la recette de démonstration n'a pas d'ajout) | domain/fermentables/parts.ts, pages/RecipePage.tsx |
| BR-105, BE-58 | corrigé | Chrome avant : l'étiquette « Cl⁻ 11 ▼ » dépasse le haut du cadre du svg de 6 px (1280) et 2 px (390) ; après : 0 étiquette coupée aux deux largeurs (sonde 15, `s15-radar-390-cave`) | ui/WaterRadar.tsx (marge de 14 unités au viewBox) |
| BR-84, BR-85 (suite) | corrigé | Chrome 390 : le message d'épaisseur disait « valeur précédente (4,19672131147541 L/kg) » ; `numericInput.test` rouge puis vert : « 4,197 L/kg » | ui/numericInput.ts (`messageRefus` arrondit au millième) |
| TL-23 | non reproduit | Chrome cave 1280 (`s8-Malts-1280-cave`) : « ~1,066 » lisible, le trait du repère passe sous le chiffre | — |
| TL-24 | corrigé en partie | corps de la fiche : « 2 sachets » (Chrome) ; en-tête de la section : `YeastRecipeHeading`, fichier Levure (u1) | — |
| TE-33, PD-9, TL-17 | confirmés par la vue | voir « Fiche de recette » ci-dessus | — |

## « À trancher » mis à jour (une ligne : question · recommandation · nature) — remplace les lignes de même id
| id | question · recommandation · nature |
|---|---|
| BR-96, BE-49 | « Préparer un brassin » accepte 99999 L : `components/QuickActionModal.tsx`, hors Possède. Reco : même refus dit que l'Identité (borne `volumeBrassinL` 2000 L de `bornesProcede`). **Règle**, à confier à une voie qui possède ce fichier |
| BR-98 | « Houblon pour ce style » : 44 houblons sans α ni arômes : atelier V5.5 (interdit). Reco : afficher l'α de la variété sourcée. **Règle** |
| BR-99, BE-52 | Onglet choisi 1,83:1 : dans « Potentiel aromatique › Simuler » (atelier V5.5, interdit) ; non retrouvé sur la fiche réelle (0 contraste bas). **Règle** |
| BR-100, BE-53 | Boutons « Évaluer ma recette / Trouver une conduite » sans marque du choisi : `YeastRecipeChoice` (Levure, interdit). Reco : `aria-pressed` + fond plein. **Goût**, u1 |
| BR-106, BE-59 | « 8 recettes » au titre de la fiche au 390 : le titre vient d'`App.tsx` (u1) ; non reproduit sur le banc de la fiche. Reco : titre = nom de la recette seul. **Règle** |
| TE-14 | « Données manquantes » sans les nommer : `NoloBound` n'a pas de champ « raison » (`functions/src/noloCore.ts`, hors zone). Reco : ajouter `missing: string[]` et le dire. **Règle** |
| TL-26 | « barre 0 % ferm. qui ne règle rien » : le libellé est un texte, pas une barre ; constat ambigu. Reco : demander au brasseur laquelle des deux lectures. **Goût**, à montrer |
| B1-NOTE-3 | « Abandonner » absent à l'étape 1, présent dès la 2ᵉ (Chrome `s5-identite-390-clair`). Reco : visible dès l'étape 1 une fois un champ modifié. **Goût** |
| TL-11, TL-12, TL-19, TL-27, BR-7, B1-NOTE-5, BA-NOTE-1 | Restes liés à `App.tsx` (reprise de brouillon, retour liste), à la fiche (sections) ou à un geste à rejouer au vrai écran : **non examinés**, faute de tours. Reco : un ticket par reste ; le banc `fiche.html` sert pour la fiche. **Règle** |
| TL-7, TE-15, TL-10, TL-16, TL-30, TL-31, BR-28, BR-89, BE-13, BR-103, BE-56, BR-91, BE-15, TE-17, PI-1, SU-NOTE-2, MV-7, MV-8, MV-9, BR-11, BR-19, BR-67, BE-21, TE-11, TE-29 (mash-out) | inchangés : **goût du brasseur**, à montrer en mini maquettes (table de la 2ᵉ version) |
| BR-27, BR-104, BE-57, TE-12, PD-8, TE-13, TE-32, BR-4, BR-5, BR-6, M-4, BR-114 à BR-117, BE-85 à BE-88 | inchangés : **règle** ou fichier d'une autre voie (table de la 2ᵉ version) |

## Tests de cette passe (mes fichiers, pas la suite)
Écrits dans `voies/b-assistant/tests-fichiers.txt` (`--reporter=dot`). Ligne complète : `Test Files  1 failed | 75 passed (76)` ; `Tests  1 failed | 1559 passed (1560)`. L'unique échec : `tests/unit/rejeu-649b/virgule-transversale` sur `src/ui/etapeLevure/Suggerer.tsx` (lignes 354 à 359), fichier de la voie u1 ; aucun de mes fichiers n'y figure. Rejoués : `tests/unit/{identite,fermentescibles,fermentables,water,rejeu-649b}`, `bAssistantHorsZone`, `bAssistantNonExamines`, `comboboxLargeurListe`, `waterRefusNegatif`, `waterAnalysisDoubleToucher`, `recipeMetrics`, `noloRecipeSolver`, `numericInput`, `designTokens`, `bornesProcede`, `recapEtat`, `contreCalculCouleur*`, `tests/integration/{water*,RecipeTextExport,sliderFieldBornes,dataEntry,inputProtection,stoutWaterProfile,recetteMemeChiffre}` ; et 27 fichiers qui citent `messageRefus` (376 tests verts) après l'arrondi.

## Fichiers modifiés de cette passe
`src/domain/{beerColor.ts,fermentables/empatage.ts,fermentables/parts.ts}`, `src/ui/{numericInput.ts,WaterRadar.tsx,water/AcidDoseControl.tsx,water/WaterWorkbench.tsx,fermentescibles/EtapeFermentescibles.tsx}`, `src/pages/{BrewWizard.tsx,RecipePage.tsx}` ; tests : `bAssistantNonExamines.test.tsx` (neuf), ajouts dans `waterRefusNegatif`, `numericInput`, `fermentables/parts`. Banc : `fiche.html`, `fiche-main.tsx`, `sonde12` à `sonde15`.

CONNAISSANCE : sous `?dev-local`, le carnet de recettes est vide même après « Enregistrer » (Firestore sans jeton) : la fiche se voit par `fiche.html` (RecipePage réelle, recette simulée) servie par Vite à `/work/missions/2026-11-09-levure-port/voies/b-assistant/fiche.html?theme=clair`. À 390, l'étape Eau a deux onglets : les doses de sels sont sous « 2. Sels ».

---
# 4e PASSE — les 7 derniers bugs, `App.tsx` dans le Possède, et le pluriel de `YeastRecipeHeading`
Test rouge d'abord (sauf mention), puis correctif, puis capture ouverte quand le défaut est visuel. Ces lignes remplacent celles du même id plus haut.

| id | issue | preuve | fichiers |
|---|---|---|---|
| TL-24 (suite) | corrigé | `bAssistantSept.test` rouge (« SafAle US-05 · 2 sachet ») puis vert ; capture 390 ouverte `s13-fiche-demo-390-clair` : « Levure SafAle US-05 · 2 sachets » | ui/YeastRecipeHeading.tsx (ce seul point) |
| BR-7 | corrigé | `AppEnregistrerRetourFiche.test` (vraie App, vrai wizard, vraie pile) : fiche → « Modifier la recette » → Récap → « Enregistrer la recette » ; rouge (`expected 'tabs' to be 'recipe'`) puis vert : la pile finit `['tabs', 'recipe']`. Cause : une page se pose sur les onglets, `close` ramenait aux onglets, donc à la liste défilée. Une copie ou une recette neuve ferment toujours comme avant. Pas de capture : l'enregistrement ne s'exécute pas sous `?dev-local` (Firestore sans jeton), le test porte la preuve | App.tsx (`saveFromWizard`) |
| BA-NOTE-1 | corrigé | `fullScreenRouteDoubleFermer.test` rouge (`history.back` appelé 2 fois) puis vert : un `close` pendant un retour en cours est ignoré (jusqu'au `popstate`, filet de 800 ms). Cause : un double toucher sur « Fermer » (ou « Abandonner », qui ferme par la même route) reculait de deux entrées d'historique, au-delà de l'app. Défaut non visuel : pas de capture | pages/useFullScreenRoute.ts |
| B1-NOTE-5 | déjà corrigé | rejeu `ff0f822e` : `App.tsx` rouvre le wizard avec la recette enregistrée comme base (`seed.recipe`, empreinte `serverBase`) ; `rechargementAssistant.test` : 5 tests verts dont « B1-NOTE-5 … garde l'empreinte de la recette enregistrée » | — |
| TL-11 | déjà corrigé | fiche réelle (`fiche.html`, recette du compagnon, capture ouverte `s13-fiche-companion-1280-clair`) : sections « Eau et sels », « Temps et conduite », « Empâtage » ; recette de démonstration : « Fermentation · 2 phases » (`s13-fiche-demo-390-clair`) | — |
| TL-12 | corrigé en partie | « Nouvelle recette » / « Créer une recette » : un seul libellé dans le menu + (BX-4, 455ccbd2 et 07ce8a1c). Restes : le même atelier s'appelle « Atelier de recette » (`HopRecipePanel`), « Atelier Houblons V5.5 » (`ProductionTab`, `RecipePage`, `Host`) et « atelier Houblons V5.5 » (`BrewWizard` l. 2951, branche v4 inactive) ; noms de malts doublés et séparateurs du dry hop : non retrouvés. Question au brasseur ci-dessous | — |
| TL-19 | non reproduit | Chrome `?dev-local` : brouillon commencé (nom saisi), retour au tableau de bord, « + › Créer une recette » : le wizard s'ouvre **vierge** (`s16-rouvert-1280`, ouverte) ; la reprise du brouillon passe par une entrée distincte et dit « Brouillon repris » (annonce vocale) avec « Abandonner » visible. Aucun correctif | — |
| TL-27 | non reproduit (message), à trancher (sections) | Chrome, fiche réelle, deux recettes (`sonde17`) : « Potentiel aromatique » ne dit plus « Calcul incomplet : durée d'ébullition » (message nommé une fois, 8619459b). Cause du cas vu en ligne non établie : `hopRecipeDesign.ts` passe `recipe.boilMin` sans repli quand l'ébullition manque (la fiche principale, `recipeMetrics.ts`, replie à 60 min). La fiche a 8 à 10 sections repliées (un toucher chacune) | — |

## « À trancher » — une ligne : question · recommandation · nature
| id | question · recommandation · nature |
|---|---|
| TL-12 | Quel nom unique pour l'atelier qui sert la conception d'un houblon (« Atelier de recette », « Atelier Houblons V5.5 ») ? Reco : « Atelier houblons » partout, le « V5.5 » ôté de l'écran (version = détail technique). **Goût** (mot du brasseur), le fichier de l'atelier est interdit à cette voie |
| TL-27 | Une recette sans durée d'ébullition enregistrée : replier à 60 min (comme la fiche) ou le dire « à renseigner » ? Reco : le dire (l'inconnu n'est pas 60) et aligner `hopRecipeDesign` sur la fiche. **Règle** ; et : sept sections repliées sur la fiche : garder (un toucher chacune, DESIGN « Deux régimes ») ? Reco : oui. **Goût** |
| TL-19 | Dire à l'écran « Brouillon repris » (aujourd'hui annonce vocale seulement) ? Reco : non, la reprise est un choix explicite et « Abandonner » est visible. **Goût** |

## Tests de cette passe
Fichiers rejoués, écrits dans `voies/b-assistant/tests-app.txt` (`--reporter=dot`) : `Test Files  11 passed (11)` ; `Tests  31 passed | 1 skipped (32)` (`tests/integration/App*`, `rejeu-ff0f-b`, `fullScreenRouteDoubleFermer`, `bAssistantSept`, `AppEnregistrerRetourFiche`, `dashboardNavigation`, `fix114`, `brewLegacyInstallationApp`). Le test sauté est celui que `AppRoutePile` saute depuis le 02.11 (D323). Suite entière non relancée (le pilote la rejoue).

## Fichiers modifiés de cette passe
`src/App.tsx`, `src/pages/useFullScreenRoute.ts`, `src/ui/YeastRecipeHeading.tsx` ; tests neufs : `tests/unit/{bAssistantSept,fullScreenRouteDoubleFermer}.test.tsx`, `tests/integration/AppEnregistrerRetourFiche.test.tsx`. Banc : `fiche-main.tsx` (option `?fixture=companion`), `sonde16`, `sonde17`.

CONNAISSANCE : une page plein écran (recette, wizard, brassin) se pose sur les onglets (`useFullScreenRoute`) : fermer revient aux onglets, jamais à la page d'où l'on venait ; pour revenir à la fiche, `replaceTop`. Le harnais de `AppRoutePile.test.tsx` (vraie App, `saveRecipeConfirmed` simulé) joue un enregistrement de bout en bout.
LEÇON PROPOSÉE : un double toucher sur un bouton qui déclenche `history.back()` doit être gardé à la source (le crochet), pas au bouton : sept boutons de fermeture, un seul crochet.

---
# 5e PASSE — retouches du verdict final (A-a, A-b) et régression `recipeEditing`
| id | issue | preuve | fichiers |
|---|---|---|---|
| Régression `recipeEditing` « update a saved source snapshot » | corrigé | cause : mon garde de BR-81 ignorait tout ✓ dans les 600 ms après « Modifier », même après un nom corrigé ; il n'ignore plus que le ✓ **sans aucune valeur changée** ; `waterAnalysisDoubleToucher.test` (3) et `recipeEditing` (30) verts | ui/WaterAnalysisTable.tsx |
| A-a | corrigé | étiquette « style 59–79 » et repère « 63,3 EBC › » recalés à 8 px du bord (avant : collés au bord, 0 px). `b-assistant-0911.test` rouge (`'0px'` au lieu de `'8px'`) puis vert. Chrome, mesure : à 390 (clair et cave) droite = 362 px sur un écran de 390 et un cadre de 382 ; à 1280 : 992 px ; aucune étiquette hors écran ni hors cadre. Captures ouvertes `s18-ebc-390-clair`, `s18-ebc-1280-clair` : entières. Je n'ai pas retrouvé la coupure signalée : l'étiquette était entière mais collée au trait du repère, à 0 px du bord | fermentescibles/Reperes.tsx |
| A-b (pluriel) | vérifié et complété | l'en-tête de la section Levure disait « 2 sachet » avant la 4ᵉ passe ; capture ouverte à 390 et 1280 : « SafAle US-05 · 2 sachets » (`s13-fiche-demo-390-clair`, `-1280-clair`). Même défaut trouvé et corrigé au récap : l'en-tête du bloc Levure de `BrewSheet` écrivait `${qty} ${unit}` brut ; test rouge puis vert | ui/YeastRecipeHeading.tsx, ui/BrewSheet.tsx |
| A-b (plage) | corrigé | sans dose saisie, US-05 à 30 L : « SafAle US-05 · **2–3 sachets** » (plage du produit et du volume, `doseDeLaLevure`, jamais son milieu) ; avec une dose saisie : cette dose (« 2 sachets ») ; sans produit connu : « quantité à préciser ». `bAssistantSept.test` : 3 tests rouges puis verts. Captures ouvertes `s13-fiche-plage-390-clair`, `s13-fiche-plage-1280-clair` | ui/YeastRecipeHeading.tsx (`doseConseillee`) |

Tests rejoués (`tests-retouches.txt`, `--reporter=dot`) : `Test Files  37 passed (37)` ; `Tests  424 passed (424)` (`bAssistantSept`, `bAssistantHorsZone`, `fermentescibles`, `fermentables`, `identite`, `integration/etapeLevure`, `rl1-litres-fiche`, `recetteMemeChiffre`, `recipeEditing`). Banc : `fiche-main.tsx` accepte `?fixture=plage` ; `sonde18`.
Limite : `YeastRecipeHeading` importe maintenant `etapeLevure/dose.ts` (lecture seule, fichier u1) et `yeastSupplyBootstrap.json` (26 Ko) : le chunk de la fiche grossit d'autant.
