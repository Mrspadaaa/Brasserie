# Voie u1 — l'étape Levure : coque des quatre vues, Ma levure = l5b (mission 2026-11-09-levure-port)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- **Règle n° 1** : sa maquette choisie est reprise telle quelle, état par état et geste par geste (L03). Les maquettes :
  - `work/missions/2026-11-09-ecran-levure/p2/l5b/etat.html` et son NOTE.md : Ma levure ;
  - `p2/s7a/etat.html` pour la coque commune : l'en-tête « Levure 4/7 », le bandeau Grain · OG · IBU · EBC, le segment
    « Ma levure · Chercher · Comparer · Suggérer » et le pied « Retour · Comparer (n) · Suivant — Paliers ».
  - Ses mots, à la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11) : la plage de la levure sur sa conduite, « parfait » ;
    les paliers faciles à ajouter et à retirer ; plus d'info sur la levure (thiols, banane, girofle, esters, épicé).
- Lis : `CLAUDE.md`, `cerveau/LECONS.md`, `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md`, skill `boosters-ux`,
  `work/missions/2026-11-09-ecran-levure/inventaire/inventaire-levure.md` (l'étape actuelle, fichier : ligne), les contrats
  `src/domain/levure/contrat.ts` et `src/ui/etapeLevure/props.ts` (fixés par le pilote).

## Objectif
Le bloc `step === 'levure'` de `src/pages/BrewWizard.tsx` (vers la ligne 2942, aujourd'hui `YeastRecipeChoice`) devient la coque des
quatre vues.
- **Ma levure (l5b)** :
  - la ligne de la levure ;
  - les effets de fermentation en jauges faible · moyen · élevé là où la source le dit, sinon « non documenté · ⌕ » (toucher =
    `onChercherDonnee`, qui ouvre la recherche IA existante `YeastSheetAssistant`, à confirmer, jamais lancée seule) ;
  - les pastilles colorées selon les familles d'arômes des houblons (d1 exporte la table) ;
  - la dose en plage de sachets (`yeastPitching.ts`), FG et alcool en plage ;
  - **ta conduite** : le graphe de conduite actuel de l'app (acquis : « très UX UI », « un peu restilisé » permis), avec la
    plage de la levure en bande (l4b), un « + » sur chaque frontière entre deux paliers pour en ajouter un, et un × sur le palier
    touché pour le retirer, le dernier palier n'en ayant pas. Branche l'ajout et le retrait existants (`YeastRecipePlan.tsx` 707-709 :
    « + Avant », « + Après », « Supprimer »), sans réécrire leur logique.
- **Les trois autres vues** : rends `<Chercher/>`, `<Comparer/>` et `<Suggerer/>` de `src/ui/etapeLevure/` (voie u2), avec les
  `PropsVue`. Tant qu'u2 n'a pas livré, une coquille vide au même nom te permet de compiler. Elle est à toi jusqu'à sa livraison et
  tu la nommes dans RESULTAT.md.
- **Dose au choix (#132)** : aujourd'hui, choisir une autre levure efface la dose (`delete next.yeast.qty; delete next.yeast.unit`,
  vers la ligne 2961). Au choix, la dose se recalcule depuis `yeastPitching.ts` pour la nouvelle levure et le volume de la recette.
  Écris un test qui échoue avant ta correction (L13).
- **Rien ne se perd** : chaque fonction de l'étape actuelle (inventaire § Fonctions et § États) doit retrouver sa place dans l'une
  des quatre vues ou dans un repli de Ma levure, avec sa raison. Ta liste doit au moins couvrir :
  - le stock et la saisie libre ;
  - les offres et le produit exact ;
  - « Corriger la fiche » ;
  - la recherche IA de la fiche ;
  - l'ensemencement et le starter ;
  - les objectifs ;
  - le dossier des sources ;
  - le mode NOLO, qui garde `NoloPanel` ;
  - l'essai de conduite.
  Ne supprime aucun ancien composant : ceux qui restent servent dans des replis ; ceux qui ne servent plus restent dans le dépôt,
  et tu les listes.
- **Banc local** : `?dev-local&etape=levure` ouvre l'assistant sur l'étape Levure, avec une recette de démonstration (US-05,
  OG 1,066, 30 L, 19 °C), sur le modèle de `etape=houblons` (`src/App.tsx` vers la ligne 467). Elle reste hors du bundle de production
  (`check-no-dev-auth.mjs`).

## Contrôles
- `npx tsc --noEmit -p .`, `npx vitest run tests/integration/etapeLevure/etape* tests/integration/YeastRecipeChoice.test.tsx --maxWorkers=2`.
  Un test d'ancien composant qui ne s'applique plus est **listé** avec sa raison, jamais supprimé en silence.
- `VITE_HOP_V4=on npm run build` vert. Lance-le dans `C:/Users/mrspa/AppData/Local/Temp/deploy-bc70` seulement si le pilote te le
  demande : sinon, tsc et vitest suffisent.
- Chrome sans écran (skill `webapp-testing`, port 5656), à 390 tactile et 1280, thème clair et thème sombre (le bouton du thème de
  l'app). Captures de chaque état, côte à côte avec la maquette, toutes ouvertes (L12) :
  - Ma levure au repos ;
  - un « + » touché entre deux paliers ;
  - un × touché ;
  - la recette sans levure ;
  - « ⌕ » touché.
- `git status --short` : tes fichiers seulement.

## Possède
- `src/pages/BrewWizard.tsx`, au bloc `step === 'levure'` et à ses fonctions propres (la voie b-assistant édite le reste du fichier
  en même temps : relis-le avant chaque Edit) ;
- `src/App.tsx`, au banc `etape=levure` seulement ;
- `src/ui/etapeLevure/**`, sauf `props.ts`, `Chercher.tsx`, `Comparer.tsx`, `Suggerer.tsx` et `vues.css` ;
- `tests/integration/etapeLevure/etape*.test.tsx` ;
- `work/missions/2026-11-09-levure-port/voies/u1/**`.

Classes CSS préfixées `lv-`. Ni commit ni stash. La liste `u1/BUGS-levure.md` est à toi : traite-la selon `../REGLES-BUGS.md`.

Rends une ligne. RESULTAT.md : ce qui est porté, la liste « rien ne se perd », les captures, les écarts à la maquette et leur raison,
`LEÇON PROPOSÉE :`.
