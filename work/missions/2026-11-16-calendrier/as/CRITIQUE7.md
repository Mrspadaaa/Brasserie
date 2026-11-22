OK — 3 problèmes, 2 bloquants ; note 5/10

# Critique 7 (17.11) : `pub/calendrier.html` au doigt, avec rotation

Version : arbre de travail sur cce31353 (pub/ du 17.11, 11 h 52, non commité).
Jeu : `cap/critique7/jouer.mjs`. Une seule session sur `pub/calendrier.html`, sans recharger la page :
- en hauteur, 390 × 844 tactile : Porter (f4-b), appui long sur Marché de Noël puis Retirer et Annuler (f5-a), glisser (f1-a), allonger puis décaler la Blonde (f2-a, f6-b), Livrer ;
- en hauteur toujours : le + volant (un brassin en S50), le + de chacune des 7 rangées jusqu'à la pose, une deuxième vente en S49, Modifier S47 → S51, Retirer puis Annuler, c2-b et c3-a ;
- on tourne en 844 × 390 : le + volant (un brassin en S52), le + d'Achats, allonger la Blonde, c1-d (An) ;
- on revient en hauteur ; on passe en cave dans les deux sens ; puis 1280 × 800.

Résultat : 52 captures, **toutes ouvertes**, sur les planches `_pl-p-0` à `_pl-p-10` et `_pl-l-0` à `_pl-l-5`, et `52-d-1280` en plein format. 0 erreur de page. Mesures : `cap/critique7/_jeu.json`.

Phrase prédite : « J'ajoute un brassin, je tourne le téléphone pour mieux voir, et il a disparu ?? Ça sert à quoi de tourner alors. »

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 40-l-apres-rotation, 44 à 48, 49-p-apres-retour | clair | 390 → 844 → 390 | on tourne après des gestes | 1 | 1 |
| 52-d-1280 | clair | 1280 | repos en largeur | 1 | 1 |
| 06-p-f1a, 21, 23, 25, 27, 28 | clair | 390 | message après un geste | 1 | 0 |
| 01 à 39 (repos, f4-b, f5-a, f1-a, f2-a, f6-b, Livrer, 7 feuilles et poses, 2e vente, Modifier, Retirer/Annuler, c2-b, c3-a), 41 à 48, 50, 51 | clair, cave | 390, 844 | chaque geste dans un seul sens | 0 | 0 |

## Problèmes (les plus graves d'abord)

1. **Valeur fausse, geste sans effet (bloquant). En tournant, on change de calendrier.** Les deux vues sont deux pages séparées qui ne partagent rien (aucun échange entre `portrait.html` et `paysage.html`).
   - En hauteur, on a posé 9 choses, décalé la Blonde et fait Livrer. La tête dit −527. On tourne (40-l-apres-rotation) : 113 CHF à dépenser, Blonde « J0 / 28 », aucune chose posée, Ventes +900.
   - En largeur, on ajoute un brassin et un malt, et la tête passe à −327 (48). On revient en hauteur (49) : on retrouve −527 et les ajouts faits en hauteur, mais ceux de la largeur ont disparu.
   - La même caisse affiche donc 113, −327 ou −527 selon le sens du téléphone. Comme il veut justement tourner le téléphone pour travailler (« si non c'est pas vraiment utilisable »), ce qu'il fait d'un côté est perdu de l'autre.
   - Correction : un seul état pour les deux vues. Le mieux est une seule page, dont la mise en page change avec l'orientation. Sinon, le parent garde les données et les deux cadres rejouent chaque action (ajout, retrait, Annuler, glisser, Livrer, Modifier). Le contrôle `controle-rotation.mjs` doit poser une chose, tourner, puis vérifier que la chose, la pastille et la tête sont toujours là. Aujourd'hui, il ne vérifie que la vue visible ; il doit échouer sur la version actuelle.
2. **Valeur fausse (bloquant), en 1280 × 800 (tablette ou ordinateur en largeur).** Le cadre de la largeur fait toute la largeur de l'écran (100vmax = 1280), mais la frise reste dessinée pour 844 px.
   - Les semaines de la bande sont espacées de 97 px, alors que les colonnes et les barres le sont de 63 px. Les barres, la courbe et le loyer s'arrêtent vers 830 px.
   - Exemples : le Porter commence dans la colonne S51 mais s'affiche sous S49 et S50 ; l'IPA houblon à cru s'affiche sous S53 au lieu de S3. On lit donc de fausses semaines.
   - Correction : soit la frise en largeur calcule sa colonne à partir de la largeur réelle, soit la vue se limite à 844 px, centrée. Contrôle à faire : BANDE `--paysage` rejoué en 1280.
3. **Pas pratique.** Après chaque geste, le message s'insère dans la rangée et pousse les rangées du dessous d'environ 56 px pendant 7 s. Quand il part, elles remontent toutes : ce qu'on visait bouge sous le doigt.
   - Captures : 06-p-f1a (Travaux et Activités descendus), 21, 23, 25, 27, 28. Le JOURNAL de la passe 7 le reconnaît (« Reste à voir »).
   - Correction : poser le message par-dessus la frise, dans la marge vide au bout de la rangée, sans réserver de hauteur. Ou bien garder la hauteur réservée jusqu'au geste suivant.

## Doutes (non comptés)

- **Sur un vrai téléphone, la barre d'onglets peut être cachée.** Le cadre en hauteur fait 100vmax, ce qui vaut la hauteur sans la barre d'adresse dans Chrome Android. Avec la barre d'adresse visible et `body{overflow:hidden}`, le bas du cadre (onglets et + volant) peut sortir de l'écran. Ce n'est pas visible au banc : à vérifier sur son téléphone, ou passer à `100dvh` et `100dvw`.
- La barre d'un brassin ajouté n'écrit pas « J0 / 28 · prête 4 janv. », contrairement à la Blonde (12, 44). La date n'apparaît que dans le détail.
- Une fête ajoutée compte toujours en + (« Apéro des voisins +100 », 19). On ne peut pas saisir une fête qui coûte (stand, location).
- La deuxième vente de S49 est une pastille « +200 » seule sur sa ligne, sans nom (28). On ne sait pas que c'est le Bar du Lac sans la toucher. Les pastilles de la base n'ont pas de nom non plus.
- En largeur, après avoir allongé la Blonde (47), la bande des semaines cache le titre « Brassins » et sa pastille.
- Le message de Modifier redit S47 : « S47 → S51 · S47 : 3 630 → 3 730 » (31).
- Le + volant couvre « Noël privés +640 » ou la Commande groupée en hauteur (13, 15), comme dans la base.

## Ce qui tient (vu sur les captures)

Dans chaque sens pris seul, tout fonctionne. Chaque + ouvre sa feuille et pose la chose, sans chevauchement. La pastille et la tête suivent (Brassins −1 044 ; Ventes +1 230 ; Papiers −906).
Toucher une chose ouvre son détail. Modifier, Retirer et Annuler fonctionnent. Livrer hors vue donne un renvoi « La Cigogne 3 fûts S53 › ».
Les dates sont plausibles : la Blonde brassée le 23 nov. pour 35 j est prête le 28 déc. ; un brassin du 7 déc. pour 28 j est prêt le 4 janv. ; S53 existe bien en 2026.
c2-b, c3-a, c1-d (An) et le thème cave sont lisibles dans les deux sens.

LEÇON PROPOSÉE : une vue double (rotation, onglets, cadres) se prouve en faisant un geste d'un côté puis en regardant de l'autre. Un contrôle qui vérifie seulement quelle vue est affichée laisse passer deux états séparés.
