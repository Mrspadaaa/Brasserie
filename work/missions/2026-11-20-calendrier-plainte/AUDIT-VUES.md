# Audit des vues montées : ses écrans choisis contre le code en ligne (20.11)

Lecture seule, sans changement de code. Source : `port-carnet` à HEAD `05515148c` (extrait par `git archive`, l'arbre de travail de
`port-carnet` porte des modifications non commitées sur CalendrierTab, StocksTab, calendrier.ts… : elles ne sont pas lues ici).
Drapeaux lus : `VITE_HOP_V4=on` (défaut du build, `vite.config.ts:65`) ; `VITE_CARNET_IA=production` (ne change que le mode IA de
`CarnetsVue`, `src/config/carnetIA.ts:17-28`, pas le composant monté ; `VITE_CARNET_AIDES` absent : aides éteintes).
Tous les chemins ci-dessous sont dans `src/` de `port-carnet`.

Ses choix (statut « choisi » de `ecrans.json`, chantiers de `maquettes.json`) :

| Choix | Composant porté |
|---|---|
| Carnet (ra+p5f, `ecrans_choisis`) | `ui/carnets/CarnetsVue.tsx` |
| Calendrier (gi2 · choisi-a · r2-c, en-tête r6b) | `components/tabs/CalendrierTab.tsx` + `ui/calendrier/entete/EnTete.tsx`, `frise/Frise.tsx`, `frise/VueListe.tsx` |
| Un calendrier par section (fb-fin, Brassins, Matériel, Stocks, Agenda) | `CalendrierTab` avec sa prop `section` (`CalendrierTab.tsx:77`) |
| Étape Houblons (base v4.10) | `ui/hopIndex/maBiere/EtapeHoublons.tsx` |
| Ma bière, Suggérer, Comparer, Dryhopper, Substituer, Fiche, Recherche avancée | `ui/hopIndex/{biere,suggerer,comparer,dryhopper,substituer,fiche,rechercheAvancee}/EcranApp.tsx`, via `HopToolLayer.tsx` |
| Ma levure (r3 v05, r4 v02) | `ui/etapeLevure/EtapeLevure.tsx` |
| Menu Plus (d3p2), en-tête (m3), + dynamique (b1), recherche (r3p2) | `components/plus/PagePlus.tsx`, `components/Header.tsx`, `ui/FloatingActions.tsx`, `ui/CommandPalette.tsx` |

## 1. ANCIENNE VUE — du plus visible au moins visible

Tout le premier groupe a une seule cause : `CreativeLabTab` (`components/CreativeLabTab.tsx`), l'ancien « Atelier R&D », est encore monté
à `ProductionTab.tsx:232` et six autres chemins y mènent. Son onglet « Carnet » monte `NoteCarnet` (`CreativeLabTab.tsx:288`), pas `CarnetsVue`.
`CarnetsVue` n'a qu'un seul point de montage : `StocksTab.tsx:776`. L'ancien Atelier garde même sa propre IA de rangement
(`modeRangerNote`, `VITE_RANGER_NOTE_IA=production` par défaut au build, `vite.config.ts:71`).

