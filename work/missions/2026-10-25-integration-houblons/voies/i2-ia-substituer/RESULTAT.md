OK — callable hopReclasserIA (Flash-Lite) et IA dans Substituer, tests verts, émulateur simulé et réel (2 appels, 0,0061 CHF), captures ouvertes

## Fichiers écrits
- `functions/src/hopReclassCore.ts` (nouveau, module pur partagé) : invite, schéma, fiche courte, libellé du moment, lecture d'une réponse, lecture bornée de l'entrée. Texte de l'invite identique à l'essai ia1 (`v1`).
- `functions/src/hopReclasserIA.ts` (nouveau) : callable `hopReclasserIA`, europe-west6, Flash-Lite seul, une tentative, sans repli 3.8.
- `functions/src/ai.ts` : un seul mot (`assertAuthorized` exportée, aucune autre ligne). `functions/src/index.ts` : export du callable.
- `scripts/eval-hop/ia-reclassement.ts` : réemploie le module partagé (invite, schéma, génération, lecture) sans copie ; comportement inchangé, prouvé par un test (78 messages de l'essai reconstruits à l'identique).
- `src/ui/hopIndex/substituer/ia.ts` (nouveau, client), `donnees.ts` (ordre IA, `pool`), `index.tsx` (puce, phrase, fondu), `substituer.css`.
- `tests/unit/hopIndexV4/hopReclasserIA.test.ts` (29 tests), `tests/unit/hopIndexV4/substituerIA.test.tsx` (11 tests).
- `voies/i2-ia-substituer/emulateur/emulateur.ts` (harnais), `img/` (captures, rapports JSON, journaux).

