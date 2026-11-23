# Calendrier en ligne : liste de correction unique (23.11)

Sources : M1 (exploratoire), M2 (états et limites), M3 (scénarios), M4 (heuristiques), M5 (tactile CDP), FAST-CHECK, OUTILS. 65 constats sources
ramenés à **48 défauts** (L-1 à L-48) et **5 questions de choix** (Q-1 à Q-5). Code lu : `port-carnet/src` (branche claude/port-carnet-1711, f9cd2cf84 compris).
Registre : `work/missions/BUGS.md`, section « Calendrier en ligne, 23.11 » ; id du registre = `T10-<n>` pour L-n, sauf L-7 = `FC-2` et L-44 = `FC-1`.

## 0. Ce que vaut chaque constat (à lire d'abord)

| Paquet | Qui | Valeur |
|---|---|---|
| Ancien `index-B8Mp3grp.js` (tour 9), servi par le service worker (T10-M2-1) | M1, M4, M3 (S1 à S10) | Vrai sur le tour 9, pas prouvé sur le tour 10. Classe (b) |
| Tour 10 `index-Bt0rkeZN.js` | M2 (après Ctrl+Maj+R), M5 (Chrome neuf, vrai tactile CDP, 390 exact), fin de M3 (DOM seul, sans vision) | Classe (a) |
| Code HEAD seul, sans rendu | FAST-CHECK (FC-1, FC-2) | FC-2 est aussi vu au rendu par M2 sur le tour 10 |

Mesures contradictoires à ne pas ignorer : M1 et M2 (pointeurs JS synthétiques, fenêtre Chrome partagée réduite à 160×28) trouvent le défilement au bord
10 fois trop **lent** (0,5 à 0,6 sem./s) ; M5 (CDP, fenêtre à lui, rAF à 60 Hz) le trouve trop **rapide** (35 sem. en 3 s à 6 sem.). `useGlisse.ts:48` borne `dt`
à 50 ms par image : une page dont `requestAnimationFrame` est bridé (onglet masqué ou fenêtre réduite) avance 20 fois moins vite. Hypothèse, non prouvée : M1 et M2
mesuraient un rAF bridé. Voir L-18 et Q-4.

## 1. Table de dédoublonnage (source → L)

| Source | Vers |
|---|---|
| T10-M1-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13, -14 | L-17, L-18, L-18, Q-2, L-3, L-4, L-48, L-19, L-20, L-22, L-7, L-21, L-12, L-46 |
| T10-M2-1, -2, -3, -4, -5, -6, -7, -8, -9 | L-47, L-2, L-18, L-11, L-48 (+L-12), L-6, L-13, L-9, L-7 ; §5 : An à deux rendus L-10, liste L-45 |
| T10-M3-1 à -15 | L-23, L-24, L-25, L-26, L-14, L-3 et L-4, L-27, L-28, L-29, L-30, L-31, L-32, L-33, L-34, L-35 |
| T10-M4-1 à -15 | L-17, L-36, L-37, L-21, L-3, L-4, L-12, L-5, L-7, L-38, L-39, L-40, L-41, L-42, L-43 |
| T10-M5-1 à -10 | L-1, L-3, L-2, L-5, L-8, L-9 (butée) + L-18 + Q-4 (vitesse), L-4, L-10, L-15, L-16 |
| FC-1, FC-2 | L-44, L-7 |

## 2. Classe (a) : confirmés sur le tour 10 (16)

Focus 1 = frise du temps (en-tête), focus 2 = calendrier global. Gravité B bloquant, G grave, m mineur, d détail. Outils de test existants :
`e2e/outils/calendrier.ts` (`lireCoherence`, `ecartsCoherence`, `fautesEtiquettes`, `fautesTextes`, `boiteCadre`, `periodeApp`), `e2e/outils/doigt.ts`
(`glisser`, `tenirAuBord`, `appuiLong`), suite `e2e/calendrier/frise.spec.ts` ; propriétés `tests/unit/proprietes/*.test.ts`.

