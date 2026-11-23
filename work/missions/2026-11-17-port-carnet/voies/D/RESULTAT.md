ECHEC — D1, D2 et D7 non tenus : plafond de tours atteint, 3 tests rouges, captures et build non faits

Voie D (assemblage, navigation, sortie, banc), 17.11. Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
Les lots A, B et C n'existaient pas au départ : D les a attendus environ 15 minutes, puis a assemblé sur leurs fichiers encore en cours.
Ce qui suit est donc à rejouer quand A, B et C seront rendus.

## Fichiers écrits (tous dans Possède)

- `src/domain/finance/types.ts` : seulement `upgrade.sourceCarnetId?` et `upgrade.sourceCarnetTitre?`.
- `src/ui/finance/UpgradeWorkspace.tsx`
  - `LigneCarnet` : « Ajouté le … · du carnet X · Ouvrir le carnet ». Si le carnet manque : « … · supprimé », sans Ouvrir. Les carnets
    archivés comptent comme présents, donc Réalisés › « Ouvrir le carnet » rouvre l'idée.
  - Props `vue`, `onVue` et `onOpenCarnet` : la vue est tenue par le segment de Stocks. Les onglets internes cèdent la place. Archives
    reste atteint par un lien « Archives › » sous Réalisés (D-1).
  - Hors de Stocks (Atelier, Prévisions), « Ouvrir le carnet » envoie l'événement `affinee:ouvrir-carnet`.
- `src/components/tabs/StocksTab.tsx`
  - Dans Matériel, segment « Parc · À venir · Carnets · Réalisés » avec les comptes. Le parc est en tête (§ Points ouverts 1). Le dernier
    segment est gardé dans `stocks_materiel`, et le premier usage s'ouvre sur Parc.
  - À venir et Réalisés rendent l'`UpgradeWorkspace` existant. Carnets charge `CarnetsVue` à la demande (lazy).
  - Sur Carnets, l'écran remonte le sous-onglet `carnets`.
  - `openCarnetRequest` ouvre un carnet précis. `createRequest` « newIdea » met le focus dans le champ du bas.
- `src/App.tsx`
  - Sur Carnets, le + porte `ACTION_CARNETS` ; « newIdea » y reste sur Carnets au lieu d'ouvrir l'Atelier.
  - `ouvrirCarnet(id)` mène à Stocks › Matériel › Carnets avec ce carnet ouvert. Il est branché sur `affinee:ouvrir-carnet` et sur
    `CalendrierTab.onOpenCarnet`.
- `src/domain/plusEcran.ts` : `ACTION_CARNETS` (« Nouvelle idée »). `plusMenuFor` la place en action sur le chemin « Stocks › Matériel ›
  Carnets », sans autre geste. `EcranId` ne change pas, ce qui évite de casser `recherche/modele.ts`.
- `src/domain/calendrierAjout.ts` : `enregistrementIdee` construit un `carnet` par `carnetDepuisPhrase` (id `CARNET-…`). C'est toujours
  le même `Enregistrement`, et le commentaire E36 est corrigé. `grep -n "'recipe-idea'" src/domain/calendrierAjout.ts` est vide.
- `tests/unit/calendrierAjout.test.ts` : seulement le cas E36, réécrit pour R48. 19/19 verts.
- `src/components/tabs/CalendrierTab.tsx` : prop `onOpenCarnet`, et `ouvrir({ ecran: 'carnets', id })` l'appelle. Aucun texte ni aucune
  feuille ne change.
- `src/main.tsx` : `?preview=carnets`, sous `import.meta.env.DEV` seulement.
- `src/design/CarnetsPreview.tsx`
  - `BancCarnets` : magasin mémoire, fixture « ZZ TEST — … », plans en mémoire, IA simulée.
  - `CarnetsPreview` : bandeau « Banc — données simulées », paramètres `&vide=1`, `&hors-ligne=1`, `&ia=eteint|echec|lent`, `&aides=0`,
    `&theme=sombre`, `&realise=1`.
  - `BandeauTaches` (`&taches=1`) : 5 tâches chronométrées du premier toucher au « ✓ ». Un geste compte un toucher ou une Entrée. Les
    temps sont gardés dans `localStorage` (`banc-carnets-taches`) et se copient en texte.
