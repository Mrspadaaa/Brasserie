OK — systeme.mjs : comprendre, revue et ecarts, 31 cas témoins, six fichiers témoins, essai réel chiffré

## Fichiers écrits
- `scripts/agents/systeme.mjs` : en-tête d'usage (3 lignes), `partieDe`, `verifierCompris`, `verifierRevue`, `verifierEcarts`, trois `case` dans `main`, fabriques de cas et 31 cas dans `temoins()`.
- `work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/` : `comprendre-bon/` et `comprendre-hors/` (VOIE.md + COMPRIS.md), `revue-bonne.md`, `revue-bloquant-accepte.md`, `ecarts-bon.md`, `ecarts-faux.md`.

## Critères (sorties décisives, rejouées après la dernière modification)
- G1 `temoins` : `TEMOINS OK` (105 cas tenus, dont 31 nouveaux : 10 sur `comprendre`, 11 sur `revue`, 10 sur `ecarts`).
- G2 `comprendre …/comprendre-bon` : `COMPRIS OK (2 doutes)`.
- G3 `echoue "COMPRIS ECHEC" -- … comprendre-hors` : `ECHOUE OK (COMPRIS ECHEC, code 1)` ; raison : `scripts/agents/ancien-controle.mjs` hors du « Possède ».
- G4 `revue …/revue-bonne.md` : `REVUE OK (bloquant 1, majeur 1, détail 1)`.
- G5 `echoue "REVUE ECHEC" -- … revue-bloquant-accepte.md` : `ECHOUE OK (REVUE ECHEC, code 1)` ; raison : « un bloquant n'est jamais accepté ».
- G6 `ecarts …/ecarts-bon.md` : `ECARTS OK (8 passages vérifiés dans 1 document(s))`.
- G7 `echoue "ECARTS ECHEC" -- … ecarts-faux.md` : `ECHOUE OK (ECARTS ECHEC, code 1)` ; quatre écarts : chemin absent, `package.json:99999`, `idInconnuDuTemoinQ7`, `facture-v77`.
- G8 : ce rapport (voir ci-dessous).
- `cablage` : `CABLAGE OK` après mon dernier changement de code. Rejoué à 18 h 14, il échoue pour une cause qui n'est pas la mienne : `DEFAUTS-COURT.md en retard sur DEFAUTS-RECURRENTS.md` (le pilote a modifié `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` à 18 h 12 ; `node scripts/agents/systeme.mjs defauts` le règle, hors de mon périmètre). `remplaces` : OK.
- `appels systeme.mjs --rejouer` (rappel du hook, 363 critères) : lancé en arrière-plan, plus de 10 min, pas fini quand je rends la main. Je n'ai rien changé aux commandes existantes, seulement ajouté trois `case` et des fonctions.

Essais utilisés : 1 par critère (aucun échec de critère). L'essai réel a demandé quatre rondes de resserrement de la règle (ci-dessous).

## Essai réel : `ecarts` sur les cinq docs des finances

Premier passage de la règle brute (celle de VOIE.md à la lettre, sur la version de ces docs au début de la voie) :

| doc | passages vérifiés | écarts |
|---|---|---|
| docs/finances.md | 3 | 0 |
| docs/gemini-budget.md | 4 | 1 |
| docs/finance-verification.md | 7 | 0 |
| docs/financial-sync.md | 10 | 0 |
| docs/expense-vision-evaluation.md | 15 | 2 |

3 écarts en tout, pas 10 : on ne peut pas en tirer 10. Classement des trois :
1. `docs/gemini-budget.md:37` `invoice-v3` : **vrai écart connu**. Le code écrit `invoice-v4` (`functions/src/invoiceScanCore.ts:4`).
2. `docs/expense-vision-evaluation.md:26` `.firebaserc` : **faux positif**. Fichier ignoré par git (`.gitignore:42`), donc absent de tout clone.
3. `docs/expense-vision-evaluation.md:57` `docs/expense-vision-image-preflight.json` : **faux positif**. Rapport que `scripts/eval-expense-vision.mjs:68` écrit à l'exécution ; son chemin est dans le code.

Faux positifs : 2 sur 3, au-delà de 20 %. Il fallait resserrer, mais 3 écarts ne mesurent rien. J'ai donc mesuré sur un corpus plus large : les 52 documents `docs/*.md` + `PRODUCT.md` + `DESIGN.md`, soit 62 écarts. **Tirage au hasard de 10 écarts** (`shuf`) :

