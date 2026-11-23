# Chasse Calendrier — regard « gestes » (21.11)

Version jugée : `en-ligne/2026-11-21-tour8` (5fb61c580), build de test (`scripts/parcours/vite.parcours.config.mjs`) depuis un worktree détaché
dans os.tmpdir(), `?dev-local&finance-demo=parcours-calendrier`, fixture `scripts/parcours/fixtures/calendrier.mjs` + « ZZ TEST Geste ».
Jamais Gemini, jamais seedData. Gestes : 390 tactile (CDP `Input.dispatchTouchEvent`, un doigt), 1280 souris ; clair et cave.
Échelles : 6 sem., 3 mois, An (menu), 2 sem. et 14 sem. (atteintes au doigt). Scripts et journaux :
`C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/chasse-gestes/` (`haut.mjs`, `barres.mjs`, `*.log`, `cap/`).

Défauts connus non recopiés : le corps du cadre ne glisse pas (CAL-FRISE-PRIX, D410), la barre qui ne s'étend pas au bord (CAL-BARRE-BORD),
le pas à la semaine (CAL-JOUR), le vide sous Brassins (CAL-VIDE, visible sur chaque capture).

## Défauts

### CH-gestes-1 — bloquant — Frise du haut : tirer la fin au bord fait fuir le bord, puis le jette hors de la courbe ; 1,5 s tenue = +1 semaine
- Geste : 390 tactile, n'importe quelle échelle (6 sem., 3 mois, 14 sem., 2 sem., aussi à 1280). Prendre la poignée de fin, la tirer jusqu'au
  bord droit de la courbe (x 368 sur 378) et tenir 1,5 s.
- Attendu (R7, R4, R2) : la fin suit le doigt, l'échelle se resserre, le début reste en place, aucun bout ne sort de la frise ; la durée croît
  tant que le doigt tient.
- Constaté (trace, bord droit du cadre à chaque image, doigt immobile à 369) : 322 → 315 → 305 → 284 → 274 (le bord **recule**, loin du doigt),
  puis **460** (saut de 196 px, hors de la courbe qui finit à 378), puis 441 → 424 → 408 → 392 → 377. Au lâcher : S40 → S40–S41, **une seule
  semaine gagnée** en 1,5 s. À 1280 : saut de 525 px. Même trace aux 5 échelles.
- Conséquence : au repos les bouts sont à 56 px des bords (R4), le doigt n'a que 16 px avant la bande de 40 px ; **tout élargissement passe par
  ce mécanisme**. « Étirer vers 17 sem. » depuis 3 mois donne 14 sem. ; « fin étirée +2 sem. » depuis 6 sem. donne 7 sem. Élargir la fenêtre
  au doigt est pratiquement impossible : forme nouvelle de CAL-FRISE-PRIX et CAL-ECHELLE-FIGEE.
- Capture ouverte : `cap/390-clair-haut-6sem-avance-bord-pendant.png` (cadre sorti à droite, poignée de fin invisible, étiquette « S40 – S41 »
  collée au bord).
- Code probable : `src/ui/calendrier/entete/Fenetre.tsx:262-266` (R7 de la fin : `v` recalculé autour de `px(a)`, puis `b = round(un(x + off))`
  avec `off` figé à la saisie, donc la fin lue à l'écran recule quand l'échelle se resserre, puis `span` borné à `total * 1.3` fait sauter la vue).

### CH-gestes-2 — gênant — Frise du haut : le début ne s'étire jamais seul ; le tirer déplace toute la fenêtre
- Geste : 390 ou 1280, 6 sem. ; prendre la poignée de début, la tirer de 2 semaines vers la gauche ou la droite.
- Attendu (R6) : « chaque bord se tire seul », la fin reste.
- Constaté : S44–S49 → S46–S51 (début +2) : la durée reste 6 sem., la fin bouge aussi. Le libellé le dit (« Poignée de début : déplacer la
  fenêtre »). On ne peut pas poser « S40 → S49 » sans deux gestes, ni avancer le début sans perdre la fin. D410 rend le déplacement au corps ;
  la poignée de début doit alors étirer (R6).
- Code : `Fenetre.tsx:245-251` (`genre === 'debut'` : `a = a0 + d; b = b0 + d`).

