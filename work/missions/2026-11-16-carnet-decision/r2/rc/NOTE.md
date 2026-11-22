# rc : dc retouché, avec le champ de note de da

Base : `dc/proto.html`, reprise telle quelle (règle n° 1). Les retouches se jouent par remplacements exacts et comptés
(`retouche.mjs`, L26) sur `proto.tpl.html`. Ce fichier est dc, avec l'échelle 14/16/18/22 et le bloc CSS rc.
Rebâtir : `node r2/rc/retouche.mjs && node r2/rc/build.mjs`.
Paramètres :
- `?etat=<état>` ouvre un état ;
- `&clavier=300` simule un clavier de 300 px ;
- `&theme=cave` passe au thème sombre.

Sur un vrai téléphone, `visualViewport` mesure la hauteur du clavier. La balise viewport porte `interactive-widget=resizes-content`.

## Ce qui a changé, ligne par ligne

1. **Noter (CARNET-CLAV, ses mots « da · un seul champ »).** Dans un carnet, le bouton « + Noter » et sa feuille sont remplacés par le champ de da, posé en bas, sur les trois onglets : « Écrire, ou coller un lien… », avec photo, micro et ↑.
   - Le champ grandit jusqu'à 4 lignes, pour que le texte se lise en entier.
   - Quand le clavier s'ouvre, le champ monte au-dessus et la barre du bas se cache. La dernière note, avec sa date, s'affiche juste au-dessus du champ.
   - La touche Entrée envoie la note.
2. **L'IA propose le critère** (ses mots : « l'IA propose le critère le meilleur »). Le segment « Ranger comme : note · façon de faire · ce qui tranche », jugé « horrible », est retiré. Après l'envoi, une carte « ✦ L'IA propose » (exemple) apparaît au-dessus du champ, avec trois cas :
   - « En faire ce qui tranche ? », avec « Le lire sur » et la caractéristique proposée déjà cochée. Par exemple, sur l'évier, « fût couché » donne Profondeur de bac.
   - « En faire une façon de faire : « Gaine inox au-dessus de la cuve » ? »
   - Sinon, rien : la note reste une note.
   Les boutons sont « Oui… » et « Juste une note ». Les trois rangements de dc existent toujours ; c'est l'IA qui les propose.
3. **Lien collé.** L'aperçu de dc (photo, nom, fournisseur, pays, stock, prix, caractéristiques lues), la bascule « Surveiller tous les 3 jours » et « Ajouter aux articles » s'affichent au-dessus du champ, et restent visibles clavier ouvert.
4. **Comparer : écartés visibles en gris.** Ils restent à leur rang, en gris, avec « · écarté ». Une légende « ● ton choix · en gris : écartés, à leur rang » est ajoutée. Les noms ne sont plus coupés par « … » : ils passent sur deux lignes.
5. **Comparer en paysage (844 × 390).** C'est une vue neuve :
   - une matrice avec les articles en colonnes (5 côte à côte, le 6e en glissant) et les caractéristiques en rangées ;
   - la colonne et la caractéristique du critère restent fixes ;
   - le choix est en vert pâle et les écartés sont en gris ; le meilleur de chaque rangée est en vert ;
   - « ? non trouvé » quand une valeur manque ;
   - les onglets montent dans l'en-tête, et le champ de note reste présent.
6. **Lisibilité.**
   - Police : Source Sans 3 chargée, chiffres en IBM Plex Mono tabulaires.
   - Tailles : 14 px au minimum, 16 px pour le corps, 18 px pour les noms, 22 px pour le titre.
   - Marges : 16 px au lieu de 12.
   - Contraste : gris à #555, soit 7,4:1 sur blanc (#ad9f93 en cave).
   - Plus aucune MAJUSCULE espacée : « Ce qui tranche », « Produit et fournisseur », « Carnets 4 ».
7. **Noms entiers.**
   - Le « pré-évac. » de la liste est retiré.
   - Le texte abrégé de la fixture, « Iso 4 becs pré-évac. », s'affiche en entier.
   - Le jalon, le résumé des écartés et les lignes de Comparer passent à la ligne au lieu de se couper.
