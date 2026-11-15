OK — le + selon l'écran (b1r) porté sur 14 écrans ; tsc 0, build vert, 14 tests d'intégration mis à jour, ET-PLUS OK

Worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, commits fbdaa4d4 (port), b4a125e3 (14 tests d'intégration), ffe868e8 (retouches après planches).

## Preuves (reprise du 15.11)
- tsc : `tsc.txt` vide. Build : `build.txt` exit 0 (relancé après les dernières retouches, verrou build.lock). `tests.txt` : 8 passed.
- ET-PLUS : `audit-plus-et.mjs` = `ET-PLUS OK` (14 écrans, 14 menus distincts, aux deux largeurs). Tag de départ non rejoué (pas de checkout) : sa capture `base-*` montre le menu unique d'avant.
- tests-tout (`tests-tout.txt`, 11 278 tests) : 3 rouges. `designTokens` (text-cave-300 dans depense/ et finance/, aucun de mes fichiers) et `virgule-transversale` : déjà rouges sur 84e4f5ff (archive vérifiée, `base-check-b1`). `hopV55RecipeColdContactHost` : rouge sous charge dans la suite complète, vert seul (7/7) : lenteur, pas lié.
- 14 tests d'intégration mis à jour (b4a125e3) : AppQuickActionReturn 2, brewerNavigation 3, dashboardNavigation 1, fix114 2, FloatingActions.behavior 2, floatingActionsShellLayout 4. Exigences gardées : action de l'écran d'abord, chaque geste appelle son callback une fois, focus, flèches, Escape, Tab, Compagnon distinct (aria-label « Compagnon brasseur · … », « hors connexion » lu dans son entrée), saisie rapide atteinte par Vente. Changé : libellés (Facture, Vente, Recette, Brassin), Compagnon en pied de feuille (plus en 2e ligne), plus de pastille `role=status` (remplacée par l'état dans l'entrée Compagnon, testé). fix114 Finances : « Recette » et « Brassin » ne sont plus au menu de Finances (b1r : Finances = écriture, facture, vente, rien d'autre), testé sur Facture et Vente. Deux rouges de dashboardNavigation (« Garde du mois précédent ») étaient intermittents : déjà rouges sur 84e4f5ff, verts aux 2 derniers passages.
- Captures : `captures/` (14 écrans × 390/1280 × clair/cave, repos et menu, toasts), serveur 3033 arrêté. Planches : `cote-a-cote-ecrans-clair-1/2/3.png` (12 écrans, app au-dessus, b1r dessous, `planches-ecrans.mjs`), `cote-a-cote-390-clair-brassins`, `-390-cave-brassins`, `-1280-clair-brassins`. Toutes ouvertes.

## « Combien et quels problèmes ? » (planches ouvertes) — 4 trouvés, 3 corrigés
1. Précision des tuiles « Depuis ici » coupée en bas (« sera LOT-001 », « achat reçu », « fût vendu »…) sur 9 écrans : corrigé (`min-h-16` au lieu de `h-16`), revu sur les planches.
2. Anneau de focus noir sur la 1re ligne à l'ouverture (absent de b1r) : corrigé, l'anneau ne se voit que si le + est activé au clavier (`focusVisible`) ; revu sur les planches (toucher réel).
3. Atelier : un second + rond (projets de matériel, `UpgradeWorkspace`, mobile) restait à côté de À venir : retiré quand l'Atelier passe sa demande de création (le + de Finances › Prévisions garde le sien). Revu.
4. NON corrigé, hors voie : pastille ronde noire à droite de l'en-tête (Header, voie port-feuilles) ; « Ajouter un fût » en ligne dans Fûts (FutsTab, hors Possède) : même fonction que Nouveau fût du menu ; à décider avec le pilote.
Écarts connus à b1r : « Densité » absente (pas de fonction), précisions « froment / pour B-032 / 25 L » absentes (voir manque), ids « LOT-001 » de l'app, fond d'écran vide (fixture dev-local), contenu des écrans = celui de l'app.
Limite du banc : sur les captures de toast, le + porte un anneau double (clic JS du banc qui rend le focus au + comme au clavier) ; absent au toucher.

## Hors « Possède »
- `src/ui/BrewerActivity.tsx` : ma ligne (la pastille « Compagnon hors connexion · mode local » renvoie `null`, `if (localOnly) return null`) est en place, NON commitée : le fichier porte aussi les changements de port-feuilles (ConversationsBoite, `useEnLigne`) ; à commiter avec les leurs, sinon la pastille flottante reste.
- `src/ui/finance/UpgradeWorkspace.tsx` : une condition (`createRequest === undefined`) sur le + mobile, commitée (ffe868e8).

