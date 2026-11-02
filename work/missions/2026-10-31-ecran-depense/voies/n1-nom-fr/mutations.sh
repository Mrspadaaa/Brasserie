#!/bin/bash
# Mutations jouées DANS LA COPIE ISOLÉE (jamais le dépôt) : une ligne retirée, puis les tests de la voie ; la copie est resynchronisée à la fin (copie.mjs).
# Usage : bash mutations.sh   (depuis la racine du dépôt, après un `copie.mjs` qui a synchronisé la copie)
C="$TEMP/qr-app-copie"
cd "$C" || exit 2
jouer() { # nom, fichier, motif sed, remplacement, tests
  cp "$2" "$2.orig"
  sed -i "s#$3#$4#" "$2"
  if cmp -s "$2" "$2.orig"; then echo "MUTATION $1 : motif absent (rien changé)"; mv "$2.orig" "$2"; return; fi
  sortie=$(npx vitest run $5 --maxWorkers=2 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E "^ +× |Tests  " | cut -c1-170)
  echo "MUTATION $1 :"; echo "$sortie"
  mv "$2.orig" "$2"
}
jouer "M1 rangees.ts sans nameFr/nomLu" src/ui/depense/rangees.ts ", nameFr: line.nameFr, nomLu: line.nomLu" "" tests/unit/depense/nom-b/confiance-b.test.ts
jouer "M2 confiance.ts sans nameFr/nomLu" src/ui/depense/confiance.ts ", nameFr: l.nameFr, nomLu: l.nomLu }, c.fournisseur" " }, c.fournisseur" tests/unit/depense/nom-b/confiance-b.test.ts
jouer "M3 etat.ts memeProduit sans noms" src/ui/depense/etat.ts "\.\.\.(noms ?? {})" "" tests/unit/depense/nom-b/confiance-b.test.ts
jouer "M4 ExpenseSheet sans la garde neufDOffice" src/ui/finance/ExpenseSheet.tsx "||!neufDOffice.current.has(l.id)" "" tests/unit/depense/nom-b/ecran-nom-b.test.tsx
jouer "M5 ExpenseSheet sans la garde manuallyClassified" src/ui/finance/ExpenseSheet.tsx "||manuallyClassified.current.has(l.id)" "" tests/unit/depense/nom-b/ecran-nom-b.test.tsx
jouer "M6 ExpenseSheet sans la garde articleName" src/ui/finance/ExpenseSheet.tsx "||l.articleName?.trim()" "" tests/unit/depense/nom-b/ecran-nom-b.test.tsx
jouer "M7 bouton bis : nom imprimé" src/ui/finance/ExpenseSheet.tsx 'text-attention">{neuf?.name??line.description.trim()}</button>' 'text-attention">{line.description.trim().split(" ")[0]+" "+neuf?.origin}</button>' tests/unit/depense/nom-b/ecran-nom-b.test.tsx
