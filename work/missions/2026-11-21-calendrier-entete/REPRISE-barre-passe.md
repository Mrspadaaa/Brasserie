# REPRISE — CAL-BARRE-INUTILE et CAL-PASSE-ECHELLE (21.11, agent arrêté à 150 k)

Objectif : un contrôle par plainte (geste.mjs), rouge sur tour8 ; corriger dans port-carnet ; captures 390/1280 deux thèmes ; BUGS.md ; controle-bugs OK ; commit par chemins (index temporaire, mes hunks seuls : V11/V13 écrivent aussi dans geste.mjs, chaines.mjs, EnTete.tsx…).

## Fait (rien d'écrit dans le code ni dans geste.mjs)

- Builds prêts (scratchpad de l'agent, `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/`) :
  `build-t8` (tag en-ligne/2026-11-21-tour8), `build-wt` (arbre port-carnet, avec les WIP V11/V13). Réutilisables par `geste.mjs --build <dossier>`.
  Copie de tag : chemin court obligatoire (`C:/Users/mrspa/AppData/Local/Temp/wt8`), sinon « Filename too long ».
- Banc d'exploration : `explore.mjs` (même dossier) `PASSE=14 node explore.mjs <build> <sortie> 390 clair` : fixture Calendrier + ouverture de caisse 14 sem. plus tôt + 5 paiements passés ; 3 mois ; toucher corps, toucher semaine, glisser de lecture, début tiré de 3 colonnes, début tiré au bord tenu 1,5 s. Captures `ex-t8/`, `ex-wt/`.

## Constats

1. Barre inutile = le CURSEUR DE LECTURE (Courbe.tsx l. 631-643, groupe `[data-curseur]`) : trait vertical `[data-curseur-trait]` (noir), colonne grise `[data-curseur-colonne]` (`.ent-cur-col`), barre horizontale `[data-curseur-marche]` (`.ent-cur-marche`, 4 px). Il RESTE après le doigt levé : `lecture` (EnTete.tsx l. 312) n'est remis à null que par un toucher hors de l'en-tête (l. 483-494) ; usePointeurCourbe passe `mode` à 'repos' au lever (l. 120-125) mais EnTete ne s'en sert pas. Reproduit sur tour8 ET sur l'arbre (`4-apres-lecture.png`). Un toucher bref (corps, semaine) ne l'ouvre pas : c'est le glisser de lecture (hors cadre) ou l'appui long du corps (Fenetre.tsx l. 269, `s.lit`) qui le laisse.
   Correction prévue : curseur dessiné seulement pendant le geste (`mode !== 'repos'` de usePointeurCourbe, ou `s.lit` du Cadre en cours) ; au repos aucun `[data-curseur]`. Décider si LectureTete/LectureDetail (chiffre « S35 · 24 août » et détail de semaine) restent après le lever (rôle lisible : oui, probablement garder).
   Contrôle prévu (geste.mjs, section Calendrier) : glisser de lecture hors cadre puis lever → `document.querySelector('[data-curseur]')` absent ; pendant le glisser → présent.
2. Échelle du passé : sur tour8, la poignée de début DÉPLACE la fenêtre (aria « déplacer la fenêtre », 3 mois gardé) : pas d'élargissement. Sur l'arbre : 3 mois → 18 sem. → 23 sem. (S34 = courbe[0]), courbe passée tracée (`ex-wt/390-clair-5a…`, `5b…`). Reste à juger : l'intérieur du cadre est teinté gris (fond `.ent-cadre`) et la part passée y paraît « grisée » ; à comparer à la part future dans le même cadre. Le contrôle devra mesurer : début tiré au passé → n augmente, fin inchangée, et les points `[data-point-semaine]` des semaines passées dans le cadre ont le même style (opacité, couleur) que les futurs, et un écart vertical lisible (pas aplati).
   Le contrôle « reculer le début » existant (geste.mjs l. 368) couvre déjà l'élargissement, mais sur la fixture sans passé court ; ajouter PASSE à la fixture de geste (`fixtureGeste`, l. 230).

## Prochaine action

Écrire les deux contrôles dans `scripts/parcours/geste.mjs` (port-carnet) ; jouer `node scripts/parcours/geste.mjs <out> --build <build-t8> --endroits calendrier --largeurs 390 --themes clair` (rouge attendu), puis sur `build-wt`. Si vert sur l'arbre : ne pas toucher au code, le dire.
