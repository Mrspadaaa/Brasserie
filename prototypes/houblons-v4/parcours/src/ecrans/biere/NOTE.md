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
- biere-objectifs : en pont — Suggérer : « + floral », « − résineux » posent leur visée sur la barre sans quitter l'onglet (posée, la puce la retire) ; dessous, « Plus floral : 7 voies, 2 faibles › » (voiesSummary du moteur) ouvre Suggestions, c'est le pont-floral ; « + … » ouvre la famille suivante à viser (voie r2, D124)
- biere-crans-style : repris — au style, la zone des familles que le style n'attend pas (Agrumes, Tropicaux, Résineux, Épicé…) découpée en trois crans par deux traits fins, couleur de la page ; rien sur les attendues ni en absolu, comme la base
- biere-levure : repris — « Prévu avec SafAle US-05, caractérisée » au pied de l'écran

## Idées reprises

- Les objectifs suivent les visées posées sous les barres : « bannir floral » remplace « + floral », et l'inverse ; une puce
  pleine (la puce noire de la base) dit une visée posée, une puce au trait la demande dégustée.
- Le radar m4 de sa base à un toucher (« Barres / Radar ») : voir « Reprise D124 » plus bas.

## Écarts

- Retirés (critique p6, 24.10 ; règle n° 1, D105, D117) : la ligne « surtout Nugget, 46 g à 60′ » sous l'alerte et, au pied,
  « et Nugget 46 g à 60′ » après la levure. Ce n'était pas dans sa base, ni dans ses mots ; le pied redit « Prévu avec
  SafAle US-05, caractérisée », comme elle. La fiche ne s'ouvre donc plus depuis cet onglet (aucun nom de houblon).
- Un picto de famille devant chaque nom : le code couleur des arômes est un acquis, et l'écran passe COULEURS (D74).
- Suggérer lit la visée commune dans l'état (pas de paramètre de route) ; les puces la posent, la ligne des voies l'ouvre (D124).
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

## Reprise D124 (24.10, voie r2) : tous les états de sa base

Relevé joué : `work/refonte-frontend/v4/choix/etats/biere.json` (17 états, 15 rejoués). Contrôle : `controle-etats.mjs --ecran=biere`.
- Radar (`ma-biere/RadarBiere.tsx`) : celui de sa base (radar.js, RADAR.biere), ma DÉGUSTATION face à la zone du style, échelle
  −1 → 3, pas senti sur l'anneau du zéro, pas goûté au centre avec « ? » et secteur hachuré, bleu #0072B2, l'orangé au-dessus du
  style, attendues en gras ; 358 px de large ; bulle au toucher d'un sommet (« Résineux : marqué, au-dessus du style »).
- Grille m4 dessous (`Degustation.tsx`) : « pas senti · faible · moyen · marqué » une fois en tête, quatre pastilles par famille ;
  un toucher note, retoucher revient à pas goûté ; le radar se redessine. Notes de départ : la dégustation des données
  (`donnees().degustation`, le 18.10 : résineux marqué). Elles vivent dans l'onglet (l'état commun n'a pas de notes).
- En radar, le décompte, la légende, l'échelle et la levure se replient, comme la base ; un « ? » en haut à gauche du radar (D113).
- Absolu : « faible · moyen · marqué » en tête des barres, au milieu de chaque classe sur la piste.
- L'alerte « Résineux trop marqué » ouvre le radar, la bulle sur Résineux (ajout : D121, l'alerte ne faisait rien).
- data-etat sur chaque déclencheur ; sur les radios du SegmentedControl et la croix, posé après le rendu.
