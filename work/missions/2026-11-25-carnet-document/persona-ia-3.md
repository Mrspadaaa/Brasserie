# Persona ia, itération 3 : un spécialiste des carnets assistés par IA (Notion AI, Reflect, Craft, Granola)

Je ne suis pas le brasseur. Mes questions restent les mêmes. L'IA aide-t-elle vraiment (classer, conseiller, corriger) ? Voit-on ce qu'elle a fait ?
Peut-on lui faire confiance, et l'annuler ? Que se passe-t-il quand elle se trompe ou qu'elle n'est pas là ?
J'ai ouvert les 53 captures distinctes de `cap/`, une par une : M1 13, M2 13, M3 13, M4 14. Les 7 copies ont été vérifiées par md5 :
`m1-avant` = `note`, `m1-apres` = `cherche`, `m1-annuler` = `change`, `m3-avant` = `note`, `m3-apres` = `range`, `m4-avant` = `noter`, `m4-apres` = `range`.
Lus : `CORRECTION-2.md`, `corrections/c2-m1..m4.md`, le carnet réel `tests/fixtures/c79/zz-ecoulement-qui-fuit.json`,
et la lecture locale de l'app (`src/domain/carnets/analyseLocale.ts`, fonctions `genreLocal` et `etiquettesLocales`).

