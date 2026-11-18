EN LIGNE PAQUET D — 5/7 OK (n° 6 non jouable, n° 2 partiel), 1 problème (0 bloquant), ZZ TEST retirés oui

Site https://brasserie-l-affinee.web.app, tag en-ligne/2026-11-19-paquet-d. Critique Opus (Fable interdit).

## Conditions
- Claude in Chrome, onglet propre 1005988342. Fenêtre réelle 2560 × 1305, iframe refusée (X-Frame/CSP) : 390 émulé dans la page
  (media queries réécrites, hover none / pointer coarse, matchMedia, innerWidth, clientWidth, body 390 × 1305 translateZ ; hauteur réelle gardée).
- Gestes souris (pas de vrai tactile).

## Gestes (au fil)
1. Bundle sans cache : `/index.html` no-store → `assets/index-C59jDixU.js`, script chargé identique. Pas de service worker. OK.
2. Session : avatar « G », Finances avec données (En caisse −32,00) : session du brasseur active. OK.
3. Calendrier 390 clair : en-tête mobile, frise S49–S50, rangées Fêtes/Ventes/Achats vides au départ.
4. Feuille d'ajout Fêtes : puces de semaine = boutons 28 × 48 contigus (pas 28), case dessinée 24 × 48, 0 px mort ; elementFromPoint
   au bord S50|S51 : x+27 → S50, x+28 → S51. Toucher réel au centre de S50 → S50 seule ; toucher réel à 1 px du bord gauche de S51 → S51
   ajoutée (plage S50 → S51). Point n° 3 OK. (Le texte de date des puces est à 12 px : doute, non compté.)
5. Fête « ZZ TEST — fête 3 j » créée en S50, 3 j (gestes réels : puce, 3 j, nom, Ajouter en S50). Visible dans Fêtes.
6. Achat « ZZ TEST — achat 1 j lié » (−1) et vente « ZZ TEST — vente 1 j » (+1) créés en S50 ; achat lié à la fête par Lier (toast « Liée à ZZ TEST — fête 3 j »).
   (Lier depuis la fête ne propose que Brassins et Clients réels : non touché.)
7. Fiche de la fête (toucher réel) : « Semaine S50 » puis « 7 – 13 déc. » sur sa ligne, sans virgule. Point n° 7 OK.
8. Fil au toucher de la fête : `M196.1 657.0V634.5H216.1V602.5H276.1V260.0` (écran : achat (208,897) → fête (288,500)), 239 points
   échantillonnés tous les 2 px, elementsFromPoint + rectangles de texte : seuls « Fenêtre », « → », « confirmé S49–S50 » touchés, tous sous
   la fiche ouverte (trou du masque) ; 0 texte ni icône traversé visible. Vue : le fil longe l'icône de la vente (à ~6 px) sans la toucher,
   la vente non liée est grisée. Point n° 1 OK.
9. Menu période (toucher réel) → Échelle Jour : bouton « 2 sem. · j » 80,5 px, texte à 5 px du bord gauche, chevron à 5 px du bord droit,
   3 px texte → chevron, scrollWidth 81 = clientWidth 81. Vu net. Point n° 4 OK.
10. Vue Jour 390 : « CHF à dépenser » finit à 153,8, « ± » commence à 165,5 → 11,7 px ; montant −660 à 21 px. Aucun chevauchement. Point n° 5 OK.
(reprise close)
11. Glisser (n° 2) : événements pointeur synthétiques par pas de 3 px (mouse et touch, appui 700 ms) sur la vente : aucun effet (isTrusted
    probablement exigé). Repli : glisser réel (CDP, en un saut) : vente ponctuelle non déplaçable (reste 7 déc.) ; barre de la fête
    7 déc. → 14 déc. (S50 → S51) = +7 j exact, toast « Annuler ». N° 2 OK sur la barre, non prouvé « par petits pas ». Doute : l'achat lié
    n'a pas suivi la fête (reste 7 déc.).
12. N° 6 (paysage aligné) non jouable : pas de rotation possible (fenêtre 2560 figée).
13. Nettoyage : fête RETIRÉE (fiche → Retirer). Restent EN LIGNE : « ZZ TEST — vente 1 j » et « ZZ TEST — achat 1 j lié » (S50, 7 déc.),
    à retirer : toucher réel de leur marque (button.cal-marque, aria-label « ZZ TEST — … ») puis Retirer. .click() JS n'ouvre pas la fiche.
14. Nettoyage terminé : vente et achat retirés (toucher réel + Retirer). Rechargement : Calendrier, Finances › Opérations, Prévisions :
    aucun « ZZ TEST ». Onglet 1005988342 fermé.
15. Console : 2 erreurs Firestore « Detected an update time that is in the future » (1 ms d'écart, horloge), aucune erreur de l'app.

## Verdict — combien et quels problèmes ?
Points : n° 1 OK, n° 3 OK, n° 4 OK, n° 5 OK, n° 7 OK ; n° 2 OK sur la barre (+7 j exact) mais non prouvé par petits pas (pointeurs
synthétiques sans effet, glisser réel en un saut) ; n° 6 non jouable (rotation impossible).

1. Les marques ponctuelles (vente, achat) ne se glissent pas en vue Semaine : glisser réel sans effet, la vente reste au 7 déc. (pas pratique
   si le brasseur veut décaler une vente ; non bloquant, hors des 7 points).

Doutes, non comptés :
- L'achat lié n'a pas suivi la fête glissée d'une semaine (reste 7 déc., fête au 14 déc.) : à confirmer comme voulu.
- Puces de semaine : texte de date à 12 px.
- Fil : longe l'icône de la vente à ~6 px ; jugé sur 390 émulé à la souris, pas au doigt.
