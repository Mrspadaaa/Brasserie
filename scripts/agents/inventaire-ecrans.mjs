#!/usr/bin/env node
// Inventaire des écrans de L'Affinée (mission 2026-10-31-systeme-ecrans, voie e2).
//
// Pourquoi : après houblons, on refait tous les écrans un à un. Le registre de ses choix
// (work/refonte-frontend/v4/choix/ecrans.json) n'en compte que 8, tous de houblons, et il ne reçoit que SES choix
// (règle n° 1, D123). L'inventaire vit donc à part : c'est la liste de ce qui existe, pas de ce qu'il a choisi.
//
// Ce qui vient du code, recalculé à chaque passage : les vues de App.tsx, les routes, les étapes de l'assistant, les écrans
// rapides ; la taille des fichiers ; les tests qui importent le fichier ; les données lues ; les états visibles (par motifs
// dans le source). Ce qui est déclaré ici, à la main : le nom français, l'accès, le lien avec houblons, l'usage, le risque.
// Une déclaration qui ne correspond plus au code fait échouer --verifier (jeton disparu, ancre introuvable, fichier absent).
//
// Usage :
//   node scripts/agents/inventaire-ecrans.mjs              écrit le JSON et le tableau du MD
//   node scripts/agents/inventaire-ecrans.mjs --verifier   INVENTAIRE OK ou INVENTAIRE ECHEC (code 1)
//   node scripts/agents/inventaire-ecrans.mjs --stdout     imprime le JSON sans rien écrire
//
// Sorties : work/refonte-frontend/inventaire-ecrans.json
//           work/refonte-frontend/INVENTAIRE-ECRANS.md (seul le bloc entre <!-- TABLEAU --> et <!-- /TABLEAU --> est réécrit)
//           work/missions/2026-10-31-ecran-identite/inventaire-identite.md (fiche de l'écran Identité, entièrement générée)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SORTIE_JSON = 'work/refonte-frontend/inventaire-ecrans.json';
const SORTIE_MD = 'work/refonte-frontend/INVENTAIRE-ECRANS.md';
const SORTIE_IDENTITE = 'work/missions/2026-10-31-ecran-identite/inventaire-identite.md';
const APP = 'src/App.tsx';
const ROUTES = 'src/pages/useFullScreenRoute.ts';
const WIZARD = 'src/pages/BrewWizard.tsx';
const RAPIDE = 'src/components/QuickActionModal.tsx';

const lire = rel => fs.readFileSync(path.join(RACINE, rel), 'utf8');
const existe = rel => fs.existsSync(path.join(RACINE, rel));
const compterLignes = txt => (txt.length === 0 ? 0 : txt.split('\n').length - (txt.endsWith('\n') ? 1 : 0));
const echapper = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, m => '\\' + m);
const unique = liste => [...new Set(liste)];

// ---------------------------------------------------------------------------------------------------------------------
// 1. Les jetons que le code de l'app impose (extraits de App.tsx, des routes, de l'assistant, des écrans rapides)
// ---------------------------------------------------------------------------------------------------------------------

