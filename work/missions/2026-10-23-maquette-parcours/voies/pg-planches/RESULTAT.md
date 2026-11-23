OK — « Planches · 24.10 » v3 : sept vues dans sa disposition, retouches placées, contrôles verts

## Version 3
- Même page : `work/refonte-frontend/v4/outils/pages/2026-10-24-planches/index.html`, avec `img/` (images ajoutées des petits choix, des jeux courts, de d121 et des retouches).
- Trois rangées remplies, chacune avec sa référence (la capture de SON choix, chemin écrit sous le nom de la rangée) puis onze vues : les trois têtes du critique d'abord (pastille « en tête »), puis le reste, chacune avec la pastille de chaleur et le verdict.
  - **La pastille « ~ simulé »** : r6a (`fils22-comparer/captures/r6a-premier-ecran.png`, en grand aussi `r6a-toucher-390.png`) ; pva2, pvz2, pvz3 | psa, psb, psc (accepté, corrigé), pva1, pva3, pva4, pvz1, pvz4. La vignette montre la pastille touchée, car les huit repos sont r6a au pixel (VERDICTS).
  - **Le levier levure** : q2b (`fils15-s5-complexe/captures/q2b-b-390.png`, en grand aussi `choix/etats/captures/etat-sugg-levure-choisie.png`) ; lsz1, lsz4, lsa3 | lva, lvb (accepté, corrigé), lvc, lsa1, lsa2, lsa4, lsz2 (rejeté, refait, pas rejugé), lsz3.
  - **L'entrée de l'analyse** : base v4.10 (`2026-10-24-d121/img/base.png`, en grand aussi `base-profil.png`) ; ana4, anz1, anz3 | A (version du 24.10), B, C (sans verdict), ana1, ana2, ana3 (rejeté, refait, pas rejugé), anz2, anz4.
- Retouches, pastille « retouche » plus chaleur et verdict, placées juste après l'original, dans l'ordre du critique (ret-critique) :
  - p4b2f (en tête), p4b2e, p4b2d après p4b2 ;
  - flb5b (en tête), flb5d, flb5c après flb5 ;
  - u4e5 (en tête), u4e4, u4e1, u4e2 après « u4 enrichi ». Il s'agit de la vignette r9 · D127 qu'une autre main a ajoutée dans la page pendant mon travail ; je l'ai gardée et j'ai rangé u4e derrière elle, pas derrière sbc1b. u4e3 relancé : ses nouvelles captures (17:47) et sa NOTE passe 2 étaient là, je l'ai donc ajouté en « rejeté, refait », pas rejugé.
