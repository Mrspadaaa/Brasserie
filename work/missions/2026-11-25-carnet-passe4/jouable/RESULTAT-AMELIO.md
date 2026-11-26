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
