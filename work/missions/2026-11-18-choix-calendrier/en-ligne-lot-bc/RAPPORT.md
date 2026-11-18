FINI (reprise 2, 18.11) — EN LIGNE LOT BC — 5/7 OK, 3 problèmes (0 bloquant ; problème 3 confirmé : non), ZZ TEST retirés : oui.

## État de reprise
- Fait : points (1) OK à 1280 et 390 (6 sem., mois, Jour, éteint) ; (3) OK à 1280 ; (5) OK 1280 et 390 ; (6) OK ; (7) mesuré (serré, voir 9 et 12) ; (4) au repos OK, au toucher de la fête OK (tireuse allumée `cal-ponctuel-allume`, Dédé, lol, Impôt pâlis), mais fil toujours tracé tout droit sous Dédé, « +130 », « −150 » et sous la fiche ouverte de la Foire (chemin `M126.3 867V478H130V470`, SVG z-index −1, visible entre les éléments) ; (2) zoom pendant le glisser OK (axe −600/−500, « avant » en pointillé `ent-avant` 5/4, « si tu lâches en S50 : S49 −680 → −530 », « +150 ») et retour au lâcher OK.
- À VÉRIFIER EN PREMIER (problème possible, bloquant si confirmé) : après le lâcher du glisser de la tireuse vers S50 (événements pointeur `touch` synthétiques, pointerId 7 ; setPointerCapture a levé NotFoundError), toast « À dépenser −680 : creux S49 → S50 · Annuler » et jalon DESSINÉ en colonne S50 (x ≈ 228 à 390), mais `data-ponctuel` 2026-11-30 et aria-label « 30 nov., S49 » inchangés après 3 s ; toast « Synchronisation en attente · données de cet appareil · Actualiser ». Ouvrir la fiche de la tireuse (Semaine, Date), puis Finances : l'achat a-t-il bougé ? Refaire avec un vrai glisser souris (computer left_click_drag) pour écarter l'artefact synthétique. Ensuite « Annuler » ou laisser (ZZ TEST).
- Reste à jouer : (3) à 390 ; (6) « Délier » (fiche de la tireuse, bouton « Délier » visible, non touché) ; fiche de la Foire ne dit pas ce qui lui est lié (doute) ; thème sombre (toggle de l'app, `ThemeToggle`) sur (1) à (5) ; console (`read_console_messages`, onlyErrors) ; 1280 pour (4) et (6).
- Données ZZ TEST EN LIGNE À RETIRER (par « Retirer » de leur fiche, sans dialogue) : « ZZ TEST — Foire » (fête S49, id creatif-CR-dbaef71e-ed8d-4338-b233-b8161a07efd0), « ZZ TEST — Tireuse » (achat −150, argent-PLAN-babe68dd-f39d-4161-ad91-5c58572d9079, liée à la Foire), « ZZ TEST — Dédé » (vente +130, argent-PLAN-328895e2-b9a0-4268-85ae-96317583b190). Puis recharger et vérifier Calendrier, Finances (Prévisions, Opérations) : aucun « ZZ TEST ».
- Onglet Claude in Chrome 1005988338 encore OUVERT (à fermer) ; émulation 390 injectée dans la page (body transform translateZ(0), media queries réécrites, setInterval) : un rechargement l'efface. localStorage nettoyé (`__mesSrc`, `__btnSrc` retirés) ; sessionStorage `__emuSrc` retiré ; `__mesSrc`/`__btnSrc` éventuels en sessionStorage seulement.
- Méthode d'émulation qui marche (eval interdit par la CSP, iframe interdit par frame-src) : réécrire `CSSMediaRule.media.mediaText` en 'all'/'not all' selon W/H/hover/pointer (unités px ET rem), `setInterval(()=>window.__procAll(),1500)` (pas la référence figée), `matchMedia`, `innerWidth/Height`, `clientWidth` forcés, `body` W × 1305 et `transform: translateZ(0)` pour contenir les `fixed`.

## Problèmes relevés jusqu'ici (provisoire)
1. Le fil de la Foire à la tireuse passe toujours tout droit sous le jalon de Dédé (vente non liée, pâlie), sous « +130 » et « −150 », et sous la fiche ouverte de la Foire (« Retirer », « Ouvrir dans l'agenda », bloc Semaine) ; visible entre ces éléments. Dédé pâli lève l'ambiguïté, mais la règle « le fil ne passe jamais sur l'info » n'est pas tenue.
2. Bouton « 2 sem. · j » : à 390, padding 5/3, chevron à 2 px du « j » et 3 px du bord, scrollWidth 80 > 78 ; à 1280, 8/6 et 86 > 84. Plus coupé, mais toujours serré et pas centré.
3. (À confirmer) Glisser la tireuse en S50 : dessin en S50, données restées au 30 nov. (voir ci-dessus).
4. Puces de semaine des feuilles d'ajout (≈ 18 px à 390) : deux touchers sur S49 ont pris S48 (souris, émulation ; à confirmer au doigt).

## Doutes (non comptés)
- Après un changement de vue, la courbe alignée garde 1 à 2 s l'ancienne place des points (onglet peut-être en arrière-plan).
- Le « + » flottant recouvre l'onglet « Clients » de la barre du bas à 390 (peut venir de l'émulation `fixed`).
- Toast « Liée à … » au féminin pour un achat.
- Pendant le glisser, l'en-tête dit « −680 CHF à dépenser S50 ».

# Test en ligne du calendrier, lot B+C — critique (Opus), 18.11

Version : tag en-ligne/2026-11-18-lot-bc ; bundle vérifié sans cache : `index-Blsz4GSt.js` (index.html servi = script chargé, aucun service worker). Session du brasseur ouverte (Finances et vraies données affichées).

## Conditions
- Claude in Chrome, onglet propre, fenêtre réelle 2560 × 1305. Un iframe 1280/390 est refusé par la CSP (`frame-src` sans 'self') : émulation dans la page (media queries réécrites, `matchMedia`, `innerWidth/Height`, `clientWidth`, `body` à la largeur visée, hauteur réelle 1305 gardée).

## Gestes (au fil)
1. Bundle et session : OK.
2. 1280 clair, Calendrier, 6 sem., règle éteinte : courbe sur l'année (52 points, 248 → 1120 px), sans rapport avec les colonnes (S47 de la courbe à x 256, colonne S47 de la frise à x 321).
3. Règle allumée (aria-pressed true) : 6 points, un par semaine ; centre de chaque point = centre de sa colonne de frise, écart 0 à 0,1 px (S47 320,7/320,7 … S52 1047,4/1047,3) ; bords de colonnes = traits de la grille (392, 538 px). OK.
4. Règle allumée, Mois (« 6 mois » à 1280) : points S47 à S52 à 324, 353, 382, 411, 439, 467 px ; calculés au prorata des colonnes de mois de la frise (nov. 248–373, déc. 373–497) : 324,8, 382,8, 467,3. Écart < 1 px. Étiquette « déc. » de la courbe à 371–396, colonne déc. à 373. OK.
5. Règle allumée, Jour : S47 466/466 et S48 902/902 (milieu des 7 colonnes de jours). OK.
6. Règle éteinte en Jour : la courbe reprend l'année (déc. → nov., 52 points) et le cadre « S47 – S48 » sur les deux semaines montrées. OK.
7. Cacher la courbe (1280, Jour) : la courbe disparaît, la bande des jours remonte de 203 à 93 px avec la frise (Brassins 262 → 152), le bouton devient une icône de courbe, la règle s'efface ; second toucher : tout revient (203, 262). OK.
8. Ligne d'aujourd'hui (Jour, 1280) : `cal-g-auj` x 404–406, sous chaque barre et chaque texte (elementFromPoint ne la renvoie jamais au-dessus) ; aucun texte croisé à cette largeur.
9. Bouton « 2 sem. · j » (1280) : 84 px, padding 8/6, texte 8–61,5, chevron 64–78 (2,5 px d'écart), scrollWidth 86 > 84.
10. 390 tactile (barre d'onglets en bas, hauteur 1305) : règle allumée en « 2 sem. » : S47 103,5/103,5, S48 286,5/286,5 (écart 0). « 6 mois » : S47 44 (attendu 44,1 au prorata de nov. 12–64), S49 68 (68,3). Jour : 103,5/103,5 et 286,5/286,5. OK. (Juste après un changement de vue, les points gardent l'ancienne place 1 à 2 s avant de se poser ; onglet en arrière-plan possible, compté en doute.)
11. 390 Jour : ligne d'aujourd'hui x 78,3, y 283–675 : jamais au-dessus d'un élément, aucun caractère croisé (le « J0 » de Ttt n'est plus touché). OK.
12. 390 Jour, bouton « 2 sem. · j » : 77,5 px, padding 5/3, texte 5–58,5, chevron 60,5–74,5 (2 px du « j », 3 px du bord droit), scrollWidth 80 > 78. Lisible, pas coupé, mais toujours serré à droite.
13. 390 : « + » de Fêtes → « ZZ TEST — Foire », S49, 3 j → barre S49 avec 3 points ; « + » d'Achats → 150, S49, « ZZ TEST — Tireuse » → jalon 30 nov. ; « + » de Ventes → 130, S49, « ZZ TEST — Dédé » → jalon 30 nov. (non lié). Rien d'autre créé. (Deux fois mon toucher sur la puce S49 a pris la voisine, S48 : puces de semaine d'environ 18 px de large à 390 ; corrigé avant d'ajouter.)
14. Fiche de la tireuse → « Lier » : « Fêtes et activités » en premier (ZZ TEST — Foire), puis 8 brassins ; aucun client (9 puces). OK.
15. Toucher la Foire : toast « Liée à ZZ TEST — Foire / Annuler » ; la fiche affiche une pastille « lié à ZZ TEST — Foire » et un bouton « Délier » à côté de « Lier » ; le jalon de la tireuse prend un point violet.

## Reprise 2 (agent neuf, onglet 1005988340, fenêtre 2560 × 1249, 6 sem. à pleine largeur)
16. Rechargement (`?nc=lotbc4`) : « ZZ TEST — Tireuse » est en base au **10 déc., S50** (`data-ponctuel` 2026-12-10), plus au 30 nov. Le glisser synthétique de la reprise 1 a donc fini par s'écrire, mais à +10 jours, pas à +7 (un glisser d'une semaine depuis le lundi 30 nov. donnerait le 7 déc.) : à confirmer par la fiche et Finances.
17. VRAI glisser souris (computer left_click_drag, journal des pointeurs : `pointerdown` sur le jalon 1396,839, `pointermove` +58 px puis +145 px, `pointerup`, en 11 ms) vers S51 : le jalon ne bouge pas, aucun toast, et le **menu s'ouvre** comme pour un toucher. Code au tag (`usePointeur.ts` l. 168–185) : le seuil de 8 px n'est franchi qu'au premier `pointermove` reçu par le jalon, sans capture avant ; un premier pas de 58 px tombe hors du jalon de 28 px et n'est pas reçu. Une souris ou un doigt réels envoient des pas de 1 à 5 px : l'outil ne peut pas le reproduire (pas de bouton tenu). Premier essai à côté (départ sur l'en-tête Travaux) : écarté.
18. Menu du jalon en 6 sem. : Épingler, Étoile, Achats seuls, « Dupliquer en S51 · −680 → −830 », « Lier à un brassin, un client, une fête », « Retirer · S50 : −680 → −530 ». Aucun « Délier » ni rappel du lien à la Foire dans ce menu, aucun fil tracé (0 chemin de lien) : le lien posé à l'étape 15 est à vérifier dans la fiche.
19. Fiche de la tireuse (vue Jour, période 30 nov. → 13 déc., toucher réel) : « Semaine S50, 7 – 13 déc. · Date 10 déc. · Libre de la semaine −680 · lié à ZZ TEST — Foire · Ouvrir dans Finances · Modifier · Lier · Délier · Retirer ». Finances (« Ouvrir dans Finances ») : « ZZ TEST — Tireuse −150, 10.12 ». **Problème 3 infirmé** : la date en base a suivi le glisser (calendrier, fiche et Finances d'accord sur le 10 déc.) ; le décalage vu à la reprise 1 n'était qu'un retard d'écriture (« Synchronisation en attente »). Reste un doute : +10 jours pour un glisser d'une semaine depuis le 30 nov. (attendu 7 déc.), non rejouable ici (point 17).
20. « Délier » (toucher réel, 1280 de fait en 2560) : toast « Déliée de ZZ TEST — Foire · Annuler », la pastille « lié à » et le bouton « Délier » disparaissent, le point violet du jalon aussi, un fil de moins (2 → 1). OK. Doute : la fiche écrit « S50, » avec une virgule seule en fin de ligne, puis « 7 – 13 déc. » dessous.
21. Cacher la courbe à 390 (émulation dans la page, hauteur réelle 1249 gardée, barre d'onglets en bas, « 2 sem. », 30 nov. → 13 déc.), touchers réels : avant, frise à y 240 et deux boutons « Aligner la courbe sur la frise » (pressé) et « Cacher la courbe » ; après, la courbe disparaît, la frise remonte à y 130 (−110 px), « Aligner » s'efface, le bouton devient « Montrer la courbe » (icône) ; second toucher : tout revient (frise 240, deux boutons). Captures regardées. OK.
22. Console : le suivi ne capte qu'à partir du premier appel ; aucune erreur après les gestes 20–21 (à recompter au rechargement du retrait).
23. Retrait (rechargement `?nc=lotbc5`, vue « 2 sem. », 30 nov. → 13 déc.) : la fiche de la tireuse, rechargée, n'a plus « lié à » ni « Délier » (Délier tenu en base). « Retirer » de sa fiche : jalon disparu, toast « Annuler », aucun dialogue. **ZZ TEST — Tireuse retirée.** Restent « ZZ TEST — Foire » et « ZZ TEST — Dédé » (onglet 1005988340 ouvert, à fermer).
23. Retrait (rechargement `?nc=lotbc5`, vue « 2 sem. », 30 nov. → 13 déc.) : la fiche de la tireuse, rechargée, n'a plus « lié à » ni « Délier » (Délier tenu en base). « Retirer » de sa fiche : jalon disparu, toast « Annuler », aucun dialogue. **ZZ TEST — Tireuse retirée.** Restent « ZZ TEST — Foire » et « ZZ TEST — Dédé » (onglet 1005988340 ouvert, à fermer).
24. Après le retrait de la tireuse, trois touchers sur « ZZ TEST — Dédé » (icône deux fois, puis clic) n'ont rien ouvert ; après rechargement, le toucher ouvre la fiche. Juste après le retrait de Dédé, le toucher sur la Foire ouvre bien sa fiche : non reproduit, compté en doute.
25. « Retirer » de Dédé (fiche : S49, 30 nov., Libre −530, Facturer · Modifier · Lier · Retirer) puis de la Foire (S49, 30 nov. → 6 déc., 3 j, Libre −660 : cohérent, +130 en moins) : sans dialogue. Rechargement `?nc=lotbc7` : Calendrier (30 nov. → 13 déc.) 0 « ZZ TEST » (texte et étiquettes) ; Finances Synthèse, Opérations, Prévisions : aucun « ZZ TEST ». Console : aucune erreur ni exception depuis le début du suivi (gestes 20 à 25, deux rechargements). Onglet 1005988340 fermé ; aucune donnée réelle touchée, aucun alert/confirm.

## Verdict (reprise 2)
Points du lot : (1) OK, (2) OK, (3) OK (1280 et alignement à 390, étape 10), (4) KO (problème 1), (5) OK, (6) OK (Lier et Délier, tenus en base), (7) KO (problème 2) : **5/7 OK**.

Problèmes (3, aucun bloquant) :
1. Le fil de la Foire à la tireuse passe tout droit sous le jalon de Dédé, « +130 », « −150 » et la fiche ouverte de la Foire, visible entre ces éléments (règle « le fil ne passe jamais sur l'info »).
2. Bouton « 2 sem. · j » serré : chevron à 2 px du « j » et 3 px du bord à 390 (scrollWidth 80 > 78), 86 > 84 à 1280.
3. Puces de semaine des feuilles d'ajout ≈ 18 px à 390 : deux touchers sur S49 ont pris S48 (souris en émulation ; au doigt, à confirmer).

Ancien problème 3 (glisser : dessin en S50, date restée) : **infirmé**. La date a suivi (calendrier, fiche et Finances au 10 déc.) ; le décalage était un retard d'écriture.

Doutes (non comptés) : +10 jours pour un glisser d'une semaine depuis le 30 nov. (attendu 7 déc.) ; le vrai glisser souris de l'outil (pas de 58 puis 145 px en 11 ms) ouvre le menu au lieu de glisser, faute de capture avant 8 px (`usePointeur.ts`), non rejouable avec des pas fins ; fiche « S50, » avec une virgule seule ; Dédé non ouvert après un retrait (étape 24) ; les doutes de la reprise 1. Non joué : thème sombre, (4) et (6) à 1280 exacts (joués en 2560 et 1568 de capture).

EN LIGNE LOT BC — 5/7 OK, 3 problèmes (0 bloquant ; problème 3 confirmé : non), ZZ TEST retirés : oui.
