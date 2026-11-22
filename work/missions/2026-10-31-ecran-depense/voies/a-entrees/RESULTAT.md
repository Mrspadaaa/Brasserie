OK — 27 choix passés : 13 atteints, 7 codés non atteints, 2 non codés, 5 douteux

Lecture seule, HEAD 3c0b61c0 (D366 déjà commité). Rien lu dans les pièces du brasseur ; aucune valeur citée. Plafond de 30 tours : pas de Chrome, chaînes lues dans le code.

## Chaîne commune de la Dépense (vraies entrées)
- Entrée A, « Lire un justificatif » : `src/App.tsx:1011` `onInvoice` → `setQuickAction('scan')` → `QuickActionModal.tsx:101,107` `expenseMode='scan'` → `:620` `<ExpenseSheet startWithScan>` → `ExpenseSheet.tsx:134` `showForm=false` → `:1314` branche `entree` (`EntreeFendue`, non discret).
- Entrée B, « Saisir une dépense » : `App.tsx:512` (`newTransaction`) ou menu `QuickActionModal.tsx:687/690` → `expenseMode='manual'` → `showForm=true` → `:1314` `EntreeFendue discret`.
- Entrées matériel : `StocksTab.tsx:532`, `UpgradeWorkspace.tsx:73` (même feuille, `initialIntent="equipment"`).
- Les conditions `import.meta.env.DEV`, `apercu`, `?depense=` (`QuickActionModal.tsx:113-119,619`, `ExpenseSheet.tsx:128`) ne servent qu'au banc : je ne les ai pas comptées.
- Tout ce qui suit la lecture (liste, plateau, QR, TVA…) vit dans `scanLayout` (`ExpenseSheet.tsx:1342`), rendu si `showForm && !busy && !attached && !dejaTx` (`:1394`) et `scan?.ok && result && statutFinal`. Ces valeurs viennent de `attach` (`:471`) ou `lirePages` (`:554`) → `GeminiScannerService.scanDocument/scanPages` → `finLecture` : une vraie lecture, sans drapeau.

