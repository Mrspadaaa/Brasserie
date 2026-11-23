# Voie r12-continuite — le même en-tête et le même pied d'un écran à l'autre (D129)

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md`
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante
- Étape : reprise

## Ses mots (24.10, soir), mot pour mot
« Fait attention aux header, footer, sur la continuité de l'app ect... » (SPEC § 1, D129).

## Le défaut, mesuré
`controle-continuite.mjs prototypes/houblons-v4/maquettes/parcours` → CONTINUITE ECHEC (4) : K3 le titre des outils fait 20 px
sur Substituer, 15 px sur Dryhopper et Levure ; K4 le pied « Annuler · action » de Dryhopper est à 666 px (au-dessus du rail),
ceux de Substituer et Levure en bas (788 px). La croix et l'en-tête sont déjà les mêmes partout.

## Ce que tu fais (décision du pilote D42, réversible)
1. Le titre d'en-tête de chaque outil (Substituer, Dryhopper, Levure) à la taille de DESIGN.md : titre d'écran 18 px, la même
   graisse, à la même place après la croix. Ce que dit le titre ne change pas (« Nugget », « Quand ajouter Idaho 7 ? »…).
2. Le pied de Dryhopper en bas de l'écran, comme les autres (Annuler à gauche, l'action à droite, 48 px) ; le rail reste
   au-dessus du pied, entier et jouable (RAIL OK, FONCTIONS-RAIL OK sur Dryhopper).
3. Passe en revue, à 390 et 1280, l'en-tête et le pied de chaque écran (étape, Ma bière, Suggérer, Comparer, Substituer,
   Dryhopper, Levure, fiche) côte à côte (une planche de captures dans `os.tmpdir()`), et corrige toute autre rupture vue.
Rien d'autre ne change : ses maquettes choisies priment (règle n° 1).

## Possède
`prototypes/houblons-v4/parcours/src/commun/**`, `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**`,
`prototypes/houblons-v4/parcours/src/ecrans/levure/**`, et dans `…/ecrans/substituer/` le seul style du titre d'en-tête,
`prototypes/houblons-v4/maquettes/parcours-continuite/**`, `work/missions/2026-10-23-maquette-parcours/voies/r12-continuite/RESULTAT.md`.
Construis avec `--sortie=prototypes/houblons-v4/maquettes/parcours-continuite`.

## Critères
Dans `GATES.md`. Réponse finale : une ligne.
