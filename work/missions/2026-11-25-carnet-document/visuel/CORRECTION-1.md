# Variantes visuelles, correction 1 (nuit du 25.11)

Juges du tour 1 : juge-critique-1.md (v1 6, v2 6, v3 5, v4 4, v5 4, v6 7), juge-action-1.md (4,5 / 5,5 / 6 / 3 / 4,5 / 7,5),
juge-produit-1.md (5 / 5,2 / 5,8 / 3,5 / 4,3 / 6,7). Les trois proposent la même base : v6 « une seule chose maintenant ».
Écartées (genre qui ne tient pas, note < 5 chez les trois) : v4 (feu qui ment dans 7 à 9 cas sur 12), v5 (3 colonnes, deux tiers d'écran vide).
Une ligne pour chacune dans RESULTAT.md. v1, v2, v3 restent un tour pour leurs idées ; écartées au tour 2 si encore sous 6.

## À faire
1. **v7 = la recette** (fin des trois fichiers de juges) : base v6 ; le héros est toujours une tâche du brasseur (jamais une question de l'IA)
   avec sa date ou un compte à rebours (échéance, événement), ou « ✓ Réglé » vert quand c'est réglé ; anneau ✓n ?n de v1 ; au plus 2 gros
   chiffres (v2) sur une ligne ; « qui gagne quoi » de v3 étendu à N offres avec le coût total ; coût inconnu hachuré violet (v2/v4) au lieu
   d'un « ? » seul ; la ligne source qui s'ouvre sur place (v3) ou en feuille (v1) ; l'Aide une proposition à la fois, avec ✕ et ＋, sans
   cacher le héros.
2. **Corriger v1, v2, v3 et v6** sur les problèmes B et m que les juges leur donnent.
3. **Communs à toutes** (les juges les relèvent dans les 6) :
   - un état « réglé » (le pilsner commandé ne doit plus se lire comme un problème ouvert) ;
   - la date d'une tâche (« samedi 6 déc. », « lundi ») visible ;
   - une option garde son titre (« Changer le joint », pas « 🔧 ? ») ; sans coût : rien, ou le hachuré, jamais « ? » seul ;
   - l'IA visible : une marque « ✦ IA » sur ce qu'elle propose, et un ✕ pour refuser chaque proposition, au repos ;
   - « conseillé » (de l'IA) ne ressemble pas à « Retenir » (de lui) ;
   - un état « IA absente » (hors ligne ou rangement en échec) : ses notes, ce que l'app lit seule (analyseLocale.ts), rien d'autre.
4. Les règles dures tiennent : ≤ 30 mots au premier écran, pas de frise fixe, première info utile ≤ 120 px.

## Contrat
Possède : visuel/v1.html, v2.html, v3.html, v6.html, v7.html, cap/, cap12/, reponses/ (ajouts seulement), RESULTAT.md, CORRECTION-1-FAIT.md.
Ne touche ni v4.html ni v5.html (écartées), ni les fichiers de juges.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : repos des 5 variantes sur les 12 cas, plus pour v7 : toucher un élément (→ sa ligne), Aide, refuser une proposition, IA absente.
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core connecté au Chrome de débug port 9222, ton propre onglet, page.close() puis
browser.disconnect(), jamais browser.close(). Captures 1280 : aucune. Recapture cap12/ pour les 5 variantes (écrase les anciennes).
Compte par script mots au premier écran et px de la première info utile, par variante et par cas, dans RESULTAT.md.
CORRECTION-1-FAIT.md : tableau problème → fait / non fait (raison). Ouvre chaque capture. Commit local de tes seuls chemins.
