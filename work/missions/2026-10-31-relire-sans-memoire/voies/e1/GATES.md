# Gates: voie e1 — rapport d'écart des docs des finances

OWNS: work/missions/2026-10-31-ecran-depense/ecarts/, work/missions/2026-10-31-relire-sans-memoire/voies/e1/RESULTAT.md

Scope: le rapport d'écart (sens) des cinq docs des finances contre le code, sans rien corriger.

- [x] G1: le rapport a une section par document
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/ecarts/2026-10-31-finances.md --contient "## docs/finances.md,## docs/gemini-budget.md,## docs/finance-verification.md,## docs/financial-sync.md,## docs/expense-vision-evaluation.md"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=77d059fec3edd4763c723403d342a9069e17c034637e5360240d30d8ba225157; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque écart porte sa ligne de doc, sa ligne de code (sauf absent) et sa classe
  CHECK: node -e "const s=require('fs').readFileSync('work/missions/2026-10-31-ecran-depense/ecarts/2026-10-31-finances.md','utf8');const C=['absent','incomplet','figé','autre architecture','non documenté'];const l=s.split('\n').filter(x=>/^- /.test(x));const bad=l.filter(x=>!(/\.md:\d+/.test(x)&&(x.includes('absent')||/(src|functions|scripts|tests)\/\S+:\d+/.test(x))&&C.some(c=>x.includes(c))));console.log(l.length&&!bad.length?'FORMAT OK '+l.length:'FORMAT ECHEC '+bad.length+'/'+l.length);process.exit(l.length&&!bad.length?0:1)"
  EXPECT: FORMAT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6ef385d82822ca69459ec426e934273c06a277319f65e18a6b81e0b1e0cb3ae3; exit=0; EXPECT=matched; output-sha256=191a6b0dc1e393a301b8f85a807dfc1bee83a30021c4dbc939fe902cab6360f8; output-bytes=13; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
