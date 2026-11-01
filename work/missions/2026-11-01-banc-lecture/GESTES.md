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
| 3 | QR-facture lu sans IA (zxing-wasm), Swico S1 | — | attend son accord : dépendance neuve (~1 Mio, MIT) | sur oui : contrôle croisé au banc, puis production |
| 4 | Deux Flash-Lite, la 3.8 sur désaccord, valeurs de la 3.8, statut du vote | C★v | mesuré (k4, 12 pièces) : 0 faux vert, 11 pièces sur 12 lues (son PDF de 37 lignes : les deux Flash-Lite coupées à 5 100 jetons), 117/129 champs, 163/173 lignes, 0,044 CHF par facture contre 0,078 pour A | pas de bascule proposée ; le repli sur la 3.8 quand une Flash-Lite manque est écrit au banc (01.11), à mesurer |
| 5 | 3ᵉ lecture ciblée sur la zone en doute | — | plus tard : après k4 (savoir d'abord quelles zones se trompent) | voie k5 |
| 6 | Réflexion de Flash-Lite : medium, high (le maximum ; ni max ni xhigh chez Google) | Lm, Lh | mesuré (k4) : Lm 71/81, 56/69, 1,8 × plus lent ; Lh coupée sur 2 pièces sur 7 (la réflexion mange la sortie) | non |
| 6 | Consigne propre à Flash-Lite | Lp | mesuré (k4) : 71/81, 56/69, rien de plus | non |
| 7 | Résolution ULTRA_HIGH par image | Uv | mesuré (k4) : 74/81 champs (une photo entière juste), 56/69 lignes | non pour l'instant ; à rejouer avec plus de photos |
| 7 | Tuilage : l'image plus deux tuiles agrandies | Tv | mesuré (k4) : 71/81, 59/69 | non |
| 7 | Photo floue refusée dès la prise (netteté) | — | plus tard : geste d'écran, après k4 | mini maquettes |
| — | Zoom par la 3.8 elle-même (Agentic Vision, exécution de code) | Av | mesuré (k4, 12 pièces) : avec N, 118/129 champs, 169/173 lignes, 0 faux vert, 11 pièces sur 12 (même PDF) ; 24 s médian sur les 7 premières, 45 s sur les 5 neuves ; 0,097 CHF par facture | non pour l'instant : plus lent et plus cher que A, sans gain sur ses pièces neuves |
| 8 | Retirer `temperature` | Hv | mesuré avec Hv : 1 faux vert | non |
| 8 | `responseJsonSchema` à la place de `responseSchema` | — | plus tard : changement sans gain attendu, à faire avec la bascule | production : son accord |
| 9 | Second avis d'un autre fournisseur (Azure prebuilt-invoice) | — | attend son accord : nouveau sous-traitant de ses factures | sur oui : variante au banc |
| — | Plusieurs captures d'une même facture en une lecture | files | mesuré (k4, 3 factures) : toutes les lignes trouvées par A, C★v et Av (78/78), aucune en double ; les frais de port lus comme une ligne (la vérité les laissait hors des lignes : à trancher) ; l'app n'en joint qu'une | production : mini maquettes |
| — | PDF (couche de texte lue par Gemini) | — | mesuré (k4) : A lit ses deux PDF (23/24 champs, 61/63 lignes) ; Flash-Lite coupée sur le long | — |
| — | Plafond de 35 lignes par facture (`SCAN_MAX_ITEMS`) : son PDF 652093 en imprime 37 | Sv | mesuré (k4) : le plafond n'a rien coupé ; la 3.8 a rendu 35 lignes d'elle-même, 2 manquent (l'hypothèse « deux lignes perdues d'office » était fausse) | plus tard : à relever avant une facture de plus de 35 lignes lues |
| — | Exemples montrés à Gemini (few-shot) | — | non : un exemple pris dans ses pièces taille la consigne sur elles (L20) | — |
| — | Skills, plugins, connecteurs MCP pour la lecture de l'app | — | non : ce sont des outils pour Claude, pas pour la Cloud Function (rapport, ligne 129) ; la boucle, elle, devient le skill `banc-lecture` | — |
| — | Autre modèle Google | — | non pour l'instant : 3.5 Flash-Lite et 3.8 sont les plus récents (01.11) | à revoir à chaque nouveau modèle |

Passes k4 (01.11) : 7 pièces × 11 réglages, puis 5 pièces neuves × 3 finalistes ; doc13 (une ligne) non lu, budget D234 à 4,41 CHF sur 5.
Page (01.11 après-midi) : https://claude.ai/artifact/DeoqigGJ8PWhcwa13VS1a8 (source `page-13/index.html`) ; celle du matin : `page/index.html`. Données : 13 pièces (7 + 6 du 01.11). Il n'en a pas plus pour l'instant ; 40 à 60 rendraient un écart de 5 points visible.
