# M4 — Évaluation heuristique et robustesse des gestes, Calendrier global (tour 10 en ligne)

Date : 22.11.2026, app https://brasserie-l-affinee.web.app/ (tour 10). Agent M4, onglet propre.

## Méthode
- A. Évaluation heuristique (Nielsen, 10 heuristiques, gravité 0–4) et liste mobile : texte rogné ou chevauché
  (mesure DOM `scrollWidth > clientWidth`, intersection des boîtes de texte de la frise, poignées comprises),
  cibles < 24 px, contraste WCAG (calcul sur 105 textes visibles), cohérence des mots et des icônes, retour de
  chaque geste, états vide / chargement / hors ligne, coup d'œil. Chaque constat est vérifié sur une capture regardée.
- B. Test de singe dirigé : rafales, glisser court, long et diagonal, double et triple toucher, appui long,
  geste lâché au bord, gestes enchaînés. Seulement sur la frise, la liste, et une chose à moi « ZZ TEST — M4 — fête 1 ».
  Oracles : console, cohérence étiquette / dessin / période de l'app, page figée, données.
- Référence : règles CAL-* et GESTE-DATE-PARTOUT de `DEFAUTS-RECURRENTS.md`.

## Conditions réelles (à lire avant les défauts)
- **Pas de 390 réel.** `resize_window 390×844` a donné une vue de **628×1297** (premier onglet), puis **500×693**
  (second onglet). Une émulation par `zoom` CSS a faussé la mise en page ; abandonnée. Les media queries
  ≤ 429 px (pastille courte) n'ont donc jamais joué. Tous les constats sont à 628 ou 500 px de large.
- **Chrome partagé et instable.** Le groupe d'onglets a disparu en cours de test. Dans le second onglet, un autre
  agent a injecté une feuille `m2css` (`body{width:390px}`) et le cadre a bougé sans geste de ma part
  (S46–S51, puis S49–S1, puis S52–S4). J'ai rechargé l'onglet avant de supprimer ma donnée. Mon premier onglet
  (1005988791) est sorti du groupe : je ne pouvais plus le fermer avec l'outil. Il est peut-être encore ouvert.
- Pointeur souris (CDP), pas un vrai doigt. L'appui long a été simulé par des PointerEvent `touch` en JS.
- Données : une seule chose créée (« ZZ TEST — M4 — fête 1 », S47), puis supprimée. Après rechargement, elle
  n'apparaît plus (0 occurrence). La fiche de la vraie fête « vi » ne montre aucun lien restant. La période
  de l'app est revenue à 9 nov. → 6 déc. Aucune vraie chose n'a été glissée.
- Console : aucune erreur de l'app. Seulement des erreurs Firestore d'environnement, présentes dès le
  chargement : « Detected an update time that is in the future » (×33) et « Failed to obtain primary lease » (×1).

## Couverture
| Volet | Joué | Non joué / partiel |
|---|---|---|
| Rogné / chevauché | 7 échelles (2 sem., 4 sem., 6 sem., 3 mois, 6 mois, Mois, An), après chaque geste | 390 réel |
| Cibles, contraste | en-tête, menus, feuilles ; contraste : 105 textes, 0 sous AA | textes SVG de la courbe |
| Cohérence, retour | menu d'échelle, menu +, feuille Ajouter et Modifier, fiche, appui long, ±, Aligner, Cacher | Plein écran, retards (7), Trier, Filtrer, Sans date |
| États | vide (« vide », « aucun mouvement »), hors ligne simulé | chargement non capturé ; vraie coupure du réseau impossible sans réglage du navigateur |
| Gestes | rafale ›×5, ‹×5, toucher ×5 sur ma chose ; glisser court (3 px), diagonal, croisé (début après fin), lâché au coin, cadre ±313 px ; double et triple toucher ; poignée de fin ; appui long simulé | défilement pendant un glisser non concluant (la molette CDP ne défile jamais) ; rotation non jouable |

Couverture estimée : **≈ 75 %**.

## Défauts
Les captures sont dans `work/missions/2026-11-23-calendrier-en-ligne/captures-M4/`.

### T10-M4-1 — B (Nielsen 3, H3 contrôle) — La période de l'app bouge avec les gestes du Calendrier — RÉGRESSION CAL-PERIODE-APP-FIXE
- Écran : Calendrier, frise et menu d'échelle.
- Geste : depuis 9 nov. → 6 déc. (4 sem.), choisir « 2 sem. » dans le menu d'échelle. Aussi : tirer le corps
  du cadre de 314 vers 200 px, tirer la poignée de fin, choisir 6 sem., 3 mois, 6 mois, An ou Mois.
