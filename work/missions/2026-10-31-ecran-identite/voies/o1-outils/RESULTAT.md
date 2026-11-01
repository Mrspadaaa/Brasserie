OK — quatre corrections d'outils avec témoins rouges puis verts, 48 concepts rejoués, maquette houblons inchangée

Reprise du travail d'un premier auteur interrompu : le diff des 5 outils et les témoins tenaient ; j'ai trouvé et corrigé trois défauts de
`controle-contraste` qui donnaient de faux échecs sur les 48 concepts (voir « Défauts corrigés à la reprise »).

## Fichiers écrits
Outils (Possède) : `work/refonte-frontend/v4/tournoi/outils/` : `controle-panel.mjs`, `mots-premier-ecran.mjs`, `controle-contraste.mjs`,
`controle-standard.mjs`, `controle-commun.mjs`. Non touché : `mesurer-loupe.mjs`, `critique/`, `src/`.
Dans `voies/o1-outils/` : `essai-outils.mjs` (22 témoins), `temoins/` (contraste ×5 dont `haute-fixe` nouveau, mots ×4, panel ×4, standard ×4),
`tableau-48.mjs` (lanceur et lecteur du tableau), `tableau.md`, `tableau-apres.json`, `tableau-avant.json`, `debug-peint.mjs` (diagnostic),
`houblons-avant.txt`, `houblons-apres.txt`, `hb-*.txt`, `r5-peint.png`, `u6-peint.png` (captures de diagnostic).

## Les quatre corrections
1. **panel** : l'id d'une capture est le nom seul s'il est unique, sinon `dossier/nom`, sinon le chemin relatif. Six `capture-haut.png`
   de six dossiers ne sont plus des doublons ; deux fichiers identiques restent un vrai doublon.
2. **mots** (`--profil=sans-houblons`) : ni le texte d'un `<details>` fermé (sauf son `<summary>`), ni les mots que coupe un conteneur
   à overflow. Un vrai texte de trop (details ouvert, 90 mots) échoue toujours.
3. **contraste** (`--profil=sans-houblons`) : le fond est relu sur la page photographiée textes transparents ; si la couleur peinte
   diffère de celle des ancêtres, c'est elle qui compte, au pire de 24 points. Un vrai contraste faible échoue (témoin `bande-faible`).
4. **profil sans-houblons** (`controle-commun`, `controle-standard`) : rayons 10/16/24 px à la place de 2/4/8 ; trait de 2 px du + commun
   permis ; au-style, fiche, trait, légende sautés avec leur raison. Option `--profil=sans-houblons` ; sans elle, rien ne change.

Choix de conception : les correctifs mots et contraste ne s'appliquent que sous `--profil=sans-houblons` (sur les maquettes houblons ils
changeraient les nombres : comparer 102 → 92 mots, fiche 186 → 166, ; contraste : 30 textes de plus sous le seuil). Le brasseur n'a pas à voir
ses verdicts houblons bouger sans décision. Panel : correction sans profil (elle ne change que les ids, voir plus bas).

## Défauts corrigés à la reprise (tous dans `controle-contraste.mjs`, tous sous le profil)
- **Décalage de défilement** : le sondage « qui est au sommet » faisait défiler la page, et les boîtes des textes suivants étaient lues avec
  un défilement périmé. Résultat : 1:1 sur les boutons sombres (« Suivant », « NOLO ») et 40 faux échecs sur 48. Maintenant toutes les boîtes
  se mesurent à défilement 0 (coordonnées de la capture), le sondage revient à 0. Témoin `haute-fixe` (page haute, pied fixe, bande sous le pli).
- **Texte SVG** : un `<text>` se peint avec `fill`, pas `color` ; la capture « transparente » gardait le texte, lu à 1:1 sur lui-même (r5
  « 30 L », v3 « 1,080 »). Les textes SVG sont lus avec `fill`, et rendus transparents sur la capture.
- **Boîte trop haute** : le rectangle d'un texte dépasse son tracé et mordait sur le liseré jaune de la molette (u6 « Double IPA » 1,48:1
  alors que le texte est clair sur fond sombre). Seule la moitié centrale de la hauteur est échantillonnée.
