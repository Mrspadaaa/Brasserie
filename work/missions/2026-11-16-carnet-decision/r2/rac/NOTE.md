OK — rac : da retouché, journal de dc, champ unique au-dessus du clavier, Comparer paysage

# rac — da retouché, avec le journal de décision de dc

Chaleur : froide. Base : `da/proto.src.html` tel quel (règle n° 1 : il préfère da et dc à p5). Retouches seulement ;
rien de ce que da montrait n'est retiré (CARNET-MAIGRE, inventaire plus bas). Fixture commune non modifiée.

Fichiers (tous dans `r2/rac/`) : `proto.src.html` → `proto.html` (`node r2/rac/build.mjs`), `capt.mjs` (copie
adaptée de `calendrier/p8/capt.mjs`, mesure CARNET-CLAV), `verif.mjs` (geste clavier, témoin, inventaire),
`planche.mjs` (da | rac côte à côte), `captures/`.

## Ce qui a changé, ligne par ligne

1. **Champ de note unique, en bas, au-dessus du clavier** (« le champs text en bas ? SI non sur mobile le clavier cache
   tout »). Le champ de da (« Écrire, ou coller un lien… », photo, voix, envoi) quitte le milieu du carnet et se fixe
   au-dessus de la barre du bas. Il en va de même pour « Une idée, un besoin… » (liste) et « Demander » (Pourquoi).
   Clavier ouvert, la barre du bas et le + s'effacent, le champ monte au ras du clavier (`visualViewport`, et
   `interactive-widget=resizes-content` pour Android). Le champ garde le focus après Entrée : on enchaîne les notes.
2. **La dernière note reste visible au-dessus du clavier.** Clavier ouvert, au-dessus du champ : « Dernière note ·
   aujourd'hui », la note, ce que l'IA en a tiré (« rangé : peut trancher entre Gravité et Isobarique »), puis sa
   proposition en attente (« En faire le critère qui oriente ? Relié à « Oxygène capté » », Oui, critère / Juste une
   note). C'est le geste de da (un seul champ, l'IA propose le critère), lisible pendant la frappe.
3. **Pourquoi ? : le journal de dc à la place de la frise de da.** En tête, la décision : « Ton choix · produit et
   fournisseur · n° 2 du 14 novembre », le nom, puis fournisseur · pays · prix, le pourquoi en citation, les
   « Écartés · 3 » avec leur raison et « à revoir si… ». Dessous : le critère qui oriente, les trois questions de da
   et sa réponse, puis le journal daté et numéroté. Une décision remplacée reste lisible, barrée, avec « remplacée le …
   par la n° … ».
4. **Le bandeau du carnet** reçoit la ligne de dc « 3 écartés › Isobarique 2 becs · Monobloc 6 becs · … ». Les cartes
   de décision du fil restent celles de da (avec leur pourquoi), numérotées « Décision n° 2 », écartés en une ligne ;
   une décision remplacée y est barrée.
5. **Comparer : les écartés visibles, en gris** (« écartés visibles »). Ils restent à leur rang, en gris, avec
   « · écarté ». Le choisi porte « · choisi » en vert, au lieu de la coche ✓ (« ✓ choix … pas fan »). Une légende sur
   une ligne : meilleur · choisi : <nom> · gris : écartés (n), gardés visibles · ? : inconnu.
6. **Comparer en paysage (844 × 390) : les articles côte à côte.** Une colonne par article, choisi d'abord, écartés
   ensuite en gris, sans aperçu en dernier. Une ligne par caractéristique, le critère en tête et en brun. Pour chaque
   valeur, le chiffre en Plex Mono et une barre (longue = meilleur). Toucher un article ouvre sa fiche. Embouteillage
   (6), ventilation (5) et frigo (4) tiennent sans défilement horizontal. Les caractéristiques (× pour retirer) et
   l'avertissement de dominance suivent sous le tableau.
7. **Baisse de prix en mots** (« ↓ 600 CHF pas fan ») : « baisse de 600 CHF » sur la carte du fil et sur l'alerte
   de la liste, au lieu de « −600 ». La fiche garde « −600 CHF depuis le 10 nov. » et sa courbe.
8. **Lisibilité, par la typographie, l'espacement et le contraste** (de f9/p5, sans sa structure) :
   - polices chargées : Source Sans 3 et IBM Plex Mono ;
   - corps de 16 px, notes à 16,5 px, sous-textes à 13,5–14,5 px ;
   - libellés sans capitales espacées (« Façons », « Choisi le 14 novembre », au lieu de « FAÇONS », « CHOISI · 14 NOV. ») ;
   - gris de texte de #666 à #575757 en clair, #b4a598 en cave ;
   - marge du fil élargie, date en deux étages (« 14 » en gros, « nov. » dessous), « auj. » en couleur production ;
   - lignes de Comparer à 44 px, noms sur deux lignes au lieu d'être coupés, valeurs en mono.