- Le sommaire en tête liste les sept vues, et les pastilles « retouche » et « en tête » sont dans la légende.
- Critère 1 : `verifier-page.mjs … --page-lot --captures …/verif` → `PAGE OK (91 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Critère 2 : `controle-page-choix.mjs … --min=5` → dryhopper 14, substituer 17, fiche 14, graphes 6, pastille 11, levure 11, analyse 11 variantes ; partout 6 par rangée à 1280 et 3 à 390 ; `PAGE-CHOIX OK (7 choix)`.
- Captures ouvertes : `verif-haut.png`, `verif-page.png` (390 × 15 695), `verif-ordinateur.png`, plus les rangées pastille, Substituer et analyse à 1280 px. Visionneuse jouée sur lsa3 : 0 erreur, 4 panneaux (repos, toucher, q2b, son groupe levure).
- Risque : au téléphone, la page fait 15 695 px, près de la limite de 16 384 px de la capture pleine page. Une rangée de plus passera la limite : il faudra une seconde page, ou vérifier sans pleine page.
- DÉCISION À PRENDRE : lsz2, ana3 et u4e3 sont montrés « rejeté, refait » sans nouveau verdict. Faut-il un passage du critique avant de publier ?



## La page « Planches · 24.10 » (suite du pilote, disposition qu'il aime)
- Source : `work/refonte-frontend/v4/outils/pages/2026-10-24-planches/index.html`, avec `img/` (93 images copiées des quatre planches).
- Une rangée par vue : Dryhopper, Substituer, la liste de la fiche, les graphes. Le nom, la question, la note et le chemin de la capture de référence sont à gauche (au téléphone : au-dessus). Viennent ensuite la référence, cerclée, et ses onze mini maquettes, six les graphes, en vignettes serrées : 6 par rangée à 1280 px, 3 à 390 px, avec retour à la ligne, sans bande. Sous chacune : la pastille (ta référence, froide, tiède ou chaude ; pour les graphes, le verdict du critique), le nom, l'identifiant, une ligne en italique.
- La même visionneuse ouvre chaque vignette en grand, à côté de sa référence : en paires pour Dryhopper, en rangée pour les autres, et pour chaque graphe a, b, c puis sa capture choisie.
- Trois rangées « à venir », sans data-choix : la pastille, le levier levure, l'entrée de l'analyse.
- Critère 1 : `verifier-page.mjs … --page-lot --captures …/2026-10-24-planches/verif` → `PAGE OK (43 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Critère 2 : `controle-page-choix.mjs … --min=5` → dryhopper, substituer et fiche : `OK (11 variantes, 6 par rangée à 1280, 3 à 390)` ; graphes : `OK (6 variantes, 6 par rangée à 1280, 3 à 390)` ; `PAGE-CHOIX OK (4 choix)`.
- Captures ouvertes : `…/2026-10-24-planches/verif-haut.png`, `verif-page.png`, `verif-ordinateur.png`. Visionneuse jouée (sbc1b à 1280 px, gr4 à 390 px) : 0 erreur, 3 et 4 panneaux.

## Les quatre planches séparées (première demande)

## Fichiers écrits
- `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-dryhopper/index.html` + `img/` (24) : a1, puis p4a4, p4b2, p4a3, p4b3, p4a2 | p4b1, p4a6, p4a1, p4a5, p4b4, p4b5 (ordre du conseil dh4).
- `…/2026-10-24-planche-substituer/index.html` + `img/` (23) : u4, puis la passe 3 (sbc1b, sbb7c, sbz7c, sbz6c, sbb5b) | six du panel (sbc3, sbu7, sbb4, sbc4, sbu1, sbb1 ; rangs 1, 4, 6, 7, 9, 10 de SYNTHESE, les autres du top 10 déjà là sous leur passe).
- `…/2026-10-24-planche-fiche/index.html` + `img/` (22) : g1, puis la passe (flc8b, flb3c, fla5c, flu2b, fld8b, flu6b) | cinq du panel (fla4, fla1, flb5, flz4, flz5 ; rangs 7 à 11).
- `…/2026-10-24-planche-graphes/index.html` + `img/` (24) : la base v4.10 (Ma bière) en référence, puis gr1 à gr6 (a en grand, b et c en vignettes sous chacun).
- Captures de contrôle `verif-haut.png`, `verif-page.png`, `verif-ordinateur.png` dans chaque dossier.

Forme : une grille, trois par rangée à 1280 px (377 px chacune), deux par rangée à 390 px (vignettes `data-vignette`). Rien ne défile en largeur. Au toucher, une visionneuse montre chaque état de la mini maquette à côté de sa référence. Sur ordinateur, elles sont côte à côte ; au téléphone, on glisse. Dryhopper : premier écran et pendant le geste, chacun en paire avec a1. Substituer : à 60′, au whirlpool, puis u4 entier. Fiche : Nugget, Nelson Sauvin, puis g1. Graphes : a, b, c, puis la capture choisie de cet écran-là. `#a-choisir` est au premier écran avec la phrase du canal mot pour mot, `<nav data-autres-vues>` est vide en tête, et le pied renvoie à « Choix de vues · 24.10 ».

## Références (précision D128 du pilote) : la capture de SA maquette, chemin écrit dans la légende
- a1 : `ecran-1/fils23-dryhopper/serie-a/passe3/captures/a1-premier-ecran.png` (en grand aussi `a1-toucher-390.png`). Le registre dit « ouvert », a1 est provisoire : la légende le dit (« Ton plancher provisoire ; ton choix reste ouvert (a1, b4, d8, e5, g1) »).
- u4 : `ecran-1/fils11-substitution/captures/u4-vue-390.png` (= registre).
- g1 : `ecran-1/base/captures/consolide-fiche-390.png` (= registre).
- Graphes : les « a » de gr1 à gr6 sont rendus depuis la maquette jouable (NOTE des gr), ils ne sont donc pas ses captures. La référence de la planche est donc devenue sa base v4.10, `ecran-1/base/captures/consolide-biere-390.png`. gr1 n'est plus `data-reference`. En grand, chaque graphe a sa capture choisie : gr1, gr2 et gr3 la base v4.10 (barres, absolu, radar : `consolide-biere-390`, `-absolu-390`, `-radar-390`), gr4 g1, gr5 q2b (`fils15-s5-complexe/captures/q2b-b-390.png`), gr6 r6a (`fils22-comparer/captures/r6a-premier-ecran.png`).

## Sorties décisives
- G1 : `PAGE OK (12 images chargées, lisible à 390 et 1280 px, sans erreur)` ; `dryhopper : OK (11 variantes, 3 par rangée à 1280, 2 à 390)` ; `PAGE-CHOIX OK (1 choix)`
- G2 : `PAGE OK (12 images …)` ; `substituer : OK (11 variantes, 3 par rangée à 1280, 2 à 390)` ; `PAGE-CHOIX OK (1 choix)`
- G3 : `PAGE OK (12 images …)` ; `fiche : OK (11 variantes, 3 par rangée à 1280, 2 à 390)` ; `PAGE-CHOIX OK (1 choix)`
- G4 : `PAGE OK (19 images …)` ; `graphes : OK (6 variantes, 6 par rangée à 1280, 4 à 390)` ; `PAGE-CHOIX OK (1 choix)`
- Visionneuse jouée dans Chrome (390 et 1280 px) sur p4a4, sbc3, flb3c, gr3 et gr6 : 0 erreur de script, 3 ou 4 panneaux, la référence cerclée d'ambre.
- `git status` : rien hors des quatre dossiers `2026-10-24-planche-*` (`pistes-l5f.png` à la racine date d'avant la voie).

## Captures (ouvertes)
`work/refonte-frontend/v4/outils/pages/2026-10-24-planche-{dryhopper,substituer,fiche,graphes}/verif-{haut,page,ordinateur}.png`

## Prédiction
« Là oui, je vois tout d'un coup et je peux comparer à ma réf. » Risque : sur la planche des graphes, il voit que sa base v4.10 dit « Boisé et résineux trop marqué · 6 au style » et le « a » de la maquette jouable « Résineux trop marqué · 7 au style ».

DÉCISION À PRENDRE : Dryhopper reste « ouvert » au registre (a1, b4, d8, e5, g1). La planche compare les onze à a1 seul, comme le demande la VOIE ; b4, d8, e5 et g1 n'y figurent pas. Faut-il les ajouter en références secondaires ? Graphes : l'écart de données entre la base v4.10 et la maquette jouable (Boisé, 6/5 contre 7/4) est à trancher par le pilote avant publication.
CONNAISSANCE : le dossier scratchpad est partagé avec d'autres sessions : un `cap.mjs` du même nom y a été remplacé pendant la voie. Nommer ses scripts avec un préfixe de voie.
LEÇON PROPOSÉE : aucune
