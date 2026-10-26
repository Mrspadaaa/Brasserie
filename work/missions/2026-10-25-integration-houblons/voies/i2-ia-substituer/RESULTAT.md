OK — callable hopReclasserIA (Flash-Lite) et IA dans Substituer, puce dans la tête (décalage 0 px), titre qui suit la liste ; 8 captures ouvertes

## Reprise après la critique (`critique.md`, B1, B2, C1 à C4)
- **B1, fait** : la puce est dans la tête fixe, à droite du titre « Nelson Sauvin » (place de « remplaçants à 60′ » dans u4), plus dans le flux. Mesuré dans Chrome (émulateur, 390 × 844) : « Au dry hop, l'arôme… » à y = 115 px avant et après l'arrivée de l'IA, **écart 0 px**. La bascule reste sous le pouce pendant le défilement (captures 4, 5, 7). Test : la puce est dans `[data-page-titlebar]`, juste après le `h1`, hors de `.pq-substituer`, dont le premier enfant reste la ligne des moments.
- **B2, fait** : quand l'ordre IA est appliqué, le titre nomme le premier de la liste affichée (« Solero, 57 sans inconnue. ») avec son score du moteur ; sa 2e ligne reprend la phrase de l'IA (« IA Classé 1er : … ») ; la puce touchée rend le titre du moteur. Le face à face suit déjà la rangée verte. Test dédié (titre = nom de la première rangée, phrase, retour au titre du moteur).
- **C1** : phrase IA 14 px, étiquette « IA » 12 px. **C2** : « appliquer l'ordre IA ». **C3** : rang gris (12 px) devant chaque score quand l'ordre IA est appliqué, test dédié. **C4** : ligne IA de « Lire ces scores » coupée en deux phrases courtes, capture 7 de l'état ouvert.
- **C5 non fait** : l'adjectif d'appréciation de l'invite. La changer casse la version `v1` de l'essai ia1 (test d'identité sur 78 messages) : il faudrait `v2` et un nouvel essai. À décider.

## Fichiers écrits
- `functions/src/hopReclassCore.ts` (nouveau, module pur partagé : invite, schéma, fiche courte, moment, lecture de la réponse, entrée bornée ; invite identique à ia1, `v1`).
- `functions/src/hopReclasserIA.ts` (nouveau) : callable `hopReclasserIA`, europe-west6, Flash-Lite seul, une tentative, sans repli 3.8. `functions/src/ai.ts` : un mot (`assertAuthorized` exportée). `functions/src/index.ts` : export.
- `scripts/eval-hop/ia-reclassement.ts` : réemploie le module partagé, comportement inchangé (test d'identité).
- `src/ui/hopIndex/substituer/ia.ts` (client), `donnees.ts` (ordre IA, `pool`), `index.tsx`, `substituer.css`.
- **Hors de mon périmètre, deux ajouts minimes** pour loger la puce dans la tête : `src/ui/hopIndex/dryhopper/hote.tsx` (prop facultative `droite` de `CadreOutilProps`) et `dryhopper/CadreApp.tsx` (la rend après le `h1`, tête mobile). Les autres écrans ne la passent pas : rien ne change pour eux. Dans la tête de bureau (`sm:` et plus), la puce n'apparaît pas : l'ordre IA s'y applique sans bascule. À régler si le bureau compte.
- `tests/unit/hopIndexV4/hopReclasserIA.test.ts` (29 tests), `substituerIA.test.tsx` (14 tests).
- `emulateur/emulateur.ts` (harnais), `img/` (captures, rapports JSON, journaux).

## Décisions de conception
- Callable : `assertAuthorized` ; budget `runWithMonthlyAiBudget` (mensuel + quotidien, réservé avant l'envoi) ; entrée bornée ; modèle choisi par le serveur ; réponse invalide (hors liste, doublon, JSON coupé, < 10, phrase vide, `MAX_TOKENS`) = `ok:false`, jamais d'ordre. App Check : aucun callable du dépôt ne l'exige, celui-ci non plus (à activer pour tous). `LITE_ROUTES` inchangé (un test le fige) ; la route Flash-Lite est dans le callable.
- Client : appel à l'ouverture, en ligne ; réponse < 3 s et liste non touchée = ordre appliqué une fois (fondu 240 ms, coupé en `prefers-reduced-motion`), puce « classé par l'IA » ; sinon puce « appliquer l'ordre IA ». Réponse > 3 s : elle attend un toucher (lecture de la consigne). Autre moment = autre demande ; réponses gardées pour la séance. Hors ligne ou échec : l'ordre du moteur, aucun message. Sous Vitest, aucun transport par défaut.
- L'ordre IA est appliqué avant le choix des huit ; la liste n'est plus rangée par le pire cas ; les scores restent ceux du moteur. La fiche et Replis gardent l'ordre du moteur (D35).

## Critères
1. `npx vitest run tests/unit/hopIndexV4` : 63 fichiers, 586 tests verts, **1 rouge : `moteurInchange.test.ts` (« le classement des substituts de 12 houblons est inchangé »)**. Je n'ai touché ni `src/domain` ni le moteur ; `git status` montre `src/domain/hopIndex/v4/voies.ts` modifié et `departage.ts` nouveau, d'une autre voie (départage du moteur). À rejouer par le pilote quand elle aura fini. Tests des fonctions (`aiTask`, routage, budget, sortie) : verts avant cette reprise, non rejoués (aucune ligne de `functions/` touchée depuis). `tsc --noEmit` racine vert.
2. `npm run build` (avec `VITE_HOP_V4=on`) vert ; `check-no-dev-auth.mjs` : bundle propre ; `check-test-boundary.mjs` vert.
3. `check-hop-budget` B5 : le script rend « 0,0 ko » (la fermeture du chunk est déjà dans celle du démarrage : sans valeur). Mesure directe de la 1re passe : chunk Substituer 15,3 ko gzip, loin de 160 ko ; le correctif n'ajoute que du JSX et 10 lignes de CSS. B1/B2 du script affichent « dépassé » avec les arguments par défaut : état d'avant ma voie, à rejouer avec les arguments habituels.
4. **Émulateur simulé** (`emulateur.ts --mode=simule`, « I2-EMULATEUR-OK », aucun appel réel) : fonctions + Auth + Firestore émulés (`demo-i2`), fournisseur local « Simulé », app en `?dev-local` avec connexion émulée. Constaté : liste du moteur tout de suite, puce absente ; réponse en 1,8 s, liste remplacée, **écart 0 px**, scores inchangés ; phrase au toucher d'une rangée ; puce touchée = ordre du moteur et titre du moteur rendus ; réponse tardive (3,6 s) : liste immobile, « appliquer l'ordre IA » ; budget mensuel réservé et réglé (4 873 micro-CHF pour 3 appels). **Captures 390 × 844, les 8 ouvertes** (`img/simule-…`) : 1 ouverture (60′, liste du moteur), 2 dry hop avant, 3 dry hop après (puce dans la tête, titre « Solero », rangs gris), 4 phrase dans le face à face, 5 puce touchée (ordre du moteur rendu), 6 réponse tardive (puce pointillée), 7 « Lire ces scores » ouvert, 8 whirlpool appliqué (rangs 1 à 5 devant les noms).
   Défauts vus et laissés : sur l'échelle (60′, whirlpool), les noms longs se tronquent un peu plus (« Southern Su… ») avec le rang ; le rang « 4 » touche la barre verte de la rangée choisie (capture 8) ; en dry hop les `+` rentrent de 3 px par rapport à « Comparer › » quand le rang est là (capture 3).
5. **Essai réel** (rappel, non rejoué dans cette reprise, comme demandé) : 2 appels sur 3, section « i2 » de `gemini-journal.md`, compteur « 2 / 3 · 0,0061 CHF / 0,05 », `gemini-3.5-flash-lite` aux deux, 2,1 et 2,2 s, par `guardLiveFetch`. Ses captures `img/reel-1` à `reel-5` datent d'avant la reprise (puce dans le flux) : elles ne montrent plus l'écran final.

## Déploiement (pour le pilote, pas fait ici)
```
npm --prefix functions run build && firebase deploy --only functions:hopReclasserIA --non-interactive
```
Déploie seulement le callable `hopReclasserIA` (europe-west6, secret `GEMINI_API_KEY` déjà lié). Le client (hosting) part après, sinon il appelle un callable absent (échec silencieux, ordre du moteur).

## États de Substituer qui changent (pour e3)
- Nouveau : puce IA dans la tête, `[data-role="puce-ia"]`, `data-ia="appliquee"` (« classé par l'IA ») et `data-ia="prete"` (« appliquer l'ordre IA »). Aucun décalage du contenu.
- Nouveau, ordre IA appliqué seulement : titre au premier de la liste + `[data-role="reponse-ia"]` ; `[data-role="rang-ia"]` devant chaque score ; `[data-role="phrase-ia"]` dans la bande du face à face ; `[data-role="lire-ia"]` à la place de « Le pire cas d'abord » dans « Lire ces scores ».
- Inchangés : tous les `data-etat` existants (`etat-subst-repos`, `echelle`, `toucher-rang`, `face`, `aromes`…) ; sans IA (hors ligne, test, maquette) l'écran est celui d'avant la voie.

## Doutes et limites
- Gain mesuré par ia1/ia2 (MRR 0,206 contre 0,107), pas sur le moteur actuel ni jugé par le brasseur (`cote-a-cote.json`).
- Premier appel à froid en production : non mesuré (émulateur 2,3 à 2,5 s) ; au-delà de 3 s l'écran garde la puce « appliquer l'ordre IA ». `minInstances: 1` réglerait cela, au coût d'une instance.
- Tarifs de `geminiCosts.ts` expirés (`validUntil` 2026-10-09) : hors voie, à renouveler.
- Hors ligne et échec : prouvés en jsdom, pas rejoués dans l'émulateur.
- Le critique relève qu'aucune garde ne refuse une phrase IA citant une huile `null` : non faite.

DÉCISION À PRENDRE : (1) C5, ajouter « sans adjectif d'appréciation » à l'invite : version `v2` et nouvel essai (~0,1 CHF) ? Recommandation : oui, avant le déploiement. (2) Puce dans la tête de bureau ? Recommandation : oui, un `actions` de `PageShell` ; non fait ici pour ne pas toucher le shell. (3) `minInstances: 1` ? Recommandation : non.

CONNAISSANCE : l'émulateur des fonctions va chercher un secret absent dans Secret Manager (403, plusieurs secondes) : un `.secret.local` factice dans le dossier temporaire l'évite ; `vite-node` lancé par `emulators:exec` veut `--root <racine>` ; un `import()` écrit dans une fonction passée à `page.evaluate` est transformé par vite-node : écrire le code de page en chaîne.

LEÇON PROPOSÉE : un élément qui apparaît après coup (réponse asynchrone) se place hors du flux, dans une zone déjà réservée (tête fixe) ; mesurer la position d'un repère avant et après l'arrivée, pas seulement regarder la capture (cette voie a livré un saut de 38 px que la capture montrait et que je n'avais pas mesuré).
