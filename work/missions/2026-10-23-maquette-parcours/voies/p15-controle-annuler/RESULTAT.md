OK — controle-annuler.mjs (D120) échoue sur d332792c, trois témoins tranchent, D120 gardé au registre

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs` (neuf)
- `work/refonte-frontend/v4/tournoi/outils/temoins/annuler-ok/substituer/etat.html`, `annuler-absent/…`, `annuler-qui-change/…`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D120 ajoutée en fin de liste par une seule
  commande (relu juste avant ; insertion textuelle, rien d'autre touché ; les lignes D107 à D114 des autres voies sont intactes).

## Le contrôle
Par route (`--routes=`, défaut substituer, levure, dryhopper) et par largeur (390 × 844 tactile, 1280 × 800 souris) :
- action = bouton du pied (`data-role` pont-remplacer/ajouter/placer/inscrire/valider/appliquer, ou texte « Remplacer »,
  « Ajouter à ma bière », « Placer »…) ; Annuler = `data-role="annuler"` ou nom accessible commençant par « Annuler »
  (la croix « Fermer » de l'en-tête ne compte pas) ;
- D120 présence (visible, dans l'écran, centre non recouvert), place (moins de 48 px de l'action ; sans action trouvée, tiers
  bas), taille (44 px de haut au moins) ;
- D120 effet : toucher (clic à 1280) puis `etat.recette` identique en JSON, `etat.brouillon` nul, adresse changée.
Code 0 OK, 1 échec, 2 page absente.

## Sorties décisives
- **d332792c** : `ANNULER ECHEC (0/6 conformes)`, code 1. Substituer et Levure : aucun « Annuler », pied de 28 px
  (« Remplacer › » 95 × 28, « Ajouter à ma bière › » 140 × 28). Dryhopper : aucune action de recette dans le pied (« Puis la
  levure » seulement) et aucun Annuler ; 8 lignes `- D120 …`.
- **annuler-ok** : `ANNULER OK (1 routes × 2 largeurs)` ; Annuler 88 × 48 px à côté de Remplacer 113 × 48, recette identique,
  brouillon abandonné, `#/substituer/idaho-7` → `#/ma-biere`.
- **annuler-absent** : `ANNULER ECHEC (0/2 conformes)`, « pas de bouton Annuler (le pied n'a que Remplacer › … 48 px) ».
- **annuler-qui-change** : `ANNULER ECHEC (0/2 conformes)`, « Annuler change la recette » (idaho-7 devient simcoe).

## Critères
- G1 `ECHOUE OK (ANNULER ECHEC, code 1)` ; G2 `ANNULER OK` ; G3 et G4 `ECHOUE OK` ; G5 `PORTEE OK` ; G6 `TEMOINS OK`
  (voir doute) ; G7 à rejouer sur ce fichier. `systeme.mjs appels controle-annuler.mjs --rejouer` : `APPELS OK (5 critères rejoués)`.
- Essais : 1 par critère.

## Doutes et limites
- Un premier `systeme.mjs temoins` a rendu `TEMOINS ECHEC` (ligne fautive non vue, sortie coupée par `tail`) ; quatre rejeux
  de suite : `TEMOINS OK`. Probablement un fichier d'une autre voie en cours d'écriture ; non reproduit.
- Dryhopper : la maquette future doit poser une action de recette dans le pied (« Placer »…) : sans elle le contrôle échoue
  par « aucune action trouvée », comme le voulait le brasseur (pas de pied sans Annuler). Si l'action s'appelle autrement,
  l'ajouter à `roleAction`/`texteAction` ou lui donner `data-role="pont-placer"`.
- Les témoins ne couvrent que Substituer ; Levure et Dryhopper ne sont éprouvés que sur d332792c (échec).
- Pas de capture : le contrôle est une mesure, aucun rendu à juger ici.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
