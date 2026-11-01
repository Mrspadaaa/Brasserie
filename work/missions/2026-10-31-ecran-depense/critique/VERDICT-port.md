ACCEPTÉ — reprise du 01.11 : les 21 défauts sont corrigés ou tranchés ; restent 6 détails, aucun bloquant ni majeur (section « Reprise (01.11) » en fin de fichier)

> Le premier tour (« À CORRIGER — 21 défauts », 01.11 nuit) est gardé tel quel pour mémoire ; la reprise sur les captures régénérées est en fin de fichier.

Critique neuf, 01.11, sur `voies/e-port/captures/` (app à gauche, maquette r2b à droite), `v1/r2b/etat.html` ouvert quand la maquette
n'était pas dans le même geste. Je ne juge pas la direction (D227, r2b choisie par le pilote) : je compare l'app à la maquette, geste par
geste, et je relève ce qu'il ne reconnaîtrait pas. Étalonnage sous le seuil (L27) : je signale, le pilote tranche.

**Ce que le brasseur dirait devant l'app** : « Ça c'est bien ma facture, les lignes dans l'ordre, les points numérotés, le rattacher les 5
ça marche, le reçu avec le lien c'est bon. Mais 86,5 c'est quoi ??? Et dans la TVA y a du code (base-par-code:N), et le bouton noir sous
Payé il dit rien. Target 11.3% c'est pas un nom, j'ai dit bis !!! Et sur PC quand je descends je perds tout à gauche. »
Verdict prédit : **mitigé** (« pas trop mal mais manque des trucs ») — l'idée est là, aucun refus explicite ne revient sauf un (D215).

## Défauts

1. **Bloquant — Payé : le bouton « C'est la date » est une pilule noire vide.** `souris390-04-paye`, `tactile390-04-paye`, `pc1280-04-paye`
   (les trois). App : sous « Date de paiement non imprimée : supposée égale à la facture (27.04.2026). », un rectangle noir sans texte.
   Maquette : « C'est la date » (noir, texte blanc) et « Autre date ». Cause lisible dans `src/ui/finance/ExpenseSheet.tsx:372` :
   `bg-cave-50 … text-cave-950`, les deux sombres dans le thème rendu. Correction : le même style que « Rattacher les 5 » (fond noir,
   texte blanc), et ajouter « Autre date ». Le point 2 ne se règle pas à vue tant que ce bouton est muet. Règle : DEFAUTS « icônes muettes /
   on ne sait pas ce que c'est » ; retouche 2 de r2b (chaque point se règle sur sa ligne, visible).

2. **Majeur — Panneau TVA : des clés de code à l'écran.** `*-03-tva` (les trois). App : « somme-bases : lu 110,40 · calculé 86,50 »,
   « base-par-code:N », « base-par-code:R », « somme-tva ». Maquette : trois tuiles nommées par provenance (« colonne MWST · lu »,
   « N + R · 1,95 + 2,20 », « proposé · HT vide ») et « bases 26,20 + 84,20 = 110,40 · +23,90 ». L'app nomme aussi les tuiles « lecture 1 »
   / « lecture 2 » : il ne sait pas laquelle est la colonne MWST et laquelle est N + R. Correction : tuiles « colonne MWST · lu 2,80 » et
   « N + R · 1,95 + 2,20 = 4,15 » ; lignes en mots : « Bases N + R : imprimé 110,40 · lignes 86,50 (+23,90) », « Base N : imprimé 26,20 ·
   lignes 11,20 », « Base R : … », « TVA : colonne 2,80 · N + R 4,15 ». Confirmé (relevé par l'auteur). Règle : SPEC « ce qui sort de
   nulle part », DEFAUTS texte technique au premier plan.

3. **Majeur — Total « 86,5 ».** Toutes les captures. Maquette : « 86,50 » en 32 px, comme chaque montant du ticket. Un ticket qui dit
   86,5 au bandeau et 86,50 au pied (« Détail : 86,50 CHF / 86,50 CHF ») se contredit sous ses yeux. Correction : afficher deux décimales
   au repos (le champ se formate au blur ; la saisie brute au focus). Confirmé. Règle : honnêteté des chiffres (PORTRAIT § 3.4) ; ligne de
   ticket Malts s1.

4. **Majeur — « Créer « Target 11.3% » ».** `pc1280-01-repos`, `*-06-points-regles` (« Target 11.3% · nouveau »). App : le bouton
   crée un article de stock nommé par le libellé imprimé, α dans le nom. Maquette : « Target α 11,8 » (stock, grisé) puis « Target bis » et ⇄.
   Le brasseur a dit D215 mot pour mot (« créé un "bis" ») : un refus explicite qui revient, il est dur là-dessus. T6 renvoie « bis » /
   « CH » à S6, soit ; mais le nom écrit en stock ne doit pas être « Target 11.3% ». Correction minimale sans S6 : le nom du produit
   (« Target »), l'α comme donnée de l'article (« α 11,3 »), le bouton « Créer Target (α 11,3) » ; la marque « bis » à S6, avant de lui
   montrer l'écran. Le ⇄ (échanger avec l'existant) manque aussi. Confirmé.

