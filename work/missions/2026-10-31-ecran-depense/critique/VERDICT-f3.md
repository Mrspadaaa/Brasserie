À REPRENDRE — 3 défauts (1 bloquant, 2 majeurs) et 5 détails

Critique Fable (portrait v2), 01.11 nuit. Les 24 captures de `captures/` ouvertes et regardées (390 d'abord, clair et cave, puis 1280),
côte à côte avec `v3/p3c-3/p3c-3-repos.png`, `p3c-3-geste-plateau.png`, `p3c-3-papier.png` ; les rangées, le récap, le plateau et la
ligne ajoutée agrandis ×3. L'écran refusé (`e-emulateur/final8/D/390-01-doc14-repos.png`, `390-02-doc14-lignes.png`) relu pour mesurer le chemin.

## Ce qui est tenu (ses six plaintes, une par une)

| Sa plainte (01.11) | Au repos, 390 | Verdict |
|---|---|---|
| « Ni la vue de base » | Rangée = picto · nom · α · ↳ montant · **q** u × p · montant, bandes teintées par famille avec compte, quantité et montant : la rangée de p3c-3 trait pour trait. Quantité en gras, colonnes alignées (D248). | tenu |
| « C'est pas du tout compacte » | 9 lignes, le récap, la TVA et le règlement dans un seul écran à 390 ; avant, 3 lignes de malt remplissaient l'écran. Rangées de 39 px (seuil 52). | tenu |
| « le concassage n'est pas un produit mais un état du malt » | Pastille « ↳ 0,20 » sur la rangée du malt, trait plein ; au plateau « concassé, +0,10 par Kg, compris » ; au récap « ↳ 3 moutures +0,71 ». Aucune ligne « Schrotung ». | tenu |
| « ça créé de base automatiquement un nouveau produit » | 0 bouton « Créer » ; picto cube « + » vert sur chaque ingrédient sans article, « 6 nouveaux » au récap ; au plateau « article « Carafa Spezial I » · nouvel article ⇄ ». | tenu |
| « Pas besoin d'afficher autant » | Au repos, oui : la rangée des points « ① Date ② Lignes ④ Désaccord » a disparu, « 0 unité ? (3) » aussi. **Pas au plateau** (défaut 1). | à moitié |
| « 3 cas de figure » | Rien quand c'est sûr (« 2 Kg », « 2 sachets ») ; jaune pointillé quand repris (« 85 g », « 1 Stk », « dont port 12,00 », « 3 à contrôler ») ; rouge en tirets quand inconnu (« date ? » dans le bandeau, « Ligne sans libellé ? — — », « 1 à remplir »). Lisible en trois secondes, sans cockpit : une couleur d'alerte, une d'attention, pas de légende. La pastille « ① Date » du pied n'apparaît que quand le bandeau est sorti de l'écran (IntersectionObserver, `Pied.tsx`) : juste. | tenu |

Trois secondes au repos : fournisseur, total, « date ? » rouge, neuf lignes rangées par famille, ce qui est deviné en jaune. Il comprend sans lire.
Il y a une idée à garder, donc le verdict n'est pas un rejet (portrait, erreur 1). Ce qui suit est ce qu'il dira après.

## Défauts

### Bloquant

**1. Le plateau ouvert n'est pas celui de sa vue de base** — `tactile390-clair-malt-concasse.png` (gauche, de « imprimé » à « Unité lue / reçue »),
même chose dans `houblon-jaune`, `materiel`, `ligne-ajoutee`, clair et cave, 390 et 1280 ; à comparer à `p3c-3-geste-plateau.png` (droite, sous « Maris Otter »).
- Sa base : 5 lignes sous la rangée — « imprimé « Maris Otter, Kg » · MA0221 · TVA R » ; `[6] Kg × [2,30] = [13,80]` en champs ; « ✓ au centime » ;
  Ingrédient / Service / Matériel ; « article Maris Otter · relié ⇄ Retirer » ; la mouture.
- L'écran : les 3 premières lignes sont portées (imprimé, « concassé… », « article … · nouvel article ⇄ ») puis **tout l'ancien formulaire** suit :
  « Libellé de la facture » + corbeille, « Type d'achat » (liste), « TTC (CHF) », « 2 × 2,4 = montant ✓ », « Voir l'extrait du document »,
  « Réception en stock », « Mettre en stock : oui », « Créer un nouvel article » (liste), « Nom de l'article », « fiche Carafa Special I · approchée
  (pas exactement la bonne) », « Quantité reçue », « Unité lue / reçue ». 14 blocs pour 5, et des doublons : « nouvel article » dit deux fois,
  « fiche Carafa Special I · approchée » deux fois, le nom de l'article trois fois. Le plateau ouvert couvre 65 % de l'écran à 390.
- Règle : n° 1, ses choix (D105 : un écart à sa maquette qu'il ne reconnaîtrait pas) — le plateau est l'un des trois états de sa base cités par le pilote ;
  M16 (L03) : une reprise se contrôle geste par geste, « pendant » compris ; ses mots « Pas besoin d'afficher autant » et « Ni la vue de base » (SPEC 01.11).
- RESULTAT.md le dit (« hors des huit zones ») ; mais c'est l'état qu'il touche en premier après le repos (portrait, critère 5), et il y retrouvera deux
  de ses six plaintes. Ne pas lui montrer avant.
- Correction : porter le plateau de p3c-3 tel quel. Sous l'imprimé et l'état : `[q] u × [p] = [m]` en champs sur une ligne, « ✓ au centime » (ou le niveau
  jaune/rouge de la valeur fausse), Ingrédient / Service / Matériel en segments, « article « X » · nouvel article ⇄ » (ou « relié ⇄ Retirer »), la ligne
  d'état du malt. Rien d'autre au premier plan : « Voir l'extrait du document », la corbeille et « Mettre en stock » derrière un seul « plus ». Supprimer
  les doublons (le nom de l'article ne se saisit qu'une fois, dans la ligne « article », après ⇄). Hors matériel : « Fiche matériel » reste sa seule liste.

### Majeurs

**2. Les noms restent en allemand** — `tactile390-clair-repos.png` : « Wiener Malz », « Melanoidin Malz », « Gärfass 30 Liter mit Deckel »,
« Hopfensack fein », « Kronkorken 100 Kapseln schwarz » ; bande « Matériel de brassage » en français au-dessus de deux noms allemands.
- Son premier mot le 01.11 : « déjà pas de traduction ». D271 (quatre langues lues en français).
- Hors de f3 (zone 8 : `nameFr` facultatif, la lecture est à f5) : ce n'est pas un défaut de cette voie, mais il le redira « !!! » si l'écran lui est montré
  avant f5. Montrer f3 avec f5, ou sur une commande dont la lecture porte déjà `nameFr`.

**3. Aucune capture sur sa commande ni sur un article relié** — toutes les captures sont sur « BOUTIQUE FICTIVE », 9 lignes, 0 relié (« 6 nouveaux ·
3 hors stock »). Le bout en bout doc14 n'est pas joué (« non lancé, à ta demande »).
- Jamais vus : le picto « relié » à côté du picto « nouvel article » ; une barre jaune à geste (« Garder le nouvel article « X » » · ⇄, le « bis ») ;
  une rangée rouge d'unité non déductible (« g kg Stk »). Trois des états de la rangée que la base montre (Target bis, Sabro « unité ? »), et l'état
  « relié » qui répond à sa plainte « ça arrive pas à lié à un stock », n'ont pas de capture. L12 : un effet doit se voir.
- Correction (mécanique, pour l'exécutant du pilote) : jouer le bout en bout doc14 (commande VOIE.md § Critères) et capturer à 390 le repos avec au moins
  un relié, un bis et un rouge d'unité, avant toute page partagée. Je juge ces captures ensuite.

### Détails

**4. « Somme = imprimé » sur deux lignes** — `tactile390-clair-repos.png`, récap (zoom) : « Somme = / imprimé  92,46 » alors que « Qté × prix 9/9 lues »
tient sur une ligne ; la base a « ✓ Somme = imprimé 86,50 » sur une ligne. D248 « bien alignées les champs ». Correction : libellé sans retour (colonne
plus large, ou « Somme » seul avec « = imprimé » en coche).

**5. « Qté × prix 9/9 lues » précédé d'un « · » et non d'un « ✓ »** — même zone : le « ✓ » de la base devient un point gris, et « lues » ne dit pas que
q × p = montant partout. Correction : « ✓ Qté × prix 9/9 » comme la base.

**6. « Payé le … »** — `tactile390-clair-repos.png`, carte Règlement : une phrase coupée (« Payé le » puis « … ») alors que la date manque ; la base dit
« Payé même jour (supposée) ». D277 : le niveau se porte sur la valeur. Correction : « Payé · date ? » avec le rouge de la date, ou « Payé » seul tant que la
date n'est pas remplie. (RESULTAT le dit hors périmètre ; une ligne.)

**7. « Ordre du papier 9 · 80,46 » sous un total de 92,46** — `tactile390-clair-papier.png` : la somme des lignes sans le port, sans le dire ; la base avait
23 lignes · 86,50 = total. Il demandera « pourquoi 80,46 ? ». Correction : « 80,46 + port 12,00 » dans l'en-tête de l'ordre du papier, ou « dont port » répété.

**8. Le jaune « à contrôler » n'a pas de geste au plateau** — `tactile390-clair-houblon-jaune.png` : « unité g déduite · 85 × 0,05 = 4,25 : des grammes · à
contrôler » est honnête et dans ses mots, mais pour confirmer ou corriger il faut descendre au champ « Unité lue / reçue » du formulaire. La base pose
« g kg Stk » sous la rangée douteuse. Correction : les trois segments g / kg / Stk à la suite de la ligne « unité g déduite », g pré-choisi ; un toucher
lève le jaune. (Ne contredit pas la règle « barre seulement pour un rouge » : c'est au plateau, pas sous la rangée fermée.)

## Ce que je prête au brasseur sans pouvoir le citer (signalé, pas rejeté)
- Le picto « nouvel article » (cube + petit « + » vert) est discret à 390 ; lisible agrandi, et c'est le cube de sa base. Pas de rejet « icônes muettes ».
- « Rattacher les 5 » et « +5 ↳ » de l'en-tête Malts de la base n'ont plus de sens quand le concassage est un état : écart justifié, non dit dans
  RESULTAT (« ce qui reste écarté de la base ») — à dire.
- Le « + » jaune de « 0,00 + ? » dans l'en-tête « Autres » à côté d'un « ? » rouge : deux niveaux pour la même ligne vide. Rouge partout serait plus net.

## Phrase prédite
« Là c'est compact et c'est la vue de base, le ↳ sur le concassé c'est bien et plus de Créer partout. Par contre quand j'ouvre une ligne il y a encore
tout le formulaire, pas besoin d'afficher autant !!! Et toujours pas de traduction ?? »

Au repos : « pas trop mal » à « vachement bien ». Après un toucher : « moyen convaincu ». Avec le plateau de p3c-3 porté et les noms en français : « on est bon ».
