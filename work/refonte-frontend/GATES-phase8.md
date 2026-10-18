# Gates: phases 7 et 8 — visuels, critique indépendante, prototype houblons

OWNS: prototypes/houblons/**, scripts/check-hop-prototype.mjs, scripts/hop-one-tap/prototype.mjs, work/refonte-frontend/**

Scope: prototype autonome hors de l'app, sur les vraies données houblons du dépôt et le stock de production ; tous les critères du § 6 du brief mesurés ; critique UX à l'aveugle par une session Fable intégrée ; page privée publiée pour la porte B.

- [x] G0: ce registre de critères énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/GATES-phase8.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2590bd12f59758d072a3ae967ab89dcf00901786e75e1b5130e1ac357659673c; exit=0; EXPECT=matched; output-sha256=90818ad13686c65060bde387012605071c45bbccfd6415556f48ea5523a7ecfa; output-bytes=512; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: le prototype se reconstruit depuis les données du dépôt (318 variétés, stock relié)
  CHECK: node prototypes/houblons/build-data.mjs
  EXPECT: DATA OK 318 variétés
  EVIDENCE: automatic-evidence=v1; definition-sha256=80f6facc581007ce7349a2ff98596c74ab57914d5dd018d798cc0c1f322fc158; exit=0; EXPECT=matched; output-sha256=0fd1831db4f84aa70855ef05bb75d7ad721aa0497132b1772ed681717f7c0d19; output-bytes=99; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: stout, 390 × 844 : au moins 5 houblons du stock visibles avec leur quantité en 0 ou 1 toucher
  CHECK: node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/prototype.mjs
  EXPECT: ONE-TAP OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2add400d16f6fa78e6da34a6654f0bb56b23517a25f98fb5665a5eccb3938901; exit=0; EXPECT=matched; output-sha256=e62408b21b2ee383006c1123d6181359d9409652f995e78379ab3951807066c3; output-bytes=210; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: règles d'utilisabilité tenues à 390 × 844 (U1, U4, U5, U6, saisie, cibles, contraste)
  CHECK: node scripts/check-hop-ux-rules.mjs --adapter scripts/hop-one-tap/prototype.mjs
  EXPECT: UX-RULES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c19a2e023a3f9ff36d521d3e8d3c521dd3a8da733c9a255a95ae280774584ed7; exit=0; EXPECT=matched; output-sha256=d03c6fef71327780fce7669d7d3d519105eca9e7e05d9dfba9d92dd571141d18; output-bytes=36; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: règles d'utilisabilité tenues à 1280 × 800
  CHECK: node scripts/check-hop-ux-rules.mjs --adapter scripts/hop-one-tap/prototype.mjs --width 1280 --height 800
  EXPECT: UX-RULES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f248d79574848f4db6a812d046c3eaa9f0bfc28e3a43276a054a4bb245c7f0e3; exit=0; EXPECT=matched; output-sha256=d03c6fef71327780fce7669d7d3d519105eca9e7e05d9dfba9d92dd571141d18; output-bytes=36; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: classement visible en moins d'1 s au processeur bridé × 4 et tas sous 120 Mo
  CHECK: node scripts/check-hop-budget.mjs --adapter scripts/hop-one-tap/prototype.mjs
  EXPECT: BUDGET OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9c0488890020c7ebe1cd10aea2ee308c55d8ea025569c8a1806b62ed944ef01a; exit=0; EXPECT=matched; output-sha256=2b8df5e019ae9ce777ba5648b11e118571071a57d924689e0016f160240fae27; output-bytes=121; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: la page complète tient le budget de démarrage B1 (350 ko compressés)
  CHECK: node -e "const n=require('zlib').gzipSync(require('fs').readFileSync('prototypes/houblons/index.html')).length;console.log(n<=350000?'SIZE OK '+n:'SIZE FAIL '+n);process.exitCode=n<=350000?0:1"
  EXPECT: SIZE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6b93c908a6e30d5e626cd7e84d9b021f284f75bdc9cb362958dac251a865f3b5; exit=0; EXPECT=matched; output-sha256=14dc6e70bc463268caeebd308a265e341b261d769c23940ecccab93328f4461e; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: gestes joués : choisir en 1 toucher, simulation en moins d'1 s, comparer 2 en 3 touchers au plus et les 4 premiers en 1, remplacer en 2, 30 questions avec réponse ou « non documenté », aucun défilement horizontal, aucune erreur, aucun type=number
  CHECK: node scripts/check-hop-prototype.mjs
  EXPECT: PROTOTYPE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f5eb280df5cf2beecbb40f78f3307ec5b22b5d0068a29b5db3a22d384280aeb0; exit=0; EXPECT=matched; output-sha256=712add912bf38528a3222426257802eb91f360ed9587fb0ec74ef0f361d75e0d; output-bytes=1664; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: relecture Opus et critique indépendante : captures 390 et 1280 regardées ; verdict Fable rendu sans le rapport de l'auteur ; chaque bloquant du verdict corrigé et revérifié, ou noté comme écart à trancher à la porte B ; page privée republiée
  EVIDENCE: Opus 18.10 05:00 — verdict `work/refonte-frontend/phase7/ux-verdict-fable.md` (session Fable 5.1, brief sans rapport de l'auteur, 25 captures). 5 bloquants corrigés et revérifiés : B1 classement non crédible → groupes sans rang chiffré quand l'usage n'est pas documenté, amertume par stock suffisant puis alpha, arôme par classe typique/compatible/hors style avec origine BJCP (vu : Target seul « typique » du stock, catalogue WGV, Boadicea, Sovereign, East Kent Goldings, Fuggle en tête ; captures 11 à 13) ; B2 avis « Annuler » effacé après 5 s et espace réservé ; B3 mots internes retirés (« spec F1 », « première version », codes Qxx, « nom de l'article ») ; B4 bandeau en une ligne, détail derrière ⓘ ; B5 arôme seulement pour les ajouts tardifs (« peu d'arôme (ajouts d'amertume) »). Mineurs repris : comparaison 12 px sans « Rang » et IBU à la dose de mon ajout, « Prochain ajout », « cocher pour comparer », lignes de 32 px, style « Autre style » non documenté (Q21), arôme sur chaque ligne d'ajout (Q17). Rejoué : gestes, one-tap et règles U à 390 pour 5 styles et à 1280, budgets. Spec F1 et F3 mises à jour. Page republiée à la même adresse.
