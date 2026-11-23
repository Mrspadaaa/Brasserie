# Voie r4cr-critique-picto — critique de la planche « épicé » 2

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r4c-picto-epice-2
- Décideur en cas de doute : pilote

## Objectif
Prédire le verdict du brasseur sur la nouvelle planche « épicé », après trois refus (lot 15, lot 21, et « Aucun me convient... » le 22.10 sur les sept pictos de r4). Une planche qu'il refuserait encore ne doit pas lui être montrée.

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — ta grille : comment le brasseur juge, avec ses mots.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (ses dernières paroles priment) et `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`.
- `cerveau/produit/acquis-valides.md`.
- Le livrable : `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/` (`planche/etat.html`, `NOTE.md`, `captures/`).
- Les contrats et rapports des voies relues : `work/missions/2026-10-22-reprise-lot21/voies/<voie>/VOIE.md` et `RESULTAT.md` (à ne pas croire sans vérifier sur les captures).

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r4cr-critique-picto/RESULTAT.md`

## Consignes
- Ouvre chaque capture en image (Read sur le PNG), par lots de plusieurs lectures dans un même tour : ton plafond est de 30 tours.
- Questions, une réponse prouvée chacune :
  1. Chaque proposition se reconnaît-elle sans légende à 12 et à 16 px ? Nomme-la à voix haute sur la capture : si tu hésites, elle est ratée.
  2. Les genres sont-ils vraiment différents, ou est-ce encore « une épice en petit objet brun » sous d'autres noms ?
  3. Une proposition se confond-elle avec un autre picto de famille ou avec une icône d'action de l'app (la flamme d'ébullition) ?
  4. Le contexte est-il une vraie ligne de houblon, et l'avant / après se lit-il ?
  5. Hors périmètre : `git status --short` et `git status --short --ignored work/refonte-frontend/v4/ecran-1`.
- Dans le doute, rejette avec la correction précise : un rejet coûte une passe, une mauvaise planche montrée coûte sa confiance.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format du critique (`.claude/agents/critique.md`) : ligne 1, puis une ligne par capture ou par variante avec verdict, phrase prédite du brasseur et correction attendue ; `LEÇON PROPOSÉE`. Réponse finale au pilote : une ligne.
