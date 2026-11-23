REPRISE : work/missions/2026-11-21-chasse-calendrier/RESULTAT-V2.md — V2 : CHV-8, CHV-10, CHV-15 corrigés et contrôlés (rouge tour8, vert arbre) ; CHV-18 bloqué (Rangee.tsx) ; reste tsc, tests, commit, BUGS.md.

## État (agent arrêté à ~150 k, avant les 120 k demandés : contexte lourd en lectures)

Worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (HEAD bf1f6bc6b). Rien n'est commité, BUGS.md n'est pas touché.

### Fichiers écrits (les miens seulement)
- `src/ui/calendrier/frise/frise.css` (3 hunks) :
  - CHV-8 : `.cal-lbl-gauche:not(.cal-lbl-2n) { flex-direction: row-reverse; justify-content: flex-start; }` : posée à gauche, l'étiquette se lit en miroir, le NOM touche sa barre, puis montant, puis durée (« J0 / 28 · prête 28 déc.  −69 +  Ttt ▌ »). Vaut aussi pour les jalons (Marque.tsx, mêmes classes).
  - CHV-10 : `.cal-barre .cal-duree-in { box-sizing: border-box; max-width: calc(100% - 4px); … }` (le plafond ne reprenait pas les 6 px de marge que `largeurDuree` compte : « J0 / … » rogné dans une barre de 66 px).
  - CHV-15 : `.cal-point-bulle[data-place='sur-sa-barre'] { padding-block: 1px; border-radius: 8px; }`.
- `src/ui/calendrier/frise/Barre.tsx` : nouvelle `export function placerBulle(b, barre)` (sous la barre, sinon au-dessus, sinon sur sa propre barre ; jamais sur une autre barre, marque ou texte d'étiquette), appelée dans le `useLayoutEffect` de la bulle (`bullePoint`). Attribut `data-place` : dessous / dessus / sur-sa-barre.
- `scripts/parcours/chaines-v2.mjs` (nouveau, bloc distinct : le pilote le fusionne dans `chaines.mjs`) : étapes `CH-V8`, `CH-V10`, `CH-V15`, `CH-V18` ; fixture `calendrier.mjs`, 390 tactile et 1280 souris, clair et cave, échelles 6 sem., 3 mois, 6 mois, An ; `--ref`, `--build`, `--caps`, `--etape`, `--largeurs`, `--themes`.
  - Commande : `node scripts/parcours/chaines-v2.mjs <dossier> --build <build> --etape V8,V10,V15 --largeurs 390,1280 --caps` ; build : `PARCOURS_RACINE=$PWD npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <dir> --emptyOutDir`.
  - Le tag ne se checkoute pas sous un chemin long (Windows) : builds faits dans `C:/Users/mrspa/AppData/Local/Temp/t8` (copie du tag + banc) puis `…/scratchpad/build-tour8`.

### Preuves
- Tour8 (rouge) : CH-V8 6 KO (390 : « Blonde d'automne » à 52 px, « Ttt » à 174 px, « Loyer du local » à 82 px ; 3 mois : « Foire du Valais » 52 px, « Sols : colle et joints » 42 px ; 1280 aussi) ; CH-V10 : 390 6 mois, « Blonde d'automne » durée rognée « J0 / 28 » (2 thèmes) ; CH-V15 : 390 et 1280, la bulle « Brassage · 2 nov. » recouvre « Ttt »/« Hefe ».
- Arbre (vert) : `CHAINES V2 OK` pour V8, V10, V15 aux deux largeurs, deux thèmes, quatre échelles.
- Captures ouvertes et regardées (dossier `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/o-arbre/`) : `CH-V8-390-cave-6s.png`, `CH-V15-390-cave-6s.png`, `CH-V10-390-clair-6m.png`, `CH-V8-1280-clair-3m.png`, `CH-V15-1280-cave-6s.png`. Lecture : noms collés à leurs barres, « J0 / 28 » entier, bulle posée sur sa propre barre sans cacher d'autre barre. Les captures de tour8 sont dans `…/scratchpad/o-t8/`. Non encore ouvertes : V8 6 mois / An en clair, V10 en cave, et 1280 clair de V15 (le banc dit OK).
- Doute : la bulle « sur sa barre » cache le nom de la barre touchée et la moitié haute du picto touché (23 px de haut sur la barre de 28 px) ; la barre voisine reste lisible.

### CHV-18 : bloqué, DÉCISION À PRENDRE
Le côté d'une étiquette de jalon ne se décide pas dans `Marque.tsx` mais dans `Rangee.tsx` : `poser` (l. 303-309) parcourt les lignes d'abord puis les candidats, donc « gauche » sur une ligne déjà ouverte passe avant « droite » sur une ligne neuve : d'où le zigzag (« Impôt sur la bière · Fruty » à gauche en An, « Foire du Valais » à gauche en 6 mois, « Marché de Noël » et « La Cigogne, 3 fûts » à gauche en 3 mois). `Rangee.tsx` est pris par V7 puis V8.
- Option A (recommandée) : après V7/V8, faire parcourir à `poser` les candidats d'abord, les lignes ensuite, pour les marques seulement (côté constant, une ligne de plus au besoin). Elle change la hauteur des rangées : à regarder en capture.
- Option B : garder le zigzag, le rendre lisible par le seul miroir déjà posé (le nom touche toujours son picto) ; CH-V18 resterait rouge.
- Le contrôle `CH-V18` est écrit et rouge sur tour8 comme sur l'arbre : à rejouer une fois Rangee.tsx modifiée.

### Reste à faire (pilote ou reprise)
1. `npx tsc --noEmit` (ou `npm run build`) et `npm test -- tests/unit/calendrier*` : non lancés par cet agent ; `placerBulle` est nouveau (jsdom : `getBoundingClientRect` renvoie 0, la fonction rend 0 sans casser).
2. Ouvrir les captures non vues ci-dessus.
3. Commit par chemins (index temporaire, jamais `git add -A`) : `src/ui/calendrier/frise/frise.css`, `src/ui/calendrier/frise/Barre.tsx`, `scripts/parcours/chaines-v2.mjs`. Les hunks des autres voies dans `Barre.tsx`/`frise.css` : aucun au départ (git status propre sur ces deux fichiers).
4. BUGS.md : « corrigé <commit> » pour CHV-8, CHV-10, CHV-15 seulement ; CHV-18 reste ouvert (décision ci-dessus) ; puis `node scripts/agents/controle-bugs.mjs` doit répondre OK ; commiter ce seul chemin.
5. Nettoyage : `git worktree remove --force C:/Users/mrspa/AppData/Local/Temp/t8` (la copie du tag).

CONNAISSANCE : un nom posé à gauche de sa barre doit se lire en miroir (nom contre la barre) ; Windows ne checkoute pas le tag sous un chemin long (builds de tag : un dossier court de `%TEMP%`).
LEÇON PROPOSÉE : aucune
