#!/bin/bash
# Témoin du banc (L13) : le cas `drive-fond` doit ÉCHOUER sur HEAD. Remet les six sources modifiées par la voie à leur état de HEAD le temps
# d'un essai (les quatre modules neufs restent en place : aucun fichier de HEAD ne les importe), puis rend TOUJOURS les versions de la voie
# (trap EXIT). Copie de sûreté dans le dossier temporaire du système, affichée au lancement.
# Usage : bash work/missions/2026-10-31-ecran-depense/voies/d3c-drive-code/rejouer-temoin.sh [dossier de sortie]
cd "$(dirname "$0")/../../../../.." || exit 2
V=work/missions/2026-10-31-ecran-depense/voies/d3c-drive-code
OUT=${1:-$V/temoin-head}
R=work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu.json
FILES="src/services/purchaseEntry.ts src/ui/finance/ExpenseSheet.tsx src/App.tsx src/ui/finance/TransactionDetails.tsx src/ui/finance/TransactionJournal.tsx src/domain/finance/types.ts"
T=$(node -e "const os=require('os'),fs=require('fs'),p=require('path');console.log(fs.mkdtempSync(p.join(os.tmpdir(),'d3c-temoin-')).replace(/\\\\/g,'/'))")
echo "copie de sûreté des versions de la voie : $T"
for f in $FILES; do mkdir -p "$T/$(dirname $f)"; cp "$f" "$T/$f"; done
restaurer() { for f in $FILES; do cp "$T/$f" "$f"; done; echo "versions de la voie remises ($T)"; }
trap restaurer EXIT
for f in $FILES; do git show "HEAD:$f" > "$f"; done
rm -rf "$OUT"; mkdir -p "$OUT"
node scripts/check-invoice-journey-emulator.mjs --replay $R --out "$OUT" --cases drive-fond --widths 390 > "$OUT/console.log" 2>&1
echo "code de sortie du banc sur HEAD : $? (attendu : 1, avec KO sur « drive-fond 1 »)"
grep -E "^KO |ARRÊT" "$OUT/console.log" | head -5
