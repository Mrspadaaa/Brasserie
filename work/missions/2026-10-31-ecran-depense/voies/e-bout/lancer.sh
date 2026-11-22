#!/bin/bash
# Un groupe de cas du banc, avec attente de la mémoire libre (machine partagée : la garde du banc arrête sous 3 Go) et des ports des émulateurs,
# et reprise (4 essais au plus) si la garde mémoire a arrêté le groupe.
# Usage : lancer.sh <dossier-de-sortie> <cas,séparés,par,virgules> [largeurs] [manifeste] [noms rejoués (results.json du banc des noms, D281)]
cd "$(dirname "$0")/../../../../.." || exit 2
V=work/missions/2026-10-31-ecran-depense/voies/e-bout
OUT=$1; CAS=$2; LARGEURS=${3:-390,1280}
R=${4:-work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-k6.json}
N=${5:-}
for essai in 1 2 3 4; do
  for i in $(seq 1 90); do
    m=$(node -e "console.log((require('os').freemem()/1024**3).toFixed(2))")
    ports=$(node -e "
      const {createConnection}=require('net');let n=0;const ps=[9099,8080,5001,4400,4500,5175];
      Promise.all(ps.map(p=>new Promise(d=>{const s=createConnection({host:'127.0.0.1',port:p});s.once('connect',()=>{n++;s.destroy();d()});s.once('error',()=>d())}))).then(()=>console.log(n))")
    [ "$ports" = "0" ] && node -e "process.exit(Number(process.argv[1])>3.8?0:1)" "$m" && break
    sleep 10
  done
  rm -rf "$OUT"; mkdir -p "$OUT"
  node scripts/check-invoice-journey-emulator.mjs --replay "$R" --vite-config $V/vite.banc.config.mjs --out "$OUT" --cases "$CAS" --widths "$LARGEURS" --memory-floor 2.2 ${N:+--noms "$N"} > "$OUT/console.log" 2>&1
  code=$?
  echo "$(basename "$OUT") [$CAS] essai $essai : exit $code ($(grep -c '^OK ' "$OUT/console.log") OK, $(grep -c '^KO ' "$OUT/console.log") KO, $(grep -c 'ARRÊT' "$OUT/console.log") ARRÊT)" | tee -a "$(dirname "$OUT")/bilan.txt"
  grep -q "GARDE MÉMOIRE" "$OUT/console.log" || break
done
exit $code
