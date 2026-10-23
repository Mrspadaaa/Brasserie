OK — r6n1 passe 2 : cinq défauts du critique corrigés, picto épicé à jour, 78 mots

## Ce qui a changé (avant → après)
1. Jauge d'amertume : « IBU ? ▨ 10′ ≈37 » (un 10′ sorti de nulle part) → « Nugget 60′ 46 g +? à cru », l'amertume de
   sa stout lue dans la recette. L'IBU à 10′ est seulement sous Preuve, nommé « IBU, si tu le passais à 10′ ».
2. Radar : neuf chevrons roses → un trait coupé « // » au bout des axes qui dépassent. La flèche est réservée à sa
   demande : verte vers l'extérieur (Floral, comme h4), orangée vers le centre (Résineux). Les « ? » écrits sont
   partis, les secteurs inconnus restent hachurés.
3. Tire 20 : vingt points de 6 px posés sur la barre → des points de 4 px sous la barre, avec « n sur 20 » (en
   orangé si des bières sortent de la 16D).
4. Pont Levure : deux barres jaunes muettes → « Pomona », picto agrumes, « ~+1,3 » (Idaho 7, dry hop actif). Le
   chiffre est recalculé à chaque colonne ; Galaxy affiche « ≈0 ».
5. Signes sans mot :
   - fiole et « = » de tête de rangée → le nom du composé (humulène, 4MMP, caryophyllène) et « égaler » ;
   - la colonne « Ta stout » de r6a revient : trop, plus, et le « + » ; la dégustation quitte la ligne de contexte ;
   - « en stock » et « à acheter » (le chariot) sont dans la légende.
- Aussi :
  - le picto « épicé » de la planche standard (cannelle et clou croisés) ;
  - le halo du « ? » de légende, rattaché à son bouton ;
  - la vue à quatre colonnes : noms sur deux lignes, plus de chevauchement ;
  - une collision de classe (`r6n1-ta` pour la ligne α et pour « Ta stout »), renommée `r6n1-st`.
- Reprise : m4-radar-degustation passe de « en contexte » à « repris » (colonne Ta stout). NOTE : section
  `## Passe 2`, Reprise et règle D103 à jour.

Fichiers : `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/{generer.mjs,etat.html,NOTE.md,captures.mjs}`,
`captures/r6n1-*.png`. Le générateur de la passe 1 est sauvé dans `os.tmpdir()/r6n1-generer-passe1.mjs`.

## Sorties décisives
- G1 `COMMUN OK`
- G2 `r6n1 78 mots` puis `MOTS OK`
- G3 `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4 `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`
- G5 `ALPHA OK`
- G6 `REPRISE OK (28 repris, 1 en contexte, 8 en pont, 0 écartés)`
- G7 `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G8 `EXISTENT OK 7`
- G9 `NOTE OK`
- `captures.mjs` : `CAPTURES r6n1 OK`, sans erreur de console.

## Captures ouvertes (`work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/`)
r6n1-premier-ecran.png, r6n1-toucher-390.png (Défi et Tire 20 : « 8 sur 20 » sous les barres), r6n1-fiche-390.png
(fiche de Cascade, nouveau picto épicé), r6n1-nelson-390.png (quatre colonnes), r6n1-legende-390.png (halo sur le « ? »)
et r6n1-preuve-390.png (« IBU, si tu le passais à 10′ »).

## Prédiction
« Là c'est r6a avec tout ce que j'avais noté, ça répond tout de suite, et je sais d'où vient mon amertume ; c'est
dense mais rangé. Par contre la visée d'un cran, c'est toi qui l'as décidée ? »

DÉCISION À PRENDRE (reprises de la passe 1) :
- la visée « un cran du style » est une règle de la variante, à faire valider par le brasseur ;
- l'IBU total de la stout manque dans les données du lot ;
- la couleur de Nelson Sauvin n'est fixée nulle part.

CONNAISSANCE :
- Le premier écran de r6n1 est à 78 mots sur 80 : toute retouche qui ajoute un mot doit en retirer un.
- Le pied de page compte s'il effleure le pixel 844 (12 mots), d'où sa marge.

LEÇON PROPOSÉE : une variante doit vérifier qu'aucune de ses classes ne sert à deux rôles. La passe 1 avait vu
`r6n1-vb` effacer les barres de Preuve. La passe 2 a recréé le défaut : `r6n1-ta` (colonne « Ta stout ») a déformé la
ligne α. Seule la capture l'a montré, et aucun contrôle n'a bougé. Faire :
- après chaque génération, lister les sélecteurs racines définis deux fois dans le CSS de la page ;
- lister aussi les classes posées sur deux éléments de rôle différent ;
- donner au nouveau composant un nom qui n'est préfixe d'aucun autre.

Rôles : concepteur, auteur. Contrôle : à écrire (doublon de sélecteur racine dans le CSS généré).
