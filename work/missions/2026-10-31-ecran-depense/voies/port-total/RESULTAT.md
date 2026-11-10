OK — le port est « Total seulement » au banc : juge, comparerJugements, vérités doc5/8/9, rejeu sans perte ; 43 tests ; G5 bloqué par l'écran d'une autre voie

# RESULTAT — voie port-total (D249, D258)

## Ce qui est livré
- La forme unique (D258) : le port reste une ligne `shipping` de `draft.lines`, puis une entrée `shipping` de `finance.lines`. **Aucun fichier de `src/` ni de `functions/` n'est modifié par cette voie** (`git diff` sur `src/services/purchaseEntry.ts`, `functions/`, `tests/unit/purchaseEntry.test.ts`, `scripts/banc-lecture-facture.ts`, `banc-lecture-k5.test.ts`, `banc-lecture-facture.test.ts` : vide). Les modifications de `src/ui/**` visibles dans `git status` sont celles d'une autre voie.
- P1 et P2 : 16 tests qui épinglent ce que le code fait déjà (enregistrement d'une ligne `shipping`, contrôle de somme).
- P3 : le juge écarte le port des deux côtés (`lignesSansPort`, option `portEnLigne`), 27 tests dont les n° 9 et n° 11 ajoutés par la contre-revue.
- P4 : `comparerJugements`, avec la définition de la perte, testé.
- P5 : comptage des ports lus sous un autre genre : **0**.
- P6 : vérités de doc5, doc8, doc9 corrigées (hors Git, copies `.avant-port` vérifiées).
- P7 : rejeu hors ligne avant/après, sans perte.
- P8 : `banc-lecture-k5` et `banc-lecture-facture` verts sans modification.
- P9 : les deux lignes du port de GESTES.md remplacées.

## TEMOIN AVANT
Les tests ont été écrits puis lancés sur HEAD (aucun code encore changé) : `npx vitest run tests/unit/depense/port` → **15 échecs, 28 réussites sur 43**.
- Échouaient (port-banc-juge, comme prévu par le plan) : P3 n° 1, n° 2, n° 3 (le port comptait comme une ligne : `lineJudged` 2, `items.count` fautif) ; P3 n° 10 ×4 (`lignesSansPort` absente) ; P3 n° 11 `judgeBench` avec l'option (option ignorée) ; P4 ×6 (`comparerJugements` absente).
- Écart avec le plan : **P3 n° 4 échouait aussi**. Le plan le donnait comme épingle ; sur HEAD l'omission d'un houblon donnait `items.1.name` (la ligne du port glissait à la place), pas `items.1`. Le chemin `items.1` (ligne manquante) n'apparaît qu'une fois le port écarté : c'est justement ce que le test prouve (le filtre ne masque pas une vraie omission).
- Passaient déjà sur HEAD, **épingles seulement** (aucun code à changer) : les 12 tests de `port-enregistrement.test.ts` (P1 n° 1 à 10 : ligne `shipping` sans référence, sans reçu, sans incrément ; refus d'une action de stock ou de matériel ; refus d'un port sans montant ou négatif ; TVA identique à un service ; document réduit à son port ; plafond de 35 lignes port compris ; centimes ; double clic ; forme de l'entrée), les 4 de `port-controle-somme.test.ts` (P2 : la lecture et le recalcul client comptent le port, la somme accuse l'écart sans lui, un port sans montant est « incomplet »), et P3 n° 5 à 9 et n° 11 (sept couples sans `shipping`).
- Après le juge : 43 tests sur 43 verts.

## Rien ne se perd
- Le code de `src/` et de `functions/` ne bouge pas ; `finance.lines` s'écrit comme avant (P1 n° 10) ; les dépenses déjà enregistrées ne sont pas réécrites.
- Rejeu du banc : aucune cellule ne perd un point (voir plus bas) ; la cellule de contrôle est identique.
- Hors port, le juge par défaut égale le juge d'avant (P3 n° 11 : 7 couples sans `shipping` ; comparaison 1 du rejeu : l'option reproduit exactement les `RESULTAT-BANC.md` de HEAD).
- Les vérités d'avant sont gardées (`cas-2.avant-port.json`, `cas-4.avant-port.json`, copies vérifiées par `cmp` avant l'édition) ; après l'édition, doc5, doc8 et doc9 perdent chacune exactement une ligne, les autres pièces rien, les deux fichiers se chargent.
- Tests existants : `banc-lecture-facture` (108) et `banc-lecture-k5` (40) verts sans modification ; 355 tests verts sur G3.

