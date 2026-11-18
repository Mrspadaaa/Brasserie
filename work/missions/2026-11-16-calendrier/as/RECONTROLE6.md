OK — 4 problèmes, 1 bloquant (les 11 de CRITIQUE5 corrigés)

# Recontrôle 6 (17.11) — calendrier `as` après la passe 6

Critique calibré (portrait v2). Rejoué au doigt par `cap/recontrole6/jouer.mjs` (copie de `cap/passe6/jouer.mjs`, sortie vers `cap/recontrole6/`) : 390 × 844 tactile et 844 × 390, clair, plus la cave sur la feuille et le toucher ; **0 erreur de page** (`cap/recontrole6/_jeu.json`). Sonde à moi pour les gestes non couverts : `cap/recontrole6/sonde.mjs` (Ouvrir, Modifier, deux ventes la même semaine, Livrer, Porter).
Contrôles depuis la racine (`cap/recontrole6/_controles.txt`) : PLUS-AGIT OK, BRUIT OK, BANDE OK (et paysage --paysage BANDE OK), ENTETE OK, PLUS OK.

## Mesures (avant de regarder)
- 1 Blonde : barre « J0 / 35 · prête 28 déc. » = alerte « prête le 28 déc. » (23 nov. + 35 j), texte dans l'écran, barre vue après f2-a et après f6-b, portrait et paysage.
- 2 toucher une chose ajoutée : détail non vide sur les 7 rangées et le + volant, deux sens (brassin : brassage, en cuve, prête, Ouvrir/Modifier/Retirer ; autres : semaine, date, libre de la semaine).
- 3 pastilles : Brassins −324 → −424, Ventes +900 → +1 030, Papiers −806 → −906 (paysage −1 986 → −2 086) ; Retirer les ramène, Annuler les repose.
- 4 chevauchement mesuré : 0 sur les 16 poses.
- 5 brassin : Blonde d'automne S50, brassée lun. 7 déc., en cuve 8 → 28 déc., prête 4 janv. (28 j) ; Saison S47 : 16 nov., cuve 17 nov. → 7 déc., prête 14 déc. (28 j). Plausible.
- 6 messages : « Ranger la réserve : S48 → S49 », « Charge fixe : elle se règle dans Finances », non coupés.
- 8 message posé sur la barre d'onglets (toastSurNav vrai partout).
- 9 feuille : 13 semaines en portrait ; Malt de janvier S2 posé hors vue (« Hors vue, en S2 · S2 : 4 766 → 4 226 »).
- 10 vente probable : pastille `k17-p` +130.
- 11 écart au chariot : 12 px.

