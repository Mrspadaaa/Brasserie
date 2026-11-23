OK — banc avec le + de l'app, À venir aligné, barre opaque ombrée, icône d'idée qui ouvre le carnet

Lot corr2-L3-banc-stocks-calendrier, correction 2, 18.11. Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
Aucun déploiement, aucun push, aucune donnée réelle, aucun appel à Gemini. Le dist n'est pas touché : le build est sorti dans le scratchpad.
Captures et scripts : `Brasserie/work/missions/2026-11-17-port-carnet/voies/corr2-L3-banc-stocks-calendrier/` (`cap/`, `captures.cjs`,
`lancer.sh`, `emu/`, copie de `vision-2/emu`). Ce rapport existe aussi dans ce dossier.

## Fichiers écrits (port-carnet, tous dans Possède)
- `src/design/CarnetsPreview.tsx` : le banc monte la `BottomNav` et le `FloatingActions` de l'app (les composants eux-mêmes, L26), avec
  le menu `plusMenuFor('stocks', 'carnets')` et `ACTION_CARNETS`. « Nouvelle idée » met le focus dans le champ du bas (`focusChamp`,
  comme StocksTab). Le contenu se place dans le même conteneur que le `<main>` de l'app sur Stocks. La barre de segments reprend `BARRE_MATERIEL`.
- `src/ui/finance/UpgradeWorkspace.tsx` : quand `vue` est donné (Stocks › Matériel seulement), la page est posée dans `COLONNE_MATERIEL`,
  le conteneur de `.cn-page`. L'intérieur de kh1r n'est pas touché. Le fichier exporte aussi `BARRE_MATERIEL` et `BARRE_SUR_DEFILEMENT`.
- `src/components/tabs/StocksTab.tsx` : la barre « Parc · À venir · Carnets · Réalisés » prend `BARRE_MATERIEL`, plus `-mb-1` hors de Parc.
- `src/components/tabs/CalendrierTab.tsx` : `toucherIconeIdee`, posé en `onClickCapture` sur `cal-entete-zone`.
- Tests : `tests/unit/carnetsBanc.test.ts` (passe en jsdom, +2 tests), `tests/integration/stocksTabBoucle.test.tsx` (+3),
  `tests/integration/calendrierGestes.test.tsx` (+4).
- `src/domain/carnets/fixture.ts` n'est pas modifié : il suffisait.

## Problème → fait → preuve
1. **d1280-5, m390-4b (+ volant absent du banc, état 46)**
   - Fait : le + de l'app est au banc, en bas à droite, juste au-dessus des onglets. À 1280, il se place au coin bas droit du contenu, à côté du rail.
   - Preuve : tests `carnetsBanc` « le banc monte le + de l'app » et « Sur Carnets · Nouvelle idée … focus ». Journal `cap/journal-banc.txt` :
     - à 390, + en x 322 à 378, y 736 à 792, et onglets en y 804 à 844 ;
     - menu « Nouvelle idée Sur Carnets Écriture … Partout » ;
     - après le toucher : `TEXTAREA placeholder=Une idée, un besoin…` a le focus, à 390 comme à 1280 et dans les deux thèmes.
   - Captures ouvertes : `m390-clair-46-plus-repos` (côte à côte avec p2:g05-1 : même place, à droite du champ, au-dessus de Stocks),
     `m390-clair-46-menu-ouvert`, `d1280-clair-46-menu-ouvert`. Les captures sombres sont écrites ; le journal donne la même géométrie et le même menu.
2. **d1280-4 (À venir collé au bord gauche, « + Besoin » au bord droit)**
   - Fait : `COLONNE_MATERIEL` = `px-3 pt-2 pb-4 min-[900px]:mx-auto min-[900px]:max-w-[760px]`, l'équivalent exact de `.cn-page`
     (8, 12 et 16 px ; 760 px centrés dès 900 px).
   - Mesure DOM (journal) :
     - à 1280, carte de Carnets x 317 à 1051 ; carte d'À venir x 316, « + Besoin » jusqu'à 1052 (le bord de la vue est à 1280) ;
     - à 390, Carnets x 25 et À venir x 24 ;
     - l'écart de 1 px vient de l'élément mesuré côté Carnets (`.cn-carnet-bloc`).
   - Test `stocksTabBoucle` : la colonne porte cette classe, « + Besoin » est dedans, et `carnets.css` dit bien `padding: 8px 12px 16px`
     et `max-width: 760px` à 900 px.
   - Captures ouvertes : `d1280-sombre-30-a-venir`. Écrites : `d1280-clair-30-a-venir`, `m390-*-30-a-venir`.
