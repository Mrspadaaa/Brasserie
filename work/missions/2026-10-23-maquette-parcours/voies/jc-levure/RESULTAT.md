OK — trois mini maquettes du levier levure dans Suggérer (lva, lvb, lvc), G1 et G2 verts

## Fichiers écrits (tous dans `work/refonte-frontend/v4/ecran-1/fils24-levure-suggerer/`)
- `lva/etat.html`, `lvb/etat.html`, `lvc/etat.html` : chacune est une copie de Suggérer rendu par r4, avec le même
  bundle copié dans `assets/` ; la variante est injectée par un script en fonction immédiate, avec des classes
  préfixées `lva-`, `lvb-`, `lvc-` (L26). `<id>/levure.html` : copie de l'étape Levure rendue, cible du pont.
- `<id>/NOTE.md` : la chaleur, ce qui tient, ce qui casse, les contrôles.
- `donnees/levures-moteur.json`, écrit par `outils/levures-moteur.ts` : le moteur en direct, `proposeVoies` avec
  `leviersLevure`, sur le cas de Suggérer. Verdant : agrumes ~+1,3 cran ; Pomona : ~+2,8, hors style ; noyau ~+4,4 et
  ~+4,3, hors style ; floral et résineux à null, donc non établis et jamais 0 ; IBU 59,7 inchangé. Ce sont les mêmes
  nombres que q2b (c1.json).
- `outils/capturer.mjs` (captures), `base/etat.html` : la page r4 copiée telle quelle, comme témoin.

## Les trois
- **lva, froide** : le groupe de q2b tel quel, sous Dry hop, sur l'axe. Les cases, les barres l5b et le « + » restent
  ; s'y ajoutent un trait en tirets et la puce « autre levier ». Au toucher, une bulle : « Toute la bière change de
  souche », puis « Étape Levure › ».
- **lvb, tiède** : sous la liste, un pont « Et avec une autre levure ? › », avec une ligne chiffrée : « Pomona ·
  agrumes ~+2,8 hors style · floral, résineux » suivis d'une hachure. Au toucher, une feuille montre les deux souches
  avec les cases de la page, puis « Ouvrir l'étape Levure › ».
- **lvc, chaude** : la levure passe dans le contexte. Une puce « US-05 » s'ajoute dans les réglages. Au toucher, un
  tiroir s'ouvre sous les trois cartes d'objectif, en colonnes alignées sur elles : ce que chaque souche ferait seule.
  On y voit résineux et floral à « ? », agrumes en piste chiffrée, et le noyau hors style.

## Critères
- G1 : `JEU-BIEN`.
- G2 : `COMMUN OK` (mots sauté, --sans ; couleurs, au-style, survol, blocs, contraste, fiche, standard, trait,
  legende, parlant, brutes OK). Premier essai : STANDARD ECHEC, S4, car l'icône levure du socle était à 1,6 px et 2,1
  px une fois réduite. Elle est redessinée à 1,2 px, comme les autres icônes.
- `controle-choix.mjs <copie dans os.tmpdir()>/ --ecran=suggerer`, chaque page posée en `suggerer/etat.html`
  avec la NOTE r4 : `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` pour lva, lvb, lvc (et la base r4).
  Sans la NOTE r4 à côté, même la base r4 échoue (0 repris) : l'inventaire se lit dans la NOTE.

## Captures (390 × 844, toutes ouvertes)
`captures/lva-repos.png`, `captures/lva-toucher.png`, `captures/lvb-repos.png`, `captures/lvb-toucher.png`,
`captures/lvc-repos.png`, `captures/lvc-toucher.png` (même dossier). Pour comparer, j'ai regardé à côté la capture de
q2b : `choix/etats/captures/etat-sugg-levure-choisie.png`.

## Prédiction
Il reconnaîtra q2b dans lva (« c'est mon groupe ») et prendra sans doute lvc, qui ne charge pas la liste. Il dira
peut-être que « US-05 » ne montre pas qu'on peut le toucher.

DÉCISION À PRENDRE : dans lva, le « + » de q2b met une levure dans Comparer, un outil qui compare des houblons. C'est
gardé tel quel, parce que c'est sa maquette ; s'il choisit lva, il faut le garder ou le remplacer par « › Étape
Levure ». Autre point pour lvb : l'étape Levure rendue est celle de Dryhopper, avec Idaho 7 fixé. Un pont depuis
Suggérer exige que l'étape accepte une bière sans ajout de dry hop. C'est pourquoi lvb passe par un aperçu.

CONNAISSANCE : le moteur du parcours expose `effetLevure` et `lireBiere`, mais ils ne modélisent pas l'arôme propre de
la souche : l'écart reste nul pour toutes les levures. L'effet d'un changement de souche se lit seulement par
`proposeVoies(…, { leviersLevure: true })`, avec les voies de type « levure » qui ont `yeastChange` (vite-node, voir
`outils/levures-moteur.ts`). Autre point : dans la page r4, les traits « hors style » des cases (`.pq-suggerer-trait-hors`)
s'affichent noirs, parce qu'une règle `.pq-suggerer-trait` placée plus loin les écrase. C'est un défaut de r4, visible
sur Motueka (dry hop).

LEÇON PROPOSÉE : aucune
