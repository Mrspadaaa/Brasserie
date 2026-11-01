# Voie e2-inventaire — tous les écrans de l'app, avec leurs états

Agent : auteur (Sonnet). Une lecture du code et un inventaire, rien dans `src/`. Écris RESULTAT.md tôt.

## Pourquoi
Après houblons, on refait tous les écrans un à un. Aujourd'hui, le registre de ses choix (`work/refonte-frontend/v4/choix/ecrans.json`)
n'en compte que 8, tous de houblons. Aucun registre n'énumère les autres écrans ni leurs états : vide, chargé, erreur, hors ligne.

**Règle n° 1** : `ecrans.json` ne reçoit que ses choix (D123). L'inventaire vit à part.

## Ce qui est demandé
1. `scripts/agents/inventaire-ecrans.mjs`, rejouable. Il énumère les écrans depuis le code :
   - les onglets et vues de `src/App.tsx` ;
   - les routes, les feuilles (Sheet), les modales, les assistants (wizard) et leurs étapes.
   Il écrit `work/refonte-frontend/inventaire-ecrans.json`.
2. Pour chaque écran :
   - un identifiant ;
   - son nom en français, comme l'app le dit ;
   - comment l'atteindre : onglet, vue, geste ;
   - ses fichiers (composant racine, CSS) ;
   - ses données lues (Dexie, Firestore, catalogue) ;
   - ses états visibles (vide, chargement, chargé, erreur, hors ligne, formulaire rempli), d'après le code ;
   - les tests qui le couvrent ;
   - sa taille : fichiers et lignes ;
   - son lien avec houblons : déjà refait, en partie, ou pas du tout.
3. `work/refonte-frontend/INVENTAIRE-ECRANS.md` : un tableau lisible, et une **proposition d'ordre** pour le programme.
   - Critères : ce que le brasseur utilise le plus selon PRODUCT.md, les dépendances entre écrans, la taille, le risque sur les données.
   - C'est une proposition ; le brasseur choisira.
4. Une capture de 3 écrans au hasard à 390 × 844 dans l'app, pour vérifier que l'inventaire décrit bien ce qu'on voit (L12). Lance
   l'app dans `C:/Users/mrspa/AppData/Local/Temp/atelier-ecrans`, au commit de production, avec `?dev-local`.
   Commande : `node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P -- node <script>`.

## Critères
- `node scripts/agents/inventaire-ecrans.mjs --verifier` : `INVENTAIRE OK`, qui garantit trois choses :
  - chaque vue de `App.tsx` est dans l'inventaire ;
  - chaque fichier racine cité existe ;
  - aucune entrée n'est en double.
- Le script rejoué deux fois produit le même JSON.
- Les 3 captures sont ouvertes, avec une ligne dans RESULTAT.md : ce que montre la capture, et ce qu'en dit l'inventaire.

## Possède
- `scripts/agents/inventaire-ecrans.mjs`.
- `work/refonte-frontend/inventaire-ecrans.json`, `work/refonte-frontend/INVENTAIRE-ECRANS.md`.
- `work/missions/2026-10-31-systeme-ecrans/voies/e2-inventaire/`.

N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
