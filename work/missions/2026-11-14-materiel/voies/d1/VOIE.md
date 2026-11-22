# Voie d1 — domaine du matériel (échéances, gestes, dépenses), port de za3

- Mission : 2026-11-14-materiel
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Écrire le domaine pur qui nourrit l'écran za3 (son choix) : statut et échéance de chaque appareil, ordre du fil, « À traiter »,
gestes (fait, étalonné avec lectures, en panne, réparé, sortie), brassins depuis le dernier entretien, dépenses reliées, valeur du
parc, préréglages d'étalonnage. Aucune UI. W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port` (worktree, branche
claude/materiel-port). M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- `M/PORT.md` (inventaire, modèle, voies) — lis-le d'abord.
- La maquette pour les mots exacts des sous-lignes : `M/v2/za3/NOTE.md`, `M/v2/za3/etat.html` (cherche les textes).
- `W/src/types/index.ts` (`EquipmentItem`, `Batch.brewDate`, `Transaction.finance.lines[].equipmentRef`), `W/src/domain/finance/types.ts`,
  `W/src/domain/finance/ledger.ts` (`isoDate`), `W/src/services/purchaseEntry.ts` (lignes equipment / maintenance).

## Possède
- `W/src/domain/equipment/**`, `W/src/types/index.ts` (interface EquipmentItem et types neufs seulement),
  `W/tests/unit/equipmentSchedule.test.ts`, `M/voies/d1/`.

## Consignes
- API (noms libres mais documentés en tête de `src/domain/equipment/index.ts`, la voie d2 les lira) :
  `equipmentStatus(item, ctx)` → `{ kind: 'panne'|'du'|'jamais'|'avenir'|'sans', dueDate?, since?, brewsSince?, brewsTarget?, verb, line }`
  où `line` est la sous-ligne za3 exacte (« fuit au raccord · depuis le 05.11 », « étalonner · prévu le 11.11 », « détartrer · après 5 brassins »,
  « pas encore étalonné », « nettoyer le filtre ») ; `ctx = { today: ISO, batches }`.
  `aTraiter(items, ctx)` (panne d'abord, puis dû par date, puis jamais étalonné ; un instrument de mesure avec étalonnage et sans
  historique compte) ; `filDuTemps(items, ctx)` → haut (à traiter), aujourd'hui, avenir avec `offsetDays` et position (3,5 px/j,
  bande 30 j, coupure au-delà d'un écart à fixer et tester), repères de mois, `sansEcheance` ; `recordDone(item, { date, readings? })`,
  `markBroken(item, { date, note })`, `markRepaired(item, { date })`, `retire(item, { date, reason })` (purs, renvoient un nouvel item ;
  `state` tenu à jour pour la compatibilité) ; `nextDueAfter(item, date)` (pour « à jour jusqu'au 14.12 ») ; `brewsUsedIn(item, batches)` ;
  `relatedExpenses(item, transactions)` → lignes + total des montants connus + nombre ; `parcValue(items)` → `{ totalCents, known }` ;
  `calibrationPreset(item)` ; `readingOk(point, read, tolerance)`.
- Mois calendaires : « chaque mois » depuis le 11.10 → 11.11 ; fin de mois bornée (31.01 + 1 mois → 28/29.02). Brassin : dû quand
  `brewsSince >= every`, pas de date. Ancien champ `maintenance` texte : sous-ligne si pas de `task`, sans rythme → « sans échéance ».
  Retiré (`retired`) : hors du fil et du compte.
- Méthode standard (L29) : arithmétique de dates calendaires avec `date-fns` si présent dans `package.json`, sinon `Date` UTC
  à midi ; pas de bibliothèque neuve.
- Tests Vitest : un test par règle (les dates des fixtures de za3 au 14.11.2026 : pompe depuis 05.11 ; pH-mètre 11.10 + mois →
  11.11 dû ; refroidisseur 5/5 brassins ; densimètre jamais ; déshumidificateur 01.12 ; frigo 20.12 ; réfractomètre 28.12 ; cuve
  02.03.2027 ; après étalonnage le 14.11 → 14.12), fin de mois, coupure, total honnête, retiré, ancien texte. Rouge d'abord sur
  au moins une règle (L13), puis vert.
- `npx tsc --noEmit -p W` vert. Commit dans W par chemins (`git -C W commit -- <chemins>`), message en français, fin
  « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Exigences transversales (L05)
Données réelles jamais touchées ; aucun Gemini ; l'inconnu n'est jamais 0 ; dates suisses à l'affichage (JJ.MM) ; Fable interdit.

## Critères
`GATES.md` du même dossier ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments ; API résumée en 10 lignes pour d2.
- Tests : `npx vitest run tests/unit/equipmentSchedule.test.ts --reporter=dot > M/voies/d1/tests.txt` (depuis W).
- Voie de code sans écran : pas de capture.
Réponse finale : une ligne.