### L-1 — B — focus 1 — Barre tirée vers le bord gauche : reste accrochée après le lever (T10-M5-1)
- Geste : 6 sem., barre « ZZ TEST — M5 — barre » (rangée Fêtes, x = 44) glissée en 480 ms (40 pas de 12 ms) jusqu'à x = 4, doigt levé aussitôt ; ou levé après 1 s ou 3 s immobile ; ou x = 20 tenu 3 s ; ou doigt sorti de l'écran par la gauche. Reproduit 5 fois sur 5 (CDP, tour 10).
- Attendu : au lever, la chose se pose à la date annoncée (ou rien ne bouge) et la frise redevient normale (R10).
- Observé : fantôme « S23 · 6 juin · lâcher ici » laissé dans la rangée, en-tête figé « si tu lâches en S23 », cadre disparu ; la fenêtre continue de dézoomer seule après le lever (6 sem. → 14 → 21 sem. → 6 mois) ; un toucher ailleurs ne libère rien ; seul un rechargement rend la main. Rien d'écrit (date inchangée). Au bord droit la capture tient.
- Fichiers probables : `src/ui/calendrier/frise/usePointeur.ts` (la barre n'écoute que `onPointerUp` et `onPointerCancel`, l. 404-405 ; aucune écoute de `lostpointercapture`, contrairement à `src/ui/geste/useGlisse.ts:92` ; aucune écoute au niveau fenêtre ; `etat.current` n'est remis à `null` que par `fin` ou `annuler`, donc le rAF `majDefile` l. 308-330 continue), `src/ui/calendrier/frise/Barre.tsx`, `Rangee.tsx` (`.cal-lane`), `src/components/tabs/CalendrierTab.tsx:496-529` (`setIci`, « lâcher ici »). Cause d'après le journal M5 : `lostpointercapture` PENDANT le geste (x ≈ 23 à 29), puis `pointerup` sur `cal-lane`. Pourquoi la capture se perd (barre remontée par React quand la fenêtre dézoome ?) : non établi.
- Règle violée : frise B R10 (lâcher, Échap, pointercancel) ; CAL-BARRE-BORD (« au bord, la fenêtre s'agrandit pendant le geste, au lâcher la barre prend la place montrée ») ; T9-1.
- Oracle (doit échouer aujourd'hui) : Playwright, projet android-390, `Doigt` CDP : barre de la fixture à x = 44, `glisser` jusqu'à x = 4 en 480 ms puis `touchEnd`, variantes tenue 0 / 1 / 3 s, x = 20, x < 0. Après le lever, dans 1 s : `getByText(/lâcher ici/)` a 0 occurrence ; `.ent-cadre` est visible et `[data-glisse]` absent ; l'étiquette du cadre est identique à deux lectures espacées de 600 ms (la fenêtre ne bouge plus seule) ; la date écrite de la chose (`dateChose`) est soit l'ancienne, soit celle annoncée. Unitaire (vitest + jsdom, `usePointeur`) : après `pointerdown`, déplacement de 20 px, puis `lostpointercapture` sans `pointerup`, `onLacheGlisse` est appelé une fois et `defile` n'est plus appelé aux images suivantes.

### L-2 — G — focus 1 — Le cadre n'est pas dessiné sur les semaines que disent l'étiquette et les graduations (T10-M2-2, T10-M5-3)
- Geste : menu 6 sem. (ou 2 sem., 3 mois, 6 mois, An) ; ou 6 sem. puis poignée gauche −40 px puis poignée droite +40 px.
- Attendu : étiquette du cadre = dessin du cadre = graduations (CAL-ECHELLE-COHERENTE).
- Observé : le cadre est dessiné toujours de x 68 à x 316 (sur 390), alors que les graduations étalent la même fenêtre sur toute la largeur (x 12 à 372). À 6 sem., « S47 – S52 » est dessiné de la fin de S47 au début de S52 ; à 4 sem., « S46 – S49 » commence après la graduation S46 et finit avant S49 ; à An, « nov. 2026 – nov. 2027 » est dessiné de déc. à sept. ; « S42 – S52 » est dessiné sur S43 → S50. Avec « Aligner la courbe sur la frise » allumé (éteint par défaut), le cadre disparaît (M5 c21).
- Fichiers probables : `src/ui/calendrier/entete/EnTete.tsx:194` (`visibles` = les semaines de la fenêtre seulement) et `:809` (`BandeSemaines semaines={visibles}` : toute la largeur) contre `:696-697` (`semainesDeVue(courbe.length, vueC, largeur)` : la courbe est tracée dans la vue R4, fenêtre à 56 px des bords) ; `Fenetre.tsx:192` (`vueDeFenetre` = `cadrerDeuxBouts`), `src/ui/geste/moteur.ts:72`. Les deux axes (courbe et graduations) ne sont pas le même : le test existant `ecartsCoherence` compare des NUMÉROS de semaine, jamais des x.
- Règle violée : CAL-ECHELLE-COHERENTE. Dépend de **Q-1** : le cadre de taille fixe (R4) est voulu ; ce sont les graduations qui ne suivent pas.
- Oracle (doit échouer aujourd'hui) : Playwright, pour 6 sem., 3 mois, 6 mois, An et après chaque poignée tirée : pour chaque semaine k de la fenêtre, |x du centre de `[data-bande-semaines] [data-semaine=k]` − x du `[data-point-semaine=k]` de la courbe| ≤ 2 px ; bords du `.ent-cadre` = bords de la première et de la dernière semaine de la fenêtre, tels que dessinés sur la courbe, à ± 2 px. À ajouter à `lireCoherence` (champ `xGrad`, `xPoints`).

### L-3 — G — focus 1 — Étiquettes de la courbe empilées, sur une poignée, sur l'étiquette du cadre (T10-M5-2 ; M1-5, M4-5, M3-6 sur l'ancien paquet)
- Geste : menu 3 mois, 6 mois ou An, puis n'importe quel geste du cadre (bord gauche tenu, poignée −40 px) ; ou 6 sem. avec des mouvements dans la même semaine.
- Attendu : aucune étiquette ne croise une poignée, une autre étiquette, ni la pastille du cadre (CAL-FRISE-ETIQUETTES) ; pas de doublon.
- Observé (M5, tour 10) : 6 mois / 36 sem. : « Achats −13 » posé deux fois l'un sur l'autre (« A·A·Achats ±13 ») sur la poignée gauche ; An : « Achats −13 », « ZZ TEST — M3 — achat −37 » et le doublon se chevauchent et touchent « nov. 2026 – nov. 2027 » (6 à 12 intersections de boîtes) ; 3 mois : « Achats −13 » coupé par la poignée. Anciens paquets (M1, M4) : « Achats · Fruty −2 » sur « S47 – S52 », « lol −600 » sur « consomable ( masque gant) −23 ». M2 (tour 10) : 0 intersection au second essai, une intersection non reproduite à An : le défaut dépend du chemin ou de l'ordre.
- Fichiers probables : `src/ui/calendrier/entete/Courbe.tsx` (placement des noms, ~l. 318-360 ; obstacles `obstaclesCourbe` l. 514-521 : barres de poignées de ± 6 px seulement, alors que la zone de prise fait 44 px ; `placeEtiquette` l. 396 ; l'étiquette du cadre `etiquetteRepos` est un obstacle, mais pas la bulle du tirage) ; `EnTete.tsx:774-777`.
- Règle violée : CAL-FRISE-ETIQUETTES, CAL-ECHELLE-COHERENTE (« aucune étiquette de la courbe n'en chevauche une autre »).
- Oracle (doit échouer aujourd'hui) : `fautesEtiquettes` étendu : aux échelles 3 mois, 6 mois, An et après chaque geste, 0 intersection entre les boîtes des `<text>` de `.ent-cb`, des `.ent-poi i`, de `[data-cadre-etiquette]` ; et aucun texte identique à moins de 4 px de hauteur d'un autre (doublon). Rejouer 5 fois chaque état (une mesure non reproduite par M2 : un test qui échoue une fois sur cinq est déjà un défaut). Propriété (fast-check) sur la fonction de placement, si elle est extraite de `Courbe.tsx` : pour toute liste de noms et de montants, toute fenêtre, aucune paire de boîtes retenues ne se recoupe.

### L-4 — m — focus 1 — Étiquettes de courbe rognées par « … » (T10-M5-7 ; M1-6, M4-6, M3-6)
- Geste : 2 sem. ou An, cadre au bord gauche (M5) ; 6 sem. S32 – S37 ou An (M1) ; 4 sem. avec 5 mouvements en S47 (M4).
- Attendu (CAL-AN-390 : aucun texte rogné à 390) : un nom qui ne tient pas disparaît, il ne se coupe pas.
- Observé : « Vêtements et s… −132 », « consomable ( m… −23 ».
- Fichiers probables : `Courbe.tsx:180-185` (`formes` : « les 14 premiers signes et « … » » est voulu par le code, CAL-PASSE n° 7) et `:318` ; la règle écrite du brasseur dit le contraire.
- Oracle : à 390, dans la courbe, aucun `<text>` dont le contenu finit par « … » ; aucun `scrollWidth > clientWidth` (`fautesTextes('entete')`), sur 2 sem., 6 sem., 3 mois, 6 mois, An, cadre au bord gauche.

### L-5 — G — focus 1 — La pastille « −683 CHF à dépenser · S50 » ne suit pas le cadre (T10-M5-4 ; M4-8)
- Geste : cadre tenu 3 s au bord gauche (6 sem. → S3 – S8 ; An → S47 2025 – S46 2026) ; ou 2 sem., puis An.
- Attendu (CAL-AN-390 : « pastille = ce que montre le cadre ») : la pastille parle de la fenêtre montrée.
- Observé : toujours « S50 » (2026), quelle que soit la fenêtre. Seul l'aria dit « sur tout l'horizon de la courbe ». Voulu par le code, contraire à la règle écrite : **Q-3**.
- Fichiers probables : `EnTete.tsx` (`creux`, `creuxIndex`, l. 650-676 ; `semaineCreux`) ; `Courbe.tsx` (`creuxIndex`).
- Oracle (après Q-3) : après chaque déplacement du cadre, la semaine nommée dans la pastille appartient à la fenêtre (si Q-3 = fenêtre), ou la pastille dit « horizon » en toutes lettres à l'écran (si Q-3 = horizon).

### L-6 — G — focus 1 — Après ›, puis un geste local, ‹ de l'app ne ramène pas la fenêtre (T10-M2-6)
- Geste : › de l'app (fenêtre S50 – S53), poignée de début tirée à droite (1 sem. « S53 »), puis ‹. Reproduit deux fois (onglets 797 et 800). Au rechargement suivant, « S1 2027 » revient sous 9 nov. → 6 déc.
- Attendu : « celle-ci ne change que par ses propres ‹ ›, et la fenêtre la suit alors », quel que soit le chemin.
- Observé : la période de l'app revient à 9 nov. → 6 déc. ; la fenêtre reste « S53 », 1 sem.
- Cause lue au code (à confirmer par le test) : `CalendrierTab.tsx:263`, `onPeriode = useCallback(p => setPeriodeLocale(p), [])` garde le `setPeriodeLocale` du PREMIER rendu (l. 240-243, dépendance `[clePeriode]`), donc la fenêtre locale s'écrit toujours sous la clé de la période d'origine (`ecrireFenetreLocale(clePeriode, p)`). Au retour sur cette période (‹), `gardee.app === clePeriode` et la fenêtre gardée est reprise.
- Règle violée : CAL-PERIODE-APP-FIXE, second sens.
- Oracle (doit échouer aujourd'hui) : Playwright : lire `periodeApp` P0 et l'étiquette du cadre E0 ; cliquer ›, tirer le début à droite, cliquer ‹ : `periodeApp` = P0 ET étiquette = E0. Unitaire : monter `CalendrierTab` avec `periode` qui change, faire un geste, lire `localStorage['laffinee.calendrier.fenetre-locale']` : `app` = la période COURANTE. Propriété : toute suite de {›, ‹, geste local} qui revient à P0 rend la fenêtre de P0.

### L-7 — m — focus 1 — Échelle Mois : le dernier mois de la fenêtre n'est pas gradué (FC-2 ; T10-M2-9, M1-11, M4-9)
- Geste : menu → Mois (6 mois, 16 nov. → 16 mai). Aussi « Exercice 2026 » (déc. 2026 absent), 13 semaines dès le 29 déc. 2025 (axe jusqu'à févr., fenêtre jusqu'au 29 mars).
- Attendu : l'axe couvre toute la fenêtre ; les quatre lectures (en-tête de liste « prévu nov. 26 – avr. 27 », graduations, pastille « S47 – S19 2027 », période) disent la même fin.
- Observé (tour 10, M2) : graduations « nov. » à « avr. », « mai » manque alors que « nov. », tout aussi partiel, est gradué. Mesure fast-check : 87 fenêtres de 13 semaines sur 92 finissent après la dernière colonne (jusqu'à 29 jours) ; 73/79 à 26 sem. ; 48/53 à 52 sem.
- Fichiers probables : `src/ui/calendrier/echelle.ts:97-111` (`colonnesDeLAxe`), `moisDeLaPeriode` ; règle de l'An `anneeEnMois` (mois du jeudi) en contradiction. PC-140 voulait « 3 mois = 3 colonnes ».
- Règle violée : CAL-ECHELLE-COHERENTE.
- Oracle : déjà écrit, `tests/unit/proprietes/axeEchelles.test.ts` test `FC-2` (`it.fails`) ; le retirer `.fails` à la correction. Playwright Mois : le mois du dernier jour de la fenêtre est la dernière graduation.

### L-8 — m — focus 1 — Bord droit : une barre ne s'étend pas comme au bord gauche (T10-M5-5)
- Geste : 6 sem., barre ZZ amenée à x = 386 en 480 ms, tenue 3 s, levée. Un seul essai propre ; dans e06 (départ à 22 sem. après l'accrochage de L-1), le bord droit a dézoomé jusqu'à 6 mois et posé au 4 oct. 2027 (+45 sem.).
- Attendu : comme au bord gauche, la frise défile ou s'élargit pour poser plus loin (CAL-BARRE-BORD).
- Observé : rien ne défile ; la barre se pose sur la dernière semaine visible (S53).
- Fichiers probables : `usePointeur.ts:308-330` (`majDefile`, `borne` : « la barre sortirait de la fenêtre : on attend ») ; `CalendrierTab.tsx` (`onDefile`).
- Oracle : à corriger APRÈS L-1. Playwright : barre tenue 3 s à x = 386 ; après le lever, la fenêtre a gagné au moins une semaine à droite et la date écrite = la date annoncée ; test symétrique du bord gauche, même résultat attendu.

### L-9 — d — focus 1 — Butées du passé (S47 2025) et du futur (S45 2027) sans aucun signe (T10-M2-8, T10-M5-6 deuxième partie)
- Geste : tenir le cadre au bord gauche, ou 12 glissers de plus : « le cadre s'arrête net sur une courbe vide » ; au bord droit idem (M5 c09). À An, la flèche › de l'app paraît grisée (M1 Q4, non vérifié).
- Attendu : un signe (repère de début des données ou de l'horizon).
- Observé : rien. Ni message ni repère ; pas de règle écrite qui l'exige : détail.
- Oracle : à la butée, un élément visible dit « début des données » (ou équivalent) ; 12 gestes de plus ne changent ni l'étiquette ni la fenêtre.

### L-10 — m — focus 1 — Échelle An : deux étiquettes et une poignée qui se comporte autrement (T10-M5-8 ; M2 §5)
- Geste : même « An », étiquette « nov. 2026 – nov. 2027 » (par le menu, b34) ou « S47 – S45 2027 » (au chargement, c01). Poignée gauche tirée de −40 px à An : la fenêtre se déplace (« juin 2026 – mai 2027 », toujours « An », b40) au lieu de s'étirer.
- Cause probable : deux notions de l'An, `vue === 'annee'` (`EnTete.tsx:189`) et `semaines >= 52` (`Fenetre.tsx:59-61`) ; le déplacement vient du plafond de 52 semaines où l'autre bout suit (`Fenetre.tsx:317`, T9-2) : peut-être voulu, à confirmer.
- Oracle : l'étiquette d'une fenêtre de 52 semaines est la même chaîne par les trois chemins (menu, chargement, fin tirée) ; le comportement de la poignée à An est écrit et testé.

### L-11 — m — focus 1 — Le bandeau « Annuler » du menu d'échelle disparaît après environ 1,5 s (T10-M2-4)
- Geste : menu → 3 mois, puis attendre. Mesures 1,46 s et 1,6 s ; au premier essai, Annuler n'était plus là. Touché à temps, Annuler rend bien 6 sem. (M5 : Annuler ×4 correct).
- Attendu : le temps de lire puis de toucher (au moins 4 s) ; le code dit 7 s (`Message.tsx:64`, `DUREE_MESSAGE_MS = 7000`).
- Fichiers probables : `CalendrierTab.tsx:654` (le message), `:354-377` (un défilement chasse le message), `EnTete.tsx:361-364` (`setInfo` effacé). Cause non établie.
- Oracle : après le choix « 3 mois », le bouton Annuler est visible encore à 4 s ; le toucher à 3 s rend 6 sem.

### L-12 — m — focus 1 — Période écrite deux fois : « S46 – S49 » au-dessus des graduations S46 … S49 (T10-M1-13, M4-7, M2-5 deuxième partie)
- Geste : ouvrir le Calendrier (4 sem.), ou 2 sem., 6 sem. Pas de geste.
- Attendu (CAL-FRISE-ETIQUETTES : « un libellé de période une seule fois », capture 35 du brasseur : « S47 » écrit deux fois) : une seule fois.
- Observé (M2, tour 10) : l'étiquette du cadre répète les graduations. À une semaine, corrigé dans f9cd2cf84 (classe c). Plusieurs semaines : voulu par `etiquetteCadre`, donc **Q-5**.
- Oracle (après Q-5) : parmi l'étiquette du cadre et les graduations, aucun numéro « S<n> » n'apparaît deux fois dans la frise ; étendre le test CAL-FRISE-ETIQUETTES de 1 sem. à toutes les échelles.

### L-13 — d — focus 1 — À 1 semaine, le cadre ne suit pas le doigt avant la moitié de sa largeur (T10-M2-7)
- Geste : à 1 sem., glisser le corps de 110 px (tactile) : rien ne bouge ; il faut plus de 124 px.
- Cause lue : `Fenetre.tsx:305` `Math.round(dx × span / w)` : la pose est à la semaine (254 px à 1 sem.) ; le cadre ne se dessine pas pendant le tirage entre deux semaines.
- Attendu : le cadre accompagne le doigt et se pose à la semaine au lâcher (R2).
- Oracle : à 1 sem., pendant un glisser de 60 px, le bord gauche du `.ent-cadre` a bougé d'au moins 40 px ; au lever, il est à la semaine la plus proche.

### L-14 — G — focus 2 — Choix de date hors frise partagée dans les feuilles du + (T10-M3-5, confirmé au DOM sur le tour 10, sans vision)
- Geste : + → Poser un brassin (puces « Aujourd'hui / 1 mois / 3 mois / 6 mois / 1 an », 5 puces, aucune frise) ; + → Noter une idée (104 puces de semaine, S32…, la semaine choisie hors écran ; 0 frise) ; Carnet → idée : mêmes puces. Papier, achat, fête, travaux, activité : frise présente.
- Attendu (GESTE-DATE-PARTOUT : « tout choix de date ou de période de l'app utilise la frise partagée ») : la frise partagée.
- Fichiers probables : `src/ui/calendrier/frise/FeuilleAjout.tsx` (feuilles brassin et idée), `src/ui/saisie/Horizons.tsx`, `src/ui/carnets/AtelierPorte.tsx` (idée au Carnet), `src/ui/calendrier/frise/DureeFenetre.tsx` (la frise partagée).
- Oracle : statique (contrôle GESTE-DATE-PARTOUT : aucun composant de choix de date hors liste blanche : `Horizons` n'y est pas, ou il y est avec une décision écrite) ET parcours : chaque feuille du + qui choisit une date contient `.cal-f-duree` (ou `FrisePeriode`) ; Playwright : Poser un brassin et Noter une idée, `locator('.cal-f-duree')` a 1 occurrence et aucun groupe de plus de 8 boutons de semaine.

### L-15 — d — focus 2 — Années absentes sur des dates d'une autre année (T10-M5-9)
- Geste : fiche, réglette de date : « 18 mai +179 j » (2027) et « 25 mai » (2026) s'écrivent pareil ; menu + avec la fenêtre en 2027 : « Noter une idée en S15 », « Poser un brassin S15 · prête le 10 mai ».
- Attendu : l'année dès que la date n'est pas de l'année en cours (la règle de l'étiquette du cadre, T9-2).
- Fichiers probables : `DureeFenetre.tsx`, `FeuilleAjout.tsx`, `CalendrierTab.tsx` (menu +), `src/domain/calendrier.ts` (`jourLisible`, `etiquetteS`).
- Oracle : propriété (fast-check) : pour toute date hors de l'année d'aujourd'hui, le texte rendu contient l'année ; à une date de l'année en cours, il ne la contient pas.

### L-16 — d — focus 2 — Brouillon de la feuille « Poser une fête » perdu au rechargement (T10-M5-10)
- Geste : + → Poser une fête → durée tirée à 3 sem., nom « ZZ TEST — M5 — barre » tapé, rechargement de la page. Feuille fermée, nom et durée perdus ; rien d'enregistré, pas de doublon.
- Attendu : non écrit dans une règle ; M3-S9 (ancien paquet) dit « brouillon perdu » comme gêne. Voir la leçon « saisie-mobile » avant de décider : un téléphone recharge l'onglet.
- Fichier probable : `FeuilleAjout.tsx` (état local).
- Oracle : après rechargement, la feuille revient avec le nom et la durée, ou un message dit que rien n'est gardé.

## 3. Classe (b) : vus seulement sur l'ancien paquet, ou jamais rendus ; à rejouer sur le tour 10 (30)

Chaque ligne est à rejouer au Playwright en ligne (`connectOverCDP`, fenêtre visible) APRÈS le déploiement de D429 (L-47), sinon le service worker ressert l'ancien paquet.

| L | Gravité | Foc. | Défaut (sources) | Ce qu'on sait du tour 10 |
|---|---|---|---|---|
| L-17 | G (B pour M4) | 1 | Le geste du Calendrier (menu, cadre, tenue au bord) change la période de l'app en haut (M1-1, M4-1, effet de M2-1) | **Infirmé** par M2 (≈ 40 gestes) et M5 (≈ 150 relevés) sur le tour 10 : la période reste fixe. Vrai sur l'ancien paquet (CAL-PERIODE-APP-FIXE). À rejouer pour clore |
| L-18 | G | 1 | Défilement au bord : 0,5 à 0,6 sem./s, doigt qui tremble S34→S32 contre immobile S42→S34, 40 s pour reculer d'une demi-année (M1-2, M1-3, M2-3) | **Contredit** par M5 (35 sem. en 3 s à 6 sem., +88 sem. en 3 s à 3 mois). Hypothèse : rAF bridé chez M1 et M2 (`useGlisse.ts:48`). Rejouer fenêtre visible, tremblement ±1 px compris |
| L-19 | m | 1 | Deux semaines lues à la fois ; la lecture reste après le lever du doigt (M1-8) | Ancien paquet seul ; M2 : la lecture suit le doigt, sans test du lever |
| L-20 | m | 1 | Les raccourcis d'échelle n'ancrent pas la fenêtre pareil : 2 sem. saute sur la semaine en cours, 6 mois garde le début (M1-9) | M2 dit « même début » au tour 10. Code : `CalendrierTab.tsx:636-643` ancre « Jour » sur aujourd'hui exprès (CHN-3) : peut être voulu |
| L-21 | m | 1 | Le menu n'indique pas l'échelle en cours (aucun Jour/Semaine/Mois marqué à 5, 6 sem., An ; « 4 sem. » absent du menu) (M1-12, M4-4) | « 4 sem. » absent : voulu, il a lui-même listé 2, 6 sem., 3, 6 mois, An (SPEC 21.11). Le marquage manquant reste à rejouer |
| L-22 | m | 1 | Rechargement : échelle et fenêtre perdues (M1-10, M3-S9) | **Infirmé** au tour 10 par M2 et M5 : fenêtre gardée (`laffinee.calendrier.fenetre-locale`) |
| L-23 | G | 2 | Fiche v02 : la date se règle par une réglette propre `.cal-fi-regle` qui se ferme sans rien changer à la souris et ferme la fiche au toucher (M3-1, CAL-FICHE-FRISE) | **Infirmé** par M5 sur le tour 10 : la date de la fiche se règle par `.cal-f-duree`, la même réglette que la feuille d'ajout |
| L-24 | m | 2 | Brassin posé par le + : « LOT-4eeeabd2-badc-… » brut dans Brassins, au Bord et dans le toast (M3-2) | Non rejoué sur le tour 10 |
| L-25 | m | 2 | Barre posée au lundi : brassin du 22 nov. (dimanche) dessiné depuis le 16 nov., jusqu'à 6 jours de décalage à 4 sem. (M3-3) | Non rejoué ; à confirmer si c'est un choix d'échelle |
| L-26 | G | 2 | Carnet › idée › « Au calendrier » (1 mois, 100 CHF) : une ampoule en S52 seulement, aucun achat prévu, argent inchangé (M3-4) | Non rejoué. Ses mots (SPEC 20.11) : « en 1 bouton 3 actions : ajout, transfert, prix estimé » |
| L-27 | m | 2 | Toast de pose : « S48 : −680 → −691 » contre l'en-tête −694, deux soldes sans dire lequel (M3-7) | Non rejoué |
| L-28 | m | 2 | Fiche du brassin sans « … › Supprimer » ni Modifier (M3-8) ; D412 les y met | Non rejoué (brassin) |
| L-29 | m | 2 | Semaine dépliée : grille en jours, courbe en semaines ; « lol −600 » hors colonne ; « S48 23–29 nov. » écrit deux fois (M3-9) | Non rejoué ; CAL-ECHELLE-COHERENTE |
| L-30 | d | 2 | Le + ignore la semaine touchée (propose « en S47 ») (M3-10) | Non rejoué |
| L-31 | d | 2 | Le bouton + recouvre la ligne Supprimer de « … » (M3-11) | Non rejoué |
| L-32 | m | 2 | Toast par-dessus le bas de la liste : un toucher a pris « Annuler », l'activité supprimée est revenue (M3-12) | Non rejoué ; voisin de TOUCHER-FANTOME (usePointeur.ts, garde de clic) |
| L-33 | d | 2 | Libellés de la feuille incohérents : « cette semaine S47, 22 nov. » contre frise « S47, 16 nov. » ; « vers nov. » ; un achat a une « Durée » (M3-13) | Non rejoué |
| L-34 | d | 2 | Ordre des brassins instable (Ttt et Hefe échangent leur place) (M3-14) | Non rejoué |
| L-35 | d | 2 | Carnet à deux adresses : Brassins › Atelier › Carnet et Stocks › Matériel › Carnets (M3-15) | Non rejoué |
| L-36 | G | 2 | « Durée 1 semaine jusqu'à S47 » pour une chose d'un jour ; le compte suit les semaines touchées (22 nov. → 20 déc. = 28 j affiche « 5 sem. ») (M4-2) | T9-3 est corrigé (a3d21c119, d52abb79d) mais M4 voit encore le texte : rejouer, en particulier le compte « 5 sem. » |
| L-37 | G | 1 | Rafale sur ‹ de l'app : 2 pas sur 5, le bouton glisse parce que la largeur du libellé change (M4-3) | Non rejoué. Ses mots (SPEC 21.11) : « il faudrait des tailles fix car SI non ça fait bouger le calendrier » |
| L-38 | m | 2 | Feuille Modifier : fermeture sans avertissement, × qui passe de y = 611 à 538 (M4-10) | Non rejoué |
| L-39 | m | 2 | Aucun état hors ligne sur le Calendrier ; `App.tsx:749` lit `navigator.onLine` au rendu, sans écouter l'événement (M4-11) | Simulé en JS seulement ; code relu : vrai (l. 749) ; à rejouer avec une vraie coupure |
| L-40 | d | 2 | Cibles : « ± » 22×28, icônes d'en-tête 24 à 28, « Fermer » 24×24 (< 44) (M4-12, T9-5) | Non rejoué ; T9-5 déjà ouvert |
| L-41 | d | 2 | Menu d'appui long : « Ranger sans date » en rouge pour du neutre, pas de « Supprimer » (M4-13) | Non rejoué |
| L-42 | d | 2 | Icône et montant placés autrement selon la rangée (Achats, Papiers, Ventes) (M4-14) | Non rejoué |
| L-43 | d | 2 | Feuille Modifier : rangée « Fin L 14 … D 20 » sans mois ; deux rangées de jours : dans la liste blanche de GESTE-DATE-PARTOUT ? (M4-15) | Non vérifié par M4 |
| L-44 | m | 2 | FC-1 : « Exercice 2026 » donne une fenêtre de 53 semaines (plafond à l'horizon, pas à l'An) (FAST-CHECK) | Lu au code, test `FC-1` (`it.fails`), rendu jamais vu : `Fenetre.tsx:33-53` |
| L-45 | m | 2 | Liste : rangées « neipa v3 » vides ; « Vente 10 × Bière » chevauche « Vente 1 × ZZ TEST » (M2 §5, hors focus) | Ancien paquet, une capture |
| L-46 | d | – | Console : Firestore « Detected an update time that is in the future » (2 fois M1, 33 fois M4) et « Failed to obtain primary lease » (M1-14, M4) | Environnement probable (horloge du poste, plusieurs onglets) ; à rejouer sur le téléphone |

## 4. Classe (c) : déjà corrigés, non déployés (2)

| L | Gravité | Défaut | Correctif |
|---|---|---|---|
| L-47 | B | Le service worker sert l'ancien paquet tant qu'un onglet reste ouvert ; `registration.waiting` vaut vrai ; sur ce paquet chaque choix du menu change la période de l'app (T10-M2-1). Cause : D414 (`registerType: 'prompt'`, sans invite) | D429 **en cours, non commité** : `git status` de port-carnet montre `src/main.tsx`, `src/services/precacheHorsLigne.ts`, `firebase.json` modifiés. À commiter, déployer, puis rejouer L-17 à L-35 sur le tour 11 |
| L-48 | m | Fenêtre d'une semaine : « S47 » écrit deux fois et aucune graduation de jour (T10-M1-7, T10-M2-5) | `f9cd2cf84` dans main : le cadre dit ses jours (« 26 oct.–1 nov. »), la graduation dit « S44 » ; l'année du cadre T9-2b déjà corrigée (4ce895e88, ea6e55060, f9cd2cf84) ; calPasseG3 : `fenetreDePeriode` rend `null` sur une période sans genre |

## 5. Classe (d) : questions de choix du brasseur (5)

Règle n° 1 : un choix ouvert se montre en mini maquettes, dans un artefact neuf (CLAUDE.md, L24). Rien ci-dessous n'est écrit en code avant sa réponse.

**Q-1 — Le cadre de taille fixe (x 68 à 316 sur 390, quelle que soit la durée) : voulu ?**
- Ses choix : la frise B (20.11) et sa règle R4, « sur la frise du temps, l'échelle doit changer pour toujours voir les 2 bouts » ; le code la tient (`vueDeFenetre` : début et fin à 56 px des bords, `moteur.ts:72`). Voulu, donc : le cadre de taille fixe est le choix.
- Mais CAL-ECHELLE-COHERENTE (22.11) : « Ça adapte pas l'échelle, et honnêtement ça fonctionne encore assez mal... » — l'étiquette, le dessin, la période et les graduations disaient quatre périodes. Et D387 (18.11, cité dans `alignement.ts`) : « juste un bouton qui match les deux ou pas genre un toggle switch » : « Aligner la courbe sur la frise », éteint par défaut. Les graduations restent sur toute la largeur, la courbe sur l'axe R4 : c'est le défaut L-2.
- Attention : « il faudrait des tailles fix car SI non ça fait bouger le calendrier » (21.11, CAL-ENTETE) parle des hauteurs de l'en-tête qui bougent, pas de la largeur du cadre. Ne pas le lire comme un choix sur L-2 (L01).
- Options à montrer en mini maquettes : A — graduations sur l'axe de la courbe (les semaines des marges de 56 px sont graduées aussi, le cadre couvre exactement ses graduations) ; B — le cadre remplit toute la largeur, graduations et courbe sur la fenêtre (retire R4 à l'en-tête) ; C — « Aligner » allumé par défaut (le cadre est alors à refaire : il disparaît, M5 c21). Recommandation : A.

**Q-2 — Glisser la frise hors du cadre : défiler vers le passé, ou lire la semaine ? (T10-M1-4)**
- CAL-RETOUR-PASSE (« On peut toujours pas revenir en arrière ??? ») nomme « glisser » ; le code lit la semaine (c2-b) et REPRISE-CAL-23 l'avait déjà remontée. M5 : le cadre glissé ou tenu au bord recule de plus de 52 semaines par geste ; M2 : toucher la courbe hors du cadre lit la semaine. Recommandation : garder la lecture (c2-b), le retour dans le passé est tenu par le cadre. Mini maquette : un doigt à gauche du cadre, deux effets.

**Q-3 — La pastille « −683 CHF à dépenser · S50 » : le creux de tout l'horizon, ou celui de la fenêtre ? (L-5)**
- CAL-AN-390 : « pastille = ce que montre le cadre » ; son aria dit « sur tout l'horizon ». Options : A — creux de la fenêtre (le chiffre et la semaine changent au geste) ; B — creux de l'horizon, avec « horizon » écrit. Recommandation : A, comme sa règle.

**Q-4 — La vitesse du défilement au bord : 0,15 à 1,35 largeurs par seconde (R7 de la frise B) tient-elle au vrai doigt ? (L-18, T10-M5-6)**
- M5 : « 35 semaines en 3 s » à 6 sem., trop vite pour viser ; M1 et M2 : trop lent (probable artefact). Avant de choisir : rejouer au téléphone du brasseur. Pas de maquette utile (c'est un ressenti) : défaut A, ne rien changer, jusqu'à son retour.

**Q-5 — L'étiquette du cadre à plusieurs semaines (« S46 – S49 ») répète les graduations : à garder ? (L-12)**
- CAL-FRISE-ETIQUETTES : « un libellé de période une seule fois » (« S47 » écrit deux fois, capture 35). Options : A — le cadre dit les dates (« 9 nov. – 6 déc. ») et les graduations les semaines ; B — le cadre dit les semaines et les graduations se taisent sous le cadre ; C — garder (la règle ne vaut que pour une semaine). Recommandation : A.

## 6. Ordre de correction proposé

0. **L-47 (B)** : commiter et déployer D429 ; sans lui, personne ne voit le tour 10 et les tests en ligne (L-17 à L-46) jugent l'ancien paquet. Vérifier ensuite `document.scripts` = nouveau paquet.
1. **L-1 (B, focus 1)** : barre accrochée au bord gauche. Test d'abord (Playwright CDP + unitaire `lostpointercapture`) ; correctif : écouter `pointerup`, `pointercancel` et `lostpointercapture` au niveau fenêtre pendant le geste (comme `EnTete.tsx:319`, `useGlisse.ts:92`). Puis L-8 (bord droit), même module.
2. **Frise (focus 1)**, dans cet ordre :
   a. L-6 (G) : correctif d'une ligne, test sûr (`onPeriode` à jour).
   b. L-2 (G), après la réponse à Q-1 : un seul axe pour la courbe, le cadre et les graduations. C'est la racine de CAL-ECHELLE-COHERENTE ; L-3, L-4, L-5, L-12 en dépendent en partie.
   c. L-3 et L-4 (G, m) : même fonction de placement (`Courbe.tsx`) ; décider « se taire » plutôt que « … » (Q n'est pas nécessaire : sa règle le dit).
   d. L-5 (G), après Q-3. L-7 (FC-2, test déjà écrit). L-10, L-11, L-12 (après Q-5), L-13, L-9.
   e. Rejouer L-17, L-18 (fenêtre visible), L-19 à L-22, L-37.
3. **Calendrier global (focus 2)** : L-14 (G, GESTE-DATE-PARTOUT), puis L-15, L-16 ; rejouer la classe (b) 2 (L-23 à L-36, L-38 à L-45) et sortir de la liste ce qui ne se reproduit pas ; L-26 (G, « Au calendrier » ne crée pas d'achat) et L-36 (G) d'abord.

Premier banc à écrire (échoue aujourd'hui, sur le tour 10) : L-1, L-6, L-2 (x des graduations), L-3, L-4, L-7 (déjà `FC-2`).

## 7. Limites

- Les captures de M3 sont de l'ancien paquet (son rejeu sur le tour 10 est au DOM seul) ; les captures du tour 10 sont celles de M2 et de M5 (planches `M-*.png`). Je ne les ai pas rouvertes pour cette synthèse : les verdicts reposent sur les rapports. Rien n'a été contredit entre rapports hors le défilement au bord (L-18).
- Les « fichiers probables » viennent d'une lecture du code de port-carnet, pas d'une exécution ; les causes de L-1 (perte de capture), L-6 (fermeture périmée) et L-11 (bandeau) restent à confirmer par le test écrit d'abord.
- M4 mesure à 628 et 500 px, M1 et M2 en 390 émulé par feuille de style, M5 en 390 exact : les constats de rognage (L-4) de M1 et M4 sont à rejouer à 390 réel.
