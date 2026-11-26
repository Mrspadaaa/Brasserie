# Critique du jouable p5 (Carnet), 26.11

Version : `p5.html` du commit ee2780371, inchangé (non reconstruit : build.mjs part de `git show 8277769ac:p4.html`,
p5.html est plus récent que ses sources). Juge : Opus, mode « Test d'écran » (critique.md).
Rejoué : `cap.mjs` → **GESTES 18/18 · ERREURS PAGE 0** ; `cote.mjs cote` → **fait, 23 planches**.
Ouvertes : les 23 planches de `cap-p5/cote/`, plus 21-comparer-bas, 25-chambre-org, 28-article-relire et 29-ia-forte.
Thème : sombre seulement, 390 px seulement (pas de 1280 ni de clair pour ce jouable).

**Note : 6/10. 14 bloquants, 18 mineurs (32 problèmes).**

En une phrase, comme il le dirait : « C'est mon app, et les écrans Liste, Organisé et Mémo sont bien les miens. Mais Comparer
n'a toujours pas les images, la feuille de l'IA écrit "Pas trouvé : pas trouvée", et Résoudre a perdu les preuves. »

## Contrôles demandés
| Point | Verdict | Où |
|---|---|---|
| Fidèle à son choix | partiel : 9 écrans sur 23 fidèles, 14 adaptés, dont 7 avec un élément de sa maquette absent | voir la liste |
| Moins enfantin | oui : pas d'emoji décoratif, icônes au trait, noms réels | partout |
| Toujours visuel | inégal : Organisé, Liste et Décider le sont ; Changé, Mes notes et Choisi redeviennent du texte | 08, 09, 23 |
| Pratique | inégal : la carte « Résolu ? » est sous le pli, les toasts couvrent les boutons | 15, 19, 20 |
| Précis | non : libellés faux, dates fausses, rang faux | 08, 15, 22, 33 |
| Thème de l'app | oui : en-tête L'Affinée, onglets du bas, cartes sombres, police | partout |
| Relire / Escalader | présents : pied de Changé, échec IA et article ; demandes/ type relire, modelTier complex | 08, 28, 29, 33 |
| Comparer : images en tête de colonne | **absentes** (aussi la pastille de rang) | 20, 26 |
| Aucune donnée inventée non marquée | **non** : « Sanitaire X », « je 1.1 · 01:00 », « grâce à Moût froid » | 07, 15, 30 |
| 150 CHF présent | oui, marqué ≈ estimé dans Liste, Organisé et échec IA ; mais « Montant : 150 CHF » sans marque dans Changé | 07, 08, 33 |

## Problèmes par écran (B = bloquant, m = mineur)

**01 Liste (S-liste)** : fidèle.
1. m : « retard 3 j » en rouge sur Odeur de soufre a disparu (« ✦ 13 j 9.12 ») ; titre tronqué « Odeur de soufre da… » ; « Houblons citra » sans majuscule.

**03 Glisser (S-ranger-glisse)**
2. m : la sous-catégorie cible reste repliée, « Brassage 0 · aucun noté », sans « déposer ici » ni le carnet déjà rangé ;
   la pastille « → Brasserie › Brassage · 2e » chevauche la ligne Conditionnement ; grand vide sous « vient d'ici ».

**04 Rangé (S-ranger-repos)** : fidèle ; voir le point 3 (toast).

**05 Noter vite (S-noter)**
3. m : les liens restent des domaines (« kegland.com.au », « brewtools.com ») et non ses options « Kegland (A) », « Brewtools (B) · pas en stock ».

**06 Note rangée (S-rangee)**
4. **B** : les pastilles avant → après de sa maquette (option → retenu, à surveiller → en stock, dans 4 j) sont absentes ;
   à la place, « proposé » et « piste » ; « Date : fin du mois » n'est pas résolu en lu 30.11. Élément de sa maquette absent, moins précis.

