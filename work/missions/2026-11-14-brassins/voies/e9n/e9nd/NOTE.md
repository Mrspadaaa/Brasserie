# e9nd — les étiquettes de ma future gamme

Chaleur : chaude (forme libre : la gamme vue en étiquettes de bouteille).
Idée : les étiquettes de ma future gamme
Ce qui change : chaque idée est l'étiquette de sa future bouteille ; la pastille ronde, son prix.
Geste : après « Noter une idée », l'étiquette neuve Lager au miel (« Neuve », « couleur ? », « prix ? ») et le toast Annuler.

Fonctions de l’Atelier gardées : idées de bières (noter, fiche, supprimer, passer dans mes recettes), essais de tarifs, contacts (appeler), à faire, « Réfléchir à mes projets » (lien Réfléchir), Matériel renvoyé vers Rénovation. Statut : une pastille dans la fiche, plus d’avancement en premier plan.
Deux touchers par étiquette : la plaque ouvre « Le dos de l'étiquette » (degré, arômes, recette, pour quand, note, qui la prend) ;
la pastille ronde ouvre « Le prix sur l'étiquette » (formats, curseur m2, coût 2,10 et reste 3,90, carton à 5,00 la bouteille).
Premier plan actionnable : « Lucie, du Café du Midi, veut un fût » avec Appeler.
Écarts connus : le point Épicé (brun) se lit mal sur l'étiquette cuivrée, malgré son liseré blanc ; aucune 1280 (e9nb la porte).
Contrôle : IDENTITE OK (voir ../tests.txt).

## Passe g9 (15.11, corrections de k9)
- n° 1 : Saison à l'épeautre en étiquette neutre « couleur ? » (plus de jaune citron) ; Pils fumée en or (pâle).
- n° 2 : l'écart avoué (point épicé sur la plaque cuivrée) est levé : les arômes sont posés sur une capsule blanche.
- n° 3 : Nelson Sauvin en Tropicaux et Baies (le vin blanc est hors des familles) ; toutes les pastilles d'arômes aux couleurs des familles de l'app (src/data/hopV4/jetons-familles.json).
- controle-identite : ECHEC 8 % hors palette, à cause de ces couleurs de familles, absentes de la palette du contrôle (il lit themes.css, DESIGN.md et couleurs-portees.css, pas jetons-familles.json).
