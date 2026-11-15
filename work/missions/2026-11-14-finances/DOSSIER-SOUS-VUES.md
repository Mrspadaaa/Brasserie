# Dossier de conception — les sous-vues de Finances (14.11, soir)

Lu à la place des sources (D207). Couverture : `work/missions/2026-11-14-finances/COUVERTURE.md`.

## Ses mots (mot pour mot)
- 14.11 : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? »
- 14.11 : « … avec la création de mini maquettes (non jouable) SANS FABLE ».
- 10.11, sur v6a : « Lignes serrées » ; 09.11 : « plus compact les lignes ».
- 10.11 : « Les filtre de ce type sont super super pratique à ne pas enlever ».
- 14.11, sur s2ap2 : « Ça j'adore / Peut être juste un peu plus compact et toujours un endroit pour mettre des chiffres pour la version de l'ordinateur ».

## Ce qu'il aime et refuse (cerveau/brasseur)
- Pas de cockpit : un premier plan léger, le détail à un toucher ; peu de texte ; des représentations modernes (bascule, pastille,
  jauge, frise, édition sur place) plutôt que des phrases.
- Il est brasseur, pas comptable : les mots du métier (pièce, payé, à payer, brassin, malt, houblon), jamais le jargon (« écriture »,
  « contrepartie », « débit/crédit ») au premier plan.
- Saisie au téléphone : jamais `type="number"` (champ texte avec `inputmode="decimal"`), le clavier pilote la densité ; cible 44 px.
- Un inconnu n'est jamais un zéro : « ? » ou une case vide qui renvoie où le remplir.
- Une hachure veut dire « à payer » : ne pas lui donner un autre sens.

## La base, reprise telle quelle (règle n° 1)
L'écran derrière chaque feuille est sa maquette choisie, sans retouche : Opérations = `work/missions/2026-11-14-finances/ref/v6a/etat.html`
(rangées v6a, « ✓ Payé » 24 px, « + pièce »), Synthèse = `ref/g3a`, Prévisions = `ref/p5b`, Annuel = `ref/g6`. Reprendre leurs jetons
(couleurs, polices, rayons, ombres) pour que la feuille paraisse de la même app. Les données sont celles de v6a (loyer de l'atelier à payer
le 25 nov., malt et houblon payés le 9 nov., un retard de déc. 2025), en CHF.

## Ce qu'on cherche, par vue
Le **contenu** de chaque vue est celui du code actuel (champs, actions, règles) : c'est un **plancher à enrichir** (L07), jamais à réduire
sans dire pourquoi. On change sa forme : plus léger, plus clair, plus vite fait au pouce. Quatre variantes par vue, de genres différents :
- **a, tiède** : le contenu actuel, rangé et allégé dans le langage de v6a ;
- **b, froide** : le minimum au premier plan, le reste à un toucher ;
- **c, chaude** : un booster visuel porte la décision (frise, jauge, pastilles, aperçu de l'effet sur le mois) ;
- **d, libre** : une idée qu'on n'attend pas, qui tient debout pour un brasseur.

## Images (non jouables)
Une image par variante : l'état ouvert de la vue, 390 px de large, échelle 2 (780 px), thème clair, avec un peu de l'écran choisi
derrière quand c'est une feuille. Si la vue a un état clé (un doublon écarté, une plage posée, un paiement partiel), le montrer dans
cette même image (deux colonnes côte à côte interdites : une seule image à 390, qu'on peut faire plus haute).

## NOTE.md (10 lignes au plus)
Genre (a, b, c, d), ce qui change par rapport au code actuel, ce qui n'a pas changé, et ce qui manquerait au port.
