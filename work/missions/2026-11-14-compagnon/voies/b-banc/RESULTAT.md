OK — 17 états × 4 formats capturés, 4 planches faites, 0 appel réel.

Fichiers écrits :
- work/missions/2026-11-14-compagnon/voies/b-banc/banc.mjs
- work/missions/2026-11-14-compagnon/voies/b-banc/journal-banc.json
- work/missions/2026-11-14-compagnon/voies/b-banc/tests.txt
- work/missions/2026-11-14-compagnon/voies/b-banc/RESULTAT.md
- work/missions/2026-11-14-compagnon/analyse/cap/ : 68 captures `<id>-<390|1280>-<clair|cave>.png`, `planche-390-clair.png`, `planche-390-cave.png`, `planche-1280-clair.png`, `planche-1280-cave.png`, `etats.json`, `reseau.json`
- voies/b-banc/erreurs/ : vide (aucune erreur de capture au dernier passage)

Critères :
- G1 `node work/missions/2026-11-14-compagnon/outils/controle-banc.mjs` → `BANC OK` (exit 0), voir tests.txt.
- Dernier passage complet : `captures 68/68 ; intercepte 360 ; nonIntercepte 0`.

Tests : `tests.txt` = `BANC OK`.

Essais : 2 relances complètes après la première passe. (1) e15 : le geste hors ligne par `setOfflineMode` ne produisait pas « Envoi à confirmer » (la requête passait par l'interception) ; remplacé par l'abandon de `askBrewer` dans le script. (2) 4 captures e15 en échec (`mock is not defined`) ; corrigé, relance complète. Le contrôle avait passé pendant l'échec, car il ne vérifie que la présence des fichiers : c'est pour cela que la relance complète était nécessaire.

État par état (capturé oui pour les 17 ; écart avec la consigne) :
- e01 accueil recette : oui ; budget déplié, champ vide.
- e02 accueil finances : oui ; écart : repli, le banc preview ne monte pas Finances, question de Finances tapée dans l'accueil recette.
- e03 Approfondi + question tapée : oui.
- e04 envoi en cours : oui ; « Envoi de ta question… » visible, accusé retardé 20 s.
- e05 attente courte : oui ; « Recherche de sources… », chrono affiché 0:11 à 0:12 (écart d'une seconde selon l'instant de capture).
- e06 attente longue : oui ; « Cette étape prend du temps » visible, chrono 2:29.
- e07 deux questions : oui ; 1re en cours, 2e « Question enregistrée · en attente ».
- e08 réponse info, détails repliés : oui.
- e09 réponse attention, détails ouverts : oui ; 6 phrases, watch, question de suivi, 3 preuves, 3 sources https.
- e10 urgent : oui.
- e11 proposition : oui ; 3 champs avant/après, « Valider 3 modifications » active (le brouillon ne l'a pas grisée dans ce banc).
- e12 fournisseurs : oui ; 2 produits, « Annoncé en stock » et « Indisponible ».
- e13 erreur relançable : oui ; « Relancer l’analyse ».
- e14 plafond : oui ; lien « Ouvrir les dépenses Google ».
- e15 hors ligne : oui ; « Envoi à confirmer », « Réessayer l’envoi ». Écart : simulé par abandon de `askBrewer` côté script, pas par le mode hors ligne du navigateur. Le bandeau `connectionError` n'est pas apparu.
- e16 Repartir à zéro : oui ; confirmation ouverte, non cliquée.
- e17 Mes conversations : oui ; 3 conversations (ma recette, brassin 31, brassin 29).

Thème cave : vérifié sur les planches (fond sombre, sur les 17 vignettes), réglage `localStorage laffinee.theme`.

Captures ouvertes avant rendu : `planche-390-clair.png`, `planche-390-cave.png`, `planche-1280-clair.png`, `planche-1280-cave.png`, et `e15-390-clair.png` en plein format. Les 1280 n'ont été vues qu'en vignettes dans les planches ; elles ne sont pas ouvertes une à une en plein format.

Ce qui reste douteux :
- Les cartes de travail affichent « Gemini Flash » (texte de l'app, pas du banc). DESIGN.md interdit le nom du fournisseur à l'écran : à juger par le pilote.
- Le repli e02 ne teste pas la vraie entrée Finances.
- Le brouillon ne grise pas la proposition e11 : à comparer avec le parcours réel.
- Les requêtes Firestore passent sans interception (non comptées) ; elles n'ont pas été examinées.
- Le serveur Vite (3007) a été arrêté après le passage.

CONNAISSANCE : le banc compagnon s'appuie sur `?preview=brew&view=assistant` (BrewPreview, `ScopedChat`) ; les callables sont interceptés par leur chemin (`/askBrewer` …) ; abandonner `askBrewer` donne le vrai état « Envoi à confirmer » hors ligne.

LEÇON PROPOSÉE : un contrôle qui ne vérifie que la présence de fichiers passe sur d'anciennes captures après un échec de script. Règle : après une correction du banc, relancer la capture complète avant de lancer le contrôle, et lire le journal (`fails 0`) avant de rendre.
