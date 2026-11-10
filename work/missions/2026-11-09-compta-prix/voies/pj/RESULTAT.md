OK — Prévisions dit « N achats de matériel pas comptés » et renvoie ; Atelier dit l'état de chaque projet et renvoie à Prévisions (CP-13)

## Fichiers écrits
- `src/ui/finance/UpgradeWorkspace.tsx` : `dansLesPrevisions(plan)` (actif ET daté ET budgété) et `projetsPasComptes(plans)` exportés ; état « pas dans les prévisions » / « dans les prévisions · nov. 2026 » ajouté à la petite ligne existante (À venir seulement) ; UNE ligne-renvoi « Datés et budgétés, ils entrent dans Finances › Prévisions » en tête de liste ; prop `onVoirPrevisions` (feuille ouverte depuis Prévisions : elle se ferme) ; sinon événement annulable `affinee:ouvrir-finances` ; sans écouteur, un message `role=status` dit où aller.
- `src/ui/finance/previsions/Previsions.tsx` : ligne `.prv-depart` « N achat(s) de matériel pas compté(s) › » + « date ou budget à compléter : A 3 200,00, B 350,00 +1 » (ou « à inclure : … » si tous sont complets mais pas inclus) ; ouvre la feuille « Mes projets de matériel ». Placée sous « Rien de prévu » (les deux restent vraies).
- `src/App.tsx` : l'écouteur `affinee:ouvrir-finances` seul (+ un état `financeTabRequest`, la prop passée à FinancesTab, `setActiveTab('finances')`, `preventDefault`).
- `src/components/tabs/FinancesTab.tsx` : prop `ongletRequest` (`synthese`, `operations`, `previsions`, `annuel` ; inconnu ignoré ; une demande ne rejoue pas).
- `src/ui/finance/upgrades.css` (hors liste Possède, 4 lignes : `.upgrade-prev-oui`, `.upgrade-renvoi` ; à signaler).
- `tests/integration/projetsPrevisions.test.tsx` (neuf, 14 tests), `voies/pj/capturer.mjs`, `captures/` (18 images), `run-*.txt`.
- Calcul inchangé : `forecast.ts` non touché.

## Critères
- Rouge d'abord sur HEAD 6449c986 : `tests-rouge.txt` = 10 échecs sur 14 (les 4 « absence de ligne » passent à juste titre).
- `tests.txt` : 24 fichiers, 237 tests verts (le neuf + tous les tests qui lisent UpgradeWorkspace, Previsions, FinancesTab, App, CreativeLabTab, ProductionTab).
- `npx tsc --noEmit` hors modules exclus : 0 erreur. `npx vite build --outDir $TEMP/pj-build` : vert.
- Serveur vite 3007 arrêté (0 écoute).

## Vu en vrai rendu (`?dev-local&finance-demo=reel` + ses 3 projets « ZZ » en mémoire ; 390 clair, 390 cave, 1280 clair)
- Prévisions : « 3 achats de matériel pas comptés › / date ou budget à compléter : B100 aio brewtool 3 200,00, Chambre chaude régulée 350,00 +1 » ; touché, la feuille s'ouvre ; son renvoi la ferme (onglet reste Prévisions, feuille absente).
- Atelier › Matériel › À venir : « Date à choisir · Prêt à acheter · pas dans les prévisions » ; renvoi en tête ; touché, passage de Brassins à Finances › Prévisions (vu : onglet « Prévisions » sélectionné, ligne des 3 achats).
- B100 daté 15.12 et inclus (mémoire) : sa marche « B100 −3 200, 15.12 » est dans l'escalier, la ligne ne compte plus que 2 achats, Atelier dit « dans les prévisions · déc. 2026 ».
- Ouvertes : 1-previsions 390 clair, 2-feuille 390 clair et cave, 3-atelier 390 clair et 1280 clair, 5-previsions-b100-inclus 1280, 6-atelier 390 clair.

## Combien et quels problèmes ?
Ouverts sur le rendu : 4 problèmes.
1. Premier jet : l'état collait au mot précédent (« Prêt à acheterpas dans les… ») car les spans du bloc sont en ligne : corrigé par un séparateur « · » dans la même ligne (comme demandé), recapturé 390 clair et 1280 clair.
2. À 390, dans la démo « reel » sans solde, quatre lignes pointillées s'empilent (Solde à renseigner, Tendance à calculer, Rien de prévu, projets) : chacune dit une cause distincte et existe par un CP précédent ; lourd au premier plan. Piste : fondre « Rien de prévu » et la ligne projets quand la prévision est plate (dit dans le brief « ou à sa place »), non fait pour ne pas changer CP-7.
3. « dans les prévisions · déc. 2026 » répète le mois déjà dit par « décembre 2026 » au début de la même ligne (forme exigée par le brief et le test (c)) ; passe sur 2 lignes à 390.
4. Le détail « date ou budget à compléter : … » compte les projets « Idée » sans prix (« à estimer » : le montant est omis, jamais 0,00) ; au 1280 le détail passe à 2 lignes car le titre du 2e projet est long.
Non ouvertes : 1-previsions et 4-apres-renvoi en cave et 1280, 5 et 6 en cave (même code).

## Doutes et limites
- « Pas compté » = projet draft ou actif non prêt (à compléter). Un projet complet mais encore brouillon (case « Inclure » non cochée) est aussi dit « pas compté » (« à inclure ») : c'est vrai du domaine (`plan.status !== 'active'`). Lecture élargie signalée.
- Le brouillon `status:'draft'` complet affiche « pas dans les prévisions » avec la case « Inclure dans mes prévisions » juste dessous : le geste est déjà là.
- Le renvoi émet l'événement ; seul App l'écoute. Dans les tests, App n'est pas monté entièrement (mocks lourds) : l'écouteur App est vu en vrai rendu (Brassins → Finances › Prévisions), la prop `ongletRequest` est testée.
- Le critère en cave/1280 : 1280 cave non pris (non demandé).

CONNAISSANCE : un projet de matériel n'entre dans les prévisions que s'il est « actif » (case Inclure cochée) ET daté ET budgété ; un brouillon, même complet, est écarté sans avertissement visible — d'où CP-13. Les fichiers du dépôt sont en CRLF : les éditions en script doivent tolérer `\r\n`.
LEÇON PROPOSÉE : aucune
