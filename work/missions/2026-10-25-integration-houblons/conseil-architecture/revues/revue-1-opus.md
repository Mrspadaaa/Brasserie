**1. La plus solide : A.** C'est la seule qui a vérifié dans le code les deux pièges de l'hôte.
- Avec (a) ou (c) et des routes, le wizard est démonté. Au remontage d'une recette enregistrée, il affiche `DraftFreshnessChoice` (`BrewWizard.tsx:467`). Je l'ai vérifié dans le code.
- Avec (b) qui pousse l'historique, `onPop` renvoie toujours à `tabs` (`useFullScreenRoute.ts:64-66`, R3).

A en tire la seule solution qui tient : une pile de routes où le wizard reste monté, et une seule porte d'écriture. A fait aussi dépendre le worker d'une fabrique persistante.

**2. Le plus gros angle mort : D, et E en partie.** D veut un brouillon Dexie lu en direct par `liveQuery`, avec une route par outil. Le wizard se démonte quand même, et le choix entre brouillon et version enregistrée revient à chaque outil fermé. Pendant la migration, il y aurait aussi deux sources de vérité, donc encore D139. E choisit (c) avec le même trou. F, et C en partie, ajoutent une entrée d'historique par niveau sans voir R3 : le retour fermerait le wizard.

**3. Ce que toutes ont manqué : `RecipePage`, pourtant cité dans la question.** Sans wizard, il n'y a pas de brouillon. Personne ne dit où un outil écrit, ni si c'est hors ligne, ni comment sans écraser `hopV55*` (R7 : `stockItemRef` et `hopLotId` perdus). F dit seulement « alimenté par la recette ». Autre oubli : les états d'attente qu'ajoutent le worker et les chunks n'existent pas dans ses maquettes. Leur apparence est une décision du brasseur (règle n° 1).

LEÇON PROPOSÉE : avant de recommander une option de navigation, relire le gestionnaire de retour existant et les risques de l'état des lieux (R3) ; C et F ont proposé des entrées d'historique qu'`onPop` transforme en sortie vers `tabs`.
