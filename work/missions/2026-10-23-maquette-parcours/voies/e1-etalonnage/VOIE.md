# Voie e1-etalonnage — verser ses derniers verdicts au jeu d'étalonnage, puis rejouer l'épreuve

- Mission : 2026-10-23-maquette-parcours
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : p22
- Décideur en cas de doute : pilote

## Objectif
L27 : un juge qui parle pour le brasseur s'étalonne sur ses vrais verdicts. Le conseil du 24.10 (revue 2) : avant le tri des lots
D125, verser ses verdicts récents au jeu d'étalonnage et rejouer l'épreuve ; sous le seuil, le critique signale et ne classe pas.

## Entrées
- Le jeu : `work/refonte-frontend/v4/etalonnage/jeu.json` (lis son format, et `docs/agents/systeme.md` et
  `.claude/agents/critique.md` pour l'épreuve) ; les commandes `node scripts/agents/systeme.mjs epreuve` et
  `node scripts/agents/systeme.mjs etalonnage [--moitie A|B] [--reponses f.json]`.
- Ses verdicts du 23 et du 24.10, mot pour mot : `work/refonte-frontend/v4/choix/commentaires/fils-2026-10-24.json` (ceux qui
  jugent une vue, avec leur capture ou celle de la maquette visée), SPEC-BRASSEUR § 1 (fin : D105 à D125), et ses verdicts sur
  les maquettes (« Ça c'est le bon », « Ça aussi », « r6a reste le meilleur »…).

## Travail
1. Ajouter au jeu chaque verdict nouveau qui juge une capture (pas les demandes de méthode), au format du jeu, sans doublon,
   avec sa capture existante.
2. Rejouer l'épreuve à l'aveugle et l'étalonnage (les deux moitiés) ; écrire les taux dans RESULTAT.md, et dire si le critique
   reste au-dessus du seuil (88 % et 75 % au 23.10).
3. Si le portrait doit changer, écrire la proposition dans RESULTAT.md (le pilote décide) ; ne pas modifier PORTRAIT.md.

## Possède
`work/refonte-frontend/v4/etalonnage/jeu.json` (ajouts seulement), `work/refonte-frontend/v4/etalonnage/epreuve/**`,
`work/missions/2026-10-23-maquette-parcours/voies/e1-etalonnage/RESULTAT.md`.

## Critères
Dans `GATES.md`. Réponse finale : une ligne (verdicts ajoutés, taux, seuil tenu ou non).
