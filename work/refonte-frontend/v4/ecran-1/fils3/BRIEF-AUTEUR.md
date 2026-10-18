# Variantes de p3, lot 3 — écran 1 (brief auteur)

Tu fais une **variante de p3**, le fil de fer que le brasseur a jugé « le mieux de loin du
lot », en y greffant ce que ton message te désigne. Écris en français. Répertoire :
C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus). Texte avec
barres obliques inverses ou accents graves : outil Write, jamais Bash. Fichiers de travail
dans un sous-dossier à toi du scratchpad.

## Ce que le brasseur a dit (à respecter mot pour mot)

- « Un mélange entre p2 p3 p4 semblerait bien. » ; « P3 serait même le mieux de loin du
  lot. » ; « il faudrait aussi ibu par houblon ( genre 5g -> 20ibu en plus) » ; « Type
  d'ajouter (à froid, voilà, ect et quand) » (« voilà » : whirlpool).
- Sur le radar du lot 2 : « C'est une catastrophe la vue radar ?? ».
- Puis : « Je pense qu'il y a confusion entre, ce que j'ai actuellement dans ma bière, son
  profil. Le style de la bière, un target. La comparaison manuel entre plusieurs houblons.
  Et la comparaison par suggestions de l'outils ».

## Lis (et rien d'autre)

1. **`work/refonte-frontend/v4/ecran-1/MODELE.md`** : les quatre objets, leurs échelles, où
   ils vivent. C'est la règle de cet écran.
2. `work/refonte-frontend/v4/ecran-1/fils2/BRIEF-AUTEUR.md` (règles du fil de fer et
   conventions `data-role`, `data-booster`) et `PRIORITE.md` (« Ordre de l'écran »).
3. **p3** : `work/refonte-frontend/v4/ecran-1/fils2/p03/` et ses captures
   `fils2/captures/p03-*.png` ; son générateur est dans le scratchpad
   `…\scratchpad\fils2-p03p04\` (copie-le dans ton sous-dossier, ne le modifie pas en place).
4. Le ou les fils de fer d'où viennent tes greffes (`fils2/pNN/`, leur `NOTE.md`, captures).
5. `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D1 à D19).
6. Le pack `prototypes/houblons-v4/data/pack-mini-protos.json` (extrais avec node) :
   `S1.recetteHoublons` (IBU par moment et par gramme), `S1.ajoutsRapides` (avec
   `catalogue` à acheter), `S1.achats`, `S1.gouts` et `S1.voiesSansHoublon`, `moments`,
   **`S1.profilBiereCrans`** (objet 1, en crans du style : 0 à 3 dans la bande, 4 au-dessus,
   vide = non situé, avec la source dégusté ou prévu), **`S1.cibleStyleCrans`** (objet 2,
   avec `visee`), `S1.voies` et leur **`profilApresCrans`** et **`deltaCrans`** (objet 4),
   `S1.profilFiches` (objet 3, citations 0 à 2), `S1.readingSummary`, `S1.horsModele` ; et
   `scenarios.S4` (recette vide), `scenarios.S5` (recette chargée). Les champs en crans
   arrivent dans le pack pendant que tu lis : relis le pack juste avant d'écrire les vues.
   Aucun chiffre ne se calcule dans la page : tout vient de ces champs.

## Les pages, une par vue

`work/refonte-frontend/v4/ecran-1/fils3/pNN/` :

| Page | Contenu |
|---|---|
| `index.html` | **L'étape Houblons** (modèle Malts) : houblons de la recette avec IBU, type d'ajout et moment ; ajout en un toucher avec « + N IBU » ; une ligne qui résume ma bière face à la cible et ouvre le panneau |
| `biere.html` | Partie **Ma bière et la cible** (`data-partie="biere"`), en Barres : par famille, mon niveau (et sa source : dégustation ou modèle) face à la zone cible |
| `biere-radar.html` | La même partie en Radar (`data-objet="biere-cible"`) : séries « ma bière » et « cible » |
| `etat-b.html` | Partie **Suggestions** (`data-partie="suggestions"`), après « + floral, − résineux » : les voies du moteur, et pour 2 ou 3 voies l'avant / après face à la cible |
| `suggestions-radar.html` | La même partie en Radar (`data-objet="voies"`) : « avant » et 1 à 3 voies « après » |
| `comparer.html` | Partie **Comparer des houblons** (`data-partie="comparer"`), 2 à 4 houblons choisis, en Barres : par famille, ce que disent les fiches (« N/M ») |
| `comparer-radar.html` | La même partie en Radar (`data-objet="houblons"`) : 2 à 4 silhouettes |
| `cas-k2.html` | L'étape Houblons pour **une recette sans houblon** (`scenarios.S4`) : l'étape vide n'est pas vide |
| `cas-k3.html` | L'étape Houblons pour **une recette chargée** (`scenarios.S5` : 60′, 10′, whirlpool, à froid J+3) |
| `NOTE.md` | 5 lignes : greffes et leur source pNN, ce qui reste de p3, ce qui est replié |

Les cas de figure sont décrits dans `work/refonte-frontend/v4/ecran-1/CAS.md` ; les autres
confusions résolues (ma visée et la zone du style, dégusté et prévu, ajout et variété, voie et
ajout manuel, stock, à racheter et à acheter) sont dans `MODELE.md` et s'appliquent ici.

Les trois parties sont à un toucher l'une de l'autre (onglets ou équivalent) ; chacune a sa
bascule Barres / Radar (`data-booster="lentille radar"`). Chaque radar marque
`<svg data-radar data-objet="…">` et ses séries `data-serie="nom" data-valeurs="…"` (12 valeurs
dans l'ordre du style ; vide = non situé).

## Exigences communes

IBU par houblon (D16) ; type d'ajout et moment (D17) ; ajouts rapides selon le moteur ;
**le stock informe sans limiter** (D21 : « je fais une recette puis ensuite j'achète les
ingrédients, souvent pas présent ») : chaque ajout dit « en stock », « manque N g » ou « à
acheter », les ajouts proposés incluent des houblons à acheter (ou un filtre Stock / Tout,
`data-role="filtre-stock"`), et une **liste d'achats** (`data-role="achats"`) ; **mes goûts**
(D20 : « je peux goûté d'autres bière que les miennes et pas aimer un houblon ») : un geste
`data-role="gout"` (aimer, neutre, exclure) là où un houblon apparaît, et les suggestions
en tiennent compte (un houblon exclu disparaît des voies ou est marqué) ; défauts de p3 corrigés (plus de « null », cible à glisser,
effet de l'ajout visible ou « non établi ») ; **la levure** (D22, section « La levure » de
`MODELE.md`) : sur l'étape, une ligne `data-role="levure"` (« SafAle US-05 · caractérisée »,
`S1.yeast`) ; sur `cas-k3.html`, l'ajout à froid en fermentation active porte
`data-role="biotransformation"` avec ses signaux sans chiffre (« biotransformation possible,
non quantifiée » ; les signaux détaillés arrivent dans le pack : `signauxLevure` s'il est
présent) ; gris et un accent, police système.

## Contrôle, avant de t'arrêter

`node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils3 pNN [pMM] --mots=80 --fill=0.8 --boosters=4 --radar --recette`

Il doit imprimer `LOT OK`. Regarde tes captures (`fils3/captures/`). Trois passes au plus.
Réponse finale : une ligne par variante (greffes, mots, remplissage, boosters).
