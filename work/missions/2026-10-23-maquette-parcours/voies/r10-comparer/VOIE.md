# Voie r10-comparer — Comparer redevient r6a au premier écran ; les étapes en sélecteur sur ses rangées (D128)

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md` (à lire)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante
- Étape : reprise

## Ses mots
- « r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres
  versions » (23.10) ; « je voulais comparé au moins : les étapes 60' 10' dryhopping ect comme la maquette de base » ; sur x3b :
  « Montrait vraiment l'état du moment de l'ajout facile » (D107 : « r6a garde la forme ; les étapes, l'état au moment de
  l'ajout et la référence viennent de x3b »).
- Ce soir (24.10), sur le premier écran de la Comparer du jour, montré comme « r6a » : « C'est pas du tout cette vue là réf ??? »
  (SPEC § 1, D128).

## Le défaut, mesuré
`controle-comparer-familles.mjs` : sa r6a (`work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html`, capture
`…/fils22-comparer/captures/r6a-premier-ecran.png`) montre au premier écran le radar, les trois colonnes et **dix rangées de
familles** (une barre par houblon, ~+0,9, hachures « inconnus, pas zéro ») → FAMILLES OK (10). La maquette
(`prototypes/houblons-v4/maquettes/parcours/comparer/etat.html`) a mis les rangées 60′ / 10′ / dry hop à leur place et repoussé
les familles à 872 px → FAMILLES ECHEC (0 au premier écran).

## Ce que tu fais
1. Le premier écran redevient celui de r6a : titre-question, ligne de contexte, « ~ simulé », Au style | Absolu, le radar, les
   colonnes (α, rôle, pictos, ~ dans / ~ hors), puis ses rangées de familles. Mets les deux captures côte à côte et compare-les
   élément par élément (L03) avant de rendre.
2. Les étapes de x3b (60′, 10′, dry hop) deviennent un **sélecteur** compact sur ces rangées (et le radar) : le toucher d'une
   étape montre les valeurs des familles à ce moment, la bière de base en référence (x3b). Le reste de x3b (l'état jour après
   jour, la référence en pointillé, les plans) reste où il est, sous le premier écran, ses états verts.
3. Rien de ce que r5, r7 et les critiques ont rendu ne se perd : « Pour égaler » par famille (r6n2), le dock, la colonne +,
   « Placer <houblon> › », la chimie et les vraies valeurs, le panel OSU, une seule plage d'α par houblon, « ~ dans / ~ hors ».
4. Premier écran : 80 mots au plus (son « Dense mais pas surchargé ») ; r6a en avait 74.

## Possède
`prototypes/houblons-v4/parcours/src/ecrans/comparer/**`, `prototypes/houblons-v4/maquettes/parcours-comparer/**`,
`work/missions/2026-10-23-maquette-parcours/voies/r10-comparer/RESULTAT.md`. Construis toujours avec
`--sortie=prototypes/houblons-v4/maquettes/parcours-comparer`. Une autre voie (r9) travaille sur Substituer : n'y touche pas.
Besoin d'un fichier hors de ton périmètre : demande-le au pilote.

## Critères
Dans `GATES.md`. Réponse finale : une ligne.
