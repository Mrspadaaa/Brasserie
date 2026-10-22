# Gates: voie b-nelson-sauvin — pourquoi Nelson Sauvin paraît ordinaire

OWNS: cerveau/metier/descripteurs-hors-familles.md, work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/ANNEXE.md, work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/RESULTAT.md

Scope: une note du cerveau qui prouve la cause et chiffre deux ou trois corrections.

- [x] G1: la note a ses quatre parties et cite les cinq houblons et les deux fichiers de données
  CHECK: node scripts/agents/systeme.mjs note cerveau/metier/descripteurs-hors-familles.md --exiger "Constat,Cause,Preuves,Options" --contient "Nelson Sauvin,Motueka,Citra,Saaz,Galaxy,correspondance-familles.json,pack-fiches.json"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=97cc54582cee19b0d13a1e39ec6bea2f39eeb8cc470120d39d5a14a0480a989d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la note est au format du cerveau et ses liens sont résolus
  CHECK: node scripts/agents/systeme.mjs cerveau --voie --min-notes 3 --min-lecons 12 --fichiers cerveau/metier/descripteurs-hors-familles.md
  EXPECT: CERVEAU OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a124b340a693bc205d365623d9a82eb2abdaa1e23a8facfb882edf9bb8d51182; exit=0; EXPECT=matched; output-sha256=1112ef12d1af23fdc6610bab9d717a713d249e70aeb86a666bcfa141bad8052d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'annexe garde les mesures complètes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-essai-voies/voies/b-nelson-sauvin/ANNEXE.md --contient "Nelson Sauvin,Motueka,sans famille"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=310369ebd3f3cc213166ff724cd6cd1a5fdb263134742e0dac946463fd3e5748; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