- `couvert` (voile par-dessus le texte) était calculé mais non utilisé ; il garde maintenant le fond des ancêtres.
- Option `--debug=<texte>` : couleur, boîte et points de fond lus (c'est ce qui a permis de trancher ces cas).

## Critère 1 : témoins rouges avant, verts après
`node voies/o1-outils/essai-outils.mjs` (outils du dépôt) : `TEMOINS OK (22 cas, mode apres)`.
Mode « avant » sur une copie de HEAD (`git archive HEAD` des outils sous `voies/o1-outils/avant-head/`, supprimée ensuite ; à refaire :
`mkdir avant-head && git archive HEAD work/refonte-frontend/v4/tournoi/outils work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json | tar -x -C avant-head`,
puis `--outils=avant-head/work/refonte-frontend/v4/tournoi/outils`) : `TEMOINS OK (22 cas, mode avant)`. Chaque cas a ses deux attentes ;
le cas fautif attend l'échec avant et le vert après, un vrai défaut attend l'échec aux deux. Exemples d'écart avant/après :
panel six homonymes `DIVERSITÉ` → pas d'échec ; mots `details-ferme` 46 → 16, `defile` 32 → 12 ; contraste `bande-cote` ECHEC → OK
(Volume 30 L, faux 1:1) ; standard `design-ok` ECHEC → OK. Vrais défauts qui échouent toujours : deux captures identiques (même nom ou deux
noms), `details-ouvert` et `vrai-trop` au-dessus du seuil, `bande-faible` (texte pâle sur bande : vu seulement après), `pale-simple` 2,3:1,
rayon de 6 px, deux traits d'icône. Le profil houblons ne change pas (cas explicites).
Limite : le témoin `haute-fixe` est vert aussi sur la version fautive intermédiaire que je n'ai pas conservée ; il garde la leçon, il ne l'a pas prouvée rouge.

## Critère 2 : les 48 concepts (`--profil=sans-houblons`, page `etat.html`, un concept à la fois)
Commandes : `node voies/o1-outils/tableau-48.mjs --sortie=tableau-apres.json` puis `--lire=tableau-apres.json --avant=tableau-avant.json`.
Détail complet (causes mot à mot, différences avec HEAD) : `tableau.md`. · = ok, X = échec. Colonnes sans échec omises : survol, blocs,
parlant, brutes (48/48 ok) ; mots 48/48 ok (max 70, modéré).

| concept | couleurs | contraste | standard | verdict |
|---|---|---|---|---|
| e1 e3 e6 g3 g4 g6 r1 r2 r4 r5 v1 | · | · | · | PASSE (11) |
| e2 e4 e5 g1 g2 i1 i2 i3 i4 i5 i6 r6 v2 v4 w1 w2 w3 w4 w5 w6 z1 z2 z3 z4 z5 z6 | · | · | X S3 | échoue standard seul (26) |
| g5 v3 v5 v6 | · | X | X S3 | contraste + standard (4) |
| r3 | · | X | · | contraste seul (1) |
| u1 u2 u3 u4 u5 u6 | X | · | X S3 | couleurs + standard (6) |

Total : 11 passent, 37 échouent. Pourquoi :
- **standard S3 (36 concepts)** : un rayon hors de 10/16/24 px (ou pilule, rond, feuille 24 px). Surtout 8 px (28 occurrences), puis 4 px (12),
  2 px (2), 12, 6 et 9 px (1 chacun). C'est un vrai constat, pas un faux : aucun concept ne suit encore les rayons de DESIGN.md.
  S1, S2 et S4 : rien.
- **couleurs (u1 à u6)** : 1 ou 2 teintes franches au premier écran, 3 au moins demandées (« trop retenu »). Série u entière, sans lien avec o1.
- **contraste (5 concepts, tous vérifiés au pixel par `--debug`)** : r3, étiquettes de graduation grises (#666) posées sur l'ambre du
  fût, 2,8:1 (« 0 » à « 30 », vrai défaut) ; v3 « 10 » et « 60 » 3,7:1 et 4,1:1 ; v5 « 21A » 3,4:1 et « 22C » 4,4:1 ; v6 « 100 » 2,0:1 (étiquette
  de jauge qui touche l'arc) ; g5 « plein » 4,1:1 (texte corail sur le bord d'un arc). v5, v6 et g5 sont des chevauchements de
  quelques pixels au bord de la boîte du texte : plausibles, à regarder de près (L12), pas sûrs.
- **mots, survol, blocs, parlant, brutes, panel** : sans échec.
- **panel** : `PANEL OK`, 48 captures, remplissage médian 0,58, 5 sous 0,50, ressemblance 0,83, 0 paire presque identique sur 1128.
  Avant correction (HEAD) : `PANEL ECHEC`, 6 % de paires presque identiques (66/1128) : les homonymes `capture-haut` de g et w.
- Écarts avec HEAD (profil identique, outil d'avant) : 12 concepts passent d'échec à ok en standard (e1, e3, e6, g3, g4, g6, r1 à r5, v1 :
  rayons 10/16 + trait de 2 px), 24 passent d'ok à échec en standard (séries i, u, w, z : leurs 8 px étaient ok sur l'échelle 2/4/8 des houblons,
  hors échelle sur celle de DESIGN.md), 5 passent de ok à échec en contraste (g5, r3, v3, v5, v6 : défauts que l'ancien outil ne voyait pas).
  Détail ligne à ligne dans `tableau.md`.

## Critère 3 : non-régression houblons
Maquette `prototypes/houblons-v4/maquettes/parcours` (8 routes, construite aujourd'hui à 14 h 05 ; je n'ai pas relancé `construire.mjs` pour
ne pas vider un dossier que d'autres voies lisent). Outils de HEAD contre outils du dépôt, même page, profil par défaut :
- `controle-commun.mjs biere comparer dryhopper fiche levure ma-biere substituer suggerer --page=etat.html` : sortie **identique**
  (`diff` vide, exit 1 dans les deux : mots 4/8 > 98, fiche, standard S3/S1/S4, légende : les échecs d'avant, inchangés).
- `mots-premier-ecran.mjs` seul : identique (biere 66, comparer 102, dryhopper 113, fiche 186, levure 71, ma-biere 98, substituer 86, suggerer 111).
- `controle-contraste.mjs` seul : identique.
- `controle-panel.mjs --mesures=` sur les mesures figées : lot 21 `PANEL OK`, lot 23 `PANEL ECHEC` (comme l'étalon du 23.10).

## Essais utilisés
Contraste : plus de trois essais sur le même critère (défilement, SVG, boîte haute) mais trois défauts distincts, chacun trouvé par un
diagnostic au pixel ; le quatrième dans le même fichier (voile `couvert`) trouvé à la lecture. Autres critères : un essai.

## Doutes et limites
- Le contraste « peint » est une mesure par échantillonnage (24 points de la moitié centrale de la boîte du texte) ; un dégradé ou une image
  derrière le texte est lu sur ses pixels, donc compté. Les textes SVG avec `fill` en `url(...)` sont ignorés. Elle prend le pire point : un texte
  qui touche un bord de forme est signalé (v5, v6, g5), peut-être trop sévère ; un pourcentage de points serait plus doux.
- Capture de page entière : si l'écran défile dans un conteneur interne (pas la fenêtre), les textes sous le pli de ce conteneur gardent
  la mesure des ancêtres.
- Les 48 concepts de `v0/` sont mesurés sur `etat.html` (état de repos) ; leurs états ouverts (`etats/`, `etat-*.png`) ne sont pas rejoués.
- `essai-outils.mjs` ne trouve plus `avant-head/` (supprimé) : voir la commande de recréation plus haut.
- `git status` : `prototypes/houblons-v4/tests/*` et `MISSION.md`, `v1/` ne sont pas à moi.

DÉCISION À PRENDRE : faut-il faire du comptage de mots visible et de la relecture du fond peint le défaut des maquettes houblons aussi ?
Options : (a) garder le profil comme maintenant, houblons inchangé (ma recommandation tant que le brasseur n'a pas vu la différence) ;
(b) les généraliser, ce qui bouge comparer 102 → 92 mots, fiche 186 → 166, et ajoute environ 30 textes sous le seuil de contraste à examiner.
Deuxième question : 36 concepts sur 48 échouent à S3 parce que DESIGN.md (10/16/24) n'est pas suivi. Le pilote confirme que c'est un défaut des
concepts (à corriger aux passes 2) et non de l'échelle, ou il retire S3 pour la v0 ; je recommande de garder S3 : une v0 hors échelle
coûtera plus cher à ranger après le choix.

CONNAISSANCE : une capture « textes transparents » ne vide pas le texte SVG (il se peint avec `fill`) et la boîte d'un texte (`Range`) dépasse
son tracé de quelques pixels ; mesurer un fond peint exige défilement 0, `fill` pour le SVG et la moitié centrale de la boîte.
LEÇON PROPOSÉE : un outil qui lit des pixels se prouve d'abord sur une page haute et une page à SVG, pas seulement sur de petits témoins plats :
les cinq témoins plats étaient verts quand 40 faux échecs sortaient sur les vrais concepts. Ouvrir quelques-uns de ses « échecs » en image avant de livrer le tableau (L12).
