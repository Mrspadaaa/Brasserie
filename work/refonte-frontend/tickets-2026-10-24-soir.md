# Tickets houblons : état du 24.10, au soir

Demande du brasseur (24.10, soir), mot pour mot : « Met bien à jour les issues git ». Voie `tickets-soir` de la mission
`work/missions/2026-10-23-maquette-parcours/`. Ce fichier remplace le brouillon du matin (`tickets-2026-10-24.md`, jamais
publié) : le soir l'a dépassé (Substituer, Dryhopper, la liste de la fiche et l'entrée de l'analyse sont choisis).

## Comment lire

- Chaque entrée : le verdict, l'action, le texte publié (en citation), puis la ligne `- Publié : <url>` rendue par `gh`.
- Verdicts : `a-jour` (rien à ajouter, pas de commentaire), `a-completer` (un commentaire remet le ticket à jour),
  `a-fermer` (son sujet est fait ou remplacé par un choix du brasseur, ses mots cités ; `check-issue-closure.mjs` le permet),
  `creer` (issue nouvelle, parent #119 dans le titre).
- **La maquette n'est pas l'app.** `src/` est inchangé pour les houblons (dernier commit de `src/` : `2c362b6c`, #114, sans
  rapport) et la porte B reste fermée : aucun ticket d'app n'est fermé parce qu'une maquette existe. #145 et #146 restent
  ouverts même après son choix : `check-issue-closure.mjs` les refuse (CLOSURE REFUSED) et l'écran n'est pas dans l'app.
- Fermetures : #135, #136, #138, #140 (CLOSURE OK, « hors interface », rejoué le 24.10 au soir).
- Les `{{clé}}` sont remplacés par le numéro de l'issue créée au moment de publier.

## Pages en vigueur du soir (à citer)

| Sujet | Adresse |
|---|---|
| Maquette du soir (BATTERIE 42/42, ETATS 141/141, critiques 110/111) | https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN |
| Pictos hors 16D (huit jeux, deux passes) | https://claude.ai/artifact/Y7jV3JyYZw3VdPmDittgwW |
| Toutes les mini maquettes (1 172, ses choix marqués) | https://claude.ai/artifact/HEiJX4ipJhYUXwnrgizkSd |
| Dryhopper, tout (96 mini maquettes) | https://claude.ai/artifact/VXa3fDxdzm9eWxPBsD8Pvf |
| Planches · 24.10 (une rangée par vue) | https://claude.ai/artifact/X1RqagDtEqS4L2yZ63PFBy |
| Planche des graphes | https://claude.ai/artifact/JSiBVNWUJqJD8zdkvpKN9t |

## Tableau

| Ticket | Verdict | En une ligne |
|---|---|---|
| #119 | a-completer | état du soir : choix D43 à D45, D47, D52, maquette « presque à 100 % », deux points à corriger (D138, D139) |
| #122 | a-completer | liste de tickets à jour ; « avec sa quantité » en tension avec « stock en petit badge » |
| #123 | a-completer | étape Houblons choisie ; entrée de l'analyse = B ; reste le critère « quantité » |
| #124 | a-completer | Comparer : r6a revenue (D128), étapes en sélecteur, retirer/remplacer/chercher (D137), hors 16D (D130) |
| #125 | a-completer | sortie du rail 142 → 8 ms (D134) ; réactivité (D138) à corriger ; pas dans l'app |
| #126 | a-completer | Substituer = u4 (« Substitution, ça serait plus du u4 »), enrichi u4e5 |
| #127 | a-jour | `stout-porter` garde `examples: []` |
| #130 | a-jour | non attaqué, après la refonte |
| #131 | a-completer | Celeia sans fiche ; mots hors 16D (D100, D130, D131) ; α inconnu jamais 0 |
| #132 | a-jour | dose de levure : pas touchée |
| #133 | a-completer | méthode : règle n° 1, mini maquettes côte à côte, onze par vue, disposition en rangées |
| #135 | a-fermer | m4 et h4 choisis (19.10), radars dans la base v4.10 |
| #136 | a-fermer | « Mettre de côté pour le moment » ; Comparer vit dans #124 |
| #137 | a-completer | moteur fait (prototype) ; écran = u4 choisi, suivi #145 |
| #138 | a-fermer | Comparer et Suggestions : choix remplacés par r6a et q2b |
| #139 | a-completer | m4 choisi ; la base v4.10 prime ; `tastingId` à décider |
| #140 | a-fermer | lot 12 rejeté ; fiche g1 + liste flb5b choisies |
| #141 | a-completer | « au style » dans la maquette ; cas lager non repris |
| #142 | a-completer | table de pictos commune ; pictos hors 16D en choix (nouveau ticket) |
| #143 | a-completer | architecture faite ; reste B6, B9 à B11 ; contrôles à faire tourner sur l'app |
| #144 | a-completer | thème : app inchangée ; enveloppe du soir en clair toujours |
| #145 | a-completer | u4 choisi ; reprise faite dans la maquette ; l'app après la porte B |
| #146 | a-completer | p4b2f choisie (« Partir sur cette version ») ; l'app après la porte B |

Issues créées : onze (réactivité, choix non reporté, radar r2, recherche avancée, légendes, moment proposé, pictos hors 16D,
« Ses mots » de Comparer, vue Levure, pastille « ~ simulé », appui long).
Du brouillon du matin, non recréées : le rail (D123, D124) et les commentaires non pris en compte (D125) sont traités dans la
maquette du soir (BATTERIE 42/42, ETATS 141/141) et dans #143 ; la fiche (D115) est tranchée (flb5b) ; D121 est tranché (B).

---

## #119 — [P0] Mission refonte frontend houblons

- Verdict : **a-completer** (dernier commentaire : 23.10 soir).
- Action : commentaire.

> ## Mise à jour du 24.10, soir
>
> **Maquette du soir** : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN. Son verdict : « Vraiment des gros progrès […] Sauver
> cette maquette on est quasiment à du 100% ». Elle est figée comme référence. **Ce n'est pas l'app** : `src/` est inchangé pour
> les houblons, la porte B reste fermée.
>
> **Ses choix du soir** (registre `work/refonte-frontend/v4/choix/ecrans.json`) :
> - Dryhopper : p4b2f, « Partir sur cette version » ;
> - la liste de la fiche : flb5b, « Partie sur celle ci » ;
> - l'entrée de l'analyse : B, « La meilleure » ;
> - Suggérer : q2b, avec son groupe « Changer de levure » : « Celle ci aussi est toujours meilleures » ; le cran au doigt de gr5 : « Ça c'est top à mettre dans la vraie version » ;
> - Substituer : u4, enrichi (u4e5 : « Très bien+ »).
>
> **Ce qu'il a demandé et qui est fait dans la maquette** : Comparer redevient r6a au premier écran (« C'est pas du tout cette vue là réf ??? »), puis peut retirer, remplacer et chercher un houblon (« Problème principal, pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un ») ; les types hors 16D partout (« C'est très important surtout dans la comparaison !!!! ») ; la fiche exhaustive avec le pied de flu2b ; le radar de la fiche en pics ; la sortie du rail sans délai ; « Substituts › » ouvre l'onglet ; la continuité des en-têtes et des pieds.
>
> **Ses deux points à corriger ensuite** : « c'est pas ultra réactif, ça lag un peu certaines actions ont du délais... » → #148 ; « un choix sur un endroit, semble pas toujours être reporté partout » → #149.
>
> **Tickets ouverts ce soir** : #148 réactivité, #149 choix reporté partout, #150 radar r2 de Comparer, #151 recherche avancée, #152 légendes sous les pastilles, #153 moment proposé d'un ajout, #154 pictos hors 16D, #155 « Ses mots » de Comparer, #156 vue Levure, #157 pastille « ~ simulé », #158 appui long.
> **Fermés ce soir** : #135, #136, #138, #140 (choix faits ou remplacés).
>
> **Pages** : pictos hors 16D https://claude.ai/artifact/Y7jV3JyYZw3VdPmDittgwW ; toutes les mini maquettes https://claude.ai/artifact/HEiJX4ipJhYUXwnrgizkSd ; Dryhopper, tout https://claude.ai/artifact/VXa3fDxdzm9eWxPBsD8Pvf ; planches https://claude.ai/artifact/X1RqagDtEqS4L2yZ63PFBy.
>
> **Encore ouverts** : son choix de pictos hors 16D, Levure, la pastille « ~ simulé », le radar r2, les légendes, la recherche avancée.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/119#issuecomment-6389151773

---

## #122 — [ÉPOPÉE][P0] Houblons pour le brasseur

- Verdict : **a-completer** (aucun commentaire, 17.10).
- Action : commentaire.

> ## État au 24.10, soir
>
> - Le travail de conception se suit dans #119 ; l'état écran par écran est dans `work/refonte-frontend/v4/choix/ecrans.json`.
> - Tickets de la liste depuis le 17.10 : #143 (architecture de base), #144 (thème), #145 (Substituer), #146 (Dryhopper), puis ce soir #148, #149, #150, #151, #152, #153, #154, #155, #156, #157, #158.
> - Choisis : étape Houblons et Ma bière (base v4.10), Suggérer q2b, Comparer r6a (étapes de x3b), fiche g1 avec la liste flb5b, Dryhopper p4b2f, Substituer u4. Ouvert : Levure.
> - La maquette du soir (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN) n'est pas l'app. Porte B : toujours fermée.
> - À réviser avec lui : le critère « chacun avec sa quantité » face à « stock en petit badge » (#123).
> - Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. »

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/122#issuecomment-6389151933

---

## #123 — [P0] Choisir : mes houblons classés pour le style de la recette

- Verdict : **a-completer** (aucun commentaire, 17.10).
- Action : commentaire.

> ## État au 24.10, soir
>
> - **Écran choisi** : l'étape Houblons de la base v4.10 (« Ça c'est le bon. Comment cette info a été perdu ??? », 23.10). La maquette du soir la reprend : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN. Ce n'est pas l'app.
> - **Entrée de l'analyse** : B, la barre pleine « Ouvrir l'analyse de ma bière › » (« La meilleure », 24.10 soir) ; la hauteur de l'étape se compte avec elle (1,09 écran).
> - **Classement pour le style** : porté par Suggérer (q2b), au style par défaut.
> - **À trancher avec lui** : le critère « chacun avec sa quantité » (17.10) face à « Le stock en petit badge » (18.10). Option prudente : badge de stock sur la ligne, quantité à un toucher.
> - **Reste** : la preuve « un toucher, sans défiler » sur la maquette (`check-hop-one-tap.mjs`), puis l'app après la porte B (#143).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/123#issuecomment-6389152067

---

## #124 — [P0] Comparer 2 à 4 houblons côte à côte

- Verdict : **a-completer** (le commentaire du 23.10 dit « r6n2 choisie », dépassé).
- Action : commentaire.

> ## Comparer au 24.10, soir
>
> - **Choisi** : r6a, « r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites améliorations des autres versions » (23.10). Il remplace r6n2.
> - **Étapes et référence (D107)** : « je voulais comparé au moins : les étapes 60' 10' dryhopping ect comme la maquette de base. Et aussi le houblon de base ou bière de base. » Dans la maquette du soir, les étapes 60′ / 10′ / dry hop sont un sélecteur sur les rangées de r6a, Nugget en référence.
> - **Il a corrigé la forme** (24.10 soir) : « C'est pas du tout cette vue là réf ??? ». Comparer redevient r6a au premier écran : radar, colonnes et rangées de familles (D128).
> - **Retirer, remplacer, chercher** (24.10 soir) : « Problème principal, pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un ». Fait : ⇄ et × sous chaque houblon, la feuille « Remplacer » cherche tout le catalogue (D137).
> - **Types hors 16D** (24.10 soir) : « C'est très important surtout dans la comparaison !!!! ». Fait : chaque houblon dit ses mots hors des 12 familles au premier écran (D130), avec des icônes (lot de pictos : #154).
> - **À revoir avec lui** : le radar r2 (« À revoir, on va en parler » : #150), « Ses mots » (#155), la pastille « ~ simulé » (#157).
> - **Maquette** : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN. Pas dans l'app (porte B).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/124#issuecomment-6389152210

---

## #125 — [P0] Simuler : IBU et arôme de chaque ajout en moins d'une seconde

- Verdict : **a-completer** (dernier commentaire : 23.10).
- Action : commentaire.

> ## Simuler au 24.10, soir
>
> - **Calcul en direct** : tenu dans la maquette (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN). Mesure du 23.10 (#143) : toucher froid à ×4, Suggérer 798 → 288 ms, Substituer 728 → 184 ms.
> - **Sortie du rail** : « Un petit délais lors du déplacement, une fois choisir au bon emplacement, il y a un peu de délai pour "sortir" du mode rail » (24.10 soir). Cause : les propositions d'ajout rapide reclassaient tout le catalogue au lever du doigt. Corrigé : 142 → 8 ms (D134).
> - **Reste** : « c'est pas ultra réactif, ça lag un peu certaines actions ont du délais... » sur d'autres gestes : #148.
> - **Honnêteté du moteur** : pour 10 g de Motueka à 10′, le moteur ne déplace Floral que de 2,5 % de la barre ; les valeurs du moteur sont montrées telles quelles, sans grossir l'écart (D53).
> - **Pas dans l'app** : le moteur `simulerCas` n'y est pas branché ; à faire après #143, sur son feu vert.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/125#issuecomment-6389152367

---

## #126 — [P0] Remplacer un houblon : remplaçants classés, dose au même IBU, gagné et perdu

- Verdict : **a-completer** (le commentaire du 23.10 dit « encore à choisir »).
- Action : commentaire.

> ## Remplacer au 24.10, soir
>
> - **Choisi** : u4. Ses mots du 19.10 : « Substitution, ça serait plus du u4 ». Le 24.10 : « bien mais trop centré ibu, il faudrait aussi pas que à 60' mais aussi en dry hop. SI non plutôt bien. Attention à toujours utilisé la baseline. Aussi ajouter à comparé doit être facile. Et le remplacement aussi. Ainsi que ferme la vue ».
> - **Fait dans la maquette** (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN) : les remplaçants se lisent à 60′, au whirlpool et au dry hop ; ajouter à Comparer, remplacer et fermer d'un toucher ; le tableau « Arômes 16D » (« Ça c'est vraiment bien ») ; u4e5 (« Très bien+ ») avec la matrice des arômes hors 16D et les huiles.
> - **Reste** : l'app, après la porte B (#143). Suivi de l'écran : #145.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/126#issuecomment-6389152535

---

## #127 — [P1] Données : usages des houblons par style (stout comprise)

- Verdict : **a-jour**. `src/domain/hopRecipeDesign.ts` donne toujours `'stout-porter': { …, examples: [] }`.
- Action : aucune.

---

## #130 — Calcul des IBU : houblons libres ou en sac (hop bag)

- Verdict : **a-jour**. Aucune notion de forme d'ajout (libre, sac) dans `src/` ni dans le prototype. Demandé « après » la refonte.
- Action : aucune.

---

## #131 — [P1] Données houblons : plusieurs sources, huiles complètes, variabilité par récolte, biotransformation

- Verdict : **a-completer** (dernier commentaire : 19.10).
- Action : commentaire.

> ## Données au 24.10, soir
>
> - **Inchangé** : aucune source ajoutée, aucun import. La fiche Citra cryo porte toujours les plages de Citra en pellets ; sa décision sur les sources à licence non ouverte (BarthHaas, Hopsteiner, Yakima Chief…) reste à prendre.
> - **Constats** : Celeia n'a pas de fiche dans le pack ; les mots de Nelson Sauvin sans famille (83 %, D100) sont en double français et anglais.
> - **Nouveau ce soir** : « Les type spéciaux des houblons hors 16d ! C'est très important » (D130) : la maquette affiche ces mots, pris dans les fiches (32 houblons). Les 318 houblons du catalogue n'ont pas tous de fiche : leurs mots hors 16D sont inconnus (affichés « ? », jamais 0).
> - **Décidé** : un α inconnu ne s'écrit jamais 0 ; `HopIngredient.alpha` devient facultatif à l'intégration (#143).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/131#issuecomment-6389152696

---

## #132 — [P1] Levure : la choisir remplit aussi sa dose (g et sachets)

- Verdict : **a-jour**. La vue Levure de la maquette change l'arôme, pas la dose : aucun sachet dans `parcours/src`. À ne pas confondre avec #156.
- Action : aucune.

---

## #133 — [ÉPOPÉE][P1] Refaire tous les écrans de l'app avec la méthode UI v3

- Verdict : **a-completer** (aucun commentaire, 18.10).
- Action : commentaire.

> ## Méthode au 24.10, soir
>
> Depuis la v3 du 18.10, pour chaque sujet :
> - **Règle n° 1** : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Sa maquette choisie est la base de l'écran ; registre `choix/ecrans.json`, contrôle `controle-choix.mjs`. Chaque état et chaque geste de sa maquette se relève et se joue (D124).
> - **Un choix qu'on lui demande se montre en mini maquettes**, dans un artefact neuf : « Il me faut des mini maquettes avec un nouvel artefacts comme pour les mini maquettes côté à côté.... ».
> - **Côte à côte, onze par vue** : « Mais il y a très peu de mini maquettes ??? J'ai pratiquement aucun choix ?? Et j'ai pas du coté à cote » ; « Je dirais 11 par vue », celles déjà faites comprises (D126).
> - **La disposition qu'il aime** : « J'aime beaucoup cette disposition. Utilise là pour les artefacts comme ça je peux voir rapidement plusieurs versions d'un coup » : une rangée par écran, sa référence puis les mini maquettes en vignettes serrées, son verdict dessous.
> - **Continuité** : « Fait attention aux header, footer, sur la continuité de l'app ect... » (D129).
> - **Mots modérés** : « dépasse les 70 mots au premier écran c'est pas ultra grave. Il faut être modéré avec les mots » (D41).
> - Entonnoir : un vaste panel, un classement, des greffes, des passes.
>
> À reporter dans `docs/qualite/methode-conception-frontend.md` (v4) : à faire. Houblons : #119.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/133#issuecomment-6389152901

---

## #135 — [P1][#119] Radars par objet : Ma bière, Suggestions, mon houblon (lot 9) — à choisir

- Verdict : **a-fermer**. `node scripts/check-issue-closure.mjs 135` : CLOSURE OK #135 : hors interface.
- Action : commentaire puis fermeture.

> ## Choisi : fermeture (24.10, soir)
>
> - **Ses choix** : « Radar: m4 h4 très bien » (19.10) ; « Radar suggestions: p10, p5, p3-> mais radar beaucoup plus grand » (19.10).
> - **Depuis** : Ma bière et l'étape sont la base v4.10 (« Ça c'est le bon », « Ça aussi », 23.10), Suggérer est q2b, la fiche est g1 avec le radar d'abord. Ce soir, le radar de la fiche passe en pics (« le spidergraph doit être en pic pas juste des traits... Enfin comme sur les mini maquettes », D133). Registre : `work/refonte-frontend/v4/choix/ecrans.json`.
> - **Maquette** : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN.
> - Le titre « à choisir » est donc faux. Le travail restant se suit dans #119 et #143. Fermé pour choix fait ; à rouvrir s'il veut revoir les radars.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/135#issuecomment-6389153058

---

## #136 — [P1][#119] Comparer : échelles, classements, vraies comparaisons (lot 10) — à choisir

- Verdict : **a-fermer**. `node scripts/check-issue-closure.mjs 136` : CLOSURE OK #136 : hors interface.
- Action : commentaire puis fermeture.

> ## Mis de côté : fermeture (24.10, soir)
>
> - Son choix du 19.10 : « Mettre de côté pour le moment ». Les fils de fer e1, e2, r1, r2, c1 et c2 restent dans `work/refonte-frontend/v4/ecran-1/fils10-echelles/`.
> - Comparer est traité dans #124 : r6a (23.10) avec les étapes de x3b. Le classement pour un objectif est dans Suggérer (q2b).
> - Fermé ; à rouvrir s'il veut l'échelle d'une mesure ou le duel.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/136#issuecomment-6389153551

---

## #137 — [P1] Substitution de houblons : remplaçants calculés et écrans (lot 11)

- Verdict : **a-completer** (dernier commentaire : 19.10).
- Action : commentaire.

> ## Substitution au 24.10, soir
>
> - **Moteur** : fait dans le prototype (`prototypes/houblons-v4/src/engine/substitution.ts`), pas dans l'app (#143).
> - **Écran** : u4 est choisi (« Substitution, ça serait plus du u4 », 19.10 ; « bien mais trop centré ibu », 24.10), repris et enrichi dans la maquette (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN) : remplaçants à 60′ et au dry hop. Suivi de l'écran : #145 ; besoin : #126.
> - **Toujours sans réponse** : la règle « à l'amertume, entre deux scores à moins de 5 points, le moins de grammes d'abord ».
> - Ce ticket se ferme quand #145 est fermé et le moteur porté dans l'app.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/137#issuecomment-6389154012

---

## #138 — [P1][#119] Lot 6 : choisir Comparer (sur p3) et Suggestions (sur p6)

- Verdict : **a-fermer**. `node scripts/check-issue-closure.mjs 138` : CLOSURE OK #138 : hors interface.
- Action : commentaire puis fermeture.

> ## Remplacé par ses choix suivants : fermeture (24.10, soir)
>
> - **Comparer** : « Comparé: p06 », « Comparé : radar p2 mais avec ajoute d'intervalle de confiance » (19.10), puis r6a (« r6a reste le meilleur […] », 23.10). Suivi dans #124.
> - **Suggestions** : q2b (« C'est effectivement qb2 reprise le mieux », 19.10 ; « Ça oui, c'est effectivement l'un de mes choix », 23.10), repris dans la maquette du soir, avec son groupe « Changer de levure » (« Celle ci aussi est toujours meilleures », 24.10).
> - **Maquette** : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN. Fermé pour choix fait ; le suivi est dans #119 et #124.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/138#issuecomment-6389154227

---

## #139 — [P2][#119] Grille de dégustation : donner de vraies données à Ma bière

- Verdict : **a-completer** (dernier commentaire : 18.10).
- Action : commentaire.

> ## Grille au 24.10, soir
>
> - **Choisi** : m4 (« Radar: m4 h4 très bien », 19.10).
> - **Mais** : l'onglet Ma bière retenu est celui de la base v4.10 (« Ça aussi »), où la dégustation se lit en pastilles (« dégusté 18.10 · prévu · non situé »). À lui de dire si la grille s'ajoute à cet écran, en mini maquettes à côté de sa base (règle n° 1).
> - **Fait dans la maquette** : sa visée de dégustation (bannir, +, −) alimente Suggérer (D108).
> - **Toujours à décider** : `tastingId` et `notTasted` dans le modèle d'observation (code d'app, après la porte B).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/139#issuecomment-6389154519

---

## #140 — [P1][#119] Descriptions de houblons : ce que valent les carrés d'arômes, au long appui (lot 12)

- Verdict : **a-fermer**. `node scripts/check-issue-closure.mjs 140` : CLOSURE OK #140 : hors interface.
- Action : commentaire puis fermeture.

> ## Remplacé par la fiche g1 et sa liste flb5b : fermeture (24.10, soir)
>
> - Lot 12 : « Non c'est très mauvais. Tu as pas du tout bien compris le besoin […] » ; lot 12b : « Non... Un appuie long ouvre sa fiche. Comme avant, saufe que sa fiche est plus fourni avec les labels.. ».
> - Choisi : la fiche g1 (« la v1 est la meilleure »), puis, pour la liste sous le radar, flb5b : « Partie sur celle ci » (24.10 soir). Elle est exhaustive (« la carte du houblons doit bien contenir de façon exhaustive TOUTES ses informations ») avec le pied de flu2b (« Le footer est top »). Elle est dans la maquette du soir : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN.
> - Un sujet reste et passe dans un ticket à part : l'effet de l'appui long (#158).
> - Fermé pour choix fait.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/140#issuecomment-6389154760

---

## #141 — [P1][#119] Tout lire au style, l'absolu en option

- Verdict : **a-completer** (aucun commentaire, 19.10).
- Action : commentaire.

> ## Au style au 24.10, soir
>
> - **Fait dans la maquette** (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN) : « Au style / Absolu » sur l'étape, Ma bière et Suggérer ; contrôle `controle-au-style.mjs` (D75).
> - **Pas fait** : le cas de sa remarque (Citra cryo dans une lager, son apport posé sur la bande du style) : la maquette ne joue que la stout 16D. Comparer et la fiche n'ont pas de lecture « au style » vérifiée.
> - **Reste** : le cas lager en mini maquettes ; l'app après la porte B.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/141#issuecomment-6389155357

---

## #142 — [P2][#119] Normaliser l'affichage : mêmes formes, couleurs harmonisées

- Verdict : **a-completer** (dernier commentaire : 23.10).
- Action : commentaire.

> ## Normaliser au 24.10, soir
>
> - **Fait dans la maquette** : une seule table de pictos et de couleurs pour les 12 familles ; contrôle `controle-standard.mjs` (D83) ; continuité de l'en-tête et du pied d'un écran à l'autre (« Fait attention aux header, footer, sur la continuité de l'app ect... », D129).
> - **Nouveau** : les types hors 16D reçoivent des icônes ; il choisit le jeu : #154.
> - **Thème** : les couleurs de ses maquettes choisies (blanc neutre) sont l'objet de #144.
> - **Reste** : l'app après la porte B.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/142#issuecomment-6389155529

---

## #143 — [P0][#119] Intégration houblons : poser l'architecture de base avant d'implémenter

- Verdict : **a-completer** (dernier commentaire : 23.10).
- Action : commentaire.

> ## Architecture au 24.10, soir
>
> - **Fait** : phase 1 (commentaire du 23.10). Performance : toucher froid à ×4, Suggérer 798 → 288 ms, Substituer 728 → 184 ms ; le 24.10 soir, la sortie du rail passe de 142 à 8 ms (D134).
> - **Reste** : B6 (atelier V5.5 remplacé ou gardé), B9 à B11 ; le thème en jetons (#144).
> - **Contrôles** : la maquette du soir passe BATTERIE 42/42 et ETATS 141/141 ; ces contrôles lisent des pages de maquette et devront tourner sur l'app (D124).
> - **Nouveau** : réactivité (#148) et choix reporté d'un écran à l'autre (#149) sont à corriger dans la maquette, puis à vérifier dans l'app.
> - **Porte B** : pas de feu vert. Rien n'est dans l'app.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/143#issuecomment-6389155687

---

## #144 — [P1] Thème : les couleurs de ses maquettes choisies (blanc neutre) pour toute l'app

- Verdict : **a-completer** (aucun commentaire).
- Action : commentaire.

> ## Thème au 24.10, soir
>
> - **App** : inchangée. La voie qui met les jetons par thème dans l'app (t1) n'a pas été rendue ; DESIGN.md porte la décision.
> - **Maquette** : `theme-maquettes.css` (blanc neutre, texte #111, action noire). Le matin, sur son téléphone en thème sombre, l'enveloppe s'affichait sombre ; l'enveloppe du soir pose le thème clair toujours (D106).
> - **Ordre inchangé** : jetons par thème, réglage, contrôle de contraste, puis vérification de chaque écran dans les deux thèmes.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/144#issuecomment-6389155832

---

## #145 — [P1][#119] Vue Substituer

- Verdict : **a-completer** (dernier commentaire : 24.10 matin, « choix ouvert »).
- Action : commentaire. Pas de fermeture : `check-issue-closure.mjs 145` → CLOSURE REFUSED, et l'écran n'est pas dans l'app.

> ## Substituer au 24.10, soir : u4 est son choix
>
> - **Choisi** : u4. « Substitution, ça serait plus du u4 » (19.10) ; « u4 · ton choix, est la meilleure mais il manque juste un ou deux changements type, moins focus sur l'ibu, substitution en fonction de l'étape (60' ou dry hopp) » (24.10). Le choix « la porte ou u4 » est donc tranché : u4.
> - **Repris dans la maquette du soir** (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN) : remplaçants à 60′, au whirlpool et au dry hop ; ajouter à Comparer, remplacer et fermer d'un toucher (D127) ; u4e5 « Très bien+ » avec la matrice de flb5b (arômes hors 16D) et les huiles. La réserve du matin (deux colonnes là où u4 en classait huit) est reprise par cette version.
> - **Reste** : l'app, après la porte B (#143). Ce ticket reste ouvert.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/145#issuecomment-6389155995

---

## #146 — [P1][#119] Vue Dryhopper

- Verdict : **a-completer** (dernier commentaire : 24.10 matin, « à revoir »).
- Action : commentaire. Pas de fermeture : `check-issue-closure.mjs 146` → CLOSURE REFUSED, et l'écran n'est pas dans l'app.

> ## Dryhopper au 24.10, soir : p4b2f est son choix
>
> - **Choisi** : p4b2f (« L'aire du floral », retouche de p4b2), « Partir sur cette version » (24.10). Avant : « Ça j'aime beaucoup mais c'est encore assez peu lisible » sur p4b2. Le registre `choix/ecrans.json` passe de « ouvert, a1 provisoire » à « choisi ».
> - **Pages** : toutes les mini maquettes de Dryhopper, 96 depuis le 19.10, sa p4b2f en tête : https://claude.ai/artifact/VXa3fDxdzm9eWxPBsD8Pvf. Maquette du soir : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN.
> - **Le rail** (24.10 matin) : « Le rail c'est toujours n'importe quoi. Il y a un vrai historique dessus, pourquoi tu es revenu sur un choix que je n'ai pas fait ? » Le vocabulaire de Dryhopper n'est plus dans le rail de l'étape, qui garde celui de sa base v4.10.
> - **Reste** : l'app, après la porte B (#143). Ce ticket reste ouvert.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/146#issuecomment-6389156125

---

# Issues à créer

Libellés : `type:task`, une priorité, `status:backlog`, `interface`. Mots du brasseur mot pour mot (SPEC § 1, DEFAUTS).

## À créer 1 — clé : react

- Verdict : **creer**
- Titre : [P1][#119] Réactivité : « c'est pas ultra réactif, ça lag un peu » (D138)
- Libellés : type:task,P1,status:backlog,interface

> Demande du brasseur (24.10, soir, sur la maquette entière) : « Vraiment des gros progrès, problème principal, c'est pas ultra réactif, ça lag un peu certaines actions ont du délais... Points à corriger par après. »
>
> Ce ticket suit **la réactivité** de la maquette du soir (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN), puis de l'app.
>
> ## État au 24.10, soir
> - Un cas déjà traité : « Un petit délais lors du déplacement, une fois choisir au bon emplacement, il y a un peu de délai pour "sortir" du mode rail » (D134). Mesuré 142 ms du lever du doigt à la première image, 8 ms après correction (`controle-sortie-rail.mjs`).
> - Les autres gestes ne sont pas mesurés un par un. Mesure du 23.10 : toucher froid à ×4, Suggérer 288 ms, Substituer 184 ms (#143).
> - Cause connue pour le cas du rail : des calculs de catalogue avant la première image.
>
> ## À faire
> 1. Mesurer, sur chaque geste de la batterie, le délai du geste à la première image (le modèle : `controle-sortie-rail.mjs`). Écrire le contrôle d'abord : il échoue sur la version du soir (L13).
> 2. Corriger les gestes lents, le plus lent d'abord.
> 3. Rejouer sur un téléphone ou une émulation de téléphone, pas seulement sur ordinateur.
>
> ## Bloquants
> - [ ] Le contrôle D138 existe et échoue d'abord.
> - [ ] Tous les gestes sous le budget fixé.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/148

## À créer 2 — clé : report

- Verdict : **creer**
- Titre : [P1][#119] Un choix posé sur un écran se reporte sur tous les autres (D139)
- Libellés : type:task,P1,status:backlog,interface

> Demande du brasseur (24.10, soir, sur la maquette entière) : « Autre problème, un choix sur un endroit, semble pas toujours être reporté partout. »
>
> Ce ticket suit **la cohérence des choix entre écrans** dans la maquette du soir (https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN), puis dans l'app.
>
> ## État au 24.10, soir
> - Pas de relevé : on ne sait pas encore quels choix se perdent où. Candidats : goût (♡ ⊘), houblons comparés, visée de dégustation, dose, moment, levure.
> - Contrôle : `controle-etats.mjs` joue chaque écran seul ; aucun ne relit un choix posé ailleurs.
>
> ## À faire
> 1. Lister chaque choix qu'on pose (goût, comparaison, visée, dose, moment, levure) et chaque écran qui doit le relire.
> 2. Écrire le contrôle : poser le choix sur un écran, le relire sur chacun des autres. Il échoue d'abord (L13).
> 3. Corriger ce qui se perd.
>
> ## Bloquants
> - [ ] Le contrôle D139 existe et échoue d'abord.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/149

## À créer 3 — clé : r2

- Verdict : **creer**
- Titre : [P2][#119] Comparer : le radar r2, « À revoir, on va en parler »
- Libellés : type:task,P2,status:backlog,interface

> Demande du brasseur (24.10, soir, sur le radar r2 de Comparer) : « À revoir, on va en parler ».
>
> Rien n'est changé : c'est une discussion à tenir, pas une consigne. Ce ticket garde la trace pour ne pas décider à sa place (règle n° 1).
>
> ## État au 24.10, soir
> - Comparer = r6a (« r6a reste le meilleur […] »), avec son radar.
> - Graphes déjà montrés : la planche des graphes (six graphes, deux lectures chacun) https://claude.ai/artifact/JSiBVNWUJqJD8zdkvpKN9t.
>
> ## À faire
> 1. En parler avec lui : ce qui ne va pas dans r2.
> 2. Ensuite seulement, des variantes en mini maquettes, côte à côte avec sa base, dans un artefact neuf ; il choisit.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/150

## À créer 4 — clé : recherche

- Verdict : **creer**
- Titre : [P1][#119] Recherche avancée de houblons : mini maquettes à lui montrer
- Libellés : type:task,P1,status:backlog,interface

> Demande du brasseur (24.10, soir) : « Ensuite fait un artefacts de mini maquettes pour de la recherche avancée de houblons. »
>
> ## La question
> Trouver le houblon qui convient quand on ne connaît pas son nom : par ce qu'il sent (familles de la 16D, mot précis, mots hors des 12 : « fruit de la passion », « cassis », « vin blanc »), son α, son usage, son moment, son huile, son origine, son stock, ou « comme X ». Sort : une liste de houblons, chacun lisible d'un coup d'œil (nom, α, rôle, arômes en couleur, puis le reste).
>
> ## État au 24.10, soir
> - Lot en cours : trois séries de concepts (rca, rcb, rcc), jugées par le critique ; onze par vue (« Je dirais 11 par vue »), côte à côte avec la référence. Pas encore publié.
> - Données du catalogue : 318 houblons ; fiches détaillées : 32. Pour les autres, ce qui manque s'affiche « ? », jamais 0.
> - Liens : « pas de possibilité d'enlever, remplacer un houblon choisi, ni en recherche un » (D137) ; « je fais une recette puis ensuite j'achète les ingrédients, souvent pas présent » (catalogue, D21).
>
> ## À faire
> 1. Publier l'artefact de mini maquettes (une page, disposition en rangées). **Il choisit.**
> 2. Inscrire son choix et ses mots au registre ; reprendre l'écran sur sa maquette choisie.
> 3. App : après la porte B (#143).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/151

## À créer 5 — clé : legendes

- Verdict : **creer**
- Titre : [P1][#119] Légendes sous les pastilles : mini maquettes à lui montrer
- Libellés : type:task,P1,status:backlog,interface

> Demande du brasseur (24.10, soir, sur la légende d'une carte du rail) : « Bien mais mettre la légende juste en dessous des pastilles. Fait moi des mini maquettes de ça dans un artefacts » ; « Plus utilisé les icône... ». Sur la légende « Ajouts proposés » : « Pareil ici, mini maquettes de légende ». Sur Motueka dans « Ajouter un houblon » : « Plus utilisé les icône hors 16d ».
>
> ## État au 24.10, soir
> - Deux endroits : la carte d'un houblon du rail (« Bande : les 12 familles… ») et une ligne d'« Ajouter un houblon ».
> - Lot en cours : huit légendes (séries leg et legz), jugées par le critique. Pas encore publié.
> - Contraintes : la légende juste sous les pastilles, plus d'icônes que de mots, rien qui alourdisse le premier écran (« Il faut pas que ça gêne ! », D41 mots modérés).
>
> ## À faire
> 1. Publier l'artefact de mini maquettes. **Il choisit.**
> 2. Reprendre les deux légendes dans la maquette ; l'app après la porte B.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/152

## À créer 6 — clé : moment

- Verdict : **creer**
- Titre : [P1][#119] Moment proposé d'un ajout : une meilleure prédiction pour la vraie app
- Libellés : type:task,P1,status:backlog,interface

> Demande du brasseur (24.10, soir, sur le moment proposé d'un ajout) : « Ajout à 10' mais pas toujours idéal, pour la vrai app. Utiliser une meilleure prédictions »
>
> ## État au 24.10, soir
> - Dans la maquette du soir, un ajout rapide propose 10′ : « option aromatique » de `quickAdds`, stock d'abord, 10 g à 10′ (D40). Pour 10 g de Motueka à 10′, le moteur ne déplace Floral que de 2,5 % (D53).
> - Le moment est donc une valeur par défaut, pas une prédiction. Noté pour l'app (D58).
>
> ## À faire
> 1. Définir « idéal » avec lui : pour ce houblon, dans cette recette, au style, quel moment sert l'effet voulu (amertume, arôme, dry hop).
> 2. Choisir le moment par le moteur (`simulerCas`), pas par une valeur fixe ; l'inconnu s'affiche « ? », jamais une valeur inventée.
> 3. Le montrer en mini maquettes si l'affichage change. Pour la vraie app, après #143.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/153

## À créer 7 — clé : pictos

- Verdict : **creer**
- Titre : [P1][#119] Pictos des types hors 16D : son choix du jeu (D131)
- Libellés : type:task,P1,status:backlog,interface

> Demande du brasseur (24.10, soir) : « le profil extra 16d sont bien ajouter ? Peut être mettre dans la baseline aussi des icône en plus, pour avoir une version courte juste icône, et une version plus textuel » ; « même niche ou un Picto pour les truc super niche pour montrer que il y a qqch en plus.. Il faudra pas oublier d'ajouter la légende à certains endroits clé » ; « Il faut pas que ça gêne ! Que ce soit bien intégré » ; « Mais il faut aussi que on voit comme il faut les différence ! » (Galaxy face à Saaz).
>
> ## État au 24.10, soir
> - Page des huit jeux, en deux passes, jugée par le critique : https://claude.ai/artifact/Y7jV3JyYZw3VdPmDittgwW (Comparer, Galaxy face à Saaz, la fiche).
> - Deux lectures : courte (les icônes) et textuelle (icône et mot) ; picto « en plus » pour les mots rares ; mot précis d'une famille (rose, jasmin, litchi…) mis en valeur ; légende aux endroits clés.
> - Pas encore choisi : rien n'est inscrit au registre.
>
> ## À faire
> 1. **Il choisit** un jeu sur la page.
> 2. Inscrire son choix et ses mots ; l'ajouter à la baseline ; reprendre Comparer, la fiche, Substituer et Suggérer.
> 3. Légendes : voir #152.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/154

## À créer 8 — clé : mots

- Verdict : **creer**
- Titre : [P2][#119] Comparer : « Ses mots » à reprendre
- Libellés : type:task,P2,status:backlog,interface

> Demande du brasseur (24.10, soir, sur « Ses mots » de Comparer, « mojito, citron vert, ci… ») : « Vue à revoir mais ce texte là est inutile ».
>
> ## État au 24.10, soir
> - La phrase « X seul dit … » est retirée de « Ses mots » (D58). La vue elle-même reste à reprendre.
> - À côté : « J'aime beaucoup le 9 car ont voit que c'est pas que du 16d, le houblon a vraiment beaucoup plus de subtilité. À montré aussi, notamment pour la comparaison » : ce que chaque houblon dit en plus de ses familles est acquis, dans la fiche et dans Comparer.
>
> ## À faire
> 1. Lui montrer, en mini maquettes, côte à côte avec sa base, comment lire « ses mots » sans texte inutile. **Il choisit.**
> 2. Garder les mots hors 16D (D130), sans alourdir le premier écran (D41).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/155

## À créer 9 — clé : levure

- Verdict : **creer**
- Titre : [P1][#119] Vue Levure : son choix (étape de Dryhopper ou outil propre a2b), puis la reprise
- Libellés : type:task,P1,status:backlog,interface

> Suit l'écran Levure de la maquette jouable, seul écran encore ouvert au registre (`choix/ecrans.json`, écran `levure`, options « étape de Dryhopper » et « un outil propre (a2b) » ; provisoire : l'étape). Un seul facteur libre : la levure.
>
> ## État au 24.10, soir
> - Maquette du soir : « Puis la levure › » → « Et avec quelle levure ? », avec Annuler à côté de « Ajouter à ma bière › » (D120) : https://claude.ai/artifact/2QTyTCmFC6kRg9xkfVNefN. Elle change l'arôme, pas la dose (#132).
> - Carte des outils du 22.10 : https://claude.ai/artifact/9FrNPBUDv7ABeo5CsSFW7g. Dryhopper étant choisi (p4b2f), la question est de savoir si Levure garde son étape ou devient un outil.
>
> ## À faire
> 1. Lui montrer les options en mini maquettes, côte à côte avec sa base, dans un artefact neuf (onze par vue). **Il choisit.**
> 2. Reprendre l'écran sur sa maquette choisie (règle n° 1).
> 3. App : après la porte B. La dose de la levure est un autre sujet (#132).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/156

## À créer 10 — clé : pastille

- Verdict : **creer**
- Titre : [P2][#119] Comparer : la pastille « ~ simulé » dit son sens au toucher (D122)
- Libellés : type:task,P2,status:backlog,interface

> Demande du brasseur (24.10, matin, sur la pastille « ~ simulé » du radar de Comparer) : « ????? »
>
> ## État au 24.10, soir
> - Le sens de la pastille (calculé par le moteur, pas mesuré) n'est que dans un `title`, invisible au doigt ; la toucher ne montre rien.
> - Trois mini maquettes de la pastille au toucher ont été faites (artefact « Choix de vues » du 24.10, https://claude.ai/artifact/5nrApsrrY7yhnqK1gU7wYp, et planches https://claude.ai/artifact/X1RqagDtEqS4L2yZ63PFBy). Pas encore de choix de sa part.
> - La pastille de r6a reste ; au repos, pas un mot de plus.
>
> ## À faire
> 1. Lui redonner les trois mini maquettes avec la sortie du soir. **Il choisit.**
> 2. Contrôle d'abord : un toucher, une explication visible, aucun mot ajouté au repos ; il échoue sur la version actuelle (L13).

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/157

## À créer 11 — clé : appui

- Verdict : **creer**
- Titre : [P2][#119] Fiche du houblon : l'effet attendu de l'appui long (D112)
- Libellés : type:task,P2,status:backlog,interface

> Demande du brasseur (23.10, soir) : « L'appui prolonger fait pas l'effet escompté ». Avant : « Non... Un appuie long ouvre sa fiche. Comme avant, saufe que sa fiche est plus fourni avec les labels.. » (19.10).
>
> ## État au 24.10, soir
> - L'appui long ouvre la fiche g1 dans Chrome (souris et doigt simulé) ; le nom se remplit en 250 ms ; la carte n'est plus sélectionnable.
> - **L'effet attendu n'est pas dit.** La question est posée dans le fil de l'artefact ; pas de réponse relevée.
>
> ## À faire
> 1. Lui demander l'effet attendu (sur iPhone, l'appui long sélectionne du texte et ouvre le menu du système).
> 2. Le noter avec ses mots, écrire le contrôle qui échoue d'abord, puis corriger.

- Publié : https://github.com/Mrspadaaa/Brasserie/issues/158
