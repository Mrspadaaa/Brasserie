# Reprise — voie cal-24 (21.11), arrêtée vers 180 k. Six commits faits, le reste ci-dessous.

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Scratchpad :
`C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/cal-24/`.
- `commit.mjs <message.txt> <chemin>[=<fichier>] …` : commit par index temporaire (contenu préparé possible), remet l'index réel au HEAD
  pour ces chemins. `geste-mien.mjs` : geste.mjs de HEAD + un bloc de l'arbre (d'autres voies écrivent geste.mjs : PERIODE-PARTOUT,
  `jouerPeriode`, ~97 lignes non commitées, à ne pas prendre).
- Build de l'arbre : `npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <cal-24>/build --emptyOutDir`.
  Build tour8 GARDÉ : `C:/Users/mrspa/AppData/Local/Temp/parcours-geste-build-O82816` (`--build` de geste.mjs ; le supprimer à la fin).
- ATTENTION : plusieurs voies écrivent ce worktree (CalendrierTab.tsx, ChoixPlage.tsx, navigation.css, FinancesTab…, principes.mjs =
  VUE-FOND). Ne commiter que ses chemins ; un build de l'arbre embarque leur travail en cours.

## Commits faits (tous verts sur l'arbre, rouges sur tour8)
- d9e37a5ed geste.mjs : sectionFeuille, sectionRangees, choisirPeriode.
- 1bdd349db durée : début tiré vers le passé (DureeFenetre, etirerPlage, feuille.css).
- 40fff908a date seule (Ventes, Papiers…) : un repère, passé compris (+ test calendrierFrise C15 mis à jour).
- 373582d73 CAL-VIDE : clé de la mémoire des lignes = fenêtre. geste.mjs rangées : écarts ≤ 4 px, 390/1280, clair/cave, 6 sem./3 mois/An.
- cdde8ea08 CAL-VIDES-EN-LIGNE : `.cal-vides` en colonne, « vides » commun retiré ; captures g2/*-fin.png ouvertes (390 cave, 1280 clair).
- 2681f3987 CAL-MODIFIER : `horizons = true` aussi à Modifier ; brassin rouvert = date seule ; etirerPlage garde le rang du jour ; étape
  geste.mjs `sectionModifier` (rouge tour8 : carrousel, aucune frise ; verte arbre 390 clair) ; calFeuilleJour S50 au clavier du slider « Date ».
  Reste dans FeuilleAjout : la branche carrousel (`cal-f-semaines`, `semaines`, `toucherSemaine`, effets de largeur) est morte : à retirer
  (passe de simplification), tests compris.

## CAL-VIDE : CLS NON TENU (décision à remonter)
`principes.mjs --seul calendrier` (build arbre après CAL-VIDE) : KO « Période suivante » CLS 0,069, « Période précédente » 0,057, session
0,132 (bloc 0 px, doigt 0 px). Cause : une rangée prend ses lignes réelles, donc la période suivante (autres lignes dans Brassins) déplace
les rangées du dessous. Contradiction de fond entre CAL-VIDE (hauteur réelle) et VUE-SAUTE (rien ne bouge). Options : (A) exception VUE-SAUTE
« le geste remplace son propre contenu » pour Période ± (comme D407/D408), le bloc et le doigt restant à 0 px — recommandée ; (B) mémoire
gardée pendant la navigation ± (pas de saut) mais remise à zéro au changement d'échelle : le vide revient après quelques ±, rejeté par CAL-VIDE.
principes.mjs appartient à VUE-FOND : ne pas y toucher sans le pilote.

## Reste à faire, dans l'ordre (contrat du pilote)
1. CAL-JOUR (ligne DEFAUTS, commit à part, après MODIFIER). Le glisser d'une barre avance par semaine : `src/domain/calendrierGestes.ts`
   (l. 214 « Rien ne bouge : choisis une autre semaine », `semaines` entier) et `src/ui/calendrier/frise/Barre.tsx` / `usePointeur.ts`.
   À faire : pas = jour quand un jour fait ≥ 8 px (`data-px-semaine`/7), sinon semaine ; la feuille propose le jour (`peutChoisirJour`,
   rangée des jours, déjà là pour une date seule rouverte) ; graduations : une sur deux si elles se touchent (R11) — bande des semaines du
   haut de la frise (« S43S44… » en 17 sem.). Étape : 17 sem. et 6 sem. à 390, tirer le bord de « vi » de 3 jours → +3 jours, relu après
   rechargement ; aucune graduation ne touche sa voisine. Rouge sur tour8.
2. CAL-ECHELLE-FIGEE (diagnostic de cal-23) : `entete/Fenetre.tsx` Cadre, `suit` fait `if (annee) return;` (l. 285) et `fin` en An appelle
   `onRevient` (l. 303) : l'An fige la fenêtre ; `EnTete.tsx` ~l. 181 force `nombre` à 52 en An. Correction : gestes actifs en An ; un
   `onChange` depuis l'An quitte l'An (`onVue('semaines')` + écrire) ; `echelleEffective` (echelle.ts) en mois au-delà de 26 sem. ; menu :
   « 40 sem. », rien de coché. Étape : An, étirer/réduire au doigt, durée ≠ 52, « An » non coché, puis « 3 mois » = 13.
3. CAL-FRISE-PRIX, D410 + ajout du pilote : le Cadre (`entete/Fenetre.tsx` l. 223-321, `demarrer('debut'|'fin')` à la main, listeners
   window) doit utiliser EXACTEMENT le mécanisme de Finances › Opérations (`src/ui/finance/operations/Frise.tsx`, e97e51993) :
   `useGlisse` + `roleSous(x, xa, xb)` (a/b/corps) + `poserPlage`, même réglage ; seul le dessin reste. Corps = glisser la fenêtre (R5) ;
   début = étirer seul (R6, aujourd'hui il DÉPLACE la fenêtre : l'étape geste.mjs « reculer le début » vérifie `b.n === a.n`, à réécrire
   en R6 : durée qui change, fin qui reste) ; lecture d'une semaine (c2-b) = appui long (`useAppuiLong`, 450 ms) ou toucher hors du cadre
   (EnTete décide du doigt par la géométrie). Comparer d'abord les deux au doigt à 390 (geste.mjs `--endroits calendrier` et Opérations).
   Bandeau `src/ui/PersistenceStatus.tsx` en `fixed` par-dessus (étape : écart ≤ 1 px quand il paraît). Étiquettes hors de la ligne zéro :
   `entete/Courbe.tsx` (placement des noms, éviter le y du zéro). BUGS.md (dépôt Brasserie) : aucune ligne CAL-FRISE-PRIX au 21.11 soir.
4. CAL-BARRE-BORD (ligne DEFAUTS) : barres, au bord la fenêtre grandit pendant le geste (R7), au lâcher la barre est où le doigt l'a posée
   et l'étiquette dit pareil, relu après rechargement. Étape : 2 sem. à 390, fin de « vi » au bord droit 1 s, lâcher à S7. Commit à part.
5. Fin : calendrier.mjs, geste.mjs (390 et 1280, deux thèmes), `principes.mjs --seul calendrier` ; tests Calendrier (`npx vitest run
   tests/integration/calendrier tests/integration/calFeuille tests/integration/annuelGestes tests/integration/ct4Calendrier tests/unit/calendrier
   tests/unit/ct4Calendrier tests/unit/calPasse tests/unit/bugsWorkflowsCalendrier tests/unit/geste` : après CAL-MODIFIER, seuls les fichiers
   touchés ont été rejoués (113 verts) ; la série entière est à rejouer) ; build
   `VITE_HOP_V4=on VITE_CARNET_IA=production` ; BUGS.md : lignes CAL-VIDE (CLS réservé), CAL-VIDES-EN-LIGNE, CAL-MODIFIER corrigées
   (local, non déployé) avec leurs commits ; `controle-bugs.mjs` OK.
