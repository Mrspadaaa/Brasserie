# M4 b · « Mes notes » en vraie note (25.11 soir)

Demande : M4B.md. Ses mots : « Mais vraiment en mode note de ce type. C'est un exemple pas une direction à reproduire ! »
Règle retenue (L01) : Mes notes est une note de téléphone. On ouvre, on tape, c'est tout. ref/note-telephone.jpg a servi
d'exemple du genre, pas de gabarit : on garde la barre fine, le titre, la méta, le texte nu et les outils au-dessus du clavier.
Base : maquettes/m4-deux-vues.html (correction 3), non modifiée. Livrable : maquettes/m4b-note.html.

## Ce qui a changé
- **Thème sombre partout** (19 états), comme sa capture. Le plein reste l'encre (clair sur noir), un au plus par écran.
  Mesuré : 0 ou 1 plein par état, 3 tailles (14, 16 et 20), 0 cible sous 44 px.
- **Mes notes = un seul document libre.** Titre, puis une méta discrète (« mar. 24 nov. 21:26 | Noté | Local »), puis ses
  6 lignes réelles telles quelles. Plus de numéro, de filet, de carte, de pastille, d'heure par ligne ni de bouton par note.
  Barre du haut comme une note : retour, bascule, annuler, refaire, fini.
- **Zéro geste pour écrire** : à l'ouverture, le curseur est dans le texte et le clavier est ouvert (`avant`). Le champ
  « Noter… » et la touche « Ajouter » ont disparu : le document est le champ.
- **Outils au-dessus du clavier** : IA, voix, photo, lien, case. L'outil lien devient « Coller entreprise-x.ch » quand le
  presse-papiers a un lien (`lien`). Une fois collé, le lien est un mot souligné bleu dans le texte. La photo entre dans le
  texte, à la place du curseur (`photo`). L'outil IA offre deux gestes : « Ranger dans Organisé » (« lit ta note, ne la
  change pas ») et « Demander à l'IA » (`ia-menu`).
- **L'IA lit** : l'attente vit dans l'outil IA, avec « Arrêter » ; le texte reste à lui (`ia-lit`).
- **Lectures de l'IA = souligné fin violet**, rien d'autre (`lecture`). Un toucher sur un souligné ouvre une bulle :
  « lu : à vérifier · Organisé ↩ ». La méta dit « lu par l'IA à 21:27 ». Un point violet sur « Organisé » signale du neuf.
- **Organisé sans numéros** : chaque bloc cite ses mots et porte ↩. Le bloc entier se touche (cible ≥ 44) et ouvre Mes notes
  sur SA ligne, surlignée, avec « Revenir à « Sous la dalle » » (`ligne`). Organisé n'a pas de champ : son pied propose
  « Écrire dans Mes notes ».
- **Hors ligne, dans Mes notes** (`hors-ligne`). La méta dit « hors ligne, gardé ici ». La ligne écrite sans réseau n'est pas
  soulignée, puisque personne ne l'a lue. L'outil IA affiche « Lecture : attend le réseau » et « Annuler l'envoi ».
- **Mémo** dans les deux vues (`memo-notes`, `memo-org`) : une note courte, avec sa photo dans le texte.
- **Imaginé** : tout ce qui n'est pas dans `tests/fixtures/c79` (photo, lien, lignes de décision, de tâche et de fin, mémo)
  porte la marque grise en pointillé. Dans le texte, ces lignes sont en italique gris.

## Corrections reçues de l'itération 4, appliquées
- Critique 4, m1 : la marque « imaginée » est posée sur « samedi » (`decide`, `tache`), sur « Joint changé. »
  (`tache`, `resoudre`) et sur « Plus de flaque » (`relire`).
- Persona ux 4, m1 : le pointillé a deux sens seulement. Violet = proposé, donc « Résolu ? » passe en violet comme
  « Je cherche ? ». Gris = imaginé. « Si ça revient » et « l'IA te le proposera » n'ont plus de pointillé.
- Persona ux 4, m3 : le contour n'a qu'une couleur, l'encre. « Oui » et « L'écrire » ne sont plus violets.
- Persona ux 4, m4 : la tâche et sa date sont deux propositions, avec deux gestes (« Garder la tâche », « Mettre la date »).
- Persona ux 4, D : la bascule mesure 44 px.
- Persona ia 4, m1 : la feuille « Changé par l'IA » liste aussi les 5 lectures (les soulignés). Chacune a son interrupteur et
  son ↩. Couper une lecture retire son souligné ; le texte ne bouge jamais. On peut par exemple retirer « coût estimé du
  joint ». Le bouton dit « Garder 6 sur 7 ».
- Les doutes levés :
  - « Ne plus attendre le devis ? » sans « de l'entreprise X » ;
  - « Pourquoi tu as pris ça » cite d'abord sa vraie raison (« joint du siphon trouvé usé », 24 nov.), puis la ligne imaginée.

Gardé de M4 : la frise et les cases de proposition ; « 2 à garder » et « Tout garder » ; les pistes trouvé / à vérifier ; le
conseil cité ; « l'IA, pas tes notes » ; les options en réserve avec « Retenir » ; le chemin daté réel, puis imaginé ; la
relecture ; l'erreur limitée à la lecture locale (« pas trouvé », « 150 CHF ») avec « Réessayer » seul plein.

## Captures (390 × 844, ×2, sombre, toutes ouvertes)
cap/m4b-avant.png (Mes notes à l'ouverture, clavier ouvert), m4b-lien.png, m4b-photo.png, m4b-ia-menu.png, m4b-ia-lit.png,
m4b-lecture.png (clavier fermé, soulignés, bulle), m4b-apres.png (Organisé), m4b-ligne.png (bloc → sa ligne surlignée),
m4b-options.png, m4b-decide.png, m4b-tache.png, m4b-hors-ligne.png, m4b-resoudre.png, m4b-resolu.png, m4b-relire.png,
m4b-erreur.png, m4b-memo-notes.png, m4b-memo-org.png, m4b-annuler.png (feuille Changé par l'IA).

## Jugement à côté de ref/note-telephone.jpg
`avant` se lit comme sa capture : fond noir, titre, méta grise à séparateurs, lignes nues bien aérées, rangée d'outils, puis
le clavier sombre. Ce qui reste propre au carnet : la bascule en haut, l'outil IA violet et les soulignés. Doutes :
- Organisé reste dense à côté de la note : c'est la vue de l'IA voulue par M4 ;
- la bulle d'un souligné couvre deux lignes, comme toute bulle de téléphone ;
- les marques « imaginé » dans le texte sont des annotations de maquette, pas du produit.
