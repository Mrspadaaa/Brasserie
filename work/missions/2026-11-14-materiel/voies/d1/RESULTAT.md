OK — domaine du matériel za3 (statuts, fil à l'échelle, gestes, dépenses, étalonnage), 55 tests verts, commité dcf13429

## Fichiers (worktree `C:/Users/mrspa/AppData/Local/Temp/materiel-port`, branche claude/materiel-port, commit dcf13429)
- `src/domain/equipment/{dates,calibration,schedule,actions,expenses,index}.ts` ; API documentée en tête de `index.ts`.
- `src/types/index.ts` : `EquipmentItem` étendu (task, rhythm, lastDone, brokenSince, brokenNote, history, calibration, retired) + types `EquipmentRhythm`, `EquipmentEvent(Kind)`, `EquipmentReading`, `EquipmentCalibration`.
- `tests/unit/equipmentSchedule.test.ts` (55 tests) ; `voies/d1/tests.txt`.

## Critères
- G1 : `TESTS OK 55`. G2 : `COMMIT OK`. `npx tsc --noEmit -p .` : aucune sortie (vert).
- Rouge d'abord : test lancé avant le module (« Failed to load url ../../src/domain/equipment »), puis vert au premier essai de code. 1 essai utilisé par critère.
- Méthode (L29) : `date-fns` absent de package.json → jours entiers UTC à midi, validation par `isoDate` de la finance ; pas de bibliothèque neuve.

## API pour d2 (10 lignes ; détail en tête de `index.ts`)
1. `ctx = { today: ISO, batches }`. `dateCourte(iso)` → « JJ.MM ».
2. `equipmentStatus(item, ctx)` → `{ kind: panne|du|jamais|avenir|sans, dueDate?, since?, brewsSince?, brewsTarget?, verb, line, retired? }` ; `line` = sous-ligne za3 mot pour mot (avenir : le verbe seul, la date va à droite).
3. `aTraiter(items, ctx)` → `[{item, status}]` (panne, dû par date, dû au brassin, jamais étalonné) ; le compteur = `.length`.
4. `filDuTemps(items, ctx)` → `haut`, `aujourdhui`, `avenir[{offsetDays, y, yLigne, apresCoupure}]`, `reperes[{label,date,y,tick}]`, `bande {days:30,y}`, `coupure {afterDays:50,fromY,toY}|null`, `sansEcheance`.
5. `y = 3,5 × j − 14` (identique à la maquette : 45,5 / 112 / 140) ; au-delà de 50 j, `y = 200` puis +28 px par ligne ; `yLigne` écarte les lignes d'au moins 28 px.
6. Gestes purs : `recordDone(item,{date,readings?})`, `markBroken(item,{date,note?})`, `markRepaired(item,{date})`, `retire(item,{date,reason})` ; nouvel item, historique journalisé, aucune clé `undefined` (Firestore).
7. `stateFor(item, ctx)` : valeur de `state` à écrire (panne → À réparer, dû → À entretenir).
8. `nextDueAfter(item, date)` → ISO|null (« à jour jusqu'au 14.12 ») ; `brewsUsedIn(item, batches)`.
9. `relatedExpenses(item, transactions)` → `{lines[{date|null,label,amountCents|null,kind,txId?}], totalCents, known, count}` ; `parcValue(items)` → `{totalCents, known}`.
10. `calibrationPreset(item)` → `{points,tolerance,unit?}|null` ; `readingOk(point, read, tolerance)` ; `readingDelta`.

## Choix et limites (à relire)
- Brassin pas encore dû : pas de date, donc rangé dans `sansEcheance` avec la ligne « détartrer · encore 2 brassins » (la maquette n'a pas ce cas ; la formule « encore N » est de moi, à confirmer ou à retirer).
- Un brassin compte s'il est brassé strictement après `lastDone` (le jour même = avant l'entretien) ; sans entretien, depuis le jour d'achat compris ; sans aucune date, tous les brassins faits.
- `jamais` : appareil avec étalonnage (le sien ou le préréglage de son nom : pH-mètre, densimètre, réfractomètre) sans événement d'étalonnage ni `lastDone`. Les anciennes données du densimètre y entrent donc sans migration.
- Rythme sans date de départ (ni entretien, ni achat) : « sans échéance », rien d'inventé.
- Prix : seuls les prix > 0 sont « connus » (0 saisi par défaut = inconnu) ; montants des lignes de facture pris tels quels (`amountCents`, pas de distinction HT/TTC ajoutée) ; avoirs et recettes ignorés ; factures annulées ignorées.
- Achat saisi sur la fiche : ajouté comme ligne « Achat » (prix et date possiblement inconnus) sauf si une facture porte déjà une ligne « équipement » de l'appareil.
- Coupure : fixée à 50 j (commentaire de la maquette) ; l'espacement 39 px et 28 px est tiré de za3 (cuve à 200) et d'une hauteur de ligne estimée, à ajuster avec la mise en page de d2a.
- Rien n'est écrit sur les données réelles ; aucune UI ; aucun Gemini.

## DEMANDE EXECUTANT : aucune
DÉCISION À PRENDRE : « encore N brassins » pour l'appareil au brassin pas encore dû, rangé dans « sans échéance » : à garder (recommandé, honnête) ou à afficher autrement ? Pilote.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
