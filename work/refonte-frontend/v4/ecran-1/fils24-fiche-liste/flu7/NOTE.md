# flu7 — Les mouillettes

- Chaleur : **chaude**
- Idée : Comme le parfumeur : une bande de papier par famille, posée sur la table, trempée au bout dans la couleur de sa famille (24 px par fiche qui la cite) ; ses mots écrits sur la bande, une agrafe « stout » sur les familles attendues ; les 5 familles dont personne ne parle sont des bandes blanches hachurées « ? ». Petit radar à droite, demande à gauche.
- Ce qui tient : Le geste de sentir devient la forme ; la longueur trempée se compare d'un coup d'œil ; image forte et neuve.
- Ce qui casse : Le radar est petit et sans étiquettes (les bandes les portent) ; la métaphore peut paraître décorative ; inclinaison légère des bandes.
- Captures : `captures/flu7-premier-ecran.png`, `captures/flu7-page.png`, `captures/flu7-absolu.png` (lentille sur absolu).
- Plancher : la liste de g1 (`base/captures/consolide-fiche-390.png`), regardée à côté.

## Contexte commun (série u, libre au brief minimal)
- Question : « Que sent ce houblon, dit avec ses mots ? » ; facteur libre : la façon de dire les arômes. En contexte, la fiche g1 de Nugget telle qu'il l'a choisie (registre `choix/ecrans.json`, capture `base/captures/consolide-fiche-390.png`) : feuille presque pleine sur l'étape Houblons assombrie, ✕ rond (44 px, D109), « Nugget ⊙ » (repère de stock), α 11–14 % en gros, lot 13 % et sa jauge, « double usage » en mot, radar à 12 axes légendé (« ? » hachurés, flèches de sa demande), « + Floral 2/4 − Résineux 2/4 », ♡ ⊘, Comparer, Styles · Huiles · Sources · Substituts. Le radar reste avant la liste et dans le premier écran (D115).
- Au style par défaut (lentille « au style · absolu ») : la zone de la stout = les familles que le BJCP 16D nomme (terreux, herbacé, floral ; « optional »), en secteurs pointillés sur le radar et dans la liste. Pas de bande d'intensité : les « N/4 » comptent des fiches, pas une intensité dans la bière (pack-fiches.json, « lecture »).
- Données : `prototypes/houblons-v4/data/pack-fiches.json`, fiche beermaverick-nugget, 4 fiches (Beer Maverick 2023, Hopsteiner 2025, Hopsteiner boutique US 2024, Yakima Chief date inconnue, relayé). 16 mots, tous recopiés tels quels (anglais compris : pineapple, woody, resinous, resiny) ; aucun mot ni valeur inventés ; les 5 familles non décrites restent « ? », jamais 0.
- Appui long (650 ms) ou survol de 900 ms sur le nom « Nugget » : la fiche courte type Citra cryo (≤ 100 mots, mini radar), comme partout dans l'app ; retour visuel immédiat (soulignement) ; « ? » discret pour la légende des 12 pictos.
- Pages statiques, classes et symboles préfixés par l'id (L26), aucun fichier de `src/`.
- Écart signalé : `controle-choix.mjs` attend une maquette construite (routes `<dossier>/<route>/etat.html`) ; il ne s'applique pas à un concept isolé de la liste. Les éléments de g1 hors liste sont repris tels quels ; ceux de la liste (bande, familles, « nommé en premier », sans famille, non décrites) sont le facteur libre de ce lot : leur contenu est gardé dans chaque concept, leur forme change.

## Contrôles (joués le 24.10)
`controle-commun.mjs … flu1 … flu8 --page=etat.html --sans=mots` (mots sauté : la règle des 70 mots au premier écran ne vaut pas pour une fiche ouverte, D25 bis ; la liste est faite de mots) :
```
mots       sauté (--sans)
couleurs   OK
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      OK
standard   OK
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN OK
```
`controle-panel.mjs` sur les 8 premiers écrans :
```
8 captures · remplissage médian 0,74, 0 sous 0,50 · ressemblance moyenne 0,89 · paires presque identiques 0/28 (0 %)
PANEL OK
```
