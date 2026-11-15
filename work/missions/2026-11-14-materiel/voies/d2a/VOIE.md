# Voie d2a — liste za3 (le fil), ajout, vide, câblage et 1280

- Mission : 2026-11-14-materiel
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours
- Dépend de : d1
- Décideur en cas de doute : pilote

## Objectif
Porter 1:1 la liste de za3 (son choix, règle n° 1) dans Stocks › Matériel : barre, fil du temps, sans échéance, pied, gestes de
ligne avec toast et Annuler, Nouveau matériel, inventaire vide, câblage dans StocksTab et mise en page 1280 (liste | détail).
W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port`. M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- `M/PORT.md` (inventaire points 1 à 5 et 7 à 10 ; modèle ; voies et interface de `EquipmentDetail`).
- Maquette : `M/v2/za3/etat.html`, captures `M/v2/za3/za3-{repos,traiter,ajout,vide,repos-cave}-390.png`, `za3-repos-1280.png` ; NOTE.md.
- Domaine : `W/src/domain/equipment/index.ts` (API de d1, en tête du fichier), `M/voies/d1/RESULTAT.md`.
- App : `W/src/components/tabs/StocksTab.tsx` (bloc `subTab === 'materiel'`), `W/src/ui/EquipmentList.tsx`, `W/src/ui/Sheet.tsx`,
  jetons `W/src/theme/themes.css`, `DESIGN.md` (dimensions compactes), `.claude/rules/affinee-frontend.md`.

## Possède
- `W/src/ui/EquipmentList.tsx`, `W/src/ui/equipment/List*.tsx`, `W/src/ui/equipment/NewEquipment*.tsx`, `W/src/ui/equipment/list.css`,
  `W/src/ui/equipment-compact.css`, `W/src/components/tabs/StocksTab.tsx` (bloc matériel seul),
  `W/tests/integration/compactEquipment.test.tsx`, `W/tests/integration/defautsStocksEcrans.test.tsx` (parties matériel),
  un test neuf `W/tests/integration/equipmentTimeline.test.tsx`, `M/voies/d2a/`.
  Ne touche pas `EquipmentSheet.tsx` ni `src/ui/equipment/Detail*` (voie d2b, en parallèle).

## Consignes
- Skills `boosters-ux` et `senior-frontend` (lecture courte). Port 1:1 : mêmes mots, même ordre, mêmes tailles (mesure les px dans
  etat.html), jetons de l'app au lieu des couleurs en dur. « Actions du matériel » disparaît (za3 ne l'a pas : Achat dans la barre,
  Déjà possédé et Projets en pied).
- Gestes de ligne : Fait et Réparée appliquent `recordDone` / `markRepaired` puis `StorageService.updateEquipment`, toast avec Annuler
  (réécrit l'item d'avant). Étalonner ouvre le détail sur l'appareil. Détail : à 390, `EquipmentSheet` (d2b) ; à ≥ 1024 px, panneau
  à droite (`EquipmentDetail layout="pane"`), premier appareil à traiter choisi par défaut. `src/ui/equipment/Detail.tsx` est créé
  en premier par d2b ; s'il manque encore, attends son commit (`git -C W log --oneline -3`).
- Nouveau matériel : feuille za3 « ajout » ; « Enregistrer un achat » ouvre la Dépense existante (intent equipment) ; « Projets
  d'équipement » appelle `onOpenEquipmentProjects` ; Ajouter crée l'item (ref `nextUniqueRef('EQ', …)`, `rhythm`, `lastDone`).
- Saisie : jamais `type="number"` ; dates suisses ; cibles 44 px pour les gestes.
- Tests : mettre à jour les tests existants qui lisaient l'ancienne liste sans perdre leur intention (TE-46 réf. automatique cachée,
  panne d'abord) ; un test d'intégration du fil (ordre, sous-lignes, « À traiter 4 » avec le densimètre, Annuler).
- `npx tsc --noEmit` vert, `npx vitest run <tes fichiers> --reporter=dot > M/voies/d2a/tests.txt`, `npm run build` vert.
  Commit dans W par chemins, fin « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».
- Banc visuel : dans W, `PORT=3437 npx vite --port 3437 --strictPort` en arrière-plan, `http://localhost:3437/?dev-local`, fixtures
  comme `M/voies/a0-banc/VOIE.md` (douze appareils et le moulin) avec les champs neufs remplis pour coller à za3 (pH-mètre rythme mois,
  lastDone 2026-10-11 et historique ; refroidisseur rythme 5 brassins ; pompe brokenSince 2026-11-05 ; densimètre étalonnage sans
  historique ; déshumidificateur, frigo, réfractomètre, cuve d'ébullition avec rythme et lastDone donnant 01.12, 20.12, 28.12, 02.03).
  Note : la date du jour du banc est la vraie ; les dates des fixtures se calent sur elle si besoin, dis-le. Captures 390 tactile
  (repos, traiter, ajout, vide, cave) et 1280 dans `M/voies/d2a/captures/`, côte à côte avec za3, ouvertes (L12). Arrête le serveur.

## Exigences transversales (L05)
Règle n° 1 (sa maquette telle quelle, rien de plus) ; hors ligne et données préservés ; aucune donnée réelle ; aucun Gemini ;
texte ≥ 12 px ; l'inconnu jamais 0 ; total « N prix connus » ; deux thèmes ; Fable interdit. Contexte : arrête-toi avant 200 k
(RESULTAT.md à jour, « REPRISE : »).

## Critères
`GATES.md` du même dossier ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- Tests : `--reporter=dot > M/voies/d2a/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale : une ligne.
