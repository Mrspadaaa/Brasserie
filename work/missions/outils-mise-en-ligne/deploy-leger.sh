set -e
# Porte légère (D440, 23.11) : build, contrôles du paquet, types, règles qui protègent les données (tests/unit/proprietes) ; plus de parcours figé. Ensuite : épreuve sur la vraie app.
P="C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet"
S="C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad"
W="$S/p3-$(date +%H%M%S)"
cd "$P"; H=${H_FORCE:-$(git rev-parse HEAD)}; echo "HEAD $H"
for t in $(git tag -l 'en-ligne/*' | grep -v 2026-11-10-brassin); do git merge-base --is-ancestor $t $H || { echo "TAG NON ANCETRE $t"; exit 1; }; done
git worktree prune 2>/dev/null; git -c core.longpaths=true worktree add --detach "$W" $H >/dev/null 2>&1; test -f "$W/package.json" && git -C "$W" -c core.longpaths=true status --short | head -3; test -f "$W/src/main.tsx" || { echo COPIE KO; exit 1; }
powershell -NoProfile -Command "New-Item -ItemType Junction -Path '$W/node_modules' -Target '$P/node_modules' | Out-Null"
cd "$W"
[ -z "$TESTS_UNITAIRES" ] || npx vitest run --retry=1 --maxWorkers=4 > "$S/t4-tests.log" 2>&1 || true
[ -z "$TESTS_UNITAIRES" ] || { sed "s/[[0-9;]*m//g" "$S/t4-tests.log" | grep -E "^ FAIL " | sed "s/ >.*//" | sort -u > "$S/f4n.txt"; N=$(comm -13 "$S/f2.txt" "$S/f4n.txt"); [ -n "$N" ] && { F=$(echo "$N" | sed "s/^ FAIL  //" | tr "
" " "); npx vitest run --maxWorkers=2 $F > "$S/t4-rejeu.log" 2>&1 && N=""; }; [ -n "$N" ] && { echo "NOUVEAUX ECHECS (rejoués seuls) :"; echo "$N"; echo TESTS ROUGES; exit 1; }; echo "aucun nouvel échec par rapport au tour 2"; }
cp "$P/../Brasserie/.env" .env; cp "$P/src/data/seedData.ts" src/data/seedData.ts; rm -f .env.local
VITE_HOP_V4=on VITE_CARNET_IA=production npm run build > "$S/t4-build.log" 2>&1 || { tail -20 "$S/t3-build.log"; rm -f .env; exit 1; }
node scripts/check-firebase-config.mjs dist/assets && node scripts/check-no-dev-auth.mjs dist && node scripts/garder-morceaux.mjs dist | tail -2
node scripts/check-build-flags.mjs dist 2>&1 | tail -2 || true
npx tsc --noEmit > "$S/t4-tsc.log" 2>&1 || { tail -15 "$S/t4-tsc.log"; echo TYPES KO; rm -f .env; exit 1; }; echo TYPES OK
npx vitest run tests/unit/proprietes > "$S/t4-regles.log" 2>&1 || { tail -20 "$S/t4-regles.log"; echo REGLES KO; rm -f .env; exit 1; }; echo REGLES OK
rm -f .env; echo "W=$W"; [ -n "$DEPLOYER" ] || { echo "PRET, NON DEPLOYE"; exit 0; }
npx firebase deploy --only hosting --project brasserie-l-affinee --non-interactive 2>&1 | grep -E "Deploy complete|Error|release" | head -4
cd "$P"; T=en-ligne/2026-11-23-tour45
git tag -a $T $H -m "Tour 45 du 24.11 en ligne"  # tag local seulement : dépôt public, captures de l app réelle (24.11)
curl -s https://brasserie-l-affinee.web.app/ | grep -o 'assets/index-[^"]*\.js' | head -1; grep -o 'assets/index-[^"]*\.js' "$W/dist/index.html" | head -1
echo FINI