5. **Majeur — Lignes au repos : le libellé imprimé avec son unité, pas le nom.** `*-01-repos`, `*-06`. App : « Maris Otter, Kg »,
   « Röstgerste, Kg », « CARAMÜNCH® Typ 2 Kg », « LALLEMAND Windsor 11g », « Safale BE-256 (Abbaye) 11.5 g ». Maquette : « Maris Otter »,
   « Caramünch Typ 2 », « LALLEMAND Windsor », l'imprimé au plateau seulement (NOTE, retouches communes). « Maris Otter, Kg » puis « 6 Kg »
   dessous : il lira « , Kg » comme une faute. Correction : au repos, le nom de l'article relié (13 reliés) ou le libellé nettoyé de son
   unité ; l'imprimé tel quel dans le plateau (« Voir l'extrait »).

6. **Majeur — Preuve : le compte des liens ne fait pas 23, une phrase d'aide, « 2 » au lieu de « 2/2 ».** `*-02-preuve`, `pc1280-*`
   (preuve ouverte d'office). App : « 13 reliés · 0 nouveaux · 1 unité ? · 5 moutures » = 19 lignes sur 23 ; après réglage « 14 reliés ·
   1 nouveaux · 5 moutures » = 20. Maquette : 13 + 2 + 2 + 1 + 5 = 23, et « 1 page vue, page 2 coupée : l'argent vu est complet ».
   L'app ajoute sous le titre « Certains points restent à confirmer. Vérifie les points signalés sur l'original. » : une explication au
   repos à 1280. « Lectures d'accord 2 » n'est pas une fraction. Correction : le compte somme à 23 (ajouter « 1 à créer », « n services »
   ou ce qu'il faut) ; retirer la phrase d'aide ; « 2/2 » ; la ligne page vue / page coupée si l'indice existe (le script en a un :
   « 0,7 Mo · 1 page »). Règle : PORTRAIT § 3.4 honnêteté ; SPEC « texte au premier plan, explications ».

7. **Majeur — Payé : l'ancien formulaire entier au lieu de la carte.** `*-04-paye`. App : « Déjà payé / À payer », phrase, bouton muet,
   « Date du paiement », « Changer le mois, garder le jour » ←/→, « Hier / Aujourd'hui / Demain », « Moyen de paiement » (select).
   Maquette : « payé le · supposée 27.04 » / « facture 27.04 » côte à côte, la mention lue « Betrag per E-Finance dankend erhalten »,
   « Payé le [27.04.2026] · Moyen · E-Finance (lu) », « C'est la date / Autre date ». L'app est le cockpit que r2b remplaçait (SPEC
   « pas de cockpit »). Correction : la carte de la maquette d'abord ; le formulaire complet (mois, moyen) derrière « Autre date ».
   RESULTAT le dit tombé ; il n'est pas dans la liste T9 : à rétablir.

8. **Majeur — État 8 : la comparaison en prose au lieu du tableau.** `*-09-etat8`. App : « Même commande, autre numéro : 380001 » puis
   trois lignes de texte (« Même commande n° Onlinebestellung-686863 · Même fournisseur et même total · Autre n° de facture : 372765 (déjà
   380001) · 3 jours d'écart ») et une seconde phrase d'aide ; action « Même achat · ne pas doubler » qui change le pied en « Fermer sans
   rien enregistrer ». Maquette : un tableau « Ce document / Déjà au registre » (N°, Date, Commande, Total), lu en trois secondes, et
   « Même achat : rattacher le justificatif ». Correction : le tableau à deux colonnes ; dire où va le fichier quand il choisit « Même
   achat » (rattaché à 380001, ou perdu ?). « Voir 380001 » : écart accepté (T9).

9. **Majeur — État 1 : rien pendant la lecture.** `tactile390-09-etat1`. App : une feuille basse « Lecture et vérification… ·
   capture-facture.jpg », le reste grisé. Maquette : le fichier, « 0,7 Mo · 1 page », Règlement « Payé / À payer » et « Pour quoi ? à
   taper » déjà utilisables, les lignes en squelette. Les trois étapes (Envoi ✓ · Lecture 7 s · Vérification) sont dites tombées ; le
   Règlement et « Pour quoi ? » pendant la lecture ne sont pas dans T9. Il attend 7 s sans rien pouvoir faire : « Pas de bloquage sur une
   attente ». Correction : ouvrir l'écran tout de suite avec Règlement et Pour quoi ? ; une seule ligne d'étape suffit.

10. **Majeur — État 5 : pas de « Relire », une date de paiement inventée.** `tactile390-09-etat5`. App : « Lecture impossible · service
    IA. Le fichier est gardé, rien n'est perdu. » sans action ; « Règlement · Payé le 01.11.2026 » (la date du jour, rien n'a été lu, sans
    « supposée ») ; « Total TTC 0,00 » ; champ « Pour quoi ? » avec un placeholder d'exemple (« Malt pour la Pale Ale, entretien de la
    pompe… ») ; « Justificatif prêt » + « Voir le justificatif » en double. Maquette : « Relire / Saisir à la main », « — », « à saisir ».
    Correction : les deux boutons ; « — » ou « à saisir » partout ; pas de date affichée comme lue.

