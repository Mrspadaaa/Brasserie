OK — e7a et e11a (+ nommé, menu) corrigés ; 3 défauts de liste attendent son choix ; types, 81 tests, 31 captures ouvertes

## Défauts [B] (VERDICT kp)
- [x] e7a n° 1 : « ‹ Le bilan » : `CatalogAnalysis` reçoit `onBack` (bouton 44 px, « Retour aux brassins »), passé par `ProductionCatalog` (`setView('list')`). Retour joué au banc (retour-liste).
- [x] e7a n° 2 : en vue Bilan des brassins, `ProductionCatalog` masque la barre de la liste (`CatalogToolbar`) et `ProductionTab` masque la phrase-réponse (titre `sr-only` à la place, via `onVueChange`) : « ‹ Le bilan » vient juste sous les onglets, à 390 et 1280. Rien d'autre de la liste touché. Sans brassin, la carte vide offre « Retour aux brassins » (la barre n'est plus là pour revenir).
- [x] e11a n° 1 : cartes de la liste Brassins : attend son choix (page « six questions », liste ouverte) ; non touché.
- [x] e11a n° 2 : puces « Tous · 2 en cuve · 1 en retard » : attend son choix (liste ouverte) ; non touché.
- [x] e11a n° 3 : le + est nommé : « + Brassin » sur Brassins, « + Recette » sur Recettes (`FabAction.court` dans `fabActions.ts`, rendu dans `FloatingActions`). L'Atelier reste un « + » nu (la maquette ne nomme que deux sous-onglets). La case des onglets s'élargit (variable `--floating-actions-nav-dock`, posée seulement quand le bouton est nommé et docké) : la barre se raccourcit, rien ne se recouvre. Stocks, Clients, Finances, Bord : inchangés (test).
- [x] e11a n° 4 : menu du + de la maquette, dans son ordre : Nouveau brassin (aplat plein, « Sur Brassins ») · Créer une recette · Outils houblons | Entrer une facture · Encaisser une vente | Compagnon brasseur. « Outils houblons » (icône houblon, vert) émet l'événement `brassins-outils-houblons-open` ; `ProductionTab` l'écoute et ouvre l'atelier (`onOpenHopV55`, déjà branché dans App) : joué au banc, l'atelier s'ouvre. « Lancer un brassin » n'est pas dans la maquette : retiré de ce menu seulement. Sur Recettes : « Nouvelle recette » en tête, pas de doublon « Créer une recette ».
- [x] e11a n° 5 : cartes recette (état, Brasser/Modifier, lien « Brassins LOT-… », bord rouge) et puces « Toutes · À cru » : attendent son choix (carnet de recettes ouvert) ; non touchés.

## Non bloquants
- e7a n° 3 (deux réglages d'archives) : l'interrupteur du bilan pilote maintenant le dossier d'analyse de l'app (`onFolder` → `analysisFolder`), un seul réglage ; la barre n'est plus là. Le bilan reçoit tous les brassins du dossier « tous » (sans filtre caché, la barre étant masquée) et filtre lui-même.
- e7a n° 4 (compteur) : la ligne « 5 brassins · Historique » disparaît en vue Bilan ; reste le compteur de l'onglet (4 en cours).
- e7a n° 5 : interrupteur actif, éteint au repos comme la maquette (affiché allumé seulement s'il y a des archives incluses).
- e11a n° 6 et 7 (phrase des recettes) : relèvent de `volumes/phrase.ts` (p3, hors Possède) ; non touchés.

## Fichiers écrits
`src/ui/production/CatalogAnalysis.tsx`, `src/ui/production/ProductionCatalog.tsx`, `src/ui/production/bilan/bilan.css`, `src/components/tabs/ProductionTab.tsx`, `src/ui/FloatingActions.tsx`, `src/domain/fabActions.ts`, `tests/unit/port-p6-bilan-plus.test.tsx` (10 tests), `tests/unit/port-p2-bilan.test.tsx` (une assertion : Archives actif sans archive), `voies/p6/` (banc.mjs, tests.txt, captures/, RESULTAT.md). `App.tsx` non touché (hors Possède) : le branchement passe par un événement.

## Critères
- G1 : un [x] par défaut [B] (7 sur 7 : e7a 1, 2 ; e11a 1 à 5 ; les n° 1, 2, 5 de e11a cochés « attend son choix »).
- G2 : `npx tsc --noEmit` : aucune erreur hors `functions/`.
- G3 : `npx vitest run port- --reporter=dot` : 7 fichiers, 81 tests, code 0 (`tests.txt`).
- Intégration rejouée : 16 fichiers, 158 tests verts (FloatingActions, floatingActionsShellLayout, productionCatalog, compactProduction, brewerNavigation, dashboardNavigation, etc.) et `fabActions`.
- Banc : `BANC OK 31 captures`, 0 geste sans effet (menu, nom du +, retour, archives, outils houblons), port 3106.
- Essais : 1 par critère ; une capture refaite après avoir remis l'interrupteur éteint au repos.

## Captures ouvertes (390 clair et cave, 1280 clair) : combien et quels problèmes
Ouvertes : e7a-repos 390 clair, 390 cave, 1280 clair ; e7a-archives-exclues 1280 ; e11a-repos 390 cave ; e11a-geste 390 clair et 1280 ; e11a-recettes-geste 390 cave ; e11a-outils-houblons 390.
Écarts restants (liste) :
1. Teintes de bière toutes ambrées, noms « ZZ … », J+4 : fixtures (déjà noté par p2).
2. Le toast « Compagnon hors connexion · mode local » recouvre le bas des captures : mode `?dev-local`, pas l'app réelle.
3. Les icônes du menu sont colorées par rubrique (code de l'app), pas en pastille grise comme la maquette : non listé dans le verdict, laissé.
4. Le nom accessible du bouton reste « Actions rapides » (le texte « Brassin » est visible) : changé, il casserait les tests existants qui le cherchent par ce nom ; à décider (label-in-name).
5. 1280 : le menu « Compagnon brasseur » dit « Brassins » en seconde ligne (`companionLabel` d'App) au lieu de « hors connexion · local » de la maquette : valeur donnée par App, hors voie.
6. 1280 cave et captures du bilan 1280 cave non refaites hors repos (banc réduit comme p2).

## DÉCISION À PRENDRE
« Outils houblons » n'apparaît que dans le menu des sous-onglets Brassins, Recettes, Atelier (l'action de l'écran y existe). Sur Volumes, le + n'a pas d'action d'écran (BX-4) et son menu reste l'ancien, sans « Outils houblons ». Recommandation : l'ajouter via `App.tsx` (hors de ma voie) si le brasseur veut l'atelier depuis Volumes.

CONNAISSANCE : un bouton + qui se nomme élargit la case des onglets par `--floating-actions-nav-dock` (déjà lue par `floating-actions.css`) ; la position droite doit alors être forcée à 0,75 rem, car la case `ActionDock` (64 px) reste calée à gauche de la case élargie.
LEÇON PROPOSÉE : aucune
