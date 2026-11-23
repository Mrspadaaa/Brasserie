# REPRISE — CAL-FICHE-FRISE (22.11)

Défaut : DEFAUTS-RECURRENTS ligne CAL-FICHE-FRISE ; capture 30-fiche-curseur.jpg (pastille « 10 déc. +18 j » = réglette propre `Regle` de DetailChose).
Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711). Arrêt à ~156 k (consigne 130 k).

## Fait
1. Contrôle rouge écrit : `scripts/parcours/geste.mjs`, nouvelle `sectionFicheFrise` (avant le commentaire CAL-VIDE), branchée en fin de liste
   (`… sectionCuve, sectionFicheFrise })`). `node --check` OK. Elle ouvre la fiche « ZZ TEST Geste », touche la pastille début, exige
   `[data-detail] .cal-f-duree [data-date-point][role=slider]` + `.cal-f-duree[data-pas="jour"]` + `.cal-f-duree-piste[data-px-jour] ≥ 6`,
   tire 3,4 jours → +3 j exact, referme (re-toucher la pastille) → date écrite gardée, appui tenu au bord droit 1,2 s → la date avance (R7),
   à 1280 Échap rend la date (R10), fiche ≤ 120 px au repos à 390. Captures `fiche-frise`, `fiche-frise-bord`.
2. Rouge lancé en arrière-plan sur le tag : `geste.mjs <scratch>/rouge --ref en-ligne/2026-11-22-tour9 --endroits calendrier --sections sectionFicheFrise --largeurs 390,1280 --themes clair`
   journal : `C:\Users\mrspa\AppData\Local\Temp\claude\2574149e6fd34767\16fc09ec-4e69-48a9-9744-5912b6ef6552\scratchpad\rouge.log` (attendu : ECHEC « composant partagé … [data-regle] »). Le relire.

## Décisions (lecture des gestes)
- Composant partagé retenu : `DureeFenetre` en mode `seule` (frise B « une date », capture-12 choisie), pas FriseDePeriode (barres de dépenses d'Opérations).
- « au jour » : ajouter à DureeFenetre `pas?: 'semaine' | 'jour'` (défaut semaine, la feuille inchangée). Jour : unité = 1 j depuis EPOQUE (lundi),
  SPAN_MIN 42 j (≈ 8 px/j, comme CAL-JOUR), Page ±7, K_MAX = jours jusqu'au 2030-01-07 ; repères : chaque jour court, lundis et 1er du mois pleins,
  mois nommé au 1er ; root `data-pas`, classe `cal-f-duree-jour` ; piste `data-px-jour` (garder `data-px-semaine` = px × 7 / u).
  aria-valuetext seule : `jourLisible(debut), etiquetteS(lundiDe(debut))`. `import './feuille.css'` dans DureeFenetre.
- « appui long » lu comme l'appui tenu au bord (R7 : l'échelle défile, doigt immobile) — aucune règle R1–R14 n'a d'appui long ; à dire au pilote.
- Ajouter `onLacher?: () => void` à DureeFenetre, appelé dans `lacher` (useGlisse : `terminer(false)`).
- DetailChose : supprimer `Regle`, `PX_JOUR`, `BORNE_JOURS` (aucun autre lecteur, grep fait) et le CSS `.cal-fi-p-regle/.cal-fi-regle/.cal-fi-rv/.cal-fi-ru/.cal-fi-th`.
  Pastille touchée = bouton pressé (aria-expanded) qui montre `brouillon` et `+N j` ; sous elle, panneau `cal-fi-frise` (grid-area f, seulement
  ouvert : classe `cal-fi-ouverte` → areas "s a" "s b" "f f" "c c" "v v" ; ≥ 760 px "s a a" "s b c" "f f f" "v v v" ; rien au repos, ≤ 120 px gardé).
  `<DureeFenetre seule pas="jour" rangee debut={brouillon} fin={null} onFin={noop} onPlage={d => brouillon} onLacher={écrire}/>`.
  Refs (rappels useGlisse lus au début du geste) : brouillonRef, ecritRef (dernier jour écrit), reglerRef ; écrire = `regler(ecartJours(ecrit, brouillon))` si ≠ 0.
  Frise reste ouverte après le lâcher ; re-toucher la pastille = valider le brouillon clavier et fermer ; Entrée = écrire + fermer ;
  Échap (stopPropagation) = fermer sans écrire le brouillon non écrit. Focus sur `[data-date-point]` à l'ouverture (preventScroll).
  « Prête ? » (finInconnue) : base = `chose.fin || chose.debut`, comme avant.
- geste.mjs à adapter : `sectionCuve.regler` et `sectionFiche` visent `[data-detail] [data-regle]` → `[data-detail] [data-date-point]` (flèches + Entrée).
  calendrier.mjs : aucun `data-regle` (grep fait).

## Reste
1. Coder DureeFenetre (pas, onLacher) + feuille.css (jour) ; DetailChose + fiche.css ; adapter geste.mjs (2 sélecteurs).
2. `npm test -- <tests calendrier/DureeFenetre/DetailChose>` (aucun test ne lit data-regle), `npm run build`, `geste.mjs --endroits calendrier` OK, `calendrier.mjs` OK.
3. Grep réglages maison : `grep -rnE "role=\"slider\"|type=\"date\"|type=\"range\"|onPointerDown" src --include=*.tsx` hors `src/ui/geste`, DureeFenetre,
   FrisePeriode/Frise d'Opérations ; lister dans `work/missions/BUGS.md` sous CAL-FICHE-FRISE ; corriger ceux du Calendrier (hors `src/ui/calendrier/entete/*`,
   `Fenetre.tsx` : voie CAL-RETOUR-PASSE) ; `node scripts/agents/controle-bugs.mjs` OK.
4. Captures 390 tactile et 1280, clair et cave, fiche repos / frise ouverte / bord ; les ouvrir.
5. Commit par chemins, index temporaire, hunks à soi seulement (port-carnet a beaucoup de changements d'autres voies : geste.mjs non modifié par d'autres au départ).

## ÉTAT 22.11 (suite, Sonnet, arrêt vers 160 k) — code dans port-carnet, NON commité
FAIT : DureeFenetre `pas`/`onLacher` + feuille.css ; DetailChose (Regle supprimée, `cal-fi-frise`) + fiche.css ; CalendrierTab `rouvrirApres` (4 onDecaler*) ;
geste.mjs (sélecteurs `[data-date-point]`, étape « lâcher écrit ») ; BUGS.md (CAL-FICHE-FRISE, -2). tsc OK, 9 fichiers de tests verts, sectionFicheFrise VERT 390 et 1280.
RESTE : geste.mjs --endroits calendrier complet (journal scratchpad/g2.log ; un KO CAL-PERIODE-APP-FIXE vu, à attribuer) ; calendrier.mjs ; build ; commit par chemins (index temporaire) ; controle-bugs.
