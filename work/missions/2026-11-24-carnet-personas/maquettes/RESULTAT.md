RESULTAT maquettes : 8 versions, page OK, part de donnée 70–89 % (carnet ouvert 88–89 % ; feuilles 29–84 %)

Tests : sans objet (maquettes statiques). Aucun fichier de src/ touché, rien publié.

## Méthode
- Skill maquettes chargé. L'outil Workflow n'existe pas dans cet agent, et un sous-agent ne peut pas en lancer d'autres. J'ai donc joué la méthode seul : base, 8 versions, contrôle, critique au portrait, une correction, contrôle rejoué, puis la page.
- Base : l'app en ligne (captures compact/cap) et les écrans qu'il a figés le 17.11 (h04-7 « le meilleur en vert », h01-6, h05-3). Gardés C1 à C8 et refusés K1 à K5 lus dans maquettes.json › chantiers.carnet. D435 à D437 respectés : puces de domaine, « le choix fait le prix ».
- Trois ajouts du pilote, appliqués à chaque version :
  - 2 ou 3 caractéristiques qui décident, par ligne, avec qui gagne : houblon (α, récolte, CHF/kg) ; chambre froide (volume, °C, prix). Un écran carnet-froid a été ajouté à chaque version.
  - La note rattachée à l'article, déclinée sur deux axes :
    - où elle se montre : badge (v01, v04, v07), sous l'article (v02, v05, v08), dans les notes rattachées (v03, v06) ;
    - ce qu'elle fait au rang : rien (v03, v05, v08), signe seul (v01, v04, v06), rétrograde (v02, v07).
    L'envoi vers la Suisse est montré comme un fait du vendeur.
  - Contrat de 19 h 30 : au repos, le carnet ouvert ne garde que le tableau et la note. L'en-tête de l'app, les onglets Stocks, le lien en clair, Quand, la veille et le champ Ajouter passent derrière ··· ou le +. Script : src/contrat-1930.mjs.
- Prix réels, relevés le 24.11 par la persona brasseur : MotlerHops 1 kg 40,69 € (≈ 41 CHF/kg rendu avec la TVA de 8,1 %) ; Brau 80 CHF/kg à 1 kg, 49 à 5 kg, 39 à 20 kg. Chambre froide : 2 697,74 et 2 987,51 CHF, 2,6 et 4,06 m³, 1,8 et 2,7 m² au sol.
- Valeurs inventées, toutes marquées « exemple » : l'envoi ≈ 15 € et l'article écarté. Les arômes de MotlerHops viennent du catalogue Citra (c'est dit sur l'écran).

## Fichiers (tous dans work/missions/2026-11-24-carnet-personas/maquettes/)
- Versions : v01.html à v08.html. Chacune est assemblée depuis src/vNN.html et src/commun.css ; elles ont 7 écrans de 390 × 844 empilés.
- Scripts :
  - outil.mjs : assembler, rendu, controle, avec la mesure zone/rempli dans mesures.json ;
  - planche.mjs : planches de revue ;
  - src/ajout-v01-v03.mjs, src/ajout-note.mjs, src/correction.mjs, src/contrat-1930.mjs.
- Captures : cap/vNN-<écran>.png ; la version en ligne en cap/actuel-<écran>.png ; planches en cap/planches/ ; page en cap/page/.
- Page : page.html, écrite à la main. Elle a 7 rangées (une par écran) ; chaque rangée montre l'actuel puis v01 à v08. Sous chaque vignette : la part de donnée, les rangs 1 à 5, une note, et un bouton Copier.

## Sorties décisives
- Contrôle de base : controle-vNN.txt, rejoué après la correction et après le contrat de 19 h 30. Les 8 versions sortent BASE OK (4 non vérifiables : C7, C8, K5, CR-VOIX), DURES OK (thème clair, 10 à 13 accents, + à 8 px au-dessus des onglets, centre à 350 px) et STATIQUE OK.
- Page :
  - `verifier-page.mjs page.html --page-lot` : PAGE OK (63 images chargées, lisible à 390 et 1280 px, sans erreur) ;
  - `controle-page-choix.mjs --min=8` : PAGE-CHOIX OK (7 choix, 9 par rangée à 1280, 2 à 390).
- Part de donnée : hauteur laissée au carnet hors barres, sur 844 px. Actuel → versions :
  - liste : 65 → 70 à 89 % ;
  - carnet ouvert : 49 → 88 à 89 % ;
  - fiche : 52 → 72 à 89 % ;
  - Comparer : 57 → 72 à 89 % ;
  - feuilles Articles : 29 à 84 %.

  Le rempli réel du carnet descend à 44–69 % : avec 2 articles, le bas de l'écran reste vide. Je ne l'ai pas comblé avec des données inventées.
- Critique au portrait, une planche par version ouverte :
  - notes : v01 7,5 · v02 7 · v03 7 · v04 7 · v05 7,5 · v06 7,5 · v07 7 · v08 7 ;
  - défauts corrigés en une passe :
    - v01 : libellé coupé ;
    - v02 : jetons qui débordent, Armoire sans texte, rang de l'écran Articles différent de celui du carnet ;
    - v03 : ligne coupée en bas ;
    - v04 : icônes muettes ;
    - v05 : métrique inventée (CHF/m³h) ;
    - v07 : légende de couleurs ;
    - v08 : barres de cellule au sens inversé ;
    - partout : surface au sol corrigée de 0,6 à 0,9 m².
- Captures ouvertes : les 8 planches, la planche des 8 carnets, page-haut.png.

Prédiction : « Ah là on voit les données et qui gagne. v05 pour le prix au kilo, v01 ou v06 pour le tableau, mais il manque encore… »

DÉCISION À PRENDRE :
- (1) Il a barré « le bas », barre d'onglets comprise. La règle dure garde Bord…Clients, et les 8 versions la gardent : à trancher avec lui.
- (2) Sans champ Ajouter dans le carnet (contrat de 19 h 30), c'est un écart au gardé C8 (« champ en bas ») : le + ouvre le champ en bas.
- (3) La note qui rétrograde un article (v02, v07) touche au classement réel : à confirmer avant tout port.

CONNAISSANCE : le prix comparable d'un houblon dépend du conditionnement pris. Citra au kilo, rendu : MotlerHops ≈ 41 CHF ; Brau 80 / 49 / 39 CHF à 1 / 5 / 20 kg. Brau ne passe devant qu'à 20 kg. Le « dès 0,10 » de l'app est un prix au gramme.

LEÇON PROPOSÉE : aucune
