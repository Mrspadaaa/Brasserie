# Jouable M4 b, passe 2 : les cas de la vue IA (25.11 soir)

L'IA, c'est moi : pour chaque exemple, la consigne exacte (`window.__m4b.consigneDe(id)`), puis une réponse JSON écrite à la main sans voir le rendu (`reponses/<nom>.json`). Ces réponses sont servies par un `window.claude` simulé.
Contrôle de la page (`valider`) : **0 citation fausse, 0 erreur sur les 14 réponses**. Gestes : **27/27 OK** (`cap-m4b-2/`, 45 captures en 390 × 844, DPR 2, toutes ouvertes).
Exemples : c79 (12) et c75 (4). Deux fichiers c75 (`zz-malt-pilsner`, `zz-pompe`) ont les mêmes notes que leurs jumeaux c79 ; ils sont écartés, ce qui donne **14 carnets distincts**.

## Cas de la vue IA

| Cas (fixture) | Genre | Ce que montre Organisé | Problème vu → corrigé | Capture |
|---|---|---|---|---|
| Écoulement qui fuit (c79) | problème | pistes trouvé / à vérifier, 150 CHF, 2 options, tâche « Relancer le devis » | pistes sur 2 colonnes, texte cassé sur 3 lignes → une piste par ligne avec son « + » ; case « garder » au milieu de l'en-tête → à droite | org-zz-ecoulement-qui-fuit-1/2 |
| Trop de vapeur (c79) | problème, achat avec comparaison | 2 liens comparés (« ? » pour ce qui est derrière un lien), condenser conseillé, tâche « fin du mois » (dans 5 j) | tâche bavarde (« proposée · fin du mois (dans 5 j) · ») → « ⏳ dans 5 j » | org-zz-trop-de-vapeur-au-1/2 |
| Frigo de garde (c79) | problème, devis comparés | 14 °C, 6 fûts, compresseur trouvé, réparer contre neuf (480 / 1 200 CHF), compromis | options en double avec le tableau → l'article comparé se retient dans le tableau, pas de liste en double | org-zz-frigo-de-garde-en-1/2 |
| CO2 qui baisse (c79) | problème | 1,2 → 0,4 bar, 3 pistes, revérifier « dans une semaine » (≈ 6 j) | en-tête « Options » vide → puce « + Option » | org-zz-co2-qui-baisse-vite-1/2 |
| Inspection électrique (c79) | problème, inspection | 5×20 mm et 6,3 A, fusible trouvé, testeur à acheter, lien Brewtools en option | OK | org-zz-inspection-electrique-fusible-1/2 |
| Levure lente (c79) | problème résolu, levure | 36 h, 16 °C, 19 °C, moût froid trouvé, **📌 À retenir** : réhydrater, ensemencer à 18 °C | carte « la prochaine fois » absente → `retenir` ajouté (consigne et rendu) | org-zz-levure-lente-a-demarrer-1/2 |
| Malt pilsner (c79) | problème résolu, achat | habituel contre autre fournisseur (stock, prix), À retenir « Commandé chez l'autre » | « 4 CHF » en double (chiffre et tableau) → règle 14 : pas de chiffre déjà comparé | org-zz-malt-pilsner-en-rupture-1/2 |
| Odeur de soufre (c79) | problème, soufre | J+5, levure lager à vérifier, « Sentir à nouveau » dans 14 j | sa ligne 3 est mélangée dans la fixture (« ZZ TÀ sentir… fût.EST — ranger la cave ») : citée telle quelle, rien d'inventé | org-zz-odeur-de-soufre-dans-1/2 |
| Pompe qui chauffe (c79) | problème résolu | 30 min, débit bridé trouvé, À retenir « Régler à la sortie » | OK | org-zz-pompe-qui-chauffe-1 |
| Assurance (c79) | mémo, échéance | compte à rebours **36 jours** (31 déc.), liste à cocher des 3 pièces, tâche « Demander 2e offre » | échéance absente du modèle → carte `echeance` ; tâches cachées pour un mémo → montrées | org-zz-assurance-a-renouveler-1 |
| Ranger la cave (c79) | mémo, rangement | tâche dans 11 j (haute), liste à cocher de 3 éléments | liste à cocher absente → carte `liste` ; cocher testé | org-zz-ranger-la-cave-1, 20-cave-coche |
| Fête de la bière (c79) | idée, fête | « Réserver le stand » avant mars (≈ 96 j), budget, 3 bières, 10 fûts, liste de 4 | OK | org-zz-fete-de-la-biere-1/2 |
| Embouteillage (c75) | planning | barre du 01.05.2027 au 01.07.2027 (« Début dans 157 j »), 2 500 CHF | planning absent → genre `planning` et carte `periode` | org-embouteillage-planning-1 |
| Houblons citra (c75) | achat, 2 liens | tableau avec « dur à obtenir » et des « ? » (prix derrière les liens) | OK (honnête : l'IA n'ouvre pas les liens) | org-houblons-citra-1/2 |

## Liste et gestes

| Geste | Résultat | Capture |
|---|---|---|
| Liste v01 : tuiles par état, Arbre et À faire, catégories et sous-catégories (D452), état en points, ce qui attend, date à droite, barre rouge pour la priorité haute | OK. Corrigé en route : pastille « ZZ » répétée sur chaque ligne (dite une fois en tête), point violet sur toutes les lignes après la lecture de fond (bruit), résolus tronqués | 01-liste, 02-liste-bas |
| Replier une sous-catégorie | OK (ligne repliée avec ses titres) | 03-replie |
| Appui long → feuille Ranger (priorité, catégorie), puis Haute | OK, toast avec Annuler | 04-appui-long, 05-priorite |
| Glisser Embouteillage au-dessus de CO2 (D455) | OK : passe en haute et en tête, toast avec Annuler | 06-glisse, 07-depose |
| À faire, tous carnets, par date | OK | 08-afaire |
| Ouvrir un carnet rangé → Organisé ; neuf → Mes notes | OK (14/14) | org-* |
| Aide : ✓ check, ☐ tâche, 💡 suggestion ; garder et écarter | OK (check → À faire, suggestion → pistes, écarté → refus) ; type répété en mots → icône seule | 11-aide, 12-aide-garde |
| « + » Pistes, « + » sur une piste, « + » À faire : sa ligne dans Organisé et dans Mes notes, puis relecture | OK | 13-plus-piste, 14 à 16, 19-mes-notes |
| Retenir 2 options (n'exclut rien), plusieurs tâches, cocher | OK ; coche cochée sans taille (grande diagonale) → 16 px | 17-retenir-afaire |
| Changer l'état d'un toucher sur la frise | OK ; l'IA proposait ensuite de revenir en arrière (« Je cherche ? ») → elle ne propose plus que vers l'avant | 18-etat |
| Lien collé depuis Organisé | OK (dans Mes notes) | 19-mes-notes |
| Recharger les exemples (son carnet gardé) | OK | 21-recharge, 22-liste-apres-recharge |

## Limites de la preuve

- Les réponses sont les miennes : le vrai Claude répondra autrement. La page valide chaque citation contre sa ligne et retire ce qui est faux.
- Glisser testé à la souris, pas au doigt (le `touchmove` non passif est en place).
- Photo et voix depuis Organisé : branchées, non jouées ici (la voix est simulée et inerte).
