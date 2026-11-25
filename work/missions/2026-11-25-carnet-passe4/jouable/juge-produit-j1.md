# Juge produit J1 — jouable passe 4 du Carnet (nuit du 25.11)

Trois regards dans un même fichier : **[UX]** mobile compacte (TDAH, visuel, au téléphone, pouce) ; **[IA]** aide réelle, visible,
annulable, erreurs, absence ; **[Neuf]** nouveau venu qui ouvre l'écran sans explication.

Matière : jouable/p4.html, contrat JOUABLE-P4.md, CAS.md, RESULTAT.md, et les 60 captures de jouable/cap/ (390 × 844, DPR 2).
Méthode : toutes les captures ouvertes avec Read. 12 en direct (01 à 10, 20, 21) ; les 48 autres en planches de 3, à l'échelle 390 px CSS
(scratchpad, rien écrit dans le dossier). La page n'a pas été rejouée en direct : le jugement porte sur les captures.
Valeurs contrôlées contre les notes du fixture (p4.html, exemples) : frigo 14 °C au lieu de 2 °C, 6 fûts, 480 / 1 200 CHF ; 600 bouteilles 0.42 / 0.55 / 0.20 par bouteille,
minimum 1200, livraison 80 CHF ; citra 3,72 € (poids « 50 g, 250 g et 500 g ») ; échéances 36 j et 157 j justes au 25.11. Aucune valeur inventée trouvée.

## Règles dures

| Règle | Verdict | Preuve |
|---|---|---|
| ORGANISE-TROP-TEXTUEL (≤ 30 mots, repère non textuel par bloc) | Tenue | CAS.md 16 à 30 mots ; chaque bloc porte icône, couleur, jauge ou hachure (org-*). |
| FRISE-GENERIQUE | Tenue | Plus de frise fixe ; avancement par genre : points « comparé », compte à rebours (assurance, fête), période (embouteillage), rien pour un mémo. |
| ENTETE-PEU-UTILE | Tenue | Première info à 52 px sous la barre (cave 85 px) ; date et heure de lecture renvoyées à Mes notes. |
| CARNET-LISTE-COMPACTE | Tenue | 01 : 14 lignes, plus de 80 % de la hauteur ; 03 puis 04 : un domaine se replie sous filtre. |
| Prochaine action sous le pouce | **En partie** | Présente au repos partout sauf embouteillage ; disparaît après Retenir (41) et après Fait (24). |
| Aucune valeur absente de ses notes | Tenue | Calculs marqués (icône calcul, pointillé) ; « estimé » en pointillé ; citations fausses retirées (44). |
| Sans IA : seul ce que l'app lit | Tenue, mais | 60 : deux cases lues sans IA ; 62 : hors ligne, la vue déjà lue disparaît (voir B2). |

## Par écran et geste

### Liste (01, 02, 03, 04, 51)
Avis : enfin compacte ; on voit 14 carnets, le chiffre clé à droite, le coup d'œil coloré sous le pouce sert aussi de légende aux points.
- m1 [UX][Neuf] 01 : l'en-tête « Brasserie 13 Brassage · Fermentation · C… » est coupé par la pastille « ▸ ✓ 3 » ; les sous-domaines ne sont que du texte, les lignes ne sont pas rangées dessous (le sous-domaine de la recette p4b-1 n'est plus lisible par ligne).
- m2 [Neuf] 01 : « ▸ ✓ 3 » (résolus repliés) ne dit pas ce qu'il cache.
- m3 [UX] 01 : titres coupés sans repère du reste (« Vérifier le prix Brau », « Chaudière en panne jour de brass… »).
- m4 [IA][Neuf] 51 : noter un carnet neuf depuis la liste : le toast « Noté · l'IA le range » couvre la liste et le carnet créé n'est pas visible ; l'IA a rendu une réponse vide (RESULTAT : empty_completion) sans que l'écran le dise.
Ce qui marche : filtre par le coup d'œil, repli sous filtre (04), bande rouge des priorités hautes, « + » et saisie sous le pouce.

