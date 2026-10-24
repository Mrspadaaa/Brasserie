# Lot D131 — les pictos des types hors 16D (24.10, soir)

## Ses mots, mot pour mot
« le profil extra 16d sont bien ajouter ? Peut être mettre dans la baseline aussi des icône en plus, pour avoir une version courte
juste icône, et une version plus textuel ». Avant (D130), sur flb5b : « Les type spéciaux des houblons hors 16d ! C'est très
important surtout dans la comparaison !!!! ». Le bandeau de flb5b : « Lui seul : vin blanc, raisin, groseille à maquereau ».
Puis (D131 bis) : « même niche ou un Picto pour les truc super niche pour montrer que il y a qqch en plus.. Il faudra pas oublier
d'ajouter la légende à certains endroits clé ». Et (D131 ter) : « Ah oui aussi si par exemple dans le 16d qui est assez vague,
par exemple un houblon floral est super floral type rose ou Jasmine, agrume type mangue, épice hyper typé qqch... Ectt le mettre
en valeur ». Enfin : « Il faut pas que ça gêne ! Que ce soit bien intégré. Regarde avec des agents de critique pour ça ».

## Que ça ne gêne pas (sa règle pour tout le lot)
Tout ce que le lot ajoute (pictos, « en plus », légende, mot précis) se fond dans la carte telle qu'elle est : même rythme, même
hauteur de ligne, pas de nouveau bandeau, pas de cadre, pas de couleur nouvelle, rien qui pousse le premier écran ni ne cache ce
qui y était. Mots modérés (D41). Si un ajout gêne, il passe à un toucher. Compare tes captures à la carte d'origine, côte à côte,
avant de rendre ; la NOTE dit ce que la carte a gagné et ce qu'elle a perdu en place. Un critique (Fable) juge ensuite chaque jeu
sur ce point d'abord.

## Les mots à dessiner (relevé du catalogue : `donnees/mots-hors16d.json` et `donnees/NOTE.md`)
Les objets : groseille à maquereau, raisin, vin blanc (et sauvignon blanc), cannabis (et dank), crème, chewing-gum, citronnelle,
café, curry, gingembre, marmelade, miel, mojito, nectar, oignon. Les qualificatifs (fruité, doux, noble, net, délicat, neutre)
restent des mots : pas de picto.

**Les mots rares** (D131 bis) : la plupart de ces quinze n'ont qu'un houblon ; ils gardent leur picto (« même niche »). Pour les
mots plus rares encore (hors des 24 du relevé, comme « Tabacco » de Target), un **picto commun « en plus »** (`data-mot="en-plus"`)
dit qu'il y a quelque chose de plus que les 12 familles ; le mot paraît au toucher ou dans la version textuelle. Il ne doit
ressembler ni au « + » d'ajout (Comparer, ♡), ni à une famille, ni au hachuré de l'inconnu.

## Obligatoire, et rien d'autre
- **La grammaire des pictos de la baseline** : au trait, sans halo, sans disque pâle, sans ombre (D88, `controle-pictos-trait.mjs`) ;
  le trait des 12 familles (`work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html`, viewBox 24, trait 2.571, bouts
  ronds) ; lisible à 16 px, la taille d'usage ; rien sous 12 px (D60) ; pas de hachures (dans l'app, hachuré = inconnu) ; aucun
  symbole déjà pris par une famille (feuille, brins, sapin, monticule, roue, fleur, flamme ; `cerveau/produit/pictos-familles.md`).
  Un ton : celui du texte (encre), ou un ton neutre unique ; les couleurs restent aux 12 familles.
- **Les deux lectures demandées**, posées dans une vraie carte de la maquette : la **version courte** (les icônes seules, nom au
  toucher) et la **version textuelle** (icône et mot). Dans deux places : la ligne « lui seul » d'une colonne de Comparer (r6a,
  `prototypes/houblons-v4/maquettes/parcours/comparer/etat.html`) et le bandeau de flb5b dans la fiche
  (`prototypes/houblons-v4/maquettes/parcours/fiche/etat.html`), pour Nelson Sauvin (vin blanc, raisin, groseille à maquereau) ;
  une colonne montre aussi le picto « en plus » (Target et « Tabacco », par exemple).
- **La légende aux endroits clés** (D131 bis) : dans les deux cartes, une légende des pictos (`data-role="legende"`), petite et
  à un toucher ou en pied, qui fait lire la version courte sans deviner. La NOTE dit où d'autre elle irait dans l'app.
- **Le mot précis dans sa famille** (D131 ter) : une famille de la 16D est vague ; quand ses fiches la précisent, le mot précis
  est mis en valeur à côté de la famille (`data-role="precis"`). Les données le portent : `pack-fiches.json`,
  `fichesHoublons[].aromes[].mots` (Citra : Agrumes · pamplemousse, citron vert ; Fruits tropicaux · fruit de la passion, litchi ;
  Hallertau : Petits fruits · cassis). Une deuxième colonne de Comparer, Citra, le montre. Un mot qui redit la famille
  (« floral » sous Floral) n'est pas un mot précis. Jamais un mot précis inventé.
  Il ajoute : « C'est peut être aussi un moyen de différencier un houblon hyper aromatique type Galaxy d'un houblons plus "fade"
  type saaz ». Les fiches le portent : Galaxy (Fruits tropicaux · fruit de la passion, ananas ; Fruits à noyau · pêche ; huile
  1,8–5 mL/100 g) contre Saaz (CZ) (ses mots redisent ses familles : floral, herbacé, terreux ; huile 0,3–1 mL/100 g). Une carte
  de Comparer pose Galaxy face à Saaz : l'écart doit se lire d'un coup d'œil, sans jugement inventé (« fade » est son mot, pas
  le nôtre), et sans gêner (règle ci-dessous).
- **L'honnêteté** : un picto pour un mot qui est dans ses fiches, jamais pour un mot inventé.

## Chaque jeu rend
`<id>/etat.html` : la planche des 15 pictos et du picto « en plus » (16 et 32 px, chacun nommé), puis la version courte et la
version textuelle dans les deux cartes, avec leur légende ; `<id>/NOTE.md` (chaleur, idée du jeu, ce qui tient, ce qui casse,
sorties des contrôles) ; captures dans `captures/` : `<id>-planche.png` et `<id>-carte.png` (390 × 844). Les pictos portent
`data-mot="<mot>"`. Ouvre les captures (L12).
