# rcb3 — « Comme Nelson Sauvin »

- **Chaleur** : chaude (forme libre).
- **Idée** : on ne décrit rien, on nomme un houblon, et la liste répond en trois regards sur la ressemblance :
  les **remplaçants calculés** du dépôt (score sur 100, puis arôme · huiles · amertume en trois chiffres : ils
  répondent « lequel »), ceux de **mon stock** (leur score, même moyen), et ceux qui **disent ses mots** hors des
  12 familles (vin blanc, groseille à maquereau, raisin, sauvignon blanc), que le score ne voit pas (L14, D131 ter).
  Le bandeau noir dit ce que lui seul dit (flb5b, choisie). Pictos en couleur : ses familles à lui que le remplaçant
  a aussi ; « + » à la couleur d'une famille : il l'apporte en plus ; barré : perdue.
- **Cas** : Nelson Sauvin (α 10–13, lot 9,6, double, 100 g). Calculés : Boomerang 91, Herkules 89, Phoenix 88, Pacific
  Jade 87, CTZ 85. Stock : Cascade 74, Motueka 61, Target 61. Ses mots : Hallertau Blanc 4/4 (30 g), Emerald Spire
  2/4, Godiva 2/4, Citra 1/4 (65 g), African Queen, Ariana. Données : pack-fiches.json (substitution v1, « règle du
  prototype, à valider par le brasseur », rappelé en bas de page), proto-data.json pour les mots.
- **D'où, où** : le « + » de Comparer (« remplacer un houblon choisi », D137) ou le champ de l'étape ; « + » vers la
  recette, appui long → fiche (le bandeau aussi), glisser à gauche → Comparer.
- **Baseline** : pictos au trait v3, couleurs des familles, thème blanc, α en plage puis rôle en mot (L04), stock en
  badge, lentille au style / absolu et zone 16D, légende derrière « ? », fiche à l'appui long ; trois tailles de
  texte (12, 15, 22 pour le nom et le score).
- **Exemple du brasseur** : « comme Nelson Sauvin » est son exemple (un sur quatre dans la série).

## Ce qui tient, ce qui casse

- Tient : le contraste entre le calcul (Boomerang, Herkules : agrumes + épicé) et les mots (Hallertau Blanc dit ses
  quatre mots et il est en stock) pose la question qui compte : qu'est-ce qui remplace un Nelson Sauvin ?
- Casse : 193 mots au premier écran, bien au-dessus de D1 ; le score vient d'une règle non validée ; les mots hors des
  12 n'entrent pas dans le score (à greffer au moteur, pas à la maquette).

## Contrôles (24.10, soir)

- `concepts.mjs` : CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` : TRAIT OK (40 pictos, 0 faute).
- `controle-commun … --page=etat.html --sans=mots` : COMMUN OK (le premier essai : 0 teinte franche et fiche sans
  arômes pour Nelson Sauvin ; corrigés par le « + » coloré et la ligne « classé » des familles déclarées).
- `controle-panel` (quatre captures) : PANEL OK.
- `mots-premier-ecran --max=70 --modere` : 221 mots (109 hors données), MOTS ECHEC — v0, sauté.
- `controle-une-question` (D98) : indicatif ; signale les « + » hors [data-libre] et l'absence de ligne de contexte :
  écran de recherche, non joué.

Captures (ouvertes) : `captures/rcb3.png`, `captures/rcb3-fiche.png` (fiche de Nelson Sauvin), `captures/rcb3-page.png`.
Générateur : `generer.mjs` ; données et pièces communes dans `../rcb1/`.

## Passe 2 (24.10, nuit, retour du critique : REJET D100)
- « Disent ses mots » passe en premier regard (Hallertau Blanc 4/4, 30 g ; Emerald Spire, Godiva 2/4 ; Citra, African Queen, Ariana 1/4), puis « Mon stock · 12 familles seulement » (Cascade 74, Motueka 61, Target 61), puis « Calculés · 12 familles seulement » (Boomerang 91…) : le score du dépôt ne voit pas les mots hors des 12, la légende le dit. Le bandeau noir « Lui seul » est inchangé. Rôle du fournisseur d'abord (Cascade, Target : aromatique), α du lot à côté de la plage, badge du stock près du nom. Refait en place (demande du pilote), capture `captures/rcb3.png` rouverte ; CONCEPTS-BIEN-4, TRAIT OK, COMMUN OK, PANEL OK (0,69).
