# Voie r0b-controles-ajustes — D99 « à un toucher » et radar r3, D100 à seuil réglable

- Mission : 2026-10-22-reprise-lot21
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : r0-controles (fait)
- Décideur en cas de doute : pilote

## Objectif
Ajuster deux contrôles écrits par r0 pour que le lot 22 puisse les tenir sans les tricher. Chaque
nouvelle règle a un témoin positif et un témoin négatif, et les témoins de r0 tiennent toujours.

1. **`controle-acquis.mjs` (D99)** :
   - **Acquis « à un toucher »** (décision du pilote, MISSION.md : ouvrir avant de mesurer). Les
     vraies valeurs de v1 sont prévues « sous un toucher » (conseil). Un acquis caché au repos compte
     s'il apparaît après **un seul** toucher sur un déclencheur visible au repos : un bouton ou un
     `summary` avec `aria-controls` vers le conteneur, ou portant `data-ouvre-acquis="<acquis>"`.
     Deux touchers ou plus, ou aucun déclencheur visible : absent. La ligne de sortie dit, par acquis,
     « au repos » ou « à un toucher ».
   - **Radar r3 (petits multiples)** : le rendu r3 du lot 16 (un petit radar par houblon, deux par
     rangée) est l'une des deux options que le brasseur doit choisir. Le contrôle l'accepte : dans
     `[data-acquis="radar"]`, au moins 2 `svg[data-radar]` de 120 px de large au moins, aux mêmes
     axes (`data-axes` identiques, 5 au moins), chacun avec au moins une série dessinée (polygone de
     5 sommets au moins). La règle actuelle (un radar de 150 px avec 2 séries, le rendu r2) reste
     valable.
2. **`controle-sans-famille.mjs` (D100)** : option `--seuil=<0..1>` (0,5 par défaut). Le pilote
   propose 0,25 pour l'option B (à corriger par le brasseur). La ligne OK dit le seuil employé :
   `SANS-FAMILLE OK (<n> houblon(s) au-dessus de <seuil en %> %, part « autres » visible)`.

## Entrées
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` et `controle-sans-famille.mjs` — à modifier (lis leurs en-têtes).
- `work/missions/2026-10-22-reprise-lot21/voies/r0-controles/RESULTAT.md` — la convention de balisage de r0.
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-ok/etat.html` et `temoins/sans-famille-ok/etat.html` — les témoins positifs de r0, comme modèles.
- `work/refonte-frontend/v4/ecran-1/base/generateur/radar.js` (ligne 428 environ) et `comparer.js` (ligne 313 environ) — les rendus r2 (un seul houblon plein, les autres en contour) et r3 (un radar par houblon).
- `prototypes/houblons-v4/data/pack-fiches.json` — Galaxy : 3 mots rattachés, 2 sans famille (cannabis, dank), soit 40 %.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs`
- `work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-toucher-ok/etat.html` (positif : valeurs et chimie à un toucher, radar r3 en petits multiples)
- `work/refonte-frontend/v4/tournoi/outils/temoins/acquis-deux-touchers/etat.html` (négatif : les vraies valeurs cachées derrière deux touchers)
- `work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-seuil-ok/etat.html` (positif : Galaxy 40 % avec sa part « autres »)
- `work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-seuil-ko/etat.html` (négatif : la même page sans la part « autres »)
- `work/missions/2026-10-22-reprise-lot21/voies/r0b-controles-ajustes/RESULTAT.md`

## Consignes
- Ne relâche rien d'autre : les critères G1 à G8 de r0 seront rejoués par le pilote et doivent
  tenir (y1b et y3 en échec ACQUIS, l5f en échec SANS-FAMILLE, témoins positifs OK).
- Mets à jour l'en-tête de chaque contrôle : règle, usage, témoins.
- Témoins : pages minimales et réalistes à 390 px. Valeurs tirées de `pack-fiches.json` et
  `composes-houblon.json`, source citée dans la page. Aucun chiffre inventé.
- Rejoue tes mutations, comme r0 l'a fait (hors dépôt), et dis-en le nombre dans RESULTAT.md.

## Exigences transversales et acquis
Honnêteté des données ; la part « autres » est neutre (ni hachurée ni aux couleurs d'arôme) ; le
radar garde le code couleur des houblons.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
