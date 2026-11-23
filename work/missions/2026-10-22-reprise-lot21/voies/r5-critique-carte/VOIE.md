# Voie r5-critique-carte — critique de la carte des outils

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r1-carte
- Décideur en cas de doute : pilote

## Objectif
Prédire le verdict du brasseur sur la carte des outils (r1) : comprend-il en trois secondes quel outil répond à quelle question, et le chemin de sa stout de Ma bière à Dryhopper ? Les choix ouverts (Substituer, Levure) sont-ils montrés côte à côte, sans question fermée ?

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — ta grille : comment le brasseur juge, avec ses mots.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (ses dernières paroles priment) et `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`.
- `cerveau/produit/acquis-valides.md`.
- Le livrable : `work/refonte-frontend/v4/ecran-1/fils22-carte/` (`carte.html`, huit écrans, `NOTE.md`, `captures/`).
- Les contrats et rapports des voies relues : `work/missions/2026-10-22-reprise-lot21/voies/<voie>/VOIE.md` et `RESULTAT.md` (à ne pas croire sans vérifier sur les captures).

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r5-critique-carte/RESULTAT.md`

## Consignes
- Ouvre chaque capture en image (Read sur le PNG), par lots de plusieurs lectures dans un même tour : ton plafond est de 30 tours.
- Questions, une réponse prouvée chacune :
  1. La carte se lit-elle en trois secondes : un écran = une question, un seul facteur libre, des ponts clairs ? Rejoue-t-elle la confusion du lot 21 (« plusieur confusion entre timing, comparaison, houbons side by side… ») ?
  2. Les deux façons de Substituer et de Levure sont-elles côte à côte, sans question fermée (L24) ?
  3. Chaque écran est-il un vrai écran de la base (disposition l8, radars, barres de l5b), pas un fond factice ?
  4. Penser en brasseur : α, rôle, arômes, moment et dose avant l'IBU ; aucune valeur inventée ?
  5. Hors périmètre : `git status --short` et `git status --short --ignored work/refonte-frontend/v4/ecran-1`.
- Dans le doute, rejette avec la correction précise : un rejet coûte une passe, une mauvaise planche montrée coûte sa confiance.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format du critique (`.claude/agents/critique.md`) : ligne 1, puis une ligne par capture ou par variante avec verdict, phrase prédite du brasseur et correction attendue ; `LEÇON PROPOSÉE`. Réponse finale au pilote : une ligne.
