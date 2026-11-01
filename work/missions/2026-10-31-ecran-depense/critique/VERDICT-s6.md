ACCEPTÉ — reprise 2 : les points 13 à 17 sont tenus sur les captures (nom refusé, ⇄ comme r2b, ligne jamais sous la bande, accord du compteur, « origine CH ») ; 1 mineur neuf (la chip 3 et le compteur disent « relié » dès le ⇄, avant tout choix, là où r2b laisse la chip ouverte), aucune règle de SPEC ni de DEFAUTS, aucun débordement à 390, pied visible et actif partout

## Reprise 2 (01.11)

Critique neuf, deuxième tour, sur les 20 captures de `voies/s6-fiche/captures/` rejouées par le pilote (S6 OK). Ouvertes en image, en
plein format (L12) : `tactile390-01-repos`, `tactile390-02a-un-creer-seul`, `tactile390-02b0-fleche-plateau`, `tactile390-02b-relie-cascade`,
`tactile390-02c-nom-pris`, `tactile390-05-enregistre`, `tactile390-06-plateau-cascade`, `pc1280-01-repos`, `pc1280-02a-un-creer-seul`,
`pc1280-02b0-fleche-plateau`, `pc1280-02c-nom-pris`, `pc1280-06-plateau-cascade` (12 sur 20). À côté : r2b `v1/r2b/etat.html` l. 378 à 412
(ligne, ⇄ « Choisir un autre article », plateau) et l. 449-450 (`data-bis` coche la chip, `data-autre` ouvre le plateau sans la cocher).
Je ne juge que les points 13 à 17 et ce qui est neuf. Étalonnage sous le seuil (L27) : je signale, le pilote tranche.

**Ce que le brasseur dirait** : « Target bis α 11,3, à côté Target α 11,8 ; Cascade CH, fiche US approchée en orange, origine CH dans le
plateau ; la flèche m'ouvre le choix au lieu de relier toute seule : bien, c'est ma maquette. On est bon. » Verdict prédit : **aime**,
sans « mais » visible ; la chip 3 cochée trop tôt ne se voit qu'en jouant le geste.

### Les points 13 à 17 du deuxième tour

| n | point | tenu ? | preuve |
|---|---|---|---|
| 13 | le nom refusé ne prend plus la tête de ligne | **tenu** | `tactile390-02c`, `pc1280-02c` : tête « Target bis · fiche Target UK · 40 g · α 11,3 », champ « Cascade US », « Un article porte déjà ce nom : relie-le ou change le nom. » en teinte d'attention, « α 11,3 · fiche Target UK » dessous. Rien n'a bougé en tête. |
| 14 | ⇄ = « Choisir un autre article », il ouvre le plateau sans relier | **tenu**, à la lettre de r2b (`etat.html:386`, `:450`) | `tactile390-02b0`, `pc1280-02b0` : après ⇄ sur Cascade, plateau ouvert sur « Ajouter à un article existant », « Chercher dans le stock » déroulé (Target 100 g, Cascade US 200 g, Münchner Malz 5 kg), pastille « article ? », rien n'est relié. Puis `tactile390-02b` : « Cascade US · +30 g », icône « relié », une fois l'article choisi. Un toucher ne relie plus au mauvais article. |
| 15 | la ligne ouverte n'est jamais sous la bande collante | **tenu** | `tactile390-02b0`, `-02b` : la bande « 1 2 3 4 Payé le · y aller » est au-dessus de « Lignes de la facture · 4 », la ligne « Target bis » et la ligne ouverte « Cascade CH » sont entières sous elle. `-02c`, `-06` : idem, la ligne ouverte commence sous la bande. La bande coupe encore ce qui a défilé derrière elle (chips à mi-hauteur en `02b0`, étiquette « Nom de l'article » en `06`) : c'est le propre d'une bande collante opaque, hors r2b, déjà dit au tri n° 11. |
| 16 | le compteur s'accorde | **tenu** | `pc1280-02a` : « 0 relié · 1 nouveau · 3 sans stock » ; `pc1280-02b0` : « 1 relié · 1 nouveau · 2 sans stock » ; `pc1280-06`, `-02c` : « 0 relié · 4 nouveaux » ; `pc1280-01` : « 0 nouveau ». |
| 17 | « origine CH » dans le plateau | **tenu** | `tactile390-06`, `pc1280-06` : « origine CH » en mono, puis « fiche Cascade US · approchée (pas exactement la bonne) » ; « α 11,3 · fiche Target UK » garde son mot (`02c`). |

