# Voie b1-bande — la bande collante ne fait plus sautiller l'écran, « y aller » va toujours quelque part

Agent : auteur (Sonnet). Plafond : 45 tours. Pilote : Opus. Date : 01.11. Défaut D233 (`work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`).

## Ses mots (01.11, 8 h 25, sur son téléphone, version en ligne 153b2296, sa facture de 7 lignes, un seul point : « ① Date »)
« Y aller je fait rien, et il y a un vrai problème, quand on ouvre certains champs, le fenêtre fait haut bas très rapidement, comme un
cintillement, c'est horrible ». Ses captures : la bande « ① Date · y aller » en haut du défilant, et d'une image à l'autre tout le contenu
descend puis remonte d'environ 40 px (le panneau « Déjà payé / À payer » ouvert, le champ « Date du paiement » au focus).

## Causes, lues par le pilote
1. **Le sautillement.** `BandeCollante` (`src/ui/depense/Verdict.tsx:77`) est `sticky top-0` et rendue DANS le flux du défilant
   (`src/ui/finance/ExpenseSheet.tsx:477`, premier enfant de `ref={scroller}`). Quand le bandeau (`bandeauRef`) sort de l'écran, la bande
   apparaît et pousse tout le contenu de sa hauteur ; le bandeau rentre dans l'écran, l'IntersectionObserver la cache, le contenu remonte ;
   le bandeau ressort… boucle, image après image, tant que le défilement reste dans cette zone. L'ouverture d'un champ (focus, clavier,
   défilement du navigateur vers le champ) y amène souvent, d'où « quand on ouvre certains champs ».
2. **« y aller » sans effet.** `aller` (`ExpenseSheet.tsx:354`) ne traite que la TVA, le paiement, la mouture et les lignes. Le point
   `date-absente` (chip « Date ») n'a pas de cible : rien ne se passe, ni depuis la bande ni depuis la chip ① de `ChipsBar`. De même,
   `setPanel('paye')` ou `setPanel('tva')` sur un panneau déjà ouvert ne fait rien de visible (aucun défilement).

## À faire
1. **La bande ne prend aucune place dans le flux.** Elle se superpose au haut du défilant (par exemple un conteneur `sticky top-0 h-0`
   dont la bande est un enfant `absolute`, ou une bande `absolute` hors du défilant dans un parent `relative`) : son apparition ou sa
   disparition ne déplace plus rien. Même contenu et même dessin qu'aujourd'hui (rondes numérotées, nom du point courant, « y aller »),
   `lg:hidden` inchangé, rien d'autre à l'écran ne change. Le défilant réserve sa hauteur à ce qu'on vise (`scroll-padding-top` de la
   hauteur de la bande sous `lg`, ou équivalent), pour qu'un champ visé ou focalisé ne soit pas caché dessous. Aucune marge parasite :
   au repos, sans bande, les positions du contenu restent celles de HEAD (à 1 px près).
