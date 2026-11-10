# Voie f3-rangees — la Dépense fidèle à sa vue de base : une rangée par ligne, l'état du malt, un nouvel article d'office, trois niveaux (D275, D277)

Agent : `concepteur` (Opus) : c'est ce qu'il voit (L25) ; tu codes dans l'app et tu te juges sur tes captures comme lui. Plafond : 150 tours.
Pilote : Opus ; critique Fable après la voie. Un seul temps, mais `PLAN.md` court d'abord (zone par zone : ce qui change, fichier,
fonction, contrôle), puis tu continues. Aucun commit, aucun déploiement. Relire `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`
(sauf « Deux temps » et sauf « L'écran n'est pas refait ici » : ici, la vue de base est choisie et tu la portes).
Avant de concevoir : `.claude/rules/affinee-frontend.md`, les parties utiles de `PRODUCT.md`, `DESIGN.md`, `docs/ui-compacte.md` ;
skills `boosters-ux`, `impeccable`, `ui-design-system`, au port `a11y-audit` et `senior-frontend`.

## Ses mots (SPEC-BRASSEUR, 01.11 nuit, mot pour mot) — règle n° 1 : ses choix sont respectés
- « Il y a plein de problème sur cette vue, déjà pas de traduction. Ensuite le concassage n'est pas un produit mais un état du malt.
  C'est pas du tout compacte, comme demandé, et ça créé de base automatiquement un nouveau produit du ça arrive pas à lié à un stock. Pas
  besoin d'afficher autant. Ça respecte pas trop les demandes.... Ni la vue de base. »
- « ta maquette choisie (p3c-3) non c'était un exemple, il y a une quelques améliorations entre temps ».
- « Pour les unités, c'est quand même facile à devenir ?? SI il y a un doute, ça me flag mais de base ça essaie d'auto remplir. Il y a 3
  cas de figure: sûr ou quasiment sûr, rien. / Pas sûr mais repis, flag jaune. Je contrôle / Ne sait pas, aucune idée, flag rouge, je dois
  remplir ou corrigé » ; « pas que pour les unités mais globalement pour tout ».
- « Normalement, pas besoin mais est-ce possible d'ajouter un item ? » (« + Ajouter une ligne » reste).
- « La ça règle que un des problèmes cité » (après D273f : la quantité ne court plus sur le prix ; le reste est à faire ici).
- Toujours : D235 « trié par catégorie avec sous total de quantité » ; D245 « Les bandes teintées p3a-3 j'aime beaucoup ! C'est le top 1
  de loin quasiment rien ne doit être changé » ; D248 « p3c-3 le mieux mais mettre plus en avant la quantité, juste mettre en gras, et
  bien alignées les champs ».

## La base et l'écart
L'inventaire zone par zone : `work/missions/2026-10-31-ecran-depense/inventaire/f3-base-contre-ecran.md` (base = p3c-3 et ses
améliorations ; écran = captures du bout en bout de doc14). La maquette : `work/missions/2026-10-31-ecran-depense/v3/p3c-3/etat.html`
(captures `p3c-3-repos.png`, `p3c-3-geste-plateau.png`, `p3c-3-papier.png`). **Plancher à enrichir** (L07), jamais une règle ou une carte
à la place de sa maquette (L03).

