# Gates: voie p2-correctifs — le port d'Identité garde r4-a aussi quand il touche

OWNS: src/pages/BrewWizard.tsx, src/pages/recipe-wizard.css, src/ui/identite/, tests/unit/identite/, work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/

Scope: les 11 écarts de critique/VERDICT-port.md, corrigés dans l'app ; r4-a telle quelle, à 390 et à 1280.

- [x] G1: l'app se construit
  CHECK: npm run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=46d72eccd628b28a4b0e974e69890ad856bb5d28a16876531804fc540a571513; exit=0; EXPECT=matched; output-sha256=39e92937acf1f894b236cf746f29cb171fc1a33818c0c752a93c0e65169c02c2; output-bytes=47234; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests de l'étape Identité passent
  CHECK: npx vitest run tests/unit/identite --maxWorkers=2 && echo TESTS IDENTITE OK
  EXPECT: TESTS IDENTITE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fc99be0d6e73595b63f5315b93ef31e23a4d1c60e2ae415cea9490edf30f9ac5; exit=0; EXPECT=matched; output-sha256=be620723bcd459f28115326808e71291fe8411af2438c3bf1aae09386ab13db2; output-bytes=1370; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G3: la série Chrome passe, avec les contrôles des écarts
  CHECK: node scripts/with_server.mjs --server "npm run dev -- --port 5613 --strictPort" --port 5613 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/capturer-identite.mjs --sortie=work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/captures/r3
  EXPECT: IDENTITE OK
  EVIDENCE: pending

- [x] G4: les contrôles ajoutés ont échoué avant la correction, et le résultat le dit
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/RESULTAT.md --contient "TEMOIN AVANT : IDENTITE ECHEC,baseline,Rien ne se perd"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3e4cf725b2bc26cb5eb120b54eb1f6580144afa3a8f9c7d19325afc997c0464e; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le registre des choix de l'app reste valide
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs --registre --registre=work/refonte-frontend/v4/choix/ecrans-app.json
  EXPECT: REGISTRE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6af4d5a8af53626e316498d70882c353ba359b1c1b0f6cdf462b627b42cc7a3; exit=0; EXPECT=matched; output-sha256=c7c48a987a2f8140c35b57c3b18fa00af4a3022ccbf58f1d48f8a519438689ea; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
