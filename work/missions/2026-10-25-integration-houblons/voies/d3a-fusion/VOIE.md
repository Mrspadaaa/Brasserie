# Voie d3a-fusion — trier et fusionner toutes les données collectées (#180, seconde étape de D154)

Agent : auteur (Sonnet), pour du code de données avec des choix. Cette voie produit des données et leur chargeur. **Elle ne touche
pas à l'interface** (voie d3b ensuite) **ni au moteur.**

## Ses mots (26.10)
- « Il faut récupérer un maximum de données. Toutes données sera bonne à prendre. Il faudra trié ensuite. Pour le moment récupère TOUT »
- « ne regroupe jamais plusieurs huiles. Sauf si c'est utile et que elles sont déjà séparé à un endroit. Donc je veux les deux » (D154)

## Entrées
- `src/data/hopSources/*.json`, 18 sources. Leur format est dans `voies/c3-COMMUN.md` § 6.
- Les rapports des collectes : `voies/c3a-hopsteiner/`, `c3b-europe/` (couverture.md, doutes.md), `c3c-amerique-oceanie/` et
  `c3d-communautaire/`, avec couverture.md et RESULTAT.md. Lis leurs doutes : unités, bases, valeurs étranges, rattachements à
  relire.
- Le catalogue : `src/data/hopV4/proto-data.json` (`CatalogueHop`, `src/domain/hopIndex/v4/data.ts`).

## Conventions (décidées par le pilote, réversibles)
1. **Par variété et par champ, une liste de valeurs par source**, chacune avec sa source, son année si publiée, et l'URL de la
   fiche.
   - La valeur montrée est l'**enveloppe** des valeurs valides de même unité et de même base : du plus bas au plus haut.
   - Jamais de moyenne. Un inconnu reste absent, jamais 0.
2. **Unités et bases**, normalisées seulement quand c'est certain :
   - composés de l'huile en % de l'huile ;
   - huile totale en mL/100 g ;
   - cohumulone et colupulone en % des α (ou des β) ;
   - α et β en % de la masse ;
   - thiols en µg/kg ; polyphénols et xanthohumol en % de la masse.

   Une valeur d'unité ou de base inconnue ou différente (l'huile en % de la BHA, les champs sans unité de HopDatabase) est gardée,
   mais **hors de l'enveloppe**, avec sa raison (`horsEnveloppe`).
3. **Valeurs suspectes**, gardées, hors de l'enveloppe, marquées `suspect` et listées dans le rapport :
   - un pourcentage au-dessus de 100 ;
   - des minimums de composés qui somment au-delà de 100 ;
   - une huile totale au-delà de 6 mL/100 g ;
   - un α au-delà de 25 % ;
   - une plage inversée ;
   - une borne négative (BarthHaas TerraFlux « -1 - 7% », Charles Faram Summit « 10.5-30.0 »).
4. **Rattachement** : seules les fiches dont `varietyId` est résolu entrent dans la fusion.
   - Les ambiguës et les variétés absentes du catalogue vont dans une liste `nonRattachees`, avec leurs candidats, pour un tri à
     part. Aucune variété n'est ajoutée au catalogue dans cette voie : c'est une décision du produit.
   - Les rattachements signalés « à relire » par les voies (heb, ssg, sul, East Kent Golding, Hallertauer Gold…) sont vérifiés.
     Dans le doute : non rattaché.
5. **Diffusion, par source** : relis les conditions de chaque source, page et phrase clé, et classe-la :
   - `libre` : licence ouverte, ou domaine public (HopDatabase et hops-json en MIT, USDA) ;
   - `restreinte` : des conditions interdisent la reproduction ou le stockage sans accord écrit. Les voies l'ont relevé pour
     Hopsteiner (§ 3 de `/en/imprint`) et pour John I. Haas ;
   - `inconnue` : aucune condition trouvée, ou une simple mention « All rights reserved ».

   Écris pour chacune ce que tu as lu. Le fichier de l'app ne prend que `libre` et `inconnue`. Les valeurs `restreinte` vont dans
   un fichier à part, gardé dans le dépôt, que l'app n'importe pas : la décision sur ces sources appartient à l'utilisateur.

   Les valeurs Hopsteiner déjà présentes dans le catalogue avant cette voie (α, β, huile, linalol, pour 79 variétés) restent
   telles quelles : statu quo, à signaler dans le rapport.

## À faire
1. `scripts/collecte-hop/fusion.mjs`, hors ligne et déterministe, produit trois fichiers :
   - `src/data/hopV4/complements.json` : compact, indexé par id de variété, avec une table des sources (nom, hôte, diffusion) ;
   - `src/data/hopV4/complements-restreint.json` : même format, sources `restreinte` ;
   - `voies/d3a-fusion/rapport.md`.
2. Un chargeur `src/domain/hopIndex/v4/complements.ts` : `chargerComplements()` par **import dynamique**, chargé à la demande,
   jamais au démarrage, et des fonctions de lecture typées (`valeursDe(id, champ)`, `enveloppeDe(id, champ)`).
   - Le moteur n'importe pas ce fichier. `tests/unit/hopIndexV4/moteurInchange.test.ts` doit rester vert, mêmes empreintes.
3. Tests :
   - cohérence : min ≤ max ; aucune enveloppe hors bornes ; aucune valeur `restreinte` dans `complements.json` ;
   - déterminisme : deux passes donnent le même sha256 ;
   - le chargeur, sur un mini jeu.
4. **Rapport** :
   - la couverture avant (catalogue seul) et après (catalogue + `complements.json`), champ par champ, pour les 318 variétés.
     En tête : linalol, géraniol, farnésène, β-pinène, sélinène, cohumulone, thiols, polyphénols, intensité d'arôme ;
   - la même chose avec les sources restreintes en plus, pour qu'il voie ce qu'elles apportent ;
   - les désaccords entre sources au-delà d'un facteur 2 (les 20 plus forts) ;
   - les suspects, les non-rattachées, la diffusion de chaque source.
5. **Poids** : la taille de `complements.json`, brute et gzip.
   - `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` après `npm run build` : B5 doit rester
     ≤ 150 ko, puisque le fichier est chargé à la demande. Prouve qu'il est dans un morceau à part.

## Critères
- `node scripts/collecte-hop/fusion.mjs` deux fois : même sha256 des trois sorties.
- `npx vitest run tests/unit/hopIndexV4` vert, `moteurInchange` compris ; `npm run build` vert ; B5 tenu.
- `git diff --stat -- src/ui src/data/hopV4/proto-data.json` vide.

## Possède
- `scripts/collecte-hop/fusion.mjs`, `src/data/hopV4/complements*.json`, `src/domain/hopIndex/v4/complements.ts`.
- `tests/unit/hopIndexV4/complements*.test.ts`.
- `work/missions/2026-10-25-integration-houblons/voies/d3a-fusion/`.

Les fichiers `src/data/hopSources/` et les scripts de collecte se lisent, et ne se modifient pas. Une erreur de lecture d'une
source se corrige dans un fichier de cette voie, ou s'écrit dans RESULTAT.md. Pas de `git mv`. Fichiers de travail dans
`os.tmpdir()`.

Écris RESULTAT.md tôt et complète-le. Retour en une ligne.
