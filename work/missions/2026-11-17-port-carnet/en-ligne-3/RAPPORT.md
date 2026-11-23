# Rapport — test en ligne 3 du carnet (18.11)

Version : tag en-ligne/2026-11-18-carnet-3, `index-BLR9KzCm.js` servi (curl no-cache + `document.scripts` de l'onglet, aucun service worker), aiTask réel (`rangerCarnet`, `lireLien`). Onglet Claude in Chrome 1005988332, fenêtre 2560 px (pas de 390 dans cette passe).
Envois IA : 7 (9 appels aiTask dont 2 lireLien ; cumul accord 19), détail dans journal-ia.md. alert/confirm/prompt interceptés : 0 appel.

## Les 13 problèmes du test 2 : 11 corrigés, 2 pas corrigés
1. CORRIGÉ — note en vrac : l'IA range 2 carnets, vanne et double paroi au Fermenteur ; l'app garde exactement cela (aperçu local « Prochain brassin » remplacé, jamais créé).
2. CORRIGÉ — ligne pompe : carnet « ZZ TEST — Pompe de transfert moût chaud » créé et gardé (un carnet local « …pour le » apparaît une seconde puis disparaît).
3. CORRIGÉ — « doit tenir 80 °C » dans Pompe : l'IA rend Pompe ; critère « Tenir 80 °C au moins » dans Pompe ; « ✓ Rangé ici ».
4. CORRIGÉ — même phrase depuis la liste : aperçu « Déjà un carnet proche : ZZ TEST — Pompe » ; l'IA rend Pompe ; aucun carnet « doit tenir 80 °C » (doublon de critère fusionné).
5. CORRIGÉ (donnée) — « tuyau silicone 8 mm, 5 m » dans Pompe : note « à acheter », 5 m, dans Pompe ; le carnet provisoire disparaît (voir nouveau n° 2).
6. CORRIGÉ — prix gardés : 189 CHF (galaxus, page lue) et 145 CHF (ricardo, page non lue), l'IA n'en rendant aucun.
7. CORRIGÉ — après le 2e lien, le 1er garde son nom (« Darlac Ciseaux », nom de la page lue) ; tableau à 2 rangs.
8. CORRIGÉ — Comparer : tableau rang · article · max. °C · CHF, 2 articles, aucun « lecture… » sans fin.
9. PAS CORRIGÉ — vendeur : l'IA rend encore son raisonnement (« galaxus.ch (Darlac Ciseaux / Galaxus marketplace ou Galaxus, gardons le domaine… », 300 car.) puis l'URL entière (« ricardo.ch/fr/a/pompe-magnetique-inox-1287654321/ ») ; aucun filtre `vendeur` dans src/ui/carnets ; non affiché. Stockage non relu (contexte).
10. CORRIGÉ — « double paroi » : note « à faire » (l'IA disait note).
11. PAS CORRIGÉ — menu de la note Réfractomètre : Modifier, Changer en façon, Changer en critère, Supprimer, Fermer ; aucun « Déplacer ».
12. CORRIGÉ — liste, champ au focus, un toucher sur la carte Pompe (à sa place mesurée avant le toucher) l'ouvre (1 essai).
13. CORRIGÉ — titres neufs de l'IA préfixés « ZZ TEST — » ; la liste reste sur la liste après création (doute gardé).

## Nouveaux problèmes (4 : 0 bloquant)
1. (moyen) Envoi 2 dans le Fermenteur : l'IA range un carnet neuf « Réfractomètre » (sorte idée) ; l'app garde la phrase brute « il me faudrait aussi… » en « note » dans le Fermenteur, sans « à acheter » (une réponse « idée » écrite depuis un carnet est jetée : `lignes.filter(l => l.sorte !== 'idee')`).
2. (moyen) Envois 4 et 5 : pendant l'attente « Carnet créé, en tête des Carnets » et saut à la liste ; l'IA range dans Pompe, le carnet provisoire disparaît, l'écran reste sur la liste et rien ne dit où c'est allé (le code prévoit de revenir au carnet : ne se fait pas).
3. (faible) Photo de l'article galaxus cassée (icône d'image brisée) dans la carte et le tableau.
4. (faible) Chaque carnet issu de la note en vrac montre en « votre phrase » toute la note (les 3 lignes, pompe comprise) ; au Fermenteur la note « Vérifier s'il existe avec double paroi » sert aussi de sous-titre.

Doutes : bandeau « Enregistrement sur le serveur… » vu après l'envoi 5 ; page galaxus lue = un sécateur (id inventé par moi) sans alerte de l'IA ni de l'app.

## Carnets retirés (2, par l'app : Plus › Supprimer l'idée › Supprimer, sans dialogue navigateur)
ZZ TEST — Pompe de transfert moût chaud (« Il part avec 2 articles et 1 note ») ; ZZ TEST — Fermenteur conique inox 60 L (« Il part avec 1 note », la note Réfractomètre ayant été supprimée par mon script avant, par erreur de bouton). Carnets créés par l'app pendant le test, puis retirés par elle-même : « ZZ TEST — Pompe de transfert magnétique pour le » (aperçu, 1 s), « Tuyau silicone » et « doit tenir 80 °C » (provisoires). Après rechargement : Carnets 0, À venir 3 (inchangé), aucun « ZZ TEST » à l'écran.

## Messages restants (non effacés)
Lus dans le cache Firestore de l'onglet, `carnet-message` contenant un texte de ce test : 7 nouveaux, un par envoi :
MSG-03a3d1e4-38ec-4461-b507-07ae2e1ad97f, MSG-e321d21e-f1cc-4a8c-8a59-163f5b15c26f, MSG-19bf318b-3355-4cdc-8fdd-b8f3c8add204, MSG-1db982d7-08b2-4061-b1bf-c808f4649d6f, MSG-d7149d93-52e3-4f3d-a523-88b66ec39930, MSG-607bc7cc-24b0-4a51-9ba8-c06f3080b5f8, MSG-985bac6c-1ce0-4ec6-99d7-07344ae8202f.
Encore présents du test 2 (mêmes textes) : MSG-4583dfed…, MSG-4aacdf3d…, MSG-3784be85…, MSG-3445b462…, MSG-9fbb515d…, MSG-d760863c…, MSG-7e230c95…, MSG-90d41e71… (ids complets dans en-ligne-2/RAPPORT.md). Les messages survivent toujours à la suppression du carnet.

## Ligne
EN LIGNE CARNET 3 — 11/13 corrigés, 6 problèmes (0 bloquant), 7 envois IA, carnets retirés oui.
(6 = n° 9 et 11 pas corrigés, moyens, + 4 nouveaux : 2 moyens, 2 faibles.)
