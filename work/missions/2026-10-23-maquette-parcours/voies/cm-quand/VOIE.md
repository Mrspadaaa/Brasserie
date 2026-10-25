# Voie cm-quand — Le contrôle « choisir quand comparer » (D141)

- Mission : 2026-10-23-maquette-parcours
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 50 tours ; 3 essais par critère
- Étape : —

## Objectif
Ses mots (25.10) : « surtout pouvoir choisir quand comparé. 60' 10' dryhopping... ». Écrire `work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs
<dossier> <id…> [--page=etat.html]` : pour chaque page à 390 × 844, un élément `[data-role="quand-comparer"]` existe, porte au moins trois
moments dont 60′, 10′ et un dry hop (texte ou `data-moment`), et toucher un autre moment change les valeurs comparées (le texte des
colonnes ou des rangées des familles diffère après le toucher). Sortie : une ligne par page, puis `QUAND OK` ou `QUAND ECHEC (n)`.
Ne s'arrête pas au premier échec (M16).

## Témoins (L13)
- Négatif : la base jouable `prototypes/houblons-v4/maquettes/parcours-cmp-base` (page `comparer/etat.html`) → QUAND ECHEC (aucun
  sélecteur de moment) ; et une copie d'une variante où le toucher ne change rien → QUAND ECHEC.
- Positif : un témoin construit dans `work/refonte-frontend/v4/tournoi/outils/temoins/quand-comparer-ok/` (sélecteur qui change les valeurs) → QUAND OK.

## Possède
`work/refonte-frontend/v4/tournoi/outils/controle-quand-comparer.mjs`, `work/refonte-frontend/v4/tournoi/outils/temoins/quand-comparer-*/`, `work/missions/2026-10-23-maquette-parcours/voies/cm-quand/RESULTAT.md`. Scripts : `os.tmpdir()`.
Aucun caractère de contrôle dans le script (M10) ; le jeton n'est imprimé que sous condition.

## Critères
Dans `GATES.md`. Réponse finale : une ligne.
