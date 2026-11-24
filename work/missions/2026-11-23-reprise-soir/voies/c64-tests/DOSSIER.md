# Dossier c64-tests — règles tirées du test en ligne du tour 64 (voies/critique-64/RESULTAT.md)

Lignes : `grep -n "^| C64-\|^| C61-5 \|^| PX-1 " work/missions/BUGS.md`. Défaut : work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md § MESSAGE-RESTE-DANS-SON-CARNET.
- R47 (C64-8, BLOQUANT, données réelles touchées) : un message tapé dans un carnet OUVERT reste dans ce carnet ; le rangement par l'IA peut PROPOSER un autre carnet (le brasseur accepte d'un toucher), jamais y écrire seul. Teste le chemin complet : envoi depuis un carnet ouvert → réponse de rangement qui désigne un autre carnet → aucune écriture dans l'autre carnet.
- R48 (C64-1, BLOQUANT) : chaque prix lu est attaché à SON conditionnement (hopfenmarkt : 50 g = 3,60, 100 g = 6,70) ; jamais un prix d'un conditionnement avec la quantité d'un autre ; le prix au kilo est calculé avec la bonne paire.
- R49 (C64-2, BLOQUANT) : une boutique à paliers de quantité (Brau : 0,1044 CHF/g, 0,08 CHF/g dès 1 000 g) donne le prix du kilo AU PALIER (1 kg = 80 CHF), pas au tarif de base.
- R50 : C61-5 (jauge du 2e pleine et verte), un seul prix par article partout (≈3/≈4, 68,32/68,40), « Arômes et saveurs » = Arômes, « Pays de récolte » = Origine, « Caractéristiques absent » alors que lues, prix en EUR dans la liste, « Lecture de lien interrompue : 2 à reprendre » après suppression des carnets.
Code : src/ui/carnets/, src/domain/carnets/, functions/src/carnetIA.ts (rangement), functions/src/lien* (prix).