- Attendu : la pastille de période en haut ne change que par ses propres ‹ ›.
- Observé : la pastille suit chaque geste. 2 sem. : « 16 → 29 nov. » ; 6 sem. : « 16 nov. → 27 déc. » ;
  3 mois : « … → 14 févr. 2027 » ; 6 mois : « … → 16 mai 2027 » ; An : « 16 nov. 2026 → 14 nov. 2027 ».
  Cadre tiré : « 9 nov. → 20 déc. », puis « 19 oct. → 15 nov. ». La valeur est écrite dans
  `localStorage.laffinee_ui_state.app_global_time_filter`.
- Captures : 05-entete-periode-changee-2sem, 04-echelle-2sem-frise, 22-cadre-gauche-periode-app, 25-cadre-tres-long, 10-an.

### T10-M4-2 — G (Nielsen 3, H2 monde réel et H1) — « Durée 1 semaine » pour une chose d'un jour
- Écran : menu + → Poser une fête (feuille Ajouter), puis Modifier.
- Geste : ouvrir la feuille sans rien changer ; lire « Durée 1 semaine jusqu'à S47, 22 nov. » ; Ajouter.
- Attendu : la durée affichée est la durée créée.
- Observé : la chose créée dure 1 jour (fiche « S47 1 j », un point sur la frise et non une barre).
  Même texte après avoir tiré Début au-delà de Fin : « 1 semaine jusqu'à S1, 10 janv. » avec début au 10 janv.
  Le compte suit les semaines touchées, pas la durée (22 nov. → 20 déc. = 28 j s'affiche « 5 sem. »).
- Captures : 13-duree-1semaine-jusqua-22nov, 14-fete-creee-ponctuelle, 15-fiche-1j, 18-debut-croise-fin.

### T10-M4-3 — G (Nielsen 2, robustesse) — Une rafale sur ‹ perd des pas : le bouton se déplace
- Écran : pastille de période ‹ … › (en-tête).
- Geste : depuis 29 mars → 25 avr. 2027, cinq touchers rapides sur ‹ au même endroit.
- Attendu : 5 pas en arrière.
- Observé : 2 pas seulement (→ 1er → 28 févr. 2027). La largeur du libellé change à chaque pas, donc ‹ glisse
  (x ≈ 306, puis 328 px) ; les autres touchers tombent sur le libellé. La rafale de 5 sur › a donné 5 pas.
- Captures : 28-rafale-avance, 29-rafale-recule-2-sur-5.

### T10-M4-4 — m (Nielsen 2, H1 et H3) — L'échelle d'arrivée « 4 sem. » n'est pas dans le menu
- Geste : ouvrir le menu « 4 sem. ».
- Observé : ni Jour / Semaine / Mois ni une durée n'est marqué. Les choix proposés (2 sem., 6 sem., 3 mois,
  6 mois, An) n'incluent pas 4 sem. : le menu ne permet pas d'y revenir (on y revient seulement en tirant une poignée).
  Autre point : le menu apparaît une fois à y = 111 et une fois à y = 218. Pendant l'apparition, un toucher a
  ouvert « Liste » au lieu de « An ».
- Capture : 03-menu-echelle-sans-selection.

