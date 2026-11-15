OK — Étape 3 comme g6 : icônes, une petite ligne, cases « ? » et « ≈ » renvoyant à la feuille, estimé étendu ; 1 branchement restant (FinancesTab).

## Fichiers écrits
- `src/ui/finance/annuel/Etapes.tsx` : `Etape3` seule (icônes de nature, petite ligne bornée, cases en boutons, estimé malt/houblons/emballages, phrase supprimée).
- `src/ui/finance/annuel.css` : cases `.ann-inv button.c`, `.l/.e/.s`, colonnes 84 → 80 px comme g6.
- `src/ui/finance/annuel/ctx.ts` : champ optionnel `nature` de `OuvertureInventaire`.
- `src/ui/finance/FinanceForms.tsx` : `ClosingSheet` reçoit `nature?` (ajout d'option seulement ; le reste de la feuille est inchangé).
- `tests/integration/clotureInventaires.test.tsx` (neuf, 12 tests), `voies/ci/capturer.mjs`, `voies/ci/captures/` (3 PNG), `voies/ci/tests.txt`.

## Critères
- Rouge d'abord : 12 tests sur 12 échouent sur HEAD (avant le code).
- Vert : `npx vitest run` sur 6 fichiers (neuf + annuelCalculs, annuelEcran, annuelGestes, f2ReelAnnuel, taxWorkspace) : **60 passés / 6 fichiers** (voir `tests.txt`).
- `npx tsc --noEmit` (hors les 5 paquets exclus) : aucune erreur. `npx vite build --outDir "$TEMP/ci-build"` : built in 15 s.
- Essais : 2 sur le test de la petite ligne (mon compte « +7 » était faux : 7 malts en stock + Pilsner de la démo = 8, donc « +6 », et le regex `0 kg` attrapait « 10 kg »).
- Captures (ouvertes, L12) : 390 clair, 390 cave, 1280 clair, étape 3 au repos, jeu `reel` + 11 malts en mémoire de la page (dont plusieurs à 0 kg). Icônes, cases de même hauteur, « ? » hachuré, petite ligne sur une ligne : conformes à g6-3. 1280 : la petite ligne tient entière (« Pilsner Malz 10 kg, Weizenmalz 8,5 kg +6 aujourd’hui »).

## Ce qui a changé, et pourquoi
- Petite ligne : articles à 0 exclus, les deux plus gros par quantité, « +N », « aujourd’hui » une seule fois (jamais coupé). Emballages : les noms seuls (g6 : « bouteilles, capsules »), sans « aujourd’hui ». Bière : « nom du lot, N L nets » comme avant.
- Cases : `<button>` « ? » (hachuré) ou « ≈ x » (vert), nom accessible « Noter Malt au 31 déc. » / « … au 1er janv. » ; `disabled` sur une version figée, comme « Noter l’inventaire ». Une case déjà valorisée reste un texte.
- Renvoi : 31 déc. de l'exercice en cours, malt/houblons/emballages : `onInventories({ cote:'closingInventory', nature, proposer:true, propositions de cette nature })`. 1er janv., Bière en cave, année passée : `nature` seule, sans proposer (le stock d'aujourd'hui n'est ni celui du 1er janvier ni celui d'une année passée : « l'inconnu n'est jamais 0 » ; écart assumé avec la lettre de la voie, qui disait « proposition depuis le stock » partout).
- Feuille (`ClosingSheet`, option `nature`) : si la nature a déjà une ligne du côté choisi, rien n'est ajouté ; sinon les lignes du stock de cette nature (0 exclus, valeurs NON saisies, « Utiliser ≈ » possible), sinon une ligne vide du bon type (Bière : « Bière conditionnée », Emballages : « Emballages »). Testé en unité sur la feuille.
- Estimé : malt, houblons, emballages, même règle (`valeurEstimee`), seulement si CHAQUE article en stock (>0) a une facture, sinon « ? » (jamais un total partiel ni 0). Ligne : « ≈ 22,42 : 3 kg au prix de la dernière facture, estimé » (1 article) ou « ≈ X : N articles au prix de leur dernière facture, estimé » ; préfixe « Malt », « Houblons »… quand plusieurs natures sont estimées ; détail par article et facture en `title`. Bug évité : l'ancienne règle du malt tombait à `null` dès qu'un article à 0 kg existait.
- Phrase « La bière en cave se saisit dans la feuille… » supprimée.

## BESOIN HORS PÉRIMÈTRE (à faire par le pilote, 1 jeton)
`src/components/tabs/FinancesTab.tsx` l.120 : `<ClosingSheet … cote={closingOpts.cote} proposer={closingOpts.proposer} propositions={closingOpts.propositions} nature={closingOpts.nature} …/>`. `closingOpts` stocke déjà l'objet entier (`setClosingOpts(ouverture??{})`) ; seule la prop manque. Sans elle, la case ouvre la bonne feuille du bon côté, mais la nature n'est pas prête. Je n'ai pas modifié ce fichier (hors Possède).

## DEMANDE EXECUTANT :
Après l'ajout ci-dessus, capture. Serveur : `npx vite --port 3005 --strictPort` en arrière-plan (depuis la racine du worktree), arrêté à la fin.
Commandes (depuis `work/missions/2026-11-09-compta-prix/voies/ci/`) :
1. `node capturer.mjs clair feuille` ; 2. `node capturer.mjs cave feuille` ; 3. `LARGEUR=1280 node capturer.mjs clair feuille` ; 4. `LARGEUR=1280 node capturer.mjs cave feuille`.
Fichiers attendus dans `captures/` : `{390,1280}-{clair,cave}-etape3-repos.png` et `-feuille-malt-31dec.png`. Sortie : « CAPTURE … » ×2 par lancement ; « MANQUE clic : Préparer la clôture / Clôture » est normal (le script tombe déjà sur la clôture) ; le clic « Noter Malt au 31 déc. » ne doit PAS être listé « MANQUE ».
À ouvrir : les 8 captures. Attendu sur la feuille : titre « Inventaire et clôture 2026 », côté « Clôture au 31 décembre 2026 », 8 lignes de malt (les articles à 0 kg absents), valeurs vides. Puis côte à côte avec `p3/g6/g6-3-inventaires.png`.
Hors capture automatique : une case « ≈ » (jeu complet `?dev-local&finance-demo`, sans `=reel`) ; non scripté.

## Doutes et limites
- 390 : avec des noms longs (« Pilsner Malz »), la ligne se coupe par « … » avant « +6 aujourd’hui » (« Pilsner Mal… +6 aujourd’hui ») ; l'info utile (le « +N » et la date) reste. Seul le nom du premier article se coupe. À juger par le pilote ; contre-option : cacher « aujourd’hui » sous 480 px (je l'ai écartée : le stock d'aujourd'hui n'est pas celui des colonnes).
- Aucune capture de feuille ouverte tant que FinancesTab ne passe pas `nature` ; le comportement de la feuille est prouvé par test (jsdom), pas par vue.
- « ≈ » en navigateur non capturé (le jeu `reel` n'a pas de facture par article).
- `controle-choix.mjs` non rejoué (pas dans la liste de la voie).

DÉCISION À PRENDRE : 1er janv. et années passées sans proposition du stock (écart avec la voie). Recommandation : garder (honnête, réversible : retirer la condition `cote === 'closingInventory' && c.anneeCourante` dans `ouvrir`).
CONNAISSANCE : `natureDeLigne` (calculs.ts) ne reconnaît « Emballage » qu'à partir du type de la ligne saisie ; un article de stock « Emballage » y tombe en « autres » : Etape3 a sa propre `natureStock`.
LEÇON PROPOSÉE : aucune
