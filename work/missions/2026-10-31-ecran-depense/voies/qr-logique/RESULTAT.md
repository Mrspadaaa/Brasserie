OK — qrFacture.ts : SPC + S1 lus, confrontés champ par champ à la lecture ; 30 tests verts, témoin négatif tenu

## Fichiers écrits
- `src/services/qrFacture.ts` (neuf, module pur, seul import : le type `ScannedInvoiceResult`)
- `tests/unit/depense/qr/aide.ts`, `qr-facture.test.ts`, `s1.test.ts`, `confronter.test.ts`
- ce RESULTAT.md

## API
- `parseSwissQr(texte): QrFacture | null` : `null` si la 1re ligne n'est pas `SPC`. Sinon IBAN (+ `qrIban`), créancier et débiteur (`QrAdresse` S ou K), `montant` (`null` si vide, jamais 0), `devise`, `typeReference`/`reference`, `message`, `epd`, `infosFacturation`, `procedures[]`, `s1` (info lue en S1), `valid`, `problemes[]`. Contrôles : clé IBAN modulo 97 (forme CH/LI), QR-IBAN (IID 30000-31999) lié à QRR, QRR modulo 10 récursif, SCOR ISO 11649, version 02xx, codage 1, devise CHF/EUR, montant ≤ 2 décimales sans séparateur de milliers, EPD, adresses. `\n`, `\r\n`, BOM et lignes vides finales tolérés ; charge tronquée : objet `valid:false`, pas de plantage.
- `parseSwicoS1(info): SwicoS1 | null` : `numero`(10), `date`(11, jour ou période, ISO + brut), `referenceClient`(20), `ide`(30), `prestation`(31), `tva`(32 : `8.1` ou `taux:montant;…`), `tva33`, `conditions`(40 : `{escomptePct, jours}`), `inconnus` bruts. `\/` et `\\` échappés. Date impossible : `debut:null` + brut gardé.
- `confronterQr(qr, lecture): ConfrontationQr` : `montant`, `devise`, `numero`, `date`, `creancier` en `{statut: confirme|contredit|absent|non-lu, qr, lecture}` ; plus `etat` (aucun|invalide|valide), `problemes`, `iban`, `reference`, `conditions`, `delaiNetJours`. Montant : écart < 0,005. Numéro : sans casse/accents/espaces/ponctuation. Date : S1 /11/ (début de période) contre `lecture.date` JJ.MM.AAAA. Créancier : noms nettoyés, le début (10 car. max, 3 min) du plus court se retrouve dans l'autre. QR absent ou invalide : tous les champs `absent`, `iban`/`reference` `null` (un QR invalide ne confirme ni ne contredit). Rien n'est remplacé.
- Aussi exportés : `ibanValide`, `estQrIban`, `referenceQrrValide`, `referenceScorValide`.

## Cas couverts (30 tests, 3 fichiers)
Exemples publics SIX : IBAN `CH5800791123000889012`, QR-IBAN `CH4431999123000889012`, QRR `210000000003139471430009017`, SCOR `RF18539007547034`, S1 `//S1/10/10201409/11/190512/20/1400.000-53/30/106017086/31/180508/32/7.7/40/2:10;0:30` (les clés de ces exemples passent mes contrôles : c'est aussi la preuve qu'ils sont justes).
QRR avec montant ; SCOR en EUR + adresse K ; NON sans montant ni débiteur ; `\r\n` + lignes vides finales ; S1 complet ; `\/` dans le n° ; période ; deux taux ; codes inconnus ; clé IBAN fausse, QRR faux, QRR sans QR-IBAN, SCOR avec QR-IBAN, montant illisible, devise, EPD, version ; charge tronquée ; non-SPC → null ; confrontation : tout confirmé, montant 110,04 contre 110,40 contredit, montant absent, date/montant non lus, date/numéro/créancier contredits, sans S1, devise contredite (le montant n'est alors pas confirmé), QR invalide, pas de QR, 1949,76 contre 1949,75.

## Critères
- `npx tsc --noEmit -p . && echo TYPES OK` → `TYPES OK` (1er essai, aucun échec k5 rencontré)
- `npx vitest run tests/unit/depense/qr --maxWorkers=2 && echo TESTS QR OK` → 3 fichiers, 30 tests, `TESTS QR OK`
- **Témoin négatif** : `TOLERANCE_MONTANT` 0.005 → 1 (outil d'édition, copie faite avant dans le scratchpad) : 2 tests en échec (« montant contredit : 110,40 lu contre 110,04 » et « tolérance de montant »), 28 passent. Remise par Edit ; `cmp` avec la copie (au seul changement `let` → `const` fait ensuite, appliqué à la copie par sed pour comparer) : identique ; puis `TESTS QR OK`.
- `git status --short` : mes seuls ajouts sont `src/services/qrFacture.ts`, `tests/unit/depense/qr/` et ce dossier de voie ; le reste est antérieur ou d'autres voies (`tests/unit/hopIndexV4/fraisT3.test.ts`, `work/missions/2026-10-31-ecran-depense/qr/`, `voies/e-emulateur/*` ne sont pas à moi).

Essais utilisés : 1 par critère.

## Doutes et limites (de mémoire des Guidelines/Swico, sans accès réseau)
- Sens exact de `taux:montant` en /32/ (base nette ou impôt) et de /33/ : lus et rendus tels quels, sans interprétation fiscale ; à confirmer avant de s'en servir pour un contrôle TVA.
- Montant nul (`0.00`) tenu pour invalide (minimum 0,01 des Guidelines) ; je ne suis pas sûr que la version 2.3 l'admette.
- Non contrôlé : longueur 140 de message + info de facturation, créancier final (réservé), longueurs max des champs, 2 procédures alternatives (gardées brutes). Un QR légèrement hors norme mais accepté par les banques resterait valide ici.
- Créancier : la règle « début du plus court dans l'autre » confond deux noms commençant pareil sur 10 caractères (« Brasserie du… ») ; elle sert à détecter une lecture d'une autre société, pas à les distinguer.
- Le texte du QR vient de zxing plus tard ; rien ici ne décode une image. `lecture.date` accepte JJ.MM.AAAA et AAAA-MM-JJ.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