Côte à côte avec r2b (règle n° 1, D105) : au repos (`tactile390-01`, `pc1280-01`) rien n'a bougé depuis la reprise 1 : « Target · 40 g ·
α 11,3 », grisé « Target α 11,8 », « Target bis » + ⇄ ; « Cascade US · Créer CH ⇄ » ; « Münchner Malz 20 EBC · Münchner Malz bis ⇄ » sur
une ligne à 390 ; « Créer « Sabro » » seul. Débordement à 390 : aucun sur les 7 captures tactiles ouvertes (la liste déroulée du stock en
`02b0` reste dans la largeur). Pied : « Drive prêt · Confirmer » visible et actif sur toutes, « Terminé » avec le reçu (`tactile390-05`,
« À revoir : date de paiement supposée gardée » lisible en bas, rien de coupé).

### Défaut neuf (aucun REJET)

9. **Mineur — La chip 3 et le compteur disent « relié » dès le ⇄, avant tout choix.** `tactile390-02b0`, `pc1280-02b0` : la ligne dit
   « article ? », aucun article n'est choisi, mais la bande et la chip « 3 Cascade CH » sont vertes et barrées, et « Lecture vérifiée »
   compte déjà « 1 relié ». r2b (`etat.html:393`, `:449-450`) : seule `data-bis` coche la chip (`PTS`), `data-autre` ouvre le plateau et
   laisse la chip ouverte. L'écran est celui de la maquette, l'état seul diffère ; il le reconnaîtrait (D105 non engagée). Brasseur :
   « 3 coché, mais c'est relié à quoi ? ». Correction : la chip 3 et le compteur « relié » ne se cochent que quand un article est choisi
   (`stockItemRef` posé) ; tant que la pastille dit « article ? », la chip reste ouverte, comme le point 1 « supposée » ou la ligne
   « sans stock ».

Pas de détail nouveau. Les deux mineurs de la reprise 1 (n° 7, 8) sont clos par les points 13 et 14.

---

## Reprise 1 (01.11)

Ligne 1 d'alors : « ACCEPTÉ — les 6 défauts du premier verdict sont tenus sur les captures ; 2 mineurs neufs signalés (un nom refusé pris en tête de ligne, le ⇄ relie d'un toucher là où r2b ouvre le plateau), aucun ne rejoue une règle de SPEC ni de DEFAUTS ».

