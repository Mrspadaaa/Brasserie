# Persona ux, itération 3 (25.11)

Regard : concepteur d'interfaces mobiles compactes, pas le brasseur. Grille : boosters-ux (B1 à B13) et impeccable (mode
Operate), soumis à DESIGN.md et à ses plaintes (CARNET-COHERENT, CHAMP-CARNET-REPLIE, CARNET-REPOND-AU-BESOIN,
CARNET-LISTE-COMPACTE). Jugé après la correction 2, sur les captures de `cap/` (18:02 à 18:04), toutes ouvertes :
M1 (13 : note, attente, cherche, cherche-bas, erreur, change, decide, tache, resoudre, resolu, relire, hors-ligne, achat),
M2 (13 : avant, attente, apres, options, decide, tache, resoudre, resolu, relire, memo, sans-ia, erreur, annuler),
M3 (13 : note, attente, range, annuler, options, decide, tache, resoudre, resolu, relire, achat, hors-ligne, erreur),
M4 (14 : noter, attente, erreur, range, options, decide, notes-lues, tache, sans-ia, resoudre, resolu, relire, memo, annuler).
Les noms de la page sont des copies octet pour octet (même md5) : `m1-avant` = `note`, `m1-apres` = `cherche`,
`m1-annuler` = `change`, `m3-avant` = `note`, `m3-apres` = `range`, `m4-avant` = `noter`, `m4-apres` = `range`.
Plus aucune capture v0 dans les noms de la page.

Mesures prises dans le CSS, en px CSS (la moitié de la capture de 780 px) :
- tailles de texte : M1 14 / 16 / 24 ; M2 14 / 16 / 20 ; M3 14 / 16 / 24 ; M4 14 / 16 / 20. La règle des 3 tailles tient partout ;
- hachures : aucune. `repeating-linear-gradient` de M3 = les lignes du papier. Texte barré : `.m3-x` est défini mais jamais
  employé ; `.m4-tache.faite` barre la tâche faite (M4 seule) ;
- cibles sous 44 px : M1 `.m1-chg` 32 px, frise 28 px ; M2 `.m2-rev`, `.m2-aj`, `.m2-repl` et `.m2-file .m2-btn` 36 px ;
  M3 `.m3-lienm` sans marge intérieure (environ 20 px) ; M4 `.m4-chg` 36 px, `.m4-btn` 40 px.

Légende : **B** = bloquant (geste impossible ou caché, valeur fausse ou invérifiable, élément demandé absent, texte
illisible) ; **m** = mineur ; **D** = doute, non compté.

Problème commun de l'itération 2 (action IA toujours pleine) : corrigé dans les quatre. Ranger et Annoter sont bordés au
repos et pleins seulement en saisie, quand une pastille de notes à ranger existe. En erreur, le seul plein est « Réessayer ».

---

## M1 · Le carnet se range : 7 problèmes, 0 bloquant

Itération 2 : les 9 problèmes sont corrigés.
- 1 (IA pleine) : corrigé, voir le commun.
- 2 (ordre des sections) : corrigé. L'ordre est fixe dans tous les états : Constat, Pistes, Options, Tâche, Coût, Résultat
  (`m1-tache`, `m1-resolu`).
- 3 (« Retenue » en aplat vert) : corrigé. C'est maintenant un état écrit, avec un trait vert à gauche et « ✓ Retenue par toi ·
  26 nov. » (`m1-decide`).
