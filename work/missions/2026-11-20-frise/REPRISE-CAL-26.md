# Reprise — voie cal-26 (21.11), arrêtée à 150 k (hook). Suite de REPRISE-CAL-25.md (diagnostic CAL-JOUR) et REPRISE-CAL-24.md (outillage).

Contrat (pilote, réécrit) : CAL-JOUR et CAL-BARRE-BORD, plus CH-gestes-4, 5 et 6 (dépôt Brasserie,
`work/missions/2026-11-21-chasse-calendrier/CHASSE-gestes.md`). Chaque défaut : une étape geste.mjs, rouge sur le build tour8
(`C:/Users/mrspa/AppData/Local/Temp/parcours-geste-build-O82816`), verte sur l'arbre. Ne pas toucher : courbe et frise prix, principes.mjs
(lecture seule), travail non commité de VUE-FOND. Commit par chemins, index temporaire (`<scratchpad>/cal-24/commit.mjs`).

## Fait (NON commité, seul auteur de ce fichier dans l'arbre)
- `src/domain/calendrierGestes.ts` : `allonger` au jour (`au = decale(base, jours)`, `du = fenetre?.du ?? chose.debut`, refus « au moins un
  jour » si `au < du`, message en `jourLisible`) ; `dureeAllongee` (non-brassin) en `jourLisible`. Doc de `allonger` mise à jour.
- `npx vitest run tests/unit/calendrierGestes.test.ts` : 1 échec, « resoudre : une intention, un seul vocabulaire ; même résultat que
  l'appel direct » (48 verts). Cause non lue : probablement une attente « S47 → S50 » ou une fenêtre au dimanche dans ce test. À lire
  (`-t resoudre`, sortie complète) et mettre à jour si l'attente est l'ancien arrondi.

## Reste, conception arrêtée (à coder)
1. CAL-JOUR, glisser : `echelle.ts` `glisseAuJour(colonnes, largeurColonne) = !enMois && !aDesJours && largeurColonne / 7 >= 8`.
   `usePointeur` option `parJour` lue à l'appui (`s.parJour`) : pas = colonne/7, `recul` ×7, `plage(borne, marge)` ×7. `Barre` la reçoit
   (prop `parJour`) de `Rangee` (l. ~970 ; pas pour `Marque`, les jalons restent à la semaine) ; `decalage = drag.k * largeurColonne / 7` ;
   `BulleIci` x : `(fantome.a + drag.k / 7 + 0.5) * largeurColonne` si barre en parJour. Tab : `parJourRef` (même helper, colonnes et
   `mesure.largeurColonne`), figé au premier `surGlisse` d'un geste ; branche avant `estPonctuel` : bulle `S48 · 23 nov. · lâcher ici` depuis
   `jourDuGlisse(chose, k, ctx, true)` (ajouter un paramètre `parJour` : jours = k, `departBrassin(…, true)`), aperçu `apercuDe(chose, k, true…)`,
   lâcher `glisserDe(k)` (deplacerJours + suiviDesLies).
2. CAL-JOUR, feuille : `calendrierAjout.ts` ajouter `jourFin?` au brouillon ; `brouillonDepuisChose` pose `jour = fenetre.du`, `jourFin =
   fenetre.au` ; `peutChoisirJour` ouvert aux plages (début et fin : deux rangées des jours, « Début » et « Fin », dans `FeuilleAjout.tsx`
   l. 319) ; `fenetreDuBrouillon` : `du = jour` si sa semaine = `debut`, sinon lundi ; `au = jourFin` si sa semaine = `fin`, sinon dimanche.
   La garde de réouverture existe déjà (`versModification` l. 524 : mêmes semaines → fenêtre d'origine gardée) ; à prouver par l'étape :
   barre tirée de 3 jours, Modifier, Enregistrer sans toucher, `au` inchangé après rechargement.
3. CAL-BARRE-BORD : `usePointeur` lit le pas par la POSITION, pas par `dx` : `k = round((x - L) / w(t) - (x0 - L) / w0) - recul`, L = gauche
   de `[data-frise]` à l'appui (identique à l'actuel si la largeur ne change pas). `majDefile` aussi en mode `bord` (aujourd'hui `glisse` seul) ;
   l'effet après rendu relit aussi le bord. `defile` rend `false | number` (colonnes dont le début a reculé ; `true` = ancien sens).
   Tab `defilerFenetre` : pendant un geste, la fenêtre GRANDIT (droite : `{du, semaines + 1}`, rend 0 ; gauche : `{du − 7, semaines + 1}`,
   rend 1) jusqu'à 26 sem. et tant qu'un jour garde ≥ 8 px si le geste est `parJour` ; au-delà, défile comme avant. Vérifier que le 0 de
   colonne est bien la gauche de `[data-frise]` (sinon l'erreur vaut décalage × (1/w − 1/w0)). « 2 sem. » est peut-être un axe en jours
   (`JOUR_SEMAINES_MAX = 3`) où `defilable` est faux : à lire avant l'étape du contrat (2 sem. à 390).
4. CH-gestes-5 : Tab, ref `geste = { parJour, fenetre }` posée au premier `surGlisse`/`surBord`, remise à null par `finGeste` ; au lâcher
   annulé, `setFenetre(geste.fenetre)` si elle a changé (R10 : valeur ET échelle d'avant).
5. CH-gestes-4 : `usePointeur` `surLeBordDebut` (miroir de `surLeBord`, l. 75) et option `bordDebut` ; `onBord`/`onLacheBord` reçoivent
   `cote: 'fin' | 'debut'` ; `DragEtat.cote` ; `Barre` prop `allongementDebut` (gauche + d, largeur − d). Domaine `allongerDebut(chose, jours,
   ctx)` : fête, activité, plan manuel → `fenetre.du` décalé, `au` gardé, `date = du` (plan avec mise de côté : `date = au`, courbe par
   `courbeAvecMise`, sinon `courbeDecalee`) ; brassin planifié pas brassé → `rescheduleBatchPatch(batch, nouveau)` + `finPrevue` = fin
   actuelle (`finDeBrassin`), refus si `nouveau >= fin` ; en cuve : refus (jour réel).
6. CH-gestes-6 : `Barre` `peutBord` vrai aussi pour un brassin `finInconnue` (non fini) ; `allongerBrassin` écrit déjà `finPrevue =
   chose.fin + jours`. `calendrier.ts` l. 843 : sans fin, raison « Brassin en cuve : le jour de brassage ne bouge pas. Tire son bord droit
   pour poser sa fin. »
7. geste.mjs : une section par défaut (modèle `sectionModifier`, avant `await sectionBarre()`), commit par `geste-mien.mjs` ; build de
   l'arbre (`npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <cal-24>/build --emptyOutDir`), rouge tour8, vert
   arbre ; puis tests Calendrier entiers (liste dans REPRISE-CAL-24.md) et build. Graduations (« S43S44… ») : hors de ce contrat réécrit.
