# Voie pg-planches — une page par vue : onze mini maquettes côte à côte avec sa référence (D126)

- Mission : 2026-10-23-maquette-parcours
- Agent : concepteur
- Modèle : opus
- Niveau : conception (ce que le brasseur verra)
- Plafond : 120 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante

## Ses mots (24.10, soir, sur « Choix de vues · 24.10 »)
« Mais il y a très peu de mini maquettes ??? J'ai pratiquement aucun choix ?? Et j'ai pas du coté à cote » ; puis « Pas besoin
d'autant, représente moi aussi les mini maquettes déjà faites pour ces vues. Je dirais 11 par vue ». La page rejetée :
`work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/index.html` (sept sujets, une bande qui défile par choix, une
variante visible à la fois). Ne refais pas cette forme. SPEC-BRASSEUR § 1 « Trop peu de mini maquettes, pas de côte à côte » ; D126.

## Les pages (une par vue, écrites à la main, `work/refonte-frontend/v4/outils/pages/2026-10-24-planche-<vue>/index.html`, images dans `img/`)
Une **planche** : sa référence en premier, marquée (`data-reference`), puis ses onze mini maquettes (`data-variante`), toutes
visibles ensemble, sans bande ni défilement horizontal. À l'ordinateur (1280 px), trois par rangée au moins, chacune lisible
(340 px au moins). Au téléphone (390 px), deux par rangée en vignettes (`data-vignette`) qui s'ouvrent en grand au toucher ; en
grand, la référence se voit à côté ou d'un glissement. Légende : le nom en mots du brasseur, la chaleur, l'identifiant en petit,
une ligne sur ce qu'elle change (sa NOTE). `#a-choisir` en tête, au premier écran : ce qu'il choisit, en une phrase, et le canal :
« Commente la mini maquette que tu choisis (commentaire de l'artefact) : je lis les commentaires. » Un lien en pied vers la page
d'avant. Une balise `<nav data-autres-vues>` vide en tête : le pilote y mettra les liens des autres vues après publication.
Mode d'emploi : `work/refonte-frontend/v4/outils/pages/PUBLIER.md` (date au titre, texte ≥ 14 px, blocs ≤ 45 mots, thème blanc
D106). Pars de la feuille de style de `2026-10-24-choix-vues/index.html` (pas de ses bandes) ou de `2026-10-23-dryhopper-v0/`.

Tout de suite, les quatre vues dont les mini maquettes existent :
1. **dryhopper** — « Quand ajouter Idaho 7 ? » : référence a1 (`…/fils23-dryhopper/serie-a/passe3/captures/a1-premier-ecran.png`) ;
   les onze de la passe 4, dans l'ordre du conseil (`work/missions/2026-10-23-maquette-parcours/conseil-dh4/verdict.md`) : p4a4,
   p4b2, p4a3, p4b3, p4a2, p4b1, p4a6, p4a1, p4a5, p4b4, p4b5 (`…/fils23-dryhopper/passe4/captures/<id>-premier-ecran.png`,
   `-pendant.png` en grand).
2. **substituer** — « Lequel à la place de Nugget ? » : référence u4, son choix (`…/fils11-substitution/captures/u4-vue-390.png`) ;
   les cinq de la passe 3 (sbc1b, sbb7c, sbz7c, sbz6c, sbb5b ; `…/fils24-substituer/captures/<id>-60.png`, `-whirlpool.png` en
   grand), puis les six premières du classement du critique (`…/fils24-substituer/critique/SYNTHESE.md`, « ## Classement ») qui
   ne sont pas déjà là sous une autre passe (`v0-<id>.png` de `2026-10-24-choix-vues/img/`).
3. **fiche** — « Que sent ce houblon ? » : référence g1 (`…/ecran-1/base/captures/consolide-fiche-390.png`) ; les six de la passe
   (flc8b, flb3c, fla5c, flu2b, fld8b, flu6b ; `-nelson.png`, `-nugget.png` en grand), puis les cinq premières du classement
   (`…/fils24-fiche-liste/critique/SYNTHESE.md`) qui ne sont pas déjà là.
4. **graphes** — « Lequel te bloque ? » : ce n'est pas un choix de variantes, c'est sa question sur six graphes (gr1 à gr6, tels
   quels puis leurs deux lectures, `…/fils24-graphes/captures/`) : les six côte à côte, chacun marqué `data-variante`, sans
   référence à choisir (une `data-reference` : le graphe de sa base qu'il connaît, gr1).
Ensuite (le pilote te le dira quand les séries d126 et leur critique auront rendu) : **pastille**, **levure**, **analyse**, onze
chacune (les trois déjà faites et huit neuves de `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/`).

## Possède
`work/refonte-frontend/v4/outils/pages/2026-10-24-planche-*/**`, `work/missions/2026-10-23-maquette-parcours/voies/pg-planches/RESULTAT.md`.
Copie les images dans le `img/` de chaque page. Ne publie pas (le pilote publie).

## Critères
Dans `GATES.md` (les quatre premières pages). Ouvre les captures de `verifier-page` (haut, page, ordinateur) de chaque page (L12).
Réponse finale : une ligne.
