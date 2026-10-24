# Gates: voie d131-phz — les pictos hors 16D, série phz

OWNS: work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/phz[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/captures/phz*, work/missions/2026-10-23-maquette-parcours/voies/d131-phz/RESULTAT.md

Scope: quatre jeux de quinze pictos et du picto « en plus », au trait, chacun montré en version courte et textuelle dans deux vraies cartes, avec légende et mot précis.

- [x] G1: chaque jeu a sa page, ses quinze pictos et le picto « en plus », sa légende, son mot précis, sa NOTE et ses deux captures
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/outils/jeux.mjs phz1 phz2 phz3 phz4
  EXPECT: JEUX-BIEN-4
  EVIDENCE: automatic-evidence=v1; definition-sha256=81d7590226356810314beb341acc1dd453d58113397e161b66b5f3362dbfe913; exit=0; EXPECT=matched; output-sha256=3eee4d2551f7eb629d0d935acc9fcbb8a955042713bfe0ed2e2e5fa61424a58d; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d phz1 phz2 phz3 phz4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9b23b2f6a46ed98b6791911eb54563f426ea606157844d40942e6b41fcd4370b; exit=0; EXPECT=matched; output-sha256=ae96c6b9dc4125c6f1877bbaf0bb90cb62819f9ef171d2934852b7201b6d3872; output-bytes=185; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
