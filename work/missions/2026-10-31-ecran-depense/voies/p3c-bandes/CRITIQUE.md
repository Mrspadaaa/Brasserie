# Critique — p3c-bandes (onze bandes de famille, port de p3c-3)

CRITIQUE OK — fidèle à p3c-3, montrable après 2 retouches de teinte (Consommables = Autres en sombre ; Nettoyage vert houblon en clair) — 6 défauts

Critique Fable, 01.11, calibrée sur le portrait v2. Captures ouvertes en image : `captures/tactile390-repos.png` (côte à côte
avec `v3/p3c-3/p3c-3-repos.png`), `tactile390-long-clair.png` et `tactile390-long-sombre.png` (découpées en deux zones de 880 px
pour lire les bandes à leur taille), `tactile390-materiel-ouvert.png`, `pc1280-repos.png` (moitié gauche agrandie, et côte à côte
avec `p3c-3-1280-repos.png`). Couleurs mesurées au pixel sur les découpes (fond d'en-tête en x = 300, pastille en x = 22, filet en
x = 3), ΔE Lab entre bandes. Ce n'est pas une nouvelle direction : aucune refonte proposée.

## Règle n° 1 : son choix p3c-3

Comparé bande à bande avec `p3c-3-repos.png` et `p3c-3-1280-repos.png` :
- même en-tête de 28 px, collant ; même pastille de compte « ( 2 ) » ; « +1 ↳ » des moutures ; quantité en gras et alignée sur la
  colonne qté × prix (D248 : « mettre plus en avant la quantité, juste mettre en gras, et bien alignées les champs ») ; sous-total à
  droite ; filet de 4 px à gauche de la bande, de la teinte de la famille ; rangées de 29 px (p3c-3 : 29 px) ;
- les quatre teintes qu'il a vues (Malts or, Houblons vert, Levures bleu, Autres gris) sont inchangées ; les sept nouvelles ont la
  même forme, rien d'autre ; aucun élément neuf (pas de légende, pas de filtre, pas de pictogramme de famille) ;
- à 1280, la colonne de gauche (facture, contrôles, champs) et la liste à droite sont celles de p3c-3 ;
- le port reste hors des bandes (« dont port 10,75 », D249) ; « Autres » ne reçoit que l'inclassable.

Fidélité : OK. Il reconnaîtra son écran. Sa phrase prédite : « Ok c'est bien ça, toutes les familles. Mais consommables et autres
c'est la même couleur ?? Et nettoyage en vert comme le houblon ? » (aime, avec un « mais » : pas un rejet, deux retouches avant de
lui montrer.)

## Défauts (capture, endroit, correction)

