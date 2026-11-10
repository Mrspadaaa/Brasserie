# Voie d1 — le domaine de l'étape Levure (mission 2026-11-09-levure-port)

- Agent : auteur · Modèle : sonnet · Plafond : 90 tours · Décideur : pilote
- Lis d'abord : `CLAUDE.md`, `cerveau/LECONS.md` (L14, L20, L29), `../../MISSION.md` (« État de l'art »), le contrat `src/domain/levure/contrat.ts`
  (fixé par le pilote : tu l'implémentes, tu ne le changes pas ; un manque se dit dans RESULTAT.md),
  `work/missions/2026-11-09-ecran-levure/savoir/AUDIT-FILTRES.md`, `INVENTAIRE-EFFETS.md`, `TROUS-COMBLES.md`, `faits-proposes.json`,
  et les NOTE.md de `work/missions/2026-11-09-ecran-levure/p2/{l5b,c6b,s5a,s7a}/` (les comptes que les maquettes affichent).
  Les scripts de comptes des maquettes sont `p2/c6a/comptes-p4.mjs` et `p2/c5a/…` : réutilise leur logique, dans le domaine, testée.

## Livrable
`src/domain/levure/index.ts` exporte un objet conforme à `ApiLevure`, plus les fonctions pures dont il se sert, réparties en modules courts
(`axes.ts`, `valeurs.ts`, `disponibilite.ts`, `recherche.ts`, `proximite.ts`, `suggerer.ts`).
- **Données** : `yeastReferences([], { includeCatalogue: true })` (`src/domain/yeastReferences.ts`), les faits du catalogue
  (`effectiveYeastCatalogueFacts`) et les offres de `src/data/yeastSupplyBootstrap.json`. Ne réécris pas un lecteur qui existe déjà (L29).
- **Faits sourcés** : verse les 46 faits de `faits-proposes.json` dans `src/data/levure/faitsSources.json`, lus par `valeurAxe` en
  plus du catalogue. Chaque fait garde sa source (titre, auteur, URL). En cas de conflit avec le catalogue, les deux restent : la
  valeur la mieux sourcée est montrée et l'autre est notée.
- **Axes** : les 12 de `contrat.ts`, avec leurs niveaux et plages lus. « estimé » quand la valeur vient d'un descripteur
  (banane → esters ; girofle, POF → phénols ; biotransformation → thiols), comme dans la passe 4 :
  - esters − 41 · + 317 depuis US-05 ;
  - 3068, WLP300, M20, W-68 et Abbaye sortent en « + esters ».
- **Disponibilité** :
  - `ici` = une offre CH, FR ou DE dans les offres ;
  - `europe` = « fabricant présent en Europe » : une liste de fabricants, chacun avec sa source (siège ou distributeur européen), dans
    `src/data/levure/fabricantsEurope.json` ; Lallemand (CA) et Mangrove Jack's (NZ) n'y entrent que sur une preuve de distribution ;
  - `rare` = le reste.
- **Boisson** : par défaut, seulement la bière. Les levures de vin, de cidre et de distillerie sont repérées par le fabricant et les
  catégories, et le compte est écrit « estimé ».
- **Recherche** : `chercher` utilise `yeastSearchIndex` et `yeastSearchScore` existants. Les facettes sont disjonctives, et les
  « non documentées » sont comptées.
  - Ordre c4 : une levure US tapée (ex. « 1056 ») donne ses plages en **repère**, jamais en filtre ; la liste est rangée par
    disponibilité puis par proximité de Gower ; US-05 en tête après « 1056 ».
  - `resume` : la ligne de c6b, par exemple « bière · repères 19 °C · 7 % · proche de 1056 · 1 339 ».
- **Suggérer** : `comptesAxes` et `suggerer` rendent les comptes − / + de s7a. On peut combiner deux axes. `levier` n'est rempli que
  si une source le documente (°C pour les thiols : Samia 2026 ; empâtage → Malts/sucres pour l'atténuation).
- **Couleurs** : exporte la famille d'arôme de chaque descripteur, avec les mêmes familles et les mêmes jetons que les houblons
  (cherche la table des familles d'arômes des houblons ; ne la recopie pas, importe-la). La voie u1 s'en sert pour les pastilles.
- **Doutes à sourcer** (critique passes 3 et 4) : W-68 « + banane », 3068 « esters ↑ à chaud », Diamond (thiols, °C), la règle °C
  de c5b. Pour chacun : la source trouvée dans les données du dépôt, ou « non sourcé » ; dans ce cas, rien n'est affiché.
- **Mesure** : temps de `chercher` (1 733 fiches, 3 filtres) à froid et à chaud, dans un test ; cible < 20 ms à chaud. Écris le chiffre.

## Contrôles
- `npx tsc --noEmit -p .` sans erreur dans `src/domain/levure/**`.
- `npx vitest run tests/unit/levure --maxWorkers=2` vert. Les tests disent les valeurs des maquettes : US-05 en tête après
  « 1056 », esters + 317 estimé, Style 233 documentées / 1 106 sans style, 3068 en + esters, une levure de vin absente par défaut.
- `git status --short` : tes fichiers seulement.

## Possède
`src/domain/levure/**` sauf `contrat.ts`, `src/data/levure/**`, `tests/unit/levure/**`, `work/missions/2026-11-09-levure-port/voies/d1/**`.
Ni commit ni stash. Rends une ligne ; RESULTAT.md dans ton dossier (ce qui est fait, les chiffres, les doutes, `LEÇON PROPOSÉE :`).
