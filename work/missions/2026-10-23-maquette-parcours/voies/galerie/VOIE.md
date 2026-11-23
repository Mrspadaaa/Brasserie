# Voie galerie — toutes les créations depuis le début, et toutes les mini maquettes de Dryhopper

- Mission : 2026-10-23-maquette-parcours
- Agent : concepteur
- Modèle : opus
- Niveau : conception (page montrée au brasseur)
- Plafond : 120 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante

## Ses mots, mot pour mot (24.10, soir)
« 2 vue, changements à faire. Rencontre moi toutes les mini maquettes du dryhopping. Fait moi un artefacts avec toutes le
création depuis de début de toutes les sessions. » Et sur la disposition (PUBLIER.md) : « J'aime beaucoup cette disposition.
Utilise là pour les artefacts comme ça je peux voir rapidement plusieurs versions d'un coup ».

## Ce que tu fais
Deux pages, dans sa disposition (`work/refonte-frontend/v4/outils/pages/PUBLIER.md`, § « La disposition qu'il aime » ; modèle :
`work/refonte-frontend/v4/outils/pages/2026-10-24-pictos-hors16d/index.html`, que tu peux reprendre : style, visionneuse) :
1. **Toutes les créations** : `work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/index.html`. Une rangée par lot, dans
   l'ordre où ils ont été faits (le plus ancien en haut ; dates : NOTE.md, `work/refonte-frontend/registre.md`, l'historique git
   des dossiers) ; le nom du lot en mots du brasseur (le sujet : « Dryhopper », « la liste de la fiche », « l'épicé »…), son
   dossier en petit. Dans la rangée, toutes ses mini maquettes en vignettes serrées ; sous chacune son id et, si c'est un de ses
   choix (registre `work/refonte-frontend/v4/choix/ecrans.json`, `choix/etats/acquis.json`, SPEC § 1), la pastille « ton choix »
   avec ses mots en italique. En tête : un sommaire des lots (ancres) et le nombre total.
2. **Dryhopper** : `work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-tout/index.html`. Toutes les mini maquettes de
   Dryhopper (`fils20-dryhop`, `fils23-dryhopper` et toute autre dont la source contient « dryhop »), une rangée par série ou
   passe, sa p4b2f (« Partir sur cette version ») marquée « ton choix » en tête.

Le champ : chaque `etat*.html` sous `work/refonte-frontend/v4/ecran-1` (hors `temoins/`), chaque capture de
`work/refonte-frontend/v3` ; ajoute les autres pages de variantes des lots qui n'ont pas d'etat.html (fils7, fils9, fils10…),
et les mini maquettes des dossiers `work/refonte-frontend/phase2` à `phase8` s'ils en ont. L'image de chaque mini maquette : sa
capture existante (le premier écran) ; sans capture, rends-la à 390 × 844 dans Chrome (puppeteer-core, comme les scripts de
`work/refonte-frontend/v4/tournoi/outils`).

## Les contraintes d'un artefact (sinon il ne se publie pas)
Au plus 120 fichiers et 60 Mo pour les deux pages ensemble, aucun fichier de plus de 15 Mo. Donc : une planche JPEG par lot
(les mini maquettes en grille, chaque case à 390 px de large, le haut de leur capture, 844 px), et chaque vignette est une
découpe de sa planche (une `<img>` de la planche dans un cadre `overflow: hidden`, décalée ; jamais une image de fond, le
contrôle de page compte les images chargées). La visionneuse ouvre la case en grand (390 px), à côté de « ton choix » du même
écran s'il y en a un. Les pages sont du HTML statique écrit par ton script de génération (dans ce que tu possèdes) ; aucun
contenu construit au chargement par le navigateur, le script de la page ne sert qu'à la visionneuse. Chaque vignette porte
`data-source="<chemin de la mini maquette depuis la racine>"`. L'inventaire : `2026-10-24-galerie/inventaire.json`, un tableau
d'objets `{ source, lot, id, titre, image, case, choix }`.

## Possède
`work/refonte-frontend/v4/outils/pages/2026-10-24-galerie/**`, `work/refonte-frontend/v4/outils/pages/2026-10-24-dryhopper-tout/**`,
`work/missions/2026-10-23-maquette-parcours/voies/galerie/RESULTAT.md`. Scripts de travail : dans ces dossiers (`outils/`) ou
`os.tmpdir()`.

## Critères
Dans `GATES.md`. Ouvre les captures de `verifier-page` (L12). Réponse finale : une ligne.
