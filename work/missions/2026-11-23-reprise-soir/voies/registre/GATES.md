# Gates: voie registre — 30 lignes revérifiées

OWNS: work/missions/BUGS.md

Scope: BL-4..15, GH-1..4, CALP-1..14 datés du 23.11

- [ ] G1: registre cohérent
  CHECK: node scripts/agents/controle-bugs.mjs 2>&1 | tail -2
  EXPECT: BUGS OK
  EVIDENCE: pending

- [ ] G2: 30 lignes datées 23.11
  CHECK: grep -E '^\| (BL-([4-9]|1[0-5])|GH-[1-4]|CALP-([1-9]|1[0-4])) ' work/missions/BUGS.md | grep -c '23\.11' | awk '$1>=30{print "DATES OK"}'
  EXPECT: DATES OK
  EVIDENCE: pending
