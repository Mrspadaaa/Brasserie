# Voie qr-logique — le QR-facture suisse lu et confronté à la lecture

Agent : auteur (Sonnet). Plafond : 80 tours. Pilote : Opus. Date : 01.11. Décisions : D240 (zxing-wasm accordé), D243 (pdf.js accordé ;
l'écran se choisit sur mini maquettes, voies qr-r, qr-z, qr-u : **aucun écran ici**).

## But
Un module pur, sans dépendance ni réseau : il reçoit le **texte** d'un QR (zxing le donnera plus tard, dans le téléphone) et la lecture de
la facture (`ScannedInvoiceResult`, `src/services/geminiScanner.ts`), et dit champ par champ ce que le QR confirme ou contredit.

## À faire — `src/services/qrFacture.ts` (neuf)
1. `parseSwissQr(text)` : QR-facture suisse SPC, version 02xx, codage 1, selon les Swiss Implementation Guidelines QR-bill (SIX) :
   IBAN, créancier (type d'adresse S ou K, nom, rue/ligne 1, n°/ligne 2, NPA, lieu, pays), montant (nombre ou `null` si vide), devise
   (CHF ou EUR), débiteur final, type de référence (QRR, SCOR, NON) et référence, message, `EPD`, informations de facturation, procédures
   alternatives. Fins de ligne `\n` ou `\r\n`, lignes vides finales tolérées. Contrôles : clé IBAN (modulo 97), référence QRR (modulo 10
   récursif), SCOR (ISO 11649). Rend `null` si ce n'est pas un QR-facture ; sinon l'objet et `valid` + `problemes[]` (un QR invalide ne
   confirme rien).
2. `parseSwicoS1(info)` : `//S1/10/…/11/…/20/…/30/…/31/…/32/…/33/…/40/…` ; barre oblique échappée `\/` ; `/11/` en AAMMJJ ou en
   période AAMMJJAAMMJJ ; `/32/` taux seul (`8.1`) ou liste `taux:montant;…` ; `/40/` conditions `escompte:jours;…`. Rend les champs
   connus et garde les inconnus bruts.
3. `confronterQr(qr, lecture)` → par champ (`montant`, `devise`, `numero`, `date`, `creancier`) : `confirme`, `contredit`, `absent` (le
   QR ne le porte pas) ou `non-lu` (la lecture ne l'a pas), avec les deux valeurs. Montant : écart < 0,005 ; n° : sans casse, espaces ni
   ponctuation ; date : la date S1 (la première d'une période) contre `lecture.date` (JJ.MM.AAAA) ; créancier : noms normalisés dont l'un
   contient le début de l'autre. Rend aussi `iban`, `reference`, `conditions` (pour payer plus tard). Rien n'est remplacé : le module dit,
   l'écran (plus tard) montrera.
Style : celui de `src/services/purchasePrefill.ts` (commentaires en français, fonctions courtes, types exportés).

## Tests — `tests/unit/depense/qr/` (aucun réseau, aucune pièce du brasseur)
Charges construites à la main d'après les exemples **publics** des Swiss Implementation Guidelines (IBAN et QR-IBAN d'exemple, références
d'exemple) : QRR avec montant ; SCOR en EUR ; NON sans montant (bulletin ouvert) ; `\r\n` ; S1 complet ; S1 avec `\/` dans le n° ; `/11/`
en période ; `/32/` à deux taux ; clé IBAN fausse → `valid: false` et rien de `confirme` ; texte qui n'est pas un SPC → `null` ;
`confronterQr` : tout confirmé ; montant contredit (110,40 contre 110,04) ; montant absent du QR ; date non lue.
**Témoin négatif** (écrit dans RESULTAT.md) : une tolérance de montant portée à 1 fait échouer au moins un test ; remise par l'outil
d'édition (jamais `git checkout`), puis `cmp` avec ta copie.

## Possède
`src/services/qrFacture.ts`, `tests/unit/depense/qr/**`, `work/missions/2026-10-31-ecran-depense/voies/qr-logique/**`. Rien d'autre (ni
`package.json`, ni l'écran, ni `functions/`). Aucune installation, aucun commit, pas de `git stash` ; aucun code écrit par heredoc ni
`node -e` (un `\d` y devient `d`). Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`.
Chemins absolus dans Bash.

## Critères (le pilote les rejoue)
- `npx tsc --noEmit -p . && echo TYPES OK` → TYPES OK
- `npx vitest run tests/unit/depense/qr --maxWorkers=2 && echo TESTS QR OK` → TESTS QR OK
- le témoin négatif → au moins un test en échec, puis TESTS QR OK après remise
- `git status --short` : rien hors de « Possède »

## Retour
`voies/qr-logique/RESULTAT.md` : l'API, les cas couverts, les sorties, le témoin. Puis une ligne `QR-LOGIQUE OK — …` ou
`QR-LOGIQUE ECHEC — …`. `LEÇON PROPOSÉE : …` au besoin.
