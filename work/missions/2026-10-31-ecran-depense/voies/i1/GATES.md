# Gates: voie i1 — inventaire et captures

OWNS: work/missions/2026-10-31-ecran-depense/inventaire/, work/missions/2026-10-31-ecran-depense/voies/i1/RESULTAT.md

Scope: l'inventaire de l'écran actuel et ses captures sur les fixtures.

- [x] G1: l'inventaire couvre la fiche, les articles et les trois onglets
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/inventaire/inventaire-depense.md --contient "Nouvelle dépense,Articles,Entrées,Prévision,Tout,ExpenseSheet.tsx"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=849919e815b26c9cc696b32d0108cbddc6fd8cb0791bfd2603273afd31728864; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au moins huit captures existent
  CHECK: node -e "const n=require('fs').readdirSync('work/missions/2026-10-31-ecran-depense/inventaire',{recursive:true}).filter(f=>String(f).endsWith('.png')).length; console.log(n>=8?'CAPTURES OK '+n:'CAPTURES ECHEC '+n); process.exit(n>=8?0:1)"
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=33b6a9433ac76fcd27e9d44f733c957a78eb1b3be91a9fb688ae1e79bb2e98cc; exit=0; EXPECT=matched; output-sha256=5eea6f8e99ca895ca766fc810216d6067cb2212b6d371c2f2f23a0d5f8319069; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
