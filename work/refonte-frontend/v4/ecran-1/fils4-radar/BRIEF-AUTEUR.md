# Lot 4 · radars (écran 1) — brief auteur

Tu refais **seulement le radar** des trois parties, sur la **baseline p3** que le brasseur a
choisie. Écris en français. Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie
(chemins absolus). Texte avec barres obliques inverses ou accents graves : outil Write, jamais
Bash (`node -e` abîme les regex). Fichiers de travail dans un sous-dossier à toi du scratchpad.

## Ce que le brasseur a dit (mot pour mot)

- « C'est toujours n'importe quoi les spidergraph Radar graph il faut faire qqch.... »
- « Est-ce qu'il faudrait pas utiliser d'autres outils, framework, libraries pour ces radar ? »
- « Je comprends pas ces nouveaux screen, on avait établi une Baseline, ça différent
  complètement ? » → **hors du radar, rien ne change** (contrôle D26).
- Plus tôt : « C'est une catastrophe la vue radar ?? » ; et sa demande d'origine (R45) : « un
  par barre type intervalle de confiance et un type spidergraph/Radar chart. Pouvoir passer de
  l'un à l'autre, pas avoir les deux à la fois forcément. »

## Pourquoi les radars précédents étaient « n'importe quoi » (diagnostic du pilote)

1. Axes dans l'ordre du style : les familles fruitées dispersées, aucun lobe ne se forme.
2. 3 ou 4 séries en pointillés superposées : spaghetti.
3. Polygones cassés : les familles non situées faisaient zigzaguer la bière.
4. Bière en crans du style : la zone devient un disque uniforme qui ne dit rien.
5. Radar petit, libellés de 9 px gris.
**Étalon** : le radar de Beer Maverick, la référence du brasseur :
`work/refonte-frontend/v3/reference/beer-maverick/telephone/t3-radar-3-houblons.jpg` et
`11-fiche-target-arome.jpg` (9 axes en roue, silhouettes pleines translucides, pleine largeur,
libellés lisibles). Il a des données grossières lui aussi (entiers 0–5) : la lisibilité vient
du dessin, pas de la finesse des données.

## Lis (et rien d'autre)

1. `scratchpad\baseline-p03\README.md` puis le générateur qu'il décrit : **pars de lui**
   (copie dans ton sous-dossier). Le radar vit dans l'élément `data-composant="radar"` ; c'est
   la seule zone que tu changes, sur `biere-radar.html`, `suggestions-radar.html`,
   `comparer-radar.html`. Les 6 autres pages sortent identiques.
2. `scratchpad\libs-radar\README.md` : bibliothèques installées (Recharts — celle de l'app —,
   Nivo, ECharts en rendu SVG, d3-shape, motion) et la recette esbuild pour `file://`.
3. `work/refonte-frontend/v4/ecran-1/MODELE.md` (les objets ; « La levure ») et
   `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D18, D19, D24, D26).
4. Le pack `prototypes/houblons-v4/data/pack-mini-protos.json` (avec node) : `roueAromes`
   (ordre et noms courts des axes, s'il est arrivé ; sinon l'ordre ci-dessous),
   `S1.profilBiere` (niveaux 0–3, source), `S1.cibleStyle` (min–max en niveaux),
   `S1.voies[].profilApresNiveaux` et `deltaNiveaux` (en cours d'ajout : relis le pack juste
   avant d'écrire ; tant qu'ils manquent, dessine l'avant seul et dis-le), `S1.profilFiches`
   (houblons : niveau 0 non décrit, 1 cité, 2 marqué, avec sources/of). Aucun chiffre calculé
   dans la page.

## Contrat de chaque radar (contrôlé, D24)

`<svg data-radar data-objet="biere-cible|voies|houblons" data-axes="citrus,tropical,…">`
- **Axes** : familles dessinées, sens horaire depuis le haut, dans l'ordre de la roue
  `citrus, tropical, melon, stoneFruit, pomeFruit, berries, floral, green, herbal, spice,
  earthy, resin` (rotation ou miroir permis), au moins 5. Une famille sans valeur n'est
  **pas** un axe : elle se dit à côté (« non situées : … »).
- **Séries** : `data-serie="nom" data-valeurs="…"` alignées sur `data-axes`, sans vide ;
  `data-serie="zone"` pour la zone du style (haut de zone). **2 séries au plus par radar** ;
  3 ou 4 houblons → petits multiples (plusieurs svg, chacun ≥ 42 % de la largeur).
- **Échelles** : bière, zone et voies en intensité absolue **continue** 0–3 :
  `S1.profilBiereContinu`, `S1.cibleStyleContinu` (bas et haut de la zone),
  `S1.voies[].profilApresContinu` (en cours d'ajout ; à défaut, les niveaux entiers
  `profilBiere.level`, `cibleStyle` min–max, `profilApresNiveaux` — mais en entiers l'effet
  d'une voie disparaît souvent : Golding laisse le floral au niveau 1). Houblons en niveaux de
  citation 0–2. La zone se dessine du bas au haut (un anneau si le bas dépasse 0).
- **Dessin** : au moins une silhouette pleine translucide (opacité de remplissage 0,06–0,7) ;
  radar ≥ 75 % de la largeur ; libellés ≥ 11 px, dans l'écran, sans chevauchement.
- **Parties** : bière = ma bière (pleine) dans la zone du style (fond) ; la dégustation se
  distingue du prévu. Suggestions = avant et **une** voie à la fois (on passe d'une voie à
  l'autre d'un geste). Comparer = 2 à 4 houblons choisis.
- La bascule Barres / Radar reste celle de la baseline (`data-booster="lentille radar"`).
- Sous le radar, ce qui sert vraiment (ce qui distingue chaque série, un geste qui l'isole),
  pas du remplissage : mots ≤ 80, remplissage ≥ 0,80, un écran.

## Ta variante

Ton message te donne un numéro (pNN), une **température** et un **parti**. Tiède = le parti est
imposé (souvent une bibliothèque) ; chaud = libre, surprends ; froid = repars des idées
retenues. Une bibliothèque n'est pas une excuse : son rendu par défaut doit être réglé
(couleurs de la baseline, gris et un accent, police système, libellés).

## Pages et contrôle, avant de t'arrêter

`work/refonte-frontend/v4/ecran-1/fils4-radar/pNN/` : les 9 pages de la baseline (dont les 3
radars refaits) et `NOTE.md` (5 lignes : parti, bibliothèque et taille du script, ce qui est
réglé à la main, limites).

`node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils4-radar pNN [pMM] --mots=80 --fill=0.8 --boosters=4 --radar --recette --baseline=work/refonte-frontend/v4/ecran-1/fils3/p03`

Il doit imprimer `LOT OK`. Regarde les captures de tes 3 radars (`fils4-radar/captures/`) et
compare-les à l'étalon Beer Maverick. Trois passes au plus. Réponse finale : une ligne par
variante (parti, bibliothèque, mots et remplissage des 3 radars).
