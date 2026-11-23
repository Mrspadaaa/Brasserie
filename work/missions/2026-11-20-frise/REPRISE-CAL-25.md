# Reprise — voie cal-25 (21.11), arrêtée à 150 k (hook). Suite de REPRISE-CAL-24.md (outillage, scratchpad, build tour8 : y lire).

## Fait
- D411 : `principes.mjs`, option `periode` (Période ± du Calendrier) : CLS hors action et hors session, bloc et doigt suivis (≤ 1 px).
  `principes.mjs --seul calendrier --controle VUE-SAUTE` sur build de l'arbre : PRINCIPES OK (Période + CLS 0,069 et − 0,057 hors mesure,
  bloc 0 px, doigt 0 px ; session 0,006). Commit da6c691ef « Parcours PRINCIPES : VUE-SAUTE ignore le CLS du changement de période (D411) ».
  ATTENTION : la voie VUE-FOND a écrit principes.mjs pendant le commit ; le commit a été refait (index temporaire) avec mon seul changement
  (15 lignes) ; leur travail (course du défilement, 3 descentes virtuoso) reste NON commité dans l'arbre, intact.
- Build de l'arbre refait : `<cal-24>/build` (embarque le travail en cours des autres voies).

## CAL-JOUR : diagnostic fait, rien codé
- Bord d'une barre : le pointeur suit déjà au jour (`usePointeur.ts` l. 308, `largeurJour` ou colonne/7). C'est le domaine qui arrondit :
  `allonger` (`src/domain/calendrierGestes.ts` ~l. 392) écrit `au = dimancheDe(decale(base, jours))` et refuse « tire jusqu'à une autre semaine »
  (l. 394, le toast des captures 23-24). À faire : `au = decale(base, jours)` ; plancher `au < chose.debut` (« au moins un jour ») ; message en
  `jourLisible` ; `dureeAllongee` (~l. 375, non-brassin) aussi au jour. Fixture : « ZZ TEST Geste » est un plan manuel à fenêtre (même branche).
- Glisser : `deplacer(chose, k semaines)` en Semaine (`CalendrierTab.tsx` `surGlisse` l. ~448, `surLacheGlisse` l. ~511) ; la vue Jour passe déjà
  par `deplacerJours`. À faire : helper `glisseAuJour(colonnes, largeurColonne)` dans `src/ui/calendrier/echelle.ts` (ni `enMois` ni `aDesJours`,
  largeurColonne/7 ≥ 8) ; `usePointeur` option `parJour` (pas = colonne/7, `recul` et bornes ×7) passée par `Rangee.tsx` l. ~972 à `Barre` ;
  `decalage` de Rangee = `drag.k * largeurColonne / 7` en ce cas ; Tab : bulle `S48 · 23 nov. · lâcher ici`, aperçu `apercuDe(chose, k, true…)`,
  lâcher `glisserDe(k)` (deplacerJours + suiviDesLies). Pour un brassin, la bulle doit partir de `departBrassin(…, true)` (ajouter une variante jours
  de `jourDuGlisse`).
- Graduations : `BandeSemaines.tsx` a déjà `pasEtiquettes` (1/2/4/mois) et `etiquettesBande` sans chevauchement SI `largeurColonne > 0` ; avec 0
  tout s'affiche (cause probable du « S43S44S45… » en 17 sem.). Non vérifié : à mesurer au banc (gaps des `.ent-sem` visibles ≥ 2 px).
- Feuille : `peutChoisirJour` (`calendrierAjout.ts` l. 271) exclut toute plage (`!b.fin`) ; la frise Durée (`DureeFenetre.tsx`) est à la semaine.
  Risque : une fenêtre posée au jour, rouverte et enregistrée, se rearrondit-elle à la semaine ? À vérifier dans l'étape.
- Étape geste.mjs à écrire (section `sectionJour`, avant `await sectionBarre()`, commit par `geste-mien.mjs`) : 6 sem. et 3 mois à 390 (17 sem.
  non atteignable par le menu ; l'étirer au cadre), tirer le bord de « ZZ TEST Geste » de 3 × largeur d'un jour → `au` + 3 jours, relu après
  `versCalendrier()` ; en 6 sem., glisser le corps de 3 jours → `du` et `au` + 3 ; gaps des graduations. Rouge sur le build tour8 attendu.

## Reste, dans l'ordre (contrat du pilote inchangé)
1. CAL-JOUR (ci-dessus). 2. CAL-ECHELLE-FIGEE. 3. CAL-FRISE-PRIX (useGlisse comme Opérations). 4. CAL-BARRE-BORD. 5. Fin : BUGS.md, build
`VITE_HOP_V4=on VITE_CARNET_IA=production`, série de tests Calendrier entière (liste dans REPRISE-CAL-24.md), supprimer le build tour8.
