# Rapport — test en ligne 4 du carnet (19.11)

Version : tag en-ligne/2026-11-19-carnet-paquet-1, `assets/index-DVe3aiZy.js` servi (`document.scripts` de l'onglet, aucun service worker), aiTask réel. Onglet Claude in Chrome neuf 1005988354, fermé à la fin.
Envois IA : 6 (8 appels aiTask dont 2 lireLien), détail dans journal-ia.md. alert/confirm/prompt interceptés : 0 appel.

**Tailles non jouées : ni 390 ni 1280.** La fenêtre était agrandie : je l'ai restaurée, réduite (406 px de large en dehors), puis agrandie de nouveau. Mais l'extension fige l'onglet à 2560 × 1305 : `innerWidth` reste à 2560 après chaque redimensionnement. Une iframe à 390 est refusée par l'hébergement (cadre bloqué). Toute la passe est donc à 2560. Le 390 tactile et le 1280 restent à faire : `?dev-local` en local ou DevTools à la main.

## Les 6 problèmes encore ouverts du test 3 : 5 corrigés, 1 pas corrigé
- **n° 9 — CORRIGÉ (côté app).** Le vendeur est propre. Aucun champ `vendeur` n'est stocké sur les 2 articles (cache Firestore). L'écran montre le domaine seul (« galaxus.ch », « ricardo.ch »).
  L'IA rend toujours du bruit, que l'app jette :
  - « Galaxus.chfrs1productvevor-pompe-magnetique-inox-24467310 vue à 189 CHF » ;
  - « ricardo.ch/fr/a/… (vendeur non précisé, issu de Ricardo.ch) ».
- **n° 11 — CORRIGÉ.** Le menu ··· de la note Réfractomètre contient Modifier, Changer en façon, Changer en critère, **Déplacer**, Supprimer et Fermer. Déplacer → « dans ZZ TEST — Pompe… ».
  - Le bandeau dit « ✓ Rangé dans ZZ TEST — Pompe de transfert magnétique, à l'instant · Annuler ».
  - Le Fermenteur affiche « Notes · aucune ».
  - Dans le cache serveur, la note est dans Pompe (`a-acheter`).
  - Je n'ai pas cliqué Annuler.
- **nouveau n° 1 — PAS CORRIGÉ.** Envoi 6 depuis le Fermenteur ouvert : l'IA rend `{sorte: "idee", titre: "Moulin à malt"}`. L'app garde la phrase brute « Nouveau projet, à part : un moulin à malt… » en « note » dans le Fermenteur (message `rangement: locale`). Aucun carnet neuf, rien ne s'ouvre.
  Même cause à l'envoi 3 depuis Pompe : voir le nouveau problème A.
- **nouveau n° 2 — CORRIGÉ.** Envois 2, 3 et 6, depuis un carnet ouvert : le journal de l'écran (relevé toutes les 150 ms) montre seulement « range… » puis « ✓ Rangé ici · Annuler ». Il n'y a jamais « Carnet créé », et le titre du carnet reste le même du début à la fin.
- **nouveau n° 3 — CORRIGÉ.** La photo galaxus ne se charge pas. À sa place apparaît le picto pompe, dans la carte, le tableau et la fiche. Aucune icône d'image cassée.
- **nouveau n° 4 — CORRIGÉ.** Après la note en vrac de 3 lignes :
  - Pompe cite « pompe de transfert magnétique pour le moût chaud » ;
  - Fermenteur cite ses 2 lignes seulement (double paroi et vanne).
  Aucune ligne d'un autre carnet n'apparaît.

## Autres points vérifiés
- **Article dont la page n'a pas été lue (2) — OK.** Article ricardo : lecture « illisible », 145 CHF. Sur sa fiche, le bouton « Choisir » est actif.
  - Choisir ouvre « Pourquoi : La moins chère », puis on confirme par Choisir.
  - Le carnet affiche « Choisi le 19 nov. » et le bouton « Envoyer dans À venir ». Je ne l'ai pas cliqué.
- **Phrase d'accueil (3) — OK.** Elle dit : « Collez le lien d'un objet ou notez un besoin : on garde sa photo et son prix, pour comparer. »
- **Le carnet reste un chat (4) — en partie.**
  - Mise en forme : OK (« Réfractomètre pour mesurer la densité du moût », à acheter).
  - Rangement en idées depuis la liste : OK (2 carnets).
  - Rangement en idées depuis un carnet : KO (n° 1).
  - Comparer : OK. On voit « Côte à côte 2 », 1re Pompe magnétique inox 145, 2e Darlac Ciseaux 189, « Compromis : la 1re, 145 CHF, la moins chère ; 44 CHF de moins que la 2e » et le bouton Choisir.

## Nouveaux problèmes (3, aucun bloquant)
A. **(moyen) Une idée sans rapport, écrite depuis un carnet ouvert, devient un critère de ce carnet.**
   - Envoi 3 dans Pompe : « autre projet, sans rapport : un frigo de garde pour 20 fûts » devient le critère « un frigo de garde pour 20 fûts dans la cave · calculé sur place » (`origine: locale`).
   - Ce critère s'affiche ensuite dans le résumé du choix (« Critère : un frigo de garde… ») sous l'article choisi.
   - C'est la même cause que le n° 1, sous une forme plus visible.
B. **(moyen) La note en vrac perd une ligne.** « voir s'il existe avec double paroi » ne devient ni note ni critère dans le Fermenteur (le test 3 en faisait une note « à faire »). Le titre perd aussi « 60 L ».
   - La réponse IA de cet envoi n'a pas été capturée.
   - Je ne sais donc pas si la ligne manquait déjà dans la réponse de l'IA ou si l'app l'a perdue.
C. **(faible)** Sur un carnet déjà choisi, le menu Plus dit encore « Supprimer l'idée ».

Doutes :
- L'IA rend toujours un vendeur sale. L'app le filtre, mais chaque envoi coûte autant.
- Galaxus donne encore une page de sécateur pour un identifiant inventé, sans alerte.
- Le choix confirmé a mis environ 10 s à s'enregistrer (« Enregistrement sur le serveur… »).

## Carnets retirés (2, par l'app : Plus › Supprimer l'idée › Supprimer, sans dialogue navigateur)
- **ZZ TEST — Fermenteur conique inox** : « Il part avec 1 critère et 1 note · Ni dans À venir, ni en commande ».
- **ZZ TEST — Pompe de transfert magnétique** (statut choisi) : « Il part avec 1 critère, 2 articles et 1 note · Ni dans À venir, ni en commande ».

Après rechargement : Carnets 0, À venir 3 (inchangé), aucun « ZZ TEST » à l'écran ni dans le cache des carnets.

## Messages restants (non effacés)
Les 6 messages `carnet-message` de ce test sont lus dans le cache Firestore de l'onglet. Ils survivent à la suppression des carnets.
- MSG-2f222df3-e9a8-4f6c-96cd-a7092b44d086 (envoi 1)
- MSG-00b486b3-b7a9-4ce1-92fc-08dc83b5ede6 (envoi 2)
- MSG-7cdc7044-9b07-4edd-af30-500f435f89f4 (envoi 3)
- MSG-735e6c2c-39db-4bbf-86f5-c673ab414032 (envoi 4)
- MSG-2b765ba8-f846-4676-b310-d8dfc66eeddf (envoi 5)
- MSG-f81796aa-4c11-43d5-93e9-dfe7811b66c3 (envoi 6)

Ceux des tests 2 et 3 n'ont pas été relus.

## Ligne
EN LIGNE CARNET 4 — 5/6 corrigés, 4 problèmes (0 bloquant), 6 envois IA, carnets retirés oui
(4 = n° 1 pas corrigé, moyen, plus 3 nouveaux : A moyen, B moyen, C faible. Tailles 390 et 1280 non jouées : l'onglet reste figé à 2560.)
