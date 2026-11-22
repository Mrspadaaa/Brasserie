# Chasse Carnet : le regard du besoin (CRB), 21.11

Sujet : Stocks › Matériel › Carnets, version en ligne `en-ligne/2026-11-21-tour8`. Défaut déjà connu, pas recopié : CRN-PRIX
(DEFAUTS-RECURRENTS l. 475). Cette chasse le découpe pour dire ce que son besoin demande à la place.

Sources : ses 4 captures 390 (01 à 04, ouvertes et regardées), son message du 21.11 (« Plusieurs problèmes dans le carnet, il ya
même pas le prix de la chambre froide ?? »), ses mots du 17.11 (« Non focus sur l'achat de matériel » ; « En gros, un chat, et ça met
en forme, c'est tout et ça permet de comparer les idée »), PORTRAIT v2, et le code au tag (`CarnetOuvert.tsx`, `Comparer.tsx`,
`modele.ts`, lus par grep). Limite : je n'ai pas monté de banc Chrome (le regard porte sur le besoin ; un banc à la fois). Les gestes
sont jugés sur ses captures et sur le code. Ce qui demanderait le doigt est rangé dans les doutes.

## Pourquoi il ouvre ce carnet

Pour **acheter une chambre froide** (garde des fûts et des bouteilles au froid, et peut-être une garde à froid). Il a collé deux
annonces du même vendeur, deux tailles, et il revient au carnet pour savoir **laquelle prendre, et si c'est dans ses moyens**. Le carnet
est un comparateur d'achat (17.11 : « focus sur l'achat de matériel ») nourri par ses notes en vrac.

## La décision qu'il prend

« Je prends la 1800 × 1500 à X CHF, ou la 1500 × 1200 à Y CHF, ou j'attends / je cherche ailleurs. » Elle se joue sur un petit nombre
de chiffres, dans cet ordre :
1. **le prix**, et l'écart de prix entre les deux (« 1,5 m³ de plus pour combien ? ») ;
2. **ce qui y tient**, c'est-à-dire le volume utile (4,06 m³ contre 2,6 m³), dit si possible en fûts ou en cartons ;
3. **est-ce que ça rentre chez lui** : les dimensions extérieures, la hauteur, la largeur de la porte ;
4. **la livraison** : en stock ou délai, depuis où (CH ou UE : port, douane, TVA) ;
5. ensuite seulement, le groupe frigorifique (puissance, plage de température, 230 ou 400 V), l'isolation et la garantie.

## Ce qu'il lui faut au premier plan

- Sur la liste (01) : pour chaque carnet « à comparer », **le prix de** (de … à …) et l'article en tête. Les idées sans article peuvent
  se tasser : une ligne chacune.
- Dans le carnet (02, 03) : pour chaque article, une ligne avec **prix · volume · L × P · dispo**. Le rang ne s'affiche que s'il
  repose sur un critère montré. La comparaison est à un toucher.
- Dans Comparer (04) : deux colonnes visibles en entier à 390. Lignes dans l'ordre de sa décision (prix, volume, dimensions, porte,
  livraison), chaque cellule remplie ou marquée « non lu ». La meilleure valeur est surlignée.

## Ce qui manque, ce qui est en trop

- **Manque** : le prix partout, le volume en colonne (il est enfoui dans le titre), la dispo et la livraison dans Comparer, les
  valeurs de Comparer, et la raison du rang 1. Il manque aussi un « Ce qui compte » proposé alors que deux articles sont déjà là.
- **En trop** : les lignes vides qui parlent de l'IA au futur (« rien encore : l'IA le proposera », « aucune : l'IA les cherche »,
  « Notes · aucune »), qu'il a entourées. Le préfixe « Chambre froide - » répété dans chaque nom d'article sous le titre « Chambre
  froide ». Le gros bouton « Coller un lien » sur chaque idée de la liste. Le champ « Ajouter à Chambre… » et le « + » rond, qui se
  doublent. La colonne de gauche vide dans Comparer.

Sens métier vérifié : 1800 × 1500 mm pour 4,06 m³, c'est un intérieur d'environ 1,64 × 1,34 × 1,85 m sous une isolation de 80 mm.
1500 × 1200 mm pour 2,6 m³ suit la même logique. Les chiffres sont plausibles, aucune absurdité.

## Combien et quels problèmes ? 14 problèmes, dont 6 bloquants

1. **CRB-1, bloquant (valeur absente).** 03, liste des articles du carnet : aucun prix sur les deux chambres froides. Attendu : prix en
   CHF sur chaque ligne, à côté du nom. Constaté : nom, « en stock », « 1800 x ». Le code ne crée la colonne prix que si `prixCentimes`
   est connu (`Comparer.tsx` l. 34). La page a été lue (dispo « en stock » et dimensions extraites), mais le prix n'en a pas été tiré.
   C'est le cœur de CRN-PRIX, et la lecture de page est à corriger, pas seulement l'affichage.
2. **CRB-2, bloquant (valeur absente).** 04, Comparer : pas de ligne prix. Pour un achat, c'est la première ligne attendue.
3. **CRB-3, bloquant (valeurs absentes).** 04, Comparer : les lignes « Dimensions du produit », « Dimensions intérieures (L x P x H) »,
   « Couleur : », « Performance », « Épaisseur du matériel », « Largeur de la porte », « Hauteur de la porte » n'ont aucune valeur
   visible à 390. Soit les colonnes d'articles sont hors écran à droite (leurs en-têtes sont coupés au bord gauche : « :hambre /
   roide - 1500 / ‹ 1200 m… »), soit les valeurs n'ont pas été lues. Dans les deux cas, rien ne se compare.
