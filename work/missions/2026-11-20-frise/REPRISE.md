# Session 13 — W0c commité, V-CAL G3/RENOMMER/C1/D2/D401 commités ; 32 tests d'intégration rouges (21.11, arrêt à 160 k)

## Fait (commité, branche claude/port-carnet-1711)
- `30beb3125` W0c : rejoué sur `en-ligne/2026-11-21-tour7` : les 7 étapes rouges (11 KO). Correctif de banc : au doigt, `Input` rend un
  `<textarea data-single-line>` (Input.tsx l. 113) ; `champNom` cherche `input,textarea` dans tous les dialogues visibles, et attend 3 s.
- `85538391c` V-CAL : report du worktree `vc` (D401, nom posé, horizons à la place du carrousel, puce D2) + `achatsPasses(transactions)`
  (calendrierAjout.ts) dans `ctxAjout` de CalendrierTab + 4 tests unitaires (calendrierAjout.test.ts, 29 verts).
- `a50c28243` G3 (Rangee `onToucherVide`, Frise, CalendrierTab `toucherVide` : Travaux/Activités créés d'emblée, autres rangées : leur feuille).
- `22d97b5a1` RENOMMER-EVT (DetailChose `onRenommer` → `RenommerSurPlace as="span"` ; CalendrierTab : patch `title`, Annuler).
- `699882943` C1 (`b.parHorizon` hors fenêtre : `voirEtendue` d'office).
- Worktree `vc` retiré (jonction node_modules enlevée d'abord par `rmdir`), branche `vcal-tmp` supprimée.
- Parcours `--etape` sur l'arbre : G3, RENOMMER-EVT, C1-GLISSER, D2-CAL, K2, TRAVAUX-SANS-MONTANT verts. K3-SUITES rouge.

## INCIDENT (à dire au pilote)
L'index est PARTAGÉ avec la voie transverse (même worktree). Un `git commit --amend` a avalé ses 33 fichiers indexés (elle venait de faire
`reset HEAD~2`). Réparé : commit G3 refait par index temporaire sur `02bdcffba`, `reset --soft` : son index est revenu tel quel (33 fichiers
indexés). Désormais commit par `<S>/commit-chemins.sh <msg> <chemin>[=<source>]` (index temporaire, n'avance HEAD que s'il n'a pas bougé).

## Rouge, à faire dans l'ordre
1. **32 tests d'intégration rouges** (8 fichiers : calendrier-onglet 7, calendrierPlus 6, calendrierFrise 6, calendrierLotA 4, calendrierFeuille 3,
   calendrierJalonsLies 3, calendrierGestes 2, calendrierLotC 1 ; journal `<S>/vt-cal.out`). Cause probable : ils jouent l'ancien carrousel
   `.cal-f-semaines` (S20 puis S40, fenêtre, « Mettre de côté », « Plus de détails › » daté, « Voir S20 › »), retiré par C1. DÉCISION À PRENDRE :
   la fenêtre S20 → S40 et les jours actifs ne se choisissent plus dans la feuille (seulement au glisser du bord ?). Vérifier que la feuille garde
   une voie pour la fenêtre (Travaux sur 21 semaines) ; sinon réintroduire un réglage de fin, puis réécrire ces tests au nouveau contrat.
2. **K3-SUITES** : le brassin posé (Blonde d'automne, S47) n'a ni jalon fermentation (recette sans `fermentation[]` chiffrée : `jalonsBrassin`
   l. 759 ne pose « Fermentation » que si `total > 0`) ni « coût à venir » (barre sans montant ni étiquette ; à diagnostiquer :
   `planRecipeBatch` pose-t-il `brewDate` → `pasCommence` faux, useDonneesCalendrier l. 222 ?). Piste : poser « Fermentation » à J+1 dès que le
   cycle est connu ; coût par `estimateBrewBudget` (brewBudget.ts l. 318) ou « coût à venir ». Capture `<S>/v1/09c-k3-brassin-pose.png`.
3. VUE-SAUTE, précision semaine/mois de la date du carnet (spécifications à relire dans BUGS.md).
4. Parcours complet fini : ECHEC (2) : K3-SUITES, et G3 (« toucher la case vide S48 de Travaux ne crée rien ») alors que G3 est vert seul :
   après les sections 1 à 10, une chose reste choisie ou S48 n'est plus vide ; lire `<S>/full/09c-g3-*.png`. Captures `<S>/full/`. Puis vision 390 et 1280, deux
   thèmes ; build `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` (tsc a une erreur V-RECETTE : `src/domain/hopIndex/v4/cases.ts:85`).
5. `EnTete.tsx` (juger) toujours non commité ; TRANSVERSE-RESTE.md (Calendrier) pas traité.
`<S>` = `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad`.

# Session 12 — W0c écrit (non commité, non rejoué), V-CAL commencé dans un worktree temporaire (21.11, arrêt à 200 k)

## État exact
- fin2 tournait encore à 12:34 (`<S>/f2.out` : « tsc code 0 », vitest entier en cours). Un job d'attente (`until grep "build parcours code"`)
  était lancé. RIEN n'a été édité dans `port-carnet/src/`. ATTENTION : la branche bouge sous nos pieds (F-APPUI a commité 7cfa3aa51 pendant la session).
- W0c ÉCRIT dans port-carnet, NON COMMITÉ, NON REJOUÉ (`node --check` OK, fixture vérifiée) :
  `scripts/parcours/calendrier.mjs` : `--etape` (`seules`, `tout`, `joue()`), sections 1 à 10 gardées par `if (tout)` ; nouvelle fonction
  `etapesVcal()` (section 9c, appelée toujours, après bugsWorkflows) : G3, RENOMMER-EVT, C1-GLISSER, D2-CAL, K2, K3-SUITES, TRAVAUX-SANS-MONTANT.
  `scripts/parcours/fixtures/calendrier.mjs` : `T-ZZ-POMPE` (« ZZ TEST Pompe de brassage », 420, payé, −300 j) et `CARNET-ZZ-K2`
  (« ZZ TEST Projet chambre froide », carnet daté au lundi de +91 j).
  Contrats choisis : G3 = toucher une case vide de la piste Travaux crée « Travaux · S<n> » sans feuille, message Annuler qui le retire.
  RENOMMER-EVT = dans `[aria-label="Détail : Ranger la réserve"]`, toucher le titre donne un champ focalisé « Ranger la réserve », Entrée → cache
  CR-RANGER « ZZ TEST Nom », frise, clavier fermé. C1 = feuille d'ajout Activités sans `.cal-f-semaines`, bouton « 3 mois » → « vers <mois+3> »,
  Ajouter (nom tapé « ZZ TEST Horizon ») → date dans ce mois, visible sur la frise, glissée d'une colonne. D2 = feuille Travaux, nom tapé, puce
  `[data-prix-semblable]` avec « Pompe » et « 420 », Garder, Ajouter → plan 42000. K2 = Brassins › Atelier R&D › projet › « Au calendrier » →
  colonne de sa semaine ISO visible entre 20 et 80 % de la largeur. K3 = + volant › `[data-page-action="brassin"]` › 1re `[data-puce="recette"]`
  › Ajouter → la barre du brassin neuf porte `[data-phase=fermentation]` et `[data-phase=conditionnement]`, et « coût estimé … CHF » ou « coût à
  venir » dans son label, son texte ou le message. SANS-MONTANT = Activités et Travaux, champ nom posé `/· S\d+/`, Ajouter sans montant → créé ;
  Travaux en `creativeItems` avec `travaux: true`, aucun plan à 0.
- V-CAL EN COURS dans un worktree temporaire `C:/Users/mrspa/AppData/Local/Temp/vc` (branche `vcal-tmp` depuis 7cfa3aa51, node_modules en
  jonction, `.env*` et `src/data/seedData.ts` copiés ; à reporter dans port-carnet par `git diff` puis retirer : `git worktree remove --force`,
  `git branch -D vcal-tmp`). Édité, tsc OK avant les derniers changements de FeuilleAjout (non revérifié) :
  `src/types/index.ts` (`travaux?: boolean`), `src/domain/calendrier.ts` (`rangeeCreative`), `src/domain/calendrierGestes.ts` (dupliquer garde
  `travaux`), `src/domain/calendrierAjout.ts` (D401 dans `versEnregistrement`, `resumeAjout`, `RANGEES_NOM_POSE`, `nomPose`, `avecNomPose`,
  champs `nomPose`/`parHorizon` du brouillon, puce nom → `nomPose: false`), `src/ui/saisie/Horizons.tsx` (prop `sansPlusTard`),
  `src/ui/calendrier/frise/FeuilleAjout.tsx` (nom posé, Horizons en mode ajouter à la place du carrousel, « vers … » `data-intention`, puce D2
  `data-prix-semblable` + « estimé », `data-feuille-nom`, sélection au focus).
- MANQUE pour compiler : `achats?: readonly AchatPasse[]` dans `ContexteAjout` (import type depuis `./horizons`) ; le remplir dans
  CalendrierTab `ctxAjout` (lignes de facture non-income > 0, comme ExpenseSheet l. 316).

## Prochaine action, dans l'ordre
1. Attendre « == FIN » de `<S>/f2.out` ; lire les échecs `f2-*` (grep) ; f2-cal comportera aussi les étapes 9c (rouges, normal).
2. Rejouer W0c : `node scripts/parcours/calendrier.mjs <S>/w0c-t7 --ref en-ligne/2026-11-21-tour7 --etape G3,RENOMMER-EVT,C1-GLISSER,D2-CAL,K2,K3-SUITES,TRAVAUX-SANS-MONTANT`
   (7 rouges attendus ; K2 peut être vert sur tour7 : alors lire pourquoi et durcir, ou le dire). Ajuster les sélecteurs si une étape casse
   pour une raison de banc. Commit des deux fichiers.
3. V-CAL : finir `achats`, tsc, tests (`tests/unit/calendrierAjout.test.ts` : D401, nom posé, résumé sans S doublée), puis le reste : G3
   (Rangee `piste()` : clic sur la piste vide → `onToucherVide(rangee, lundi)` ; CalendrierTab crée Travaux/Activités par `versEnregistrement`
   + `ecrire` avec Annuler), RENOMMER-EVT (DetailChose h4 : `RenommerSurPlace as="span"` si `onRenommer` ; CalendrierTab : patch `title`),
   C1 (après Ajouter `parHorizon` hors fenêtre : `voirEtendue` d'office au lieu du lien), K3 (phases proposées d'un brassin pas brassé, D384 à
   lever en « proposé »), K2 (selon le rejeu), VUE-SAUTE, précision semaine/mois. Un commit par élément dans port-carnet.

# Session 11 — attente fin2, lecture W0c / V-CAL (21.11, agent arrêté à ~155 k par lecture ; RIEN ÉCRIT dans le code)

## État
- `fin2.sh` tournait encore à 12:25 (tsc 0 ; vitest entier en cours, sorties `f2-*` du scratchpad `<S>`). Aucun build ni rejeu lancé par moi :
  ne rien lancer avant « == FIN » dans `<S>/f2.out` (lenteur.mjs mesure le temps). Ne pas éditer `src/` avant la ligne « build parcours code »
  (vitest et les builds lisent l'arbre). `scripts/parcours/calendrier.mjs` et sa fixture se lisent au démarrage du rejeu : modifiables dès que
  la ligne « build parcours code » est écrite.
- Puis lire : `f2-vall.out` (`grep -aE "Test Files|Tests  |FAIL"`), `f2-build.out` (échec DRAPEAUX `VITE_CARNET_IA` attendu : rejouer avec
  `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build`), `f2-cal.out`, `f2-geste.out`, `f2-lent.out` ; captures 390/1280 de `<S>/f2-cal/`.
  Corriger les échecs du Calendrier ; noter les autres sans y toucher.

## Ce qu'il faut savoir pour W0c (lu, rien écrit)
- `calendrier.mjs` n'a PAS d'option `--etape` : l'ajouter comme `chaines.mjs` (l. 24-26 : `seules = opt('etape')?.split(',')`, et
  `'--etape'` dans la liste des options à valeur de la l. 30). Les étapes neuves vont après WFV-14, dans `bugsWorkflows()` ou une fonction sœur
  (`recharger()` local remet la période par défaut).
- Fixture `scripts/parcours/fixtures/calendrier.mjs` (stockée UNE fois : `parcours-calendrier:fixture`). Ajouter : (D2) une pièce payée passée
  « ZZ TEST Pompe de brassage » 420 CHF (`facture(...)` avec `paymentStatus:'paid'`, date ≈ aujourd'hui −300 j) ; (K2) un projet du Carnet daté à
  +3 mois (`creativeItems`, genre carnet, voir `carnetDepuisPhrase` et la fixture de `carnet.mjs`).
- Modèles à reprendre (principes.mjs, W0a) : `POSES` l. 300-417 (nom posé, valider sans clavier, Annuler retire), `RENOMMERS` l. 474-526
  (`pointTitre`, Entrée, relu dans le cache), `prixGarde` l. 313 (`[data-prix-semblable]`, « Garder … CHF »). Le cache du Calendrier :
  `parcours-calendrier:cache` (entrées `{name, id, data}`).
- Étapes à écrire (rouges sur `en-ligne/2026-11-21-tour7`) :
  1. G3 : toucher la case vide de la semaine S+1 dans la piste Travaux (`[data-lane="travaux"]`, x = colonne de la semaine lue sur
     `[data-bande-semaines] [data-semaine]`) crée « Travaux · S<n> » (cache `financialPlans`/`creativeItems`), message avec Annuler, Annuler le
     retire. Aujourd'hui la piste n'a aucun toucher vide (Rangee.tsx `piste()`, l. ~897) : seul `cal-plus` « Ajouter dans … » ouvre la feuille.
  2. RENOMMER-EVT : détail de « Ranger la réserve » (activité) : toucher le titre → champ, taper « ZZ TEST Nom », Entrée → relu dans le cache et
     à l'écran, clavier fermé. Aujourd'hui `DetailChose.tsx` l. 328-338 renomme par Modifier.
  3. C1-GLISSER : dans la feuille d'ajout, aucune rangée `.cal-f-semaines` (carrousel de 60 puces) ; à sa place `Horizons` (aujourd'hui, 1 mois,
     3 mois…) ; « 3 mois » d'un toucher dit « vers <mois+3> » ; la semaine se règle au glisser sur la frise après création.
  4. D2-CAL : feuille Travaux, nom « ZZ TEST Pompe » → puce `[data-prix-semblable]` « Pompe <année> : 420 » ; Garder → Ajouter → plan de 42000.
  5. K2 : Carnet › projet daté › « Au calendrier » (`CarnetOuvert.tsx:632`, bouton `cn-second`) → Calendrier ouvert, la chose visible et
     centrée (`centrerSur`, App.tsx l. 282/1356, CalendrierTab l. 215).
  6. K3-SUITES : poser un brassin (+ volant › Poser un brassin, recette, Ajouter) → ses suites en « proposé » : cuve libre, fin, garde, mise en
     fût (PORT T4) ; définir l'attendu sur l'écran de l'arbre avant d'écrire le contrôle (rien de tel aujourd'hui, à vérifier sur tour7).
  7. SANS-MONTANT (demande du pilote) : « Ajouter dans Activités » et « Ajouter dans Travaux », nom posé, Ajouter SANS montant → créés.
     Aujourd'hui : `calendrierAjout.ts` `valider` l. 333 refuse sans nom (« Choisis un nom. ») ; `versEnregistrement` l. 384 refuse Travaux,
     Achats, Papiers, Ventes sans montant (FinancialPlan.amountCents est requis).
- DÉCISION à prendre pour 7 (dépasse le code seul) : où vit un Travaux sans montant. Options : (a) `CreativeItem` `event` + drapeau
  `travaux: true` (calque exact d'Activités `activite: true`, `estimatedCost` facultatif ; calendrier.ts l. 866 à étendre) ; (b) `FinancialPlan`
  à `amountCents: 0` (précédent : `mergeUpgradePlans`, `budgetKnown:false`), mais Finances afficherait « 0,00 » (l'inconnu n'est jamais 0) ;
  (c) plan `source:'equipment'` `budgetKnown:false` (déjà rangé en Travaux, l. 1037) mais il s'ouvre dans Matériel et ne se glisse pas.
  Recommandation : (a), additif et réversible ; un montant donné garde le plan financier.

## Reste (ordre)
1. fin2 (ci-dessus). 2. W0c : les 7 étapes + `--etape`, rejeu `--ref en-ligne/2026-11-21-tour7 --etape …` (rouge) et sur l'arbre (le reste OK) ;
   commit `scripts/parcours/calendrier.mjs scripts/parcours/fixtures/calendrier.mjs`. 3. V-CAL, un commit par élément (G3, RENOMMER-EVT, C1,
   D2, K2, K3, VUE-SAUTE, précision semaine/mois de la date du carnet). 4. `juger` puis CAL-LENT, `ab.mjs` 7 tours, poste calme seulement.
Fichiers d'autres voies à ne pas toucher : BrewWizard, etapeLevure, quickAdd, `src/domain/recette/` (V-RECETTE), `Caisse.tsx` (F-APPUI),
`tests/helpers/wizard.ts`, `tests/integration/zz-debug-vrecette.test.tsx`, `tests/unit/recettePropositions.test.ts`. `EnTete.tsx` (juger) est à moi, non commité.

# Session 10 — D398, WFV-14, TOUCHER-FANTOME, F-ENTREE (21.11)

## Fait (commité)
- `e690814a6` D398 : `choseBrassin`, jour prévu passé : une seule branche. Barre de `debut` (j0 si posé au passé, sinon aujourd'hui) à
  « prête » ; jalons recalés sur aujourd'hui, écart compté depuis `debut` ; conditionnement = `pretePrevue`. `choseAllongee` : la branche
  D397 retirée (plancher aujourd'hui). Tests réécrits (D398, D392, juger rAF, 7 de B9/D395, calendrierDetail n° 3, calendrier-onglet
  CRITIQUE-10 n° 1) : 62 fichiers Calendrier, 879/879.
- `63d6db6f1` WFV-14 (CalendrierTab + étape calendrier.mjs). `6bb0cc4fe` TOUCHER-FANTOME : `usePointeur` (mode appui) et `useToucherNom`
  appellent `avalerClicSuivant(DELAI_CLIC_AVALE, e.currentTarget)` avant d'ouvrir ; étape calendrier.mjs rouge sur tour7 (« Vente annulée ·
  S51 »), verte sur l'arbre avant ET après (le défaut dépend de la géométrie : détail en ligne, bouton sous le doigt ou non) ; test
  `toucherFantome.test.tsx` (3). `6300acb90` F-ENTREE tâche : `FeuilleAjout` onEntree + `principes.mjs` entree-tache → Activités (Travaux
  exige un montant) ; ENTREE 4/4 (`s9b-entree4.out`). La ligne de principes.mjs seule, le travail F-NOM (D399, achatPose) laissé dans l'arbre.
- Parcours arbre avec correctif (`s9b-cal.out`) : PARCOURS CALENDRIER OK.

## Reste
0. ATTENTION : deux fin.sh tournaient en même temps (celui de la session 9, 11:21, et le mien) plus un vitest de 11:19 : sorties `fin-*`
   mélangées, poste chargé (vitest entier 58 min). Tous arrêtés (kill). Lancé à la place `fin2.sh` (scratchpad, sorties `f2-*`, build
   `build-s10-fin`) vers 12:17 : tsc 0 ; vitest entier en cours. Ne PAS relancer fin.sh ni lancer d'A/B tant que `f2.out` n'a pas « == FIN ».
1. Lire `f2.out`, `f2-vall.out` (`Test Files|Tests |^ FAIL`), `f2-build.out` (échec DRAPEAUX `VITE_CARNET_IA` = environnement du
   worktree), `f2-cal.out` (PARCOURS CALENDRIER OK attendu), `f2-geste.out`, `f2-lent.out` ; ouvrir captures 390 et 1280 de `f2-cal/`.
2. `juger`/`flushSync` (EnTete.tsx, non commité) : ab.mjs 7 tours, deux builds à la suite. 3. CAL-LENT.
- Limite : Travaux, Entrée sur le nom sans montant → refus « Indique un montant », clavier fermé (PI-2 voudrait le champ CHF ; ChampMontant n'a pas d'onEntree).

# Session 9 — D397, fin.sh, WFV-14 (21.11)

## Fait
- **D397** commit `f63986ce8` : `preteAuPlusTot` ne fait plus d'exception pour le brassin posé au passé ; `choseBrassin` (posé au passé) : barre
  j0 → j0 + cycle (D395), `pretePrevue`, durée et détail = max(j0, aujourd'hui) + cycle (« … au plus tôt ») ; `choseAllongee` (posé au passé) :
  `fin` et `pretePrevue` décalés d'autant. Tests : calendrierGestes (méthode PREVU_SEMAINE_COURANTE gardée ; relues corrigées ; test D397 neuf),
  calendrier.test t2 (+ cas semaine courante) et CRITIQUE-6 n° 2, Ecritures (banc), Voie3 (S53 : 2026 a 53 semaines ISO). Calendrier 278/278.
- **WFV-14** (NON commité) : `CalendrierTab.tsx` « Facturer » ouvre `Caisse` (lazy, comme ClientsTab) avec `clientIdInitial` = `clientId`
  du plan (`don.plans`) ; état `caisse`, rendu avant `.cal-tab-fin`. tsc OK. Étape `WFV-14 Facturer` dans `calendrier.mjs` (après B11 ;
  capture `09b-wfv14-detail` puis `09b-wfv14-facturer`). Rouge tour7 (`wfv14-tour7b.out`, build `b-tour7`) MAIS pour une autre raison : sur
  tour7, toucher « La Cigogne, 3 fûts » a ANNULÉ la vente (message « Vente annulée · S51 », capture `wfv14-tour7/09b-wfv14-detail.png`) :
  clic fantôme probable sur « Annuler la vente » du détail ouvert sous le doigt. À voir sur l'arbre (sortie `fin-cal.out`, captures
  `fin-cal/09b-wfv14-*`) : si le même clic fantôme existe, c'est un bug à corriger/verser à BUGS.md avant WFV-14.
- **F-ENTREE** (demande du pilote, NON commité) : `FeuilleAjout.tsx` champ du nom : `enterKeyHint` retiré, `onEntree` = même appel que le
  bouton (`ajouter(confirmation ? {...b, confirmeGrosseSomme:true} : b)`). Dépend de `onEntree` de `src/ui/Input.tsx`, modifié NON commité
  par une autre voie (F-NOM/F-ENTREE) : commit à part, après le leur. tsc OK. Preuve lancée : `principes.mjs <S>/entree-arbre --seul ENTREE`
  (build de l'arbre) → sortie `<S>/entree-arbre.out` FINIE, NON LUE (lire `grep -vE "^\s+ok "`).
- **calPasseCourbe.test.tsx** (NON commité) : 2 tests réécrits selon D392 (ni anneau ni point ; colonne + marche).
- **calendrierEntete.test.tsx** (NON commité) : helper `imageSuivante()` ; tests « n° 1 et 14 » et « paquet D n° 5 » attendent l'image
  (juger en rAF). Restent 7 rouges, nés de B9/D395 (le doigt ne lit que la fenêtre) : lignes ~335, 695, 949, 1211 (×2), 1551, 1631 attendent
  S15/S16/S27/2027-04-12… dans une courbe d'un an ; à réécrire avec les semaines de la fenêtre (comme D395). Non relancé après mes éditions.
- `fin.sh` TERMINÉ (code 0 du script ; résultats de chaque étape NON LUS, l'agent était arrêté par le hook à 200 k) (lancé après le commit D397) : tsc 0, vitest Calendrier 0 ; vitest entier, build, calendrier, geste, lenteur : lire
  `<S>/fin.out` puis `fin-vall.out` (`Test Files|Tests |^ FAIL`), `fin-build.out`, `fin-cal.out`, `fin-geste.out`, `fin-lent.out` ;
  ouvrir captures 390/1280 de `fin-cal/`. NB : le build de fin.sh contient WFV-14 (édité pendant vitest) ; pas F-ENTREE (selon l'heure).

## Reste (ordre)
1. Lire `entree-arbre.out` : ENTREE vert → commit F-ENTREE seul (`FeuilleAjout.tsx`), si `Input.tsx` est commité par sa voie ; sinon le dire.
2. Lire fin.sh ; WFV-14 sur l'arbre (`fin-cal.out`) ; si OK et tour7 rouge (clic fantôme à trancher) → commit `CalendrierTab.tsx` +
   `calendrier.mjs`. 3. Réécrire les 7 tests calendrierEntete (D395) ; relancer ce fichier + calPasse* ; commit tests.
4. Remède `juger`/`flushSync` (EnTete.tsx) : A/B `ab.mjs` 7 tours, A = EnTete de HEAD, B = arbre, deux builds à la suite (vite.parcours
   config, `--outDir`), puis commit si rien ne perd (avec le test calendrierEntete adapté). 5. CAL-LENT si temps.
`<S>` = scratchpad `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad`.

## DOUTE D397 (à remonter)
- Posé au passé, le jalon « Conditionnement » reste au bout de la barre (j0 + cycle) alors que « prête le » dit aujourd'hui + cycle : deux dates
  dans le pied par phases et la grille du détail. Lecture prise : « garde sa barre » = barre ET ses jalons.

# Session 8 — bugs commités, CAL-LENT (21.11)

## Fait
- Commits par bug (par chemins ; parcours et test découpés par `stage.mjs` du scratchpad) : B3 `e33e2fc2d`, B11 `235825252`, B8 `252b8c3aa`,
  B9 `b23d4e38b`. Test B11 ajouté (`bugsWorkflowsCalendrier.test.ts`, 4/4).
- B9 : la lecture n'était pas fautive ; le parcours partait sur les poignées (zones de prise 44 px, cadre au milieu en 6 sem.). Étape refaite :
  départs hors de l'union des deux prises, puis un départ SUR la poignée de fin doit tirer la fenêtre. B8 période : la fenêtre se lit sur
  la bande des semaines (pendant le glisser, l'aperçu cache le cadre). `cal-s8b.out` : **PARCOURS CALENDRIER OK**.
- CAL-LENT, A/B 7 tours (`ab-s8pe.out`), A = arbre `build-s8-A`, B = `.cal-tab { pointer-events: auto }` : Modifier 384 → 536, Enregistrer
  288 → 456, semaine 400 → 504 : **REJETÉ**, retiré. (Un vitest lancé par erreur a chargé le poste ~3 min sur les premiers tours.)
- `juger` (EnTete.tsx) lu en rAF + dépendance `!!courbe`. A/B non apparié (`ab-s8j.out`, J bâti 25 min après A, arbre changé par d'autres
  sessions) : plus lent, CONFONDU. A/B apparié (`ab-s8j2.out`, A2 et J2 bâtis à la suite, 7 tours) : semaine 336 → 336, frise 416 → 312,
  barre 232 → 184, courbe-lecture 16 → 16, cacher 104 → 112, ouvrir 144 → 128, Modifier 552 → 440, semaine (feuille) 40 → 32, Enregistrer
  280 → 280. **GARDÉ** (non commité), plus `flushSync` dans le rAF (pas d'image décalée ; ajouté après la mesure). lenteur reste ECHEC (6 à 7).
- BUGS.md de Brasserie : WFR-11, WFV-3, WFP-2, WFP-3, WFP-4 marqués « corrigé » + commit ; `controle-bugs.mjs` : BUGS OK (1529, 146 ouverts).

## Session 8 : NON FINI — prochaine action
1. **15 tests Calendrier rouges depuis B8 (D395)** : ils codaient « prévu le 10 nov. (S46), aujourd'hui 16-18 nov. → part d'aujourd'hui ».
   Fichiers : calendrierGestes (fait en partie), calendrier.test.ts:461 et :608, calendrierEcritures:298, calendrierVoie3:53.
   Méthode prise dans calendrierGestes : `PREVU_SEMAINE_COURANTE = '16.11.2026'` (le retard DANS la semaine courante, règle qui reste) ;
   la ligne 269 garde le 10 nov. et attend D395 (« prête le 15 déc. »). Restent rouges dans calendrierGestes : 295, 345, 395 et ~410
   (mes valeurs de `finPrevue` écrites devinées à +6 j sont fausses : relire ce que `allonger` écrit, la base n'est pas jour prévu + cycle).
   Pour calendrier.test.ts / Ecritures / Voie3 : même choix (prévu 16 nov.) ou attendre la valeur D395, test par test.
   DOUTE à remonter au pilote : D395 rend « prête le 8 déc. » (10 nov. + 28 j) pour un brassin PAS brassé le 16 nov. ; CRITIQUE-6 n° 2
   disait « prête au plus tôt aujourd'hui + cycle ». Vrai pour le dessin (sa plainte), discutable pour « prête le » (L14).
2. Puis `fin.sh` du scratchpad (série : tsc, vitest Calendrier, vitest entier, build, build parcours, calendrier.mjs, geste.mjs, lenteur.mjs ;
   sorties `fin-*.out`), captures 390/1280 de `fin-cal/` à ouvrir. Commit `juger` + tests (par chemins). tsc OK avec `juger`.

# Session 7 — bugs B3, B8, B9, B11 (21.11, agent arrêté à ~170 k ; RIEN COMMITÉ, tout dans l'arbre de travail)

## Fait (non commité)
- `scripts/parcours/calendrier.mjs` : étape « 9b » `bugsWorkflows()` (avant CAL-ENTETE) : B8 barre au passé, B8 période (glisser tenu au
  bord droit, pastille `[data-periode-pastille]` avant/après/rechargement), B9 lecture de la courbe en 6 sem. (4 glissés, semaine lue ∈
  `[data-bande-semaines] [data-semaine]`), B11 « Vente 6 × Pale Ale » dans `[data-rangee="ventes"]`, B3 (brassin « ZZ TEST levure sans nom »
  injecté dans le cache `parcours-calendrier:cache`, puis cache remis). `periodeNeuve()` retire `app_global_time_filter` de l'état d'UI avant
  chaque rechargement de l'étape (le 1er rejeu partait d'une période dérivée en 2027 : préalable B8 raté).
- Fixture `fixtures/calendrier.mjs` : vente encaissée du jour `REC-ZZ-VENTE` + paiement `PAY-REC-ZZ-VENTE` (financialPayments).
- Rouge sur tour7 (1er rejeu, `cal-tour7.out` du scratchpad) : B3 KO « Impossible de charger cet écran », B9 KO (S21, S7 lues en S36–S41),
  B11 KO. B8 : préalables ratés (corrigé par periodeNeuve) : 2e rejeu `cal-tour7b.out`, puis arbre `cal-wt.out` (lancés ensemble).
- Correctifs : B3 `brewBudget.ts` (nameKey/demandKey tolèrent un texte absent ; levure sans nom mais liée au stock = demande « Levure ») +
  `calendrier.ts` `(l.label ?? '')`. B8 `calendrier.ts` `brassagePoseAuPasse` = `lundiDe(j0) < lundiDe(auj)` (semaine d'avant = passé) ;
  `CalendrierTab.tsx` `defilerFenetre` ne fait plus `onPeriode` (période inchangée par le défilement au bord). B9 `EnTete.tsx` `indexSous` :
  hors alignement, le doigt lit les semaines de la fenêtre (index…index+nombre) sur la largeur. B11 `useDonneesCalendrier.ts` : paiements
  `in` de pièces `income` entre lundi0 et aujourd'hui → chose `paiement-<id>` rangée ventes (pas si la pièce est encore attendue en prévision) ;
  `reels` portent `choseId`. tsc OK.

## Rejeux finis (session 7)
- tour7 (`cal-tour7b.out`) : B3, B8 (barre « lâchée en S46, dessinée en S47 » ; période « 26.10.26–24.01.27 » devenue « 07.12.26–07.03.27 »,
  restée au rechargement), B9, B11 : les 4 KO. ECHEC (36).
- arbre (`cal-wt.out`) : B3, B8 barre, B8 période, B11 OK. ECHEC (1), seul reste **B9 en partie** : 30→85 % et 10→20 % lisent dans
  S44–S49, mais 50→60 % ne lit rien et 80→95 % lit « S6, 8 – 14 févr. ». Piste : ces glissés tombent dans une zone de prise du cadre
  (`prise.current`, `gestesCourbe.onPointerDown`) et tirent la fenêtre, ou passent par la branche `graph`. Regarder les captures `cal-wt/09b-*`.
  Note : `debut()` de l'étape B8 période rend null après le glisser (« Snull ») : lire la poignée autrement.

## Session 8 : prochaine action
1. Finir B9 (voir ci-dessus), rejouer `calendrier.mjs` sur l'arbre : PARCOURS CALENDRIER OK attendu.
2. Tests unitaires : `tests/unit/bugsWorkflowsCalendrier.test.ts` ÉCRIT (B3, B8) : 3 fichiers verts avec `calPasse` et `bugs-v3-t32`
   (11/11). Reste : B11 (construireModele avec un paiement du jour) ; puis tous les tests Calendrier et la suite entière.
   Rejeux lancés en fond à la fin de la session 7 (scratchpad) : `cal-tour7b.out` puis `cal-wt.out` ; captures `cal-tour7b/`, `cal-wt/` (09b-*).
3. Un commit par bug (étape + fixture + correctif), par chemins ; jamais source4-portable-bundle-manifest-01.json.
4. Puis CAL-LENT (a) `.cal-tab { pointer-events: auto }`, (b) `juger` en rAF, `ab.mjs` à 7 tours ; puis BUGS.md de Brasserie + controle-bugs.

# Session 6 — CAL-LENT suite (21.11, agent arrêté à ~170 k ; rien commité)

## Mesure : le poste est partagé, la médiane de 3 ne suffit plus
- Base `41fee647f`, `mesure.mjs` ×3 : semaine 232, frise 216 (tâche 157), barre 184 (tâche 126), courbe-lecture 0, cacher 72, ouvrir 72,
  Modifier 328 (tâche 246), semaine (feuille) 32, Enregistrer 280 (tâche 263) ; ECHEC 7/6/8.
- Le MÊME build rejoué donne 200 à 656 ms pour « semaine » : une autre session charge le poste (charge 4 à 32 %). Outil fait : scratchpad
  session 6 `ab.mjs <buildA> <buildB> [n] [etiquette]` : A et B alternés n fois, médianes côte à côte. `build-base` = HEAD (FeuilleAjout de HEAD),
  `build-puces` = remède 1. Résultat A/B puces : RESULTAT-AB (ci-dessous, à remplir si absent : `ab-puces.out` du scratchpad).
- Traces (`lenteur.mjs --invalidations`, `trace2.mjs` du scratchpad : invalidations de style seules, par recalcul) :
  1. Modifier : recalcul de **3 720 éléments** forcé par `focus` (FocusScope) ; cause unique dans la trace : « Inline CSS style declaration
     was mutated BODY » = `body.style.pointerEvents = 'none'` de Radix (DismissableLayer, modal). `pointer-events` est HÉRITÉ : tout le
     document se recalcule. Enregistrer (2 790) : le même à la fermeture (valeur rendue). Ce n'est pas le focus lui-même.
     Remède à mesurer : `.cal-tab { pointer-events: auto }` (frise.css) : le changement hérité s'arrête au Calendrier. Sans effet visible
     (le voile de la feuille, `pointer-events:auto`, couvre tout) ; le Calendrier n'a aucun menu Radix sans voile (seulement Sheet). À vérifier :
     un menu Radix du Header ouvert au-dessus du Calendrier laisserait passer un toucher au Calendrier.
  2. Modifier, 1er recalcul (134 ms) : 194 « Attribute rect » = le masque des fils (sélection allumée) ; frise : 750, barre : 313.
  3. Semaine, frise, barre : 79 à 141 « Affected by :has() » sur les ancêtres (cal-tab, main, racine) : une règle `:has()` remonte à chaque
     changement ; la sonde de session 5 la disait négligeable sans ralenti : à re-sonder sur trace.
  4. `juger` (146 ms non minifié, session 5) = `EnTete.tsx` l. 616 (useLayoutEffect, offsetWidth) : le temps est la mise en page forcée
     du Calendrier entier juste après le rendu du lâcher. Remède : le lire hors du commit (ResizeObserver seul, ou rAF + flushSync) ; mesurer.

## Session 6 : fait
- RÉSULTAT A/B puces (5 tours alternés, A = HEAD, B = puces fenêtrées) : semaine 360 → 200, frise 432 → 344, barre 312 → 296 (hors cible :
  bruit), **Modifier 504 → 584, Enregistrer 344 → 600** (tâche 410 → 482, 311 → 556). Aucun gain sur la cible : **REJETÉ**, fichier remis
  à HEAD (`git checkout`, copie gardée). Cohérent avec la trace : le coût est le recalcul hérité du `body` (point 1), pas les 485 éléments.
  Le ref de rappel force aussi une mise en page de plus à l'ouverture. Bruit : les A de ce tour (504, 344) dépassent la base de 3 (328, 280).
- Remède 1 (REJETÉ), `src/ui/calendrier/frise/FeuilleAjout.tsx` : puces de semaine fenêtrées (vue ± une vue, cales `data-cale` de part et d'autre,
  `premiereVue` suivie au défilement) ; centrage par le rang (`iChoisie × pasSemaine`) et non plus par la boîte rendue ; ref de rappel
  `poserRangee` (la rangée vit dans le portail, monté APRÈS la feuille : l'ancien useLayoutEffect `[]` ne la voyait jamais, la largeur venait
  toujours du repli `innerWidth`, inchangé) ; sans mise en page (jsdom, clientWidth 0) toutes les puces sont rendues. Vitest Calendrier
  47 fichiers, 785/785. Copie : scratchpad `FeuilleAjout.puces.tsx` ; HEAD : `FeuilleAjout.head.tsx`.

## Session 7 : prochaine action, dans l'ordre
1. (fait : puces rejetées.) Mesurer seulement quand la charge du poste est basse (`(Get-CimInstance Win32_Processor).LoadPercentage`),
   ou passer `ab.mjs` à 7 tours.
2. Remède `.cal-tab { pointer-events: auto }` ; build ; `ab.mjs build-base build-pe 5` ; captures 390/1280 identiques (`captures-cal.mjs`
   puis `compare.mjs` du scratchpad session 5).
3. `juger` hors du commit ; masque : `React.memo` du `<svg.cal-traits>` (clé des trous) et pas de `setTrous` pendant un glisser (au lâcher) ;
   `ab.mjs` chaque fois ; puis `lenteur.mjs` jusqu'à OK.
4. Bugs (inchangé, voir plus bas). Piste B3 : la pile passe par le chunk useLiveData appelé par forecast ; `brewBudget.ts:160`
   `nameKey = s => s.trim()` (un nom absent) et `calendrier.ts:1055` `l.label.trim()` (ligne d'achat sans libellé) sont les candidats ;
   reproduire en ajoutant l'élément incomplet à la fixture ZZ TEST du Calendrier (jamais seedData), étape rouge dans calendrier.mjs, puis garde.

# Session 5 — CAL-LENT (21.11)

## État de l'art (L29) : invalidation de style
- Problème type : **invalidation de style** du navigateur (Blink). Une mutation du DOM (insertion d'un enfant, attribut, classe) marque des
  éléments « à recalculer » ; la lecture suivante de la géométrie (getBoundingClientRect, offsetHeight, focus) force le recalcul
  (UpdateStyleAndLayoutTree) avant de répondre. Coût ≈ nombre d'éléments marqués × règles candidates.
- Mécanisme Blink (Rune Lillesveen, « Style Invalidation in Blink » ; web.dev « Reduce the scope and complexity of style calculations ») :
  1. Classe, id, attribut changés : ensembles d'invalidation par trait (`.a .b` ne marque que les `.b` sous l'élément) ; un sélecteur
     dont le sujet n'a aucun trait (`[x] :focus-visible`, `.a *`) marque **tout le sous-arbre**.
  2. Insertion ou retrait d'un enfant : si le parent porte un drapeau « structurel » (posé pendant le filtrage par tout sélecteur
     `:nth-*`, `~`, `+`, `:last-child`, `:only-child`, `*-of-type` dont le sujet est universel, p. ex. `.space-y-2 > :not([hidden]) ~
     :not([hidden])`, testé sur **chaque** élément de la page), Chrome applique l'ensemble global « nth » ou « frère universel » ; si une
     seule règle de l'app y met une descendance universelle, c'est **tout le sous-arbre du parent** (« allDescendantsMightBeInvalid »).
  3. `:has()` : invalidation vers le haut, chère si l'argument est large.
- Remèdes connus, du plus sûr au plus large :
  a. Sélecteurs structurels universels → classes posées par le code (`cal-pile` au lieu de `space-y`), ou sujet qualifié par une classe.
  b. Sortir les insertions des parents chargés : surcouches (toast, feuille, menu, panneau) dans un **portail** (`createPortal` vers
     `document.body`), calques toujours montés (vides ou `hidden` au repos) au lieu d'insérés.
  c. `contain: layout style` / `content-visibility: auto` : borne la mise en page et les compteurs ; **ne borne pas** l'invalidation de
     style (Chrome recalcule quand même le sous-arbre marqué) ; `content-visibility: auto` saute le style des parties hors écran.
  d. Moins d'éléments par semaine (moins d'éléments marqués).
  e. Glisser : `transform` dans `requestAnimationFrame`, sans rendu React par mouvement ; aucune lecture de géométrie après écriture
     (pas de mise en page forcée) ; mesurer une fois au début du geste.
- Décision : mesurer, puis a et b d'abord (cause mesurée) ; c et d seulement si la mesure le demande ; e pour frise et barre.
  Chaque remède : build de production, `lenteur.mjs` ×3 (médiane) + sonde ; gardé seulement s'il fait gagner.

## Mesures (build de production, 390 tactile, CPU ×4, médiane de 3 ; script `mesure.mjs` du scratchpad session 5)
| action | base `062b6375f` | + PostCSS `ed6afbc20` | + masque en un chemin (REJETÉ : plus lent) |
|---|---|---|---|
| semaine | 296 (tâche 252) | 160 (120) | 392 (284) |
| frise (glisser) | 456 (356) | 224 (158) | 264 (223) |
| barre (glisser) | 368 (380) | 152 (116) | 240 (203) |
| courbe-lecture | 24 | 0 | |
| courbe-cacher | 112 | 128 | |
| événement ouvrir | 152 | 104 | |
| Modifier | 376 (285) | 288 (204) | 296 (210) |
| semaine (feuille) | 64 | 48 | |
| Enregistrer | 416 (389) | 200 (165) | 328 (292) |
Verdicts : base ECHEC (8/7/7) ; PostCSS ECHEC (4/6/5) ; masque ECHEC (7/5/7). Le chemin unique est plus lent (rastérisation du masque ?) : remède rejeté, fichiers remis à ed6afbc20 ; copie dans le scratchpad session 5 « masque-rejete/ ».

## Session 5 : fait
- `062b6375f` : data-doigt + cal-pile (calendrierTour3 + calendrierEntete 123/123).
- `ed6afbc20` : **cause principale**. Sonde 2 (retirer les 86 règles structurelles, puis les remettre une à une) : 26 coupables, chacune
  SEULE suffit : tous les `space-x/y-*` et `divide-*` de Tailwind v3 (`> :not([hidden]) ~ :not([hidden])`) + `.fe-gt>span+span`,
  `.fe-tk>p>span+span`. Sonde 3 : insérer un enfant ailleurs qu'en dernier coûte tout le sous-arbre du parent (7,8 ms .cal-tab,
  5,8 ms .cal-frise sans ralenti) ; en dernier ou dans body, 0,03 ms. Remède : plugin PostCSS (`postcss.config.js`) qui réécrit
  ` > :not([hidden]) ~ :not([hidden])` en ` > :not([hidden]):not(:first-child)` (même marge, même élément ; écart seulement si le 1er
  enfant porte l'attribut `hidden` : aucun cas sur Production, Stocks, Finances, Calendrier à 390 et 1280, scan). Après : 0,03 ms partout.
  Captures 390 et 1280 (repos, + volant) : **0 pixel de différence** (comparaison canvas), ouvertes. Calendrier vitest 518/518.
  Remède « portail » donc inutile (l'insertion ne coûte plus rien) ; `:has()` sondé : négligeable (0,08 ms).
- Masque (ESSAYÉ PUIS REJETÉ, non commité) : trace avec `--invalidations` : 400 à 750 « StyleRecalc Attribute rect » par geste = les
  `<rect data-trou>` du masque des fils (deux masques, un rect par trou, re-rendus à chaque mesure). `Frise.tsx` : trous en UN
  `<path data-trou>` (`cheminTrous`, `boitesDuChemin` exportés) ; lecteurs mis à jour : `calendrierJalonsLies.test.tsx`,
  `calendrierLotC.test.tsx`, `scripts/agents/vision-calendrier.mjs` (node --check OK). Calendrier vitest 515/515 (30 fichiers).
- Restant mesuré (trace) : Modifier = `focus` de Radix (FocusScope → focusFirst) force le style de 3 720 éléments : la feuille rend
  97 puces de semaine × 5 éléments (`cal-f-sem`, FeuilleAjout.tsx l. 262) ; Enregistrer = leur retrait (2 790). Remède suivant :
  moins d'éléments par puce, ou `content-visibility: auto` sur les puces hors écran (rangée qui défile), mesurer. Frise : `juger`
  (CalendrierTab, pur JS, 146 ms non minifié, au lâcher) ; `mesurerTraits` (useLayoutEffect sans dépendances, chaque rendu).

## Session 6 : prochaine action, dans l'ordre
1. Masque : rejeté (mesuré). Piste à mesurer : ne re-rendre les trous que si les fils existent ET ont changé (aujourd'hui mesurerTraits les
   recalcule à chaque rendu, useLayoutEffect sans dépendances), plutôt que changer leur forme.
2. Puces de la feuille (Modifier, Enregistrer), puis `juger` au lâcher de la frise ; `lenteur.mjs` jusqu'à LENTEUR CALENDRIER OK ×2.
3. Rejouer `calendrier.mjs` (PARCOURS CALENDRIER OK), `geste.mjs`, vitest Calendrier, `npm run build`.
4. **Bugs du coordinateur (après CAL-LENT)** — Brasserie `work/missions/2026-11-21-workflows-app/SYNTHESE.md` § 1 ; pour chacun, une
   étape de `calendrier.mjs` ROUGE sur tour7 d'abord, fixture ZZ TEST seulement (jamais seedData.ts), un commit par correctif :
   - B3 / WFR-11 (BUGS-produire.md l. 116) : « Impossible de charger cet écran » sans brassin démarré ; attendu : s'ouvre sur tout état.
   - B8 / WFP-3, WFP-4 (BUGS-projets.md) : barre lâchée en S46 dessinée en S47 ; la période change seule après un glisser hors fenêtre
     (et reste après rechargement) ; attendu : la barre va où le doigt la lâche, la période ne bouge que par lui (R9).
   - B9 / WFP-2 : glisser sur la courbe (vue 6 sem., S47–S52) lit « S31 · 2 août » ; attendu : la lecture reste dans la fenêtre (R4).
   - B11 / WFV-3 (BUGS-vendre.md) : la vente encaissée du jour absente de la rangée Ventes ; attendu : une chose de sa rangée.

# REPRISE — session 4 (21.11, agent arrêté à ~170 k)

## Session 4 : fait
- Étape 1 CAL-ENTETE : commit `d5a2f056c` (7 fichiers par chemins). Test n° 15 réécrit selon D392 (panneau 50 px, absolute, top:100 %,
  overflow hidden, une ligne). calendrierEntete **110/110** (B9 vert) ; `calendrier.mjs` : **PARCOURS CALENDRIER OK**.
- Étape 2 CAL-LENT, contrôle : `scripts/parcours/lenteur.mjs` (commit `3ce0c724a`). Build minifié (config parcours, React prod), 390 tactile,
  CPU ×4, trace + profil par action ; options `--ref`, `--build`, `--non-minifie`, `--sans-trace`, `--selecteurs`, `--invalidations`.
  **Rouge sur tour7 : ECHEC (8)** — INP semaine 1200, frise 1768 (tâche 1156), barre 1184 (tâche 900), courbe-lecture 32, courbe-cacher 184,
  événement ouvrir 432, Modifier 1160, semaine 112, Enregistrer 1392 ms.
- Cause mesurée (traces) : ni le JS ni la mise en page (Layout ≤ 52 ms), mais le **recalcul de style** (UpdateLayoutTree 300 à 476 ms pour
  1 700 à 3 700 éléments), forcé par les getBoundingClientRect des effets (p. ex. `mesurerTraits` de Frise.tsx, useLayoutEffect à chaque
  rendu). Il touche TOUT le sous-arbre à chaque insertion ou attribut :
  1. `.cal-frise` : `setAttribute('data-doigt')` à chaque pointerdown + règle `.cal-frise[data-doigt] :focus-visible` → sous-arbre entier.
     CORRIGÉ (non commité) : posé une fois ; règle bornée à `:is(button, a, [tabindex]):focus-visible`.
  2. `.cal-tab` : `space-y-2` (Tailwind « ~ ») remplacé par `cal-pile` / `cal-pile-serre` (frise.css, mêmes marges, même spécificité) ;
     test calendrierTour3 adapté (123/123 avec calendrierEntete). NON COMMITÉ.
  3. RESTE : insérer un enfant dans `.cal-tab` (message `cal-msg`, feuille, menu) ou `.cal-frise` (`svg.cal-traits`) invalide encore tout le
     sous-arbre (« allDescendantsMightBeInvalid »). Sonde `work/missions/2026-11-20-frise/sonde-invalidation.mjs <racine> <build>` (ignorée
     par git : copie aussi dans le scratchpad) : retirer les 86 règles structurelles (nth-, ~, +, last/only-child, of-type, :has, first-child,
     :empty) fait passer l'insertion de 8 ms à 0,07 ms (sans ralenti) ; aucune règle seule ne suffit → probablement l'ensemble global « nth »
     de Chrome (union de tous les :nth-*/:last-child de l'app). Prochaine action : sonde par catégorie, puis sortir les insertions des parents
     « positionnels » (portail `document.body` pour message, menu, feuille ; calque `cal-traits` toujours monté, vide au repos) et/ou retirer
     la règle globale fautive. Aussi : Modifier = `focus` de Radix 486 ms (FocusScope, même recalcul) ; `mesurerTraits` à chaque rendu.
- Après corrections 1 et 2 (arbre de travail, une mesure, bruitée) : semaine 776, frise 472, barre 760, cacher 144, ouvrir 272, Modifier 1120,
  Enregistrer 824 ms → toujours ECHEC (8). La ligne CAL-LENT est déjà dans DEFAUTS-RECURRENTS (Brasserie).

## Session 5 : prochaine action, dans l'ordre
1. Finir CAL-LENT (point 3), `node scripts/parcours/lenteur.mjs <dossier>` jusqu'à LENTEUR CALENDRIER OK (deux fois, bruit), puis
   calendrier.mjs OK, vitest Calendrier ; commit par chemins : CalendrierTab.tsx, Frise.tsx, frise.css, calendrierTour3.test.tsx (+ suite).
2. Le geste (liste « Reste » de la session 2 ci-dessous, points 1, 3, 4), puis contrôle final (vitest entière, build).

# (session 3) (21.11, agent arrêté à ~185 k)

## Session 3 : fait
- Commits : `6246452a4` (geste.mjs), `e1c67b257` (INVENTAIRE, REPRISE), `2bc7cd7af` (contrôle CAL-ENTETE dans `scripts/parcours/calendrier.mjs`,
  étape 10). Sur `en-ligne/2026-11-21-tour7` : **PARCOURS CALENDRIER ECHEC (31)**, tous CAL-ENTETE (rond pointillé et rond au repère ; Brassins
  saute de 53 px en An, 93 px en 3 mois ; en-tête 287 px An ; 252 px courbe cachée ; « −6 552 » sous les mois ; barre du haut 81 px, avatars
  sur 2e ligne, 6 onglets). Captures avant : scratchpad session 3 `cal-avant/`.
- Corrections CAL-ENTETE, NON COMMITÉES (arbre de travail) :
  1. `entete/Courbe.tsx` : anneau et point du curseur retirés ; repère = colonne teintée (`ent-cur-col`, `data-curseur-colonne`, masquée sous
     les noms) + marche épaissie (`ent-cur-marche`). `GrandeCourbe.tsx` garde son point (non touché, à décider).
  2. `entete.css` `.ent-lu` : panneau en absolu sous l'en-tête (top:100 %), hauteur fixe 50 px, mouvements sur une ligne. Revient sur
     CRITIQUE-5 n° 15 (« dans le flux ») : DÉCISION signalée au pilote (le panneau couvre la ligne « + Brassins » pendant la lecture).
     `EnTete.tsx` : courbe cachée → lecture fermée (useEffect).
  3. `BandeAnnee.tsx` + css : rangée `ent-an-z` (barres et montant du creux) retirée ; le creux reste dans `title` et aria-label.
  4. `Header.tsx` : compactLayout `flex-wrap` → `flex-nowrap` ; `periode.css` : flèches de la pastille 34 px dans `header` à ≤ 429 px.
  5. Tests `calendrierEntete.test.tsx` : `.ent-an-v` → title ; test de l'anneau → colonne sans rond.
- Après (arbre de travail) : **PARCOURS CALENDRIER OK** ; écart 0 px sur 7 états (An et 3 mois), en-tête 207 px An / 212 px 3 mois (≤ 253),
  courbe cachée 119 / 124 px (≤ 169), barre 41 px une ligne sur les 6 onglets. Captures regardées : 390 clair et cave, 1280 clair, lecture An.
- vitest `calendrierEntete` : 108/110 ; B9 (couleur en dur : ombre `rgb(0 0 0…)` du panneau) corrigée depuis (ombre retirée, NON rejoué) ;
  « n° 15 : le détail vit dans l'en-tête (dans le flux) » à réécrire selon la nouvelle règle (hauteur fixe, en absolu, l'en-tête ne s'étire pas).

## Session 4 : prochaine action, dans l'ordre
1. Réécrire le test n° 15, rejouer `calendrierEntete`, B9 compris ; commit CAL-ENTETE par chemins (Courbe.tsx, EnTete.tsx, BandeAnnee.tsx,
   entete.css, Header.tsx, periode.css, le test). Ne pas toucher aux autres fichiers modifiés de l'arbre (autre session).
2. **CAL-LENT** (message du coordinateur, avant le geste) : ligne dans DEFAUTS-RECURRENTS ; « Il y a beaucoup de lenteur sur les actions du
   calendrier... ». Mesurer d'abord : build de PRODUCTION, 390, CPU ×4 (`Emulation.setCPUThrottlingRate`), trace ; pour chaque action (semaine,
   frise, barre, courbe, événement) INP et tâches longues ; contrôle rouge sur tour7 ; corriger la cause mesurée ; chiffres avant/après.
3. Puis le geste (ancienne liste ci-dessous, points 1, 3, 4, 5).

# (session 2) port du comportement de la frise B partout

Objectif : porter le COMPORTEMENT de la frise B (R1 à R14, dépôt Brasserie `work/missions/2026-11-20-frise/frise-interactive.html`)
dans toutes les frises et tous les curseurs ; dessin inchangé. Branche `claude/port-carnet-1711`, worktree `port-carnet`.
Interdits : `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx` ; `git add -A`, stash, push, déploiement, donnée réelle.
Commit par chemins, un par endroit, « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Fait
- Session 1 : module `src/ui/geste/` ; 25 endroits (tous les `<input type="range">`, malt `Ligne.tsx`, `RatioSlider.tsx`). Voir INVENTAIRE.md.
- Session 2 (commits `8e700a7b6`, `9d6f1ddf8`, `ff5a6fafe`, `e97e51993`, `c7d79362b`, + geste.mjs) :
  - R1 sur curseur vide : mesure du jour (`BrewDayMeasurements`), appel de mesure (`AppelMesure`), prix (`CurseurPrix`) : un toucher
    ne pose plus rien ; glisser ou Entrée posent ; le clic d'un lecteur d'écran (`detail === 0`) pose encore. Textes « un toucher pose »
    devenus « glisser ou Entrée pose » / « glisser le pouce part de ». 5 tests réécrits (R1).
  - Finances `operations/Frise.tsx` : réécrit sur `useGlisse` + `poserPlage` + `roleSous` + `cadrerDeuxBouts` (R1 R2 R3 R4 R5 R7 R10 R12
    R13 ; `.ops-tr` en `touch-action:none`). Le palier « un mois par 0,6 s » (FIN-FRISE-AGRANDIR) est remplacé par R7 ; tests réécrits
    (finTour2 : R1, R2, R10, R7 ; financesLot2). Piège : la ref de la piste doit être STABLE (`useCallback`), sinon chaque rendu détache
    le geste et l'annule.
  - Calendrier `entete/Fenetre.tsx` (cadre) : R1 (6 px, `aBouge`) et R10 (Échap). 209 tests du Calendrier et de l'en-tête verts.
  - `scripts/parcours/geste.mjs` : les 4 sélecteurs corrigés (ébullition : `repli` retiré ; « 2. Sels » touché par préfixe `^` ; une
    ligne de SUCRE créée — la barre d'un grain règle sa part et ne bouge pas seul ; levure Pomona choisie puis rangée Levure du Récap.
    ouverte) ; Identité touchée (le brouillon reprend à sa dernière étape) ; « Écran indisponible » (chunk non chargé, vu une fois à 1280)
    rechargé une fois.

## Preuves
- Vitest ciblé : mesures 129/129, Finances frise 52/52, Calendrier 209/209. Suite entière et build : voir la fin de ce fichier.
- geste.mjs : voir la fin de ce fichier.

## Reste (prochaine action, par ordre)
1. Ajouter à `geste.mjs` la frise de Finances (Finances › opérations, `.ops-tr`, `role=slider` « Début »/« Fin » : toucher, sans saut,
   étirer, Échap à 1280, deux bouts à 56 px au repos) et le cadre du Calendrier (`[data-poignee=fin]`, toucher sans effet, Échap).
2. CAL-ENTETE (demande du pilote, 21.11 ; ligne dans Brasserie `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, captures
   `work/missions/2026-11-21-calendrier-entete/`, dont capture-6) : écrire D'ABORD le contrôle, rouge sur `en-ligne/2026-11-21-tour7`,
   l'ajouter à `calendrier.mjs` (ou geste.mjs), puis corriger ; captures 390 avant/après :
   1) retirer le rond pointillé de la courbe (2e refus) ; 2) panneau de semaine à hauteur fixe (le haut de « Brassins » ne bouge pas de
   plus de 1 px) ; 3) en-tête ≤ 30 % de 844 px, ≤ 20 % courbe cachée ; 4) retirer la rangée « −683 » sous les mois (redit la courbe) ;
   5) barre du haut sur UNE ligne (nom, période, recherche, avatars G A) — commune à toute l'app : vérifier les autres onglets à 390.
   Non commencé.
3. Calendrier, échelle : R4/R7 sur la courbe (52 semaines fixes) avec `cadrerDeuxBouts` ; barres glissées `frise/usePointeur.ts:182`
   (seuil, Échap, bord) et `usePincement.ts` (R14). `usePointeurCourbe.ts` est une LECTURE (appui long, lire la semaine), pas un réglage :
   seulement le seuil (8 px aujourd'hui, R1 dit 6) si on veut l'aligner.
4. Curseurs dessinés restants (INVENTAIRE « Non portés ») : `fermentescibles/Plateau.tsx:91` (le grand curseur 0…2 kg de la carte
   choisie : position absolue), houblons (`maBiere/rail.ts:233`, `maBiere/Frise.tsx:163`, `dryhopper/index.tsx:403`), paliers
   (`paliers/CourbeEmpatage.tsx:113`, `production/fiche/StageLadder.tsx:59`), `FermentationTemperatureChart.tsx:262` (poignées
   `yc-chart-handle` vues à l'étape Levure), `stock/ChiffreACommander.tsx:152`, `atelier/TodoTimeline.tsx:122`, `FriseArchives.tsx:61`.
5. Rejouer : geste.mjs (4 combinaisons), `node scripts/parcours/calendrier.mjs`, vitest entière (`npx vitest run --maxWorkers=3`), build.

Build de test : `PARCOURS_RACINE=<worktree> npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <tmp> --emptyOutDir`
(sans `PARCOURS_RACINE` le build échoue), puis `node scripts/parcours/geste.mjs <captures> --build <tmp>`.

## Résultats des rejeux (session 2)
- geste.mjs : **PARCOURS GESTE OK**, 132 contrôles, 390 tactile et 1280 souris, clair et cave, Échap à 1280 (build fait AVANT les commits
  R1/Finances/Fenetre de la session 2 ; ces endroits ne sont pas encore dans geste.mjs). Captures regardées : malt 390 cave (Dextrose
  0,75 kg), SO₄/Cl 1280 clair : dessin intact.
- NON COMMITÉS à la coupure (agent arrêté à 200 k) : `scripts/parcours/geste.mjs` (les 4 sélecteurs, prêt), `INVENTAIRE.md`, ce fichier.
  Commit par chemins : `git commit -- scripts/parcours/geste.mjs`, puis `-- work/missions/2026-11-20-frise/INVENTAIRE.md work/missions/2026-11-20-frise/REPRISE.md`.
- Lancés en arrière-plan, résultat NON LU : `node scripts/parcours/calendrier.mjs`, `npx vitest run --maxWorkers=3`, `npm run build` ;
  journaux dans le scratchpad de la session 2 (`…/scratchpad/cal.log`, `vitest.log`, `build.log`, chacun finit par « exit N ») —
  s'ils sont perdus, relancer les trois.