| # | Écran choisi | Composant porté | Entrée | Monte vraiment | Verdict |
|---|---|---|---|---|---|
| 1 | Carnet | `CarnetsVue` | Brassins › segment « Atelier » (`ProductionTab.tsx:209`), onglet « Carnet » | `CreativeLabTab` › `NoteCarnet` (`ProductionTab.tsx:232` ; `CreativeLabTab.tsx:280,288`) | ANCIENNE VUE |
| 2 | Carnet | `CarnetsVue` | Menu Plus › « Atelier R&D » (`PagePlus.tsx:131` → `App.tsx:1217` → `navigateToCreativeLab`, `App.tsx:591-594`) | idem n° 1 | ANCIENNE VUE |
| 3 | Carnet / Agenda | `CarnetsVue` ; calendrier de la section Agenda | Bord › carte Agenda › « Gérer › » et « Voir tout l'agenda › » (`DashboardTab.tsx:355,379` → `App.tsx:1251-1253`) | `CreativeLabTab` filtre « À faire » = `TodoTimeline` (`CreativeLabTab.tsx:289`) | ANCIENNE VUE |
| 4 | Calendrier | `CalendrierTab` | Calendrier › « Plus de détails › » d'une fête (`CalendrierTab.tsx:715` → `App.tsx:1311-1314`) | `CreativeLabTab` › À faire, formulaire d'ajout | ANCIENNE VUE |
| 5 | Calendrier / Carnet | `CalendrierTab` ; `CarnetsVue` | Calendrier › toucher un événement « agenda » ou une idée qui n'est pas un carnet (`calendrier.ts:850,861,881` → `CalendrierTab.tsx:348` → `App.tsx:1324-1327`) | `CreativeLabTab` › À faire | ANCIENNE VUE |
| 6 | Carnet | `CarnetsVue` | ⌘K / recherche › « Atelier R&D » (`recherche/modele.ts:96,111` → `App.tsx:922`) | `CreativeLabTab` (via `setProductionSubTab('lab')`) | ANCIENNE VUE |
| 7 | Carnet | `CarnetsVue` | Bouton + sur Brassins › Atelier, « Nouvelle idée » (`fabActions.ts:87` → `App.tsx:758-763`) ; geste `runPlus('idee')` (`App.tsx:733`, défini ; non vu dans un menu d'écran) | `CreativeLabTab`, formulaire ou focus de l'ancien carnet (`CreativeLabTab.tsx:131`) | ANCIENNE VUE |
| 8 | Carnet (« À venir », figé h05-9) | `UpgradeWorkspace vue=` dans Stocks › Matériel | Brassins › Atelier › onglet « Matériel » | `UpgradeWorkspace` complet, sans `vue` (`CreativeLabTab.tsx:282`), parallèle à `StocksTab.tsx:768` | ANCIENNE VUE |

Résultat net : 8 entrées sur le même composant ancien. Aucune ne monte `CarnetsVue`.

## 2. Vues parallèles à trancher (pas un doublon exact d'une maquette choisie ; je ne les compte pas dans les 8)

| # | Écran choisi | Entrée | Monte | Remarque |
|---|---|---|---|---|
| 9 | Ma bière (analyse) | Fiche de recette › « Potentiel aromatique » (`RecipePage.tsx:454`) ; brassin du jour › Aide Houblons (`BrewDayPage.tsx:1785`) | `HopRecipePanel` (`HopRecipeWorkbench` + `HopRecipeSimulationPanel`), lecture seule | Aucune entrée de la fiche de recette n'ouvre Ma bière (`ouvrirCouche` n'y est jamais appelé). À trancher : le choix couvre-t-il aussi la fiche d'une recette finie ? |
| 10 | Fiche (g1) | Stocks › Houblons › ouvrir une variété (`StocksTab.tsx:569`) | `HopIndexPanel` (éditeur de catalogue, `DescriptionFiche`), pas `FicheDeLApp` | `FicheDeLApp` n'est monté que dans les outils houblons. |
| 11 | À venir (Carnet figé h05-9) | Finances › Prévisions › « Mes projets de matériel » (`finance/previsions/Previsions.tsx:221`) | `UpgradeWorkspace` complet dans une feuille | Même composant que le n° 8, en feuille. |
| 12 | Tarifs (hors choix enregistré) | Brassins › Atelier › onglet « Tarifs » (`CreativeLabTab.tsx:286`) | `TarifsFrise` + `IdeesPrix` | Même foyer que le n° 1 ; Clients › Prix existe à part. |
| 13 | Ma levure | Étape Levure en mode NOLO (`BrewWizard.tsx:3136,3165`) | `YeastRecipeChoice` (ancienne étape), sans `EtapeLevure` | Voulu par le code (« le mode NOLO la garde »). `maquettes.json` dit aussi que le bas de l'étape (huit volets) reste « à refaire ». |

## 3. Choix non porté (manque, pas une ancienne vue)