| écart | classe | raison |
|---|---|---|
| `docs/claude-expert.md:368` `recovery.json` | faux positif | fichier d'exécution d'un outil, nom seul |
| `docs/water-solver.md:156` `domain/water/ions.ts` | faux positif | chemin partiel : le fichier est `src/domain/water/ions.ts` |
| `docs/ux-boosters.md:47` `document.startViewTransition` | faux positif | API de la plateforme, dans une doc d'idées |
| `docs/claude-expert.md:167` `.expert` | faux positif | dossier d'exécution (nom à point) |
| `docs/hop-recipe-visual-review.md:59` `cases-00-390` | faux positif | nom de capture, pas un identifiant |
| `docs/index-houblon-lactones-esters.md:58` `data-audit.json` | faux positif | sortie d'un audit, nom seul |
| `docs/hop-recipe-visual-review.md:52` `documente-390` | faux positif | nom de capture |
| `DESIGN.md:478` `py-0.2` | faux positif | classe Tailwind |
| `docs/hop-recipe-browser-qa.md:39` `report.json` | faux positif | sortie de test, nom seul |
| `docs/yeast-second-pass-2026-09-09.md:16` `yeast-scenario-1` | faux positif | nom de scénario |

**10 faux positifs sur 10**, donc bien au-delà de 20 %. Resserrements (tous dans `verifierEcarts`, commentés avec la date) :
- plus de chemin « à point » (`.progress`, `.brew-layout`) : la consigne ne les compte pas comme chemin ;
- un mot à tirets est un identifiant seulement si l'un de ses segments suivants colle des lettres à un chiffre (`invoice-v4`, `europe-west6`) ; `cases-00-320`, `yeast-scenario-2`, `py-0.2` sortent ;
- ni chemin absolu, d'environnement ou de gabarit (`/assets/…`, `%TEMP%/…`, `<id>.json`) ;
- chemin ou nom absent mais ignoré par git, ou écrit tel quel dans le code : pas un écart ;
- nom seul d'une sortie (`.png .json .lock .csv .pdf .txt .yml .ps1`) introuvable : ignoré ;
- chemin partiel résolu par suffixe de `git ls-files` ;
- chemin dont le premier dossier n'est pas à la racine et que rien ne résout : hors dépôt, ignoré (`src/…` reste attrapé) ;
- API de la plateforme (`document.`, `window.`…) ; passage tronqué par « … » ;
- identifiant absent du code : cherché aussi dans les réglages de la racine (`*.config.*`, `package.json`, `firebase.json`) puis dans les dépendances directes installées de `node_modules` (`AnimatePresence`, `ViewTransition`, `hoverOnlyWhenSupported` de Tailwind), sauf pour un mot à version.

**Rejeu après resserrement** : 62 écarts → 1 sur les 52 documents (`invoice-v3`, vrai). Les cinq docs des finances, version actuelle (le pilote a corrigé `docs/finances.md` entre-temps, commit f427b92f) :

| doc | passages vérifiés | écarts |
|---|---|---|
| docs/finances.md | 4 | 0 |
| docs/gemini-budget.md | 4 | 1 (`invoice-v3`, vrai) |
| docs/finance-verification.md | 6 | 0 |
| docs/financial-sync.md | 10 | 0 |
| docs/expense-vision-evaluation.md | 14 | 0 |

Sortie : `ECARTS ECHEC 1` — `docs/gemini-budget.md:37 — invoice-v3 : identifiant « invoice-v3 » introuvable dans src, functions/src, scripts, tests`. Sur ces docs, 0 faux positif sur 1 écart.

