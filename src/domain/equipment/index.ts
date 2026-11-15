/**
 * Domaine du matériel (za3, port 15.11) : échéances, gestes, dépenses reliées. Pur : aucune UI, aucun stockage, aucun Gemini.
 * Lu par la voie d2 (liste d2a, fiche d2b). Dates ISO AAAA-MM-JJ en entrée ; `dateCourte(iso)` donne « JJ.MM » à l'affichage.
 * L'inconnu n'est jamais 0 : prix → `null` ; jamais étalonné → statut `jamais`.
 *
 *   ctx = { today: ISO, batches }            batches : tout objet avec `brewDate` (vide = pas encore brassé)
 *   equipmentStatus(item, ctx) → { kind: 'panne'|'du'|'jamais'|'avenir'|'sans', dueDate?, since?, brewsSince?, brewsTarget?, verb, line, retired? }
 *       `line` = sous-ligne za3 exacte (« fuit au raccord · depuis le 05.11 », « étalonner · prévu le 11.11 »,
 *       « détartrer · après 5 brassins », « pas encore étalonné », « nettoyer le filtre » pour l'avenir : la date va à droite)
 *   aTraiter(items, ctx) → [{ item, status }] panne, dû par date, dû au brassin, jamais étalonné (compteur « À traiter N » = .length)
 *   filDuTemps(items, ctx) → { haut, aujourdhui, avenir: [{ item, status, offsetDays, y, yLigne, apresCoupure }],
 *       reperes: [{ label, date, y, tick }], bande: { days: 30, y }, coupure: { afterDays: 50, fromY, toY } | null, sansEcheance }
 *       y = 3,5 × j − 14 (px, comme la maquette) ; au-delà de 50 j : y = 200 puis +28 px par ligne (coupure) ; yLigne évite les chevauchements.
 *       `sansEcheance` = sans rythme + au brassin pas encore dû (ligne « détartrer · encore 2 brassins »). Retiré : absent partout.
 *   recordDone(item, { date, readings? })  markBroken(item, { date, note? })  markRepaired(item, { date })  retire(item, { date, reason })
 *       purs, renvoient un nouvel item (l'original sert à « Annuler »), journalisent dans `history`, sans clé undefined ;
 *   stateFor(item, ctx) → valeur de `state` à écrire (panne → À réparer, dû → À entretenir)
 *   nextDueAfter(item, date) → ISO | null (« à jour jusqu'au 14.12 ») ; brewsUsedIn(item, batches) → nombre
 *   relatedExpenses(item, transactions) → { lines: [{ date|null, label, amountCents|null, kind, txId? }], totalCents, known, count }
 *   parcValue(items) → { totalCents, known }     (prix connus > 0 seulement)
 *   calibrationPreset(item) → { points, tolerance, unit? } | null     readingOk(point, read, tolerance) → boolean     readingDelta(point, read) → number | null
 */
export * from './dates';
export * from './calibration';
export * from './schedule';
export * from './actions';
export * from './expenses';
