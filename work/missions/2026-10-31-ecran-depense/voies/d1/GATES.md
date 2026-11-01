# Gates: voie d1 — diagnostic lecture, champs, stock, incertitude

OWNS: work/missions/2026-10-31-ecran-depense/diagnostic/d1/, work/missions/2026-10-31-ecran-depense/voies/d1/RESULTAT.md

Scope: le diagnostic prouvé de la lecture d'une facture et de ses liens au stock, et la vérité de sa facture en fixture.

- [x] G1: le diagnostic répond aux cinq questions et classe chaque défaut
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/diagnostic/d1/DIAGNOSTIC.md --contient "Le chemin d'une lecture,Les champs,La cohérence,Les liens au stock,L'incertitude,inachevé récupérable,86,50"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=31b3a0cd842079db9b49008fdbdf602535ced32b60c13f77e956d559dfe91e2f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la vérité de sa facture a ses 23 lignes et son total
  CHECK: node -e "const v=require('./work/missions/2026-10-31-ecran-depense/diagnostic/d1/verite-facture-372765.json');const l=v.lignes||v.lines;const s=l.reduce((a,x)=>a+Number(x.montant??x.amount),0);console.log(l.length===23&&Math.abs(s-86.5)<0.001?'VERITE OK':'VERITE ECHEC '+l.length+' '+s)"
  EXPECT: VERITE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=909dd5d2554b7cb837c84b90db22c9fd1292b2cfbf8aaddb9575cc593898f241; exit=0; EXPECT=matched; output-sha256=36832d9b437404ba44815796663df6d946dbce77add488fdd70fe124184676f6; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la lecture simulée est un JSON valide
  CHECK: node -e "JSON.parse(require('fs').readFileSync('work/missions/2026-10-31-ecran-depense/diagnostic/d1/lecture-simulee-372765.json','utf8'));console.log('SIMULEE OK')"
  EXPECT: SIMULEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b718d88dd996a6bf400af5687821e1be03afeb5f0117875f93487d54c0c93bc0; exit=0; EXPECT=matched; output-sha256=900d5860c29315bcc37de9ab758067b3f40818e88f41116e202c292a253e267a; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
