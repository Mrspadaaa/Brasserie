# Gates: voie d131-pha — les pictos hors 16D, série pha

OWNS: work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/pha[1-4]/**, work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/captures/pha*, work/missions/2026-10-23-maquette-parcours/voies/d131-pha/RESULTAT.md

Scope: quatre jeux de quinze pictos et du picto « en plus », au trait, chacun montré en version courte et textuelle dans deux vraies cartes, avec légende et mot précis.

- [x] G1: chaque jeu a sa page, ses quinze pictos et le picto « en plus », sa légende, son mot précis, sa NOTE et ses deux captures
  CHECK: node work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/outils/jeux.mjs pha1 pha2 pha3 pha4
  EXPECT: JEUX-BIEN-4
  EVIDENCE: automatic-evidence=v1; definition-sha256=f90f9b3823f3d76e7e292fa6dc1c17aa8f8a93291d60e72a60bbe7ac9ecabeab; exit=0; EXPECT=matched; output-sha256=3eee4d2551f7eb629d0d935acc9fcbb8a955042713bfe0ed2e2e5fa61424a58d; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au trait, sans halo (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d pha1 pha2 pha3 pha4 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d111ee3c6cbe5a91cf5bdb2bd2e506ae6a15f67894c6c21eb174f3935f9183cd; exit=0; EXPECT=matched; output-sha256=ba6f81b3e9ad67eb5177077f8cc88e4257f0854755b2abb278031fede052a5f0; output-bytes=185; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
