# Lot 18 · Une vraie baseline, en mini maquettes (#142, #133)

Maquettes statiques, en français. Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Écris seulement dans `work/refonte-frontend/v4/ecran-1/fils18-baseline/<ton langage>/` et dans `fils18-baseline/captures/`.

## Ce que le brasseur a dit (19.10, soir)

- Sur le lot 17 (jeu commun v1 plein, v2 trait, v3 duo) : « je vais choisir la variante 3 même si les 3 change très, trop peu. Regarde pour faire une vrai baseline avec mini maquettes. Soit créatif ».
- « Un appui long montre une vrai fiche de houblons... », et déjà le 19.10 : « Un appuie long ouvre sa fiche. Comme avant ».
- Avant cela :
  - « Tu t'es trop limité, m'eme au niveau des couleurs et tout... » ;
  - « j'aime bien les petit logo sapin fleur » ;
  - « "normaliser" l'affichage, les forme. couleur aromonisé ça coorectement » ;
  - « regarde aussi pour la standardisation, UX booster, petit icone et autres » ;
  - « Actuellement l'application est très textuel » ;
  - « il faut que ce soit visuelement parlant et frappant ! ».

Une **baseline**, c'est le langage visuel de tous les écrans houblons : surfaces, typographie, formes, place de la couleur, densité, style des graphiques, gestes. Le lot 17 n'a fait varier que les icônes. Ici, chaque langage doit être **franchement différent** des autres, au point qu'on les distingue d'un coup d'œil, en vignette.

## Mise à jour (19.10, soir) : 11 baselines, sur q2b repris

Le brasseur : « C'est effectivement qb2 reprise le mieux » ; puis : « Applique les variante sur qb2 reprise, chacune des 11 nouvelles baseline. Tu peux avoir des Baseline avec des choses en plus et en mois ».

1. **L'écran obligatoire, c'est q2b** (`fils15-s5-complexe/q2b/etat-b.html`, générateur `q2b/generateur-q2b.mjs`).
   - Chaque langage livre `lN/etat-b.html` : q2b dans son langage, avec le même contenu au départ.
   - S'y ajoutent l'appui long, qui ouvre la vraie fiche dans ce langage, et `lN/planche.html` : l'écran en mini, plus l'abécédaire.
2. **Ma bière, Comparer et `fiche.html` séparés deviennent facultatifs.** Ne les fais que si le temps le permet.
3. **Une baseline peut ajouter ou retirer des choses** par rapport à q2b : un élément en moins, un geste en plus, un autre ordre. Garde les contrôles verts, et écris dans la NOTE ce que tu as ajouté ou retiré, et pourquoi.
4. **Onze langages** au lieu de six. Les six premiers restent ; s'y ajoutent :
   - **l7 · Néon** : le bar, la nuit. Fond noir, les couleurs des familles qui luisent comme des enseignes.
   - **l8 · Typographique** : de grandes lettres, une grille noire franche, sans arrondis. La couleur ne sert qu'aux familles.
   - **l9 · Atlas** : une carte du goût. Les voies sont des routes, les familles des régions, et ma bière un point sur la carte.
   - **l10 · En moins** : le strict nécessaire. Ce qu'on peut enlever de q2b sans perdre la réponse, le reste à un toucher.
   - **l11 · En plus** : le brasseur expert. Plus de chiffres et de mini-graphes, les sources à portée, sans dépasser 70 mots au premier écran (les chiffres et les marques ne sont pas des mots ; les replis gardent le reste).
5. **Les contrôles** restent ceux de la liste ci-dessous, sur `etat-b.html` (et `controle-fiche` sur `etat-b.html`). Ceux de `biere.html`, `comparer.html` et `fiche.html` ne valent que si tu les fais.

## Priorité du projet (`.claude/rules/affinee-frontend.md`)

- La densité utile sur mobile : seulement l'utile au premier plan, le détail à un toucher, un chrome compact.
- À lire, pour leurs parties utiles :
  - `PRODUCT.md` ;
  - `DESIGN.md` (« Overview », « Colors », « Typography », « Dimensions compactes », « Interface ») ;
  - `docs/ui-compacte.md`, `docs/ux-boosters.md`.
- **L'app réelle est sombre** : surfaces charbon majoritaires, paille réservé à l'action principale, repères de rubrique (`DESIGN.md`). Toutes les maquettes houblons faites jusqu'ici sont claires. Un des langages au moins part de cette identité réelle.

## Les briques imposées (ne pas les réinventer)

- **Le jeu d'icônes v3 duo** : `fils17-standard/v3/planche.html`, à restyler selon ton langage si besoin. Ses règles restent : un seul trait d'icône, lucide-react pour les actions (`node_modules/lucide-react/dist/esm/icons/<nom>.mjs`).
- **Les tons des familles** : `fils17-standard/jetons-familles.json` (base, texte ≥ 4,6:1, fond). En thème sombre, recalcule un ton de texte lisible et dis-le dans la NOTE.
- **L'orangé #c2410c**, seulement pour « hors du style ».
- **Les couleurs des houblons** suivent le houblon sur tous les écrans ; ma bière n'a jamais une couleur de houblon.
- **Les données**, sans rien inventer :
  - Ma bière : `prototypes/houblons-v4/data/pack-mini-protos.json`, `scenarios.S1` (la stout 16D) ;
  - Suggestions : `fils15-s5-complexe/donnees/c1.json` (voies, `tout`, `fiches`, `crans`, `role`) ;
  - Comparer : les voies 1, 9 et 12 de c1, plus « ensemble » [1, 12] ;
  - la fiche : `ecran-1/base/consolide/fiche.html` et le pack des fiches (`ecran-1/base/generateur/`).
