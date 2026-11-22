# REPRISE — correction des bugs B1, B2, B4, B5, B6, B10, B11 (21.11)

Agent arrêté à ~180 k jetons. **Bugs corrigés : 0 sur 7.** Rien n'est encore rouge ni vert : l'outillage du parcours est prêt, `chaines.mjs` reste à écrire.

## Fait (worktree `port-carnet`, branche `claude/port-carnet-1711`)

Commit `aaecde10f` : « Parcours chaines : outils … » (chemins seulement) :
- `scripts/parcours/chaines-outils.mjs` : `lancerBanc(dossierBuild)` (serveur local + Chrome), `pageNeuve(banc, entrees, dossierCaptures)` = contexte jetable
  (une fixture neuve par étape), 390×844 tactile. Gestes : `toucher(texte, {prefixe, contient, regex, dans, i, att})` (touchscreen.tap, défile dans la vue),
  `ecrire(sélecteurCSS, valeur)` (tap puis clavier), `visible`, `texte`, `boutons`, `store(collection)` (lit `parcours-chaines:cache`), `attendre(regex)`,
  `demarrer()`, `onglet(nom)`, `cap(nom)`, `erreurs`.
- `scripts/parcours/fixtures/chaines.mjs` : `fixtureChaines(aujourdhui)`, tout en « ZZ TEST » (jamais `seedData.ts`) : stock (Caramünch Typ 2 à 0,6 kg, pilsner 60 kg,
  Munich, Citra, levure « ZZ TEST US-05 » 4 sachets), recette figée `R-ZZ-IPA` avec **levure nommée** + brassin planifié `B-ZZ-PLAN` (B2), lots `LOT-PA` (conditionné,
  fûts `F-001` `F-002` pleins, `F-004` livré) et `LOT-NE` (terminé, `F-003`) datés à −45 et −60 jours (B11), clients `CL-CIGOGNE` « ZZ TEST La Cigogne » et
  `CL-PONT`, tarifs « ZZ TEST Pale Ale fût 20 L » 140 et « 33 cl » 4,5 (B5, B6), plan promis `P-VENTE-CIG` (280 CHF, `LOT-PA`, `CL-CIGOGNE`), `P-MALT` (420), `P-HOTTE` (900, B10), caisse de départ +2 500.
