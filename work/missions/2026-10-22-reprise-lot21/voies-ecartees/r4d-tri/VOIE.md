# Voie r4d-tri — Tri des 48 propositions « épicé »

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Étape : tri (entonnoir, M13)
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r4d-a-douce, r4d-b-sensation, r4d-c-signe, r4d-d-libre, r4d-e-metaphore, r4d-f-greffe
- Décideur en cas de doute : pilote

## Lire d'abord (22.10, nuit)
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis seulement la section du picto « épicé ». Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md` (lignes D101 à D101 quater).

## Objectif
Lire les 48 propositions des six séries (`work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-{a,b,c,d,e,f}/v0/`) sur leurs captures, les classer toutes, et
retenir **8 candidates** à améliorer en passe 2. Le brasseur verra les 8 améliorées en tête, **puis les 48** : ton
classement est une proposition, il ne cache rien.

## Ce qu'il veut (22.10, nuit), mot pour mot
« Je veux un forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... Ce que ça
représente vraiment épicier sur un houblon... » (D101 quater). Une **épice réelle**, reconnaissable, de celles qu'on
sent dans un houblon épicé (Saaz, Tettnang, Hallertau : clou, poivre doux, herbes sèches, bois). Pas un signe, pas une
sensation, pas une métaphore. Avant : quatre refus (lot 15 : « plutôt vanille, canelle ? » ; lot 21 : le poivre ; r4 :
sept épices-objets brunes, « Aucun me convient... » ; r4c : trois piments, « un piment n'a rien à voir la dedans... »).
Les dessins de r4 restent refusés : c'est leur dessin qui n'allait pas, pas l'idée d'épice.

## Les candidates
- Toutes représentent une **épice réelle** (`data-epice` sur leur bloc) : c'est sa demande. Les séries B (sensation)
  et C (signe) restent classées et montrées, mais n'ont pas de candidate, sauf si l'une de leurs propositions est une
  épice réelle.
- Au moins 6 épices différentes, dont **la cannelle, la vanille et le clou de girofle** (les trois qu'il a nommées),
  venues d'au moins 3 séries.
- Une candidate se nomme à voix haute à 12 px, ne se confond ni avec la feuille d'Herbacé ni avec les brins de Végétal,
  et ne ressemble pas aux sept dessins de r4 (« petit objet brun »).

## Ce que tu n'es pas (L27)
Ton étalonnage sur ses vrais verdicts n'est pas fait. Au lot 22, le critique a rejeté la planche à six genres, et la
voie s'est resserrée sur le seul piment. Tu ne rejettes donc rien : **aucun REJET**. Les greffes se prennent partout,
même dans les propositions les plus extravagantes (un cadrage, un trait, un détail).

## Ce que tu fais
- Ouvre en image `planche-390.png`, `tailles-390.png` et `cartes-390.png` de chaque série, et lis chaque `NOTE.md`.
- Un fichier par série, `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/serie-a.md` à `serie-f.md` : une ligne par proposition, ce qu'elle réussit et ce qui la
  retient.
- Puis `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/SYNTHESE.md`, en trois sections :
  - `## Classement` : les 48, de la plus prometteuse à la moins, une ligne chacune ;
  - `## Candidates` : une ligne par candidate, exactement au format
    `- **<id>** (série X, épice E) — CANDIDATE : pourquoi ; greffes : ce qu'elle prend aux autres ; retouches : …` ;
  - `## Greffes` : les bonnes idées à coller ailleurs, et les retouches communes.

## Entrées
- Les six séries : `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-{a,b,c,d,e,f}/v0/` (NOTE.md, captures/) et leurs contrats
  `work/missions/2026-10-22-reprise-lot21/voies/r4d-{a-douce,b-sensation,c-signe,d-libre,e-metaphore,f-greffe}/`.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`,
  `work/refonte-frontend/v4/DEFAUTS-COURT.md` (D101 à D101 quater), `cerveau/produit/pictos-familles.md`.

## Possède (seuls chemins où écrire)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/tri/**` (fichiers .md)
- `work/missions/2026-10-22-reprise-lot21/voies/r4d-tri/RESULTAT.md`

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 (`OK — 8 candidates, …`), les 8 candidates en une ligne chacune, les captures ouvertes par
leur nom, `LEÇON PROPOSÉE : …` (ou `aucune`). Réponse finale au pilote : une ligne.