11. **Majeur — 1280 : la colonne gauche part avec le ticket.** `pc1280-05-erreur-unite`. App : après le saut à Sabro, la colonne gauche
    est un blanc vide, la bande collante barre les deux colonnes. Maquette (NOTE « À 1280 ») : la colonne gauche porte verdict, preuve,
    tuiles, chips et reste en vue ; le ticket défile à droite. Correction : colonne gauche collante (ou deux défilements), bande collante
    au-dessus du ticket seulement.

12. **Détail — Chips : libellés plus courts que la maquette, tuiles sans numéro, ordre différent.** `*-01-repos`. App : tuiles « TVA
    2,80 · 4,15 » et « Règlement · Payé le 27.04.2026 supposée » sans pastille, puis chips « 1 TVA · 2 Payé le · 3 Unité · 4 mouture ×5 ·
    5 Target ». Maquette : tuiles numérotées 1 et 2, chips « 3 mouture ×5 +1,50 · 4 Target α · 5 Sabro unité · 6 Hallertauer CH ».
    « Unité » seul ne dit pas quelle ligne. Correction : « Sabro unité », « mouture ×5 +1,50 », « Target α » ; les numéros 1 et 2 dans les
    tuiles.

13. **Détail — Pas de chip Hallertauer CH.** Confirmé absent partout. T3 l'écarte (aucune source : le stock simulé a le même α). C'est
    pourtant l'exemple même de D215 (« un houblon CH … et on a que ce houblon US ») : l'origine lue dans le libellé (« CH ») diffère de
    l'article. Acceptable au port, à tenir en S6 (détection de l'origine), et à dire dans la page qu'on lui montre.

