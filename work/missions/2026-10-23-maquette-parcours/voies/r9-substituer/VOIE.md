# Voie r9-substituer — u4 enrichi : le dry hop, ajouter à Comparer, remplacer et fermer d'un toucher (D127)

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md` (à lire)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante
- Étape : reprise

## Ses mots (24.10, soir, sur « u4 · ton choix »), mot pour mot
« bien mais trop centré ibu, il faudrait aussi pas que à 60' mais aussi en dry hop. SI non plutôt bien. Attention à toujours
utilisé la baseline. Aussi ajouter à comparé doit être facile. Et le remplacement aussi. Ainsi que ferme la vue » (SPEC § 1, D127).

Puis, sur la capture entière de u4, une coche rouge au tableau « Arômes 16D » (familles au style et hors style, une barre par
houblon, pointillé = non décrit, « aucune des trois fiches ne les décrit, ce n'est pas zéro ») : « Ça c'est vraiment bien » ;
et aussitôt : « Trop centré ibu quand même ». Sa capture : `work/refonte-frontend/v4/choix/commentaires/captures/2026-10-24-u4-aromes-coche.png`.

## Le plancher : u4, tel qu'il est rendu
Substituer de la maquette commune : `prototypes/houblons-v4/parcours/src/ecrans/substituer/` (rendu :
`prototypes/houblons-v4/maquettes/parcours/substituer/etat.html` ; joue-le ; sa capture u4 :
`work/refonte-frontend/v4/ecran-1/fils11-substitution/captures/u4-vue-390.png`). Ses 15 états (`work/refonte-frontend/v4/choix/
etats/substituer.json`) restent tous verts. Plancher à enrichir (L07) : tout ce qui est là reste.

## Ce que tu ajoutes
0. **Moins centré sur l'IBU, à tous les moments, 60′ compris** : le tableau « Arômes 16D » est un acquis (garde-le tel quel,
   sa forme, ses mots, son pointillé) ; au premier écran, l'arôme pèse autant que l'amertume : ce que chaque remplaçant change
   aux familles de sa stout se lit à côté de son score, pas seulement plus bas. « Même IBU » reste une information sur la dose,
   pas le titre de l'écran. Au dry hop, c'est le tableau des arômes qui répond.
1. **Le moment** : les remplaçants se lisent à 60′, au whirlpool et au **dry hop** (le moment de l'ajout par défaut : Nugget à
   60′). Un toucher change de moment, au premier écran ; le classement est recalculé par le moteur à ce moment (`substitutes()`
   et ses poids : `cerveau/metier/substitution-moteur.md` ; au dry hop, aucun IBU, l'arôme compte). La forme : la puce de moment
   des variantes du lot D125 que le critique a gardées (`work/refonte-frontend/v4/ecran-1/fils24-substituer/sbc1b/`,
   `…/sbz7c/` ; leurs captures `-60`, `-whirlpool`), étendue au dry hop. Le score reste honnête (plage, « ? », jamais 0 pour
   l'inconnu) ; à 60′, la phrase qui dit que l'arôme compte peu reste.
2. **Ajouter à Comparer, d'un toucher** : depuis un remplaçant (sa ligne ou le face à face), il l'envoie à Comparer avec Nugget
   (la route `#/comparer?h=…` existe, voir `prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs`), sans quitter le geste
   de remplacer.
3. **Remplacer et fermer** restent d'un toucher : « Remplacer » visible sans défiler, la croix en haut (D109) ; ne les déplace pas.
4. **La baseline, toujours** : pictos de famille au trait, couleurs des familles, α et rôle en mot, au style, stock en petit badge,
   thème blanc (D106). L'IBU n'est pas le premier nombre lu : les arômes en couleur d'abord (L04, [[penser-brasseur]]).
Écris chaque choix de forme dans `NOTE.md` de l'écran (section « Reprise D127 »).

## Possède
`prototypes/houblons-v4/parcours/src/ecrans/substituer/**`, `prototypes/houblons-v4/maquettes/parcours-substituer/**`,
`work/missions/2026-10-23-maquette-parcours/voies/r9-substituer/RESULTAT.md`. Construis toujours avec
`--sortie=prototypes/houblons-v4/maquettes/parcours-substituer` (jamais la sortie par défaut : le pilote l'emploie). Besoin d'un
fichier hors de ce périmètre (le moteur, l'état partagé, Comparer) : demande-le au pilote, ne l'écris pas.

## Critères
Dans `GATES.md`. Captures du premier écran à chaque moment et après « Comparer », ouvertes à côté de u4 (L12). Réponse finale :
une ligne.
