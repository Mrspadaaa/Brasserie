OK — controle-annuler.mjs (D120) : échoue sur d332792c, passe sur p17, quatre témoins, D120 gardé au registre

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/temoins/annuler-ok/`, `annuler-ok-pont/`, `annuler-absent/`, `annuler-qui-change/`
  (chacun `substituer/etat.html`)
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D120 seule, ajoutée en fin de liste par une
  commande (relue juste avant, insertion textuelle ; les lignes des autres voies sont intactes), puis son texte « resultat »
  mis à jour après l'extension.

## Le contrôle
Par route (`--routes=`, défaut substituer, levure, dryhopper) et par largeur (390 × 844 tactile, 1280 × 800 souris) :
- action = bouton du pied qui change la recette (`data-role` pont-remplacer/ajouter/placer/inscrire/valider/appliquer, ou
  texte « Remplacer », « Ajouter à ma bière », « Placer »…), ou, pour un outil qui n'écrit pas lui-même (Dryhopper), le pont
  vers l'outil suivant : texte commençant par « Puis » (« Puis la levure › ») ou tout `[data-role^="pont-"]` dans la moitié
  basse de l'écran ;
- Annuler = `data-role="annuler"` ou nom accessible commençant par « Annuler » (la croix « Fermer » ne compte pas) ;
- D120 présence (visible, dans l'écran, centre non recouvert), place (moins de 48 px de l'action ; sans action trouvée, tiers
  bas), taille (44 px de haut au moins) ;
- D120 effet : toucher (clic à 1280), puis `etat.recette` identique en JSON, `etat.brouillon` nul, adresse changée.
Code 0 OK, 1 échec, 2 page absente.

## Sorties décisives
- **d332792c** : `ANNULER ECHEC (0/6 conformes)`, code 1 (`ECHOUE OK` par `systeme.mjs echoue`). L'action est trouvée sur les
  trois routes (« Remplacer › » 95 × 28, « Ajouter à ma bière › » 140 × 28, « Puis la levure Pomona ~+13 » 223 × 28), aucun
  « Annuler » : 6 lignes `- D120 …`.
- **parcours-p17** : `ANNULER OK (3 routes × 2 largeurs)`, code 0. Annuler 97 × 48 px à côté de « Remplacer › », « Ajouter à
  ma bière › » et « Puis la levure Pomona ~+13 » (269 × 48 à 390, 311 × 48 à 1280) ; recette identique, brouillon nul,
  retour à `#/ma-biere`.
- **annuler-ok** : `ANNULER OK (1 routes × 2 largeurs)` ; Annuler 88 × 48 à côté de Remplacer 113 × 48, recette identique,
  brouillon abandonné, `#/substituer/idaho-7` vers `#/ma-biere`.
- **annuler-ok-pont** : `ANNULER OK (1 routes × 2 largeurs)` ; action « Puis la levure › » 131 × 48, Annuler 88 × 48, recette
  identique, brouillon abandonné (le pont ne fait qu'aller à `#/levure/idaho-7-1`, sans écrire la recette).
- **annuler-absent** : `ANNULER ECHEC (0/2 conformes)`, « pas de bouton Annuler (le pied n'a que Remplacer › … 48 px) » ;
  `ECHOUE OK`.
- **annuler-qui-change** : `ANNULER ECHEC (0/2 conformes)`, « Annuler change la recette » (idaho-7 devient simcoe) ;
  `ECHOUE OK`.

## Critères
- G1 `ECHOUE OK (ANNULER ECHEC, code 1)` ; G2 `ANNULER OK` ; G3 et G4 `ECHOUE OK` ; G5 `PORTEE OK` ; G6 `TEMOINS OK` ;
  G7 `NOTE OK` (rejoué sur ce fichier).
- `systeme.mjs appels controle-annuler.mjs --rejouer` : `APPELS OK (6 critères rejoués)`.
- Essais : 1 par critère ; l'extension a été jouée une fois.

## Doutes et limites
- Un premier `systeme.mjs temoins` a rendu `TEMOINS ECHEC` (ligne fautive non vue, sortie coupée par `tail`) ; sept rejeux
  ensuite : `TEMOINS OK`. Probablement un fichier d'une autre voie en cours d'écriture ; non reproduit.
- Un pont `[data-role^="pont-"]` quelconque dans la moitié basse compte comme action : un pont de navigation sans rapport placé
  en bas de l'écran suffirait à trouver une « action ». C'est voulu (la règle porte sur Annuler à côté du pied), mais l'absence
  d'Annuler reste fautive dans tous les cas.
- Les témoins ne jouent que la route substituer ; Levure et Dryhopper sont éprouvés sur p17 (passe) et d332792c (échec).
- Pas de capture : le contrôle est une mesure, aucun rendu à juger ici.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
