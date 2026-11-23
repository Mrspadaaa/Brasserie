# Reprise — voie cal-23 (21.11), arrêtée à 200 k. RIEN N'EST COMMITÉ.

Worktree `port-carnet`, branche `claude/port-carnet-1711`. Scratchpad :
`C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/cal-23/`.
Build de test de tour8 GARDÉ : `C:/Users/mrspa/AppData/Local/Temp/parcours-geste-build-O82816` (à passer en `--build` à geste.mjs ; le supprimer à la fin).

## Contrat (ordre du pilote, réécrit en cours de route)
1. CAL-VIDE (priorité 1, commit à part). 2. CAL-VIDES-EN-LIGNE (commit à part). 3. Durée de la feuille : début tirable vers le passé
(capture-11, commit à part). 4. Date seule (Ventes, Papiers…) : même frise, un repère, tirable dans le passé (capture-12, commit à part).
5. CAL-ECHELLE-FIGEE. 6. CAL-FRISE-PRIX. Chaque défaut : étape rouge sur tour8, correction, étape verte sur l'arbre, vision 390, commit
par index temporaire (jamais source4…json, ni `git add -A`). Fin : calendrier.mjs, geste.mjs, `principes.mjs --seul calendrier` OK
(CLS ≤ 0,02), tests Calendrier, build `VITE_HOP_V4=on VITE_CARNET_IA=production`, BUGS.md marqué, controle-bugs.mjs OK.

## Fait (arbre, non commité)
- `scripts/parcours/geste.mjs` : sections neuves `choisirPeriode`, `sectionFeuille` (feuille activites : début tiré 2 sem. dans le passé,
  même fin ; feuille ventes : `[data-date-seule]`, date plus tôt) et `sectionRangees` (6 sem., 3 mois, An, 6 sem. : écart ≤ 24 px entre la
  dernière chose d'une rangée et l'en-tête suivant ; rangées vides l'une sous l'autre). **Rouges sur tour8** (390 clair, `--build` ci-dessus) :
  feuille activites (début reste 2026-11-16), feuille ventes (aucune frise de date), rangées 6 sem. (brassins 34, ventes 92 px), 3 mois
  (fetes 32 px), 6 sem. (« achats travaux activites papiers » côte à côte 588/588/588). Les étapes barre et frise du haut existantes : vertes sur tour8.
- Durée/date (lot 3 et 4) : `src/ui/calendrier/frise/DureeFenetre.tsx` réécrit (semaines comptées depuis 2025-01-06, R8 ; rôles a/b/corps
  par `roleSous` + `poserPlage` ; R5 défilement, R7 aux deux bords ; prop `onPlage`, prop `seule` = un repère `[data-date-point]`) ;
  `src/domain/calendrierAjout.ts` : `etirerPlage(b, debut, fin)` ; `FeuilleAjout.tsx` : `onPlage` sur la durée, et `<DureeFenetre seule>`
  pour `horizons && !fenetre && !brassin` ; `feuille.css` : `.cal-f-duree-poi` (poignée de début et repère). `tsc --noEmit` vert.
  NON vérifié dans Chrome. Brassins exclus de la date seule (à dire au pilote).
- CAL-VIDE : `Frise.tsx`, la clé de la mémoire des lignes (`cleHauteurs`) porte la fenêtre (`colonnes[0].debut>…fin`), figée pendant
  `props.drag`. Non rebâti, non mesuré.

## Reste à faire, dans l'ordre
1. CAL-VIDES-EN-LIGNE (édition interrompue) : dans `Frise.tsx` retirer la ligne `{groupe.length > 1 && <span className="cal-vides-mot" … data-vides-mot>vides</span>}`
   (et son commentaire juste au-dessus) ; dans `frise.css` : `.cal-vides { display: flex; flex-direction: column; align-items: flex-start; row-gap: 2px; }`,
   retirer `.cal-vides-n .cal-rh .cal-vide {…}` (et son commentaire) et `.cal-vides-mot {…}`. Mettre à jour
   `tests/integration/calendrierPaquetG-frise.test.tsx` l. 48-50 (le mot « vides » disparaît, chaque rangée dit « vide »).
