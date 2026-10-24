OK — six variantes de la passe 4 sur a1 (2 froides, 4 tièdes), tous critères verts

## Fichiers écrits
- Pages : `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/passe4/p4a1/` à `p4a6/` (`etat.html`, `NOTE.md`, `geste.json`)
- Générateur commun : `passe4/p4a-outil/` (`socle.mjs` repris du socle d'a1 passe 3, `generer.mjs [ids] --captures [--fiche]`, `concepts/p4aN.mjs`)
- Captures (390 × 844) : `passe4/captures/p4aN-premier-ecran.png`, `-pendant.png`, `-apres.png` (N = 1 à 6), plus `p4a1-fiche.png`
- Scripts de travail : dans le dossier temporaire de la session, rien à la racine (`git status` : seuls `passe4/p4a*` sont à moi)

## Une ligne par variante
| id | chaleur | améliorations | greffes | ce qui tient | ce qui casse |
|---|---|---|---|---|---|
| p4a1 | froide | 4 inconnu, 5 jours au rail, 6 lecture (fil vers le pouce, pictos d'étape) | aucune (froide) | tout a1 | le fil double la case cerclée ; 2 j → 7 j demande un glisser fin |
| p4a2 | froide | 1 interpolé dessiné, 2 picto au bout du contour, 3 colline de levure, 4 | f5, g6 (levure) | a1 tel quel, ses boutons de jours compris | trois signes de plus ; la flamme reste petite à 12 px |
| p4a3 | tiède, le geste d'abord | 1, 5, 6, 4 | rail vertical (c3, a3), IBU dans la loupe (b4), trait orangé (e1) | barres l5b, amertume, « contre ★ », pont | rubans par famille perdus (seul le floral a sa colonne) ; loupe ×3,4 |
| p4a4 | tiède, la réponse d'abord | 2 emporté par étape, 6, 5, 4 | a4, a8, g4, b4, e3, e1 | a1 sous le doigt, la case de l'étape suit | rubans remplacés par deux mini-barres par étape |
| p4a5 | tiède, les vraies valeurs d'abord | 1 plage interpolée dite, 4, 2 | c7, c5, d1, d5, x3b, c2 | barres l5b, avant, style, loupe | les plages du moteur (0–63) font peur ; 52 mots ; la mesure d'après porte sur du Cascade, et c'est écrit |
| p4a6 | tiède, x3b réduit en fin de frise | 7 chaîne x3b, 3 levure, 4 | b2, c8, g1, g4, a2b | barres l5b, « contre ★ », la colonne Pomona suit le moment | Pomona en colonne peut se lire comme un second facteur (aperçu sans réglage) |

Toutes gardent ce qu'a1 a d'obligatoire : la baseline, le thème blanc de ses maquettes (D106), « ~ » et « ≈ », l'inconnu jamais à zéro, un seul facteur libre (le moment), le pont « Puis la levure ». Chaque variante a été comparée à `serie-a/passe3/captures/a1-premier-ecran.png` et `a1-toucher-390.png`. Les dix-huit captures ont été ouvertes. Le geste est joué au doigt, sans erreur, sans défilement horizontal : il va de ★ actif · 2 j à 20′. Loupe : ×5,6 pour cinq variantes, ×3,4 pour p4a3.

## Sortie décisive de chaque critère
- G1 : `PASSE-BIEN-6`
- G2 : `COMMUN OK` (après corrections : trait d'icône S4 uniformisé à 1,5 px, tons de famille S2 sur fond sombre, rayons S3, contraste des flèches)
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)`
- G4 : `MOTS OK` (29, 29, 35, 36, 52, 45 mots hors données)
- G5 : `NOTE OK` (rejoué après écriture)
- En plus : `controle-panel` sur les six premiers écrans → `PANEL OK` (médiane 0,67, ressemblance 0,88, 0/15 paires presque identiques)

## Prédiction
« p4a4 et p4a1, on est bon. La réponse en tête et les quatre étapes chiffrées, c'est ce que je voulais voir. Mais p4a5 montre enfin les intervalles, et ils sont énormes. »

DÉCISION À PRENDRE : faut-il montrer au premier plan les plages du moteur (floral 0,1–63, herbacé 0–123, p4a5) ? C'est honnête et il l'a demandé (« il faut des intervalles de confiance »), mais elles écrasent la lecture du gain. À lui montrer en variante ; ne rien trancher contre son choix.

CONNAISSANCE : le moteur ne simule l'arôme qu'à 60′, 10′, au whirlpool et à froid (`prototypes/houblons-v4/parcours/src/moteur/index.ts`, l. 107). Entre deux de ces moments, l'arôme ne peut donc pas être calculé à chaque cran. Seule l'interpolation dessinée est honnête, et l'amélioration 1 du brief ne peut prendre que cette forme. Dans la bière de la grille (`profils-simules.json`, `biere.avant`), Noyau, Baies, Pépins et Melon sont « inconnu » : l'écart y est inconnu, pas nul.

LEÇON PROPOSÉE : avant d'écrire une page, lire le contrôle STANDARD S4. Il mesure le trait affiché (attribut × taille), sans tenir compte de `vector-effect`. Un picto réutilisé à plusieurs tailles doit donc porter un trait calé sur la plus grande, faute de quoi il casse le standard des icônes de toute la passe.
