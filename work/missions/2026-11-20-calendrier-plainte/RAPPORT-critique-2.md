OK — 5 problèmes, 1 bloquant

Version : 50c34e831 (build `cal5/q3/build3`), fixture `?dev-local&finance-demo=parcours-calendrier`, serveur statique du script. Non déployé.
Scripts : `cal5/crit/vision2.mjs` (parcours complet, 7 tailles et thèmes), `vision3.mjs` (barre vers le passé avec le doigt tenu au bord, à 390, 844 et 1280), `vision4.mjs` (390 : vue par défaut et 3 mois, pose, Modifier), `vision5.mjs` (feuille Modifier en cave à 390, 844 et 1280).
Captures : `cal5/crit/cap2` à `cap5`. Journaux : `cap*/journal-*.txt`. Planches : `cal5/crit/planche-{r1..r8,s1,s2,v1..v3}.png`.
Gestes au doigt (CDP tactile) à 390×844 et 844×340, à la souris à 1280×800. Clair et cave.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| cap4/A-p2/p3-passe-*-defaut | clair | 390 | Hefe vers le passé, vue par défaut (6 sem.) | 1 (n° 4) | 0 |
| cap4/A-p2/p3-passe-*-3mois, cap3/A-p3 | clair | 390 | Hefe vers le passé, en 3 mois | 1 (n° 1) | 1 |
| cap3/C-p2/p3, cap3/D-p2/p3 | clair | 844, 1280 | Hefe vers le passé, en 3 mois | 0 | 0 |
| cap2/A-10-bord-pendant, A-10-bord | clair | 390 | bord droit de Hefe tiré | 1 (n° 2) | 0 |
| cap2/C-03, C-07, C-10, F idem | clair, cave | 844 | échelle Jour (2 sem.) | 1 (n° 3) | 0 |
| cap2/A-13*, cap5/B-, E-, F-u1-modif-jour | clair, cave | 390, 844, 1280 | feuille Modifier d'une fête et d'un achat | 1 (n° 5) | 0 |
| cap2/A-13c, A-14 ; cap2/A-30, A-31 | clair | 390 | Modifier, puis jour choisi, rechargement, Bord › Agenda | 0 | 0 |
| cap4/A-q1 à q5 | clair | 390 | poser une fête par le +, puis Calendrier, Bord, Agenda | 0 | 0 |
| cap3/A-r2-Comma-Prév | clair | 390 | achat prévu déplacé, Finances › Prévisions | 0 | 0 |
| cap2/A-23, A-26 | clair | 390 | feuille Période sur deux années | 0 | 0 |
| cap2/D-03-3mois, A-03, C-repos | clair | 1280, 390, 844 | étiquettes de la courbe, impôt | 0 | 0 |
| cap2/B-*, E-*, F-* | cave | 390, 1280, 844 | mêmes états | 0 en plus | 0 |

## Les 11 du rapport précédent

1. Barre vers le passé : **autre défaut, bloquant à 390 en 3 mois**. Ailleurs, c'est réglé :
   - à 844 et 1280 en 3 mois, avec le doigt tenu au bord, la bulle dit « si tu lâches en S43 → S42 → S41 → S40 » ; la barre passe à S40 (29 sept.), le bandeau affiche « Hefe : S44 → S40 · Annuler », et la date est relue après rechargement ;
   - à 390 dans la vue par défaut (6 sem.), même résultat.

   Le défaut restant : à 390 en 3 mois, Hefe est une barre courte de 24 à 52 px. Le doigt posé au milieu ne la déplace pas : il tire sa fin. On lit « prête le 6 nov. » → « prête le 1 nov. », puis 9 oct. → 8 oct. Le bandeau affiche « Hefe : pas brassée · prête le 1 nov. ». Le geste voulu reste sans effet et écrit une date de fin fausse (cap3/A-p3-passe-apres, cap4/A-p2/p3-*-3mois).
2. La feuille Modifier remettait la date au lundi : **réglé**. Marché de Noël, prévu le mardi 22 déc., passe en S51 au mardi 15. Je choisis jeudi : la date devient le 17 déc., et elle est relue après rechargement au Calendrier, au Bord › Agenda (« 17.12.2026 ») et dans Calendrier · Agenda (Gérer). Café du Pont : du 7 déc. à S49, puis vendredi, soit le 4 déc. Commande de malt, prévue le mardi 1er déc., passe en S48 au mardi 24 nov. ; Finances › Prévisions dit « Commande de malt −540, 24.11 ».
3. Faux « La fin vient avant le début » : **réglé**. La période 26.10.2026 → 24.01.2027 ne l'affiche plus, ni au Calendrier ni dans Finances (A-23, A-26).
4. L'étiquette de glisse du bord : **autre défaut**. Elle ne couvre plus Ttt, mais elle se pose maintenant sur la ligne du dessus : « Jhhh −45 J34 / 34 » est caché, il ne reste que « 4 · prête 15 nov. » (cap2/A-10-bord-pendant).
5. Bandeau Annuler : **réglé**, conformément à la décision. Il a une place fixe en bas, à gauche du +.
6. La barre changeait de ligne après un geste : **réglé**. Hefe reste à la 5e ligne une fois son bord tiré (A-10-bord). Après un rechargement, l'ordre est refait (voir les doutes).
7. Les étiquettes de la courbe se chevauchaient : **réglé** à 390, 844 et 1280. À 1280, « Facture Café du Lac +1 200 » et « lol −600 » ne se touchent plus à l'œil (la mesure trouve 8 px de recouvrement de boîte, sans collision visible). « Impôt sur la bière · Jhhh −24 » est entier.
8. Le + volant cachait des montants et des noms : **réglé**. Rien n'est sous le + dans aucune mesure (sousPlus vide partout).
9. Débordement de 1 px à 844×340 : **toujours là** en échelle Jour (2 sem.) : scrollWidth = 845 pour 844, au repos, pendant la glisse et au bord, en clair et en cave. En 3 mois, scrollWidth = 844.
10. Impôt sur la bière en double : **réglé**. La rangée Achats ne contient plus l'impôt (D-03-3mois : Brouwland, Commande de malt, Fûts de rechange).
11. Date sans année après un glisser sur la courbe : **réglé**. Le bouton affiche « 05.07.27–14.11.27 ».

