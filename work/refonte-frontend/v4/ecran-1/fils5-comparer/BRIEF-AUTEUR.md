# Lot 5a · Comparer (écran 1) — brief auteur

Tu refais **la partie Comparer** (Barres et Radar), et rien d'autre. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash (`node -e`
abîme les regex). Fichiers de travail dans un sous-dossier à toi du scratchpad
(`C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\055d83f7-e384-467e-9f02-749828cb09f6\scratchpad\`).

## Ce que le brasseur a dit (mot pour mot)

- Sur la v3 : « Les deux autres c'est n'importe quoi... » (Suggestions et Comparer).
- Ses captures du comparateur de Beer Maverick à l'appui (Fuggle, Citra, Idaho 7) : « J'ai
  d'ailleurs donné des exemples concrets... C'est pas possible de faire moins bien... » ;
  « D'ailleurs, il faut des intervalles de confiance » ; « Beer Maverick pour le mode Comparer,
  c'est une des base, il faut faire mieux, pas moins bien ou la même chose... ».
- « Ces échelle sont un peu 'abstraite' et peuvent même changé d'un même houblon à l'autre
  suivant l'année terroir ou autre » → montrer les plages, et la valeur de **mon lot** dessus.
- Sa demande d'origine (R45) : « un par barre type intervalle de confiance et un type
  spidergraph/Radar chart. Pouvoir passer de l'un à l'autre ».
- Toujours : penser en brasseur (α, rôle, arômes, moment, puis IBU ; le stock en icône) ;
  « Je comprends pas ces nouveaux screen, on avait établi une Baseline » → hors de Comparer,
  rien ne change (D26).

## Lis (et rien d'autre)

1. `work/refonte-frontend/v4/ecran-1/CADRAGE-SC.md` (la décision de Comparer, le plancher, le
   « mieux », les données).
2. Les captures de Beer Maverick du brasseur :
   `work/refonte-frontend/v3/reference/beer-maverick/telephone/t3-radar-3-houblons.jpg`,
   `t4-alpha-beta-ratio.jpg`, `t5-cohumulone-huiles-totales.jpg`, `t6-huiles-detail.jpg`, et
   `../constats.md` § 1 bis (ses défauts).
3. L'en-tête de `work/refonte-frontend/v4/tournoi/outils/controle-comparer.mjs` : **le contrat
   DOM** que ta page doit porter (attributs `data-…`), et ce qui est vérifié.
4. La baseline : `scratchpad\baseline-lot5\generateur\README.md`, puis le générateur. **Pars de
   lui** (copie-le dans ton sous-dossier ; `ROOT` est absolu, `node build.mjs --out=<dossier>`
   écrit `<dossier>/consolide/*.html`). Comparer vit dans `partieComparer` (`commun.js`), déjà
   marquée `data-composant="comparer"`, et dans `RADAR.houblons` (`radar.js`). La fiche validée
   par le brasseur (« Pour la fiche, on est bon ») est dans `fiche.js` : `blocAlpha` (α, lot,
   réglette, rôle), `tableMoments`, `blocArome` ; **réutilise ses calculs** (rôle, IBU par les
   tables du pack) plutôt que d'en écrire d'autres.
5. Les fiches : `prototypes/houblons-v4/data/pack-fiches.json` (dans la page : `D.fiches`) :
   `alpha.sources` (min, max, année, source), `alpha.retenu` (valeur du lot quand `from`
   contient « stock »), `beta.sources`, `huiles.totale.sources`, `huiles.composants`
   (myrcène… parfois `null`), `aromes` (citations : 0 non décrit, 1 cité, 2 marqué ; `sources`
   sur `of`), `ibuParGramme`, `stock`, `descripteurs`.

## Le cas

Recette S1, stout export 16D, 20 L, DI 1,066, 60′ ; Nugget 46 g à 60′ (59,7 IBU). Le brasseur
la trouve trop résineuse et cherche par quoi remplacer Nugget. Comparés : **Nugget, East Kent
Goldings, Fuggle** (déjà réglés dans la baseline). Un 4e houblon s'ajoute d'un geste.

## Le contrat (contrôlé : `controle-comparer.mjs`, D51 et D53)

Sur `comparer.html` (lentille Barres) **et** `comparer-radar.html` (lentille Radar) :

- **Plancher Beer Maverick** : α, β, huiles totales en **barres-plages** pour chaque houblon
  (`[data-plage]` : piste, segment de min à max, trait central si tu as un centre, la plage
  écrite), même piste et même échelle dans une mesure ; bornes = **réunion des sources** de la
  fiche ; rapport α/β et composants des huiles quand tu les montres (le détail des huiles peut
  être à un toucher) ; sur la page Radar, **un radar où les 3 houblons se superposent**, une
  couleur chacun, silhouettes translucides, 12 axes dans l'ordre de la roue (D24, D48), valeurs
  = citations de la fiche, échelle dite.
- **Mieux** : α et rôle de chaque houblon au premier écran ; **le nom sur chaque barre** ;
  couleurs distinctes aussi pour un daltonien (pas rouge et vert ensemble ; essaie la palette
  d'Okabe et Ito) et **jamais l'orangé d'alerte** (`--acc`, D40) ; **la valeur de mon lot** sur
  la plage d'α (Nugget 13 %, Fuggle 4,5 %) ; **dans ma recette** : l'IBU de chaque houblon à
  46 g à 60′ et la **dose équivalente** pour remplacer Nugget à IBU égal ; **gestes** :
  Remplacer (ou Ajouter), retirer de la comparaison, ajouter un houblon ; aimer ou exclure si tu
  veux.
- Non mesuré mais attendu (le jury et le brasseur le verront) : une lecture de ce qui distingue
  chaque houblon (« le plus résineux », « seul à citer le terreux ») ; les familles que le style
  attend repérées, sans dessiner la cible dans le radar des houblons ; aucun chiffre inventé.
- Généraux : un écran à 390 (et à 412), mots ≤ 80 au premier écran, remplissage ≥ 0,80, au moins
  4 boosters qui marchent, bascule Barres ↔ Radar, un seul style de graphique (D39).

## Ta variante

Ton message te donne un numéro (pNN), une **température** et un **parti**. Tiède = parti de
structure imposé ; chaud = libre, surprends (toujours dans le contrat) ; froid = repars des
idées retenues. **La température porte sur Comparer lui-même** (D38), pas autour.

## Pages et contrôle, avant de t'arrêter

`work/refonte-frontend/v4/ecran-1/fils5-comparer/pNN/` : les 12 pages construites par ton
générateur (seules `comparer.html` et `comparer-radar.html` changent) et `NOTE.md` (5 lignes :
parti, ce qui dépasse Beer Maverick, palette, limites).

```
node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils5-comparer pNN --mots=80 --fill=0.8 --boosters=4 --radar --radar-pages=comparer-radar.html --coherence --objets --comparer --baseline=C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/055d83f7-e384-467e-9f02-749828cb09f6/scratchpad/baseline-lot5/pages/consolide
```

Il doit imprimer `LOT OK`. Regarde tes captures (`fils5-comparer/captures/pNN-comparer-390.png`,
`pNN-comparer-radar-390.png`) à côté de `t3-radar-3-houblons.jpg` et `t4-alpha-beta-ratio.jpg` :
est-ce mieux que Beer Maverick, pas seulement conforme ? Trois passes au plus. Ne touche à
rien hors de ton dossier pNN et de ton sous-dossier du scratchpad. Réponse finale : une ligne
par variante (parti, ce qui dépasse Beer Maverick, mots et remplissage des 2 pages, LOT OK).