3. **m390-6 (le contenu passe sous la barre sans fondu, états 10, 11, 36)**
   - Fait : la barre est opaque (`bg-cave-900` : rgb(245,245,245) en clair, rgb(26,22,19) en sombre) et posée au-dessus du contenu (z-10).
     Elle porte l'ombre que l'app donne déjà à ce qui flotte : `shadow-lift` (DESIGN.md « Elevation », barre fixe de ProductionCatalog).
     Avec `-mb-1`, la liste commence au bord bas de la barre, sous son ombre, et non plus dans l'écart de 4 px. Aucun fondu n'est inventé.
   - Preuve : test `stocksTabBoucle` sur les classes. Journal : `ombre … rgba(0,0,0,0.16) 0px 8px 24px -12px` en clair, 0.7 en sombre.
   - Captures ouvertes : `m390-clair-10-defile`, `m390-sombre-10-defile`.
4. **L4-2 (57b : l'infobulle prend le toucher sur l'icône, le carnet ne s'ouvre pas)**
   - Fait : CalendrierTab prend le clic à la capture. Si le doigt tombe sur l'ampoule de la semaine, ou dans un carré de 44 px centré
     sur elle, il appelle `ouvrir({ ecran: 'carnets', id })`, puis `onOpenCarnet`. L'infobulle ne s'ouvre pas.
   - Le toucher sur S47 (la date), l'appui long (Noter une idée, L1 b), le + volant et sa feuille ne changent pas.
   - Preuve : 3 tests de `calendrierGestes` :
     - ampoule touchée : `onOpenCarnet(id)` une fois, pas d'Agenda, pas d'infobulle ;
     - S47 touché hors de la cible : la date paraît, rien ne s'ouvre ;
     - S48 sans idée : la date paraît.
   - Rejeu `?dev-local` sur l'émulateur `demo-carnet-l3`, à 390 tactile : idée notée par le + du calendrier, ±, puis un toucher à
     12 px à droite et 10 px sous le centre de l'ampoule (hors des 14 px de l'icône). Résultat : `segment Carnets 1`,
     `carnet ZZ TEST — idée du calendrier S47`, aucune infobulle de semaine.
   - Captures ouvertes : `m390-clair-devlocal-57a-plus-moins`, `m390-clair-devlocal-57b-carnet-ouvert`.
5. **L4-6 (« À venir 2 » sur un émulateur vide)**
   - Origine trouvée : ce sont des données de démo semées par l'app.
     - Au premier lancement, `runMigrationIfNeeded` → `buildEntries` écrit `defaultCreativeItems` (`storage.ts:184`). Parmi eux,
       CR-001 « Système d'embouteillage 4 becs inox » et CR-002 « Chambre chaude régulée », de type `equipment`.
     - `mergeUpgradePlans` (`upgrades.ts:26`) en fait deux plans « idée » non réalisés, et À venir les montre.
   - Le compte suit déjà la règle demandée (`readSegments` : draft ou active, et non `estRealise`), qui est aussi celle de la liste
     d'À venir. Le 2 est donc juste par rapport à ce qu'À venir montre. Rien n'est supprimé, rien n'est changé.
   - Preuve : journal dev-local « 47 segment : Parc À venir 2 Carnets 0 Réalisés 0 ». À venir montre ces deux cartes (capture
     `m390-clair-devlocal-47-a-venir`, écrite, non ouverte). Test `stocksTabBoucle` « À venir n » : le plan payé et le plan annulé
     sont exclus, l'idée de l'ancien Atelier est comptée, et le compte égale la liste (À venir 2, Réalisés 1).
