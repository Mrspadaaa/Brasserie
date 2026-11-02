N2-REPRISE OK — une borne de 12 Mo, course, issue d'échec, QR testé, « N pages lues », preuve sans débord, frise « N pages ✓ » (voir « Reprise 02.11 » plus bas ; le premier compte rendu, en dessous, date du temps 2b)

Voie n2-pages, temps 2b. Base HEAD 284b345c (n1 commité). Aucun commit, aucun déploiement, Gemini simulé. Ce que j'ai fait moi-même : E0 (rejeu de base), E1 à E5, le code du cas `pages`. Ce que je n'ai **pas** joué : la sonde de taille du corps, le banc de bout en bout, `npm run build`, les captures (plafond de tours : série mécanique, rendue à l'exécutant plus bas).

## TEMOIN AVANT (arbre d'aujourd'hui, copie isolée) — rouges
`npx vitest run tests/unit/depense/pages` sur HEAD, 6 fichiers de témoins écrits d'abord : `pdf` et `parcours` ne se chargent pas (module `pagesJustificatif` absent) ; en échec : T-E1 à T-E5 (pas de « Plusieurs »), « 1 ligne » (affichait « 1 lignes »), T-R1 à T-R9, T-L1, T-L3 à T-L7 (`scanPages` absent), T-S1, T-S2, T-S3 (tableau de 1), T-S4 à T-S7. Verts dès HEAD, gardés comme non-régression : T-L2 (charge `file`), T-S3 (fichier seul), T-E6 (un fichier lâché), « 2 lignes » et « 6 lignes ».

## Après le code — verts
- `npx vitest run tests/unit/depense/pages --maxWorkers=2` : **7 fichiers, 58 tests verts** (entree, rangee, parcours, lecture-serveur, lecture-client, pdf, encodeur).
- Critère 2 : `tests/unit/depense` + les tests nommés au § 6 du plan (financeQuickActions, expenseSheet, expenseSheetMouture, jus0Journey, invoiceScan*, banc-lecture-facture, geminiScanner ×2, aiClientYeastGuard, d100AiDeadlines) : **142 fichiers, 2238 tests verts, 3 ignorés** (base avant mon code : 129 fichiers verts). `nom-b/**` (n1) inclus et vert.
- Critère 3 : `npx tsc --noEmit -p tsconfig.json` → exit 0 ; `npx tsc --noEmit -p functions/tsconfig.json` → exit 0. `npm run build` : **à jouer** (exécutant).

## Fichiers écrits
`functions/src/ai.ts` (`pagesDeLecture`, `cleDePages`, `chargeDeLecture`, `MULTI_PAGE_NOTE`, `scanInvoiceSafely` à N pages) · `src/services/aiClient.ts` (`files`) · `src/services/geminiScanner.ts` (`scanPages`) · `src/services/pagesJustificatif.ts` (nouveau) · `src/ui/depense/Pages.tsx` (nouveau) · `src/ui/depense/Entete.tsx` (pile « N », panneau des pages) · `src/ui/depense/Recap.tsx` (pluriel « 1 ligne ») · `src/ui/finance/ExpenseSheet.tsx` · `scripts/check-invoice-journey-emulator.mjs` (cas `pages`, branche `files` côté page et côté banc ; `scan()` cherche « Un document ») · `tests/integration/financeQuickActions.test.tsx` (les deux assertions, autorisées) · `tests/unit/depense/pages/**` (cadre, entree, rangee, parcours, lecture-serveur, lecture-client, pdf, encodeur).
Rien d'autre de modifié. Pas touché : `purchaseEntry.ts`, `stockLineMatching.ts`, `nom-b/**`, `enrichir/**`, `enrichissementReglages.ts`, la branche `traduireNoms`, `ALL_CASES`.

## Par défaut visé
- **P1 l'entrée** : `EntreeFendue` (forme 3 : « Un document » | « Plusieurs », jetons `bg-ebc-straw text-cave-950`, `data-primary` sur « Un document », libellé visible = nom accessible, sans `aria-label`). T-E1 à T-E6. Deux fichiers lâchés : refus « Dépose un seul document à la fois. Pour plusieurs pages, touche « Plusieurs ». ».
- **P2 la rangée** : `RangeePages`, file d'ajouts sérialisée (plafonds sur `pagesRef` : 4 pages, 4 Mo la page, 12 Mo en tout, jamais deux fois la même page), × , « + page », input sans `capture`. T-R1 à T-R9.
- **P3 la lecture** : une lecture de N images, une part par page, la phrase du banc. `scanPages` ne réécrit que la signature du vieux serveur (`ok:true` sans `pages === N`, ou le refus exact de `validateInvoiceFile`) ; tout autre message passe tel quel. T-S1 à T-S7, T-L1 à T-L7. **Le serveur n'est pas déployé** : le chemin « vieux serveur » dit « pas encore disponible », jamais une lecture d'une page présentée comme complète.
- **P4 un seul justificatif** : `assemblerPdf` (jsPDF, une page par image, un alias par page, 4 niveaux de réduction, 3,9 Mo ; la lecture reçoit les originales). Empreinte = sha256 de la suite des sha256 bruts (même formule que `cleDePages`). T-P1 à T-P6.
- **P5 la trace** : pile « N » et panneau (`pagesJointes`, pas `nPagesLues`), « Changer » rouvre l'entrée sans rien effacer, preuve « Lectures · 3 pages ». T-A1 à T-A13.
- **Ajout du pilote** : pastille du bandeau « 1 ligne » / « N lignes » (`Recap.tsx`), test dans `entree.test.tsx` (1, 2, 6).
- **Frise (ajout 2 du pilote)** : « envoi » désigne l'envoi des pages à la lecture, pas le Drive ; au repos sous la rangée (trois barres grises, « envoi » sans ✓), « envoi ✓ » dès que `scanPages` part (T-R8).

## Rien ne se perd
Chemin d'un fichier : `attach` refactoré à comportement égal (`refusDeFichier`, `remettreLaDepenseAZero`, `effacerLecture` : mêmes messages, même remise à zéro) ; T-A13 (un fichier seul : `scanDocument`, jamais `scanPages`, en-tête d'avant), T-E3, tous les tests Dépense verts. Un document d'avant n2 envoie `file` : le serveur le lit comme avant (T-S3). Aucun schéma ni document Firestore changé.