8. **Dates lisibles.** Les dates de la frise, du champ et de « Tes notes d'avant » sont en encre et en demi-gras.
9. **Liste.**
   - Le statut se place sur la ligne du titre ; le texte prend toute la largeur, au lieu d'une demi-colonne.
   - L'œil de veille (« 👁 2 · −600 CHF ») rejoint la ligne des vignettes. Il est déplacé, pas retiré.
10. **Textes.** « Colle un lien avec + Noter » devient « Colle un lien dans le champ en bas ».

## Ce qui est resté (rien d'autre n'est retiré, CARNET-MAIGRE)

- **Liste** : Caisse fin de mois, « Carnets 4 · idées, recherches, choix », pastilles de décision, « → choix · pays », « parce que… », « dernier mot », vignettes, comptes, alerte de veille et « + Idée ».
- **Journal** : la carte « Ton choix » au complet (pourquoi, « 3 écartés › », « à revoir si », vignettes, « Oxygène capté 40 ppb · 1er sur 6 › », Pourquoi ?, Planifier l'achat), « Ce qui tranche », « En suspens » avec « Je retiens », et la frise datée avec les décisions remplacées barrées.
- **Articles** : cartes d'aperçu, « Surveiller », « Dispo ? », « Pourquoi ? », « Je prends », « moins bien partout que… », lien seul avec « Relire avec l'IA ».
- **Comparer en portrait** : puces de caractéristiques, un tableau par caractéristique, barres, ×, « + caractéristique », « Moins bien partout ».
- **Feuilles** : Pourquoi (questions au carnet), Je prends ou Je retiens (pourquoi, écartés avec raison, à revoir si), Comparer aussi (La tienne, doublon), Ce qui tranche, Raison, Caisse, Nouvelle idée.

## Preuves

- `CLAV=1 CLAIR=1 node r2/rc/capt.mjs "noter+clavier=300,lien+clavier=300,facon+clavier=300,critere-ia+clavier=300"` donne **CLAV OK** ×4, avec `--kb` à 300 et la limite à 544 px :
  - noter : champ 490–528, dernière note 434–482, focus sur le champ, scrollY 0, police chargée ;
  - lien, façon, critère-ia : champ et dernière note sous 544, `elementFromPoint` sur chacun.
- Le hors-champ de `nouveau` est attendu : c'est une feuille de la liste, sans dock. Elle se pose bien au-dessus du clavier (capture).
- Captures : **CAPTURES OK**, aucune erreur de page ni de console.
- Captures ouvertes et comparées à dc côte à côte : `_cote-a-cote.png` (liste et noter) et `_cote-a-cote2.png` (comparer, plus noter et comparer en cave). `_p1.png` et `_p2.png` reprennent les autres états.

Captures (`r2/rc/captures/`) :
- 390 clair : `rc-liste`, `rc-alerte`, `rc-carnet`, `rc-noter-clavier`, `rc-lien`, `rc-lien-clavier`, `rc-facon`, `rc-facon-clavier`, `rc-critere-ia-clavier`, `rc-nouveau-clavier`, `rc-articles`, `rc-comparer`, `rc-pourquoi`, `rc-decider`, `rc-frigo-cmp`, `rc-ventil-cmp` ;
- cave : `rc-noter-clavier-cave-390`, `rc-comparer-cave-390` ;
- paysage : `rc-comparer-844`, `rc-frigo-cmp-844`, et leurs versions cave.

## Boosters UX

- `noter` : champ en bas, au-dessus du clavier. Effet vu : la dernière note et la proposition de l'IA s'affichent au-dessus.
- `ia-propose` : une carte à deux boutons et une puce de caractéristique.
- `apercu` et `veille` : l'aperçu du lien et sa bascule, dans le champ.
- `comparer-paysage` : la matrice des articles côte à côte.

## Écarts voulus

- Corps de 14 px au minimum au lieu des 12 et 13 px de DESIGN.md : c'est CARNET-LIS, sa plainte « difficile à lire ».
- En portrait, Comparer montre moins de rangées par écran que dc, parce que le texte est plus grand et que les noms tiennent sur deux lignes. Le paysage compense.

Prédiction : « Là je peux écrire sans que le clavier cache tout, et je vois les écartés ; c'est dc mais lisible. »
