# Voie d2b — fiche za3 (détail d'un appareil), étalonnage, dépenses, Gestion

- Mission : 2026-11-14-materiel
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours
- Dépend de : d1
- Décideur en cas de doute : pilote

## Objectif
Porter 1:1 la fiche de za3 (son choix, règle n° 1) : `EquipmentDetail` (feuille à 390, panneau à 1280 avec le fil de l'appareil),
étalonnage (étapes, saisie des valeurs lues, écarts contre la tolérance), historique, rythme, état, dépenses reliées, Payer un
entretien, Gestion (modifier, vendu, réformé, supprimer). W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port`.
M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- `M/PORT.md` (inventaire points 6 et 9 ; modèle ; interface fixée de `EquipmentDetail`).
- Maquette : `M/v2/za3/etat.html` (état `geste`, et `&l=1280`), captures `M/v2/za3/za3-geste-390.png`, `za3-repos-1280.png` ; NOTE.md.
- Domaine : `W/src/domain/equipment/index.ts` (API de d1), `M/voies/d1/RESULTAT.md`.
- App : `W/src/ui/EquipmentSheet.tsx` (acquis : TE-46 réf. auto cachée, TE-47 prix négatif refusé, BR-94 dates, suppression
  confirmée et journalisée), `W/src/ui/Sheet.tsx`, `W/src/ui/finance/ExpenseSheet.tsx` (ouvrir une Dépense avec une ligne
  « maintenance » reliée : chercher la prop existante, sinon l'intent et le choix du matériel par l'utilisateur), `W/src/ui/NumberInput.tsx`, jetons.

## Possède
- `W/src/ui/EquipmentSheet.tsx`, `W/src/ui/equipment/Detail*.tsx`, `W/src/ui/equipment/detail.css`, tests de la fiche
  (`W/tests/unit/rejeu-649b/te47-prix-message-visible.test.tsx`, `W/tests/unit/rejeu-ff0f/te47-prix-materiel.test.tsx` à adapter,
  un neuf `W/tests/integration/equipmentDetail.test.tsx`), `M/voies/d2b/`. Ne touche pas StocksTab ni la liste (voie d2a, en parallèle).

## Consignes
- Crée d'abord `src/ui/equipment/Detail.tsx` avec l'interface fixée (même minimale) et commite-le : d2a l'importe.
- Port 1:1 : mêmes mots, ordre, tailles ; jetons de l'app. Valeurs lues : saisie décimale (virgule acceptée), jamais
  `type="number"` ; écart et ✓ / ✗ contre la tolérance (`readingOk`). « ✓ Étalonné » enregistre (`recordDone` avec lectures), toast
  par `onChange(item, toast)`. Appareil sans étalonnage : « ✓ Fait » ; en panne : « Réparée ». Modifier nom, catégorie, notes, achat
  (date, prix) reste possible (⋯ › Modifier), avec les acquis TE-46, TE-47 et BR-94.
- Dépenses reliées : `relatedExpenses` sur les transactions (hook ou service existant des transactions ; cherche). « Payer un
  entretien » : `onPayMaintenance(item)`.
- Tests : adapter les tests te47 sans perdre leur intention ; un test d'intégration (saisie 7,01 → « +0,01 ✓ » ; Étalonné → lastDone
  et historique).
- `npx tsc --noEmit` vert, `npx vitest run <tes fichiers> --reporter=dot > M/voies/d2b/tests.txt`, `npm run build` vert. Commit dans W
  par chemins, fin « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».
- Banc visuel : après le câblage de d2a (`git -C W log`), dans W `PORT=3447 npx vite --port 3447 --strictPort` en arrière-plan,
  `?dev-local`, fixtures comme d2a ; captures 390 (fiche du pH-mètre, fiche de la pompe, Gestion ouvert, cave) et 1280 dans
  `M/voies/d2b/captures/`, côte à côte avec za3, ouvertes (L12). Arrête le serveur.

## Exigences transversales (L05)
Règle n° 1 ; hors ligne et données préservés ; aucune donnée réelle ; aucun Gemini ; texte ≥ 12 px ; cibles 44 px ; l'inconnu
jamais 0 ; deux thèmes ; Fable interdit. Contexte : arrête-toi avant 200 k (RESULTAT.md à jour, « REPRISE : »).

## Critères
`GATES.md` du même dossier ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- Tests : `--reporter=dot > M/voies/d2b/tests.txt`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale : une ligne.