- `scripts/parcours/fixtures/entree-app.mjs` : ajout du jeu `parcours-chaines` à `JEUX` (le point d'entrée de fixture du build de test ; il sert aussi aux builds `--ref <tag>`).

Mécanique du banc : `?dev-local&finance-demo=parcours-chaines` (même branchement que `calendrier.mjs` ; la config `scripts/parcours/vite.parcours.config.mjs` est réutilisée).
Build de test : `npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <dossier> --emptyOutDir --logLevel error` (37 s). Pour le tag : copier
la logique `--ref` de `calendrier.mjs` (`git worktree add --detach` dans `os.tmpdir()`, jonction `node_modules`, copie des `.env`).
Un build existe dans le scratchpad (`…/scratchpad/build-tete`, tête avant corrections) ; explorateur jetable `…/scratchpad/explorer.mjs` + fichiers de pas `p*.txt`.

## À écrire : `scripts/parcours/chaines.mjs`
Même squelette que `calendrier.mjs` (options `--build <dossier>`, `--ref <tag>`, `--etape B1`, dossier de captures en argument), une étape par bug, une page neuve par étape,
sortie `PARCOURS CHAINES OK` ou `ECHEC (n)` + liste. Rouge attendu sur `en-ligne/2026-11-21-tour7`, captures avant et après ouvertes.
Le tag existe (`git tag | grep tour7`).

## Gestes découverts (390 tactile, joués sur le build de tête)
Wizard recette neuve : `toucher('Actions rapides')` → `toucher('Recette')` → `ecrire('textarea[name=recipe_title_label]','ZZ TEST Brune')` (sans nom, « Suivant » reste bloqué)
→ `toucher('Suivant', {prefixe:true})` (étape Malts) → pastille `toucher('ZZ TEST Caramünch', {contient:true})` : la ligne entre à **0 kg** (WFR-3 reproduit) ;
`ecrire('textarea[aria-label^="Masse de ZZ TEST Caramünch"]','0.6')` ; la pastille `ZZ TEST Malt pilsner` n'apparaît qu'après un premier malt ; `ecrire('textarea[aria-label^="Masse de ZZ TEST Malt pilsner"]','5')`.
(Taper « ZZ TEST Malt pilsner 5 » dans « Nom (et kg) » est mal lu : nom « ZZ », 5,0 kg.) → Suivant ×2 → étape Levure : `ecrire('textarea[placeholder="Chercher une levure"]','US-05')`
→ `toucher('ZZ TEST US-05', {contient:true})` : fiche « Hors catalogue · saisie libre », « grammes, à saisir » : **la dose manque** (« Quantité de levure : à compléter. »).
Le « + » de la dose est le bouton d'aria-label « Saisir la dose en grammes » (il y en a deux, − et +) ; le tap sur `i:-1` n'a pas posé de dose : à mesurer (peut-être un clic sur le texte ; essayer le « + » par ses coordonnées ou la saisie sur le chiffre).
→ Suivant ×3 → Récap : `toucher('Enregistrer et préparer un brassin')`.

**Constat B4 déjà reproduit** (levure sans dose au lieu du malt à 0 kg, même cause) : le Récap affiche « Enregistrable · 1 repère · À compléter · 1 repère avant brassin · enregistrement possible »
(Levure : pastille « quantité, unité ») ; le toucher « Enregistrer et préparer un brassin » renvoie à l'étape Levure avec « Une valeur à corriger — Quantité de levure : à compléter ». Le récap ne dit donc pas ce qui bloque le lancement.
Le même défaut avec le malt : Caramünch laissé à 0 kg (le récap l'a affiché « Enregistrable »).
B4 attendu : le récap lit le même contrôle que le lancement (message au récap, bouton qui dit pourquoi, chaque blocage ouvre son étape).

## Pistes de code (lues, non modifiées)
- **B1** : `src/App.tsx` l.884-891 `saveFromWizard` : `activeProfile = config.brewhouses.find(…)` (profil **brut**), contrôle `recipeInstallationAdoptionIssue(recipe, activeProfile)` AVANT `saveRecipeConfirmed`.
  `src/pages/BrewWizard.tsx` : `configuredBrewhouse = currentInstallation(profile)` (l.636), l.1770 `brewhouse: installationNeedsAdoption ? details.brewhouse : rig?.equipment ? snapshotBrewhouse(…) : details.brewhouse`.
  `src/domain/recipeInstallation.ts` : l'erreur « n'est pas figé » sort si `!recipe.brewhouse` ou `(brewhouse sans equipment ET profil avec equipment)`. Piste : `activeProfile` brut ≠ `currentInstallation(profile)` ;
  si le brouillon n'a pas de `brewhouse.equipment`, figer `currentInstallation(activeProfile)` avant le contrôle (`snapshotBrewhouse`, `src/domain/brewPreferences.ts`). À PROUVER d'abord par le parcours : le dernier essai n'a pas atteint le clic « Enregistrer et préparer » avec une recette complète.
- **B2** : `src/domain/fermenterPlanning.ts` l.24-27 : `yeast?.name ? findRecipeYeastMatches(yeast.name, withDocumentedYeastNames(refs))` ; pile : `normalize` sur `undefined` dans la chaîne `findRecipeYeastMatches` / `withDocumentedYeastNames` (`src/domain/hopIndex/recipeGuide`) : une entrée du catalogue de levures sans nom.
  Appelants : `BrewEquipmentSummary`, `FeuilleBrasser` (**dirty**, voir plus bas). Parcours : `toucher('Brassins')` → `toucher('Brasser')` sur `B-ZZ-PLAN` (levure nommée) : ne doit pas montrer « Écran indisponible ».
- **B5/B6** : `src/ui/vente/enregistrerVente.ts` n'écrit qu'une `Transaction` (pas de `Keg`, pas de plan) ; `src/domain/stock/futsFiche.ts` `livrer()` n'est appelé que par la fiche du fût ; `preparerVente` ne lit aucun `FinancialPlan`.
  Parcours vente : `Actions rapides` → `Vente` → puce client « C Pro ZZ TEST La Cigogne » → `fût 20 L` ×2 → `Facturer …` (voir `work/missions/2026-11-21-workflows-app/vendre/rejeu-chaines.mjs`, chaînes C2 et C3, qui donnent les libellés exacts) →
  attendu après : `kegs` `F-001` `F-002` en état `livre` (client, date), `financialPlans` `P-VENTE-CIG` soldé (non « active »), une seule recette de 280 au Calendrier. « Facturer » depuis la chose du plan (Calendrier, rangée Ventes) doit ouvrir la caisse préremplie (WFV-14) :
  attention, ce geste passe par le Calendrier, mais le correctif est hors de `src/ui/calendrier/**` (côté vente).
  WFA-15 / WFA-12 : le script `acheter/chaine.mjs`, `acheter/facture.mjs` (lecture de facture SIMULÉE, jamais Gemini) ; un prévu ne quitte la caisse que soldé par un réel (pompe « réalisée » sans dépense : 450 CHF sortis).
- **B10** : la loupe est `src/ui/CommandPalette.tsx` (appel depuis `src/components/Header.tsx`, bouton « Rechercher (⌘K) » ; texte « Rien pour … »). Il faut y lire les choses du Calendrier (plans `financialPlans`, `creativeItems`) : chercher « Hotte » (`P-HOTTE`).
  Ne pas toucher `src/ui/calendrier/**` ; si le modèle des choses n'est exporté que de là, l'importer sans le modifier.
- **B11 (Brassins)** : `src/ui/production/liste/ListeBrassins.tsx` (période, `periode.enCours`) et `listeModel.ts` : le filtre de période par défaut « Nov. + en cours » masque `LOT-PA` (conditionné) et `LOT-NE` (terminé), alors que la caisse les vend. Une bière en vente se montre quelle que soit la période.
  `ListeBrassins.tsx` est **dirty** (modifs d'une autre session, non commitées).

## Attention : arbre sale
`git status` de `port-carnet` montre 60+ chemins modifiés ou neufs qui ne sont pas à moi (session « port-simplicité » : `FeuilleBrasser.tsx`, `ListeBrassins.tsx`, `CarteBrassin.tsx`, `QuickActionModal.tsx`, `ExpenseSheet.tsx`, `BandeauEffets.tsx`, `storage.ts`, etc.).
Les correctifs B2 et B11 toucheront probablement des fichiers déjà modifiés : commit « par chemins » impossible sans emporter leurs changements. Méthode : copier le fichier avant (`os.tmpdir()`), éditer, produire le diff
de MON seul hunk (`diff -u avant après`) et l'appliquer à l'index (`git apply --cached`), ou demander au pilote de commiter d'abord l'état de l'autre session.

## Reste à faire (ordre demandé)
1. écrire `chaines.mjs` (étape B1 d'abord), rouge sur le tag, corriger, vert, captures avant/après ouvertes ;
2. B2, B4, B5, B6, B10, B11 de même ; un commit par bug (« Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ») ;
3. `node scripts/parcours/chaines.mjs` → « PARCOURS CHAINES OK » ; `calendrier.mjs` reste OK ; suite vitest entière et `npm run build`, résultats lus ;
4. `work/missions/BUGS.md` (dépôt Brasserie) : marquer WFR-1, WFR-9, WFR-3/4, WFV-2/14, WFA-15/12/13, WFV-1, WFP-1, WFV-5 corrigés (format du registre) ; `node scripts/agents/controle-bugs.mjs` → BUGS OK.

Contrainte du brief : jamais `src/data/seedData.ts` ; pas de `git add -A`, pas de stash, pas de push ; interdits `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx`, `firestore.rules`, `src/ui/calendrier/**`, la frise.

---
# MISE À JOUR 2 (agent 2, arrêté à ~175 k jetons) — **3 bugs corrigés sur 7 : B1, B2, B4** (B5, B6, B10, B11 restent)

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Commits (par chemins, Co-Authored-By Opus 5.5) :
- `cf945eaec` **B1** (WFR-1) · `c57962659` **B2** (WFR-9) · `7a74f3078` **B4** (WFR-3/4). `scripts/parcours/chaines.mjs` existe (étapes B1, B2, B4 ; squelette `listeEtapes()` : ajouter une étape = un objet `{id, titre, joue(s)}`).
- Rouge/vert prouvés étape par étape : rouge sur `build-tete` (scratchpad ; tête avant corrections, **pas encore rejoué sur `--ref en-ligne/2026-11-21-tour7`** : à faire une fois à la fin,
  `PARCOURS_GARDER=1 node scripts/parcours/chaines.mjs <captures> --ref en-ligne/2026-11-21-tour7` ; le tag n'a pas le banc : le script copie `vite.parcours.config.mjs` et `fixtures/entree-app.mjs` dans la copie), vert sur l'arbre de travail. Captures avant/après ouvertes et regardées pour B1, B2, B4.

## Ce que la preuve a changé par rapport aux pistes
- **B1** : l'hypothèse « `activeProfile` brut ≠ `currentInstallation` » est **fausse** : un brouillon neuf, joué d'une traite, se fige et se lance (volume 24 L). Le refus « Le matériel de cette recette n'est pas figé » se reproduit
  **après une reprise de brouillon** (quitter l'appli, revenir : « Brouillon repris sur cet appareil ») : `details` du brouillon n'a pas de `brewhouse`, `base` (= la recette du brouillon) si ; `installationNeedsAdoption` lisait `details` seul.
  Correctif : `BrewWizard.tsx` l.≈640, `recipeInstallationAdoptionIssue({ brewhouse: details.brewhouse ?? base.brewhouse }, …)`. `App.tsx` n'a pas été touché.
- **Autre refus à la création, NON corrigé, à décider** : le volume par défaut d'une recette neuve = `profile.volumeL` (30 L) = capacité du fermenteur (30 L) → « Recette enregistrée. Avant de lancer : le volume prévu atteint ou dépasse la capacité physique du fermenteur… ».
  `defaultBrewVolume` dit en commentaire « un repère de mousse ne redimensionne jamais en silence » : choix assumé. Désormais le **récap le dit avant** (B4) avec « Régler · Identité ». DÉCISION À PRENDRE : volume par défaut = repère conseillé (~24 L) pour une recette neuve ? Reco : oui, à proposer au brasseur (c'est un goût).
- **B2** : la cause n'est **pas** la levure nommée : `foldStyle(undefined)` (instantané de recette sans champ `style`) levait `Cannot read properties of undefined (reading 'normalize')` via `resolveBrewingStyle` ; correctif tolérant dans `src/domain/brewingStyles.ts` + test `tests/unit/style-absent.test.ts`.
  (La fixture a des instantanés sans `style` ; en vrai, un vieux brassin peut aussi n'en avoir pas.) Le Brasser d'un brassin planifié ouvre la **page du jour de brassage** (Conduite, « Commencer aujourd'hui »), pas une feuille.
- **B4** : `RecapEtat` n'affichait que « À compléter · N repères » sans liste ; le lancement refuse `recipeFieldIssues` (invalid + missing) puis `recipeInstallationIssues` (App, après enregistrement). Maintenant : `RecapEtat` liste les `missing` (« Compléter · <étape> ») et les refus d'installation
  (prop `installation`, calculée dans `BrewWizard` par `recipeInstallationIssues(build(), configuredBrewhouse)`, bouton « Régler · Identité »). Visuel : seulement quand il y a un blocage (`rc2-corr`), sinon `rc2-sr` comme avant (maquette choisie intacte). Test `recapEtat.test.tsx` réécrit (l'ancien figeait « sans liste ni bouton »).
  Reste du chantier B4 non fait : le bouton « Enregistrer et préparer un brassin » ne porte pas la raison dans son libellé (la liste est juste au-dessus).

## Gestes qui marchent (390 tactile) — pour les étapes suivantes
`recetteNeuve(s, {volume, caramel, pils})`, `leveureCatalogue(s)` (tape « US-05 » puis la pastille **« SafAle US-05 »** du catalogue : la dose arrive par défaut, 2 sachets), `versRecap(s)` dans `chaines.mjs`.
La dose de la levure « ZZ TEST US-05 » **hors catalogue** reste à poser : le « + » `aria-label="Saisir la dose en grammes"` n'a pas posé de dose au doigt (non mesuré plus avant) : **bug possible, à noter au registre** (« hors catalogue : dose posable ? »), sans contourner le geste.
Brassins : `s.onglet('Brassins')`, bouton `Brasser · B-ZZ-PLAN` (aria-label). La liste ne montre que `B-ZZ-PLAN` (B11 : LOT-PA et LOT-NE masqués par « Nov. + en cours »).
Un build du travail (B1+B2+B4) : `…\Temp\chaines-build-bdLLft` ; explorateur `…\scratchpad\explorer.mjs` (`<build> <fichier-de-pas> <nom>`, pas `t=`, `c=`, `p=`, `e=sél|val`, `d`, `cap=`, `js=`, `goto=1`, `store=`) ; `p.reload()` dans `js=` bloque : utiliser `goto=1`.
Piège outillage : `node -e` du Bash perd les `\n` dans les chaînes et `${}` : passer par Edit ; les fichiers `.tsx` de l'arbre peuvent être en CRLF (les remplacements multilignes par script échouent : Edit ligne à ligne).

## Reste à faire (ordre) : B5, B6, B10, B11 (Brassins seulement), puis finitions
Pistes inchangées (voir plus haut) ; fichiers à surveiller : `ListeBrassins.tsx`/`FeuilleBrasser` ne sont **plus sales** (arbre propre au départ) mais une autre session écrit `src/ui/calendrier/**` (`FeuilleAjout.tsx` modifié, non à moi) : commit par chemins seulement.
Finitions : `node scripts/parcours/chaines.mjs` → « PARCOURS CHAINES OK » ; rejouer `--ref en-ligne/2026-11-21-tour7` ; vitest entier + `npm run build` (pas encore relancés : seul `style-absent` et `recapEtat` l'ont été) ;
`work/missions/BUGS.md` (dépôt Brasserie) : marquer WFR-1, WFR-9, WFR-3/4 corrigés (+ les suivants), `node scripts/agents/controle-bugs.mjs` → OK (pas encore fait).

---
# MISE À JOUR 3 (agent 3, arrêté à ~160 k jetons) — **D394, B5 (vente), B6 faits ; reste B10, B11, WF2-1, WF2-8, « + » levure, finitions**

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Commits (par chemins, Co-Authored-By Opus 5.5) :
- `42c6a322b` **D394** : `defaultNewRecipeVolume` (`brewEquipment.ts`, repère conseillé = `fermenterLimit`, 24 L ; le volume habituel du profil seulement s'il est plus petit) branché sur `BrewWizard.tsx` l.750 (recette neuve) ; `defaultBrewVolume` inchangé (adaptations) ; test `brewEquipment.test.ts` ; étape `D394` de `chaines.mjs` (recette neuve sans toucher au volume → « Enregistrer et préparer » ouvre Brasser, volume enregistré 24 L).
- `92f9d870e` **B5 (côté vente) + B6** en un seul commit (même fichier `Caisse.tsx`) : `src/domain/venteSuites.ts` (pur : `planSoldeParVente`, `planApresVente`, `futsLivrables`, `futsProposes`, `livrerFuts`) ; la caisse propose sous le ticket « Livre F-001, F-002 » (pastilles 44 px décochables) et « ✓ Solde la vente promise « … » 280 CHF » (décochable) ; après l'écriture : `finance.planId` posé dans la transaction (`enregistrerVente.ts`), plan `completed` si couvert, fûts `livre` (client, date JJ.MM.AAAA), phrase dite dans le message ; `brouillon.ts` porte `suites`. Tests `venteSuites.test.ts` (8) ; étapes `B5`, `B6`.

Rouge/vert : tous rejoués sur le tag. Build du tag gardé : `%TEMP%\chaines-build-KVR8N3` (réutiliser : `node scripts/parcours/chaines.mjs <captures> --build "$TEMP/chaines-build-KVR8N3" --etape …`).
- tour7 : **B1, B2, B4 rouges** (refus « matériel pas figé » ; « Écran indisponible … normalize » ; récap sans repère), **D394 rouge** (« Avant de lancer : … capacité physique du fermenteur », 30 L), **B6 rouge** (panier sans fûts), **B5 rouge** (plan « active », facture non liée, « La Cigogne, 2 fûts +280 » encore au Calendrier). Captures vues : D394 avant/après, B6-1 (tour7), B5-1 (travail), B5-3 (Calendrier après : rangée Ventes vide).
- travail : D394, B5, B6 verts. `tsc --noEmit` propre ; vitest ciblés verts (brewEquipment, venteSuites, caisse*) ; **vitest entier et `npm run build` PAS relancés**.
- Piège outillage : après « Facturer », le résultat reste dans la feuille Vente ; il faut `toucher('Fermer', {i:-1})` avant d'aller au Calendrier (sinon la lecture du Calendrier est à vide : faux vert).

## Non fait dans B5 (WFA-15, WFA-12, WFA-13, WFV-14), à décider ou finir
- **WFA-15** (facture 421,57 à côté de « Commande de malt −420 ») : même mécanisme que la vente = `finance.planId` sur la dépense. La forecast (`forecast.ts` l.137-160) retire du plan `out` actif ce que couvrent les transactions `finance.planId === plan.id` ; la dépense n'écrit jamais `planId` (grep : seulement le démo). À faire : `planSoldeParDepense(plans, {vendor, category, amountCents ±10 %, date})` dans `venteSuites.ts` (ou module frère), et une ligne « Solde « Commande de malt » · 420 CHF » (défaut oui, décochable) dans `src/ui/depense/ExpenseSheet.tsx` (à lire : autre session l'a modifié avant ; arbre propre au départ de cet agent). Le plan `P-MALT` (vendor « ZZ TEST », catégorie brassage, 420) est dans la fixture ; étape : saisir une dépense « ZZ TEST » 421,57 au doigt.
- **WFA-12** (Pompe « réalisée » sans dépense : 450 CHF sortis) : `StocksTab.tsx` est interdit ; le calcul est probablement dans `UpgradeWorkspace` / `isUpgradePlan` + `analyse.ts` (« completed » compté dans le prévu) : à lire avant ; WFA-13 (Parc vs Réalisés) = décision de texte, non coupé.
- **WFV-14** (« Facturer » depuis la chose du plan au Calendrier ouvre Finances) : le geste vit dans `src/ui/calendrier/**` ou `CalendrierTab.tsx` (interdits) ; côté vente il manque seulement d'ouvrir la caisse préremplie (`Caisse clientIdInitial` existe) avec la promesse : à demander à l'auteur du Calendrier.

## Reste à faire (dans l'ordre)
4. **B10** : `src/ui/CommandPalette.tsx` (appel `src/components/Header.tsx`) lit les `financialPlans` (`FinanceService.getPlans()`) et `creativeItems` : chercher « Hotte » (`P-HOTTE`) ; résultat qui ouvre le Calendrier sur la chose (voir comment la palette navigue). Étape B10 : `toucher('Rechercher', {prefixe:true})` (bouton « Rechercher (⌘K) »), `ecrire` « Hotte », attendre « ZZ TEST Hotte » ; rouge attendu sur tour7 (« Rien pour … »).
5. **B11 (Brassins)** : `ListeBrassins.tsx` / `listeModel.ts` : « Nov. + en cours » masque `LOT-PA` (conditionné) et `LOT-NE` (terminé) alors que la caisse les vend : une bière vendable (`brassinsVendables`, `src/ui/vente/brassinsVendables.ts`) se montre quelle que soit la période. Étape : `s.onglet('Brassins')` doit montrer « ZZ TEST Pale Ale » et « ZZ TEST NEIPA ».
6. **WF2-1** : compagnon de brassin du jour, 1er « Terminer et continuer » (Eau et sels) → « Écran indisponible ». Fixture à écrire : brassin démarré (`status: 'brassage'`, recette complète, levure liée au stock sans nom) ; cause non lue (peut-être la famille de B2 : un champ absent d'un instantané). Voir `passe2/fixture-passe2.mjs` et `passe2/pas/jour.txt` (Brasserie, mission) pour l'état de départ ; jouer avec `explorer.mjs`.
7. **WF2-8** : Budget d'un brassin « ? CHF/L » alors que le stock a ses prix (pilsner 1,6/kg, Citra 0,09/g, US-05 4,5) : `brewBudget.ts` (`src/domain/finance/`, **modifié par une autre session : lire `git diff` avant, commit par hunk**) ; `passe2/pas/cout.txt`. Fixture : brassin planifié avec stock chiffré (`B-ZZ-PLAN` + stock ZZ existent déjà dans la fixture chaînes).
8. **« + » de la dose d'une levure hors catalogue** : joué par `leveureCatalogue` seulement pour le catalogue. À mesurer : étape levure, `ecrire('textarea[placeholder="Chercher une levure"]','US-05')` puis `toucher('ZZ TEST US-05', {contient:true})` (fiche « Hors catalogue · saisie libre »), puis `toucher('Saisir la dose en grammes', {i:-1})` : lire si la dose passe de « à compléter » à une valeur ; si non, vrai bug (lire le composant d'après `grep -rn "Saisir la dose en grammes" src`).
9. Finitions : `node scripts/parcours/chaines.mjs` (toutes les étapes : B1, B2, B4, D394, B6, B5 + les suivantes) → « PARCOURS CHAINES OK » ; `calendrier.mjs` OK ; vitest entier + `npm run build` lus ; `work/missions/BUGS.md` (dépôt Brasserie, branche `refonte-houblons-v4`) : marquer B1, B2, B4 (WFR-1, WFR-9, WFR-3/4), B5 (WFV-2 ; WFA-15/12/13 et WFV-14 **non**), B6 (WFV-1), puis les suivants corrigés ; verser les WF2-n absents (WF2-1 à WF2-9, source `BUGS-passe2.md`) au format du registre ; `node scripts/agents/controle-bugs.mjs` → OK.
Contraintes inchangées : jamais `seedData.ts`, pas de `git add -A`/stash/push ; interdits `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx`, `firestore.rules`, `src/ui/calendrier/**`, la frise, `calendrier.mjs`, `lenteur.mjs`, `scripts/parcours/principes.mjs` ; ne jamais inclure `source4-portable-bundle-manifest-01.json`. `git status` montre aussi `CalendrierTab.tsx`, `calendrier.ts`, `brewBudget.ts`, `useDonneesCalendrier.ts` modifiés par d'autres sessions.

---
# MISE À JOUR 4 (agent 4, arrêté à ~180 k jetons) — **B10, B11, WF2-1 faits** ; reste WF2-8, « + » de la dose, WFA-15, WFA-12, WFV-14 (+ WFA-13 : texte le plus court), finitions

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Commits (par chemins, Co-Authored-By Opus 5.5) :
- `4c384393d` **B10** : la loupe lit les choses du Calendrier (`financialPlans` non annulés + fêtes `creativeItems` type `event`) : groupe « Calendrier » dans `commandGroups` (`App.tsx`), ids `cal-plan-…` / `cal-fete-…`, type `chose` (`components/recherche/modele.ts`, icône `CalendarDays` dans `CommandPalette.tsx`) ; le résultat ouvre le Calendrier (`centrerSur` = date) et, si la date tombe hors de la période de l'app (le Calendrier suit cette période), pose la période sur le mois de la chose (`ouvrirChoseCalendrier`). Test `recherche-chose.test.ts`. Étape `B10` (rouge tour7 « Rien pour « Hotte » », vert ; captures B10-1 et B10-2 ouvertes). Ce commit contient aussi l'étape `B11` de `chaines.mjs`.
- `2c1e475f9` **B11** : `listeModel.ts` `dansPeriode` : avec « les en cours », on garde aussi `brassinsVendables` (conditionné ou terminé avec conditionnement noté, non archivé) ; libellés « + en cours, en vente » (`ListeBrassins.tsx`) et « Les en cours et en vente, toujours » (`FeuilleFiltres.tsx`) ; `port-q2-liste.test.tsx` mis à jour (Z3 conditionné reste hors période). Étape `B11` rouge tour7 / verte. Pas de capture de la feuille Filtres (le libellé plus long du bouton n'a pas été regardé à 390 : à vérifier).
- `6a1ca2ff9` **WF2-1** : cause = `brewCompanion.ts` `brewIngredients` : `name: recipe.yeast.name` indéfini pour une levure liée au stock sans nom → `.trim()` dans `BrewIngredients.tsx` (« réservé ») ; fallback `'Levure'`. Fixture `B-ZZ-JOUR` (planifié aujourd'hui, `yeast: { stockItemRef: 'ZZ-US05' }`, sels) dans `fixtures/chaines.mjs` ; étape `WF2-1` (deux « Terminer et continuer » : Concassage puis Empâtage ; le déroulé complet est un vrai brassage de 6 h, hors parcours) rouge tour7 (« Écran indisponible », TypeError trim), verte. Test `brewCompanion-levure-sans-nom.test.ts`.

Builds : tour7 `%TEMP%\chaines-build-KVR8N3` ; tête (B10, B11, WF2-1) `%TEMP%\chaines-build-uPApIb` ; explorateur `…\scratchpad\explorer.mjs` (sortie bavarde : filtrer par `grep -E "JS|ECHEC|ERREURS"`).
Non encore relancés : les étapes B1, B2, B4, D394, B5, B6 avec la tête ; vitest entier ; `npm run build` ; `calendrier.mjs`.

## WF2-8 : diagnostic commencé (non corrigé)
Budget d'un brassin planifié (`B-ZZ-PLAN`, stock ZZ chiffré) : Brassins → `Ouvrir le brassin B-ZZ-PLAN` → `Dossier` → `Estimer le budget de ce brassin` → feuille « Argent · ZZ TEST IPA » : chaîne en 6 étapes, « ? CHF/L », et sous « Pour compléter cette chaîne » : « Coût du brassin « ZZ TEST IPA » — Pas encore chiffré : sans lui, pas de coût du litre › » (ligne qui se touche : à jouer, elle ouvre probablement l'estimateur `estimateBrewBudget`, `src/domain/finance/brewBudget.ts` l.318). Le bouton « Proposer » du bas ouvre le compagnon IA, pas un chiffrage. Piste : sans estimation enregistrée, la chaîne n'utilise pas les prix du stock (`pricePerUnit` pilsner 1,6 / Citra 0,09 / US-05 4,5) ; soit l'estimation doit se proposer d'office depuis le stock (marquée « estimé »), soit le lien « Coût du brassin » doit mener à l'estimateur déjà rempli. À jouer au doigt (`toucher('Coût du brassin', {contient:true})`) avant de choisir. Les litres « Brassin pas encore fait » restent inconnus (jamais 0) : normal.

## Reste (ordre)
1. WF2-8 (ci-dessus) ; 2. « + » de la dose d'une levure hors catalogue (gestes en MISE À JOUR 3 n° 8) ; 3. WFA-15 (`planSoldeParDepense`, `ExpenseSheet.tsx`), WFA-12 (pompe « réalisée » sans dépense), WFV-14 (Facturer depuis la chose du plan : ouvre Finances, doit ouvrir la caisse préremplie ; geste dans `src/ui/calendrier/**`/`CalendrierTab.tsx` interdits : côté vente, `Caisse clientIdInitial`) ; WFA-13 texte le plus court + choix noté ;
4. finitions : `node scripts/parcours/chaines.mjs <captures>` → « PARCOURS CHAINES OK » (toutes étapes) ; rejouer `--ref en-ligne/2026-11-21-tour7` ; `calendrier.mjs` OK ; vitest entier + `npm run build` lus ; `work/missions/BUGS.md` : marquer corrigés WFR-1, WFR-9, WFR-3/4, WFV-1, WFV-2, B10, WFV-5 (B11), WF2-1 + verser WF2-1 à WF2-9 (source `BUGS-passe2.md`) au format du registre ; `node scripts/agents/controle-bugs.mjs` → OK.
Contraintes inchangées (jamais `seedData.ts`, pas de `git add -A`, ne jamais ajouter `source4-portable-bundle-manifest-01.json`, interdits calendrier/frise/`calendrier.mjs`/`lenteur.mjs`/`principes.mjs`).

---
# MISE À JOUR 5 (agent 5, arrêté à ~170 k jetons) — **WF2-8, « + » de la dose faits ; WFA-15 codé (parcours à jouer)** ; reste WFA-12, WFV-14, WFA-13, WFA-15 (preuve), captures 390, finitions

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Commits (par chemins, Co-Authored-By Opus 5.5) :
- `aa260ccff` **WF2-8** : cause = le budget exige de confirmer chaque « ancien prix » du stock (`pricePerUnit`, HT ou TTC inconnu : « Ancien prix à confirmer ») ; sans estimation enregistrée, la chaîne dit « Pas encore chiffré ». Correctif : `src/domain/finance/prixDuStock.ts` (`prixDuStockPropose`, pur) + `BrewBudgetSheet.tsx` : un bouton « Reprendre les N prix du stock » (« Estimés, TTC supposé »), puis phrase « N prix du stock repris (estimés, TTC supposé). Annuler » ; rien posé seul (R1, R8) ; un article sans prix n'est jamais repris. Test `prixDuStock.test.ts` ; étape `WF2-8` (rouge sur `chaines-build-uPApIb`, verte ; captures ouvertes : 71,10 déjà payé stock + 13,50 à payer, la ligne « Coût du brassin — pas encore chiffré » a disparu de la chaîne). **Limite dite** : les litres nets d'un brassin planifié restent inconnus (« ? CHF/L » : voulu, jamais 0 ni volume brassé).
- `5065e911a` **« + » de la dose** : MESURÉ, pas un bug : levure hors catalogue (état libre, `CarteDose.tsx` l.83-97, critique du 20.11 n° 3) : le 1er toucher sur +/− ouvre le champ « grammes » (au focus, vide), la dose se tape (11) puis « OK » ou un 2e « + » pose 1 g ; le récap la garde. Aucun code changé ; étape `DOSE` (verte) fige le geste. À signaler au brasseur seulement si « 1 g » comme pas de départ le gêne (goût).
- `4ec506332` **WFA-15** (code, preuve à finir) : `planSoldeParDepense` dans `src/domain/venteSuites.ts` (plan `out` manuel actif non récurrent, même fournisseur sinon même catégorie, ±10 %, un seul candidat) ; `ExpenseSheet.tsx` lie d'office `draft.planId` (accordéon « Lier à une dépense prévue » ouvert, phrase « Lié d'office … choisis « Aucune » pour garder les deux », refus mémorisé `lienRefuse`) ; la prévision (`forecast.ts` l.143) compte alors la facture à la place du prévu. Tests `venteSuites.test.ts` (11) et 12 fichiers `depense*`/`expenseSheet*` (136) verts. **Il manque l'étape de parcours** : saisir au doigt une dépense « ZZ TEST » 421,57 (fournisseur « ZZ TEST », catégorie brassage) → ouvrir « Lier à une dépense prévue » → vérifier `P-MALT` choisi → Enregistrer → Calendrier rangée Achats : plus de « Commande de malt −420 » à côté de la facture. Gestes de la saisie : voir `acheter/chaine.mjs` et `acheter/facture.mjs` (Brasserie, mission) ; sinon `Actions rapides` → `Dépense`. Rouge à prouver sur tour7 (`--ref en-ligne/2026-11-21-tour7`).
- `chaines.mjs` : la regex `/\s+/g` d'une étape B10 avait perdu son `\s` (corrigé dans le commit WF2-8).

Builds : arbre au commit WF2-8 `%TEMP%\chaines-build-7pRbOM` ; tour7 `%TEMP%\chaines-build-KVR8N3`.

## Reste (ordre)
1. Étape de parcours WFA-15 (ci-dessus), rouge tour7 / verte, capture ouverte ; commit.
2. **WFA-12** (Pompe « réalisée » sans dépense retire 450 CHF) : `StocksTab.tsx` interdit ; chercher dans `UpgradeWorkspace.tsx`, `src/domain/finance/upgrades.ts`/`upgradeForecast.ts` (`isUpgradePlan`, plan `completed` compté comme sorti) ; un prévu ne quitte la caisse que soldé par un réel. **WFA-13** : texte de la fiche (« Il passe seul dans Réalisés quand sa dépense liée est payée ») vs Parc : choisir le texte le plus court qui dit où va la pompe, noter le choix. **WFV-14** : « Facturer » depuis la chose du plan ouvre Finances : le geste est dans `src/ui/calendrier/**`/`CalendrierTab.tsx` (interdits) ; côté vente, vérifier que `Caisse` accepte déjà la promesse (`clientIdInitial`) et le dire à l'auteur du Calendrier.
3. Capture à 390 (tactile) du bouton « + en cours, en vente » (liste Brassins) et de la feuille Filtres (« Les en cours et en vente, toujours ») : rien ne doit déborder, ouvrir les images. Puis aussi la feuille budget avec le bouton « Reprendre les N prix du stock » (déjà vue : tient à 390).
4. Finitions : `node scripts/parcours/chaines.mjs <captures>` (toutes les étapes : B1, B2, B4, D394, B6, B5, B10, B11, DOSE, WF2-8, WF2-1, + WFA-15) vert sur l'arbre ; `PARCOURS_GARDER=1 … --ref en-ligne/2026-11-21-tour7` rouge ; `calendrier.mjs` OK ; `npx vitest run` entier et `npm run build`, résultats lus (jamais lancés) ; `work/missions/BUGS.md` (dépôt Brasserie, branche `refonte-houblons-v4`) : marquer corrigés WFR-1, WFR-9, WFR-3/4, WFV-1, WFV-2, B10, WFV-5, WF2-1, WF2-8, WFA-15 (et le reste fait) et verser WF2-1 à WF2-9 (source `BUGS-passe2.md`) ; `node scripts/agents/controle-bugs.mjs` → BUGS OK.
Contraintes inchangées (jamais `seedData.ts`, pas de `git add -A`/stash/push, jamais `source4-portable-bundle-manifest-01.json`, interdits calendrier/frise/`calendrier.mjs`/`lenteur.mjs`/`principes.mjs`/`StocksTab.tsx`).

---
# MISE À JOUR 6 (agent 6, arrêté à ~170 k jetons) — **WFA-15 (parcours), WFA-12, WFA-13, capture 390 faits** ; reste WFV-14 (bloqué : fichier Calendrier), finitions

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Commits (par chemins, Co-Authored-By Opus 5.5) :
- `ac2abdbde` **WFA-15, étape de parcours** : `Actions rapides` → `Écriture` → `Saisir sans justificatif` → « Pour quoi ? », `#purchase-total` 421,57, fournisseur « ZZ TEST » → accordéon « Lier à une dépense prévue » : rouge sur tour7 (lien « Aucune prévision liée », `planId` aucun, « Commande de malt −420 » reste au Calendrier = malt compté deux fois), vert sur l'arbre (`P-MALT` lié d'office, plus de « Commande de malt »). Captures ouvertes (WFA-15-2-lien, -4-calendrier, arbre et tour7).
- `f9a929a2b` **WFA-12 + WFA-13** : `src/domain/finance/realiseSansAchat.ts` (pur) ; « Marquer comme réalisé » sans achat lié demande d'abord (`Confirmation` : « aucun achat lié », « sortent de ta prévision sans avoir été payés », boutons Garder / Réalisé, sans achat) dans `UpgradeSheet.tsx` (piste, lien sous « Acheté ») et `UpgradeWorkspace.tsx` (`FicheProjet`). Un prévu ne quitte la caisse que soldé par un réel, ou par un accord explicite. Test `realiseSansAchat.test.ts`. Étape `WFA-12` (fixture `P-POMPE` « ZZ TEST Pompe de transfert » 450, +8 j) : rouge tour7 (« le plan est completed »), verte ; capture WFA-12-2-demande ouverte.
  **WFA-13 (choix de texte)** : la carte « À venir » garde sa phrase (un test la fige) et ajoute : « Il n’entre au Parc que par une fiche matériel, créée avec l’achat. » (le texte le plus court qui dit où va la pompe).
  Outillage : `fixtureChaines(aujourdhui, { sansJour })` : sans `B-ZZ-JOUR` sauf pour l'étape WF2-1 (sur tour7 ce brassin sans nom de levure fait tomber Calendrier et Stocks : les étapes suivantes étaient rouges pour la mauvaise raison). `principes.mjs` appelle toujours la fixture complète.
  Piège : `toucher('Marquer comme réalisé', {contient:true})` tape la station parente ; passer `dans: '.pjd-lien'`.
- Commit suivant **B11** : l'étape B11 prend aussi la capture 390 du libellé « + en cours, en vente » (tient dans la barre) et de la feuille Filtres jusqu'à « Les en cours et en vente, toujours » : captures ouvertes, rien ne déborde.

## WFV-14 : NON fait, décision à prendre
« Facturer » sur la chose du plan : `src/components/tabs/CalendrierTab.tsx` l.798 : `onFacturer: () => { setSelectionId(null); onOpenFinances(); }` : fichier du Calendrier, interdit. Correctif prêt à décrire à son auteur : ouvrir la Caisse (`Caisse clientIdInitial={chose.source.plan.clientId}`) à la place d'`onOpenFinances` ; la caisse propose déjà de solder la vente promise du même client (B5). DÉCISION À PRENDRE : autoriser ce changement d'une ligne dans `CalendrierTab.tsx` (reco : oui, une fois la session Calendrier commitée), ou le confier à l'auteur du Calendrier.

## Reste (ordre)
1. finitions : `node scripts/parcours/chaines.mjs <captures>` → « PARCOURS CHAINES OK » (lancé en fin de session : voir RESULTAT/dernier message) ; rejouer `PARCOURS_GARDER=1 … --ref en-ligne/2026-11-21-tour7` (rouge attendu : B1, B2, B4, D394, B5, B6, B10, B11, WF2-1, WF2-8, WFA-12, WFA-15) ; `calendrier.mjs` ; `npx vitest run` entier ; `npm run build` ; résultats lus.
2. `work/missions/BUGS.md` (dépôt Brasserie, branche `refonte-houblons-v4`) : marquer corrigés WFR-1, WFR-9, WFR-3/4, WFV-1, WFV-2, WFV-5 (B11), B10, WF2-1, WF2-8, WFA-12, WFA-13, WFA-15 ; verser WF2-1 à WF2-9 (source `BUGS-passe2.md`) ; WFV-14 reste ouvert ; `node scripts/agents/controle-bugs.mjs` → BUGS OK.

## État en fin de MISE À JOUR 6 (preuves de finition)
- `node scripts/parcours/chaines.mjs` sur l'arbre (port-carnet, après commit B11-390) : **PARCOURS CHAINES OK**, 13 étapes vertes (B1, B2, B4, D394, B6, B5, B10, B11, DOSE, WF2-8, WF2-1, WFA-15, WFA-12).
- Même parcours sur `en-ligne/2026-11-21-tour7` (build `%TEMP%\chaines-build-KVR8N3`) : **ECHEC (14)** : toutes les étapes rouges sauf DOSE (par conception).
- **Vitest entier et `npm run build` : lancés en fond, résultats NON lus.** Logs : `…\scratchpad\vitest-tout.log` (fin : ligne `VITEST_FIN <code>`) et `…\scratchpad\build-tout.log` (`BUILD_FIN <code>`), scratchpad `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad`. Les lire (`grep -E "Test Files|Tests |FAIL|VITEST_FIN"`), relancer seulement ce qui manque ; un échec hors de mes fichiers (calendrier, `brewBudget`) est à noter, non à corriger.
- NON fait : `calendrier.mjs` (rejeu), `BUGS.md` (format dense : colonnes statut/état ; lignes WFA-15 l.2050, WFA-4 l.2039, WX2 l.2102 ; il n'y a pas encore de lignes WF2-n : les verser depuis `BUGS-passe2.md`), `controle-bugs.mjs`, WFV-14 (décision ci-dessus).
- `git status` de `port-carnet` : seuls restent modifiés par d'autres sessions `source4-portable-bundle-manifest-01.json`, `src/ui/calendrier/entete/EnTete.tsx`, `frise.css`, `work/missions/2026-11-20-frise/REPRISE.md` (non à moi).

---
# FINITIONS (agent finitions, 21.11) — résultats lus

- **Registre** : `work/missions/BUGS.md`, commit `93767ba00`. États posés : corrigés WFR-1 (ligne ajoutée, D394 incluse), WFR-9, WFV-1, WFV-5, WFP-1, WF2-1, WF2-8 ; en cours WFR-3 et WFR-4 (la pastille ajoute encore 0 kg ; le bouton ne dit pas pourquoi), WFV-2 (reste WFV-14). WF2-1 à WF2-9 versés (source `BUGS-passe2.md`, empreinte c30eedd8ca7d). `node scripts/agents/controle-bugs.mjs` : **BUGS OK : 1539 bugs, 147 ouverts, 168 sources**.
- **Vitest entier** (`npx vitest run --maxWorkers=2`, port-carnet) : **non terminé** à la fin de cette passe (sortie `scratchpad/vitest-reprise-final.log`, sans résumé après ~25 min ; deux autres suites vitest tournaient en parallèle dans port-carnet depuis 11:08 et 11:10). Résultat (relu après la fin du processus, 21.11) : **pas de ligne de résumé** dans le log (`scratchpad/vitest-reprise-clean.txt`) ; **1356 fichiers verts, 15 fichiers en échec** (`tests/integration/` : YeastBeerTarget, YeastRecipeWorkbench, calendrier-onglet, calendrierFrise, calendrierGestes, fix114, hopV55PageQualifiedAdviceFullCatalogue, recipeAiWorkflow (10 échecs), recipeEditing (12), yeastCandidateWizardPersistence (7), yeastPitchingWizardOwnership (4) ; `tests/unit/` : calPasseCourbe, designTokens, invoiceScanCache-d273c, rejeu-649b/virgule-transversale). Échecs ≈ 50 tests. **À trier** : recipeEditing, recipeAiWorkflow et yeastCandidateWizard touchent l'assistant recette, où B1, B2, B4, D394 ont modifié `BrewWizard.tsx` ; calendrier et invoiceScanCache sont hors de mes commits (autres sessions). Non diagnostiqué dans cette passe.
- **Build** (`npm run build`, port-carnet) : `tsc` et `vite build` passent (`built in 1m 3s`). L'étape finale `check-build-flags.mjs dist` **échoue** : « DRAPEAUX ECHEC — VITE_CARNET_IA absent ou inattendu dans dist ». Le `.env` de port-carnet (19.11) ne porte pas `VITE_CARNET_IA` (grep vide, à comparer avec le `.env` du dépôt principal). Sortie : `scratchpad/build-reprise-final.log`. Non corrigé : `.env` hors périmètre de cette passe.
- **Parcours** : non relancés dans cette passe (`chaines.mjs` figé à 13 étapes vertes, voir MISE À JOUR 6).
- **Points à décider** : WFR-6 (bouton « + » par-dessus l'assistant) est dans `BUGS-produire.md` mais n'a pas de ligne au registre : non ajoutée ici. Le choix de gravité « en cours » pour WFR-4 contredit la liste demandée (B4 « fait ») : le bouton reste à faire, d'après MISE À JOUR 2.
