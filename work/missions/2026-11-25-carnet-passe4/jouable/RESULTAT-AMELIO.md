OK — p4.html amélioré : 14/14 points, gestes 11/11, 0 erreur de page, captures avant/après

Contrat : work/missions/2026-11-26-liens/AMELIORER-JOUABLES.md (points 1 à 9, puis l'ajout de ~09:40 : points 10 à 14, qui prime).

## Fichiers (tous dans work/missions/2026-11-25-carnet-passe4/jouable/)
- `p4.html` : assemblé par `cap-amelio/src/appliquer.mjs` depuis la référence `git show 8277769ac:…/p4.html` (le p4 publié du 26.11 matin).
  Couche ajoutée : `cap-amelio/src/amelio.css` (classes `a-`, L26) et `cap-amelio/src/amelio.js` (fonctions redéclarées dans la même portée,
  la dernière gagne ; moteur intact : sample, journal, liens/ et demandes/, lecture auto, Organisé par défaut, rien au pouce, noms réels).
  Une seule ligne du moteur touchée : la validation garde 8 articles au lieu de 4 (`cp.articles.slice(0, 8)`), sinon Comparer ne pouvait pas tenir 6 offres.
- `cap-amelio/cap.mjs` (banc : Chrome 9222, onglet propre, 390 × 844, `window.claude` simulé, liens/ simulés avec une image de banc servie
  par interception), `cap-amelio/planches.mjs`, `cap-amelio/600-six-offres.json` (réponse simulée à 6 offres).
- Captures : `cap-amelio/avant/` (11 + 4 planches), `cap-amelio/apres/` (28 + 10 planches), `resultats.json` dans chacun.

## Les 14 points
| # | Point | Fait ? | Preuve (capture après · sortie) |
|---|---|---|---|
| 1 | Moins enfantin, toujours visuel | fait | emoji > 20 px : 5 → 0 (mesure par écran) ; bulles rondes des pistes → lignes « chemin » (trouvé / pas trouvé / à vérifier) ; hachures retirées ; pastille « comparé » retirée ; icônes au trait ; couleur d'état gardée, jauges, barres de prix (10-ecoulement, 18-frigo) |
| 2 | Arbre compact catégorie › sous-catégorie | fait | 13 lignes visibles à 390 × 844 (avant 14, mais sans sous-catégorie) ; colonne de sous-catégorie, une ligne de 44 px par carnet ; toucher une sous-catégorie la replie (16 → 13 lignes) (01-liste, 04-liste-sous-repliee) |
| 3 | Champ texte en bas, + et ✦ | fait | liste et carnet : [champ · photo · micro] ✦ + sur une ligne collée aux onglets ; + vide ouvre Piste / Option / À faire / Lien ; ✦ = Aide de l'IA dans le carnet, « Prochaines actions proposées » dans la liste (sans appel) (03-liste-sugg, 20-plus) |
| 4 | Comparer en vue dédiée, son choix figé | fait | barres du critère classées (h04-7), Côte à côte avec image et meilleur en vert, Compromis, Écartés · n + Reprendre, toutes les caractéristiques, « + Ajouter une caractéristique », « ✦ Proposer » (v03-4) ; critère changé d'un toucher sur sa ligne ; Organisé ne garde que « qui gagne quoi » à quantité égale (410 CHF · 0,68/bt) ; 6 offres en lignes, sans défilement horizontal (13, 14*, 22-24) |
| 5 | Tableau seulement là où il compare | fait | le face-à-face des options devient une liste (nom, qui, l. N, valeur à droite, retenir) ; le seul tableau est Côte à côte (10-ecoulement, 13-comparer) |
| 6 | Précis | fait | dates comptées et jour juste, heure Europe/Zurich (« dans 19 j · ma 15.12 », « 4 j ≈ lu 30.11 », « je 31.12.2026 ») ; « le 15 » lu comme le 15 suivant ; trouvé / pas trouvé / à vérifier / ≈ estimé distingués ; « l. N › » sur chaque valeur ; écoulement : « ≈ 150 CHF · estimé · exemple » |
| 7 | Pratique | fait | action principale sous le pouce (aplat jaune) ; cibles mesurées : aucune < 36 px à l'écran (avant : puce d'état 30 px) ; Comparer à un toucher ; écrire sans ouvrir Mes notes |
| 8 | En-tête utile, pas de frise, Organisé moins textuel | fait | en-tête 48 px (‹, titre, puce catégorie, ⋯), rangée Mes notes n · Organisé · « ✦ 10:37 » + changements à garder ; frise et pastille retirées ; première info utile à 61 px sous la barre (≤ 120) ; cases à repères visuels |
| 9 | Jetons communs | fait | couleurs, tailles, barre du pouce et onglets de mini/COMMUN.md |
| 10 | Thème de l'app | fait | en-tête L'Affinée (logo, Carnets / À faire), onglets Bord … Stocks … Clients, thème « cave », cartes |
| 11 | Idées des maquettes classées | fait | Organisé = O-organise (reprise v04, rang 2) : cases depuis / dernier pas / coût, chemin des pistes, « Pour régler » ; liste = S-liste ; glisser v01 (rang 1) gardé ; Mes notes v04 (rang 1) inchangé |
| 12 | Vraies images | fait (mécanisme) | `liens/<id>.image` (https) affiché dans Liens et Côte à côte, repli : icône au trait de la catégorie, jamais un emoji ; banc : 2 images chargées (16-citra-comparer). Images réelles à remplir par le pilote |
| 13 | Relire et Escalader | fait | lien : Relire → demandes/<id> `type: "relire"`, puce « 🔗 en lecture » (27-citra-relire) ; Escalader → `type: "escalader"` ; carnet : Escalader relance la lecture avec `modelTier: "complex"`, marquée « IA forte » (26-escalader) ; aussi au ⋯ et sur une valeur manquante de Comparer (ESCALADER-SUR-MANQUE) |
| 14 | Tout l'historique (vision, pas bride) | fait | critères ci-dessous |

