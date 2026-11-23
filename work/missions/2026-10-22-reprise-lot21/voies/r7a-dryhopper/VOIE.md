# Voie r7a-dryhopper — Dryhopper, série A : Le geste d'abord

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Étape : v0 ×8 (2 froide, 6 tiède) (entonnoir, M13)
- Plafond : 120 tours (environ 5 par concept) ; 3 essais par critère
- Dépend de : r6r-critique-lot22
- Décideur en cas de doute : brasseur (il choisit) ; pilote pour le contrat

## Objectif
Huit concepts minimalistes de l'outil Dryhopper (« Quand l'ajouter ? »), `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a1/etat.html` à
`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/a8/etat.html`, sous l'approche de ta série, chacun sur la baseline, avec un seul facteur libre : le moment.

## Ton approche
**A, le geste d'abord.** Le moment se choisit au doigt, et la réponse suit le geste : glisser, pincer, tirer, maintenir. Le geste de y1b est le point de départ ; cherche d'autres gestes qui disent « plus tôt / plus tard » sans lire.

- Chaleur de ta série : 2 froide, 6 tiède (froide = une idée retenue affinée ; tiède = la forme de ton approche ; chaude =
  forme libre). Marque chaque concept dans ta NOTE.
- Descripteurs : option A.
- Levure : au moins deux concepts en dernière étape de Dryhopper, au moins deux avec un pont vers un outil Levure.

Les autres séries travaillent en même temps (B : la réponse d'abord ; C : les vraies valeurs d'abord ; D : le simulateur ; E : la frise ; F : créatif à fond ; G : libre, brief minimal). Ne regarde pas leurs dossiers, et ne fais pas leur
approche. Le critique classera ensuite les 56 concepts, en retiendra 5 et prendra des greffes partout ; tu amélioreras
les tiens en passe 2 (même agent, relancé).

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/BRIEF-SERIES.md` — le brief commun : la question, la baseline, les données, le balisage. Lis-le en entier.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/y1b/`, `x3b/`, `a2b/` et `fils21-choisir/captures/` — la baseline.
- `work/refonte-frontend/v4/ecran-1/fils22-carte/dryhopper/` et `fils22-carte/captures/dryhopper-*.png` — l'écran de la carte.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/` (profils-simules.json, comparatifs-dryhop.json, PROFIL-SIMULE.md).
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — comment il juge.
- `cerveau/produit/acquis-valides.md`, `.claude/rules/affinee-frontend.md`, `DESIGN.md`.
- `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs`, `controle-commun.mjs`, `controle-acquis.mjs` — leurs en-têtes disent le balisage.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/**` (pages des concepts, générateur, `NOTE.md`, `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r7a-dryhopper/RESULTAT.md`
Fichiers de travail dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/captures/travail/` ou dans `os.tmpdir()`, jamais à la racine (L17).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, une ligne par concept (id, chaleur, ce qu'il montre, son geste, sa vraie
valeur, la forme de la levure), les sorties décisives, les captures ouvertes par leur nom, `CONNAISSANCE : …` et
`LEÇON PROPOSÉE : …`. Dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/NOTE.md` : `## Concepts` (le même tableau), `## Baseline` (ce qui est repris,
et chaque écart avec sa raison), et les sorties de D98, D99 et MOTS jouées une fois. Réponse finale : une ligne.
