# Gates: voie t2-performance — mesurer la maquette comme sur un téléphone

OWNS: work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/perf-*, work/missions/2026-10-23-theme-performance/voies/t2-performance

Scope: mesure-performance.mjs, ses témoins, joué sur la maquette construite ; optimisations classées par gain mesuré.

- [x] G1: le témoin rapide passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs work/refonte-frontend/v4/tournoi/outils/temoins perf-rapide --page=etat.html
  EXPECT: PERF OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=cbf458b3f8f2cb53d0a853ae4765bec19052692ba9bd38ed2e94c20b32cd5cb0; exit=0; EXPECT=matched; output-sha256=0fd47b3574ee3a116327ba0d34ff089a04181b65b0632a90818156c2070d64c3; output-bytes=1260; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: un toucher qui bloque le fil 300 ms échoue par « toucher »
  CHECK: node scripts/agents/systeme.mjs echoue toucher -- node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs work/refonte-frontend/v4/tournoi/outils/temoins perf-lent --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=79c0fd6df32cca1b742f3c50c563e067b4d5de3b81f6f18960d9886b253f3b2c; exit=0; EXPECT=matched; output-sha256=74d2b0be848049c6817dfcce0baca7a14464d2c8deabe20a5c97ed45b0d610b1; output-bytes=28; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: joué sur la maquette à ×4, il rend ses mesures sans planter
  CHECK: node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs prototypes/houblons-v4/maquettes/parcours ma-biere suggerer comparer dryhopper --page=etat.html --cpu=4
  EXPECT: /ma-biere · [\s\S]*dryhopper · [\s\S]*VERDICT (OK|ECHEC)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=c4070246622a9a17f4a8d4a02f1bb64d82eaa5d37ee4a4692f0101a89682669f; exit=0; EXPECT=matched; output-sha256=2efb6607fd1790fd1ec2882548d0e2a7b77b99526426740eaad68672501179dc; output-bytes=7256; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les mesures et les optimisations classées sont écrites
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md --exiger "Mesures,Optimisations" --contient "×4,×6,gzip"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f4f8cd9a509f19b9cd55de5908897036589539277d942baabf1f0a9c31da261f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5713fcbe8de744cefb76370244175b1a2dda328c030386acddcf0e090d0c4911; exit=0; EXPECT=matched; output-sha256=5ec18eb46548cd9619d98ce192a9c22635986ec66e4b705f9f65c00c6d173416; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
