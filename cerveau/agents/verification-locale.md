---
name: verification-locale
description: Comment vérifier localement l'app Brasserie L'Affinée — contournement auth en dev sous ?dev-local, et scripts de contrôle.
type: agents
maj: 2026-10-24
sources: mémoire locale affinee-verification-locale.md ; src/App.tsx ; scripts/check-no-dev-auth.mjs ; scripts/check-water.mjs ; vite.config.ts ; firebase.json ; firestore.rules ; src/ui/useViewport.ts ; src/data/seedData.ts
---

L'app est verrouillée derrière une authentification Google Firebase : sans contournement, `npm run dev` ne montre que la page de connexion.

**Contournement local** (rétabli le 4 septembre 2026, `src/App.tsx`, fonction `devLocalUser`). Deux verrous, tous deux nécessaires :
1. `import.meta.env.DEV` : Vite le remplace par `false` au build, le `if (false)` est éliminé.
2. `?dev-local` dans l'URL : même en dev, il faut le demander. `http://localhost:3000/` seul montre la vraie page de connexion. Ouvrir avec `http://localhost:3000/?dev-local`.

**Ce que le contournement NE donne PAS : les données.** Les règles Firestore sont appliquées par le serveur ; un utilisateur fabriqué côté navigateur n'a pas de jeton. L'application s'ouvre donc VIDE, avec le bandeau « Accès refusé par les règles de sécurité Firestore » et des `permission-denied` en console : comportement correct, pas une panne. Suffisant pour vérifier les écrans (l'assistant de recette démarre vide par conception).

**Scripts de contrôle** (`node scripts/<nom>`) :
- `check-no-dev-auth.mjs` cherche `dev-local` et `devLocalUser` dans `dist/` ; à lancer après `npm run build`. Volontairement PAS branché sur `npm run build` : ça toucherait le chemin de déploiement, que Gaëtan interdit.
- `check-water.mjs` : chimie de l'eau, chaque nombre attendu accompagné de son calcul.
- Autres ports : `vite.config.ts` lit `PORT` (3000 par défaut), pour un second serveur.

**Déploiement.** Projet `brasserie-l-affinee`, hébergement seul : `firebase.json` déclare aussi `firestore`, `functions` et `auth`, mais le script n'envoie que `hosting`, donc les règles ne partent jamais par ce chemin. Ne pas lancer `npm run deploy` à l'aveugle (il reconstruit puis envoie d'un trait). Dans cet ordre :
```
rm -rf dist && npx tsc --noEmit && node scripts/check-water.mjs && npx vitest run
npx vite build && node scripts/check-no-dev-auth.mjs
npx firebase deploy --only hosting -m "…"
```
Contrôle post-déploiement : chercher `dev-local`, `devLocalUser`, `preview=` dans le bundle servi ; ouvrir l'URL de production avec `?dev-local`, qui doit montrer la vraie page de connexion. Règle d'or de Gaëtan : tout se développe et se valide en local avant tout déploiement, et on ne touche jamais `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`.

**Mesurer dans le navigateur : recharger DUR d'abord.** Deux pièges font mesurer l'ancienne mise en page et conclure à tort qu'un changement « n'a rien fait » : 1) Vite sert parfois une transformation périmée après une modification de classes Tailwind : un `location.reload()` complet, et attendre 2 s, avant chaque campagne de mesure. 2) `useCoarsePointer()` (`src/ui/useViewport.ts`) est lu au MONTAGE : redimensionner en mobile après le chargement laisse l'app en densité `comfortable` (paddings de 16 px au lieu de 12, `space-y-4` au lieu de `space-y-2.5`). Redimensionner PUIS recharger. Sur téléphone, la barre d'onglets « 1. Eau / 2. Sels » est `sticky` : le budget vertical réel est `main.clientHeight` moins sa hauteur, pas `main.clientHeight`. 3) La règle globale `prefers-reduced-motion` de l'app (`src/index.css`) supprime aussi les fondus d'opacité, et Chrome sans écran se déclare en mouvement réduit (r1, 24.10).

**Worktree `.claude/worktrees/*`** (constaté le 13 septembre 2026). Trois fichiers manquent, tous ignorés par Git : `src/data/seedData.ts` (copier `seedData.example.ts`), `.env` (copier celui de `C:/Users/mrspa/Documents/Brasserie`) et `functions/node_modules`. Sans les deux premiers, `npm run dev` sert une page blanche (`auth/invalid-api-key`). `functions/node_modules` absent fait échouer environ 25 fichiers de tests à la collecte (`Cannot find package 'firebase-functions/v2/https'`) : ce ne sont pas des régressions. Le `node_modules` racine, lui, se résout depuis le dépôt principal.

**Ne jamais lire le code de sortie de `npm test | tail`** : c'est celui de `tail`, toujours 0. Lire la ligne `Test Files … | Tests …` du résumé.

**Suite instable sous charge** : `monkey.test.tsx`, `fuzzSaisie.test.tsx`, `recipeWizardSafety`, `waterManualSparge` et les panneaux houblon dépassent le délai (15 s, 30 s pour une fuzz) de façon variable. Vérifié : le commit `2c38736` non modifié donne les mêmes échecs, avec un total qui bouge entre deux exécutions (8, 9, 11 ou 14 tests). Pour juger un changement, comparer la liste des fichiers en échec avec celle d'un worktree détaché sur le même commit de base, pas les compteurs bruts.

**Banc du jour de brassage** : `?preview=brew&view=brassage` monte `BrewDayPage` sur la NEIPA de démonstration, sans authentification ni Firestore. `&hardware` passe sur la cuve Royal Catering 45 L, `&keyboard=300` simule le clavier. Les phases se sélectionnent par les boutons `.brew-phase`.

Voir [[socle-v01]] et [[chimie-eau]].