9. **Noms non abrégés** (f9/p5) : « Isobarique 4 becs semi-auto », « Pré-évacuation 4 becs · Allemagne / · Suisse »,
   « Chambre froide 2 m³ », « Vitrine d'occasion », « Extracteur hélicoïde ». Ils remplacent « Iso 4 pré-év. DE » et
   les autres abréviations.
10. **Dates lisibles** : « 14 novembre », « 1er octobre » dans le bandeau, le journal et ses en-têtes.

## Ce qui est resté (tel que da)

La coque (Finances › Matériel, À venir · Carnets · Réalisés, barre du bas, + volant b1r et son menu) est restée.
Le reste de da aussi :
- la liste triée par alerte puis récence, avec le statut à points, le choix et son pourquoi, les vignettes, l'œil de veille ;
- le titre, le bandeau choix ou prochaine étape, le critère ;
- les quatre pastilles (Façons, Articles, Comparer, Décisions) et les essais « à jouer » ;
- le fil daté en marge : notes et « rangé : … », cartes d'IA, veille, liens lus avec aperçu, lien sans aperçu
  (Compléter, Redonner à l'IA), photo, voix, chargement ;
- Comparer en portrait : un tableau par caractéristique, critère en tête, barre d'atout, « ? » en fin, « Chercher les
  « ? » », Ajouter ou Proposer une caractéristique, avertissement de dominance honnête ;
- les feuilles Article (veille, courbe, disponibilité, Choisir celui-ci), Façons (Retenir, Écarter), Choisir (pourquoi
  proposé, écartés, à revoir si) et Articles ;
- tous les états `?etat=`, plus un neuf : `noter`, avec `&clavier=300`.

## Sorties décisives

- CARNET-CLAV, captures (`capt.mjs "noter&clavier=300,repos&clavier=300"`, clair et cave). Champ à 489–529 px et
  dernière note à 294–322 px, sous la limite de 544 px (844 − 300) : **CLAV OK** ×4.
- CARNET-CLAV au doigt (`verif.mjs`). Clavier simulé, on tape « deux becs suffisent pour 300 L » puis Entrée. La note
  neuve est à 323–351 px, le champ finit à 529 px et garde le focus : **CLAV GESTE OK**.
- Témoin sur da, même mesure : champ à 413 px, dernière note à 883 px, sous le clavier : **TEMOIN ECHOUE (attendu)**.
- CARNET-MAIGRE (`verif.mjs`) : actionneurs (`data-act`), formulaires et champs de da comptés contre rac sur 15 états.
  **MAIGRE OK**, aucun perdu. Un premier passage avait trouvé le champ de note absent sous les feuilles Article et
  Choisir ; il a été remis.
- Aucune erreur de page ; `CAPTURES OK` à chaque passe.

## Captures (ouvertes, comparées à da)

- 390 clair : `captures/rac-repos-390.png` (liste), `rac-carnet-390.png`, `rac-noter-clavier-300-390.png`,
  `rac-noter-apres-entree-390.png`, `rac-repos-clavier-300-390.png`, `rac-lien-390.png`, `rac-comparer-390.png`,
  `rac-decisions-390.png` (pourquoi), `rac-remplacee-390.png`, `rac-article-390.png`, `rac-choisir-390.png`.
- Cave : `rac-noter-clavier-300-cave-390.png`, `rac-carnet-cave-390.png`.
- 844 × 390 : `rac-comparer-844.png`, `rac-carac-844.png` (5 articles), `rac-frigo-844.png`.
- da | rac : `captures/planche-1.png` à `planche-4.png` (liste, carnet, noter, lien, comparer, pourquoi, remplacée).

## Boosters UX (boosters-ux)

- `champ-unique` : besoin déclencher et noter ; un champ, la note et la proposition de l'IA au-dessus du clavier ;
  effet vu avant et après Entrée.
- `matrice` : besoin comparer ; tableau en paysage, barre et chiffre par article.
- `demander` : besoin lire ; la réponse apparaît sous les questions.
- B3 : écart voulu. Le premier plan garde tout ce que da montrait (CARNET-MAIGRE prime sur le plafond de mots).
- B10 : aucun `type="number"`, le bouton d'envoi reste au-dessus du clavier, mesuré.
- B13 : les lignes de Comparer passent de 34 à 44 px. Les autres cibles sont celles de da.

## Restes et risques

- En paysage, la barre du bas (56 px) et l'en-tête laissent environ 3 lignes de tableau visibles avant défilement. Je
  n'ai rien retiré pour gagner de la place.
- Le + volant couvre encore le coin bas droit du fil et de la dernière colonne en paysage, comme dans da.
- Clavier réel : la mesure `visualViewport` est codée mais seulement simulée ici (300 px). À jouer sur un téléphone.

Prédiction : « Là je lis, et le champ reste au-dessus du clavier. » Le paysage devrait plaire, avec les écartés gris.
DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un champ fixé en bas ne suffit pas pour CARNET-CLAV : la dernière note doit être recopiée au-dessus du
champ quand le clavier est ouvert, le fil étant derrière.
LEÇON PROPOSÉE : aucune.
