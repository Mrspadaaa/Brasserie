# Mots hors des 12 familles, les plus fréquents (ph-donnees, 24.10)

Source : `prototypes/houblons-v4/data/pack-fiches.json`, champ `fichesHoublons[].motsSansFamille`
(le moteur y range les descripteurs de chaque fiche qui ne tombent dans aucune des 12 familles).
Sortie : `mots-hors16d.json`, trié par nombre de houblons, 24 lignes sur 34 groupes.

## Méthode
1. Pour chaque fiche du pack, on relève ses `motsSansFamille` (source et mot).
2. Regroupement, seulement quand c'est la même idée : casse, et anglais / français
   (fruity → fruité, gooseberry → groupe à maquereau, White wine → vin blanc, grape → raisin,
   vanilla → vanille, « Doux » → doux). Rien d'autre n'est regroupé.
3. Un houblon compte une fois par mot, même si le mot vient de plusieurs sources ou formes.
4. Tri par nombre de houblons (égalité : ordre alphabétique), on garde les 24 premiers.

## Limites
- Le pack ne couvre que 32 variétés (sur le catalogue de 318) ; il ne représente pas tout le catalogue.
  Le relevé « sur tout le catalogue » demanderait le moteur complet (`src/engine` de la maquette), non lancé ici.
- `fruité` (11 houblons) est le mot générique : le moteur ne le compte pas pour « Lui seul ». Garder ou non est un choix de pictos.
- Un mot peut venir d'une ligne de catégorie (« Familles déclarées ») ; le pack ne les distingue pas ici.
- « Tabacco » (Target, fiche Hopsteiner) : orthographe de la source, non corrigée.
- « sauvignon blanc » est un nom de cépage, pas un descripteur ; gardé car présent dans les fiches.
- Les mots à un seul houblon sont des cas isolés (rangs 12 à 24 ; les rangs 5 à 11 ont 2 houblons) : pas de picto en priorité.

## Une ligne par mot
- fruité : 11 houblons (variantes : Fruité, fruity, fruité)
- doux : 9 houblons (variantes : Doux, doux)
- groseille à maquereau : 5 houblons (variantes : gooseberry, groseille à maquereau)
- noble : 4 houblons (variantes : noble)
- cannabis : 2 houblons (variantes : cannabis)
- crème : 2 houblons (variantes : crème)
- dank : 2 houblons (variantes : dank)
- net : 2 houblons (variantes : net)
- raisin : 2 houblons (variantes : grape, raisin)
- sauvignon blanc : 2 houblons (variantes : sauvignon blanc)
- vin blanc : 2 houblons (variantes : White wine, vin blanc)
- chewing-gum : 1 houblon (variantes : chewing-gum)
- citronnelle : 1 houblon (variantes : citronnelle)
- coffee : 1 houblon (variantes : coffee)
- curry : 1 houblon (variantes : curry)
- delicate : 1 houblon (variantes : delicate)
- gingembre : 1 houblon (variantes : gingembre)
- marmelade : 1 houblon (variantes : marmelade)
- miel : 1 houblon (variantes : miel)
- mild : 1 houblon (variantes : Mild)
- mojito : 1 houblon (variantes : mojito)
- nectar : 1 houblon (variantes : nectar)
- neutral : 1 houblon (variantes : neutral)
- onion : 1 houblon (variantes : onion)
