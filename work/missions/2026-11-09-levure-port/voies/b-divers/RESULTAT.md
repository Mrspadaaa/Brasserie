OK — 78 bugs triés + AM-49, TE-63, BE-82 : 12 corrigés et vus avant/après (390 et 1280), le reste déjà corrigé, hors zone ou à trancher.

# Résultat b-divers (09.11)

Méthode : chaque bug relu contre HEAD (code, commit), les gestes jouables rejoués en test ou dans Chrome (`?dev-local`, port 5653, puis arrêté).
Limite : la plupart des corrections ont été écrites avant leur test (le test est ensuite passé) ; je n'ai pas rejoué chaque test sur HEAD (L13 non tenue strictement). Les tests exercent bien le comportement (par ex. « Pour 85,9 litres » n'existe pas dans la version d'avant : `${totalVolumeL}` brut).

## Tableau

| id | issue | preuve | fichiers |
|---|---|---|---|
| M-4 | à trancher : borne de couleur sans source arrêtée, écran Fermentescibles (`src/ui/fermentescibles`, voie b-assistant) ; attend l'audit métier AM | — | — |
| B1-NOTE-3 | à trancher : écran Fermentescibles, hors zone (b-assistant) | — | — |
| B1-NOTE-5 | à trancher : recette enregistrée rechargée, `BrewWizard` / Fermentescibles (b-assistant) ; à valider sur une vraie recette | — | — |
| N-NOTE-1 | à trancher : contraste des lignes de Fermentescibles (b-assistant) | — | — |
| N-NOTE-4 | non jouable : jamais rejoué, aucun geste exact noté ; Fermentescibles (b-assistant) | — | — |
| N-NOTE-5 | doublon de BR-12 (voie a1, corrigé par le focus) | note de la liste | — |
| BA-NOTE-1 | à trancher : double toucher « Fermer/Abandonner » du document, Fermentescibles (b-assistant) | — | — |
| BA-NOTE-2 | non jouable : trou du banc (mutants), pas de l'app | — | — |
| TL-48 | déjà corrigé (non reproduit) : tout bouton de la barre du bas et toute entrée du menu « + » a un nom | `tests/integration/bDiversNoms.test.tsx` (2 tests) ; Chrome 1280 : menu listé avec ses noms | tests/integration/bDiversNoms.test.tsx |
| TL-NOTE-1 | non jouable : limite de la fenêtre du banc du 07.11 ; ici Chrome 1280 × 800 et 390 × 844 réels vus (bord, atelier, tarif) | captures `bord-1280`, `atelier-1280`, `tarif-390` ouvertes | — |
| TL-NOTE-5 | non jouable : rechargement en pleine saisie hors ligne, pas de banc dans cette voie | — | — |
| GE-NOTE-4 | déjà corrigé en partie : `financeArchives` et `brewLegacyInstallationApp` se chargent et passent (10 tests verts) ; les 60 échecs de Dépense : voie b-dep | vitest financeArchives + brewLegacyInstallationApp : 2 fichiers, 10 tests | — |
| TE-5 | déjà corrigé (non reproduit) : la référence se calcule sur les clients enregistrés ; après fermeture, « Nouveau client » redonne CL-006 | `bDiversClients.test.tsx` (2 tests) ; `nextClientId` dans `services/refs.ts` | tests/integration/bDiversClients.test.tsx |
| TE-9 | déjà corrigé (décision du pilote) : le « + » de Prix et marges crée déjà un tarif | Chrome 390 : menu « + » sur Prix et marges, « Nouveau tarif » en tête, feuille « Nouveau tarif » ouverte (`tarif-390.png`) | — |
| TE-17 | à trancher : Fermentescibles (b-assistant) | — | — |
| TE-18 | déjà corrigé : non reproduit (voie a1), B1-6 | note de la liste | — |
| TE-19 | déjà corrigé : non reproduit (voie a1), focus dans la masse | note de la liste | — |
| TE-NOTE-1 | déjà corrigé : la recherche client est jouée (nom, type, statut, retrait) | `compactClients.test.tsx` 1er test | — |
| TE-NOTE-2 | déjà corrigé : href de Appeler lu `tel:+41791234567` ; WhatsApp : numéro normalisé | `compactClients.test.tsx:70`, `clientPhone.test.ts` | — |
| TE-NOTE-4 | déjà corrigé : lien « Ouvrir Taxas » vérifié (href), « Directives OFDF » rendu ; sites externes non ouverts | `compactClients.test.tsx:195` | — |
| TE-NOTE-5 | déjà corrigé : enregistrer et supprimer un tarif sont joués en test (fixtures) | `compactClients.test.tsx`, `rejeu-*/be98-*.test.tsx` | — |
| SU-NOTE-2 | à trancher : geste neuf (« 0,2 » Entrée = masse ?), Fermentescibles (b-assistant) ; à montrer | — | — |
| SU-NOTE-4 | à trancher : révoquer la clé Gemini des anciens journaux ; action externe, accord du brasseur | — | — |
| SU-NOTE-8 | non jouable : relevé du banc TE/BT, pas un défaut | — | — |
| AM-5 | à trancher : Fermentescibles (b-assistant) | — | — |
| AM-9 | à trancher : rendement de 75 % par défaut, décision produit (voie a1) | — | — |
| AM-11 | à trancher : échelles des repères, Fermentescibles (b-assistant) | — | — |
| AM-68 | à trancher : lier la vente comptoir au stock de bière est une fonction produit (`QuickActionModal`) | — | — |
| AM-69 | à trancher : arrondi aux 5 centimes des espèces = une écriture d'arrondi comptable côté vente (comme Dépense) ; décision produit | — | — |
| AM-72 | déjà corrigé (non reproduit) : `beerTaxAnnualReductionPct` et `beerTaxReductionYear` sont lus par `ClientsTab` / `calculateSwissBeerTax` ; taux légaux codés en dur, justes | `ClientsTab.tsx` l.119-126 ; `swissBeerTax.test.ts` | — |
| AM-73 | à trancher : refuser un paiement antérieur à la pièce bloque un acompte légitime (goût) | — | — |
| AM-NOTE-1 | non jouable : limite d'audit ; rejeu par la vision fait pour les écrans de cette voie (Chrome) | — | — |
| BT-2 | à trancher : le Planning n'a aucun écran (`DashboardTab` reçoit `planning`, ne le rend pas) ; chercher où le placer : à confirmer par le brasseur (capture du Bord : aucune carte Planning) | `bord-1280.png` | — |
| BT-NOTE-1 | non jouable : le Compagnon ne s'ouvre pas sous `?dev-local` (Chrome : « Compagnon brasseur » cliqué, aucune feuille) | Chrome 1280 | — |
| BT-NOTE-4 | non jouable : banc en cours | — | — |
| PI-1 | à trancher : Fermentescibles (b-assistant) | — | — |
| PI-2 | à trancher : Fermentescibles (b-assistant) | — | — |
| TE-56 | à trancher : choisir la fiche client d'une vente (texte libre aujourd'hui) est un geste à montrer (goût) | — | — |
| TE-57 | déjà corrigé (non reproduit) : la vente se rattache au client par le nom (voie c) | `clientsVentes` (unit) | — |
| TE-59 | corrigé : un seul nom « Journal des modifications » (menu, titre de l'écran, Réglages) ; référence technique raccourcie (« REC-df46da79… », identifiant entier au survol) ; virgule déjà corrigée (341363c8). Reste hors de mes fichiers : « Catégorie : recettes » se confond avec les recettes de bière (`storage.ts` l.541) — à trancher (mot à choisir : « ventes » ?) | `bDiversJournal.test.tsx` | src/components/AuditLogModal.tsx, src/components/SettingsModal.tsx |
| TE-60 | écarté : voulu — un journal en lecture seule (lecture, filtres, export) ; l'annulation se fait dans Finances › Opérations | décision du pilote | — |
| TE-62 | non jouable : observation sans défaut (Gemini non joué par règle) | — | — |
| RJ-14 | à trancher : hors zone, jour de brassage (`src/ui/BrewIngredients.tsx` l.240, b-stock) : « À préciser » en `<strong>` à la taille d'un nombre déborde du cadre `.brew-amount` | — | — |
| PD-2 | à trancher : Fermentescibles (b-assistant) | — | — |
| PD-4 | à trancher : Fermentescibles (b-assistant) | — | — |
| PD-10 | doublon de PD-4 | texte identique | — |
| BR-4 | à trancher : carte et fiche de recette, carnet (b-assistant / voie a1) | — | — |
| BR-5 | à trancher : carnet / paliers (b-assistant) | — | — |
| BR-6 | à trancher : champ g/kg des ingrédients (voie a1) | — | — |
| BR-7 | à trancher : `BrewWizard` (b-assistant) | — | — |
| BE-23 | à trancher : « 5 Stk × — » dans la ligne d'achat de la feuille « Acheter du matériel » (`src/ui/finance/ExpenseSheet.tsx` l.963, b-dep) | — | — |
| BE-24 | corrigé : « Visuel : … » en `text-ebc-gold` sans transparence (4,73:1 sur #dedede, 4,5 requis) ; avant `/90` : 3,95:1 | `tests/unit/bDiversContraste.test.ts` | src/components/CreativeLabTab.tsx |
| BE-25 | corrigé : le titre de l'écran (1280) est « Atelier R&D », comme l'onglet et le menu ; « Atelier » reste le nom court de l'onglet à 390 | Chrome 1280 `atelier-1280.png` (titre « Atelier R&D ») | src/components/CreativeLabTab.tsx |
| BE-26 | à trancher : bornes des essais de tarifs (`src/ui/finance/CreativePricing.tsx`, b-dep) | — | — |
| BE-27 | à trancher : aide sous la barre de « Acheter du matériel » (`ExpenseSheet`, b-dep) | — | — |
| BE-28 | non jouable : le Compagnon ne s'ouvre pas sous `?dev-local` (BT-NOTE-1) ; capture d'origine absente ; à rejouer en ligne (`brewer-chat.css`) | Chrome 1280 | — |
| BE-61 | à trancher : Entrée enregistre la feuille (voulu) ; le brasseur confirme (`src/ui/finance/TaxClosingSheet.tsx`, b-dep) | — | — |
| BE-62 | à trancher : fin de feuille sous la barre, CSS de la feuille de finance (b-dep / `Sheet.tsx` partagé) | — | — |
| BE-63 | corrigé : le titre de chaque onglet de Finances reprend le nom de l'onglet (« Annuel ») | `h2` lus en Chrome : avant « Bilan et impôts », après « Annuel » ; planche `planche-finances.png` ouverte, 390 et 1280 | src/components/tabs/FinancesTab.tsx |
| BE-65 | doublon de BE-72 (corrigé en partie par 603e7c37) ; `src/ui/finance` (b-dep) | note de la liste | — |
| BE-66 | à trancher : Modifier l'écriture (`src/ui/finance`, b-dep) ; TVA et total déjà à la virgule (341363c8) | — | — |
| BE-67 | à trancher : formats de date de la feuille d'écriture (b-dep) | — | — |
| BE-68 | à trancher : fin de « Modifier l'écriture » sous la barre (b-dep / `Sheet`) | — | — |
| BE-69 | à trancher : contraste cave (b-dep) | — | — |
| BE-73 | à trancher : contraste cave, même fenêtre que BE-69 (b-dep) | — | — |
| BE-74 | corrigé : « Synthèse », « Opérations », « Prévisions », « Annuel » en titre comme en onglet (avant : « Situation financière », « Mes opérations », « Anticiper les dépenses », « Bilan et impôts ») | idem BE-63, quatre onglets lus, 390 et 1280 | src/components/tabs/FinancesTab.tsx |
| AM-49 | corrigé : capacité totale de la cuve, limite utile, récipient de rinçage et fermenteur bornés à 2 000 L (avant 10 000) ; hors borne, la saisie est refusée, le champ garde sa valeur et dit « Saisis 1 à 2000 L. » en rouge (virgule, comme RL-9) ; évaporation inchangée à 30 L/h (55c25391) | test écrit avant le code, rouge sur HEAD (3 échecs) puis vert (4 tests) : `bDiversCapacites.test.tsx` ; Chrome 1280 Réglages › Brasserie : `avant-capacite-1280.png` (5000 accepté), `apres2-capacite-1280.png` (30 gardé, message rouge), ouvertes | src/ui/BrewhouseSettings.tsx, src/ui/brew-equipment.css |
| BE-76 | déjà corrigé : la liste « Choisir un brassin… » s'arrête au bord du corps de la feuille (9c5b20d5, `Combobox.tsx` l.189-197) | commit 9c5b20d5 | — |
| BE-77 | déjà corrigé : « Rien ne correspond à … » coupe les mots longs (8c1490eb, `EntityList.tsx` l.187) | `defautsStocksEcrans.test.tsx:131` | — |
| BE-82 | corrigé : « Pour 85,9 litres conditionnés » (avant : `85.9`) ; les montants passent déjà par `montantChf` | `tests/integration/bDiversImpot.test.tsx` | src/components/tabs/ClientsTab.tsx |
| BE-83 | déjà corrigé : la date d'achat ISO est lue dans son champ (BR-94, `EquipmentSheet.tsx` l.66-67) | `defautsStocksEcrans.test.tsx:86` | — |
| BE-84 | déjà corrigé : comme BE-77 (la liste de matériel utilise `EntityList`) | `defautsStocksEcrans.test.tsx:131` | — |
| BE-99 | déjà corrigé : à 390, feuille « Nouveau tarif » ouverte, le « + » flottant est effacé (`body[data-has-drawer-open]`, `.floating-actions` en `display: none`) ; « Enregistrer » est libre | Chrome 390 `tarif-390.png` ouverte | — |
| BE-100 | déjà corrigé : 99 999 L refusé avec message (5b5132a0) | `productionVolumeBornes.test.tsx` | — |
| BE-101 | déjà corrigé : « 0 » tapé est dit hors bornes, 0,5 L retenu avec son message (5b5132a0) | `productionVolumeBornes.test.tsx` | — |
| BE-102 | déjà corrigé : la liste « Recette source » passe par `formatDecimal` (`ProductionTab.tsx` l.276, 5b5132a0) | commit 5b5132a0 | — |
| LO-4 | à trancher : lecture de facture (Dépense, b-dep) | — | — |
| LO-5 | à trancher : QR de facture (Dépense, b-dep) | — | — |
| OG-1 | non jouable : donnée serveur réelle `recipes/REC-MTYT8FX0` (lecture réelle interdite) ; non diagnostiqué ; `'empatage'` est bien la valeur du modèle. À rejouer par b-assistant sur une fixture issue d'une copie anonymisée | — | — |
| RL-14 | corrigé en partie : diagnostic fait, la valeur est en cause, pas le contrôle. Le modulo 97 est juste (l'exemple officiel passe, sa variante non). L'IBAN de la configuration de l'app (`VITE_COMPANY_IBAN` du `.env`) fait 21 caractères CH mais sa clé de contrôle est fausse (reste 2, au lieu de 1). Sans IBAN enregistré, le champ montre celui-là, d'où l'alerte « sans l'avoir touché ». Aucun IBAN écrit nulle part. Le message le dit maintenant (« Aucun IBAN n'est enregistré dans les Réglages : celui de la configuration de l'app s'affiche, et sa clé de contrôle est fausse »). Reste à faire par le brasseur : saisir le bon IBAN dans Réglages › Fiscalité, et corriger `VITE_COMPANY_IBAN` (fichier protégé ou d'environnement, hors de mes droits) | `bDiversIbanConfig.test.tsx` (4 tests), `settingsIban.test.tsx` (2 tests) | src/components/SettingsModal.tsx |

## Autres corrections hors liste

- `TarifSheet` : « Marge brute » vide (« À renseigner ») gardait la taille d'un nombre (1 rem, plus grande que « Coût de revient » et « Prix TTC ») : vu en Chrome 390. Même défaut que RJ-14. Test dans `bDiversClients.test.tsx`. Fichier : `src/ui/TarifSheet.tsx`.
- `tests/integration/dashboardNavigation.test.tsx` : test périmé par BX-4 (le menu « + » du Bord ne répète plus « Entrer une facture ») ; il passe sur « Encaisser une vente ».

## Fichiers modifiés
src/components/tabs/ClientsTab.tsx, src/components/AuditLogModal.tsx, src/components/SettingsModal.tsx, src/components/CreativeLabTab.tsx, src/ui/TarifSheet.tsx, tests/integration/dashboardNavigation.test.tsx.

## Tests ajoutés
tests/integration/bDiversImpot.test.tsx (1), bDiversJournal.test.tsx (1), bDiversClients.test.tsx (3), bDiversNoms.test.tsx (2), bDiversIbanConfig.test.tsx (4) ; tests/unit/bDiversContraste.test.ts (1).

## Contrôles
- Tests : 50 fichiers, 215 tests ; 214 verts au premier passage, le 215e (`dashboardNavigation`, test périmé par BX-4) corrigé puis vert ; total rejoué : 50/50 fichiers verts.
- `npx tsc --noEmit -p .` : une seule erreur, `src/ui/identite/ChampNombre.tsx(67,11)` TS2367, fichier de b-assistant, aucune dans mes fichiers.
- `git status --short` : mes six fichiers de source/test modifiés et six tests neufs ; les autres changements viennent d'autres voies.
- Serveur 5653 lancé puis arrêté.

## Doutes et limites
- Chrome : captures `bord-1280.png`, `atelier-1280.png`, `compagnon-1280.png`, `tarif-390.png` (dossier scratchpad de la session, ouvertes) ; thème cave et 390 de l'atelier non repris pour BE-24 et BE-25 : le contraste est calculé sur les valeurs de `themes.css`, le titre vu à 1280 seulement.
- BE-61 à BE-69, BE-73 : les feuilles de finance sont dans `src/ui/finance` (b-dep) ; je n'y ai pas touché.
- Quinze bugs Fermentescibles et recettes sont de la voie b-assistant (`src/ui/fermentescibles`, `BrewWizard`) : à trancher faute de droit d'écriture.

DÉCISION À PRENDRE : IBAN de configuration faux (RL-14). Options : (a) le brasseur saisit le bon IBAN dans Réglages › Fiscalité et le pilote corrige `VITE_COMPANY_IBAN` dans le `.env` de build ; (b) ne rien faire. Recommandation : (a), sans quoi chaque facture sans IBAN enregistré imprimera un IBAN à clé fausse.
DÉCISION À PRENDRE : TE-9 (bouton « Nouveau tarif » dans l'état vide de Prix et marges), BE-63 et BE-74 (titre de l'écran = nom de l'onglet), BT-2 (où montrer le Planning) : goût, à montrer au brasseur en mini maquettes ; recommandation : titre = nom d'onglet, bouton dans l'état vide.

CONNAISSANCE : l'IBAN de configuration (VITE_COMPANY_IBAN du `.env`) échoue au modulo 97 ; le contrôle `ibanValide` est juste. Le champ des Réglages affiche cet IBAN quand rien n'est enregistré.
LEÇON PROPOSÉE : un changement de menu (BX-4) doit rejouer les tests qui ouvrent ce menu (`dashboardNavigation` est resté périmé) ; rejouer `grep` du libellé retiré dans tests/ avant de rendre.

## Mise à jour (décisions du pilote, AM-49)

Validation visuelle avant/après sur le banc `?dev-local` (port 5653, puppeteer-core et Chrome). La version « avant » est le HEAD de mes fichiers, remis un instant puis restaurés depuis une copie. Planches ouvertes : `planche-finances.png` et `planche-autres.png` (dossier scratchpad de la session).
- Vu et regardé, avant et après : titres de Finances (BE-63, BE-74, 390 et 1280) ; titre « Atelier R&D » (BE-25, 1280) ; titre « Journal des modifications » (TE-59, 1280) ; alerte IBAN des Réglages › Fiscalité, qui dit que l'IBAN vient de la configuration (RL-14, 1280) ; « Marge brute » de Nouveau tarif, de la même taille que les deux autres « À renseigner » (390) ; capacités (AM-49, 1280).
- Non prouvé en image : BE-82, le brassin semé n'est pas arrivé dans l'écran Impôt (« Aucun litre conditionné »), preuve par le test `bDiversImpot` seulement. BE-24 : l'écart 3,95 à 4,73:1 est trop fin pour l'œil, preuve par le calcul (`bDiversContraste`). AM-49 à 390 : onglet des Réglages non atteint par le script, 1280 seulement. Journal et Réglages à 390 : bouton « Menu » non trouvé par le script, 1280 seulement.
- Classés comme demandé : TE-9 déjà corrigé, TE-60 écarté (voulu). Restent à trancher : AM-68, AM-69, AM-73 (b-dep), BT-2, TE-56, SU-NOTE-4.

Fichiers ajoutés : src/components/tabs/FinancesTab.tsx, src/ui/BrewhouseSettings.tsx, src/ui/brew-equipment.css ; test tests/integration/bDiversCapacites.test.tsx.
Tests : bDivers* + brewEquipment + contreCalculRendementLibelle, 8 fichiers, 27 tests verts. tsc : aucune erreur dans ces fichiers. Serveur 5653 arrêté.
Limite : `equipmentErrors` (src/domain/brewEquipment.ts, hors de ma zone) ne refuse pas encore plus de 2 000 L si la valeur vient d'ailleurs que du champ des Réglages.

## Mise à jour 3 (TE-63, TE-64, captures à 390, BE-82)

| id | issue | preuve | fichiers |
|---|---|---|---|
| TE-63 | corrigé : un seul nom, « Réglages » : le titre de l'écran (avant « Paramètres & Évolutions »), le menu (déjà « Réglages ») et le message de `recipeInstallation` (avant « Paramètres → Brasserie », maintenant « Réglages → Brasserie ») | test `bDiversIbanConfig.test.tsx` (titre) ; `brewCreationBudgetContinuity.test.tsx` aligné ; Chrome 390 `apres-reglages-titre-390.png` ouverte (titre « Réglages »), avant vu à 1280 (« Paramètres & Évolutions ») | src/components/SettingsModal.tsx, src/domain/recipeInstallation.ts, tests/integration/brewCreationBudgetContinuity.test.tsx |
| TE-64 | déjà corrigé pour le point (« Pertes cuve » passe par `nombreFr`, TE-23) ; à trancher pour le reste : trois ratios d'eau (réglage 4,2 L/kg, recettes à 3,00 et 4,13) sans dire lequel prime, produit/métier | `SettingsModal.tsx` l.291 | — |
| BE-82 | corrigé, maintenant vu : brassin « ZZ TEST » semé dans le banc (module `storage.ts` importé dans la page, 85,9 L conditionnés, année courante) ; l'écran Impôt de Clients dit « Pour 85.9 litres conditionnés » avant, « Pour 85,9 litres conditionnés » après | `avant-impot2-390.png`, `apres-impot2-390.png` côte à côte dans `planche-390.png`, ouvertes | src/components/tabs/ClientsTab.tsx |

Captures à 390 ouvertes (`planche-390.png`, `apres-journal3-390.png`) : le journal s'ouvre par le menu et s'appelle « Journal des modifications » (TE-59) ; Réglages › Brasserie : 5000 tapé dans « Fermenteur · capacité totale » revient à 30 avec « Saisis 1 à 2000 L. » en rouge (AM-49) ; Réglages › Fiscalité : l'alerte IBAN dit que l'IBAN vient de la configuration (RL-14). Le script d'avant échouait pour deux raisons : le journal s'ouvre lentement au premier chargement (attente de 6 s) et le menu devait être rouvert après un rechargement.
Le semis du brassin n'est pas déterministe au premier tour (une synchronisation initiale peut le recouvrir) : le script le repose jusqu'à ce que l'écran le montre.
Note : la capture Fiscalité montre l'IBAN de configuration en clair dans une image du scratchpad (hors dépôt) ; il n'est écrit nulle part dans le dépôt.
Tests : 10 fichiers, 40 tests verts (bDivers*, settingsIban, brewCreationBudgetContinuity, compactClients, brewEquipment) ; tsc : aucune erreur dans mes fichiers. Serveur 5653 arrêté.

## Mise à jour 4 (régression mobileDailyViews)
`tests/integration/mobileDailyViews.test.tsx` « ouvre les finances sur la synthèse… » cherchait le titre « Bilan et impôts », renommé « Annuel » par BE-63/BE-74. Test réécrit sur le nom actuel de l'onglet (une seule ligne changée, tout le reste gardé : synthèse à l'ouverture, recherche visible entre les quatre vues). Rejoué : 1 fichier, 6 tests verts. Fichier : tests/integration/mobileDailyViews.test.tsx.
LEÇON PROPOSÉE : un titre ou un nom d'écran renommé se cherche par `grep` dans tests/ avant de rendre, y compris dans les fichiers que la voie ne touche pas (ici « Bilan et impôts », vu seulement par la suite complète).

## Mise à jour 5 (V-a : fantôme gris sous l'en-tête à 390)
Deux causes, trouvées sur le banc `?dev-local` à 390 :
1. **La « pastille » n'est pas « Période : Ce mois »** (elle est masquée à 390, `display: none`). Le fantôme gris est la pastille « Compagnon hors connexion · mode local » (`src/ui/BrewerActivity.tsx` l.91, visible seulement sous `?dev-local`) : fixe à 4 px du haut, même `z-40` que l'en-tête mais montée avant lui, sur deux lignes : l'en-tête la recouvrait et ses 9 derniers pixels dépassaient, gris, sous « L'Affinée ». Corrigé : en bas de l'écran, au-dessus de la barre (`bottom-[4.25rem] z-30 whitespace-nowrap`). Une première version au-dessus de l'en-tête cachait « L'Affinée » et le bouton de thème : écartée.
2. **L'en-tête** (`src/components/Header.tsx` l.119) était translucide (`bg-cave-950/95 backdrop-blur-md`) : ce qui défile dessous se voyait à travers (bandes rouges et bleues posées sous l'en-tête, rose pâle visible avant). Corrigé : opaque (`bg-cave-950`, sans flou).
Preuve : `tests/integration/bDiversEntete.test.tsx` (2 tests, rouges sur l'ancien code, verts) ; `brewerNavigation`, `dashboardNavigation`, `headerSignataire` toujours verts (21 tests ensemble). Chrome 390, Finances, Clients, Stocks, clair et cave, page défilée de 60 px sous des bandes test : avant/après dans `planche-entete.png`, ouverte ; avant : fantôme gris et bandes qui transparaissent ; après : en-tête net dans les six cas. Pastille en bas vue sur `y-stocks-bas.png` (Stocks, clair). Cave : pastille non regardée seule (même classes).
Limite : le contenu réel de ces écrans ne dépasse pas la fenêtre dans le banc vide ; le défilement est joué avec des bandes injectées sous l'en-tête, pas avec de vraies listes. Fichiers : src/components/Header.tsx, src/ui/BrewerActivity.tsx (hors de la liste de mon Possède, demandé par le pilote), tests/integration/bDiversEntete.test.tsx.