4. **CRB-4, bloquant (habillage cassé).** 04 : « Épaisseur de l&apos;isolation », une entité HTML brute à l'écran (déjà dans CRN-PRIX,
   rappelée car elle porte sur un critère clé du froid). La même lecture de page donne aussi « Couleur : » avec ses deux-points, un
   libellé recopié sans nettoyage.
5. **CRB-5, bloquant (classement qui sort de nulle part).** 03 : le rang 1, en pastille verte pleine, est donné à la 1800 × 1500 alors
   que « Ce qui compte » dit « rien encore ». Aucun critère montré ne justifie ce classement. PORTRAIT § 4 : « Ce qui sort de nulle part ».
   Attendu : pas de rang tant qu'aucun critère n'est posé, ou le critère qui classe écrit en tête (« volume »).
6. **CRB-6, bloquant (promesse sans effet).** 02 et 03 : deux articles sont là, mais « Ce qui compte · rien encore : l'IA le proposera »
   et « Façons · aucune : l'IA les cherche ». L'IA n'a rien proposé. Pour une chambre froide, les critères sont connus d'avance (prix,
   volume, encombrement, porte, livraison). Attendu : critères proposés dès le 2e article, ou un état d'échec franc avec « Relancer ».
7. **CRB-7, gênant (espace gâché).** 02 : les lignes vides « Ce qui compte », « Façons » et « Notes · aucune » prennent environ 260 px
   sur 390 × 660 utiles, au-dessus des articles. Il les a entourées. Attendu : rien au repos tant qu'elles sont vides (déjà demandé dans
   CRN-PRIX, rappel du besoin : ces 260 px reviennent au prix et au volume).
8. **CRB-8, gênant (pas à sa place).** 03 : le volume (4,06 m³ / 2,6 m³), le chiffre qui dit « laquelle me suffit », est enfoui au
   milieu du titre. La seule colonne de valeur est « Dimensio… », coupée, avec « 1800 x » tronqué. Attendu : colonnes courtes
   « prix · m³ · dispo », et le nom réduit à ce qui distingue (« 1800 × 1500 »).
9. **CRB-9, gênant (texte en trop).** 03 et 04 : « Chambre froide - » est répété dans chaque nom d'article, sous le titre « Chambre
   froide ». Dans Comparer, ça pousse le chiffre qui distingue les deux articles hors de l'en-tête (« Chambre froide - 1500 x 1200 m… »).
10. **CRB-10, gênant (rien pour décider depuis la liste).** 01 : la carte « Chambre froide · 2 articles » ne dit ni prix ni écart. Il doit
    l'ouvrir pour savoir où il en est. Attendu : « 2 articles · 2 400 à 3 100 CHF » (fourchette), ou l'article en tête et son prix.
11. **CRB-11, gênant (espace gâché).** 01 : chaque idée sans article occupe environ 210 px, avec un bouton « Coller un lien » pleine
    taille. À 390, moins de deux idées sur 14 se voient. Attendu : idées en lignes compactes, et le geste « coller un lien » une seule
    fois (le champ du bas le fait déjà).
12. **CRB-12, gênant (doublon).** 01 à 04 : le champ « Une idée, un besoin… / Ajouter à Chambre… » (appareil photo et micro) et le gros
    « + » rond se superposent en bas, deux portes pour le même geste. Le « + » cache en partie la fin des listes.
13. **CRB-13, mineur (manque pour l'achat).** 04 : ni la dispo ni le vendeur ou le pays n'apparaissent comme lignes de Comparer, alors
    que la liste affiche « en stock ». Pour du matériel lourd, la livraison (frais, délai, CH ou UE) pèse sur le choix. Le modèle a déjà
    `dispo`, `vendeur` et `pays` (fixture l. 119 à 124), mais les vrais articles ne les montrent pas dans Comparer.
14. **CRB-14, mineur (ordre des lignes).** 04 : l'ordre est celui de la page du vendeur (dimensions produit, dimensions intérieures,
    exécution, couleur, performance…). La couleur passe avant la porte et l'isolation. Attendu : l'ordre de sa décision (prix, volume,
    dimensions extérieures, porte, livraison, puis le groupe), et la couleur en bas ou retirée.

### Doutes (non comptés)
- D1 : dans 04, les valeurs existent-elles hors écran à droite (défilement horizontal) ? À trancher au doigt à 390, puis à 1280.
- D2 : à 1280, la colonne « Dimensio » de 03 est-elle entière, et le prix apparaît-il si la page le donne ? Non joué ici.
- D3 : « Performance » sans unité : puissance frigorifique (W), ou plage de température ? Il voudra « +2 à +8 °C » et la puissance en W.
- D4 : le ruban de dates « 03.08–08.11 » en tête de Stocks n'a pas de sens dans un carnet d'achat (hors sujet ici, à vérifier ailleurs).

## La phrase qu'il dirait, écran par écran

- **01, liste des carnets** : « Ok la liste, mais j'ai 14 idée et j'en vois une et demie, et sur la chambre froide j'ai même pas une
  idée du prix… »
- **02, carnet annoté** : « Ça sert à rien ça, rien encore, aucune… enlève, je veux voir les prix et les tailles direct »
- **03, carnet** : « il ya même pas le prix de la chambre froide ?? Et pourquoi la 1 elle est première ? Le m³ c'est ça qui compte
  pas Dimensio coupé »
- **04, Comparer** : « Comparer quoi ? Y a que les noms des ligne, pas les valeur, pas le prix, et l&apos; ??? C'est pas utilisable »

LEÇON PROPOSÉE : un comparateur d'achat se juge d'abord à « le prix de chaque article est-il visible sans toucher ? ». Il faut le
contrôler sur une vraie page vendeur lue en ligne, pas seulement sur la fixture, qui a toujours un prix.