- `src/ui/carnets/CarnetsVue.tsx`, le conteneur :
  - le magasin, avec `ecouter` ;
  - le rangement (`creerRangement`), avec écriture locale puis remplacement par l'IA en une écriture annulable ;
  - la navigation liste, carnet, article, comparer, choisir, renommer, supprimer ;
  - Annuler par l'inverse, et `navigator.onLine` ;
  - `critereQuiTranche` passé en `suggestion`, `consequenceApercu` en `consequence`, `liensDe` en `liens`, `tableau()` passé tel quel à
    `Comparer` et `CarnetOuvert` ;
  - Suppression v2 : `liensQuiRetiennent`, `detacherPlan`, `archiverCarnet` et `supprimerCarnet` ;
  - « Envoyer dans À venir » : un plan à clé `PLAN-CARNET-<id>`, écrit seulement s'il manque, puis `poserSortie` ;
  - `aidesCourantes()` passées aux vues, et la photo par `reduirePhoto`.
- `tests/integration/carnetsParcours.test.tsx` : 8 tests, dont 5 verts et 3 rouges (détail ci-dessous).

## Critères, sortie décisive

- **D1**
  - `npx tsc --noEmit` : il ne reste aucune erreur dans les fichiers de D.
  - Il reste des erreurs ailleurs. `src/ui/calendrier/frise/DetailChose.tsx:34` : son `Record` n'a pas la clé `'carnets'`, que le lot A a
    ajoutée à `CibleOuverture.ecran`. Le fichier n'est possédé par personne. S'y ajoutent `seedData` et `hasOwn`, d'avant ce port.
  - `npm run build` et le `grep -c` sur `dist` n'ont pas été lancés.
- **D2** : rouge. « embouteillage », les deux façons, le critère, les 6 liens, la note et « au plus 2 gestes par ajout » passent tous.
  Puis, depuis la liste, frigo, ventilation et évier ne créent pas 3 carnets : `expected 2 to be greater than or equal to 4`. Le
  rattachement (IA simulée ou `rattacher`) range ces phrases dans un carnet existant. C'est à trancher : réglage du lot A ou B, ou
  `ecrireLocal` de D.
- **D3** : partiel. La pastille « À venir · … » du Frigo s'affiche (vert). La clé est idempotente dans le code, mais non testée par
  l'interface. L'affichage dans À venir n'est pas testé.
- **D4** : le + sur Carnets est vert (test de `plusMenuFor`). Le parcours dans l'app (`?dev-local`) n'a pas été joué.
- **D5** : non rejoué. Les tests de Stocks ne l'ont pas été non plus.
- **D6** : serveur non lancé, donc aucun processus laissé.
- **D7** : rouge. Le test cherche un bouton nommé « Supprimer » sur `CarnetOuvert`, mais l'entrée est derrière un menu ···. La suite
  (« 1 lien le retient », « Garder le plan sans ce carnet », Archiver) n'est donc pas atteinte. G8 sur la fixture Ventilation
  (« peut trancher ») est vert. Aides du banc et de la production : vert.
- **D8** : le bandeau de tâches est écrit. Il n'a pas été joué à 390.
- **D9**
  - Dans la donnée, c'est vert : un `carnet` en S47, au lundi 2026-11-16, sans aucun `recipe-idea`, montré en « Idée ». L'appui long en
    S48 donne le lundi 2026-11-23.
  - Ouvrir un carnet depuis une icône est branché dans `CalendrierTab`. En revanche, **l'icône d'idée de la bande ne reçoit aucun
    toucher** : elle est décorative (`aria-hidden`), dans `src/ui/calendrier/entete/BandeSemaines.tsx`. Ce fichier n'est pas dans Possède.

Essais : 3 rejeux de `carnetsParcours.test.tsx`. Le plafond de tours a été atteint ; voie à reprendre.

## Doutes et limites

