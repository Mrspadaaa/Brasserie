OK — Décider et Stocks › Matériel corrigés (7/7), tests verts, 390 clair et 1280 vus

Lot corr5-C-decider-stocks, correction 5 du port du carnet (18.11). Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
Maquettes ouvertes avant le code : p2:g01-8, g05-11, g05-9, h05-9, g05-1, g4:v02-18 ; captures vision-5 m390-27, m390-28, m390-30,
d1280-23, d1280-24.

## Fichiers écrits (seulement ceux possédés)
- `src/ui/carnets/Comparer.tsx` : `premierSansValeur`, `moinsBienQueDe` (lit `moinsBienQue` du lot A s'il existe, sinon même calcul
  Pareto sur les cellules) ; ligne « « … » : sans valeur à comparer, il ne range pas » ; la pastille « moins bien partout » quitte
  l'en-tête et devient une ligne sous le tableau.
- `src/ui/carnets/Choisir.tsx` : cadre Choisir avec photo (ou picto du lot B en grand), prix sous le nom, réglettes sous chaque ligne
  chiffrée de « Ses autres valeurs » (rang « 1er sur 4 »), ✕ de chaque écarté avec sa raison, bouton « ✓ Choisir chez … » en
  `cn-action-vert` ; `prixTexte` partout (« 2 600 CHF ») ; `Reglette` accepte `sansTete`.
- `src/ui/carnets/SupprimerCarnet.tsx` : G35 tu si `proche.memeCategorie === false` ; habit neutre (plus de `cn-aide` violet).
- `src/ui/carnets/carnets-decider.css` : colonnes 70 à 78 px à 390, vignettes 44 px ; réglettes à plat (neutralise la règle
  `.cn-reglette` de carnets.css) ; picto à la taille du cadre ; G35 et G36 neutres ; ancre `cn-barre-materiel` et + volant ancré.
