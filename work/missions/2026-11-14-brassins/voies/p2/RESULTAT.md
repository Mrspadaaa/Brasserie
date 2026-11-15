OK — e7a portée : bilan refait sur les vraies données, 4 mesures, tests verts, 37 captures (3 réserves ci-dessous)

## Fichiers écrits
- `src/ui/production/CatalogAnalysis.tsx`, `src/ui/production/BatchOutcomeAnalysis.tsx` (refaits ; recharts retiré de ces deux fichiers)
- `src/ui/production/bilan/bilanModel.ts` (règles pures), `src/ui/production/bilan/bilan.css`
- `tests/unit/port-p2-bilan.test.tsx` (9 tests ; chemin donné par le pilote, Vitest ne lit que `tests/unit`)
- Voie : `INVENTAIRE.md`, `tests.txt`, `banc.mjs` (fixtures « ZZ » aux valeurs de la maquette), `journal.json`, `captures/` (37 PNG)

## Critères
- G1 : `npx tsc --noEmit` : seules les erreurs de `functions/` (firebase-admin absent, existent sur HEAD, ignorées par le pilote) ; aucune dans `src/` ni `tests/`.
- G2 : `npx vitest run port-p2 --reporter=dot` → 1 fichier, 9 tests passés, code 0 (`tests.txt`).
- G3 : `e7a-repos-app-390-clair.png` présent + `INVENTAIRE.md` écrit. Banc : « BANC OK 37 captures », 0 geste sans effet, 0 erreur de page ou console (`journal.json`).
- G4 : `git status --short src tests` : seuls des chemins de la voie (voir la liste ; fiche/, volumes/, ProductionTab, port-p1, port-p3 sont aux autres voies).
- Essais : 1 par critère (+ un détour sur le chemin des tests).

## Choix pris (données honnêtes)
- Tolérances **proposées** (le code n'en a pas) : densité ±0,002, alcool ±0,3 pt, volume ±0,5 L, dans `BILAN_TOLERANCE` (marquées proposition).
- FG : mesure finale, sinon dernier relevé du journal ; lot en fermentation « en cours » (hachuré, hors du compte) ; lot en garde « à confirmer ».
- Alcool : `entry.abv` (saisi ou tiré de OG/FG mesurées) ; lot en fermentation « provisoire », hors du compte. IBU : cible de la recette (« IBU 55 cible »), « — » si absente. Jamais 0.
- Point seul quand le lot est dans la cible (corrige k2 : « ●) »), échelle tenue (`positionSur`, testé).
- Houblons : grammes de la recette figée (planifié, pas consommé réel).

## Écarts restants (liste numérotée, captures 390 clair / cave / 1280 ouvertes à côté de la maquette)
1. Teintes de bière : toutes ambrées dans mes captures (la fixture ne donne pas de couleurs distinctes au calcul `recipeBeerColor`) : artefact de fixture, pas du code ; à vérifier sur de vraies recettes.
2. J+4 au lieu de J+5 (fixture relative), noms « ZZ … » au lieu de « NEIPA… » : fixtures.
3. Le « Compagnon hors connexion · mode local » (toast du mode `?dev-local`) recouvre le bas des captures : hors app réelle.
4. À 390, « dans la bande » passait sur deux lignes ; colonne de valeur remise à 84 px comme la maquette : **à re-capturer** (voir DEMANDE EXECUTANT).
5. Le chrome au-dessus (sous-onglets, barre « 5 brassins · Historique / Bilan », icônes) est celui de l'app, à la charge de p3 ; la maquette n'en a pas la même barre.

## ACCORD / DÉCISIONS À PRENDRE
- ACCORD : la flèche « Retour aux brassins » de la maquette n'est pas affichée : il faut `onBack={() => setView('list')}` passé par `ProductionCatalog` (hors de ma voie). Le retour se fait par l'icône liste de la barre. Idem l'interrupteur Archives : local au bilan (retire ou remet les archives présentes dans la sélection, désactivé sans archive) ; piloter le vrai filtre « dossier » demande un `onFolder` dans `ProductionCatalog`.
- ACCORD : tolérances vertes ci-dessus (proposition du brief e7a, à valider par le brasseur).
- DÉCISION À PRENDRE : « Styles et avancement » : la maquette n'a que les puces de style et « prévu · hors bilan » ; la répartition par statut (en fermentation, en garde…) est retirée. Recommandation : laisser retirée (la barre de la liste donne déjà ces comptes).

## DEMANDE EXECUTANT
1. `node scripts/with_server.mjs --server "npm run dev -- --port 3102 --strictPort" --port 3102 -- node work/missions/2026-11-14-brassins/voies/p2/banc.mjs` (attendu : `BANC OK 37 captures`, 0 geste sans effet).
2. Ouvrir `captures/e7a-geste-fg-app-390-clair.png` (« dans la bande » sur une ligne, plus de retour à la ligne), `e7a-repos-app-390-cave.png`, `e7a-archives-exclues-app-390-clair.png` (titre « 2 brassins sur 3 » ou « Les 3 brassins » selon le lot archivé), `e7a-puce-liste-app-390-clair.png`.

CONNAISSANCE : Vitest n'inclut que `tests/unit|integration|fuzz` ; l'app mémorise la vue Bilan (`catalog-batches-view`) d'une page à l'autre du banc : le banc doit tester l'état avant de cliquer.
LEÇON PROPOSÉE : aucune
- Recapture faite le 15.11 par le pilote : 37 images.
