# Voie r6n2-reprise-toucher — Le premier écran de r6a, le reste à un toucher

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : r0c-inventaire-controles
- Décideur en cas de doute : brasseur (il choisit entre r6n1 et r6n2) ; pilote pour le contrat

## Objectif
Une mini maquette de Comparer, `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/etat.html`, qui répond à « Lequel pour ma stout : Cascade,
Idaho 7 ou Galaxy ? ». C'est r6a, qu'il a choisie, plus chaque élément qu'il avait noté bon ou intéressant
(`donnees/elements-notes.json`), y1b d'abord.

## Ton angle
**Le premier écran de r6a reste tel qu'il l'a choisi**, à de petites retouches près (dis lesquelles dans la
NOTE, section « Premier écran », et pourquoi). Chaque élément de l'inventaire vit à un toucher : un seul geste
depuis un déclencheur visible au repos, jamais deux. Range les touchers pour qu'on les trouve sans légende
(le dock sous le pouce de y1b peut être ce rangement). d1, « tout ouvert », était « trop bordélique » : ici,
rien ne s'ouvre seul.

Une autre voie fait en même temps l'autre forme (r6n1 : tout au premier écran). Ne la regarde pas
et n'écris pas dans son dossier : le brasseur choisira entre les deux.

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/BRIEF-REPRISE.md` — le brief commun de la reprise : lis-le en entier d'abord.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` — l'inventaire ; ouvre chaque capture qu'il cite.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html`, `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/generer.mjs`, `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/NOTE.md` et `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-*.png` — le plancher.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/BRIEF-AUTEUR.md` — le brief du lot 22 (balisage, rendu, captures) : il vaut toujours.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/comparer-stout.json` et `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/ENTREES.md` — les seules données.
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md` — comment il juge.
- `cerveau/produit/acquis-valides.md`, `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (« Le lot 21, son retour »,
  « Le lot 22, son retour »), `.claude/rules/affinee-frontend.md`, `DESIGN.md`.
- `work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs`, `controle-une-question.mjs`, `controle-acquis.mjs` — leurs en-têtes disent le
  balisage attendu.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/**`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png`
- `work/missions/2026-10-22-reprise-lot21/voies/r6n2-reprise-toucher/RESULTAT.md`
Ne touche ni aux données, ni aux briefs, ni à r6a ni aux autres variantes. Fichiers de travail dans ton
dossier ou dans `os.tmpdir()`, jamais à la racine (L17).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un seul facteur libre : la variété (D98). 80 mots au plus au premier écran.
- Acquis (D99) : radar avec intervalles, chimie rattachée aux familles, panel OSU sans molette, vraies valeurs
  sourcées ; manière de w2 ; barres de l5b et leurs pistes (L03).
- D104 : chaque élément de l'inventaire classé dans la NOTE (`## Reprise`) et balisé `data-element`.
- D103 : le radar ne sature plus ; ta règle d'affichage dans la NOTE.
- Code couleur des arômes ; au style par défaut ; α en tête puis rôle en mot ; stock en icône ; pictos au trait ;
  légende derrière un « ? » ; appui long → vraie fiche. Honnêteté : source citée, simulé marqué, inconnu ≠ 0.
- L26 : classes préfixées `r6n2-…`, pas de `String.replace` avec `$`. L12 : chaque capture ouverte.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent : ligne 1, le tableau de reprise (élément → repris, en contexte, en pont ou
écarté), les sorties décisives, les captures ouvertes par leur nom, ta prédiction de sa réaction en une phrase,
`CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Réponse finale au pilote : une ligne.