## Tableau
| choix | décision | codé où | chemin depuis l'entrée | verdict | ce qui bloque |
|---|---|---|---|---|---|
| Plusieurs pages : bouton noir coupé en deux | D291, D303, D366 | `depense/Pages.tsx:12` `EntreeFendue` | entrées A et B ci-dessus → `ExpenseSheet.tsx:1302` (A) et `:1314` (B, discret) ; « Plusieurs » → `pagesInput` `:1391` | atteint | rien (corrigé par 3c0b61c0 ; témoin `entree-reelle.test.tsx`) |
| Rangée de pages, « + page », « Lire N pages » | D291 (B) | `Pages.tsx:29` `RangeePages` | `:1310` si `!attachment && !busy && pages.length>0` ; une page posée par « Plusieurs » → `ajouterPage` `:1391` | atteint | rien |
| Frise « N pages ✓ » (B) | D309 | `Pages.tsx` `FrisePages` | `:1312` (repos) et `:1321` (lecture, `busy`) | atteint | rien |
| Pile « N » dans l'en-tête et panneau des pages | D291 / n2-pages | `depense/Entete.tsx:22,30`, `Pages.tsx` `PilePages`, `PanneauPages` | `:1382` `pages={pagesJointes}` ; vrai dès que `pages.length>1` et le PDF assemblé est joint (`:586`) | atteint | rien |
| Ticket (r2b) : en-tête, récap, liste, rubriques | D227 (choix du pilote, pas du brasseur) | `Entete.tsx`, `Recap.tsx`, `Liste.tsx`, `Ligne.tsx`, `Rubriques.tsx` | `ExpenseSheet.tsx:1382-1384` et `scanLayout` | atteint | rien. Note : `depense/Ticket.tsx` (l'`Interrupteur` « Mettre en stock ») n'est importé par personne : code mort, pas un choix |
| Contrôle QR : sceau z2 | D246 | `depense/Qr.tsx` `Sceau`, `qrVue.ts` | `attach` `:494` `lancerQr(file)` → `:708` `sceauQr` → `:1342+` `ficheQr` | atteint | rien |
| p3c-2 compactée (le choix de forme de la page « p3a-3 compactée ») | D245, D248 | `depense/p3c.css`, `Liste.tsx`, `Ligne.tsx` | `scanLayout` | douteux | je n'ai pas retrouvé « son choix » dans decisions.md ; à relire : D245/D248 et comparer la capture de `choix-v3c/` à la feuille réelle dans Chrome |
| Nom d'un nouvel article d'une facture étrangère : B | D288, D296 | `ExpenseSheet.tsx:111` `NomArticle`, `depense/optionsDuNom.ts`, `nomsHoublons.ts` | `:865` et `:992` si `stockAction==='new' && neuf` ; options lues par `lireOptions` `:28` | atteint | rien (visible seulement sur une ligne « nouvel article ») |
| Lenteur D : fil « vérification » et écran dès le provisoire | D308 | `Pages.tsx` `FilVerification` ; `ExpenseSheet.tsx:394` `surProvisoire`, `:458` `optionsFlux` | `attach`/`lirePages` passent `optionsFlux` → `geminiScanner.ts:110` → `AiClient.runFlux` ; fil rendu à `:1384` si `verif==='attente'` | douteux | le provisoire vient du serveur (`functions/src/ai.ts`, `invoiceScanVote.ts`) ; sans lui `verif==='aucune'` (`:183`). Déployé selon D318/D325, non revérifié ici : lire une vraie pièce dans l'app en ligne et voir le fil |
| Lignes ajoutées par la 3e lecture : B (rangée bleue ↻) | D314 | `depense/finale.ts` `appliquerFinale`, `Ligne.tsx` | `surFinal` `:429` après un provisoire réel | douteux | même condition serveur que la ligne précédente |
| Ligne pas retrouvée : 2 D, « Tout valider » B | D313, D316 | `Pied.tsx` `BandeauPerdues`, `Liste.tsx` perdues, `Ligne.tsx` `LignePerdue` | `:1398` si `showForm && courantChg && chgSecond` (il faut une fusion avec des lignes perdues) ; `toutValider` | douteux | atteignable seulement si le final perd une ligne du provisoire : le geste n'a pas été vu dans Chrome sur la version déployée |
| Total corrigé et lecture jamais arrivée (« non vérifiée ») | D312 (A) | `finale.ts` `provisoireCoupe`, `ExpenseSheet.tsx:403` `finDePartie` | `:431` (`etat==='echec'`) ; total/TVA bleus `:1054` | douteux | même condition ; l'état « 3e lecture absente » se joue par un flux coupé réel |
| Plateau pu4d de la ligne ouverte | D361 | `depense/Plateau.tsx`, `Ligne.tsx` | `scanLayout` → `Liste` → `LigneP3c` `:1027` ; ouverture au toucher de la rangée | atteint | rien |
| Tout plier / tout déplier : « Plié \| Déplié » (E) | D311 | `Liste.tsx:28` `SegmentPlier` | `:1383` si `ordre==='cat' && etatSeg.visible` (`ordre` vaut `'cat'` par défaut, `:181`) | atteint | rien |
| Sous-familles dans une bande : D (repliées) | D307 | `depense/groupes.ts:58-165`, `familles.ts` | `calculerBandes` `:1143` → `Liste` | atteint | rien (ne paraît que sur une famille qui en a une) |
| Famille d'une ligne sous « Famille » (geste rare) | D364 | `Plateau.tsx:121` `RangeeRare` | `:1025` (`famille` absente seulement pour une mouture) | atteint | rien |
| Regrouper en une dépense / Rétablir | D332, D357 | `Liste.tsx:120-125` | `:1363` `regrouper` si `lines.length>1` ; `retablir` si `avantRegroupement && lines.length<=1` | atteint | rien |
| Arrondi à 5 centimes | D270, D358 | `Liste.tsx:116` | `:1363` `arrondi` si `arrondiDuTotal(draft)` non nul | atteint | rien (visible seulement avec un tel total) |
| Vue TVA | D250, D259 | tuile et panneau actuels `ExpenseSheet.tsx:1058-1072` (d'avant tout choix) | `scan?.ok` | non codé | aucun choix du brasseur : la page « passe 2 » attend (MISSION.md ligne 256 ; SPEC 903). La tuile qui s'affiche est celle de p3c-3, pas un choix (D123) |
| Étape Houblons (base v4.10) | ecrans.json `etape-houblons`, route `ma-biere` | `src/ui/hopIndex/maBiere/EtapeHoublons.tsx` ; `pages/BrewWizard.tsx:2536` | wizard → étape Houblons → `step==='houblons' && hopV4Actif` ; sinon `:2541` l'ancien écran | codé non atteint | `hopV4Enabled()` exige `VITE_HOP_V4==='on'` au build (`ui/hopIndex/flags.ts`). Ni `.env`, `.env.local`, `.env.example`, `package.json` (`build`), `firebase.json`, `.github` ne le posent : seuls des scripts de banc le posent |
| Ma bière (route `biere` / `hopBeer`) | ecrans.json `ma-biere` | `hopIndex/biere/EcranApp.tsx`, `HopToolLayer.tsx` | `route.open({view:'hopBeer'})` seulement depuis `devHook.ts` et depuis l'étape v4 ; couche `HopToolLayer` rendue à `App.tsx:1086` | codé non atteint | même drapeau ; aucun bouton réel ne l'ouvre sans lui (flags.ts l'écrit) |
| Suggérer (q2b) | ecrans.json `suggerer` | `hopIndex/suggerer/EcranApp.tsx` | `EtapeHoublons.tsx:52` → `hopSuggest` | codé non atteint | même drapeau |
| Comparer (cmc2k) | ecrans.json `comparer` | `hopIndex/comparer/EcranApp.tsx` ; `HopToolLayer.tsx:45` `comparerActif` | `hopCompare` depuis Ma bière, Suggérer, fiche | codé non atteint | même drapeau |
| Fiche (g1, flb5b) | ecrans.json `fiche` | `hopIndex/fiche/FicheApp.tsx` | appui long depuis les écrans v4 | codé non atteint | même drapeau |
| Dryhopper (p4b2f) | ecrans.json `dryhopper` | `hopIndex/dryhopper/outilApp.tsx` | `EtapeHoublons.tsx:54` → `hopTiming` | codé non atteint | même drapeau |
| Substituer (u4) | ecrans.json `substituer` | `hopIndex/substituer/`, `FicheApp.tsx:39` | `hopSubstitute` depuis la fiche ou l'étape | codé non atteint | même drapeau |
| Levure | ecrans.json `levure`, statut « ouvert » | route `hopTiming` avec `step:'yeast'` (`EtapeHoublons.tsx:55`) existe | idem | non codé | aucun choix du brasseur (statut ouvert, D123) ; ce qui est dans `src/` n'est pas un choix |

Les écrans Houblons existent dans l'app réelle (`src/ui/hopIndex/`), pas seulement dans la maquette jouable (`work/…`). Ils sont éteints au build : l'app déployée montre l'ancienne étape Houblons (`BrewWizard.tsx:2541`) et l'atelier V5.5.

## Écarts à lever
1. Houblons : le brasseur a choisi ces sept écrans (règle n° 1) ; aucune de ses vraies entrées ne les atteint. Décision à prendre : allumer `VITE_HOP_V4=on` au build de production (hors de mon périmètre : irréversible côté déploiement), ou lui dire pourquoi c'est éteint. À vérifier : le build déployé n'a pas de variable posée hors dépôt (je n'ai vu que le dépôt).
2. Lenteur D (4 lignes douteuses) : le client est branché ; reste à jouer une vraie pièce dans l'app déployée (fil, ligne ajoutée, ligne pas retrouvée avec « Tout valider », lecture coupée).
3. p3c-2 : retrouver sa décision, sinon c'est un choix sans trace (L24).
4. `depense/Ticket.tsx` : fichier orphelin (`Interrupteur`) ; à supprimer ou brancher avec accord.
5. Non passés faute de tours : le détail des gestes (toucher d'ouverture du plateau, « Garder » d'une ligne perdue) n'a pas été lu ligne par ligne ; ils sont classés atteints par leur appartenance à `scanLayout`, pas par un geste joué.

LEÇON PROPOSÉE : un choix est fini quand le chemin le plus court depuis l'entrée réelle de l'app le montre ; le test de réception d'un choix monte l'application par son entrée (menu ou bouton) et jamais le composant seul. Les drapeaux de build (VITE_HOP_V4) doivent figurer dans le registre `ecrans.json` pour chaque choix qu'ils cachent.
