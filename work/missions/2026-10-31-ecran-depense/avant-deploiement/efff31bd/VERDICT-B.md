OK — 8 problèmes, 2 bloquants

# Test d'écran — Finances, partie B : les 8 vues portées, côte à côte avec ses maquettes

Version : efff31bd (arbre propre). Banc local `?dev-local&finance-demo` (profil `=reel` pour le profil vide), profil Chrome neuf par
scénario, requêtes hors localhost coupées (Gemini jamais joint : seules les polices Google bloquées). 390 tactile clair et 1280 sombre.
Scripts : `b/capturer.mjs` (repris de 762f37df, scénarios dbl, prev, bien, profildemo, profil, budget, ia), `b/montage.mjs` (planches
`b/M-*.png`, maquette choisie en tête de rang). Aucune erreur de page. Rien d'écrit hors du navigateur de test (la paire « ZZ-DBL »
et le rangement des archives vivent dans ce seul profil).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| b/dbl-repos-390-clair.png | clair | 390 | Doublons, la paire au repos (m1do-a) | 0 | 0 |
| b/dbl-annule-390-clair.png | clair | 390 | après « Annuler celle-ci » | 1 | 0 |
| b/dbl-repos-1280-sombre.png, b/dbl-annule-1280-sombre.png | sombre | 1280 | mêmes états (même problème 4) | 0 | 0 |
| b/arc-repos-390-clair.png | clair | 390 | Les archives, rien rangé (m1ar-c) | 0 | 0 |
| b/arc-poignee-390-clair.png, b/arc-range-390-clair.png | clair | 390 | poignée sur 2025, puis « Ranger 2024 à 2025 » | 0 | 0 |
| b/arc-consulte-390-clair.png | clair | 390 | « Consulter » 2024 | 0 | 0 |
| b/arc-repos-1280-sombre.png … b/arc-range-1280-sombre.png | sombre | 1280 | mêmes états | 0 | 0 |
| b/arc-consulte-1280-sombre.png | sombre | 1280 | « Consulter » 2024 | 1 | 0 |
| b/pr-ouvert-390-clair.png | clair | 390 | Prévoir une dépense, vide (m3pr-c) | 1 | 0 |
| b/pr-rempli-390-clair.png, b/pr-rempli-bas-390-clair.png | clair | 390 | Loyer 500,50, Chaque mois | 0 | 0 |
| b/pr-ouvert-1280-sombre.png, b/pr-rempli-1280-sombre.png | sombre | 1280 | mêmes états | 0 | 0 |
| b/prev-onglet-390-clair.png | clair | 390 | onglet Prévisions, Avec / Sans fermenteur (fond de m3pm-d) | 1 | 1 |
| b/prev-onglet-1280-sombre.png | sombre | 1280 | même état | 0 | 0 |
| b/pm-liste-390-clair.png, b/pm-liste-1280-sombre.png | les deux | 390, 1280 | Mes projets de matériel | 0 | 0 |
| b/pm-ouvert-390-clair.png, b/pm-ouvert-1280-sombre.png | les deux | 390, 1280 | Fermenteur supplémentaire, à étudier (m3pm-d) | 0 | 0 |
| b/pm-pret-390-clair.png | clair | 390 | après « Prêt à acheter » | 1 | 0 |
| b/pm-pret-1280-sombre.png | sombre | 1280 | même état (même problème 3) | 0 | 0 |
| b/im-etape4-390-clair.png, b/im-etape4-1280-sombre.png | les deux | 390, 1280 | Clôture 2026, étape 4 | 0 | 0 |
| b/im-ouvert-390-clair.png, b/im-ouvert-1280-sombre.png | les deux | 390, 1280 | Cuve de fermentation, 20 % du reste (m3im-c) | 0 | 0 |
| b/im-10pc-390-clair.png, b/im-10pc-1280-sombre.png | les deux | 390, 1280 | après « 10 % du prix » : 180,00 | 0 | 0 |
| b/bb-choix-390-clair.png, b/bb-choix-1280-sombre.png | les deux | 390, 1280 | Quel brassin veux-tu estimer ? | 0 | 0 |
| b/bb-repos-390-clair.png | clair | 390 | Budget Pale Ale de septembre (m4bb-a) | 1 | 1 |
| b/bb-c3a-390-clair.png, b/bb-c3a-bas-390-clair.png | clair | 390 | détail du litre à un toucher (c3a) | 0 | 0 |
| b/bb-rangee-390-clair.png | clair | 390 | rangée Pilsner touchée | 0 | 0 |
| b/bb-repos-1280-sombre.png … b/bb-rangee-1280-sombre.png | sombre | 1280 | mêmes états | 0 | 0 |
| b/pfd-ouvert-390-clair.png, b/pfd-ouvert-bas-390-clair.png | clair | 390 | Solde et paramètres (démo), 1 200 L/an (m4pf-c) | 0 | 0 |
| b/pf-ouvert-390-clair.png, b/pf-apres-390-clair.png | clair | 390 | profil vide, puis 2 500 L/an et « depuis janv. » | 0 | 0 |
| b/pfd-ouvert-1280-sombre.png | sombre | 1280 | Solde et paramètres (démo) | 1 | 0 |
| b/pf-ouvert-1280-sombre.png, b/pf-apres-1280-sombre.png | sombre | 1280 | profil vide, puis réglé | 0 | 0 |
| b/ia-feuille-390-clair.png | clair | 390 | Compagnon, la question (m4ia-c) | 2 | 0 |
| b/ia-coche-390-clair.png, b/ia-chat-390-clair.png | clair | 390 | pastilles changées, puis « Envoyer » | 0 | 0 |
| b/ia-feuille-1280-sombre.png … b/ia-chat-1280-sombre.png | sombre | 1280 | mêmes états | 0 | 0 |

