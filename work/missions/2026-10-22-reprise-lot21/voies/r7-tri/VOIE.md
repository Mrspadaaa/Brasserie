# Voie r7-tri — Tri des 56 concepts de Dryhopper

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Étape : tri (entonnoir, M13)
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r7a-dryhopper, r7b-dryhopper, r7c-dryhopper, r7d-dryhopper, r7e-dryhopper, r7f-dryhopper, r7g-dryhopper
- Décideur en cas de doute : pilote

## Lire d'abord (22.10, nuit)
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis seulement les sections
de y1b, x3b, a2b et du dry hop (« Le lot 21, son retour »). Au lieu de DEFAUTS-RECURRENTS.md en entier :
`work/refonte-frontend/v4/DEFAUTS-COURT.md`.

## Objectif
Lire les 56 concepts des sept séries (`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-{a,b,c,d,e,f,g}/`)
sur leurs captures, les classer tous, et retenir **5 candidates, une par approche** (sept approches : prends les cinq
meilleures approches, et dis pourquoi deux restent sans candidate). Le brasseur verra les 5 améliorées en tête, **puis
les 56** : ton classement est une proposition, il ne cache rien.

## La question et la baseline
« Quand l'ajouter ? » : un seul facteur libre, le moment ; la baseline y1b (le brassin au doigt, le moment glissé par
5′), x3b réduit en fin de frise, a2b, les acquis. Brief commun : `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/BRIEF-SERIES.md`.

## Ce que tu n'es pas (L27)
Ton étalonnage sur ses vrais verdicts n'est pas fait : aucun REJET, ne rejette jamais la diversité. Les greffes se
prennent partout, même dans les concepts les plus extravagants (un geste, une représentation, une vraie valeur).
Au lot 21, la série libre « a produit de meilleurs gestes et de meilleures questions » : regarde-la sans préjugé.

## Ce que tu fais
- Ouvre en image les captures `serie-<x>/captures/<x><n>-390.png` (plusieurs par tour) et lis chaque `NOTE.md`.
- Pour chaque concept : voit-on en trois secondes quand ajouter Idaho 7 dans la stout, et pourquoi ? Le geste
  se fait-il au doigt ? La vraie valeur est-elle juste (L14 : la bonne ligne d'une étude à plusieurs variétés) ?
  La baseline est-elle tenue, et chaque écart dit avec sa raison ?
- Un fichier par série, `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/serie-<x>.md` : une ligne par concept.
- Puis `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md`, en trois sections :
  - `## Classement` : les 56, du plus prometteur au moins, une ligne chacun ;
  - `## Candidates` : une ligne par candidate, exactement au format
    `- **<id>** (série X, approche A) — CANDIDATE : pourquoi ; greffes : … ; retouches : …` ;
  - `## Greffes` : les bonnes idées à coller ailleurs, les retouches communes, et les fusions possibles.

## Possède (seuls chemins où écrire)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/**` (fichiers .md)
- `work/missions/2026-10-22-reprise-lot21/voies/r7-tri/RESULTAT.md`

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 (`OK — 5 candidates, …`), les 5 candidates en une ligne chacune, les captures ouvertes par
leur nom, `LEÇON PROPOSÉE : …` (ou `aucune`). Réponse finale au pilote : une ligne.
