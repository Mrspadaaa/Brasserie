# Organisé pour un TDAH visuel : variantes (25.11 soir)

Ses mots : « C'est très bien, même très très bien mais poud un TDAH, Visual learner, c'est un peu trop textuel » ;
« Et comme j'ai dis cette vue est pas incroyable 6.5/10 pour un TDAH, visual learner ».
Base : la vue Organisé du jouable M4 b (jouable/m4b.html, captures jouable/cap-m4b/22-visuel.png et sa capture du vrai rangement,
réponse réelle de Claude dans visuel/reponse-reelle-ecoulement.json). Ce qui reste vrai : vraie note à côté (Mes notes), l'IA ne réécrit rien,
chaque élément renvoie à sa ligne, il peut ajouter sa piste / option / tâche (« + »), bouton Aide (✓ check, ☐ tâche, 💡 suggestion),
comparaison « qui gagne quoi », Retenir n'exclut rien, champ d'une ligne en bas d'Organisé.

## Règle dure (DEFAUTS-RECURRENTS § ORGANISE-TROP-TEXTUEL)
Au premier écran (390 × 844) : 30 mots visibles au plus hors titre ; chaque bloc se lit SANS lire (icône, couleur, forme, position, jauge, taille).

## Demande
6 variantes d'Organisé, chacune un GENRE de représentation différent (pas 6 habillages du même empilement de cartes). Pistes de genres :
carte mentale (problème au centre, pistes et options en branches) ; tableau de bord à grosses tuiles-icônes ; frise / chemin de l'idée à la
résolution avec les étapes en pictos ; feu tricolore et jauges (où j'en suis, ce qui bloque, ce qui coûte) ; kanban à 3 colonnes
(à vérifier / à faire / fait) en vignettes ; « une seule chose maintenant » (la prochaine action en très grand, le reste replié en pastilles).
Libre d'en proposer d'autres si plus forts. Chaque variante sur 2 cas réels : l'écoulement (tests/fixtures/c79/zz-ecoulement-qui-fuit.json,
rangement réel) et un achat avec comparaison (tests/fixtures/c75/houblons-citra.json). États : repos, puis un geste clé (toucher un élément → sa ligne,
ou Aide ouvert). Thème sombre comme le jouable. Mots en français, ses mots à lui jamais réécrits.

## Contrat
Possède : visuel/v1..v6.html, visuel/cap/, visuel/RESULTAT.md. Rien d'autre.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : repos et un geste clé par variante, sur les 2 cas.
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core connecté au Chrome de débug port 9222, ton propre onglet, page.close() puis
browser.disconnect(), jamais browser.close(). Captures 1280 : aucune.
Compte les mots visibles au premier écran de chaque capture (script) et écris-les dans RESULTAT.md ; toute variante > 30 mots est corrigée.
Ouvre chaque capture. Commit local de tes seuls chemins (`git add -f`, `git commit -- <chemins>`). Ni push ni publication.

## Ajout (25.11 soir) : la frise d'états
Ses mots : « Je suis très mitigé sur la frise d'action... Elle est trop central et donne pas de bonne indication et trop générique et convient pas à tout les cas ».
Plus de frise Noté › Je cherche › Décidé › Résolu fixe et centrale. L'avancement, s'il est montré, est petit et propre au genre du carnet
(achat : comparé › choisi › commandé ; échéance : jours restants ; événement : compte à rebours ; problème : ce qui est trouvé / reste à vérifier ;
mémo : rien) et dit la prochaine chose utile. Chaque variante le traite (DEFAUTS-RECURRENTS § FRISE-GENERIQUE).

## Ajout 2 (25.11 soir) : l'en-tête
Ses mots : « Et il y a beaucoup d'info mais peu vraiment utile donc au final c'est assez peu compact en info vraiment importante, utile. Ça revient sur le fait que pour un TDAH, Visual learner c'est pas adapté ».
L'en-tête actuel (titre, date, genre, « Rangé à », « Changements », frise) mange un tiers de l'écran pour rien. Dans chaque variante, la première
info utile (trouvé, bloque, prochaine action, chiffre clé) commence dans les 120 premiers px sous la barre ; date, genre, heure et changements
tiennent sur une ligne discrète ou derrière une icône (DEFAUTS-RECURRENTS § ENTETE-PEU-UTILE). Densité d'info utile avant tout.
