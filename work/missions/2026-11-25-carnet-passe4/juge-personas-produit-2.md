# Juge personas produit 2 · passe 4 du Carnet, tour 2 (p4b) · 25.11

Trois regards dans un même fichier :
- **UX** : mobile compacte, densité, hiérarchie, pouce, 390 px.
- **IA** : l'aide est-elle réelle, visible, annulable ? Que se passe-t-il quand l'IA se trompe ou manque ?
- **Neuf** : un nouveau venu comprend-il sans explication ?

Matière : `p4b/p4b-1..3.html` (recette en tête de chaque fichier), `p4b/RESULTAT.md`, `p4b/cap/mesures.json`. Images ouvertes avec Read :
- les 3 planches `cap/planche-p4b-{1,2,3}.png`, qui contiennent les 30 écrans ;
- en pleine taille, pour les détails : `p4b-3-liste.png`, `p4b-3-afaire.png` et `p4b-2-organise.png`.

Valeurs recoupées avec les fixtures c79 et c75 : 1,2 → 0,4 bar, J+5, 2 500 CHF, 6,3 A, 13,6 %, 3,72 € (`prixCentimes` 372 lu sur la page),
« dur à obtenir », +4 CHF le sac. Aucune valeur inventée. Règles de repli recoupées dans `analyseLocale.ts` (`etiquettesLocales`).
Les mots et les px viennent du script (`mesures.json`), pas d'une estimation.

## Tour 1 → tour 2 : ce qui est réglé, ce qui reste

| Constat du tour 1 | Tour 2 |
|---|---|
| 1. B : Organisé de plus de 30 mots | **Réglé** : 26, 24 et 25 mots mesurés |
| 2. B : frise d'états fixe | **Réglé** : aucune frise. Seul reste « comparé › choisi › commandé » sur l'achat de p4b-1, petit et propre à l'achat (m) |
| 3. B : première info utile trop bas | **Réglé** : 38 à 48 px |
| 4. m : six écrans copiés de M4 | **Réglé** : Décider, Relecture, Erreur et Mémo ont chacun trois formes vraiment différentes |
| 6. m : bruit « imaginée » | **Réglé** |
| 7. IA : « Ranger » en bouton principal | **Réglé** : l'IA lit seule (« lu par l'IA 20:35 »), Ranger a disparu du premier plan |
| 8. IA : bouton Aide absent | **Réglé** : Aide au pouce partout, avec ses trois propositions. Mais p4b-1 ne permet pas d'accepter (B1) |
| 10. UX : bascule hors du pouce | **Réglé** : en bas dans les trois |
| 9. Neuf : vocabulaire et icônes sans légende | **Reste** : lignes de métro sans mot, 💰 ⏱ 💶 📦 en tête de rangée, couronnes, « piste : rien lu », anneau « 36 j » |
| Valeur fausse (« 150 CHF ? » sur un devis) | **Reste en partie** : 150 CHF montré sans « estimé » dans p4b-2 et p4b-3 (B2) |
| Feuille « Changé par l'IA » (cadenas, proposé pas posé) | **Non montrée** : le jeton « ✦ 20:35 › » y mène, mais aucun écran ne montre l'IA qui se trompe et sa correction |

## Constats transversaux du tour 2

- **B1 · IA · p4b-1, Aide sans accord.** La suggestion s'affiche, avec « Rien n'est posé sans ton toucher », mais il n'y a rien à
  toucher : ni Garder, ni Non merci (`p4b-1-organise-aide.png`). L'aide n'est donc ni acceptable ni refusable.
- **B2 · IA / Neuf · « estimé » perdu.** Sa ligne dit « Estimation 150 CHF (exemple) ». p4b-1 écrit « 150 CHF estimé ». p4b-2 met
  seulement un cadre pointillé, sans mot (`p4b-2-organise.png`). p4b-3 affiche 150 CHF tout court, à côté de « devis ⏳ »
  (`p4b-3-organise.png`), et le reprend dans la liste comme chiffre clé de l'écoulement (`p4b-3-liste.png`). On lit alors le prix du
  devis : c'est le défaut du tour 1 qui revient.
