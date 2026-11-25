# Persona ux, itération 4, finale (25.11)

Regard : concepteur d'interfaces mobiles compactes, pas le brasseur. Grille : boosters-ux (B1 à B13) et impeccable (mode
Operate), soumis à DESIGN.md et à ses plaintes (CARNET-COHERENT, CHAMP-CARNET-REPLIE, CARNET-REPOND-AU-BESOIN,
CARNET-LISTE-COMPACTE). Jugé après la correction 3, sur les captures de `cap/` (18:20 à 18:24). Toutes ont été ouvertes :
- M1, 13 : note, attente, cherche, cherche-bas, erreur, change, decide, tache, resoudre, resolu, relire, hors-ligne, achat ;
- M2, 13 : avant, attente, apres, options, decide, tache, resoudre, resolu, relire, memo, sans-ia, erreur, annuler ;
- M3, 13 : note, attente, range, annuler, options, decide, tache, resoudre, resolu, relire, hors-ligne, erreur, achat ;
- M4, 14 : noter, attente, erreur, range, options, decide, notes-lues, tache, sans-ia, resoudre, resolu, relire, memo, annuler.

Certains noms de la page sont des copies octet pour octet (même md5) : `m1-avant` = `note`, `m1-apres` = `cherche`,
`m1-annuler` = `change`, `m3-avant` = `note`, `m3-apres` = `range`, `m4-avant` = `noter`, `m4-apres` = `range`.

Mesures prises dans le CSS, en px CSS (la moitié de la capture de 780 px) :
- **Tailles de texte.** M1 : 14 / 16 / 24 ; M2 : 14 / 16 / 20 ; M3 : 14 / 16 / 24 ; M4 : 14 / 16 / 20. La règle des 3 tailles
  tient partout.
- **Barré.** Aucun texte barré dans les quatre (0 `line-through`).
- **Bouton plein.** Il est noir partout, et il y en a au plus un par écran, vu sur les 53 captures.
- **Cibles sous 44 px qui restent :**
  - M3, `.m3-lienp` : 26 px. C'est la pastille du lien collé, qui s'ouvre au toucher ;
  - M4, `.m4-bascule span` : 42 px. Le rail de 3 px porte la zone à 48 px ;
  - les cases dessinées font 24 à 28 px dans une ligne d'au moins 44 px (`.m3-tache` 48 px, carte de M2 44 px) : pas
    compté.
- **Pointillés.** M1 en a 12 règles, M2 2, M3 8 et M4 16. Le sens de chacun est détaillé plus bas. Les pointillés
  « imaginé » (jaune, sarcelle ou ardoise) appartiennent à la maquette seule et ne sont pas jugés.

Légende : **B** = bloquant (geste impossible ou caché, valeur fausse ou invérifiable, élément demandé absent, texte
illisible) ; **m** = mineur ; **D** = doute, non compté.

---

## M1 · Le carnet se range : 4 problèmes, 0 bloquant

Itération 3 : les 7 problèmes sont corrigés.
- **1, changement fantôme.** Corrigé. La feuille (`m1-change`) n'a plus aucune ligne « à acheter ». Elle annonce « défaire ne
  remet jamais une lecture fausse ».
- **2, repli dans la tâche.** Corrigé. n4 est sortie de la carte Tâche et forme son bloc « Si la flaque reste »
  (`m1-cherche-bas`, `m1-decide`). Au résolu, elle dit « → n'a pas servi ».
- **3, état proposé sans geste.** Corrigé. La frise a une case « Je cherche ? » de 44 px (`m1-cherche`), et la feuille la
  reprend sous « Proposé, pas posé » (`m1-change`).
- **4, annulation à 32 px.** Corrigé. « 7 par l'IA » est dans la barre du haut, à 44 px (`.m1-chg`).
- **5, couleur du plein.** Corrigé. Le plein est toujours noir : Ranger, Réessayer, Retenir, Garder la tâche, Oui résolu,
  Garder la sélection.
- **6, libellé hors ligne.** Corrigé. On lit « 1 envoi à l'IA attend le réseau · Annuler l'envoi », puis « Annuler l'envoi
  garde ta note » (`m1-hors-ligne`).
- **7, redites.** Corrigé :
  - le jeton « coût réel » est retiré ;
  - « 1 offre » est en contour (`m1-achat`) ;
  - l'icône de « Pourquoi ce choix » devient ① (`m1-relire`).