Critique neuf, sur les 18 captures de `voies/s6-fiche/captures/`, toutes ouvertes en image, en plein format (L12), à côté de la
maquette r2b (`v1/r2b/etat.html`, l. 378 à 412) : `tactile390-01-repos`, `-02-creer-cascade`, `-02a-un-creer-seul`,
`-02b-relie-cascade`, `-02c-nom-pris`, `-03-creer-target`, `-04-creer-sabro`, `-05-enregistre`, `-06-plateau-cascade`,
`pc1280-01-repos`, `-02-creer-cascade`, `-02a-un-creer-seul`, `-02b-relie-cascade`, `-02c-nom-pris`, `-03-creer-target`,
`-04-creer-sabro`, `-05-enregistre`, `-06-plateau-cascade`. Je ne juge que ce que S6 ajoute (nom proposé, valeurs, ⇄, pastille
de fiche, bouton d'un produit inconnu, points 11 et 12 du port). Étalonnage sous le seuil (L27) : je signale, le pilote tranche.

**Ce que le brasseur dirait** : « Target 40 g α 11,3, et à côté Target α 11,8 : là on voit pourquoi c'est un bis. Cascade CH, fiche
US en orange, pas exactement la bonne : c'est ce que j'ai demandé. On est bon. » Verdict prédit : **aime** (« on est bon »), avec
un « mais » sur le nom refusé qui s'affiche en tête de ligne.

Côte à côte avec r2b (règle n° 1, D105) : au repos (`tactile390-01`, `pc1280-01`), la ligne « Target · 40 g · α 11,3 », l'article
grisé « Target α 11,8 », le bouton « Target bis » et le ⇄ collé à sa droite sont ceux de la maquette ; « Cascade US · Créer CH ⇄ »
idem ; « Münchner Malz 20 EBC · Münchner Malz bis ⇄ » tient sur une ligne à 390. Débordement à 390 : aucun (9 captures). Pied :
visible et actif partout (« Confirmer », puis « Terminé » avec le reçu, `tactile390-05`, `pc1280-05`).

### Les 6 défauts du premier verdict

| n | défaut | tenu ? | preuve |
|---|---|---|---|
| 1 | majeur, le « bis » sans ses valeurs | **tenu** | `tactile390-01`, `pc1280-01` : « 40 g · α 11,3 » / « Target α 11,8 », « 2 Kg · 15 EBC » / « Münchner Malz 20 EBC », « 30 g » / « Cascade US » (aucune α inventée), « 30 g · α 13,4 » pour Sabro. Après « Créer » : « Target bis · fiche Target UK · 40 g · α 11,3 » (`02a`) ; plateau « α 11,3 · fiche Target UK » (`03`), « CH · fiche Cascade US · approchée (pas exactement la bonne) » (`06`). Ce sont ses chiffres ; une valeur inconnue ne s'affiche pas (Cascade, « CH » seul). |
| 2 | mineur, le ⇄ à la ligne à 390 | **tenu** | `tactile390-01` : trois boutons courts (« Target bis », « Créer CH », « Münchner Malz bis »), le ⇄ sur la même ligne que son bouton, même pour le plus long. |
| 3 | mineur, « approchée » ne se voyait pas | **tenu** | `tactile390-02` à `-06`, `pc1280-02` à `-06` : « fiche Cascade US · approchée » dans la teinte d'attention (celle de « supposée »), « fiche Target UK » et « fiche Münchner Malz » restent grises. La différence se voit avant de se lire. |
| 4 | mineur, deux champs « Cascade CH » | **tenu** | `tactile390-06`, `pc1280-06` : le premier champ s'appelle « Libellé de la facture », le second « Nom de l'article » ; identiques pour Cascade, mais distincts par l'étiquette. |
| 5 | mineur, Sabro sans bouton au repos | **tenu** | `tactile390-01`, `pc1280-01` : « Créer « Sabro » » sur la ligne, sans ⇄ ni article grisé (aucun voisin). `04` : « Sabro · fiche Sabro US » ensuite. |
| 6 | preuve, les gestes non montrés | **tenu** | `02a` : une seule ligne créée (« Target bis ») à côté de deux lignes encore proposées, chip « Target α » barrée ; `02b` : ⇄ sur Cascade, « Cascade US · +30 g », icône « relié » ; `02c` : « Cascade US » tapé, « Un article porte déjà ce nom : relie-le ou change le nom. » en teinte d'attention. Aux deux tailles. |

Points 11 et 12 du port (vérifiés sur r2b par le pilote) : 11, à 390 la bande collante « 1 2 3 4 Payé le · y aller » est opaque,
plus de chips fantômes (`02c`), mais elle coupe encore à mi-hauteur ce qu'elle recouvre (`tactile390-02` : le sélecteur
« Ingrédients » ; `-04` : « Réception en stock » ; `-05`, `-06` : le champ « Target bis ») — hors r2b, hors S6, déjà dit par le
pilote ; 12, à 1280 après l'enregistrement, la colonne de gauche s'arrête à « Référence et TVA du document » au-dessus du reçu,
rien ne passe dessous (`pc1280-05`).

### Défauts neufs (aucun REJET)

7. **Mineur — Le nom refusé devient le titre de la ligne.** `tactile390-02c`, `pc1280-02c` : « Cascade US » tapé et refusé, mais la
   tête de ligne affiche déjà « Cascade US · fiche Target UK · 40 g · α 11,3 » avec l'icône « nouveau », comme si l'article allait
   exister. Le message d'attention est juste dessous ; l'enregistrement refuse (RESULTAT). Pas une règle de SPEC ni de DEFAUTS :
   une cohérence d'état transitoire. Brasseur : « Cascade US fiche Target UK ? ça veut rien dire. » Correction : tant que le nom
   tapé est refusé, la tête de ligne garde le nom proposé (« Target bis ») ou montre le nom tapé dans la teinte d'attention.
8. **Mineur — Le ⇄ ne fait pas le geste de r2b.** r2b (`etat.html:386`, `:450`) : ⇄ = « Choisir un autre article », il ouvre le
   plateau de la ligne où l'on choisit. App (`ExpenseSheet.tsx:406`) : ⇄ = « Relier à Cascade US », un toucher relie à l'article
   grisé (`02b`). Au repos c'est le même bouton au même endroit ; posé à côté de « Cascade US », il se lit « relier à celui-ci », et
   le premier verdict comme le tri n° 10 l'ont lu ainsi : je juge qu'il le reconnaîtrait (D105 non engagée). Le choix d'un autre
   article reste possible par le plateau (« Créer un nouvel article » / menu). À dire dans RESULTAT (geste différent de la
   maquette, et pourquoi), ou aligner si le pilote préfère r2b à la lettre.

