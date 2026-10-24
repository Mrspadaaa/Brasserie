OK — quatre concepts rcc de recherche par l'arôme, réactifs, CONCEPTS-BIEN-4, TRAIT OK

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-recherche/rcc1/` à `rcc4/`, chacun avec `etat.html` et `NOTE.md`.
- `work/refonte-frontend/v4/ecran-1/fils24-recherche/captures/rcc1.png` à `rcc4.png`, au premier écran, 390 × 844, densité 2.
  Pour chacune, deux autres captures :
  - `rccN-fiche.png` : la fiche ouverte à l'appui long ;
  - `rccN-apres.png` : la liste après un geste sur un critère.
- Générateurs et scripts de mesure, hors dépôt :
  `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/rcc/`
  - `extraire.ts` : le moteur, regroupé par esbuild, en tire `catalogue.json` (`describeFamilies`, `familyWords`, `motsHors`,
    `hopRole`) ;
  - `commun.mjs`, `rcc1.mjs` à `rcc4.mjs`, `capturer.mjs`, `reactif.mjs`.

## Les quatre concepts (série rcc, « l'arôme d'abord »)
- **rcc1, tiède, la roue d'abord.**
  - Ce qu'il fait : la roue des 12 familles donne, sur chaque secteur, le nombre de houblons. La famille touchée ouvre ses mots
    précis ; le centre ouvre les mots hors des 12.
  - Le cas : Tropicaux › fruit de la passion, α ≤ 12, dry hop. 21 houblons, Hallertau Blanc (30 g) en tête.
  - Une ligne signale « En stock mais hors critères : Galaxy α 17,2 · Citra cryo α 24,8 ».
- **rcc2, chaude, le mur des mots.**
  - Ce qu'il fait : tout le lexique des fiches sur un écran, par famille, avec les mots hors 12 en noir (◇). Un toucher veut
    dire « je veux », deux « sans ».
  - Le cas : on vient de Comparer. « Sentir mangue, fruit de la passion, sans dank » : 5 houblons ont tout, 35 en partie.
- **rcc3, chaude, la force du nez.**
  - Ce qu'il fait : on choisit une famille, puis une fenêtre au doigt sur l'huile totale (intervalle des fiches). Saaz, en
    pointillé, sert de repère du fade.
  - Le cas : Tropicaux, de 2,5 à 5+ mL. 14 houblons, dont Galaxy 1,8–5 (60 g). C'est la réponse à « Galaxy face à Saaz »
    (D131 ter).
- **rcc4, chaude, la grille des mots.**
  - Ce qu'il fait : la matrice de flb5b, retournée. Les mots voulus sont en lignes, les houblons en colonnes, classés par
    couverture.
  - Le cas : six mots, dont quatre hors 16D. Hallertau Blanc 6/6 et 30 g en stock, devant Nelson Sauvin 4/6.

Communs aux quatre :
- toutes les données viennent du moteur et du catalogue ; l'inconnu est « ? », jamais 0 ;
- au style 16D par défaut ;
- l'appui long ouvre la fiche (radar, α, familles « N/M », mots hors 12, goût) ;
- le « + » ajoute ;
- tout se recalcule au toucher, sans bouton « Rechercher » (D138).

## Critères (sorties décisives)
- G1 `node work/refonte-frontend/v4/ecran-1/fils24-recherche/outils/concepts.mjs rcc1 rcc2 rcc3 rcc4` → `CONCEPTS-BIEN-4`
- G2 `node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-recherche rcc1 rcc2 rcc3 rcc4 --page=etat.html`
  → 35, 37, 12 et 15 pictos, 0 faute, `TRAIT OK`.
- Baseline : `controle-commun.mjs … rcc1 rcc2 rcc3 rcc4 --page=etat.html --sans=mots` → `COMMUN OK`.
  - Passent : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant et brutes.
  - Le premier passage échouait au contraste (« — » à 2,68:1 dans rcc4) ; c'est corrigé.
- Panel : `controle-panel.mjs` sur les 4 captures → remplissage médian 0,56, aucune capture sous 0,50 ; ressemblance 0,87 ;
  0 paire presque identique ; `PANEL OK`.
- Mots, hors de la baseline exigée (`--sans=mots`, raison écrite dans chaque NOTE) : 189, 151, 150 et 135 mots au premier écran.
  Hors données : 124, 131, 100 et 92. Ce sont des listes de résultats, ou le lexique qui sert lui-même à chercher.
- Réactivité, un geste joué au doigt dans Chrome pour chaque concept (`reactif.mjs`) ; 4 listes sur 4 changent :
  - rcc1 : toucher « α ≤ 6 » ;
  - rcc2 : toucher « cassis » ;
  - rcc3 : glisser la poignée, la fenêtre passe de 14 à 90 houblons ;
  - rcc4 : retirer deux mots.
  Chaque geste prend de 87 à 250 ms, geste compris.
- `controle-choix.mjs` : sans objet. La recherche avancée est un écran neuf, sans maquette choisie au registre. Les captures ont
  été regardées à côté de la base v4.10 (étape Houblons) et de flb5b, dont elles reprennent le vocabulaire.
- `git status` : rien hors de mon périmètre (`pistes-l5f.png` était déjà là).

## Captures (ouvertes et regardées)
`work/refonte-frontend/v4/ecran-1/fils24-recherche/captures/` : rcc1.png, rcc2.png, rcc3.png, rcc4.png, plus rcc1-fiche.png,
rcc3-apres.png et les autres états.

Prédiction : il s'arrête sur rcc4 (« sa » matrice, qui lui trouve un Nelson en stock) et sur rcc3 pour Galaxy face à Saaz :
« vachement bien, mais trop de texte sur la liste ».

DÉCISION À PRENDRE : aucune pour la v0. Pour la passe 2 : faut-il exempter du plafond de mots (D41) la liste des résultats d'un
écran de recherche, comme les données ? Toute liste de résultats le dépasse aujourd'hui.

CONNAISSANCE : dans le moteur, les mots précis rangés par famille (`familyWords`) mêlent l'anglais et le français, et
contiennent des doublons (« passion fruit », « passionfruit », « fruit de la passion » ; « green tea » rangé à la fois dans
Herbacé et dans Végétal). Une recherche par mot doit normaliser le vocabulaire. La table FR et la liste des mots génériques de
`donnees.mjs` (scratchpad) forment un premier jet : 123 mots distincts sur 319 houblons. Terreux n'a aucun mot précis dans le
catalogue.

LEÇON PROPOSÉE : aucune.
