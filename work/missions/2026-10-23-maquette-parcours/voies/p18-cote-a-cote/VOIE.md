# Voie p18-cote-a-cote — la page « sa base | la maquette », écran par écran, mêmes états, 390 px

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un outil de captures joué, une page)
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
La supervision, après D117 (« J'ai l'impression que cette vue suggestions et pas la bonne que j'ai vraiment choisir ?? ») :
« avant de me l'annoncer, une page côte à côte par écran (sa base | la maquette, mêmes états, 390 px), regardée par le
concepteur et par le critique. Je la regarde aussi avant de publier, et je la publie avec la version. C'est mon manque
(L03) : j'ai publié d332792c sur CHOIX OK et critique ACCEPTÉ, sans cette comparaison. »

Ta voie fait l'outil qui produit les deux colonnes de captures, aux mêmes états, et la page qui les montre. Le pilote
la rejouera sur la construction finale ; tu la mets au point sur les constructions déjà là.

## L'outil : `prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs`
Usage : `node prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs <dossier construit> --sortie=<dossier img>`.
Chrome à 390 × 844, tactile, `deviceScaleFactor` 2. Pour chaque état, deux captures du premier écran (844 px de haut) :
`<etat>-base.png` (sa base, jouée quand elle est jouable, sinon sa capture existante, recadrée au premier écran) et
`<etat>-maquette.png`. Puis `--plein` en plus : la page entière de chaque côté (`<etat>-…-plein.png`). Un fichier
`etats.json` liste chaque état : nom, base (fichier source et geste), maquette (page et geste), et ce qui a été joué.

États (lire les contrôles cités pour les gestes, sans les modifier ; les bases jouables sont des pages du dépôt) :
1. `etape` — l'étape Houblons au repos. Base : `work/refonte-frontend/v4/ecran-1/base/consolide/index.html`.
   Maquette : `<dossier>/ma-biere/etat.html`.
2. `etape-glisser` — Nugget glissé de 60′ vers 35′, doigt tenu, capture pendant le geste (gestes de
   `work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs`). Base jouée ; sa capture de référence :
   `base/captures/consolide-nugget-35-pendant.png`.
3. `etape-appui` — pendant l'appui long sur Nugget, à 250 ms (gestes de `controle-appui.mjs --etape`).
4. `fiche` — la fiche de Nugget ouverte. Base : `base/consolide/fiche.html` ou sa capture `consolide-fiche-390.png`.
   Maquette : l'appui long jusqu'à la fiche, ou `<dossier>/fiche/etat.html`.
5. `biere` — l'onglet Ma bière au repos. Base : `base/consolide/biere.html`. Maquette : `<dossier>/biere/etat.html`.
6. `biere-visee` — « + » sur Tropicaux (ligne ouverte), des deux côtés (gestes de `controle-visee.mjs`).
7. `suggerer` — Suggestions. Base : `base/captures/consolide-b-390.png` (et `fils15-s5-complexe/captures/q2b-b-390.png`
   en troisième colonne). Maquette : `<dossier>/suggerer/etat.html`.
8. `suggerer-toucher` — un toucher sur le premier picto de la première voie (gestes de `controle-traits.mjs`) : la
   maquette seule (la base n'avait pas ce geste ; le dire).
9. `comparer` — Base : `fils22-comparer/captures/r6a-premier-ecran.png`, et `fils21-choisir/captures/x3b-plans-390.png`
   en troisième colonne. Maquette : `<dossier>/comparer/etat.html`.
10. `dryhopper` — Base : `fils23-dryhopper/serie-a/captures/a1-390.png`. Maquette : `<dossier>/dryhopper/etat.html`.
11. `levure` — Base : `fils22-carte/captures/levure-etape-390.png` (choix encore ouvert). Maquette :
    `<dossier>/levure/etat.html`.
12. `substituer` — Base : `base/captures/consolide-substitution-390.png`. Maquette : `<dossier>/substituer/etat.html`.
Tous les chemins `base/…`, `fils…/…` sont sous `work/refonte-frontend/v4/ecran-1/`.

## La page : `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html`
- Écrite en HTML à la main (PUBLIER.md : jamais construite par un script), sur le modèle de la page la plus récente de
  `work/refonte-frontend/v4/outils/pages/` (feuille de style, visionneuse). Titre daté : « Côte à côte · 24.10 ».
- Images dans `img/` à côté (non versionnées), produites par l'outil.
- `#a-choisir` en tête : une ou deux phrases (« Votre base à gauche, la nouvelle version à droite, écran par écran »).
- Un bloc par état : son nom en mots du brasseur, les défauts qu'il touche (D107 à D121), puis base | maquette côte à côte
  (deux colonnes à l'ordinateur, l'une sous l'autre au téléphone ; 340 px rendus au moins), et une ligne « Écarts
  voulus » : ceux qui ont ses mots, cités.
- Lisible : `node scripts/agents/verifier-page.mjs <page> --page-lot --captures <préfixe>` → PAGE OK ; ouvrir les trois
  captures de la page (haut, page, ordinateur) en image (L12).

## Entrées
- `work/refonte-frontend/v4/outils/pages/PUBLIER.md` ; une page récente du même dossier pour le style.
- `work/refonte-frontend/v4/choix/ecrans.json` (ses choix, leurs captures) ; SPEC-BRASSEUR § 1 et DEFAUTS-RECURRENTS,
  lignes D107 à D121.
- Constructions pour la mise au point : `prototypes/houblons-v4/maquettes/parcours-p3/` (Comparer à jour) et
  `prototypes/houblons-v4/maquettes/parcours-d332792c/` (la version publiée). Chrome :
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, `puppeteer-core` du `package.json` de la racine.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs`
- `work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/**` (la page ; `img/` non versionné)
- `work/missions/2026-10-23-maquette-parcours/voies/p18-cote-a-cote/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17).

## Exigences transversales (recopiées, L05)
- Règle n° 1 : la page montre ses maquettes telles quelles, sans retouche ; un état que la base n'a pas se dit.
- L26 ; M10 ; textes à 14 px au moins, paragraphes de 45 mots au plus (verifier-page).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : l'outil, ses états joués ou repris d'une capture, les captures ouvertes (nommées) ; ce qui ne se joue
pas et pourquoi ; `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
