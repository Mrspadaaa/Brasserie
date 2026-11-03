# Voie s-stock — une ligne réparée à la main entre-t-elle au stock ? (question du brasseur, 03.11)

Agent : auteur (Sonnet), maxTurns 30. Pilote : Opus.

## Ses mots
« quantité ou unité manquante; aucun stock automatique. -> okay mais une fois la donnée réparé à la main, ça fait bien le stock automatiquement ? »

## Ce que le pilote a lu (à vérifier, pas à croire)
- `src/ui/depense/finale.ts` `lignesDeLecture` : à la lecture, un ingrédient reçoit `stockAction` 'existing' (rapprochement), 'new' (règle produit
  non ambiguë) ou reste 'none'.
- `src/services/purchaseEntry.ts` ~l. 476–483 : à l'enregistrement, quantité et unité sont lues SUR LA LIGNE au moment d'enregistrer ; sans elles,
  « Rien n’entre en stock tant qu’elle manque ».
- `src/ui/finance/ExpenseSheet.tsx` ~l. 352–365 : « Une ligne retouchée ou déjà choisie par le brasseur n'est jamais reprise ».

## OWNS
- `tests/unit/depense/d381/stock-repare.test.tsx` (neuf) et `work/missions/2026-11-03-lecture-longue/voies/s-stock/RESULTAT.md`.
Aucune modification du code de l'app.

## À faire
Sur l'écran réel (`ExpenseSheet`, comme `tests/unit/depense/lecture-d/ecran.test.tsx` ou `tests/unit/depense/ecran/ecran.test.tsx` le montent),
avec une lecture FICTIVE simulée (aucun appel IA) :
1. Cas A : un ingrédient sans unité ni quantité, proposé « nouvel article » ; le brasseur tape quantité et unité, enregistre → l'écriture de stock
   (dépôt simulé) contient l'article avec la quantité et l'unité tapées.
2. Cas B : un ingrédient sans unité qu'un article du stock aurait relié avec l'unité (même nom, kg) ; le brasseur tape « 25 » et « kg » → relié
   tout seul ? ou reste hors stock tant qu'il ne coche pas ? Mesure ce que fait l'écran, ne le change pas.
3. Cas C : une ligne restée hors stock (`none`) ; après correction, que faut-il toucher pour qu'elle entre au stock ?
RESULTAT.md : pour chaque cas, ce que l'écran fait (geste par geste), la preuve (nom du test), et si un geste manque, la phrase exacte du défaut.

## Critères
- `npx vitest run tests/unit/depense/d381/stock-repare.test.tsx` → vert (les tests décrivent le comportement RÉEL, A au moins doit écrire le stock)
- `git status --short` → seulement OWNS.
Interdits : modifier l'app, appel IA, données réelles. Retour : une ligne avec la réponse (oui / non / oui si…).
