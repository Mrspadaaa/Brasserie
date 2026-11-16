OK — e5a à e5d rhabillées : trousse, chrome onglet, feuilles de l'app, IDENTITE OK 4/4

Fichiers écrits : `voies/e5/e5a|e5b|e5c|e5d/etat.html` (réécrits sur la trousse, liens relatifs `../../../outils/identite/`),
les 14 PNG de la série (mêmes noms, refaits par `voies/e5/capture.mjs`), `voies/re5/tests.txt`, ce fichier. Rien hors de la mission.
Les NOTE.md de e5 sont inchangées : l'idée, les textes et les chiffres n'ont pas bougé.

Variantes :
- [x] e5a : la feuille « Préparer un brassin » de la trousse (poignée, rayon 24, ×, pied) est posée sur la vraie liste en id-carte, avec chrome onglet. Recettes en tuiles cave-850, sélection en paille et pastille EBC. Volume au curseur m2 de la trousse (repère 24 de la recette, « 30 plein » hachuré en alerte). Frise de jours, Créer en id-btn-primaire. Au geste : liste en id-carte, pastilles d'état (hop, alerte, eau, cuivre, éteint), puces, toast en jetons · écart restant : dans le titre, « 24 » en mono 28 à côté de « NEIPA » en sans 28 ; tuiles de 48 px, plus hautes que les puces de 28 de l'app.
- [x] e5b : le planning cuve × jour est dans la feuille. Barres en jetons (hop fermente, attention repos, eau garde, alerte pour la Pale Ale en retard, EBC or pour LOT-021), zone libre hachurée en hop, colonne du jour en paille. Recettes à bandeau EBC, jauge de cuve en EBC or, CTA éteint et retour « planifié » en pastille hop. Corrigé ensuite : repère dry hop sous « 19 °C », étiquette « F4 · 30 L » au-dessus du pouce · écart restant : la grille (52 px + 13 colonnes de 24 px) est plus dense que tout écran de l'app.
- [x] e5c : feuille « Rebrasser une recette du carnet ». La carte choisie a un bord paille et un bandeau EBC or à 28 %, avec pastille « écoulée ». Curseur or avec repère hop, frise, Préparer en primaire, trois id-btn-secondaire. Rangs en cartes de 16 px avec liseré EBC et id-pastille d'état. À 1280, grille à deux colonnes et calendrier du mois dans la feuille de 42 rem · écart restant : la carte choisie a un bord de 2 px, absent des cartes de l'app (choix assumé pour marquer la sélection).
- [x] e5d : feuille « Nouveau brassin · LOT-021 ». La phrase à trous est en id-display 28 sur un panneau EBC or à 30 %, avec trous en pointillé et trou actif cerclé de paille. Clavier de choix en panneau cave-850, tuiles EBC à 30 %, règle de volume avec aiguille paille. Le tampon « Planifié » passe à 18/700 en alerte et a été déplacé hors de la date. Pied Annuler / Ouvrir · écart restant : la phrase ne fait plus 50 px et perd de son effet d'affiche, comme le demande la consigne ; le tampon pivoté n'existe nulle part dans l'app.

Critères (sortie dans `voies/re5/tests.txt`, rejoués après la dernière capture) :
- G1 : `IDENTITE OK 4/4`, au lieu de `IDENTITE ECHEC 0/4` au départ (tailles 30 à 50 px, graisses 800 et 900).
- G2 : `RHABILLE OK`.
- G3 : `HORS OK`.

Captures (390 × 844 tactile, ×2) :
- ouvertes et jugées : e5a repos, geste et vide ; e5b repos, geste et vide (avant le petit correctif) ; e5c repos 390 clair ; e5d geste (après correctif).
- refaites mais pas rouvertes, faute de contexte (≈ 190 k) : e5b ×3 après correctif, e5c geste, vide, repos-390-cave et repos-1280-clair, e5d repos et vide.
- Comparaison avec l'app (`a1-banc/captures/liste-remplie-390-clair.png`) : même en-tête, mêmes sous-onglets, même barre du bas et mêmes cartes ; feuille identique à la démo de la trousse.

Prédiction : « Là oui, c'est l'app. Le planning des cuves et la Saison à rebrasser, je les reconnais tout de suite. »

DEMANDE EXECUTANT :
1. Ouvrir (Read) et signaler tout chevauchement, débord ou texte coupé sur :
   - `voies/e5/e5b/e5b-{repos,geste,vide}-390-clair.png`
   - `voies/e5/e5c/e5c-{geste,vide}-390-clair.png`, `e5c-repos-390-cave.png`, `e5c-repos-1280-clair.png`
   - `voies/e5/e5d/e5d-{repos,vide}-390-clair.png`
2. Points à surveiller :
   - e5b : repère dry hop en bas à droite de la barre « 19 °C » ;
   - e5c à 1280 : deux colonnes dans la feuille, calendrier visible ;
   - e5c en cave : contraste du bandeau or et de la carte au bord paille ;
   - e5d au repos : la pastille « LOT-020 prévu » ne mord pas sur « Pale Ale ».
3. Aucune commande à relancer : les critères G1 à G3 sont verts sur ces images.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : avec la trousse, la feuille de l'app prend toute saisie, et chaque variante ne garde que son corps. Le chrome et le fond de liste (id-carte) sont identiques d'une variante à l'autre, comme dans l'app.
LEÇON PROPOSÉE : une voie de rhabillage avec 14 captures à ouvrir dépasse le budget de contexte d'un concepteur (≈ 6 k par image 780 × 1688). Le pilote confie dès le départ la relecture des images au-delà d'une par variante à un exécutant.
