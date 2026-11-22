# REPRISE — GESTE-DATE-PARTOUT (22.11), arrêt vers 150 k

Branche claude/port-carnet-1711. Commits : 27fa3a7bc (feuille du brassin + banc), b98dfdb48 (DateField, 11 écrans), 84bd8a48c (tous les champs natifs, contrôle, inventaire), puis BUGS.md.

## Fait
- `src/ui/ChoixDate.tsx` : `ChoixDate` (un jour), `ChoixInstant` (jour à la frise + heure tapée), `ChoixMois`. Une pastille, la frise partagée (`DureeFenetre seule pas="jour"`) dessous ; `onChange` au lâcher (ou Entrée), `min`/`max` bornent, Échap rend le jour d'avant.
- Feuille du brassin (PlannedDate, BatchDetailSheet) : la réglette de 8 jours et ses ‹ › sont retirés, « Était prévue le … » gardé, Enregistrer garde sa date. Banc `geste-date` (390 tactile, un thème) : départ 12.12, glisse 9 jours, « Enregistrer lu 21.12 », écrit 21.12.2026 ; capture `captures/390-brassin-glisse.png` ouverte et vue (non versée : dossier ignoré par git).
- `DateField` repose sur ChoixDate (11 écrans) ; 14 champs `type="date"` des Finances, de la Caisse, de la levure, du houblon, de la densité ; 13 `datetime-local` ; 4 `month` ; période du catalogue.
- Contrôle `scripts/agents/controle-geste-date.mjs` : ROUGE sur `en-ligne/2026-11-22-tour9` (49 occurrences hors liste, dont PlannedDate:72 et :74), VERT sur l'arbre (« GESTE-DATE OK (4 occurrences en liste blanche légitime) »).
- INVENTAIRE.md, BUGS.md (7 lignes GESTE-DATE-*), tsc vert.

## Restant, par priorité
1. TESTS ROUGES à réécrire (le défaut vient d'eux, pas de l'écran) : les tests qui font `fireEvent.change(getByLabelText('…'), { target: { value: 'AAAA-MM-JJ' } })` sur un champ de date n'ont plus de champ natif. Modèle : `tests/helpers/poserDate.ts` (`poserDate(label, iso, racine)` = clavier de la frise : Page ±7, flèches ±1, Entrée ; `zoneDate(label)` ; `data-valeur` dit la date posée). Fichiers vus en échec (liste partielle, la sortie était tronquée) : « TE-46/47/48 fiche du matériel », « BR-122 Jour réellement brassé refuse le futur », « m3im-c » (BienCuve), « daily brew budget sheet », « budget intention… Enregistrer seul », « Facture QR » (dont « 2062 refusée » : la frise ne va pas à 2062, cas à supprimer ou à porter au contrôle de `max`), « Facturer un client (la caisse) », « Comptabilité quotidienne intégrée », « Payer = m5pa-d » (3), « m3pr-c », « m4pf-c » (solde), « C17/C19/CRITIQUE… Prévoir une dépense » (PlanSheetC : la date du Calendrier doit s'ouvrir sur le lundi de la semaine touchée ; vérifier `data-valeur`), « Accessible fermentation follow-up » (BrewIngredients). Les échecs « filtres du stock », « Recompter », « stocks compacts », « CAL-FIL-SOUS-INFO », « D386 » ne sont pas de cette voie (autres agents). Commande : `npx vitest related <fichiers src touchés> --run`, comparer à HEAD~3 avant de réécrire pour séparer ce qui était déjà rouge.
2. Banc : seule l'étape `brassin-fiche` est jouée au doigt. À ajouter dans `scripts/parcours/geste-date-etapes.mjs` (une étape par écran, même modèle : entrée, frise présente, glisser, geste propre, date lue dans le cache) : Jour réellement brassé, Date de l'achat (Finances > dépense), Caisse (date de la facture), Solde, Levure (ensemencement : jour + heure), catalogue (période). 1280 : un simple contrôle, pas plus.
3. Capture de chaque écran porté, ouverte en image (L12) : seule la feuille du brassin l'a été.

## DEMANDE EXECUTANT
1. `git status --short` puis `npx vitest related $(git diff --name-only HEAD~4 -- src | tr '\n' ' ') --run --maxWorkers=4 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E "^ *(FAIL|×)|Test Files|Tests " > <os.tmpdir>/rouge-apres.txt` ; même commande sur une copie de HEAD~4 (git worktree dans os.tmpdir(), node_modules en jonction) vers `rouge-avant.txt`.
2. Sorties attendues : la liste « nouveaux rouges » = après moins avant ; chaque test de cette liste est réécrit avec `poserDate` (auteur), jamais supprimé sans raison écrite.
3. Rejouer : `node scripts/parcours/geste-date.mjs <dossier> | grep -E "ok|KO|GESTE-DATE"` → « GESTE-DATE OK » ; ouvrir `390-brassin-glisse.png`.

## DÉCISIONS À PRENDRE
- Plage de la frise (R8 : 6 janv. 2025 → fin 2029) : une pièce de 2024 se lit mais le premier geste la ramène à janv. 2025. Options : (a) prop `epoque` dans `DureeFenetre` (agent du Calendrier, non touché ici) ; (b) laisser. Recommandation : (a), avant la mise en ligne des Finances.
- Écrans choisis non portés (règle n° 1) : TodoTimeline (kd4), ChiffreACommander (pastille C), FriseArchives (m1ar-c). Leur geste de temps est à eux ; porter la frise partagée change un écran choisi : question au brasseur, en mini maquettes.
- CatalogToolbar : deux `ChoixDate` bornés l'un par l'autre ; `FrisePeriode` serait plus fidèle (une période). Recommandation : passer à `FrisePeriode` si son API accepte un filtre libre.
- La frise ne peut pas vider une date (facultatives : « Sans fin », « Pas cédé », « À poser » restent sans geste d'effacement). Recommandation : un petit « Retirer » sous la pastille quand la valeur est facultative.
- Frise à évoluer pour un cas (écrit, non fait) : bande de teintes par jour (la faisabilité du starter, m2, est devenue une ligne de texte) ; pas mensuel (les mois se tirent au jour).

CONNAISSANCE : `controle-geste-date.mjs` ne voit que les champs natifs, `showPicker`, ‹ › de jour/semaine/mois et la réglette « Jour de brassage » ; un geste de temps maison (role="slider") reste hors de sa portée : INVENTAIRE.md B.
LEÇON PROPOSÉE : un composant partagé de saisie (DateField) porte d'un coup tous ses écrans, mais les tests qui tapent dans le champ natif cassent en série : écrire d'abord l'aide de test (`poserDate`) avant de changer le composant.
