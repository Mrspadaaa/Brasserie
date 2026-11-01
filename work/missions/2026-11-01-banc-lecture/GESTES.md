# Les gestes pour mieux lire une facture : où en est chacun

Registre unique (01.11). Chaque geste du rapport `reports/Lecture de factures par vision.md` (tableau, rangs 1 à 9) et du banc a une
ligne : rien n'est mis de côté sans une raison écrite ici. Sa phrase (01.11) : « J'ai l'impression que tout ce qui est skill, harness ou
autre a été un peu mis de côte ». La boucle qui fait avancer ces lignes : skill `banc-lecture`.

États : **mesuré** (chiffre du banc), **au banc** (variante écrite, passe à lancer), **attend son accord** (dépendance, sous-traitant
ou production), **plus tard** (après un résultat), **non** (raison).

| Rang | Geste (nom technique) | Variante | État | Suite |
|---|---|---|---|---|
| 1 | Le code corrige le sûr après lecture (normalisation) | N | mesuré hors ligne : C +3 champs, +6 lignes ; C★v + N 187/207 lignes | rejouer sur les 13 |
| 2 | Schéma de sortie : base des prix, recopie avant les chiffres, une case par date, TVA par taux, devise fermée | Sv | au banc (k4) | passe payante k4 |
| 2 | Consigne après l'image | Hv | au banc (k4) | passe payante k4 |
| 3 | QR-facture lu sans IA (zxing-wasm), Swico S1 | — | attend son accord : dépendance neuve (~1 Mio, MIT) | sur oui : contrôle croisé au banc, puis production |
| 4 | Deux Flash-Lite, la 3.8 sur désaccord, valeurs de la 3.8, statut du vote | C★v | mesuré hors ligne (7 pièces) : 0 faux vert, 0,53 CHF contre 1,05 | rejouer sur les 13 ; bascule : son choix |
| 5 | 3ᵉ lecture ciblée sur la zone en doute | — | plus tard : après k4 (savoir d'abord quelles zones se trompent) | voie k5 |
| 6 | Réflexion de Flash-Lite : medium, high (le maximum ; ni max ni xhigh chez Google) | Lm, Lh | au banc (k4, ramenées sur C★v) | passe payante k4 |
| 6 | Consigne propre à Flash-Lite | Lp | au banc (k4, ramenée sur C★v) | passe payante k4 |
| 7 | Résolution ULTRA_HIGH par image | Uv | au banc (k4) | passe payante k4 |
| 7 | Tuilage : l'image plus deux tuiles agrandies | Tv | au banc (k4, sans dépendance neuve) | passe payante k4 |
| 7 | Photo floue refusée dès la prise (netteté) | — | plus tard : geste d'écran, après k4 | mini maquettes |
| — | Zoom par la 3.8 elle-même (Agentic Vision, exécution de code) | Av | au banc (k4) | passe payante k4 |
| 8 | Retirer `temperature` | Hv | au banc (k4) | production : son accord |
| 8 | `responseJsonSchema` à la place de `responseSchema` | — | plus tard : changement sans gain attendu, à faire avec la bascule | production : son accord |
| 9 | Second avis d'un autre fournisseur (Azure prebuilt-invoice) | — | attend son accord : nouveau sous-traitant de ses factures | sur oui : variante au banc |
| — | Plusieurs captures d'une même facture en une lecture | files | au banc (k4) ; l'app n'en joint qu'une | production : mini maquettes |
| — | PDF (couche de texte lue par Gemini) | — | au banc (k4 : doc8, doc9) | — |
| — | Plafond de 35 lignes par facture (`SCAN_MAX_ITEMS`) : son PDF 652093 en imprime 37, deux lignes perdues d'office | Sv | au banc (k4 : plafond 80 dans le schéma du banc, lignes perdues comptées) | production : son accord |
| — | Exemples montrés à Gemini (few-shot) | — | non : un exemple pris dans ses pièces taille la consigne sur elles (L20) | — |
| — | Skills, plugins, connecteurs MCP pour la lecture de l'app | — | non : ce sont des outils pour Claude, pas pour la Cloud Function (rapport, ligne 129) ; la boucle, elle, devient le skill `banc-lecture` | — |
| — | Autre modèle Google | — | non pour l'instant : 3.5 Flash-Lite et 3.8 sont les plus récents (01.11) | à revoir à chaque nouveau modèle |

Données : 13 pièces (7 + 6 du 01.11). Il n'en a pas plus pour l'instant ; 40 à 60 rendraient un écart de 5 points visible.