## Les modules à brancher (voies f1 et f2, déjà rendues : lire leurs RESULTAT.md)
- `src/ui/depense/optionsDuNom.ts` (`lireOptions`) : base, état, supplément, options, restes. La base devient le libellé de la ligne
  (affichage, rapprochement `matchStockLine`, nom de l'article neuf) ; l'imprimé complet reste dans la preuve (`sourceReference`,
  `evidence` ou un champ facultatif) et se lit au plateau ; l'état est une pastille sur la rangée.
- `src/ui/depense/confiance.ts` : le niveau de chaque valeur. Rouge = jeton `alert`, jaune = jeton `attention` (DESIGN.md : une seule
  couleur d'alerte) ; rien quand c'est sûr. L'unité déduite se pose au brouillon (champ facultatif qui garde la trace « déduite » ;
  D213 : la dépense ne réécrit pas l'imprimé en silence) ; l'enregistrement accepte `repris` et refuse `inconnu` (D214 restreint, D277).

## Décisions du pilote sur f1 et f2 (réversibles, D277)
- f1 : le suffixe d'unité sort du nom même quand la colonne d'unité est vide (« CARABELGE®, Kg » → base « CARABELGE® ») ; il est rendu
  dans `uniteDuNom`, que `deduireUnite` lit déjà comme indice. Une variante inconnue (couleur, taille) sort de la base et reste dans
  `restes` : le rapprochement la lit là si deux articles ne diffèrent que par elle.
- f2 : « 1 Kg » en fin de nom d'une matière qui n'est ni malt ni céréale → kg, jaune ; le numéro de facture et la TVA absents → sans
  couleur (`facultatif`) ; un écart de somme ou de TVA jusqu'à 5 centimes → jaune, au-delà → rouge.
- « Ce que f3 devra changer » dans `work/missions/2026-10-31-ecran-depense/voies/f2-confiance/RESULTAT.md` (§ 1 à 5) fait partie de cette
  voie : `uniteDeduite` facultatif sur `PurchaseLineDraft`, l'unité effective lue par `stockQuantityFor`, `effetStock`, `conversionDe`,
  `matchStockLine`, `exactUnitPriceCents`, `linkUnits` ; la validation (`purchaseEntry.ts`, `unitOk`) accepte `sur` et `repris`, refuse
  `inconnu` ; les points recalculés (`recalculerLecture`) passés à `contexte.points` pour qu'une valeur corrigée baisse son drapeau.
- Le banc Chrome se joue d'un dossier que nul autre n'écrit (L17) : Vite recharge la page à chaque écriture dans `src/`. Si `vite.log`
  du bout en bout dit « page reload » pendant ton passage, le passage ne vaut rien : relance-le. Le pilote rejoue le bout en bout à la fin.

## À faire (zone par zone, d'après l'inventaire)
1. Rangée : nom de base, une ligne (deux au plus pour un nom long, jamais coupé au milieu d'un mot) ; pastille d'état du malt concassé
   à la place de la pastille mouture de p3c-3 (son picto ↳ et le supplément compris, « ↳ 0,20 », trait plein : rien à rattacher), libellé
   accessible « concassé, supplément 0,10 par Kg compris » ; picto du lien ; quantité en gras (D248) ; colonnes alignées.
2. Une ligne d'ingrédient (malt, houblon, levure, sucre, additif) qu'aucun article ne relie est d'office `stockAction: 'new'`, nom = base,
   picto « nouvel article », comptée au récap (« n nouveaux ») ; **aucun bouton « Créer » au repos** (remplace D231). Au plateau : « article
   « <base> » · nouvel article », ⇄ pour choisir un autre article, « aucun stock » ; le champ du nom (s6) reste au plateau. Matériel,
   emballage, nettoyage, services : comme aujourd'hui pour le stock (aucun mouvement par défaut), sans bouton au repos.
3. Trois niveaux partout (f2) : chaque valeur jaune ou rouge porte `data-dp-niveau="repris"` ou `"inconnu"` sur son élément ; la barre sous
   la rangée n'apparaît que pour un rouge, ou un jaune qui a un geste (choisir l'unité, un « bis ») ; la rangée des points (« ① Date ② Lignes
   ④ Désaccord ») disparaît : chaque point devient le niveau du champ qu'il vise (la date manquante, rouge, dans la carte) ; un point sans
   champ reste au récap ; la pastille de la barre du bas dit le pire niveau restant.
4. En-tête de bande : quantités d'une même famille d'unités additionnées (7 Kg + 100 g → 7,1 Kg) quand la conversion est exacte ; « 85 g »
   jaune ; jamais « ? » quand l'unité se déduit.
5. Récap : « n reliés · n nouveaux · n hors stock », « n à contrôler » (jaune), « n à remplir » (rouge), « ↳ n moutures +x » ; un compte nul
   ne s'affiche pas (aujourd'hui « 0 unité ? (3) »).
6. Plateau : l'imprimé complet en tête (« imprimé « CARABELGE®, Kg » · MA0222 »), les options en français (« concassé, +0,10 par Kg,
   compris ») et ce que `lireOptions` n'a pas compris, tel qu'imprimé.
7. « + Ajouter une ligne » reste ; une ligne ajoutée vide montre ses valeurs en rouge.
8. Noms en français (`nameFr`, voie f5, pas encore dans la lecture) : si l'article lu porte `nameFr`, la rangée l'affiche et l'imprimé
   reste au plateau ; sinon la base imprimée. Prévoir le champ facultatif dans les types, sans l'exiger.

## Critères (rejoués par le pilote)
- Bout en bout doc14 : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh work/missions/2026-10-31-ecran-depense/voies/f3-rangees/bout/D doc14 390,1280 work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-d272b.json`
  → tous les critères verts, (a) à (l) compris ; le témoin rouge de (h) à (l) sur l'écran d'aujourd'hui est dans
  `work/missions/2026-10-31-ecran-depense/voies/e-emulateur/final9-rouge/D/console.log`.
- Captures à 390 tactile et 1280, clair et sombre : repos, rangée ouverte (malt concassé neuf, houblon jaune, matériel), ligne ajoutée
  vide, mode Papier ; côte à côte avec `p3c-3-repos.png` et `p3c-3-geste-plateau.png` (L03) ; ouvertes et regardées (L12). Le script
  `work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs` et `voies/p3c-bandes/capturer-familles.mjs` (`--mode=tactile390`).
- Tests : `npx vitest run tests/unit/depense tests/integration/expenseSheet.test.tsx tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx --maxWorkers=2`
  dans la copie isolée (`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"`, sous cmd.exe : pas de tube
  grep dans la commande) ; une attente de test qui changerait (« Créer « … » ») se met à jour avec la raison D275 ; `npx tsc --noEmit` ;
  `npm run build`.
- `git status --short` : rien hors de « Possède ».

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/**` (sauf `optionsDuNom.ts` et `confiance.ts`, à f1 et f2 : un défaut s'y signale au
pilote), `src/services/purchasePrefill.ts`, `src/services/purchaseEntry.ts` (validation de l'unité, nom de l'article neuf),
`src/services/geminiScanner.ts` (type facultatif `nameFr`), `tests/integration/expenseSheet*.test.tsx`, `tests/integration/jus0Journey.test.tsx`,
`tests/unit/depense/ecran/**`, `tests/unit/depense/fiche/ecran.test.tsx`, `tests/unit/depense/stock/**`, `tests/unit/depense/rangees/**` (neuf),
`work/missions/2026-10-31-ecran-depense/voies/f3-rangees/**`, `work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs`,
`work/missions/2026-10-31-ecran-depense/voies/p3c-bandes/capturer-familles.mjs`. Pas `scripts/check-invoice-journey-emulator.mjs` (au pilote).

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`) selon COMMUN.md, avec les captures côte à côte et ce qui reste écarté de la base (dit).
Réponse au pilote : une ligne.
