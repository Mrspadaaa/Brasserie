# Voie m6-suggerer-moment — Suggérer à 60′ comme au dry hop, dans son écran q2b

Agent : concepteur (Opus). C'est ce que le brasseur verra. Le livrable est une page de choix, faite de mini maquettes dans **son
vrai écran Suggérer**. Cette voie ne change rien dans l'app.

## Ses mots (26.10)
- « Attention, la suggestion doit être pour du 60' comme pour du dryhopping »
- « Est-ce que l'ia est bien présente pour la substitution ? Elle peut aussi être présente pour la suggestion. »
- Son choix d'écran pour Suggérer : q2b, « Ça oui, c'est effectivement l'un de mes choix ».
  - Registre : `work/refonte-frontend/v4/choix/ecrans.json`, entrée `suggerer`.
  - Capture : `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/captures/q2b-b-390.png`. Ouvre-la.
  - Règle n° 1 : sa maquette est la base. Rien n'est masqué ni remplacé. On n'ajoute que ce qui manque.

## Le diagnostic (voie g1, à lire : `voies/g1-suggerer-moments/RESULTAT.md` et `rapport.md` § 1 et § 2b)
- Le moteur choisit le moment en dur (10′, whirlpool, dry hop) : **aucun ajout à 60′**, et aucune carte « plus d'amertume ».
- q2b ne laisse pas choisir 60′ ou dry hop :
  - en vue Barres, le moment n'est qu'une étiquette de groupe ;
  - en vue Radar, le moment se décale à chaud seulement, par pas de 5′.
- Les nombres d'un ajout à 60′ existent déjà, dans `voies/g1-suggerer-moments/suggerer-60.json` (E1). Pour la 21C, il faut
  4,5 g de Polaris pour +10 IBU, avec l'α, l'usage, la cohumulone et le β de chaque houblon. Prends-les tels quels, et écris
  « ? » pour ce qui manque.

## Ce qui est demandé
Des mini maquettes dans la vraie app, par la méthode des voies m1, m3 et m5 :
- clone des nœuds voisins dans la page rendue, classes préfixées `m6s-…`, retirées après la capture ;
- modèles : `voies/m5-dryhopper-froid/capturer.mjs` et `voies/m3-listes-u4/capturer.mjs` ;
- l'écran : `?dev-local&etape=houblons`, `VITE_HOP_V4=on`, Suggérer sur la recette 21C (Nugget 20 g à 60′, Cascade 80 g en
  dry hop actif) ;
- le contrôle `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs` doit passer sur ton script.

### Variantes : au moins 6, diverses (L24, M13 en petit)
- **A · l'actuel** : la capture de l'app, sans ajout, en référence.
- **M1** : un groupe « Amérisant · 60′ » à côté du groupe « Dry hop · actif ». Le 60′ devient un geste, comme le dry hop.
- **M2** : une quatrième carte d'objectif, « Plus d'amertume · +n IBU », dans la forme des trois cartes : verdict, piste, IBU
  avant → après. Elle ouvre le groupe 60′.
- **M1 + M2 ensemble** : c'est la recommandation de g1.
- **M3** : trois puces « Quand ? » (60′ · 10′ et whirlpool · dry hop) qui filtrent les groupes. Au départ, les trois sont
  montrées, sans filtre posé d'office. Elle sert de contraste.
- **Au moins une idée à toi**, qui ne soit pas une variante des précédentes.
- **La puce IA** : la puce « classé par l'IA » de Substituer, posée sur q2b, dans la variante que tu préfères. Lis
  `src/ui/hopIndex/substituer/ia.ts` : la voie i2 est en cours, prends sa forme si elle existe, sinon dessine-la sobre. Montre
  aussi l'état ouvert de la phrase de l'IA, à un toucher d'une rangée.

Règles de dessin :
- « Pas de cockpit » ([[pas-de-cockpit]]) : au premier plan, un mot ou un nombre ; le détail se lit à un toucher.
- Sur une rangée de houblon, l'ordre du brasseur ([[penser-brasseur]]) : nom, α, rôle, arômes, moment et dose, puis l'IBU.
- Montre l'état ouvert de ta meilleure variante. Montre aussi la liste à 60′ : les 5 premiers de E1, avec la dose pour +10 IBU.

## Livrable
- `voies/m6-suggerer-moment/page.html`, une page de choix :
  - A en référence, vignettes côte à côte, la visionneuse des pages m3, m4 et m5 ;
  - en-tête d'une phrase : « Comment choisir 60′ ou dry hop dans Suggérer ? » ;
  - `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m6` doit rendre `PAGE OK`.
- `RESULTAT.md` : les variantes, les captures ouvertes, et ta préférence argumentée comme le brasseur la jugerait.
- Lis d'abord `.claude/rules/affinee-frontend.md`, DESIGN.md, `cerveau/brasseur/pas-de-cockpit.md` et le portrait du critique
  (`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`).

## Possède
Seulement `work/missions/2026-10-25-integration-houblons/voies/m6-suggerer-moment/`. Rien dans `src/`. Les fichiers de travail
vont dans `os.tmpdir()`. N'écris aucun code par heredoc ni par `node -e`.

Retour en une ligne.
