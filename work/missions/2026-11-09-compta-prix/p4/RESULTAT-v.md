OK — Opérations passe 4 : v6a (−12 %) et v6b (−28 %), v5a aux lignes serrées

## Fichiers écrits (sous `work/missions/2026-11-09-compta-prix/p4/`)
Ses mots : « v5a … Beaucoup mieux mais plus compact les lignes, mais quasiment parfait ». Les deux partent du fichier de v5a
(préfixe renommé), seules les règles de hauteur des lignes changent.
- `v6a/` : deux étages gardés, geste sous le montant ; opération 44 px (47 avec geste) contre 50 à 56 dans v5a ; en-tête 32 → 28 ;
  liste 559 → 493 px.
- `v6b/` : étages 15 + 14 px, geste déplacé à gauche du montant, centré sur les deux étages ; toutes les opérations font 36 px ;
  en-tête 24 ; liste 559 → 401 px. C'est le seul déplacement.
- Chaque dossier : `etat.html`, `NOTE.md` (tableau des hauteurs mesurées), `<id>-haut.png`, `<id>-page.png`, `<id>-etat.png`
  (après « ✓ Payé » sur le loyer), `<id>-1280.png`. Script de mesure et de capture hors dépôt (scratchpad, `cap-v6.mjs`).
  Rien dans `src/`, aucun commit. Les `src/ui/...` non suivis de `git status` ne viennent pas de cette voie.

## Sorties décisives
- `verifier-page.mjs --min-images 0 --captures` : PAGE OK × 2 (390 px, sans erreur) ; débord à 1280 : 0 × 2.
- `mots-premier-ecran.mjs --profil=sans-houblons --sans-donnees --sans-lignes --max=60` : v6a 24, v6b 24 → MOTS OK.
- `controle-commun.mjs --profil=sans-houblons --sans=mots` : v6b OK partout. v6a : contraste ECHEC 1 (« à payer depuis le 20 déc »
  à 1,56:1 « sur le fond peint »). C'est un artefact : la ligne tombe au pli de 844 px, sous la barre fixe (liseré bleu de
  « Finances »). Avec la même page et une barre statique (copie dans le scratchpad), le résultat est CONTRASTE OK, pire 5,36:1.
  Le même texte passe dans v6b. Premier passage de standard en S4 (icônes de pièce de 14 px à 1,4 px de trait) : corrigé en trait 2,6.
- Mesures (puppeteer, 390 px) : aucun texte qui déborde, aucun bouton sous 24 px. Le geste de v6a ne touche plus le montant
  (écart +1 px ; il chevauchait « 400,00 » au premier essai).
- `controle-panel.mjs` (les 2 hauts) : ressemblance 0,95 → PANEL ECHEC. C'est attendu, puisque le brief demande deux fois v5a
  « telle quelle ».

## Captures (ouvertes : v6a et v6b en `-haut`, `-etat`, `-1280`)
`p4/v6a/v6a-haut.png`, `p4/v6a/v6a-etat.png`, `p4/v6a/v6a-1280.png`, `p4/v6b/v6b-haut.png`, `p4/v6b/v6b-etat.png`,
`p4/v6b/v6b-1280.png` (+ `-page.png`).

## Prédiction
Il prendra v6b : « là c'est compact, je vois tout le mois d'un coup ». v6a lui paraîtra presque identique à v5a.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : `controle-contraste.mjs` (fond peint, profil sans-houblons) mesure sur une capture pleine page où la barre de
navigation fixe reste peinte au pli du premier écran. Un texte coloré qui tombe à 780–844 px y échoue à tort. On le vérifie en
rendant la barre statique dans une copie.

LEÇON PROPOSÉE : aucune
