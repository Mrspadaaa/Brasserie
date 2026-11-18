OK — p3 : c4e3 8,75 · g3 8,75 · c2h3 8,25 ; aucune à 9 partout

Fichiers écrits : `p3/build.mjs` (moteur CORE, ICONS et palette lus dans `p2/c4e2/p2-build.mjs`), `p3/montage.mjs`, `p3/{c4e3,c2h3,g3}/etat.html`,
24 captures `p3/<v>/<v>-{repos,geste,activite}-{390,cave-390}.png` et `<v>-paysage-{844,cave-844}.png`, planches `p3/_planche-*.png`,
`p3/REVUES.md`, `p3/REPRISE.md`.
Sorties : `node p3/build.mjs` → `plus bas 259 S24 · sans Embouteilleuse 3 059 S24` ; `node p2/capt.mjs p3 repos,geste,activite c4e3 c2h3 g3`
→ CAPTURES OK ; `PAYSAGE=1 node p2/capt.mjs p3 paysage c4e3 c2h3 g3` → CAPTURES OK.
Non joués : `controle-panel`, `controle-commun`, captures à 1280. Planches cave de c4e3 et c2h3 non ouvertes (budget de contexte).
Notes : c4e3 9/8/9/9, g3 9/8/9/9, c2h3 8/8/9/8 (brasseur, UX/UI, parcours, navigation). Revue d'auteur, à recouper par un critique neuf.
Prédiction : « Le tableau avec la mousse et le "et si", là c'est central ; l'année en couloirs, c'est f1 en mieux. »

DEMANDE EXECUTANT :
1. Dans `p3/build.mjs`, c2h3 : mettre les boutons du titre de la miniature sur une rangée à eux en paysage ; signe « − » sur les montants à
   fenêtre du détail (`fmt(e.m)` au lieu de `fmt(-e.m)` dans `gantt`).
2. Largeur mini 16 px pour les barres d'une semaine (c4e3 `§bar`, g3 `§mag`).
3. `node p3/build.mjs` → même ligne « plus bas 259 S24 » ; puis les deux commandes de capture → CAPTURES OK.
4. Ouvrir `p3/_planche-<v>-cave.png` (refaites par `node p3/montage.mjs`) et `c2h3-paysage-cave-844.png`.

CONNAISSANCE : une barre d'action opaque au-dessus de la barre du bas, avec la marge du bas réglée sur sa hauteur, supprime tout
recouvrement du + sans perdre le + contextuel.
LEÇON PROPOSÉE : un doigt simulé posé hors de l'écran élargit la page mobile et réduit toute la capture : borner sa position à la largeur de l'écran.
