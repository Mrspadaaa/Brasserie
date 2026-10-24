# Voie r13-dryhopper — Dryhopper devient p4b2f, son choix (D43)

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md` (à lire en entier)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 130 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante
- Étape : reprise

## Ses mots (24.10, soir), mot pour mot
Sur p4b2f (« L'aire du floral », retouche de p4b2) dans « Planches · 24.10 » : « Partir sur cette version ». Sur p4b2 : « Ça j'aime
beaucoup mais c'est encore assez peu lisible ». Règle n° 1 : sa maquette choisie est la base de l'écran, reprise telle quelle,
tous ses états compris (L03). Registre : `work/refonte-frontend/v4/choix/ecrans.json` (dryhopper : choisi, p4b2f).

## Sa maquette choisie
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4b2f/` (etat.html, NOTE.md, generer.mjs, geste.json) ; captures
`…/passe4/captures/p4b2f-premier-ecran.png`, `p4b2f-pendant.png`. Lis sa NOTE en entier (mesures, ce qui tient, ce qui casse).

## Ce que tu fais
1. **Relève ses états**, comme p21a et p21b l'ont fait pour les autres écrans : joue sa page p4b2f dans Chrome (repos, le geste
   sur le rail, la loupe, les jours, la bosse de levure, « ? → ~+21 », le bandeau des quatre chiffres, ★, Levure ›…) et écris
   `work/refonte-frontend/v4/choix/etats/dryhopper.json` au format des autres relevés (`id`, `mots`, `etat`, `quoi`,
   `page_choisie`, `capture_choisie`, `verif` avec sélecteurs et mots MESURÉS sur sa page, jamais devinés ; captures dans
   `work/refonte-frontend/v4/choix/etats/captures/etat-dryh-*-choisie.png`). Témoin : `controle-etats.mjs --choisie --ecran=dryhopper`.
2. **Rends Dryhopper de la maquette en p4b2f** (`prototypes/houblons-v4/parcours/src/ecrans/dryhopper/`), moteur en direct
   (jamais de chiffres figés), un seul état de recette partagé ; pose `data-etat` sur chaque déclencheur ; garde ce que la maquette
   faisait autour (le pont Levure ›, Annuler à côté de l'action, la croix D109, « Placer » depuis Comparer qui y mène).
3. **La continuité (D129)** : le titre d'en-tête à 18 px (DESIGN.md), le pied « Annuler · action » en bas de l'écran, comme
   Substituer et Levure ; le rail au-dessus du pied.
4. **L'acquis y1b** (`work/refonte-frontend/v4/choix/etats/acquis.json`, `etat-acquis-y1b-brassin-au-doigt`, en `attend_choix`) :
   p4b2f descend d'a1, lui-même y1b affiné ; relève sur p4b2f ce qui reste de « Quand ? », « au doigt », « 20 bières » et réécris
   son `verif` sur sa page p4b2f (mots mesurés), en retirant `attend_choix`. Si un mot de y1b n'est plus dans p4b2f, écris-le
   (`DÉCISION :`), sans l'inventer.
Écris tout dans `NOTE.md` de l'écran (« Reprise D43 »).

## Possède
`prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**`, `prototypes/houblons-v4/maquettes/parcours-dryhopper/**`,
`work/refonte-frontend/v4/choix/etats/dryhopper.json`, `work/refonte-frontend/v4/choix/etats/captures/etat-dryh-*`,
l'entrée `etat-acquis-y1b-brassin-au-doigt` de `work/refonte-frontend/v4/choix/etats/acquis.json`,
`work/missions/2026-10-23-maquette-parcours/voies/r13-dryhopper/RESULTAT.md`. Construis avec
`--sortie=prototypes/houblons-v4/maquettes/parcours-dryhopper`. Une autre voie (r12) travaille sur le commun, Substituer et
Levure : n'y touche pas ; besoin d'un fichier hors de ton périmètre : demande-le au pilote. « dryhopper » est dans la liste de controle-etats.mjs : joue-le avec `--ecran=dryhopper` dès que ton relevé existe.

## Critères
Dans `GATES.md`. Captures de chaque état à côté des siennes, ouvertes (L12). Réponse finale : une ligne.
