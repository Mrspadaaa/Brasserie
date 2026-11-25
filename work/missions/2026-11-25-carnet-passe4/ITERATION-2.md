# Passe 4, itération 2 (nuit du 25.11)

Sa demande : « … du rien n'est probant, refait une itération et prends les meilleures ou les meilleures solutions de chaque vue … on prend pas
forcément une vue telle quelle mais les mécanismes ou les visuel les meilleures. »
Verdict des 3 juges (juge-critique-1.md, juge-personas-action-1.md, juge-personas-produit-1.md) : NON probant comme vues, OUI comme réserve.
Mécanismes cités par les trois : chemin en lignes de métro, une couleur par piste (v04) ; jetons en tête sans frise, état en 4 points (v06) ;
barres coût / temps par façon, inconnu hachuré, estimation empilée (v02, v05, v06) ; « qui gagne quoi » face à face (v01 : devis 185 contre moi 9) ;
« Une décision t'attend » (v02, v06) ; feuille Changé par l'IA fine (cadenas v05, « Arrêter la veille ? » v03).
Défauts communs à ne pas reproduire : > 30 mots au premier écran d'Organisé, frise fixe, première info utile trop bas, valeurs fausses
(« Humidificateur », « 150 CHF ? » sur un devis reçu), écran IA en erreur qui prétend lire options et tâche sans IA, prochaine action jamais
sous le pouce, bascule Mes notes / Organisé hors du pouce, 6 écrans copiés de M4 sans exploration.
Source visuelle à greffer aussi : les 6 variantes d'Organisé pour TDAH visuel (work/missions/2026-11-25-carnet-document/visuel/v1..v6.html,
10 à 17 mots au repos, sans frise, info utile à 86 px) et ce qu'il a validé dans le jouable (outil IA → Organisé, Organisé par défaut, « + »,
Aide qui propose ✓ check / ☐ tâche / 💡 suggestion, comparaison qui gagne quoi).

## Demande
3 versions greffées (p4b-1, p4b-2, p4b-3), chacune une RECETTE différente tirée des recettes des juges (fin de leurs fichiers), sur les écrans :
Liste · Organisé (problème) · Organisé (achat avec Comparer) · Décider · À faire (tous les carnets) · Relecture « pourquoi » · IA en erreur / hors ligne ·
Mémo. Chaque version écrit sa recette en tête (écran → mécanisme → source). Règles dures (DEFAUTS-RECURRENTS) : ORGANISE-TROP-TEXTUEL,
FRISE-GENERIQUE, ENTETE-PEU-UTILE, CARNET-LISTE-COMPACTE, plus : la prochaine action sous le pouce ; aucune valeur absente de ses notes ;
sans IA, seul ce que l'app lit vraiment (analyseLocale.ts : montant, pas trouvé, contacté, piste). Données : ses carnets d'exemple
(tests/fixtures/c79, c75), rien d'inventé. Thème sombre du jouable.

## Contrat
Possède : work/missions/2026-11-25-carnet-passe4/p4b/ (p4b-1..3.html, cap/, RESULTAT.md). Rien d'autre.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : chaque écran listé, au repos, plus toucher un élément d'Organisé (→ sa ligne) et Aide ouvert.
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core connecté au Chrome de débug port 9222, ton propre onglet, page.close() puis
browser.disconnect(), jamais browser.close(). Captures 1280 : aucune.
Compte par script les mots visibles au premier écran d'Organisé et la hauteur de la première info utile ; écris-les dans RESULTAT.md.
Ouvre chaque capture. Commit local de tes seuls chemins (git add -f, git commit -- <chemins>). Rends une ligne : versions, mots et px, commit.
