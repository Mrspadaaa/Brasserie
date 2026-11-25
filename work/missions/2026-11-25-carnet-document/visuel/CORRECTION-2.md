# Variantes visuelles, correction 2 (nuit du 25.11)

Juges du tour 2 : juge-critique-2.md (v7 7,5 · v6 7 · v2 6,5 · v3 6 · v1 6), juge-action-2.md (v7 8 · v6 7,5 · v2 7 · v3 5,5 · v1 5,5),
juge-produit-2.md (v7 7,8 · v6 7 · v2 6,3 · v3 5,8 · v1 5,5). Écartées (sous 6 chez 2 juges sur 3) : v1, v3 (une ligne chacune dans RESULTAT.md).
En lice : v7 (base), v6, v2.

## v7 : tout ce que les trois juges demandent
- jauge / barres du coût total de v2 en tête des comparaisons ; bouton « ✓ Prendre <offre> » sur l'offre gagnante ;
- aucun hachuré quand aucune offre n'a de prix (citra) ; une légende du hachuré (« prix inconnu ») là où il apparaît ;
- le J-n nomme son objet (« Brassin J-8 », « Brassage IPA · J-1 demain 7h ») ; un seul J-n par échéance ;
- couleur d'urgence graduée selon les jours restants ;
- tuile « n/m trouvé » de v2 ;
- ce qui est déjà fait (« Raccord changé ») se range en ✓, jamais en solution à faire (bloquant, dans toutes) ;
- ✕ sur « ✦ conseillé » au repos ;
- la bulle de ligne s'ouvre sous l'élément touché ;
- IA absente : le héros reste, avec la tâche que l'app lit seule et sa date — vérifier dans src/domain/carnets/analyseLocale.ts ce qu'elle lit
  vraiment (n'affiche que ça ; ce qu'elle ne sait pas lire n'est pas inventé ; écris l'écart dans CORRECTION-2-FAIT.md).
## v6 et v2 : leurs bloquants seulement (doublons de J-n, chiffres sans légende, « ⚠ 80 » sans raison, raccord fait), plus les communs ci-dessus.

## Contrat
Possède : visuel/v2.html, v6.html, v7.html, cap/, cap12/, reponses/ (ajouts), RESULTAT.md, CORRECTION-2-FAIT.md. Rien d'autre.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : repos des 3 variantes sur les 12 cas ; pour les 3 : toucher → sa ligne, Aide, refuser, IA absente.
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core connecté au Chrome de débug port 9222, ton propre onglet, page.close() puis
browser.disconnect(), jamais browser.close(). Captures 1280 : aucune.
Mots au repos et px de la 1re info utile par variante et par cas dans RESULTAT.md. Ouvre chaque capture. Commit local de tes seuls chemins.
