# REPRISE-4 — Frise du temps du Calendrier (22.11, Opus)

Worktree `port-carnet`, branche claude/port-carnet-1711, partagé : commit par index temporaire (GIT_INDEX_FILE, read-tree HEAD, seulement
ces fichiers). L'index réel garde des entrées périmées (calendrier.mjs, geste.mjs, CalendrierTab.tsx) : ne pas y toucher. Règle de test :
clair seul, 390×660 et 844×340 tactiles d'abord, 1280 en simple contrôle. `geste.mjs --hauteur 660` donne le téléphone 390×660.

## Commits de cette passe
- a3d21c119 : Durée « 1 j · le S52, mar. 22 déc. » d'une chose à un jour (T9-3), message d'échelle sans « Finances aussi », sectionT9,
  8 vitest « onPeriode non appelé ».
- 8aee38054 : vitest C19 (CRITIQUE-4 n° 9). Cause : GESTE-DATE-PARTOUT (84bd8a48c, autre voie) a remplacé l'input date de PlanSheetC par
  un ChoixDate ; la date se lit sur `data-valeur` (`zoneDate`, tests/helpers/poserDate.ts). C19 : 4/4 verts.
- 55116f6e2 : CAL-AN-390. Le contrôle est borné à `[data-calendrier-entete]` (présent à An), écarte `.sr-only` et les textes cachés, et
  mesure le texte par Range (un vide de 2 px en bout d'étiquette n'est plus « rogné » : « Fruty », « Ttt » étaient de faux positifs).
  fiche.css : pastilles et actions en `flex: … auto`, gap et padding 3/4 px, `b` à 13 px. Rouge sur tour9 (fiche : « 27 oct. »,
  « courses », « Commander »), vert sur l'arbre à 6 sem., 3 mois, 6 mois et An.
- d52abb79d : sectionT9. T9-3 rouge sur tour9 (« 1 semaine jusqu'à S52, 27 déc. »), vert sur l'arbre (« 1 j le S52, 22 déc. ») ;
  T9-3 ramène la fenêtre (« 2 sem. » puis « 3 mois ») avant de chercher le Marché de Noël. CAL-AN-390 joue aussi 1 sem. ; `--hauteur`.

## Preuves (C:/tmp/rp)
- an5-t9.log : 4 KO, fiche seulement ; an5-arbre.log : PARCOURS GESTE OK.
- t9b-t9.log : T9-3 KO, T9-2 KO (période de l'app changée) ; t9b-arbre.log : T9-1, T9-3 verts.
- p660.log (arbre, 390×660, An390 avec 1 sem. et T9) : PARCOURS GESTE OK. Captures ouvertes : p660/…-an390-1sem.png, -1sem-fiche.png,
  -An-fiche.png ; an5-arbre/…-an390-An.png et -An-fiche.png (844).

## Limites
- T9-1 et la recul de T9-2 sont aussi verts sur tour9 : la plainte (barre hors cadre, recul bloqué à S47) n'est pas reproduite par le banc.
  Le seul rouge de T9-2 sur tour9 est la période de l'app changée (CAL-PERIODE-APP-FIXE).
- T9-2 sur l'arbre : 36, 44, puis 37 semaines de recul en 3,6 s tenues. Ça varie selon le rythme du banc. La borne haute est passée de 40 à 52 :
  elle sert seulement à éviter le tour d'année. Il faut juger au doigt si ce recul est trop rapide.
- À l'œil, 390×660 : (a) à An, « prévu nov. 26–nov. 27 » de la rangée Brassins passe sur deux lignes, et « 27 » reste seul ;
  (b) à 1 sem., le picto du premier « Jhhh » déborde sous sa barre, sur la ligne suivante (bord gauche, ≈ x 25).
  Le contrôle n'attrape ni (a) ni (b) : ce sont un retour à la ligne et un picto, pas un texte rogné.

## Reste dans l'ordre
1. (a) et (b) ci-dessus : corriger ; contrôle « une étiquette de rangée tient sur une ligne » rouge d'abord.
2. calendrier.mjs étape 9 (G5 : choisir « 3 mois » avant l'instantané) et le rechargement (barre S52, fête) : REPRISE-2, point 1.
3. vitest restant : calendrierMenuV12 CHN-3 (« S47 – S48 2026 » attendu sans année : étiquette du cadre) ; calendrierLotA (`--cave-100` clair).
4. Épreuve au doigt complète (clair, 390×660 et 844×340 en profondeur, 1280 simple) → Brasserie work/missions/2026-11-22-frise-epreuve/EPREUVE.md.
5. Bancs complets en arrière-plan : `calendrier.mjs` et `geste.mjs --endroits calendrier`. BUGS.md (Brasserie) : T9-1..3,
   CAL-FRISE-ETIQUETTES, CAL-AN-390. Puis controle-bugs.

LEÇON PROPOSÉE : un contrôle « texte rogné » doit écarter `.sr-only`, borner sa zone à l'élément nommé et mesurer le texte (Range), pas
`scrollWidth` d'un ancêtre ; sinon il est rouge partout et ne distingue plus la version rejetée.
