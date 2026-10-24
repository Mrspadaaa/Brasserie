# M4 — La vue d'ensemble des houblons pour un style

Lis d'abord `work/refonte-frontend/v4/tournoi/REGLES.md` (règles des auteurs), le contrat
de direction `.impeccable/surfaces/prototypes-houblons-v4-index-html.md`, puis **la
grammaire consolidée de M1** : `work/refonte-frontend/v4/tournoi/M1/consolide/index.html`
et son `NOTE.md`. Reprends sa grammaire (bande du style, verdicts) ; ton travail porte sur
la vue d'ensemble.

## La tâche du brasseur

« Je veux aussi comme pour l'une des versions de v5 Avoir une vue d'ensemble des houblons
pour le style ATTENTION ! Par exemple le côté agrumes pour une ipa est infiniment plus
subtil pour une cezc lager. Les échelles doivent être revu en fonction du style. »

La version de v5 qu'il cite est la carte Territoire (concept-2), qu'il a trouvée « une
sacrée dinguerie ». Tu ne la vois pas ; retiens son principe : une carte où sa bière et ses
houblons se placent, avec des directions et des zones exclues.

- **État par défaut : S3 du pack.** IPA (21A) : tous ses houblons du stock, du plus au
  moins adapté (`scenarios.S3.ranked` : rang, `fit` « usage attesté » ou « cohérent »,
  familles soutenues, conflits, raisons). Profils dans `stock`.
- **Deux lentilles : Carte et Liste.** Il passe de l'une à l'autre **sans perdre sa
  sélection** (un houblon touché dans la liste reste sélectionné sur la carte).
- **Changer de style** (au moins vers 3B, la lager tchèque, et 16D, la stout) : la vue se
  recompose, et les échelles changent avec le style. Le même houblon agrumes, qui se fond
  dans l'IPA, doit ressortir comme hors bande dans la lager. Les bandes sont dans
  `styles.<code>.families`. Pour la lager et la stout, il n'y a pas de classement tout
  fait : tu peux lire chaque houblon du stock contre les bandes du style (famille citée ou
  non, repère central contre la bande), en le disant.
- Les houblons épuisés (`exhausted`) restent visibles et marqués comme tels.

## Vérité des données, éliminatoire

- Les positions sur une carte se **calculent** depuis le pack (deux familles choisies
  comme axes, ou une projection décrite dans `NOTE.md`) ; jamais placées à la main.
- Profils : souvent `completeDomain` avec un repère `central` de confiance faible ; le
  modèle distingue surtout cité / non cité. Ne fais pas croire à une mesure fine.
- Une échelle de style non documentée doit le dire ; ici les trois styles le sont.

## Ta contrainte de forme

Deux formes imposées, une par mini-maquette ; traduis-la dans le monde de DESIGN.md.

## Sortie

`work/refonte-frontend/v4/tournoi/M4/pNN/index.html` et `NOTE.md`. Contrôle une fois :
`node work/refonte-frontend/v4/tournoi/outils/capture.mjs work/refonte-frontend/v4/tournoi/M4 pNN pMM`.
L'état au chargement est S3 (IPA), lentille de ton choix, un houblon sélectionné. Regarde
tes captures, corrige ce qui est cassé, puis arrête-toi.
