# u5 — Le mur des preuves

**L'idée.** Toutes les vraies mesures en bière sur un seul mur (houblon × composé), où une case pleine est une valeur publiée avec sa source et une case hachée est un trou. Dessous, ta bière ≈ calculée se pose au milieu des vraies, puis la page montre où la simulation tombe juste et où elle se trompe.

## Pourquoi ça aide à comprendre et à choisir

- Le brasseur : « Des vrai donné, mieux présenté » ; « Je veux aussi des vrais valeur ».
  - Le mur dit d'un coup d'œil ce qui est connu : 48 valeurs chiffrées en bière ; pour ses houblons, Citra 4, Cascade 4, Galaxy 0, Idaho 7 3 ; aucune ne les compare à dose égale.
  - La ligne Galaxy est vide, et c'est une information.
- « ? » marque les 11 valeurs « à vérifier » et les colonnes de E03 à vérifier ; « lu » marque ce qui est lu sur une figure (panels). Une case ouvre ses mesures avec dose, durée, moment et note de l'étude.
- « Ta bière au milieu des vraies » : la bande ≈ de ta bière (chaîne du moteur, dry hop après fermentation, dose réglable) posée sur l'axe des mesures publiées et des seuils. Toucher une case du mur change le houblon et le composé.
- « La simulation tombe-t-elle juste ? » rejoue les vérifications du pilote. Trois sur quatre sont encadrées par la chaîne. Le 3MH de Cascade ne l'est pas : la chaîne est ×3,8 à ×18 trop basse, parce que le 3MH augmente pendant le brassage, sans chiffre. C'est montré en rouge, pas caché.
- « Un tableau, deux lectures » : les mêmes dix nombres de Lafontaine 2018, lus par H (les agrumes plafonnent, l'herbacé monte) et par J (l'inverse), en deux petits graphiques.
  - Le profil simulé du pilote suit H ; si J a raison, son ancre tombe de 26 à 21 points.
  - C'est à trancher en relisant le tableau 3.
- « Les trous » : sept phrases sur ce qu'aucune étude ne mesure, dont Citra contre Cascade à dose égale, Galaxy chiffré, variété × levure × dry hop, et l'ordre de deux dry hops.

## Ce qu'elle casse

- **Premier écran : 287 mots** (le plus dense des six) : c'est un mur de chiffres par nature.
- Les 25 colonnes possibles sont réduites à 8 (linalol, géraniol, citronellol, myrcène, humulène, 4MMP, 3MH, panel). Les esters, le nérol et le limonène sont hors du mur.
- Les mesures ne sont pas à la même dose : la case ne se compare pas sans ouvrir ses conditions. Le mur le dit, mais il invite à comparer.
- Il n'y a pas de profil simulé au premier écran (0 simulé) : c'est voulu, le simulé arrive plus bas, comme « ta bière ».

## Captures (`captures/u5/`)

`mur-01-avant-premier-ecran` → `02-feuille-cascade-4mmp` (toucher une case) → `03-apres-strip-cascade-4mmp` → `04-apres-8gL` → `05-verifs-lectures-trous`.

## Contrôle d'honnêteté

```
u5 · 9 pictos · 57 mesurées · 0 simulées · 0 faute(s)
LISIBLE OK
```