- **Le contenu des écrans retenus** : Suggestions = q2b (`fils15-s5-complexe/q2b/`), le radar de Comparer = un rendu du lot 16 (`fils16-radar-comparer/`, au choix), la fiche = g1 (la fiche actuelle de la base). Tu changes le langage, pas le contenu.

## Les six langages (ton message te donne les tiens)

- **l1 · Cave** : l'identité réelle de l'app. Le charbon, le paille pour l'action principale, le cuivre de la production ; des tons de famille lumineux sur fond sombre.
- **l2 · Carnet de brasseur** : du papier, de l'encre, des titres en serif ; des pictos duo comme dessinés ; des annotations sur la marge.
- **l3 · Étiquette** : des bandeaux de couleur francs, de gros chiffres, des badges, comme une étiquette de bière. Frappant.
- **l4 · Instrument** : un appareil de mesure. Filets fins, chiffres tabulaires, jauges et graduations ; la couleur seulement pour les données.
- **l5 · Tuiles** : des widgets empilés, comme un écran d'accueil ; chaque objectif ou houblon est une tuile, avec des profondeurs douces.
- **l6 · Jour de brassage** : tout se range le long du brassin (60′, 10′, whirlpool, dry hop, levure) ; c'est le temps du brassage qui organise l'écran.

Tu peux pousser plus loin ou inventer un geste propre à ton langage. Un booster du catalogue qui sert un récit est bienvenu.

## Livrable par langage

Dans `fils18-baseline/lN/` :
- les quatre écrans à 390 px : `biere.html`, `etat-b.html` (Suggestions), `comparer.html`, `fiche.html` ;
- `planche.html` : les quatre écrans côte à côte en mini, plus une rangée de l'abécédaire du langage (surfaces, texte, une icône d'action, un picto de famille, une piste au style, un bouton) ;
- `NOTE.md` : trois lignes, ce qui tient, ce qui casse, le pire contraste.

**L'appui long ouvre la vraie fiche** : sur `etat-b.html` et sur `comparer.html`, un appui long de 500 ms sur un nom de houblon (`data-houblon`) ouvre la fiche g1 de ce houblon, dans ton langage. Elle a le même contenu que la fiche de la base :
- α et rôle ;
- la bande des carrés étiquetée ;
- la roue « N/M » ;
- les actions Ajouter et Comparer ;
- les replis.

Un toucher court garde son action. Un survol de 750 ms ouvre la fiche à la souris, et Échap ou « fermer » la referme. La convention du contrôle D25 est en tête de `tournoi/outils/controle-fiche.mjs`.

## Contrôles (tous à OK), puis regarde chaque capture

Avec `O = work/refonte-frontend/v4/tournoi/outils` et `D = work/refonte-frontend/v4/ecran-1/fils18-baseline` :

1. Captures, pour chaque écran `E` :
   `node O/capture-page.mjs D/lN/E.html D/captures/lN-E-390.png 1688`.
   Puis la planche : `node O/capture-page.mjs D/lN/planche.html D/captures/lN-planche.png 1400`.
2. `node O/mots-premier-ecran.mjs D lN --max=70 --page=E.html`, pour chaque écran.
3. `node O/controle-couleurs.mjs D lN` (l'écran Suggestions).
4. `node O/controle-au-style.mjs D lN --pages=biere.html,etat-b.html,comparer.html,fiche.html`.
5. `node O/controle-standard.mjs D/lN/biere.html D/lN/etat-b.html D/lN/comparer.html D/lN/fiche.html`.
6. `node O/controle-sens-survol.mjs D lN --pages=biere.html,etat-b.html,comparer.html,fiche.html`.
7. `node O/controle-fiche.mjs D lN --pages=etat-b.html,comparer.html` : l'appui long ouvre la vraie fiche.
8. Sur `etat-b.html`, avec `<html data-cas="c1">`, comme q2b :
   - `controle-fil6.mjs D lN --objet=suggestions --pages=etat-b.html` ;
   - `controle-autres-ajouts.mjs D lN --donnees=work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees` ;
   - `controle-moments.mjs D lN` ;
   - `controle-ma-biere.mjs D lN` ;
   - `controle-usage-intensite.mjs D lN` ;
   - `controle-gros-blocs.mjs D lN`.

   Pour les trois contrôles qui lisent les données (moments, usage-intensite), ajoute aussi `--donnees=work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees`.
9. Les contrastes : chaque texte atteint au moins 4,5:1 sur son fond réel. Mesure-le, et écris le pire cas dans la NOTE.

Réponse finale : une ligne par langage (ce qui tient, ce qui casse, les contrôles).
