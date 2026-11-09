OK — passe 2b : s1b (Comparer) et s3b (Suggérer + cible de s4) retouchés, s4b corrigé, captures ouvertes

## Passe 2b (après critique/p2/SYNTHESE.md, 09.11) — dossiers `p2/s1b`, `p2/s3b`, `p2/s4b`, les v0 intactes
- s1b OK — cadre 3 sans bulle : résultat hachuré tireté dans la cellule Floculation US-05 et rangée dépliée « à confirmer · fiche Fermentis · 2026 · Corriger · Garder » ; étiquettes d'axe 12 px ; « = 1056 » / « = US-05 ». 70 mots hors données.
- s3b OK — barres graduées une fois en tête de liste (10 · 20 · 30 °C ; 70 · 80 · 90 %), 8 px ; Nottingham « thiols forts (Samia 2026) » ; liste encadrée des couleurs des bascules actives ; **cadre 4 neuf** : Abbaye (POF +) → « atténuation − · épicé − », cible de s4 en petit, « Dans la cible · 0 sur 6 », « À côté · 4 d'Europe · 2 rares » avec écarts dessinés. 101 mots hors données.
- s4b OK — M47 dans le couloir « ? non déclarés », comptes justes (0 sur 6 ; 4 d'Europe · 2 rares ; 4 d'Europe et Abbaye sans biotransformation). 98 mots hors données.
- Contrôles : PAGE OK ×3 ; PANEL (s1b, s2, s3b, s4b) remplissage médian 0,69, 0 sous 0,50, ressemblance 0,93 (chrome imposé, inchangé) ; chaque valeur relue contre `savoir/TROUS-COMBLES.md` (M47 absente de l'inventaire : fiche catalogue seule, donc « non déclarés »). Captures ouvertes : `s1b-cadres.png` (cadre 3 sans chevauchement), `s3b-cadres.png` (cadre 4), `s4b-cadres.png`.
- Fichiers : `p2/s1b/{etat.html,NOTE.md,s1b-haut.png,s1b-cadres.png,s1b-page.png}`, idem `s3b`, `s4b`. Tours de la reprise : 6 sur 20.

## Passe 2 (v0 de la voie) — lignes par maquette
- s1 OK — Comparer en colonnes cmc2k : 1056 (recette US) en référence teintée, US-05 et Verdant achetables en CH ; bandes sur axe commun, arômes et biotransformation, inconnu gris + « chercher » ; 4 cadres.
- s2 OK — Comparer sur les jauges de r3 éclaircies : la seconde levure en contour rouge sur densimètre, thermomètre, éprouvette ; 3 cadres.
- s3 OK — Suggérer en langue q2b : quatre bascules de direction, groupes CH·FR·DE → Europe → rare, barres l5b (°C avec visée 19, atténuation avec référence) ; 3 cadres.
- s4 OK — Suggérer libre : la cible (atténuation graduée × couloirs de phénols), poignée du graphe de conduite tirée depuis Abbaye, liste reclassée avec écarts dessinés ; 3 cadres.

## Fichiers écrits (tout sous `work/missions/2026-11-09-ecran-levure/p2/`)
- `s1/etat.html`, `s1/NOTE.md`, `s1/s1-haut.png`, `s1/s1-cadres.png` (+ `s1-page.png` identique, `mesures-panel.json` : à supprimer, rm refusé par la garde du shell) ; idem `s2/`, `s3/`, `s4/` (`<id>-page.png` = `<id>-cadres.png`).
- `s-voie/RESULTAT.md` (ce fichier). Rien hors `p2/s*`.

## Sorties des contrôles
- `verifier-page.mjs … --min-images 0` : PAGE OK ×4 (sans `--min-images 0` : « 0 images (1 au moins) », les maquettes n'ont pas d'image).
- `controle-panel.mjs` sur les 4 `-haut.png` : remplissage médian 0,64, 0 sous 0,50 (s1 0,83 · s2 0,64 · s3 0,60 · s4 0,55) ; paires presque identiques 0/6 ; **ressemblance moyenne 0,93 ≥ 0,90 → PANEL ECHEC** sur la seule diversité : les 150 px de chrome obligatoire (en-tête, fil, bandeau, onglets) sont communs aux quatre par le BRIEF ; les corps diffèrent (colonnes, instruments, liste, cible).
- `mots-premier-ecran.mjs --profil=sans-houblons --sans-donnees --sans-coquille` : s1 70 · s2 78 · s3 104 · s4 96 (en défaut : 126 · 123 · 154 · 136 ; cmc2k 92–102 et q2b 105–111 en défaut). Aucune phrase d'aide : les mots sont des descripteurs de fiche, des disponibilités et des étiquettes d'axe.
- `controle-choix.mjs --registre` : REGISTRE OK (8 écrans) ; `levure` est **ouvert** au registre, aucune maquette choisie à confronter (D105 ne s'applique pas) ; cmc2k et q2b sont repris comme langue (inventaire dans chaque NOTE).
- grep `low|medium|high|null|undefined|NaN` : 0 dans les quatre pages (D97).
- Honnêteté : chaque valeur vient de `yeastCatalogueBootstrap.json`, `yeastSupplyBootstrap.json` ou `savoir/TROUS-COMBLES.md` ; FG et alcool calculés (OG 1,066 × atténuation, ×131,25) ; une seule valeur fictive, marquée : le résultat de recherche IA du cadre 3 de s1.

## Captures ouvertes (L12)
`p2/s1/s1-haut.png`, `p2/s2/s2-haut.png`, `p2/s3/s3-haut.png`, `p2/s4/s4-haut.png` (dernier état), `p2/s2/s2-cadres.png`, `p2/s3/s3-cadres.png`, `p2/s4/s4-cadres.png` (avant les dernières retouches de poignée et de doigt ; s1-cadres rejoué après la teinte). Corrigé après lecture : débordement des pastilles Verdant (s1), « rare en Europe » sur deux lignes, alcools superposés et bulbe sous « 19 » (s2), poignée sur l'étiquette Abbaye, « 95 » coupé, bas vide (s4), doigt hors pastille (s3).

## Prédiction du brasseur
« s1 c'est Comparer houblons avec des levures, on est bon ; s4 avec la cible qu'on tire, vachement bien ; mais pourquoi la moitié des trucs sont “non documentés” ??? » — la réponse est dans les fiches : c'est l'état réel, et chaque gris se touche pour chercher.

## DÉCISION À PRENDRE
1. Le plafond de 72 mots du BRIEF vaut-il pour les vues Comparer et Suggérer (listes) comme pour l'étape ? Ses choix houblons (cmc2k, q2b) tournent à 92–111 ; s3 et s4 sont au-dessus même sans données.
2. s4 : l'exemple du brasseur est une triple avec Abbaye ; la fixture commune 1,066 · 45 IBU est gardée (BRIEF), le style n'est pas écrit. Garder la fixture, ou une fixture « triple » pour ce seul cadre ?
3. PANEL ECHEC sur la ressemblance (0,93) à cause du chrome commun imposé : à accepter pour une passe 2 de vues, ou mesurer sous le bandeau.

## CONNAISSANCE
- Biotransformation documentée par clé catalogue : 0 des levures vendues en CH/FR/DE ; Lallemand la déclare en prose (Verdant β-lyase, Nottingham modérée, Pomona annoncée) ; Escarpment et Omega seules la classent. Une vue « impact sur le houblon » honnête montre surtout « non documentée » : c'est un trou de données, pas d'écran.
- `controle-panel.mjs` ne compte comme fond que la couleur quantifiée la plus fréquente (248) et un pixel diffère à partir de 60 : une teinte de colonne plus claire que #CFDFF6 ne compte pas comme contenu.

## LEÇON PROPOSÉE
Un critère de mots ou de ressemblance écrit pour une étape se rejoue sur les écrans choisis du même genre (cmc2k, q2b) avant d'entrer dans le brief d'une vue : le 09.11, 72 mots et 0,90 de ressemblance échouent mécaniquement sur une liste et sur quatre vues au chrome imposé.
