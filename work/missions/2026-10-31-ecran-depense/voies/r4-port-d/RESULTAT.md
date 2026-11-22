OK — son choix D porté : sous-groupes repliés dans la bande, état et toutPlier/toutDeplier prêts, sans contrôle visible

Aucun commit. 2138 tests verts (137 fichiers, 3 sautés d'avant), `tsc --noEmit` 0 erreur, `npm run build` 0 erreur, `capturer-d.mjs` → `PORT-D OK`. Captures ouvertes en image (L12). Aucune attente existante changée.

## Inventaire de sa maquette D (`choix-sousfamilles`, `d-*.html`, `outils/gen.mjs` `sousGroupe`, `outils/sf.css`)
- Éléments : sous l'en-tête de bande (inchangé), une ligne par sous-famille, `<button>` pleine largeur de 28 px (`min-h-7`), filet de famille à gauche, trait bas ; chevron (18 px, `>` replié, `v` ouvert), nom (14 px, gras ouvert), pastille de nombre (cadre), quantité mono 12 px gras dans la colonne de quantité de bande (`ml-auto mr-[57px]`), montant mono 14 px (`min-w-[54px]`). Ouvert : fond de la couleur de famille à 10 %.
- États : replié (au repos), ouvert (ses rangées, celles d'aujourd'hui), ouvert d'office si une ligne est « repris » (`d-nettoyage` : Désinfectant, quantité jaune pointillé), sous-groupe d'une ligne = sa rangée seule (Silicone sanitaire), bande à une sous-famille ou sans (Houblons, Consommables à une sous-famille) = celle d'aujourd'hui. Ordre : celui de la liste de la famille. Un seul groupe ouvert dans la maquette (c'est un instantané, pas une règle d'exclusivité : ici chaque groupe s'ouvre seul).
- Gestes : un toucher ouvre ou ferme. Rien d'autre dans D (pas de « tout plier » : c'est la voie r3-plier).

## Fichiers écrits
`src/ui/depense/groupes.ts` (types `SousGroupe`, `ChoixGroupes` ; `sousFamilleDeLigne`, `ordreSousFamilles`, `sousGroupesDe` dans `bandes()`, `groupeOuvert`, `pliable`, `poserGroupe`, `cleGroupe`, `toutPlier`, `toutDeplier`), `src/ui/depense/Liste.tsx` (`CorpsBande`, `QteSousGroupe`, props `choixGroupes`, `forces`, `onBasculeGroupe`, `onToutPlier`, `onToutDeplier`), `src/ui/depense/p3c.css` (`dp-p3c-sg-c-<famille>`, `dp-p3c-sg`), `src/ui/finance/ExpenseSheet.tsx` (état `choixGroupes`, sous-famille et « à vérifier » par ligne, `forcesGroupes`, `basculerGroupe`, `toutPlierGroupes`/`toutDeplierGroupes`, `reveler`), tests `tests/unit/depense/bandes/sous-groupes-d307.test.ts` (27) et `tests/unit/depense/ecran/sous-groupes-d307.test.tsx` (11), `voies/r4-port-d/capturer-d.mjs`, `captures/` (rapport.txt, 9 captures de l'app par mode, 9 côte à côte par mode). `Ligne.tsx` et `familles.ts` non touchés (la rangée n'exige rien ; `SOUS_FAMILLES_RENOVATION` et `sousFamilleDe` suffisaient et sont déjà exportés).

## Comment ça marche
- `bandes()` ajoute `sousGroupes` seulement si les lignes de la bande ont au moins deux sous-familles nommées ; sinon la bande est strictement celle d'aujourd'hui (test d'égalité profonde avec une bande sans sous-famille). Houblons/Malts/Levures : une seule catégorie → rien.
- Ordre : `SOUS_FAMILLES_RENOVATION` pour la Rénovation, `STOCK_CATEGORIES` pour les autres, un nom hors liste ensuite dans l'ordre d'arrivée ; dans un groupe, l'ordre du papier. Les lignes sans sous-famille d'une bande qui en a d'autres : à la fin, sans ligne.
- Sous-totaux : quantités par `quantites()` (la même que la bande : 1 Kg + 300 g = 1,3 Kg, pièces à part, « ? » pour l'illisible), montants en centimes entiers ; la somme des sous-groupes vaut la bande. Un montant absent marque son groupe « + ? » en rouge (jamais 0).
- Ouverture : choix du brasseur (`ChoixGroupes`, par `bande/sous-famille`) sinon replié, sauf « à vérifier » (un niveau jaune ou rouge de `confiance.ts`, ou la barre de geste) qui ouvre d'office. Forcée ouverte : une rangée au plateau ouvert, ou un filtre des comptes qui la montre. Replier un groupe ferme les plateaux de ses rangées (sinon ils le garderaient ouvert).
- Rangées d'un groupe replié : dans le DOM, `hidden` (l'id retrouve la ligne). « Y aller » (chip), `viser`, `focusIssue` ouvrent d'abord le groupe de la cible (`reveler`, `flushSync`).
- Un sous-groupe d'une ligne : sa rangée seule, sans chevron ni ligne (`pliable`). Réinitialisation à chaque nouvelle lecture. Vue « Papier » inchangée.
- « Tout plier, déplier » : `toutPlier(bandes, choix, bande?)` et `toutDeplier(...)` (pures, `groupes.ts`) ; wrappers `toutPlierGroupes(cle?)`/`toutDeplierGroupes(cle?)` dans `ExpenseSheet`, passés à `Liste` en `onToutPlier`/`onToutDeplier`. Aucun contrôle visible (testé : aucun bouton « tout plier/déplier » à l'écran). `toutPlier` replie aussi un groupe à vérifier : c'est son geste.

## Témoins (critère 1)
Arbre d'avant (`groupes.ts`, `Liste.tsx`, `ExpenseSheet.tsx`, `p3c.css` de HEAD a115e82e remis dans la copie) : **31 rouges sur 38**, 7 verts. Les 7 verts sont les attentes « comme aujourd'hui » (bande à une sous-famille identique, Houblons/Malts, aucune sous-famille, papier, aucun contrôle visible) : elles doivent l'être aux deux arbres. Après : 38 verts. Couverts : bande à 7 sous-familles (les sept totaux de sa maquette : 9 Stk 191,30 ; 2 Stk 95,50 ; 2 Stk 22,40 ; 3 Stk 49,70 ; 5 Stk 58,80 ; 2 Stk 21,40 ; 2 Stk 15,60, somme 454,70, 25 Stk) ; centimes (0,10 + 0,20) ; inconnu ; une sous-famille ; groupe d'une ligne ; ligne à vérifier ouverte d'office et fermable ; plateau ouvert force le groupe ; `toutPlier`/`toutDeplier` (toutes bandes, une bande, valeur pure) ; rendu de l'écran (repos replié, toucher ouvre/ferme, plateau, replier ferme le plateau, ligne rouge ouvre son groupe).

## Sorties
- Critère 2/3 : `npx vitest run tests/unit/depense tests/unit/purchasePrefill.test.ts --maxWorkers=2` → 137 fichiers, 2138 verts, 3 sautés ; `tsc` 0 ; `build` 0. (Avant mes changements : 135 fichiers, 2100 verts.)
- Critère 4 : `PORT-D OK` (rapport.txt). Mesures dans le même Chrome : sa maquette D, ligne de sous-famille 28 px, nom 14 px, quantité 12 px gras 600, montant 14 px ; l'app, 28 px / 14 / 12 gras 600 / 14, aux deux largeurs et pour chaque ligne ; écarts de colonnes avec l'en-tête de bande 0,0 px (quantité et montant, 4 lignes, 390 et 1280) ; aucun débordement horizontal ; aucune erreur de console ; aucune requête hors localhost. États : `familles` inchangé (11 bandes, 0 ligne de sous-famille, 0 rangée cachée) ; `renovation` repos (4 lignes de sous-famille repliées, 3 rangées de sous-groupes d'une ligne visibles), toucher « Peinture et sols » seul ouvert, plateau d'une rangée du groupe, clavier (Entrée, Espace, `aria-expanded`, `aria-controls`), focus visible (contour 2 px), ligne à vérifier ouvre « Électricité » d'office, Papier inchangé.
- Critère 5 : bouton `<button type="button">`, `aria-expanded`, `aria-controls` vers son corps, contour `:focus-visible` de l'app (2 px, décalé vers l'intérieur pour ne pas être rogné).

## Captures ouvertes et décrites (dossier `captures/`, fichiers `cote-*` = app à gauche, maquette D à droite)
- `cote-tactile390-renovation-repos-clair` : Nettoyage puis Rénovation kaki ; quatre lignes repliées (Peinture et sols 5, Outillage 4, Quincaillerie 2, Électricité 2) avec chevron `>`, pastille, quantité en gras sur la colonne de l'en-tête, montant ; trois rangées de groupes d'une ligne (Mitigeur, Gants, Étagère) sans chevron. Même grille que d-repos.
- `…-renovation-ouvert-clair` : « Peinture et sols » ouvert par un toucher : chevron `v`, nom gras, fond kaki léger, ses cinq rangées d'aujourd'hui (deux noms longs sur deux lignes, comportement existant de la rangée) ; les autres repliés. Fidèle à d-renovation.
- `…-renovation-averifier-clair` : « Électricité » ouvert d'office, sa rangée au montant effacé en rouge pointillé visible, sous-total « 39,60 + ? » en rouge, bande « 410,50 + ? ».
- `…-renovation-ouvert-cave` : sombre : filet et teinte kaki clair, même structure que d-renovation-sombre.
- `…-familles-repos-cave` : onze bandes, aucune ligne de sous-famille, rangées intactes. `cote-pc1280-renovation-repos-clair` : 1280, deux colonnes, lignes de sous-famille dans la colonne de droite, mêmes proportions.

## Écarts à sa maquette (aucun d'intention ; trois précisions)
1. Un groupe dont un montant est inconnu marque son sous-total « + ? » en rouge, comme l'en-tête de bande (sa maquette n'a pas ce cas). La colonne des quantités de cette ligne se décale alors à gauche comme celle de l'en-tête (« 10 Stk » à 505 px contre 538 pour les autres) : même comportement que la bande, mais l'œil voit un décalage entre lignes.
2. Pour l'ouverture d'office, l'aperçu `renovation` n'a aucune ligne jaune ou rouge : la capture la fabrique par le geste du brasseur (renommer une ligne qui change de sous-famille, effacer son montant, refermer son plateau). La maquette « Nettoyage multi-sous-familles » n'est pas atteignable dans un aperçu existant (Nettoyage n'a qu'une ligne) ; ses vues sombres n'existent pas (`d-repos`, `d-nettoyage` en clair seulement) : les côtés « sombre » sont comparés à `d-renovation-sombre`.
3. Au repos, les rangées d'un groupe replié restent dans le DOM (`hidden`) ; la maquette statique ne les rend pas. Sans effet visible.

## Doutes et limites
- `Nettoyage` : `categorieDeFamille` retourne « Consommable » quand aucun mot de nettoyage ne tranche ; ce nom devient un sous-groupe « Consommable » dans la bande Nettoyage (placé en dernier par `STOCK_CATEGORIES`). Voulu par r1 ; à regarder sur une vraie pièce.
- Un groupe forcé par un filtre de comptes ne se replie pas tant que le filtre est là (« ✕ Toutes les lignes » le lève).
- « Y aller » vers une ligne d'un groupe replié (`reveler`) est câblé et relu, mais non joué dans un test : la capture ne l'exerce pas non plus. À rejouer avec une vraie pièce.
- Le tri des groupes est stable à l'écran, mais une ligne renommée change de groupe sans déplacement animé (la rangée est remontée ailleurs, comme aujourd'hui entre bandes).
- Mesure sur sa vraie pièce : jamais lue ici.

CONNAISSANCE : une bande à sous-groupes se calcule dans `groupes.ts` (`sousGroupesDe`, même `quantites` que la bande) ; l'état d'ouverture est le choix du brasseur par `bande/sous-famille`, à défaut « à vérifier » ouvre ; une rangée à voir (plateau, filtre) force son groupe. `toutPlier`/`toutDeplier` attendent leur contrôle (r3-plier).

LEÇON PROPOSÉE : un état de banc qui doit montrer un cas (ici « ligne à vérifier ») sans que l'aperçu le porte : le brief doit dire d'avance si le script a le droit de fabriquer ce cas par le geste du brasseur ou s'il faut un état d'aperçu neuf ; et un témoin « comme aujourd'hui » est vert aux deux arbres, à annoncer pour ne pas lire « 7 verts sur HEAD » comme un témoin raté.

---

# Reprise 1 (D311, son choix E, puis les mineurs du critique)

R4-PORT-D OK — segment « Plié | Déplié » de sa maquette E, « Plié » garde ouvert un groupe à vérifier, état calculé ; M1 et « y aller » faits, PORT-D OK

Aucun commit. `npx vitest run tests/unit/depense tests/unit/purchasePrefill.test.ts --maxWorkers=2` : 141 fichiers, 2216 verts, 3 sautés ; `tsc --noEmit` 0 ; `npm run build` 0 ; `capturer-d.mjs` : `PORT-D OK` (126 contrôles, sortie dans `captures/rapport.txt`). Dix captures côte à côte avec `choix-plier/img/e-*.png` produites ; les cinq de 390 (plier-averifier, plier-mele, plier-deplie, plier-repos sombre, y aller) ouvertes en image (L12), celles de 1280 couvertes par les mesures du rapport.

## Ce qui a été fait
1. **Le segment E** (« Plié | Déplié », 28 px, `role=group` « Sous-groupes », boutons `aria-pressed`, `bg-ebc-straw` allumé, mêmes classes que `choix-plier/outils/gen.mjs` ; le cerclage bleu `pl-vise` de la page de choix n'est pas porté) : composant `SegmentPlier` dans `Liste.tsx`, posé dans l'en-tête de la feuille entre le titre et le justificatif par un prop neuf `milieu` de `Entete.tsx`.
2. **« Plié » garde ouvert un groupe à vérifier** : `toutPlier` (groupes.ts) pose `ouvert || sg.averifier`, donc replie tout sauf le groupe qui porte une ligne jaune ou rouge ; il le rouvre s'il avait été fermé. À l'écran, « Plié » ferme aussi les plateaux ouverts des groupes qu'il replie (pas ceux d'un groupe gardé ouvert).
3. **Raccourci, rien de figé** : l'état allumé est `etatSegment(bandes, choix, forces)`, calculé sur `groupeOuvert` (choix du brasseur, ouverture d'office, rangées forcées) ; `plie` quand chaque groupe pliable est dans l'état que « Plié » produit, `deplie` quand tous sont ouverts, aucun sinon (état mêlé). Au repos d'une lecture : « Plié » allumé. Un toucher sur la ligne d'un groupe plie ou déplie toujours (celui d'une ligne à vérifier aussi) ; un groupe refermé après « Déplié » ou rouvert après « Plié » rend l'état d'avant.
4. **Visibilité** : vue Catégorie seulement, et seulement s'il existe au moins un sous-groupe pliable (≥ 2 lignes) dans une bande à deux sous-familles ou plus. Lecture du pilote plus étroite que « une bande a deux sous-familles ou plus » : deux sous-familles d'une ligne chacune n'ont rien à plier, le segment reste absent (réversible : `etatSegment.visible`).
5. **M1** : `reserveInconnu` (Liste.tsx) : sur une bande ou une ligne de sous-famille dont un montant est inconnu, le montant réserve la largeur de son texte en `ch` (`max(54px, 10ch)` pour « 410,50 + ? ») et la quantité rend d'autant sa marge. Piège évité : `ch` se lit dans la police de l'élément (montant 14 px, quantité 12 px), la marge de la quantité vaut donc 14/12 de `ch` ; la première version laissait 11 px d'écart. Mesure de l'écart à la colonne des rangées (`[data-dp-qte]` d'une rangée visible) : **avant** (`rapport-avant-m1.txt`, mêmes gestes, arbre de la première livraison) : en-tête 23,0 px, ligne « Électricité » 15,3 px, aux deux largeurs ; **après** : 0,0 px pour l'en-tête et les quatre lignes, 390 et 1280.
6. **« Y aller »** : test d'écran (`sous-groupes-d311.test.tsx`) : le groupe d'une ligne en erreur est replié, « Confirmer » le rouvre et, au moment du `focus()`, la cible n'est plus dans un conteneur `hidden` ; il est rouge si `reveler` est neutralisé (vérifié en mutation dans la copie). Geste dans `capturer-d.mjs` : même résultat dans Chrome (390 et 1280) : groupe rouvert, focus dans « Montant ligne 5 », visible, non caché ; capture `renovation-yaller-clair`.

## Fichiers écrits en plus de la première livraison
`src/ui/depense/groupes.ts` (`toutPlier` corrigé, `etatSegment`), `Liste.tsx` (`SegmentPlier`, `reserveInconnu`, en-tête de bande et ligne de sous-famille), `p3c.css` (`.dp-p3c-seg:focus-visible`), `ExpenseSheet.tsx` (`etatSeg`, prop `milieu`, wrappers qui gardent les groupes à vérifier), **`src/ui/depense/Entete.tsx`** (prop optionnel `milieu`, 3 lignes : hors de « Possède », nécessaire pour poser le segment dans l'en-tête de la feuille ; additif, aucun appel existant ne change), tests `tests/unit/depense/bandes/sous-groupes-d311.test.ts` (15), `tests/unit/depense/ecran/sous-groupes-d311.test.tsx` (10), `capturer-d.mjs` (segment, ligne à vérifier, y aller, M1), `rapport-avant-m1.txt`, `captures/`.

## Attentes de ma première livraison changées par la décision (mes propres tests, pas ceux d'avant)
`sous-groupes-d307.test.ts` : « toutPlier replie tout, même le groupe à vérifier » devient « … SAUF le groupe qui porte une ligne à vérifier » (trois assertions : tout plier, une seule bande, valeur pure). C'est la correction demandée (D311, sa page : « Une ligne à vérifier garde son groupe ouvert, même tout plié »). Aucun test d'avant la voie n'a changé.

## Témoins
Rouges avec la fonction neutralisée dans la copie, verts après : `toutPlier` sans `|| averifier` → tests rouges de D307 et D311 ; `reserveInconnu` neutralisé → 3 rouges ; `reveler` neutralisé → le test « y aller » rouge (« expected [ true ] to not include true » : le focus part dans un conteneur caché) ; sans segment (arbre de HEAD) → les tests d'écran et de pur rouges. Mesure M1 avant/après ci-dessus.

## Captures ouvertes et décrites (`captures/`, `cote-*` = app | sa maquette E)
- `cote-tactile390-plier-averifier-clair` : l'en-tête porte « Plié | Déplié » avec « Plié » noir allumé, comme `e-plie` ; Électricité (ligne rouge, montant « 39,60 + ? ») est le seul groupe ouvert, Peinture, Outillage, Quincaillerie repliés ; l'en-tête de bande « 410,50 + ? » et la ligne « 39,60 + ? » : leurs quantités (29 Stk, 10 Stk) tombent maintenant sur la colonne des autres lignes.
- `cote-tactile390-plier-mele-clair` : « Peinture et sols » ouvert à la main, ni « Plié » ni « Déplié » allumé, comme `e-mele`.
- `cote-tactile390-plier-deplie-clair` : « Déplié » allumé seul, les quatre groupes ouverts, comme `e-deplie`.
- `cote-tactile390-plier-repos-cave` : sombre, « Plié » allumé en jaune de l'app, comme `e-plie-sombre`.
- `tactile390-renovation-yaller-clair` : après « Confirmer », le groupe Électricité est rouvert, la rangée en erreur ouverte avec le champ du montant focalisé (cerclé), « Plié » reste allumé.
- `…pc1280-plier-*` : même contenu à 1280, segment à droite du titre (non rouvertes une à une : les mesures du rapport les couvrent ; les cinq 390 ci-dessus sont ouvertes).

## Écarts à sa maquette E et limites
1. Le segment est à 28 px de haut, texte 14 px, dans l'en-tête de 40 px (mesuré : 28,0 / 28,0 px) : comme la maquette. Le cerclage bleu de la page de choix n'est pas dans l'app.
2. **En-tête, titre le plus long (critique r3)** : « Acheter du matériel » : aucun chevauchement, une ligne, titre non tronqué à 390 et 1280. **Avec le badge « hors ligne » à 390, « Acheter du matériel » est tronqué (ellipsis, 140 px de large)** : ni chevauchement ni retour à la ligne, mais le titre complet n'est plus lisible. À trancher par le pilote : laisser (cas rare : matériel et hors ligne), ou passer le badge « hors ligne » en picto.
3. Un groupe forcé ouvert (plateau ouvert, filtre) compte comme ouvert pour l'état allumé : « Plié » ferme alors les plateaux de ses groupes ; un filtre de comptes garde ses groupes ouverts.
4. Si un groupe devient « à vérifier » après un « Plié » ou un toucher à la main (une ligne renommée qui change de sous-famille), son choix explicite le garde replié : sa rangée en cours d'édition reste ouverte (forcée) tant que son plateau l'est, puis le groupe se replie ; le montant rouge et « + ? » de sa ligne de sous-famille signalent le trou. Rencontré en construisant la capture de la ligne à vérifier (elle se joue donc dans une première ouverture, la capture du segment dans une seconde).
5. M2 (« Consommable » dans Nettoyage) : rien fait ici, comme demandé.

## Doutes
- Le segment doit encore être vu par le brasseur en vraie pièce (L28) ; le cas hors ligne est mesuré sur l'aperçu, pas en vrai.

CONNAISSANCE : `ch` dans un style en ligne se lit dans la police de l'élément qui le porte : deux colonnes en chasse fixe de tailles différentes (14 et 12 px) se règlent avec le rapport des tailles. L'état d'un raccourci (« Plié | Déplié ») se calcule sur l'état réel des groupes (`etatSegment`) : un mode gardé se désynchronise dès le premier toucher.

LEÇON PROPOSÉE : un raccourci qui écrit un état explicite (ici le choix de chaque groupe) fige ce qu'un état par défaut calculait (« à vérifier ouvre d'office ») : le brief doit dire d'avance si le raccourci écrit des choix ou remet l'état par défaut ; et une mesure « avant » se prend avec le script déjà écrit, avant de coder la correction.