## Captures (au fil)
- Planches ouvertes : `_pl-p-00` à `_pl-p-08` (41 captures portrait, dont 2 en cave), `_pl-l-00` à `_pl-l-09` (38 captures paysage).
- 1 : p-f2a-apres « J0 / 35 · prête 21 déc. » = alerte 21 déc. ; p-f2a-f6b « prête 28 déc. » = alerte, texte entier ; l-f2a-f6b idem, la barre reste en vue, l'alerte sous la rangée. **Corrigé.**
- 2 : p-fab-touche, p-r-*-touche, l-*-touche : une carte de détail s'ouvre sous la chose (brassin : Brassage, En cuve, Prête, Ouvrir, Modifier, Retirer). **Corrigé.**
- 3 : pastilles −424, +1 030, −906 / −2 086 vues sur les captures « calme ». **Corrigé.**
- 4 : l-r-achat-pose : Houblon Citra sous Frigo, plus rien sur « + Achats ». **Corrigé.**
- 5 : p-fab-rempli : recettes en puces, En cuve 21/28/35/42 j, « prête le 4 janv. » ; p-fab-pose : barre de 4 semaines avec sa piste. **Corrigé** (la barre neuve n'écrit pas « J0 / 28 · prête », voir doutes).
- 6 : p-autre-c, p-autre-t entiers. **Corrigé.**
- 7 : l-f2a-apres, l-f2a-f6b : la Blonde reste en haut de la vue. **Corrigé.**
- 8 : le message ne couvre plus la frise ; il couvre la barre d'onglets (voir nouveaux).
- 9 : p-hors-feuille S50 → S2 en défilant ; p-hors-pose renvoi « Malt de janvier −540 S2 › » ; p-hors-touche ouvre le détail. **Corrigé.**
- 10 : p/l-r-vente-pose : pastille bouteille +130 en S50, à la place du repère pointillé. **Corrigé.**
- 11 : p-fab-pose : le brassin S50 sous le chariot, détaché de Fêtes. **Corrigé.**
- Vu en passant : p-sombre-feuille, le bouton « Ajouter en S47 » est gris tant que la recette est vide ; une fois la puce choisie, le brassin se pose **sans montant** (p-sombre-touche : « Blonde d'automne », pas de CHF, pastille −324 inchangée).
- Sonde (`cap/recontrole6/_sonde.json`, planches `_pl-z-p`, `_pl-z-l` ouvertes) : Ouvrir donne « Ouvre la fiche Blonde d'automne (Brassins) » (renvoi de maquette, comme attendu) ; le Porter ouvre toujours son détail (l-z-porter) ; Modifier pré-remplit la feuille (« Houblon Citra 1 kg », −100, « Enregistrer en S47 ») et déplace la chose en S51 ; Livrer pose « La Cigogne : 29 déc. » ; deux ventes en S49 : **+200 posée exactement sur +260** (149–180 px, même hauteur), p-z-deuxventes et l-z-deuxventes.

## Restes de CRITIQUE5
Aucun des 11 n'est encore vrai (détail ci-dessus, capture par capture).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| p/l-z-deuxventes | clair | 390, 844 | deux ventes la même semaine | 1 | 1 |
| p/l-z-modifie | clair | 390, 844 | Modifier S47 → S51 | 1 | 0 |
| p-fab-pose, p-r-*-pose, p-z-ouvrir, l-*-pose | clair | 390, 844 | message après un geste | 1 | 0 |
| p-z-livrer | clair | 390 | Livrer le 29 déc. | 1 | 0 |
| repos, f2-a, f6-b, 7 rangées (feuille, pose, calme, toucher), hors vue, autres gestes, cave | clair, cave | 390, 844 | toutes | 0 | 0 |

## Nouveaux (graves d'abord)
1. **Illisible, valeur cachée (bloquant).** Deux ventes la même semaine se posent l'une sur l'autre : « Bar du Lac +200 » en S49 recouvre exactement la livraison +260 (même place, même hauteur) ; on ne voit plus qu'une pastille, alors que Ventes passe à +1 100. p-z-deuxventes, l-z-deuxventes. Correction : la deuxième pastille d'une semaine se décale (côte à côte dans la semaine ou une ligne dessous), et le contrôle de chevauchement mesure aussi les pastilles neuves contre les pastilles.
2. **Valeur trompeuse.** Modifier une chose de S47 en S51 affiche « S51 : 4 964 → 4 964 » : on croit que rien n'a changé, alors que S47 à S50 gagnent 100. p-z-modifie, l-z-modifie. Correction : dire la semaine qui bouge (« S47 : 3 932 → 4 032 ») ou « S47 → S51 ».
3. **Pas à sa place.** Le message après un geste couvre la barre d'onglets pendant 7 s (Bord à Stocks en portrait : p-fab-pose, p-z-ouvrir ; Bord et Finances en paysage). On ne peut pas changer d'écran pendant ce temps. Correction : le poser juste au-dessus des onglets, dans la marge que laisse le + volant.
4. **Pas pratique, portrait.** Après « Livrer le 29 déc. », les 3 fûts partent en S53, hors des 6 semaines, sans renvoi : la livraison disparaît (p-z-livrer), alors qu'un achat hors vue a son renvoi « Malt de janvier −540 S2 › ». Correction : le même renvoi au bord de Ventes.

## Doutes (non comptés)
- La barre d'un brassin ajouté n'écrit pas « J0 / 28 · prête 4 janv. » comme la Blonde ; la date n'est que dans le détail.
- Le détail d'un brassin ajouté dit « Stock : à vérifier en ouvrant le brassin », alors que celui du Porter dit ce qui manque (Munich 4 kg, Fuggles 200 g) ; la recette choisie est connue.
- Un brassin peut se poser sans montant (cave : la puce de recette suffit à activer Ajouter) ; il ne compte alors pas dans la caisse.
- Le + volant couvre encore une partie de l'icône −94 des Papiers en portrait (comme la base).
- Le contrôle ENTETE écrit « 24 textes (max 12) » et passe : le plafond est retiré depuis le 17.11, le libellé reste.

## Sens métier
Rien d'absurde : Saison S47 brassée le 16 nov., en cuve 17 nov. → 7 déc., prête le 14 déc. (28 j) ; Blonde d'automne S50 : 7 déc., 8 → 28 déc., prête le 4 janv. ; Blonde allongée 35 j puis décalée : 23 nov. → 28 déc., livrable le 29. Sommes justes : Brassins −324 − 100 = −424, Ventes +900 + 130 = +1 030, + 200 = +1 100.

Phrase prédite : « Là, ça marche : j'ajoute, je touche, je modifie, et ça compte. Mais si je mets deux ventes la même semaine, j'en vois qu'une. »

## Note
8/10. La passe a progressé : les 11 points de CRITIQUE5 sont corrigés, vus sur capture, et les cinq contrôles passent. Il reste un bloquant, sur un cas que la passe n'a pas joué (deux ventes la même semaine), et trois défauts mineurs autour des messages et du hors vue.
