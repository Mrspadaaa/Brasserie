#!/bin/bash
# Rejeu final5 : tous les cas aux deux largeurs, par groupes (chacun repart d'une base émulée neuve), manifeste rejeu-k6.json (doc14 compris).
# Chaque groupe passe par lancer.sh : attente de mémoire et de ports libres, reprise jusqu'à 4 fois si la garde mémoire l'arrête.
cd "$(dirname "$0")/../../../../.." || exit 2
V=work/missions/2026-10-31-ecran-depense/voies
OUT=$V/e-emulateur/final5
rm -rf "$OUT"; mkdir -p "$OUT"
groupes=("A:etats,doublon,doc5,finances,doc6" "B:autre-numero,rattacher,minuscules,doc1" "C:doc4,hors-ligne,doc3,doc2" "D:doc14" "E:drive-fond")
for g in "${groupes[@]}"; do
  nom=${g%%:*}; cas=${g#*:}
  bash $V/e-bout/lancer.sh "$OUT/$nom" "$cas" 390,1280
done
echo FIN >> "$OUT/bilan.txt"