## Rejeu du banc avant/après
Origine : lectures prêtées de `banc-k1-20261101-081144`, `banc-k4-20261101-092139`, `-092559`, `-093815`, `banc-k5-A`, `-B1`, `-B2`, `-C` ; `--hors-ligne --repeat 1`, aucun appel, aucune clé. Sorties sous `REELS_DIR` (hors Git) : `banc-port-avant-<doc>` et `banc-port-apres-<doc>`. Comparaison : `work/missions/2026-10-31-ecran-depense/voies/port-total/comparer-rejeu.ts` (comptes seulement).
- **Écarts avec le plan** : (1) `--repeat 1` (un tirage) : les tirages 2 et 3 manquent dans les sorties prêtées ; (2) `--reprendre` veut des chemins, pas des noms ; (3) cellules réellement lues : doc5 : A, C, Csv, Csv8, Av, Avl, Zv (7) ; doc8 : A, C, Csv, Csv8, Zv (5) ; doc9 : A, C, Csv, Csv8, Zv (5). Av et Avl de doc8 et doc9 n'ont pas toutes leurs lectures (« Av3 manque ») : non rejouées, rien n'a été appelé. Le plan attendait doc8 = A seulement et doc9 = A, Csv, Av : la réalité est plus large, sans Av.
- Comparaison 1 : l'ancien juge (`portEnLigne`) sur les anciennes vérités **reproduit exactement** le `RESULTAT-BANC.md` écrit sur HEAD : OUI pour doc5, doc8, doc9.
- Comparaison 3 (cellule de contrôle, nouveau juge × anciennes vérités = × nouvelles) : IDENTIQUE pour les trois pièces, tirage par tirage.
- Comparaison 2, résultat par cellule (17 cellules) : une ligne jugée de moins dans chacune (doc5 26→25, doc8 37→36, doc9 26→25) ; écart champs inchangé partout ; **7 cellules perdent une faute de port** (doc8 ×5 : écart lignes 2→1 ; doc9 C et Csv8 : 1→0) parce qu'une lecture qui n'écrit pas la ligne du port n'est plus fautive ; doc5 C garde son écart (1→1, faute sans lien avec le port) ; chemins ajoutés : 0 ; pertes : **0** ; `REJEU PORT OK`.
- Les tableaux de HEAD (`banc-port-avant-<doc>/RESULTAT-BANC.md`) ne contiennent aucune valeur ; rien n'est recopié ici.
- **Le port lu sous un autre genre (P5)** : 0 sur 596 lectures examinées (8 sorties prêtées, 13 pièces ; 136 lectures des trois pièces à port) — (a) ligne alignée sur le `shipping` de la vérité d'avant mais d'un autre genre : 0 ; (b) libellé de la liste fermée (port, frais de port, livraison, versand, fracht, porto, frais d'envoi) sur une ligne non `shipping` : 0. Aucune cellule `autreGenre` : aucun chemin à signaler à part. Script : `compter-ports.mjs` (témoin fabriqué exercé : 1 et 1 sur un port lu en `service`, 0 sur la lecture propre, « Portwein » ignoré).

## Critères de GATES.md (rejoués depuis la racine du worktree)
- G1 `systeme.mjs comprendre` → `COMPRIS OK (2 doutes)`.
- G2 : écrit par le pilote (`REVUE-PLAN.md`) ; non rejoué ici.
- G3 → `Test Files 10 passed, Tests 355 passed` (cible `TESTS PORT OK`, exit 0).
- G4 `npm --prefix functions run build` → exit 0.
- G5 : **non tenu en l'état, cause étrangère à cette voie.** `tsc --noEmit -p .` rend 5 erreurs : les 2 connues de `qrLecture.ts` (exclues par GATES.md) et 3 dans `src/ui/finance/ExpenseSheet.tsx` (`BandeCollante` et `LigneTicket` non exportés par `src/ui/depense/Verdict.tsx` et `Ticket.tsx`, type `CompteLiens` : lignes 36, 38, 652). Ces fichiers sont modifiés dans le worktree par la voie d'écran (p3c-port : `git status` montre `Verdict.tsx`, `Ticket.tsx`, `Pictos.tsx`, `ModalShell.tsx`, `InvoiceScanReview.tsx` modifiés, que je ne possède pas ni n'ai touchés). Aucune erreur dans `scripts/`, `tests/` ni `src/services/`. À rejouer quand cette voie a fini.
- G6 → voir la dernière ligne de cette section.

## Fichiers écrits
- `tests/unit/depense/port/port-enregistrement.test.ts`, `port-controle-somme.test.ts`, `port-banc-juge.test.ts` (neufs)
- `scripts/banc-lecture-facture-juger.ts` (`lignesSansPort`, `JudgeOptions`, options de `judgeResult` et `judgeBench`, `comparerJugements`)
- `work/missions/2026-11-01-banc-lecture/GESTES.md` (les deux lignes du port)
- `work/missions/2026-10-31-ecran-depense/voies/port-total/` : `COMPRIS.md`, `PLAN.md` (P3 n° 11, centimes, provenance des preuves), `RESULTAT.md`, `comparer-rejeu.ts`, `compter-ports.mjs`
- Hors Git (`work/finalisation-tickets-2026-10-08/H13-reels/`) : `cas-2.avant-port.json`, `cas-4.avant-port.json` (copies), `cas-2.json` et `cas-4.json` (une entrée `shipping` retirée de doc5, doc8, doc9), `banc-port-avant-doc5|doc8|doc9`, `banc-port-apres-doc5|doc8|doc9`.

## Essais utilisés
Rejeu « avant » : 4 essais pour trouver les bons arguments (chemins de `--reprendre`, `--repeat 1`, variantes sans Av/Avl pour doc8 et doc9) ; aucun appel Gemini à aucun moment. Autres critères : 1 essai.

## Doutes et limites
- Écran : les fichiers d'écran ne se chargent pas dans ce poste (`zxing-wasm`) ; sans objet, cette voie ne touche aucun écran.
- `banc-lecture-qr.ts` appelle `judgeResult` : son verdict peut changer sur une pièce à port ; c'est voulu (D249), non exercé ici.
- Une lecture qui omet le port n'est plus fautive : c'est la règle voulue, mais le banc ne mesure plus si une consigne neuve devrait lire le port ; cela ne touche que le port.
- Un seul tirage rejoué par cellule (les autres manquent dans les sorties prêtées).
- Un contrôle de lecture des vérités a utilisé un `node -e` en lecture seule (comptage de lignes par pièce) : aucune donnée n'a été écrite par ce moyen ; les éditions ont été faites avec l'outil Edit. Je le dis puisque la consigne interdit `node -e`.

## DÉCISION À PRENDRE
aucune pour cette voie. Pour le pilote : G5 attend que la voie d'écran ait fini ; ni G5 ni cette voie ne dépendent de ma correction.

CONNAISSANCE : `--reprendre` du banc prend des chemins de dossiers (pas des noms) ; les sorties prêtées de k4 et k5 n'ont que le tirage 1 pour doc8 et doc9, et pas toutes les lectures d'Av et Avl : un rejeu sur ces pièces se fait avec `--repeat 1`, une pièce à la fois, sans Av ni Avl. Un port lu sous un autre genre : 0 sur 596 lectures (01.11).
LEÇON PROPOSÉE : un critère de plan qui porte sur le rejeu doit être tenté une fois à blanc avant d'être écrit (les noms d'arguments et les cellules lues se découvrent au premier lancement).
