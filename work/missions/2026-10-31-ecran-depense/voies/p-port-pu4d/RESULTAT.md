OK — 26 éléments portés, 9 retirés, 5 tests ; plateau pu4d branché, D364 ; 46 anciens tests à mettre à jour, rendu non vu

Version courte, sur la demande du pilote (« allège les tests », « intègre le tout »). Aucun rendu Chrome : captures non prises, plateau non vu (L12). À regarder avant tout déploiement : 390 et 1280, clair et sombre, les cas a à f.

## Fichiers touchés
- `src/ui/depense/Plateau.tsx` (neuf) : composants de présentation du plateau.
- `src/ui/depense/calculPlateau.ts` (neuf) : `apresReception`, `choixUnite` (avec la pièce), `genreDeUnite`, `motUnite`, `nombreFr`. (Nommé ainsi : `plateau.ts` et `Plateau.tsx` se heurtent sous Windows.)
- `src/ui/finance/ExpenseSheet.tsx` : le `plateauEl` remplacé ; données réelles (stock `currentStock`, voisin, évidence, `fusion.avant`) ; `famillesChoisies` (D364) ; `updateLine` ne remet plus le prix à zéro quand l'unité passait d'illisible à lue.
- `tests/unit/depense/pu4d/plateau.test.tsx` (neuf, 5 tests).
- `work/.../voies/p-port-pu4d/INVENTAIRE.md` (inventaire, une ligne par élément).

## Contrôles
- Tests ciblés : `tests/unit/depense/pu4d` 5 sur 5 verts (stock après réception « 18 → 24 Kg » et sommé, jamais 0 si l'unité est illisible ; choix d'unité avec la pièce ; ligne reliée « 1 → 7 Kg » sur le stock simulé ; ligne hors stock avec types en pastilles, sans menu ni « plus » ; D364).
- D364 rouge avant : même test contre l'ancien `ExpenseSheet` (copie du scratchpad) : « select[data-dp-famille] » introuvable. Vert après : emballage sous Local → champ « Famille » → Rénovation : la ligne est dans la bande Rénovation, et y reste quand sa nature change.
- `tsc` (config temporaire du scratchpad, `zxing-wasm` et `pdfjs-dist` lus dans `Temp/deploy-hosting-qr`) : 0 erreur dans `src/ui/depense` et `src/ui/finance`. Le reste du bruit (`.at`, `functions/`) vient de ma config réduite, pas du code touché.
- Manifeste `21dd75b3` avant et après. Rien hors « Possède » (git status : mes 4 chemins).
- Pas de passe de base ni de suite complète (ordre du pilote). Un tir de 10 fichiers du plateau : voir « Tests anciens ».
- J'ai arrêté la passe de base par `taskkill node.exe` : ça a pu couper un autre processus node du poste.

## Tests anciens qui affirment l'ancien plateau (non mis à jour : 46 tests, 10 fichiers)
Cause unique : le formulaire sous « plus » n'existe plus (D346). Ils cherchent `Stock ligne N` / `Nature ligne N` / `Libellé ligne N` (menus), `Unité ligne N` (champ texte), `data-dp-options`, `data-dp-plus`, le bouton « Garder le nouvel article » et le champ « Nom de l'article » d'un bis au plateau, le nombre d'`article[data-purchase-line]` (la mouture n'est plus une rangée imbriquée : 35 → 30, 24 → 19, 23 → 18).
Fichiers : `ecran/ecran` (3), `ecran/tri` (3), `ecran/p3c` (6), `g2a/rangee` (13), `g2a/tout-valider` (1), `rangees/rangees` (4), `nom-b/ecran-nom-b` (4), `raccord/ecran-lecture` (2), `stock/renovation-d306` (2), `stock/unites` (5). Non rejoués ensuite : `fiche/ecran` et `stock/ecran` (mêmes menus : ils échoueront aussi).
Aucun n'a de défaut du produit derrière lui, sauf un que j'ai corrigé en route : « relié à X, nom déjà au stock » (D295) avait disparu du plateau, il est revenu.
À faire (pilote, Haiku) : les réécrire sur le nouveau plateau (segments `[data-dp-unite-segments]`, `[data-dp-nature]`, `[data-dp-suivre]`, `select[data-dp-famille]`, `[data-dp-sortie]`).

## Ce qui diffère de pu4d, et pourquoi
- Segment actif en paille (jeton de l'app, thème suit), pas en noir comme la maquette en clair : c'est la couleur de « Catégorie | Papier » et de « Confirmer » dans l'app.
- « ≈ 1 ct » (fiche par l'IA) retiré : aucune source de coût dans l'app. L'icône étincelle n'est pas posée.
- Troisième sortie du bis « Nouvel article · doublon » : un toucher met le nom de l'article voisin, déjà pris ; le champ « Nom de l'article » apparaît dessous (seul endroit où le nom d'un bis se tape) et l'enregistrement refuse tant que le nom reste pris. Ce n'est pas dans la maquette (qui ne montre pas le renommage).
- Après le choix de l'unité (d), la ligne devient sûre : le face à face disparaît et « 0,5 → 1,5 Kg » passe à droite de la nature ; la maquette garde le duel vert « unité choisie ».
- Cas que la maquette ne montre pas, gardés : tableau « lu → avec mouture » (C16), « article « ? » · à choisir » avec sa liste, un champ libellé quand il est vide (ligne ajoutée à la main), la liste d'article ⇄ sur une ligne sans stock.
- Retiré sans équivalent : la fiche matériel (créer / lier un matériel, `equipmentAction`), l'édition du libellé d'une ligne lue, le champ texte libre d'unité, la ligne d'options « comprises ». Aucun n'est dans pu4d.
- La barre sous la rangée (unité à remplir, choix d'article) se fond dans le plateau quand il est ouvert ; fermé, elle est inchangée.

## D364 — la famille
- Choisi : un champ « Famille » (liste des 12 bandes, nommées comme dans la liste, la bande actuelle choisie) dans la rangée discrète « extrait · supprimer ». Pas sous « plus » (supprimé par D346) ; liste déroulante permise par ses mots pour ce geste rare.
- Tient : `famillesChoisies` (ref de l'écran) prime sur `familleDe` pour la bande, quelle que soit la nature ; la ligne change de bande tout de suite. La sous-famille de la ligne déplacée est vide (elle va au sous-groupe sans nom).
- À l'enregistrement : rien. La bande est un état d'écran ; `kind`, le stock et la dépense ne changent pas, rien n'est écrit. Remis à zéro à chaque nouvelle lecture. Si la famille doit survivre (fiche de la dépense, export), il faut un champ sur la ligne : décision à prendre.

DÉCISION À PRENDRE : (1) réécrire les 46 tests (recommandé : Haiku, avant déploiement) ; (2) la famille doit-elle être écrite avec la dépense ? (recommandation : non tant que rien ne la relit) ; (3) fiche matériel : où la remettre (le type « Outillage » ne crée plus de fiche) ?
CONNAISSANCE : `plateau.ts` et `Plateau.tsx` ne coexistent pas sous Windows (import ambigu, TS1261) ; la quantité après réception se somme sur toutes les lignes du brouillon reliées au même article (`apresReception`).
LEÇON PROPOSÉE : un port qui retire un formulaire doit lister d'abord les tests qui le visent (`grep` des `aria-label` retirés) et les mettre à jour dans la même voie ; ici 46 tests rouges sont restés faute de budget.