2. **« y aller » va toujours quelque part**, depuis la bande comme depuis la chip ① :
   - `date-absente` → ouvre `[data-purchase-date]` (`<details>`), le fait défiler visible sous la bande, focus dans le champ de date
     (`DateField`, l'input de la date de l'achat) ;
   - `somme-ecart`, `somme-incomplete`, `total-absent` → focus et défilement sur `#purchase-total` ;
   - `lignes-perdues`, `lignes-annoncees`, `lignes-non-rapprochees` → ouvre et fait défiler la liste des lignes (`[data-purchase-lines]`) ;
   - TVA et paiement : le panneau s'ouvre comme aujourd'hui, PUIS défile visible (même s'il était déjà ouvert) ;
   - tout autre point sans cible → ouvre la preuve (`setPreuveOuverte(true)`) et la fait défiler visible. Jamais un « y aller » sans effet.
   Défilement doux comme l'existant (`behavior:'smooth'`), focus avec `preventScroll` si le défilement est déjà demandé.
3. **Le point Date se règle** : `estRegle` rend vrai pour une chip `date-absente` quand le brasseur a saisi une date valide
   (`reviewedFields` contient `'date'` et `draft.date` est une date valide). Alors la chip est barrée, la bande passe au point suivant
   ou à « points revus ».
4. **Banc local** : un état `date` dans `src/ui/depense/apercuDev.ts` (développement seulement, jamais dans `dist/`) : la lecture de l'état
   `2` (« lue, sans point ») dont la date est vidée et qui porte un seul point, `date-absente`, de la forme du serveur
   (`functions/src/invoiceVisionReview.ts:156` : code `date-absente`, gravité `ecart`, champ `date`, enjeu `info`, message « Date absente
   ou invalide : à saisir. », `pese: true` ; vérifier que `peserPoint` le pèse et que la chip « Date » apparaît seule). Aucune donnée réelle,
   aucun nom ni adresse du brasseur.
5. **Tests unitaires** dans `tests/unit/depense/ecran/` : « y aller » de la chip Date ouvre le bloc de la date et y met le focus ; une date
   saisie barre la chip ; un point sans cible ouvre la preuve.
6. **Le contrôle Chrome réel** `work/missions/2026-10-31-ecran-depense/voies/b1-bande/controle-bande.mjs`, sur le modèle de
   `voies/e-port/capturer-depense.mjs` (même ouverture : Actions rapides → « Entrer une facture », `?dev-local&depense=date` ; requêtes hors
   localhost bloquées et comptées, polices exceptées), en 390×844 tactile (`isMobile`, `hasTouch`, échelle 2) et 390×844 souris :
   - **B1, pas de saut** : défiler pour que la bande vienne d'apparaître ; la position (dans le défilant) d'un repère sous le bandeau
     (`[data-dp="preuve"]` ou la tuile Règlement) ne bouge pas de plus de 1 px entre « juste avant » et « juste après » l'apparition ;
   - **B2, pas de boucle** : pour chaque `scrollTop` de la zone frontière (le bas du bandeau de −60 à +10 px autour du haut du défilant, par
     pas de 4 px), poser le défilement, puis relever chaque image pendant 600 ms la présence de la bande et le `scrollTop` : au plus une
     bascule, et aucun mouvement du repère au-delà de 1 px ;
   - **B3, « y aller »** : bande visible, un vrai toucher (tactile) ou clic (souris) au centre de « y aller » : en 1 s, `[data-purchase-date]`
     est ouvert, `document.activeElement` est dans ce bloc, et le champ est visible entre le bas de la bande et le bas du défilant ;
   - **B4, la chip ①** : même effet depuis la chip « Date » de la barre des points ;
   - **B5, réglé** : une date posée (raccourci « Aujourd'hui » du bloc) barre la chip (`aria-label` avec « réglé ») et la bande ne
     propose plus « y aller » pour Date ;
   - **B6** : aucune erreur de page, aucune requête sortante.
   Captures à 390 tactile : bande visible, puis après « y aller » (date au focus) ; les ouvrir et les regarder (L12). Sortie :
   `BANDE OK` ou `BANDE ECHEC n` et la liste ; ne pas s'arrêter au premier échec (M16).
   **Témoin négatif** : le script échoue sur la version de HEAD (`git show HEAD:src/ui/depense/Verdict.tsx` et
   `git show HEAD:src/ui/finance/ExpenseSheet.tsx` vers `os.tmpdir()`, remis à la place le temps du témoin avec ton `apercuDev.ts`, puis tes
   versions remises) ; noter les deux sorties dans RESULTAT.md. Si B2 ne se reproduit pas en Chrome sans écran, le dire : B1 doit échouer.

## Ajouts du brasseur pendant la voie (01.11, transmis par message)
- « Il y a plusieurs champs date aussi attention ! » : le point `date-absente` vise la date de l'achat seulement, jamais la date du
  paiement ni l'échéance, même panneau Règlement ouvert (B3, B4) ; la date du paiement vide suit la date de l'achat (B5, sans changer
  `patchPurchaseDraft`).
- « C'est pas utile den avoir plusieurs » (point 7) : une seule date visible par défaut, celle de l'achat ; en « Déjà payé », la date du
  paiement la suit, son champ n'apparaît que sur « Autre date » (`payeForme`) ou si `paymentDateBasis === 'typed'` ; moyen de paiement
  atteignable comme aujourd'hui ; échéance d'« À payer » inchangée. B7 : un seul champ de date visible, « Autre date » montre la date
  du paiement, la tuile dit « Payé le <date de l'achat> » ; témoin en échec sur HEAD. Possède élargi à
  `tests/integration/expenseSheet.test.tsx` et `tests/integration/jus0Journey.test.tsx` (adaptés en gardant leur intention).

## Exigences transversales
Densité de DESIGN.md (tailles communes petites, cibles de 24 px au moins sans chevauchement) ; rien de nouveau au premier plan ; le hors
ligne et le brouillon intacts ; aucun appel Gemini ni Drive (banc simulé) ; ne rien supprimer.

## Possède
`src/ui/depense/Verdict.tsx`, `src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/apercuDev.ts`, `src/ui/depense/apercu/` (si un JSON
s'impose), `tests/unit/depense/ecran/`, `work/missions/2026-10-31-ecran-depense/voies/b1-bande/`. Rien d'autre. Pas de commit, pas de build
de production, pas de déploiement. Serveur de dev seulement dans ce dossier de travail (jamais dans `C:/Users/mrspa/Documents/Brasserie`), par
`scripts/with_server.mjs`. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json` ni `functions/.env`. Fichiers de
travail : ton dossier de voie ou `os.tmpdir()`.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/depense tests/unit/purchaseEntry.test.ts tests/unit/purchasePrefill.test.ts tests/unit/stockLineMatching.test.ts tests/unit/geminiScanner.test.ts tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx tests/integration/financeQuickActions.test.tsx tests/integration/fix114.test.tsx --maxWorkers=2 && echo TESTS ECRAN OK` → TESTS ECRAN OK
- `node scripts/audit_inputs.mjs` → INPUT PROTECTION AUDIT PASSED
- `node scripts/with_server.mjs --server "npm run dev -- --port 5617 --strictPort" --port 5617 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/b1-bande/controle-bande.mjs` → BANDE OK
- La série d'e-port tient : `node scripts/with_server.mjs --server "npm run dev -- --port 5618 --strictPort" --port 5618 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/e-port/capturer-depense.mjs --sortie=<os.tmpdir()>/b1-depense` → DEPENSE OK
  (si DEPENSE ECHEC, dire lesquels, et s'ils échouaient déjà sur HEAD)

## Retour
`voies/b1-bande/RESULTAT.md` : le diff en une phrase, les sorties des critères, les deux sorties du témoin, les captures regardées. Puis
une ligne : `B1 OK — <résumé>` ou `B1 ECHEC — <raison>`. `LEÇON PROPOSÉE : …` si une erreur de méthode apparaît.