## Historique en critères (SPEC 16.11 → 26.11, DEFAUTS § CARNET-* et suivants)
| Défaut ou parole | Tenu ? |
|---|---|
| CARNET-DONNEE-PREMIER-PLAN, CARNET-LISTE-COMPACTE | oui : 13 lignes, filtre + repli de domaine et de sous-domaine |
| COMPARER-QUI-GAGNE | oui : vert par ligne, calcul de l'app ; une plage (10–15 %) et un exemple ne gagnent pas ; α sans sens imposé |
| COMPARER-BEAUCOUP-D-OPTIONS | oui : 6 offres en lignes au-delà de 4 (24-six-cote-a-cote) |
| COMPARER-PAS-SON-CHOIX | oui : h04-7 et v03-4, chaque élément présent |
| ESCALADER-SUR-MANQUE | oui : « ✦ Escalader » sur la valeur manquante du critère |
| LIENS-NON-LUS, LIEN-PRIX-JUSTE | « 🔗 en lecture » sinon valeur 🔗 ; prix ambigu gardé « 3,72 € ? » |
| CHAMP-CARNET-REPLIE, CARNET-COHERENT (pas de bande vide, + sur la ligne du champ) | oui |
| PAS-DE-HARCELEMENT | oui : rien au pouce que l'action ; inconnus en « prix ? » à leur place |
| TROP-ENFANTIN, PRO-MAIS-PAS-CLAIR | noms réels, emoji ≤ 16 px, sous-catégories gardées, couleur d'état |
| ENTETE-PEU-UTILE, FRISE-GENERIQUE, ORGANISE-TROP-TEXTUEL | oui (point 8) ; mots au repos non recomptés par script, jugés à l'œil |
| JOUABLE-HORS-THEME | oui (points 10, 12, 13) |
| MESSAGE-RESTE-DANS-SON-CARNET, NOTE-PAS-ARTICLE | inchangés : le champ écrit dans le carnet ouvert ; aucune offre ne naît d'une phrase |
| « une vue spécifique comme au début pour la comparaison » (26.11 08:36) | oui : vue Comparer |

## Sorties décisives (dernier passage : `node cap-amelio/cap.mjs p4.html apres`)
- GESTES 11/11 · ERREURS PAGE 0
- liste : lignesVisibles 13, hauteurMin 44 ; Comparer 600 : gagnants Prix/bt Verallia, Minimum Fournisseur B, Pour 600 Fournisseur B
- Citra : 2 images chargées ; Relire → demande `relire` ; Escalader → tier `complex` · IA forte ; 6 offres : 6 lignes, scrollWidth ≤ 390

Captures ouvertes : planches apres/planche-01, 02, 05, 06, 07, 08, 09, 10 et avant/planche-02, plus 01-liste, 10, 12, 13, 16, 22, 24 seules.

