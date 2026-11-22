# Voies e1, e2 — rejeu en ligne, mission 2026-11-19-carnet-tour3

App en ligne : https://brasserie-l-affinee.web.app (tag en-ligne/2026-11-19-tour2). Chrome du brasseur, Claude in Chrome
(`mcp__claude-in-chrome__*`) : charger en UNE fois par ToolSearch
`select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__find,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__browser_batch,mcp__claude-in-chrome__tabs_close_mcp`.

- Il est connecté : jamais de mot de passe. Une autre session teste dans le même Chrome : créer TON onglet (tabs_create_mcp),
  ne toucher aucun autre onglet, ne PAS redimensionner la fenêtre.
- 390 px : dans ton onglet (même origine), `javascript_tool` :
  `document.body.innerHTML='<iframe id="t" src="/" style="width:390px;height:844px;border:0"></iframe>'`, puis agir dans l'iframe
  (même connexion). 1280 = l'onglet tel quel. Deux thèmes si le constat porte sur une couleur.
- Données : seulement des objets nommés « ZZ TEST — … » créés par toi, retirés à la fin (vérifier leur disparition). Jamais
  « Confirmer » une pièce réelle, jamais modifier ni supprimer une donnée réelle, jamais d'envoi à l'IA (aucun bouton de lecture
  IA, aucun « Compléter avec l'IA ») : un constat qui l'exige → `non-jouable — exige Gemini`.
- Pour chaque ligne de ta `LIGNES.md` : jouer le parcours (colonne rejeu), regarder (capture ouverte ou texte de la page), classer
  `present` (ce qu'on voit, mot pour mot) / `corrige` (ce qu'on voit) / `obsolete` (l'écran n'existe plus) / `non-jouable` (raison).
- Livrable : `voies/<voie>/RESULTAT.md`, une ligne par id : `id | verdict | observé (≤ 25 mots) | taille (390/1280)`, puis la liste
  des données ZZ TEST créées et retirées. Plafond 120 tours ; à 200 k : `REPRISE : <fichier>`. Réponse finale : une ligne.
- Économie : browser_batch pour enchaîner, get_page_text/find avant capture, captures à scale 0.5.
