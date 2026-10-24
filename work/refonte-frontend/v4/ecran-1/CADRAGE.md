# Écran 1 — L'arôme de ma recette, lu au style (cadrage, une page)

Méthode v2, étape 1. Sources : `../SPEC-BRASSEUR.md` (§ référencés).

**Question de l'écran : « Ma bière est-elle là où le style l'attend, et que puis-je changer ? »**

## Récits

1. **Quand** j'ouvre ma recette, **je veux** voir d'un coup d'œil les familles d'arôme qui
   s'écartent de ce que le style attend, **pour** savoir s'il y a quelque chose à corriger.
   « Les échelles doivent être revu en fonction du style. » (§ 2)
2. **Quand** ma bière me semble trop résineuse, **je veux** demander « plus floral, moins
   résineux » en un geste, **pour** que le moteur me propose des houblons.
   « ma stout est trop résineuses, je la veux plus floral. La moteur nous propose
   plusieurs houblons » (§ 1)
3. **Quand** le moteur répond, **je veux** voir pour chaque voie ce qu'elle change et si je
   l'ai en stock, **pour** en garder deux ou trois à comparer.
   « et on peut ensuite comparé. » (§ 1)
4. **Quand** je veux comprendre, **je veux** ouvrir le détail (chiffres, sources, raison),
   **pour** décider en connaissance de cause, sans qu'il encombre la vue.
   « Mais que son je veux aller dans le dur, comprendre vraiment, confronté mes idées
   […] soit possible. » (§ 1, C062)
5. **Quand** le modèle ne sait pas, **je veux** le voir d'un signe, **pour** ne pas lire
   d'explication. « les info sont des actionnable pas des "information, warning" ou
   explication » (§ 3, C081)

## Périmètre

- Dedans : lecture au style, demande de direction, réponse en voies, marquage de 2 ou 3
  voies. Bascule de bière (stout export 16D par défaut, lager tchèque 3B).
- Dehors (écrans suivants) : la comparaison détaillée, la vue d'ensemble des houblons
  d'un style, la pose de la voie dans la recette.

## Boîte de temps et coupe-circuit

- Fils de fer jusqu'au coup d'œil du brasseur : 2 h.
- Tranche verticale : 3 h.
- Coupe-circuit : si aucun fil de fer ne passe les contrôles du plan 1 après une relance,
  l'écran se réduit à la lecture au style seule (récits 1, 4, 5), et les voies passent à
  l'écran suivant.