const COMPOSANTS_APP = ['LoginPage', 'CommandPalette', 'FloatingActions', 'BottomNav', 'Header', 'BrewerActivity', 'PersistenceStatus', 'FinancialLedgerLoading'];
const ETATS_APP = [
  ['etat:session', /isAuthLoading\)\s*\{/],
  ['etat:synchronisation', /!isDataReady\)\s*\{/],
  ['etat:erreur-ecriture', /writeError && view\.view/],
  ['etat:toast', /toastMessage && \(/]
];

function jetonsDuCode() {
  const jetons = new Map(); // jeton -> d'où il vient
  const app = lire(APP);
  for (const m of app.matchAll(/activeTab === '(\w+)'/g)) jetons.set('onglet:' + m[1], APP);
  for (const m of app.matchAll(/const (\w+) = lazy\(/g)) jetons.set('lazy:' + m[1], APP);
  for (const nom of COMPOSANTS_APP) if (new RegExp('<' + nom + '\\b').test(app)) jetons.set('compo:' + nom, APP);
  for (const [jeton, motif] of ETATS_APP) if (motif.test(app)) jetons.set(jeton, APP);
  const routes = lire(ROUTES);
  const typeRoute = routes.slice(routes.indexOf('export type Route ='), routes.indexOf('export type RouteView'));
  for (const m of typeRoute.matchAll(/view: '(\w+)'/g)) jetons.set('vue:' + m[1], ROUTES);
  const wizard = lire(WIZARD);
  const etapes = wizard.slice(wizard.indexOf('const STEPS:'), wizard.indexOf('export interface WizardSeed'));
  for (const m of etapes.matchAll(/id: '(\w+)'/g)) jetons.set('etape:' + m[1], WIZARD);
  const rapide = lire(RAPIDE);
  const typeRapide = rapide.match(/type ModalScreen = ([^;]+);/);
  if (typeRapide) for (const m of typeRapide[1].matchAll(/'([\w-]+)'/g)) jetons.set('rapide:' + m[1], RAPIDE);
  return jetons;
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. Les écrans : ce qu'on déclare à la main
// ---------------------------------------------------------------------------------------------------------------------
// ecran(id, nom, famille, acces, racine, options)
//   jetons    : les jetons du code que cet écran porte (voir jetonsDuCode)
//   fichiers  : composants et feuilles de style propres à l'écran (comptés en lignes, lus pour les données et les états)
//   zone      : [début, fin] — portion de la racine qui est cet écran (une ancre introuvable fait échouer --verifier)
//   variante  : distingue deux écrans qui partagent racine et zone (Brassins / Recettes)
//   marqueurs : textes que les tests contiennent quand ils couvrent cet écran (pour les écrans sans fichier propre)
//   houblons  : [statut, note] — 'refait' | 'en partie' | 'pas du tout'
//   usage     : [1 à 5, raison] — 5 = ce que le brasseur utilise le plus (PRODUCT.md : deux scènes, cuverie et bureau)
//   risque    : [niveau, raison] — risque sur les données si on refait l'écran
//   depend    : ids des écrans qu'il faut connaître avant

const ECRANS = [];
function ecran(id, nom, famille, acces, racine, o = {}) {
  ECRANS.push({ id, nom, famille, acces, racine, fichiers: [], jetons: [], marqueurs: [], depend: [], ...o });
}
const NON = ['pas du tout', ''];

// --- Session et états transverses de l'app (App.tsx) -----------------------------------------------------------------
ecran('chargement-session', 'Vérification de la session', 'session', 'Au lancement, tant que Google n\'a pas répondu (1 s au plus)', APP,
  { jetons: ['etat:session'], zone: ['if (isAuthLoading) {', 'if (!currentUser) {'], houblons: NON, usage: [2, 'quelques centaines de ms à chaque ouverture'], risque: ['faible', 'aucune donnée'] });
ecran('connexion', 'Connexion Google', 'session', 'Au lancement, sans session (le compte dev-local ne passe pas par là)', 'src/components/LoginPage.tsx',
  { jetons: ['compo:LoginPage'], houblons: NON, usage: [1, 'une fois par appareil'], risque: ['moyen', 'authentification : ne pas casser l\'accès Firebase'] });
ecran('synchronisation', 'Synchronisation des données de la brasserie', 'session', 'Après la connexion, tant que Firestore n\'a pas rendu son premier instantané', APP,
  { jetons: ['etat:synchronisation', 'compo:FinancialLedgerLoading'], zone: ['if (!isDataReady) {', 'La page de base. Couverte par une couche'], fichiers: ['src/ui/FinancialLedgerLoading.tsx'],
    houblons: NON, usage: [2, 'à chaque ouverture, instantané grâce au cache IndexedDB'], risque: ['moyen', 'porte le bouton « Réessayer la synchronisation » et l\'erreur d\'écriture'] });
ecran('bandeau-erreur-ecriture', 'Bandeau « erreur de sauvegarde »', 'transverse', 'Apparaît seul quand une écriture échoue (quota navigateur, Firestore)', APP,
  { jetons: ['etat:erreur-ecriture'], zone: ['{writeError && view.view', '{/* Toast notification */}'], houblons: NON, usage: [3, 'rare, mais critique : perdre une écriture comptable sans le savoir est inacceptable'], risque: ['moyen', 'seul garde-fou visible des échecs d\'écriture'] });
ecran('notification-toast', 'Message de confirmation (toast)', 'transverse', 'Après une action : recette enregistrée, brassin en fermentation…', APP,
  { jetons: ['etat:toast'], zone: ['{/* Toast notification */}', '{/* Main App Header'], houblons: NON, usage: [4, 'à chaque enregistrement'], risque: ['faible', 'aucune donnée'] });

// --- Coque : en-tête, navigation, bouton d'action, compagnon, recherche -----------------------------------------------
ecran('en-tete', 'En-tête de l\'app (menu, période, recherche)', 'transverse', 'Haut de chaque onglet : logo, période globale, recherche, menu (assistant, labo, journal, cloud, réglages, déconnexion)', 'src/components/Header.tsx',
  { jetons: ['compo:Header', 'vue:tabs'], houblons: NON, usage: [5, 'toujours à l\'écran sur les onglets'], risque: ['faible', 'navigation seulement ; le filtre de période pilote tous les onglets'], depend: [] });
ecran('barre-navigation', 'Barre du bas : Bord · Finances · Brassins · Stocks · Clients', 'transverse', 'Bas de chaque onglet', 'src/components/BottomNav.tsx',
  { jetons: ['compo:BottomNav'], houblons: NON, usage: [5, 'toujours à l\'écran'], risque: ['faible', 'publie sa hauteur en variable CSS : le bouton + et les pages en dépendent'] });
ecran('bouton-actions', 'Bouton « + » (actions rapides) et menu du compagnon', 'transverse', 'Case à droite de la barre sur les onglets ; flottant en bas à droite sur les pages plein écran', 'src/ui/FloatingActions.tsx',
  { jetons: ['compo:FloatingActions'], fichiers: ['src/ui/floating-actions.css'], houblons: ['en partie', 'masqué pendant une couche houblons v4, qui a son propre dock'], usage: [5, 'le geste d\'action de toute l\'app'], risque: ['moyen', 'se pose sur le contenu des pages : chaque refonte d\'écran doit lui réserver sa place'] });
ecran('compagnon-brasseur', 'Compagnon brasseur (pastille, conversations, discussion)', 'transverse', 'Pastille d\'activité sur les écrans ; entrée dans le menu du « + » ; boîte « Mes conversations »', 'src/ui/BrewerActivity.tsx',
  { jetons: ['compo:BrewerActivity'], fichiers: ['src/ui/BrewerChat.tsx', 'src/ui/BrewerNotifications.tsx', 'src/ui/BrewerBudget.tsx', 'src/ui/brewer-chat.css', 'src/ui/brewer-navigation.css'], houblons: ['en partie', 'conseils houblons du compagnon branchés sur l\'atelier V5.5'], usage: [3, 'questions pendant le brassage'], risque: ['élevé', 'appels Gemini facturés ; budget et reprise de jobs'] });
ecran('statut-persistance', 'Indicateur d\'état de la synchronisation', 'transverse', 'Sous l\'en-tête, quand la persistance a un état à dire (hors ligne, erreur de flux)', 'src/ui/PersistenceStatus.tsx',
  { jetons: ['compo:PersistenceStatus'], houblons: NON, usage: [3, 'il dit si la cuverie travaille hors ligne'], risque: ['moyen', 'seul affichage du mode hors ligne'] });
ecran('recherche-universelle', 'Recherche universelle (⌘K)', 'modale', 'Icône loupe de l\'en-tête, ou Ctrl+K', 'src/ui/CommandPalette.tsx',
  { jetons: ['compo:CommandPalette'], houblons: NON, usage: [3, 'raccourci vers recettes, brassins, stock, clients, écritures'], risque: ['faible', 'lecture seule'] });

// --- Les cinq onglets ------------------------------------------------------------------------------------------------
ecran('onglet-bord', 'Bord (tableau de bord)', 'onglet', 'Barre du bas, « Bord » ; page d\'accueil par défaut', 'src/components/tabs/DashboardTab.tsx',
  { jetons: ['onglet:dashboard', 'lazy:DashboardTab'], houblons: NON, usage: [5, 'première chose vue à chaque ouverture : brassins, stocks, finances, agenda, échéances'], risque: ['faible', 'lecture seule ; il renvoie vers les autres onglets'], depend: ['onglet-brassins', 'onglet-stocks', 'onglet-finances'] });

ecran('onglet-finances', 'Finances (coque : titre, sous-navigation, feuilles)', 'onglet', 'Barre du bas, « Finances »', 'src/components/tabs/FinancesTab.tsx',
  { jetons: ['onglet:finances', 'lazy:FinancesTab'], fichiers: ['src/ui/finance/finance.css', 'src/ui/finance/financeFormat.ts', 'src/ui/finance/FinancePeriod.tsx'], houblons: NON, usage: [3, 'le bureau : comptabilité TVA, factures QR'], risque: ['élevé', 'écritures comptables, archives, TVA : une erreur coûte cher'] });
ecran('finances-synthese', 'Finances · Synthèse (situation, coûts)', 'vue-onglet', 'Finances > « Synthèse »', 'src/components/tabs/FinancesTab.tsx',
  { zone: ['{view===\'overview\'&&overviewPart===\'situation\'', '{view===\'journal\'&&<>'], variante: 'overview', fichiers: ['src/ui/finance/FinanceOverview.tsx', 'src/ui/finance/CostComposition.tsx', 'src/ui/finance/FinanceComparisonChart.tsx', 'src/components/charts/CashflowBarChart.tsx', 'src/components/charts/ExpenseDonutChart.tsx'], houblons: NON, usage: [3, 'situation de trésorerie'], risque: ['moyen', 'lecture ; les chiffres viennent du grand livre'], depend: ['onglet-finances'] });
ecran('finances-operations', 'Finances · Mes opérations (journal)', 'vue-onglet', 'Finances > « Opérations »', 'src/components/tabs/FinancesTab.tsx',
  { zone: ['{view===\'journal\'&&<>', '{view===\'forecast\'&&forecastPart===\'timeline\'&&<>'], variante: 'journal', fichiers: ['src/ui/finance/TransactionJournal.tsx', 'src/ui/finance/TransactionRow.tsx', 'src/ui/finance/journal.css'], houblons: NON, usage: [3, 'saisie et relecture des écritures'], risque: ['élevé', 'écritures, avoirs, archives'], depend: ['onglet-finances'] });
ecran('finances-previsions', 'Finances · Anticiper les dépenses (échéancier, projets de matériel)', 'vue-onglet', 'Finances > « Prévisions »', 'src/components/tabs/FinancesTab.tsx',
  { zone: ['{view===\'forecast\'&&forecastPart===\'timeline\'&&<>', '{view===\'annual\'&&<>'], variante: 'forecast', fichiers: ['src/ui/finance/FinanceForecastSummary.tsx', 'src/ui/finance/UpgradeWorkspace.tsx', 'src/ui/finance/upgrades.css'], houblons: NON, usage: [2, 'planification, quelques fois par an'], risque: ['moyen', 'projets de matériel'], depend: ['onglet-finances'] });
ecran('finances-annuel', 'Finances · Bilan et impôts (annuel)', 'vue-onglet', 'Finances > « Annuel »', 'src/components/tabs/FinancesTab.tsx',
  { zone: ['{view===\'annual\'&&<>'], variante: 'annual', fichiers: ['src/ui/finance/TaxWorkspace.tsx', 'src/ui/finance/tax.css'], houblons: NON, usage: [2, 'clôture annuelle'], risque: ['élevé', 'clôtures fiscales, inventaires, archives'], depend: ['onglet-finances'] });

ecran('onglet-brassins', 'Brassins (coque : sous-navigation, bouton Atelier Houblons V5.5)', 'onglet', 'Barre du bas, « Brassins »', 'src/components/tabs/ProductionTab.tsx',
  { jetons: ['onglet:production', 'lazy:ProductionTab'], fichiers: ['src/ui/production/compact.css', 'src/ui/ViewNavigation.tsx'], houblons: NON, usage: [5, 'le cœur du métier'], risque: ['moyen', 'ouvre l\'assistant, la fiche de recette et le brassin du jour'] });
ecran('brassins-liste', 'Brassins · liste des brassins', 'vue-onglet', 'Brassins > « Brassins »', 'src/ui/production/ProductionCatalog.tsx',
  { variante: 'batches', fichiers: ['src/ui/production/CatalogCards.tsx', 'src/ui/production/CatalogToolbar.tsx', 'src/ui/production/CatalogScopeBar.tsx', 'src/ui/production/CatalogFilterNotice.tsx', 'src/ui/production/CatalogAnalysis.tsx', 'src/ui/production/BatchSchedule.tsx', 'src/ui/production/compact.css'], marqueurs: ['kind="batches"', 'ProductionCatalog'], houblons: NON, usage: [5, 'état de la cave, planning'], risque: ['moyen', 'archivage, rangement'], depend: ['onglet-brassins'] });
ecran('brassins-recettes', 'Brassins · carnet de recettes', 'vue-onglet', 'Brassins > « Recettes »', 'src/ui/production/ProductionCatalog.tsx',
  { variante: 'recipes', fichiers: ['src/ui/production/CatalogCards.tsx', 'src/ui/production/CatalogItemMenu.tsx', 'src/ui/production/RecipeComparison.tsx', 'src/ui/production/compact.css'], marqueurs: ['kind="recipes"', 'Le carnet de recettes'], houblons: ['en partie', 'la fiche de recette lit les houblons ; l\'atelier V5.5 est un bouton de la coque'], usage: [5, 'où l\'on choisit quoi brasser'], risque: ['moyen', 'versions de recette, archivage'], depend: ['onglet-brassins', 'page-recette'] });
ecran('brassins-atelier-rd', 'Brassins · Atelier R&D (idées, tâches, agenda créatif)', 'vue-onglet', 'Brassins > « Atelier » ; menu de l\'en-tête ; bouton + « Nouvelle idée »', 'src/components/CreativeLabTab.tsx',
  { fichiers: ['src/ui/CreativeItemSheet.tsx'], houblons: NON, usage: [2, 'notes d\'idées et tâches'], risque: ['faible', 'éléments créatifs seuls'], depend: ['onglet-brassins'] });
ecran('brassins-volumes', 'Brassins · Adapter les volumes', 'vue-onglet', 'Brassins > « Volumes »', 'src/components/tabs/ProductionTab.tsx',
  { zone: ['{subTab === \'scaler\' && !selectedRecipeToScale && (', '<BatchDetailSheet batch={detailBatch}'], variante: 'scaler', fichiers: ['src/ui/QuantityStepper.tsx'], marqueurs: ['Adapter les volumes', 'Adapter une recette au volume'], houblons: NON, usage: [2, 'rare'], risque: ['faible', 'calcul seul, rien n\'est enregistré'], depend: ['onglet-brassins'] });

ecran('onglet-stocks', 'Stocks (coque : sous-navigation, filtre, création d\'article)', 'onglet', 'Barre du bas, « Stocks »', 'src/components/tabs/StocksTab.tsx',
  { jetons: ['onglet:stocks', 'lazy:StocksTab'], fichiers: ['src/ui/stocks.css', 'src/ui/StockRow.tsx', 'src/ui/SwipeRow.tsx', 'src/ui/ViewNavigation.tsx'], houblons: ['en partie', 'sous-vue « Houblons » : l\'ancien index'], usage: [4, 'inventaire, courses'], risque: ['élevé', 'quantités, déduction automatique au brassage'] });
ecran('stocks-stock', 'Stocks · inventaire', 'vue-onglet', 'Stocks > « Stock »', 'src/components/tabs/StocksTab.tsx',
  { zone: ['{subTab === \'stock\' && (', '{subTab === \'courses\' && ('], variante: 'stock', fichiers: ['src/ui/StockDetailSheet.tsx', 'src/ui/LevelGauge.tsx', 'src/ui/InventoryCorrectionSheet.tsx'], houblons: NON, usage: [4, 'savoir ce qu\'il reste'], risque: ['élevé', 'corrections d\'inventaire, seuils'], depend: ['onglet-stocks'] });
ecran('stocks-courses', 'Stocks · liste de courses', 'vue-onglet', 'Stocks > « Courses »', 'src/components/tabs/StocksTab.tsx',
  { zone: ['{subTab === \'courses\' && (', '{subTab === \'futs\' &&'], variante: 'courses', marqueurs: ['liste de courses', 'copyShoppingList'], houblons: NON, usage: [3, 'avant un achat'], risque: ['moyen', 'ouvre la feuille de dépense'], depend: ['onglet-stocks'] });
ecran('stocks-futs', 'Stocks · fûts', 'vue-onglet', 'Stocks > « Fûts »', 'src/ui/KegBoard.tsx',
  { fichiers: ['src/ui/KegSheet.tsx'], houblons: NON, usage: [3, 'suivi des fûts'], risque: ['moyen', 'états de fûts, lien aux brassins'], depend: ['onglet-stocks'] });
ecran('stocks-materiel', 'Stocks · matériel', 'vue-onglet', 'Stocks > « Matériel »', 'src/components/tabs/StocksTab.tsx',
  { zone: ['{subTab === \'materiel\' && ('], variante: 'materiel', fichiers: ['src/ui/EquipmentList.tsx', 'src/ui/EquipmentSheet.tsx', 'src/ui/equipment-compact.css'], houblons: NON, usage: [2, 'rare'], risque: ['moyen', 'matériel, projets'], depend: ['onglet-stocks'] });
ecran('stocks-houblons', 'Stocks · Houblons (index des variétés et des lots)', 'vue-onglet', 'Stocks > « Houblons »', 'src/ui/hopIndex/HopIndexWorkspace.tsx',
  { fichiers: ['src/ui/hopIndex/HopIndexPanel.tsx', 'src/ui/hopIndex/HopSearchPanel.tsx', 'src/ui/hopIndex/HopKnowledgePanel.tsx', 'src/ui/hopIndex/HopTastingsPanel.tsx'], houblons: ['en partie', 'l\'index existe ; la fiche de variété v4 (choisie) est l\'écran « hop-fiche »'], usage: [3, 'consulter une variété, saisir un lot'], risque: ['moyen', 'lots et COA'], depend: ['onglet-stocks', 'hop-fiche'] });

ecran('onglet-clients', 'Clients (coque : sous-navigation)', 'onglet', 'Barre du bas, « Clients »', 'src/components/tabs/ClientsTab.tsx',
  { jetons: ['onglet:clients', 'lazy:ClientsTab'], fichiers: ['src/ui/clients.css', 'src/ui/ViewNavigation.tsx'], houblons: NON, usage: [2, 'le bureau, ventes'], risque: ['moyen', 'factures, clients'] });
ecran('clients-carnet', 'Clients · carnet clients', 'vue-onglet', 'Clients > « Clients »', 'src/components/tabs/ClientsTab.tsx',
  { zone: ['{subTab === \'crm\' && (', '{subTab === \'ofdf\' && ('], variante: 'crm', fichiers: ['src/components/EditClientModal.tsx', 'src/ui/finance/InvoiceSheet.tsx'], houblons: NON, usage: [2, 'ventes aux clients'], risque: ['élevé', 'création de factures QR'], depend: ['onglet-clients'] });
ecran('clients-impot-biere', 'Clients · impôt sur la bière (OFDF)', 'vue-onglet', 'Clients > « Impôt sur la bière »', 'src/components/tabs/ClientsTab.tsx',
  { zone: ['{subTab === \'ofdf\' && (', '{subTab === \'tarifs\' && ('], variante: 'ofdf', houblons: NON, usage: [2, 'échéances OFDF'], risque: ['élevé', 'déclaration fiscale'], depend: ['onglet-clients'] });
ecran('clients-tarifs', 'Clients · prix et marges (tarifs)', 'vue-onglet', 'Clients > « Prix et marges »', 'src/components/tabs/ClientsTab.tsx',
  { zone: ['{subTab === \'tarifs\' && ('], variante: 'tarifs', fichiers: ['src/ui/TarifSheet.tsx', 'src/ui/finance/CreativePricing.tsx'], houblons: NON, usage: [2, 'fixer un prix'], risque: ['moyen', 'tarifs'], depend: ['onglet-clients'] });

// --- Pages plein écran ------------------------------------------------------------------------------------------------
ecran('page-recette', 'Fiche de recette', 'page', 'Brassins > Recettes > toucher une recette ; recherche universelle ; après l\'assistant', 'src/pages/RecipePage.tsx',
  { jetons: ['vue:recipe', 'lazy:RecipePage'], fichiers: ['src/pages/recipePageLoader.ts', 'src/pages/PageShell.tsx', 'src/pages/page-shell.css', 'src/ui/RecipeDisclosure.tsx', 'src/ui/RecipeTextExport.tsx'], houblons: ['en partie', 'section « Houblons » et bouton vers l\'atelier V5.5 ; pas les outils v4'], usage: [5, 'relire une recette avant de brasser'], risque: ['moyen', 'modifier, dupliquer, supprimer une recette ; la recette est figée dans le brassin'], depend: ['brassins-recettes'] });
ecran('page-brassin-du-jour', 'Brassin du jour (déroulé minuté)', 'page', 'Brassins > Brassins > « Brasser » ; recherche universelle ; après la création d\'un brassin', 'src/pages/BrewDayPage.tsx',
  { jetons: ['vue:brewday', 'lazy:BrewDayPage'], fichiers: ['src/pages/brew-day.css', 'src/ui/BrewDayMeasurements.tsx', 'src/ui/BrewJournal.tsx', 'src/ui/BrewAssist.tsx', 'src/ui/BrewAlarmSettings.tsx', 'src/ui/useBrewSession.ts', 'src/ui/useBrewSound.ts'], houblons: ['en partie', 'ajouts de houblon minutés ; bouton vers l\'atelier V5.5 avec le journal'], usage: [5, 'cuverie : mains gantées, attention fragmentée (PRODUCT.md)'], risque: ['élevé', 'minuteurs, relevés, clôture qui déduit les stocks ; une erreur coûte un brassin de 30 L'], depend: ['page-recette'] });

ecran('assistant-recette', 'Assistant de recette (coque : en-tête, fil d\'étapes, brouillon, validation)', 'assistant', 'Bouton « + » > Recette ; Brassins > Recettes > Modifier ou Dupliquer ; import d\'une recette ; idée de l\'atelier', WIZARD,
  { jetons: ['vue:wizard', 'lazy:BrewWizard'], fichiers: ['src/pages/BrewWizardEntry.tsx', 'src/pages/PageShell.tsx', 'src/pages/page-shell.css', 'src/pages/recipe-wizard.css', 'src/ui/WizardStepBar.tsx', 'src/ui/FormNav.tsx', 'src/theme/ThemeToggle.tsx', 'src/services/recipeDraft.ts'],
    houblons: ['en partie', 'l\'étape Houblons est refaite (v4.10) ; le reste de la coque est l\'ancien'], usage: [5, 'cuverie : on prépare la recette ici (PRODUCT.md)'], risque: ['élevé', 'brouillon local, enregistrement de la recette, adoption du matériel, création d\'article de stock à zéro'], depend: [] });
ecran('etape-identite', 'Assistant · étape 1/7 « Identité »', 'etape-assistant', 'Assistant de recette, première étape (ouverture par défaut)', WIZARD,
  { jetons: ['etape:identite'], zone: ['{step === \'identite\' && (', '{/* ---------------------------------------------------- ÉTAPE 2 */}'], variante: 'identite', fichiers: ['src/ui/BrewingStyleDetails.tsx', 'src/ui/RecipeInstallationChoice.tsx', 'src/ui/recipe-installation.css', 'src/ui/NoloPanel.tsx', 'src/ui/BrewEquipmentSummary.tsx', 'src/ui/Combobox.tsx', 'src/ui/RecipeImportSheet.tsx'],
    marqueurs: ['Nom de la bière', 'wz-title', 'Coller une recette', 'évaporés', 'Matériel du plan', 'Style de la bière', 'Volume en fermenteur'], houblons: NON, usage: [5, 'première étape de chaque recette ; le brasseur veut la refaire en premier (31.10)'], risque: ['moyen', 'style → profil d\'eau ; matériel → recalcule ingrédients, eaux et sels'], depend: ['assistant-recette'] });
ecran('etape-fermentescibles', 'Assistant · étape 2/7 « Fermentescibles » (Malts/sucres)', 'etape-assistant', 'Assistant de recette, étape 2', WIZARD,
  { jetons: ['etape:fermentescibles'], zone: ['{step === \'fermentescibles\' && (', '{step === \'houblons\' && hopV4Actif && ('], variante: 'fermentescibles', fichiers: ['src/ui/MaltDetails.tsx', 'src/ui/IngredientPicker.tsx', 'src/ui/RecipeAutoComplete.tsx', 'src/ui/CycleTag.tsx'], marqueurs: ['Fermentescibles', 'Famille de fermentescible'], houblons: NON, usage: [5, 'la facture de grain'], risque: ['moyen', 'création d\'articles de stock à zéro, constantes retenues (learnIngredient)'], depend: ['assistant-recette'] });
ecran('etape-houblons', 'Assistant · étape 3/7 « Houblons »', 'etape-assistant', 'Assistant de recette, étape 3 ; banc local ?dev-local&etape=houblons', WIZARD,
  { jetons: ['etape:houblons'], zone: ['{step === \'houblons\' && hopV4Actif && (', '{step === \'levure\' && ('], variante: 'houblons', fichiers: ['src/ui/hopIndex/maBiere/EtapeHoublons.tsx', 'src/ui/hopIndex/maBiere/MesuresWizard.tsx', 'src/ui/hopIndex/maBiere/ma-biere.css'], marqueurs: ['EtapeHoublons', 'etapeHoublons'], houblons: ['refait', 'base v4.10 choisie (registre : etape-houblons) ; l\'ancienne étape reste derrière le drapeau hopV4'], usage: [5, 'dose et moment des houblons'], risque: ['moyen', 'écritures de houblons dans la recette (recipeConversion)'], depend: ['assistant-recette'] });
ecran('etape-levure', 'Assistant · étape 4/7 « Levure »', 'etape-assistant', 'Assistant de recette, étape 4', WIZARD,
  { jetons: ['etape:levure'], zone: ['{step === \'levure\' && (', '{step === \'paliers\' && ('], variante: 'levure', fichiers: ['src/ui/YeastRecipeChoice.tsx', 'src/ui/YeastRecipeWorkbench.tsx', 'src/ui/YeastRecipeDossier.tsx', 'src/ui/YeastIngredientPicker.tsx', 'src/ui/YeastPitchingPanel.tsx', 'src/ui/yeast-recipe.css', 'src/ui/yeast-choice.css'], marqueurs: ['YeastRecipeChoice', 'YeastRecipeWorkbench'], houblons: ['en partie', 'l\'écran « levure » du registre est OUVERT (choix en attente) : ne rien y mettre (D123)'], usage: [5, 'souche, pitch, espace libre'], risque: ['moyen', 'feuilles documentaires de candidats'], depend: ['assistant-recette'] });
ecran('etape-paliers', 'Assistant · étape 5/7 « Paliers » (empâtage et fermentation)', 'etape-assistant', 'Assistant de recette, étape 5', WIZARD,
  { jetons: ['etape:paliers'], zone: ['{step === \'paliers\' && (', '{step === \'eau\' && ('], variante: 'paliers', fichiers: ['src/ui/RecipeThermalPlan.tsx', 'src/ui/FermentationWorkshop.tsx', 'src/ui/brew-thermal.css'], marqueurs: ['Paliers', 'RecipeThermalPlan'], houblons: NON, usage: [4, 'empâtage et conduite de fermentation'], risque: ['moyen', 'programmes de style proposés, jamais imposés'], depend: ['assistant-recette'] });
ecran('etape-eau', 'Assistant · étape 6/7 « Eau et sels »', 'etape-assistant', 'Assistant de recette, étape 6', WIZARD,
  { jetons: ['etape:eau'], zone: ['{step === \'eau\' && (', '{step === \'recap\' && ('], variante: 'eau', fichiers: ['src/ui/SaltSolver.tsx', 'src/ui/water/WaterWorkbench.tsx', 'src/ui/water/workshop.css', 'src/ui/WaterTargetSheet.tsx', 'src/ui/WaterRadar.tsx'], marqueurs: ['SaltSolver', 'WaterWorkbench', 'Eau et sels'], houblons: NON, usage: [5, 'l\'atelier de l\'eau (PRODUCT.md : écran de cuverie)'], risque: ['élevé', 'doses de sels, acide, analyse d\'eau enregistrée dans la configuration'], depend: ['assistant-recette'] });
ecran('etape-recap', 'Assistant · étape 7/7 « Récapitulatif »', 'etape-assistant', 'Assistant de recette, étape 7', WIZARD,
  { jetons: ['etape:recap'], zone: ['{step === \'recap\' && ('], variante: 'recap', fichiers: ['src/ui/RecipeReview.tsx', 'src/ui/BrewSheetWithCompanion.tsx', 'src/ui/BrewSheet.tsx', 'src/ui/RecipeTextExport.tsx'], marqueurs: ['Récapitulatif', 'RecipeReview', 'Enregistrer la recette'], houblons: NON, usage: [5, 'dernière relecture, « Enregistrer » et « Enregistrer et préparer un brassin »'], risque: ['élevé', 'enregistrement de la recette dans Firestore'], depend: ['assistant-recette'] });

// --- Atelier houblons V5.5 (ancien) et couches houblons v4 -------------------------------------------------------------
ecran('atelier-houblons-v55', 'Atelier Houblons V5.5 (exploration, décision, journal)', 'couche-houblons', 'Brassins > bouton « Atelier Houblons V5.5 » ; fiche de recette ; brassin du jour ; Stocks', 'src/ui/hopV55/Host.tsx',
  { jetons: ['vue:hopV55', 'lazy:HopV55Host'], fichiers: ['src/ui/hopV55/Page.tsx', 'src/ui/hopV55/Explorer.tsx', 'src/ui/hopV55/RecipeStep.tsx', 'src/ui/hopV55/Catalogue.tsx'], houblons: ['pas du tout', 'ancienne génération ; 90 fichiers dans src/ui/hopV55/ ; hors programme tant que le brasseur n\'a pas tranché'], usage: [1, 'remplacé par les outils v4 dans l\'usage'], risque: ['élevé', 'dépôt Dexie de l\'atelier, décisions archivées, Gemini'], depend: [] });
ecran('hop-ma-biere', 'Ma bière (outil houblons)', 'couche-houblons', 'Couche au-dessus de l\'assistant ou de la fiche ; crochet de développement tant que le drapeau hopV4 est éteint', 'src/ui/hopIndex/biere/EcranApp.tsx',
  { jetons: ['vue:hopBeer', 'lazy:HopToolLayer'], fichiers: ['src/ui/hopIndex/biere/CadreApp.tsx', 'src/ui/hopIndex/biere/Degustation.tsx', 'src/ui/hopIndex/biere/biere.css', 'src/ui/hopIndex/HopToolLayer.tsx'], houblons: ['refait', 'registre : ma-biere, choisi (base v4.10)'], usage: [4, 'analyse de la recette'], risque: ['moyen', 'lecture surtout'], depend: ['etape-houblons'] });
ecran('hop-suggerer', 'Suggérer (outil houblons)', 'couche-houblons', 'Couche houblons', 'src/ui/hopIndex/suggerer/EcranApp.tsx',
  { jetons: ['vue:hopSuggest'], fichiers: ['src/ui/hopIndex/suggerer/CadreApp.tsx', 'src/ui/hopIndex/suggerer/suggerer.css'], houblons: ['refait', 'registre : suggerer, choisi (q2b)'], usage: [3, 'trouver un houblon'], risque: ['moyen', 'IA simulée en test'], depend: ['etape-houblons'] });
ecran('hop-comparer', 'Comparer (outil houblons)', 'couche-houblons', 'Couche houblons', 'src/ui/hopIndex/comparer/EcranApp.tsx',
  { jetons: ['vue:hopCompare'], fichiers: ['src/ui/hopIndex/comparer/CadreApp.tsx', 'src/ui/hopIndex/comparer/comparer.css', 'src/ui/hopIndex/comparer/cadre-app.css'], houblons: ['refait', 'registre : comparer, choisi (cmc2k)'], usage: [3, 'comparer des variétés'], risque: ['faible', 'lecture seule'], depend: ['etape-houblons'] });
ecran('hop-dryhopper', 'Dryhopper (outil houblons : moment du houblon)', 'couche-houblons', 'Couche houblons (hopTiming)', 'src/ui/hopIndex/dryhopper/EcranApp.tsx',
  { jetons: ['vue:hopTiming'], fichiers: ['src/ui/hopIndex/dryhopper/CadreApp.tsx', 'src/ui/hopIndex/dryhopper/dryhopper.css'], houblons: ['refait', 'registre : dryhopper, choisi (p4b2f)'], usage: [4, 'placer un dry hop'], risque: ['moyen', 'écrit les ajouts dans la recette'], depend: ['etape-houblons'] });
ecran('hop-levure', 'Levure (outil houblons, dans Dryhopper)', 'couche-houblons', 'Couche hopTiming avec step=yeast', 'src/ui/hopIndex/levure/index.tsx',
  { fichiers: ['src/ui/hopIndex/levure/levure.css'], houblons: ['en partie', 'registre : levure, OUVERT : le brasseur n\'a pas choisi ; rien à y faire (D123)'], usage: [3, 'choisir la souche pour un dry hop'], risque: ['moyen', 'écrit la levure dans la recette'], depend: ['hop-dryhopper'] });
ecran('hop-substituer', 'Substituer (outil houblons)', 'couche-houblons', 'Couche houblons', 'src/ui/hopIndex/substituer/EcranApp.tsx',
  { jetons: ['vue:hopSubstitute'], fichiers: ['src/ui/hopIndex/substituer/substituer.css'], houblons: ['refait', 'registre : substituer, choisi (u4)'], usage: [3, 'remplacer un houblon manquant'], risque: ['moyen', 'écrit un remplacement dans la recette'], depend: ['etape-houblons'] });
ecran('hop-fiche', 'Fiche de variété de houblon (feuille)', 'feuille', 'Toucher une variété dans les outils houblons v4', 'src/ui/hopIndex/fiche/Feuille.tsx',
  { fichiers: ['src/ui/hopIndex/fiche/FicheApp.tsx', 'src/ui/hopIndex/fiche/FicheHoublon.tsx', 'src/ui/hopIndex/fiche/feuille.css'], houblons: ['refait', 'registre : fiche, choisi (g1 et flb5b)'], usage: [3, 'lire une variété'], risque: ['faible', 'lecture seule'], depend: [] });

// --- Modales ouvertes depuis App.tsx ----------------------------------------------------------------------------------
ecran('rapide-menu', 'Nouvelle action (menu des saisies rapides)', 'modale', 'Bouton « + » sur un écran sans action propre', RAPIDE,
  { jetons: ['rapide:menu', 'lazy:QuickActionModal'], zone: ['{screen === \'menu\' && (', '{screen === \'matching\' && ('], variante: 'menu', marqueurs: ['Nouvelle action', 'QuickActionModal'], houblons: NON, usage: [4, 'point d\'entrée des saisies'], risque: ['faible', 'aiguillage'], depend: ['bouton-actions'] });
ecran('rapide-scan', 'Lire un justificatif (achat par scan)', 'modale', 'Menu du « + » > Lire un justificatif', 'src/ui/finance/ExpenseSheet.tsx',
  { jetons: ['rapide:scan'], variante: 'scan', fichiers: ['src/ui/finance/InvoiceScanReview.tsx', 'src/services/geminiScanner.ts'], marqueurs: ['startWithScan'], houblons: NON, usage: [3, 'saisir une facture d\'achat'], risque: ['élevé', 'Gemini facturé ; écrit une écriture et du stock'], depend: ['rapide-menu'],
    constat: 'QuickActionModal.tsx:604 rend directement ExpenseSheet dès que expenseMode est posé : le menu l\'ouvre avec startWithScan. L\'écran « scan » du modal n\'a pas de JSX propre.' });
ecran('rapide-depense', 'Saisie d\'un achat (feuille de dépense)', 'modale', '« + » sur Finances ; menu du « + » > dépense ; Stocks > courses', 'src/ui/finance/ExpenseSheet.tsx',
  { jetons: ['rapide:quick-expense'], variante: 'manual', marqueurs: ['ExpenseSheet', 'Acheter du matériel'], houblons: NON, usage: [3, 'noter un achat'], risque: ['élevé', 'écrit une écriture comptable'], depend: ['rapide-menu'],
    constat: 'Même feuille que « Lire un justificatif », sans le scan. Le bloc quick-expense de QuickActionModal.tsx (l.867) est l\'ancien écran, voir modale-saisie-ancienne.' });
ecran('rapide-matching', 'Matching et contrôle des stocks (ancien flux de scan)', 'modale', 'Ancien flux : lecture d\'un justificatif dans le modal, puis rapprochement avec le stock', RAPIDE,
  { jetons: ['rapide:matching'], zone: ['{screen === \'matching\' && (', '{screen === \'quick-expense\' && ('], variante: 'matching', marqueurs: ['Matching & Contrôle Stocks'], houblons: NON, usage: [1, 'à confirmer : probablement plus atteint'], risque: ['élevé', 'écrirait des quantités de stock'], depend: ['rapide-scan'],
    constat: 'À CONFIRMER EN CHROME : handleFileUpload (l.308) pose setScreen(\'matching\'), mais le menu actuel ouvre ExpenseSheet par expenseMode avant ce JSX. Code probablement mort ; ne rien supprimer sans accord.' });
ecran('modale-saisie-ancienne', 'Saisie dépense du modal (ancien écran quick-expense)', 'modale', 'Ancien flux, après un scan raté : saisie manuelle vide avec justificatif attaché', RAPIDE,
  { zone: ['{screen === \'quick-expense\' && (', '{screen === \'quick-sale\' && ('], variante: 'quick-expense', marqueurs: ['Saisie Dépense'], houblons: NON, usage: [1, 'à confirmer : probablement plus atteint'], risque: ['élevé', 'écrirait une écriture comptable'], depend: ['rapide-matching'],
    constat: 'À CONFIRMER EN CHROME : même raison que rapide-matching.' });
ecran('rapide-vente', 'Enregistrer une vente', 'modale', 'Menu du « + » > vente', RAPIDE,
  { jetons: ['rapide:quick-sale'], zone: ['{screen === \'quick-sale\' && (', '{screen === \'brew-batch\' && !recipes.length'], variante: 'quick-sale', marqueurs: ['Enregistrer une vente', 'quick-sale'], houblons: NON, usage: [3, 'noter une vente'], risque: ['élevé', 'écrit une vente et déduit du stock'], depend: ['rapide-menu'] });
ecran('rapide-brassin', 'Préparer un brassin (lancer depuis une recette)', 'modale', 'Fiche de recette > « Brasser » ; menu du « + » ; fin de l\'assistant', RAPIDE,
  { jetons: ['rapide:brew-batch'], zone: ['{screen === \'brew-batch\' && !recipes.length', null], variante: 'brew-batch', fichiers: ['src/ui/BrewChoice.tsx', 'src/ui/RecipeInstallationChoice.tsx'], marqueurs: ['Préparer un brassin', 'brew-batch'], houblons: NON, usage: [5, 'la décision de brasser'], risque: ['élevé', 'crée un brassin : la recette y est figée'], depend: ['page-recette'] });
ecran('reglages', 'Paramètres & Évolutions (réglages)', 'modale', 'Menu de l\'en-tête > Réglages', 'src/components/SettingsModal.tsx',
  { jetons: ['lazy:SettingsModal'], fichiers: ['src/ui/settings-compact.css', 'src/ui/BrewhouseSettings.tsx', 'src/ui/BackupPanel.tsx', 'src/ui/DriveStoragePanel.tsx'], houblons: NON, usage: [2, 'installation, sauvegardes'], risque: ['élevé', 'profil de cuverie, sauvegardes, import de données'], depend: ['en-tete'] });
ecran('journal-audit', 'Journal d\'audit', 'modale', 'Menu de l\'en-tête > Journal d\'audit ; depuis les réglages', 'src/components/AuditLogModal.tsx',
  { jetons: ['lazy:AuditLogModal'], houblons: NON, usage: [1, 'rare'], risque: ['faible', 'lecture seule'], depend: ['en-tete'] });
ecran('config-cloud', 'Cloud et IA (clé Gemini, Drive)', 'modale', 'Menu de l\'en-tête > Cloud & IA', 'src/components/CloudConfigModal.tsx',
  { jetons: ['lazy:CloudConfigModal'], houblons: NON, usage: [1, 'configuration, une fois'], risque: ['élevé', 'clé API, autorisations Google'], depend: ['en-tete'] });

// --- Feuilles et modales propres aux écrans (hors App.tsx) ---------------------------------------------------------------
ecran('feuille-brassin', 'Fiche d\'un brassin (feuille : mesures, historique)', 'feuille', 'Brassins > Brassins > toucher un brassin ; Bord > un brassin', 'src/ui/BatchDetailSheet.tsx',
  { houblons: NON, usage: [4, 'noter une densité, suivre la fermentation'], risque: ['élevé', 'relevés de densité, corrections de stock'], depend: ['brassins-liste'] });
ecran('feuille-article-stock', 'Fiche d\'un article de stock', 'feuille', 'Stocks > Stock > toucher un article', 'src/ui/StockDetailSheet.tsx',
  { houblons: NON, usage: [4, 'corriger une quantité'], risque: ['élevé', 'quantités'], depend: ['stocks-stock'] });
ecran('feuille-nouvel-article', 'Nouvel article (stock)', 'feuille', 'Stocks > « + »', 'src/components/tabs/StocksTab.tsx',
  { zone: ['title="Nouvel article"'], variante: 'nouvel-article', marqueurs: ['Nouvel article'], houblons: NON, usage: [3, 'créer un article'], risque: ['moyen', 'référence attribuée automatiquement'], depend: ['stocks-stock'] });
ecran('feuille-correction-inventaire', 'Corriger l\'inventaire', 'feuille', 'Stocks > fiche d\'un article ; fiche de brassin', 'src/ui/InventoryCorrectionSheet.tsx',
  { houblons: NON, usage: [3, 'inventaire'], risque: ['élevé', 'écrit des quantités'], depend: ['feuille-article-stock'] });
ecran('feuille-fut', 'Fût (fiche et création)', 'feuille', 'Stocks > Fûts', 'src/ui/KegSheet.tsx',
  { houblons: NON, usage: [3, 'fût'], risque: ['moyen', 'états de fûts'], depend: ['stocks-futs'] });
ecran('feuille-materiel', 'Matériel (fiche et création)', 'feuille', 'Stocks > Matériel', 'src/ui/EquipmentSheet.tsx',
  { houblons: NON, usage: [2, 'matériel'], risque: ['moyen', 'matériel'], depend: ['stocks-materiel'] });
ecran('feuille-idee', 'Idée ou tâche de l\'atelier R&D', 'feuille', 'Atelier R&D > un élément', 'src/ui/CreativeItemSheet.tsx',
  { houblons: NON, usage: [2, 'idées'], risque: ['faible', 'éléments créatifs'], depend: ['brassins-atelier-rd'] });
ecran('feuille-tarif', 'Tarif (nouveau, modifier)', 'feuille', 'Clients > Prix et marges', 'src/ui/TarifSheet.tsx',
  { houblons: NON, usage: [2, 'tarif'], risque: ['moyen', 'tarifs'], depend: ['clients-tarifs'] });
ecran('feuille-facture', 'Facturer un client (feuille)', 'feuille', 'Clients > Clients > Facturer', 'src/ui/finance/InvoiceSheet.tsx',
  { houblons: NON, usage: [2, 'facturer'], risque: ['élevé', 'facture QR, écriture'], depend: ['clients-carnet'] });
ecran('feuille-client', 'Client (modale : nouveau, modifier)', 'modale', 'Clients > Clients', 'src/components/EditClientModal.tsx',
  { houblons: NON, usage: [2, 'fiche client'], risque: ['moyen', 'données clients'], depend: ['clients-carnet'] });
ecran('feuille-ecriture-detail', 'Écriture (détail, modification)', 'modale', 'Finances > Opérations > toucher une écriture', 'src/components/EditTransactionModal.tsx',
  { fichiers: ['src/ui/finance/TransactionDetails.tsx'], houblons: NON, usage: [3, 'corriger une écriture'], risque: ['élevé', 'écritures'], depend: ['finances-operations'] });
ecran('feuille-mouvement', 'Avoir, remboursement, apport ou prélèvement privé', 'feuille', 'Finances > Opérations', 'src/ui/finance/MovementSheet.tsx',
  { houblons: NON, usage: [2, 'mouvements privés'], risque: ['élevé', 'écritures'], depend: ['finances-operations'] });
ecran('feuille-projet-materiel', 'Projet de matériel (feuille)', 'feuille', 'Finances > Prévisions > Projets', 'src/ui/finance/UpgradeSheet.tsx',
  { houblons: NON, usage: [2, 'projets'], risque: ['moyen', 'projets'], depend: ['finances-previsions'] });
ecran('feuille-archives', 'Les archives de la brasserie', 'feuille', 'Finances > Opérations > archives', 'src/ui/finance/ArchiveManagerSheet.tsx',
  { houblons: NON, usage: [1, 'rare'], risque: ['élevé', 'archives financières'], depend: ['finances-operations'] });
ecran('feuille-impots', 'Préparer les impôts (clôture)', 'feuille', 'Finances > Annuel', 'src/ui/finance/TaxClosingSheet.tsx',
  { fichiers: ['src/ui/finance/DocumentProofLink.tsx'], houblons: NON, usage: [1, 'une fois par an'], risque: ['élevé', 'clôture fiscale'], depend: ['finances-annuel'] });
ecran('feuille-budget-brassin', 'Budget du brassin (estimation)', 'feuille', 'Assistant, fiche de recette, fiche de brassin, Finances', 'src/ui/finance/BrewBudgetDialog.tsx',
  { fichiers: ['src/ui/finance/BrewBudgetSheet.tsx', 'src/ui/finance/brew-budget.css'], houblons: NON, usage: [3, 'chiffrer un brassin'], risque: ['moyen', 'estimation, écriture d\'un budget'], depend: [] });
ecran('feuille-import-recette', 'Coller une recette trouvée (feuille d\'import)', 'feuille', 'Assistant, étape Identité : bouton « Coller une recette trouvée » ou icône d\'en-tête', 'src/ui/RecipeImportSheet.tsx',
  { houblons: NON, usage: [4, 'chemin le plus rapide vers une recette complète'], risque: ['élevé', 'Gemini facturé ; remplace les champs de l\'assistant'], depend: ['etape-identite'] });
ecran('feuille-cible-eau', 'Cible d\'eau de la recette', 'feuille', 'Assistant, étape Eau', 'src/ui/WaterTargetSheet.tsx',
  { houblons: NON, usage: [4, 'cible chiffrée'], risque: ['élevé', 'profil d\'eau'], depend: ['etape-eau'] });
ecran('feuille-recherche-fermentation', 'Recherche sur la fermentation (synthèse et sources)', 'feuille', 'Panneaux de fermentation et NOLO', 'src/ui/FermentationResearchSheet.tsx',
  { houblons: NON, usage: [1, 'lecture'], risque: ['faible', 'lecture seule'], depend: [] });
ecran('feuille-ranger-recette', 'Ranger une recette / un brassin (menu de carte)', 'feuille', 'Brassins > carte > menu', 'src/ui/production/CatalogItemMenu.tsx',
  { houblons: NON, usage: [3, 'archiver'], risque: ['moyen', 'archivage'], depend: ['brassins-recettes'] });
ecran('feuille-comparer-recettes', 'Comparer les recettes', 'feuille', 'Brassins > Recettes > Comparer', 'src/ui/production/RecipeComparison.tsx',
  { houblons: NON, usage: [2, 'comparer'], risque: ['faible', 'lecture seule'], depend: ['brassins-recettes'] });

// --- Ce qui existe dans le code sans être branché -----------------------------------------------------------------------
ecran('modale-brassin-modifier', 'Modale « modifier un brassin » (EditBatchModal)', 'modale', 'Aucun accès : personne ne l\'importe', 'src/components/EditBatchModal.tsx',
  { houblons: NON, usage: [1, 'aucun'], risque: ['faible', 'non branchée'], depend: [] });
ecran('modale-article-modifier', 'Modale « modifier un article » (EditStockItemModal)', 'modale', 'Aucun accès : personne ne l\'importe', 'src/components/EditStockItemModal.tsx',
  { houblons: NON, usage: [1, 'aucun'], risque: ['faible', 'non branchée'], depend: [] });
ecran('modale-article-ajouter', 'Modale « ajouter un article » (AddStockItemModal)', 'modale', 'Aucun accès : personne ne l\'importe', 'src/components/AddStockItemModal.tsx',
  { houblons: NON, usage: [1, 'aucun'], risque: ['faible', 'non branchée'], depend: [] });
ecran('modale-confirmation', 'Modale de confirmation générique (ConfirmModal)', 'modale', 'Aucun accès : personne ne l\'importe', 'src/components/ConfirmModal.tsx',
  { houblons: NON, usage: [1, 'aucun'], risque: ['faible', 'non branchée'], depend: [] });

// ---------------------------------------------------------------------------------------------------------------------
// 3. L'écran Identité en détail (demande du pilote, 31.10) : chaque bloc, son composant, ses données, ses états, ses gestes
// ---------------------------------------------------------------------------------------------------------------------
// ancres : [fichier, texte exact] — la ligne est retrouvée dans le fichier ; une ancre introuvable fait échouer --verifier.

const BLOCS_IDENTITE = [
  { id: 'entete', nom: 'En-tête : « ‹ Identité 1/7 », Abandonner, import, thème',
    voit: '« < » en haut à gauche, « Identité 1/7 », lien souligné « Abandonner », icône de collage, icône lune.',
    composants: ['mobileHeader (BrewWizard)', 'WizardStepName (WizardStepBar.tsx)', 'ThemeToggle (src/theme/ThemeToggle.tsx)', 'PageShell, prop mobileHeader (src/pages/PageShell.tsx)'],
    ancres: [[WIZARD, 'const mobileHeader = ('], [WIZARD, 'const abandonner = draftKey'], ['src/ui/WizardStepBar.tsx', 'export const WizardStepName'], ['src/theme/ThemeToggle.tsx', 'export function ThemeToggle']],
    lit: ['draftKey, draftNotice, draftError, draftAside, discarding (état du brouillon, en mémoire)', 'étape courante (STEPS, stepIndex)', 'thème : localStorage (src/theme/theme.ts, clé du thème)'],
    ecrit: ['setImporting(true) : ouvre la feuille d\'import', 'setDiscarding(true), puis clearRecipeDraft : supprime le brouillon dans localStorage', 'thème : localStorage'],
    etats: ['« Abandonner » n\'existe que si un brouillon est repris ou signalé (draftNotice ou draftError) et que la version enregistrée n\'est pas ouverte à côté : une recette neuve, sans brouillon, ne l\'a pas', 'confirmation sous l\'en-tête : « Supprimer ce brouillon ? » Garder / Abandonner', 'import désactivé en lecture seule (brouillon d\'un format plus récent) ou pendant l\'enregistrement', 'sur ordinateur, « Abandonner » passe par l\'en-tête de la coque (actions de PageShell)'],
    gestes: ['appui sur « < » : ferme la page (route.close), comme le geste retour du téléphone', 'appui sur « Abandonner » : demande de confirmation, rien n\'est supprimé au premier appui', 'appui sur l\'icône : ouvre « Coller une recette trouvée »', 'appui sur la lune : bascule clair/cave'],
    tests: ['recipeWizardSafety (abandon, confirmation, pas de restauration)', 'brewWizardDraftFreshness', 'aucun test sur ThemeToggle ni sur l\'icône d\'import'] },
  { id: 'fil', nom: 'Fil d\'étapes : Identité · Malts/sucres · Houblons · Levure · Paliers · Eau · Récap.',
    voit: 'Sept libellés courts sous l\'en-tête ; l\'actif est souligné en épais, les autres en filet gris.',
    composants: ['WizardStepRail (src/ui/WizardStepBar.tsx), avec showLabels et compactLabels', 'STEPS (BrewWizard.tsx)'],
    ancres: [[WIZARD, '{/* Le fil seul sur son rang'], ['src/ui/WizardStepBar.tsx', 'export const WizardStepRail'], [WIZARD, 'const STEPS: Array']],
    lit: ['STEPS (7 étapes, libellé court « Malts/sucres », « Eau », « Récap. »)', 'index de l\'étape'],
    ecrit: ['setStep(id) : change d\'étape sans valider la précédente'],
    etats: ['désactivé pendant l\'enregistrement ou pendant un calcul du guide houblons (hopGuideBusy)', 'le nom et la position sont annoncés aux lecteurs d\'écran (aria-live)'],
    gestes: ['appui sur un libellé : saute directement à l\'étape (aucune validation, contrairement à « Suivant »)', 'défilement horizontal local si le rail déborde'],
    tests: ['tests/helpers/wizard.ts s\'en sert pour naviguer ; tests/unit/hopIndexV4/etapeHoublons.test.tsx', 'aucun test dédié au rail'] },
  { id: 'bandeau', nom: 'Bandeau « Grain · OG · IBU · EBC »',
    voit: 'Une ligne : Grain 8,6 kg, OG 1,080, IBU ~93 suivi d\'une petite piste (bande du style et repère de la bière), EBC 9,5 avec une pastille de couleur.',
    composants: ['bloc .recipe-metrics (BrewWizard.tsx)', 'IbuEnPlage (BrewWizard.tsx) et MesuresWizardV4 (src/ui/hopIndex/maBiere/MesuresWizard.tsx, chargé à la demande), drapeau hopV4 allumé', 'libelleIbu (src/domain/hopIndex/v4/recipeConversion.ts)', 'computeBeerColor (src/domain/beerColor.ts)', 'BrewingMath (src/services/brewingMath.ts)'],
    ancres: [[WIZARD, 'className={`recipe-metrics panel'], [WIZARD, 'function IbuEnPlage'], [WIZARD, '<MesuresWizardV4 recipe={build()}'], ['src/ui/hopIndex/maBiere/MesuresWizard.tsx', 'export default function MesuresWizard']],
    lit: ['fermentables, hops, yeast, volume, ébullition de la recette en cours', 'totalGrist, ogPredicted, ibu (calculés par BrewingMath), color (computeBeerColor)', 'drapeau hopV4 allumé : IBU en plage (« ~ ») tirée de la variété par le moteur v4, et bande d\'IBU du style'],
    ecrit: ['rien : lecture seule (MesuresWizard remonte ses mesures à l\'assistant par onMesures, sans les écrire dans la recette)'],
    etats: ['absent tant que la recette n\'a ni grain ni houblon (hasMetrics) : une recette neuve n\'a pas de bandeau', 'valeur inconnue affichée « — » (OG, IBU, EBC), jamais 0', 'masqué à l\'étape Eau', 'drapeau hopV4 éteint : « IBU » simple, ou « IBU chaud » s\'il y a un dry hop ; allumé : « ~93 » et une piste (la valeur exacte et sa cause sont dans l\'infobulle title)', 'à l\'étape Houblons, c\'est l\'étape qui rend l\'IBU (le bandeau ne monte pas MesuresWizardV4)'],
    gestes: ['aucun geste propre ; le détail de l\'IBU est dans un attribut title, que le toucher ne montre pas (non vérifié sur téléphone)', 'se met à jour à chaque saisie dans l\'étape'],
    tests: ['pas de test qui vise ce bandeau par son libellé ; les calculs sont testés en domaine (brewingMath.test.ts, hopIndexV4)'] },
  { id: 'coller', nom: '« Coller une recette trouvée »',
    voit: 'Bouton pleine largeur, contour, icône de presse-papiers.',
    composants: ['bouton dans BrewWizard.tsx', 'RecipeImportSheet (src/ui/RecipeImportSheet.tsx, 551 lignes) dans une Sheet'],
    ancres: [[WIZARD, 'Coller une recette trouvée'], ['src/ui/RecipeImportSheet.tsx', 'AiClient.run'], ['src/ui/RecipeImportSheet.tsx', 'parseLocalRecipe(raw)']],
    lit: ['texte collé ou photo', 'copie L\'Affinée : relue exactement en local (parseLocalRecipe)', 'autre texte : Gemini via AiClient.run, puis lecteur local si l\'IA est indisponible'],
    ecrit: ['applyImport : remplace nom, style, volume, ingrédients, paliers, eau… de l\'assistant (brouillon localStorage ensuite)'],
    etats: ['hors ligne : l\'IA échoue, le lecteur local prend le relais ; un texte endommagé est refusé sans payer l\'IA', 'chargement pendant l\'appel IA ; erreur lisible dans la feuille', 'aperçu des sels, acides, adjuvants avant application'],
    gestes: ['appui : ouvre la feuille ; coller ; appliquer ou annuler'],
    tests: ['recipeImportRoundTrip, d100AiErrorsVisible, waterVolumeExplanation, brewWizardFirstSaveSourceContract, yeastTransferUi'] },
  { id: 'section', nom: 'Carte « Identité » et navigation au clavier',
    voit: 'La carte grise qui contient nom, style, volume, ébullition, NOLO, choix pour ce brassin et matériel.',
    composants: ['Section (src/pages/PageShell.tsx)', 'FormNav (src/ui/FormNav.tsx)'],
    ancres: [[WIZARD, '<Section title="Identité">'], ['src/ui/FormNav.tsx', 'export const FormNav'], ['src/pages/PageShell.tsx', 'export const Section']],
    lit: ['rien'], ecrit: ['onSubmit du formulaire : go(1) — passe à l\'étape suivante si l\'étape n\'a pas d\'erreur'],
    etats: ['aucun état propre'],
    gestes: ['Entrée : champ suivant ; Entrée dans le dernier champ : « Suivant » ; Maj+Entrée : champ précédent ; Échap : rend le focus'],
    tests: ['dataEntry.test.tsx et inputProtection.test.tsx couvrent FormNav'] },
  { id: 'nom', nom: 'Nom de la bière',
    voit: 'Libellé « Nom de la bière » et champ texte (« neipa v3 »).',
    composants: ['Field et TextInput (src/ui/FormNav.tsx, src/ui/TextInput.tsx, src/ui/Input.tsx)'],
    ancres: [[WIZARD, 'id="wz-title"'], ['src/ui/TextInput.tsx', 'export const TextInput']],
    lit: ['name (état initial : recette reprise, brouillon, ou titre de l\'idée de l\'atelier R&D)'],
    ecrit: ['setName : état de l\'assistant ; brouillon localStorage (laffinee_recipe_draft_v1:<clé>) après la première modification ; recette Firestore seulement à l\'enregistrement du récapitulatif'],
    etats: ['vide : placeholder « Milk Stout #2, NEIPA Tropicale… »', 'requis : après un « Suivant » refusé, erreur rouge « Une valeur à corriger » avec lien vers le champ (wz-validation)', 'désactivé pendant l\'enregistrement'],
    gestes: ['saisie ; Entrée passe au style'],
    tests: ['recipeWizardSafety, textInput, brewWizardDraftFreshness, noloRecipeSolver, brewEquipment (via le libellé « Nom de la bière »)'] },
  { id: 'style', nom: 'Style',
    voit: 'Liste déroulante « Double IPA » avec chevron.',
    composants: ['Combobox (src/ui/Combobox.tsx, 519 lignes) : recherche floue (fuse.js), création d\'un style libre', 'changeStyle (BrewWizard.tsx)', 'BrewWizardEntry : knownStyles = Suggestions.recipeStyles() (src/pages/BrewWizardEntry.tsx)'],
    ancres: [[WIZARD, 'ariaLabel="Style de la bière"'], [WIZARD, 'const changeStyle ='], ['src/pages/BrewWizardEntry.tsx', 'Suggestions.recipeStyles'], ['src/services/suggestions.ts', 'recipeStyles(): string[]']],
    lit: ['styles connus du carnet (Suggestions.knownStyles) + styles BJCP du catalogue (brewingStyles, avec StorageService.getHopKnowledge)'],
    ecrit: ['style et details.styleRef (référence BJCP résolue)', 'si le profil d\'eau suit le style : water.styleCode et ratioOverride remis à zéro — le choix du style change l\'étape Eau sans prévenir'],
    etats: ['vide : placeholder « NEIPA, Stout, Saison… »', 'style inconnu : proposition « Nouveau style « … » » (allowCreate)', 'si plusieurs éditions correspondent et qu\'aucune n\'est retenue : lien « Préciser le référentiel du style »'],
    gestes: ['toucher : la liste s\'ouvre (sans clavier sous un seuil d\'options, avec au-delà) ; taper filtre ; ↑ ↓ Entrée Échap au clavier'],
    tests: ['brewWizardDraftFreshness, dataEntry, stoutWaterProfile (libellé « Style de la bière ») ; aucun test sur « Préciser le référentiel du style »'] },
  { id: 'reperes', nom: 'Repères du style · 22A · BJCP 2021',
    voit: 'Ligne bleue repliée avec chevron. Dépliée : OG, FG, alcool, IBU, couleur SRM en plages, lien de source, boutons « Proposer l\'empâtage… » et « Proposer la conduite… ».',
    composants: ['BrewingStyleDetails (src/ui/BrewingStyleDetails.tsx, 30 lignes) : <details>', 'HopSourceLink (src/ui/hopIndex/HopTechnicalPanel.tsx)', 'brewingStyles, resolveBrewingStyle (src/domain/brewingStyles.ts)', 'mashProgramForStyle, fermentProgramForStyle (src/domain/brewPrograms.ts)'],
    ancres: [[WIZARD, '<BrewingStyleDetails recipe={build()}'], ['src/ui/BrewingStyleDetails.tsx', 'Repères du style'], ['src/ui/BrewingStyleDetails.tsx', 'Proposer l’empâtage']],
    lit: ['catalogue de styles (src/domain/brewingStyles.ts) et connaissances houblons enregistrées (StorageService.getHopKnowledge)', 'plages OG, FG, alcool, IBU, SRM avec leur source'],
    ecrit: ['seulement sur appui d\'un bouton « Proposer… » : remplace les paliers d\'empâtage, ou la conduite de fermentation (et efface yeastGuide)', 'rien au simple dépliage'],
    etats: ['absent si le style n\'est pas résolu ; message « Édition du style conservée indisponible » si la référence est perdue', 'en mode NOLO : les plages décrivent le style de référence, l\'objectif d\'alcool reste celui du NOLO ; les boutons « Proposer » disparaissent', 'les unités SRM et SG ne suivent pas le reste de l\'écran (EBC dans le bandeau, SRM ici)'],
    gestes: ['appui : déplie ou replie', 'appui sur « Proposer l\'empâtage » : écrase les paliers sans confirmation'],
    tests: ['aucun test ne vise ce composant ni ses libellés'] },
  { id: 'volume', nom: 'Volume en fermenteur (24 L)',
    voit: 'Libellé, champ chiffré encadré, unité « L ».',
    composants: ['InlineNum (src/ui/FormNav.tsx) sur NumberInput (src/ui/NumberInput.tsx)', 'defaultBrewVolume (src/domain/brewEquipment.ts) pour la valeur initiale'],
    ancres: [[WIZARD, '<InlineNum id="wz-volume"'], ['src/ui/FormNav.tsx', 'export const InlineNum'], ['src/ui/NumberInput.tsx', 'pad: _pad']],
    lit: ['volumeL de la recette reprise, ou la capacité par défaut de l\'installation (defaultBrewVolume)'],
    ecrit: ['setVolumeL : alimente l\'évaporation, « Choix pour ce brassin », et le plan d\'eau ; n\'adapte PAS les ingrédients (seul « Adapter la recette à … L » le fait)'],
    etats: ['vide : valeur inconnue (NaN), requis, bloque l\'enregistrement et « Suivant » (erreur wz-volume)', 'minimum 1 L', 'le pavé intégré demandé par `pad` n\'est plus ouvert : NumberInput renomme la prop `_pad` et ne s\'en sert pas (le clavier du système apparaît)'],
    gestes: ['saisie au clavier du système ; virgule française acceptée ; effacement possible sans remise à zéro'],
    tests: ['recipeWizardSafety (volume effacé reste manquant, refuse l\'enregistrement), brewEquipment, brewWorkspace, uiPerformance'] },
  { id: 'ebullition', nom: 'Durée d\'ébullition (60 min)',
    voit: 'Libellé, champ chiffré, unité « min ».',
    composants: ['InlineNum (entier, minimum 0)'],
    ancres: [[WIZARD, '<InlineNum id="wz-boil"']],
    lit: ['boilMin de la recette, ou 60 par défaut'],
    ecrit: ['setBoilMin : alimente l\'évaporation et le calcul des IBU'],
    etats: ['vide : inconnu, requis (erreur wz-boil)', 'minimum 0 : le champ accepte 0 minute'],
    gestes: ['saisie ; Entrée'],
    tests: ['seul tests/unit/hopIndexV4/renvoisEtDemande.test.tsx cite « Durée d\'ébullition » (côté houblons v4) ; aucun test de l\'assistant ne vise ce champ par son libellé'] },
  { id: 'evaporation', nom: '« 3 L évaporés — autant d\'eau à prévoir en plus dans la cuve. »',
    voit: 'Ligne grise sous les deux champs.',
    composants: ['evaporationHint (BrewWizard.tsx, useMemo)'],
    ancres: [[WIZARD, 'const evaporationHint = useMemo'], [WIZARD, '{evaporationHint}']],
    lit: ['volume, durée d\'ébullition', 'évaporation de l\'installation : boilOffLPerHour (matériel) ou boilOffRatePct du profil de cuverie, 10 % par défaut'],
    ecrit: ['rien'],
    etats: ['absente si l\'évaporation calculée est nulle ou illisible (volume vide)', 'À SIGNALER : sans taux d\'évaporation connu, le code suppose 10 % par heure sans le dire (honnêteté des données : une valeur inventée n\'est pas marquée comme telle)'],
    gestes: ['aucun'],
    tests: ['waterVolumeExplanation, brewingScale (unit)'] },
  { id: 'nolo', nom: 'Objectif NOLO · ≤ 0,5 %',
    voit: 'Case à cocher dans un cadre arrondi.',
    composants: ['NoloPanel (src/ui/NoloPanel.tsx, 222 lignes), allowEnable, chargé à la demande (lazy)', 'noloEquipmentPrompt (BrewWizard.tsx) : remplace le panneau si le matériel n\'est pas figé'],
    ancres: [[WIZARD, '<NoloPanel recipe={build()} onChooseYeast'], ['src/ui/NoloPanel.tsx', 'name="nolo-enabled"'], [WIZARD, 'const noloEquipmentPrompt']],
    lit: ['recipe.nolo (activé, procédé, matériel disponible, analyse des sucres du moût)'],
    ecrit: ['applyFermentationRecipe : active NOLO et peut réécrire fermentation et levure du brouillon'],
    etats: ['décoché : un seul libellé', 'coché : le panneau se déplie (procédé, matériel disponible, sucres du moût, simulateur)', 'chargement : « Chargement de l\'objectif NOLO… » (Suspense)', 'si la recette n\'a pas de matériel figé : message ambre « Cette recette n\'a pas de matériel figé » avec « Adapter à mon matériel actuel »'],
    gestes: ['appui sur la case ou son libellé (zone tactile de toute la ligne)'],
    tests: ['noloRecipeSolver, noloWizardApply (intégration) ; nolo.test (unit) ; aucun test sur le libellé « Objectif NOLO · ≤ 0,5 % » ni sur le chargement'] },
  { id: 'choix', nom: 'Choix pour ce brassin (24 / 30 L · 6 L libres)',
    voit: 'Titre, fraction de remplissage, phrase de repère, champ « Espace libre choisi (%) » et « Remplissage conseillé 24 L ».',
    composants: ['RecipeInstallationChoice (src/ui/RecipeInstallationChoice.tsx, 33 lignes)', 'fermenterRecommendation (src/domain/fermenterPlanning.ts)', 'equipmentCheck (src/domain/brewEquipment.ts)', 'NumberInput'],
    ancres: [[WIZARD, '<RecipeInstallationChoice recipe={build()}'], ['src/ui/RecipeInstallationChoice.tsx', 'Choix pour ce brassin'], ['src/domain/fermenterPlanning.ts', 'export function fermenterRecommendation']],
    lit: ['capacité du fermenteur du matériel (equipment.fermenterCapacityL)', 'espace libre de l\'installation, ou profil documenté de la levure (YEAST_RECIPE_PROFILES, yeastReferences)', 'plan d\'eau de la recette (rinçage à chaud)'],
    ecrit: ['recipe.installation.fermenterHeadspacePct (espace libre choisi), spargeExceptionAccepted', 'bouton « Reprendre le conseil de la levure » (n\'apparaît que si une valeur a été choisie) : l\'efface'],
    etats: ['absent si le matériel n\'a pas d\'équipement détaillé', 'volume vide : « Volume à renseigner » et « Espace libre inconnu »', 'phrase de repère selon l\'origine : choisi à la main / documenté par le fabricant / repère de l\'installation / « Repère provisoire : 20 % d\'espace libre, à ajuster selon la recette et la levure » (celui de la capture)', 'alerte (role=alert) si le volume atteint la capacité physique ; case « Prévoir le complément avec la bouilloire annexe » si le rinçage dépasse l\'habituel'],
    gestes: ['saisie du pourcentage ; cocher la case de dérogation ; reprendre le conseil'],
    tests: ['brewWizardInstallation (réouverture avec les choix de l\'installation), brewWaterPlanning (unit, fermenterRecommendation) ; le composant et ses libellés n\'ont pas de test propre'] },
  { id: 'materiel', nom: 'Matériel du plan : Royal Catering · cuve 45 L',
    voit: 'Une ligne de texte tout en bas de la capture ; dessous (hors capture) des boutons d\'adaptation et un résumé.',
    composants: ['ligne et boutons dans BrewWizard.tsx (« equipment-button »)', 'BrewEquipmentSummary (src/ui/BrewEquipmentSummary.tsx, 94 lignes)', 'adaptRecipeEquipment (src/domain/adaptRecipeEquipment.ts)', 'recipeInstallationIssues (src/domain/recipeInstallation.ts)'],
    ancres: [[WIZARD, 'Matériel du plan'], [WIZARD, 'const resizeForEquipment'], ['src/ui/BrewEquipmentSummary.tsx', 'export function BrewEquipmentSummary'], ['src/domain/adaptRecipeEquipment.ts', 'export function adaptRecipeEquipment']],
    lit: ['details.brewhouse : profil de cuverie figé dans la recette (calibration importée)', 'config.brewhouses et activeBrewhouseId : le matériel actuel (Firestore, via App)'],
    ecrit: ['« Adapter la recette à N L » et « Adapter à mon matériel actuel · nom » : appellent adaptRecipeEquipment puis applyImport : ingrédients, eaux, sels et acide recalculés, retour à l\'étape Identité', 'aucune confirmation avant ce recalcul'],
    etats: ['absent sans équipement détaillé', 'libellé « Installation à adopter » si la recette importée n\'a pas de matériel figé', 'bouton « Adapter la recette à N L » seulement si le volume diffère de celui du profil', 'bouton « Adapter à mon matériel actuel » seulement si le plan figé diffère du matériel actuel', 'message de statut après adaptation ; erreur « Adaptation impossible. »', 'le texte « · cuve 45 L » de la capture est le nom du profil de cuverie (donnée du brasseur), pas un calcul de l\'écran'],
    gestes: ['appui sur un bouton d\'adaptation : action lourde, une seule touche'],
    tests: ['brewEquipment, brewLegacyInstallationApp, brewLegacyInstallationLaunch, waterVolumeExplanation, noloWizardApply, batchScheduling'] },
  { id: 'resume-materiel', nom: 'Volumes et matériel (encadré récapitulatif sous « Matériel du plan »)',
    voit: 'Sur la capture du dev local (profil « Système 30L ») : cadre arrondi « Volumes et matériel · À revoir », lignes Empâtage à froid, Avec les grains à chaud (0 / 35 L), Rinçage à chaud, Avant ébullition, Fermenteur prévu (30 / …), Espace libre, puis un message rouge. Hors de la capture du brasseur, qui s\'arrête au-dessus.',
    composants: ['BrewEquipmentSummary (src/ui/BrewEquipmentSummary.tsx, 94 lignes), le même encadré que sur le jour de brassage', 'equipmentCheck, roPackages (src/domain/brewEquipment.ts)', 'actualWater (src/domain/brewAssist.ts)'],
    ancres: [[WIZARD, '<BrewEquipmentSummary recipe={build()}'], ['src/ui/BrewEquipmentSummary.tsx', 'aria-label="Volumes et matériel"'], ['src/ui/BrewEquipmentSummary.tsx', 'Repères et osmosée']],
    lit: ['recette en cours (volume, plan d\'eau, grains d\'empâtage), profil de cuverie et son équipement (capacités, volume utile, espace libre)', 'volume à chaud avant ébullition (recipe.preBoilHotL)'],
    ecrit: ['rien : lecture seule'],
    etats: ['absent sans équipement détaillé', 'en-tête « À revoir » (rouge) si une limite est dépassée, « Appoint nécessaire » (ambre) pour une dérogation de rinçage, sinon « Repères prévus »', 'lignes « À renseigner » quand le plan d\'eau est absent ; sur une recette neuve la capture montre « 0 L » (plan d\'eau à 0, pas « À renseigner ») : à examiner, un zéro y tient la place d\'un inconnu', 'messages role=alert : empâtage trop volumineux, collecte au-dessus de la limite, rinçage impossible, fermenteur plein', 'détail replié « Repères et osmosée » : packs d\'osmosée, budget de rinçage, limite de cuve provisoire'],
    gestes: ['appui sur « Repères et osmosée » : déplie', 'bouton « Prévoir cet appoint » seulement dans le jour de brassage (pas dans l\'assistant)'],
    tests: ['brewEquipment.test.tsx'] },
  { id: 'suivant', nom: 'Retour / « Suivant — Malts/sucres » (pied de page, sous le contenu)',
    voit: 'Non visible dans la capture (sous « Matériel du plan », en bas de la page défilante).',
    composants: ['stepActions (BrewWizard.tsx), passé à PageShell comme endActions', 'requestCorrection'],
    ancres: [[WIZARD, 'const stepActions ='], [WIZARD, 'const go = (delta']],
    lit: ['readiness.invalid de l\'étape (recipeReadiness, recipeValidation)'],
    ecrit: ['change l\'étape ; si l\'étape a une valeur invalide : validationRequested et focus sur le premier champ en erreur'],
    etats: ['« Retour » désactivé à la première étape', 'les deux désactivés pendant l\'enregistrement'],
    gestes: ['appui ; Entrée dans le dernier champ du formulaire'],
    tests: ['recipeEditing, YeastCandidatePicker (libellé « Suivant »)'] },
  { id: 'plus', nom: 'Bouton « + » flottant (Actions rapides)',
    voit: 'Rond noir à droite, en bas, qui recouvre le coin de « Remplissage conseillé ».',
    composants: ['FloatingActions (src/ui/FloatingActions.tsx), monté par App.tsx', 'useActionDock, ActionDock (src/pages/PageShell.tsx)'],
    ancres: [[APP, '<FloatingActions'], ['src/ui/FloatingActions.tsx', 'aria-label="Actions rapides"'], ['src/ui/floating-actions.css', '.floating-actions']],
    lit: ['route : page plein écran, donc ancre « page » et aucune action propre (action = null)', 'jobs du compagnon (pastille d\'attente)'],
    ecrit: ['ouvre le menu : facture, vente, recette, brassin, et le compagnon (BrewerChat hideLauncher, libellé « Recette en cours d\'écriture »)'],
    etats: ['page plein écran, clavier fermé : flottant en bas à droite par-dessus le contenu ; la fin de la page réserve sa place (data-floating-actions-gap="page") ; clavier ouvert : dans une case de l\'en-tête', 'effacé quand une modale ou une feuille est ouverte', 'la rangée Retour / Suivant lui laisse son coin'],
    gestes: ['appui : menu d\'actions'],
    tests: ['FloatingActions.behavior, floatingActionsShellLayout, fix114, AppQuickActionReturn.behavior, brewerNavigation'] },
  { id: 'bandeaux', nom: 'Bandeaux d\'état au-dessus du contenu (invisibles dans la capture)',
    voit: 'Rien dans la capture : tous conditionnels.',
    composants: ['recipe-draft-status, wz-validation, writeAlert (BrewWizard.tsx)', 'section « Brouillon conservé en lecture seule »'],
    ancres: [[WIZARD, 'recipe-draft-status'], [WIZARD, 'id="wz-validation"'], [WIZARD, 'Brouillon conservé en lecture seule']],
    lit: ['draftNotice, draftError, validationRequested, saveError, writeError (App)'],
    ecrit: ['« Fermer l\'erreur » efface saveError et writeError'],
    etats: ['« Brouillon repris sur cet appareil. » : ne s\'écrit plus à l\'écran (25.10), annoncé aux lecteurs d\'écran seulement', 'version enregistrée ouverte : « Le brouillon reste sur cet appareil jusqu\'à ta première modification »', 'valeurs à corriger : liste de liens vers les champs', 'erreur d\'enregistrement : role=alert, focus pris', 'brouillon d\'un format plus récent ou illisible : lecture seule, contenu conservé, aucune action'],
    gestes: ['appui sur une erreur : met le focus sur son champ'],
    tests: ['recipeWizardSafety, brewWizardDraftFreshness, hopV55WizardCorrectionRelations'] }
];

const ETATS_IDENTITE = [
  ['Vide (recette neuve)', 'Nom et style vides, volume = volumeL du profil de cuverie (30 L à défaut), ébullition 60 min, pas de bandeau Grain/OG/IBU/EBC, pas de « Abandonner ». « Choix pour ce brassin » apparaît si le matériel est détaillé.'],
  ['Recette reprise (modifier ou dupliquer)', 'Titre de coque « Modifier « nom » » ; tous les champs repris de la recette ; si elle n\'a pas de matériel figé : « Installation à adopter ».'],
  ['Brouillon repris (cas de la capture)', 'Message annoncé aux lecteurs d\'écran seulement ; « Abandonner » visible dans l\'en-tête ; bandeau présent si le brouillon a des ingrédients.'],
  ['Version enregistrée ouverte, brouillon mis de côté', 'Message visible « Version enregistrée ouverte. Le brouillon reste sur cet appareil jusqu\'à ta première modification. » ; pas de « Abandonner ».'],
  ['Erreur', 'Validation (nom, volume, ébullition manquants) : encadré rouge, liens vers les champs. Écriture refusée : encadré role=alert avec « Fermer ». Brouillon d\'un format plus récent : lecture seule.'],
  ['Hors ligne', 'Aucune logique propre à l\'écran. Le brouillon est dans localStorage, les données du matériel et des styles viennent du cache Firestore/IndexedDB, le catalogue de styles est dans le code. Seuls l\'import par IA et le compagnon ont besoin du réseau ; l\'import se replie sur le lecteur local, le compagnon n\'est pas monté en développement local (localOnly).'],
  ['Chargement', 'Suspense du panneau NOLO (« Chargement de l\'objectif NOLO… »), de l\'autocomplétion, et de la page entière (« Ouverture de la page… »).']
];

const CONSTATS_IDENTITE = [
  'Capture du dev local (390 × 844, profil de cuverie « Système 30L », recette neuve) : l\'écran rend les mêmes blocs que la capture du brasseur, mais un volume par défaut de 30 L dans un fermenteur de 30 L ouvre l\'écran avec deux messages rouges (« Le volume atteint ou dépasse la capacité physique du fermenteur » et « Le volume atteint la capacité totale »). Chez le brasseur, 24 / 30 L : rien de rouge. Le défaut d\'une recette neuve est le volumeL du profil (defaultBrewVolume : ici 30 L), pas le remplissage conseillé (24 L, affiché juste à côté).',
  'Sous « Matériel du plan », un encadré « Volumes et matériel » (BrewEquipmentSummary) double une partie de « Choix pour ce brassin » (remplissage du fermenteur, espace libre, même alerte).',
  'La capture est en thème clair, avec l\'IBU en plage (« ~93 ») : le drapeau hopV4 est allumé en production ; l\'étape Houblons v4 y est donc visible.',
  'Les blocs sont rendus dans cet ordre : Coller · Identité (nom, style, repères, volume et ébullition, évaporation, NOLO, choix pour ce brassin, matériel du plan). Le bandeau Grain/OG/IBU/EBC est au-dessus de tout, hors de la carte.',
  'Le « + » flottant recouvre le coin droit de « Remplissage conseillé » à cet endroit du défilement ; la page réserve sa place en fin de contenu seulement.',
  'Trois composants de l\'écran n\'ont aucun test qui les vise : BrewingStyleDetails (Repères du style), RecipeInstallationChoice (Choix pour ce brassin) et ThemeToggle.',
  'Un mot de la capture n\'est pas un état du code : « 3 L évaporés » dépend d\'un taux d\'évaporation que le code remplace par 10 % quand l\'installation n\'en donne pas, sans le marquer.',
  'Le changement de style réécrit silencieusement le profil d\'eau tant qu\'il suit le style (étape Eau) ; « Proposer l\'empâtage » remplace les paliers sans confirmation ; « Adapter à mon matériel actuel » recalcule ingrédients, eaux, sels et acide en un appui.',
  'Le pavé numérique intégré (`pad`) n\'existe plus : NumberInput accepte la prop mais ne l\'utilise pas ; le clavier du système s\'ouvre.'
];

// ---------------------------------------------------------------------------------------------------------------------
// 4. Dérivations depuis le code : taille, tests, données, états, branchement
// ---------------------------------------------------------------------------------------------------------------------

function listerFichiers(dossier, extensions) {
  const sortie = [];
  const pile = [path.join(RACINE, dossier)];
  while (pile.length) {
    const courant = pile.pop();
    if (!fs.existsSync(courant)) continue;
    for (const f of fs.readdirSync(courant, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name.startsWith('.')) continue;
      const complet = path.join(courant, f.name);
      if (f.isDirectory()) pile.push(complet);
      else if (extensions.some(e => f.name.endsWith(e))) sortie.push(path.relative(RACINE, complet).split(path.sep).join('/'));
    }
  }
  return sortie.sort();
}

const SRC_FICHIERS = listerFichiers('src', ['.ts', '.tsx']).filter(f => !f.startsWith('src/design/') && !f.startsWith('src/dev/'));
const SRC_TEXTES = new Map(SRC_FICHIERS.map(f => [f, lire(f)]));
const TEST_FICHIERS = listerFichiers('tests', ['.ts', '.tsx', '.mjs']);
const TEST_TEXTES = new Map(TEST_FICHIERS.map(f => [f, lire(f)]));

// Les noms de fichier qui se répètent d'un dossier à l'autre (EcranApp, index…) s'identifient avec leur dossier :
// sinon un test qui importe « dryhopper/EcranApp » compterait pour les cinq outils houblons.
const NOMS_GENERIQUES = new Set(['EcranApp', 'CadreApp', 'index', 'Page', 'Host', 'Feuille', 'hote', 'commun', 'briques']);
const nomModule = rel => {
  const base = path.basename(rel).replace(/\.[jt]sx?$/, '');
  if (!NOMS_GENERIQUES.has(base)) return base;
  const dossier = path.basename(path.dirname(rel));
  return base === 'index' ? dossier : dossier + '/' + base;
};
const motifImport = nom => new RegExp('[\'"][^\'"]*\\/' + echapper(nom) + '(\\.[jt]sx?)?[\'"]');

function portion(texte, zone) {
  if (!zone) return { texte, erreur: null };
  const [debut, fin] = zone;
  const i = texte.indexOf(debut);
  if (i === -1) return { texte: '', erreur: 'ancre introuvable : ' + debut };
  if (!fin) return { texte: texte.slice(i), erreur: null };
  const j = texte.indexOf(fin, i + debut.length);
  if (j === -1) return { texte: '', erreur: 'ancre de fin introuvable : ' + fin };
  return { texte: texte.slice(i, j), erreur: null };
}

const MOTIFS_ETATS = {
  vide: /\.length\s*===?\s*0|!\w[\w.?]*\.length|\bAucun[e]?\b|\bPas encore\b|\bRien à\b|EmptyState/g,
  chargement: /Suspense|LazySurface|DeferredSurface|Chargement|isLoading|aria-busy|Ouverture de|Synchronisation|animate-spin/g,
  erreur: /role="alert"|writeError|\bcatch\b|setError|aria-invalid|alert-strong|\bErreur\b|\bImpossible\b/g,
  hors_ligne: /hors[ -]?ligne|\boffline\b|onLine|\bHors ligne\b/gi,
  formulaire: /<input|<form|<textarea|<select|FormNav|TextInput|NumberInput|NumericField|MoneyField|Combobox|QuantityStepper|DateField|SegmentedControl|SliderField/g
};

function etatsDe(texte) {
  const etats = [];
  etats.push({ etat: 'chargé', present: true, indices: [] });
  for (const [nom, motif] of Object.entries(MOTIFS_ETATS)) {
    const trouves = unique([...texte.matchAll(motif)].map(m => m[0].trim())).slice(0, 3);
    const libelle = nom === 'hors_ligne' ? 'hors ligne' : nom === 'formulaire' ? 'formulaire rempli' : nom;
    etats.push({ etat: libelle, present: trouves.length > 0, indices: trouves });
  }
  return etats;
}

function donneesDe(texte) {
  const lectures = [];
  const ecritures = [];
  const methodes = unique([...texte.matchAll(/StorageService\.(\w+)/g)].map(m => m[1])).sort();
  const lit = methodes.filter(m => /^(get|is|subscribe|consume)/.test(m) && !/UiState/.test(m));
  const ecrit = methodes.filter(m => !/^(get|is|subscribe|consume|clear|startSync)/.test(m) && !/UiState/.test(m));
  if (lit.length) lectures.push('Firestore via StorageService (' + lit.join(', ') + ')');
  if (ecrit.length) ecritures.push('Firestore via StorageService (' + ecrit.join(', ') + ')');
  if (/useStorageValue/.test(texte)) lectures.push('lecture réactive (useStorageValue)');
  if (/FinanceService|FinancialArchiveService|financialLedger/.test(texte)) {
    lectures.push('Firestore via FinanceService / archives financières');
    if (/FinanceService\.(?!snapshot)\w+|FinancialArchiveService\.(?!getArchives)\w+/.test(texte)) ecritures.push('FinanceService / archives (écritures comptables)');
  }
  if (/getUiState/.test(texte)) lectures.push('localStorage : état d\'interface (getUiState)');
  if (/setUiState/.test(texte)) ecritures.push('localStorage : état d\'interface (setUiState)');
  if (/readRecipeDraft|localStorage/.test(texte)) lectures.push('localStorage : brouillon de recette ou préférences');
  if (/writeRecipeDraft|clearRecipeDraft|localStorage\.setItem/.test(texte)) ecritures.push('localStorage : brouillon de recette ou préférences');
  if (/from 'dexie'|workspaceRepository|brewingScenarioLocalRepository|hopDecisionLocalRepository/.test(texte)) { lectures.push('Dexie (IndexedDB local)'); ecritures.push('Dexie (IndexedDB local)'); }
  if (/brewingStyles|brewingCatalogue|yeastReferences|yeastCatalogue|waterStyles|Catalogue|useHopCatalogue|useHopData|hopCatalog|\/data\//.test(texte)) lectures.push('catalogue embarqué (styles, houblons, levures, eaux)');
  if (/AiClient|geminiScanner|GeminiScanner/.test(texte)) { lectures.push('Gemini (réseau, facturé)'); }
  if (/driveService|googleDrive|DriveStorage/.test(texte)) lectures.push('Google Drive');
  if (/FirebaseAuthService/.test(texte)) lectures.push('Firebase Authentication');
  return { lectures, ecritures };
}

function importeurs(rel) {
  const nom = nomModule(rel);
  const motif = motifImport(nom);
  return SRC_FICHIERS.filter(f => f !== rel && motif.test(SRC_TEXTES.get(f))).slice(0, 4);
}

function testsDe(e) {
  const modules = unique([e.racine, ...e.fichiers].filter(f => /\.[jt]sx?$/.test(f)).map(nomModule));
  const motifs = e.zone || e.variante ? [] : modules.map(motifImport);
  const trouves = [];
  for (const [f, texte] of TEST_TEXTES) {
    const parImport = e.zone ? e.fichiers.filter(x => /\.[jt]sx?$/.test(x)).map(nomModule).some(n => motifImport(n).test(texte)) : motifs.some(m => m.test(texte));
    const parMarqueur = e.marqueurs.some(m => texte.includes(m));
    if (parImport || parMarqueur) trouves.push(f);
  }
  return trouves;
}

function construire(e, jetons) {
  const erreurs = [];
  const racineTexte = existe(e.racine) ? lire(e.racine) : null;
  if (racineTexte === null) erreurs.push('fichier racine absent : ' + e.racine);
  const cible = racineTexte === null ? { texte: '' } : portion(racineTexte, e.zone);
  if (cible.erreur) erreurs.push(e.id + ' : ' + cible.erreur);
  const lignesRacine = racineTexte === null ? 0 : compterLignes(racineTexte);
  const lignesZone = e.zone ? compterLignes(cible.texte) : null;
  let autres = 0, css = 0;
  const lus = [cible.texte];
  for (const f of e.fichiers) {
    if (!existe(f)) { erreurs.push(e.id + ' : fichier cité absent : ' + f); continue; }
    const texte = lire(f);
    if (f.endsWith('.css')) css += compterLignes(texte);
    else { autres += compterLignes(texte); lus.push(texte); }
  }
  const tout = lus.join('\n');
  const donnees = donneesDe(tout);
  if (!donnees.lectures.length) donnees.lectures.push('aucune lecture directe repérée : données reçues en props de l\'écran parent');
  const tests = testsDe(e);
  const imp = racineTexte === null || e.racine === APP ? [] : importeurs(e.racine);
  const branche = e.racine === APP || e.racine === 'src/main.tsx' ? true : imp.length > 0;
  const principal = e.zone ? lignesZone : lignesRacine;
  const sortie = {
    id: e.id,
    nom: e.nom,
    famille: e.famille,
    acces: e.acces,
    jetons: e.jetons,
    fichiers: { racine: e.racine, zone: e.zone ? { debut: e.zone[0], fin: e.zone[1] ?? null } : null, autres: e.fichiers },
    donnees_lues: donnees.lectures,
    donnees_ecrites: donnees.ecritures,
    etats: etatsDe(tout),
    tests: { nombre: tests.length, fichiers: tests.slice(0, 10), plus: Math.max(0, tests.length - 10) },
    taille: { fichiers: 1 + e.fichiers.length, lignes_racine: lignesRacine, lignes_zone: lignesZone, lignes_autres: autres, lignes_css: css, lignes_total: principal + autres + css },
    branche: { importe_par: imp, branche },
    houblons: { statut: e.houblons?.[0] || 'pas du tout', note: e.houblons?.[1] || '' },
    usage: { niveau: e.usage?.[0] ?? 0, raison: e.usage?.[1] ?? '' },
    risque: { niveau: e.risque?.[0] ?? '', raison: e.risque?.[1] ?? '' },
    depend: e.depend
  };
  if (e.variante) sortie.variante = e.variante;
  if (e.constat) sortie.constat = e.constat;
  return { sortie, erreurs };
}

function ligneDe(fichier, texteAncre) {
  if (!existe(fichier)) return { ligne: null, erreur: 'fichier absent : ' + fichier };
  const lignes = lire(fichier).split('\n');
  const i = lignes.findIndex(l => l.includes(texteAncre));
  return i === -1 ? { ligne: null, erreur: 'ancre introuvable dans ' + fichier + ' : ' + texteAncre } : { ligne: i + 1, erreur: null };
}

function construireIdentite() {
  const erreurs = [];
  const blocs = BLOCS_IDENTITE.map(b => {
    const ancres = b.ancres.map(([fichier, texte]) => {
      const r = ligneDe(fichier, texte);
      if (r.erreur) erreurs.push('identité/' + b.id + ' : ' + r.erreur);
      return { fichier, ligne: r.ligne, ancre: texte };
    });
    return { ...b, ancres };
  });
  return { blocs, etats_ecran: ETATS_IDENTITE.map(([etat, detail]) => ({ etat, detail })), constats: CONSTATS_IDENTITE, erreurs };
}

// ---------------------------------------------------------------------------------------------------------------------
// 5. Assemblage, vérification, écriture
// ---------------------------------------------------------------------------------------------------------------------

function assembler() {
  const jetons = jetonsDuCode();
  const erreurs = [];
  const ecrans = [];
  for (const e of ECRANS) {
    const r = construire(e, jetons);
    ecrans.push(r.sortie);
    erreurs.push(...r.erreurs);
  }
  const identite = construireIdentite();
  erreurs.push(...identite.erreurs);
  const { erreurs: _ignore, ...identiteSortie } = identite;
  const parFamille = {};
  for (const e of ecrans) parFamille[e.famille] = (parFamille[e.famille] ?? 0) + 1;
  const parHoublons = {};
  for (const e of ecrans) parHoublons[e.houblons.statut] = (parHoublons[e.houblons.statut] ?? 0) + 1;
  const json = {
    schema: 1,
    objet: 'Inventaire des écrans de L\'Affinée, dérivé du code (jamais un registre de ses choix : voir work/refonte-frontend/v4/choix/ecrans.json)',
    regenerer: 'node scripts/agents/inventaire-ecrans.mjs',
    verifier: 'node scripts/agents/inventaire-ecrans.mjs --verifier',
    jetons_du_code: [...jetons.keys()].sort(),
    compteurs: { ecrans: ecrans.length, par_famille: parFamille, par_houblons: parHoublons, non_branches: ecrans.filter(e => !e.branche.branche).map(e => e.id) },
    ecrans,
    identite: identiteSortie
  };
  return { json, erreurs, jetons };
}

function verifier(json, jetons, erreursAssemblage) {
  const erreurs = [...erreursAssemblage];
  // 1. chaque vue de App.tsx est dans l'inventaire
  const portes = new Set(ECRANS.flatMap(e => e.jetons));
  for (const [jeton, origine] of jetons) if (!portes.has(jeton)) erreurs.push('vue absente de l\'inventaire : ' + jeton + ' (' + origine + ')');
  // jetons déclarés qui n'existent plus dans le code
  for (const e of ECRANS) for (const j of e.jetons) if (!jetons.has(j)) erreurs.push(e.id + ' : jeton disparu du code : ' + j);
  // 2. fichiers racine et fichiers cités existent (déjà signalé à l'assemblage) ; ids bien formés
  // 3. aucune entrée en double
  const ids = new Map();
  const cles = new Map();
  const noms = new Map();
  for (const e of ECRANS) {
    if (!/^[a-z0-9-]+$/.test(e.id)) erreurs.push('identifiant mal formé : ' + e.id);
    if (ids.has(e.id)) erreurs.push('identifiant en double : ' + e.id);
    ids.set(e.id, true);
    const cle = [e.racine, e.zone ? e.zone.join('→') : '', e.variante ?? ''].join('|');
    if (cles.has(cle)) erreurs.push('même racine, même zone et même variante : ' + cles.get(cle) + ' et ' + e.id);
    cles.set(cle, e.id);
    if (noms.has(e.nom)) erreurs.push('nom en double : ' + e.nom);
    noms.set(e.nom, true);
    for (const d of e.depend) if (!ids.has(d) && !ECRANS.some(x => x.id === d)) erreurs.push(e.id + ' : dépend d\'un écran inconnu : ' + d);
    for (const j of e.jetons) {
      const autres = ECRANS.filter(x => x !== e && x.jetons.includes(j));
      if (autres.length && !/^(lazy|vue):/.test(j) && !/^onglet:/.test(j)) erreurs.push('jeton porté par deux écrans : ' + j + ' (' + e.id + ', ' + autres[0].id + ')');
    }
  }
  // 4. le tableau ordonné du MD ne cite que des écrans qui existent
  if (existe(SORTIE_MD)) {
    const md = lire(SORTIE_MD);
    const m = md.match(/<!-- ORDRE -->([\s\S]*?)<!-- \/ORDRE -->/);
    if (m) for (const c of m[1].matchAll(/`([a-z0-9-]+)`/g)) if (!ids.has(c[1])) erreurs.push('ordre proposé : écran inconnu `' + c[1] + '`');
  }
  return erreurs;
}

function tableauMd(json) {
  const lignes = [];
  lignes.push('| id | écran | famille | lignes | tests | données lues | états (code) | houblons | usage | risque |');
  lignes.push('|---|---|---|---:|---:|---|---|---|---:|---|');
  const abrege = s => s.replace(/\|/g, '/');
  for (const e of json.ecrans) {
    const etats = e.etats.filter(x => x.present).map(x => x.etat).join(', ');
    const donnees = e.donnees_lues.map(d => d.startsWith('aucune lecture') ? 'props' : d.replace(/ \(.*\)$/, '')).join(' ; ') || '—';
    const nonBranche = e.branche.branche ? '' : ' **(non branché)**';
    lignes.push(`| \`${e.id}\` | ${abrege(e.nom)}${nonBranche} | ${e.famille} | ${e.taille.lignes_total} | ${e.tests.nombre} | ${abrege(donnees)} | ${etats} | ${e.houblons.statut} | ${e.usage.niveau} | ${e.risque.niveau} |`);
  }
  return lignes.join('\n');
}

function ecrireTableau(json) {
  const debut = '<!-- TABLEAU -->';
  const fin = '<!-- /TABLEAU -->';
  const c = json.compteurs;
  const resume = `${c.ecrans} écrans. Familles : ${Object.entries(c.par_famille).map(([k, v]) => `${k} ${v}`).join(', ')}. Lien avec houblons : ${Object.entries(c.par_houblons).map(([k, v]) => `${k} ${v}`).join(', ')}. Non branchés : ${c.non_branches.length ? c.non_branches.map(x => '`' + x + '`').join(', ') : 'aucun'}.`;
  const bloc = `${debut}\n${resume}\n\n${tableauMd(json)}\n${fin}`;
  const chemin = path.join(RACINE, SORTIE_MD);
  let md = existe(SORTIE_MD) ? lire(SORTIE_MD) : `# Inventaire des écrans\n\n${debut}\n${fin}\n`;
  const i = md.indexOf(debut), j = md.indexOf(fin);
  if (i === -1 || j === -1) md = md + '\n' + bloc + '\n';
  else md = md.slice(0, i) + bloc + md.slice(j + fin.length);
  fs.mkdirSync(path.dirname(chemin), { recursive: true });
  fs.writeFileSync(chemin, md);
}

function ficheIdentite(json) {
  const e = json.ecrans.find(x => x.id === 'etape-identite');
  const l = [];
  l.push('# Écran « Identité 1/7 » : inventaire détaillé');
  l.push('');
  l.push('Généré par `node scripts/agents/inventaire-ecrans.mjs` (voie e2-inventaire, mission 2026-10-31-systeme-ecrans). Ne pas éditer à la main : relancer le script.');
  l.push('Capture du brasseur : `work/missions/2026-10-31-ecran-identite/brasseur-identite-avant.jpg` (production, thème clair, 31.10).');
  l.push('Les numéros de ligne sont ceux du code actuel (arbre de travail) ; une ancre qui bouge fait échouer `--verifier`.');
  l.push('');
  l.push('## L\'écran en un coup d\'œil');
  l.push('');
  l.push(`- Accès : ${e.acces}.`);
  l.push(`- Racine : \`${e.fichiers.racine}\`, de la ligne ${ligneDe(WIZARD, '{step === \'identite\' && (').ligne} à ${ligneDe(WIZARD, '{/* ---------------------------------------------------- ÉTAPE 2 */}').ligne} (${e.taille.lignes_zone} lignes) ; le fichier entier compte ${e.taille.lignes_racine} lignes.`);
  l.push(`- Fichiers propres : ${e.fichiers.autres.map(f => '`' + f + '`').join(', ')}.`);
  l.push(`- Tests repérés (par import ou par libellé) : ${e.tests.nombre}.`);
  l.push(`- Lien avec houblons : ${e.houblons.statut}. L'étape Houblons (3/7) est refaite ; l'étape Identité, non.`);
  l.push(`- Données lues (détection par motifs, sur la zone et les fichiers propres) : ${e.donnees_lues.join(' ; ') || 'aucune'}.`);
  l.push('');
  l.push('## Blocs, du haut vers le bas de la capture');
  l.push('');
  l.push('| # | bloc | composant principal | fichier : ligne |');
  l.push('|---:|---|---|---|');
  json.identite.blocs.forEach((b, i) => {
    const a = b.ancres[0];
    l.push(`| ${i + 1} | ${b.nom.replace(/\|/g, '/')} | ${b.composants[0].replace(/\|/g, '/')} | \`${a.fichier}:${a.ligne}\` |`);
  });
  l.push('');
  json.identite.blocs.forEach((b, i) => {
    l.push(`### ${i + 1}. ${b.nom}`);
    l.push('');
    l.push(`- **Ce qu'on voit** : ${b.voit}`);
    l.push(`- **Composants** : ${b.composants.join(' ; ')}.`);
    l.push(`- **Où dans le code** : ${b.ancres.map(a => '`' + a.fichier + ':' + a.ligne + '`').join(', ')}.`);
    l.push('- **Données lues** :');
    for (const x of b.lit) l.push(`  - ${x}`);
    l.push('- **Données écrites** :');
    for (const x of b.ecrit) l.push(`  - ${x}`);
    l.push('- **États** :');
    for (const x of b.etats) l.push(`  - ${x}`);
    l.push('- **Gestes** :');
    for (const x of b.gestes) l.push(`  - ${x}`);
    l.push('- **Tests** :');
    for (const x of b.tests) l.push(`  - ${x}`);
    l.push('');
  });
  l.push('## États de l\'écran entier');
  l.push('');
  for (const s of json.identite.etats_ecran) l.push(`- **${s.etat}** : ${s.detail}`);
  l.push('');
  l.push('## Constats utiles à la refonte');
  l.push('');
  for (const c of json.identite.constats) l.push(`- ${c}`);
  l.push('');
  l.push('## Tests de toute la zone, par import ou par libellé');
  l.push('');
  const decl = ECRANS.find(x => x.id === 'etape-identite');
  const t = testsDe(decl);
  for (const f of t) l.push(`- \`${f}\``);
  l.push('');
  return l.join('\n');
}

function ecrire(json) {
  const cheminJson = path.join(RACINE, SORTIE_JSON);
  fs.mkdirSync(path.dirname(cheminJson), { recursive: true });
  fs.writeFileSync(cheminJson, JSON.stringify(json, null, 2) + '\n');
  ecrireTableau(json);
  const cheminIdentite = path.join(RACINE, SORTIE_IDENTITE);
  fs.mkdirSync(path.dirname(cheminIdentite), { recursive: true });
  fs.writeFileSync(cheminIdentite, ficheIdentite(json));
}

const args = process.argv.slice(2);
const { json, erreurs, jetons } = assembler();

if (args.includes('--verifier')) {
  const problemes = verifier(json, jetons, erreurs);
  if (existe(SORTIE_JSON)) {
    const surDisque = fs.readFileSync(path.join(RACINE, SORTIE_JSON), 'utf8');
    if (surDisque !== JSON.stringify(json, null, 2) + '\n') console.log('AVERTISSEMENT : ' + SORTIE_JSON + ' est périmé (le code ou les tests ont changé) ; relancer le script sans option.');
  } else {
    problemes.push(SORTIE_JSON + ' n\'existe pas : lancer le script sans option');
  }
  if (problemes.length) {
    for (const p of problemes) console.log(' - ' + p);
    console.log('INVENTAIRE ECHEC (' + problemes.length + ' problème' + (problemes.length > 1 ? 's' : '') + ')');
    process.exit(1);
  }
  console.log(`vues du code : ${jetons.size} jetons, tous dans l'inventaire ; ${json.ecrans.length} écrans ; fichiers racine présents ; aucune entrée en double`);
  console.log('INVENTAIRE OK');
} else if (args.includes('--stdout')) {
  process.stdout.write(JSON.stringify(json, null, 2) + '\n');
} else {
  if (erreurs.length) {
    for (const p of erreurs) console.log(' - ' + p);
    console.log('Déclarations incohérentes avec le code : rien n\'est écrit. Corriger puis relancer.');
    process.exit(1);
  }
  ecrire(json);
  console.log(`écrit : ${SORTIE_JSON} (${json.ecrans.length} écrans), le tableau de ${SORTIE_MD}, ${SORTIE_IDENTITE}`);
}