Légende : **B** bloquant (la confiance ou l'annulation cassent, l'IA contredit ou falsifie le fil, l'état sans IA manque ou ment), **m** mineur, **D** doute (non compté).

## Bilan de la correction 2
Les 3 bloquants de l'itération 2 sont corrigés : la dalle n'est plus jamais tranchée. Elle reste « ? à vérifier » partout dans M2, M3 et M4 (jeton, option, feuille, relecture).
Les communs C1 (erreur en ligne), C3 (attente et annulation de l'envoi) et C4 (noter sans IA) sont corrigés dans les 4 maquettes.
C2 (une citation qui blanchit une inférence) est corrigé en grande partie : « l'IA, pas tes notes », les guillemets et le « pour lui ? » de M2. Il en reste des traces dans chaque maquette.
Sur les 31 problèmes de l'itération 2 :
- 26 sont corrigés ;
- 4 le sont en partie (C2, une fois par maquette) ;
- 1 est corrigé mais remplacé par un bloquant (M3 8, le hors ligne).

Le doute de M1 sur le hors ligne est devenu un bloquant (voir C5).

## Ce que la lecture locale sait faire (vérifié dans le code et dans le carnet réel)
- Le carnet réel montre ce que la lecture locale a produit (`rangement: "locale"`) :
  - « Devis attendu. » est rangé `genre: "a-acheter"`, parce que le mot « devis » déclenche « à acheter » dans `genreLocal` ;
  - « Estimation 150 CHF (exemple). » est devenu un article d'achat, pas une note.
- `etiquettesLocales` ne sait poser que quatre choses : un montant (coût ou devis), « pas trouvé », « contacté » et « piste ».
  « Estimé » n'est posé que devant « ≈ », « environ », « env. », « ca. », « à peu près » ou « autour de ». « Estimation » n'en fait pas partie.
  Il n'existe aucune règle pour « trouvé » seul, « usé », « attendu » ou « à vérifier », ni aucune option ou tâche.
- Sur ce carnet, la lecture locale peut donc dire aujourd'hui « pas trouvé » (note dalle) et « coût 150 CHF » (sans « estimé »), et elle dit à tort « à acheter » pour le devis.
  « Estimation » et « attendu » se règlent par deux motifs. Tirer « Changer le joint » de « trouvé usé », ou lister des options, demande un raisonnement : ce n'est plus une lecture par mots.

## Communs (comptés dans chaque maquette concernée)
- **C5 · Le repli « lu par l'app » promet ce que l'app ne sait pas faire.** M1, M2 et M3 montrent hors ligne :
  - les jetons « ✓ joint usé », « devis attendu » et « 150 CHF estimé » ;
  - « Options lues dans tes notes » ;
  - « Tâche ? Changer le joint du siphon · Garder ».

  La lecture locale réelle met « à acheter » sur le devis, ne marque pas « estimé » et ne propose aucune tâche.
  Le brasseur choisira un hors ligne qui, une fois construit, sera vide ou faux. Le pire endroit pour mentir, c'est l'état où l'IA n'est pas là.
  M1 et M3 se contredisent même entre deux de leurs propres captures : leur feuille « Changé par l'IA » corrige « à acheter → devis attendu » (l'erreur de la lecture locale), alors que leur hors ligne fait dire « devis attendu » à cette même lecture.
  Le bon modèle est `m4-sans-ia` : la dernière vue de l'IA, datée, puis sa note citée, et « L'IA te le proposera au retour du réseau ». (B pour M1, M2 et M3 ; m pour M4, voir plus bas)
- **C6 · Des notes ajoutées par les concepteurs, sans marque.** Le carnet réel contient 6 notes (dont « Écoulement qui fuit », devenue le titre) et le message « Estimation 150 CHF ».
  Il n'a ni photo, ni lien collé, ni décision, ni tâche, et son seul événement est « Noté → Je cherche », posé par lui le 25 nov. à 13:22.
  Chaque maquette ajoute pourtant une photo, un lien et 2 à 4 notes de suite (samedi, joint changé, plus de flaque), sans dire que c'est une suite imaginée.
  M1 marque ses notes 9 et 10 « (exemple) ». Or c'est sa propre marque de test : elle figure déjà dans ses vraies notes. Elle ne distingue donc pas un ajout d'une note réelle.
  Une relecture qui affiche « tes mots » sur des mots qu'il n'a pas écrits fait douter de toute la maquette. (m, M1 à M4)
- **C2 (reste).** Il demeure une trace par maquette ; elle est détaillée dans chacune.

## M1 · Le carnet se range : 6 problèmes, dont 1 bloquant
Itération 2 :
- **7 corrigés** :
  - 1, C1 : `m1-erreur`, « L'IA n'a pas pu ranger · délai dépassé », « Tes 8 notes sont gardées, rien n'a changé », Réessayer ;
  - 3 : la relecture écrit l'IA en violet, et la flaque est citée en n10 ;
  - 4 : « n4 « Contacter l'entreprise X » : n'a pas servi » (`m1-resoudre`, `m1-resolu`) ;
  - 5 : un seul geste par état, Retenir puis « Garder la tâche » (« Vient avec ① », sans bouton), et la feuille ne coche plus la tâche ;
  - 6 : « En réserve, si la flaque reste » ;
  - 7 : la pastille 6 de Ranger compte toutes les notes ;
  - 8 : le robinet et l'étagère sont retirés de l'achat.
- **1 en partie**, 2 (C2) : « quelques francs (l'IA, pas tes notes) » est juste. Mais voir le problème 2 ci-dessous.
- Le doute de l'itération 2 sur le hors ligne devient le bloquant 1.

Nouveaux :
1. **B** C5. `m1-hors-ligne` propose « Options lues » et « Tâche ? Changer le joint du siphon » avec un bouton Garder plein, et pose les jetons « devis attendu » et « 150 CHF estimé ».
   La même maquette, dans `m1-annuler`, montre que la lecture locale avait mis « à acheter » (« Devis : à acheter → attendu »).
   `m1-erreur` montre un autre repli, plus court (4 jetons, sans options), pour la même lecture locale. Captures : `m1-hors-ligne`, `m1-erreur`, `m1-annuler`.
2. **m** C2. À la relecture, la raison 3 est « le sanitaire : « Estimation 150 CHF » n7 », sous « tes mots, pas réécrits ».
   Il n'a jamais donné ce coût comme raison. Sa raison est la note 9, et attribuer l'estimation au sanitaire est une inférence.
   Au résolu, « fait 28 nov. » est déduit de « samedi » (n10), sans source. Captures : `m1-relire`, `m1-resolu`.
3. **m** Correction fantôme : la feuille « Devis : à acheter → attendu » corrige une étiquette que `m1-avant` ne montre jamais. Il faut l'afficher sur n5 avant le rangement (« à acheter · lu par l'app »), ou ne pas la lister. Captures : `m1-avant`, `m1-annuler`.
4. **m** Hors ligne, « 8 notes attendent le réseau · Annuler l'envoi » mélange la synchronisation et l'IA. Toucher Annuler retire-t-il les notes du serveur, ou seulement de l'IA ?
   M2 le dit bien : « 1 envoi à l'IA attend le réseau ». Capture : `m1-hors-ligne`.
5. **m** « Je cherche ? » est proposé en pointillé dans la frise, sans geste pour l'accepter, et il ne figure pas parmi les 7 changements de la feuille.
   Il est franchi ensuite dans `m1-decide` : on ne sait pas qui l'a posé. Dans le carnet réel, c'est lui, le 25 nov. Captures : `m1-apres`, `m1-annuler`, `m1-decide`.
6. **m** C6 :
   - la photo n6 et le lien n8 ne sont pas marqués ;
   - n9 et n10 portent « (exemple) », sa propre marque ;
   - n1 porte 21:18, l'heure du titre (la note réelle est de 21:26), et n7 porte 21:30 au lieu de 21:26.
   Captures : `m1-avant`, `m1-decide`, `m1-resoudre`.
- **Ce qui est juste.**
  - L'attente annonce ce qu'elle fait (« L'IA lit tes 8 notes · 3 s », Arrêter).
  - L'erreur dit « rien n'a changé ».
  - La raison est sa note 9 (« = ta raison »).
  - La date est tirée de « samedi » n9.
  - « Résolu ? » est proposé d'après sa note 10, avec 3 cases défaisables.
  - La relecture se termine par « Mes 10 notes, dans l'ordre où je les ai tapées ».
- **Parcours** : noter vite oui (Ajouter) ; trouvé / pas trouvé oui ; devis oui ; coût oui (+ Noter le coût) ; options oui ; décider oui ; tâche oui ; résoudre oui ; relire pourquoi oui (avec une raison de l'IA en plus) ; carnet non-problème oui (achat). Attente, erreur et hors ligne sont dessinés, mais le hors ligne est faux (B1).
- **Note : 7,5/10** (8 avant). Le cycle reste excellent, mais le repli promet ce que l'app ne sait pas faire.

## M2 · La fiche au-dessus : 3 problèmes, dont 1 bloquant
Itération 2 :
- **7 corrigés** :
  - B1 : « ? dalle · à vérifier » partout, puis « ? dalle pas vérifiée, pas eu besoin » au résolu ;
  - C1 : `m2-erreur` ;
  - C3 : `m2-attente` (« Rangement · 3 s · Arrêter », « gardée · envoyée à l'IA ») et « 1 envoi à l'IA attend le réseau · Annuler l'envoi » ;
  - 5 : « Pourquoi ? Touche tes mots » ;
  - 6 : « 150 CHF estimé » sans IA ;
  - 7 : la case « Devis attendu » décochée retire bien son jeton derrière la feuille (`m2-annuler`) ;
  - C4 : la flèche Ajouter.
- **1 en partie**, C2 : « « Estimation 150 CHF » n°6, pour lui ? » et « une pièce · l'IA, pas tes notes » sont exemplaires. Voir le problème 2 ci-dessous.

Nouveaux :
1. **B** C5. `m2-sans-ia` pose « ✓ joint du siphon usé », « devis attendu » et « 150 CHF estimé », puis « Options lues dans tes notes : joint du siphon · sanitaire », et « Tâche ? Changer le joint du siphon » avec un bouton Garder plein.
   Rien de cela ne sort de la lecture locale : elle met « à acheter » sur le devis et ne pose pas « estimé ». Capture : `m2-sans-ia`.
2. **m** C2. Le jeton de raison « « 150 CHF » n°6 » coupe « Estimation » : touché, il ferait de sa raison un prix.
   À la relecture, « devis jamais reçu n°5 » cite la note 5 pour un fait qu'elle ne dit pas (elle dit « attendu ») ; l'absence d'une note n'est pas une source.
   Captures : `m2-decide`, `m2-relire`.
3. **m** C6 :
   - la photo sur n1 n'est pas marquée (le carnet réel n'en a pas) ;
   - n7 « Je change le joint moi-même samedi. » et n8 « Joint changé. Trois nettoyages, plus de flaque. » sont présentées comme ses notes ;
   - le mémo « Sol époxy » est inventé.
   Captures : `m2-avant`, `m2-tache`, `m2-resoudre`, `m2-memo`.
- D : dans `m2-decide`, « ✓ « trouvé usé » n°2 » est déjà coché. Si c'est l'IA qui le présélectionne, la raison redevient la sienne. La capture ne dit pas si c'est lui qui l'a touché.
- D : `m2-erreur` n'a pas de repli, alors que le hors ligne en a un. C'est plus honnête, mais incohérent.
- **Ce qui est juste.**
  - « Proposé · rien n'est posé sans toi » avec deux cases.
  - La feuille « Décoche : la fiche derrière revient à l'avant », et l'aperçu suit la case.
  - « Fermé par toi · 29 nov. · proposé par l'IA, d'après ta note n°8 », avec Rouvrir.
  - La relecture est nommée en clair (Retenu, En réserve, ? Pas vérifié, Résultat) et indique « trouvé par « siphon » ».
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui ; coût oui (+ Noter) ; options oui ; décider oui (Touche tes mots) ; tâche oui (date de sa note n°7) ; résoudre oui ; relire pourquoi oui (sa raison) ; carnet non-problème oui (mémo).
- **Note : 8/10** (7 avant).

## M3 · Dans la marge : 6 problèmes, dont 1 bloquant
Itération 2 :
- **7 corrigés** :
  - B1 : « dalle pas trouvée (3) », et à la relecture « raison 2 : cherchée, pas trouvée » ;
  - C1 : `m3-erreur` (« pas de réponse en 20 s · Tes 6 notes sont gardées ») ;
  - C3 : `m3-attente` (Arrêter), et « en file pour l'IA · Annuler l'envoi » sous la note ;
  - 5 : le jeton dit « ✓ joint du siphon usé » ;
  - 6 : la photo reste sous sa note 6 ;
  - 7 : « devis : jamais reçu, plus utile » ;
  - C4 : la touche ↑.
- **1 en partie**, C2 : « pour le sanitaire » et « cher » sont retirés. Voir le problème 2 ci-dessous.
- **1 remplacé**, 8 : hors ligne, « à acheter » devient « devis attendu », et c'est justement le bloquant 1.

Nouveaux :
1. **B** C5. `m3-hors-ligne` remplit la marge en gris (« trouvé », « option : sanitaire », « devis attendu », « estimé ») et pose les jetons, « Options lues » et « Tâche ? Garder ».
   La feuille de la même maquette écrit « Décoché : revient à « à acheter » (lu par l'app) ». C'est vrai, c'est ce que l'app lit, mais cela contredit son propre hors ligne.
   `m3-erreur` remplit aussi la marge par la lecture locale. Captures : `m3-hors-ligne`, `m3-erreur`, `m3-annuler`.
2. **m** C2. « coût de Ⓑ » est posé sur sa note 6 sans « ? » : que l'estimation concerne B est une inférence. Puis « coût de Ⓑ évité » : B est « pas eu besoin », pas évité, puisqu'il reviendrait si la flaque revient.
   Captures : `m3-decide`, `m3-tache`, `m3-resolu`.
3. **m** Le pourquoi est choisi par l'IA, et mêle les raisons aux résultats :
   - à la décision : « pourquoi, d'après tes notes : … « Estimation 150 CHF » (6) » ;
   - à la relecture : « Pourquoi « joint, toi-même » · tes mots, pas réécrits » cite les notes 8 et 9, écrites après la décision du 25 nov.
   Ce sont bien ses mots, mais pas ses raisons. La greffe « sa raison, c'est sa note » (M1, M2, M4) n'est pas faite. Captures : `m3-decide`, `m3-relire`.
4. **m** Derrière la feuille, la case « « à acheter » → devis attendu » est décochée, mais le jeton « devis attendu » reste en tête : l'aperçu ne suit pas la case. Capture : `m3-annuler`.
5. **m** « Proposé : passer à « Je cherche », une cause est trouvée (2) », alors que la marge de la note 2 dit « cause probable ». La proposition est plus sûre que le détail. Capture : `m3-range`.
6. **m** C6 :
   - la photo et le lien ne sont pas marqués ;
   - n7 « Je le change samedi. », n8 « Joint changé, 12 CHF la pièce. » et n9 sont présentées comme ses notes.
   Captures : `m3-note`, `m3-tache`, `m3-resoudre`.
- D : la feuille liste « « à acheter » → devis attendu », alors que `m3-note` ne montre aucune étiquette avant le rangement. « (lu par l'app) » explique l'origine, mais on ne l'a pas vue.
- **Ce qui est juste.**
  - La marge reste la meilleure trace de lecture : chaque ligne lue porte un trait, et la feuille propose « Version de 21:29 ».
  - La relecture cite ses notes entières, entre guillemets.
  - L'achat est honnête (« pour quand : pas dit », « largeur de A et B : dans aucune note »).
  - Le résolu dit « Ce qui a marché », avec ses notes 8 et 9 citées, et propose « Rouvrir si la flaque revient ».
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui ; coût oui (coût réel 12 CHF) ; options oui ; décider oui ; tâche oui (date de sa note 7) ; résoudre oui ; relire pourquoi en partie (raisons choisies par l'IA, résultats compris) ; carnet non-problème oui (achat).
- **Note : 7/10** (6,5 avant).

## M4 · Deux vues : 7 problèmes, dont 0 bloquant
Itération 2, **5 corrigés** et 1 en partie, plus les 2 doutes :
- B1 : le « ? » ambre est partout. « Si ça revient : la dalle est toujours à vérifier » ;
- C1 : `m4-erreur`, « Tes 6 notes et ton lien sont gardés » ;
- C3 : `m4-attente` (« L'IA lit tes 6 notes et ton lien », Arrêter), et Retirer hors ligne (voir le problème 6) ;
- 5 : la correction fantôme est retirée ;
- C4 : la touche Ajouter ;
- les deux D sont levés en partie : « Te resservira pour » est retiré ; « Tout garder » reste discuté au problème 7 ;
- **en partie**, C2 : « quelques CHF · l'IA, pas tes notes » est juste. Voir le problème 5 ci-dessous.

Nouveaux :
1. **m** C5, en partie. `m4-sans-ia` est le seul repli honnête des 4 : il montre la vue de l'IA datée (« Vue du 28 nov. à 10:05 »), cite sa note 9, puis « Résolu ? L'IA te le proposera au retour du réseau ».
   Mais `m4-erreur` fait dire à la lecture locale « ✓ Joint du siphon « trouvé usé » » et « ? Sous la dalle · à vérifier », qu'elle ne sait pas poser. Elle ne connaît que « pas trouvé ». Capture : `m4-erreur`.
2. **m** C6, et une inférence de l'IA blanchie par une note inventée. La note 7 ajoutée, « Je change le joint moi-même samedi, **c'est quelques francs** », lui fait répéter l'estimation de l'IA (« quelques CHF · l'IA, pas tes notes »).
   La relecture l'affiche ensuite en « tes mots · ta raison ». « Ta photo · 21:26 » lui attribue une photo que le carnet n'a pas. Captures : `m4-noter`, `m4-decide`, `m4-relire`.
3. **m** Le chemin contredit le carnet réel : « 24 nov. 21:27 · Je cherche » (proposé par l'IA, gardé) et « 24 nov. 21:40 · Décidé ».
   Or c'est lui qui est passé de Noté à Je cherche, le 25 nov. à 13:22 : le 25, il n'avait donc pas encore décidé. Capture : `m4-resolu`.
4. **m** « Ce que tu savais alors » contient « devis jamais reçu », qu'il n'a su qu'après. C'est un anachronisme dans la section même qui promet l'état passé. Capture : `m4-relire`.
5. **m** C2 :
   - le conseil « il est usé, c'est une pièce » est cité « notes 1, 2, 4 », alors que « c'est une pièce » vient du savoir de l'IA ;
   - « **150 CHF** « Estimation » note 6 » est attribué en gras à « Le sanitaire change le joint », sans « ? », alors que M2 demande « pour lui ? ».
   Captures : `m4-options`, `m4-decide`.
6. **m** Hors ligne, « Ta note 9 est gardée ; elle part à l'IA au retour du réseau · **Retirer** » : retirer la note, ou seulement l'envoi ? Il faudrait « Ne pas envoyer ». Capture : `m4-sans-ia`.
7. **m** « 3 à garder » s'affiche alors qu'il y a 4 cases : celle des options est déjà cochée, les 3 autres non. Que garde « Tout garder », et qui a coché les options ? Capture : `m4-range`.
- **Ce qui est juste.**
  - Le meilleur repli (`m4-sans-ia`).
  - Les notes lues sont marquées d'un trait et d'une étiquette, sans un mot réécrit (`m4-notes-lues`).
  - « Rangé à 21:41 · ta note 7 lue ».
  - « Cocher la tâche ? « Joint changé. » ta note 8 ».
  - Le conseil d'après : « regarde si la flaque revient, et note-le : je te proposerai de fermer le carnet, ou la piste de la dalle ».
  - « Résolu par toi le 30 nov. à 09:13 ».
  - La feuille indique « la note source s'ouvre d'un toucher » et « Avant l'IA · 21:26 ».
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui (« Ne plus attendre le devis ? ») ; coût oui (+ Noter) ; options oui ; décider oui ; tâche oui ; résoudre oui ; relire pourquoi oui (« Ce que tu savais alors », sauf le problème 4) ; carnet non-problème oui (mémo).
- **Note : 8,5/10** (7,5 avant).

## Pour la correction 3 (greffes proposées)
- **Le repli de M4 vers M1, M2 et M3.** Hors ligne, montrer la dernière vue de l'IA, datée, plus la note nouvelle citée, et « l'IA te le proposera ».
  Avant tout rangement, le « lu par l'app » ne pose que ce que `etiquettesLocales` sait faire : « pas trouvé », le montant, « contacté ».
  Plus de « Tâche ? » ni d'« Options lues » sans IA. Si l'on veut « estimé » et « devis attendu », c'est un ticket de code (deux motifs), à écrire avant de les dessiner.
- **Marquer la suite imaginée.** Un filet ou une étiquette « suite imaginée » sur toute note, photo ou lien que le carnet réel n'a pas, jamais « (exemple) ».
  Retirer « c'est quelques francs » de la note 7 de M4, et « ta photo » là où il n'y a pas de photo.
- **La raison, c'est sa note**, aussi dans M3 : séparer « pourquoi » (les notes d'avant la décision) et « ce qui a marché » (les notes d'après).
- **Une source dit ce qu'elle dit.** Plus de « jamais reçu n°5 », plus de « coût de B » sans « ? », plus de note datée après coup dans « ce que tu savais alors ».

persona-ia-3 : M1 6 (B 1) 7,5/10 ; M2 3 (B 1) 8/10 ; M3 6 (B 1) 7/10 ; M4 7 (B 0) 8,5/10 ; B total 3