## Constat de test à signaler
jsPDF réunit deux images qu'il croit identiques (même début) : une page disparaissait dans le PDF (vu par `pdf.test.ts`). Corrigé par un alias par page.

## DEMANDE EXECUTANT
Ne lance **jamais** les tests et le banc en même temps (la garde mémoire du banc coupe sous 2,2 Go). Depuis la racine du worktree, une commande à la fois :
1. **Build** : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npm run build"` → attendu : exit 0, 0 erreur.
2. **Sonde E0 (taille du corps d'aiTask, locale, sans Gemini)** : démarrer l'émulateur Functions du banc (voir `voies/e-bout/lancer.sh` : ports 5001, etc.) puis envoyer un `POST` JSON d'environ 12 Mo (une charge `{"data":{"task":"scanInvoice","files":[{"mimeType":"image/jpeg","data":"<12 Mo de A>"}]}}`) à `http://127.0.0.1:5001/demo-jus/europe-west6/aiTask` **sans authentification**. Lecture : « 401 / unauthenticated » = le corps est passé (limite > 12 Mo) ; « 413 » = limite du corps. Écrire le code HTTP et le corps de la réponse dans ce RESULTAT (section « Sonde E0 »). Si 413 : me le rendre (`MAX_PAGES_B64` et le total client descendent sous la limite).
3. **Bout en bout** (depuis le dépôt, un groupe à la fois ; chaque groupe : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <dossier>/<nom> <cas> 390,1280 work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-d272b.json work/finalisation-tickets-2026-10-08/H13-reels/banc-f5c-prod-paires/results.json`, dossiers sous `work/missions/2026-10-31-ecran-depense/voies/n2-pages/bout/`) :
   - cas `pages` seul → attendu : tous les `OK`, **0 KO** aux deux largeurs ; noter la mesure `assemblage-pages-cpu-x4-ms` (rapport JSON, `measures`) et `pages-lourdes-octets` (les trois pages lourdes doivent peser chacune moins de 4 Mo : sinon la rangée les refuse et le cas attend en vain ; dans ce cas, baisser la qualité 0.55 du canvas lourd dans `casePages` et relancer) ;
   - cas `doc14,nom-b` ; puis `doc1,doc2,doc3,doc4,doc5,doc6` (les six autres pièces) : 0 KO.
   - Pour chaque groupe : `grep -c "hmr update\|page reload" <dossier>/vite.log` → **0** attendu (L17). Le pilote a commité 17e97bb1 pendant ma passe : aucun banc n'avait tourné avant cette demande, donc rien à rejouer pour ce motif.
4. **Captures à ouvrir** (et les décrire) : à 390 et 1280, `pages-rangee-3`, `pages-lecture`, `pages-lue-repos`, `pages-panneau` du dossier du cas `pages`, **côte à côte** avec `work/missions/2026-10-31-ecran-depense/choix-captures/retenue/img/` : `4-plusieurs-3.png`, `5-lecture.png`, `6-lue-repos.png`, `7-lue-pages.png`, et l'entrée `1-entree-f3.png` (capture de l'entrée : la prendre dans `pages` avant la première page si absente). Écrire les écarts, dont les deux voulus (frise au repos sous la rangée : « envoi » sans ✓ ; preuve « Lectures · 3 pages » au lieu de « ✓ 3 pages lues »).
5. Me renvoyer les sorties ; je juge le dessin, les écarts, et je clos par `N2 OK` ou `N2 ECHEC`.

## Doutes et limites
- **Photo d'une page suivante** : « + page » ouvre un sélecteur d'images sans `capture`. Jouable ici seulement en Chrome de bureau : « Prendre une photo » proposé par iOS et Android n'est **pas vérifié** (repli : capture du sélecteur à faire au téléphone).
- **Frise** : écart visible à `3-plusieurs-1.png` et `4-plusieurs-3.png` (là « envoi ✓ » est coché avant « Lire »), à montrer au pilote et au critique avec la capture côte à côte (règle n° 1).
- **Preuve** : « Lectures · 3 pages » + `2/2`, pas « ✓ 3 pages lues » (« lues » n'est pas vérifié par le serveur).
- **Empreinte du moteur** : `ai.ts` change l'identifiant de cache de tous les fichiers seuls : chaque pièce déjà lue est relue une fois au déploiement (quelques centimes par pièce), à confirmer avec lui. Rien n'est déployé.
- **Photo de plus de 4 Mo** : refusée avec son poids (« Cette page pèse 5,2 Mo : 4 Mo au plus. »), comme « Un document » aujourd'hui, sans voie de sortie ; réduire la page à l'ajout est un choix à lui demander.
- **Le cas `pages` ne prouve pas `ai.ts`** (lecture rejouée dans la page) : l'envoi des N parts au modèle est prouvé par T-S2 et T-S3.
- **Taille du corps d'aiTask** : limite de 32 Mio (Cloud Run) citée, **non vérifiée** ici ; la sonde E0 est dans la demande.
- Le cas `pages` écrit des JPEG fictifs sous `os.tmpdir()` ; la mesure des pages lourdes (bruit aléatoire) peut dépasser 4 Mo par page selon le moteur JPEG : voir l'instruction du point 3.
- Essais utilisés : une relance par erreur de test (module simulé importé dans un test, jsPDF qui réunit deux images) ; aucun critère n'a dépassé trois essais.

DÉCISION À PRENDRE : aucune nouvelle. (Rappels du plan, § 9 : redéploiement d'aiTask, plafonds 4 pages / 4 Mo / 12 Mo, écarts frise et preuve à montrer au critique.)
CONNAISSANCE : sous vitest, un test qui importe un module que le même fichier simule (`vi.mock` + import statique) peut recevoir l'original dans le test et le simulé dans l'écran : le calcul attendu se fait dans le cadre de test, pas par le module simulé. jsPDF réunit deux images qui commencent pareil sous un même alias auto : toujours donner un alias par page.
LEÇON PROPOSÉE : aucune

---

# Reprise 02.11 — R-N2CODE (REVUE-CODE n° 1 à 7), frise et preuve

Ligne : `N2-REPRISE OK — une borne de 12 Mo, course, issue d'échec, QR testé, « N pages lues », preuve sans débord, frise « N pages ✓ ».`
Agent `auteur` (Sonnet), copie isolée, aucun banc Chrome, aucun commit ni déploiement. Aucun test du serveur n'appelle Gemini.

## Fichiers écrits (cette reprise)
`src/services/pagesJustificatif.ts` · `src/services/geminiScanner.ts` (`scanPages`) · `src/ui/depense/Pages.tsx` (frise, lien de la rangée) · `src/ui/depense/Recap.tsx` (`Preuve`) · `src/ui/finance/ExpenseSheet.tsx` · `scripts/check-invoice-journey-emulator.mjs` (cas `pages` : la frise au repos, la frise en lecture, la preuve, le débord) · `tests/unit/depense/pages/{rangee,parcours,entree,lecture-serveur,lecture-client}.test*` · ce fichier.
`functions/src/ai.ts` : **non touché** (`MAX_PAGES_B64 = 16_000_000` reste). Rien d'autre.

## Ce qui a changé, point par point
1. **Une borne.** `TOTAL_OCTETS_MAX = 12_000_000` (« 12 Mo » décimal) au client (rangée et `scanPages`). Ce que la revue demandait (12 000 000 octets) ne suffisait pas seul : chaque page est encodée en base64 à part, avec son rembourrage, et un total de 12 000 000 octets peut atteindre 16 000 011 caractères, soit au-dessus des 16 000 000 du serveur (trois pages de 4 000 000 octets : 16 000 008). J'ai donc ajouté `CARACTERES_B64_MAX = 16_000_000`, `caracteresB64()` et `totalAdmis()` : la rangée et `scanPages` refusent ce que le serveur refuserait, sans toucher au serveur. Le message dit « Les pages pèsent X Mo : 12 Mo au plus. », le poids du total est maintenant en Mo décimal (avant : Mo binaire, « 11,5 Mo : 12 Mo au plus » aurait eu l'air faux). Le poids d'une page reste en Mo binaire comme « Un document ». Test T-S8 : trouve par dichotomie, avec `refuserPage`, la plus grosse page admise après 4 Mo + 4 Mo (3 611 388 octets) et après 3 + 3 + 3 Mo (2 562 816), de vrais octets en base64 passent `pagesDeLecture` ; un octet de plus est refusé des deux côtés. T-L8 : `scanPages` refuse sans appel au-delà.
2. **Course.** `ajouterUnePage` : `if(!mounted.current||scanLocked.current)return;` après l'empreinte. T-R10 : `arrayBuffer` différé, la 3ᵉ page livrée après « Lire 2 pages » n'entre ni dans la lecture (2 fichiers), ni dans la carte (« 2 pages », 2 vignettes), ni dans la frise.
3. **Banc.** `const friseRepos = await frise(); … friseRepos !== null && includes('3 pages ✓') && !includes('envoi')` plus l'absence du pointillé ; le contrôle « envoi ✓ » devient « après Lire, "3 pages ✓" reste et "lecture" est en cours » (attend `.dp-p3c-frise-cours`).
4. **Issue d'un échec d'assemblage.** État `assemblageEchoue` ; après l'échec, la rangée montre sous son message le lien « Saisir sans justificatif » (même style qu'à l'entrée : `min-h-7 w-full text-sm text-cave-200 underline underline-offset-4`), qui retire les pages, vide le message et ouvre le formulaire, rien n'est lu. Retirer ou ajouter une page, ou relancer « Lire », le fait disparaître. T-R11 (deux tests).
5. **QR.** T-Q1 : QR sur la seule page 3 → `etat.qr` appelé avec c.jpg et rien d'autre ; QR sur la page 1 → c, b, a. Témoin par mutation (le code était juste, le test manquait).
6. **« ✓ N pages lues ».** Maquette `6-lue-repos.png` (ouverte) : coche verte, « 3 pages lues », sans valeur à droite, dans la case libre de la grille. Désaccord : « Lectures · N pages » et « n lectures » (inchangé) ; document seul : « Lectures » et « 2/2 » (inchangé). Commentaire « lues n'est pas dit » retiré. T-A9 (quatre cas : d'accord, désaccord avec un point d'origine « lecture », document seul, sans lectures annoncées). Le banc dit maintenant `/3 pages lues/`.
7. **Preuve qui déborde.** Libellé « Qté × prix » dans les deux états. `Preuve` : bouton `min-w-0 overflow-hidden`, libellé `min-w-0 shrink-[0.2] truncate` (rétrécit en dernier), valeur déjà `truncate` (rétrécit d'abord). Classe `shrink-[0.2]` vérifiée dans le CSS du build (`flex-shrink:.2`). Test de classes (jsdom ne mesure pas) + contrôle du banc `scrollWidth <= clientWidth + 1` sur chaque `[data-dp="preuve"] button` (cas `pages`, 390 et 1280) : **à jouer par le pilote**.
8. **Taille du corps d'`aiTask`.** Rien à coder. **La limite réelle n'est vérifiée qu'au premier envoi de 3 pages lourdes après le déploiement** : l'émulateur Functions fixe lui-même 32 Mo (`functionsEmulatorRuntime.js`), la sonde E0 de n2-exec (HTTP 401, corps passé) ne mesure que cette constante, pas Cloud Run. Avec la borne unique le plus gros corps est de 16 000 000 caractères de base64 plus l'enveloppe JSON. Lecture du journal après déploiement, à confirmer par le pilote (D297 couvre un envoi de test).
9. **Frise « Plusieurs »** (`3-plusieurs-1.png`, `4-plusieurs-3.png`, `5-lecture.png` ouvertes). `FrisePages({ etat, pages })` : dès la première page, premier segment plein et « N pages ✓ » (« 1 page ✓ », « 3 pages ✓ »), lecture et vérification grises ; après « Lire » (dès l'assemblage), le premier garde « N pages ✓ » et « lecture » est en gras, pointillée. « envoi » n'apparaît plus avec des pages ; un document seul garde « envoi ✓ » et la lecture qui défile. L'état `envoye` (et ses trois `setEnvoye`) est supprimé : la frise ne dépend plus de l'instant où `scanPages` part. T-R8 (repos à 1 puis 2 pages, après Lire, avant la fin de l'assemblage, après le départ), T-R8b (document seul).

## TEMOIN AVANT
Méthode : dans la copie isolée seulement, la correction défaite d'un `split/join` (script du scratchpad, copie restaurée après chaque cas), le test neuf joué seul. Les arbres d'avant ne sont pas sur le disque (rien n'était commité) ; chaque témoin défait exactement la correction visée.
- **1** borne (client 12 MiB, sans le compte base64) : 5 rouges — T-L8, T-S8 ×3, T-R3 « 12 Mo au total ».
- **2** course : 1 rouge — T-R10.
- **4** issue : 2 rouges — T-R11 ×2.
- **5** QR : 2 rouges avec `reverse()` retiré — T-Q1 ×2 (sur le code actuel ils passent : c'est le test qui manquait).
- **6** « pages lues » : 1 rouge — T-A9 « lectures d'accord ».
- **7** libellé : 1 rouge (T-« Preuve : une rangée ne sort pas de sa case ») avec « Quantité × prix » ; **7b** sans `min-w-0 overflow-hidden` / `shrink-[0.2]` : même test rouge.
- **9** frise : 2 rouges — T-R8 (et T-R10, qui lit la frise) avec `<FrisePages etat="repos"/>` sans `pages`.
Chaque test neuf repasse vert sur l'arbre actuel.

## Critères (copie isolée)
1. Témoins : ci-dessus.
2. `npx vitest run tests/unit/depense tests/integration/financeQuickActions.test.tsx --maxWorkers=2` : **133 fichiers, 2049 tests verts, 3 ignorés, exit 0** (dont `tests/unit/depense/pages/lecture-serveur.test.ts`, 12 tests, qui lit `functions/`). `tests/unit/depense/pages` seul : 7 fichiers, 72 tests.
3. `npx tsc --noEmit -p tsconfig.json` : exit 0 ; `npx tsc --noEmit -p functions/tsconfig.json` : exit 0 ; `npm run build` : exit 0, 0 ligne « error », `built in 13.40s`.
4. `node --check scripts/check-invoice-journey-emulator.mjs` : 0 erreur. Le diff de cette reprise dans le banc est limité au cas `pages` (`casePages`, deux blocs : la frise et la preuve) ; les autres hunks du fichier viennent des temps d'avant et de f4.

## Doutes et limites
- **Aucun banc Chrome joué par moi** : le débord réel de la preuve à 390 et à 1280, la frise et « ✓ 3 pages lues » se verront sur les captures du pilote. Les tests de classes ne mesurent pas un pixel. Si le libellé « Qté × prix » et « non contrôlé » ne tiennent pas côte à côte à 390, la valeur sera rognée avant le libellé (choix voulu) : à regarder en plein format (L12).
- **Borne à l'octet près** : « 3 pages de 4,0 Mo » (3 × 4 000 000 octets) sont refusées (16 000 008 caractères), alors que 12 000 000 octets « tiennent » en décimal. C'est le serveur qui le veut tant qu'il n'est pas redéployé avec une borne plus haute ; le message dit « 12,0 Mo : 12 Mo au plus », un peu sec à cette limite.
- **Frise pendant l'assemblage** : elle passe à « lecture » dès « Lire » (avant le départ de la lecture), comme la consigne le dit ; la phrase « Préparation des pages… » reste.
- **Document de plusieurs lots à une page** (`lot.length===1`) : inchangé (retombe sur « Un document »).
- Essais : aucun critère au-delà d'un essai sauf deux relances de tests neufs (un `defineProperty` sur un `File` qui a déjà `arrayBuffer`, et un clic de « Lire » plus rapide que la file d'ajouts) ; trois essais jamais dépassés.

## Suite du pilote (02.11, après les bancs : pages4 à 390 et 1280, rangées non contrôlées rognées)
- `ExpenseSheet.tsx` : l'état non contrôlé n'a plus de valeur en mono à droite ; le libellé dit tout, valeur vide : « Somme non contrôlée » et « Qté × prix non contrôlé ». Les états contrôlés ne changent pas (« Somme = imprimé 48,70 », « Qté × prix 6/6 », « non vérifiée »). Aucun autre fichier de source ; aucun banc Chrome.
- Test adapté (`entree.test.tsx`, « Preuve : une rangée ne sort pas de sa case ») : libellé exact, `<b>` vide, plus de « Somme des lignes ». TEMOIN AVANT : avec l'ancien texte (« Qté × prix » + valeur « non contrôlé ») il est rouge (`expected 'Qté × prix' to be 'Qté × prix non contrôlé'`), vert après.
- Rejeu copie isolée : `tests/unit/depense` + `financeQuickActions` = 133 fichiers, 2049 verts, 3 ignorés ; `tsc --noEmit -p tsconfig.json` exit 0. À regarder sur les captures du pilote : « Somme non contrôlée » tient-il dans sa case à 390 sans troncature.

LEÇON PROPOSÉE : un plafond dit en « Mo » doit avoir une seule constante partagée en octets entre client et serveur, et le test qui les relie doit passer de vrais octets par le vrai encodeur (base64 page par page, rembourrage compris) : 12 000 000 octets ne sont pas 16 000 000 caractères quand on encode N morceaux (confirme la proposition de REVUE-CODE).
CONNAISSANCE : un test de course sur une file d'ajouts asynchrone doit attendre que l'opération soit réellement suspendue (ici `arrayBuffer` appelé) avant de déclencher la concurrence : un clic synchrone juste après le `change` passe avant la microtâche de la file et teste autre chose. Une capture ou un test jsdom ne mesure pas un débord : seul `scrollWidth` du banc le prouve.
