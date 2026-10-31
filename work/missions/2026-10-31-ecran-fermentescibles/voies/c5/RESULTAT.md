OK — controle-volee : r4d ECHEC 6, témoin OK

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs` (le contrôle, Chrome sans écran, 390 tactile puis 1280 souris et clavier)
- `work/missions/2026-10-31-ecran-fermentescibles/voies/c5/temoin-ok.html` (témoin positif : 3 lignes de grain dont une « ? », plateau factice)
- ce RESULTAT.md

## Ce que le contrôle fait
Pour chaque largeur : REPOS (3 lignes, la 2e non choisie), puis, page rechargée à chaque fois, sur la 2e ligne `[data-sel]` :
masse (« 2,5 », Entrée), part (« 30 », Entrée, ou barre tirée à 30 % de sa largeur ; part lue 30 ± 1, masse changée), moment (un toucher
puis au plus un choix `ebullition`, menu dans la ligne ou son haut à 8 px au plus du bas de la ligne, ou cycle sans menu), couleur
(ligne en « ? », « 8 », Entrée ; « ? » remplacé par une teinte ; compte « à renseigner » − 1). Partout : deux gestes au plus, aucune
cible dans le plateau, détail non ouvert, aucun dialogue, aucune erreur de page. Une ligne OK / ECHEC par contrôle, aucun arrêt au premier échec.

## Critères
- G1 : `ECHOUE OK (VOLEE ECHEC, code 1)`
- G2 : `VOLEE OK (10)` sur le témoin
- G3 : voir plus bas (rejeu fait après écriture)

## TEMOIN r4d : sortie complète (node controle-volee.mjs v3/r4d/etat.html, code 1)
```
OK     REPOS 390 : 3 lignes, la 2e n'est pas choisie
OK     masse 390 : 1 toucher, « 2,5 », Entrée, la ligne lit 2,5
ECHEC  part 390 : aucune part sur la ligne (data-role="part-ligne") — il faut passer par le plateau
ECHEC  moment 390 : aucun moment sur la ligne (data-role="moment-ligne") — il faut passer par le plateau
ECHEC  couleur 390 : aucune couleur sur la ligne « ? » (data-role="couleur-ligne") — il faut passer par le plateau
OK     REPOS 1280 : 3 lignes, la 2e n'est pas choisie
OK     masse 1280 : 1 toucher, « 2,5 », Entrée, la ligne lit 2,5
ECHEC  part 1280 : aucune part sur la ligne (data-role="part-ligne") — il faut passer par le plateau
ECHEC  moment 1280 : aucun moment sur la ligne (data-role="moment-ligne") — il faut passer par le plateau
ECHEC  couleur 1280 : aucune couleur sur la ligne « ? » (data-role="couleur-ligne") — il faut passer par le plateau
VOLEE ECHEC 6
```
Lecture : seule la masse se règle sur la ligne de r4d ; part, moment et couleur ne le peuvent pas, aux deux largeurs. C'est sa plainte.

## Sortie sur le témoin (code 0)
```
OK     REPOS 390 : 3 lignes, la 2e n'est pas choisie
OK     masse 390 : 1 toucher, « 2,5 », Entrée, la ligne lit 2,5
OK     part 390 : 1 toucher, « 30 », Entrée, la part lit 30 %, la masse passe de 1.5 à 2.79 kg
OK     moment 390 : 1 toucher, 1 choix (menu dans la ligne), la ligne lit « ebullition »
OK     couleur 390 : ligne 3, 1 toucher, « 8 », Entrée, une teinte à la place du « ? », « à renseigner » 1 → 0
(mêmes cinq lignes OK à 1280)
VOLEE OK (10)
```

## Essais et preuves que le contrôle a des dents
Un essai par critère (aucune correction nécessaire). Trois mutations du témoin, copiées dans le dossier temporaire : la part ne change plus
la masse → `ECHEC part 390/1280 : part lue 19 % (30 attendu), masse 1.5 → 1.5` ; la couleur saisie n'enlève pas le « ? » → `ECHEC couleur … :
« ? » toujours là, teinte absente, « à renseigner » 1 → 1` ; menu de moment à 400 % sous la ligne mais descendant de la ligne → reste
OK (le contrat accepte tout descendant de la ligne).

## Doutes et limites
- Pas de capture : le contrôle est un script de gestes, pas une interface montrée ; le témoin n'est montré à personne. Je n'ai pas ouvert son rendu en image.
- Branche « barre tirée » de la part : écrite d'après le contrat (barre graduée de 0 à 100 % sur sa largeur), jamais exercée (le témoin a un champ). À valider sur la première page qui aura une barre (p5 : r4e-a, r4e-b).
- Un menu de moment qui est un descendant de la ligne passe même s'il flotte loin (contrat : « descendant de la ligne OU collé »).
- Si la 2e ligne démarre déjà en « ébullition », le contrôle échoue en le disant (le geste ne prouverait rien) ; vrai pour du grain, à relire si une page démarre autrement.
- Le moment est lu sans accent (normalisé) dans les messages : « ebullition ».
- Le compte « à renseigner » est lu dans le texte visible de la page (`N couleur(s) à renseigner`) ; absent après le geste = 0.
- `systeme.mjs appels controle-volee.mjs` : 4 appels (c5 ×2, p5 ×2), tous nommés dans des GATES.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
