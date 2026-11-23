# Reprise du lot Calendrier (23.11, 2e agent) — arrêté vers 350 k

Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal`, branche `claude/lot-cal` (origin/main fusionné à 607d5b3b1).
Contrat : VOIE-LOT-CAL.md (ajouts 9:05 et 9:10 compris), dossier Brasserie de cette mission.

## Fait et prouvé en ligne
- **Point 2** : 8df950352 (code) + 049f4280e (gris par la couleur, e2e lit l'étiquette datée) → **tour 15** (index-BL9Z_g2l.js).
- **Échelle, 2e refus + grain** : f060412ea → **tour 16** (index-D_kYmaY0.js). Sa capture 2sem-0902 venait d'un ANCIEN paquet (étiquette
  en S, bulle restée, pastille « S26 '27 »). Vrais défauts trouvés et corrigés : bande qui ne suivait le cadre qu'au lâcher ; « 2 sem. » du
  menu = BandeColonnes sur toute la largeur. Bande toujours sur l'axe de la courbe en portrait, en direct (Cadre `onTire`), grain jours ≤ 3 sem.
  (un chiffre par jour ou tous les 2), semaines, mois ≥ 52. e2e renforcé (menu, pendant le geste, grain) : rouge sur 049f4280e, vert après.
- **Preuve en ligne** : `PAQUET=index-D_kYmaY0.js npx playwright test -c playwright.en-ligne.config.ts echelle-suit-cadre` : vert ; planche
  regardée `en-ligne/planche-tour16.png` (menu 2 sem., 14, 3, 1 sem., pendant le geste). Une fois sur trois runs, pendant l'animation R7 au
  bord, une image où cadre et bande différaient (cadre 12–266, bande 12–377) ; deux runs suivants cohérents ; non reproduit en local (CPU ×6).
- Outils : `e2e/en-ligne/outil.ts` (Chrome 9222, mon onglet dans sa fenêtre, 390, tactile CDP, `tap()` remplacé par un toucher CDP, jamais
  `browser.close()`), `playwright.en-ligne.config.ts`, `e2e/outils/echelle.ts` (lecture et fautes partagées fixture / en ligne).

## En cours (non commité au moment de l'arrêt, sauf si le commit ci-dessous a eu lieu)
- **CAL-AUJOURDHUI-COURBE** : `Courbe.tsx` (`repereAujourdhui`, trait à son jour, « ‹ auj. » / « auj. › » hors vue), `EnTete.tsx` (prop
  `aujourdhui`), `entete.css` ; test `e2e/calendrier/aujourdhui-courbe.spec.ts` (rouge sur f060412ea : « 2 sem. : un repère d'aujourd'hui »).
  Suite locale lancée (aujourdhui, echelle, frise, lacher) ; si verte : commit, PRÊT, puis preuve en ligne (pas encore écrite : copier le test
  dans e2e/en-ligne avec `ouvrirEnLigne`).
- **CAL-PLUS-QU-UN-AN** : mis de côté dans `an-auj-en-cours.patch` (diff complet, aujourd'hui compris) et `plus-qu-un-an.spec.ts.txt` (le
  test, rouge sur f060412ea : « la durée après le geste : An »). Contenu : `HORIZON_SEMAINES = 5*52+1` (domain/calendrier.ts, utilisé par
  useDonneesCalendrier pour semaines et courbe), plafond 52 retiré (fenetreDePeriode, geste du cadre T9-2), `libelleDuree` « 2 ans » / « 18 mois »,
  An = max(52, fenêtre), au-delà de 53 sem. la bande sur la courbe (grain « an » : les années) au lieu de BandeAnnee, moisAn non plafonné.
  **Bloquant** : avec l'horizon de 5 ans, `lacher-ou-dessine` rougit (6 et 14 sem., « P-ZZ-MOYEN » : posée au 21 déc. alors qu'écrite et
  annoncée au 27 déc. ; à 14 sem. la barre dessinée a 3 semaines d'avance) ; vert avec l'horizon à 52 (bissecté). Aligner `mois` sur
  l'horizon (useDonneesCalendrier) ne suffit pas. Piste : ce qui positionne une barre « plan » (P-ZZ-MOYEN = plan Travaux, 15 → 43 jours) selon
  la longueur du modèle (Rangee, colonnesDeLAxe, occurrences). Le test T9-2 immobile « jamais plus que l'An » protège FC-1, que la plainte
  CAL-PLUS-QU-UN-AN renverse : à changer en « jamais plus que l'horizon ».

## PRIORITÉ 1 (ajout 9:40 du contrat, non commencé par cet agent)
- Capture brasseur-23-11/40sem-0937.jpg (tour 17) : « On voit toujours pas sur le graph où est le moment présent ». Vérifier d'abord si le
  tour 17 contient a3b3dc47c (le trait d'aujourd'hui) ; sinon c'est ce commit à mettre en ligne. S'il le contient : le trait n'est pas vu →
  le rendre net (couleur de la semaine bleue du calendrier, pas `--ent-fin`, plus épais, devant l'aire).
- Le contrat dit « hors fenêtre : rien » : retirer « ‹ auj. » / « auj. › » de `Courbe.tsx` (branche `cote !== 'dans'` et `boiteAuj`) et le
  dernier bloc de `aujourdhui-courbe.spec.ts` (fenêtre poussée dans l'avenir → attendre aucun repère).
- CAL-POINT-BLEU-MUET : retirer le point bleu du creux sur la petite courbe (`.ent-creux-pt` dans Courbe.tsx ; la pastille le dit déjà) ;
  un test : aucun `.ent-cb .ent-creux-pt` à chaque échelle.
- Puis CAL-PLUS-QU-UN-AN (ci-dessous, bloquant à lever), dans le même cycle PRÊT / EN LIGNE / preuve en ligne.

## Reste du contrat
1. Point 3 (D436, CAL-SANS-LECTURE) : correctif écrit, mis de côté dans le scratchpad (perdu) — à refaire : `usePointeurCourbe` sans état
   « lit » (appui long seul), EnTete sans `lecture`/`LectureTete`/`LectureDetail`/`indexSous`/`onLectureSemaine` (personne ne la passe),
   Cadre : `onLire` retiré, doigt posé à plus de 22 px du cadre → saisie « defile » (k = −dx·span/w, vue décalée d'autant, sans
   stopPropagation pour garder l'appui long). Test prêt : `e2e/calendrier/sans-lecture.spec.ts` (non commité ; rouge sur le tour 14 :
   « −283 CHF · S47 · 16 nov. », curseur, détail).
2. Point 4 lenteur (mesure en ligne CPU ×4 : `ouvrirEnLigne({ cpu: 4 })`, trace Performance), point 5 bandeau « Enregistrement sur le serveur… ».
3. Défaut vu en ligne (tour 15/16), non traité : à 14 sem., « −1 663 » pousse « CHF à dépenser » sous le bouton ± (rogné).
4. Pendant le tirage, le bouton de durée garde l'ancienne durée (« 1 sem. » quand le cadre en montre 2) ; à juger.

## Fichiers non commités à ne pas perdre
`playwright.lotcal.config.ts` (local, preview du build 4391), `e2e/calendrier/zz-captures-lotcal.spec.ts`, `e2e/en-ligne/zz-explore.spec.ts`
(sondes, à ne pas commiter).
