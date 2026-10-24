# rcc2 — Le mur des mots

- **Chaleur** : chaude (forme libre).
- **Série** : rcc, « l'arôme d'abord ».
- **Idée** : tout le vocabulaire des fiches tient sur un écran, en un mur de mots rangés par famille, avec les mots hors des 12
  en noir (◇). La taille d'un mot dit combien de houblons le portent. On compose son nez au doigt :
  - un toucher : je veux (pastille noire) ;
  - deux touchers : sans (barré, pointillé) ;
  - trois touchers : retiré.
  La liste suit.
- **Vrai cas** : on vient du « + » de Comparer (Nelson Sauvin, Citra cryo) pour un troisième houblon. « Sentir mangue, fruit de
  la passion, sans dank ».
  - **5 ont tout** : Styrian Wolf, Mistral, Zappa, Olicana, Solero.
  - **35 en partie**, dont Hallertau Blanc (30 g en stock).
  - Chaque ligne montre ce que le houblon sent en plus : Mistral « poire ◇ raisin ◇ vin », Zappa « menthe, pin », Styrian Wolf
    « citronnelle, noix de coco, floral… ».

## Ce qui tient
- Le mot précis et les types hors 16D sont la matière même de la recherche (D130, D131 ter). « Vin blanc », « groseille à
  maquereau », « tabac », « cannabis » et « noble » s'y touchent comme « cassis » ou « rose ».
- Le « sans » répond au besoin d'écarter un défaut (dank, oignon, ail), sans écran de plus.
- Terreux, sans mot précis dans le catalogue, se montre par son nom, qui vaut « décrit dans la famille ».
- Au style 16D : « 16D » souligné sous les pictos des familles attendues de la stout export (Floral, Herbacé, Terreux) ;
  disparaît en absolu.
- Sur chaque ligne : le score « 2/2 », puis nom, α, usage, bande des 12 familles, stock en badge. Le « + » ajoute à la
  comparaison ; l'appui long ouvre la fiche.

## Ce qui casse
- Le mur prend 60 % de l'écran : 4,5 résultats visibles. En passe 2, il pourrait se replier une fois les mots posés.
- Les mots rares (cités par un seul houblon) sont hors du mur ; un champ de saisie manque pour les atteindre.
- 151 mots au premier écran (131 hors données) : voir l'écart ci-dessous.

## Baseline : écart déclaré
- `--sans=mots` : ici, les mots sont l'outil de recherche lui-même (le lexique des fiches) et non du texte de lecture.

## Contrôles (24.10, soir), sorties recopiées
- `concepts.mjs` : CONCEPTS-BIEN-4.
- `controle-pictos-trait.mjs` : rcc2 · 37 pictos de famille · 0 faute ; TRAIT OK.
- `controle-commun.mjs … --sans=mots` : COMMUN OK (11 contrôles).
- `mots-premier-ecran.mjs --max=70 --modere` : rcc2 151 mots, ECHEC (raison ci-dessus).
- `controle-panel.mjs` : PANEL OK (médiane 0,56 ; ressemblance 0,87).
- Réactivité (D138) : toucher « cassis » change la tête de liste, de « Styrian Wolf, Mistral, Zappa… » à « Hallertau Blanc,
  Ariana, Southern Star… » (87 ms).

Captures : `captures/rcc2.png`, `captures/rcc2-fiche.png`, `captures/rcc2-apres.png` (cassis ajouté).