- **D levé.** « 12 changés » n'est plus en relecture. L'en-tête de `m1-relire` montre la recherche « siphon », et « siphon »
  est surligné dans la citation.

Nouveaux :
1. **m** Le pointillé gris a trois sens, et le violet un quatrième :
   - gris, le repli « Si la flaque reste » (`.m1-planb` ; `m1-cherche-bas`, `m1-decide`, `m1-tache`, `m1-resolu`) ;
   - gris, la lecture locale « Lu par l'app » (`.m1-loc` ; `m1-erreur`, `m1-hors-ligne`) ;
   - gris, la dernière vue datée, avec le jeton « vue de l'IA · 24 nov. 21:31 » (`.m1-j.vue` ; `m1-hors-ligne`) ;
   - violet, « proposé ».

   Au coup d'œil, on ne sait pas quel cadre attend un geste (B9, cohérence). M2 a réglé ce défaut à l'itération 3.
2. **m** « Proposé » a deux signes :
   - une case vide en pointillé : la frise « Je cherche ? » (`m1-cherche`) et « Proposé, pas posé » dans la feuille
     (`m1-change`) ;
   - des cases pleines violettes, cochées d'avance : « Changer le joint du siphon » et « Quand : samedi 28 nov. »
     (`m1-decide`), les trois cases de « résolu ? » (`m1-resoudre`).

   Dans la feuille, la même case pleine veut dire « fait par l'IA ». Une case pleine dit donc tantôt « déjà fait », tantôt
   « sera fait si tu acceptes ».
3. **m** Hors ligne, les « Retenir » contredisent leur légende. Les trois options gardent un « Retenir » actif, mais le
   cadre juste dessous dit « Retenir, tâche, date : l'IA te les proposera au retour du réseau » (`m1-hors-ligne`). On ne
   sait pas si toucher Retenir marche sans réseau. M4 garde Retenir hors ligne sans le contredire.
4. **m** Les options changent de nom d'un état à l'autre :
   - ② est « Le sanitaire, entreprise X » (`m1-cherche`, `m1-decide`, `m1-relire`), puis « Le sanitaire » (`m1-tache`,
     `m1-resolu`) ;
   - ③ est « Ouvrir la dalle », puis « La dalle » (`m1-relire`).

   Le libellé d'une option devrait être fixe, comme dans M4.

Doutes :
- **D** L'en-tête collé fait environ 217 px (26 % de l'écran) : titre, méta, frise avec sa case de 44 px, deux rangées de
  jetons. Avec la barre du bas, il reste environ 66 % pour le contenu. Dans `m1-tache`, la note 3 est coupée sous l'en-tête.
- **D** À `m1-resoudre`, Coût ne garde que n6, alors que le jeton « devis attendu n5 » reste en tête.
- **D** L'achat titre « Ce que je veux » à la première personne, alors que le reste lui parle en « tu » (`m1-achat`).

