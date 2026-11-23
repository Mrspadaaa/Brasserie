# REPRISE — vision tour 9, 3 bloquants (21.11)

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711). Source : `VISION-tour9.md` (même dossier).

## Fait

1. **Build HEAD réparé** — commit `e0920a8f4` (CalendrierTab.tsx seul, index temporaire). tsc + `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build`
   verts dans `%TEMP%/cal-t9` (worktree détaché, jonction node_modules, `src/data/seedData.ts` copié car ignoré). DRAPEAUX OK.
   Attention : l'index RÉEL de port-carnet garde des hunks indexés d'une autre voie qui annulent CHN-9, CHN-3, CHE-1 dans CalendrierTab.tsx
   (`git diff --cached`). Non touché. Ne jamais `git commit` sans index temporaire.
2. **CAL-BARRE-BORD** — commit `6d22c6115`.
   - Contrôle : `scripts/parcours/geste.mjs` section `sectionBarreHors` (lol, 2 sem. puis 6 sem. = S47–S52, tirée au bord droit, tenue 1,5 s,
     doigt ramené hors de la bande, bulle lue, lâcher) : même début et plus de 6 semaines, date posée = bulle, dans la fenêtre, rechargement.
     Option `--sections a,b` ajoutée. Rouge avant correctif : « 2026-11-16+6 sem. → 2026-11-30+6 sem. » (fenêtre glissée).
   - Code : `CalendrierTab.tsx` defilerFenetre : la condition « un jour garde 8 px » qui forçait le glissement est retirée (croît jusqu'à 6 mois) ;
     `usePointeur.ts` majDefile : vitesse comptée en colonnes de l'appui (`s.w0`, `s.d0`) — sinon croissance exponentielle (6 → 23 sem. en 1,5 s,
     bulle en retard d'une à deux semaines : la forme « 7 janv. annoncé, 14 janv. posé »).
   - Vert : sectionBarreHors + sectionBarreBord, 390 et 1280, clair et cave (build `%TEMP%/geste-build`).

## Reste

3. Brassin en cuve (NEIPA Test, J78) : (a) régler la date de brassage est refusé au lâcher (« Brassin en cuve : le jour de brassage ne bouge
   pas… ») — soit la pastille Brassage ne doit pas s'ouvrir, soit le réglage doit s'écrire ; décider selon `src/domain/calendrierGestes.ts`
   (grep « le jour de brassage ne bouge pas ») ; (b) « Prête ✓ ? » doit se régler depuis la fiche (onDecalerFin, CalendrierTab ~l. 900, CHE-5).
   Chacun son contrôle (geste.mjs ou parcours calendrier), rouge puis vert.
4. Rejouer `node scripts/parcours/calendrier.mjs` et `node scripts/parcours/geste.mjs <dossier> --endroits calendrier` (toutes sections) : OK.
5. BUGS.md (`Brasserie/work/missions/BUGS.md`) : lignes CAL-BARRE-BORD / build / brassin en cuve à la main ; puis
   `node scripts/agents/controle-bugs.mjs` (OK attendu).
6. Nettoyer : `git worktree remove --force %TEMP%/cal-t9`.
