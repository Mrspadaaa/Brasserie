# Reprise — épreuve du Calendrier en ligne (23.11)

Demande : tester à fond le Calendrier sur la vraie app (focus 1 frise du temps, focus 2 calendrier global), puis le reste.
Ses mots en fin de work/refonte-frontend/v4/SPEC-BRASSEUR.md (23.11) ; décisions D429 (PWA).

## Fait
- 5 tests en ligne : M1 exploratoire, M2 états/limites, M3 scénarios, M4 heuristiques/robustesse (Claude in Chrome),
  M5 vrai tactile CDP (Chrome de débogage du brasseur, port 9222, profil C:\Users\mrspa\chrome-test, connecté).
  Rapports *.md de ce dossier. Attention : M1, M4, début de M3 joués sur l'ANCIEN paquet (service worker) ;
  M2, M5, fin de M3 sur le tour 10. Claude in Chrome partagé : pas de 390 réel, onglets qui se volent → préférer CDP.
- fast-check : utile, 66 tests, FC-1 (53 semaines), FC-2 (axe Mois perd le dernier mois) ; commit 89682342f (port-carnet,
  local, non poussé).

## En cours (agents)
- Liste consolidée → LISTE.md + BUGS.md (T10-*), poussée sur main.
- Playwright Test FAIT : commit 70f86002b (port-carnet, local) ; `npm run test:e2e` 56 tests, HEAD 47 verts, 4 rouges
  (étiquettes de la courbe en paysage 844×340 : défaut réel à corriger, pas à masquer), 5 sautés ; `E2E_REF=<tag>` pour
  une version passée ; OUTILS.md. Reste : tests en ligne par connectOverCDP. geste.mjs ne lit pas vraiment la période.
- D429 FAIT : ee64202fc (port-carnet, local) ; + firebase.json : /sw.js en no-cache. Non déployé ; à vérifier sur le
  téléphone après la mise en ligne. LISTE.md FAITE (91ecfe1e8, sur main) : 48 défauts, L-1 et L-47 bloquants.
- Correction de LISTE (a) en cours (agent, port-carnet), sans L-2 ni questions (d) (mini maquettes à faire).

## Ensuite, dans l'ordre
1. Corriger selon LISTE.md : bloquant T10-M5-1 (barre accrochée au bord gauche), puis frise, puis calendrier global ;
   chaque correctif avec un test Playwright ou fast-check qui échoue avant.
2. Réunir port-carnet (local, non poussé : fast-check, Playwright, D429, correctifs) dans main ; mettre en ligne
   (work/missions/outils-mise-en-ligne/deploy-seul.sh, T → tour11) ; vérifier que le téléphone prend la nouvelle version.
3. Rejouer en ligne au vrai tactile (CDP, port 9222) + suite Playwright ; captures regardées.
4. Carnet (23.11 soir) : même batterie que le Calendrier (M1 à M5, Playwright, fast-check si utile, liste, correction) ;
   « 5chf de crédit alloué pour des test sur la vrai app » (Gemini réel : chaque appel journalisé, total ≤ 5 CHF).
5. Nettoyage (accord 23.11 : work/ mort archivé, code mort retiré, historique comprimé en un commit) : juste avant la
   compression, sauvegarde hors dépôt dans C:\Users\mrspa\Documents\Brasserie-sauvegarde-2026-11-23\ : bundle Git complet
   (--all : historique, branches, étiquettes) + copie de l'arbre sans .git ; `git bundle verify` avant de forcer main.
   Inventaire : work/missions/2026-11-23-nettoyage-depot/INVENTAIRE.md (agent).
6. Puis le reste : CI GitHub Actions, web-vitals, remontée d'erreurs en ligne (collection Firestore, sans compte externe),
   tests des règles Firestore, Stryker, ADB (accordés le 23.11), puis REPRISE-GENERALE du 22.11.
