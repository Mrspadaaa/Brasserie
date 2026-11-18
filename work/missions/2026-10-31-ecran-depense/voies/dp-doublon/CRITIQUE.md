CRITIQUE OK — montrable après 4 petites corrections (titre « autre total : 7001 », « 2 j d'é… » coupé à 390, « peut-être » après le certain, vide à 1280) ; aucun refus

Critique Fable, 01.11, sur les dix captures ouvertes (390 et 1280, états 1 à 5) et le code de `PieceDejaSaisie.tsx` / `ExpenseSheet.tsx`.
Sa demande : « on doit voir que ce document est déjà lié à un stock, facture ». État ajouté à un écran existant : pas de refonte jugée.

## Verdict d'ensemble
L'idée répond à sa phrase en trois secondes : « Déjà enregistré » + « même fichier », la facture F-1001, « Lié au stock » avec les pastilles
qu'il a aimées le 01.11 (« J'aime beaucoup les pastilles sur les items, ça rend la chose très clair »), sans lecture ni attente. Aucun refus
explicite rejoué : D1 (≈ 56 mots au premier écran de 390-1, ≤ 80), D3 (plus long bloc : 2 lignes), D5 (tout tient à 390), pas de jargon.
Phrase prédite : « Là on voit direct que c'est déjà rentré, et sur quoi : Maris Otter, Citra, à payer. Très bien. Mais "autre total : 7001"
??? et le texte coupé "2 j d'é…" c'est pas fini. »

## Par état

### 1. Repos, même fichier (390-1, 1280-1) — ACCEPTÉ à 390, À CORRIGER à 1280
- 390-1 : accepté. Nom, facture, date, total, règlement, stock en pastilles avec quantités, « Ses 3 lignes » à un toucher, deux gestes.
  Signal sans règle : la feuille n'occupe que le bas de l'écran (≈ 40 %), le reste est l'app floutée ; D235 (« prenne vraiment toute la
  place ») visait la liste des articles, pas cette carte ; à laisser.
- 1280-1 : **à corriger**. Zone : la carte de 440 px à gauche, ≈ 760 × 230 px de vide à droite dans la feuille. Règle : D150 « encore beaucoup
  de vide pour rien », D55 « étrange d'avoir autant d'espace ». Correction la plus petite : à `lg`, poser « Ses N lignes » dépliées dans la
  colonne de droite (la grille `lg:col-start-1` existe déjà pour l'état de lecture, 1280-3), la carte restant à gauche.

### 2. Détail ouvert (390-2, 1280-2) — À CORRIGER (petit)
- Les trois lignes se lisent, montants alignés, cube relié / cube vide. Mais la ligne « Citra 12.5% » ici est « Citra T90 100 g » dans la
  fiche de la même dépense (390-5) : `nomLigne` (PieceDejaSaisie.tsx : 64) remplace le libellé de la ligne par le nom de l'article de stock.
  Règle : honnêteté (portrait § 3.4), L14 (chaque nom confronté à sa ligne). Il dirait « c'est pas la même ligne ??? ». Correction : afficher
  `line.description` comme la fiche ; le nom du stock reste dans les pastilles « Lié au stock » (c'est là qu'il répond à « lié à un stock »).
- 1280-2 : même vide à droite que 1280-1 (même correction).

### 3. « Lire quand même » (390-3, 1280-3) — À CORRIGER (petit)
- Zone : titre de la section existante « Achat peut-être déjà enregistré », alors que l'écran précédent disait « Déjà enregistré · même
  fichier » (certain) et que la ligne « Même fichier déjà joint » (rang 0) est sous le tableau. Règle : honnêteté, D57 « Pourquoi il y a
  parfois … ?? » ; il dirait « avant c'était sûr, là peut-être ??? ». Correction (ExpenseSheet.tsx : 551) : au rang 0, titre « Achat déjà
  enregistré · même fichier », sinon le titre actuel. Rien d'autre ne change.
- La ligne « Lié au stock : Maris Otter, Citra 12.5% » au-dessus du tableau : bien, un toucher de moins que la carte.
- Capture à refaire, pas un défaut d'écran : la lecture simulée du banc donne « 14.10.2026 » et « Payé le 14.10.2026 supposée » pour un fichier
  identique à la dépense du 12.10 « À payer ». Il compare les chiffres (L14) : aligner la lecture simulée de `capturer-doublon.mjs` sur la
  fixture (12.10.2026, non payée) avant de lui montrer. Le bandeau « … Réessaie. » : banc, hors sujet.

### 4. Même commande, autre total (390-4, 1280-4) — À CORRIGER
- Zone : titre « Même commande, autre total : 7001 ». En trois secondes, 7001 se lit comme le total (portrait § 3.1 ; D94 « difficile à
  comprendre »). Correction (ExpenseSheet.tsx : 566) : « Commande 7001 déjà enregistrée, autre total » ou « Même commande 7001, autre total ».
- Zone : ligne Date, « 12.10.2026 · 2 j d'é… » coupé à 390 (lisible à 1280 : « 2 j d'écart »). Règle : L12 (juger à 390 tactile), D163
  (un libellé coupé ou chevauché dans un tableau). Correction : « +2 j » en mono à côté de la date, comme « +0,25 » à côté du total, ou
  l'écart à la ligne sur une largeur < 420 px.
