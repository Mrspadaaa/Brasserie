# Reprise — port de la fiche du Calendrier (D412, 21.11)

Arrêt à ~150 k (images des captures lourdes). Rien n'est encore modifié dans le code ; tout ci-dessous est lu et vérifié.

## Demande (brief du pilote)
Porter v02 « Pastilles chiffrées » (`v02.html`, slots dans `versions.mjs` l. 75-121) avec SES modifications : plus de couleur et
d'icônes ; ≤ 120 px de haut au repos à 390 (v02 : 186) ; pleine largeur ; plus de place aux actions ; action à la volée gardée
(toucher une pastille de date → elle s'élargit en règle avec un pouce, la valeur bouge en direct, cf. `captures/v02-edition.jpg`).
Greffes : souche colorée de v07 (bloc gauche teinte de rangée : picto d'état, J79, « en garde ») sans espace gâché ; volets en
sous-menu de v04 (un volet à la fois : achats manquants + Commander, frais, liens) ; dates exactes de v09 (fil des étapes) à un
toucher, jamais au repos. CHE-2 (Supprimer, avec Annuler) et CHE-5 (Modifier un brassin : renommer, changer la date) dans la fiche.
Corriger `DetailChose.tsx:304` (« aucun budget pour cette recette » quand seul l'emballage manque : lire ce que `coutAVenir` signifie
dans `src/domain/calendrier.ts` avant de changer le texte).

## Où
Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711). D'autres voies y écrivent :
`CalendrierTab.tsx` (+20 l. à eux), `frise.css` (+4), `calendrierGestes.ts` (+60), `calendrier.ts` : commit par hunks avec index
temporaire (`GIT_INDEX_FILE=… git read-tree HEAD; git apply --cached <mes hunks>`). `DetailChose.tsx` est propre (à moi).
Mettre le CSS neuf dans un fichier à moi (`src/ui/calendrier/frise/fiche.css`, importé par DetailChose), pas dans frise.css.

## Faits lus
- `DetailChose.tsx` (370 l.) : props onFermer, onOuvrir, onCommander, onBudget, onModifier, onRenommer, onRetirer, onSupprimer
  (poche seule aujourd'hui), onFait, onPoser, onAccepter, onFacturer, onMettreDeCote, liens/onLier, onDelier ; `degagerDuVolant`
  exporté (garder) ; `sansLaDate`, `datesInsecables`, `groupesInsecables` exportés (tests). Attributs lus par tests et scripts :
  data-detail, data-etapes, data-etape, data-manque, data-courses, data-cout-a-venir, data-budget-repris, data-frais, data-apercu-lien,
  data-lien-fete, data-ouvrir-feuille, data-retirer, data-supprimer, data-delier, data-det-lier, data-lier, data-lier-id,
  data-duree-detail, data-semaine-detail, data-date-jours, data-plage, aria-label « Détail : <titre> ». Les garder (ou adapter les tests).
- Tests qui lisent la fiche : tests/integration/calendrier{Detail,EnLigne1,Entete,Frise,Gestes,JalonsLies,LotA,LotC,Messages,PaquetF,
  PaquetG-frise,PaysageV1bis,Tour3}.test.tsx, calFeuilleJour, calRenvois, tests/unit/ct4CalendrierDetail, bugs-v3-t32-brassage-passe ;
  scripts : controle-calendrier-app.mjs, vision-calendrier.mjs, parcours/calendrier.mjs. Rejouer après le port.
- Appel : `CalendrierTab.tsx` ~l. 858, `detail(chose)` ; `editable = (creative || plan manuel) && !proposition` ; `ecrire(res, depuisMenu,
  ancre, ouvreSonDetail)` (l. 419) ; contexte `ctxRef.current` / `ctxGestes`.
- Gestes (`src/domain/calendrierGestes.ts`) : `deplacerJours(chose, jours, ctx)` (brassin : plannedBrewDate, jalons suivent → CHE-5 date),
  `allonger(chose, jours, ctx)` (fin ; brassin : finPrevue), `allongerDebut(chose, jours, ctx)` (début, fin gardée), `retirer`,
  `supprimerSansDate` (l. 669 : op `supprimer` sur creativeItems, message `annuler(...)`, inverse automatique par ecritures.ts l. 43).
  CHE-2 : généraliser en `supprimer(chose)` (creative → creativeItems, plan manuel → financialPlans ; brassin : refus), message
  « Supprimée : X · Annuler ». CHE-5 renommer : patch `{ collection: 'batches', id, patch: { name } }` (Collection inclut 'batches').
- Teintes : `CLASSE_TEINTE[rangee]` donne `--c` (couleur) et `--ct` (texte) ; étapes : `ETAPE_BRASSIN` (etapes.ts) avec
  `couleurEtape(id)` / `encreEtape(id)` (jetons de thème, clair et cave). Fond de fiche actuel : `rgb(var(--cave-900))`.
- Contrôle : `scripts/parcours/geste.mjs` (port-carnet), sections dans `jouerCalendrier` (appels l. ~677-686) ; modèle
  `sectionModifier` (l. 495). `--ref en-ligne/2026-11-21-tour8` construit le tag. Fixture « ZZ TEST Geste » (ID P-ZZ-GESTE, travaux).
  Ajouter `sectionFiche` : toucher la barre « ZZ TEST Geste » (`[aria-label^="ZZ TEST Geste,"]`) puis un brassin de la fixture ;
  mesurer `[data-detail]` : hauteur ≤ 120 px à 390 (rouge sur tour8 : la fiche texte fait ~300), largeur ≥ largeur de la frise − 8,
  `[data-souche]` présent, une pastille de date touchée → `[data-regle]` en place, glisser +3 j → valeur écrite (+3 j) relue après
  rechargement ; `[data-supprimer]` présent sur une chose créée, Supprimer puis Annuler la rend ; brassin : titre renommable et
  pastille brassage réglable. Mettre la ligne CAL-FICHE de DEFAUTS-RECURRENTS (dépôt Brasserie, l. 466) au contrôle « après son choix »
  (≤ 120 px au repos à 390, pleine largeur, action à la volée, Supprimer) et citer `geste.mjs` section fiche.

## Maquette cible (390, ≤ 120 px)
Ligne A 26 px : nom renommable (souligné pointillé) · montant · × (cible 40). Souche gauche (≈ 56 px, fond `--c`, encre blanche/sombre
selon thème) sur lignes A+B : picto d'état + J79 + mot d'état ; un toucher ouvre le volet « dates » (fil v09 : chaque étape datée).
Ligne B 44 px : pastilles icône + valeur (début, fin/prête, CHF ou manque) ; inconnu en pointillé ; date touchée → règle sur place.
Ligne C 40 px : Ouvrir › (principale, large) + Commander/Budget/Lier/Modifier en icône + mot, `⋯` → volet (Mettre de côté, Ranger
sans date, Délier, Supprimer). ≥ 760 px : B et C sur une ligne. Deux thèmes.

## État au 21.11, voie 2 (arrêt à ~150 k, code écrit, RIEN commité)
Dans port-carnet, non commité :
- `src/ui/calendrier/frise/DetailChose.tsx` réécrit (à moi, fichier entier) : souche `[data-souche]` (couleur de l'étape en cours via
  couleurEtape/encreEtape, sinon `--c`), ligne A nom renommable + `[data-montant]` + ×, ligne B pastilles `[data-pastille=debut|fin|chf|manque]`,
  pastille de date touchée → `Regle` (`[data-regle]`, `data-regle-valeur` = ISO, role slider, 8 px/jour = `PX_JOUR`, lâcher écrit, ←/→/Entrée/Échap),
  ligne C : principale `.cal-fi-pri` (« Ouvrir », aria-label = LIBELLE_OUVRIR), 3 secondaires (Commander, Budget, Fait, Modifier, Lier), reste
  sous `[data-plus]` (Mettre de côté, Délier, Ranger sans date `[data-retirer]`, Supprimer `[data-supprimer]`). Volets un à la fois :
  `[data-volet=dates]` (souche : fil `[data-etapes]`, notes, data-cout-a-venir, frais, aperçu lien…), `[data-volet=achats]` (pastille manque :
  `[data-manque]`, `[data-courses]`, Commander), `[data-det-lier]`, `[data-volet=plus]`. Texte coût à venir corrigé (« un montant manque encore »,
  cf. CHD-11 : `coutAVenir` = aucun budget OU emballage/courses sans montant, useDonneesCalendrier.ts:174).
- `src/ui/calendrier/frise/fiche.css` neuf (à moi), importé par DetailChose ; jetons `--alert`, `--alert-strong`, `--cave-*`.
- `src/domain/calendrierGestes.ts` : MON hunk = `export function supprimer(chose)` (avant « E30, E46 : Fait »). Le reste du diff (+60) est à une autre voie.
- `src/components/tabs/CalendrierTab.tsx` : MES hunks = import `supprimer` ; bloc brassin (onRenommer batches/name, onDecalerDebut
  deplacerJours, onDecalerFin allonger, ecrire(…, true, chose.id, true)) ; bloc editable (onDecalerDebut : allongerDebut si plage sinon
  deplacerJours ; onDecalerFin : allonger) ; onSupprimer `editable && !sansDate` → supprimer(chose). Le reste du diff est à une autre voie.
- `npx tsc --noEmit -p .` : vert. Vitest ciblé (18 fichiers) : 26 échecs / 436, liste dans `echecs-vitest-fiche.txt`. Causes attendues :
  contenus désormais dans un volet (cliquer `[data-souche]`, `[data-pastille=manque]` ou `[data-plus]` d'abord), « Ouvrir le brassin » en
  texte → aria-label, « Budget › » → « Budget ». Corriger les TESTS (ouvrir le volet), pas remettre le contenu au repos.

## Prochaine action
0. Adapter les 26 tests (liste ci-dessus), relancer vitest ciblé, `npm run build`. Puis commit par chemins avec index temporaire
   (DetailChose.tsx, fiche.css entiers ; hunks `supprimer` et CalendrierTab seulement), puis étapes 3-4 (sectionFiche, rouge tour8 / vert arbre).
1. (fait) Réécrire DetailChose.tsx + fiche.css ; brancher onDecalerDebut/onDecalerFin, onSupprimer généralisé, onRenommer brassin dans
   CalendrierTab (mes hunks seulement). 2. Corriger le texte coût à venir. 3. sectionFiche dans geste.mjs ; `npx tsc --noEmit -p .`,
   tests listés, `npm run build`. 4. geste.mjs --endroits calendrier : rouge `--ref en-ligne/2026-11-21-tour8`, vert sur l'arbre.
5. Captures 390 tactile et 1280, clair et cave, ouvertes côte à côte avec `captures/v02-*.jpg` (une seule planche, images réduites :
   les captures pleines ont coûté le contexte). 6. BUGS.md (dépôt Brasserie, l. 2154 CHE-2, 2157 CHE-5) à la main, puis
   `node scripts/agents/controle-bugs.mjs` → OK. 7. Commits par chemins, index temporaire.

## Reprise 2 (Sonnet, fin) — 21.11
- Fait : 26 échecs classés. 24 = tests de l'ancienne fiche (contenu au repos, `.cal-det-bt`, « Ouvrir le brassin » en texte, « Budget › », Délier/Supprimer/Ranger/Annuler la vente sous `[data-plus]`, dates/étapes/aperçu de lien/courses sous les volets `[data-souche]` / `[data-pastille=manque]`) : adaptés (ouvrir le volet). 2 = calendrierFrise « rangée mixte » et « Papiers en An » : tests périmés par CHD-4/CHD-5 (607844278, autre voie : « prévu », échéances comptées), pas par la fiche ; attentes mises à jour.
- tsc vert ; vitest ciblé 17 fichiers : 384/384 verts après les 2 derniers ajustements.
- Commit 26b9f4bb3 (port-carnet, index temporaire) : DetailChose, fiche.css, hunks CalendrierTab (import, bloc brassin/editable, onSupprimer) et calendrierGestes.ts entier (allongerDebut est dans le hunk de l'autre voie, requis par CalendrierTab), 8 fichiers de tests. Non pris : le reste de CalendrierTab, calendrier.ts, Rangee, frise.css.
- BUGS.md : CHE-2 et CHE-5 « corrigé | 26b9f4bb3 » ; controle-bugs OK.
- Reste : `sectionFiche` ajoutée dans `scripts/parcours/geste.mjs` (non commitée, syntaxe OK, appelée après sectionModifier). Lancement : `node scripts/parcours/geste.mjs <dossier-captures> --endroits calendrier [--ref en-ligne/2026-11-21-tour8]` (le dossier-captures est le 1er argument ; mon premier essai l'a omis, sortie à relire) ; attendu rouge sur tour8, vert sur l'arbre. Puis commit de geste.mjs (hunk sectionFiche + appel seulement), ligne CAL-FICHE de DEFAUTS-RECURRENTS (l. 466) au contrôle, commit BUGS.md/DEFAUTS du dépôt Brasserie.
