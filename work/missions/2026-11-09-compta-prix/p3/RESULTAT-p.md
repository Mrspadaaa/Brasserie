OK — voie p passe 3 : p4a–p4d, brassin futur et frigo 3 000 dessinés, avant / après, statiques ; MOTS OK, COMMUN OK

## Fichiers écrits (tous dans `work/missions/2026-11-09-compta-prix/p3/`)
- `p4a/`, `p4b/`, `p4c/`, `p4d/` : `etat.html` (classes préfixées, sans script), `NOTE.md`, `<id>-haut.png` (premier écran), `<id>-page.png` (premier écran + état avant / après), `<id>-1280.png`.
- `p4a/capturer-1280.mjs` (captures 1280 des quatre ; même script que p2, chemins p3).
- `p3/RESULTAT-p.md`. Rien d'autre : les `src/`, `tests/`, `PLAN-METIER.md` et `voies/` modifiés dans le worktree ne sont pas de cette voie.

## Chiffres communs (fixture + brief, repris dans les quatre)
Brassin Pale Ale planifié le 20 nov. : 64,26 = 57,42 d'achats avant le 20.11 (ingrédients 22,42 · énergie 8,00 · nettoyage 3,00 · bouteilles 24,00) + 6,84 d'impôt bière au conditionnement (~18.12 ; 27 L × 25,32/hl). Fin janvier sans frigo : 2 107,34 (inchangé par rapport à p1b). Frigo 3 000 (exemple) : − 892,66 fin janvier, sous zéro le 25.01, quel que soit le mois d'achat (aucune entrée prévue) ; au mois d'achat (nov.) 664,18 ; usure 600/an (5 ans), 50/mois ; litre 7,51 → 8,01 ; 600 bouteilles 33 cl à 5,00 pour le payer (≈ 7 brassins ½ de 27 L) ; 179 bouteilles pour rester à zéro (98 de plus que les 81 de la Pale Ale).

## Les quatre
- **p4a** (froide) — p1b telle qu'il l'a aimée, le frigo à la place du fermenteur : cartes « Sans frigo 2 107,34 / Avec frigo − 892,66 », l'escalier aux deux chemins, la liste numérotée en 7 marches (brassin brun, frigo bleu-vert) et deux cartes de projet qui disent d'où vient chaque montant (recette · stock · facture ; usure 600 · litre 8,01). Annexe : avant, case « + frigo ? », carte du brassin « se met à jour seul ».
- **p4b** (tiède) — le projet Frigo ouvert en six jauges (trésorerie en plage, quand, usure, litre, vendre, aussi dans), verdict « Pas avant 179 bouteilles vendues » ; facteur libre : la durée d'usure. Annexe : Prévisions **sans graphe** (deux réponses, deux projets, sorties datées, entrées « aucune »).
- **p4c** (tiède) — trois mois en colonnes (s5a), puces datées à bord coloré, solde de fin de mois en vert, niveau au pied ; le frigo sur un plateau, chaque colonne lui offre une case « + frigo ? » qui dit déjà la fin du mois (664,18 · 257,34 · − 892,66). Annexe : posé en nov., janvier en rouge, « il manque 179 bouteilles ».
- **p4d** (chaude) — le frigo en bouteilles : 600 capsules (81 brunes Pale Ale, 98 cerclées de rouge pour rester à zéro, 421 restantes), 7 cuves ½, avant → après sur deux rangées (fin janvier, mon litre), « un brassin par mois : payé juin 2027, exemple ». Annexe : la fiche du brassin planifié (onglet Argent) qui a créé sa prévision, chaque montant avec sa source, « à compléter » pour l'inconnu, « 81 des 600 du frigo ».

