# Mode graph : passe 2 des trois versions gardées (g4b, g2b, g3b), 17.11

Les v0 (g1 à g6 et leurs captures) n'ont pas été touchées. Les nouvelles pages sont `mg/g4b.html`, `mg/g2b.html`
et `mg/g3b.html` (avec `?p=26` pour les 6 mois). Elles sont générées par `mg/build-b.mjs`, et les captures
et contrôles par `mg/cap-b.mjs`.

Sortie de `node mg/build-b.mjs && node mg/cap-b.mjs` :
```
g2b repos [6 mois] courbe 72% bande 36px 9 étiquettes, liens croisés 0 ok
g2b paysage [6 mois] courbe 78% bande 36px 9 étiquettes, liens croisés 0 ok
g3b repos [6 sem.] courbe 72% bande 38px 8 étiquettes, liens croisés 0 ok
g3b paysage [6 sem.] courbe 77% bande 38px 8 étiquettes, liens croisés 0 ok
g3b 6mois [6 mois] courbe 69% bande 38px 10 étiquettes, liens croisés 0 ok
g4b repos [6 mois] courbe 74% bande 36px 9 étiquettes, liens croisés 0 ok
g4b paysage [6 mois] courbe 77% bande 36px 9 étiquettes, liens croisés 0 ok
MG-B OK
```

Le contrôle vérifie les points suivants :
- aucun texte sous 14 px, hors écran ou coupé ;
- aucune étiquette ne chevauche une autre étiquette ou un texte du graphe ;
- aucun texte HTML ne chevauche un autre texte ;
- aucun trait de renvoi ne traverse un nom, et aucun lien ne croise un autre ;
- le + est au rectangle exact de r6b (390 : 295,728 44×44 ; 844 : 673,274 44×44), à 16 px des onglets ;
- la courbe occupe au moins 55 % de la hauteur, la bande 40 px au plus ;
- aucune étiquette n'est cachée ;
- les sommes sont justes : caisse précédente + flux = caisse chaque semaine, et départ + totaux de la légende = caisse de fin.

## Captures (`mg/cap/`), toutes ouvertes
- `g4b.png`, `g2b.png`, `g3b.png` : repos 390×844.
- `g3b-6mois.png` : g3b sur 6 mois.
- `gXb-passage.png` : le passage en trois temps.
  1. Toucher sur la base r6b, à la même période.
  2. Pendant : la courbe se déplie et les rangées de la frise se tassent vers la bande.
  3. Arrivée dans le mode graph.
- `gXb-paysage.png` : paysage 844×390.
- `gXb-paysage-retour.png` : le geste de retour en paysage (toucher dans le mode graph), puis l'arrivée sur r6b en paysage.

## Communs (points 32 à 36)
- **32, passage prouvé.** Chaque passage montre le toucher, un état intermédiaire et l'arrivée.
- **33, le + identique.** Le + reprend la règle de r6b, `right: calc(12px + (100vw − 24px)/6 − 22px)`, 44 px, `bottom` 72. La barre du bas fait 56 px dans les deux sens, comme r6b. Le contrôle compare le rectangle à celui de la base.
- **34, une seule chose à la fois.** La bascule ne change plus la période.
  - g4b et g2b : 6 mois des deux côtés. Dans la base, la pastille indique « 6 mois » et la brosse de sa courbe d'en-tête couvre 26 semaines.
  - g3b : 6 sem. des deux côtés, et 6 mois par la pastille.
- **35, Activités.**
  - g4b et g2b : la légende ne garde que les genres chiffrés. La bande ne colore que les semaines où l'argent bouge, donc aucune couleur ne reste sans explication.
  - g3b : la frise empile aussi ce qui est au calendrier. La légende indique donc « Activités 0 ».
- **36, retour en paysage.** Chaque version a sa capture `-paysage-retour`.
- **37, contrôle panel.** Rien n'a été changé : voir la leçon proposée par le critique.