14. **Détail — Un chevron sur chacune des 23 lignes et des sous-lignes.** `*-01-repos`. Maquette : aucune flèche, la ligne entière
    s'ouvre. Bruit visuel. Correction : retirer, ou un seul chevron discret sur la ligne ouverte.

15. **Détail — La barre du bandeau est noire.** Toutes les captures. Maquette : 23 segments colorés (ocre, bleu, vert) avec coches.
    « Les bar de ce type sont plus informative » : la couleur par lien portait une information. Correction : reprendre les couleurs de la
    maquette (relié / nouveau / service) ; sinon l'écart se dit.

16. **Détail — Tableau des moutures tombé.** Chevron sur la sous-ligne → « lu 2,30 → 2,40 /kg » ×5, « Rattacher les 5 » / « Laisser en
    service ». L'app garde « Rattacher les 5 », une à une, et « ✓ 2,40/Kg » après le geste (`*-06`) ; « Laisser en service » est l'état
    par défaut. Le geste est là, l'aperçu des prix avant le geste manque. Acceptable au port ; à rétablir à la passe suivante (règle n° 1).

17. **Détail — Bases à l'échelle tombées.** Le dessin « cadre = 86,50, bases 110,40, +23,90 hachuré ». Les mêmes nombres sont dans la
    grille (une fois le défaut 2 corrigé). Acceptable au port ; à rétablir ensuite : il préfère une barre à une table (PORTRAIT § 1.2).

18. **Détail — En-tête éditable sur place tombé.** Dans r2b, seul le Total « se tape » (baseline) ; fournisseur / n° / date en champs
    pointillés était une greffe z2b. Le Total reste un champ ; fournisseur et date se corrigent dans les rubriques. Acceptable.

19. **Détail — Second bouton « Remplacer le fichier » tombé ; l'icône d'en-tête est ↻.** `*-01-repos`. L'app n'a que l'icône ↻ (flèches
    circulaires) pour « Changer », qui se lit « recharger ». Maquette : icône document. Acceptable de perdre le second bouton si l'icône
    dit « Changer le fichier » (document + mot au survol, ou le mot « Changer » dans « Voir le justificatif »). « Les icône sont pas
    parlant » guette.

20. **Détail — Pendant l'envoi, ni taille ni « tu peux fermer ».** `*-07-envoi`. App : « Envoi au Drive » + « Enregistrement… ».
    Maquette : « Envoi au Drive · 0,6 / 0,7 Mo · tu peux fermer ». Sans progression, soit ; mais s'il peut fermer, le dire ; s'il ne peut
    pas, c'est une attente bloquante qu'il a refusée. À vérifier dans l'app (le × est-il actif pendant `saving` ?).

