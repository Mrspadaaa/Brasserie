# Inventaire de « Ma bière » (route `biere`) : maquette jouable → app (voie p6, L03 et M16)

Base : l'écran de la maquette jouable `prototypes/houblons-v4/parcours/src/ecrans/biere/` (index.tsx, Degustation.tsx, biere.css),
lui-même repris de sa base v4.10 (`consolide-biere-390.png`, « Ça aussi »). Relevé de ses états :
`work/refonte-frontend/v4/choix/etats/biere.json` (17 états). Inventaire de ses blocs : `inventaire-ma-biere.json` (11 éléments).
Colonne App : « repris » = même code d'écran, seuls les branchements changent ; « écart » = voulu, dit en dernière colonne.

## Blocs (data-element, au repos)

| Bloc | Maquette | App (`src/ui/hopIndex/biere/`) | Note |
|---|---|---|---|
| biere-onglets : croix, Ma bière · Suggestions · Comparer (n) | Onglets du socle, Ma bière active | repris (`CadreApp.tsx`, tête de `comparer/cadre-app.css`) | la croix ferme la couche (retour à l'étape Houblons) |
| biere-bandeau : IBU (jauge au style), OG, EBC | `Bandeau` | repris (`maBiere/Base`) | |
| biere-alerte : point rouge, « X trop marqué » | `Alerte` | repris | « Au style » vert sans dégustation : voir écart 1 |
| biere-reglages : Barres / Radar | `Lentille` | repris | |
| biere-decompte : « n au style · m non situées » | texte | repris | compté sur le profil du moteur |
| (hors inventaire) Au style / Absolu | `Lentille` | repris | |
| biere-legende : pastilles dégusté · prévu · non situé, « ? », « zone du style · au-dessus » | pastilles + `Legende` | repris | date « dégusté jj.mm » lue de sa dégustation (écart 2) |
| biere-barres : une barre par famille (zone, au-dessus, point, hachuré, crans) | `PisteBase` | repris | 12 familles |
| biere-hors-style : famille hors style en rouge, facteur « ×2,8 » | idem | repris | |
| biere-bannir : « bannir · − · palier · + », « × » | ligne ouverte sous la barre | repris | hors style ouverte au repos |
| biere-objectifs : puces « + floral · − résineux · + … » | `sensDe` + puces | repris, écart 1 | |
| biere-levure : « Prévu avec SafAle US-05, caractérisée » | texte | repris, écart 3 | |

## Gestes et états (repos · pendant · après) — `biere.json`

| État | Geste | Repos | Pendant | Après | Joué dans l'app |
|---|---|---|---|---|---|
| etat-biere-repos | ouvrir l'onglet | barres | – | – | controle-ma-biere-app, `app-repos.png` |
| etat-biere-famille-ouverte | toucher Tropicaux | ligne fermée | – | « bannir · − · sans visée · + » | oui |
| etat-biere-visee-plus | « + » | sans visée | – | losange + pointillé, palier « faible », « × », puce pleine | oui, `app-visee.png` |
| etat-biere-visee-moins | « − » | – | – | descend d'un palier | non rejoué (même code que « + », palier au-dessous) |
| etat-biere-visee-retirer | « × » | visée posée | – | « sans visée », losange retiré | oui |
| etat-biere-bannir | « bannir » | – | – | nom barré, « bannie » (palier 0, posé) | oui, `app-bannir.png` |
| etat-biere-visee-refermee | refermer la ligne avec visée | ligne ouverte | – | losange et pointillé restent | non rejoué (même code que la maquette) |
| etat-biere-objectif-floral | puce « + floral » | puce au trait | – | visée posée, puce pleine, ligne « Plus floral : n voies » | puce absente sans visée ni demande (écart 1) ; pleine quand une visée est posée |
| etat-biere-objectif-autre | « + … » | – | – | ouvre la famille suivante à viser | oui (test) |
| etat-biere-absolu | « Absolu » | « zone du style · au-dessus » | – | « faible · moyen · marqué » en tête | oui, `app-absolu.png` |
| etat-biere-radar | « Radar » | barres | – | radar m4 + grille « pas senti · … · marqué » ; décompte, légende, levure repliés | oui, `app-radar.png` |
| etat-biere-radar-absolu | Absolu puis Radar | – | – | radar | repris (même code) |
| etat-biere-radar-sommet | alerte ou sommet de la famille trop marquée | alerte | – | bulle « Résineux : marqué, au-dessus du style » | test `biereAppDegustee` (alerte → radar) |
| etat-biere-onglet-suggestions | onglet Suggestions | Ma bière | couche Suggérer au-dessus (pile hopBeer > hopSuggest) | « Ma bière » y ramène | oui |
| etat-biere-onglet-comparer | onglet Comparer | – | – | couche hopCompare avec les houblons retenus | test unitaire |
| etat-biere-retour | croix | écran | – | retour à l'étape Houblons | oui |
| etat-biere-pied | défiler au pied | – | – | puces, puis « Prévu avec … » | oui |

## Écarts voulus (aucun n'est un changement de dessin ; tous sont de données, D40 « l'inconnu n'est jamais 0 », t12d)

1. **Sans visée posée, pas de puces « + floral · − résineux »** : dans la maquette, c'est la demande de sa dégustation S1 (fixture) ;
   l'app n'invente aucune demande (`donnees().demande` vide, t12d/D158). Les puces apparaissent dès qu'une visée est posée ; « + … » reste.
2. **Dégustation réelle** : la date de la pastille, l'alerte, la grille notée viennent de la dégustation de sa recette (`useHopData`) ;
   sans dégustation, aucune note (pas goûté), l'alerte dit « Au style », la pastille « dégusté » n'est pas écrite.
3. **Pied de page** : « , caractérisée » seulement si le moteur caractérise la levure ; sans levure : « Levure non renseignée : prévu sans elle ».
4. **Visée par recette** : la visée posée appartient au brouillon ouvert ; changer de brouillon la remet à zéro.
5. **Voies sous les puces** : calculées après le toucher (`useDeferredValue`) pour que le retour visuel ne les attende pas.
6. L'écran de la maquette garde son propre code (copie) : il n'a pas été converti en hôte mince (hors périmètre de la voie).
