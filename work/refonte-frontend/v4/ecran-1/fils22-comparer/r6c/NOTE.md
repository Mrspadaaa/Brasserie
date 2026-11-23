# r6c · Le podium des agrumes

Lot 22, Comparer : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Page `etat.html`, écrite par
`generer.mjs` (avec `page.css` et `client.js`) depuis `../donnees/comparer-stout.json` seul. Les titres des
sources viennent du fichier des composés qu'il cite. Captures : `captures.mjs`.

## Choix portés
- Radar : r2
- Base : effet égal (agrumes)
- Porte : non
- Descripteurs : A

## Ce que j'ai fait de l'angle
- **Le podium est la réponse.** Chaque houblon est montré à la dose qui donne les mêmes agrumes que Cascade
  4 g/L (`egalites.effetEgal`). Le classement va du moins de grammes au plus : 1 Galaxy ~2,5 g/L (50 g pour
  20 L), 2 Cascade 4 g/L (80 g), 3 Idaho 7 ~7,5 g/L (150 g). La marche dit le rang, la dose et les grammes
  pour le lot. Un toucher sur une marche met ce houblon en avant (radar plein, intervalle, pont Dryhopper).
- **Enrichi : « ce qu'il apporte en plus », pensé pour sa stout.** Sous chaque marche, 3 lignes (picto et
  crans) : les deux familles qui bougent le plus et le **résineux, toujours**, puisque sa dégustation du 18.10
  dit « ma stout est trop résineuses, je la veux plus floral ». Le floral passe devant dès qu'il bouge.
  L'orangé et ↑ marquent ce qui dépasse le style 16D. Lecture d'un coup d'œil :
  - Galaxy : le moins de grammes et le moins de résineux ajouté (+1), mais les tropicaux sortent du 16D (+3) ;
  - Idaho 7 : le plus de floral (+2), mais 150 g, des baies hors style et +3 crans de résineux ;
  - Cascade : au milieu.
- **Famille par famille (manière de w2, barres de l5b)** : 12 lignes, une barre par houblon, de ma bière
  (trait noir) à l'après, devant la zone du style. Les barres sont rangées comme le podium. Le trait fin
  donne l'intervalle du houblon mis en avant. La ligne Agrumes montre trois barres égales : c'est la base.
  Le résineux a une échelle élargie, signalée dans la légende, sinon tout serait rogné au bord : sa stout
  est déjà au-dessus.
- **Radar r2** : le houblon mis en avant est plein, les autres en contour de 3. Son intervalle bas–haut
  est tracé sur chaque axe. La zone du style et ma bière sont en contour sombre. Les sommets au-dessus du
  style sont orangés, les familles inconnues pour tous hachurées avec « ? ».
- **Chimie rattachée aux familles** : les composés qui expliquent les agrumes (3M4MP, 3MH, géraniol,
  linalol), puis 4MMP, myrcène et huile. Chacun a ses pictos de famille et ses valeurs par houblon, avec
  leur référence. Le 3M4MP de Galaxy (> 10 µg/kg, H11) explique pourquoi il lui faut moins de grammes.
- **Panel OSU sans molette** : la courbe mesurée de Cascade (H22), avec la dose de référence 4 g/L marquée.
  On y lit que les agrumes plafonnent dès 8 g/L. Pour Idaho 7 et Galaxy, la page dit « aucun panel de dose ».
- **Vraies valeurs (v1)**, à un toucher (« Les vraies valeurs ») : α du lot et α des fiches, β, huile totale,
  avec source et année, puis la liste des références H.
- **À ces doses** : dose, grammes, IBU (« aucun calculé : à cru, non modélisé », jamais 0), confiance du
  moteur, hop creep et saturation.
- **Porte non** : Nelson Sauvin n'est pas épinglé. Il s'ajoute par « + Nelson Sauvin », reste une variété
  comme une autre et prend la 3e place (~7,4 g/L). La variété est le seul facteur libre : ajouter, retirer,
  mettre en avant.
- **Descripteurs A** : sur la fiche de Nelson Sauvin seulement, « groseille à maquereau, gooseberry » passe
  dans Baies, avec la marque « règle A ». Ailleurs, A ne se voit pas : aucun autre houblon n'a ces mots.
  Aucune part « autres » n'est dessinée (c'est l'option B). Les mots sans famille restent écrits sur une
  ligne (« Hors des 12 familles : cannabis, dank »).

## Ce qui casse
- Le stock n'est pas dans `comparer-stout.json`. L'icône « en stock » se déduit de l'α « fiche de stock » ou
  « lu sur l'article » du lot ; la quantité est inconnue.
- Les crans en plus sont simulés et l'intervalle est énorme (le haut tourne autour de 55–63 pour presque
  toutes les familles). Le trait fin le montre, le chiffre « +3 » ne le dit pas.
- Les valeurs à la dose d'effet égal sont interpolées linéairement entre les doses de la grille (1, 2, 4,
  8 g/L), comme `effetEgal`. Les drapeaux sont ceux des deux points qui encadrent la dose.
- Le floral de Galaxy (+1) vient du moteur (linalol mesuré), alors que ses fiches ne décrivent pas le floral.
- Avec Nelson Sauvin ajouté, les quatre colonnes tiennent, mais « Nelson Sauvin » passe sur deux lignes et le
  × touche presque l'icône de stock.
- Le pont Dryhopper est un lien inerte (maquette).
- `Rôle double` vient de la règle rôle-α v1 (prototype, à valider) : pastille en tirets, dite dans la légende.

## Contrôles (joués depuis la racine)
- COMMUN OK sans MOTS (couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende,
  parlant, brutes) ; MOTS 79 ≤ 80 ;
- UNE-QUESTION OK (1 groupe libre : houblon), contexte : base, moment, levure, bière ;
- ACQUIS OK (4/4 : radar, chimie et osu au repos, valeurs à un toucher) ; ALPHA OK (3 sur 3) ;
- fiches de 51 à 58 mots.
- **Pire contraste** : 4,96:1, « Agrumes » (#856e0c, 12 px) sur blanc.