## Sorties décisives
- `verifier-page.mjs <etat.html> --captures p3/<id>/<id> --min-images 0` : **PAGE OK** × 4.
- `p3/p4a/capturer-1280.mjs` : **CAPTURES 1280 OK** (débord 0, erreurs 0, × 4).
- `mots-premier-ecran.mjs p3 p4a p4b p4c p4d --page=etat.html --profil=sans-houblons --sans-donnees --max=60` : **MOTS OK** — p4a 57 · p4b 59 · p4c 55 · p4d 58. Dates en 20.11 (comptées données), « · », « → », « › », « ? » en CSS.
- `controle-commun.mjs p3 p4a p4b p4c p4d --page=etat.html --profil=sans-houblons --sans=mots` : **COMMUN OK** (couleurs, survol, blocs, contraste, standard, parlant, brutes). Corrigés en route : bleu-vert frigo assombri (#176878, 5,7:1 sur sa teinte), étiquettes SVG en noir avec halo, rayons à l'échelle 10 / 16 / 24 / rond / pilule, aucun texte sous 12 px, troisième teinte de p4c (vert des soldes ; le brun du brassin est lu « alerte » par le contrôle).
- `controle-panel.mjs` (4 `-haut.png`) : **PANEL en écart** — remplissage médian 0,67, 1 capture sous 0,50 (le contrôle ne la nomme pas ; p4c ou p4d par leurs blancs : cases hachurées, capsules blanches), ressemblance 0,89, 0 paire ≥ 0,95. Non exigé par le brief de passe 3 ; signalé.
- Transversales : 7,51 CHF/L tout compris et 8,01 après le frigo partout ; 5,00 marqué exemple ; payé ≠ à payer ≠ prévu nommés ; 27 L nets ; hors fixture = exemple (frigo, répartition des ingrédients de p4d, « juin 2027 ») ; glossaire (« il te reste », « usure », « à payer ») ; aucune rangée de fournisseurs ; couleurs nommées.
- Statique : aucun script (les 600 capsules de p4d écrites en dur) ; chaque état est dessiné dans un second cadre.
- Non fait : thème cave ; B5 et B9 non mesurés ; skills `impeccable` et `ui-design-system` non chargés (budget).

## Captures (ouvertes, L12)
`p3/p4a/p4a-page.png` et `p4a-haut.png`, `p3/p4b/p4b-page.png`, `p3/p4c/p4c-page.png` et `p4c-haut.png`, `p3/p4d/p4d-page.png`. Les `-1280.png` et les dernières `-haut.png` de p4b et p4d après retouches de deux mots et d'espacement n'ont pas été rouvertes.

## Prédiction
Il gardera p4a comme écran Prévisions (« c'est p1b avec mes deux cas ») et p4b comme fiche du projet (« là je vois comment c'est mesuré »), s'arrêtera sur les 600 bouteilles de p4d (« ça, ça me parle ») et demandera de les greffer dans p4b ; p4c : « intéressant, mais je préfère l'escalier ».

DÉCISION À PRENDRE : où vit la fiche d'un projet de matériel (depuis Prévisions comme p4b, ou dans un onglet « Projets » à côté de Prévisions) ; et si la vente des 27 L doit être proposée d'office comme entrée prévue (aucune des quatre ne la compte, par honnêteté : il ne l'a pas dit).
CONNAISSANCE : sur la fixture, aucun mois d'achat ne rend le frigo tenable sans vente (− 892,66 fin janvier dans tous les cas) ; la réponse utile à « quand ? » est un nombre de bouteilles (179), pas un mois. Les frais 41,84 du brief se décomposent en 8,00 + 3,00 + 24,00 + 6,84 (c3a), donc l'impôt bière 6,84 est déjà dans les 64,26 : séparer « avant le brassage » (57,42) et « au conditionnement » (6,84) ne change pas le total.
LEÇON PROPOSÉE : `controle-couleurs.mjs` sans `--acc` prend toute teinte entre 10° et 30° pour l'orangé d'alerte ; le brun « brassin » (24°) est donc ignoré et une page à trois vraies teintes échoue. Déclarer `--acc` dans `:root` des maquettes finances, ou lire la teinte d'alerte de DESIGN.md (#D6453D, 3°) par défaut.