- Le reste tient : deux totaux côte à côte, « +0,25 » souligné en couleur d'attention, « Même achat · ne rien enregistrer / Autre achat »,
  « Ce n'est qu'un signal » (une ligne, D3 respecté). Honnête : « sans n° » dit l'absence plutôt qu'un zéro.

### 5. « Ouvrir la dépense » (390-5, 1280-5) — ACCEPTÉ
- La feuille se ferme, la fiche existante s'ouvre, même titre « Malt et houblons · F-1001 » : continuité, c'est le geste qu'il attend
  (« ouvrir la dépense d'un toucher »). Écran existant, rien à juger de plus.

## Signaux sans règle (à ne pas corriger sur ma seule foi)
- « Ce fichier est celui de cette dépense : il n'est pas relu. » : 11 mots au premier plan ; D1 et D3 tiennent. Un « Pas relu » seul suffirait,
  mais rien ne l'exige.
- Cube vide devant « Frais de port » : cohérent avec « 1 sans stock » de l'état de lecture ; pas une icône muette (D90), la ligne la nomme.

## Résumé des corrections (ordre)
1. ExpenseSheet.tsx : 566 — titre de la même commande, n° avant « autre total ».
2. ExpenseSheet.tsx, ligne Date de la même commande — « +2 j » ou à la ligne sous 420 px.
3. ExpenseSheet.tsx : 551 — « Achat déjà enregistré · même fichier » au rang 0.
4. PieceDejaSaisie.tsx : 64 — `line.description` pour les lignes ; à `lg`, lignes dépliées en colonne droite.
5. capturer-doublon.mjs — lecture simulée alignée sur la fixture (12.10.2026, à payer), puis captures refaites.

DEMANDE EXECUTANT (après les corrections 1 à 5, par le pilote) :
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/depense/doublon tests/unit/purchaseEntry.test.ts tests/unit/depense/enregistrement tests/integration/expenseSheet.test.tsx --maxWorkers=2 && echo TESTS DOUBLON OK` → TESTS DOUBLON OK
- `node scripts/with_server.mjs --server "npm run dev -- --port 5631 --strictPort" --port 5631 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/dp-doublon/capturer-doublon.mjs` → `DOUBLON OK`
- Captures à rouvrir (dossier `captures/`) : 390-2, 390-3, 390-4, 1280-1, 1280-2, 1280-3, 1280-4 ; vérifier « Citra T90 100 g » dans les
  lignes, « 12.10.2026 » dans « Document lu », aucun « … » dans la ligne Date à 390, aucune zone vide > 300 px dans la feuille à 1280.

LEÇON PROPOSÉE : aucune.
