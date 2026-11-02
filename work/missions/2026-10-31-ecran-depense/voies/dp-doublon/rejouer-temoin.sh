#!/bin/bash
# Témoin négatif (L13) : les tests de la voie dp-doublon doivent ÉCHOUER sur HEAD. Remet les deux sources modifiées à leur état de HEAD le temps
# d'un essai (PieceDejaSaisie.tsx, neuf, reste : aucun fichier de HEAD ne l'importe), puis rend TOUJOURS les versions de la voie (trap EXIT).
# Copie de sûreté dans le dossier temporaire du système, affichée au lancement.
# Usage : bash work/missions/2026-10-31-ecran-depense/voies/dp-doublon/rejouer-temoin.sh
cd "$(dirname "$0")/../../../../.." || exit 2
FILES="src/services/purchaseEntry.ts src/ui/finance/ExpenseSheet.tsx"
T=$(mktemp -d -t dp-temoin-XXXXXX)
[ -n "$T" ] && [ -d "$T" ] || { echo "dossier temporaire introuvable : rien n’est touché"; exit 2; }
echo "copie de sûreté des versions de la voie : $T"
for f in $FILES; do mkdir -p "$T/$(dirname $f)" && cp "$f" "$T/$f" || { echo "copie de sûreté impossible : rien n’est touché"; exit 2; }; done
restaurer() { for f in $FILES; do cp "$T/$f" "$f"; done; echo "versions de la voie remises ($T)"; }
trap restaurer EXIT
for f in $FILES; do git show "HEAD:$f" > "$f"; done
npx vitest run tests/unit/depense/doublon --maxWorkers=2 > "$T/vitest.log" 2>&1
code=$?
grep -E "Tests |Test Files" "$T/vitest.log" | sed 's/\x1b\[[0-9;]*m//g'
echo "code de sortie des tests sur HEAD : $code (attendu : 1)"