- **B3 · UX · Décider sans action sous le pouce.** Dans p4b-1 et p4b-3, les deux « Retenir » sont vers 330 à 380 px, au milieu de
  l'écran (planches, case decider). La règle dure n'est tenue que par p4b-2.
- **m · IA · options déduites non marquées ✦.** « Toi ou le sanitaire X ? » et la case « toi » viennent de la lecture de ses notes :
  il n'a jamais écrit qu'il le ferait lui-même. Pourtant rien ne les dit proposées (Organisé et À faire des trois versions). Même
  chose pour « Si ça revient : l'autre fournisseur, +4 CHF le sac » (`p4b-2-relecture`).
- **m · IA · bouton qui pousse un choix.** Sur Décider, p4b-2 et p4b-3 font « Retenir » blanc pour la réparation et sombre pour le
  frigo neuf, sans raison écrite. p4b-3 met aussi une couronne sur 480 CHF dans À faire (`p4b-3-afaire.png`). Qui a jugé que la
  réparation gagne, et sur quoi ? Ce n'est pas dit.
- **m · UX · barre du bas.** p4b-1 et p4b-3 tiennent sur une ligne, mais le champ « Ajouter.. » y est coupé à environ 85 px, et
  « Notes / Organisé » est écrit en 11 px dans p4b-3. p4b-2 se lit très bien (« Mes notes », champ large), mais empile trois étages,
  soit environ 200 px avec l'action.
