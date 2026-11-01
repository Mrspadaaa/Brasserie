OK — u4b : pont en rangées avec montants, 6 points, 9 états ; COMMUN OK

Passe 2 de u4, fusionnée avec z4 (voie e-p2, mission 2026-10-31-ecran-depense). Elle reprend les 3 retouches du critique, les greffes
qui visent u4 et les retouches communes. Le détail est dans `NOTE.md`.

## Fichiers écrits (rien hors de `v1/u4b/`)
- `etat.html` : la page jouable à 390 et à 1280 px, préfixée `u4b-`. Les 9 états sont sur le vrai écran (`?etat=1` … `9`, plus `4t` et
  `7r`).
- `NOTE.md` : ce qui a changé, les greffes avec leur id d'origine, les boosters, les contrôles.
- `capturer.mjs` : `node work/missions/2026-10-31-ecran-depense/v1/u4b/capturer.mjs [--etats] [--gestes]`, qui sort CAPTURES OK ou
  CAPTURES ECHEC.
- `sortie-commun.txt` ; les captures (liste ci-dessous).

## Sorties décisives
| Contrôle | Sortie |
|---|---|
| `controle-commun.mjs v1 u4b --page=etat.html --profil=sans-houblons` | mots, couleurs, survol, blocs, contraste, standard, parlant, brutes OK → **COMMUN OK** |
| `mots-premier-ecran --profil=sans-houblons --max=98` | u4b 92 mots, **MOTS OK** |
| `controle-contraste` | 111 textes mesurés, pire 5,07:1, **CONTRASTE OK** |
| `verifier-page --captures v1/u4b/u4b` | **PAGE OK** (1 image, 390 px, sans erreur) |
| `capturer.mjs` | **CAPTURES OK** |
| `grep type="number"` | 0 |

`controle-panel` ne figure pas dans la liste demandée. Il donne 0,47 sur `u4b-haut.png`. Ce chiffre vient d'un angle mort de la mesure :
le fond le plus fréquent y est le gris, et les rangées blanches s'en écartent de moins que son seuil. Le critique avait noté le même
angle mort sur z4 (voir NOTE).

## Captures ouvertes et regardées (`v1/u4b/`)
- États à 390 et à 1280 : `u4b-e1`, `e2`, `e3`, `e4`, `e4t`, `e5`, `e6`, `e7`, `e7r`, `e8`, `e9`, en `-390.png` et `-1280.png`.
- Gestes à 390 : `u4b-g-tva-ouverte`, `tva-reglee`, `saut-paye`, `paye-reglee`, `saut-mouture`, `mouture-reglee`, `target-ouvert`,
  `target-regle`, `malts-ouverts`, `preuve`, `enregistre`.
- `u4b-haut.png`, `u4b-page.png`.

## Prédiction
« Là je vois mes prix et où va chaque ligne, Target bis à côté du mien : ça c'est bon ; Hallertauer coupé, à corriger. »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE :
- `controle-panel` sous-estime les écrans à fond gris où les rangées sont blanches : l'écart (30) est sous son seuil de 60. Il
  vaut mieux le juger à l'œil, ou lui donner un fond de référence.
- La vraie taille du justificatif est de 735 721 octets (`stat`, sans ouvrir le contenu) : c'est la source honnête du « 0,7 Mo » de
  l'envoi.

LEÇON PROPOSÉE : aucune.