**07 Organisé (O-organise)** : fidèle, l'écran le plus réussi.
5. m : « Sanitaire X » remplace son « entreprise X » (nom inventé) ; le chemin a perdu ses fins de piste (✓ et ◌ en pointillé).

**08 Changé par l'IA (O-change)**
6. **B** : libellés faux : « Pas trouvé : pas trouvée », « Piste : trouvé usé », « Piste : fuit au joint ». L'objet (joint du siphon,
   fuite sous la dalle) est remplacé par le mot d'état. Illisible pour lui.
7. **B** : « Montant : 150 CHF » sans « estimé » ; sa maquette verrouille « 150 CHF : une estimation, pas un prix » et
   « Devis attendu : pas un achat ». La lecture corrigée (cadenas) a disparu.
8. m : « Tâche : Contacter l'entreprise X » et « À contacter : Contacter l'entreprise X » font doublon.

**09 Mes notes, on écrit (S-notes-ecrit)**
9. m : soulignés tous violets (sa maquette : vert trouvé, jaune pas trouvé, bleu devis) ; barre d'outils en icônes sans libellé, sans micro ;
   la ligne neuve n'a ni l'heure « auj. 08:41 » ni la puce « exemple » ; titre tronqué « Écoule… ».

**10 L'IA lit (S-ia-lit)** : adapté, acceptable (pas de fausse progression).
10. **B** : la tuile Trouvé passe de « 24.11 21:26 » (07) à « 26.11 10:36 » après relecture : la date de lecture remplace la date
    de sa ligne. Valeur fausse, aussi en 13 et 15.

**11 Sa ligne retrouvée (S-notes-ligne)**
11. **B** : le texte brut surligné remplace les sections Le problème / Pistes / Suite avec leur état par ligne, et le bloc « Cette ligne
    dans Organisé » (+ Tâche) manque. C'était sa demande « on peut quand même un peu organiser les notes ».