Détails (pas de verdict) : « 1 nouveaux » au compteur de 1280 (`pc1280-02a`), au port ; dans le plateau de Cascade, « CH » seul
en mono avant « fiche Cascade US » se lit comme un code, « origine CH » dirait plus (`06`).

---

## Premier verdict (01.11, 12 captures)

Ligne 1 d’alors : « À CORRIGER — 6 défauts (1 majeur, 4 mineurs, 1 détail de preuve) ; le « bis », le « CH » et la fiche approchée sont là, mais les valeurs qui justifient le « bis » ne se voient nulle part ».

Critique neuf, 01.11, sur `voies/s6-fiche/captures/` (12 captures, toutes ouvertes en image), la maquette `v1/r2b/etat.html`
(lignes 379-412 : sous-ligne « 40 g · α 11,3 », article grisé « Target α 11,8 » / « Hallertauer Blanc DE », bouton « Target bis » /
« Créer CH », ⇄ « Choisir un autre article ») et `src/ui/finance/ExpenseSheet.tsx:396-406`. Je ne juge que ce que s6 ajoute : le nom
proposé, le ⇄, la pastille de fiche. Étalonnage sous le seuil (L27) : je signale, le pilote tranche.

**Ce que le brasseur dirait** : « Target bis, Cascade CH, Münchner bis : ça c'est ce que j'ai demandé. Et la fiche US pas exactement la
bonne, bien. Mais le Target bis il a quel α ??? Et celui du stock ? J'ai dit donné ses vrai valeur là où on les a. »
Verdict prédit : **mitigé** (« c'est bien mais manque les valeurs ») — l'idée est reconnue, un mot de D215 n'est pas tenu à l'écran.

Reconnaît-il sa demande ? Oui sur les trois points : « bis » (Target, Münchner), l'origine dans le nom à la place de « bis » (« Cascade CH »,
D216), la fiche approchée dite (« fiche Cascade US · approchée », et dans le plateau « (pas exactement la bonne) », ses mots). Rien ne
sort de nulle part dans le nom. Mots en trop : aucun ; « (pas exactement la bonne) » est sa phrase, dans le plateau seulement.
Débordement à 390 : aucun vu (6 captures). Pied : visible et actif partout (« Confirmer », puis « Terminé » avec le reçu).

## Défauts

