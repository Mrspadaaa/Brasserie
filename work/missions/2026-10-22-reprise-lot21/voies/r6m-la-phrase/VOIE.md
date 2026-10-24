# Voie r6m-la-phrase — La phrase et le radar

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : r6e-entrees, r0b-controles-ajustes
- Décideur en cas de doute : brasseur (il choisit la variante) ; pilote pour le contrat

## Objectif
Une mini maquette de Comparer, `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/etat.html`, qui répond à « Lequel pour ma stout :
Cascade, Idaho 7 ou Galaxy ? » sous l'angle « La phrase et le radar », et qui porte les choix ci-dessous.

## Ton angle (point de départ, à enrichir ; dis dans la NOTE ce que tu en as fait)
Une phrase par houblon qui répond à la question en mots de brasseur, chiffrée et sourcée, puis les radars r3 ; à IBU égal.

## Choix portés (à recopier mot pour mot dans la section « Choix portés » de ta NOTE)
- Radar : r3
- Base : IBU égal
- Porte : non
- Descripteurs : B

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/BRIEF-AUTEUR.md` — le brief commun du lot : lis-le en entier d'abord.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json` et `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/ENTREES.md` — les seules données.
- `cerveau/produit/acquis-valides.md` et `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (« Le lot 21, son retour »).
- `.claude/rules/affinee-frontend.md` et `DESIGN.md` — règles d'interface.
- `work/refonte-frontend/v4/ecran-1/base/consolide/comparer.html` et `comparer-radar.html` — la base v4.9.
- `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs`, `controle-acquis.mjs`, `controle-sans-famille.mjs` — leurs en-têtes disent le balisage attendu.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/**`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6m-*.png`
- `work/missions/2026-10-22-reprise-lot21/voies/r6m-la-phrase/RESULTAT.md`

Ne touche ni aux données (`donnees/`), ni au brief, ni aux autres variantes.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un seul facteur libre : la variété (D98). 80 mots au plus au premier écran.
- Acquis (D99) : radar avec intervalles, chimie rattachée aux familles, panel OSU sans molette, vraies valeurs de v1 sous un toucher ; manière de w2.
- Code couleur des arômes ; barres de l5b ; au style par défaut ; α en tête puis rôle en mot ; stock en icône ; pictos au trait ; légende derrière un « ? » ; appui long → vraie fiche.
- Honnêteté : source citée, simulé marqué, inconnu ≠ 0. La baseline est un plancher à enrichir (L07).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Y citer chaque capture ouverte par son nom, et ajouter
`CONNAISSANCE` et `LEÇON PROPOSÉE`. Réponse finale au pilote : une ligne.
