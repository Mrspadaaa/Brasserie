# Reprise — nuit du 23.11 (mode nuit, autonome)

## Fait
- Calendrier : LISTE (a) corrigée (port-carnet, ~16 défauts), tour 11 en ligne (61f116620, index-Cmzen8eH.js) ; contre-épreuve
  unique (calendrier-en-ligne/contre-epreuve/, 24 défauts T11 au registre) ; graves T11-1 et T11-2 corrigés ;
  TOUR 12 EN LIGNE (index-zpcbYIem.js). Moyens et mineurs T11 : avec l'écran suivant (Carnet).
- Questions du Calendrier en mini maquettes, publiées : https://claude.ai/artifact/Md1VuUPY2uwCRsbrRnWJPR (Q-1, Q-2, Q-3,
  Q-5 ; Q-4 sur son téléphone). En attente de ses réponses (L-2, L-5, L-12).
- Nettoyage : work/ archivé (17 228 fichiers, 1,2 Go), 18 fichiers de code mort, 793 tests retirés, pièces sensibles hors Git
  (.local/pieces-reelles/), tsc incrémental (5 s à chaud), vitest 1 104 s → 335 s.
- Historique comprimé en UN commit (accord 23.11), main forcé : 875751dcb ; étiquettes distantes supprimées ; clone neuf
  371 Mo (.git 203 Mo) au lieu d'environ 1,6 Go. Sauvegarde : C:\Users\mrspa\Documents\Brasserie-sauvegarde-2026-11-23\
  (brasserie-historique-complet.bundle vérifié, 199 réfs ; arbre-avant-nettoyage/).
  Les worktrees Brasserie et port-carnet sont remis sur origin/main (reset --mixed, fichiers d'autrui gardés).

## En cours
- Carnet : M1 exploratoire, M2 états/limites, M3 scénarios, M4 tactile/visuel (en ligne, CDP 9222), suite Playwright
  e2e/carnet (port-carnet). Brief : BRIEF.md ici. Budget IA 5 CHF (ia-journal.jsonl).

## Ensuite
1. LISTE unique du Carnet (dédoublonnage M1–M4 + PW + T11 moyens/mineurs) → BUGS.md ; correction par lots de 5 à 8, un
   agent neuf par lot, test rouge d'abord, tsc incrémental, tests ciblés ; suite complète une fois.
2. Tour 13 (deploy-seul.sh, T → tour13) ; contre-épreuve unique du Carnet sur les cas à problème.
3. Puis : CI GitHub Actions, web-vitals, remontée d'erreurs (collection Firestore), tests des règles Firestore, Stryker, ADB ;
   REPRISE-GENERALE du 22.11.