**Épreuve sur un corpus tenu à part** (L20 : je n'avais pas réglé la règle dessus) : 44 documents (notes `cerveau/` sauf transcriptions, `docs/agents/systeme.md`, `.claude/rules/affinee-frontend.md`, `docs/specs/houblons.md`). Premier jeu : 20 écarts ; après les deux derniers resserrements (élision, hors dépôt) : **12 écarts, tous classés** :
- vrais (7) : `waterManualSparge`, `capAlkaline`, `ionAlarms`, `cacheBase` (seulement dans `prototypes/…/ARCHITECTURE.md`), `storage.brewRecipeAndDeductStocks`, `calculateWaterSalts`, `SaltCell` : noms cités par des notes du cerveau, absents de tout le code du dépôt (`git grep` hors `cerveau/`, `docs/`, `work/`). Ces notes sont à vérifier par le relecteur de sens.
- faux positifs (5) : `JURY-VERDICT.md` (cité comme exemple de fichier jamais produit), `cap.mjs` (script jetable d'un agent), `.claude/worktrees/*` (dossier d'un poste), `STYLE_BAND_AT` et `ION_SCALE` (noms du code d'un site externe, note `cerveau/sources/moneaudebrassage.md`). 5 sur 12 = 42 %.

## Doutes et limites
- **Faux positifs des notes du cerveau** : 42 % sur le corpus tenu à part, au-delà de 20 %. Ils viennent des notes qui parlent d'un site externe, d'un poste ou d'un exemple, que le contrôle ne peut pas distinguer d'une promesse. Je n'ai pas resserré davantage (je ne vois pas de règle sans cacher de vrais écarts). Sur les docs de domaine (cas visé par la règle § 3), le taux est 0 sur 1. À décider : voir plus bas.
- **Taille de l'échantillon** : sur les cinq docs, un seul écart reste ; les « 10 écarts tirés au hasard » viennent donc du corpus large, avant resserrement. Le resserrement a été réglé sur ce corpus : le rejeu à 1 écart n'est pas une mesure indépendante, d'où l'épreuve tenue à part.
- **Le script se cite lui-même** : `scripts/agents/systeme.mjs` est dans `scripts/`, donc tout identifiant qu'il contient (cas témoins, commentaires) est « trouvé » par `ecarts`. J'ai ôté de mes commentaires `startViewTransition` et `hoverOnlyWhenSupported`, qui masquaient deux écarts ; les identifiants des fixtures (`calculerTotalTtc`, `TAUX_TVA_PLEIN`, `facture-v9`) restent et masqueraient une doc qui les citerait. Aucune doc ne les cite. Une exclusion de `scripts/agents/` serait plus propre, hors de ma consigne.
- **Écart avec la consigne** : (1) la recherche d'identifiants couvre aussi les réglages de la racine et les dépendances installées (la consigne dit quatre dossiers) ; sans `node_modules` ni `package.json`, elle se limite aux quatre dossiers. (2) Un nom de fichier seul présent plusieurs fois dans le dépôt est accepté (il existe). (3) `ecarts` rend `ECARTS ECHEC` aussi quand aucun document ne contient un seul passage vérifiable (rien à compter n'est pas un succès) ; la consigne ne le disait pas.
- **Durée** : le corpus de 52 documents prend environ 50 s (la recherche dans `node_modules` pour chaque identifiant absent). Les cinq docs des finances : quelques secondes.
- `comprendre` : les doutes sont comptés par puces (ou 1 si la partie est une prose) ; une puce qui commence par « aucun » compte zéro. Un chemin de « Écrit dans » est un passage entre accents graves qui contient `/` ou finit par une extension connue ; `.md` seul n'en est pas un. Un joker (`dossier/*.md`) vaut le dossier ; `*.md` seul échoue.
- `revue` : « Aucun constat : » exige au moins trois mots de preuve (seuil arbitraire). Les cellules sont lues avec `\|` pour une barre dans une cellule. Un constat vide est refusé (non demandé).

DÉCISION À PRENDRE : faut-il lancer `ecarts` sur les notes du cerveau ? Options : (a) oui, avec 42 % de faux positifs sur les notes d'un site externe ou d'un poste ; (b) seulement sur PRODUCT.md, DESIGN.md et `docs/*.md` du domaine, plus les notes dont les `sources` citent du code (§ 3 de la règle). Recommandation : (b) ; le relecteur neuf de sens jette les faux positifs restants en une ligne.

CONNAISSANCE : `ecarts` sur `cerveau/` (31.10) trouve 7 noms de code cités par des notes et absents du dépôt : `waterManualSparge`, `capAlkaline`, `ionAlarms`, `cacheBase`, `storage.brewRecipeAndDeductStocks`, `calculateWaterSalts`, `SaltCell`. Notes concernées : `verification-locale`, `chimie-eau`, `cout-calcul-moteur`, `modele-brassage`, `design-system-historique`.

LEÇON PROPOSÉE : un contrôle de « présence de chaîne » se règle sur un corpus et se juge sur un autre ; le premier jeu a donné 10 faux positifs sur 10 tirés (noms de captures, de sorties, de classes). Aussi : un contrôle qui cherche dans `scripts/` se trouve lui-même dans son propre code, et ses commentaires masquent les écarts qu'il cherche (deux masqués ici).
