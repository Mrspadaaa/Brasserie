# Persona ia, itération 4 (finale) : un spécialiste des carnets assistés par IA (Notion AI, Reflect, Craft, Granola)

Je ne suis pas le brasseur. Mes questions restent les mêmes. L'IA aide-t-elle vraiment (classer, conseiller, corriger) ? Voit-on ce qu'elle a fait ?
Peut-on lui faire confiance, et l'annuler ? Que se passe-t-il quand elle se trompe ou qu'elle n'est pas là ?

J'ai ouvert les 53 captures distinctes de `cap/`, une par une : M1 13, M2 13, M3 13, M4 14. Toutes datent de la correction 3 (18:20 à 18:24).
Les 7 copies ont été vérifiées par md5 : `m1-avant` = `note`, `m1-apres` = `cherche`, `m1-annuler` = `change`, `m3-avant` = `note`, `m3-apres` = `range`, `m4-avant` = `noter`, `m4-apres` = `range`.
Lus : `CORRECTION-3.md`, `corrections/c3-m1..m4.md`, le carnet réel `tests/fixtures/c79/zz-ecoulement-qui-fuit.json`, `src/domain/carnets/analyseLocale.ts`
(`etiquettesLocales` et ses motifs, l. 540 à 570) et le libellé que l'app donne à la sorte `pas-trouve` (`src/ui/carnets/filRegles.ts:77` : « pas trouvé »).

Légende : **B** bloquant (la confiance ou l'annulation cassent, l'IA contredit ou falsifie le fil, l'état sans IA manque ou ment), **m** mineur, **D** doute (non compté).

## Bilan de la correction 3
Les 3 bloquants de l'itération 3 (C5, le repli qui promettait ce que l'app ne sait pas faire) sont corrigés dans M1, M2 et M3.
Le modèle de M4 a été repris : dernière vue de l'IA datée, note nouvelle citée, « l'IA te le proposera ».
Plus aucune maquette ne pose hors ligne une option, une tâche, « devis attendu » ou « estimé ».
C6 (suite imaginée sans marque) est corrigé presque partout : bandeaux, n° en pointillé, étiquettes « imaginée ». Il n'en reste qu'une trace, dans M2.
Sur les 22 problèmes de l'itération 3 :
- 21 sont corrigés ;
- 1 l'est en partie (M2 3, C6 : la décision imaginée reste sans marque).

Aucun bloquant nouveau.

## Ce que la lecture locale sait poser sur ce carnet (vérifié)
- `etiquettesLocales` travaille par message. Sur les 6 messages du carnet, elle pose deux choses :
  - « pas trouvé » sur le message « Pistes : joint du siphon trouvé usé ; fuite sous la dalle, pas trouvée. » ;
  - « coût 150 CHF », sans `estime`, sur « Estimation 150 CHF (exemple). ». « Estimation » n'est pas dans le motif `ESTIME`.
- Elle ne pose pas « contacté » sur « Contacter… » (`MOT_CONTACTE` exige « contacté »). Elle ne pose rien sur « Devis attendu. », qui n'a pas de montant.
- Le libellé affiché par l'app est « pas trouvé », jamais « ? à vérifier ».
- `m2-sans-ia`, `m2-erreur`, `m3-erreur` et `m4-erreur` montrent exactement ces deux lectures, et rien d'autre.
  `m3-hors-ligne` ajoute « coût 12 CHF · lu par l'app » sur la note 8 imaginée (« 12 CHF la pièce »), ce qui est juste aussi.
  `m1-hors-ligne` dit « Lu par l'app : rien à marquer » pour la note 9, ce qui est juste. `m1-erreur` déborde (voir M1 1).

## Communs (doutes, non comptés)
- D : le carnet réel range « Estimation 150 CHF (exemple). » en article (`effets: ["article"]`), pas en note. Les 4 maquettes en font la note 6.
  C'est une simplification acceptable pour la maquette, mais au port, la note 6 sera un article.
- D : « pas trouvé » est posé par message. Les maquettes le rattachent à la note 3, alors que le message réel couvre aussi la note 2.
  Le rendu attendu est plausible ; le port devra le décider.
- D : « Devis attendu » rangé `a-acheter` par `genreLocal` reste un défaut de l'app. Les maquettes ne le montrent plus, sauf la ligne verrouillée de M2. C'est un ticket de code, pas un dessin.

## M1 · Le carnet se range : 2 problèmes, dont 0 bloquant
Itération 3 : **6 corrigés sur 6**.
- B1, C5 : `m1-hors-ligne` montre « vue de l'IA · 24 nov. 21:31 », puis la note 9 sous « Pas encore lue par l'IA », puis « Lu par l'app : rien à marquer ».
  Il ajoute « Retenir, tâche, date : l'IA te les proposera au retour du réseau ». Plus d'options lues, plus de « Tâche ? ».