## Fait (worktree `C:/Users/mrspa/AppData/Local/Temp/transversaux-port`, commit fbdaa4d4)
- `src/domain/plusEcran.ts` (neuf) : une table par écran (14 écrans, `Record` exhaustif), `plusMenuFor(onglet, sous-onglet, contexte)`, lettres fixes (N écran, E F V B R I L, H A U K T M, C compagnon). Précisions tirées de l'app : prochain brassin (`nextBatchId`, format de l'app « LOT-004 », pas « B-033 »), prochain fût (`nextRef('F')`), articles à commander (même compte que la pastille de Stocks). Inconnu ou 0 : aucune précision.
- `src/domain/fabActions.ts` : libellés d'écran raccourcis comme la maquette (« Nouvel article », « Copier la liste », « Nouvelle variété »). La table de menu est dans plusEcran.ts, pas dans fabActions.ts : `AppQuickActionReturn.behavior.test` remplace tout fabActions par un mock à une seule fonction.
- `src/components/navigation/` : `PlusSheet.tsx` (feuille 390 : « Sur cet écran » pleine à la couleur de rubrique, autres actions en demi-largeur, « Depuis ici » 0 à 3 tuiles, Compagnon en pied avec « hors connexion » ; liste à lettres au 1280), `navigation.css`, `useRail.ts`.
- `src/ui/FloatingActions.tsx` : un seul chemin de rendu (la feuille), voile sous la feuille, lettres de raccourci actives même pour un geste non montré, Compagnon « hors connexion » dans son entrée ; sans `menu` il dérive l'ancien contrat (action + facture/vente/recette/brassin) pour BrewPreview et les pages plein écran.
- `src/components/BottomNav.tsx` : à partir de 1024 px, rail de 88 px (le + en tête 56×44, onglets verticaux, pastille 1, Compagnon « hors connexion » au pied) ; publie `--main-navigation-height` à 0 en rail et `--rail-top`.
- `src/App.tsx` (éditions ciblées) : `plusMenu` et `runPlus` (chaque geste ouvre son écran, sous-onglet compris, puis sa création ; `key={navNonce}` sur StocksTab et ClientsTab), toast rangé au-dessus de la barre (2 largeurs), contenu décalé du rail, `horsConnexion`.
- `src/components/CreativeLabTab.tsx` : les 3 boutons « + Noter… / + Ajouter… » de l'Atelier retirés (le + flottant ouvre la même saisie, `newIdea`).
- `tests/unit/plus-ecran.test.ts` : 8 tests (14 écrans reconnus, action d'écran juste, ET-PLUS ≥ 12 compositions, pas de doublon, rien de perdu, précisions honnêtes, lettres uniques, page).

## Critères
- G1 : `tests.txt` : 8 passed, `TESTS OK`. tsc : `tsc.txt` vide (0 erreur).
- ET-PLUS : `audit-plus-et.mjs` (copie étendue de l'audit BX-4) : port = `ET-PLUS OK` (14 menus distincts sur 14, aux deux largeurs ; « hors connexion » dans chaque entrée Compagnon). Sur le tag de départ : NON REJOUÉ (pas de checkout permis) ; la capture `captures/base-*-brassins-menu.png` montre l'ancien menu identique partout (Compagnon, Entrer une facture, Vendre, Créer une recette), sans « hors connexion » : le script y échoue sur ces deux points.
- G2 : 3 planches ouvertes en image : `captures/cote-a-cote-390-clair-brassins.png`, `-390-cave-brassins.png`, `-1280-clair-brassins.png`. Le port colle à b1r (feuille, couleur de rubrique, tuiles, Compagnon pointillé, rail 1280 + lettres, cave).
- Build et `tests-tout.txt` : lancés en arrière-plan, pas finis à la rédaction (voir DEMANDE EXECUTANT).

## manque : (ce que la maquette montre et que l'app ne sait pas)
- « Densité » (saisir une mesure depuis le +) : « proposé » dans la NOTE, aucune fonction dans l'app ; pas de ligne ni de lettre M pour elle (M = Matériel).
- Précisions « froment » (Brassins, Bord), « pour B-032 », « pour 25 L », « essai 5 L », « IPA Nelson 25 L » : l'app n'a pas ce calcul ; remplacées par « N à commander » (même compte que la pastille de Stocks) et « sera LOT-004 ». Le fond d'écran vide (fixture dev-local) ne montre donc ni froment ni précision de courses.
- « Copier la liste · 3 articles » : l'app ne calcule la liste qu'à l'intérieur de StocksTab ; j'utilise le compte des articles à commander (peut différer de la liste copiée si des besoins de brassins s'ajoutent).
- Fond de b1r (courbe de densité, Prochain brassage, Cuves au 1280 ; Volumes ×1,25…) : décor de la maquette, non porté (déjà signalé par le critique).
- Libellés d'écran de la zone : ceux de l'app (« Atelier R&D », « Clients › Carnet », « Clients › Prix »).

## Doutes et limites
- Lettres du clavier : actives seulement quand la feuille est ouverte. Lettres hors maquette (H A U K T) inventées pour les gestes croisés.
- Un clic sur « Courses », « Houblon », « Article »… remonte StocksTab (nouvelle clé) : l'état local de cet onglet (filtre, recherche) est perdu.
- Anneau de focus noir sur la 1re ligne à l'ouverture (focus programmatique, comme avant) : absent de la maquette.
- Nom « Compagnon » ajouté au rail (bouton `Compagnon`) : visible seulement ≥ 1024 px.


CONNAISSANCE : un test d'intégration qui nomme un libellé de menu casse au port ; le menu du + est maintenant `plusMenuFor` (src/domain/plusEcran.ts), pas `fabActions`.
LEÇON PROPOSÉE : un port qui change un menu partagé grep d'abord les tests d'intégration qui nomment ses libellés (`grep "Actions rapides" tests`) et demande leur droit d'écriture dans la VOIE.
Essais : ET-PLUS 2, planches 3 (la 3e après correction), build 2.