- 4 (deux statuts) : corrigé. « En réserve, si la flaque reste : ② ③ » (`m1-decide`).
- 5 (« ? à situer ») : corrigé. Il reste seulement « ? à vérifier », comme le veut la règle commune.
- 6 (compteurs hors ligne) : corrigé, 8 partout (`m1-hors-ligne`).
- 7 (conseil) : corrigé. La pastille « conseillé » est sur ①, avec le seul Retenir plein (`m1-cherche`).
- 8 (qui parle en relecture) : corrigé. L'IA écrit en violet ; ses mots sont en noir, entre « », avec leur n° (`m1-relire`).
- 9 (case Coût réel) : corrigé. Le bouton « + Noter le coût » remplace la case (`m1-resolu`, `m1-relire`).
- D levés : « quelques francs » porte « (l'IA, pas tes notes) » ; les notes ne sont plus grisées pendant l'attente
  (`m1-attente`) ; la bande du bas tient sur une rangée, environ 63 px au lieu de 103.

Nouveaux :
1. **m** Changement fantôme dans la feuille : « Devis : à acheter → attendu · un devis ne s'achète pas » (`m1-change`). Sa note
   5 dit « Devis attendu. » depuis le début, et rien n'a jamais lu « à acheter ». La feuille compte donc un changement qui n'a
   pas eu lieu (« 7 changés »). M4 a retiré cette ligne (Ia5) ; M1 la garde.
2. **m** Le repli de ② est rangé dans la carte de la tâche de ①. Sous « Changer le joint du siphon », on trouve n4 « Contacter
   l'entreprise X → seulement si la flaque reste », avec son lien (`m1-cherche`, `m1-tache`, `m1-resolu`). Dans une carte qui
   a une case, cela se lit comme une sous-tâche. Le même repli figure aussi sous Options (« ② en réserve »). Deux sections le
   portent, ce qui contredit l'ordre fixe qui vient d'être gagné.
3. **m** L'état proposé n'a pas de geste. « Je cherche ? » est une pastille en pointillé sur une frise de 28 px de haut
   (`.m1-frise`, `m1-cherche`), sans Oui ni Non. L'état passe ensuite à « Je cherche » (`m1-decide`) sans qu'on ait vu le geste.
   M3 (« Passer / Non ») et M4 (une case dans la frise) dessinent ce geste.
4. **m** Le seul accès à l'annulation est petit. « ↶ 7 changés » fait 32 px de haut (`.m1-chg`), et c'est l'unique porte vers la
   feuille.
5. **m** La couleur du bouton plein n'a pas de règle. Le violet, qui est l'encre de l'IA, sert à ses décisions (« Retenir »,
   « Garder la tâche », « Oui, résolu »). Le noir sert à des décisions du même ordre : « Garder 6 sur 7 » (`m1-change`),
   « Garder » hors ligne (`m1-hors-ligne`). Un bouton violet plein se lit comme un geste de l'IA.
6. **m** Le libellé hors ligne est ambigu. Le bandeau dit « tes notes sont gardées sur le téléphone », puis on lit « 8 notes
   attendent le réseau · Annuler l'envoi » (`m1-hors-ligne`). On croit que les notes elles-mêmes ne sont pas enregistrées, et
   « Annuler l'envoi » semble les jeter. M2 dit plus juste : « 1 envoi à l'IA attend le réseau ».
7. **m** Les redites se multiplient :
   - au résolu, le jeton « coût réel : pas noté » en tête redit la ligne « Coût réel : pas noté · + Noter le coût »
     (`m1-resolu`) ;
   - dans l'achat, le jeton « Je cherche · 1 offre », en plein bleu, redit la frise « Je cherche » juste au-dessus
     (`m1-achat`) ;
   - en relecture, l'icône « ? » bleue coiffe « Pourquoi ce choix », alors que « ? » veut dire « à vérifier » partout ailleurs.
     Sous « Pas servi », la dalle est aussi « ? à vérifier si ça revient » (`m1-relire`).
- **D** L'en-tête collé (titre, Local, frise, jetons) fait environ 212 px, soit 25 % de l'écran. Avec la barre du bas, il
  reste 67 % pour le contenu (`m1-cherche-bas`).
- **D** « 12 changés » reste en tête à la relecture, des mois après (`m1-relire`). C'est un bruit faible, mais il est
  permanent.
- **D** Le titre « Pistes » coiffe sa note « Pistes : joint du siphon… ». Ce sont ses mots, ils ne sont pas réécrits.

