# Voie gf — Greffes s4a × s6c : le graphique dans le temps, allégé, et les houblons en colonnes

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours ; 3 essais par critère · Dépend de : rs4, rs6 · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « s4a Tableau de cuverie, fiche dépliée s4a — s6c Conduite de z1, houblons en colonnes s6c — Dans
l'idéal mais s4a est beaucoup trop chargé. Mais j'aime bien le graph sur le temps ». Quatre greffes de la fiche NEIPA en fermentation :
- de **s4a**, le **graphique dans le temps** : les jours en colonnes (J+1 … J+10, dates dessous, « auj. » marqué), la courbe de densité
  jour par jour, la bande FG 1,010–1,014, et ce qui se joue sur l'axe (phases, dry hop à J+6) ;
- de **s6c**, les **houblons en colonnes** : une colonne par houblon (nom, dose en grand, α, familles en barres, « Ajouté auj. »).
- **Allégé** : tout ce qui charge s4a sort du premier écran ou se fond (à toi de le mesurer sur `s4a-repos-390-clair.png` : rangée
  °C de cuve en aplats, rangée d'icônes, colonne « auj. » à bouton, bloc alc./att. en coin, liste « Ajouts » qui double les houblons).
  Le premier écran à 390 tient en : phrase-réponse, graphique dans le temps, houblons en colonnes, un accès « mesurer ».
Plancher à enrichir (L07), pas un collage : une greffe a sa propre composition.

## Entrées
- Les deux parents (Read, chaque image une fois) : `work/missions/2026-11-14-brassins/voies/s4/s4a/` (etat.html, `s4a-repos-390-clair.png`,
  `-geste-`, `-cave`, `-1280`) et `voies/s6/s6c/` (mêmes images). Leurs NOTE.md.
- Critiques des parents : `voies/k3/VERDICT.md` § s4a et `voies/k4/VERDICT.md` § s6c (défauts à ne pas reprendre ; le dossier et le stock
  restent à un toucher, B0 de k4).
- La trousse d'identité, obligatoire : `work/missions/2026-11-14-brassins/outils/identite/LISEZMOI.md`, `identite.css`, `chrome.js`.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Obligatoire et § Les chiffres ; `DONNEES-COMMUNES.md`.
- Gabarit de rendu : `voies/s6/capture.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/gf/` : un dossier par greffe `gfa` à `gfd` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`.
  Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS, ou `os.tmpdir()` préfixés `gf-`.

## Consignes
- 4 greffes vraiment différentes : 1 froide (s4a allégé, houblons de s6c sous le graphique), 2 tièdes (ex. : houblons d'abord puis
  graphique ; dry hop porté sur l'axe du graphique, houblons attachés à leur jour), 1 chaude (le graphique dans le temps est l'écran,
  en grand, les colonnes de houblons y sont accrochées). Chacune : la fiche est une feuille de l'app (poignée, en-tête, × ; stock et
  dossier à un toucher).
- Images par greffe : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png` (geste : « Ajouté auj. » coché sur Citra, ou densité au
  curseur m2), `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. 390 × 844, `isMobile`, `hasTouch`. Ouvrir
  chaque image (Read) une fois, et la comparer à `s4a-repos-390-clair.png` : moins d'éléments au premier écran, le graphique reconnaissable.
- `NOTE.md` par greffe : chaleur, « Idée : » en une ligne (6 mots au plus pour le nom), ce qui vient de s4a, ce qui vient de s6c, ce qui
  est retiré ou replié et où il est atteint, nombre d'éléments au premier écran (contre s4a).
- Vers 150 k de contexte, finis les images en cours et rends.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Baseline : geste m2 (curseur, jamais `type="number"`), J+n depuis le levurage avec sa date, deux températures (cuve, échantillon),
  FG en bande, dry hop par nom, dose et jour fusionné au stock, premier plan actionnable, pas de cockpit ; inconnu « — » ; chiffres à la
  virgule ; cibles ≥ 44 px ; clair et cave ; 390 et 1280.
- Identité de l'app (15.11, « Ça semble pas du tout respecter l'identité global de l'app ?? ») : trousse chargée, contrôle d'identité OK.
- Honnêteté : chiffres du brief seulement ; α « — » ou sourcé comme dans les parents.

## Critères
`work/missions/2026-11-14-brassins/voies/gf/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
