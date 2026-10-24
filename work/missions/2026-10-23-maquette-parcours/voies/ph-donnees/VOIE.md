# Voie ph-donnees — les mots hors familles les plus fréquents du catalogue (pour leurs pictos)

- Mission : 2026-10-23-maquette-parcours
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours

## Pourquoi
Le brasseur (24.10, soir) : « Peut être mettre dans la baseline aussi des icône en plus, pour avoir une version courte juste icône,
et une version plus textuel » (pour les types hors 16D, D130 : « Lui seul : vin blanc, raisin… »). Avant de dessiner, il faut
savoir quels mots reviennent le plus.

## Ce que tu fais
1. Lis `prototypes/houblons-v4/data/pack-fiches.json` (`fichesHoublons` : par houblon, ses mots de fiches avec leur source) et
   le rattachement des mots aux 12 familles (`prototypes/houblons-v4/data/correspondance-familles.json`, et la façon dont la fiche
   de la maquette les sépare : `prototypes/houblons-v4/parcours/src/ecrans/fiche/` cherche « hors-16d » ou « lui seul »).
2. Compte, sur tout le catalogue, les mots de fiches qui ne sont rattachés à aucune des 12 familles (après avoir regroupé les
   variantes d'un même mot : pluriel, majuscule, anglais et français s'il y a les deux). Garde les 24 plus fréquents.
3. Écris `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/donnees/mots-hors16d.json` :
   `{ "date", "source", "mots": [ { "mot": "vin blanc", "variantes": [...], "houblons": 7, "exemples": ["Nelson Sauvin", …] }, … ] }`
   trié par nombre de houblons, et un `NOTE.md` à côté (méthode, limites, une ligne par mot).
Rien d'inventé : un mot absent des fiches n'y entre pas.

## Possède
`work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/donnees/**`, `work/missions/2026-10-23-maquette-parcours/voies/ph-donnees/RESULTAT.md`.
Scripts de travail : `os.tmpdir()`.

## Critères
Dans `GATES.md`. Réponse finale : une ligne.
