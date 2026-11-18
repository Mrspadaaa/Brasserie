# Voie k5-vision — bandes, pages, zoom ciblé, QR : les gestes de vision au banc

Agent : auteur (Sonnet). Plafond : 100 tours. Pilote : Opus. Date : 01.11. Suite de k4 (`voies/k4-harness/`, commits dc176c15, cbbcecf9) ;
D242 : 20 CHF de plus pour le banc, **25 CHF cumulés** au plus (`spentInJournal`, 4,41 CHF au 01.11 midi) ; 3 CHF au plus par passe.

## Ses mots (01.11, mot pour mot)
« Et Harness, skill tool ou third party non payant pour 3.5 flash lite ? » ; puis, avec le dépôt GitHub `Anionex/dsh-vision-toolkit` :
« Qqch du genre ferai sens adapté à Nos modèles et besoin ? » ; « J'accorde 20chf de crédit en plus ». Plus tôt : « c'est assez fiable mais
toujours plutôt lent ».
Lecture du pilote : nos modèles voient déjà ; du dépôt, on reprend ses gestes (lire une longue capture **par bandes** en parallèle et
recoller, **localiser puis recadrer** une zone pour la relire), adaptés à Gemini et mesurés contre la production. Rien ne change en
production (`functions/`, `src/`).

## Ce qu'on sait (ne pas le refaire)
k4 (`GESTES.md`, `RESULTAT-BANC.md`) : A (production) et C★v à 0 faux vert ; C★v et Av perdent son PDF de 37 lignes (deux Flash-Lite
coupées à 5 100 jetons, `SCAN_MAX_OUTPUT`) ; le repli `finalOfLite` est écrit, pas mesuré ; Hv, Sv, Lm, Lh, Lp, Uv, Tv ne gagnent rien.
Pièces longues : doc5 (une image 1280 × 5230, trois pages), doc11 (capture longue), doc8 (PDF de 4 pages, 37 lignes), doc9 (PDF de 3
pages). **Tu ne lis aucune valeur de ses pièces** : tes tests utilisent des cas fabriqués.

