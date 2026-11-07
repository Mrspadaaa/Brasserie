# Test d'écran B2 — Dépense (D372 à D381), 07.11

Version : build figé `%TEMP%/depense-b2` (HEAD dbca5108), états SIMULÉS d'`apercuDev.ts`, servi par interception sur localhost:4319.
Aucune vraie pièce dans ce banc : tous les problèmes ci-dessous ont été vus sur la fixture `lecture` (Brau- und Rauchshop 372765, état `3`)
sauf mention ; `difficile` est un message fabriqué (D381), sans photo.
Captures : `%TEMP%/affinee-test-b2/repos/` (48 au repos : 12 états × 390/1280 × clair/cave, `mesures.json`) et `%TEMP%/affinee-test-b2/gestes/`
(gestes, `journal.json`, `journal2.json`, `journal3.json`). Scripts : `gestes.mjs`, `gestes2.mjs`, `gestes3.mjs`, `inspect.mjs`.
Maquette de référence : pu4d (`plateau/v3/pu4d/pu4d-repos.png`, `-b`, `-d`, `-1280-b`) et pa1d-d.

Résumé : 20 problèmes, 3 bloquants (n° 1, 2, 3).

## Problèmes

1. **État 3 (aussi 2, 8), 390 clair et cave, au repos et à tout défilement** — le badge de la bande Malts « 7 +5 ↳ » s'empile sur trois lignes
   (56 px dans un en-tête de 28 px, mesuré : déborde de 14 px sous l'en-tête) et recouvre la première rangée visible (« Maris Otter », puis
   « Caramün ↳ p 2 », « Haferfloc ↳ » quand l'en-tête colle). À 1280 il tient sur une ligne. Captures `repos/3-t390-clair.png`, `repos/3-t390-cave.png`,
   `gestes/3-weizen-ouvert.png`, `gestes/3-target-t390-cave.png`. Gravité : **bloquant** (texte masqué, illisible). À corriger. Contrôle qui l'aurait
   attrapé : aucun ; `mesurer` ne regarde que la largeur. Ajouter : hauteur de chaque `[data-dp-bande-compte]` ≤ hauteur de son en-tête, et aucun
   élément d'en-tête ne chevauche la rangée suivante.
2. **État 3, Weizenmalz hell, 390 clair, segment d'unité g puis Kg (D372, D373)** — le prix lu 1,55 est effacé au passage en g et ne revient pas au
   retour en Kg : la ligne dit « 2 kg × — 3,10 », « prix à remplir », alors que quantité (2) et montant (3,10) sont là et que D373 dit « le champ qui
   manque se calcule ». Retaper la quantité 2 efface ensuite le montant : « 2 kg × — — », bande « 33,75 + ? ». Journal `journal3.json` C2.
   Captures `gestes/3-unite-g.png`, `gestes/3-unite-retour-kg.png`. Gravité : **bloquant** (valeur lue perdue par un aller-retour ; règle D373 non
   appliquée). À corriger. Contrôle : `tests/unit/depense/d373` ne joue pas de changement d'unité ; ajouter « unité A → B → A : la ligne revient
   telle quelle » et « deux champs présents après un changement d'unité : le troisième se calcule ».
3. **État 3, Weizenmalz hell, 390, case g** — la quantité n'est pas convertie : « 2 Kg » devient « 2 g » (pas 2 000 g), STOCK dit « 1 → 1,002 Kg »,
   la bande « 16,002 Kg », le montant reste 3,10 pour 2 g. Capture `gestes/3-unite-g.png`. Gravité : **bloquant** (valeur fausse à la réception
   au stock si on confirme). À lui montrer : sa maquette pu4d-b a le segment « g | Kg | pièce » (D353) mais ne dit pas ce que devient la quantité ;
   deux lectures possibles (convertir la masse, ou vider la quantité et la marquer « à remplir »). Contrôle : test « changement d'unité : masse
   conservée ou quantité vidée, jamais le nombre gardé sous une autre unité ».
4. **État 3, 390 clair et cave, après la case g** — le montant de la bande Malts est coupé au bord droit (« 36,0… », bord droit mesuré à 403 px
   pour 390) parce que « 16,002 Kg » pousse la colonne. Captures `gestes/3-unite-g.png`, `gestes/3-tva-panneau.png`, `gestes/3-plie.png`.
   Gravité : moyenne (valeur illisible). À corriger. Contrôle : `mesurer` (scrollWidth) ne le voit pas ; ajouter « `[data-dp-sous-montant].right`
   ≤ innerWidth » sur chaque bande, après gestes.
5. **État 3, 390, un toucher sur la case « Kg » déjà active** — l'unité passe en minuscule : rangée « 2 kg × », carte FACTURE « 2 kg », alors que
   tout l'écran écrit « Kg ». Même valeur, deux formats. Captures `gestes/3-unite-retour-kg.png`, `gestes/3-tva-k1.png`. Gravité : faible. À
   corriger. Contrôle : une seule casse d'unité à l'écran (lint du texte rendu : `/\bkg\b/` interdit).
6. **État 3, 390, montant posé 10 sur 3 Kg (D373)** — le prix calculé s'affiche « 3,3333 » (4 décimales ; « 0,775 » ailleurs) contre « 1,55 » et
   « 0,040 » sur les autres rangées ; le champ s'élargit et « = 10,00 » passe à la ligne sous la rangée de calcul. Capture `gestes/3-qxp-10.png`.
   Gravité : faible. À lui montrer (arrondi du prix calculé : 2 ou 3 décimales ?). Contrôle : prix affiché ≤ 3 décimales ; la rangée de calcul
   tient sur une ligne à 390.
7. **État 3, 390, quantité de Weizenmalz modifiée (2 → 3)** — la mouture rattachée « ↳ 0,20 » quitte la rangée en silence, le badge passe à « +4 »,
   « Rattacher les 4 », et la ligne « Zuschlag Schrotung 2 Kg × 0,10 = 0,20 » réapparaît dans une bande « Services 1 · 2 Kg » (une bande de
   services avec une quantité en kilos). Même effet après Service → Ingrédient. Journal C1 (q := 3), S4. Captures `gestes/3-qxp-10.png`,
   `gestes/3-plie.png`. Gravité : moyenne (le brasseur corrige une quantité et perd son rattachement sans le voir). À corriger. Contrôle : test
   mouture « quantité modifiée : la mouture reste rattachée (ou l'écart est marqué) ».
8. **État 3, Pilsner Malz, 390, bouton « Garder » (D374)** — la ligne reste ouverte après le toucher (`details.open` = true) ; D374 : « « Garder »
   referme ». Le lien passe bien à « sûr » et le récap à « 13 proposés ». Capture `gestes/3-pilsner-garde.png`. Gravité : moyenne (geste à moitié
   sans effet). À corriger. Contrôle : test d'écran pu4d D374 : `open` = false après Garder.
9. **Plié (D378), 390 et 1280** — toute bande d'une seule ligne n'a pas de chevron, ignore « Plié » et garde sa ligne visible : « Services 1 »
   dans l'état 3 (capture `gestes/3-plie.png` : 1 ligne visible après Plié), « Levures 1 », « Sucres 1 » dans `commande`, « Nettoyage 1 » dans
   `renovation`. Son point de couleur n'est pas aligné sur celui des autres bandes (x ≈ 28 contre 80 px). Ses mots : « on peut toujours pas fermé
   les famille ». Captures `repos/commande-t390-clair.png`, `repos/renovation-t390-clair.png`. Gravité : moyenne. À corriger. Contrôle : après
   « Plié », 0 rangée visible ; chaque `[data-dp-bande-entete]` a son `[data-dp-bande-pli]`.
10. **État `renovation` à l'arrivée, 390 et 1280** — « Plié » est allumé et les quatre sous-familles (Peinture et sols, Outillage, Quincaillerie,
    Électricité) sont fermées : 13 lignes sur 16 cachées à l'arrivée, alors que D378 lit « rien ne se cache à l'arrivée ». Capture
    `repos/renovation-t390-clair.png`. Gravité : faible. À lui montrer (son choix E de D311 repliait peut-être les sous-familles). Contrôle : à
    l'arrivée, « Déplié » allumé et toutes les rangées visibles.
11. **État 3, « supprimer » deux fois (Haferflocken, Motueka), 390** — chaque toucher retire la ligne au premier toucher, sans menu (bien), mais
    sans retour : aucun « Annuler » ni « Rétablir » (`[data-dp-retablir]` absent), 18 → 17 lignes ; une ligne lue sur la facture ne revient que par
    « Relire ». Capture `gestes/3-deux-retraits.png`. Gravité : moyenne. À lui montrer : sa maquette pu4d a « supprimer » sans retour visible.
    Contrôle : banc « retrait puis annulation ».
12. **État 3, « + Ajouter une ligne », libellé, 390** — un nom de plus de 30 caractères est tronqué en silence au Tab (« Malt Pilsner 25kg
    xxxxxxxxxxxx ») ; « Weyermann Pilsner Malz 25 kg Sack » ne tiendrait pas. Journal `journal3.json` C5. Gravité : moyenne (valeur fausse, sans
    avertissement). À corriger. Contrôle : test « libellé long conservé entier, ou refus visible ».
13. **État 3, champs du plateau, 390** — quantité « -1 » devient « 0 » en silence (et la ligne « 0 Kg × 0,50 = 0,00 » reste comptée) ; « abc »
    devient vide ; prix « 99999999 » accepté sans borne (rangée « 99999999,00 », aucun écart signalé). Journal C1. Gravité : faible. À lui montrer.
    Contrôle : test des bornes (négatif refusé visiblement, plafond raisonnable, ou écart au total marqué).
14. **État 3, Target bis ouvert, 390 cave et 1280 clair** — le champ prix dit « 0,04 », la rangée « × 0,040 » : même nombre, deux formats (la
    maquette pu4d-b écrit « 0,098 » aux deux endroits). Captures `gestes/3-target-t390-cave.png`, `gestes/3-tva-pc1280-clair.png`. Gravité :
    faible. À corriger. Contrôle : format du prix identique rangée / champ.
15. **États `qr-contredit`, `commande`, `renovation`, 390** — « Somme = imprimé » casse sur deux lignes (« Somme = / imprimé ») dès que le nombre
    est long, et sur trois (« Somme / = / imprimé ») avec « 110,40 ≠ 110,04 ». Captures `repos/qr-contredit-t390-clair.png`,
    `repos/commande-t390-clair.png`, `repos/renovation-t390-clair.png`. Gravité : faible. À corriger. Contrôle : la ligne « Somme = imprimé » tient
    sur une ligne à 390 (hauteur ≤ 1 ligne).
16. **État 3, ligne « Hallertauer Blanc CH », 390** — la sous-rangée « stock : Hallertauer Blanc DE [Hallertauer Blanc CH] [⇄] » passe sur trois
    lignes, le bouton « ⇄ » seul en bas. Capture `gestes/3-ajout-citra-rempli.png` (et déjà serré dans `repos/3-t390-clair.png`). Gravité : faible.
    À corriger. Contrôle : hauteur de la sous-rangée « stock : … » ≤ 2 lignes.
17. **États `5` et `difficile` (lecture échouée), 390 et 1280, clair et cave** — sous le message, « Articles, stock et matériel · 1 » annonce un
    article alors qu'aucune ligne n'a été lue (c'est la ligne vide du formulaire manuel, journal `journal2.json` B2). Captures
    `repos/difficile-t390-clair.png`, `repos/5-t390-clair.png`, `repos/difficile-pc1280-cave.png`. Gravité : faible (compte faux). À corriger.
    Contrôle : après un échec de lecture, le compte d'articles vaut 0 ou n'est pas affiché.
18. **État 3, « + Ajouter une ligne », 390** — la ligne neuve porte quatre puces rouges « libellé / quantité / prix / montant à remplir » qui
    répètent les quatre champs déjà en rouge tireté, plus le cadre « unité à remplir » et « 0,00 + ? » dans l'en-tête : neuf marques rouges pour
    une ligne vide (DEFAUTS : trop de texte, cockpit). Capture `gestes/3-ajout.png`. Gravité : faible. À lui montrer. Contrôle : `controle-commun`
    (mots) sur l'état « ligne ajoutée ».
19. **État 3, plateau ouvert, pied « Famille », 390 et 1280** — un `<select>` natif visible d'emblée dans le pied du plateau ; D364 ne le permet
    que « sous « plus » » (seule exception à D350 « éviter les dropdown sur mobile »). Captures `gestes/3-weizen-ouvert.png`,
    `gestes/3-weizen-pc1280-clair.png`. Gravité : faible. À lui montrer. Contrôle : `controle-sans-menu` (MENU OK sur pu4d) rejoué sur l'app.
20. **État `difficile`, 390 et 1280, « Relire »** — le message D381 est là (« Lecture en morceaux incomplète : la partie 2 sur 3 n'a pas été lue.
    Réessaie. Pièce peu lisible ? Reprends une photo plus nette, ou saisis les valeurs à la main. ») et « Saisir à la main » met bien le curseur
    dans le total ; mais « Relire » relance la lecture entière sans dire qu'elle reprendra par morceaux ni laquelle manque, et répond ici « Service
    IA momentanément indisponible » (simulé). Le message dit « Réessaie » puis « Relire » : deux mots pour un geste. Capture
    `gestes/difficile-relire.png`. Gravité : faible. À lui montrer. Contrôle : aucun (texte).

## Doutes (non comptés)

- Panneau TVA (`gestes/3-tva-panneau.png`) : « Bases N + R : imprimé 110,40 · lignes 86,50 (+23,90) » sur une pièce dont le total TTC est 86,50 :
  les bases imprimées dépassent le TTC. Donnée de la fixture SIMULÉE `lecture` ; à vérifier sur la vraie pièce 372765 avant d'en faire un problème.
- Ligne ajoutée : la pastille « +1 » n'a pas écrit la quantité dans mon rejeu (journal3 C5, « ? × 0,098 ») ; mon clic a pu précéder le rendu. À
  rejouer à la main.
- Cibles tactiles du plateau toutes entre 24 et 36 px (segment d'unité 34, nature 32, Garder 32, « extrait » 28, mouture 24) : DESIGN.md assume
  des tailles compactes ; je ne compte pas, mais « Mouture … rattacher » à 24 × 52 px est petit pour un pouce.
- Bande Levures « 7 Stk » avec des rangées « 2 Stk = 2 sachets » : l'unité de bande est celle de l'imprimé, pas celle du stock (la maquette dit
  « 3 sachets »). Choix ou oubli ?
- « Rattacher les 5 » dans l'en-tête de bande n'est pas dans pu4d-repos ; il vient d'une décision mouture postérieure (à confirmer dans le registre).
- Rechargement en cours d'édition : la feuille se ferme et revient sur le tableau de bord ; en rouvrant « Entrer une facture », le banc rejoue
  l'état simulé depuis l'URL, donc la persistance d'un brouillon réel n'est pas observable ici (voir Couverture).

## Couverture

Joué :
- Au repos, 390 tactile et 1280, clair et cave : états `3`, `2`, `date`, `port`, `5`, `difficile`, `8`, `commande`, `familles`, `renovation`,
  `qr-confirme`, `qr-contredit` (48 captures, `mesures.json` : aucun débordement horizontal, aucune valeur brute, seule l'erreur de police
  attendue). Regardées en image : 3 (390 clair, cave, 1280 clair, 1280 cave), 2, date, commande, familles (cave), renovation, 8, 5, difficile
  (390 clair, 1280 cave), qr-contredit.
- Gestes sur l'état 3, 390 clair (plateau Weizenmalz et Target bis aussi en 390 cave et 1280 clair/cave) : ouverture de ligne (proposé, bis,
  nouveau, levure), q × prix dans tous les ordres (quantité, prix, montant, puis quantité après montant, montant après quantité), entrées absurdes
  (0, −1, abc, 1.5, 1,5, vide, 99999999, vide), segment d'unité Kg/g (aller-retour), nature Ingrédient/Service/Ingrédient, Retirer puis Suivre au
  stock, Garder, extrait, tuile TVA et ses trois cases (colonne lu, N + R, sans TVA : la tuile suit, « gardée »/« vide », total inchangé, panneau
  refermé), Plié / Déplié / chevron de bande (segment reflète l'état réel), deux retraits de suite, « + Ajouter une ligne » (libellés « Crystal 60 »,
  « 123 », « 0 », 80 caractères, « Citra » → bande Houblons), prix sur la ligne neuve, cibles mesurées.
- État `difficile` : « Saisir à la main » (focus sur le total), total tapé (261,65 ; 261.65 ; 261 ; 0 ; −5 → 0,00 ; abc → vide), « Enregistrer »
  sans total (alerte « À corriger », focus sur la description), section « Articles… » dépliée, « Relire ».
- Même nombre à deux endroits : rangée / champ / bande / Détail comparés à chaque saisie (journal3 C1).

Pas joué, et pourquoi :
- Vraie pièce : le banc n'en a aucune (états SIMULÉS, `fichier` factice, pas de réponse IA rejouée copiée d'une vraie) ; L28 non satisfaite, tous
  les constats portent sur la fixture.
- États `port-sans-montant`, `tout-port`, `6`, `9`, `s6`, `qr-partiel`, `qr-illisible`, `qr-ecart`, `qr-invalide`, `qr-sans`, `qr-lecture`,
  `qr-pdf`, `qr-non-verifie` : hors du périmètre D372 à D381 ; non capturés.
- « Confirmer » / enregistrement : non joué (écriture simulée, hors de la question posée).
- Ordre « Papier », justificatif (icône en haut à droite), « Pour quoi ? / Date / Fournisseur / Lier / Référence », « Regrouper en une dépense »,
  « Rattacher », « Choisir un autre article ⇄ », chevron des sous-familles de `renovation`, Garder/Retirer du bandeau 3e lecture (« Annuler » n'existe
  que là, D329 ; aucun état du lot ne l'ouvre).
- Rechargement en cours d'édition : joué, non concluant (voir Doutes).
- Occlusion par le pied : le pied (52 px) n'a recouvert aucun contenu dans les captures regardées ; non mesuré sur tous les défilements.

## Méthode manquante

- `mesurer` ne voit que `scrollWidth` : il faut une mesure par élément (bord droit des montants de bande ≤ largeur ; hauteur d'un badge ≤ hauteur
  de son en-tête ; aucun chevauchement d'en-tête sur la rangée suivante) : les n° 1, 4, 15, 16 passaient tous « sans débordement ».
- Un test d'invariance « aller-retour » sur chaque bascule du plateau (unité A→B→A, nature, Garder/Retirer, quantité modifiée puis remise) : la
  ligne doit revenir identique ; c'est ce qui aurait attrapé les n° 2, 5, 7.
- Les tests d373 doivent inclure un changement d'unité avant le calcul (n° 2, 3).
- Le test d'écran pu4d D374 doit vérifier `open` = false après « Garder » (n° 8), et D378 « 0 rangée visible après Plié » sur une pièce avec une
  bande d'une ligne (n° 9).
- Une vraie pièce dans le banc (photo d'origine et réponse IA rejouée copiée d'une vraie, L28), au moins pour `3` et `difficile` ; et un état
  « brouillon » pour que le rechargement en cours d'édition soit observable.
- Un contrôle de format des nombres rendus (unités à une seule casse, prix ≤ 3 décimales, même format rangée/champ) : n° 5, 6, 14.
- Les scripts `gestes*.mjs` cherchaient des `input` : les champs sont des `textarea` à une ligne (`inspect.mjs`) ; le banc devrait documenter les
  sélecteurs des champs (aria-label « Quantité ligne N », N = numéro de ligne de la pièce, pas l'index).
