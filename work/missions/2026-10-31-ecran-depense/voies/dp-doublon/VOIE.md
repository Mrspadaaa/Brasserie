# Voie dp-doublon — une pièce déjà saisie se voit tout de suite, avec ce à quoi elle est liée

Agent : concepteur (Opus : le brasseur le voit, L25). Plafond : 70 tours. Pilote : Opus. Date : 01.11. Après d3c (mêmes fichiers).
Critique : `critique` (Fable) sur les captures, avant de montrer.

## Sa demande (01.11, mot pour mot ; SPEC « Une pièce déjà saisie »)
« et les deux PDF de la commande 652093 sont identiques. Géré ce cas là, on doit voir que ce document est déjà lié à un stock, facture ».
Portée (L01, lecture étroite) : la feuille Dépense, quand on y joint une pièce déjà enregistrée. Ni schéma Firestore, ni autre écran.

## Ce qui existe déjà (L02 : le lire, le garder, ajouter le petit élément qui manque)
- `src/services/purchaseEntry.ts` : `duplicateMatch` (rang 0 « Même fichier déjà joint » par `sourceDocumentHash` ; rang 1 même facture ;
  rang 2 même fournisseur, date et total ; rang 3 même fournisseur et total avec références ou dates proches), `purchaseDuplicates`,
  `purchaseSimilarOrders` (« Même commande, autre numéro » : même total **au centime** exigé), `purchaseProofAttachable`.
- `src/ui/finance/ExpenseSheet.tsx` : `attach()` calcule l'empreinte SHA-256 **avant** la lecture, puis appelle `scanDocument` quand même ;
  la section « Achat peut-être déjà enregistré » (`#purchase-duplicate`, tableau « Document lu / Déjà enregistré », choix « Même achat /
  Autre achat ») et la section « Même commande, autre numéro » n'apparaissent qu'**après** la lecture. `attachToExisting` rattache.
- Tests : `tests/unit/purchaseEntry.test.ts`, `tests/unit/depense/enregistrement/doublon-commande.test.ts`,
  `tests/integration/expenseSheet.test.tsx`.

## Ce qui manque
1. **Même fichier : certain, et sans lecture.** Quand l'empreinte du fichier choisi est celle d'une dépense non annulée, la feuille le
   dit tout de suite, sans appeler Gemini (ni coût ni attente) : « Déjà enregistré », pas « peut-être ». On y voit ce à quoi la pièce est
   liée : la date, le fournisseur, le n° de facture, le total, payé ou non ; **les articles de stock** de ses lignes
   (`FinanceLine.stockItemRef` → nom de l'article ; leur nombre, les noms à un toucher s'ils sont plus de deux) et le matériel
   (`equipmentRef`). Deux gestes : ouvrir la dépense existante (la route de fiche qui existe déjà, sinon fermer puis ouvrir la fiche) et
   « Lire quand même » (la lecture part comme aujourd'hui ; la section actuelle apparaît ensuite).
2. **Le lien dans les sections actuelles.** « Achat peut-être déjà enregistré » et « Même commande, autre numéro » disent aussi à quoi la
   dépense existante est liée (articles de stock, matériel), sur une ligne.
3. **Un cas réel manqué.** La facture PDF et la page web de **la même commande** : même fournisseur, même n° de commande, totaux qui
   diffèrent de quelques dizaines de centimes (un supplément arrondi autrement), et la page web sans n° de facture. Aujourd'hui : aucun
   signal. Désormais : même fournisseur + même n° de commande (60 jours au plus) signale, même si les totaux diffèrent ; les deux totaux
   sont montrés et l'écart souligné. Un signal, jamais un blocage ; sans n° de commande, les règles actuelles seules.
4. Une ancienne dépense sans empreinte : inchangé (règles après lecture).

## Exigences transversales (recopiées, L05)
- PRODUCT.md, DESIGN.md, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md` : premier plan léger, détail à un toucher, tailles
  compactes de DESIGN.md, jamais `type="number"`. Garder l'allure de la section actuelle (`uncertainClass`, `AlertCircle`, tableau
  compact) ; le cas certain dans la même famille visuelle, sans nouvelle couleur.
- Ses mots : « déjà lié à un stock, facture ». Pas de jargon (« empreinte », « hash » n'apparaissent jamais à l'écran).
- Hors ligne : la recherche se fait sur les transactions déjà chargées, sans réseau.
- Gemini jamais appelé dans un test ni dans la vérification : `scanDocument` simulé ; la vérification Chrome prouve qu'aucune requête
  `aiTask` ne part.
- Plancher à enrichir (L07) : si un geste plus juste sert mieux sa phrase, le proposer dans RESULTAT.

## Possède
`src/services/purchaseEntry.ts` (les fonctions de doublon seulement), `src/ui/finance/ExpenseSheet.tsx` (`attach()` et les deux sections
de doublon seulement), un composant neuf au besoin `src/ui/finance/PieceDejaSaisie.tsx`, `tests/unit/depense/doublon/**` (neufs),
`tests/integration/expenseSheet.test.tsx` (ajouts), `work/missions/2026-10-31-ecran-depense/voies/dp-doublon/**`.
Rien d'autre. Aucune donnée réelle, aucun déploiement, aucun commit, aucune installation. Ne touche jamais `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env`. Jamais de serveur dans `C:/Users/mrspa/Documents/Brasserie`. Chemins
absolus dans Bash.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/depense/doublon tests/unit/purchaseEntry.test.ts tests/unit/depense/enregistrement tests/integration/expenseSheet.test.tsx --maxWorkers=2 && echo TESTS DOUBLON OK` → TESTS DOUBLON OK
  (dont : même fichier → `scanDocument` jamais appelé, noms des articles affichés ; « Lire quand même » → appelé une fois ; même commande
  et totaux différents → signal ; même commande sans n° de commande lu → rien de neuf ; témoin négatif rejoué sur HEAD : ces tests y échouent)
- `npm run build` vert (md5 du manifeste inchangé avant et après)
- un script `puppeteer-core` dans ta voie (`?dev-local`, fixture : une dépense dont l'empreinte est celle d'un fichier de fixture, liée à
  deux articles de stock), qui joint ce fichier par l'`input` de la feuille, à 390 × 844 tactile puis 1280 : `DOUBLON OK` seulement si la
  section certaine est visible, les noms des articles lus, et aucune requête `aiTask` partie ; captures de chaque état (repos, détail
  ouvert, « Lire quand même », même commande à deux totaux) ouvertes par toi (L12)

## Retour
`voies/dp-doublon/RESULTAT.md` : ce qui a changé, le contrôle choisi et sa représentation, les sorties, les captures. Puis une ligne :
`DOUBLON OK — …` ou `DOUBLON ECHEC — …`. `LEÇON PROPOSÉE : …` au besoin.