## Outils hors de l'app
`%TEMP%/banc-outils/node_modules` : `jimp@1.6.0` (découpe), `zxing-wasm@3.1.5`, `pdfjs-dist@4.10.38` + `@napi-rs/canvas@0.1.65` (rendu
d'un PDF). Chemin donné par `BANC_OUTILS` ; **import dynamique** au seul moment où une variante en a besoin : `npm test` n'en dépend
jamais, une variante sans outil est sautée avec un message clair. Exemple de chargement : `work/missions/2026-11-01-banc-lecture/qr/`.

## À faire (dans cet ordre ; si le plafond approche, finis proprement ce qui est commencé et dis le reste)
1. **C★v8** : C★v dont les deux Flash-Lite ont 8 192 jetons de sortie (`LITE_RAISED_OUTPUT`). Mesure le repli `finalOfLite` au passage.
2. **Avl** : C★v dont les deux Flash-Lite ont l'outil d'exécution de code (zoom intégré, comme Av sur la 3.8). Écris `sonde-avl.ts` :
   une image d'un pixel (L20), que le pilote lance avant la passe.
3. **Pv (PDF par pages)** : pour un PDF de N pages, N lectures Flash-Lite **en parallèle**, chacune avec tout le PDF et la consigne du banc
   « seulement les lignes imprimées sur la page k ; en-tête si k = 1 ; totaux si k = N » ; lignes recollées dans l'ordre des pages ;
   deux lectures ainsi faites, vote, la 3.8 sur désaccord (comme C★v).
4. **Bv (bandes)** : une image dont la hauteur ≥ 2 × la largeur est coupée en bandes sur des rangées presque vides (jamais à travers une
   ligne de texte), hauteur de bande ≤ 1,4 × la largeur, recouvrement d'environ 8 % ; une lecture Flash-Lite par bande, en parallèle,
   consigne du banc par rang (en-tête sur la première, totaux sur la dernière) ; recollage : lignes dans l'ordre, une ligne du
   recouvrement lue deux fois n'est gardée qu'une fois (même recopie et même montant). Deux lectures, vote, la 3.8 sur désaccord.
5. **Zv (zoom ciblé)** : quand les deux Flash-Lite divergent sur le total, la date, le n° ou le montant d'une ligne, au lieu de relire
   toute la pièce par la 3.8 : la 3.8 donne la boîte de la zone (`box_2d`, 0 à 1000), le banc recadre l'original avec une marge, agrandit
   si la zone fait moins de 600 px, et la 3.8 relit ce seul champ. Boîte absente, ou PDF sans rendu : la 3ᵉ lecture complète.
6. **+Q (QR, gratuit)** : en dernier, et **hors ligne** sur les sorties k4 (`H13-reels/banc-k4-*/results.json`), puis sur celles de k5 :
   zxing lit le QR des images (et des PDF rendus à 3× par pdf.js) ; pour chaque variante, un champ que le QR porte et qui diffère du
   résultat interdit le statut `checked` et le QR propose sa valeur. Compte : champs justes, faux verts, avant et après. Analyse du QR :
   `parseSwissQr`, `parseSwicoS1`, `confronterQr` de `src/services/qrFacture.ts` (voie qr-logique, en cours) ; s'il n'existe pas encore
   quand tu y arrives, termine le reste et dis-le.
7. **Durée** : pour chaque variante et chaque pièce, la durée murale (appels parallèles comptés une fois) ; médiane par genre de pièce.
8. **Budget** : `BUDGET_CAP_CHF` = 24,5 (D242, cumul) ; `--plafond-passe` (3 CHF par défaut) arrête une passe avant de le dépasser.
   `--estimer` donne, pour la commande proposée, les appels neufs et prêtés et le coût réservé maximal par variante.
9. **Tests** (`tests/unit/banc-lecture-k5.test.ts`, réponses fabriquées, aucun réseau, aucun outil chargé) : Pv construit N corps avec la
   consigne de page ; Bv coupe un bitmap fabriqué sur les rangées vides et ne coupe jamais une rangée encrée ; le recollage garde une
   seule fois la ligne du recouvrement ; Zv convertit `box_2d` en pixels avec la marge, et se replie sans boîte ; +Q retire `checked`
   quand le QR contredit le total ; le plafond de passe arrête avant le dépassement. **Témoin négatif** : une coupe à travers une rangée
   encrée fait échouer un test. Les tests de k4 restent verts.

## Possède
`scripts/banc-lecture-facture.ts`, `scripts/banc-lecture-facture-juger.ts`, `scripts/banc-lecture-consignes-lite.ts`,
`scripts/banc-lecture-schema.ts`, `scripts/banc-lecture-bandes.ts` (neuf), `scripts/banc-lecture-zoom.ts` (neuf),
`scripts/banc-lecture-qr.ts` (neuf), `tests/unit/banc-lecture-facture.test.ts`, `tests/unit/banc-lecture-k5.test.ts` (neuf),
`work/missions/2026-11-01-banc-lecture/voies/k5-vision/**`, `work/finalisation-tickets-2026-10-08/H13-reels/banc-k5-*/`.
Rien d'autre : ni `functions/`, ni `src/` (lecture seule de `src/services/qrFacture.ts`), ni `cas*.json`. Clé seulement par
`readLocalKey` (jamais lue, affichée ni journalisée par toi) ; ne lis jamais `functions/.env` ni `functions/.secret.local`. **Aucun appel
payé** : le pilote lance les sondes et les passes. Aucune installation, aucun commit, pas de `git stash` ; aucun code écrit par heredoc ni
`node -e`. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`. Chemins absolus dans Bash.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceVisionReview.test.ts --maxWorkers=2 && echo TESTS BANC OK` → TESTS BANC OK
- la simulation de toutes les variantes et son jugement (commande exacte dans RESULTAT.md) → `BANC SIMULE OK`
- +Q hors ligne sur les sorties k4 (commande exacte) → son tableau, sans valeur
- `--estimer` sur la commande payante proposée → `BANC ESTIME …` ≤ 3 CHF
- `git diff --stat -- functions src` ne montre rien de cette voie

## Retour
`voies/k5-vision/RESULTAT.md` : ce qui a été écrit, les sorties, la commande de la sonde, la commande payante proposée et son estimation
par variante (sans aucune valeur des documents). Puis une ligne : `K5 OK — …` ou `K5 ECHEC — …`. `LEÇON PROPOSÉE : …` au besoin.
