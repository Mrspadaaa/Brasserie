# Tour 8 : parcours au doigt sur le banc local (21.11)

Le contrat demandait le Chrome du PC, en ligne. Ce n'était pas possible :
- l'extension Claude in Chrome est déconnectée (aucun navigateur relié) ;
- le navigateur intégré demande la connexion Google.

Repli accordé par la session pilote : build du tag `en-ligne/2026-11-21-tour8` (5fb61c580) dans `%TEMP%/tour8-src`, avec `scripts/parcours/vite.parcours.config.mjs` et les fixtures « ZZ TEST » de `scripts/parcours/fixtures`. Tout est joué en 390 tactile (CDP touch), avec les scripts du tag :

| Parcours | Résultat |
|---|---|
| `calendrier.mjs` (frise, barres, événements, période, rechargement) | PARCOURS CALENDRIER OK |
| `carnet.mjs` | PARCOURS CARNET OK |
| `chaines.mjs` (recette → brassin → stock → vente, doses, courses, Bord) | PARCOURS CHAINES OK |
| `principes.mjs` (nom obligé, poser, renommer, horizon) | PRINCIPES ECHEC (6), dont 3 non joués |

Le cadre de période de la courbe a son rapport à part, avec 8 défauts : `work/missions/2026-11-21-cal-frise-prix/RAPPORT.md` (CFP-1 à CFP-8).

## Combien et quels problèmes ? 3, plus 1 note

1. T8-1 : Calendrier › Papiers, + Ajouter, à 390. Dans le champ « Autre nom », Entrée ne fait que fermer le clavier. L'événement n'est pas posé et le nom par défaut « Papiers · S47 » reste. Capture `nom-cal-papiers-entree.png`.
2. T8-2 : même feuille. Le toucher sur le bouton de pose ne valide rien. Il faut deux gestes pour ouvrir, et le nom reste « Papiers · S47 ». Capture `pose-cal-papiers-pose-valide.png`.
3. T8-3 : Calendrier, renommer un événement. Le renommage marche : toast « Renommé : ZZ TEST Nom » et ligne renommée. Mais la fiche se ferme à Entrée, et il faut 4 gestes en comptant l'ouverture de la fiche. Le principe du parcours veut que la fiche reste et montre le nouveau nom. Capture `renommer-renommer-evenement-fait.png`.

T8-NOTE-1 : trois contrôles des principes n'ont pas été joués, parce que le script ne trouve pas son entrée (« Atelier R&D », « Stocks » depuis Brassins) : nom obligé d'une idée de l'Atelier, du matériel, horizon d'un projet. C'est un banc à remettre au nom actuel des écrans, pas un défaut établi.

## Non joués (motif : pas de Chrome du PC ni de session en ligne)

- Le 1280 et le thème sombre.
- Fûts, Finances et Bord au doigt, hors de ce que couvre `chaines.mjs`.
- Les données réelles.
- Le bandeau « Enregistrement sur le serveur… », qui n'existe qu'en ligne.

## Données ZZ TEST

Tout était local, dans le magasin du build de test (localStorage d'un Chrome sans écran, jeté à la fin). Rien n'a été écrit en ligne, rien n'est à retirer.
