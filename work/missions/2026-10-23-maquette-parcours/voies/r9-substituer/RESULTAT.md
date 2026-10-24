OK — u4 enrichi : puce 60′/whirlpool/dry hop, arômes à côté du score, « + » Comparer ; G1 à G5 verts

## Fichiers écrits (Possède seul)
- `prototypes/houblons-v4/parcours/src/ecrans/substituer/index.tsx` : puce de moment, crans d'arômes par ligne avec Nugget
  en tête, « + » et « Comparer (n) › » (Nugget épinglé), ordre des sections hors 60′, mots du moment (« au dry hop »…).
- `…/substituer/substituer.css` : classes `pq-substituer-` (L26) pour la puce, les crans, le « + », la légende à droite.
- `…/substituer/jeu.mjs` : 3 gestes ajoutés (puce dry hop, + Comparer, retour à 60′) avant « Remplacer ».
- `…/substituer/NOTE.md` : section « Reprise D127 », chaque choix de forme.
- Captures : `prototypes/houblons-v4/maquettes/parcours-substituer/captures-d127/` (dossier ignoré par git, comme toute la sortie).

## Critères (rejoués depuis la racine, construction finale)
- G1 `construire.mjs --sortie=…/parcours-substituer` : `CONSTRUIT OK (9 pages)`
- G2 `controle-substituer-gestes.mjs` : S1 dry hop OK, S2 ajouter à Comparer OK, S3 remplacer OK, S4 fermer OK → `SUBSTITUER-GESTES OK`
  (sur la version de départ : `SUBSTITUER-GESTES ECHEC (2/4)`, S1 et S2)
- G3 `controle-etats.mjs --ecran=substituer` : `ETATS OK (14/14) ; 1 voulu(s) non rejoué(s)` (la croix, D109)
- G4 `controle-commun.mjs … substituer --page=etat.html --sans=mots` : `COMMUN OK` (un premier passage avait échoué sur STANDARD
  S3, des rayons de 1,5 px ; corrigé à 2 px)
- G5 `controle-choix.mjs --ecran=substituer` : `CHOIX OK` ; `controle-teinte.mjs` : `TEINTE OK 6/6`
- En plus : `verifier-types.mjs` TYPES OK ; `jouer-parcours.mjs --etape=substituer` ETAPE OK (dont le dry hop : moment
  `dryActive` dans le brouillon, recette inscrite restée `b60`, remplaçants pris dans le moteur, « au dry hop » en tête et en pied ;
  « + » : la liste partagée et « Comparer (2) ») ; `--ponts` PONTS OK ; `--routes` ROUTES OK (8/8) ; `controle-annuler` ANNULER OK.
- Hors GATES, déjà en échec sur la version u4 de départ (construction du pilote `maquettes/parcours`) et non aggravés :
  `controle-sans-famille` (forme « autres » de Nelson Sauvin au tableau) ; `controle-une-question --edition` (titre « Nugget »
  sans question, contexte d'un seul facteur ; il compte maintenant la puce de moment comme facteur libre, voir DÉCISION).

## Captures (ouvertes en images, à côté de u4)
- `…/captures-d127/cote-u4-60-whirlpool-dryhop.png` : u4 | 60′ | whirlpool | dry hop (premiers écrans)
- `…/captures-d127/cote-u4-plus-comparer.png` : u4 | après « + » sur Magnat (✓, « Comparer (2) ») | Comparer ouvert (`#/comparer?h=magnat&pin=nugget`, Nugget ⌖)
- `…/captures-d127/d127-60.png`, `d127-whirlpool.png`, `d127-dryhop.png`, `d127-dryhop-aromes.png` (au dry hop, le tableau
  « Arômes 16D » juste sous les bandes), `d127-plus-comparer.png`, `d127-comparer.png`, `d127-legende.png` (« ? » ouvert)

## Ce que la capture montre
- À 60′ : la tête, la réponse et l'échelle de u4, avec la puce « 60′ · recette | whirlpool | dry hop » au-dessus, et sous
  chaque nom les crans floral, herbacé, terreux | résineux. Nugget est en tête comme référence : le brasseur voit d'un coup
  d'œil que Nelson Sauvin (86) ne décrit aucune des trois attendues, et que Magnat ne garde que le floral.
- Au dry hop (un toucher) : « Au dry hop, l'arôme fait le score. Nugget au dry hop : ta stout passerait de 59,7 à 0 IBU ;
  chaque remplaçant à masse égale. » ; « Target, 86 sans inconnue. Target garde floral, herbacé et résineux, perd terreux
  (fiches). » ; Target 86, Falconer's Flight 83, Idaho 7 82… (moteur) ; pied « 46 g de Nugget à 60′ → 46 g de Cascade au dry hop ».

## DÉCISION (prise, réversible)
- DÉCISION : la puce place l'ajout du brouillon au moment touché, donc « Remplacer » inscrit aussi ce moment ; c'est la seule
  lecture où la dose, le classement et « Ma bière avec chacun » restent justes au moment affiché. Le prix est dit avant
  (59,7 → 0 IBU au dry hop) et dans le pied (deux moments nommés). Annuler et la croix laissent la recette à 60′.
- DÉCISION : le « + » écrit dans la liste de comparaison partagée (celle de Suggérer et de la fiche, D78) ; « Comparer (n) »
  compte Nugget plus les remplaçants retenus (3 au plus : Comparer a 4 colonnes).
- DÉCISION À PRENDRE (pilote, moteur hors Possède) : au whirlpool et au dry hop, `substitutes()` a les mêmes poids (contexte
  « arôme ») : le classement est identique, seuls la dose et le stock changent. Le brasseur pourrait le lire comme une puce
  sans effet. Une différence propre au dry hop (biotransformation, levure) se trancherait dans le moteur.
- DÉCISION À PRENDRE : aller à Comparer quitte le brouillon (la Coquille l'abandonne hors d'une route d'outil), donc revenir
  rouvre Substituer à 60′. Garder le brouillon de Substituer sous Comparer demanderait de changer `etat/etapes.ts` ou `Coquille.tsx`.
- `controle-une-question --edition` attend l'édition du moment en `button[data-edite="moment"]` dans la ligne de contexte ;
  VOIE.md demande un toucher au premier écran : la puce est un groupe radio. À adapter si ce contrôle entre dans la portée.

## Prédiction
« Là c'est bien : je vois l'arôme de chacun et je peux passer au dry hop ; par contre whirlpool et dry hop donnent la même liste ? »

CONNAISSANCE : au whirlpool et au dry hop, `substitutes()` donne le même classement (mêmes poids, contexte « arôme ») ;
seuls la dose (même IBU ou masse égale) et le stock suffisant changent ; Nugget est le seul amérisant de la stout S1 (au dry
hop, la recette passe de 59,7 à 0 IBU).
LEÇON PROPOSÉE : `jouer-parcours.mjs` touche la dernière cible visible (`cible()` → `.at(-1)`), pas la première : un
`verifier` de jeu.mjs qui relit « la » cible doit relire la dernière (perdu un essai ici).
