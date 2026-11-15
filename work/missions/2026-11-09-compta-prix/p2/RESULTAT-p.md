OK — voie p passe 2 : p3a–p3d (quatre variantes de p1b) et e1a–e1c (trois rangements), statiques, COMMUN OK, MOTS OK ; PANEL en écart

## Fichiers écrits (tous dans `work/missions/2026-11-09-compta-prix/p2/`)
- `p3a/`, `p3b/`, `p3c/`, `p3d/`, `e1a/`, `e1b/`, `e1c/` : `etat.html`, `NOTE.md`, `<id>-haut.png`, `<id>-page.png` (premier écran + état annexe), `<id>-1280.png`.
- `p3a/capturer-1280.mjs` (captures 1280 des sept ; même script que v0/p-outils, chemins p2).
- Rien ailleurs : `git status --short` ne montre que `p2/` (et les fichiers déjà modifiés avant la voie).

## Les sept
- **p3a** — p1b affinée : segment 30 j · 90 j · 12 mois (greffe p1a), numéros des marches sur l'escalier, rouge « À payer 460,00 » / bleu « Prévu ~ 1 614,26 » nommés, « plus bas, 25 janv. » sans chevauchement. Annexe 12 mois : sous zéro le 25 juillet, − 1 492,66, dit en mots, primaire « Prévoir une entrée ».
- **p3b** — quand acheter ? quatre petits escaliers (nov. · déc. · janv. · pas, greffe p1c) : la fin ne bouge pas (2 107,34), le chemin oui ; « juste après l'achat » 2 907,34 · 2 507,34 · 2 507,34 ; le mois choisi en grand, les autres en pointillé de leur couleur. Annexe : nov.
- **p3c** — l'escalier couché : le point bas en réponse, puis chaque sortie est une ligne datée dont la barre est le solde après ; hachures = sans le fermenteur ; axe 0 – 4 000. Annexe (greffe p1a) : solde de départ à confirmer, barres hachurées, « Je confirme ».
- **p3d** — et si je vends ? une marche verte remonte si les 27 L se vendent ; format vendu en tuiles (33 cl + 405 · 75 cl + 360 · fût + 265, prix exemple) ; cartes « Sans vente 2 107,34 / Vendue en 33 cl 2 512,34 ». Annexe : 75 cl.
- **e1a** — tout l'argent dans Finances : cinquième onglet « Prix » (litre, trois formats coûte → vendu → reste, règle de l'impôt) ; Clients réduit à Clients · Factures (frame 2).
- **e1b** — près de la bière : onglet « Argent » dans la fiche du brassin, chaîne verticale en six marches du litre au brassin entier (202,23) ; la liste des brassins porte litre et reste (frame 2).
- **e1c** — deux portes dans Synthèse (« Mon litre, mon prix », « Impôt bière ») avec leur chiffre visible ; au toucher une feuille monte sur place (frame 2). Aucun onglet de plus.

## Sorties décisives
- `verifier-page.mjs <etat.html> --captures … --min-images 0` : **PAGE OK** × 7.
- `p3a/capturer-1280.mjs` : **CAPTURES 1280 OK** (débord 0, erreurs 0, × 7).
- `mots-premier-ecran.mjs p2 … --page=etat.html --profil=sans-houblons --sans-donnees --max=60` : **MOTS OK** — p3a 60 · p3b 60 · p3c 60 · p3d 57 · e1a 60 · e1b 60 · e1c 59. Les « · », « → » et « ? » de séparation sont en CSS (le compteur les prenait pour des mots) ; aucune phrase d'aide au repos.
- `controle-commun.mjs p2 p3a p3b p3c p3d e1a e1b e1c --page=etat.html --profil=sans-houblons --sans=mots` : **COMMUN OK** (couleurs, survol, blocs, contraste, standard, parlant, brutes ; au-style, fiche, trait, légende sautés par le profil). Corrigés en route : rayons à l'échelle 10 / 16 / 24 / pilule ; 29 contrastes (étiquettes sur l'aire bleue, texte blanc sur ambre, violet Clients) ; troisième teinte sur e1b, p3c, p3d.
- `controle-panel.mjs` (7 `-haut.png`) : **PANEL ECHEC** — remplissage médian 0,53 (0,55 visé), 3 sous 0,50 (e1a 0,47, e1b 0,49, p3c 0,50) ; ressemblance 0,92 ; 1 paire ≥ 0,95 (p3b ~ p3d). Lecture : les quatre p3 sont, par contrat, des variantes proches de p1b (cartes + escalier) et les trois e1 partagent le chrome de l'app par nature (ce sont des rangements) ; le contrôle est calibré pour un panel v0 de concepts tous différents. Les trois écrans de placement sont les plus légers, à dessein.
- Transversales du critique : 7,51 CHF/L tout compris partout, 6,37 « bière seule » seulement à côté de 7,51 (e1a, e1b) ; grille 5,00 · 10,00 · 160,00 marquée exemple (p3d, e1a–c) ; payé ≠ à payer ≠ coût nommés (p3a, p3c, e1c) ; 27 L nets ; hors fixture = exemple ; glossaire « À payer », « Il te reste », « Gagné » ; aucune rangée de fournisseurs ; couleurs et hachures nommées ; décimales constantes.
- Statique : aucun script ; chaque état utile est dessiné dans un second cadre, à côté.
- Non fait : thème cave ; B5 et B9 non mesurés ; skills `impeccable` et `ui-design-system` non chargés (budget), `boosters-ux` déjà lu en v0.

## Captures (ouvertes, L12)
`p2/p3a/p3a-page.png`, `p2/p3b/p3b-page.png` et `p3b-haut.png`, `p2/p3c/p3c-page.png` et `p3c-haut.png`, `p2/p3d/p3d-page.png` et `p3d-haut.png`, `p2/e1a/e1a-page.png`, `p2/e1b/e1b-page.png` et `e1b-haut.png`, `p2/e1c/e1c-page.png`. Les `-1280.png` et les dernières `-haut.png` de p3a, e1a, e1c après retouches n'ont pas été rouvertes (retouches de couleur et de rayon seulement).

## Prédiction
Il gardera p3a comme base (« c'est p1b en mieux »), s'arrêtera sur p3d (« si je vends, j'achète : ça c'est la vraie question ») et trouvera p3b « intéressant mais ça change rien à la fin » ; pour le rangement, il dira e1c (« rien ne bouge, j'ai le chiffre avant de cliquer ») ou e1b (« le prix près de la bière »).

DÉCISION À PRENDRE : le rangement du domaine (e1a / e1b / e1c) est son choix, à lui montrer en page ; le pilote vérifie que les candidates Prix et marges (voie c, c4a–c4e) tiennent dans le contenant choisi (onglet plein, onglet de fiche, ou feuille de 470 px).
CONNAISSANCE : sur la fixture, l'achat du fermenteur ne change pas le solde de fin janvier selon le mois d'achat (toujours 2 107,34) : seule la date du creux bouge ; et la vente des 27 L en 33 cl (405,00) rapporte plus qu'en 75 cl (360,00) ou en fût + bouteilles (265,00) aux prix d'exemple.
LEÇON PROPOSÉE : `mots-premier-ecran --sans-donnees` compte « · », « → », « ? » isolés et « CHF » comme des mots ; une planche qui les emploie en séparateurs part avec 10 à 15 mots de handicap. Les écrire en CSS (`::before`) ou étendre la règle `estDonnee` aux signes de ponctuation isolés éviterait trois essais par concept.
