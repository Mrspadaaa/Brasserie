# Voie p17-fiche-annuler — la fiche, le radar d'abord (D115) ; « Annuler » dans les outils qui changent la recette (D120)

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : p1-ma-biere (sa reprise D108 touche la fiche pour la visée : partir de son état), p14-controles-fiche-fil,
  p15-controle-annuler (les contrôles, écrits et rejoués)
- Décideur en cas de doute : brasseur, par ses mots et ses choix connus ; aucune question bloquante (option prudente,
  écrite dans la NOTE)

## Objectif
Deux commentaires du brasseur sur la maquette publiée (23.10, soir), mot pour mot (SPEC-BRASSEUR § 1 ;
DEFAUTS-RECURRENTS D115 et D120, à lire en entier) :
- D115, dans la fiche de Cascade, sur « · nommé en premier » : « Mettre le radargraph avant, cette vue est vraiment pas
  terribles. À revoir... ».
- D120, sur le pied de Substituer (« Lequel à la place de Idaho 7 ? », seul « Remplacer › ») : « Pas de bouton
  cancer ».

## Ce qu'il veut
1. **D115** : dans la fiche (g1, sa base : `work/refonte-frontend/v4/ecran-1/base/captures/consolide-fiche-390.png`), le
   **radar passe avant la liste des familles**, entier dans le premier écran à 390 × 844. Le reste de g1 tient
   (inventaire `inventaire-fiche.json`, règle n° 1). La liste elle-même (familles, « nommé en premier », mots anglais
   « woody, resinous ») est à revoir **plus tard**, en variantes sur une page à part (décision pilote et supervision) :
   ici, seulement l'ordre radar puis liste.
2. **D120** : sur chaque outil qui propose de changer la recette, **Substituer, Levure, Dryhopper**, le pied porte
   « Annuler » à côté de l'action (« Remplacer », « Ajouter à ma bière », « Puis la levure »…), 44 px de haut au moins.
   Annuler ne change pas la recette, abandonne le brouillon et ramène à l'étape Houblons (`#/ma-biere`, D118). Forme :
   à toi, dans le thème (le critique juge) ; la même sur les trois outils.

## Contrats des contrôles
- `controle-fiche-radar.mjs <dossier>` (voie p14 ; lire son en-tête) : dans `fiche/etat.html` à 390 × 844, le haut du
  radar est au-dessus du haut de la liste des familles, et le radar est entier dans les 844 premiers pixels.
- `controle-annuler.mjs <dossier>` (voie p15 ; lire son en-tête) : sur `substituer`, `levure`, `dryhopper`, à 390 et 1280,
  un « Annuler » de 44 px au moins à côté de l'action, visible au repos ; un toucher ne change pas
  `window.__parcours.etat.recette`, abandonne le brouillon, et l'outil se quitte.

## Entrées
- Le code : `prototypes/houblons-v4/parcours/src/ecrans/fiche/` (NOTE.md d'abord), `…/ecrans/substituer/`,
  `…/ecrans/levure/`, `…/ecrans/dryhopper/` (le pied : le dock de `src/commun/Pont.tsx`, en lecture).
- Les contrats ci-dessus ; `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (« ## Contrat d'un écran »).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/ecrans/fiche/**`
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/**`
- Dans `prototypes/houblons-v4/parcours/src/ecrans/levure/` et `…/ecrans/dryhopper/` : le pied (le dock) seulement, et
  leur `jeu.mjs` et `NOTE.md`.
- Sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p17/` (ignorée par git).
- `work/missions/2026-10-23-maquette-parcours/voies/p17-fiche-annuler/RESULTAT.md`
- Ne pas toucher `src/commun/`, `src/etat/`, `src/moteur/`, `src/coquille/` : un besoin s'y demande au pilote.

## Exigences transversales et acquis (recopiés, L05 et L06)
- Règle n° 1 : g1 reste sa fiche ; Dryhopper (a1) et Levure restent tels qu'ils sont, sauf leur pied.
- Au style ; inconnu ≠ 0 ; simulé « ~ » ; teinte de ses maquettes (D106) ; la croix commune des outils (D109, D118,
  D119 : voie p2, ne pas la refaire). L26.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Se juger et rendre
Captures à 390 puis 1280, ouvertes en image (L12) : la fiche ouverte (côte à côte avec `consolide-fiche-390.png`) ; le
pied de Substituer, Levure et Dryhopper. `RESULTAT.md` : ce qui est fait, les captures ouvertes (nommées), la forme
d'Annuler et pourquoi, `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
