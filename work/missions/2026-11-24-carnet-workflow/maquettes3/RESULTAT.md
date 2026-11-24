RESULTAT maquettes3 : 6 versions, page OK
OK — 6 versions × 10 écrans, 3 histoires + 3 usages + épreuve ; PAGE OK

Tests : sans objet (maquettes statiques). Aucun fichier de src/ touché, rien publié, Chrome 9222 non utilisé (aucun regard en ligne nécessaire : actuel repris de la passe 2).

## Méthode
- Skill maquettes chargé. Ni l'outil Workflow ni les sous-agents ne sont disponibles ici : méthode jouée seul (base, versions, contrôle, critique au portrait, une correction, contrôle rejoué, page à la main).
- Base : le registre (carnet, ra+p5f) et ses classés des passes 1 et 2 : liste en arbre avec icône ou photo, champ « Ajouter à … » toujours visible, cartes d'articles v02 (retiré à droite), barres de Comparer, en-tête compact du carnet ouvert.
- CADRAGE.md :
  - 4 états libres : Noté, Je cherche, Décidé, Résolu ;
  - saisie en un geste : deux lignes, une photo, micro discret ;
  - l'IA range, rattache en citant, étiquette, propose la tâche, ferme les options et écrit le « pourquoi » ;
  - au brasseur : retenir, dater, dire résolu ;
  - ludique sans gadget : coup d'œil, tampon, avant et après, épingle verte, veille qui sonne ; ni points ni série.
- Partis pris :
  - v01 : fil ;
  - v02 : rangées d'état ;
  - v03 : options face à face, fiche « décision » ;
  - v04 : ligne de métro ;
  - v05 : photos, avant et après ;
  - v06 : plan du local (plan d'exemple).
- Écrans, 10 par version : liste, saisie, vapeur, écoulement, résolu, relecture (mars 2027), à faire, CO2, malt, épreuve.

## Cas : dessin et jugement (pas de surapprentissage)
- **Ont servi à dessiner** :
  - ses 3 histoires : vapeur, fusible, écoulement ;
  - ses 3 notes courtes : débit, moisissure, fenêtre ;
  - les 3 usages ajoutés par le pilote : CO2 qui baisse dans un fût, malt en rupture, levure lente.
- **Ont servi à juger seulement**, dessinés après coup dans la forme de chaque version, sans champ nouveau (écran « epreuve ») :
  - une fête en juin ;
  - une assurance à renouveler ;
  - « truc à voir » ;
  - une photo seule sans texte.
- Verdict d'épreuve :
  - v01 à v04 tiennent ;
  - v05 tient : une tuile sans photo montre le picto de sa catégorie ;
  - v06 plie sans casser : 4 cas sur 4 sont sans lieu et vont en liste « Hors du plan ». Le plan perd son intérêt pour ces cas, à dire au brasseur.
  - Aucune version n'est écartée.
- Champs propres à un exemple, retirés avant l'épreuve :
  - v02 : les 4 cases changeaient de libellés selon l'histoire (cause, contact, devis…). Elles sont devenues fixes pour tous : depuis, dernier pas, coût, prochaine ;
  - v06 : la coupe dessinée du tuyau est remplacée par les pistes épinglées sur le plan (✗ siphon, ✗ joint, ✓ raccord), un mécanisme valable pour tout problème situé.

## Fichiers (tous dans maquettes3/)
- CADRAGE.md, critique.md, page.html, RESULTAT.md.
- src/atomes.mjs (pictos, états, photos d'exemple, gabarits), src/v01.mjs à v06.mjs, src/construire.mjs → src/vNN.html → vNN.html (outil.mjs).
- outil.mjs, planche.mjs (repris de la passe 2, ordre des écrans adapté), mesures.json, controle-vNN.txt.
- Captures : cap/vNN-<écran>.png (60), cap/actuel-liste.png et cap/actuel-probleme.png (copiés de la passe 2), planches cap/planches/vNN.png, page cap/page-haut.png, page-page.png, page-ordinateur.png.

## Sorties décisives
- `controle-base carnet --dures --statique`, rejoué après la correction et après chaque ajout : 6 sur 6 BASE OK (4 non vérifiables : C7, C8, K5, CR-VOIX), DURES OK, STATIQUE OK.
  - DURES OK : thème clair, 11 à 13 accents, + centré à 350 px et 8 px au-dessus des onglets.
- Critique au portrait (critique.md) :
  - 20 problèmes, aucun bloquant, tous corrigés en une passe ;
  - notes : v02, v03 et v06 à 7,5 ; v01, v04 et v05 à 7.
- `verifier-page.mjs page.html --page-lot --captures cap/page` : PAGE OK (70 images chargées, lisible à 390 et 1280 px, sans erreur).
  - Premier essai ÉCHEC : l'apostrophe de « d'un » cassait le script. Corrigée en ’.
- `controle-page-choix.mjs --min=6` : PAGE-CHOIX OK (10 choix, 7 vignettes par rangée à 1280 px, 2 à 390 px).
- Part de donnée (mesures.json) :
  - zone laissée au contenu : 77 % (listes) et 82 % (carnets ouverts) ;
  - rempli réel : 32 à 82 %. Les feuilles de saisie (32 à 55 %) laissent voir la liste voilée ; les écrans CO2 et malt de v03 et v05 descendent à 48–55 %.
- Données : ses 3 histoires et ses 3 notes, mot pour mot dans l'esprit. Sont des exemples, marqués « exemple » à l'écran : produits, prix, dates, entreprise X, plan, CO2, malt, levure et cas d'épreuve. Ses vrais carnets restent cités : Houblons citra, Chambre froide, Frigo + congel, Ventilation, Sol, Évier.

Prédiction : « Là c'est fun : le plan et le métro, j'aime l'idée. Pour tous les jours, v02 ou v01, et la fiche pourquoi de v03 pour retrouver mon condenseur. »

DÉCISION À PRENDRE : aucune nouvelle. Restent à lui montrer (pas à trancher) :
- dans v03, le condenseur B est pris sans raison écrite dans ses mots ; l'écran le dit et demande la raison ;
- v06 demande de dessiner le plan réel du local une fois.

CONNAISSANCE : un état de problème tient en 4 états libres ; « fait » n'en est pas un, l'achat qui résout ferme le fil. Le plan du local plie sur tout ce qui n'a pas de lieu (fête, assurance, note vague) : il lui faut une liste « hors du plan ».
LEÇON PROPOSÉE : une page de choix assemblée avec `sed` casse sur une apostrophe dans une chaîne JS ; utiliser ’ ou un remplacement par `split/join` en Node, puis rejouer verifier-page (L26).