## g4b : couloirs, marches teintées, bascule ⛶
1. L'axe va de 3 500 à 6 000, en portrait comme en paysage.
2. Les couloirs prennent 2 rangées au moins. Une recherche complète place chaque nom sans qu'un trait ne traverse un autre nom.
   - En portrait, il en faut 4 en haut et 4 en bas pour 9 noms entiers. En paysage, 2 suffisent.
   - Les pointillés vont maintenant de 60 à 330 px, contre 300 à 700 px avant.
3. Chaque marche est teintée en entier (greffe de g2) :
   - le palier est épais, à la couleur du genre qui fait le plus bouger la caisse cette semaine ;
   - une colonne pâle descend sous ce palier ;
   - la contremarche empile les montants exacts.
   Les semaines où il n'y a que les ventes courantes restent noires et fines.
4. Le + est à la place exacte de r6b.
- Greffes :
  - entrées en disque plein, sorties en anneau, avec leur clé dans la légende (g6) ;
  - fenêtre S47 à S52 encadrée dans la bande ;
  - entrée « à dépenser 113 en S24 → » dans la légende.
- Point 21 : le même ⛶ sert à l'aller et au retour. Il est noir quand il est enfoncé.

## g2b : zones teintées, sélecteur Frise | Courbe
1. L'axe va de 3 500 à 6 000.
2. La légende donne les totaux sur 6 mois. Leur somme, 4 180 − 36, donne bien la caisse de fin, 4 144.
3. Il n'y a plus de gris de départ.
   - Une zone naît à chaque semaine qui bouge, nommée ou non (brassin, loyer, facture…).
   - Elle porte la couleur de ce qui l'a fait bouger, et pâlit sur les semaines de ventes courantes.
   - Une zone ne couvre donc plus la marche d'un autre genre (point 10).
4. La bascule est visible : c'est le sélecteur « Frise | Courbe », sur sa propre ligne sous l'en-tête. Dans la base, la même ligne est glissée sous la rangée d'en-tête : rien n'est couvert et rien ne bouge sous le pouce.
- Autres changements :
  - la fenêtre S47 à S52 est encadrée dans la bande (greffe de g4) ;
  - les cases pâles de la bande ont disparu (point 11) ;
  - le libellé « à dépenser 113 en S24 → » est à côté du +.

## g3b : cascade, chaque pièce nommée
1. L'en-tête est celui de r6b tel quel (rangée q5-t) : « 113 CHF à dépenser · S24 », 6 sem., ⏱2 et ⛶ tiennent sur une ligne, en portrait et en paysage. Le sélecteur a sa propre ligne.
2. L'axe est serré sur les données : 3 900 à 6 000 pour 6 semaines, contre 3 000 à 6 500 avant.
3. La frise est empilée par semaine (greffe de g1). Elle montre le semestre, et la fenêtre noire encadre ce que montre la courbe.
4. La pastille propose 6 mois (`g3b-6mois.png`).
   - Seuls les mouvements nommés et le loyer y portent un nom.
   - La frise est alors alignée sous la courbe.
- Point 17 : en paysage, le dernier palier s'arrête au bord du graphe.

## Écarts assumés
- **Le point bas S24 est hors de la fenêtre.** Avec 6 mois depuis S47, la fenêtre s'arrête en S19, et le point bas est en S24. Le libellé de g1 ne peut donc pas se poser sur sa marche. Il devient une entrée de légende avec une flèche « → ».
- **La ligne du sélecteur décale la frise de 32 px.** Dans la base, pour g2b et g3b, il a fallu ajouter une ligne : r6b n'avait pas de place libre. La frise descend donc de 32 px.
- **Les bulles du doigt couvrent un peu de la base.** Ce sont des annotations de capture, pas des éléments de l'écran.

Le brasseur dirait sans doute, devant g4b : « Là le graph prend la place et je vois qui fait bouger quoi ».