- **Décision à prendre (barre d'onglets dans le carnet ouvert).** Les trois regards sont d'accord pour la laisser masquée : le carnet
  est une page plein écran avec ‹, et le bas sert à l'action et à la bascule. Ce choix se défait facilement.

---

## 1. Liste

- **UX.** Les trois versions sont compactes (11 à 13 lignes, 71 à 79 %).
  - p4b-3 est la plus vite lue : à droite, le chiffre clé de ses notes (1,2 → 0,4 bar, J+5, 6,3 A, +4 CHF / sac). C'est l'info,
    pas un mot d'état.
  - p4b-2 replie les résolus dans l'en-tête du domaine (« ▸ 3 résolus »). Pour un TDAH, c'est le meilleur tri. Mais elle perd le
    champ « Noter » (seulement « + ») et laisse environ 100 px vides.
- **IA.** Aucune IA visible ici, et c'est bien. Mais le « 150 CHF » de p4b-3 sur l'écoulement est une estimation montrée comme un
  prix (B2).
- **Neuf.** Dans p4b-1, la couleur des pastilles prend son sens grâce aux compteurs du bas de même couleur : c'est une légende
  gratuite. Dans p4b-3, les mini-barres des domaines n'ont pas de légende, et la ligne « Fête de la bière » est coupée sous les
  compteurs.

Problèmes :
1. m · p4b-2 · pas de champ pour noter, seulement « + » (planche p4b-2, liste).
2. m · p4b-3 · 150 CHF sans ≈ (`p4b-3-liste.png`), voir B2.
3. m · p4b-1 · résolus non repliés ; sous-domaines coupés (« Fe… »).

Meilleurs mécanismes : **p4b-3, chiffre clé de ses notes à droite** ; **p4b-2, résolus repliés dans l'en-tête** ; **p4b-1, pastilles
de la couleur des compteurs**, qui servent de légende.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 7,5 | 7 | 8 |

## 2. Organisé : un problème ouvert (écoulement)

- **UX.** Enfin lisible sans lire, dans les trois versions.
  - p4b-1 : lignes de métro. Joint tracé jusqu'au ✓, dalle en pointillé jusqu'au « ? », sanitaire jusqu'au sablier. Elles
    disent l'avancement d'un coup d'œil, mais prennent 270 px et laissent environ 150 px vides au-dessus de l'action.
  - p4b-2 : tuiles 2 × 2, puis face à face. Trois boutons blancs se disputent le pouce (Retenir, Retenir, Contacter).
  - p4b-3 : tuiles rondes et face à face avec des mots (« toi », « sanitaire X »), puis « ✏ prix du joint ? Noter ». Une seule
    action noire.
- **IA.**
  - Dans les trois, « seule cause ? » ✦ et le jeton « ✦ 20:35 › » montrent que l'IA a lu.
  - p4b-3 est la plus juste : elle demande le prix manquant au brasseur au lieu de le deviner.
  - p4b-2 propose « Retenir » avant tout devis : elle pousse à trancher sur un inconnu.
  - L'option « toi » n'est pas marquée ✦ (m).
- **Neuf.**
  - p4b-1 : le métro est beau, mais sans « trouvé » ni « pas trouvé », il faut le deviner. Le 💡 seul dans le bloc des coûts reste
    une énigme.
  - p4b-2 : « 🔧 ou 👷 ? » se lit en rébus, et 🔧 veut dire à la fois « joint » (tuile) et « toi » (face à face).
  - p4b-3 : c'est la plus claire.

Problèmes :
1. B · p4b-2 · trois boutons primaires, dont Retenir avant le devis (`p4b-2-organise.png`).
2. B · p4b-2, p4b-3 · 150 CHF sans « estimé » (B2).
3. m · p4b-1 · lignes sans mot d'état, 💡 orphelin, vide au-dessus de l'action (planche p4b-1, organise).
4. m · les trois · « toi » déduit, non marqué ✦.

Meilleurs mécanismes : **p4b-3, « prix du joint ? Noter »** (l'inconnu appelle sa saisie) ; **p4b-3, face à face écrit en mots** ;
**p4b-1, « estimé » en pointillé et inconnu hachuré** ; **p4b-1, lignes de métro**. Le métro et les tuiles sont un axe de goût à lui
montrer, pas à trancher ici.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 7,5 | 6,5 | 8 |

## 3. Geste : toucher un élément → sa ligne dans Mes notes

- **UX.** Dans les trois, la ligne 2 est surlignée en vert, et le retour est clair. Le meilleur retour est celui de p4b-2 : une barre
  pleine largeur, « ← Revenir à 🔧 Joint usé », sous le pouce. La pastille de p4b-3, en bas à droite, est petite.
- **IA.** « lu par l'IA 20:35 », avec les mots lus soulignés (trouvé usé, pas trouvée, 150 CHF) : c'est la meilleure preuve de
  lecture de la passe, et elle est commune aux trois.
- **Neuf.** Il comprend tout de suite d'où vient la tuile.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 8 | 8 | 7,5 |

## 4. Aide ouverte

- **UX.**
  - p4b-1 : trois grosses tuiles, mais une légende de 20 mots en bas.
  - p4b-2 : une liste de trois lignes, chacune expliquée.
  - p4b-3 : trois tuiles sous-titrées, puis Garder / Non merci.
- **IA.**
  - p4b-1 : aucun moyen de garder ni de refuser (B1).
  - p4b-2 : chaque ligne est elle-même le geste. « Tâche » montre sa source (« ta ligne 3 »), « Vérifier » dit ce qu'il fera
    (« relit tes 5 notes et dit ce qui cloche »). Le refus est implicite : on ferme.
  - p4b-3 : accord et refus sont explicites. C'est le plus sûr.
- **Neuf.** p4b-2 se comprend sans rien savoir. Dans p4b-1, Vérifier et Tâche sont nus.

Problèmes :
1. B · p4b-1 · suggestion sans Garder ni Non merci (`p4b-1-organise-aide.png`, sur la planche).
2. m · p4b-3 · la tâche proposée double l'action déjà sous le pouce (« Contacter l'entreprise X »).

Meilleurs mécanismes : **p4b-2, chaque proposition avec ce qu'elle fait et sa ligne source** ; **p4b-3, Garder / Non merci**.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 5,5 | 8 | 8 |

## 5. Organisé : un achat avec Comparer (Houblons citra)

- **UX.**
  - p4b-1 : rangées en barres, icônes en tête de rangée, et « « dur à obtenir » .fr » face à « en stock ⚠ ». Juste.
  - p4b-2 : cartes classées 1 et 2, avec « ✕ Écarter » écrit en clair.
  - p4b-3 : le tableau le plus propre.
- **IA.**
  - p4b-2 montre le critère que l'IA propose (« ✦ α précis ✓ ✎ ») : il est visible et réversible. Mais elle classe Brau premier
    alors que son prix est « à relire ».
  - p4b-3 couronne 13,6 % et les arômes de Brau, alors que les arômes de MotlerHops sont inconnus (hachurés). Gagner contre un
    inconnu, ce n'est pas gagner.
- **Neuf.**
  - p4b-1 : 💶 📦 🍊 🌍 sans mot, et le cadre doré de Brau n'est pas expliqué.
  - p4b-2 : ✓ et ✎ sont nus.
  - p4b-3 : « lu 7 / manque 3 » ne dit pas ce qui est compté.

Problèmes :
1. B · p4b-3 · couronne face à un inconnu (planche p4b-3, achat).
2. m · p4b-2 · classement sur un critère alors que le prix manque ; ✓ ✎ sans mot.
3. m · p4b-1 · icônes de rangée sans légende, cadre doré non expliqué, mini-avancement en tête (à surveiller pour FRISE-GENERIQUE).

Meilleurs mécanismes : **p4b-2, critère ✦ proposé, gardé ou changé, et Écarter en mot** ; **p4b-1 et p4b-2, sa note « dur à obtenir »
face au « en stock » lu** ; **p4b-3, tableau, à condition de couronner seulement quand les deux valeurs sont connues**.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 7 | 7,5 | 6,5 |

## 6. Décider (frigo : réparation 480 ou neuf 1 200)

- **UX.**
  - p4b-2 : colonnes dont la hauteur dit le prix, « Retenir » sous le pouce. Lisible sans lire, et la règle est tenue.
  - p4b-1 : 70 mots ; Retenir au milieu de l'écran.
  - p4b-3 : la règle « 720 CHF d'écart » est la plus claire, mais Retenir est au milieu de l'écran (B3).
- **IA.**
  - p4b-1 et p4b-3 posent « Pourquoi l'un plutôt que l'autre ? Tes notes ne le disent pas · Ajouter » : c'est honnête et utile
    pour la relecture.
  - p4b-1 propose « Ensuite : devis à comparer, ✦ tâche proposée · Garder » : l'aide est bien posée.
  - p4b-2 et p4b-3 mettent en avant « Retenir réparation » sans dire pourquoi (m).
- **Neuf.** « −720 CHF » sous la réparation (p4b-1, p4b-2) peut se lire comme une perte. « 720 CHF d'écart » (p4b-3) ne prête pas à
  confusion.

Problèmes :
1. B · p4b-1, p4b-3 · Retenir hors du pouce (planches, decider).
2. m · p4b-2 · ni « pourquoi » ni « ensuite ».
3. m · p4b-2, p4b-3 · Retenir blanc d'un seul côté, sans raison.
4. m · p4b-1, p4b-2 · « −720 » ambigu.

Meilleurs mécanismes : **p4b-2, colonnes et Retenir au pouce** ; **p4b-3, « 720 CHF d'écart »** ; **p4b-1, « Pourquoi… Ajouter » et
« Ensuite : tâche proposée · Garder »**.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 6,5 | 7,5 | 7 |

## 7. À faire (tous les carnets)

- **UX.**
  - p4b-2 : « Une décision t'attend » se tranche d'un toucher (480 / 1 200), puis les tâches sont rangées en Cette semaine,
    Bientôt, Sans date. C'est l'ordre de son cerveau.
  - p4b-1 : décisions en barres, et sous chaque tâche l'icône et le nom de son carnet. Mais les décisions ne se tranchent pas
    d'ici.
  - p4b-3 : règle du temps, mais les icônes se chevauchent sans nom et 📄 est coupé au bord (`p4b-3-afaire.png`).
- **IA.** « Toi ou le sanitaire X ? » est une question déduite, non marquée ✦. La couronne sur 480 (p4b-3) est un jugement non dit.
- **Neuf.** p4b-2 se lit seul. Dans p4b-2, « Contacter l'entreprise X », la prochaine action d'un carnet ouvert, tombe en « Sans
  date », tout en bas.

Problèmes :
1. m · p4b-2 · Contacter relégué en « Sans date » (planche p4b-2, afaire).
2. m · p4b-3 · icônes de la frise du temps sans nom, chevauchées, coupées (`p4b-3-afaire.png`).
3. m · p4b-1 · décisions sans geste.

Meilleurs mécanismes : **p4b-2, décision tranchée d'un toucher et tâches rangées par délai** ; **p4b-1, carnet d'origine sous chaque
tâche** ; **p4b-3, « aussi dans À venir »**.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 7 | 8 | 7 |

## 8. Relecture, des mois plus tard (malt)

- **UX.**
  - p4b-3 : deux colonnes « TU SAVAIS · 24 nov. » et « ✓ TU AS FAIT · 25 nov. ». On voit l'avant et l'après d'un coup d'œil.
  - p4b-2 : on entre par la recherche (« pilsner · 1 carnet »), le vrai chemin des mois plus tard, et les trois faits sont en
    tuiles.
  - p4b-1 : liste datée, juste mais plus lente.
- **IA.**
  - p4b-1 et p4b-3 disent « +8 CHF · calcul de l'app », et p4b-3 ajoute « Le prix du sac : tes notes ne le disent pas ». C'est la
    bonne honnêteté.
  - « Si ça revient » (p4b-2) est une leçon déduite, non marquée ✦.
- **Neuf.** Les trois répondent à « pourquoi j'ai pris ça ». p4b-3 l'écrit en tête (« POURQUOI »).

Meilleurs mécanismes : **p4b-3, colonnes savais / as fait** ; **p4b-2, entrée par la recherche** ; **« Toujours le bon choix ? Oui /
Pas sûr » au pouce** (les trois).

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 7,5 | 8 | 8 |

## 9. IA en erreur, ou hors ligne

- **UX.**
  - p4b-1 : l'erreur, ce que l'app a lu seule (pas trouvé, ligne 2 ; 150 CHF, ligne 5), des cases en creux « pistes · IA » et
    « tâche · IA », les notes telles quelles, puis « Relire avec l'IA » au pouce.
  - p4b-3 : quatre grosses cases, mais environ 250 px vides, et les notes ne sont pas montrées.
  - p4b-2 : la variante hors ligne (« 1 note en file »). Son gros bouton du bas, « En attente du réseau », ne fait rien.
- **IA.** Les trois respectent `etiquettesLocales` : rien d'inventé, aucune option, aucune tâche. Mais p4b-3 dit « PISTE · rien lu »
  alors que sa ligne 2 commence par « Pistes : » : c'est vrai pour le code, mais déroutant.
- **Neuf.** p4b-1 se comprend sans rien savoir : ce qui manque a la forme d'une case vide, marquée « IA ».

Problèmes :
1. m · p4b-3 · « piste : rien lu » face au mot « Pistes » de sa note ; notes absentes (planche p4b-3, erreur).
2. m · p4b-2 · le bouton principal ne fait rien (planche p4b-2, erreur).

Meilleurs mécanismes : **p4b-1, cases en creux « · IA » et notes telles quelles** ; **p4b-2, « 1 note en file » pour le hors ligne** ;
**p4b-3, « Options, tâche, conseil : seulement avec l'IA »**.

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 8,5 | 7 | 7 |

## 10. Mémo (assurance)

- **UX.**
  - p4b-2 : « 36 j avant le 31 déc. » sur une barre de jours, de grosses cases pour les pièces, et l'action de sa ligne
    (« Demander l'offre au 2e assureur ») au pouce.
  - p4b-1 : un anneau « 36 j » de sens obscur (36 sur combien ?), et les notes répétées sous les cases.
  - p4b-3 : un calendrier de 280 px pour une seule date, sans nom de mois, et aucune action.
- **IA.** « Je le ressortirai quand tu noteras « assurance » » est commun aux trois : c'est une aide claire, à interrupteur, donc
  annulable.
- **Neuf.** p4b-2 se lit sans rien savoir.

Meilleurs mécanismes : **p4b-2, barre de jours et action au pouce** ; **p4b-1, « ta ligne 1 / ta ligne 3 » sur chaque élément** ;
**le rappel à interrupteur** (les trois).

| p4b-1 | p4b-2 | p4b-3 |
|---|---|---|
| 7 | 8 | 6,5 |

---

## Notes d'ensemble (moyenne des 10 écrans)

| Version | UX | IA | Neuf | Moyenne |
|---|---|---|---|---|
| p4b-1 Métro | 7 | 6,5 | 7 | **7,2** |
| p4b-2 Sous le pouce | 7,5 | 7,5 | 7,5 | **7,5** |
| p4b-3 Qui gagne quoi | 7,5 | 7 | 7,5 | **7,35** |

## Probant ?

**Oui, assez pour un jouable ; non comme version unique.**
- Les quatre règles dures de ce soir sont tenues partout sur Organisé, mesures à l'appui : 24 à 26 mots, info utile à 38–48 px, pas
  de frise, 11 à 13 lignes de liste. On lit enfin sans lire. Au tour 1, aucune version n'y arrivait.
- Les écrans copiés de M4 sont devenus de vraies explorations.
- Restent cinq bloquants, tous simples à corriger dans un jouable :
  - B1 : Aide sans accord dans p4b-1 ;
  - B2 : « estimé » perdu ;
  - B3 : Retenir hors du pouce sur Décider ;
  - une couronne face à un inconnu ;
  - trois boutons primaires dans l'Organisé de p4b-2.
- Toujours absent : l'écran où l'IA s'est trompée et où il la corrige (feuille « Changé par l'IA », cadenas). C'est le seul trou
  du regard IA.

## Recette de greffe pour le jouable

| Écran | Mécanisme retenu (source) |
|---|---|
| Liste | Lignes p4b-3 (chiffre clé de ses notes à droite, ≈ sur une estimation) ; résolus repliés « ▸ 3 résolus » p4b-2 ; compteurs colorés qui filtrent et servent de légende p4b-1 ; champ « Noter, coller un lien… » + « + » p4b-1/p4b-3 |
| Organisé (problème) | Base p4b-3 : tuiles des pistes avec un mot, face à face « toi / sanitaire X » en mots, « prix du joint ? Noter », une seule action noire. « estimé » pointillé et inconnu hachuré p4b-1. Option déduite marquée ✦. Métro p4b-1 ou tuiles p4b-3 : axe montré au brasseur |
| Bas du carnet | Une ligne comme p4b-1, mais « Mes notes » lisible (p4b-2) et champ ≥ 140 px ; barre d'onglets de l'app masquée dans le carnet ouvert |
| Toucher → sa ligne | Mots lus soulignés et « lu par l'IA » (commun) ; retour pleine largeur « ← Revenir à … » p4b-2 |
| Aide | Liste p4b-2 (ce que fait chaque proposition et sa ligne source) ; Garder / Non merci p4b-3 sur la suggestion |
| Achat / Comparer | Cartes classées p4b-2 avec critère ✦ gardé ou changé (mots, pas ✓ ✎) et « Écarter » ; « dur à obtenir » face à « en stock » p4b-1/p4b-2 ; pas de couronne face à un inconnu ; légende des icônes de rangée une fois |
| Décider | Colonnes et Retenir au pouce p4b-2, deux boutons de même poids ; « 720 CHF d'écart » p4b-3 ; « Pourquoi… Ajouter » et « Ensuite : tâche proposée · Garder » p4b-1 |
| À faire | p4b-2 (décision tranchée d'un toucher, tâches par délai) ; carnet d'origine sous chaque tâche p4b-1 ; la prochaine action d'un carnet ouvert jamais en « Sans date » |
| Relecture | Colonnes « tu savais / tu as fait » et « tes notes ne le disent pas » p4b-3 ; entrée par la recherche p4b-2 ; « Toujours le bon choix ? » au pouce |
| IA en erreur | p4b-1 (lu seul avec sa ligne, cases en creux « · IA », notes telles quelles, Relire au pouce) ; ne pas afficher « piste : rien lu » |
| Hors ligne | p4b-2 (« 1 note en file », lu sans IA), avec une action utile au pouce (Noter) plutôt que « En attente » |
| Mémo | p4b-2 (barre de jours, grosses cases, action de sa ligne au pouce) ; « ta ligne N » p4b-1 ; rappel à interrupteur |
| À ajouter | Feuille « Changé par l'IA » : cadenas sur ses corrections, « proposé, pas posé », annuler un classement (tour 1, v05 / v03 / v06) |
