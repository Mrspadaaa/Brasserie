OK — 6 problèmes, 0 bloquant (les 4 demandes du 09.11 sont tenues : rouge des totaux, renvois sans recherche, plus de chevauchement, un seul bouton « Documents »)

Version : HEAD c64aad35 + arbre de travail de la voie p1 (non commité)
Lecture des images seulement (consigne), pas de serveur. Ouvertes en plein format : ses captures `captures-brasseur/5-pharmacie-2pages.jpg` et `7-entree.jpg` ; montages clair | cave de la voie (`voies/p1/captures/montage-*.png`) : pharmacie-2pages 390 et 1280, bauhaus-piege 390 et 1280, bauhaus-piege-confirme 390, bauhaus-tache 390 et 1280, bauhaus-un-manque 390 et 1280, bauhaus-copie 390, entree 390 et 1280, entree-saisie 390 et 1280. Non ouverts : piege-confirme 1280, copie 1280 (mêmes états que leurs 390, mêmes valeurs d'après RESULTAT).

## Table
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| pharmacie-2pages | clair, cave | 390, 1280 | repos ; après « Voir le désaccord » | 5 | — |
| bauhaus-piege | clair, cave | 390, 1280 | repos ; après « Comparer à la photo » | 1 | — |
| bauhaus-piege-confirme | clair, cave | 390 | repos ; après « Comparer à la photo » (identique à piege) | 1 | — |
| bauhaus-tache | clair, cave | 390, 1280 | repos ; après Articles ; après Somme ; après Lectures | 3, 4, 5 | — |
| bauhaus-un-manque | clair, cave | 390, 1280 | repos ; après Articles ; après Somme | 2 | — |
| bauhaus-copie | clair, cave | 390 | repos ; après Somme ; après Prix connus ; après Lectures | 4, 5 | — |
| entree | clair, cave | 390, 1280 | entrée « Documents » | 6 | — |
| entree-saisie | clair, cave | 390, 1280 | formulaire discret « Joindre des documents » | — | — |

## Ce qu'il a demandé, côte à côte avec ses captures
- Sa capture 5 : « Artic5es·lu2 rabais · annoncé par la lecture » chevauché → p1 : « Articles lus   5 · 2 rabais », note « annoncé par la lecture » dessous, à 390 et 1280. Tenu.
- Sa capture 5 : « À vérifier · Lectures · 2 pages » → p1 : « À vérifier · 1 désaccord de lecture ». Tenu.
- « quand 2 totaux sont incorrectes, ça le marque pas en rouge » → piège : « Somme ≠ imprimé 277,60 / 352,05 −74,45 » en rouge, cadre et en-tête « À vérifier · 74,45 CHF » rouges ; tache et un-manque : Articles et Somme rouges. Tenu (réserve au point 1).
- « le renvoie est très étrange » → plus de focus dans la recherche : « Ajouter la ligne manquante » ajoute une ligne ouverte ; « Comparer à la photo » ouvre le justificatif ; « Ouvrir la ligne suspecte » ouvre C01. Le libellé dit ce qui arrive. Tenu (réserves 2, 3, 5).
- Sa capture 7 : « Un document | Plusieurs » → p1 : un bouton noir « Documents » (picto fichiers), « Photographier le ticket » dessous à 390, « Saisir sans justificatif ». Tenu (réserve 6).

## Combien et quels problèmes ? 6, 0 bloquant

1. **Piège (repos, 390 et 1280) : « ✓ Payé · TWINT 352,05 » en vert alors que les lignes font 277,60.** Il a dit « 2 totaux sont incorrectes » : pour lui l'imprimé et le payé sont faux tous les deux face aux lignes ; l'écran lui montre un rouge et un vert, et la rangée ne dit pas à quoi « Payé » est comparé. En brasseur : « le payé est à 352 et mes lignes à 277, pourquoi il est vert ? ». Correction : libellé « Payé = imprimé · TWINT », ou rangée Payé en ambre (non vérifiable) quand la somme des lignes ne couvre pas l'imprimé. Non bloquant (la valeur est juste).
2. **Un-manque (après Articles, 1280 clair et cave) : la ligne est ajoutée (74,45, « 1 à remplir ») mais la rangée « Articles lus ≠ comptés 29 / 30 −1 » garde son geste « Ajouter la ligne manquante › ».** Un second toucher ajouterait une deuxième ligne vide. Correction : une fois la ligne ajoutée, le geste devient « Remplir la ligne ajoutée › » (ouvre et focalise la ligne) ou disparaît au profit de la chip « 1 à remplir ». Non bloquant.
3. **Tache (repos, 390 et 1280) : « Ajouter la ligne manquante » au singulier sur « 23 / 29 −6 », et le même geste sur la rangée Somme (−117,65).** Six lignes manquent ; le geste en ajoute une, vide, sans montant (« 234,40 + ? »). En brasseur : « il m'en manque six, il m'en met une vide ? ». Correction : au-delà de −1, « Comparer à la photo » (les lignes manquantes sont sur le ticket) ou « Ajouter une ligne manquante » ; la rangée Somme renvoie à la photo. Non bloquant.
4. **En-tête du bloc à rallonge, deux lignes à 390** : tache « À vérifier · 117,65 CHF · 6 articles · 45 désaccords de lecture », copie « À vérifier · 155,40 CHF · Prix connus 1 ligne à revoir · 25 désaccords de lecture ». Trop de texte au premier plan (SPEC « trop de texte », D277 : le pied dit le pire point, un seul). Correction : le pire point seulement (« À vérifier · 117,65 CHF manquants »), le reste dans les rangées. Non bloquant.
5. **Le renvoi ouvre la bonne ligne, mais la ligne ouverte ne dit pas pourquoi** : copie « Ouvrir la ligne suspecte » → C01 « 1 pièce × 66,95 = 66,95 », rien sur « 6,95 connu (×9.6) » ; pharmacie et tache « Voir le désaccord » → ligne 1 sans l'autre nom lu. À 390, le bloc qui porte la raison est hors de vue après le défilement. Déjà noté au VERDICT-3 (existant, D329). Correction : une note dans la fiche ouverte (« prix connu 6,95 » ; « autre lecture : … »). Non bloquant.
6. **Entrée (390 et 1280) : rien ne dit la règle du bouton « Documents ».** Il demande « la logique derrière choisir quoi faire … c'est clair ? » : la note dit « PDF ou image · lecture automatique · 4 Mo max. », pas qu'un fichier = une dépense et que plusieurs photos = les pages d'un même ticket. Correction : « Un fichier, ou plusieurs photos du même ticket · PDF ou image · 4 Mo max. ». Non bloquant.

## Doutes (non comptés)
- « · Qté × prix 29/29 justes » en gris (point, pas de coche) quand la somme ne couvre pas l'imprimé (code : `couvertureEcart ? 'inconnu' : 'ok'`) : honnête, mais « justes » sans coche se lit comme une contradiction ; à voir s'il tique.
- Note « annoncé par la lecture » sous « Articles lus 5 · 2 rabais » : sens pas évident en trois secondes (« compte annoncé par le ticket, non vérifié »).
- Banc pharmacie sans « 2 pages » (`nPagesLues` non appliqué) ni rangée « TVA recalculée · 2 taux » : la rangée « Lectures · 2 pages » de sa capture n'a pas été vue rendue ; le texte est couvert par test unitaire seulement.
- Justificatif du banc cassé (« Justificatif source ») : « Comparer à la photo » ouvre bien le cadre, le contenu n'est pas jugé.
- Sélecteur natif (`multiple`, sans `capture`, PDF + images) : mesuré par la voie, pas visible en capture ; à toucher sur son téléphone au jeu en ligne.
- Bloc après « Comparer à la photo » à 390 : la photo est en haut, le bloc et les lignes dessous ; comparer demande de défiler. Acceptable, à voir avec lui.

## Ce qui tient (vu)
- Rouge `alert` sur Articles, Somme, en-tête et cadre ; ambre gardé pour Lectures, Prix connus ; vert pour Payé, Lectures d'accord ; lisible en clair et en cave, 390 et 1280.
- Aucun chevauchement sur les 14 montages ouverts ; rangées à la ligne.
- Chaque pastille rouge a un geste qui fait ce qu'il dit ; aucune recherche focalisée ; la ligne ajoutée porte le manque (74,45) quand un seul article manque.
- Un bouton « Documents », picto fichiers, noir à 390 ; « Joindre des documents » dans le formulaire discret ; « Photographier le ticket » et « Saisir sans justificatif » gardés.
