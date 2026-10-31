# Revue du plan — témoin juste

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Le plan arrondit le total avant la TVA (`PLAN.md`, § Changements) : un centime perdu par ligne | Arrondir une seule fois, sur le total | corrigée | — |
| 2 | majeur | Aucun cas « hors ligne » dans les tests du plan | Ajouter un test sur fixture sans réseau | contestée | Le hors ligne est déjà couvert par `tests/unit/purchaseEntry.test.ts` (cas « brouillon local ») |
| 3 | détail | Le nom de la fonction `calculerTotaux` prête à confusion | Renommer | acceptée | Le renommage toucherait douze fichiers pour un gain nul |

## Prêt à coder

Aucun constat : j'ai ouvert chaque fichier cité par le plan (`src/services/purchaseEntry.ts` et ses tests), chaque fonction y existe aux lignes données, et aucun test n'appelle Gemini.
