# Voie v2-verite-croisee — où une seule source décide encore

Agent : auteur (Sonnet). **Un audit, pas une correction** : rien dans `src/` ni dans `src/data/`. Écris RESULTAT.md tôt.

## Ses mots (31.10)
« Beer Maverick ne doit pas être la source de vérité. La source de vérité est un penel croisé de plusieurs source et donnée » (D200). Lis
`cerveau/metier/verite-croisee.md` et `cerveau/metier/role-continu.md`.

## Ce qui est demandé
1. **L'inventaire**, par un grep du code et des données : chaque endroit où une seule source fait foi.
   - L'identité des variétés : les ids `beermaverick-*`, le catalogue de base `proto-data.json`, les « ajouts » définis comme absents de
     Beer Maverick (`catalogue-ajouts.json`, c6), `rattachement.mjs`, `alias-noms.json`.
   - Les valeurs : α, β, cohumulone, huiles, mots et descripteurs, usage. D'où vient chaque champ ? Est-il croisé, ou tiré d'une seule source ?
   - Le moteur : le départage k3 (radar Beer Maverick), l'usage dans g2b, D106 et R4, la typicité (Beer Analytics seul), les plages de
     Hopsteiner.
   - Les écrans : ce qui affiche une source comme la vérité.
   Pour chaque entrée : le fichier et la ligne, la source unique, l'effet sur ce que voit le brasseur, et les sources qui pourraient la
   croiser (`src/data/hopSources/` : 20 sources plus Beer Analytics).
2. **La couverture croisée**, mesurée : pour chaque champ (α, β, cohumulone, huile totale, myrcène, linalol, mots, usage), le nombre de
   variétés qui l'ont dans 1, 2, 3 sources ou plus, et l'écart typique entre les sources.
3. **Un modèle proposé** pour un « panel croisé », sans rien écrire dans le code :
   - l'identité, sans Beer Maverick comme pivot ;
   - une valeur, qui devient une plage, avec le nombre de sources, leur écart et leurs écarts signalés ;
   - un poids par type de source (producteur, laboratoire, recettes, catalogue de vente) ;
   - les données déclarées par les recettes ;
   - le coût de la migration ;
   - ce qui change dans ce que voit le brasseur.
   Deux ou trois options, chiffrées. Ce modèle passera ensuite au conseil : c'est une décision d'architecture.

## Critères
- `V2 RAPPORT` en tête de RESULTAT.md, avec l'inventaire (fichier:ligne), la couverture chiffrée et les options.
- Aucun fichier suivi modifié hors de ta voie (`git status`).

## Possède
`work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/` seulement. Lecture seule ailleurs. Pas de serveur. N'écris aucun
code par heredoc ni par `node -e` ; les scripts de mesure vont dans ta voie. Pas de `git stash`, aucun commit. Rends une ligne.
