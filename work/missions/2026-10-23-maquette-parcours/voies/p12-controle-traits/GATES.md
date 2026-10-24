# Gates: voie p12-controle-traits — le contrôle D110 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/traits-*/**, work/missions/2026-10-23-maquette-parcours/voies/p12-controle-traits/RESULTAT.md

Scope: un contrôle joué qui exige que les traits de q2b restent muets au repos et disent, au toucher, leur famille et leur valeur près du picto ; il échoue sur la version publiée (d332792c).

- [x] G1: le contrôle échoue sur la construction rejetée d332792c (rien au toucher)
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=76938d2b3a1e003840eca72356276744e511cab992a0a67f50065200ccd71cef; exit=0; EXPECT=matched; output-sha256=0ef1a7d764be1de94d163ccb6921d877b1c6e87fa48d8b3e29f6c056b83c61ee; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin positif passe, aux deux largeurs
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-ok
  EXPECT: TRAITS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=231e4b0e9e14d7a516802d1ba0a117065cc9bcead0bfc09b3e059bffbd1f5799; exit=0; EXPECT=matched; output-sha256=597e372a35c6491407ee48afe437c0203748946b8c397da4d2abc11d5f7df3c9; output-bytes=938; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les traits muets au toucher échouent
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-muets
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=57116ee630f5a1c2c84902024231f1a781db344fdfe80672badd715496cdb48c; exit=0; EXPECT=matched; output-sha256=0ef1a7d764be1de94d163ccb6921d877b1c6e87fa48d8b3e29f6c056b83c61ee; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le sens écrit en permanence échoue (cockpit)
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-bavards
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c3f6261bd212b8a5389651147ea11f8182ef57cb912c7a38ea879b5795b5d20b; exit=0; EXPECT=matched; output-sha256=0ef1a7d764be1de94d163ccb6921d877b1c6e87fa48d8b3e29f6c056b83c61ee; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: une feuille qui couvre l'écran échoue
  CHECK: node scripts/agents/systeme.mjs echoue "TRAITS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs work/refonte-frontend/v4/tournoi/outils/temoins/traits-feuille
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=866e17c94633cc4babafbf64ff33cab121fe872ec03b37b82d48d3390a404a95; exit=0; EXPECT=matched; output-sha256=0ef1a7d764be1de94d163ccb6921d877b1c6e87fa48d8b3e29f6c056b83c61ee; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: D110 est dans la portée des défauts, gardé, sur Suggérer
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D110');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!d.portee.includes('suggerer')||d.script!=='controle-traits.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5a1a0caf68fa49017a8e495d27875076656634c4744296be0b73bae7413aba99; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p12-controle-traits/RESULTAT.md --contient "d332792c,traits-ok,traits-muets,traits-bavards,traits-feuille"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d3d5509317a18a4f936bc90b01b4e408b40f2e2ed0e71e9ce5d6e20c5961b7bb; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
