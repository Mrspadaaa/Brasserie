OK — 4 Ateliers R&D d'un autre genre : carnet, ardoise, planche, étiquettes

## En 5 lignes
1. Il a dit (15.11) : « · L'Atelier R&D toujours pas super convaincu » ; « toujours » vise e9a à e9d et la vue actuelle.
2. On lit : l'idée des quatre (suivre des statuts) ne le touche pas ; un défaut de finition n'aurait pas tout fait tomber (PORTRAIT § 1.1).
3. Genres choisis : le carnet que l'IA range (froide), l'ardoise du bar (tiède), la planche de dégustation (tiède), les étiquettes de ma gamme (chaude).
4. Au repos, à 390 : un champ d'écriture et des notes manuscrites ; un grand tableau noir ; une rangée de verres colorés ; une grille d'étiquettes en couleurs.
5. Aucune ne reprend une piste d'avancement, un chemin, une frise des semaines ni une carte à deux axes ; le statut reste dans la fiche, en une pastille.

## Pourquoi les quatre ne convainquent pas (hypothèses sourcées)
- H1. **Un tableau de chef de projet, pas un atelier de brasseur.** Les quatre font d'un statut (idée → recherche → devis → validé,
  `handleToggleStatus`, `CreativeLabTab.tsx` l. 122-134) l'objet principal : piste (e9a), bandes (e9b), frise (e9c), quadrants (e9d).
  Le brasseur pense en goût et en arômes (L04, [[penser-brasseur]]) ; une idée de bière y reste un nom et une puce.
- H2. **« Devis » sur une bière n'existe pas** (L14 : « est-ce que ça existe en vrai ? ») ; e9b le reconnaît dans sa NOTE (« une bière
  n'a pas de devis »). Le statut sert le matériel, qui est parti dans Rénovation.
- H3. **Le même squelette quatre fois** : sous-onglets, rangée de puces, titre-phrase en 28 px, cartes grises (montage des quatre repos).
  Revue du 15.11 : « toutes les propositions se ressemblent ».
- H4. **Noter, le geste premier, est caché** : feuille absente ou idée apparue sans saisie (k3 e9a n° 1, e9d n° 1). Or il veut écrire
  vite, et ses notes arrivent en vrac (15.11 : « utiliser l'ia pas chère pour remettre en place des note en vrac »).
- H5. **Les tarifs sont un calcul à part**, sans lien avec l'idée ni le client (k3 e9a n° 2 : échelles qui ne tiennent pas le carton).
- H6. **Ce qu'il a aimé ailleurs** : le Carnet et le Fil (e3a, e3b : « Je plaise bien ») ; c'est la base de la froide.

## Fichiers écrits (rien hors de voies/e9n/, rien dans src/)
- capture.mjs ; tests.txt ; RESULTAT.md
- e9na/, e9nb/, e9nc/, e9nd/ : etat.html, NOTE.md et 6 PNG chacune (repos, geste, idee, tarifs, vide à 390 clair ; repos à 390 cave) ; e9nb ajoute e9nb-repos-1280-clair.png.

## Critères (tests.txt)
- G1 : SERIE OK
- G2 : IDENTITE OK 4/4
- G3 : NOTE OK 4
- Vitest : aucune suite (rien dans src/).

## Les quatre
- e9na (froide) : le carnet que l'IA range. Geste : après « Noter », deux rangements proposés.
- e9nb (tiède, porte la 1280) : l'ardoise du bar, prix au verre, « Qui la servira ».
- e9nc (tiède) : la planche de dégustation ; le verre touché dit ce qu'il doit sentir. Retouchée : noms des verres plus coupés, vide avec une phrase d'exemple.
- e9nd (chaude) : les étiquettes de ma future gamme ; la plaque ouvre le dos de l'étiquette, la pastille ronde ouvre le prix.

## Captures (toutes ouvertes en planche)
- voies/e9n/e9n[a-d]/e9n?-{repos,geste,idee,tarifs,vide}-390-clair.png, e9n?-repos-390-cave.png, e9nb/e9nb-repos-1280-clair.png
- Planches de relecture : os.tmpdir()/e9n-planche-e9n[a-d].png

## Défauts vus et laissés (pour le critique)
1. e9na : l'état vide garde environ 40 % de bas vide.
2. e9nb : à l'état vide, « Contacts 3 » en tête mais la zone montre l'invite d'ajout ; e9nb donne NEIPA à 6,50, contacts Café du Midi et Le Panier, à faire « Réserver le stand » : les autres en disent moins (pas de contradiction de chiffre, sauf NEIPA « prix ? » dans e9nc).
3. e9nd : le point Épicé (brun) se lit mal sur l'étiquette cuivrée.
4. Le relevé de capture signale « POLICE? » sur quelques états : course de chargement des polices ; les captures montrent bien Source Sans 3 et IBM Plex Mono.

## Prédiction
Les étiquettes (e9nd) et la planche (e9nc) l'arrêtent au repos : enfin des bières, plus un tableau de statuts ; l'ardoise risque « joli mais lourd ».

DÉCISION À PRENDRE : aucune (il choisit sur la page).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
