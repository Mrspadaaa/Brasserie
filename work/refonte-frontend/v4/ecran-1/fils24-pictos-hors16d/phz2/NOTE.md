# phz2 — Contenant : l'objet tel qu'on le tient

- **Chaleur : tiède** (la forme de la série phz : l'objet qu'on a en main quand on sent ce mot).
- **Idée** : verre à pied (vin blanc), grappe de points (raisin), baie ovale striée et sa queue (groseille à
  maquereau), feuille en étoile sur sa tige (cannabis), cornet et sa boule (crème), bonbon emballé (chewing-gum), tige à
  nœud (citronnelle), tasse à anse (café), marmite à couvercle (curry), rhizome bosselé (gingembre), bocal à couvercle
  (marmelade), alvéole (miel), verre haut et paille (mojito), pichet qui verse (nectar), bulbe et racines (oignon) ;
  « & » pour « en plus » (et encore).
- **Ce qui tient** : à 16 px, verre, tasse, bocal, bonbon, marmite, alvéole, verre à paille et grappe se nomment sans
  légende ; la grappe de petits points ne se confond pas avec les trois ronds des Baies ; rien n'emprunte la feuille,
  les brins, le sapin, la fleur ni la roue.
- **Ce qui casse** : le cannabis en étoile reste un signe (six rayons) plus qu'une feuille ; le gingembre se lit
  « nuage » ; curry par la marmite est une convention (le plat), pas l'épice ; la citronnelle en tige se devine mal.
- **Écart à la baseline** : aucun.

## Intégration (commune aux quatre jeux, « Il faut pas que ça gêne ! »)
- Les cartes sont le vrai DOM de la maquette jouable, rendu par le moteur (`parcours/comparer/etat.html#/comparer?h=nelson-sauvin,citra:cryo,target`,
  `…?h=galaxy,saaz-cz`, `parcours/fiche/etat.html#/fiche/nelson-sauvin`), avec son CSS ; seuls le contenu des pastilles
  « lui seul », le ◇ des lignes de la matrice et un bloc « mots précis » changent. Rien d'inventé : les mots sont ceux de
  l'aria-label « lui seul » du moteur et de `pack-fiches.json` (huile : total des fiches, mL/100 g).
- **Version courte** : dans la pastille noire, un picto par mot hors des 12 familles (blanc, 16 px), le picto de sa
  famille (12 px, sa couleur) pour un mot précis, les qualificatifs (doux, noble, fruité) en texte pâle, « +n » pour le
  reste. **Version textuelle** : comme la vraie pastille (premier mot et +n), le picto devant ; sous la ligne des
  familles, un bloc `data-role="precis"` : picto de la famille et son mot précis (« pamplemousse +1 », « pêche »).
- **Ce que la carte a gagné / perdu en place** : pastille « lui seul » de 19 à 22 px (pictos de 16 px) ; la version
  textuelle ajoute 1 à 3 lignes de 12 px par colonne précisée (Citra : 3), sans toucher au reste de la tête ; bandeau de
  la fiche inchangé (36 px). Galaxy face à Saaz : une barre « huile » sous la pastille, à la manière de la barre
  « autres » (45 px contre 9 px) : « il faut aussi que on voit comme il faut les différence ! » : l'écart se voit sans
  lire (pictos et barre longue d'un côté, texte pâle et barre courte de l'autre).
- **Légende** (`data-role="legende"`) : en pied de la tête de Comparer, une ligne de 12 px (pictos présents sur la carte
  et « en plus ») ; dans la fiche, dans la légende du « ? » de flb5b, dépliée sur la capture courte. Ailleurs dans
  l'app : derrière le « ? » de Comparer (D89), la légende de Substituer (tableau 16D de u4), la fiche courte, et l'étape
  Houblons près de la carte d'ajout (D113).
- Qualificatifs sans picto (fruité, doux, noble) ; « sauvignon blanc » et « dank » prennent le picto de vin blanc et de
  cannabis (brief). Rare hors relevé (« Tabacco » de Target) : le picto « en plus », le mot au toucher et dans la version
  textuelle.

## Contrôles
- G1 : JEUX-BIEN-4. G2 `controle-pictos-trait.mjs … --page=etat.html` : TRAIT OK (0 faute sur les quatre jeux).
- `controle-panel.mjs` sur les planches : PANEL OK (remplissage médian 0,64, ressemblance 0,88, 0 paire identique) ;
  sur les cartes : PANEL ECHEC (ressemblance 0,94) par construction : les quatre jeux posent leurs pictos dans la même
  carte, qui ne doit pas changer.
- Limites : pack de 32 houblons ; la lisibilité à 12 px est montrée sur la planche (32, 16 et 12 px) mais pas mesurée ;
  contraste des pictos de famille sombres (épicé, baies) sur la pastille noire non contrôlé.