## Problèmes (5, dont 1 bloquant)

1. **BLOQUANT** : à 390 en 3 mois, glisser un brassin court vers le passé tire sa fin au lieu de le déplacer (n° 1 ci-dessus). C'est une valeur fausse écrite par un geste qui ne fait pas ce qu'on veut. On peut l'annuler.
2. À 390, l'étiquette de durée du bord tiré (« pas brassée · prête le 20 nov. ») cache le nom et les jours de la ligne du dessus (Jhhh −45 J34 / 34). Capture : cap2/A-10-bord-pendant.
3. 844×340 en échelle Jour : la page déborde de 1 px (845 pour 844), en clair et en cave.
4. La bulle de glisse annonce le lundi, mais la barre tombe un autre jour. On lit « S40 · 28 sept. · lâcher ici », puis Hefe se pose le mardi 29 sept., parce qu'elle garde son jour de semaine. La date annoncée n'est pas celle qui est écrite. Capture : cap4/A-p2-passe-pendant-defaut, puis A-p3.
5. Dans la feuille Modifier (fête, vente, achat prévu), la rangée « Semaines » s'ouvre sur S2 (5 janv. 2027) : la semaine de la chose (S51 ou S52) est hors de vue, à gauche. La rangée Jour (L 21 … D 27) s'affiche alors sous S2 à S8, comme si ces jours appartenaient à ces semaines. Il faut faire défiler la rangée pour voir la semaine choisie. C'est le cas à 390, 844 et 1280, en clair et en cave (cap2/A-13-fete-modifier, A-13-achat-modifier ; cap5/B-, E-, F-u1-modif-jour).

## Parcours demandés

- **Poser une fête par le +, avec « Autre nom »** : la saisie se fait dans le champ texte. « Ajouter en S47 » affiche le bandeau « ZZ TEST fête · S47 · Annuler ». La fête est au Calendrier (21 nov., S47), y reste après rechargement, et apparaît au Bord (ligne « ZZ TEST fête ») comme dans Bord › Agenda › Gérer. Captures : cap4/A-q1 à q5. Fixture locale, rien n'a été écrit en ligne.
- **Modifier une fête avec le jour choisi** : voir le n° 2 ci-dessus, réglé.
- **Achat dans Finances › Opérations** : Commande de malt est un achat prévu. Déplacé, il est relu au Calendrier et dans Finances › Prévisions (24.11). Il n'apparaît ni dans Opérations ni au Bord, ce qui est normal pour un achat prévu.

## Doutes (non comptés)

- Brouwland · malt est un achat déjà saisi, au 2 déc. dans le Calendrier. Le toucher ouvre la fiche Finances (« Échéance : 02.12.2026 », Modifier, « Échéance et prévision ») et non la feuille Semaine/Jour. Je n'ai pas rejoué au doigt son changement de date dans le formulaire Finances : son champ date est natif, et mon script n'a pas su le saisir. Il reste donc à vérifier qu'Opérations (« à payer · 2 déc. ») suit un changement d'échéance.
- Le bandeau après Modifier dit « Marché de Noël : S51 », sans le jour choisi (17 déc.).
- Après un rechargement, l'ordre des lignes de Brassins est refait : Hefe passe de la 5e à la 1re ligne. La ligne n'est gardée que pendant la vue (choix CRIT-6).
- À 1280, l'étiquette « lol −600 » est posée dans le cadre de la fenêtre (S44 – S3 2027). Elle reste lisible.
- À 844×340, dans la feuille Modifier, le champ « Autre nom » est coupé par Enregistrer. Le contenu défile.
- L'idée « IPA brume » est toujours introuvable, en 3 mois comme en An.
- À 844, le menu de période ouvert couvre sa propre pastille : en touchant « 3 mois », mon script est tombé sur « Jour ». C'était l'effet du script, pas un geste du brasseur.

## Vu juste

Le thème cave est lisible : la feuille Modifier et sa rangée Jour (cases de 47, 79 et 111 px sur 44 px) se lisent à 390, 844 et 1280. Annuler remet Hefe au 27 oct. La période sur deux années est juste. Aucune erreur de page n'a été relevée.