Limites : thème clair non retravaillé (jetons sombres de COMMUN seulement) ; onglets de l'app inertes sauf Stocks ; images de banc (SVG) à la place des vraies ; avant/ pris avec des liens simulés sans prix (les « ? » de Citra avant en viennent en partie).

Prédiction : « Là ça ressemble à l'app : je vois mes sous-catégories, qui gagne, et Comparer comme je l'avais choisi ; reste à voir les vraies photos. »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : une couche d'amélioration se pose sur un jouable par redéclaration de fonctions dans la même portée (la dernière gagne), assemblée depuis la référence git par un script à remplacements uniques ; la validation du moteur plafonnait Comparer à 4 articles.

LEÇON PROPOSÉE : sous Git Bash, un heredoc passé à `node -` perd des barres obliques inverses ; écrire le script de remplacement avec Write, jamais en ligne.

## Passe de correction (26.11 après-midi) — CRITIQUE-AMELIO, « À corriger » 1 à 14

OK — bloquants 7/7, mineurs 25/26 (cibles : en-têtes de catégorie à 30 px, arbitré), gestes 12/12, 0 erreur de page.

Sources modifiées : `cap-amelio/src/amelio.js` (19 fonctions remplacées sur place, bloc « correction du 26.11 » ajouté), `cap-amelio/src/amelio.css`
(bloc ajouté), `cap-amelio/src/appliquer.mjs` (en-tête L'Affinée de Comparer), `cap-amelio/cap.mjs` (banc). `p4.html` réassemblé depuis 8277769ac.

| # (critique) | Défaut | Fait | Preuve |
|---|---|---|---|
| 20 · bloquant | barres inversées | le 1er a la barre pleine, les suivants = meilleur / valeur (h04-7) ; 410 = 100 %, ≥ 504 = 81 % | 13, 22, 23 |
| 21 · bloquant | ligne du critère ni en tête ni teintée, pas d'unité | ligne (ou colonne à 6 offres) du critère en tête, teintée, « critère » ; unité sous chaque libellé (CHF, livrées · CHF / bt · bouteilles · CHF / 100 g) | 13, 14c, 23, 24 |
| 22 · bloquant | 504 CHF ferme sans livraison | « ≥ 504 » + « + livraison ? », barre tiretée ; ne gagne pas, ne nourrit pas le Compromis | 12, 13, 22 |
| 23 · bloquant | Verallia écarté : plus de vert | « ne couvre pas 600 » n'est plus un manque ; Fournisseur B reste vert ; Compromis : « la seule offre qui couvre 600 » | 14d |
| 24 · bloquant | « 3,72 € ? » sans quantité | « 3,72 € / 100 g ≈ 3,50 CHF » (taux ≈ 0,94, estimé, noté sous la vue) ; classé en CHF / 100 g | 15, 15b, 16 |
| 1 · bloquant | noms tronqués dans la liste | sous-catégorie en colonne étroite (68 px, coupée en syllabes), titre sur 2 lignes ; banc : « TEXTES COUPÉS : aucun » ; 13 lignes visibles | 01, 02 |
| 15 · bloquant | action et titres tronqués | titre du carnet sur 2 lignes, catégorie dessous (puce retirée de l'en-tête) ; action du pouce sur 2 lignes, date dessous ; dernier pas entier (3 lignes) | 10, 17, 19, 30 |
| 2, 3, 4 | liste muette | icône au trait par carnet, teintée par l'état ; valeur avec son sens (« dans 4 j / ≈ lu 30.11 », « fusible / 5×20 mm », « 2 options / 480–1 200 CHF ») ; liseré rose retiré | 01 |
| 5, 14 | champ coupé, pas de micro | « Nouveau carnet… », « Écrire… » ; photo et micro dans chaque champ ; cibles 44 | 01, 10 |
| 6, 10 | feuille ✦, dates | « d'après tes notes » ; doublon retiré ; « avant mars » → di 28.2, « avant décembre » → ≈ dans 4 j · lu 30.11 | 03, 18, 29 |
| 7 | barre de défilement | masquée | 01, 02 |
| 8 | Relire/Escalader ×6, + ✦ ×3 | Relire / Escalader / Sa ligne au ⋯ du lien ; une paire visible (lecture du carnet) ; + ✦ des sections retirés (restent au pouce) | 15b, 27a |
| 9, 11 | libellés muets | « ✦ 2 à garder » ; « 9 valeurs lues · 3 manquent » ; « température 14 °C · au lieu de 2 °C », « quantité 6 fûts », « montant 1 500 CHF » | 12, 18, 29 |
| 12 | vide d'Organisé | 600 bouteilles : barres à quantité égale dans « Qui gagne quoi » ; Assurance : environ 70 px | 12, 19 |
| 13 | « Décidé » / « pas encore » | « décidé · Acheter le condenser » ; « il manque : prix » | 17 |
| 14 | frigo | échéance comptée sous le pouce ; « 720 CHF d'écart · calcul de l'app » visible | 18 |
| 16 | emoji en couleur | remplacés par les icônes au trait (16 px) hors Mes notes ; un emoji sans icône est retiré | toutes |
| 17 | toasts au milieu, IA forte | toasts au-dessus de la barre du pouce ; « IA forte » sur la ligne « lu … » après la relecture | 26 |
| 18, 19 | « le 22 », exemple | « le 22 nov. » ; « Contacter l'entreprise X · exemple » | 30, 10 |
| 25 | « × 600 » vert | « par 600 » ; un minimum ne gagne jamais | 13 |
| 26 | faux compromis | modèle h04-7 : 14c « Fournisseur B (2e), 0,55 CHF / bt pour 410 CHF, soit au moins 94 CHF de moins que la 1re… » ; sinon « aucun » + pourquoi | 14b, 14c |
| 27 | « Classé par » répété | pastille retirée ; « 3 offres · Classé par … » puis la carte (« critère › » change le critère) | 13 |
| 28 | « Frais de port » | ne s'affiche plus quand « Livraison » existe | 14e |
| 29 | Brouwland | « prix en € ? · livraison ? » ; cellule « 0,65 € ? · en €, à vérifier » | 23, 24 |
| 30 | « Choisir » rogné | le nom de l'offre ouvre une feuille Choisir / Écarter / Sa ligne (v03-4 : « nom › ») ; « Bouteilles33.ch » entier | 14f, 24 |
| 31 | icônes identiques, rangs | image seulement si une offre en a ; « 1re / 2e » retirés ; en-têtes alignés en haut | 13, 16 |
| 32 | pas d'en-tête L'Affinée | logo et « L'Affinée », puis « ← 600 bouteilles 33 cl » | 13 |
| 33 · partiel | banc à 36 px | banc à 44 px sur chaque capture, et textes coupés mesurés. Reste : en-têtes de catégorie de la liste (30 px), gardés pour tenir 13 carnets visibles (contrat point 2) | sortie ci-dessous |

Corrigé en passant : les feuilles ouvertes dans Comparer (critère, offre) s'ouvraient dans la liste cachée ; elles s'ouvrent maintenant dans la vue affichée.

Sorties (`node cap-amelio/cap.mjs p4.html apres`) :
- GESTES 12/12 · ERREURS PAGE 0. Nouveaux gestes : Choisir Fournisseur B depuis sa colonne (« ✓ choisi » dans Comparer et Organisé, pouce « Commander · Fournisseur B ») ; le ⋯ du lien → Relire.
- liste : lignesVisibles 13, hauteurMin 44 ; TEXTES COUPÉS : aucun.
- CIBLES < 44 : seulement les en-têtes de catégorie (« ▾ Brasserie 13 », « ✓ 3 résolus ») à 30 px.
- gagnants 600 : [Verallia (Prix / bt), –, –, Fournisseur B (Pour 600)] ; Verallia écarté : Fournisseur B vert.

Captures : `cap-amelio/apres/` (33 et 11 planches), toutes ouvertes. Avant = version 0c99fc9a0, jugée dans CRITIQUE-AMELIO.md.
Limites : thème clair non retravaillé ; 1280 px non capturé ; images de banc (SVG) à la place des vraies ; le taux € → CHF est une estimation fixe (0,94), marquée ≈.

Prédiction : « Là, Comparer c'est mon choix : le meilleur a la barre pleine, et je vois tout de suite que Verallia, c'est au moins 504 sans la livraison. »

LEÇON PROPOSÉE : une feuille ou une fenêtre ouverte depuis une vue ajoutée se teste dans cette vue ; ici, `ouvrirFeuille` visait la liste cachée, et ni le banc ni le critique ne l'avaient vu, faute de geste qui ouvre une feuille dans Comparer.
