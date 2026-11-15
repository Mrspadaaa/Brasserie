OK — 13 problèmes corrigés dans W (3 commits), tests, tsc et build verts ; captures à refaire par un exécutant

W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port` (branche claude/materiel-port, arbre propre). M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.
Commits : `cecb72ab` (P1 à P4, P9), `ea6dd8bd` (P5, P6, P8, P10, P11, P12), `db7e6ba0` (P7, P13, D3). Fin « Co-Authored-By: Claude Opus 5.5 ».

## P → corrigé comment
- **P1** (dépenses « aucun prix connu » à 390) : `StocksTab.tsx`, `<EquipmentSheet>` reçoit `batches`, `transactions`, `today`. Test `tests/integration/materielFicheStocks.test.tsx` (échec avant, vert après) : « 37,40 CHF · 2 prix connus », les deux lignes, « utilisé dans N brassins ». cecb72ab.
- **P2** (toast sans date ni Annuler) : même `<EquipmentSheet>` reçoit `onChange={(item, toast) => ecrireMateriel(item, undefined, toast)}`. Test : toast « Étalonné · à jour jusqu'au JJ.MM » avec Annuler, qui réécrit l'appareil d'avant ; plus de « pH-mètre enregistré. ». cecb72ab.
- **P3** (Payer un entretien sans effet) : `onPayMaintenance` ferme la fiche (elle cachait la Dépense) et ouvre `ExpenseSheet` sur l'appareil. Test : la Dépense reçoit `existingEquipmentId` et `initialIntent="expense"`. cecb72ab.
- **P4** (lectures arrondies) : `DetailModel.decimalesLecture` = max(décimales de la tolérance, des lectures gardées et saisies, 2 pour le pH), plafond 3. Écarts, historique et fil 1280 l'utilisent ; « tolérance ±0,05 » garde les décimales de la tolérance seule. Tests (4 échecs avant) : tolérance 0,1, lu 7,01 → « +0,01 » ; historique « 4,03 · 7,02 » ; fil 1280 « étalonné 4,03 · 7,02 ». cecb72ab.
- **P5** (réglette de l'ajout) : `NewEquipment.tsx`, `Reglette` SVG de za3 (point plein « dernier fait », trait ambre du temps écoulé, rond « prochain ») devant « prochain le … », longueur proportionnelle (3 mois = 103 px comme la maquette, plafonné à la règle). Test : le rond est plus loin pour 3 mois que pour 1 mois. ea6dd8bd.
- **P6** (lignes qui se touchent) : `ESPACEMENT_MIN_PX` 28 → 34 (blanc de 6 px) ; la ligne descendue garde un nœud de rappel à sa date (`.mt-rappel`, point + trait). Test unitaire du pas passé à 34 (échec avant). ea6dd8bd.
- **P7** (en-tête de la fiche à 390) : `Sheet` reçoit une prop optionnelle `bare` (titre en `sr-only`, plus d'en-tête ni de ×) ; `Detail.tsx` dessine la barre de za3 : « ← Stocks · Matériel » (retour, 44 px) à gauche, ⋯ rond à droite, nom sur toute la largeur. Pas de test dédié (l'ordre visuel se juge à la capture). db7e6ba0.
- **P8** : « Fait · à jour pour 5 brassins » (toast) et « ✓ Refroidisseur à plaques à jour pour 5 brassins » (note). Test (échec avant). ea6dd8bd.
- **P9** (ligne « Achat · date et prix inconnus » absente à 1280) : le code était juste. Test ajouté : le panneau garde la ligne quand les dépenses reliées sont de genre `service`. Cause réelle : la fixture d2b donnait au genre `equipment`, c'est-à-dire l'achat lui-même, qui remplace la ligne « Achat » inconnue. Fixture de la demande : `kind:'service'` (tampons, KCl) comme za3.
- **P10** : « 1 739 CHF » avec espace insécable, par un formateur nommé `totalParc` (`fr-CH`, apostrophe et U+2019 remplacés). Test `^1\s739 CHF$` (échec avant). ea6dd8bd puis db7e6ba0.
- **P11** : feuille « Nouveau matériel » avec `bare` : titre gras 22 px, × dans un rond 44 px, fond de surface. Test : titre et × présents. ea6dd8bd.
- **P12** : « sans échéance » = picto + nom, plus de sous-ligne « encore N brassins » (le compte se lit dans la fiche : « utilisé dans N brassins »). Test (échec avant). ea6dd8bd.
- **P13** : plus de × dans la feuille ; le focus initial tombe sur « ← Stocks · Matériel » (collé à gauche, anneau `outline-offset: -2px`). db7e6ba0. À confirmer à la capture.

## Doutes tranchés (note de décision)
- **D1** (±0,1 et « pH 7 ») : vient de la fixture d2b ; le préréglage donne ±0,05 et « pH 7,00 ». La demande recapture avec le préréglage (pas de `calibration` posée). Rien à changer dans le code.
- **D2** (hors tolérance enregistré comme réussi) : maintenu, sans rien changer. za3 n'a pas cet état ; une sonde qui dérive est une information (✗ rouge et lecture gardées). Si le brasseur veut un blocage, c'est une décision à lui montrer.
- **D3** (« 15.11 Dégivrer » en gras alors que c'est à jour) : corrigé : un appareil à jour dit « à jour » en gris au nœud « aujourd'hui ». db7e6ba0.
- **D4** (bandeau « mode local » sur Déjà possédé / Projets) : propre au banc ; rien.
- **D5** (pastilles 30 px) : identique à za3, zone tactile élargie à 44 px par d2b ; rien.
- **D6** (le panneau s'ouvre sur la Pompe à 1280) : contrat de voie, gardé.
- **D7** : captures de la demande ci-dessous.

## Critères
- `npx tsc --noEmit` : aucune sortie.
- `npx vitest run …` (liste de la demande + `equipmentSchedule` + `materielFicheStocks`) → `voies/c1/tests.txt` : 195 verts sur 196 ; 1 rouge, `tests/unit/rejeu-649b/virgule-transversale.test.ts`. Ce rouge vient de 21 lignes **hors matériel** (`BatchDetailSheet.tsx:187`, `brewDayBilan.ts`, `finance/controlesPiece.ts`…) : il échoue sans mes fichiers ; la ligne de `ListFil.tsx` que j'avais, elle, a été réglée (formateur `totalParc`). À router : voie qui possède ces fichiers.
- `npm run build` : vert (DRAPEAUX OK).
- Essais : 1 par critère ; une erreur de ma part (un `git stash` nu, aussitôt restauré par `stash apply <sha>` puis drop : arbre intact, rien perdu).

## Limites
- Aucun écran ouvert dans Chrome par moi : P5, P6, P7, P11, P13 ne sont dits justes que par le code et les tests. Les captures décident.
- Sheet : la prop `bare` est ajoutée dans `src/ui/Sheet.tsx` (hors périmètre de d2a/d2b, mais dans W) ; optionnelle, sans effet sur les autres feuilles.
- La réglette est proportionnelle ; za3 a une seule valeur fixe (3 mois). « An » plafonne à la fin de la règle.
- « Payer un entretien » ouvre la Dépense en intention « expense » ; la première ligne n'est pas encore typée « Entretien » (limite connue de d2b, `ExpenseSheet` hors voie).

## DEMANDE EXECUTANT :
Dans W, serveur de banc en arrière-plan : `cd C:/Users/mrspa/AppData/Local/Temp/materiel-port && npx vite --port 3447 --strictPort` ; ouvrir `http://localhost:3447/?dev-local`. Fixtures simulées comme `M/voies/a0-banc/VOIE.md` et d2b (copie jetable de `src/data/seedData.ts`, à remettre à l'original ensuite ; jour de l'appareil figé au 14.11.2026 pour les captures de d2a et au 15.11.2026 pour celles de d2b), avec cette fois :
- **pH-mètre SANS `calibration`** (le préréglage donne ±0,05, « pH 7,00 » et « pH 4,00 ») ; `rhythm {every:1, unit:'mois'}`, `lastDone:'2026-10-11'`, `history` : étalonnages 11.10 (7,02 / 4,03), 12.09 (7,03 / 4,04), 10.08, 08.07 ; `purchaseDate` et `purchasePrice` absents.
- **Transactions reliées** : une dépense `expense` avec **deux lignes de genre `service`** (jamais `equipment`) et `equipmentRef` du pH-mètre : « Tampons pH 4 et 7 » 24,90 CHF au 08.10 et « Solution KCl » 12,50 CHF au 22.05. Les mêmes transactions lisibles à 390 et à 1280.
- Pompe de recirculation : `brokenSince:'2026-11-05'`, `brokenNote:'fuit au raccord'`, `state:'À réparer'`. Un frigo : `task:'Dégivrer'`, rythme 1 mois, `lastDone` récent. Dégivrer (Frigo, 20.12) et Réfractomètre (28.12) présents ensemble. Refroidisseur à plaques : `task:'Détartrer'`, `rhythm {every:5, unit:'brassin'}` et cinq brassins fictifs. Un appareil avec `purchasePrice` pour le pied (total ≥ 1 000 CHF, par exemple 1 739).

