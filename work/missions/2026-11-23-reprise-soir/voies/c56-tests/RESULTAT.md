TESTS ROUGES 28 rouges / 41 au total (R27 10, R28 3, R29 9, R30 6 ; 13 verts justifiés) — hash : voir la dernière ligne

# RESULTAT c56-tests

Livrable : `tests/unit/c56Regles.test.tsx` (41 tests, un bloc `describe` par règle R27..R30), fixture `tests/fixtures/c56/carnets.json` (articles fictifs réécrits d'après les captures des tours 50 et 56, aucune donnée personnelle), un seul `.skip` dans `tests/unit/c48Regles.test.tsx` (R4, cas avec critère, avec la raison citée : sa réponse « Oui » à C50-5). Aucun fichier de `src/` ni de `functions/` modifié (`git status --short src functions` : rien).
Sortie : `voies/c56-tests/tests-rouge.log` (`npx vitest run tests/unit/c56Regles* --reporter=dot` : 28 failed | 13 passed (41)). c48Regles rejoué : 27 passed | 1 skipped.

## Endroits du code où chaque règle s'applique (grep)
- R27 débordement / coupure : ligne Offre de la fiche (FicheArticle.tsx l.286-293 ; carnets.css l.20 `.cn-sp{flex:1;min-width:0}`, l.498-503) ; légende de la jauge du héros (`Piste`, carnets.css l.186-190, l.582, l.645-651) ; carte classée (garde-fou : trois blocs séparés) ; cellule de Comparer (garde-fou : cellule de table qui s'élargit).
- R27 nombre + unité insécables : grille « Caractéristiques » de la fiche (Variantes) ; cellules de Comparer ; cartes de la feuille Articles ; critère et valeur du héros ; titre du carnet (lien retour de Comparer `.cn-retour`, liste des carnets, carnet ouvert ; fil d'Ariane de la fiche : déjà `nowrap`, donc juste) ; en-tête « Classé par » de Comparer.
- R28 : `passerIA` (rangement.ts l.387-475, seul endroit qui décide `echec`) ; `EtatIA` echec (EtatIA.tsx l.175, via apercuCarnet.tsx l.134) ; bandeau de reprise (bandeauxCarnet.tsx l.38-41) ; `AVIS_IA` (lignesRegles.ts l.21) ; bandeau de retour (`retour.avis`, éteint à 8 s : useNavigationCarnet.ts l.97).
- R29 : `colonnesComparer` (Comparer.tsx l.55-66) + `groupeDeLigne` (`LIGNE_CRITERE=1` entre `LIGNE_PRIX=0` et `LIGNE_LIVRAISON=2`, comparer.ts l.545) ; lignes rendues de Comparer ; gardes-fous : fiche (ligne Offre = un bloc), carte de la feuille Articles. Les autres écrans (TableauCarnet : colonnes valeur + prix seulement) n'ont pas de lignes d'offre.
- R30 : `compromisDe` (comparer.ts l.736-800), encadré de Comparer (Comparer.tsx l.396-400 et l.518-524, calcul local ou prop `compromis`) ; le compromis de l'IA n'est généré nulle part côté serveur (grep functions/src : aucun).

## Pourquoi la mesure de C52-3 a menti
Le tour 53 a mesuré des BOÎTES : le conteneur du vendeur (`.cn-offre-corps .cn-sp`, `flex:1; min-width:0`) finit 10 px avant la boîte du prix. Mais il peut rétrécir sous son plus long mot (corps en `flex:1 1 170px`, prix en `nowrap` ≈ 95 px : reste ≈ 65 px pour « ggmgastro.com » ≈ 91 px) ; le mot ne se coupe pas et déborde de sa boîte (overflow visible) sur le prix. La boîte dit 10 px, le texte dit zéro. Les tests lisent la cascade (le conteneur peut-il rétrécir sans pouvoir couper ni passer à la ligne ?) et le texte (légende contre place de sa piste ; espace ordinaire entre nombre et unité), jamais la distance entre deux boîtes.

## Les 28 rouges, et pourquoi (chacun vérifié : le message dit la cause du constat)
- R27 (10) : Offre marmite et cellule (« gastro-exemple.com » ≈ 116 px dans un conteneur `min-width:0` sans coupure ni passage à la ligne) ; légende de la jauge de la marmite n° 2 (≈ 194 px dans une piste de ≈ 156 px ; la n° 1 tient : 226 px, comme en ligne : « sur la fiche du KS240L elle tient ») ; Variantes de la fiche et de Comparer (« 250 g », « 1 kg » ; espaces ordinaires) ; lien retour de Comparer, titre dans la liste, titre du carnet ouvert (« 50 L ») ; héros (« Volume utile : 50 L », valeur « 50 » + « L ») ; en-tête « Classé par Volume utile : 50 L ».
- R28 (3) : panne d'un seul appel (le premier `ok:false` annonce l'échec, aucune reprise) ; deux avis l'un sous l'autre après 8 s (« L'IA n'a pas répondu : 1 message rangé tel quel [Relire] » et « … rangé sur place, rien n'est perdu. », reproduits au mot près) ; l'avis sans Relire.
- R29 (9) : « prix, volume utile, dispo, vendeur, pays, tension » ; « prix, température, dispo, vendeur, pays, … » : trois critères × (lignes rendues + `colonnesComparer`) + la place de la ligne qui classe.
- R30 (6) : les phrases du tour 50 reproduites au mot près (« la 1re, la température 0 à 8 °C ; 2 697,74 CHF, la moins chère », « la 1re, le volume utile 242 L ; 302 CHF, la moins chère ») ; critère sans valeur ; encadré de Comparer (marmite, cellule) ; compromis d'IA qui récite le tableau.

## Les 13 verts (endroits déjà justes, ou garde-fous)
Outil de cascade (`min-width:0` lu), outil de coupure (« 250 g » signalé, insécable et `nowrap` non) ; texte de la ligne Offre « vendeur · pays en stock 2 697,74 CHF » (C52-3 juste en texte) ; légende de la marmite n° 1 ; feuille Articles de deux houblons (valeurs en `nowrap`) ; fil d'Ariane de la fiche (`nowrap`) ; carte classée (trois blocs) ; R28 « réponse en 3 s » (rien n'annonce l'échec à 1,6 s ni à 3,8 s : rangement.ts a un délai de 45 s) ; R28 Relire après l'échec (le geste marche) ; R29 sans critère, fiche, carte ; R30 sans critère (écart dit déjà) et « article moins cher qui perd sur le critère » (« la 2e, 2 697,74 CHF, soit 289,77 CHF de moins que la 1re ; le volume 2,6 m³ au lieu de 4,06 m³ » : le gain et la perte y sont déjà).

## Doutes et limites
- jsdom ne mesure aucune boîte : R27 « Offre » et « jauge » sont des modèles (cascade lue, chasse 6,4 px par signe à 14 px, comme c55Regles R23). Le rendu réel à 390 px reste à voir en ligne. La largeur de la piste suppose le héros en ligne (flex-direction: row à 390 px) : un correctif qui met la jauge sous la valeur (colonne) est reconnu.
- C56-4 (« l'IA n'a pas répondu » à 1,5 s) : la cause n'est pas reproduite ici (rangement.ts attend 45 s ; le test « 3 s » est vert). Le test « une panne d'un appel » dit la règle (« une reprise seule avant d'annoncer l'échec », ou succès au premier essai) ; le vrai délai du serveur et la cause (réponse `ok:false` transitoire d'aiTask ?) restent à chercher en ligne, console ouverte.
- Le test du compromis d'IA (R30, dernier) suppose qu'avec un critère, un compromis qui ne fait que recopier le tableau ne suffit pas : l'écran doit dire l'écart de prix (par le calcul local ou en enrichissant la phrase). Si le pilote juge qu'un texte d'IA passé en prop se montre tel quel, supprimer ce seul test.
- R30 sans critère : c48Regles R4 interdit de recopier les valeurs du tableau ; les tests R30 ne demandent là que l'écart de prix (« 289,77 »), jamais les volumes.
- Les tests R28 attendent 8,8 s (le bandeau de retour s'éteint à 8 s) : le fichier dure ≈ 30 s.
- Le Bash du poste perd les barres inverses : les regex ont été écrites avec Edit/Write, jamais par script.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (la cause de C52-3 est dite ci-dessus : une mesure de boîtes ne prouve pas qu'un texte ne déborde pas ; à garder dans la fiche de la règle R27)
