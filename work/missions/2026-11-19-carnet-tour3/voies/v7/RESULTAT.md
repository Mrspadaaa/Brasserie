v7 : 4 lignes rejouées en local (banc ?preview=carnets et app ?dev-local, port 5197) : 2 corrige, 1 present (en partie), 1 corrige en local / ouvert-gemini en ligne ; 3 défauts neufs

# Voie v7 — 4 constats non conclus par v2

Code servi : `port-carnet`, branche `claude/port-carnet-1711`, HEAD 70e8ecdb6 (modifs non commitées d'autres sessions, hors carnet). Aucun fichier de code touché.
Scripts : `rejeu.mjs` (sol, levure, article, app, bancSombre), `rejeu2.mjs` (cartes nées d'une note, planches). Journaux : `captures/journal-tout.txt`, `captures/journal-rejeu2.txt`.
Captures ouvertes : sol-1280-clair-a-apres, levure-eteint-390-clair-a-apres, t2-sol-1280-brassin, t2-levure-eteint-390-brassin, article-murale-390/1280-clair,
article-inox-390-clair, planches pl-app-390, pl-app-1280 (4 étapes × clair et sombre), pl-banc-sombre (zéro, liste, carnet ouvert à 390 et 1280).
Sombre de l'app : `data-theme="cave"` posé sur la page (même attribut que le banc), pas par le menu de l'app. Tests : aucun lancé.

| id | verdict | observé (≤ 25 mots) | capture | taille |
|---|---|---|---|---|
| PCN-76 | corrige | Note « sol » : Carnets 6 → 8, « 3 lignes rangées dans 3 carnets ». « Résine pour le sol du local » (majuscule) dans le groupe « Idée 4 », sous Prochain brassin. | sol-*-clair-a-apres, t2-sol-1280-brassin | 1280, 390 (DOM : Idée 4) |
| PCN-110 | present (en partie) | Photo « photo de la page collée · exemple » entière (Hotte murale) ; sans photo, picto entier (92 dans 104 à 390). « lues sur la fiche du vendeur » : absente partout. | article-murale-*, article-inox-* | 390, 1280 |
| PCN-112 | corrige | Carte « Prochain brassin » : « « Sachets de levure x2. Prochain brassage mardi. » », phrases ponctuées, hotte exclue ; IA simulée et IA éteinte identiques. 390 : coupée « x2.… ». | t2-levure-*-brassin, levure-eteint-390-clair-a-apres | 1280, 390 |
| PCN-NOTE-4 | corrige (local) / ouvert-gemini (en ligne) | App ?dev-local : liste vide, carnet né, lien rangé, liste ; banc : zéro, liste, carnet ouvert ; clair et sombre lisibles, rien coupé. En ligne : carnet impossible sans Gemini. | pl-app-390, pl-app-1280, pl-banc-sombre | 390, 1280 |

Cause de PCN-110 (lecture du code, pas un rendu) : `FicheArticle.tsx:89` n'affiche la ligne que si une valeur porte `luLe` ; `CarnetsVue.tsx:391` construit les
valeurs lues d'une page en `{ valeur, unite, origine: 'page' }`, sans `luLe`, et rien d'autre ne le pose (grep `luLe` dans src). La ligne ne peut donc jamais paraître.
Dans le carnet, la carte d'article dit en revanche « ✻ lu sur la page : nom, prix, débit, température max, tient 80 °C » (app-*-3-carnet-lien).

## Défauts neufs

1. Puce proposée dans le carnet Frigo : « Comparer sur le température mini (°C) » : article masculin devant un nom féminin (app-*-3-carnet-lien, 390 et 1280).
2. Carnet né de la note « sol » : vignette réduite à une lettre « R » au lieu d'un objet dessiné, seul de la liste dans ce cas (t2-sol-1280-brassin).
3. 390 : la citation de « Prochain brassin » se coupe en « « Sachets de levure x2.… » » (point puis points de suspension) ; la 2e phrase n'est pas visible (t2-levure-eteint-390-brassin).

Rappel (déjà noté par v2, défaut 4) : le carnet né de « frigo de garde pour 6 fûts » garde le titre en minuscule (« votre phrase en titre »), dans l'app à 390 et 1280.

Serveur 5197 arrêté à la fin (vérifié, port libre).