1. **Consommables et Autres sont identiques en sombre.** `tactile390-long-sombre.png`, bandes 9 et 11 (y ≈ 1875 et 2094 sur
   l'original) : pastille 154 138 126 pour les deux (ΔE 0,0), fond 51 45 41 contre 51 46 41 (ΔE 0,9), filet identique. Cause :
   `POINT_FAMILLE.consommable = bg-marque` et `autres = bg-cave-400`, or `themes.css` l. 133 et l. 91 donnent à `--marque` et
   `--cave-400` la même valeur en thème cave ; de plus le commentaire l. 70 réserve `--marque` à la maquette (« employée par la
   maquette seule, pas par l'app », 2,25:1). En clair, ce sont deux gris (158 et 102) sur deux fonds gris (232 et 216) : il demandera
   « pourquoi deux gris ? ». Correction : Consommables ne prend pas `--marque` ; un jeton qui diffère d'Autres dans les deux thèmes
   (`--attention`, ocre 156 112 32 / 227 181 93, est libre ; sinon un jeton neuf `--famille-consommable` dans `themes.css`, clair et
   sombre). Un gris pour une seule bande : Autres. **Bloquant avant de lui montrer** (SPEC D245 : « quasiment rien ne doit être
   changé » vaut pour une bande par famille ; deux familles sous une même couleur ne sont plus « triées par catégorie », D235).
2. **Nettoyage se confond avec Houblons en clair.** `tactile390-long-clair.png`, bandes 2 (y ≈ 670) et 8 (y ≈ 1741) : fonds
   221 229 217 et 216 223 208 (ΔE 2,7, indiscernables), pastilles 86 127 69 et 76 107 42 (ΔE 9,5). En sombre, l'écart tient
   (ΔE 18,5 ; la pastille Nettoyage 163 201 122 est plus claire). En brasseur : le vert est le jeton `--hop`, « Houblons » ; un
   produit de nettoyage dans la couleur du houblon le fera tiquer (« Les icône sont pas parlant » vaut pour une couleur qui ment).
   Correction : Nettoyage quitte le vert ; les jetons de l'app n'ont ni sarcelle ni cyan : un jeton neuf `--famille-nettoyage`
   (par ex. 0 128 128 clair / 94 190 190 sombre) dans `themes.css`, ou `--water` (acier) si Matériel de brassage prend autre chose.
   **Bloquant avant de lui montrer** (même règle que 1).
3. **Pastille et filet d'Emballage presque invisibles en sombre.** `tactile390-long-sombre.png`, bande 7 (y ≈ 1608) : pastille et
   filet 107 58 30 sur fond 48 30 19, 1,7:1 ; Services (160 82 45 sur 54 33 21) fait 2,7:1. Les aplats EBC « ne changent pas »
   (`themes.css` l. 45) : la bande hérite d'un brun fait pour le clair. Correction : en thème cave, pastille et filet d'Emballage
   et de Services prennent la valeur `-texte` du thème (`--ebc-copper-texte` 181 120 91 existe ; un `--ebc-brown-texte` sombre
   à ajouter), le fond gardant sa teinte. À corriger avant de lui montrer en sombre ; non bloquant si on le montre en clair.
4. **Paires proches, lisibles par la pastille et jamais voisines** (à signaler, pas à corriger seul) : Malts ~ Sucres (pastilles
   ΔE 19,3 ; fonds clairs 248 234 209 et 242 223 204, ΔE 4,8), Emballage ~ Services (pastilles ΔE 19,5 ; fonds sombres ΔE 2,6),
   Levures ~ Matériel de brassage (fonds clairs ΔE 3,3 ; sombres ΔE 2,4 ; pastilles 23,6 / 19,9). Avec onze familles sur les jetons
   actuels, le chaud (or, ambre, brun, cuivre) et le bleu (finances, eau) sont serrés. Si 1 et 2 ajoutent deux jetons, cela suffit :
   dans l'ordre des bandes, aucune paire proche n'est voisine. Pas de changement de palette au-delà.
5. **Le contrôle « 11 pastilles distinctes » n'a rien mesuré.** `rapport.txt` l. 12 et 39 : « onze pastilles de couleur distinctes
   (11) » alors que deux sont identiques en sombre : le script compte des classes, pas la couleur rendue par thème. Correction dans
   `capturer-familles.mjs` : lire `getComputedStyle` de la pastille et du fond d'en-tête de chaque bande, dans les deux thèmes, et
   échouer sous ΔE 15 (pastille) ou ΔE 3 (fond) entre deux bandes, et sous 3:1 entre pastille et fond. Ce contrôle doit échouer sur la
   version actuelle avant la correction (L13).
6. **Hors voie, mais sur la capture qu'il verra** : `tactile390-repos.png`, récap, « Somme = imprimé359,40 » : le libellé et le
   montant se touchent dès trois chiffres (le RESULTAT le signale, `Recap.tsx` / `ExpenseSheet.tsx` l. 688) ; sous « Lectures 2/2 »,
   « 2 proposées par la lecture, à vérifier » passe sur deux lignes et serre le bloc. À corriger par la voie du récap avant toute
   capture montrée (D150 : « comment ça peut passer ça ??? » sur un chevauchement qu'il voit en premier).

## Ce qui tient

- Trois secondes : onze bandes, chacune nommée, comptée, sommée en quantité et en francs ; l'ordre Malts → Houblons → Levures →
  Sucres → Additifs → Matériel → Emballage → Nettoyage → Consommables → Services → Autres est celui du brassage puis de l'atelier.
- Densité : rangées de 29 px comme p3c-3 ; rien d'ajouté au premier plan. La liste paraît longue sur la fixture parce que 14 lignes
  sur 17 sont « sans stock » et portent un « Créer « … » » sous elles (choix de p3c-port, pas de cette voie) ; sur sa facture réelle,
  les lignes reliées tiennent sur une rangée.
- Matériel ouvert (`tactile390-materiel-ouvert.png`) : le plateau « Fiche matériel » s'ouvre sous la rangée, la bande reste
  collée en haut, les bandes suivantes gardent leur forme.
- 1280 : les bandes à droite, la facture à gauche, comme `p3c-3-1280-repos.png`.
- Pas de goût prêté sans citation : les rapprochements de teinte sont mesurés (ΔE), pas ressentis.

## Décision ouverte du RESULTAT

L'article rattaché avant la catégorie lue (contre le VOIE.md) : ne change rien à ce qu'il voit ; raison recevable (la catégorie lue
est périmée dès qu'il relie la ligne ailleurs). Je laisse l'ordre de l'auteur ; au pilote de l'écrire dans le VOIE.md.

LEÇON PROPOSÉE : un contrôle « N couleurs distinctes » mesure la couleur rendue (`getComputedStyle`) dans chaque thème, jamais le
nom de la classe ou du jeton : le 01.11, « onze pastilles distinctes (11) » a passé deux bandes identiques en sombre (`--marque`
= `--cave-400` en thème cave). Rôles : auteur, exécutant, relecteur. Contrôle : `capturer-familles.mjs` corrigé (défaut 5).
