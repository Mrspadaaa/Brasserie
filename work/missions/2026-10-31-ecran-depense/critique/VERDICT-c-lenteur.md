# Verdict e-t11 — page de choix « la lenteur de la lecture » (c-lenteur, D261c)

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-lenteur/index.html`, ses 15 mini
maquettes (`choix-lenteur/img/*.png`, toutes ouvertes en plein format ; `img/md5.json` confirme 5 écrans distincts, les 10 autres identiques
au pixel), `controle-haut.png`, `controle-page.png` (390 × 4641, relue en quatre tranches rendues dans Chrome), `controle-ordinateur.png`,
contre l'écran actuel (`voies/p3c-port/captures/tactile390-lecture.png`, `voies/f3-rangees/captures/tactile390-clair-repos.png`), le contrat
`voies/c-lenteur/VOIE.md`, les chiffres `voies/m-lenteur/RESULTAT.md` et les formes acceptées `choix-nom` (e-t8) et `choix-captures` (e-t10).
Rejoué : `controle-page-choix.mjs --min=3` → `lenteur-lecture : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
`verifier-page.mjs` non rejoué : ses trois captures ont été ouvertes et jugées.

## Verdict : ACCEPTÉ — publiable, trois majeurs à retoucher avant (un quart d'heure), aucun bloquant

La page pose une seule question (combien il attend, et ce qu'il voit en attendant), chaque option ne fait varier que le moment où la 3.8
compte, la colonne A est l'écran « lecture » d'aujourd'hui trait pour trait, et la rangée « ≈ 6 s » répond en trois secondes : trois
écrans vides et gris (A, B, C), deux factures pleines (D, E). La frise 0 → 40 s sous chaque vue dit l'attente sans un mot. D montre
honnêtement ce que le brasseur ne voit pas (« 10 Kg × 1,45 » faux et sans drapeau au premier écran) et comment la 3.8 le corrige
(« ↻ 3 corrigées », cellules bleues, ancienne valeur barrée). Il choisira. Ce qui le fera râler : des têtes de colonne qui sont une
rangée de tableur où le temps n'est pas plus gros que le coût à quatre décimales, une liste de déclencheurs de B qui oublie la TVA alors
que ses chiffres la comptent, et sa propre piste (« 2 lents puis 1 lent ») absente d'une page sur la lecture.

## Les cinq questions du pilote

1. **Une seule question, un seul facteur** — oui. A : écran à la fin de la 3.8. B : même écran, 3.8 moins souvent. C : même écran, jamais
   de 3.8. D : l'écran de C tout de suite, puis celui de A. E = l'écran de D avec la 3.8 de B. L'écran Dépense ne bouge pas : `b-06` =
   `c-06` = `a-06` au pixel (« = A » grisé), `b-15` = `b-lue` = `a-lue`, `c-lue` = `c-15`, `e-06` = `d-06`, `e-15` = `e-lue` = `d-lue`.
   Ce qui change entre B, C et A à 15 s n'est que la position du curseur sur la frise et le mot « Déjà lue » : c'est la vérité, l'auteur le
   dit (RESULTAT, « seul le temps change »). Propre (L10). E est annoncée comme ajout de l'auteur (« B + D », « ajoutée, je le dis ») et
   le contrat l'autorisait.
2. **Les chiffres sont-ils honnêtes et lisibles sans tableur ?** Honnêtes : oui, chaque nombre se retrouve dans `m-lenteur/RESULTAT.md`.
   A (l. 22) : 12/14 · 18,5 s · 37,7 s · 154/165 · 10 muettes · 0,0445 CHF. B = B2 (l. 24) : 8/14 · 11,0 s · 34,3 s · 156 · 7 (5) ·
   0,0306 ; « à confirmer par 2 tirages de plus » (l. 59). C (l. 26) : 6,3 s · 9,9 s · 149 · 22 (8) · 0,0205 · 34 rouges (A : 10, l. 22).
   D (l. 27) : 6,3 / 9,9 au 1er écran, 18,5 final, 154 = A, 0,0445, « 22 (8) au 1er écran ». E (l. 30 appliquée à B2) : 6,3 / 9,9 puis
   11,0 final, 156, 0,0306. Repères « lue · 18,5 s / 11 s / 6,3 s » justes. « ≈ 4 s » de transfert : `traduireNoms` 3,8 s (l. 13).
   « 14 pièces, 1 tirage : un indice » une fois en tête, comme demandé. Les sommes de la facture fictive tombent juste (5 + 4 + 1 = 10 Kg ;
   14,50 + 7,20 + 2,40 = 24,10 ; 24,10 + 6,60 + 9,80 + 5,90 = 46,40 ; et 10 Kg × 1,45 = 14,50 : la valeur fausse de C est cohérente, ce
   qui est exactement pourquoi elle passe sans drapeau). Deux écarts à l'honnêteté : la liste des déclencheurs de B omet la TVA (majeur
   n° 2), et D et E ne donnent pas le « au pire » de leur lecture finale (37,7 s et 34,3 s), alors que « Confirmer l'attend » : il doit savoir
   que Confirmer peut attendre 38 s (dans le majeur n° 1).
   Lisibles sans tableur : à moitié. Chaque tête aligne 5 à 7 nombres en mono, tous de la même taille, en une rangée qui se replie
   (`controle-ordinateur.png` : « 18,5 s médian 37,7 s au pire / 154/165 justes 10 sans drapeau / 0,0445 CHF »). Le nombre qui répond à sa
   question (« combien j'attends ») n'est pas plus gros que « 0,0445 CHF », chiffre de comptable qu'il lira « 4 centimes ». Portrait,
   erreur 3 et § 6.6 : ses chiffres lui parlent s'ils répondent, et il prend « celui qui montre en plus grand ce qui compte ». Majeur n° 1.
3. **D et E : « lecture finale en cours » sans cockpit, et la correction visible** — oui aux deux. `d-06.png` : un fil de 22 px sous
   l'en-tête (deux traits pleins, un pointillé, le seul mot « vérification »), « Lectures ●●◌ » dans la preuve, « Confirmer » gris avec
   une roue. Trois marques, aucune phrase, une seule taille de texte ajoutée : pas de D2, pas de D3. L'écran dessous est celui de C
   (« 3 à remplir », « 15 Kg », « 80 ? »), et la valeur fausse sans drapeau reste sans drapeau : c'est l'honnêteté demandée par VOIE.md
   (« la page doit le montrer honnêtement »), et la tête de D le chiffre (« au 1er écran : 22 fausses sans drapeau »). `d-15.png` = `d-06`
   (« = 6 s ») : à 15 s il attend encore la 3.8 (18,5 s médian), vrai. `d-lue.png` : le fil a disparu, « Lectures 3/3 », « Confirmer »
   noir, puce « ↻ 3 corrigées » dans la famille des puces existantes, trois cellules sur fond bleu avec l'ancienne valeur barrée sous le
   nom, « 3 à remplir » devenu « 1 à remplir », « 15 Kg » devenu « 10 Kg ». La correction se voit en trois secondes. Ce que la capture fixe
   ne dit pas : combien de temps l'ancienne valeur barrée reste (les rangées Sabro et Citra passent à deux lignes), et si « ↻ 3 corrigées »
   filtre comme les autres puces (l'auteur le dit dans RESULTAT, pas la page). Mineurs.
4. **« Mon avis : D », raison et limite** — oui, la forme attendue par e-t10 (majeur n° 2 de c-captures) est tenue : « Mon avis : D — la
   dépense en 6 s, la justesse d'aujourd'hui ; mais Confirmer attend toujours la 3.8. Si B se confirme : E. Les cinq restent ouvertes. »
   La raison (6 s, justesse = A), la limite (Confirmer attend), la suite (E si B se confirme) et l'ouverture. La tête de D répète la limite
   (« La 3.8 vérifie derrière ; Confirmer l'attend »). Je ne retire pas l'avis : c'est aussi celui de m-lenteur (« Recommandation : D »).
   L'objection qu'il fera est celle que l'auteur prédit lui-même : « pourquoi Confirmer attend s'il n'y a rien à corriger ??? ». Elle est
   hors du facteur de la page (c'est la DÉCISION À PRENDRE de RESULTAT) ; la page ne la cache pas.
5. **Lisible à 390 et 1280** — oui. À 390 (`controle-page.png`, tranches) : deux colonnes, têtes alignées par subgrid (le premier passage
   du contrôle avait échoué là-dessus, corrigé), un nombre par ligne, frises et curseurs nets, vignettes ~180 px lisibles à
   l'agrandissement (`dialog`), aucun débordement ; E seule sur la dernière rangée, c'est le prix de cinq options. En-tête : ~66 mots avant
   la première image (question, avis, « 14 pièces », légende de la frise), entre c-captures (~45) et c-nom (~105, jugé lourd). À 1280
   (`controle-ordinateur.png`) : cinq colonnes, la rangée « ≈ 6 s » au premier écran et c'est elle qui porte la différence (trois écrans
   gris et vides, deux factures pleines) ; la rangée « ≈ 15 s », où B et C se distinguent de A, est sous le pli, mais la frise et « 11,0 s
   médian » le disent déjà en tête. La base est respectée : `a-06.png` est `tactile390-lecture.png` trait pour trait (nom de fichier,
   « 0,8 Mo », frise « envoi ✓ · lecture · vérification », « Les lignes arrivent ici », « Pour quoi ? après la lecture », « Règlement »,
   « Enregistrer » gris) ; les « lue » sont f3 recadré avec ses puces, TVA et Règlement (le mineur de e-t10 est corrigé). D105 sans objet :
   Dépense n'est pas dans `ecrans.json` (dit dans RESULTAT).

Aucune valeur de ses pièces : Brauhaus Ouest, 21.10.2026, 46,40 CHF, Malt Pilsner, Sabro, Citra, Levure Ale sèche, Sucre candi. Aucun nom
de la commande Brau- und Rauchshop ni de la facture Infomaniak (le mineur « CARABELGE » de e-t10 n'est pas rejoué).

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'est enfreinte au point d'empêcher son choix.

### Majeurs
1. **La tête de colonne est une rangée de tableur, et le temps qu'il attend n'y est pas plus gros que le coût à quatre décimales**
   (`index.html`, `.chiffres` ; `controle-ordinateur.png`, `controle-haut.png`). Cinq à sept nombres en mono, même corps, repliés sur deux
   ou trois lignes ; « 0,0445 CHF » est un chiffre de comptable, pas de brasseur (portrait, § 1.3 : un chiffre de méthode posé seul ne lui
   va pas ; § 6.6 : « lequel montre en plus grand ce qui compte »). Et D et E taisent le « au pire » de leur lecture finale (37,7 s, 34,3 s,
   l. 27 et l. 24 de m-lenteur) alors que « Confirmer l'attend » : il doit lire que Confirmer peut attendre 38 s (portrait, critère 4,
   l'honnêteté : « une grosse incertitude visible »).
   Correction (`outils/page.cjs`, `outils/page.css`) : par tête, une ligne forte « **6,3 s** avant l'écran · **18,5 s** avant Confirmer
   (37,7 au pire) » (A : « **18,5 s** avant l'écran (37,7 au pire) »), puis une ligne discrète « 154/165 justes · 10 fausses sans drapeau ·
   4,5 ct la pièce ». Le coût en centimes à une décimale (4,5 · 3,1 · 2,1 ct), l'exact restant dans RESULTAT. Rien d'autre ne bouge.
2. **La tête de B omet la TVA de ses déclencheurs, alors que ses chiffres la comptent** (`index.html`, B : « 8 pièces sur 14 : total, HT,
   montant de ligne, ligne sans vis-à-vis »). Les chiffres sont ceux de B2 (l. 24 : « comme B, sans quantité ni prix unitaire »), dont les
   déclencheurs sont total, HT, **TVA**, montant de ligne, lignes sans vis-à-vis ; la liste écrite est celle de B3 (l. 25, 5 pièces sur 14,
   8,6 s). L'erreur vient de VOIE.md, mais c'est la page qu'il lit, et la TVA est précisément ce qu'il a vu faux (« le ht, TVA semble pas
   super fonctionné », 01.11). L14 : chaque nombre contre sa ligne. S'il choisit B, le pilote construirait B3 en croyant construire B2.
   Correction : « 8 pièces sur 14 : total, HT, TVA, montant de ligne, ligne sans vis-à-vis. » Une ligne dans `outils/page.cjs`.
3. **Sa propre piste n'est pas sur la page** : « SI on perd à ce point en qualité avec 2 Rapid puis 1 lent autant utiliser 2 lents puis 1
   lent comme au début » (SPEC, 01.11, nuit ; citée dans VOIE.md « Ses mots »). Une page sur la lecture qui n'en dit rien lui fera écrire
   « et 2 lents puis 1 lent ??? » (portrait, § 5 : « ??? » quand une demande ancienne manque). m-lenteur ne l'a pas mesurée, et ce n'est
   pas une option de ce facteur (elle change les modèles, pas le moment) : il ne faut pas une sixième colonne sans chiffres, mais une ligne
   honnête.
   Correction : sous « 14 pièces, 1 tirage : un indice », une ligne : « « 2 lents puis 1 lent » n'est pas ici : non mesuré, et chaque 3.8
   ajoute ≈ 12 s (de 4,8 à 29,1 s selon la pièce) ; la justesse d'aujourd'hui tient (154/165), la condition « si on perd » n'est pas
   remplie. » Les nombres sont l. 31 et l. 47 de m-lenteur.

### Mineurs
- `d-06.png`, `d-lue.png` (et E) : les cadres bleus autour du fil, de « Lectures ●●◌ », de « Confirmer » et de « 3 corrigées » ne sont
  expliqués nulle part sur la page. La convention « cadre bleu : ce qui change » a servi dans `choix-nom` et `choix-captures`, il la
  connaît ; mais ici le bleu est aussi la couleur « provisoire » de la frise et des cellules corrigées, et trois cadres sur un même écran
  peuvent passer pour le dessin. Ajouter à la légende de la frise « cadre bleu : ce qui est neuf », ou ôter les cadres (le fil, la roue et
  les cellules bleues se comprennent seuls).
- Têtes A et B : « 10 sans drapeau », « 7 sans drapeau » ; C : « 22 sans drapeau » ; D : « 22 fausses sans drapeau ». Harmoniser sur
  « fausses sans drapeau » : seul, « sans drapeau » ne dit pas que la valeur est fausse.
- `d-lue.png` : l'ancienne valeur barrée sous le nom passe Sabro et Citra à deux lignes. La capture ne dit pas si c'est l'instant de
  l'arrivée ou l'état durable ; « compact » (D275) voudrait l'ancienne valeur à un toucher de la cellule bleue après quelques secondes.
  Dire « à l'arrivée » dans le titre de la vue (« Lue · à l'arrivée de la 3.8 ») ou laisser.
- `d-lue.png` : « ↻ 3 corrigées » filtre comme les autres puces (RESULTAT) ; la page ne le dit pas. Un mot dans la tête de D suffit (« la
  puce filtre »), ou rien : il le découvrira au doigt.
- `d-15.png`, `e-15.png`, `b-15.png` : le badge « = 6 s » / « = A · lue » / « = D · lue » couvre l'icône document de l'en-tête de la
  vignette. Décaler le badge sous la barre de titre.
- Frise : « 0 → 40 s » est une échelle, pas une mesure (RESULTAT le dit, la page non). Sans conséquence : le curseur et les repères
  « ≈ 6 s », « lue · 18,5 s » portent les valeurs.
- Trois « Pendant la lecture » identiques en rangée 1 (A, B, C) et deux « Provisoire » identiques (D, E) : c'est la vérité du facteur, et
  les « = A » / « = D » grisés l'assument. À ne pas lire comme D38.

## Ce que je prédis qu'il dira

« D évidemment, je vois ma facture tout de suite et je vérifie pendant que ça finit. Mais pourquoi Confirmer attend 18 s s'il y a rien à
corriger ??? E si c'est pareil en plus rapide. C non, 22 erreurs sans drapeau c'est pas fiable. Et 2 lents puis 1 lent, c'était quoi au
final ? »

Avis par option, comme lui :
- **A** : « c'est ça le problème, 18 s à regarder une barre » — la colonne fait son travail ; la vue 15 s « = 6 s » est sa plainte.
- **B** : « pas mal, mais à confirmer » — mitigé ; il lira « à confirmer par 2 tirages de plus » et demandera la passe.
- **C** : « non, pas fiable » — rejetée par le « 22 sans drapeau » en rouge et « 3 à remplir » ; c'est le contraire de « très fiable ».
- **D** : « très bien » — probable, avec le « mais » sur Confirmer. Il aimera « 3 corrigées » et les valeurs barrées (« comme le jaune, je
  vois ce qui a changé »).
- **E** : « E si B tient » — prise avec D. À signaler au pilote : D maintenant, E après la passe de confirmation de B2 (≈ 1,25 CHF,
  m-lenteur l. 59 à 61) est la combinaison probable, et sa question sur « Confirmer qui attend » ouvre un choix de parcours (bloquer, ou
  laisser confirmer avec les valeurs provisoires marquées) qui n'est pas sur cette page.

## Pour le pilote
Publier après les trois majeurs (têtes : hiérarchie des nombres, « au pire » de la lecture finale de D et E, coût en centimes ; « TVA »
dans la tête de B ; une ligne sur « 2 lents puis 1 lent »), tout dans `choix-lenteur/outils/page.cjs` et `page.css`, sans toucher aux
maquettes ni aux captures ; puis rejouer `controle-page-choix.mjs --min=3` et `verifier-page.mjs --page-lot`, et rouvrir
`controle-haut.png` et `controle-ordinateur.png`. Si le pilote publie sans retouche, la page reste utilisable : il choisira D quand même,
mais il demandera les 38 s au pire et sa piste « 2 lents ».

LEÇON PROPOSÉE : aucune.
