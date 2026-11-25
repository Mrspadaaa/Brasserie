# Dossier c80-tests — mise en page jugée dans un VRAI navigateur (reel-80)

Constats : voies/reel-80/RESULTAT.md ; lignes R80-n, R75-3, EXA-1 et les R73/R75 de mise en page rouverts (BUGS.md). jsdom ne mesure rien : ces règles se prouvent par un contrôle Chrome, comme scripts/controle-liste-compacte.mjs (banc de c74-tests : serveur local de dev, CarnetsVue réel, fixtures). Utilise les VRAIS documents de tests/fixtures/c78/chambre-froide-releve.json, c79/, c75/.
Écris scripts/controle-mise-en-page-carnet.mjs (puppeteer-core, Chrome de débug 127.0.0.1:9222, ton onglet, page.close() puis disconnect, JAMAIS browser.close()), à 390 × 844, qui sort « MISE-EN-PAGE OK » ou « MISE-EN-PAGE KO <mesures> » (code 1) :
- R113 (R75-3, B) : tableau de Chambre froide : aucun mot coupé au milieu (un nœud texte dont une ligne finit par une partie de mot : compare les mots du texte aux lignes rendues via Range.getClientRects) ; noms sur 2 lignes au plus, ellipse au-delà.
- R114 (EXA-1, B) : le menu ⋯ d'une bulle s'ouvre entièrement dans la zone visible (sous l'en-tête de l'app, au-dessus du champ) : « Modifier », « Changer en façon » et chaque entrée ont leur boîte visible et touchable (elementFromPoint au centre = l'entrée).
- R115 : les autres constats de mise en page de reel-80 (R80-n) et les R73 de mise en page rouverts, chacun une mesure.
Il doit sortir KO sur le code actuel (écris la sortie au RESULTAT, captures ouvertes). Aucun fichier de src/ modifié.
