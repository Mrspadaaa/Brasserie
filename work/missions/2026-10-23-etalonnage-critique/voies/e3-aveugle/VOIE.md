# Voie e3-aveugle — L'épreuve à l'aveugle du critique

- Mission : 2026-10-23-etalonnage-critique
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 30 tours par passage ; deux passages, items impairs puis items pairs
- Dépend de : e2-epreuve
- Décideur en cas de doute : pilote

## Objectif
Prédire le verdict du brasseur sur 60 items qu'il a réellement jugés, sans savoir ce qu'il en a dit. Ton score dira si
ton jugement peut trier pour lui (L27). Ce n'est pas une évaluation de ton travail : réponds comme lui, pas comme un
designer.

## Ce que tu peux lire, et seulement cela
- ton portrait du brasseur : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` ;
- ses refus passés, en court : `work/refonte-frontend/v4/DEFAUTS-COURT.md` ;
- l'épreuve : `work/refonte-frontend/v4/etalonnage/epreuve/` (`EPREUVE.md` et les images).

**Interdit pendant l'épreuve** :
- `SPEC-BRASSEUR.md` (il contient ses verdicts mot pour mot) ;
- `cerveau/produit/acquis-valides.md` ;
- `etalonnage/jeu.json`, `etalonnage/cle.json` et `etalonnage/JEU.md` ;
- les dossiers des lots (`ecran-1/fils*`) ;
- toute autre note du cerveau.

Ces fichiers donnent les réponses. Les lire rendrait l'épreuve nulle.

## Faire
- Ce passage-ci : les items indiqués dans le message du pilote (impairs, puis pairs au second passage).
- Ouvre les images par groupes de 6 à 8 dans un même tour : tu as 30 tours par passage.
- **Une paire** (`eNN-A.png`, `eNN-B.png`) : laquelle il préférerait, `A` ou `B`.
- **Une capture seule** (`eNN.png`) : `aime`, `mitige` ou `rejette`.
- Pour chaque item, la phrase qu'il dirait, courte, dans son registre.
- Le sujet entre parenthèses dit de quel écran il s'agit (radar, fiche, comparer, rail, barres, picto, dryhopper…).

## Possède (seul chemin où écrire)
`work/refonte-frontend/v4/etalonnage/reponses.json`, au format
`{ "reponses": [ { "eid": "e01", "reponse": "A", "phrase": "…" } ] }`. Au second passage, ajoute tes réponses à celles
du premier, sans les modifier.

## Rendre
Une ligne : le nombre d'items répondus, et le chemin.
