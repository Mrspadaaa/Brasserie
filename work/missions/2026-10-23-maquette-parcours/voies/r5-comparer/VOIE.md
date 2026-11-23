# Voie r5-comparer — Comparer de r6a avec « les quelques petites améliorations des autres versions »

- Mission : 2026-10-23-maquette-parcours ; contrat commun : `../REPRISE-D124.md` (à lire d'abord, en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : p21b, p24
- Décideur en cas de doute : pilote ; aucune question bloquante

## Sa maquette choisie
r6a : « r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des
autres versions » (23.10) ; avant : « r6a est le meilleur mais reprendre trop peu d'éléments que j'avais noté bon ou
intéressant des autres variante » (22.10) ; « r6n2 donne vraiment bien » (23.10). Et x3b pour les étapes (D107).
`work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html`, r6n2 et les autres dans `fils22-comparer/` ; les 37
éléments notés `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` ; registre
`choix/ecrans.json`, écran `comparer` ; relevé `work/refonte-frontend/v4/choix/etats/comparer.json` (19 états) ; acquis
`etat-acquis-r6n2-dock`, `-r6a-elements-notes`, `-maniere-w2` (`choix/etats/acquis.json`). Voulus : D107 (étapes x3b,
référence), D114 (panel OSU replié), D109, D119.

## Ce qui est perdu (p21b, à rendre)
- Le **dock de r6n2** : Défi · Égaler · Valeurs · Preuve · Frise · Souche, au lieu de trois boutons (Chimie, Égaler,
  Panel OSU) ; ses éléments : « Défi 2/4 », le critère « par floral ⌄ », « Preuve : tire 20 bières », la « Frise »
  (`etat-comp-defi`, `-critere`, `-preuve`, `-frise-levure`, acquis `r6n2-dock`). Le premier écran reste celui de r6a
  (« r6n2 : le premier écran de r6a, le reste à un toucher sous un dock »).
- La **colonne +** : une feuille avec α, rôle et « 67 % de ses mots hors des 12 familles : vin blanc… » pour chaque
  houblon proposé, pas une liste de six noms (`-colonne-plus` ; L14, Nelson Sauvin).
- Les autres éléments notés non repris (`elements-notes.json`, `etat-acquis-r6a-elements-notes` : jauge d'amertume,
  pastilles levure…) : rends chacun ou écris pourquoi il ne tient pas (un quart au plus, comme controle-reprise).
- La biotransformation de x3b (`-biotransfo`) : c'est un élément de x3b, sa source choisie pour les étapes ; rends-le
  dans les étapes (dry hop), sans rien prendre à Dryhopper.

## Possède
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/**`
- `prototypes/houblons-v4/maquettes/parcours-comparer/**`
- `work/missions/2026-10-23-maquette-parcours/voies/r5-comparer/RESULTAT.md`

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
RESULTAT.md (états rendus, captures, décisions) ; réponse finale au pilote : une ligne.