- `src/ui/finance/UpgradeWorkspace.tsx` : en mode Stocks (`vue`) seulement, carte h05-9 (`ProchainAchatCarnet`), « Choisis, pas encore
  dans À venir » (`ChoisisEnAttente`), pas de courbe de caisse, « Dater » au lieu de « + mois », Réalisés vide au vouvoiement ; date
  « Ajouté le … » lue (isoDate ne lisait pas l'ISO complet) ; `BARRE_BASE`, `BARRE_COLONNE`, `BARRE_MATERIEL`. L'Atelier (sans `vue`)
  garde kh1r tel quel (D-41).
- `src/components/tabs/StocksTab.tsx` : importe `carnets-decider.css` ; le Parc garde la barre pleine largeur (`BARRE_BASE`).
- `tests/unit/carnetsCritique5Decider.test.tsx` (nouveau, 15 cas, un `describe` par correction 1 à 7).
- Ici : `captures.cjs` (arguments : port, tailles, étapes), journaux, captures `m390-clair-*`, `d1280-clair-01`, `d1280-clair-30`.
- `stocksTabBoucle.test.tsx` : **non modifié**, aucun libellé testé n'a changé ; vert.

## Problème → fait → preuve
1. **n° 9, 22, 23 (Comparer).** Colonnes de 82 px, 3 visibles à 390, 9 px sous les noms (contre ~100) ; « rangé par : tient 80 °C
   d'abord, puis le débit, puis le prix » ; « « Moins de condensation au plafond : capter la buée » : sans valeur à comparer, il ne
   range pas » ; « la 4e, Extracteur centrifuge en ligne : moins bien que la 3e sur tout » ; aucun « partout ». Écarté en dernière
   colonne et sous le tableau. Preuve : test (1), 4 cas ; banc `visibles:3, largeurs:[82…], videSousNom:[9…]` ; capture
   m390-clair-27 ouverte, 27b prise (non ouverte).
2. **n° 10, 33 (Choisir).** Picto de la hotte en 72 px, « Hotte inox 120 cm + moteur · Inox Broye · CH · en stock », « ◯ 2 600 CHF » ;
   réglettes « débit : 1 800 m³/h, 1er sur 4 » et « prix : 2 600 CHF, 4e sur 4 » ; « ✕ Ventilateur de plafond 130 cm : brasse la buée
   sans la sortir » ; bouton vert `rgb(76,107,42)` avec ✓. Preuve : test (2) ; captures m390-clair-28 et 28b ouvertes.
3. **n° 25, 37 (Choisi · pourquoi).** Réglettes sans fond (`rgba(0,0,0,0)`), picto 64 px dans le cadre de 88 ; « 2 600 CHF · en stock ».
   Preuve : test (3) ; capture m390-clair-24 ouverte.
4. **n° 27, 38 (Supprimer).** G35 seulement si le carnet proche est de même catégorie ; au banc, `carnetProche` (lot A) n'en rend plus :
   G35 absent pour Ventilation ; picto calculette `rgb(51,51,51)`, ni violet ni ✻. Preuve : test (4) ; capture m390-clair-36 ouverte.
5. **n° 40 (titre).** Comparer, Choisir et le choisi rendent le titre reçu tel quel, « ZZ TEST — » compris (test (5)). **Au banc, il
   manque encore** : `CarnetsVue.tsx` passe `titreSansBanc(ouvert.title)` (voir la décision).
6. **n° 12, 35 (À venir, Réalisés).** « Sans date · 1 », « ■ Prochain achat » et le crayon seul en haut à droite ; « Ajouté le 16 nov.
   · depuis son carnet » (le titre une fois) ; vignette ; « 4 900 CHF TTC · Froid Léman » (« en stock » seulement quand l'article le
   dit : le frigo ne le dit pas) ; « Fixer la date » (bleu finances) et « Ouvrir le carnet » ; « Il passe seul dans Réalisés quand sa
   dépense liée est payée. » ; ni « + mois » ni « Caisse fin de mois » ; dessous, « Choisis, pas encore dans À venir · 2 »
   (Embouteillage, Densimètre), ce qui remplit la moitié vide. Réalisés vide : « Projets réalisés · Un projet arrive ici seul, quand sa
   dépense liée est payée : la facture le solde. Rien à cocher. » Preuve : test (6), 2 cas ; captures m390-clair-30 ouverte, 31 prise.
7. **n° 41 (1280).** Segment 316 à 1052 px (736), contenu de la colonne 316 à 1052, + volant 1060 à 1116 (8 px du bord). Ancrage CSS
   (`anchor-name`, `position-anchor`, sous `@supports`) : sans lui, le + garde sa place d'avant. Preuve : test (7), 2 cas ; capture
   d1280-clair-01 ouverte.

## Sorties décisives
- CHECK `npx vitest run tests/unit/carnetsCritique5Decider.test.tsx tests/integration/stocksTabBoucle.test.tsx` : 2 fichiers, 19 tests verts.
- `npx tsc --noEmit -p .` : sortie 0, aucune erreur.
- `npx vitest run tests/unit/carnets` + tests d'UpgradeWorkspace (equipmentProjects, fixMateriel, fixMateriel2, ouvertureArchiveVolume,
  projetsPrevisions) : 540 verts, 20 rouges. **Un seul vient de moi, et il est voulu** : `carnetsEcrans.test.tsx` R06 attend encore
  « moins bien partout », le libellé que la critique 5 (n° 23) refuse. Les 19 autres touchent des fichiers des lots A, B et D, en cours :
  `comparer.ts`, `iaSimulee.ts`, `ListeCarnets`, `CarnetOuvert`, `ChampCarnet`, `rangement`. Exemple : P20 de carnetsCritique4Donnees,
  où `carnetProche` ne rend plus Ventilation. carnetsCritique4Decider (tour 4) reste vert.
- Banc : vite dev sur 5431 puis 5432, `VITE_FIREBASE_*` fictifs, Google coupé, aucun `pageerror` ; serveur arrêté (0 écoute).
- `git status --short` : mes 7 fichiers + le test neuf ; les autres modifiés appartiennent aux lots concurrents (non touchés).

Essais : (6) 3 (format du prix « 4’900 », date non lue, couleur du texte du bouton : `text-cave-950` est l'échelle texte, d'où
`text-[rgb(var(--cave-950))]`) ; le reste en 1. Captures : 4 lancements (le 3e : vite pas encore prêt, relancé avec attente du 200).

## Doutes et limites
- `moinsBienQue` : le lot A a ajouté le champ pendant le lot ; Comparer le lit, et calcule de même s'il manque. `rangePar` n'est pas
  étendu par le lot A à l'heure du rendu : la ligne « sans valeur » est calculée dans Comparer et se tait si `rangePar` cite déjà
  le critère.
- Le cadre Choisir garde le tableau « Ses autres valeurs » de g05-9 et y glisse les réglettes de g05-11 : base respectée, plancher
  enrichi. Les cartes des autres articles (2e à 4e) n'ont pas de vignette : Choisir ne reçoit qu'un picto, celui du 1er.