21. **Détail — Reçu et tuile TVA.** `souris390-08-recu` : le nom du fichier est coupé « Brau- und Rauchshop 37… » (le numéro est ce
    qu'il cherche) ; passer sur deux lignes. `*-04-paye` et suivants : la tuile TVA devient « — gardée » et perd « 2,80 · 4,15 » une fois
    la chip réglée ; la maquette garde les valeurs.

## Les éléments tombés, un par un

| Élément | Verdict | Pourquoi |
|---|---|---|
| Tableau des moutures | acceptable au port, rétablir ensuite | le geste (5 d'un coup, une à une, laisser) est là ; seul l'aperçu des prix manque (n° 16) |
| Bases à l'échelle de la TVA | acceptable au port, rétablir ensuite | mêmes nombres dans la grille, à condition du n° 2 ; il préfère la barre (n° 17) |
| En-tête éditable sur place | acceptable | greffe z2b, pas r2b ; le Total se tape (n° 18) |
| « Voir 380001 » | acceptable | écarté par T9 ; mais le tableau de l'état 8 est de r2b et doit revenir (n° 8) |
| Trois étapes de lecture | acceptable | une ligne honnête suffit ; mais Règlement et Pour quoi ? pendant la lecture sont de r2b (n° 9) |
| Second « Remplacer le fichier » | acceptable | si l'icône d'en-tête dit « Changer » (n° 19) |
| Carte « payé le · supposée / facture » | **à rétablir** | pas dans T9 ; le formulaire entier est le cockpit (n° 7) |

## Ce que je n'ai pas pu voir
- Sabro au repos : g · kg · Stk sur la ligne même (retouche 2) ? Les captures 05 montrent les chips sous le plateau ouvert ; aucune capture
  de la ligne fermée. `ExpenseSheet.tsx:338` les rend par `correction` : à capturer fermée.
- Le × pendant l'envoi (n° 20).

## Captures ouvertes en image
`souris390`, `tactile390`, `pc1280` × `01-repos`, `02-preuve`, `03-tva`, `04-paye`, `05-erreur-unite`, `06-points-regles`, `07-envoi`,
`08-recu`, `09-etat8`, `09-etat9` (30 images) ; `tactile390-09-etat1`, `tactile390-09-etat5`, `tactile390-09-etat6` (33 au total).
Non ouvertes : `souris390` et `pc1280` des états 1, 2, 5, 6 ; `tactile390-09-etat2`.

LEÇON PROPOSÉE : un port qui réemploie un panneau existant (Payé, plateau de ligne) le compare à la maquette avant de le garder : deux
panneaux de l'app ont repris le cockpit que la maquette choisie remplaçait, et le contrôle G7 (132 verts) ne le voyait pas.

## Reprise (01.11)

Captures régénérées (02:09) après `voies/e-port/TRI-PORT.md`. Ouvertes en image, aux trois modes (souris390, tactile390, pc1280) :
`01-repos`, `02-preuve`, `03-tva`, `04-paye`, `05-erreur-unite`, `06-points-regles`, `07-envoi`, `08-recu`, `09-etat1`, `09-etat2`,
`09-etat5`, `09-etat6`, `09-etat8`, `09-etat9` : 42 images, toutes regardées. Code lu pour un point : `ExpenseSheet.tsx:385-399` (panneau Payé).

**Sa phrase prédite, maintenant** : « Là c'est ma facture, 86,50, les points numérotés je les règle sur la ligne, la TVA je comprends
d'où viennent les deux, le reçu avec le lien c'est bon. Target 11.3% faut encore le bis, et sur PC le formulaire du paiement reste
ouvert. » Verdict prédit : **aime** (« pas trop mal » à « vachement bien »), avec un « mais » sur Target.

### Les 21 défauts, un par un

| n | Sort | Vu sur | Constat |
|---|---|---|---|
| 1 | corrigé | `*-04-paye` | « C'est la date » noir, texte blanc ; « Autre date » à côté |
| 2 | corrigé | `*-03-tva` | tuiles « colonne MWST · lu 2,80 », « N + R 4,15 », « proposé · HT vide — » ; phrases « Bases N + R : imprimé 110,40 · lignes 86,50 (+23,90) », « Base N … (+15,00) », « Base R … (+8,90) », « TVA : colonne 2,80 · N + R 4,15 » ; plus aucune clé |
| 3 | corrigé | toutes | « 86,50 » |
| 4 | tranché (S6) | `pc1280-01-repos`, `*-06` | « Créer « Target 11.3% » » gardé, ⇄ « Relier à Target 11.8% » ajouté. Ne trompe pas : le bouton dit le nom qui sera écrit. Mais c'est le seul endroit où il rejouera D215 (« j'ai dit bis !!! ») : S6 avant de lui montrer l'écran, ou le dire en une ligne sur la page |
| 5 | corrigé | `*-01-repos`, `*-06` | « Maris Otter », « Caramünch Typ 2 », « Target », « LALLEMAND Windsor », « Safale BE-256 » ; plus de « , Kg » |
| 6 | corrigé | `*-02-preuve`, `pc1280-*` | « 13 reliés · 0 nouveaux · 1 unité ? · 5 moutures · 4 sans stock » = 23 ; après réglage « 14 · 1 · 5 · 3 » = 23 ; phrase d'aide retirée ; « Lectures : désaccord sur certains points · 2 lectures » (honnête : il y a un désaccord sur la TVA) ; « 2/2 » à l'état 2 |
| 7 | corrigé | `*-04-paye` | carte « payé le · supposée 27.04 / facture 27.04 », « Date de paiement non imprimée · paiement lu sur le document. », « Moyen · Compte bancaire / carte », deux boutons. « (lu) » après le moyen absent : ne trompe pas (le moyen est celui de l'app, pas lu ; l'écrire « lu » aurait été le mensonge) |
| 8 | corrigé | `*-09-etat8` | tableau « Ce document / Déjà au registre » (N°, Date, Commande, Total). « Même achat · ne rien enregistrer » au lieu de « rattacher le justificatif » : ne trompe pas, le bouton dit ce qu'il fait ; mais voir détail R2 (la prose doublonne le tableau) |
| 9 | tranché (verrouillé) | `*-09-etat1` | fichier, « 0,7 Mo », une ligne d'étape, squelette ; Règlement et Pour quoi ? « verrouillé pendant la lecture ». Ne trompe pas : il voit qu'il attend et pourquoi. Les trois étapes tombées : acceptable, rien n'est promis |
| 10 | corrigé | `*-09-etat5` | « Relire » / « Saisir à la main » ; « Achat du 01.11.2026 aujourd'hui · par défaut » ; placeholder « À décrire » ; plus de doublon. Reste la tuile Règlement (détail R4) |
| 11 | corrigé | `pc1280-05`, `pc1280-06` | colonne gauche collante, bande collante sur le ticket seul |
| 12 | corrigé | `*-01-repos` | tuiles 1 TVA et 2 Règlement numérotées ; chips « 3 Sabro® unité · 4 mouture ×5 +1,50 · 5 Target α » ; aucune chip ne double une tuile |
| 13 | accepté | — | pas de chip Hallertauer CH. Ne trompe pas : la ligne « Hallertauer Blanc » est reliée sans doute affiché, ce qui est ce que la lecture sait. À S6 |
| 14 | corrigé | `*-01-repos` | plus de chevron par ligne ; un seul petit « ⌄ » sur la sous-ligne mouture (tableau des moutures) |
| 15 | corrigé en partie | toutes | la barre a trois segments ocre, le reste reste noir ; voir détail R3 |
| 16 | corrigé | `*-01-repos` | « ⌄ » du tableau des moutures présent ; le tableau ouvert n'est pas capturé (RESULTAT dit « lu 2,30 → 2,40 /Kg » pour un malt relié, « Laisser en service ») : non vu |
| 17 | accepté | `*-03-tva` | pas de bases à l'échelle ; la grille en mots porte les mêmes nombres et le « +23,90 ». Ne trompe pas |
| 18 | accepté | — | pas d'en-tête éditable (z2b). Ne trompe pas |
| 19 | corrigé en partie | `*-01-repos` | icône document ; nom accessible « Changer » (tests hors Possède), titre « Changer le fichier (document) ». Ne trompe pas : le document se lit « fichier » |
| 20 | corrigé | `*-07-envoi` | « Envoi au Drive » + « Enregistrement… », rien de promis. Voir détail R5 (« 0,7 Mo » annoncé par RESULTAT, absent de la capture) |
| 21 | corrigé | `*-08-recu`, `*-04-paye` | nom du reçu sur deux lignes ; tuile TVA « 2,80 · 4,15 vide » (les deux lues barrées, « vide » gardé) |

« Voir 380001 » (T9) : accepté, ne trompe pas ; le tableau donne le numéro.

### Défauts restants et nouveaux (tous détails)

R1. **Après « C'est la date », le panneau Payé reste ouvert et montre le formulaire complet.** `pc1280-05-erreur-unite`,
`pc1280-06`, `pc1280-07`, `pc1280-08` (colonne gauche : « Déjà payé / À payer », « Date du paiement », « Changer le mois, garder le
jour », « Hier / Aujourd'hui / Demain », « Moyen de paiement ») ; à 390 il est hors champ mais ouvert. Code : `payeSuppose` passe à faux
après le geste, donc la carte disparaît et `payeSuppose&&!payeForme?'hidden':'block'` montre le formulaire. Maquette : le point se règle et
le panneau se referme. Correction : `setPanel(null)` dans « C'est la date », comme le font les tuiles TVA. Le cockpit du C7 revient par
cette porte sur PC, pendant tout le reste du parcours (envoi, reçu).

R2. **État 8 : la prose reste sous le tableau.** `*-09-etat8` : après le tableau, « Même commande n° Onlinebestellung-686863 · Même
fournisseur et même total · Autre n° de facture : 372765 (déjà 380001) · 3 jours d'écart », puis « Même achat : rien n'est enregistré, la
dépense existante reste telle quelle. » Le tableau dit déjà tout ; la prose est l'explication au repos (SPEC). Correction : retirer la
première phrase ; garder une seule ligne sous les boutons (« 3 jours d'écart » peut aller dans la ligne Date). À 390, « Commande
Onlinebestellung-6… » est coupé : afficher « 686863 » comme la maquette.

R3. **La barre du bandeau reste presque toute noire.** `*-01-repos` : trois segments ocre, vingt noirs ou gris. Maquette : ocre /
bleu / vert pour relié / nouveau / service. Si « relié » est rendu en gris-noir par le thème, la barre ne dit plus rien au repos.
Correction : trois teintes distinctes des jetons (relié ocre, nouveau bleu, service vert), le noir réservé au sans-stock.

R4. **État 5 : tuile « Règlement · Payé le 01.11.2026 » sans « par défaut », « Total TTC 0,00 ».** `*-09-etat5`. La date « Achat du »
dit « aujourd'hui · par défaut », mais la tuile Règlement affiche la même date comme un fait. Maquette : « — ». Correction : « Payé le
01.11.2026 · par défaut » (ou « à saisir ») ; le total « — » tant qu'il n'est pas tapé, si le champ le permet.

R5. **Envoi : « 0,7 Mo » annoncé par RESULTAT, absent des captures.** `*-07-envoi` : le pied dit « Envoi au Drive » seul. Soit la
taille n'apparaît qu'avec un vrai fichier (alors RESULTAT le dit), soit elle manque. À vérifier, sans gravité.

R6. **« Sabro® unité » garde le ® du libellé imprimé.** `*-01-repos`, bande collante `*-05`. Maquette : « Sabro unité ». Correction :
`readProductLabel(...).name` pour le nom de la chip, comme pour la ligne (C5).

À surveiller, pas un défaut : à l'état 2 (`*-09-etat2`), le titre dit « Lecture vérifiée » alors que trois points numérotés restent
(Payé supposée, mouture ×5, Target α). C'est T1 / R10 (seuls les points qui pèsent baissent le statut), et le compte fait 23 ; mais il
pourra demander « vérifiée et y a 3 points ??? ». Si cela revient, « Argent vérifié » serait plus juste que « Lecture vérifiée ».

### Non vu
- Le tableau des moutures ouvert (C16) et Sabro au repos avec g · kg · Stk sur la ligne (les captures 05 ont le plateau ouvert).
- Le geste tactile long, le clavier virtuel, le thème sombre (RESULTAT le dit aussi).

LEÇON PROPOSÉE : quand un panneau réemployé a deux états (carte puis formulaire), le contrôle capture l'état *après* le geste qui le
règle, pas seulement le geste lui-même : R1 n'était visible que sur les captures 05 à 08 à 1280, hors de la zone que G7 mesurait.
