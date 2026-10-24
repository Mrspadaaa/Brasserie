OK — série rcb : quatre recherches avancées (phrase, plan α × huile, comme X, élimination), vraies données, PANEL OK

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-recherche/rcb1/` : `etat.html`, `NOTE.md`, `generer.mjs`, `donnees-rcb.mjs`
  (318 variétés, familles par les termes V5.5, mots hors des 12 traduits, stock, remplaçants du pack), `commun-rcb.mjs`
  (thème, étape, lentille, légende, barre des sorties, fiche courte à l'appui long), `capturer.mjs` (série).
- `rcb2/`, `rcb3/`, `rcb4/` : `etat.html`, `NOTE.md`, `generer.mjs` (données et pièces communes importées de `../rcb1/`).
- `captures/rcb{1,2,3,4}.png` (390 × 844 ×2), `captures/rcb{1,2,3,4}-fiche.png` (appui long), `captures/rcb{1,2,3,4}-page.png`.
- Scripts de travail dans le scratchpad (`patch-rcb.cjs`, `patch2-rcb.cjs`, `patch3-rcb.cjs`, `explore*.mjs`, `debug-fiche.mjs`).

## Les quatre concepts (chaleur, idée, cas)
- **rcb1 tiède — « Tape comme tu parles »** : un seul champ, la demande écrite comme on la dit, soulignée à la couleur
  de ce qui est compris (famille, α, moment, « pas de ») ; « passion, α < 12, dry hop, pas d'herbacé » → 18 houblons,
  sous chaque nom ce qu'il dit en plus de la demande (vin blanc, caramel, nectar…).
- **rcb2 tiède — « Le champ α × huile »** : le catalogue entier sur un plan (α en travers, huile en hauteur), un cadre
  au doigt, Galaxy et Saaz en repères, cercle noir = mon stock ; cadre α 8–14, huile ≥ 2 → 40 houblons.
- **rcb3 chaude — « Comme Nelson Sauvin »** : bandeau noir « Lui seul : vin blanc, groseille à maquereau… », puis trois
  regards : remplaçants calculés (score 91…85, arôme · huiles · amer), mon stock (Cascade 74, Motueka 61, Target 61),
  ceux qui disent ses mots (Hallertau Blanc 4/4, 30 g).
- **rcb4 chaude — « Par élimination »** : on raye des colonnes de familles (résineux, épicé, végétal, pépins), le compte
  descend (78 restent sur 297 décrits), matrice d'un point par famille citée, colonnes 16D entourées.

## Critères
- G1 `concepts.mjs rcb1 rcb2 rcb3 rcb4` → `CONCEPTS-BIEN-4`.
- G2 `controle-pictos-trait … --page=etat.html` → `TRAIT OK` (67, 138, 40, 12 pictos ; 0 faute).
- Baseline `controle-commun … --page=etat.html --sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste,
  fiche 4/4, standard, trait, legende, parlant, brutes). Trois essais : (1) couleurs rcb1/rcb3, contraste des « · » en
  gris clair, fiche fermée par le clic synthétisé de l'appui long, rayon 22 px du champ, « + » à 0,8 px ; (2) fiche de
  Nelson Sauvin sans ligne d'arômes (familles déclarées sans mot → « classé ») ; (3) OK.
- `controle-panel` (quatre captures) → `PANEL OK` : remplissage médian 0,70, 0 sous 0,50, ressemblance 0,86, 0 doublon
  (premier essai 0,48 : lignes resserrées, bouton « + » à 24 px, trait de la planche #dcdce3).
- Indicatifs, recopiés dans les NOTE : `mots-premier-ecran --max=70 --modere` → MOTS ECHEC (141 à 221 mots, 74 à 118
  hors données : des listes de 12 à 18 lignes) ; `controle-une-question` (D98) non applicable à un écran de recherche.
- `git status --short` : rien hors de « Possède » (le `pistes-l5f.png` de la racine est antérieur à la voie).

## Captures ouvertes
`captures/rcb1.png`, `rcb2.png`, `rcb3.png`, `rcb4.png` (chacune regardée après la dernière génération) ; `rcb1-fiche.png`
(fiche de Tango), `rcb3-fiche.png` (Nelson Sauvin). Le plan de rcb2 regardé trois fois (étiquettes replacées).

## Prédiction
Il garde rcb2 (« on voit tout de suite Galaxy et Saaz, pas mal ») et le bandeau et la section « disent ses mots » de
rcb3 (« ça c'est très bien, le score voit pas le vin blanc »), trouve rcb4 « intéressant mais un peu bordélique » et
dit de rcb1 « pas mal mais trop de texte ».

DÉCISION À PRENDRE : aucune (le trait de la série passe de #e3e5eb à #dcdce3, celui de la planche v3 : à confirmer
comme valeur de la baseline, DESIGN.md ne tranche pas).

CONNAISSANCE : les familles de 318 variétés se recalculent hors moteur avec les termes de
`src/data/hopExtrapolationV4Bootstrap.json` (axes[].terms) et la règle de hopDescriptorEvidence (mot entier, négation
exclue, fiches hors « beer ») ; Nelson Sauvin n'a que des familles déclarées (agrumes, épicé) sans mot, et 16 houblons
disent au moins un de ses quatre mots (Hallertau Blanc les quatre). `controle-couleurs` ne voit pas les couleurs des
pictos `<use>` : une page à pictos seuls compte 0 teinte.

LEÇON PROPOSÉE : `controle-panel` lit un gris clair (#e3e5eb) comme du fond (seuil 60 sur un fond estimé à 248) :
les hairlines et fonds de la baseline doivent être au --trait de la planche v3 (#dcdce3), sinon une page dense
mesure vide.

## Passe 2 (retour du critique, rcb3 et rcb4 refaits en place à la demande du pilote)
- rcb3 : « Disent ses mots » en premier (Hallertau Blanc 4/4, 30 g), puis le stock et les calculés nommés « 12 familles seulement » ; bandeau « Lui seul » intact ; rôle du fournisseur d'abord, α du lot.
- rcb4 : « sucre », « doux » traduits ; Strata aromatique (fournisseur) ; colonnes rayées en un trait ; noms en entier (130 px) ; α du lot.
- Données (`donnees-rcb.mjs`) : rôle du fournisseur avant la règle de l'α (rcb1 et rcb2 en héritent : Strata aromatique sur rcb2).
- Rejoués : `concepts.mjs` → CONCEPTS-BIEN-4 ; `controle-pictos-trait` → TRAIT OK ; `controle-commun rcb3 rcb4 --sans=mots` → COMMUN OK ; `controle-panel` (4 captures) → PANEL OK (0,69). Captures `rcb3.png`, `rcb4.png` rouvertes.