### Ranger dans… (05, 06)
Avis : un toucher suffit, Annuler présent. Bon.
- m5 [Neuf] 05 : domaines et sous-domaines en vrac sur des lignes qui se suivent ; « › Froid » et « Local » sur la même ligne, on ne sait plus à qui appartient « Froid ».
- m6 [UX] 05 et 02 : « Sans catégorie » dans la feuille, « À ranger » dans la liste : deux noms pour la même chose.
- m7 [UX] 06 : le toast couvre une ligne et l'en-tête Administratif.

### À faire (07, 08, 09, 10)
Avis : la carte « Une décision t'attend » avec deux gros boutons 480 / 1 200 CHF est le meilleur écran du jouable pour un TDAH. Cocher et Annuler marchent, le compteur suit (15 → 14).
- **B1** [UX][IA] 07 : le toast « Rangé : Brasserie » du geste précédent suit sur À faire ; même défaut en 49 (« Choisi : MotlerHops » sur l'assurance). Son Annuler reste actif : un toucher défait sans le voir un geste fait dans un autre carnet. Défaut de données, pas cosmétique.
- m8 [UX][Neuf] 07 : la ligne de temps n'a que « auj. » et « 1 mars » ; les bulles se chevauchent (vapeur et cave, CO2 derrière vapeur en 10) ; impossible de lire une date sans la liste.
- m9 [UX] 07 : « Ranger la cave / Ranger la cave » (tâche et carnet de même nom) : une ligne de bruit.
- m10 [Neuf] 07 : la clé et le flocon sur 480 / 1 200 ne disent pas « réparer » / « neuf » ; il faut ouvrir le carnet pour comprendre.

### Organisé, problème : écoulement (21, org-ecoulement, 22, 23, 24)
Avis : jetons ronds lisibles, face à face toi / sanitaire X, « estimé » en pointillé, inconnu hachuré, « prix du joint ? Noter » : on lit en 3 secondes ce qui est trouvé et ce qui manque.
- **B6** [UX] 24 : après « Fait » sur Contacter l'entreprise X, la zone du pouce est vide ; ni prochaine étape, ni « Résolu ? », ni « + tâche ». Idem après Retenir (41). Règle dure : prochaine action sous le pouce.
- m11 [IA][Neuf] 21 : l'étincelle entre « toi » et « sanitaire X » n'est pas expliquée (proposé par l'IA ?).
- m12 [IA] 22 : retenir « toi » fait passer le compteur IA de 2 à 1, Annuler le remet à 2 ; pourquoi l'IA « perd » un changement n'est pas dit.
- m13 [UX] 21 : grand vide entre la carte et la barre du bas, alors que trois étages (action, saisie, bascule) s'empilent sous le pouce.
Ce qui marche : Retenir « toi » → pastille Décidé, toast avec ce qui est retenu (« Changer le joint »), Annuler propre (23).

### Toucher un jeton → sa ligne (20)
Avis : la ligne surlignée et « Revenir à « joint » » en grand bouton : parfait, c'est la preuve d'où vient chaque élément.
- m14 [Neuf] 20 : barre d'outils de Mes notes en icônes seules (baguette, image, lien, case) ; beaucoup de soulignés violets dans le texte, sans dire qu'ils sont « lus par l'IA ».

### Aide (25, 26, 27, 28)
Avis [IA] : modèle à garder : trois propositions typées (vérifier, tâche, suggestion), Garder / Non merci sur chacune, « rien n'est posé sans ton toucher », la suggestion gardée devient un jeton marqué IA (28).
- m15 [IA][Neuf] 26 : la tâche gardée porte « check · IA » : mot anglais, alors que la légende dit « vérifier ».
- m16 [IA] 25 : rien ne dit le coût ni que l'Aide appelle l'IA (DEFAUTS : « IA proposée d'un toucher, coût dit »).

### « + » piste, écrire depuis Organisé (29, 30, 31, 32)
Avis : « + » ajoute une piste qui arrive dans Mes notes (30) : une seule vérité, bien. « Noter » préremplit « → prix du joint » au-dessus du clavier (31) : très bon geste.
- **B4** [UX][IA] 32 : après Noter « 6 CHF au magasin », l'écran ne change pas : « prix du joint ? » et le « ? » de « toi » restent, seul un toast « l'IA relit » passe. Pour un TDAH, la question toujours posée = « ça n'a pas marché », il retape. Aucune capture ne montre l'état après relecture (L12 : un effet doit se voir). L'app peut lire « 6 CHF » seule et remplir la case à l'instant.
- m17 [UX] 29 : la quatrième piste fait passer « + » sur une deuxième ligne et pousse le face à face de 90 px.
- m18 [Neuf] 30 : l'en-tête de Mes notes passe de « mar. 24 nov. 21:26 » (20) à « mer. 25 nov. 22:14 » : la date de création du carnet est remplacée par celle de la dernière note.

### Menu ⋯ et Changé par l'IA (33, 34, 43, 44, 45, 46)
Avis [IA] : le meilleur de la passe. Une case par changement, la citation de chaque lecture, « mis par l'IA, coupe pour revenir », « 1 citation retirée : pas dans tes notes », « Garder 4 sur 5 », « Avant l'IA ». L'erreur voulue (chaudière mise en Décidé) se voit et se coupe en deux touchers (46 : Noté).
- m19 [IA] 33 : « Relire avec l'IA » et « Poser une question » sans coût ni durée.
- m20 [Neuf] 43 : la chaudière montre « Décidé » alors que rien n'est retenu (deux « retenir » vides) ; rien sur l'écran ne signale que c'est l'IA qui l'a posé avant d'ouvrir ⋯.

### Décider : frigo (40, 41, 42, org-frigo)
Avis : barres proportionnelles 480 / 1 200, « 720 CHF d'écart » avec calcul à un toucher, « Retenir · avant décembre » et deux gros boutons sous le pouce : visuel, rapide, juste.
- m21 [Neuf] 40 : barre verte pour Réparer, bleue pour Neuf : le vert se lit « conseillé » alors que c'est seulement une couleur.
- B6 (voir plus haut) : 41, après Retenir, plus rien sous le pouce.

### Achat : citra (47, 48, org-citra)
Avis : jauge « lu 7 · manque 3 », colonnes, ✓ / ✕ par article, « ↺ MotlerHops » pour revenir d'un écart, pas de couronne face aux inconnus : conforme à la recette.
- **B5** [UX] 48, org-citra : « 3,72 € » s'affiche comme une valeur sûre alors que la page lue donne trois poids (50, 250, 500 g) ; c'est le défaut déjà relevé le 25.11 (CARNET-SES-DONNEES-EXISTANTES : prix sans quantité). La cellule doit dire le poids ou être hachurée « à relire ».
- m22 [Neuf] org-citra : « poids .fr ? » ne se comprend pas ; lignes en icônes seules (billet, carton, citron, globe) ; petits globes dans chaque case sans légende ; « 👀 » pour « à relire ».
- m23 [UX] 48 : α « 10 % - 15 % » espacé (plainte du 25.11 sur « 10 - 15 ») ; écrire « 10–15 % ».
- m24 [UX] 47 : le toast couvre « poids .fr ? ».

### Achat : 600 bouteilles (org-600-bouteilles)
Avis : trois colonnes alignées, « à laver » sous Occasion, calculs en pointillé, action « Choisir le 15 ».
- **B3** [UX] org-600 : la ligne « Pour 600 » compare 504 CHF (Verallia, livraison inconnue non comptée) à 410 CHF (B, livraison 80 CHF comptée) : le premier total paraît complet et faux d'ordre. Et la couronne est posée sur le prix de l'Occasion, qui ne fournit que 400 bouteilles sur 600 et dont la livraison et le total sont inconnus : contraire à « jamais de couronne face à un inconnu ».
- m25 [Neuf] org-600 : « 0.42/bt » sans devise ; « ≥ 1200 », « × 600 », « ≤ 400 » sans dire minimum / lot / stock.

### Échéance, mémo, idée, planning (49, org-assurance, org-bar, org-ranger-la-cave, org-fete, org-sureau, org-embouteillage)
Avis : le compte à rebours « 36 j avant le 31 déc. » et la liste 0/3 cochable (49 : 1/3) sont clairs ; le mémo du bar (« prix pro ? », « assez de fûts ? » + Noter, « Rappeler le gérant lundi ») est exemplaire.
- m26 [Neuf] org-fete : « ≈ 96 j avant mars » sur une fête en juin : c'est la date du stand, pas de la fête ; le mot « stand » manque près du chiffre.
- m27 [UX] org-embouteillage : aucune action sous le pouce ; la barre de période n'a pas de repère « aujourd'hui » nommé.
- m28 [UX] org-sureau : face à face « à chaud / à froid » sans aucune ligne de comparaison : deux « retenir » sur rien.

### Relecture « pourquoi » (50, org-malt, org-levure-lente, org-pompe)
Avis : « Pourquoi : Autre fournisseur », ce que tu savais → ce que tu as fait, « +8 CHF (2 × 4 CHF) », « Bon choix ? » pouce / doute : visuel et court.
- m29 [Neuf] org-malt, org-levure-lente : l'icône cerveau (« ce que tu savais ») se devine mal.
- m30 [UX] org-levure-lente : jeton « réhydratée ? » et « À retenir : Réhydrater » se répètent.
- m31 [UX] 50 : le toast couvre l'intitulé « Bon choix ».

### Autres problèmes (org-co2, org-chaudiere, org-odeur-de-soufre, org-inspection, org-trop-de-vapeur, org-levure-recoltee)
- m32 [Neuf] org-chaudiere : options « technicien » / « jeudi » en deux mots ; « décaler le brassage au jeudi » ne se lit pas ; citation centrée avec « » » seul sur sa ligne.
- m33 [Neuf] org-odeur-de-soufre : la place de tête est prise par une ligne mélangée « fût.EST — ranger la cave » (icône puzzle), sans dire quoi en faire.
- m34 [UX] org-co2 : « 0,4 bar le 22 » avant « 1,2 bar le 15 nov. » : l'ordre se lit à l'envers et « le 22 » n'a pas de mois.
- m35 [UX] org-trop-de-vapeur : l'action sous le pouce « Acheter le condenser » passe avant « prix des deux ? » ; quel condenser acheter n'est pas tranché.
Ce qui marche : inspection (5×20 mm, 6,3 A, conseil d'une ligne), levure récoltée (3e génération, 12 jours, starter), chiffres en tuiles partout.

### IA en erreur, hors ligne (60, 61, 62, 63)
Avis [IA] : l'erreur est honnête : « L'IA n'a pas pu lire · 5 notes gardées », deux cases « lu sans IA » qui renvoient à leur ligne, « Réessayer » sous le pouce, retour complet (61).
- **B2** [UX][IA] 62 : hors ligne, la vue Organisé déjà lue de la levure (3e génération, 12 jours, odeur, mousse, starter : 63 et org-levure-recoltee) est remplacée par « Rien que l'app sache lire seule ». Dans la cave sans réseau, il perd tout ce qu'il avait. L'ancienne lecture doit rester affichée, marquée « avant ta dernière note ».
- m36 [IA][Neuf] 60, 62 : « pièce de puzzle · case · étincelle avec l'IA » en pointillé ne se comprend pas ; la cause de l'erreur (réseau, quota) n'est pas dite ; « pas trouvé » sans son objet (la fuite).
Ce qui marche : 62, « 1 note en file · l'IA lira au retour », pastille 1 sur Mes notes, point sur Organisé ; rien perdu au retour (63).

## Par regard

- **[UX] mobile compacte : 7,5/10.** Compact, visuel, gros boutons sous le pouce, chiffres en tuiles. Freins : toasts qui traînent (B1), pouce vide après geste (B6), Noter sans effet (B4).
- **[IA] : 8/10.** Visible (étincelle et compteur), annulable case par case avec citations, erreur voulue coupée, aide en Garder / Non merci, erreur et hors ligne honnêtes. Freins : coût jamais dit (m16, m19), relecture invisible après Noter (B4), hors ligne qui efface (B2).
- **[Neuf] : 6/10.** Les écrans simples (assurance, bar, frigo, À faire) se lisent sans aide ; les comparaisons et relectures reposent sur des icônes sans légende (citra, 600, cerveau, 👀, puzzle), et deux comparaisons trompent (B3, B5).

## Verdict

**Note du jouable : 7,3/10.** Bloquants : **6** (B1 à B6). **Répond au besoin : oui**, comme direction et pour les gestes du quotidien (lire, décider,
cocher, annuler, corriger l'IA) ; pas encore à porter tel quel : deux B touchent les données (B1, B2), deux faussent un choix d'achat (B3, B5).

## Corrections, B d'abord

1. B1 — Un toast meurt au changement d'écran ou de carnet ; son Annuler ne vise que le carnet affiché (07, 49).
2. B2 — Hors ligne : garder l'Organisé déjà lu, marqué « avant ta dernière note », plus la case « en file » (62).
3. B3 — 600 bouteilles : un total qui contient une inconnue s'écrit « 504 CHF + ? » et reste hachuré en partie ; pas de couronne sur une colonne qui ne couvre pas le besoin (≤ 400 sur 600) ou qui a un inconnu.
4. B4 — Après Noter, la case répond tout de suite : lecture locale (montant, date) qui remplit le « ? » et retire le manque, puis l'IA confirme ; capture de l'état après relecture.
5. B5 — Citra : un prix sans poids se hachure « à relire » ou dit son poids ; « poids .fr ? » devient « 3,72 € pour quel poids ? ».
6. B6 — Après Retenir ou Fait sans tâche suivante : sous le pouce « Résolu ? » ou « + prochaine étape », jamais vide (24, 41, embouteillage).
7. m4, m15, m16, m19, m36 — IA : dire la réponse vide, « vérifier » au lieu de « check », coût sur Aide, Relire, Question, Réessayer ; cause de l'erreur ; légende de la case « avec l'IA ».
8. m1, m2, m5, m6 — Liste et Ranger : sous-domaine par ligne ou en sous-en-tête repliable ; « ▸ ✓ 3 » → « 3 résolus » ; feuille Ranger en groupes par domaine ; un seul nom « À ranger ».
9. m8, m9, m10 — À faire : dates intermédiaires et bulles qui ne se chevauchent pas ; tâche de même nom que son carnet sans sous-ligne ; « réparer / neuf » sous les montants.
10. m22, m25, m29, m32, m33, m26 — Légendes au premier toucher (ou une fois) pour les icônes de ligne, cerveau, 👀, puzzle ; devise et sens de ≥ / × / ≤ ; « jeudi » → « décaler à jeudi » ; mot « stand » près du compte à rebours.
11. m11, m12, m13, m17, m18, m21, m23, m24, m27, m28, m30, m31, m34, m35 — finitions (étincelle expliquée, compteur IA stable, vide sous la carte, « + » qui ne pousse pas, date de création gardée, couleur neutre des barres, « 10–15 % », toasts hors des contenus, repère aujourd'hui, face à face sans ligne, doublon réhydrater, ordre des mesures CO2, action après le manque).
