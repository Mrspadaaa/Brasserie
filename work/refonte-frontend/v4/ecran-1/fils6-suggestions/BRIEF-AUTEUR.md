# Lot 6 · Suggestions sur p06, en fils de fer (brief auteur, une page)

Tu fais **des fils de fer statiques**, pas un prototype : 15 min par variante, puis tu livres ce
que tu as. Pas de générateur, pas d'autres pages, pas de geste à coder. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.

## Ce que le brasseur a dit (18.10, soir, planche du lot 5b)

« C'est vraiment difficile à lire, pour moi il faut revoir, mais si il faut vraiment en choisir
un ça serait la 6 ». Planche : `fils5-suggestions/captures/planche-b-390.png` et
`planche-suggestions-radar-390.png`.

Ce qui rend le lot 5b difficile à lire (relevé du pilote) : l'avant et l'après se superposent
(les effets sont minuscules) ; les réglettes portent beaucoup de petites marques ; le radar avant /
après montre deux pointes presque identiques ; beaucoup de petits mots (« non établi », « 0 voie »,
« +1,8 ») ; et **la réponse n'est écrite nulle part**. Ce que disent les données (pack, `S1`) :

- **Floral** (attendu en 16D) : ma bière à 6 ; Ajouter Golding, Motueka ou Aurum 10 g à 10′ l'amènent
  à 22, dans le style ; la visée du pack est 24,8 (aucune voie ne l'atteint exactement).
- **Résineux** (non nommé par le style) : ma bière à +6,1 T au-dessus du style. **Aucune voie
  houblon ne le ramène** : au mieux Remplacer Nugget par Motueka 74 g à 60′ (+5,8 T) ; Diminuer
  Nugget 46 → 38,5 g (+6,0 T) ; les ajouts floraux ne l'établissent pas. Le pack donne des pistes
  **hors houblon** (`S1.horsModele` : amertume dans le haut de la bande, malt torréfié…).

## Point de départ

`work/refonte-frontend/v4/ecran-1/fils6-suggestions/_depart/etat-b.html` (Barres) et
`suggestions-radar.html` (Radar) : p06 figé, HTML statique. Copie-les dans `fils6-suggestions/pNN/`
et modifie-les à la main. Garde l'idée de p06 : ma visée se règle sur chaque objectif, et les voies
se rangent selon qu'elles l'atteignent. Données : `prototypes/houblons-v4/data/pack-mini-protos.json`
(`scenarios.S1` : `voies`, `tolerance`, `direction`, `horsModele`), extrais avec node.

## Ce qui doit se lire en 5 secondes (le composant étudié)

1. **La réponse d'abord, écrite**, par objectif : atteint, approche, ou aucune voie houblon (et
   alors les pistes hors houblon à un toucher).
2. **Un effet lisible** : une piste par objectif, longue (240 px au moins), peu de graduations
   (la zone du style, puis 1, 2, 3… T nommées) ; avant et après en marques de 10 px au moins ;
   quand ils sont trop proches pour se voir, l'écart est écrit (« 6,1 → 5,8 T »).
3. **Le radar** : ma bière avant et une voie après, rien d'autre ; les axes de mes objectifs mis
   en avant ; ou le radar à un toucher si la variante le juge illisible ici.
4. Rien n'est inventé : chaque chiffre vient du pack ; « non établi » se dit une fois, clairement.

## Températures (ton message te donne tes numéros)

- **Froid** p01 : p06 corrigé pour la lecture seulement (tailles, marques, graduations), visée par
  défaut sur une valeur atteinte (22). p02 : p06 + une ligne-réponse par objectif en tête.
- **Tiède** p03 : une carte-réponse par objectif (verdict, meilleure voie, écart écrit), les voies
  dessous. p04 : une grande piste par objectif, les voies posées dessus en épingles nommées. p05 :
  un tableau sobre avant → après par voie, une mini-barre par cellule. p06 : petits multiples, une
  vignette par voie, mêmes échelles.
- **Chaud** p07 à p11 : aucune contrainte de forme, mêmes exigences.

## Règles du fil de fer

- Largeur 390, un écran (844 px) pour la réponse et les trois premières voies. 70 mots au plus
  au premier écran. Texte de 12 px au moins.
- Gris, un seul accent : l'orangé d'alerte pour ma bière hors du style. Aucune voie levure, aucun
  stock en texte (icône seulement).
- Contrat DOM : garde tous les `data-*` du point de départ (`[data-role="objectif"]`,
  `[data-voie]`, `[data-role="changement"]`, `[data-role="effet"]`…), et ajoute
  `[data-role="reponse"][data-famille][data-verdict="atteint|approche|aucune"]` au premier écran,
  une par objectif.

## Contrôles, une fois chacun

1. `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs <pNN>/etat-b.html
   work/refonte-frontend/v4/ecran-1/fils6-suggestions/captures/pNN-b-390.png 844`, et
   `suggestions-radar.html` vers `pNN-suggestions-radar-390.png` ; **regarde** les deux captures,
   puis la même capture réduite de moitié : ce qui s'y lit encore est ta hiérarchie.
2. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs
   work/refonte-frontend/v4/ecran-1/fils6-suggestions pNN --max=70 --page=etat-b.html` (et
   `suggestions-radar.html`) : `MOTS OK`.

Corrige, recapture une fois, arrête-toi. `NOTE.md` de 3 lignes : le parti, ce qui se lit en 5 s,
ce qui manque. Réponse finale : une ligne par variante.