- 2, C2 : la raison est la note 9 seule. Ensuite, « fait sam. 28 nov. · « Joint changé samedi » 10 » est sourcé (`m1-relire`, `m1-resolu`).
- 3 : la ligne fantôme « à acheter → attendu » est retirée.
- 4 : « 1 envoi à l'IA attend le réseau · Annuler l'envoi », puis « Annuler l'envoi garde ta note ».
- 5 : la case « Je cherche ? » est dans la frise et dans la feuille (« Proposé, pas posé »). Le chemin dit « Je cherche 25 nov., par toi », comme le carnet réel.
- 6, C6 : les n° 7 à 10 sont en pointillé jaune, avec des bandeaux sur chaque état. Ses notes sont toutes à 21:26.

Nouveaux :
1. **m** `m1-erreur` : le bloc « Lu par l'app » affiche « n3 · pas trouvée · **? à vérifier** ».
   « ? à vérifier » est une lecture de l'IA, pas de `etiquettesLocales`, que l'app libelle « pas trouvé ». C'est le seul repli des 4 maquettes qui déborde.
   Capture : `m1-erreur`.
2. **m** `m1-hors-ligne` : la « vue de l'IA » datée n'est pas la vue de l'IA.
   - Elle perd le jeton « 150 CHF estimé n6 » ;
   - les options perdent leurs sources et le doute « pour lui ? ».
   Hors ligne, il voit une version raccourcie, sans le dire. Il faut montrer ce que l'IA a laissé, tel quel ou replié, mais pas élagué. Captures : `m1-hors-ligne`, `m1-apres`.
- D : « Devis attendu. » → « demandé, pas reçu » (`m1-cherche-bas`, `m1-tache`). « Demandé » est déduit, mais c'est le sens de « attendu ».
- D : dans `m1-achat`, « 349 CHF lu sur la page » et « La page donne 62 cm » : la lecture de la page n'est pas datée. Le carnet est imaginé en entier.
- **Ce qui est juste.**
  - La feuille « Par l'IA, 24 nov. à 21:31 · 7 » : « défaire ne remet jamais une lecture fausse ». Elle dit aussi « défait : tes mots seuls, sans marque ».
  - Le compte est le même partout : la puce, 6 « Fait » et 1 « Proposé ».
  - La relecture sépare « Pourquoi ce choix » (n9), « Ce que tu savais alors · 24 nov. » (n2, n3, n5, ses mots) et « Ce qui a marché · 3 déc. » (n10).
  - Le chemin réel, et « Résolu par toi le 3 déc. ».
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui ; coût oui (+ Noter le coût) ; options oui ; décider oui ; tâche oui (date « samedi » n9) ; résoudre oui ; relire pourquoi oui ; carnet non-problème oui (achat). Attente, erreur et hors ligne sont dessinés et honnêtes, à un libellé près.
- **Note : 8,5/10** (7,5 avant).
- **Verdict** : le cycle le plus complet ; reste à aligner l'erreur et le hors ligne sur la lecture locale exacte.

## M2 · La fiche au-dessus : 2 problèmes, dont 0 bloquant
Itération 3 :
- **2 corrigés** :
  - B1, C5 : `m2-sans-ia` et `m2-erreur` ne montrent que « pas trouvée » (n°3) et « 150 CHF » (n°6), chacun avec la note citée.
    Ils ajoutent « Trouvé, devis, options, tâche : l'IA te les proposera ». C'est le repli le plus exact des 4 ;
  - 2, C2 : la raison se touche dans ses notes (« n°2, touchée par toi », « ✓ ta raison »). En relecture, la source est « « Devis attendu. » n°5 », et non plus « jamais reçu ».
- **1 en partie**, 3, C6 : la photo est retirée. Les notes 7 et 8 sont sous un filet « imaginé pour la maquette » et le mémo porte un bandeau. Mais voir le problème 1 ci-dessous.
- Les 2 D sont levés : la raison est « touchée par toi », et l'erreur a le même repli que le hors ligne.

Nouveaux :
1. **m** C6 (reste). `m2-decide` n'a pas de bandeau, alors qu'il montre « Décidé · toi, 25 nov. » et « Retenu… n°2, touchée par toi ».
   Le carnet réel n'a aucune décision : il est en « Je cherche » depuis le 25 nov. à 13:22. On met dans sa main un geste qu'il n'a pas fait, et rien ne le signale sur cet état.
   Les bandeaux de `m2-tache` et suivants ne nomment que les notes 7 et 8, jamais la décision. Captures : `m2-decide`, `m2-tache`.
