# Voie p6b — la masse sans clavier sur chaque ligne, côté b (barre tirée)

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : concepteur
- Modèle : opus
- Niveau : interface (ce que le brasseur verra)
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : `v5/m1/b.html` (r4e-b avec le moment sans pilule, forme m1) ; contrôles `controle-masse-ligne.mjs` et `controle-moment-ligne.mjs`
- Décideur en cas de doute : pilote ; la règle est `v5/m1/b.html` telle quelle, plus ce qui est écrit ici

## Ses mots
Sur la page de la passe 5 : « Mais on peut pas modifier la quantité de chaque malt sucre de n'importe quel ingrédients en une action ??? ».
Le pilote a répondu qu'un toucher sur la masse puis le chiffre suffisaient. Lui : « c'est déjà possible, dans a comme dans b : un toucher
je pensais plutôt à un mini slider ou bouton+ /- facil » (D219). Et sur la pilule « ébullition ⌄ » de la ligne : « Pas super ui » (D218 ;
déjà corrigé dans ta base, forme m1 : mot gris et point de couleur, sans fond ni bordure).

## Objectif
Deux variantes, copiées de `v5/m1/b.html`, qui gardent tout et ajoutent sur **chaque** ligne du ticket (malts, flocons, sucres, fruits) un
moyen de changer la masse d'un geste, sans clavier, depuis le repos :
- **`v6/p6-b1/etat.html` — boutons − et +** : un toucher sur + ajoute un cran de la piste (50 g sous 1 kg, 100 g au-dessus), − en retire un ;
  la valeur reste sur la grille (`cran()` de la base). Rôles `masse-moins` et `masse-plus`, `aria-label` « Retirer 50 g de Pilsner »,
  « Ajouter 100 g de Pilsner » (le pas réel). Appui maintenu : la masse défile (facultatif ; s'il existe, il s'arrête au relâcher).
- **`v6/p6-b2/etat.html` — la barre porte la masse** : la barre de la ligne, qu'on tire déjà au doigt pour la part, devient le mini curseur
  de masse de toutes les lignes, sucres et fruits compris (pour eux, une barre de même forme, sans part du grain). Une seule chose à tirer
  par ligne, jamais deux barres. Rôle `masse-curseur` (à ajouter au rôle existant si c'est la même barre : `data-role="part-ligne
  masse-curseur"`), `role="slider"`, `aria-label` « Masse de Pilsner », `aria-valuenow` / `aria-valuetext` (« 4,5 kg »), flèches ±1 cran.
  La masse suit au cran ; le % suit la masse. Dis dans RESULTAT.md ce que représente la longueur de la barre (part du grain, masse sur une
  plage) et pourquoi.
Dans les deux : la masse tapée sur la ligne reste (acquis r4d, `kg-ligne`) ; le % du grain, le total, la teinte, l'OG et le plateau suivent
comme à la frappe ; les autres masses ne bougent jamais ; le plateau ne se déplace pas et ne s'ouvre pas ; à 0 kg, − ne descend pas plus bas.
Le plateau garde ses −/+ et son curseur fins.

## Précisions
- Le premier plan reste léger (« pas de cockpit ») : à 390 px, la ligne reste sur sa hauteur (50 px, 40 en dense), et rien ne s'ajoute au
  repos qui ne serve ce geste. Si − et + ne tiennent pas sur la ligne sans la charger, tu peux les rendre discrets (trait fin, gris), mais
  toujours visibles et touchables au repos : le contrôle joue un toucher depuis le repos.
- Cibles de 24 × 24 px au moins, sans chevauchement (contrôle) ; la masse tapée garde sa cible. Le cycle du moment de b (deux touchers et
  « Annuler ») reste.
- Les contrôles de la masse lisent `~=` ; `controle-volee.mjs` et `controle-gestes-ligne.mjs` lisent un rôle exact : ne retire ni ne
  renomme aucun rôle existant (ajouter un nom à côté est permis).
- Le moment garde la forme m1 de ta base ; ne le touche pas (les formes m2 et m3 sont montrées à part sur la page).
- `capturer.mjs` : copie `v4/r4e-b/capturer.mjs` (il sait déjà tirer la barre au doigt) et adapte-le.

## À garder (règle n° 1, acquis)
Tout `v5/m1/b.html` hors de ce geste : en-tête, fil, bandeau, pied, + flottant, plateau clair toujours visible (D212), sucre en ligne du
ticket, teinte en dégradé, OG en piste ; la part, le moment (cycle) et la couleur réglés sur la ligne (D211) ; la famille figée sur la
ligne ; la masse à zéro à l'ajout ; le parcours au clavier (Tab de réglage en réglage, Entrée, Échap rend la valeur d'avant) ; jamais
`type="number"` (`inputmode="decimal"`) ; aucun texte sous 12 px ; 80 mots au plus au premier écran, 1,05 écran au plus avec 8 grains ;
aucune phrase d'aide au repos. Plancher à enrichir (L07) ; mais rien d'ajouté au repos qui ne serve ce geste.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-fermentescibles/v5/m1/b.html` (ta base) ; `v4/r4e-b/capturer.mjs`, `v4/r4e-b/NOTE.md`.
- `work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs`, `controle-moment-ligne.mjs`.
- `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs`, `controle-gestes-ligne.mjs` (les rôles qu'ils lisent).
- `DESIGN.md` (rayons, tailles), `docs/ui-compacte.md`.

## Possède (seuls chemins où écrire, un par ligne)
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/`
- `work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/COMPRIS.md`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/RESULTAT.md`

Interdits : `v3/`, `v4/`, `v5/` (les bases restent telles quelles), `v6/p6-a*`, les contrôles (`controle-*.mjs` de la mission et de
`tournoi/outils/`), `ecrans.json`, `ecrans-app.json`, `src/`, `functions/`, `.codex/`, le manifeste. Pas de serveur dans
`C:/Users/mrspa/Documents/Brasserie`, pas de `git stash`, aucun commit. Un contrôle qui te paraît faux : ne le contourne pas, écris
`CONTRÔLE ? <ce qui cloche>` dans RESULTAT.md et arrête ce critère.

## D'abord
Écris `voies/p6b/COMPRIS.md` (parties : Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes), puis lance G1. Ensuite seulement, construis.

## Captures (dans chaque dossier, à ouvrir en image, L12)
À 390 : repos ; Pilsner + (ou barre) pendant et après ; Dextrose (`#sucre`) après ; Purée de mangue (`#fruit`) après ; à 390 avec 8 grains
(repos) ; à 1280 : repos. Un `capturer.mjs` par variante, qui imprime `CAPTURES OK`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 `OK — p6-b1 et p6-b2 : MASSE OK, VOLEE OK, GESTES OK` ou `ECHEC — …` ; par variante, le geste, sa cible en px et
ses captures ouvertes ; ce que représente la barre de b2 ; ce que tu jugerais, en brasseur, entre − / + et barre ; « D219 » et « slider »
cités ; `LEÇON PROPOSÉE : …` ou `aucune`. Une ligne au pilote.
