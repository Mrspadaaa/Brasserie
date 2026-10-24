# M2 — Le geste de direction et les voies

Lis d'abord `work/refonte-frontend/v4/tournoi/REGLES.md` (règles des auteurs), le contrat
de direction `.impeccable/surfaces/prototypes-houblons-v4-index-html.md`, puis **la
grammaire consolidée de M1** : `work/refonte-frontend/v4/tournoi/M1/consolide/index.html`
et son `NOTE.md`. La feuille « au style » de M1 est ton point de départ : reprends sa
grammaire (pistes, bande du style, repère « ma bière », verdicts) sans la redessiner.
Ton travail porte sur ce qui se passe quand le brasseur demande une direction.

## La tâche du brasseur

« ma stout est trop résineuses, je la veux plus floral. La moteur nous propose plusieurs
houblons et on peut ensuite comparé. »

1. Sur la feuille de sa stout (S1), il demande « plus floral » et « moins résineux »,
   en un ou deux gestes.
2. La liste devient des **voies** : ce que le moteur propose (houblon, moment, dose en g
   et g/L, stock suffisant ou manque, IBU après).
3. Chaque voie montre **en fantôme sur la feuille** ce qu'elle change, famille par
   famille, et ce qu'elle fait déborder du style.
4. Il en retient deux ou trois pour les comparer (la comparaison détaillée est l'objet
   de M3 ; ici, il suffit de pouvoir les marquer).

## Ce que le pack dit (S1), à montrer tel quel

- `scenarios.S1.direction` : floral +1 cran, résine −1 cran. La résine **ne peut pas
  baisser** : aucune fiche ne cite Nugget comme résineux. Le moteur le dit dans la note ;
  l'écran doit le dire aussi, au moment du geste, sans le cacher ni l'inventer.
- `scenarios.S1.voies` : classées par le moteur (conflits, débordement de style,
  distance, effets de bord, stock, IBU). Chaque voie porte `effect` (effet établi par
  famille, ou non établi), `after` (plages après), `styleOverflow` et `sideEffects`
  (ce qu'elle fait monter hors de la demande), `ibu`, `stock`, `domain` (stock ou à
  acheter), `tieWith` (égalités).
- `scenarios.S1.skipped` et les `conflicts` : voies écartées parce qu'elles contredisent
  « moins résineux ». Le brasseur doit pouvoir savoir pourquoi Cascade n'est pas là.
- Le stock et l'« à acheter » sont classés ensemble ; les deux groupes restent visibles
  et distincts.
- Effets prévus : un effet « établi » est un repère central du modèle, de confiance
  faible ; un effet non établi s'affiche « non établi », jamais 0. Les égalités restent
  des égalités.

## Ce que chaque mini-maquette montre

- L'état avant le geste (la feuille de M1, compacte) et la poignée de direction.
- Le geste lui-même, jouable (au moins par clic ; le glisser est un plus) : demander
  floral +1 et résine −1.
- La réponse : les voies, dans l'ordre du moteur, et leur fantôme sur la feuille. Au
  moins les 5 premières lisibles sur le premier écran à 390 ou après un seul défilement.
- Le refus honnête sur la résine.
- Pouvoir marquer 2 ou 3 voies pour la comparaison.

## Ta contrainte de forme

Deux formes imposées, une par mini-maquette. Traduis la forme dans le monde de
DESIGN.md : garde sa grammaire (structure, geste, rythme), prends les couleurs et les
polices du produit. Si elle sert mal la tâche, dis pourquoi dans `NOTE.md`.

## Sortie

`work/refonte-frontend/v4/tournoi/M2/pNN/index.html` et `NOTE.md`, pour tes deux numéros.
Contrôle une fois :
`node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/tournoi/M2 pNN pMM`.
La capture montre l'état au chargement : **fais en sorte que l'état au chargement montre
la réponse au geste** (direction déjà demandée, voies affichées), avec un bouton pour
revenir à l'état avant. Regarde tes captures, corrige ce qui est cassé, puis arrête-toi.
