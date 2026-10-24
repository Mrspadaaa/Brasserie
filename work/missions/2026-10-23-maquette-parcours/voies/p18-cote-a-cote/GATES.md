# Gates: voie p18-cote-a-cote — l'outil de captures et la page côte à côte

OWNS: prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs, work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/**, work/missions/2026-10-23-maquette-parcours/voies/p18-cote-a-cote/RESULTAT.md

Scope: un outil qui capture sa base et la maquette aux mêmes états (douze), et la page qui les montre côte à côte, lisible au téléphone.

- [x] G1: l'outil produit les douze états des deux côtés sur la construction commune (dans un dossier d'essai, jamais dans les images de la page publiée)
  CHECK: node -e "const r=require('child_process').spawnSync(process.execPath,['prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs','prototypes/houblons-v4/maquettes/parcours','--sortie=prototypes/houblons-v4/maquettes/cote-a-cote-essai'],{encoding:'utf8',timeout:900000});const e=JSON.parse(require('fs').readFileSync('prototypes/houblons-v4/maquettes/cote-a-cote-essai/etats.json','utf8'));const n=(e.etats||e).length;const fs=require('fs');const ok=n>=12&&(e.etats||e).every(x=>fs.existsSync('prototypes/houblons-v4/maquettes/cote-a-cote-essai/'+x.nom+'-maquette.png'));console.log(ok?'COTE-A-COTE OK '+n:'COTE-A-COTE ECHEC '+n+' '+(r.stdout||'').slice(-300));process.exit(ok?0:1)"
  EXPECT: COTE-A-COTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2931b6a62efa154346975985d758e230615ca01220a007bce92f2a5fb83f6f5e; exit=0; EXPECT=matched; output-sha256=c44d65954409f33d16347d9778dcf86d81b564450e66c25361f9635f8d692224; output-bytes=18; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la page est lisible (PUBLIER.md)
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html --page-lot
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=351ddbc0bc430adb944f586f46bf73b697b462bef7227085296618eac20f6cd3; exit=0; EXPECT=matched; output-sha256=0228489e77aa35f83239cd1ba676c84c806ae1e5a72a526476660569746a8cca; output-bytes=70; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page nomme chaque état et les défauts qu'il touche
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/outils/pages/2026-10-24-cote-a-cote/index.html --contient "a-choisir,D107,D108,D110,D111,D115,D116,D117,D119,D120,D121,etape-glisser-base.png,comparer-maquette.png"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8a5e71c2c9a1e8760470221bd907864077162658184789441704f01e19eef439; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le rapport nomme les captures ouvertes et ce qui ne se joue pas
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p18-cote-a-cote/RESULTAT.md --contient "etats.json,ouvert,390"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=acbe398e2cba817552d9f1d47c14c28f139c80e7ff31f24eab1abf0cd3cba58f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
