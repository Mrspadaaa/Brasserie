OK — TESTS ROUGES 18 rouges / 20 total (R89, R91) ; contrôle R90 « LISTE KO » (50 % et 49 %, 6 lignes entières) — hash dans la réponse finale

## Fichiers écrits
- `tests/unit/c74Regles.test.tsx` (20 tests : R89 7, R91 13), `tests/fixtures/c74/brassage.ts` (exemples « ZZ TEST — » : Brassage 4 carnets, Fermentation 2, un carnet plus récent jamais déplacé).
- `scripts/controle-liste-compacte.mjs` (R90) ; banc : `voies/c74-tests/banc/{index.html,banc.tsx,vite.banc.config.mjs}` (port 3074, lancé et arrêté par le script).
- Sorties : `tests-rouge.log`, `controle-rouge.log`, `cap/liste-sans-filtre.png`, `cap/liste-filtre-cherche.png` (ouvertes).
- Aucun fichier de `src/` ni `functions/` modifié par cette voie (les ` M src/...` du `git status` viennent des autres voies).
- Le skip « cas R4 » de c48Regles : sans objet (le modèle de VOIE.md le mentionne ; la ligne 253 déjà ignorée n'est pas de cette voie, non touchée).

## Sortie décisive
- Tests : `npx vitest run tests/unit/c74Regles* --reporter=dot` → `Tests 18 failed | 2 passed (20)`. Les 2 verts sont des GARDES voulues : repli du sous-domaine SANS filtre (déjà juste) et « un carnet jamais déplacé garde l'ordre actuel, rien n'est écrit ».
  Causes des 18 rouges vérifiées dans le journal : en-têtes de domaine = `div` sans `aria-expanded` (aucun repli) ; sous-domaine forcé ouvert (`ouvert = … || !!mot || filtre !== null`) ; aucun menu ⋯ sur les lignes. Aucun rouge dû à un assistant du test (les 2 gardes prouvent que `ordreDe`, `visible`, les montages marchent).
- Contrôle : `node scripts/controle-liste-compacte.mjs` →
  `LISTE KO sans-filtre: 50 % de 637 px, 6 lignes entières (7 touchées, 8 dans la liste) | filtre-cherche: 49 % de 656 px, 6 lignes entières (7 touchées, 10 dans la liste) (seuils : ≥ 70 %, ≥ 7 lignes)` (code 1, rejoué deux fois, même sortie).

## Ce que les tests exigent (contrat pour la voie qui corrige)
- **R89** : toucher l'en-tête de DOMAINE (`.cnl-dn`) replie toutes ses lignes ; l'en-tête reste, porte `aria-expanded` (lui, son bouton ou son ancêtre) ; retoucher rend les mêmes lignes ; un domaine voisin ne bouge pas ; le filtre « Filtre : je cherche » reste. Idem pour le SOUS-DOMAINE (`button.cnl-sd`) avec le filtre « je cherche » et avec une recherche tapée ; le sous-domaine voisin reste ouvert ; le repli demandé est gardé quand on retire le filtre. Sans filtre : domaine et sous-domaine se replient aussi.
- **R91** (sa parole : « Pas du drag and drop » ; aucun glisser) : chaque ligne d'un sous-domaine a un bouton ⋯ distinct de `button.cnl-pb`, dans le même bloc que cette ligne seule, nommé par `aria-label`/texte contenant ⋯, plus, menu, actions ou options ; choix exacts « En tête », « Monter », « Descendre » (bouton ou `role=menuitem`) ; premier rang : En tête et Monter absents ou désactivés ; dernier : Descendre. Effets : Descendre(1re) → B,A,C,D ; Monter(3e) → A,C,B,D ; En tête(4e) → D,A,B,C ; gestes en série ; le voisin (Fermentation) intact ; écriture au magasin (`ecritures` > 0), y compris `horsLigne` ; ordre gardé au remontage sur le MÊME magasin et sur une COPIE SÉRIALISÉE (`JSON`) du magasin (le nom du champ de priorité n'est pas imposé) ; un carnet jamais déplacé suit l'ordre actuel (plus récent d'abord) et vient APRÈS les classés (C en tête, puis le neuf plus récent, puis A,B,D) ; un déplacement ne réécrit ni titre ni catégorie.
- **Point d'attention pour le correcteur** : `lireCarnet` ne garde que les clés de `CLES_CARNET` (modele.ts) : un champ de priorité doit y entrer, sinon l'ordre se perd au remontage (c'est ce que les deux tests de remontage attrapent).

## Doutes et limites
- Le banc du contrôle R90 n'a ni en-tête ni barre du bas de l'app : deux cadres vides MARQUÉS `data-banc-cadre` (84 px et 44 px, relevés sur sa capture du 25.11) retirent cette hauteur ; hauteur de fenêtre 844 comme demandé (sa capture montre plutôt ≈ 694 px visibles : le téléphone y perd sa barre d'adresse). Sur le vrai téléphone la part serait donc plus basse que mesurée.
- Fixture : la fixture du suivi seule n'a que 4 lignes « je cherche » (moins de 7) ; le banc y ajoute les 6 carnets d'exemple de `tests/fixtures/c74` à l'état « je cherche » (10 lignes) pour que la règle des 7 lignes sous filtre soit mesurable. Les lignes du banc sont plus basses que celles de sa capture (titres sur une ligne) : 6 lignes entières au lieu de ses 3,5.
- « Ligne entière » = boîte entièrement dans la zone utile ; part = somme des hauteurs de lignes visibles / hauteur utile (champ exclu).
- La page du banc déborde de quelques pixels à droite (compteurs « 11 », « 8 » rognés sur les captures) : présent avant ma voie, à voir au contrôle visuel de la voie fix ; non mesuré par R90.
- Menu ⋯ : le test ne connaît pas le composant ; un nom d'accès différent de ceux listés le rendra rouge à tort : à signaler dans RESULTAT de c74-fix, pas à corriger dans le test.
- Pas d'Annuler testé pour le déplacement (« tout s'annule d'un toucher » est une exigence transversale non rappelée dans R91) : à décider par le pilote.
- Essais : 2 tours de test, 2 du contrôle (le 1er laissait le serveur 3074 ouvert : `taskkill` rendu synchrone).

DÉCISION À PRENDRE : les problèmes ouverts sont à plat sous le domaine (`arbreDe`), les sous-domaines ne portent que les autres genres ; sa capture montre pourtant « Brassage 5 » avec des lignes. R91 est testée sur les lignes des sous-domaines (idées) ; l’ordre des problèmes ouverts à plat n’est PAS couvert. Options : (a) en rester là, (b) étendre R91 aux problèmes du domaine. Recommandation : (b) si le correctif les place sous un sous-domaine, à confirmer par le pilote avant c74-fix.

CONNAISSANCE : `lireCarnet` ne garde que les clés de `CLES_CARNET` : tout champ neuf d’un carnet (priorité) doit y entrer, sinon il disparaît à la relecture.
LEÇON PROPOSÉE : aucune
