# Voie r6r-critique-lot22 — critique du lot 22 (Comparer, 12 variantes)

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r6a, r6b, r6c, r6d, r6f, r6g, r6h, r6i, r6j, r6k, r6l, r6m
- Décideur en cas de doute : pilote

## Objectif
Prédire le verdict du brasseur sur chacune des 12 variantes de Comparer, filtrer, et marquer d'une ★ les trois ou quatre qui méritent le plus son regard. Le jury filtre, il ne choisit pas : les 12 lui seront montrées, avec tes verdicts.

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — ta grille : comment le brasseur juge, avec ses mots.
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (ses dernières paroles priment) et `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`.
- `cerveau/produit/acquis-valides.md`.
- Le livrable : `work/refonte-frontend/v4/ecran-1/fils22-comparer/` (les 12 dossiers r6a…r6m, leurs `NOTE.md`, `captures/`) ; contrats : `work/missions/2026-10-22-reprise-lot21/voies/r6*-*/VOIE.md`.
- Les contrats et rapports des voies relues : `work/missions/2026-10-22-reprise-lot21/voies/<voie>/VOIE.md` et `RESULTAT.md` (à ne pas croire sans vérifier sur les captures).

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r6r-critique-lot22/RESULTAT.md`

## Consignes
- Ouvre chaque capture en image (Read sur le PNG), par lots de plusieurs lectures dans un même tour : ton plafond est de 30 tours.
- Questions, une réponse prouvée chacune :
  1. Pour chaque variante : en trois secondes, voit-on lequel de Cascade, Idaho 7 ou Galaxy convient à la stout, et pourquoi ? Une phrase du brasseur prédite, dans son registre.
  2. Les acquis sont-ils là et lisibles (radar avec intervalles, chimie rattachée aux familles, panel OSU sans molette, vraies valeurs de v1 sous un toucher, manière de w2) ? Un défaut connu revient-il (DEFAUTS-RECURRENTS) ?
  3. Les choix portés (radar r2 ou r3, base, porte « Je n'ai pas Nelson Sauvin », descripteurs A ou B) se voient-ils vraiment sur la page, comme la NOTE le dit ?
  4. Données honnêtes et plausibles pour un brasseur (L14) : Galaxy, Idaho 7, Cascade, Nelson Sauvin fidèles à leur réputation ?
  5. Hors périmètre : `git status --short` et `git status --short --ignored work/refonte-frontend/v4/ecran-1`.
- Dans le doute, rejette avec la correction précise : un rejet coûte une passe, une mauvaise planche montrée coûte sa confiance.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format du critique (`.claude/agents/critique.md`) : ligne 1, puis une ligne par capture ou par variante avec verdict, phrase prédite du brasseur et correction attendue ; `LEÇON PROPOSÉE`. Réponse finale au pilote : une ligne.