- Un calendrier par section : `CalendrierTab.tsx:77` déclare `section`, mais `App.tsx:1283-1331` ne la passe jamais, et le commentaire de
  `CalendrierTab.tsx:76` le dit (« Aucun n'est branché dans ce port »). Finances, Brassins, Matériel, Stocks et Agenda n'ont donc que
  l'onglet Calendrier général ; l'Agenda du Bord renvoie à l'ancien Atelier (n° 3 à 5) au lieu de son calendrier.
- Le brasseur voit « pas la bonne version » au Calendrier : l'onglet lui-même est la bonne version (n° 14 ci-dessous), mais ses renvois
  (fête, événement, idée) l'envoient dans l'ancien Atelier (n° 4 et 5), ce qui donne l'impression d'une autre version.
  Je n'ai pas comparé le rendu à gi2/r2-c : seulement les composants montés.

## 4. OK — chaque écran choisi, toutes ses entrées

| Écran choisi | Composant porté | Entrée | Composant monté | Verdict |
|---|---|---|---|---|
| Calendrier | `CalendrierTab` | Barre du bas « Calendrier » (`BottomNav.tsx:46` → `App.tsx:1283-1284`) | `CalendrierTab` : `EnTeteCalendrier` (`:848`), `VueListe` (`:899`), `Frise` (`:920`) | OK (n° 14) |
| Calendrier | `CalendrierTab` | Bord › « Cette semaine au calendrier » (`DashboardTab.tsx:358`) ; ⌘K › Calendrier (`App.tsx:919`) ; retour de Finances (`App.tsx:1262`) | idem | OK |
| Carnet | `CarnetsVue` | Stocks › Matériel › « Carnets » (`StocksTab.tsx:774-777`) | `CarnetsVue` | OK |
| Carnet | `CarnetsVue` | Stocks › Matériel › À venir › « Ouvrir le carnet » (`StocksTab.tsx:770`) | `CarnetsVue`, ce carnet ouvert | OK |
| Carnet | `CarnetsVue` | Calendrier › idée de type carnet (`calendrier.ts:881` → `CalendrierTab.tsx:347` → `ouvrirCarnet`, `App.tsx:278-283` → `StocksTab.tsx:290-296`) | `CarnetsVue` | OK |
| Carnet | `CarnetsVue` | Événement `affinee:ouvrir-carnet` (Atelier, Prévisions ; `App.tsx:284-293`) | `CarnetsVue` | OK |
| Carnet | `CarnetsVue` | Bouton + sur Stocks › Carnets (`App.tsx:697`, `ACTION_CARNETS` `plusEcran.ts:199`) | focus du champ de `CarnetsVue` | OK |
| Étape Houblons | `EtapeHoublons` | Assistant de recette, étape 3 (`BrewWizard.tsx:2801-2803`, drapeau `:165`) | `EtapeHoublonsV4` | OK (l'ancien atelier `:2806` est mort : drapeau allumé) |
| Ma bière, Suggérer, Comparer, Dryhopper, Substituer, Recherche avancée | `*/EcranApp.tsx` | Gestes de l'étape (`EtapeHoublons.tsx:52-56,127`), de Comparer, Suggérer, Dryhopper, Fiche (`ouvrirCouche`), « Ajouter » (`Ajouter.tsx:135`) → `App.tsx:1535` | `HopToolLayer.tsx:46-98` : l'écran choisi quand `hopV4Enabled()` | OK |
| Fiche (g1) | `FicheDeLApp` | Depuis les outils (`EtapeHoublons.tsx:19`, `comparer/EcranApp.tsx:13`, `suggerer`, `dryhopper`, `rechercheAvancee`) | `FicheDeLApp` | OK |
| Ma levure | `EtapeLevure` | Assistant de recette, étape Levure hors NOLO (`BrewWizard.tsx:3180`) | `EtapeLevure` | OK (hors n° 13) |
| Menu Plus, en-tête, + dynamique, recherche | `PagePlus`, `Header`, `FloatingActions`, `CommandPalette` | `App.tsx:1198`, `:1181`, `:1420`, `:1485` | une seule implémentation montée | OK |
| Atelier houblons V5.5 | `HopV55Host` | route `hopV55` (`App.tsx:1531`) | plus aucune entrée du code ne l'ouvre (`grep "view: 'hopV55'"` : seulement le type et le rendu) | OK, inatteignable |

## 5. Limites

- Lecture du code à HEAD, rien exécuté en ligne ; les renvois des n° 4 à 7 se lisent dans le code mais n'ont pas été joués dans Chrome.
- Le n° 7 : `runPlus('idee')` existe, mais je n'ai pas relevé quel menu le propose ; le bouton + de Brassins › Atelier, lui, est sûr
  (`fabActions.ts:87`).
- Les tests de `port-carnet` (`tests/`) n'ont pas été lus : certains peuvent garder en vert le montage de `CreativeLabTab`.
