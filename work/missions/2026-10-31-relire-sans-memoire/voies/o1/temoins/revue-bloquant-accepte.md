# Revue du plan — témoin fautif : un bloquant accepté

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Le plan écrit dans Firestore sans transaction : un double clic crée deux dépenses | Passer par une transaction | acceptée | Le double clic est rare |
| 2 | majeur | Les centimes sont arrondis deux fois | Arrondir une seule fois | corrigée | — |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | détail | La fonction `enregistrerDepense` est citée sans fichier | Donner le fichier et la ligne | corrigée | — |
