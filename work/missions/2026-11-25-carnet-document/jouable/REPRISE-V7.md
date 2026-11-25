# Reprise : port de la v7 dans m4b-v7.html (25.11 nuit)

**Terminé (reprise du 25.11, tard)** : les 6 correctifs, 4 défauts de plus vus sur les captures, bouteilles 29 mots onglets compris, toutes les captures ouvertes, CAS-V7.md, visuel/v7.html retouché (captures cap-v7/visuel/), commit local. Rien ne reste de la liste ci-dessous.

Le contrat est `visuel/PORT-V7.md`. L'agent s'est arrêté à 353 k de contexte.

## Fait (vérifié, captures ouvertes jusqu'à g12)
- `jouable/m4b-v7.html` est assemblé depuis `m4b.html`, qui reste intact. La source tient en deux fichiers : `cap-v7/banc/org.js` (la vue Organisé v7) et `org.css`.
  - On le reconstruit par `node cap-v7/banc/build.mjs`, des remplacements par split/join sur des ancres uniques.
  - Clé de stockage propre : `m4b-v7-jouable`.
  - Les 5 cas fictifs ont rejoint EXEMPLES (19 carnets).
  - Consigne : règles 18 à 21 ajoutées (`faits`, `resolu` cité, `comparaison.besoin`, `articles[].offre`).
  - `valider` vérifie chaque extrait dans sa ligne, ou dans le titre quand la ligne vaut 0. Le coût total et 👑 sont calculés par la page.
- `jouable/reponses-v7/` : 19 réponses, plus `malt4` (cas « 4 offres » écrit au doigt par le banc) et 4 réponses `.aide.json`. Elles sont produites par `node cap-v7/banc/gen-reponses.mjs`, qui est l'IA jouée à la main.
- Banc : `node cap-v7/banc/cap.mjs tout`, sur le Chrome 9222, avec son propre onglet et un `window.claude` simulé. Le résultat va dans `cap-v7/banc/resultat.json`.
  - 0 citation fausse sur les 19 réponses et sur malt4.
  - 0 erreur de console.
  - Les 19 gestes du banc passent.
- Mots au repos (onglets « Mes notes / Organisé » compris → hors onglets) :
  - assurance 23→20, bar 26→23, bouteilles 33→30, cave 24→21, chaudière 26→23, citra 18→15, CO2 29→26 ;
  - écoulement 30→27, fête 28→25, levure 21→18, pilsner 22→19, sureau 18→15, frigo 29→26, inspection 22→19 ;
  - levure lente 28→25, odeur 18→15, pompe 20→17, vapeur 25→22, embouteillage 18→15.
  - La première info utile est à 90 px, soit 38 px sous la barre, dans les 19 cas. Aucune troncature ni aucun débordement mesuré.
- Retouches faites dans le jouable :
  - un seul vert (👑) ;
  - Prendre suit 👑 ;
  - héros « Commander chez B · J-20 » avec les étapes ⚖️ › ✋ choisi › 📦, colonne encadrée, les autres éteintes ;
  - « total CHF » ;
  - « Raccord changé » rangé en ✅ fait, hors du compte n/m ;
  - une seule icône par rangée (citra) ;
  - « 20 L / fût » ;
  - 🔗 « Ouvrir les liens » ;
  - CO2 à 26 mots hors onglets ;
  - IA absente : lignes entières, date dans ses mots, J-n, ⚠ jour contredit (« samedi 6 déc. » = dimanche) ;
  - barres horizontales à 4 offres ou plus (malt4).

## Reste à faire (dans l'ordre)
1. Corrections vues sur les captures, dans `cap-v7/banc/org.js` ou `org.css`, puis rebuild :
   - a. Toast étroit qui se coupe sur 3 lignes. Ajouter à org.css : `.m4b-toast{width:max-content;max-width:92%}`.
   - b. Héros long (« Commander chez Fournisseur B » sur 4 lignes). Classe `.v7-act.m{font-size:22px}` quand le texte dépasse 20 caractères (fonction `heros`).
   - c. Pilsner après « Rouvrir » : le héros affiche « Commandé chez l'autre » avec ✓ et « plus tard ». Si `!D.tache && r.resolu && c.etat !== 'resolu'`, afficher plutôt un héros « ↺ Rouvert » (le mot de `r.resolu.question`) avec un bouton « ✓ Réglé » (`poserEtat(c, 'resolu')`).
   - d. Vapeur : « 2 inch tri-clover » est rendu en case mono et déborde. Dans `comparaisonHtml`, `mots(j)` doit traiter comme des mots toute valeur qui n'est pas un court nombre et son unité (regex du type `/^[≥~+]?\d[\d\s.,']*\s?\S{0,6}$/`).
   - e. Frigo : le libellé devient « visé 2 °C » (dans gen-reponses.mjs).
   - f. Banc : retirer `.m4b-toast` après chaque `ouvrir` (un toast du carnet précédent restait sur g07 à g09).
2. Relancer `node cap-v7/banc/gen-reponses.mjs && node cap-v7/banc/build.mjs && node cap-v7/banc/cap.mjs tout` (le banc écrit dans cap-v7/).
3. Ouvrir toutes les captures de `cap-v7/` : 00, org-* (19), g01 à g22, sansia-* (7). Celles vues jusqu'ici, de 00 à g12, n'avaient pas d'autre défaut que ceux de la liste 1.
4. Écrire `jouable/CAS-V7.md` :
   - mots et px par cas, tirés de resultat.json ;
   - méthode : nœuds texte visibles à 390 × 844, titre exclu, placeholder compté, onglets donnés à part ;
   - les gestes et leurs captures ;
   - le contrôle des citations ;
   - les limites : réponses écrites à la main, lecture locale du jouable simplifiée (la vraie, `analyseLocale.ts`, reste à corriger hors de ce contrat).
5. Reporter les mêmes retouches dans `visuel/v7.html`, en surchargeant dans la page, sans toucher reponses/*.js qui n'appartiennent pas à ce contrat : un seul vert, total, Commander après Prendre, faits, 🛒 une fois, « 20 L / fût », 🔗 citra, CO2 sans « trouvé », SANS_IA en lignes entières et date dans ses mots, barres horizontales à 4 offres ou plus.
6. Commit local par chemins (`git add -f`) :
   - jouable/m4b-v7.html, jouable/cap-v7/, jouable/reponses-v7/, jouable/CAS-V7.md, jouable/REPRISE-V7.md ;
   - visuel/v7.html.