Parcours : noter vite ✓ (2 lignes, Ajouter sur le clavier, Coller dans la barre) · attente ✓ (Arrêter) · trouvé / pas
trouvé ✓ · devis ✓ · coût ✓ · options ✓ (① conseillée) · décider ✓ (n9 « = ta raison ») · tâche ✓ (date tirée de « samedi »
n9) · résoudre ✓ (« La flaque n'est pas revenue : résolu ? », 3 cases, « Oui, résolu ») · relire pourquoi ✓ (options nommées,
raisons en ses mots, chemin daté) · carnet hors problème ✓ (achat) · sans IA ✓ (hors ligne et erreur, avec la lecture par
l'app) · annuler ✓.
**Note : 8,5/10** (8 à l'itération 2). C'est le parcours le plus complet et l'ordre est maintenant stable. Il reste un
changement fantôme, l'état proposé sans geste, et la place du repli.

## M2 · La fiche au-dessus : 7 problèmes, 0 bloquant

Itération 2 : 9 problèmes corrigés sur 10, 1 en partie (encore compté).
- 1 (IA pleine) : corrigé, voir le commun.
- 2 (hachures) : corrigé, il n'y en a plus aucune.
- 3 (trop d'aplats noirs) : corrigé. La tâche est une carte claire, et il y a un seul plein par écran (« Garder les 2 »,
  « Retenir », « Mettre », « Résolu »).
- 4 (cibles) : en partie. La case de la tâche fait 28 px et les boutons 44 px, mais quatre commandes restent à 36 px. Voir 6
  ci-dessous.
- 5 (Coller remplit le champ) : corrigé. La pastille « Copié : Coller entreprise-x.ch » est au-dessus du champ, qui reste vide
  (`m2-apres`).
- 6 (raison écrite par l'IA) : corrigé. « Pourquoi ? Touche tes mots » propose ses notes en puces ; la n°2 touchée se
  surligne dans Mes notes (`m2-decide`).
- 7 (résoudre) : corrigé. « Proposé, d'après ta note n°8… résolu ? », deux cases, « Résolu / Pas encore » (`m2-resoudre`).
- 8 (mémo lourd) : corrigé. Une ligne et la proposition « Lier » (`m2-memo`).
- 9 (« estimé » perdu hors ligne) : corrigé, « 150 CHF estimé n°6 » (`m2-sans-ia`).
- 10 (4 tailles) : corrigé, 14 / 16 / 20.
- D levé : « une pièce · l'IA, pas tes notes » (`m2-options`).

Nouveaux et restes :
1. **m** Le pointillé porte trois sens :
   - « proposé » : le cadre « Proposé · rien n'est posé sans toi » (`m2-apres`) ;
   - « à vérifier » : le jeton « ? dalle » (`m2-options`) ;
   - « lu par l'app » : le cadre et les quatre jetons de `m2-sans-ia`, où la proposition de tâche est elle aussi en pointillé,
     dans un cadre pointillé.

   Au coup d'œil, on ne sait plus si un pointillé attend un geste (B9, cohérence).
2. **m** La rangée de jetons défile sans le dire. À partir de la décision, elle est coupée en fondu à droite, et « devis
   attendu », qui pèse dans le choix, n'est plus visible (`m2-decide`, `m2-tache`, `m2-resoudre`). Rien n'indique qu'elle
   défile.
3. **m** Les libellés d'une même option changent d'un état à l'autre :
   - le sanitaire est « Pas servi » au résolu (`m2-resolu`), puis « En réserve » à la relecture (`m2-relire`) ;
   - « Retenu par toi · 25 nov. » (`m2-decide`) perd sa date à `m2-tache`.
4. **m** L'erreur n'a pas de repli. `m2-erreur` montre ses notes et « Réessayer », rien d'autre. Hors ligne (`m2-sans-ia`), la
   même lecture par l'app donne pourtant les jetons, les options et la tâche. La panne de l'IA et la panne du réseau
   produisent deux écrans inégaux. M1, M3 et M4 ont le repli dans les deux cas.
5. **m** « revoir » montre tantôt un compte (« 6 changements · revoir », « 1 changement », « 2 changements »), tantôt rien
   (`m2-options`, `m2-decide`, `m2-resoudre`, `m2-memo`, `m2-relire`). On ne sait pas s'il reste quelque chose à revoir.
6. **m** (reste de 4) Quatre cibles font 36 px : « revoir » (`.m2-rev`, seule porte vers l'annulation), la flèche Ajouter
   (`.m2-aj`), le chevron de la fiche (`.m2-repl`) et « Annuler l'envoi » (`.m2-file .m2-btn`).
7. **m** Le champ de saisie est étroit. La flèche Ajouter est logée dans le champ, entre l'appareil photo, le micro et
   « Ranger » : la note en cours passe sur 3 lignes dans environ 140 px (`m2-avant`). M1 et M4 placent Ajouter sur le clavier
   et gardent le champ large.
- **D** À l'état rangé, les jetons sont cerclés de violet, et celui de la dalle a un double bord (`m2-apres`). Le cerclage
  disparaît ensuite. Veut-il dire « posé à l'instant par l'IA » ? Rien ne le dit.
- **D** À la décision, la fiche ne montre pas la tâche gardée à l'état rangé. Elle revient seulement à `m2-tache`.
- **D** En relecture, « ✓ Résolu » prend la place de « Local » en tête (`m2-relire`) : on ne voit plus l'espace du carnet.
- **D** La moitié basse est vide dans `m2-avant`, `m2-attente`, `m2-erreur` et `m2-memo` (cas courts, comme en itération 2).

Parcours : noter vite ✓ (Ajouter sans IA, Coller en pastille) · attente ✓ · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ ·
options ✓ (conseillé, seul Retenir plein) · décider ✓ (sa raison choisie dans ses mots) · tâche ✓ (date de sa note n°7,
« Mettre / Non ») · résoudre ✓ · relire pourquoi ✓ (options nommées, « trouvé par siphon », mot en gras dans la note n°2) ·
carnet hors problème ✓ (mémo) · sans IA ✓ hors ligne, ~ en erreur (sans repli) · annuler ✓ (la case décochée retire son jeton
derrière la feuille).
**Note : 8/10** (7,5 à l'itération 2). Les aplats et les hachures sont partis, la confiance reste la meilleure (Proposé
explicite, raison choisie dans ses mots). Il reste des signes à plusieurs sens et des petites commandes.

## M3 · Dans la marge : 8 problèmes, 1 bloquant

Itération 2 : 10 problèmes corrigés sur 12, 2 en partie (encore comptés).
- B1 (« à acheter » hors ligne) : corrigé, « devis attendu » dans la marge et le jeton (`m3-hors-ligne`). La valeur fausse
  revient pourtant par la feuille, voir le nouveau B1.
- 2 (IA pleine) : corrigé, voir le commun.
- 3 (marge coupée, « constat », « étape ») : corrigé. Les phrases sont coupées à la main et se lisent ; « le problème » et
  « une piste : le sanitaire » parlent.
- 4 (saisie de 132 px) : corrigé. « Coller entreprise-x.ch » est posé dans la page ; la saisie fait environ 66 px
  (`m3-note`).
- 5 (codes lettres) : en partie. Lettre et nom court partout dans les cartes (« Ⓐ joint, toi-même »), mais des lettres nues
  restent dans la marge, voir 4.
- 6 (logique du repli) : corrigé. Ⓑ est « pas retenue », « Si la flaque revient : Ⓒ » seul (`m3-decide`).
- 7 (deux entrées) : corrigé, « Changé · n » seul en tête (cible de 44 px).
- 8 (redondance jetons / marge) : corrigé. La marge dit autre chose : « demandé, pas reçu », « une estimation, pas le devis ».
- 9 (deux segments en relecture) : corrigé, Résolu seul (`m3-relire`).
- 10 (citation tronquée) : corrigé, « Joint changé, 12 CHF la pièce. ».
- 11 (résoudre) : corrigé. « Proposé, d'après tes notes 8 et 9 · La flaque n'est pas revenue : résolu ? » (`m3-resoudre`).
- 12 (7 tailles) : corrigé, 14 / 16 / 24 ; « conseil : d'abord » en violet 14 px.
- D levés : les cercles de lettres font 24 px et ne sont pas touchables ; le rouge de l'achat a disparu.

Nouveaux et restes :
1. **B** La feuille promet une valeur fausse. La ligne décochée de `m3-annuler` dit : « « à acheter » → devis attendu · Décoché :
   revient à « à acheter » (lu par l'app) ». Or l'app lit maintenant « devis attendu » (`m3-hors-ligne`, `m3-erreur`).
   « Garder 5 sur 6 » afficherait donc la valeur fausse que l'itération 2 avait levée en B, par un geste normal : refuser un
   changement de l'IA. Derrière la feuille, le jeton « devis attendu » n'a pas bougé : la feuille et la page se contredisent.
   Correction : retirer la ligne, comme M4 (Ia5).
2. **m** La frise et le bouton plein se confondent. L'état courant est un aplat noir, identique au bouton plein : « Noté » noir
   avec « Passer » noir (`m3-range`), « Décidé » noir avec « Garder la tâche » noir (`m3-decide`), « Résolu » noir
   (`m3-resolu`). Il y a deux dominantes noires, et un segment d'état se lit comme un bouton. M1 et M4 marquent l'état par
   une pilule bleue.
3. **m** Les jetons n'ont pas de renvoi. « 150 CHF estimé », « devis attendu », « ? dalle : pas trouvée », « coût réel
   12 CHF » ne disent pas de quelle note ils viennent (`m3-range`, `m3-decide`, `m3-resolu`). Les jetons sont collés en haut,
   alors que la marge en face défile. M1, M2 et M4 mettent le n° dans chaque jeton.
4. **m** (reste de 5) Des lettres nues restent dans la marge : « le sanitaire de Ⓑ et Ⓒ » (`m3-options`), « coût de Ⓑ
   estimé, évité » (`m3-decide`, `m3-resolu`). Hors de la carte Options, il faut encore se rappeler ce qu'est Ⓑ.
5. **m** Hors ligne, « Annuler l'envoi » est un lien souligné sans cadre (`.m3-lienm`, aucune marge intérieure, environ 20 px de
   haut), posé dans la marge à côté de la photo, avec « en file pour l'IA » (`m3-hors-ligne`). La cible est sous 24 px, et on
   ne sait pas si c'est la photo ou la note 6 qui part.
6. **m** En saisie, la vignette de la photo jointe, avec sa pastille « 1 », remplace l'icône de l'appareil (`m3-note`). Le
   bouton ne dit plus qu'il prend une photo, et rien n'indique comment en ajouter une seconde.
7. **m** La relecture mêle deux numérotations. La carte cite « note 2, note 3, note 6… », et la marge en face dit « raison 1 »,
   « raison 2 » (`m3-relire`). La carte s'insère entre la note 1 et la note 2, et coupe ses lignes en deux blocs.
8. **m** Ⓑ change de statut sans geste : « pas retenue » à la décision et à la tâche (`m3-decide`, `m3-tache`), puis « pas eu
   besoin » au résolu, le même libellé que Ⓒ en réserve (`m3-resolu`).
- **D** La marge de la note 1 la paraphrase sur trois lignes (« le problème · la flaque revient · à chaque nettoyage »,
  `m3-range`), pour une valeur faible.
- **D** « coût de Ⓑ estimé, évité » s'affiche dès la décision, avant que le joint soit changé (`m3-decide`).
- **D** L'erreur n'a pas d'options ni de tâche lues, alors que l'état hors ligne les a (`m3-erreur`). La marge par l'app
  suffit peut-être.
- **D** L'achat n'a pas de Retenir dans « Comparer » (`m3-achat`). C'est normal tant que la largeur manque.
- **D** Les lignes vides du papier occupent environ 40 % de l'écran au départ (`m3-note`). C'est l'idée de M3 ; non compté.

Parcours : noter vite ✓ (↑ Ajouter sans IA) · attente ✓ (marge en squelette, Arrêter) · trouvé / pas trouvé ✓ · devis ✓ ·
coût ✓ (coût réel 12 CHF lu dans sa note 8) · options ✓ (lettre et nom) · décider ✓ · tâche ✓ (date de sa note 7) ·
résoudre ✓ · relire pourquoi ✓ (citations entières, « Pas retenu : Ⓑ joint, sanitaire », « Si ça revient : Ⓒ ») · carnet
hors problème ✓ (achat comparé) · sans IA ✓ (hors ligne et erreur) · annuler ✗ (la feuille promet une valeur fausse).
**Note : 7,5/10** (6,5 à l'itération 2). C'est le plus gros progrès des quatre : marge lisible, options nommées, résoudre
dessiné. Le bloquant ne tient qu'à une ligne à retirer. Restent l'aplat noir de la frise et les jetons sans source.

## M4 · Deux vues : 8 problèmes, 0 bloquant

Itération 2 : les 10 problèmes sont corrigés.
- 1 (IA pleine) : corrigé, voir le commun.
- 2 (9 boutons) : corrigé. Une case par proposition et un seul plein, « Tout garder » (`m4-range`). Voir le nouveau 1.
- 3 (mode d'emploi) : corrigé. La carte en 3 étapes et la légende du trait violet sont retirées (`m4-noter`,
  `m4-notes-lues`).
- 4 (capitales) : corrigé, titres en casse normale, gris, 14 px (« Ensuite », « En réserve », « Le chemin »).
- 5 (conseil en bas) : corrigé, le conseil coiffe les options (`m4-options`).
- 6 (Retenir gris) : corrigé, contour normal (`m4-decide`).
- 7 (aplats hors ligne) : corrigé, aucun plein ; la puce redondante est retirée (`m4-sans-ia`).
- 8 (mémo de 600 px) : corrigé. Une carte (ce qui tient, le point faible, ses mots cités), Relier, ses 3 notes (`m4-memo`).
- 9 (chiffre nu) : corrigé, « note 3 » partout.
- 10 (deux horodatages) : corrigé, une seule ligne « mar. 24 nov. · 21:26 » (`m4-noter`).
- D levés : « quelques CHF · l'IA, pas tes notes » ; « pas eu besoin : plus de flaque · note 9 » (`m4-relire`).

Nouveaux :
1. **m** La case vide a deux sens. La revue annonce « 3 à garder » pour quatre cases : une déjà cochée (« 3 options pour
   réparer ») et trois vides (« Je cherche ? », la tâche, le repli) (`m4-range`). Ici, une case vide veut dire « pas encore
   gardé ». Dans la feuille (`m4-annuler`), elle veut dire « refusé ». Le même signe porte deux sens opposés, à un toucher
   d'écart.
2. **m** Le plan B est dit trois fois. « Si la flaque reste : contacter l'entreprise X » est dans Ensuite, et « Le sanitaire
   change le joint » et « Le sanitaire cherche sous la dalle » sont dans En réserve (`m4-decide`, `m4-tache`, `m4-sans-ia`).
   Cela fait trois cartes pour un seul plan B, en bas d'écran.
3. **m** La couleur du bouton plein n'a pas de règle. Le violet sert à « Tout garder » et « Relier » (`m4-range`, `m4-memo`),
   le noir à « Retenir », « Garder », « Cocher » et « Résolu » (`m4-options`, `m4-decide`, `m4-tache`, `m4-resoudre`). Ce sont
   pourtant tous ses accords à des propositions.
4. **m** Hors ligne, on ne sait pas ce que « Retirer » retire (`m4-sans-ia`) : la note 9, ou son envoi à l'IA ? Un brasseur
   peut y lire « supprimer ma note ». M1 et M2 disent « Annuler l'envoi ».
5. **m** Le champ de saisie tient sur une ligne et défile vers la gauche : le début de la note tapée disparaît (« on 150 CHF
   (exemple). », `m4-noter`, `.m4-champ` de 44 px, `nowrap`). M1 passe à deux lignes pendant la frappe.
6. **m** La relecture est ouverte par « siphon » sur Organisé, mais le mot n'est surligné nulle part (`m4-relire`). On ne voit
   pas pourquoi ce carnet est sorti. M2 met le mot en gras dans sa note.
7. **m** Des cibles restent sous 44 px : « Changements » fait 36 px (`.m4-chg`, seule porte vers l'annulation), et les boutons
   40 px (`.m4-btn` : Garder, Cocher, Non, Oui, Retirer).
8. **m** En réserve, les options ont un « Retenir » à la décision (`m4-decide`), puis deviennent de simples pastilles, sans
   geste, à la tâche et hors ligne (`m4-tache`, `m4-sans-ia`). Peut-il encore changer d'avis (B3) ?
- **D** La tâche faite est barrée (`m4-sans-ia`, `m4-resoudre`). C'est le seul texte barré des quatre maquettes. Il est lisible,
  mais le barré a été retiré ailleurs.
- **D** « Vue du 28 nov. à 10:05 », au-dessus de sa note 9 du 30 nov. (`m4-sans-ia`), est juste (la vue est figée) mais
  demande un calcul.
- **D** Le pictogramme « ≈ » bleu pour l'estimation (`m4-relire`) est le quatrième signe de la relecture.

Parcours : noter vite ✓ (clavier dessiné, Ajouter, Coller) · attente ✓ (« L'IA lit tes 6 notes et ton lien », Arrêter) ·
trouvé / pas trouvé ✓ · devis ✓ · coût ✓ (« Coût du joint : pas noté · + Noter ») · options ✓ (conseil en tête) · décider ✓
(sa note 7 citée, « Retenir touché à 21:40 ») · tâche ✓ (date de « samedi », note 7 ; « Cocher la tâche ? » depuis la note
8) · résoudre ✓ (notes 8 et 9 citées, « Pas encore / Résolu ») · relire pourquoi ✓ (« Pourquoi tu as pris ça », « Ce que tu
savais alors », « Si ça revient », chemin daté au résolu) · carnet hors problème ✓ (mémo) · sans IA ✓ (hors ligne et erreur,
« lu par l'app ») · annuler ✓ (renvois « notes 2, 3 › », « Garder 4 sur 5 »).
**Note : 9/10** (8,5 à l'itération 2). C'est toujours le meilleur modèle : ses mots ne bougent jamais, Organisé se défait, la
relecture et le chemin sont les plus clairs. Ce qui reste est fin : le sens de la case, la règle de couleur, des redites
dans le plan B.

---

## Communs à plusieurs maquettes
- **Couleur du bouton plein** (M1, M4 ; M2 et M3 tiennent la règle « violet = lancer l'IA, noir = ton accord ») : fixer une
  règle et l'écrire.
- **Commandes de l'annulation sous 44 px** : M1 32 px, M2 36 px, M4 36 px. C'est la porte de la confiance ; M3 seule fait
  44 px.
- **Changement fantôme « à acheter → attendu »** : M1 (m) et M3 (B) ; M2 et M4 l'ont retiré.

## Greffes proposées au concepteur
- La case dans la frise de M4 (« ☐ Je cherche ? ») donne à M1 le geste qui lui manque pour l'état proposé.
- La pilule d'état bleue de M1 et M4 remplace l'aplat noir de la frise de M3.
- Le n° dans chaque jeton (M1, M2, M4) passe dans M3.
- La phrase « 1 envoi à l'IA attend le réseau · Annuler l'envoi » de M2 remplace « 8 notes attendent le réseau » (M1) et
  « Retirer » (M4).
- Le repli complet par l'app (jetons, options, tâche), présent hors ligne dans M2, va aussi dans l'état d'erreur de M2.
- Le mot cherché en gras dans sa note (M2) passe dans les relectures de M4 et M1.
- M1 et M3 retirent la ligne « Devis : à acheter → attendu » de la feuille, comme M4.