2. **m** L'IA devance le choix. `m2-apres` propose « Je cherche » et « Tâche : changer le joint », puis « Garder les 2 », avant qu'aucune option ne soit retenue.
   Garder crée la tâche de l'option conseillée, sans décision. M4 a corrigé ce même point : chez lui, la tâche n'est proposée qu'après Retenir. Captures : `m2-apres`, `m2-decide`.
- D : la feuille (`m2-annuler`) verrouille « Devis attendu · l'app lisait « à acheter » · corrigé, pas de retour ».
  C'est vrai (le carnet réel porte `genre: "a-acheter"`), mais aucun état n'a montré « à acheter ». La règle « pas de retour vers une valeur fausse » est tenue.
- D : l'option « Sanitaire pour le joint » (`m2-options`, `m2-relire`). La note 4 dit « pour un sanitaire », et « pour le joint » est de l'IA.
- D : seul le hors ligne d'avant le premier rangement est dessiné. Le hors ligne avec une fiche déjà là (dernière vue datée) manque.
- **Ce qui est juste.**
  - La case décochée de la dalle fait revenir le jeton à « dalle pas trouvée n°3 » derrière la feuille : l'aperçu suit.
  - Les cadenas disent pourquoi il n'y a pas de retour.
  - « fermé par toi · proposé par l'IA, d'après la note n°8 », puis Rouvrir.
  - Le mémo est imaginé et marqué.
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui ; coût oui (+ Noter) ; options oui ; décider oui (touche ta note) ; tâche oui (date de la note 7, imaginée) ; résoudre oui ; relire pourquoi oui (sa raison n°2) ; carnet non-problème oui (mémo).
- **Note : 8,5/10** (8 avant).
- **Verdict** : replis exemplaires et fiche honnête ; la décision imaginée doit être marquée, la tâche attendre le choix.

## M3 · Dans la marge : 3 problèmes, dont 0 bloquant
Itération 3 : **6 corrigés sur 6**, et le D est levé.
- B1, C5 : `m3-hors-ligne` montre « marge de l'IA du 25 nov. · 13:40 », puis « coût 12 CHF · lu par l'app » pour la note 8, et « tâche faite ? L'IA te le proposera ».
  `m3-erreur` ne montre que « pas trouvée · n°3 » et « coût 150 CHF · n°6 », en gris.
- 2, C2 : « une estimation, pour le sanitaire ? » ; « évité » est retiré.
- 3 : la raison est « ta note 2, touchée par toi ». La relecture sépare « ✓ ta raison », « tu savais alors » (3, 6) et « ce qui a marché » (8).
- 4 : la ligne décochée est le lien, qui ne touche aucun jeton.
- 5 : « une piste, le joint usé (2) ».
- 6, C6 : un bandeau sur chaque état, et une étiquette « imaginée » sur la photo, le lien et les notes 7 à 9.

Nouveaux :
1. **m** Une date de fin déduite d'un projet. `m3-resolu` dit « faite le 28 nov. (note 8) ». Or la note 8, « Joint changé, 12 CHF la pièce. », ne dit aucune date.
   La marge de `m3-relire` écrit « fait le 28 nov. » sur la note 7, « Je le change samedi. », qui est une intention.
   Aucune note de M3 n'affiche son heure, si bien que « résolu le 2 déc. · n°9 » est invérifiable aussi. M1 a réglé ce même point en citant « Joint changé samedi ».
   Captures : `m3-resolu`, `m3-relire`.
2. **m** C2 (reste). `m3-decide` porte « Si la flaque revient : Ⓒ le sanitaire cherche sous la dalle **(note 4)** ». La note 4 ne parle pas de la dalle.
   M4 écrit « notes 3, 4 », ce qui est juste. Capture : `m3-decide`.
3. **m** Annulation en bloc. La feuille (`m3-annuler`) met « Jetons en haut · notes 2 à 6 » sur une seule case.
   « devis attendu · n°5 » et la marge « demandé, pas reçu » n'ont pas de ligne à eux. On ne peut refuser cette lecture qu'en retirant tous les jetons. Capture : `m3-annuler`.
