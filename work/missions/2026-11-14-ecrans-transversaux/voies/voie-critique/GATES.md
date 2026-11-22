# Gates: voie voie-critique — tri des 16 mini maquettes v0

OWNS: work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/

Scope: verdict par variante, classement, 4 candidates (une par série) avec greffes, mesure du panel.

- [x] G1: SYNTHESE.md porte 16 verdicts et une section Candidates
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/SYNTHESE.md','utf8');const n=(t.match(/\b(ACCEPT|REJET)\b/g)||[]).length;console.log(n>=16&&/Candidates/.test(t)?'SYNTHESE OK':'SYNTHESE ECHEC '+n)"
  EXPECT: SYNTHESE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c7e061e05de2510917d73fe4df359eac7bca0ab2090a0fe3d2952bb6af6752bf; exit=0; EXPECT=matched; output-sha256=a1b29a7f730f0385d9f1055decc6a71c1d88fae39bdca1a790df6606b3128e55; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=94f72da44b45/28 entries

- [x] G2: le panel est mesuré et sa sortie écrite
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-11-14-ecrans-transversaux/voies/voie-critique/panel.txt','utf8');console.log(/PANEL (OK|ECHEC)/.test(t)?'PANEL MESURE':'PANEL ABSENT')"
  EXPECT: PANEL MESURE
  EVIDENCE: automatic-evidence=v1; definition-sha256=33c124ea5bdbb7efd9b2295911821ca1f7a5c1dc2b736b33ad05ed918f0b0063; exit=0; EXPECT=matched; output-sha256=3ea58aff281351988733c6c24d5119df40e1e4750e802baea95942f4115f5c1a; output-bytes=13; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=94f72da44b45/28 entries