- « Fixer la date » ouvre le choix du mois existant (précision au mois), pas un jour.
- « Choisis, pas encore dans À venir » ouvre le carnet ; « Envoyer dans À venir » reste sous le pourquoi, un toucher plus loin.
- Le + volant ancré dépend de l'ancrage CSS (Chrome 125+, Safari 26) ; Firefox garde l'ancienne place.
- Le choisi liste « ✓ Critère : Moins de condensation au plafond : capter la buée » (le critère passé par CarnetsVue est le 1er, sans
  valeur) ; hors de ma part (n° 22 visait Comparer).

DÉCISION À PRENDRE : n° 40, titre. `CarnetsVue.tsx` (hors de mes fichiers) passe `titreSansBanc(ouvert.title)` à Comparer et Choisir,
alors que CarnetOuvert affiche `c.title`. Options : (a) passer `ouvert.title` aux deux appels (lignes de `<Comparer` et des deux
`<Choisir`) ; (b) garder. Recommandation : (a), au lot qui tient CarnetsVue ; mes composants rendent déjà le titre reçu tel quel
(test (5)). Mettre aussi `carnetsEcrans.test.tsx` R06 à jour : « moins bien que la » au lieu de « moins bien partout ».

DEMANDE EXECUTANT :
1. Depuis `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, avec `VITE_FIREBASE_API_KEY=banc-faux`,
   `VITE_FIREBASE_AUTH_DOMAIN=banc.invalid`, `VITE_FIREBASE_PROJECT_ID=banc-faux`, `VITE_FIREBASE_STORAGE_BUCKET=banc.invalid`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID=0`, `VITE_FIREBASE_APP_ID=1:0:web:0` : `npx vite --port 5432 --strictPort --host 127.0.0.1` en
   arrière-plan ; attendre que `curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:5432/?preview=carnets"` rende 200, puis 4 s.
2. `node C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-port-carnet/voies/corr5-corr5-C-decider-stocks/captures.cjs 5432 m390-sombre,d1280-clair,d1280-sombre > journal-suite.txt`
   (dans ce dossier de voie). Fichiers produits : `<taille>-<thème>-01-liste`, `27-comparer`, `27b-comparer-ecartes`, `28-choisir`,
   `28b-choisir-reglettes`, `24-choisi-pourquoi`, `36-supprimer`, `30-a-venir`, `31-realises` (.png), aucun `-echec`.
3. Arrêter vite (`taskkill //F //T //PID` de chaque PID qui écoute 5432), vérifier 0 écoute.
4. Attendus dans le journal, pour chaque taille et thème :
   - 01 à 1280 : segment `l:736`, et `plus.g` = `segment.d + 8` ;
   - 27 : `visibles:3` à 390, `videSousNom` ≤ 12 partout, `partout:false`, `domines` = « … moins bien que la 3e sur tout » ;
   - 27b : l'écarté « Ventilateur de plafond 130 cm … brasse la buée sans la sortir » ;
   - 28 : 2 réglettes « … sur 4 », 1 écarté, bouton « Choisir chez Inox Broye » vert, « 2 600 CHF » ;
   - 24 : `fondReglette` transparent, `picto` ≥ 56 ;
   - 36 : `g35` nul ou d'un carnet de ventilation de la salle de brassage, picto non violet ;
   - 30 : « Fixer la date », `plusMois:false`, `caisse:false`, titre une seule fois ;
   - 31 : « quand sa dépense liée est payée », aucun « Tes ».
5. Captures à ouvrir et à rendre au pilote, côte à côte avec la maquette : m390-clair-27b et m390-clair-31 (déjà prises), puis
   m390-sombre-27, 28, 24, 30 ; d1280-clair-27, 28, 24, 30, 31 ; d1280-sombre-01, 27, 28, 24, 36, 30. Question : « combien et quels
   problèmes ? ». Le texte du bouton « Fixer la date » doit être clair sur bleu en clair et sombre sur bleu pâle en sombre.

CONNAISSANCE : dans l'app, `text-cave-950` vise l'échelle de texte (`--cave-texte-950`), pas le fond `--cave-950` : pour du texte de la
couleur du fond (blanc en clair) sur un aplat, il faut `text-[rgb(var(--cave-950))]`. `isoDate` (finance/ledger) ne lit que
AAAA-MM-JJ : un `createdAt` ISO complet doit être coupé à 10 caractères, sinon « Ajouté le … » disparaît sans erreur.
LEÇON PROPOSÉE : aucune
