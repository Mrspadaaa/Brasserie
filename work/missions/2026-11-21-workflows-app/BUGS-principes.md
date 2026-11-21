# Constats transversaux WFX-n (21.11, analyse par principes)

App locale `port-carnet` (HEAD d5a2f056c, modifications en cours d'une autre session laissées intactes), Vite de dev sur le port 3177,
`?dev-local`, seed du dépôt principal plus fixtures « ZZ TEST » en mémoire, 390 × 844 tactile, thème clair. Aucune donnée réelle,
pas de Gemini. Captures : `principes/captures/`, journaux `principes/tour*.log`. Chaque constat cite sa règle (`REGLES.md`).
Un constat marqué « fixture ? » peut venir des données du banc : il est à confirmer sur des données comme les siennes.

| N° | Règle | Écran (entrée) | Constat | Capture |
|---|---|---|---|---|
| WFX-1 | R2 | Toute l'app | Aucune saisie en horizons. 43 `type="date"` dans 27 fichiers et `DateField` dans 12 autres. Toutes les dates d'intention se posent au jour près : projet ou idée (`CreativeItemSheet`), brassin planifié (`BrewScheduleField`), entretien (`equipment/DetailEdit`), prévision (`PlanSheetC`), fût (`KegSheet`), date d'achat. Trois amorces existent, chacune isolée : « Aujourd'hui · Hier · Autre date » (Remplir un fût), le rythme « semaine · mois · 3 mois · brassin » (Étalonner) et les puces de semaine (ajout au calendrier). | `g-fut-remplir`, `g-etalonner`, `g-cal-ajout` |
| WFX-2 | R2, R1 | Brassins › Recettes › fiche | Une recette ne porte ni date ni horizon. La liste et la fiche n'ont aucun « pour quand » : la bière de Noël ne se date nulle part avant d'être brassée. | `t-brassins-recettes`, `g-recette-fiche` |
| WFX-3 | R5 | Stocks › Matériel › Achat | La feuille « Acheter du matériel » s'ouvre en mode « Déplié » : 14 champs au premier écran (6 listes, 6 champs texte, 1 date, 1 case), 214 mots. « Total TTC » vient avant « Pour quoi ? ». | `g-materiel-achat` |
| WFX-4 | R1, R8 | Stocks › Fûts › Remplir depuis un lot | La feuille dit « Fûts propres · 0. Marque un fût propre depuis sa fiche » alors que 4 fûts sont « À laver » : il faut sortir, marquer, puis revenir. Le lot n'est pas proposé (« Choisir un lot… ») alors que seuls les lots en garde ou finis conviennent. | `g-fut-remplir`, `t-stocks-futs` |
| WFX-5 | R3, R7 | Stocks › Matériel › Étalonner (densimètre) | La valeur lue se tape au clavier (champ « — lu », décimal). Le curseur de densité existe déjà dans la fiche de fermentation (« Mesurer » sur la bande). | `g-etalonner` |
| WFX-6 | R5, R6, R1 | Clients › Prix | Le premier écran est un mur de texte : 7 lignes « Il manque ces données pour savoir ce qu'il te reste » (litres conditionnés, coût du brassin, densité, prix des 33 cl, 75 cl et du fût, volume annuel), 202 mots. Le prix se règle par un lien en texte (« fixer le prix › »). Trois de ces manques sont des suites du brassin (R1), pas des saisies. | `t-clients-prix` |
| WFX-7 | R6, R8 | Clients › Carnet | Une liste de lignes en texte (« Pro · Prospect · Aucune vente »). Rien ne montre ce qui sert à la vente : fûts chez le client, dernière commande, client à relancer. | `t-clients` |
| WFX-8 | R5 | Stocks › Courses | Le premier écran est presque vide : une ligne tronquée (« 4 manquent · 2 au seuil · rien cette sem… ») et « Tout voir ». La liste elle-même s'affiche sur le Bord (« 6 articles à commander », « Copier la liste ») et pas sur son propre écran. | `t-stocks-courses`, `01-bord` |
| WFX-9 | R1, R3 | Calendrier | Deux brassins affichent « fin non renseignée », alors que la recette porte fermentation et garde (fixture ? Milk Stout vient du seed). Le solde de départ est un renvoi en texte (« à régler dans Finances › Solde ») au lieu d'un réglage sur place. | `t-calendrier` |
| WFX-10 | R1 | Finances › Prévisions | « Aucune sortie prévue sur 90 jours » alors que deux brassins sont planifiés (NEIPA, ZZ TEST Stout le 05.12) et qu'il faut acheter leurs matières. Le planning ne nourrit pas la prévision (fixture ? à confirmer par la chaîne acheter). | `t-finances-previsions` |
| WFX-11 | R1 | Brassins › mesures d'un lot en fermentation | « Stock à vérifier · Revérifier et déstocker » : le déstockage attend encore un geste une fois le brassin lancé (fixture ? lot créé sans passer par le compagnon ; à confirmer par la chaîne produire). | `g-mesures` |
| WFX-12 | R6, R2 | Bord › Échéances et démarches ; Agenda | Six cases à cocher en texte (« Impôt fédéral sur la bière — Taxas », « Décompte TVA Trimestriel AFC »…), sans date ni place dans le temps, alors que la rangée « Papiers » du calendrier existe. | `g-echeances` |
| WFX-13 | R5 | Plus › Période | La frise à poignées est doublée par « Du … au jj.mm → jj.mm » en texte juste en dessous, et la période revient encore dans l'en-tête (« Nov. »). | `g-compte` |
| WFX-14 | R4, R1 | Toute l'app | L'annonce des effets (L9, `BandeauEffets`) n'est branchée que dans `KegBoard` et `StockRow`. Les autres gestes qui ont des suites (vente, achat, brassin lancé, mesure, fût rempli, projet daté) ne disent ni ce qui a bougé ni comment l'annuler. | (code) |
| WFX-15 | R8, R1 | Recette › Houblons (assistant) | L'α reste vide (« IBU – », « alpha du lot ») alors que l'article en stock porte 12 % : l'α connu n'est pas repris, il faut le retaper (fixture ? l'α vient peut-être du lot et non de l'article). | `h-eau` (étape Houblons) |
| WFX-16 | R5 | Calendrier › + Ajouter | L'ordre de la feuille ne suit pas sa décision : catégorie, CHF au clavier, semaines, jours, et le « Nom » (ce que c'est) en dernier, sous le pli. | `g-cal-ajout` |

Non concluants, à rejouer (limite du banc, pas des défauts) :
- **Eau** : l'assistant reste bloqué à l'étape Houblons, à cause de ma fixture de recette (masse de houblon absente).
- **Recherche** : la palette s'ouvre (« Faire, chercher, aller… », champ actif), mais ma capture a pris la feuille d'avant.
- **Hors ligne** : en mode hors ligne émulé, le Bord ne change pas à l'œil ; l'indicateur reste à vérifier.
- **« Impossible de charger cet écran »** (Stocks, Clients) : rechargement de Vite pendant l'optimisation des dépendances (`fflate`, `recharts` dans le journal), donc un artefact du serveur de dev.
