# Gates: voie r0c-inventaire-controles — l'inventaire de ce qu'il a aimé, D104 et D101 ter

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json, work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs, work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/reprise-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/planche-r4c-refusee.html, work/refonte-frontend/v4/tournoi/outils/temoins/planche-ter-ok.html, work/missions/2026-10-22-reprise-lot21/voies/r0c-inventaire-controles/RESULTAT.md

Scope: l'inventaire des éléments notés bon ou intéressant (citations mot pour mot de SPEC), le contrôle de reprise D104 et l'option --ter de la planche de picto (D101 ter), chacun avec ses témoins.

- [x] G1: chaque élément de l'inventaire est complet, sa citation se retrouve mot pour mot dans SPEC et sa capture existe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs --inventaire
  EXPECT: /INVENTAIRE OK \(\d+ éléments/
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8b9ad085e3322b3be9a8744acf0abfedd1faa9ba915b3673d2e859c89f136b0; exit=0; EXPECT=matched; output-sha256=71f45b167e2d9c99502093a4ac9fcdd36941b2dfde178ba8e2437afca9804297; output-bytes=44; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: l'inventaire couvre les variantes qu'il a nommées, y1b d'abord (4 éléments au moins) et l5b avec ses pistes
  CHECK: node -e "const e=(require('./work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json').elements||[]); const v=new Set(e.map(x=>x.variante)); const m=['y1b','v1','w2','y3','l5b','l8','s5','a2b','x3b','l5f','g1'].filter(r=>!v.has(r)); if(!e.some(x=>/m4|h4/.test(x.variante))) m.push('m4/h4'); if(!e.some(x=>/cryo/i.test(x.variante+' '+x.quoi))) m.push('Citra cryo'); if(!e.some(x=>/variante 3/.test(x.mots))) m.push('variante 3'); if(e.filter(x=>x.variante==='y1b').length<4) m.push('y1b moins de 4'); if(e.filter(x=>x.variante==='l5b').length<2) m.push('l5b moins de 2'); console.log(m.length?'COUVERTURE ECHEC '+m.join(', '):'COUVERTURE OK ('+e.length+' elements)'); process.exit(m.length?1:0)"
  EXPECT: COUVERTURE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=53bc1cb82b16d275c1c549b9a86be110233d10f2efffc4b0b05e2152027ed351; exit=0; EXPECT=matched; output-sha256=3ec5950a1d2ad3340d6d8d69eba151b5da4564c8e5b6de1e9ca681d0717fd0e2; output-bytes=28; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: D104, la copie de r6a actuelle échoue (témoin versionné)
  CHECK: node scripts/agents/systeme.mjs echoue "REPRISE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/tournoi/outils/temoins reprise-r6a --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5731b5a7a0178a6059783aca7482a43a5811a13e4b0d65e3124dc47c5db29db7; exit=0; EXPECT=matched; output-sha256=a5665925704bd281d890f6b2254e083beeee2e0c1f0ade5610d7e7d74511bf09; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: D104, r6a actuelle échoue elle-même
  CHECK: node scripts/agents/systeme.mjs echoue "REPRISE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6a --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=56c2798a59ea92e42480833b8f08c2c9ca1904f1cf8d28e71dfbb440c41af1ef; exit=0; EXPECT=matched; output-sha256=a5665925704bd281d890f6b2254e083beeee2e0c1f0ade5610d7e7d74511bf09; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D104, le témoin positif passe (un élément à un toucher)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/tournoi/outils/temoins reprise-ok --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e7b096b561c2eef20e3fc2a937c79f7ce95105ca40c30c15c087a497b47bd24f; exit=0; EXPECT=matched; output-sha256=67b762effe35f91f492330fbae347b041d014a1e221b3bf955f53a92ba36d0e7; output-bytes=1543; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: D104, le même témoin échoue au premier écran strict
  CHECK: node scripts/agents/systeme.mjs echoue "REPRISE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/tournoi/outils/temoins reprise-ok --page=etat.html --premier-ecran
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c5af26c0b15a3affdefb91116cd43d1972cbcc47cb740994d6cc05266baca778; exit=0; EXPECT=matched; output-sha256=a5665925704bd281d890f6b2254e083beeee2e0c1f0ade5610d7e7d74511bf09; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: D104, un écart sans raison échoue
  CHECK: node scripts/agents/systeme.mjs echoue "REPRISE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/tournoi/outils/temoins reprise-sans-raison --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3f96e5e0ee628dc43bddf4e1a497270c366d0801ac76cc54b59dcc866a0890b3; exit=0; EXPECT=matched; output-sha256=a5665925704bd281d890f6b2254e083beeee2e0c1f0ade5610d7e7d74511bf09; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: D101 ter, la copie de la planche r4c échoue
  CHECK: node scripts/agents/systeme.mjs echoue "PLANCHE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/tournoi/outils/temoins/planche-r4c-refusee.html --ter
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1a69afaaae714bb0b68a432feecd1ed6920bff34edd35339682f48f6be9ace0e; exit=0; EXPECT=matched; output-sha256=cf62c07fa70dd0c05de0082955e865f17933def754e4b08104b6faa08ce617d2; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: D101 ter, la planche r4c elle-même échoue
  CHECK: node scripts/agents/systeme.mjs echoue "PLANCHE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/planche/etat.html --ter
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f348c0f3466699751c7ca9c1028881e4118aa7a18ec986a6ab69cde22a8d90ac; exit=0; EXPECT=matched; output-sha256=cf62c07fa70dd0c05de0082955e865f17933def754e4b08104b6faa08ce617d2; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: D101 ter, les dessins de r4 (cannelle et vanille compris) restent refusés
  CHECK: node scripts/agents/systeme.mjs echoue "PLANCHE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/tournoi/outils/temoins/planche-r4-refusee.html --ter
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=51f2c7fce0e6f25b478b3e7bf2fb50d4399860ae127c017cc11e13b292025053; exit=0; EXPECT=matched; output-sha256=cf62c07fa70dd0c05de0082955e865f17933def754e4b08104b6faa08ce617d2; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: D101 ter, le témoin positif passe (8 propositions, 6 genres)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/tournoi/outils/temoins/planche-ter-ok.html --ter
  EXPECT: /PLANCHE OK \((8|9|1\d) variantes/
  EVIDENCE: automatic-evidence=v1; definition-sha256=20b678ae3114bd3275d0b6523b256a729470ba6d7e582b2a53ccb830e47e98a7; exit=0; EXPECT=matched; output-sha256=308127e9c77799e8bea382ff5c4690afcfca2cd27201c590a90140d5880e125a; output-bytes=575; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: sans --ter, rien ne change : r4c passe toujours son ancien critère
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/planche/etat.html --refuses --genres=2 --nombre=3-5 --voisins=herbal,green
  EXPECT: /PLANCHE OK \([345] variantes\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=fb7edbc35daaf336efab9d55281d9770f2b288d31f5eeb994a975c82de1f470f; exit=0; EXPECT=matched; output-sha256=c5b06771587d3c0a2ceea7fda644bb865ba7e43b02f4e64dc40839aeb95d55ed; output-bytes=283; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: le rapport donne l'inventaire et ses propositions
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r0c-inventaire-controles/RESULTAT.md --contient "INVENTAIRE OK,REPRISE OK,y1b,CONNAISSANCE,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=611194727d6c98dda6c7dc5aa7f10980ee4eaa6a1cc7c4d7066026fcc7a47bff; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