1. **Majeur — Le « bis » sans ses valeurs : ni l'α lu, ni l'α du stock.** `tactile390-01-repos`, `pc1280-01-repos` (puis `*-02` à `*-06`).
   App, au repos : « Target · 40 g · [grisé] Target · Créer « Target bis » ⇄ ». Le libellé imprimé « Target 11.3% » est devenu « Target »
   (nom propre), donc l'α 11,3 a disparu de l'écran, et l'article grisé dit « Target » sans son 11,8 : on ne voit pas pourquoi c'est un
   bis. Idem « Münchner Malz » grisé sans « 20 EBC » (seule la ligne garde « 15 EBC »). Après « Créer », « Target bis · fiche Target UK ·
   40 g » et le plateau de Cascade CH (« Nom de l'article », quantité, unité) ne montrent pas davantage l'α, l'EBC ni l'origine écrits.
   Maquette r2b : sous-ligne « 40 g · α 11,3 » et grisé « Target α 11,8 » (règle n° 1, D105). Brasseur : D215, « LIÉE sa fiche mais
   donné ses vrai valeur là où on les a » ; portrait § 3.4 (« des vraies valeurs à côté ») ; DEFAUTS « sort de nulle part ». C'est aussi la
   correction minimale du verdict du port (défaut 4 : « l'α comme donnée de l'article (« α 11,3 ») »), renvoyée à S6 et non livrée.
   Correction : sous la ligne, « 40 g · α 11,3 » (houblon) et « 2 Kg · 15 EBC » (malt) ; l'article grisé avec la valeur qui diffère,
   « Target α 11,8 », « Münchner Malz 20 EBC », « Cascade US » (l'origine suffit) ; après « Créer », la sous-ligne garde « α 11,3 » et le
   plateau montre, à côté de la fiche, les valeurs qui seront écrites (« α 11,3 · CH »). Rien de plus : ce sont ses chiffres.

2. **Mineur — Le ⇄ tombe à la ligne à 390.** `tactile390-01-repos`, ligne Münchner : « Créer « Münchner Malz bis » » remplit la largeur et le
   ⇄ se retrouve seul sous le bouton, décroché. Maquette : bouton court (« Target bis », « Créer CH ») et ⇄ collé à sa droite. Portrait :
   « Pas super ui » (D218) sur un bouton mal posé. Correction : bouton sans « Créer « » » comme dans la maquette (« Münchner Malz bis »,
   « Target bis », « Cascade CH »), ou le ⇄ et le bouton dans un même groupe qui passe à la ligne ensemble avec le grisé.

3. **Mineur — « approchée » ne se voit pas, il se lit.** `*-02`, `*-03`, `*-04`, `*-06` : « fiche Cascade US · approchée » est une pastille
   grise identique à « fiche Target UK » ; la différence tient à un mot de la même couleur. D215 (4) : « sinon la fiche approchée reste, et
   cela se voit ». Correction : la pastille approchée dans la teinte d'attention déjà à l'écran (celle de « supposée »), ou « ≈ fiche
   Cascade US » ; le texte reste. Goût prêté, pas une règle : je signale, je ne rejette pas.

4. **Mineur — Deux champs « Cascade CH » l'un sous l'autre dans le plateau.** `tactile390-06-plateau-cascade`, `pc1280-06`. App : le champ du
   libellé de ligne (« Cascade CH », avec la corbeille) puis, plus bas, « Nom de l'article » = « Cascade CH ». Pour Target ce sera
   « Target 11.3% » puis « Target bis », lisible ; pour Cascade les deux sont identiques et le second a l'air d'un doublon. Portrait § 4 :
   « Ça c'est inutile ». Correction : ne montrer « Nom de l'article » que lorsqu'il diffère du libellé, ou étiqueter le premier champ
   (« Libellé de la facture ») pour que les deux se distinguent. Partagé avec le port (le premier champ est le sien).

5. **Mineur — Sabro n'a rien au repos, puis a une fiche.** `tactile390-01-repos`, `pc1280-01-repos` : Sabro (aucun article voisin) n'a ni
   bouton « Créer « Sabro » », ni marque « nouveau » ; les trois autres lignes ont leur bouton. Après (`*-04-creer-sabro`), « Sabro · fiche
   Sabro US » apparaît sans qu'on ait vu l'action sur la ligne. Portrait § 4 : ce qui sort de nulle part. Correction : le même bouton
   « Créer « Sabro » » sur la ligne (sans ⇄, aucun voisin), ou la marque « nouvel article » de la maquette (`MOTS.neuf`). Probablement du
   port (stockAction « none » par défaut) : à vérifier là, pas à retoucher dans s6 sans le dire.

6. **Détail (preuve) — Les gestes de s6 ne sont pas montrés.** `*-02-creer-cascade`, `*-03-creer-target`, `*-04-creer-sabro` sont identiques
   (les quatre lignes déjà créées) : on ne voit pas une ligne créée à côté d'une ligne encore proposée. Aucune capture du ⇄ pressé (la
   ligne reliée à « Cascade US » avec sa pastille) ni du bouton « Relier à « … » » du cas `existant`, ni d'un « bis 2 », ni d'un nom tapé
   déjà pris. Portrait § 3.5 : une capture fixe ne montre qu'une partie du geste, le dire. Correction : trois captures de plus à 390 (après
   le premier « Créer » seul, après ⇄ sur Cascade, un nom tapé refusé). Ne change pas le verdict.

Vu hors périmètre de s6 (au port) : à 390 le bandeau collant des chips masque le haut de la liste quand un plateau est ouvert
(`tactile390-05`, `-06`) ; à 1280 après l'enregistrement, la ligne « Justificatif rangé dans … » passe sous le reçu (`pc1280-05`).

## Captures ouvertes (toutes, en image)

`tactile390-01-repos`, `tactile390-02-creer-cascade`, `tactile390-03-creer-target`, `tactile390-04-creer-sabro`, `tactile390-05-enregistre`,
`tactile390-06-plateau-cascade`, `pc1280-01-repos`, `pc1280-02-creer-cascade`, `pc1280-03-creer-target`, `pc1280-04-creer-sabro`,
`pc1280-05-enregistre`, `pc1280-06-plateau-cascade`.
