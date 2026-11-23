# M1 — Test exploratoire en sessions : frise du temps du Calendrier (tour 10, en ligne)

Date : 22.11.2026, soir. App : https://brasserie-l-affinee.web.app/ (tour 10). Testeur : agent M1 (Opus).
Captures : `work/missions/2026-11-23-calendrier-en-ligne/captures-M1/` (32 fichiers, toutes regardées).

## Méthode

Session-Based Test Management (James Bach, Jonathan Bach, 2000) : chartes « Explorer <zone> avec <ressource> pour
découvrir <risque> », sessions de durée fixe, notes de session, métriques TBS (test / bug / préparation), puis
débriefing par défauts et questions. Après chaque geste significatif : capture regardée, puis mesure DOM en appui
(étiquette du cadre, période de l'app, pastille, graduations, boîtes des étiquettes).

Outils (consigne du pilote) : chaque geste de frise joué **à la souris** (`left_click_drag`, instantané) **et au doigt**
(PointerEvent `pointerType:'touch'`, pointerdown → pointermove par pas de 10 à 14 ms → pointerup, envoyés sur l'élément
réel trouvé par `elementFromPoint`). Variantes jouées : glisser lent, glisser rapide (pas de 4 ms), doigt tenu immobile
au bord (3, 4, 6, 8 et 10 s), tremblement ±1 px pendant la tenue, Échap et pointercancel pendant le geste.
TouchEvent non envoyé : la frise n'écoute que les Pointer Events (`src/ui/geste/useGlisse.ts`, l. 88 à 93).

### Limite d'outil, à lire avant les constats

La fenêtre Chrome partagée est réduite (outer 160×28) ; `resize_window 390×844` répond « OK » mais la page se rend en
628×1297. Pour juger à 390 sans toucher à la fenêtre des autres, j'ai contraint la page de MON onglet par une feuille
de style injectée (body 390×844, `transform` pour contenir les éléments fixes, #root défilant), puis remonté l'écran
(Bord → Calendrier) pour que la frise se mesure à 390. Contrôlé : aucune règle `@media` de l'en-tête ni de la frise
entre 390 et 628 px (seules 699 px, landscape et pointer: fine). Limites : `window.innerWidth` reste 628 (sert au
placement du menu de période, MenuPeriode l. 84) ; le défilement passe par #root et non par la fenêtre. Aucun défaut
ci-dessous ne dépend de ces deux points. Le premier rendu, avant remontage, était cassé par ma feuille de style : ce
n'est pas un défaut de l'app et il n'est pas compté.

## Chartes et sessions

| # | Charte | Joué | TBS estimé (T/B/P) |
|---|---|---|---|
| C1 | Explorer le cadre de la frise avec glisser souris et doigt (lent, rapide) pour découvrir une période de l'app qui bouge ou un saut de semaine | oui | 50/30/20 |
| C2 | Explorer les deux bords du cadre avec tirer, réduire à 1 semaine, tenir au bord 4 et 8 s pour découvrir un bout qui décroche ou une échelle incohérente | oui | 55/25/20 |
| C3 | Explorer les échelles du menu (2 sem., 6 sem., 3 mois, 6 mois, An ; Jour, Semaine, Mois ; 1 sem., 5 sem., 30 sem. aux poignées) pour découvrir étiquette ≠ dessin ≠ pastille ≠ graduations | oui (7 sem. non atteint exactement : 5, 6 et 30 joués) | 60/30/10 |
| C4 | Explorer le recul loin dans le passé avec cadre tenu au bord, glisser hors cadre et ‹ de l'app ×11 pour découvrir un passé bloqué (CAL-RETOUR-PASSE) | oui | 55/35/10 |
| C5 | Explorer l'avance loin avec cadre tenu au bord droit 2 × 10 s pour découvrir une butée ou une année fausse | oui | 70/15/15 |
| C6 | Explorer ‹ › de l'en-tête de l'app pour découvrir si la frise ou la période se désaccordent | oui | 60/30/10 |
| C7 | Explorer rechargement, Échap et pointercancel pendant un geste pour découvrir une perte d'état ou une annulation fausse | oui | 50/20/30 |
| C8 | Explorer toucher une semaine (appui long au cadre, graduation touchée), étiquettes et pastilles de courbe à 390 pour découvrir lecture fausse, chevauchement, texte rogné | oui | 55/35/10 |

Préparation lourde au départ (≈ 25 % du temps total) à cause de la limite d'outil ci-dessus.
Aucune donnée créée, déplacée ou supprimée : seuls des états d'affichage ont été changés. Les étiquettes
« ZZ TEST — M3 — … » visibles sur la courbe viennent de l'agent M3, pas de moi ; le solde a bougé de −683 à −756
pendant la session pour la même raison.

Couverture : 8 chartes sur 8 jouées ; non joué : TouchEvent, pincer, paysage, clavier des poignées, vrai doigt
(CDP indisponible), « 7 sem. » exact. Couverture estimée 80 %.

## Défauts

**T10-M1-1 — G — Le geste du Calendrier change la période de l'app (régression CAL-PERIODE-APP-FIXE).** Outil : souris ET tactile.
- Geste : Calendrier, 4 sem., S46 – S49, en-tête de l'app « 9 nov. → 6 déc. ». Glisser le corps du cadre d'une semaine à gauche (190,125 → 100,125).
- Attendu : la période de l'app reste « 9 nov. → 6 déc. » ; seul le cadre bouge.
- Observé : l'en-tête de l'app passe à « 2 → 29 nov. » (souris, capture 01) ; au doigt, retour à « 9 nov. → 6 déc. » (02). Idem en tirant un bord (06, 07 : « 21 sept. → 1er nov. »), en choisissant une échelle au menu (12 : 2 sem. → « 16 → 29 nov. » ; 14, 15, 16) et en tenant au bord (24, 25 : « 28 déc. 2026 → 7 févr. 2027 »).
- Captures : `captures-M1/01-souris-glisse-periode-app.png`, `02-tactile-glisse-periode-app.png`, `12-preset-2sem.png`, `25-avance-20s.png`.

**T10-M1-2 — G — Doigt qui tremble au bord : le défilement s'arrête (CAL-RETOUR-PASSE en partie).** Outil : tactile seulement (la souris ne sait pas tenir).
- Geste : 6 sem. Glisser le corps du cadre jusqu'au bord gauche (x = 8) et tenir 6 s, une fois immobile, une fois avec tremblement ±1 px.
- Attendu : le même recul ; un vrai doigt tremble toujours.
- Observé : immobile, S42 → S34 (8 sem.) ; avec tremblement, S34 → S32 (2 sem.). À 4 sem. : tremblement 3 s, S46 → S43 (le seul déplacement du doigt) ; immobile 8 s, S43 → S37.
- Captures : `19-6sem-bord-tremble.png`, `21-tremble-vs-ferme.png`, `03-bord-tremble-3s.png`, `04-bord-tenu-8s.png`.

**T10-M1-3 — m — Défilement au bord lent : reculer d'une demi-année demande environ 40 s de doigt tenu.** Outil : tactile.
- Mesures : 4 sem., ≈ 0,5 sem./s ; 6 sem., ≈ 0,6 sem./s ; bord droit tiré dehors et tenu 8 s : la fenêtre passe de 2 à 4 sem. seulement (« resserre l'échelle » R7, très lent). Avance : 10 s, + 11 sem. ; 10 s de plus, + 10 sem.
- Attendu (CAL-RETOUR-PASSE) : reculer d'au moins 26 sem. par chaque geste. Possible au cadre, mais long.
- Captures : `04-bord-tenu-8s.png`, `10-fin-tenue-8s.png`, `24-avance-10s.png`.

**T10-M1-4 — m — « Glisser la frise » hors du cadre ne recule pas : il lit la semaine.** Outil : tactile.
- Geste : 6 sem., doigt posé à x = 362 (hors du cadre, plus de 22 px), glissé jusqu'à x = 40.
- Attendu (CAL-RETOUR-PASSE cite « glisser ») : la frise défile vers le passé.
- Observé : période inchangée (S42 – S47) ; lecture « S42, 12 → 18 oct. » à la place du solde. Conforme au code (c2-b), mais contraire à la ligne de règle : à trancher (Q2).
- Capture : `20-glisse-hors-cadre-lecture.png`.

**T10-M1-5 — m — Une étiquette de courbe touche ou croise l'étiquette du cadre (régression CAL-FRISE-ETIQUETTES).** Outil : souris (menu), mesure DOM.
- Geste : menu, 6 sem. (puis 3 mois, 6 mois, An) ; poignée de fin tirée jusqu'à 30 sem.
- Attendu : aucune boîte d'étiquette n'en touche une autre.
- Observé : « Achats · Fruty −2 » posé sur « S47 – S52 », boîtes qui se croisent (6 sem., 3 mois, 6 mois, An) ; « ZZ TEST — M3 — achat −37 » sur « S45 – S21 2027 » (30 sem.). « Achats · Ssr −13 » et « lol −600 » coupés par le trait rouge vertical (4 sem.).
- Captures : `13-6sem-etiquettes.png`, `14-3mois.png`, `15-6mois.png`, `16-an.png`, `31-30sem-etiquettes.png`.

**T10-M1-6 — m — Étiquette de courbe rognée par « … » (régression CAL-AN-390).** Outil : souris (‹ et menu).
- Geste : 6 sem. S32 – S37, ou An (nov. 2026 – oct. 2027).
- Observé : « Vêtements et s… −132 ».
- Captures : `22-fleche-app-x10.png`, `32-an-rogne.png`.

**T10-M1-7 — m — À 1 sem., la frise ne montre pas les jours.** Connu, corrigé non déployé (f9cd2cf84).
- Geste : poignée de début tirée au-delà de la fin. Observé : « S44 » seul, aucune graduation de jour, cadre étiré.
- Capture : `08-une-semaine-sans-jours.png`.

**T10-M1-8 — m — Deux semaines lues à la fois, et la lecture reste après le lever du doigt.** Outil : tactile puis souris.
- Geste : appui long au cadre sur S48 (x = 290, 4 s), doigt levé, puis toucher la graduation S46.
- Attendu : une lecture à la fois ; elle s'efface au lever ou au geste suivant.
- Observé : en-tête « −716 CHF · S48 · 23 nov. −15 » et ligne « S48, 23 – 29 nov. … la semaine −15 » restent affichés pendant que la graduation S46 se déplie (« S46 9–15 nov. · toucher pour replier »).
- Captures : `28-lecture-S48.png`, `30-deux-semaines-lues.png`.

**T10-M1-9 — m — Les raccourcis d'échelle n'ancrent pas la fenêtre de la même façon.** Outil : souris.
- Geste : depuis S43 – S47, menu « 2 sem. » → S47 – S48 (saut sur la semaine en cours) ; depuis S45 – S48, menu « 6 mois » → S45 – S21 2027 (le début reste). Depuis S47 – S48, « 6 sem. » → S47 – S52.
- Attendu : un seul ancrage, toujours le même (début gardé, par exemple).
- Captures : `12-preset-2sem.png`, `31-30sem-etiquettes.png`.

**T10-M1-10 — m — Rechargement : échelle et fenêtre perdues.** Outil : navigation.
- Geste : 6 sem., S53 – S5 2027 ; recharger la page.
- Observé : retour à 4 sem., S46 – S49, « 9 nov. → 6 déc. ». Rien ne dit qu'il doit retrouver sa fenêtre : à trancher (Q3).
- Capture : `26-apres-rechargement-esc.png`.

**T10-M1-11 — d — Échelle Mois : graduations jusqu'à « avr. » alors que la période va au 16 mai 2027.** Outil : souris.
- Geste : An → menu → Mois (retour à 6 mois, S47 – S19 2027). Capture : `17-mois-graduations.png`.

**T10-M1-12 — d — Le menu n'indique pas l'échelle en cours.** À 5 sem., 6 sem. et An, aucun segment Jour, Semaine ou Mois n'est marqué (à 2 sem., « Jour » l'est). Capture : `11-menu-echelle.png`.

**T10-M1-13 — d — Période écrite deux fois.** L'étiquette du cadre « S46 – S49 » répète les graduations S46 … S49 juste dessous (CAL-FRISE-ETIQUETTES : un libellé de période une seule fois). Capture : `26-apres-rechargement-esc.png`.

**T10-M1-14 — d — Console : Firestore signale « Detected an update time that is in the future » (2 fois).** Sans effet visible.

## Joué sans défaut (non reproduit)

- Glisser rapide (pas de 4 ms) : 180 px donnent exactement 2 sem., sans élan parasite (05).
- Échap et pointercancel pendant le glisser : retour exact à S46 – S49 (26).
- Appui long au corps du cadre : la semaine lue correspond au bord du cadre (x = 100 donne S45, premier jour du cadre ; x = 290 donne S48, dernier) (27, 28).
- Pour 2 sem., 4 à 6 sem., 3 mois, 6 mois, An : étiquette du cadre = pastille = nombre de graduations (sauf T10-M1-11).
- ‹ de l'app ×11 : recul régulier de 6 sem. jusqu'à avril 2025, sans blocage (22, 23).
- Avance : passage d'année juste (« S53 – S5 2027 » ; 2026 a bien 53 semaines ISO) (25).
- Aucune « S47 – S52 2026 » fausse après un recul d'un an : non vu.

## Questions

- Q1 : ‹ › de l'app changent l'en-tête (« 28 avr. → 8 juin 2025 ») sans bouger le Calendrier (S32 – S37 2026) : deux périodes à l'écran (22, 23). Conforme à « la fenêtre du Calendrier est locale », mais le brasseur voit-il bien que ce sont deux choses ? Avec T10-M1-1, le lien est asymétrique : le cadre écrit la période de l'app, l'app n'écrit pas le cadre.
- Q2 : glisser hors du cadre doit-il faire défiler (CAL-RETOUR-PASSE) ou lire la semaine (c2-b) ?
- Q3 : la fenêtre et l'échelle doivent-elles survivre à un rechargement ?
- Q4 : à An, la flèche › de l'app paraît grisée (16) : butée voulue à +1 an ? Non vérifié.
