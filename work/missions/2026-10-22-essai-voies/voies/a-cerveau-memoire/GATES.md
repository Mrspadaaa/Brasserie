# Gates: voie a-cerveau-memoire — verser la mémoire locale dans le cerveau

OWNS: cerveau/brasseur/**, cerveau/agents/**, cerveau/sources/**, cerveau/metier/modele-brassage.md, cerveau/metier/chimie-eau.md, cerveau/produit/saisie-mobile.md, cerveau/produit/import-recette.md, cerveau/produit/export-et-ia.md, cerveau/produit/design-system-historique.md, cerveau/produit/socle-v01.md, cerveau/produit/page-partagee.md, work/missions/2026-10-22-essai-voies/voies/a-cerveau-memoire/RESULTAT.md

Scope: les 24 notes de destination existent, au format du cerveau, liens résolus.

- [x] G1: les 24 destinations existent
  CHECK: node scripts/agents/systeme.mjs existent cerveau/brasseur/penser-brasseur.md cerveau/brasseur/le-brasseur-choisit.md cerveau/brasseur/pas-de-cockpit.md cerveau/brasseur/rien-de-fige.md cerveau/brasseur/fil-de-fer-d-abord.md cerveau/brasseur/methode-ui-v3.md cerveau/brasseur/exploration-v0-libre.md cerveau/brasseur/micro-correctifs.md cerveau/metier/modele-brassage.md cerveau/metier/chimie-eau.md cerveau/produit/saisie-mobile.md cerveau/produit/import-recette.md cerveau/produit/export-et-ia.md cerveau/produit/design-system-historique.md cerveau/produit/socle-v01.md cerveau/produit/page-partagee.md cerveau/sources/moneaudebrassage.md cerveau/agents/agents-sans-openai.md cerveau/agents/autonomie-decisions.md cerveau/agents/fermeture-et-quota.md cerveau/agents/gemini-tests-reels.md cerveau/agents/verification-locale.md cerveau/agents/poste-windows-msix.md cerveau/agents/monkey-testing.md
  EXPECT: EXISTENT OK 24
  EVIDENCE: automatic-evidence=v1; definition-sha256=bbaa5ce993e26fd3bb449b2d87e4d5b791b637ecd6e3fbd60058c5f1ace441a8; exit=0; EXPECT=matched; output-sha256=4965c6bc9c011d4e4d516ff57cc853df5bd075e157f125feb1b87fe54a9bb798; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque note versée a son en-tête complet, 50 lignes au plus, et des liens résolus
  CHECK: node scripts/agents/systeme.mjs cerveau --voie --min-notes 26 --min-lecons 12 --fichiers cerveau/brasseur/,cerveau/agents/,cerveau/sources/,cerveau/metier/modele-brassage.md,cerveau/metier/chimie-eau.md,cerveau/produit/saisie-mobile.md,cerveau/produit/import-recette.md,cerveau/produit/export-et-ia.md,cerveau/produit/design-system-historique.md,cerveau/produit/socle-v01.md,cerveau/produit/page-partagee.md
  EXPECT: CERVEAU OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=27d3e17bd8e9701cdc555839969a401cd69db29ecf51ca1fd85706342114d2ab; exit=0; EXPECT=matched; output-sha256=1112ef12d1af23fdc6610bab9d717a713d249e70aeb86a666bcfa141bad8052d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la note du brasseur garde ses mots exacts
  CHECK: node scripts/agents/systeme.mjs note cerveau/brasseur/penser-brasseur.md --contient "trop centré sur le ibu,Toujours pensé comme un brasseur"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=34081638b8d464625f070856403037214d731e13d3ab4023a716b7f1251c311f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
