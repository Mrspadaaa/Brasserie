OK — r2b : six points numérotés au premier écran, réglés sur leur ligne, preuve chiffrée, pied jamais bloqué

## Fichiers écrits (v1/r2b/ seulement)

| Fichier | Contenu |
|---|---|
| `etat.html` | Classes `r2b-`, code dans une IIFE. `?etat=1…9`, plus `4b` et `7b`. |
| `NOTE.md` | Ce qui change, avec les greffes z1, u2, r1, u4, r3, u1, z3, u3, r4 et r2. |
| `capturer.mjs` | Fait les captures. |
| `verifier-retouches.mjs` | Contrôle les trois retouches et le pied. |
| 35 captures `r2b-*.png` | Toutes ouvertes. |

## Sorties décisives (01.11, depuis la racine)

| Contrôle | Sortie |
|---|---|
| `controle-commun … v1 r2b --page=etat.html --profil=sans-houblons` | COMMUN OK |
| `mots-premier-ecran … --max=100` | r2b 98 mots, MOTS OK. Il en comptait 105 avant la correction : l'échec a été vu, puis réglé. |
| `controle-contraste …` | CONTRASTE OK, pire « TVA » 5,24:1 |
| `verifier-page etat.html --min-images 0` | PAGE OK, 390 px, sans erreur |
| `verifier-retouches.mjs` | RETOUCHES OK 6/6 (détail ci-dessous) |

Détail des 6 contrôles de `verifier-retouches.mjs` :
- R1 : les 6 points sont au-dessus du pied (pastilles à 199, 235 et 269 px ; pied à 792 px).
- R1 bis : chaque chip saute à sa ligne et se barre une fois réglée.
- R2 : les six points se règlent avec 0 plateau ouvert, et le total reste 86,50.
- R3 : la preuve s'ouvre d'un toucher (86,50 · 23/23 · 2/2 · page 2 coupée).
- R3 à 1280 : la colonne gauche va jusqu'au pied, sans trou.
- Pied : il reste actif avec les points ouverts. Le reçu donne « 2026-04-27 Brau- und Rauchshop 372765.jpg », « Ouvrir dans Drive » et « À revoir : … ».

Le contrôle `controle-panel` lancé sur les états donne DIVERSITÉ ECHEC. C'est attendu : ce sont les états d'un seul écran, pas une série v0.

## Captures

Dossier : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/v1/r2b/`
- `r2b-etat{1,2,3,4,4b,5,6,7,7b,8,9}-390.png` et `-1280.png`
- `r2b-repos.png`, `r2b-1280.png`, `r2b-page.png`
- les gestes : `r2b-preuve`, `r2b-tva-ouverte`, `r2b-paye-ouvert`, `r2b-chip-target`, `r2b-chip-mouture`, `r2b-moutures-rattachees`, `r2b-sabro-unite`, `r2b-ligne-ouverte`, `r2b-enregistre-points-laisses`

## Prédiction

« Là je vois d'un coup ce qui cloche et je le règle sur la ligne ; par contre, Sabro et Hallertauer sont encore sous le pli. »

## Écart à la synthèse

Le compte des liens du critique, « 14 reliés … 1 ? », donne 24 lignes. Le bon compte est 13 reliés · 2 nouveaux · 2 bis · 1 unité ? · 5 moutures, soit 23. C'est ce qui est affiché.

DÉCISION À PRENDRE : aucune

CONNAISSANCE : aucune

LEÇON PROPOSÉE : `scratchpad/sonde.mjs` est un chemin de session partagé. Il a été réécrit par un autre agent (il dépend maintenant de `WITH_SERVER_PORTS`). Une sonde de voie doit vivre dans son OWNS (ici `verifier-retouches.mjs`), comme le veut L17.