### CH-gestes-3 — gênant — Frise du haut, An : un simple toucher sur la poignée de début jette l'année
- Geste : 390, menu « An », puis toucher la poignée de début sans bouger.
- Attendu (R1) : un toucher ne change rien.
- Constaté : An (« janv. – nov. 2027 ») → « S49 – S50 », 2 sem. (la fenêtre d'avant). En An, aucune poignée ne se tire (`if (annee) return`) :
  les deux ne font que « Revenir ». Forme nouvelle de CAL-ECHELLE-FIGEE (l'An figé, et en plus perdu au premier toucher).
- Code : `Fenetre.tsx:303` (`if (annee) { … if (!bouge) onRevient?.(); }`), `:280`.

### CH-gestes-4 — gênant — Barres : aucun bord de début ; le bord gauche saisi déplace la barre entière, de 12 semaines pour 2 colonnes
- Geste : 390, 3 mois, brassin planifié « Ssr » (S45) ; poser le doigt à 4 px dans son bord gauche, tirer de 2 colonnes (56 px) vers la gauche
  (le doigt finit dans la bande du bord).
- Attendu (R6, R2) : le début s'étire seul, la fin reste ; la valeur suit le déplacement.
- Constaté : la barre entière part, toast « Ssr : S45 → S33 · Annuler » (−12 semaines). Seul le bord droit existe (`zoneBord`, `surLeBord` lit
  le bord droit seulement) ; même chose pour « Loyer du local » (Papiers, aucun bord) à 1280.
- Code : `src/ui/calendrier/frise/usePointeur.ts:15-16` et `:139` (`surLeBord` : bord droit seul).

### CH-gestes-5 — gênant — Barres : touchCancel rend la date mais pas l'échelle
- Geste : 390, 3 mois, jalon « Commande de malt » (Achats) ou « Café du Pont, 1 fût » (Ventes) posé près du bord droit ; le glisser de
  2 colonnes jusque dans la bande du bord (la frise défile), puis annuler (touchCancel, p. ex. appel entrant).
- Attendu (R10) : « retour exact à la valeur et à l'échelle d'avant ».
- Constaté : aucun toast (la date reste), mais la barre est à 229-257 au lieu de 342-370 (Commande de malt) et 225-253 au lieu de 338-366
  (Café du Pont) : la fenêtre défilée pendant le geste n'est pas rendue. Le brasseur voit sa chose « sauter » de 4 colonnes sans l'avoir posée.
- Code : `usePointeur.ts:145-150` (annulation : `onLacheGlisse(k, true)` sans retour du `defile`).

### CH-gestes-6 — gênant — Brassin en cuve sans fin : aucun geste ne pose sa fin
- Geste : 390, 3 mois, « NEIPA Test » ou « Milk Stout » (« fin non renseignée ») ; tirer le bord droit, glisser, tenir au bord.
- Attendu : la fin d'une chose qui dure se tire (R6) ; le message promet « Seul le jalon de f[in] … ».
- Constaté : aucun bord (`(pas de bord)`), chaque geste répond « Brassin en cuve : le jour de brassage ne bouge pas. Seul le jalon de f… »,
  alors qu'il n'y a pas de jalon de fin à saisir. Les deux en cuve avec fin (« neipa v3 ») s'étirent bien (J10/12 → J10/26).

### CH-gestes-7 — mineur — Bulle de la frise du haut : « S40 – S40 » pour une semaine, et posée sur le coin du début
- Geste : 390, réduire la fenêtre à 1 semaine, puis tirer le début.
- Constaté : bulle « S40 – S40 » (au lieu de « S40 »), à x 32-105 en haut de la courbe, sur le coin du début (68) ; pendant ce temps l'en-tête
  dit « 05.10–11.10 » (S41) et la bande « S41 » : trois valeurs différentes à l'écran. R9 : jamais sur un bout. Capture ouverte :
  `cap/390-clair-haut-6sem-recul-bord-pendant.png`.

## Ce qui tient (joué, rien à redire)
- Toucher sans bouger (milieu, poignées, zones à 30 px dehors), 6 et 8 px de mouvement : rien ne change (R1), aux 5 échelles, 390 et 1280.
- Fin tirée avant le début : 1 semaine au plus court (R6). touchCancel (390) et Échap (1280) sur la frise du haut : fenêtre exacte (R10).
- Rechargement : la fenêtre de la frise du haut est relue (5 échelles). Barres : glisser ±2 colonnes suit le doigt (écart doigt-barre constant),
  bord droit tiré au jour (« prête le 21, 22, 23 déc. ») ; vente encaissée refusée avec sa raison.

## Non joué (limite de l'agent) et à confirmer
- Pincement à deux doigts : non joué. Au code, `usePincement.ts` ne fait qu'un cran jour / semaine / mois par geste, sur la frise seule ;
  la courbe n'a aucun pincement. R14 (« chaque doigt tient le bout de son côté ») n'est pas porté : à jouer avant de classer.
- Persistance des barres après rechargement : la clé `parcours-calendrier:cache` ne contenait pas les choses lues (« absent ») ; les valeurs
  ont été lues par les toasts et la position, pas par le stockage. Les fêtes et « ZZ TEST Geste » (Travaux) n'étaient pas à l'écran en 3 mois
  à 390 au moment du jeu.
- Captures ouvertes : 3 (`cap/390-clair-repos.png`, les deux citées). Les autres de `cap/` ne sont pas regardées.

Compte : 1 bloquant, 5 gênants, 1 mineur.