Captures (PNG dans `M/voies/c1/captures/`, **mêmes noms que d2a et d2b**), chacune ouverte en image (L12) et comparée à `M/v2/za3/za3-*.png` :
- d2a, 390 tactile : `d2a-repos-390.png`, `d2a-repos-cave-390.png`, `d2a-traiter-390.png` (geste **Fait** sur le Refroidisseur : toast « Fait · à jour pour 5 brassins » + Annuler, note « à jour pour 5 brassins »), `d2a-ajout-390.png` (choisir Entretien « 3 mois » : la réglette visible devant « prochain le … » ; titre gras et × rond), `d2a-vide-390.png`.
- d2a, 1280 : `d2a-repos-1280.png`, `d2a-repos-cave-1280.png`.
- d2b, 390 : `d2b-ph-390.png` (Étalonner, saisir 7,01 et 4,02 : « +0,01 ✓ », « +0,02 ✓ », « tolérance ±0,05 », historique « 4,03 · 7,02 », zone « Dépenses reliées » à **37,40 CHF · 2 prix connus** avec ses deux lignes et « Achat · date et prix inconnus » ; en-tête « ← Stocks · Matériel » et ⋯ rond), `d2b-ph-hors-390.png` (7,2 dans pH 7 : « +0,20 ✗ »), `d2b-pompe-390.png`, `d2b-frigo-390.png` (noms sur une ligne, focus initial sans anneau coupé), `d2b-gestion-390.png` (⋯ ouvert), `d2b-ph-cave-390.png`.
- d2b, 1280 : `d2b-ph-1280.png`, `d2b-ph-cave-1280.png` (pH-mètre choisi : « étalonné 4,03 · 7,02 » dans le fil, « Achat · date et prix inconnus » présent, « sans échéance » sur une ligne par appareil).
- **Neuves (D7)** : `c1-toast-etalonne-390.png` (fiche du pH-mètre à 390 : saisir 7,01 / 4,02, toucher **✓ Étalonné** : toast « Étalonné · à jour jusqu'au 15.12 » avec Annuler, la fiche fermée), `c1-annule-390.png` (après Annuler), `c1-payer-390.png` (**Payer un entretien** depuis la fiche à 390 : la Dépense s'ouvre sur le pH-mètre), `c1-traiter-filtre-390.png` (filtre « À traiter » après un geste : « 9 à jour · Tout › »), `c1-ajout-cave-390.png`, `c1-vide-cave-390.png`, `c1-traiter-cave-390.png`, `c1-apres-geste-1280.png`, `c1-fil-rappel-390.png` (zoom sur « dégivrer » / « Réfractomètre » : un blanc entre les lignes et le petit trait de rappel).
Commandes de contrôle à rejouer sur chaque page : 0 texte < 12 px, 0 `input[type="number"]`, 0 débordement horizontal à 390, 0 exception.
Sorties attendues : `CAPTURES OK 29` (24 reprises + 5 minimum des neuves selon ce que le banc permet ; lister celles qui manquent). Arrêter le serveur, remettre `seedData.ts`.
Je juge ensuite : fidélité côte à côte avec za3, barre « ← Stocks · Matériel », réglette, blanc entre lignes du fil, anneau de focus.

CONNAISSANCE : une fixture de dépenses reliées doit utiliser le genre `service` ; le genre `equipment` désigne l'achat de l'appareil et retire la ligne « Achat · date et prix inconnus ».
LEÇON PROPOSÉE : un test d'écran d'une feuille câblée par un écran parent doit rendre le parent (StocksTab), pas seulement le composant : d2b avait testé `EquipmentDetail` seul, d2a câblé le panneau à 1280 sans la feuille ; les deux voies vertes, la fiche à 390 vide.