- `CarnetsVue` a été écrit contre les fichiers de A, B et C pendant qu'ils changeaient. Leurs props sont lus le 17.11 vers 21:45.
- Depuis la liste, une phrase seule crée un carnet. Une note de plusieurs lignes va à `rattacher`, ou ouvre un carnet neuf par ligne
  (DÉCISION 3 d'ASSEMBLAGE).
- `ressembleCritere` (G25) est calculé en local par `analyserLigne`, faute de champ `commeCritere` gardé sur la note.
- Le banc n'a pas l'en-tête de l'app : il montre `CarnetsVue` seul, sous un bandeau « Banc ». L'habit complet se voit dans `?dev-local`.
- Aucune capture n'a été prise ni ouverte (L12) : rien de visuel n'est validé.

## DÉCISION À PRENDRE

1. **Icône d'idée cliquable (R48, D9).** Il faut un toucher sur l'icône de `BandeSemaines.tsx`, avec un `onOuvrirIdee(lundi)` rendu par
   `EnTete.tsx`, qui appellerait `ouvrir(icone.ouvre)` dans `CalendrierTab`. Options :
   - (a) une voie neuve possède ces deux fichiers (recommandé) ;
   - (b) on laisse l'icône décorative.
2. **`DetailChose.tsx:34`** : la clé `carnets` manque dans son `Record` (`LIBELLE` des cibles). Elle vient du lot A. Recommandation :
   ajouter `carnets: 'Ouvrir le carnet ›'` par le lot A ou par une voie neuve.
3. **Premier segment de Matériel.** Défaut actuel : Parc. Il ne casse pas `materielFicheStocks`, et rien ne se perd (D-41). Le figé
   p2:g05-1 montre Carnets actif. Recommandation : garder Parc jusqu'au choix « Parc » de la voie E.

## Reprise

`REPRISE : work/missions/2026-11-17-port-carnet/voies/D/RESULTAT.md`, dans un agent neuf, une fois A, B et C rendus. Les étapes :

1. Corriger les deux tests rouges :
   - D7 : ouvrir le menu ··· de `CarnetOuvert` avant « Supprimer » ; lire le nom du bouton dans `CarnetOuvert.tsx`.
   - D2 : vérifier pourquoi frigo, ventilation et évier sont rattachés. Lire `iaSimulee.ts`, le `ecrireIA` de `CarnetsVue` (la
     destination `carnetNeuf`) et `SEUIL_RATTACHER`.
2. Ajouter le test d'interface de D3 : « Envoyer dans À venir » deux fois donne `plans.length === 1`.
3. Lancer `npm run build`, puis `grep -c "preview=carnets\|CarnetsPreview" dist/assets/*.js` et `grep -c "VITE_CARNET_AIDES"
   dist/assets/*.js`.
4. Rejouer D5 : `npx vitest run tests/integration/AppRoutePile.test.tsx tests/integration/FloatingActions.behavior.test.tsx
   tests/integration/materielFicheStocks.test.tsx tests/integration/dashboardNavigation.test.tsx`.

## DEMANDE EXECUTANT

À faire après la reprise, quand D1 est vert.

1. Lancer `npm run dev` dans le worktree `port-carnet`.
2. Capturer à 390 tactile, en thème clair puis sombre :
   - `?preview=carnets` (fixture) ;
   - `&vide=1` ;
   - la fixture Ventilation ouverte, champ au focus (bulle G8) ;
   - `&taches=1`, en jouant les 5 tâches ; relever le texte copié (temps et gestes).
3. Dans `?dev-local` :
   - Stocks › Matériel › Carnets depuis le menu, à 390 et à 1280 ;
   - le + sur Carnets (« Nouvelle idée ») ;
   - Calendrier › + › « Noter une idée en S47 » › « ZZ TEST — doseur de sucre », puis Stocks › Matériel › Carnets ;
   - puis retirer les « ZZ TEST ».
4. Arrêter le serveur. Ouvrir chaque capture, côte à côte avec p2:g05-1, p2:i02-2 et p2:h05-9.

CONNAISSANCE : `EcranId` (`plusEcran.ts`) nourrit un `Record` exhaustif dans `src/components/recherche/modele.ts`. Un écran ajouté là
casse la recherche : un sous-écran passe donc par le sous-onglet, pas par un `EcranId` neuf.

LEÇON PROPOSÉE : une voie d'assemblage (D) ne part qu'après les lots dont elle dépend, rendus OK. Lancée en même temps, elle use son
plafond à attendre et à lire des interfaces qui bougent (17.11, voie D du carnet : plafond atteint avant le build).
