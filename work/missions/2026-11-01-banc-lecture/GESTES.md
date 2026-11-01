# Les gestes pour mieux lire une facture : où en est chacun

Registre unique (01.11). Chaque geste du rapport `reports/Lecture de factures par vision.md` (tableau, rangs 1 à 9) et du banc a une
ligne : rien n'est mis de côté sans une raison écrite ici. Sa phrase (01.11) : « J'ai l'impression que tout ce qui est skill, harness ou
autre a été un peu mis de côte ». La boucle qui fait avancer ces lignes : skill `banc-lecture`.

États : **mesuré** (chiffre du banc), **au banc** (variante écrite, passe à lancer), **attend son accord** (dépendance, sous-traitant
ou production), **plus tard** (après un résultat), **non** (raison).

| Rang | Geste (nom technique) | Variante | État | Suite |
|---|---|---|---|---|
| 1 | Le code corrige le sûr après lecture (normalisation) | N | mesuré (k4) : C★v +1 champ, +3 lignes ; Av +3 lignes ; A rien ; aucun champ perdu | production avec la bascule, s'il y en a une |
| 2 | Schéma de sortie : base des prix, recopie avant les chiffres, une case par date, TVA par taux, devise fermée | Sv | mesuré (k4, 7 pièces) : 71/81 champs, 56/69 lignes, rien de plus que C★v | non, sauf le plafond de 80 lignes (ligne plus bas) |
| 2 | Consigne après l'image | Hv | mesuré (k4) : 1 faux vert sur 7 pièces | non |
| 3 | QR-facture lu sans IA (zxing-wasm), Swico S1 | QR | accordé (D240) ; mesuré (01.11, zxing-wasm 3.1.5, hors de l'app) : ses 2 PDF B&R portent un QR-facture avec S1 (page 3 et 4, rendues par pdf.js à 3×), montant, devise, n° de facture et date justes, TVA présente, < 0,6 s ; ses bulletins photographiés : 2 QR, montant, devise et créancier justes ; sa facture de 3 pages en une image (1280 × 5230) : QR présent mais illisible (≈ 2,5 px par point, barré par le tampon rouge), même par page, agrandi ou par canal ; 0 QR sur les captures d'écran, son Infomaniak et sa photo CFF | production : lire le QR dans le téléphone avant Gemini, contrôle croisé du montant, de la devise, du n° et de la date ; pour un PDF, pdf.js (accordé, D243) ; module `qrFacture` (voie qr-logique) ; l'écran se choisit sur mini maquettes (voies qr-r, qr-z, qr-u) ; au banc, contrôle croisé +Q (k5) |
| — | Redresser et découper l'image dans le téléphone (une page à la fois, rotation) | — | gratuit, non mesuré | au banc après le QR |
| — | Plafond de sortie de Flash-Lite relevé (5 100 → 8 192 jetons) sur une longue facture | C★v8 | au banc (k5) ; son PDF de 37 lignes coupait les deux Flash-Lite | passe payante sur D242 (25 CHF en tout) |
| — | Flash-Lite avec l'exécution de code (zoom intégré à Gemini) | Avl | au banc (k5) ; mesuré sur la 3.8 seule (Av) | sonde d'un pixel (L20) par le pilote, puis passe sur D242 |
| — | pdf.js : texte des PDF, chaque montant lu doit y exister ; rendu d'une page pour le QR | — | accordé (D243, 01.11 : « Okok ») ; au banc, rendu des PDF pour +Q (k5) | dans l'app après son choix de maquette QR : chargé à la demande, worker servi par l'app |
| — | Tesseract (lecture locale de caractères) | — | non : faible sur photo, ≈ 10 Mo | — |
| 4 | Deux Flash-Lite, la 3.8 sur désaccord, valeurs de la 3.8, statut du vote | C★v | mesuré (k4, 12 pièces) : 0 faux vert, 11 pièces sur 12 lues (son PDF de 37 lignes : les deux Flash-Lite coupées à 5 100 jetons), 117/129 champs, 163/173 lignes, 0,044 CHF par facture contre 0,078 pour A | pas de bascule proposée ; le repli sur la 3.8 quand une Flash-Lite manque est écrit au banc (01.11), à mesurer |
| 5 | 3ᵉ lecture ciblée sur la zone en doute | Zv | au banc (k5) : la 3.8 donne la boîte du champ en désaccord, le banc recadre l'original, la 3.8 relit ce seul champ ; repli : la 3ᵉ lecture complète | passe sur D242 |
| — | Longue image coupée en bandes aux rangées vides, lues en parallèle, recollées (geste repris de `Anionex/dsh-vision-toolkit`, 01.11) | Bv | au banc (k5) : vise sa facture de 3 pages en une image et ses captures longues ; plus rapide si les bandes partent ensemble | passe sur D242 |
| — | PDF lu page par page, en parallèle, recollé | Pv | au banc (k5) : vise son PDF de 37 lignes (deux Flash-Lite coupées) et la lenteur | passe sur D242 |
| — | Même photo reconnue à l'image (empreinte perceptuelle), pas seulement le même fichier | — | plus tard : gratuit ; le même fichier est déjà reconnu en ligne (dp-doublon, D241) | au banc quand deux photos d'une même pièce arrivent |
| — | Boîte à outils `Anionex/dsh-vision-toolkit` telle quelle | — | non (01.11) : elle donne des yeux à un modèle sans vision ; Gemini voit déjà, et son code Python et son hôte n'entrent pas dans l'app | ses gestes repris : bandes (Bv), zoom ciblé (Zv) |
| 6 | Réflexion de Flash-Lite : medium, high (le maximum ; ni max ni xhigh chez Google) | Lm, Lh | mesuré (k4) : Lm 71/81, 56/69, 1,8 × plus lent ; Lh coupée sur 2 pièces sur 7 (la réflexion mange la sortie) | non |
| 6 | Consigne propre à Flash-Lite | Lp | mesuré (k4) : 71/81, 56/69, rien de plus | non |
| 7 | Résolution ULTRA_HIGH par image | Uv | mesuré (k4) : 74/81 champs (une photo entière juste), 56/69 lignes | non pour l'instant ; à rejouer avec plus de photos |
| 7 | Tuilage : l'image plus deux tuiles agrandies | Tv | mesuré (k4) : 71/81, 59/69 | non |
| 7 | Photo floue refusée dès la prise (netteté) | — | plus tard : geste d'écran, après k4 | mini maquettes |
| — | Zoom par la 3.8 elle-même (Agentic Vision, exécution de code) | Av | mesuré (k4, 12 pièces) : avec N, 118/129 champs, 169/173 lignes, 0 faux vert, 11 pièces sur 12 (même PDF) ; 24 s médian sur les 7 premières, 45 s sur les 5 neuves ; 0,097 CHF par facture | non pour l'instant : plus lent et plus cher que A, sans gain sur ses pièces neuves |
| 8 | Retirer `temperature` | Hv | mesuré avec Hv : 1 faux vert | non |
| 8 | `responseJsonSchema` à la place de `responseSchema` | — | plus tard : changement sans gain attendu, à faire avec la bascule | production : son accord |
| 9 | Second avis d'un autre fournisseur (Azure prebuilt-invoice) | — | non (01.11) : payant, et « Je veux pas un nouveau poste de dépense » (SPEC) | — |
| — | Plusieurs captures d'une même facture en une lecture | files | mesuré (k4, 3 factures) : toutes les lignes trouvées par A, C★v et Av (78/78), aucune en double ; les frais de port lus comme une ligne, alors que sa règle dit « Total seulement » (01.11) : la vérité a raison, les trois lectures ajoutent une ligne sur 3 commandes sur 3 ; l'app n'en joint qu'une | production : mini maquettes ; la règle du port entre dans la consigne ou le code des captures |
| — | Port imprimé comme un article (sa facture de 3 pages, son PDF 686863) | — | mesuré hors ligne (01.11) : la vérité le garde en ligne, et les lectures aussi ; le retirer partout casserait ces 2 pièces | sa règle « Total seulement » lue pour les commandes en captures (lecture étroite, L01) ; partout si il le dit |
| — | PDF (couche de texte lue par Gemini) | — | mesuré (k4) : A lit ses deux PDF (23/24 champs, 61/63 lignes) ; Flash-Lite coupée sur le long | — |
| — | Plafond de 35 lignes par facture (`SCAN_MAX_ITEMS`) : son PDF 652093 en imprime 37 | Sv | mesuré (k4) : le plafond n'a rien coupé ; la 3.8 a rendu 35 lignes d'elle-même, 2 manquent (l'hypothèse « deux lignes perdues d'office » était fausse) | plus tard : à relever avant une facture de plus de 35 lignes lues |
| — | Exemples montrés à Gemini (few-shot) | — | non : un exemple pris dans ses pièces taille la consigne sur elles (L20) | — |
| — | Skills, plugins, connecteurs MCP pour la lecture de l'app | — | non : ce sont des outils pour Claude, pas pour la Cloud Function (rapport, ligne 129) ; la boucle, elle, devient le skill `banc-lecture` | — |
| — | Autre modèle Google | — | non pour l'instant : 3.5 Flash-Lite et 3.8 sont les plus récents (01.11) | à revoir à chaque nouveau modèle |

Passes k4 (01.11) : 7 pièces × 11 réglages, puis 5 pièces neuves × 3 finalistes ; doc13 (une ligne) non lu, budget D234 à 4,41 CHF sur 5. D242 (01.11, « J'accorde 20chf de crédit en plus ») : 25 CHF cumulés pour le banc, 3 CHF au plus par passe, `--estimer` d'abord ; passe k5 en préparation.
Page (01.11 après-midi) : https://claude.ai/artifact/DeoqigGJ8PWhcwa13VS1a8 (source `page-13/index.html`) ; celle du matin : `page/index.html`. Données : 13 pièces (7 + 6 du 01.11). Il n'en a pas plus pour l'instant ; 40 à 60 rendraient un écart de 5 points visible.
