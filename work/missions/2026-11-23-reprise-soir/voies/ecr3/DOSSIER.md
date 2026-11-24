# Dossier ecr3

## Sa demande (23.11, mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »

## Constats du test en ligne du tour 40 (BUGS.md, mot pour mot)
 E40-1 | Test en ligne, tour 40 (écritures) | Saisir à la main › Apport et Pour moi, Revient Mois 6 mois, puis Calendrier et Finances › Prévisions (390 px, en ligne index-CRA3EhuZ.js) | Enregistrer ZZ TEST — Apport +5 et ZZ TEST — Pour moi −2,50, reçus/payés le 21.11, chaque mois → observé : l’occurrence du 21.11, déjà saisie, revient « à payer » le 23.11 : Prévisions « TEST +5, 23.11 » puis 21.12, 21.01, « TEST −2,50 (3 fois) » ; Calendrier « ZZ TEST — Apport, à payer, 23 nov., +5 / mois » et « Pour moi, à payer, 23 nov. » ; à dépenser −468 au lieu de −470,8 (Abonnement, même réglage, juste : 21 déc.) ; attendu : la 1re occurrence liée à l’écriture saisie, suivante le 21.12, et pas « à paye
 E40-2 | Test en ligne, tour 40 (écritures) | Calendrier, rangée Ventes (390 px, en ligne index-CRA3EhuZ.js) | ZZ Vente +4,80 à recevoir 23.12, ZZ Apport +5 par mois, ZZ Autre entrée +1,10 → observé : Apport (tirelire), Autre entrée et le vrai « De ma poche +1 200 » restent dessinés dans la rangée Ventes ; la pastille dit « +15 prévu S48–S53 » (vente 4,80 + deux apports de 5), puis « +14 » après la vente passée à 3,80 (suite de E38-1, C38-3) ; attendu : apports hors de la rangée et du total des Ventes (« hors ventes ») | B | ouvert — présent 
 E40-3 | Test en ligne, tour 40 (écritures) | Calendrier, rangée Papiers (390 px, en ligne index-CRA3EhuZ.js) | ZZ Pour moi −2,50 par mois (privé) → observé : rangé dans Papiers, compté dans la pastille « −617 prévu S48–S53 » (600 + 5 + 1,20 + 4 + 2 + 2,50 + 2,50), alors que la saisie dit « Mon mois inchangé : un prélèvement n’est pas une charge » ; attendu : le privé hors des totaux des rangées de l’activité, comme Mon mois | m | ouvert — présent 
 E40-4 | Test en ligne, tour 40 (écritures) | Finances › Opérations › écriture › Modifier, et Calendrier › Ouvrir › Modifier (390 px, en ligne index-CRA3EhuZ.js) | Ouvrir Modifier sur ZZ TEST — Achat et ZZ TEST — Vente → observé : Revient, Règlement, Référence, Note et coche y sont, mais la fiche reste autre que la saisie : Nom et « catégorie, précision » en champs, « Montant sans TVA », date en champ sans pastille ni curseur, pas d’en-tête « Ça sort / Ça rentre · sorte · changer », pas de grand montant (suite de E38-4) ; attendu : la même feuille que la saisie | m | ouvert — présent 
 E40-5 | Test en ligne, tour 40 (écritures) | Calendrier, bande récurrente ZZ TEST — Apport (390 px, en ligne index-CRA3EhuZ.js) | Toucher la bande « +5 / mois » → observé : l’app passe à Finances, au bloc En caisse ; ni l’écriture ni sa prévision ne s’ouvrent (une seule fois jouée) ; attendu : la carte de la chose touchée, comme pour la Vente (S52, Ouvrir, Lier) | m | ouvert — présent 
 E40-6 | Test en ligne, tour 40 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-CRA3EhuZ.js) | Ouvrir la liste → observé : elle propose ZZ Salaire, Loyer et Impôts encore à payer (rien de payé à rembourser) ; attendu : seulement des pièces payées ou encaissées | m | ouvert — présent 
 E40-7 | Test en ligne, tour 40 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-CRA3EhuZ.js) | Lire la liste → observé : Loyer, Salaire, Impôts, Abonnement, Autre sortie portent tous le chariot d’Achat, Autre entrée porte l’étiquette de Vente, et chaque ligne répète son nom (« 23.11 · ZZ TEST — Vente ») ; attendu : le picto de sa sorte (maison, mallette, %, flèches) et une sous-ligne utile | D | ouvert — présent 

## Rapports
voies/critique-40/RESULTAT.md et cap/ ; voies ecr2, fix38c (RESULTAT.md : où vit chaque règle).

## Règles
- Une écriture qui revient : l'occurrence déjà saisie (payée/reçue) n'est jamais redite « à payer » ; l'Abonnement fait juste : même chemin pour Apport et Pour moi.
- Apport : hors des Ventes au Calendrier (ni dessiné dans la rangée Ventes, ni compté dans sa pastille) — la décision précédente n'a pas tenu, trouve pourquoi (deux chemins ?).
- « Pour moi » (prélèvement privé) n'est pas une charge : hors des totaux de Papiers.
- Modifier = la même feuille que la saisie (en-tête Ça sort / Ça rentre, grand montant, curseur de date, sans « Montant sans TVA »).
- Toucher une chose au Calendrier ouvre cette écriture, jamais un autre écran.
- Remboursement « De quelle pièce ? » : seules les pièces payées ; une icône par genre ; pas de nom répété.

## Aussi : registre
Mettre à jour l'état (colonne état seulement) de E38-2, E38-3, E38-5, E38-7, E38-8, E35-13 : « vérifié — en ligne index-CRA3EhuZ.js (tour 40), 24.11 » (preuve : voies/critique-40/RESULTAT.md). node scripts/agents/controle-bugs.mjs → BUGS OK.