6. **L4-3 (57c : double point)** : il était déjà corrigé (`replace(/\.$/, '')`), le test le prouve, et rien n'a été changé.
   - Test : appui long sur S48, `textContent` = « S48, 23 – 29 nov. Elle arrive dans le carnet. ».
   - En dev-local : « S47, 16 – 22 nov. Elle arrive dans le carnet. » et « S48, 23 – 29 nov. Elle arrive dans le carnet. ».
   - Capture ouverte : `m390-clair-devlocal-56-ECHEC.png`. Malgré son nom, c'est la feuille ouverte, prise au premier essai quand le
     sélecteur du script ratait.

## Critères
- (a) `npx vitest run tests/unit/carnetsBanc.test.ts tests/integration/stocksTabBoucle.test.tsx tests/integration/calendrierGestes.test.tsx tests/unit/calendrier*.test.ts` :
  `Test Files 10 passed (10)`, `Tests 178 passed (178)`.
- `npx tsc --noEmit -p tsconfig.json` : sortie 0, aucun message.
- Build : `npx vite build --outDir <scratchpad>/dist-l3` exit 0, puis `check-build-flags.mjs` donne « DRAPEAUX OK » ×3.
  - `npm run build` n'a pas été lancé : il écrit dans `dist`, que les autres lots partagent.
  - `check-private-research.mjs` exige `dist`, il n'a pas été joué.
  - Ce build a précédé le dernier changement (`-mb-1`, une classe). tsc et les tests ont été rejoués après ce changement.
- (b) Captures ouvertes : celles nommées plus haut. Écrites et non ouvertes : les sombres du 46 (`m390-sombre-46-*`, `d1280-sombre-46-*`),
  `d1280-clair-30`, les 30 à 390, et le 47 du dev-local.
- Essais :
  - tests : 1 essai par critère, tous verts du premier coup ;
  - captures du banc : 2 passes, la 2e après `-mb-1` ;
  - dev-local : 4 passes (délai de capture, sélecteur du + du calendrier, puis champ de la feuille, qui est un `textarea`).
- Serveurs arrêtés : aucun port 60441, 60442, 8080 ou 9099 n'écoute après les passes.
- `git status` : seuls mes 7 fichiers changent. Les autres modifications sont celles des autres lots.

## Doutes et limites
- La cible de 44 px de l'ampoule est une zone calculée au clic dans CalendrierTab, pas un vrai bouton : l'icône vit dans le bouton de
  la semaine (`BandeSemaines.tsx`, hors Possède), et un bouton ne peut pas en contenir un autre.
  - Au clavier, rien de neuf : le libellé de la semaine dit « idée du carnet », mais Entrée donne la date.
  - Si une semaine porte plusieurs idées, le toucher ouvre la première (ordre de `iconesIdees`).
- Au repos, l'ombre `shadow-lift` est discrète en clair (alpha 0,16), comme celle de l'app. Elle se voit surtout quand le contenu passe dessous.
- À 390, la marge d'À venir passe de 8 à 20 px, comme les cartes de Carnets. C'est voulu (« mêmes marges »), mais l'écran figé
  p2:h05-9 montre environ 12 px. À juger à côté de lui.
- Le banc place désormais son contenu comme le `<main>` de l'app (rail au 1280). Les captures de vision-2 (x = 0) ne se comparent plus pixel pour pixel.

DÉCISION À PRENDRE : la cible de l'ampoule (R48).
- Options :
  - A : garder la prise au clic dans CalendrierTab (fait, aucun fichier du port calendrier touché) ;
  - B : faire de l'ampoule un vrai bouton frère dans `BandeSemaines.tsx`, de 44 px, joignable au clavier. C'est un fichier du port calendrier.
- Recommandation : B, au prochain passage du port du calendrier, puis retirer `toucherIconeIdee`. A tient d'ici là.

CONNAISSANCE : toute base neuve, en ligne comprise, reçoit au premier lancement CR-001 et CR-002 (`defaultCreativeItems`, type
`equipment`), que `mergeUpgradePlans` montre comme deux besoins dans Stocks › Matériel › À venir. D'où « À venir 2 » sur un émulateur vide.
LEÇON PROPOSÉE : aucune