**13 Décider (O-decider)** : fidèle sur les deux cartes et l'écart de 176 CHF.
12. m : « +35 sur ton ≈ 150 · l. 6 » (devis comparé à l'estimation) absent ; la carte Retenu est sous le toast.

**15 Résoudre (O-resoudre)**
13. **B** : les preuves datées (« Plus de flaque après 2 nettoyages », « Joint changé ») et l'interrupteur « devis 185 CHF classé pas pris »
    manquent ; la carte « La flaque… / Résolu » est sous le pli, cachée par le toast. « Retenir touché je 1.1 · 01:00 » : date fausse.

**16 Résolu (O-resolu)**
14. **B** : tuiles « pistes 2 » et « lignes 9 » sans valeur pour lui (règle ENTETE-PEU-UTILE) ; sa maquette montre la preuve
    (3 brassins sans buée) et le coût (540 CHF). Ici, il faudrait 9 CHF et « flaque pas revenue ». Libellé au-dessus, valeur dessous : hiérarchie inversée.
15. m : « grâce à Moi-même » se lit mal (« grâce au joint changé, 9 CHF ») ; la liste « Résolus · Local » de sa maquette manque.

**17 À faire (O-afaire)**
16. **B** : le groupe « Attendu de quelqu'un · Devis Entreprise X ≈ 150 CHF estimé · l. 5 » manque ; il se déduit de « Devis attendu »
    dans ses lignes. « En retard » manque aussi ; voir la décision ouverte de l'auteur.
17. m : titres d'un mot (« Renouveler ») et sous-titres qui répètent le titre (« Ranger la cave / Ranger la cave »).

**19 Options, 6 offres (O-options-a)**
18. m : « Besoin avant ma 15.12 · dans 19 j » devient « Choisir · l. 4 » (échéance perdue) ; même icône bouteille sur les 6 lignes ;
    le toast couvre « Demander les délais » et « Comparer les 6 ».

**20 / 21 Comparer (h04-7, figé 17.11)**
19. **B** : pas d'image ni de pastille de rang en tête de colonne : c'est SON choix figé (D105, COMPARER-PAS-SON-CHOIX).
20. **B** : le classement met Brouwland 1er (≈ 390, sans livraison) alors que le tableau met en vert Fournisseur B (410 livré). Deux verdicts
    contraires sur le même écran ; le Compromis le dit, mais le rang 1 est faux.
21. m : ligne « Minimum × 600 » identique partout (aucune information) ; « Fournisseur / B » coupé sur deux lignes ; 3 colonnes sur 6 visibles.

**22 Article (h01-6)**
22. **B** : « Livraison 80 CHF · 1e », alors que les autres ont « comprise » ou « — » : rang faux. Manquent les offres avec « Ouvrir ↗ »
    et « Surveiller prix et stock » de sa maquette figée.
23. m : cadre d'image vide de 150 px avec une bouteille (aussi en 28) ; le pilote doit remplir les images, sinon réduire le cadre.

**23 Choisi (v09-3)**
24. **B** : ni image ni icône de l'objet, ni icônes des écartés (sa maquette en a sur chaque ligne) ; « Pourquoi : le meilleur pour 600 410 CHF »
    est illisible ; Brouwland écarté avec « 20 de moins » et aucune raison ; la ligne « 0.55/bt · × 600 · 80 CHF » est en très petits caractères.

**24 À venir (h05-9)**
25. m : feuille par-dessus Carnets au lieu de son écran Calendrier ; ni carrés de couleur par genre, ni montants, ni image de l'achat.

**25 / 26 / 28 / 29 Chambre froide**
26. m : unités dans les cases (« 1500 x 1200 x 2010 mm », avec x et non ×) au lieu de sous le libellé ; « 2697.74 / 2,6 » mêle point et virgule ;
    « prix chf ttc » en minuscules ; pas de « ggmgastro.com · lu · port offert » sous les colonnes ; en 25, « Gagne · volume 4,06 m³ 4,06 m³ »
    en double et barres pleines identiques pour 2 697 et 2 987.

**30 Relecture (O-relecture)**
27. **B** : « Résolu · grâce à Moût froid » : moût froid est la cause (« la cause » plus bas), pas le remède (monter à 19 °C). Valeur fausse.
28. m : « Ce que tu savais alors : 36 h, 16 °C », sans sujet ; « depuis le 24.11 · 0 j » ; « Si ça revient » de sa maquette absent ; titre tronqué.

**31 Mémo (S-memo)** : fidèle, adapté à l'Assurance ; voir le point 29 (titre tronqué).

**33 L'IA n'a pas pu lire (S-ia-echec)**
29. **B** : « Lu par l'app seule » montre une ligne, « pas trouvé · Pas trouvé · l. 2 » : l'objet (Fuite sous la dalle) est remplacé
    par l'état, et « trouvé · Joint du siphon usé » et « prochaine · Devis entreprise X » manquent. Même défaut que le point 6.
30. m : la pastille « À ranger » remplace « Local › Eau », que ce carnet a partout ailleurs ; « Je cherche » n'est plus en bleu.

**Transversal**
31. m : toast « Ajouté à Mes notes · l'IA relit » ou « Retenu / Choisi » posé sur le contenu ou le bouton principal (13, 15, 16, 19, 20, 23).
32. m : titres tronqués par une pastille de catégorie large (09, 30, 31 « Assurance à r… ») ; nombres en point décimal (0.55/bt).

Total : 32 problèmes, dont 14 bloquants (4, 6, 7, 10, 11, 13, 14, 16, 19, 20, 22, 24, 27, 29), soit 11 corrections
(6 et 29 : même cause ; 14 et 27 : écran Résolu ; 19 et 20 : Comparer), et 18 mineurs (1-3, 5, 8, 9, 12, 15, 17, 18, 21, 23, 25, 26, 28, 30-32).

## Trois personas
- **Brasseur TDAH visuel** : la Liste et Organisé tiennent (tuiles, chemin en couleur). Il décroche sur Changé (9 lignes de texte aux
  libellés faux), Mes notes (soulignés d'une seule couleur), Choisi et Comparer (aucune image). 6/10.
- **Brasseur pressé au téléphone** : glisser, noter et décider vont vite. Il cherche « Résolu » sous le pli, les toasts couvrent « Comparer les 6 »,
  les titres sont tronqués et le Comparer à 6 colonnes défile de côté. 6/10.
- **Gérante achats et échéances** : il manque « Attendu de quelqu'un » et « En retard » dans À faire, l'échéance « avant ma 15.12 » des offres,
  les montants dans À venir. Brouwland est classé 1er sur un prix incomplet, la livraison est mal classée et un 150 CHF estimé est compté comme montant. 5/10.

## Doutes (non comptés)
- « 185 CHF » et « Joint 9 CHF » (13, 15) : lignes ajoutées par le geste. Sa maquette les marque « exemple » ; ici, aucune puce : à vérifier dans cap.mjs.
- Brouwland 0.65/bt et Fournisseur B 0.55/bt diffèrent de la mini maquette (0,68 livrée, ≈ 430 € + douane) : selon les lignes du cas ?
- À faire 6 et non 5 : décision ouverte de l'auteur (dates des tâches de l'app). Je ne la tranche pas.

## À corriger
1. Lecture « app seule » et feuille Changé : afficher l'objet de la piste (« Fuite sous la dalle »), jamais le mot d'état ; rendre les 3 lignes
   trouvé / pas trouvé / prochaine (33) ; « Trouvé : joint du siphon usé » (08).
2. Changé : rétablir les lectures corrigées verrouillées « 150 CHF : une estimation, pas un prix » et « Devis attendu : pas un achat » ;
   fusionner Tâche et À contacter.
3. Note rangée : pastilles avant → après (option → retenu, à surveiller → en stock, dans 4 j) et date résolue (lu 30.11).
4. Dates : la tuile Trouvé garde la date de sa ligne (24.11 21:26) ; corriger « Retenir touché je 1.1 · 01:00 ».
5. Sa ligne retrouvée : sections Le problème / Pistes / Suite avec l'état par ligne et le bloc « Cette ligne dans Organisé » (+ Tâche).
6. Résoudre : citations datées comme preuve, interrupteur « devis classé pas pris », carte placée juste sous les tuiles (au-dessus du pli).
7. Résolu : tuiles utiles (preuve, coût 9 CHF, depuis), valeur au-dessus du libellé ; « grâce à » = le remède retenu, jamais la cause (30).
8. À faire : groupe « Attendu de quelqu'un » (Devis Entreprise X ≈ 150 CHF estimé · l. 5) ; titres de tâche complets.
9. Comparer (20, 26) : image ou icône au trait et pastille de rang en tête de chaque colonne, domaine et « lu » dessous ; un prix incomplet (≈, sans
   livraison) ne passe pas 1er devant un prix complet ; retirer les lignes sans information (Minimum × 600).
10. Article : rang de livraison juste (« comprise » est meilleur que 80 CHF), offres avec « Ouvrir ↗ », « Surveiller prix et stock » ; cadre d'image réduit tant qu'il n'y a pas d'image.
11. Choisi : image ou icône de l'objet et des écartés, une raison par écarté, « Pourquoi » en phrase lisible, détail à taille normale.
12. Mineurs groupés : retard 3 j dans la Liste ; cible du glisser dépliée avec « déposer ici » ; options nommées dans Noter ; « entreprise X » et
    non « Sanitaire X » ; soulignés en couleur d'état ; échéance des offres ; toasts hors des boutons ; titres non tronqués ; virgule décimale,
    × et unités sous le libellé ; « CHF TTC » en capitales ; À venir avec couleurs et montants ; pastille Local › Eau à l'échec IA.