- D : `m3-relire` porte « 14 mars » dans l'en-tête, une date imaginée hors bandeau. La marge de la note 5 dit « jamais reçu » : une absence, mais dite par l'IA et non citée comme source.
- **Ce qui est juste.**
  - La marge reste la meilleure trace de lecture : un trait sur chaque ligne lue, et « Version de 21:29 ».
  - Le hors ligne est daté, et l'envoi s'annule sans toucher à la note.
  - Le chemin réel tient : « Je cherche · par toi · 25 nov. ».
  - L'achat est honnête (« pour quand : pas dit », « largeur des deux : dans aucune note », « 289 CHF ? »).
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui ; coût oui (coût réel 12 CHF) ; options oui ; décider oui ; tâche oui (date de la note 7) ; résoudre oui ; relire pourquoi oui (raison et résultats séparés) ; carnet non-problème oui (achat).
- **Note : 8/10** (7 avant).
- **Verdict** : la meilleure trace de lecture ; dates de fin et une source de Ⓒ restent déduites.

## M4 · Deux vues : 1 problème, dont 0 bloquant
Itération 3 : **7 corrigés sur 7**.
- 1, C5 : `m4-erreur` ne montre que « pas trouvé » (note 3) et « 150 CHF » (note 6). Il ajoute « Le reste (trouvé, à vérifier, devis, options, tâche) : l'IA te le proposera ».
- 2, C6 : la note 7 dit « Je change le joint moi-même samedi. », la photo est retirée, et les bandeaux sont posés.
- 3 : le chemin indique « 25 nov. 13:22 · Je cherche, par toi » (`m4-options`, `m4-resolu`). Les pas imaginés sont en pointillé.
- 4 : « Ce que tu savais alors » dit « 150 CHF « Estimation », devis attendu · notes 5, 6 ».
- 5 : le conseil est cité notes 2 et 4. Le montant devient « 150 CHF ? « Estimation » note 6, pour lui ? ».
- 6 : « Annuler l'envoi » ; « la note 9 est gardée ; son envoi à l'IA attend le réseau ».
- 7 : « 2 à garder », pour 2 cases vides.

Nouveau :
1. **m** La feuille ne montre pas tout ce que l'IA a fait. `m4-annuler` liste 2 propositions (l'état et les options).
   Or l'IA a aussi posé des lectures :
   - dans `m4-notes-lues` : « trouvé », « à vérifier », « si la flaque reste », « devis » et « coût estimé » ;
   - dans `m4-range` : les cartes « Joint du siphon » et « Sous la dalle ».
   Aucune n'a sa ligne. Une lecture fausse (« coût estimé », par exemple) ne se refuse qu'avec « Avant l'IA · 21:26 », qui défait tout. M1, M2 et M3 listent ces lectures.
   Captures : `m4-annuler`, `m4-notes-lues`, `m4-range`.
- D : « Ne plus attendre le devis **de l'entreprise X** ? » (`m4-resolu`). La note 5 ne dit pas de qui vient le devis.
- D : « Pourquoi tu as pris ça : … sans le sanitaire » (`m4-relire`) est une paraphrase de l'IA au-dessus de la note citée.
- **Ce qui est juste.**
  - Le meilleur repli (`m4-sans-ia`) : « Tel que l'IA l'a laissé le 28 nov. à 10:05 », la note 9 « Pas encore lue par l'IA », puis « L'IA te proposera la suite ».
  - Le chemin réel, puis l'imaginé marqué pas à pas.
  - « Retenir touché à 18:40 ».
  - « Cocher la tâche ? « Joint changé. » note 8 imaginée ».
  - Le conseil qui ferme la boucle (notes 1, 3).
  - « Résolu par toi le 30 nov. à 09:13 ».
  - La feuille aux interrupteurs, avec « sera retiré ».
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis oui (« Ne plus attendre le devis ? ») ; coût oui (+ Noter) ; options oui ; décider oui ; tâche oui ; résoudre oui ; relire pourquoi oui (« Ce que tu savais alors » sans anachronisme) ; carnet non-problème oui (mémo).
- **Note : 9/10** (8,5 avant).
- **Verdict** : la plus digne de confiance ; seule la feuille devrait aussi lister les lectures de l'IA.

## Pour le port (greffes proposées)
- Le repli de M2 et M4 tel quel : avant tout rangement, « pas trouvé » et le montant, sa note citée. Après un rangement, la dernière vue de l'IA, datée et entière.
- La feuille de M1 (« défaire ne remet jamais une lecture fausse », une ligne par lecture) dans M4.
- La tâche proposée seulement après Retenir (M1, M3, M4), jamais avec « Je cherche » (M2).
- Une date de fin se cite par la note qui la dit (M1 : « Joint changé samedi »), jamais par la note qui la projette.

persona-ia-4 : M1 2 (B 0) 8,5/10 ; M2 2 (B 0) 8,5/10 ; M3 3 (B 0) 8/10 ; M4 1 (B 0) 9/10 ; B total 0
