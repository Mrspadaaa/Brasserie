# Ma bière, l'onglet (route biere ; voie p1-ma-biere, reprise D105, 23.10)

## Base

- La base v4.10 qu'il a choisie : `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html`, capture
  `base/captures/consolide-biere-390.png` (« Ça aussi », 23.10) ; radar : `consolide-biere-radar-390.png`.
- Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json` (11 éléments).

## Reprise

- biere-onglets : repris — en tête, « ‹ » et « Ma bière · Suggestions · Comparer » (Onglets du socle), Ma bière active
- biere-bandeau : repris — le bandeau IBU (jauge au style), OG, EBC, en pilule
- biere-alerte : repris — « Résineux trop marqué », point rouge, à gauche de « Barres / Radar »
- biere-reglages : repris — « Barres / Radar » et « Au style / Absolu » (SegmentedControl de l'app)
- biere-decompte : repris — « 6 au style · 5 non situées », compté sur le profil du moteur
- biere-legende : repris — les pastilles « dégusté 18.10 · prévu · non situé », puis « zone du style · au-dessus »
- biere-barres : repris — une barre par famille : zone du style, « au-dessus » en pointillé, point plein ou creux, hachuré
- biere-hors-style : repris — la famille hors du style en rouge, son facteur à droite (« ×2,8 », centre ÷ haut de la bande)
- biere-bannir : repris — la famille touchée s'ouvre sous sa barre : « bannir · − · sans visée · + », et « × » quand une visée est posée (résineux ouvert au repos) ; la visée se dessine sur la piste (D108)
- biere-objectifs : en pont — Suggérer : « + floral », « − résineux », « + … » ouvrent Suggestions ; « + floral » est le pont-floral
- biere-levure : repris — « Prévu avec SafAle US-05, caractérisée » au pied de l'écran

## Idées reprises

- Les objectifs suivent les visées posées sous les barres : « bannir floral » remplace « + floral », et l'inverse ; une puce
  pleine (la puce noire de la base) dit une visée posée, une puce au trait la demande dégustée.
- Le radar m4 à un toucher (« Barres / Radar »), au style ou en absolu.

## Écarts

- Un picto de famille devant chaque nom : le code couleur des arômes est un acquis, et l'écran passe COULEURS (D74).
- Les puces ouvrent toutes Suggérer ; Suggérer lit la visée commune dans l'état (pas de paramètre de route).
- Le bouton du sens posé (« + », « − » ou « bannir ») a l'encre pleine (`aria-pressed`) ; la base n'en marquait aucun. Le
  palier nommé et le losange disent déjà le niveau ; l'encre dit le sens d'un coup d'œil.
- La puce d'une visée suit le sens réel (palier face à ma bière). La base écrivait « − tropicaux » après « + » (crans
  arrondis à l'entier inférieur) : erreur de la base, non reprise.
- Bannir sur une famille presque absente (tropicaux, 0,5 point) : le losange à 0 est sous le point de ma bière ; le nom barré
  et la puce « bannir tropicaux » disent la visée, comme dans la base.

## Reprise D108 (23.10, nuit) : la visée de sa base, telle quelle

Ses mots, posés sur « Tropicaux prévu » : « Aussi aucun impact sur je met plus, moins bannir ect.. ». Source : biere.html,
`ligneFamille` et `viserAbs`, CSS `.visee-f`, `.lien-visee`, `.fam.bannie` ; base jouée dans Chrome (tropicaux : « + »
faible, « + » moyen, « − » deux fois bannie, ligne refermée nom barré).
- La visée est un palier de l'échelle absolue 0 à 3 (`etat/visee.ts`) : 0 bannie, 0,5 faible, 1,5 moyen, 2,5 marqué.
  « + » et « − » partent de la visée, ou de ma bière sans visée ; « × » la retire ; « bannir », c'est 0.
- Sur la piste (`PisteBase`, `visee`) : losange blanc cerné d'encre `[data-visee-marque][data-niveau]`, trait pointillé
  `[data-visee-lien]` jusqu'au point `[data-biere-point]`. Le palier `[data-palier]` entre « − » et « + ».
- Bannie : `[data-bannie]` sur la ligne, nom barré et grisé, ligne refermée comprise.
- Au repos, aucune visée, comme la base (`data-dirs` vide) ; les puces « + floral · − résineux » sont la demande
  dégustée, qu'emploie Suggérer tant qu'aucune visée n'est posée sur ces familles.
- Suggérer lit le palier en crans entiers du style (un au moins) : l'écart entre ma bière et la visée. Bannir n'exclut plus
  aucun houblon : c'est un objectif « faire baisser » (`Objectif.bannie`). Contrôle : `controle-visee.mjs` (VISEE OK 6/6).

## Pour l'app

- `src/ui/hops/RecipeProfile.tsx`, route `{ view: 'recipe', tab: 'beer' }` ; les visées (bannir, −, +) entrent dans le
  brouillon de la recette (`useRecipeDraft`) et dans la direction passée à Suggérer (`proposeVoies`).
- La dégustation (18.10) vient de la fixture du moteur : à brancher sur les dégustations de Dexie.