### T10-M4-5 — m (Nielsen 2, H8) — Étiquettes de la courbe collées à la pastille du cadre et entre elles — RÉGRESSION CAL-FRISE-ETIQUETTES
- Geste : échelle 6 sem. ; ou 4 sem. avec plusieurs mouvements la même semaine.
- Observé (boîtes mesurées, visible à l'œil) : « Achats · Fruty −2 » sur « S47 – S52 » (30×8 px) ;
  « ZZ TEST — M3 — papier −11 » sur la pastille (32×8) ; « lol −600 » sur « consomable ( masque gant) −23 » (52×8).
  Trois à cinq étiquettes s'empilent sans interligne.
- Captures : 06-6sem-etiquette-sur-pastille, 21-etiquettes-empilees, 23-etiquettes-detail.

### T10-M4-6 — m (Nielsen 2) — Étiquette rognée « consomable ( m… −23 » — RÉGRESSION CAL-AN-390 (aucun texte rogné)
- Geste : 4 sem., S46–S49, avec 5 mouvements en S47.
- Capture : 30-consomable-rogne.

### T10-M4-7 — m (Nielsen 1, H8) — Semaine écrite deux fois — RÉGRESSION CAL-FRISE-ETIQUETTES
- Observé : la pastille « S46 – S49 » est juste au-dessus des graduations S46 … S49. Idem à 2 et 6 semaines.
- Capture : 02-frise-4sem.

### T10-M4-8 — m (Nielsen 2, H1) — La pastille « −683 CHF à dépenser · S50 » ne suit pas le cadre — RÉGRESSION CAL-AN-390 (« pastille = ce que montre le cadre »)
- Observé : toujours S50, que le cadre montre S47–S48, S43–S46 ou nov. 2026 – nov. 2027. Seul l'aria
  précise « sur tout l'horizon » ; l'écran ne le dit pas.
- Captures : 04-echelle-2sem-frise, 25-cadre-tres-long, 10-an.

### T10-M4-9 — m (Nielsen 2, H4) — Échelle Mois : quatre fins différentes — RÉGRESSION CAL-ECHELLE-COHERENTE
- Geste : depuis 6 mois, menu → Mois.
- Observé : en-tête de liste « prévu nov. 26–avr. 27 », graduations nov. … avr., pastille du cadre en semaines
  « S47 – S19 2027 » (mi-mai), période de l'app « 16 nov. 2026 → 16 mai 2027 ».
- Capture : 09-mois-liste-avr-vs-mai.

### T10-M4-10 — m (Nielsen 2, H5 prévention) — Feuille Modifier : fermeture sans avertissement, × qui bouge
- Geste : Modifier ma fête, tirer Fin (→ 5 sem.), toucher ×.
- Observé : le × passe de y = 611 à 538 quand les rangées de jours apparaissent, et le premier toucher le manque.
  Ensuite la feuille se ferme sans demander, et les changements sont perdus en silence. Ma donnée n'a pas été modifiée.
- Captures : 17-glisser-fin-5sem, 19-croix-deplacee, 20-ferme-sans-confirmation.

### T10-M4-11 — m (Nielsen 2, H1) — Aucun état hors ligne sur le Calendrier (partiel)
- Geste : `navigator.onLine = false` et événement `offline` en JS, sans couper le réseau. Ensuite, fermer la
  fiche et ouvrir le menu +.
- Observé : rien sur le Calendrier. Seul « Compagnon » du menu + est barré (« hors connexion »).
  `App.tsx:749` lit `navigator.onLine` au rendu et n'écoute pas l'événement.
- Captures : 31-hors-ligne-simule, 32-hors-ligne-menu-plus.

### T10-M4-12 — d (Nielsen 1, accessibilité) — Petites cibles
- « ± » mesure 22×28 px (< 24, WCAG 2.5.8). Les icônes de l'en-tête (retards, règle, œil, plein écran) font
  24 à 28 px, et le « Fermer » des feuilles 24×24. C'est au minimum, loin des 44 à 48 px du téléphone.

### T10-M4-13 — d (Nielsen 1, H4) — Menu d'appui long : rouge pour du neutre, Supprimer absent
- Observé : « Ranger sans date » et « sans montant » sont en rouge. Le menu n'a pas « Supprimer », alors que ⋯ de la fiche l'a.
  À l'ouverture (~0,4 s), le menu est une boîte grise vide (vu à l'écran, capture non sauvegardée).
- Captures : 38-appui-long-menu, 40-fiche-plus-actions.

### T10-M4-14 — d (Nielsen 1, H4) — Icône et montant placés différemment selon la rangée
- Observé : l'icône est à gauche dans Papiers et Fêtes, à droite dans Achats (« −37 ZZ TEST — M3 — achat 🛒 ») et
  dans les lignes caddie. Le montant est avant le nom dans Achats, après dans Ventes.
- Captures : 33-plus-moins, 31-hors-ligne-simule.

### T10-M4-15 — d (Nielsen 1, H6) — Feuille Modifier : rangée « Fin » sans mois ; à vérifier contre GESTE-DATE-PARTOUT
- Observé : « Fin L 14 … D 20 » n'indique pas le mois (décembre). Les deux rangées de jours à toucher
  ressemblent à une réglette de jours. Je n'ai pas vérifié si elles sont dans la liste blanche de GESTE-DATE-PARTOUT.
- Capture : 17-glisser-fin-5sem.

## Robustesse : ce qui a tenu (oracles verts)
- Glisser de 3 px sur une poignée : aucun changement. Glisser en diagonale : aimanté à la semaine, étiquette = dessin.
- Début tiré au-delà de Fin : pas d'état inversé (mais voir T10-M4-2).
- Cadre tiré de 313 px dans un sens, puis dans l'autre : retour exact à S46–S49.
- Double et triple toucher sur le cadre ou la frise : rien ne bouge, pas d'erreur.
- 5 touchers rapides sur ma chose : une seule fiche, état cohérent (ouverte).
- Après chaque geste, l'étiquette du cadre correspond aux graduations (hors T10-M4-9). Aucune erreur de l'app dans la console.

## Non reproduit / non concluant
- Page figée : une fois, la capture a expiré au bout de 30 s, juste après « Montrer la courbe », au moment où une
  autre session redimensionnait la fenêtre partagée. Pas reproduit ; cause non établie.
- Défilement : la molette CDP ne fait jamais défiler le Calendrier (`scrollY` reste 0, à x = 60, 250 et 470), alors
  que `scrollTo` fonctionne et que l'événement wheel n'est pas annulé (`touch-action: pan-y`). Probable limite de
  l'outil ; à rejouer au doigt.
- « Liée à · vi » dans la feuille Modifier de ma fête : la fiche de vi ne montre aucun lien ensuite. Je n'ai pas
  établi si c'était un vrai lien.
- Rotation : non jouable. 390 réel : non obtenu (voir Conditions).
