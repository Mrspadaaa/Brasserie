# Voie v1 — mini maquettes : la vue de brassin invite à mesurer (mission 2026-11-10-brassin-mesures)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (il choisit sur la page)
- Lis : `CLAUDE.md` (règle n° 1), `cerveau/LECONS.md` (L03, L12, L24, L26), `.claude/rules/affinee-frontend.md`, `DESIGN.md`,
  `docs/brew-day-ux.md` ; la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (10.11, « Ça invite pas au mesures ») et VB-1 de
  `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ; sa capture `../../captures/brasseur-saccharification-sans-releve.jpg` (ouvre-la).
- Base, dossier Z = `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/distracted-dewdney-b8bc6e/work/missions/2026-11-10-vue-brassin/` :
  `v0/z1/etat.html` et `v0/z1/*.png` (sa maquette choisie), `port/inventaire-z1.md`, `port/captures/app-empater-390.png`,
  `app-mesure-390.png`, `jury-brassin/fiche.md` (A3 consigne / relevé, J10 premier plan). Code en ligne (lecture seule) :
  `git show en-ligne/2026-11-10-lecture2:src/ui/BrewThermalControl.tsx`, `…:src/pages/BrewDayPage.tsx` (l. 1300–1440, 1540–1590,
  `requestMeasure`, `openCapture`), `…:src/ui/BrewReadingsSummary.tsx`, `…:src/ui/BrewDayMeasurements.tsx` (mesures attendues par étape).

## Objectif
Sa vue z1 reste telle quelle (en-tête, frise, horloge, cartes, pied, feuille Mesurer). Seul change l'état « aucun relevé » d'une étape
qui attend une mesure. Plancher à enrichir (L07). Dessine 8 à 12 mini maquettes, chacune dans la grammaire exacte de z1 (pars de
`etat.html`, classes préfixées `vm-…`, L26), sur deux moments : (1) Empâtage › Saccharification en cours, 59:36, maintien 67 °C,
aucun relevé (température du palier et pH d'empâtage attendus) ; (2) un moment où une densité est attendue (avant ébullition ou
au refroidi), pour montrer que la règle tient. Axes à couvrir, chacun au moins deux fois :
- **l'invitation** : où la mesure attendue se voit au repos (le « relevé » de l'horloge devenu geste ; « Relevés du jour » présent à
  vide avec ses cases attendues ; le pied « Mesurer » marqué ; une ligne dans « À anticiper ») — nommer la mesure, sa cible, son moment ;
- **le renvoi** : un toucher ouvre la feuille Mesurer sur le bon onglet, cible en bande (comme z1) ; la raison (pourquoi mesurer
  maintenant) à un toucher, jamais en paragraphe au premier plan ; « Suivi thermique » replié ou réduit à l'utile (sa capture montre
  trois phrases inutiles) ;
- **après** : le relevé fait, l'état rejoint celui de z1 (« relevé 66,4 », carte « Relevés du jour »).
Chaque variante : repos et après le toucher (feuille ouverte), 390 tactile ; les trois meilleures selon toi aussi en cave et à 1280.
Peu de texte, inconnu ≠ 0, jamais `type="number"`, chiffres à la virgule.

## Page
Une page `../../page/index.html` : sa capture et z1 en référence en tête, puis chaque variante (nom court, une ligne sur son idée,
captures repos / toucher). `node scripts/agents/verifier-page.mjs <page> --page-lot --captures <préfixe>` → PAGE OK ; captures toutes
ouvertes. Le pilote publie.

## Possède
`work/missions/2026-11-10-brassin-mesures/voies/v1/**` et `work/missions/2026-11-10-brassin-mesures/page/**`. Rien dans `src/`.
Aucun déploiement, aucune donnée réelle, ni commit ni stash. Fichiers de travail dans ton OWNS ou `os.tmpdir()`.

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments) : variantes, axes couverts, captures, PAGE OK. Réponse finale au pilote : une ligne.
- La ligne « Tests » : aucune suite vitest ici (rien dans `src/`) ; la ligne de `verifier-page.mjs` tient lieu de preuve, écrite par
  `node scripts/agents/verifier-page.mjs … > work/missions/2026-11-10-brassin-mesures/voies/v1/tests.txt` (même format que `--reporter=dot > …`).
