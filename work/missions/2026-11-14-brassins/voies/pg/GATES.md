# Gates: voie pg — Page de choix

OWNS: work/missions/2026-11-14-brassins/page/, work/missions/2026-11-14-brassins/voies/pg/

Scope: page de choix lisible, PAGE OK.

- [ ] G1: la page passe le contrôle de lisibilité
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg/verif
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G2: les 19 variantes et le choix en tête
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-brassins/page/index.html','utf8');const ids=['s1e2','s1g','s2a2','s3b2',...['s1','s2','s3'].flatMap(s=>'abcde'.split('').map(l=>s+l))];console.log(ids.every(i=>t.includes(i))&&t.includes('id=\"a-choisir\"')&&!/fable/i.test(t)?'CONTENU OK':'CONTENU KO')"
  EXPECT: CONTENU OK
  EVIDENCE: pending
