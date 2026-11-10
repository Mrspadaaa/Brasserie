# dp — captures « après » de l'état `medicament` (390 tactile, clair et cave)

Fixture locale `?dev-local&depense=medicament` (SIMULÉ : BENU Matran, MEFENACIDE 13,40), Nouvelle dépense ouverte par « Actions rapides ».
Pas d'« avant », pas de `git stash`, aucune requête hors localhost (Gemini et Firebase bloqués). Serveur `npx vite --port 3013 --strictPort`, arrêté à la fin.
Fichiers dans `voies/dp/captures/` : `clair-*` et `cave-*` pour : `piece-01` (la pièce entière, un seul cadre 390×844 sans défilement), `ligne-medicament`
(ligne dépliée : quantité, unité, prix), `drapeau-renvoi`, `date-achat` (repli ouvert), `tuile-reglement`, `reglement-ouvert` (panneau Règlement, « Date du paiement »), `paiement-autre-jour` (après clic « Autre date »), `fin-vue`.
Les 16 fichiers ont été ouverts et regardés.

## Ce qui se voit (ouvert, sans défaut)
- La pièce tient dans le cadre : BENU Matran, 13,40, « 1 à contrôler », Règlement « date supposée », ligne « Autres » avec MEFENACIDE.
- Ligne dépliée : « 1 » · segment « pièce | L » (pièce allumé) · « × 13,40 = 13,40 » ; type Matériel ; « pas un achat de brasserie ? » ; « Apport ou prélèvement privé › » ; « hors stock » sans liaison stock ouverte.
- Date de l'achat : « Changer le mois, garder le jour », « novembre », 2026, « Aujourd’hui / Mois passé / Mois suivant ».
- Règlement : « Déjà payé » · « C’est la date » · « Autre date » ; « Date du paiement » 10.11.2026, mois « novembre » en français (clair et cave).

## Combien et quels problèmes ?
1. Le geste « Autre date » ne se lit pas. Clair (`clair-paiement-autre-jour`) : après le clic, le champ « Date du paiement » disparaît et « C’est la date » reste sélectionné. Cave (`cave-paiement-autre-jour`) : le champ reste, « C’est la date » reste sélectionné. Deux comportements différents pour le même geste. Cause non trouvée (non lue dans le code, pas de sonde DOM) : à vérifier avant tout OK.
2. Conséquence de 1 : aucune capture ne montre la ligne « payé le …, autre jour que l’achat (…) » (CP-20 a) ; le lien rompu n'est pas prouvé visuellement.
3. Type « Matériel » déjà choisi sur une pharmacie, sans geste du brasseur (ligne MEFENACIDE, toutes captures). À juger : c'est la valeur lue par défaut, pas un choix.
4. « pas un achat de brasserie ? » est en petit texte ambre sous le segment (environ 13 px rendus à 390) ; lisible sur capture, mais discret. « Apport ou prélèvement privé › » a un contour pointillé qui ressemble à un bouton désactivé. À juger.
5. Icône calendrier native dans le champ de date, en cave seulement (`cave-date-achat`, `cave-reglement-ouvert`) ; absente en clair. Incohérence mineure.
6. Double libellé « Date de l’achat » : rangée repliée puis libellé répété dans le champ ouvert (`clair-date-achat`, `cave-date-achat`). Redondance mineure.

## Doutes
- Le point 1 contredit le critère « mois en français » ? Non : les mois sont français dans tous les cadres ouverts ; le point 1 concerne seulement le geste « Autre date ».
- Les captures ne montrent pas le défilement de la feuille au-delà du premier écran ; `fin-vue` montre la partie basse.
- Pas de test de la liaison stock sur ces captures (la fixture n'en ouvre pas).

Tests et pré-requis : voir `voies/dp/RESULTAT.md` (13 verts attendus, non relancés ici).