2. Rebâtir (`vite build --config scripts/parcours/vite.parcours.config.mjs`) dans cal-23/build, rejouer geste.mjs `--build` 390 clair :
   feuille et rangées vertes ; `principes.mjs --seul calendrier` (CLS ≤ 0,02 ; si « Période suivante » dépasse, le dire). Vision 390 (captures ouvertes).
3. Commits séparés par chemins : (a) CAL-VIDE = Frise.tsx (clé) + geste.mjs (sectionRangees) ; (b) VIDES-EN-LIGNE = Frise.tsx (mot) + frise.css + test ;
   (c) Durée = DureeFenetre.tsx + feuille.css + calendrierAjout.ts + FeuilleAjout.tsx (onPlage) ; (d) date seule = FeuilleAjout (bloc seule).
   Frise.tsx et FeuilleAjout portent deux lots : `git add -p` impossible (interactif) → index temporaire avec `git apply --cached` de patchs découpés, ou un commit commun annoncé.
4. CAL-ECHELLE-FIGEE (diagnostic fait) : `Fenetre.tsx` Cadre, `suit` fait `if (annee) return;` et `fin` en An appelle `onRevient` : l'An fige
   la fenêtre ; `EnTete.tsx` l. 181 force `nombre` à 52 en An. Correction prévue : gestes actifs en An ; un `onChange` depuis l'An quitte l'An
   (`onVue('semaines')` + `ecrire`) ; `echelleEffective` (echelle.ts) passe en mois au-delà de 26 semaines (sinon 40 colonnes de 9 px) ;
   le menu dit alors « 40 sem. », rien de coché (`libelleDuree`, `actif` déjà justes). Étape : An, étirer/réduire au doigt, durée ≠ 52, menu sans « An » coché, puis « 3 mois » = 13.
5. CAL-FRISE-PRIX (diagnostic fait, sur tour8 les étapes existantes passent) : la poignée de début DÉPLACE la fenêtre (c1-d) au lieu de
   l'étirer seule (R6) et le corps du cadre lit la courbe (c2-b) au lieu de glisser (R5). DÉCISION à remonter : corps = glisser (R5) et
   lecture c2-b hors du cadre, ou garder c2-b. Bandeau `src/ui/PersistenceStatus.tsx` à poser en `fixed` par-dessus (étape : écart ≤ 1 px
   quand il paraît). Étiquettes sur la ligne zéro : `entete/Courbe.tsx` (placement des noms), à faire éviter le y du zéro.
2bis. CAL-MODIFIER (reçu après l'arrêt ; ordre : CAL-VIDE, CAL-VIDES-EN-LIGNE, CAL-MODIFIER, puis le reste) : « la modification est horrible »
   (capture-18). « Modifier » garde le carrousel S36… (`FeuilleAjout.tsx`, branche `horizons ? … : <div cal-f-semaines>` où
   `horizons = mode === 'ajouter'`). Il doit reprendre la feuille d'ajout validée : horizons, puis frise Durée (fenêtre) ou date seule, passé
   compris, aucun carrousel. Piste : `horizons = true` aussi en `modifier` (vérifier `peutChoisirJour` et `versModification`, qui lit `b.jour`) ;
   la frise DureeFenetre déjà généralisée sert telle quelle. Étape geste.mjs : ouvrir une chose, Modifier, aucun `.cal-f-semaines`, une
   `.cal-f-duree-piste` présente, tirer dans le passé, Enregistrer, la date lue au cache plus tôt. Rouge sur tour8, puis verte, commit à part.
6. BUGS.md (dépôt Brasserie, `work/missions/BUGS.md`) : aucune ligne CAL-FRISE-PRIX à la dernière lecture.