Bloquants : 2

## Problèmes

1. **Budget à 390 : le bouton principal « Prévoir 64,26 » est coupé au bord droit**, on lit « Prévoir 64,2 » (bb-repos, bb-c3a,
   bb-c3a-bas, 390 clair). La rangée Expliquer · Enregistrer · Prévoir déborde ; m4bb-a la tient en entier. Bloquant (texte illisible :
   le montant du geste est tronqué).
2. **Prévisions à 390 : la tuile « Sans fermenteur supplémentaire » est coupée**, son montant 2 857,34 n'est pas visible
   (prev-onglet 390 clair). m3pm-d montre les deux tuiles entières (« Avec frigo » / « Sans frigo 2 107,34 »). Le nom du projet est
   trop long pour la tuile. Bloquant (valeur absente de l'écran).
3. Projet matériel : toucher « Prêt à acheter » ouvre bien son panneau (Payé en janv. 2027, dans mes prévisions), mais l'étape reste
   « À étudier » (anneau bleu), Devis non coché, aucun « tu en es là » (pm-pret, 390 et 1280). Dans m3pm-d, l'étape touchée devient
   l'étape en cours, les précédentes cochées.
4. Doublons : après « Annuler celle-ci », le bandeau dit toujours « 2 pièces peut-être en double » et la puce « Doublons 2 »
   (dbl-annule, 390 et 1280). m1do-a : « Doublons : plus rien, le filtre se referme ».
5. Archives consultées à 1280 : la période affiche deux champs vides « du jj.mm.aaaa au jj.mm.aaaa » (arc-consulte 1280 sombre) ;
   format machine, rien à y faire en archive. À 390 ils n'apparaissent pas.
6. Profil à 1280 : le contenu tient dans une colonne d'environ 300 px au milieu d'une feuille de 720 px ; les tuiles sont serrées
   (« brassins de 27 » / « L » seul à la ligne, « avec ce / réglage »), et « Précisions » et Annuler ne sont pas alignés sur cette
   colonne (pfd-ouvert 1280 sombre).
7. Toutes les feuilles s'ouvrent avec la croix × entourée d'un gros cadre (noir en clair, blanc en sombre) : Prévoir, Projet,
   Cuve, Profil, Compagnon, Archives, Budget. Ses maquettes (m3pr-c, m3pm-d, m3im-c, m4pf-c, m4ia-c) ont une croix simple.
8. Compagnon : sous les pastilles, une phrase absente de m4ia-c et pas en brasseur : « Il lit aussi le registre : une pastille
   décochée lui est demandée en consigne, elle n'est pas coupée du registre » (ia-feuille, 390 et 1280).

Corrigés depuis 762f37df (vus) : le profil dit « Pale Ale ≥ 7,51/L », comme le budget (202,77 ÷ 27 L), plus coupé ; « Envoyer »
envoie directement (message posé, « Envoi à confirmer » hors connexion) ; la question dit « novembre 2026 » ; la poignée des archives
est sur la frise.

## Doutes (non comptés)

- Banc : la recette « Pale Ale de septembre » n'a ni houblon ni levure (« hors recette ») ; l'écran le dit honnêtement, mais une Pale
  Ale sans houblon n'existe pas : fixture à corriger, pas l'écran. Pilsner 6 kg à 44,83 (7,47 CHF/kg) : cher, fixture.
- Doublons : « saisies le 14 et le 15 janv. » pour deux pièces payées le 15 nov. : dates de la paire écrite par le script.
- Archives 2024 consultées : la pastille « en retard 60,00 » (de l'année en cours) reste en tête ; m1ar-c dit « 60,00 reste au suivi ».
- Budget, rangée Pilsner : « Retour au budget » en haut et « Retour » en bas, deux retours.
- Prévisions : l'étiquette « sans fermenteur supplémentaire 2 857,34 » chevauche la marche de la courbe (390 et 1280).
- Non vus dans cette partie : 390 sombre et 1280 clair (vus en 762f37df sur les mêmes vues).
