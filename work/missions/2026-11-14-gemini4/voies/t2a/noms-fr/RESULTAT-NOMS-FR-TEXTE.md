# Désignation en français, texte seul — résultat

## Désignation en français, texte seul — comptes seulement

| | gemini-4-hydrogen | gemini-3.8-flash | gemini-4-argon |
|---|---|---|---|
| Appels (sans réponse) | 7 (0) | 7 (0) | 7 (0) |
| Lignes sans défaut / lignes | 90 / 94 | 89 / 94 | 91 / 94 |
| défaut « manquant » | 0 | 0 | 0 |
| défaut « langue » | 2 | 2 | 2 |
| défaut « marque » | 0 | 0 | 0 |
| défaut « chiffre » | 0 | 0 | 0 |
| défaut « option » | 0 | 0 | 0 |
| défaut « unite » | 0 | 0 | 0 |
| défaut « long » | 0 | 0 | 0 |
| défaut « identite » | 1 | 1 | 1 |
| défaut « incoherent » | 1 | 2 | 0 |
| Durée médiane par pièce | 3,9 s | 3,0 s | 7,9 s |
| Durée maximale par pièce | 4,6 s | 4,3 s | 8,2 s |
| Jetons d’entrée / de sortie (médiane par pièce) | 945 / 830 | 691 / 171 | 945 / 180 |
| Coût total (CHF) | 0,0631 | 0,0258 | 0,0401 |

### gemini-4-hydrogen — par pièce et par genre (lignes sans défaut / lignes)

| pièce | lignes |
|---|---|
| doc1 | 7 / 7 |
| doc3 | 2 / 2 |
| doc5 | 25 / 26 |
| doc7 | 7 / 7 |
| doc9 | 24 / 26 |
| doc11 | 24 / 25 |
| doc13 | 1 / 1 |

- capture : 14 / 14
- photo : 28 / 29
- PDF : 24 / 26
- plusieurs captures : 24 / 25

### gemini-3.8-flash — par pièce et par genre (lignes sans défaut / lignes)

| pièce | lignes |
|---|---|
| doc1 | 7 / 7 |
| doc3 | 2 / 2 |
| doc5 | 25 / 26 |
| doc7 | 6 / 7 |
| doc9 | 24 / 26 |
| doc11 | 24 / 25 |
| doc13 | 1 / 1 |

- capture : 13 / 14
- photo : 28 / 29
- PDF : 24 / 26
- plusieurs captures : 24 / 25

### gemini-4-argon — par pièce et par genre (lignes sans défaut / lignes)

| pièce | lignes |
|---|---|
| doc1 | 7 / 7 |
| doc3 | 2 / 2 |
| doc5 | 25 / 26 |
| doc7 | 7 / 7 |
| doc9 | 25 / 26 |
| doc11 | 24 / 25 |
| doc13 | 1 / 1 |

- capture : 14 / 14
- photo : 28 / 29
- PDF : 25 / 26
- plusieurs captures : 24 / 25

Les règles sont des indices (lexique allemand, anglais, italien ; marque, chiffre, option, unité, identité, cohérence) : le verdict final est la lecture des paires (base, français) du fichier privé `noms-fr-texte-paires.json`.