## Décisions de conception
- Contrôles du callable : `assertAuthorized` (connexion, e-mail vérifié, compte autorisé) ; budget par `runWithMonthlyAiBudget` (mensuel + quotidien, réservé avant l'envoi) ; entrée bornée (10 à 20 candidats, textes et plages bornés) ; modèle choisi par le serveur seul ; réponse invalide (hors liste, doublon, JSON coupé, moins de 10, phrase vide, `MAX_TOKENS`) = `ok:false`, jamais d'ordre.
- **App Check** : aucun callable du dépôt ne l'exige (`enforceAppCheck` absent de `functions/src`) ; celui-ci non plus. À activer pour tous ensemble.
- **Flash-Lite sans 3.8 en repli** : `LITE_ROUTES` n'est pas modifié (un test le fige) ; la route est dans le callable (`GEMINI_LITE_MODEL` + `assertGeminiModel`). 3.8 sortirait de la fenêtre de 3 s.
- Client : appel à l'ouverture, en ligne ; réponse < 3 s et liste non touchée = ordre IA appliqué une fois (fondu 240 ms, coupé si `prefers-reduced-motion`), puce « classé par l'IA » ; sinon puce « ordre IA prêt ». Un toucher sur la puce bascule. Une réponse tardive (> 3 s), même sans toucher, attend un toucher : lecture de la consigne (la consigne ne dit rien de ce cas). Un autre moment = une autre demande ; réponses gardées pour la séance (pas de refacturation au retour, ni au double montage). Hors ligne ou échec : l'ordre du moteur, aucun message.
- L'ordre IA est appliqué avant le choix des huit (cinq du catalogue, trois du stock) ; la liste n'est alors plus rangée par le pire cas et les scores ne sont plus monotones (ils restent ceux du moteur ; « Lire ces scores » le dit). La fiche et Replis gardent l'ordre du moteur (D35) : ils peuvent donc différer de Substituer quand l'IA est appliquée.
- Sous Vitest, aucun transport par défaut : un écran monté dans un test n'appelle jamais le callable.

## Critères
1. `npx vitest run tests/unit/hopIndexV4` : 61 fichiers, 551 tests verts (avec les 40 nouveaux). Tests des fonctions (`aiTask`, routage, budget, sortie) + `outilsApp` : 6 fichiers, 96 tests verts. Il n'existe pas de `npm --prefix functions test` : les tests des fonctions vivent dans `tests/unit`. `tsc --noEmit` racine et `functions` verts.
2. `npm run build` vert (avec `VITE_HOP_V4=on` aussi) ; `node scripts/check-no-dev-auth.mjs` : « Bundle de production propre » ; `node scripts/check-test-boundary.mjs` vert.
3. **B5 (`check-hop-budget`)** : non mesurable proprement. Avec `--chunk-outils EcranApp-CWzZJGtJ` le script rend « B5 0,0 ko, tenu » (la fermeture du chunk est déjà dans celle du démarrage : lecture sans valeur). Mesure directe : le chunk Substituer entier pèse 15,3 ko gzip, loin de 160 ko ; l'IA y ajoute quelques ko (ia.ts + hopReclassCore.ts). B1 et B2 du script affichent « dépassé » (921 et 773 ko) avec les arguments par défaut : état d'avant ma voie, non mesuré sur HEAD ici ; à rejouer par le pilote avec ses arguments habituels.
4. **Émulateur, simulé** (`emulateur.ts --mode=simule`, sortie « I2-EMULATEUR-OK ») : émulateurs Auth, Firestore, Functions (projet `demo-i2`, callable compilé dans un dossier temporaire, jamais `functions/lib` ni `functions/.env`), fournisseur local simulé (phrases « Simulé (essai local) »), app en `?dev-local` + vraie connexion émulée. Constaté : liste du moteur tout de suite (puce absente), réponse en 1,8 s (liste remplacée, puce « classé par l'IA »), scores inchangés, phrase dans le face à face au toucher, puce touchée = ordre du moteur rendu, réponse tardive (3,6 s) : liste immobile, « ordre IA prêt » ; budget mensuel réservé et réglé dans Firestore émulé (4 873 micro-CHF pour 3 appels). Captures 390 × 844, toutes ouvertes : `img/simule-2-dryhop-liste-du-moteur.png` (avant), `simule-3-dryhop-apres-ordre-ia.png` (après), `simule-4-phrase-dans-le-face-a-face.png`, `simule-6-ordre-ia-pret-reponse-tardive.png` (ouvertes : 2, 3, 4, 6 ; 1 et 5 non ouvertes).
5. **Essai réel** (`emulateur.ts --mode=reel --confirm-paid-ai`) : **2 appels sur 3**, section « i2 » de `gemini-journal.md` (hors git), compteur « 2 / 3 · 0,0061 CHF / 0,05 », `modelVersion` observé `gemini-3.5-flash-lite` aux deux, 3 892 / 505 et 3 955 / 505 jetons, 2,1 et 2,2 s, HTTP 200. Chemin : app → callable (émulateur) → fournisseur local → `guardLiveFetch` (hôte et modèle de la liste blanche, ligne de journal par appel parti, réservation avant l'envoi) → Gemini. Aucun garde-fou n'a refusé. Le deuxième appel est arrivé en 2,6 s depuis le clic, ordre appliqué tout seul ; phrase réelle lue dans le face à face (« Hallertau Blanc partage la groseille et le vin blanc, mais son myrcène est plus haut et l'humulène plus bas. »). Capture `img/reel-3-dryhop-apres-ordre-ia.png` ouverte. La clé n'est lue que dans `functions/.secret.local` par le fournisseur local, jamais passée aux émulateurs ni affichée.

Essais : un par critère ; le harnais a demandé 5 lancements (chemins `..`, `--root` de vite-node, `import()` dans une fonction de page, clé factice pour éviter Secret Manager), tous simulés, aucun coût.

## Déploiement (pour le pilote, pas fait ici)
```
npm --prefix functions run build && firebase deploy --only functions:hopReclasserIA --non-interactive
```
Déploie seulement le callable `hopReclasserIA` (europe-west6, secret `GEMINI_API_KEY` déjà lié par `defineSecret`). `ai.ts` change d'un mot d'export, sans effet sur `aiTask` ; ne rien d'autre n'est déployé. Hors du déploiement : le client (hosting) doit partir après, sinon il appelle un callable absent (échec silencieux, ordre du moteur).

## États de Substituer qui changent (pour e3)
- Nouveau : « puce IA » sous la ligne des moments, `[data-role="puce-ia"]`, deux états `data-ia="appliquee"` (« classé par l'IA ») et `data-ia="prete"` (« ordre IA prêt »). Elle prend une ligne de 38 px quand elle apparaît (le contenu descend ; capture 3).
- Nouveau : « phrase IA » dans la bande du face à face de chaque remplaçant, `[data-role="phrase-ia"]`, seulement quand l'ordre IA est appliqué.
- Structure : la ligne des moments est enveloppée dans `.pq-substituer-ligne-moments`. Les états existants (`etat-subst-repos`, `echelle`, `toucher-rang`, `face`, `aromes`…) et leurs `data-etat` ne changent pas ; sans IA (hors ligne, test, maquette), l'écran est identique.
- « Lire ces scores » : une ligne change quand l'IA est appliquée (`data-role="lire-ia"` à la place de « Le pire cas d'abord »).

## Doutes et limites
- Gain mesuré par ia1/ia2 (MRR 0,206 contre 0,107 de l'option 1), pas sur le moteur v2 actuel ni jugé par le brasseur ; il juge sur `cote-a-cote.json`.
- Premier appel après une période creuse : démarrage à froid de la fonction en production, non mesuré (l'émulateur donne 2,5 s). Il peut dépasser 3 s : l'écran garde alors « ordre IA prêt ». `minInstances: 1` réglerait cela, au coût d'une instance : choix du pilote.
- La puce arrive en décalant le contenu de 38 px : à juger par le brasseur ; la seule autre place sans décalage serait de réserver la ligne dès l'ouverture, ce qui coûte 38 px à chaque ouverture en ligne.
- Tarifs de `geminiCosts.ts` : `validUntil` 2026-10-09, donc expirés ; `brewerBudget` les marque « expired », le callable ne s'en sert pas pour refuser. Hors voie, à renouveler.
- Hors ligne et échec : prouvés en test (jsdom), pas rejoués dans l'émulateur.

DÉCISION À PRENDRE : la puce sur sa propre ligne (décalage de 38 px à l'arrivée) ou une ligne réservée ? Recommandation : garder le décalage et laisser le brasseur juger. Et `minInstances: 1` pour le callable ? Recommandation : non, tant que le premier appel froid reste acceptable (« ordre IA prêt »).

CONNAISSANCE : l'émulateur des fonctions va chercher un secret absent dans Secret Manager (403, plusieurs secondes) : un `.secret.local` factice dans le dossier temporaire l'évite ; `vite-node` lancé par `emulators:exec` veut `--root <racine>` ; un `import()` écrit dans une fonction passée à `page.evaluate` est transformé par vite-node, écrire le code de page en chaîne.

LEÇON PROPOSÉE : aucune.
