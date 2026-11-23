# Reprise — voie frise prix, 2e passe (21.11), arrêtée à 154 k (hook). Plan : REPRISE-PRIX.md. Outillage : REPRISE-CAL-24.md.

## Fait (NON commité, NON testé ; tsc sans erreur sur ces deux fichiers)
Point 1 (Cadre useGlisse + appui long), code écrit :
- `src/ui/calendrier/entete/Fenetre.tsx` : `demarrer` et `PriseCadre` retirés ; Cadre prend `surface` (ref de la courbe) et
  `onLire(clientX | null)` ; `useGlisse<SaisieCadre>` attaché par `useEffect` à `surface.current` ; `saisir` rend null hors de
  [xa − 22, xb + 22], sinon `e.stopPropagation()` + `roleSous` ; corps : minuterie `APPUI_LONG_MS` → `lit` (lecture qui suit le doigt,
  `avalerClicSuivant` au lâcher) ; a/b : `poserPlage` (R6 : début étire seul), R4 ; corps : R5 marge 56 ; `bord` R7 (corps défile,
  bout dehors resserre ancré sur l'autre) ; lâcher : `onChange` + `recaler`. Plus d'`onAnnee` auto ni d'`if (annee) return` (donc
  l'ÉCHELLE est déjà débloquée côté Cadre). `clavierDebut` en R6. aria-label début : « étirer la fenêtre, elle commence en S… » (geste.mjs
  lit /commence en S(\d+)/) ; fin : « étirer ou réduire la fenêtre (Entrée : l'année) ». `onTropCourt` retiré.
- `src/ui/calendrier/entete/EnTete.tsx` : import `PriseCadre` et `MESSAGE_ANNEE` retirés ; `gestesCourbe = gestes` ; `versCourbe` : rend
  la main si la cible est dans la courbe, sinon redispatche un `PointerEvent('pointerdown')` sur la courbe (repli : ancien appel) ;
  `<Cadre … surface={cadreCourbe} onLire={cx => setLecture(cx === null ? null : indexSous(cx))}>`.
- Scripts : scratchpad `prix/p1-fenetre.mjs`, `prix/p1-entete.mjs` (déjà appliqués, ne pas relancer).

## 3e passe (21.11, arrêtée à 154 k) : point 1 PAS fini, rien commité
- Tests lancés : 23 échecs (21 calendrierEntete, 2 calPasseGlisse), attendus : anciens comportements (corps = lecture, début déplace,
  onAnnee auto, « Tire jusqu'au bout ») et moves sur `window`. Réécriture test par test PRÉPARÉE, non appliquée :
  scratchpad `prix/p1-tests.md` (lignes, positions R4 : cadre 56–334 px, prise 34–356 px, hors cadre x 20 ou 370).
- Défaut de code probable (CRITIQUE-10 n° 6, toucher bref dans le corps, clic rabattu sur ±) : `lacher` du Cadre doit appeler
  `avalerClicSuivant()` à chaque lâcher. À appliquer et prouver.
- Écart à trancher au point 2 : dans l'An, un toucher sur la poignée de fin ne ramène plus la fenêtre d'avant (seul le clic clavier).

## Prochaine action
0. Appliquer `prix/p1-tests.md` (script .mjs écrit avec Write, pas de heredoc), corriger `lacher`, rejouer les 3 fichiers.
1. Tests jsdom : `npx vitest run tests/integration/calendrierEntete.test.tsx tests/integration/calPasseGlisse.test.tsx tests/integration/calPasseL.test.tsx`.
   Attendu : les tests qui tirent le cadre font `fireEvent.pointerMove(window, …)` (l. ~737 « b1 bis », ~1594) ; useGlisse écoute sur la
   courbe (capture du pointeur) : les passer sur `cb`. Ajouter un test : corps tenu 450 ms (fake timers) → lecture ; début tiré → fin
   inchangée (R6).
2. geste.mjs (via `geste-mien.mjs`) : réécrire « reculer/avancer le début » en R6 (`b.n !== a.n`, fin = même semaine) ; ajouter « corps
   glissé → même durée, début change » et « corps tenu 450 ms → lecture, fenêtre inchangée ». Rouge tour8, vert arbre (390 tactile, 1280).
3. Commit point 1 (`cal-24/commit.mjs`, chemins : Fenetre.tsx, EnTete.tsx, tests touchés, geste.mjs préparé).
4. Point 2 ÉCHELLE : EnTete `onChange` du Cadre → `if (annee) { fenAvantAnnee.current = null; if (!liste) onVue('semaines'); }` puis
   `ecrire` ; `echelleEffective` (echelle.ts l. 32) : `if (semaines > PERIODE_DE_L_ECHELLE.mois) return 'mois'` hors An (vérifier
   tests/unit/calendrierEchelle.test.ts). MenuPeriode/libelleDuree : rien à changer pour 40 sem. Puis points 3 à 6 de REPRISE-PRIX.md.

## 4e passe (21.11, arrêtée vers 165 k) : point 1 COMMITÉ (d5fae0f37), étape geste.mjs PAS commitée
- Fait : tests calendrierEntete (112) et calPasseGlisse verts, tsc propre ; `lacher` du Cadre appelle `avalerClicSuivant()` à chaque
  lâcher (prouvé : CRITIQUE-10 n° 6 « toucher bref » rouge sans l'appel, vert avec) ; CHG-3 : dans l'An, la poignée ne ramène plus la
  fenêtre d'avant (clic clavier seul, tests E13 et CRITIQUE-11 n° 1 réécrits). Un `afterEach` du fichier envoie un pointerdown à window
  (l'écoute « avale le clic » survit aux minuteries simulées et avalait le clic du test suivant).
- tests/integration/calendrier* : 516 verts, 1 échec étranger à cette voie (calendrierPaquetE « Dédé glissé d'un jour » : bouton
  `Dédé, 1 fût` introuvable, vue Jour) ; à regarder par qui possède le Jour.
- geste.mjs : étapes « reculer/avancer le début » réécrites en R6 dans l'ARBRE (script scratchpad `prix/geste-r6.mjs`, copie de HEAD
  prête : `prix/geste-head-r6.mjs`, à commiter par `cal-24/commit.mjs … scripts/parcours/geste.mjs=<cette copie>`).
  ROUGE sur tour8 prouvé (`prix/g-tour8.log` : S44·13 → S40·13). VERTE sur l'arbre NON prouvée : le build de l'arbre (`prix/build`,
  embarque le travail des autres voies) ne montre ni courbe ni cadre à 390 et 1280 (« courbe ou cadre de la fenêtre introuvable »,
  `prix/g-arbre.log`) ; à diagnostiquer (sélecteur du parcours ? CalendrierTab en cours d'une autre voie ?), puis rejouer.
- Reste : 1) diagnostiquer l'absence du cadre dans le build de l'arbre, rejouer geste.mjs `--endroits calendrier` (vert attendu sur
  « reculer/avancer le début ») ; 2) commiter geste ; 3) points 2 à 6 de REPRISE-PRIX.md (ÉCHELLE : voir « Prochaine action » 4 ci-dessus).