Parcours :
- noter vite ✓ (Ajouter sur le clavier, Coller en pastille) ;
- attente ✓ (Arrêter à 44 px) ;
- trouvé / pas trouvé ✓ (« dalle pas trouvée · ? à vérifier » dans la vue d'ensemble) ;
- devis ✓ ;
- coût ✓ ;
- options ✓ (① conseillée, seul Retenir plein) ;
- décider ✓ (« = la raison du choix ») ;
- tâche ✓ (date tirée de « samedi », conseil qui ferme la boucle) ;
- résoudre ✓ (« D'après la note 10 », Oui résolu) ;
- relire pourquoi ✓ (raison, « Ce que tu savais alors », « Ce qui a marché », chemin daté) ;
- carnet hors problème ✓ (achat) ;
- sans IA ✓ (erreur et hors ligne limités à la lecture locale) ;
- annuler ✓ (feuille sans retour faux, « Avant, 21:30 »).

**Note : 9/10** (8,5 à l'itération 3). C'est le parcours le plus complet, et les sept défauts sont partis. Ce qui reste
touche aux signes : le pointillé et la case.
**Verdict :** parcours le plus complet, ordre stable ; reste à donner un seul sens au pointillé et à « proposé ».

## M2 · La fiche au-dessus : 5 problèmes, 0 bloquant

Itération 3 : les 7 problèmes sont corrigés.
- **1, pointillé à trois sens.** Corrigé. Le pointillé ne dit plus que « proposé » : la frise « Je cherche ? » et « Résolu ? »,
  le cadre Proposé. « Lu par l'app » (`m2-sans-ia`, `m2-erreur`) et le jeton de la dalle sont en trait plein.
- **2, rangée qui défile.** Corrigé. Deux rangées au plus, tout est visible.
- **3, libellés.** Corrigé. « En réserve » au résolu comme en relecture. La date de la décision est dans la frise
  (« Décidé · toi, 25 nov. »).
- **4, erreur sans repli.** Corrigé. `m2-erreur` a le même bloc « Lu par l'app » que hors ligne, et Réessayer remplace
  Ranger.
- **5, compte de revoir.** Corrigé. « revoir · N » partout, et la feuille dit « Changé par l'IA · 6 » et « Garder 5 sur 6 ».
- **6, cibles à 36 px.** Corrigé. « revoir », le chevron, la flèche Ajouter, Annuler l'envoi, + Noter et Réessayer font 44 px.
- **7, champ étroit.** Corrigé. En saisie, le champ prend toute la largeur et la note tient sur une ligne (`m2-avant`).

Nouveaux :
1. **m** Le chevron de la fiche dit à la fois « ouvert » et « replié ». Il pointe vers le haut à `m2-apres` (fiche ouverte),
   puis vers le bas à `m2-options`, `m2-decide`, `m2-tache` et `m2-resoudre`, où la fiche est tout aussi ouverte. Il pointe
   encore vers le bas à `m2-resolu`, où la fiche est « repliée ». On ne peut pas prévoir ce que fera le toucher
   (`#m2-haut` une fois, `#m2-bas` cinq fois).
2. **m** La tâche est proposée avant le choix. À `m2-apres`, « Proposé » coche d'avance « Je cherche » et « Tâche : changer
   le joint », avec « Garder les 2 ». C'est avant que les options soient montrées (`m2-options`) et qu'une soit retenue
   (`m2-decide`). Un seul toucher pose donc la tâche de l'option conseillée sans l'avoir retenue. M4 ne propose la tâche
   qu'après Retenir (« d'après l'option retenue »).
3. **m** La question reste posée alors que la raison est donnée. Sous « Ta raison : « joint du siphon trouvé usé » n°2,
   touchée par toi », on lit encore « Pourquoi ? Touche une de tes notes, ou écris » avec « Écrire » (`m2-decide`). On
   croit qu'il manque encore la raison.
4. **m** « Annuler le reste », à côté de « Garder 5 sur 6 », ne dit pas ce qu'il défait (`m2-annuler`) : les cases cochées,
   la case décochée, ou tout sauf les deux cadenas ? M1 dit « Avant, 21:30 », M3 « Version de 21:29 », M4 « Avant l'IA ·
   21:26 ».
5. **m** Le beige porte un rappel, pas une attente. Le beige dit « en attente » : le jeton « devis attendu n°5 » et la
   barre « 1 envoi à l'IA attend le réseau » (`m2-sans-ia`). À `m2-tache`, l'étiquette « prochain nettoyage » prend le même
   beige, alors que c'est un conseil.

Doutes :
- **D** L'icône horloge sert à « revoir » (l'historique) et à « Ranger » en attente (`m2-attente`, `m2-sans-ia`).
- **D** À `m2-resoudre`, la fiche ne montre plus l'option retenue ni la tâche. Seule la proposition les nomme.
- **D** `m2-decide` n'a pas de bandeau « imaginé », alors que la décision « toi, 25 nov. » n'est pas dans le carnet réel.
  Cela relève du persona ia.
- **D** La moitié basse est vide dans `m2-avant`, `m2-attente`, `m2-memo`, `m2-sans-ia` et `m2-erreur` : ce sont des cas
  courts.
- **D** « revoir · 2 » reste en relecture, et « ✓ Résolu » remplace « Local » dans la barre (`m2-relire`).

Parcours :
- noter vite ✓ (champ large, Ajouter sans IA, Coller en pastille) ;
- attente ✓ ;
- trouvé / pas trouvé ✓ ;
- devis ✓ ;
- coût ✓ ;
- options ✓ (conseillé, seul Retenir plein) ;
- décider ✓ (raison touchée dans ses notes, « ✓ ta raison ») ;
- tâche ~ : proposée trop tôt, mais la date vient bien de la note 7 (« Mettre / Non ») ;
- résoudre ✓ ;
- relire pourquoi ✓ (tableau Retenu / En réserve / ? à vérifier / Résultat, « siphon » en gras) ;
- carnet hors problème ✓ (mémo, Lier) ;
- sans IA ✓ (hors ligne et erreur, même repli honnête) ;
- annuler ✓ (cadenas sur les lectures corrigées, la case décochée retire son jeton derrière la feuille).

**Note : 8,5/10** (8 à l'itération 3). La fiche est la plus sobre et le pointillé a enfin un seul sens. Restent le
chevron, et une tâche posée avant la décision.
**Verdict :** la plus sûre pour la confiance ; corriger le chevron et ne proposer la tâche qu'après Retenir.

## M3 · Dans la marge : 5 problèmes, 0 bloquant

Itération 3 : les 8 problèmes sont corrigés.
- **B1, retour faux dans la feuille.** Corrigé. La feuille a 5 lignes, sans « à acheter », et la ligne décochée est le lien
  (`m3-annuler`).
- **2, frise noire.** Corrigé. L'état courant est une pilule bleue, les états passés sont en bleu clair, et le noir reste au
  seul bouton plein.
- **3, jetons sans renvoi.** Corrigé. Chaque jeton de lecture porte « · n° 2 », « · n° 3 », etc.
- **4, lettres nues dans la marge.** Corrigé. Chaque lettre porte son nom : « Ⓑ joint, sanitaire », « Ⓒ dalle, sanitaire ».
- **5, Annuler l'envoi à 20 px.** Corrigé. C'est un bouton de 44 px, avec « Ta note 8 reste ici ; seul l'envoi à l'IA
  attend » (`m3-hors-ligne`).
- **6, vignette à la place de l'appareil.** Corrigé. L'appareil reste, avec une pastille « 1 » (`m3-note`).
- **7, deux numérotations en relecture.** Corrigé. La carte est retirée, et le pourquoi est dans la marge en face de ses
  lignes (`m3-relire`).
- **8, statut de Ⓑ.** Corrigé. Ⓑ est « pas retenue » partout.

Nouveaux :
1. **m** Le champ est étroit en saisie. La note en cours tient sur trois lignes, « Estimation / 150 CHF / (exemple). », dans
   environ 160 px, entre l'appareil, le micro, la flèche et « Annoter » (`m3-note`). M2 a corrigé ce défaut à l'itération
   3, avec le champ pleine largeur en saisie.
2. **m** Le mot cherché n'est pas marqué en relecture. L'en-tête dit « trouvé par « siphon » · 14 mars », mais « siphon »
   n'est pas surligné dans la note 2. Le soulignement lavande couvre aussi les notes 3, 6, 8 et 9 (`m3-relire`), si bien
   qu'on ne voit pas pourquoi ce carnet est sorti. M1, M2 et M4 surlignent le mot.
3. **m** La pastille du lien collé fait 26 px (`.m3-lienp`). Elle apparaît dans `m3-range` et `m3-options`, et
   « fournisseur-a.ch » dans `m3-achat`. C'est la seule cible sous 44 px de la maquette.
4. **m** La marge redit les jetons. Dans `m3-range`, la marge dit « ✓ trouvé · cause probable » et « ? pas trouvée, à
   vérifier ». Les jetons « ✓ joint du siphon usé · n° 2 » et « ? dalle pas trouvée, à vérifier · n° 3 », juste au-dessus,
   disent la même chose au même moment. La redite revient aussi dans `m3-hors-ligne`. L'itération 2 avait obtenu une marge
   qui dit autre chose.
5. **m** « par toi · 25 nov. » est collé au titre dans l'en-tête de `m3-options`. Il se lit comme l'auteur et la date du
   carnet (créé le 24 nov.), pas comme « Je cherche, posé par toi ». M4 l'écrit sous la frise : « Je cherche : posé par toi
   le 25 nov. à 13:22 ».

Doutes :
- **D** Trois jetons n'ont pas de n° : « ✓ décidé : joint, toi-même » et « tâche : changer le joint » (`m3-decide`,
  `m3-tache`), « 39 à 289 CHF » (`m3-achat`). Ils dérivent d'une décision ou de deux notes.
- **D** La relecture n'a pas de chemin daté : on ne lit ni la date de la décision ni celle du résolu (`m3-relire`). M1 et
  M4 en ont un.
- **D** Hors ligne, « hors ligne » remplace « Changé » dans l'en-tête : la feuille n'est plus accessible (`m3-hors-ligne`).
- **D** À `m3-resoudre`, la carte de la tâche disparaît. Seule la proposition la nomme.
- **D** Les lignes vides du papier occupent environ 40 % de l'écran au départ (`m3-note`). C'est l'idée de M3, non comptée.

Parcours :
- noter vite ✓ (↑ Ajouter sans IA, Coller) ;
- attente ✓ (marge en squelette, Arrêter) ;
- trouvé / pas trouvé ✓ ;
- devis ✓ ;
- coût ✓ (« coût réel : 12 CHF », note 8) ;
- options ✓ (lettre et nom, conseil) ;
- décider ✓ (« ta raison : ta note 2, touchée par toi ») ;
- tâche ✓ (date de la note 7, « Après : au prochain nettoyage… ») ;
- résoudre ✓ ;
- relire pourquoi ✓ (« ✓ ta raison », « tu savais alors », « ce qui a marché » en face des lignes) ;
- carnet hors problème ✓ (achat comparé) ;
- sans IA ✓ (erreur et hors ligne, pointillé gris = lu par l'app seulement) ;
- annuler ✓ (plus de retour faux).

**Note : 8/10** (7,5 à l'itération 3). Le bloquant est levé, la frise et les pointillés sont cohérents. Restent la saisie
étroite et une relecture moins claire que celle des autres.
**Verdict :** idée forte enfin lisible ; il manque le champ large, le mot cherché marqué et un lien touchable.

## M4 · Deux vues : 4 problèmes, 0 bloquant

Itération 3 : les 8 problèmes sont corrigés.
- **1, case vide à deux sens.** Corrigé. La feuille passe aux interrupteurs, avec « sera retiré » en rouge (`m4-annuler`).
  La case ne veut plus dire que « proposé, pas encore gardé » (`m4-range`, « 2 à garder » pour 2 cases).
- **2, plan B dit trois fois.** Corrigé. Il n'y a plus qu'une option, « Le sanitaire cherche sous la dalle · si la flaque
  reste » (`m4-decide`, `m4-tache`, `m4-sans-ia`).
- **3, couleur du plein.** Corrigé. Le plein est noir partout : Tout garder, Retenir, Garder, Cocher, Résolu, Relier,
  Réessayer, Garder 1 sur 2.
- **4, « Retirer ».** Corrigé. « Annuler l'envoi », avec « La note 9 est gardée ; son envoi à l'IA attend le réseau »
  (`m4-sans-ia`).
- **5, champ d'une ligne.** Corrigé. Le champ passe à deux lignes en frappe (`m4-noter`).
- **6, siphon non surligné.** Corrigé. Il est surligné dans l'en-tête et dans « Joint du siphon » (`m4-relire`).
- **7, cibles sous 44 px.** Corrigé. Changements, boutons, case de la frise et Coller font 44 px. Voir le D de la bascule.
- **8, réserve sans geste.** Corrigé. « Retenir » est en contour à la décision, à la tâche et hors ligne.

Nouveaux :
1. **m** Le pointillé a quatre couleurs et cinq sens :
   - violet, « proposé » (`m4-range`, `m4-decide`, `m4-resoudre`) ;
   - brun, « en attente » : « Rangement… » (`m4-attente`), « Pas encore lue par l'IA » et « 1 en file » (`m4-sans-ia`) ;
   - gris, « l'IA te le proposera » (`m4-erreur`) ;
   - gris encore, « Si ça revient » (`m4-relire`) ;
   - vert, pour « Résolu ? » (`m4-resoudre`), alors que c'est le même état proposé que « Je cherche ? », en violet
     (`m4-range`).

   Le même état proposé change de couleur dans la frise, et le gris dit deux choses.
2. **m** Le beige a trois sens :
   - « à vérifier » : la carte Sous la dalle (`m4-range`, `m4-options`) ;
   - « lu par l'app » : les étiquettes « pas trouvé », « 150 CHF » et « lu par l'app » (`m4-erreur`) ;
   - le mot cherché « siphon » surligné (`m4-relire`).

   S'y ajoute le bandeau hors ligne, brun-beige (`m4-sans-ia`).
3. **m** Le bouton en contour a deux couleurs sans règle :
   - violet pour « + Noter » et « Oui » (`m4-resolu`), qui sont pourtant ses gestes à lui ;
   - noir pour « Retenir », « Pas encore », « Non », « Continuer dans Mes notes » et « Voir les notes dans Mes notes »
     (`m4-options`, `m4-resoudre`, `m4-erreur`, `m4-relire`).

   La règle écrite pour le plein, « violet = encre de l'IA », ne vaut pas pour le contour.
4. **m** Un seul « Garder » sert deux propositions. À `m4-decide`, la tâche « Changer le joint du siphon » et sa date
   « sam. 28 nov. ? » sont dans le même cadre pointillé, et le bouton est sur la ligne de la date. On ne sait pas si
   « Garder » pose les deux, et on ne peut pas garder la tâche sans la date. M1 et M3 séparent la tâche (« Garder la
   tâche ») et la date (« Mettre la date »).

Doutes :
- **D** La bascule Mes notes / Organisé fait 42 px (`.m4-bascule span`). C'est la commande la plus touchée, et le rail de
  3 px porte la zone à 48 px.
- **D** « Cocher la tâche ? » est marqué par une coche violette (`m4-tache`), alors que les autres propositions ont
  l'étincelle.
- **D** Le pictogramme « ≈ » bleu pour l'estimation reste le quatrième signe de la relecture (`m4-relire`).

Parcours :
- noter vite ✓ (champ à deux lignes, Coller, Ajouter) ;
- attente ✓ (« L'IA lit tes 6 notes et le lien », Arrêter) ;
- trouvé / pas trouvé ✓ (cartes « Joint du siphon » et « Sous la dalle ») ;
- devis ✓ (« Ne plus attendre le devis ? ») ;
- coût ✓ (« 150 CHF ? », « Coût du joint : pas noté · + Noter ») ;
- options ✓ (conseil en tête, notes citées) ;
- décider ✓ (note 7 citée, « Retenir touché à 18:40 ») ;
- tâche ✓ (après Retenir, « Cocher la tâche ? » d'après la note 8) ;
- résoudre ✓ (notes 8 et 9 citées) ;
- relire pourquoi ✓ (« Pourquoi tu as pris ça », « Ce que tu savais alors », « Pas retenu », « Si ça revient », chemin daté) ;
- carnet hors problème ✓ (mémo) ;
- sans IA ✓ (vue datée de l'IA, note 9 citée, erreur limitée à la lecture locale) ;
- annuler ✓ (interrupteurs, renvois « notes 2, 3 › », « Garder 1 sur 2 »).

**Note : 9/10** (9 à l'itération 3). C'est toujours le meilleur modèle : ses mots ne bougent jamais, Organisé se défait,
et la relecture et le chemin sont les plus clairs. Les quatre restes sont des signes à unifier : pointillé, beige,
contour, et un bouton pour deux propositions.
**Verdict :** toujours le meilleur modèle : ses mots intacts, Organisé réversible ; unifier pointillé, beige et contours.

---

## Communs à plusieurs maquettes

- **Pointillé à plusieurs sens** : M1 (gris à trois sens) et M4 (quatre couleurs). M2 et M3 tiennent la règle « un pointillé,
  un sens » : M2 n'a que « proposé » ; M3 a « proposé » en violet et « lu par l'app » en gris.
- **Signe de « proposé »** : M1 a deux signes, la case vide en pointillé et la case pleine cochée d'avance. M4 n'a que la case
  vide.
- **Tâche et option retenue absentes à l'état « résoudre »** : M2 et M3 (D), alors que M1 et M4 les gardent à l'écran.
- **Bouton plein** : noir et unique dans les quatre, sur tous les états. Ce commun de l'itération 3 est réglé.
- **Annulation** : les quatre portes font 44 px, et aucune feuille ne remet de valeur fausse. Ce commun est réglé aussi.

## Ce qui reste à faire avant le port (greffes)

- Le pointillé à un seul sens de M2 passe dans M1 et M4 : « lu par l'app » et « si ça revient » en trait plein.
- La tâche « d'après l'option retenue » de M4 remplace la tâche proposée à `m2-apres`.
- Le champ pleine largeur en saisie de M2 passe dans M3.
- Le mot cherché surligné (M1, M2, M4) passe dans `m3-relire`, ainsi que le chemin daté de M1 et M4.
- Les boutons séparés de M1 et M3, « Garder la tâche » puis « Mettre la date », passent dans `m4-decide`.

## Classement ux final

M4 (9) · M1 (9) · M2 (8,5) · M3 (8). Aucun bloquant dans les quatre ; 18 mineurs au total (M1 4, M2 5, M3 5, M4 4).
